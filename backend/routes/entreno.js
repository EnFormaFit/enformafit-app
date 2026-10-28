'use strict';

const router = require('express').Router();
const db     = require('../db');
const { cliente, entrenador } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer  = require('multer');
const sharp   = require('sharp');
const _multerMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

// Configurar Cloudinary (credenciales desde variables de entorno Railway)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('[cloudinary] config → cloud_name:', process.env.CLOUDINARY_CLOUD_NAME, '| api_key:', process.env.CLOUDINARY_API_KEY, '| secret_set:', !!process.env.CLOUDINARY_API_SECRET);

// ── CLIENTE: plan completo (rutina + macros + semana) ────────────────────────
router.get('/mi-plan', cliente, async (req, res) => {
  try {
    const clienteId = req.user.id;

    // Bloque activo + rutina (visible_cliente puede ser false por bug — lo activamos automáticamente)
    const { rows: [bloque] } = await db.query(
      `SELECT b.*, r.ejercicios, r.nombre as rutina_nombre,
              c.kcal_asignadas, c.objetivo, c.dias_entreno, c.comidas,
              c.fecha_inicio as cliente_fecha_inicio, c.semanas_bloque,
              c.peso_inicial, c.altura
       FROM bloques b
       JOIN rutinas r ON r.cod = b.rutina_cod
       JOIN clientes c ON c.id = b.cliente_id
       WHERE b.cliente_id=$1 AND b.estado='activo'
       ORDER BY b.created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque) return res.status(404).json({ error: 'No hay plan activo' });
    // Auto-publicar si por algún motivo quedó en borrador
    if (!bloque.visible_cliente) {
      await db.query(
        `UPDATE bloques SET visible_cliente=true, aprobado_por='auto', aprobado_at=NOW() WHERE id=$1`,
        [bloque.id]
      );
    }

    // Calcular semana actual a partir de fecha_inicio del bloque
    let semana_actual = 1;
    if (bloque.fecha_inicio) {
      const inicio = new Date(bloque.fecha_inicio);
      const hoy = new Date();
      inicio.setHours(0,0,0,0);
      hoy.setHours(0,0,0,0);
      const diffDias = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
      semana_actual = Math.max(1, Math.floor(diffDias / 7) + 1);
    }

    // Plan de nutrición activo
    const { rows: [planNut] } = await db.query(
      `SELECT kcal_total, proteina_g, carbos_g, grasas_g, distribucion, comidas as plan_comidas
       FROM planes_nutricion
       WHERE bloque_id=$1 AND activo=true
       ORDER BY created_at DESC LIMIT 1`,
      [bloque.id]
    );

    // Pesos recientes
    const { rows: pesos } = await db.query(
      `SELECT fecha, peso FROM peso_diario
       WHERE cliente_id=$1
       ORDER BY fecha DESC LIMIT 90`,
      [clienteId]
    );

    // S0 desde revisiones (fuente de verdad)
    const { rows: [revS0] } = await db.query(
      `SELECT medidas, fotos_urls FROM revisiones
       WHERE bloque_id=$1 AND semana=0 LIMIT 1`,
      [bloque.id]
    );

    res.json({
      // Bloque
      bloque_id: bloque.id,
      fecha_inicio: bloque.fecha_inicio,
      semanas_bloque: bloque.semanas || bloque.semanas_bloque || 13,
      semana_actual,
      rutina_cod: bloque.rutina_cod,
      rutina_base: bloque.ejercicios,
      rutina_dias: bloque.ejercicios,
      rutina_semanas: {},
      dias_entreno: bloque.dias_entreno || 3,
      // Macros
      macros: {
        kcal: planNut ? planNut.kcal_total : (bloque.kcal_asignadas || 0),
        p: planNut ? planNut.proteina_g : 0,
        c: planNut ? planNut.carbos_g : 0,
        g: planNut ? planNut.grasas_g : 0,
      },
      comidas: bloque.comidas || 3,
      // Objetivo
      fase: bloque.objetivo === 'def' ? 'deficit' : bloque.objetivo === 'sup' ? 'superavit' : 'mantenimiento',
      objetivo_kg: null,
      obj_sem_kg: null,
      pasos_obj: 8000,
      // Pesos
      pesos: pesos.map(p => ({ f: p.fecha ? p.fecha.toISOString().split('T')[0] : '', v: parseFloat(p.peso) })),
      // Extras vacíos que la app puede usar
      alimentos: {},
      medidas_s0: revS0 ? normalizarMedidas(revS0.medidas) : {},
      fotos_s0: {},  // fotos_urls todavía null; fotos en localStorage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: ver rutina del bloque activo ─────────────────────────────────────
router.get('/mi-rutina', cliente, async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { rows: [bloque] } = await db.query(
      `SELECT b.*, r.ejercicios, r.nombre as rutina_nombre
       FROM bloques b
       JOIN rutinas r ON r.cod = b.rutina_cod
       WHERE b.cliente_id=$1 AND b.visible_cliente=true AND b.estado='activo'
       ORDER BY b.created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque) return res.status(404).json({ error: 'No hay plan activo' });
    res.json({ ...bloque, rutina_base: bloque.ejercicios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: registrar serie ──────────────────────────────────────────────────
router.post('/registrar-serie', cliente, async (req, res) => {
  try {
    let { semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada } = req.body;
    const clienteId = req.user.id;

    // SIEMPRE resolver bloque_id desde servidor — nunca confiar en el del cliente
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque) return res.status(400).json({ error: 'Sin bloque activo' });
    const bloque_id = bloque.id;

    console.log(`[registrar-serie] cliente=${clienteId} bloque=${bloque_id} sem=${semana} dia=${dia} ej=${ejercicio} serie=${serie} kg=${kg} reps=${reps_reales} rir=${rir_real} done=${completada}`);

    // Update existing row first; if none exists, insert new one
    const { rows: upd } = await db.query(
      `UPDATE registro_entreno
       SET kg=$7, reps_reales=$8, rir_real=$9, completada=$10
       WHERE bloque_id=$1 AND cliente_id=$2 AND semana=$3 AND dia=$4 AND ejercicio=$5 AND serie=$6
       RETURNING *`,
      [bloque_id, clienteId, semana, dia, ejercicio, serie, kg ?? null, reps_reales ?? null, rir_real ?? null, completada === true]
    );
    let reg = upd[0];
    if (!reg) {
      console.log(`[registrar-serie] INSERT (no existía) cliente=${clienteId} bloque=${bloque_id} ej=${ejercicio} s${serie}`);
      const { rows: ins } = await db.query(
        `INSERT INTO registro_entreno
           (bloque_id, cliente_id, semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [bloque_id, clienteId, semana, dia, ejercicio, serie, kg ?? null, reps_reales ?? null, rir_real ?? null, completada === true]
      );
      reg = ins[0];
    } else {
      console.log(`[registrar-serie] UPDATE OK id=${reg.id}`);
    }
    res.json(reg);
  } catch (err) {
    console.error('[registrar-serie] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: ver registro de una semana ───────────────────────────────────────
router.get('/registro/:bloqueId/:semana', cliente, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM registro_entreno
       WHERE bloque_id=$1 AND cliente_id=$2 AND semana=$3
       ORDER BY dia, ejercicio, serie`,
      [req.params.bloqueId, req.user.id, req.params.semana]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: registrar peso diario ────────────────────────────────────────────
router.post('/peso', cliente, async (req, res) => {
  try {
    const { fecha, peso } = req.body;
    const { rows: [p] } = await db.query(
      `INSERT INTO peso_diario (cliente_id, fecha, peso)
       VALUES ($1,$2,$3)
       ON CONFLICT (cliente_id, fecha) DO UPDATE SET peso=$3
       RETURNING *`,
      [req.user.id, fecha, peso]
    );
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: historial de peso ────────────────────────────────────────────────
router.get('/peso', cliente, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let q = 'SELECT * FROM peso_diario WHERE cliente_id=$1';
    const params = [req.user.id];
    if (desde) { params.push(desde); q += ` AND fecha >= $${params.length}`; }
    if (hasta) { params.push(hasta); q += ` AND fecha <= $${params.length}`; }
    q += ' ORDER BY fecha DESC LIMIT 90';
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: alias /pesos (plural) ───────────────────────────────────────────
router.get('/pesos', cliente, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT fecha, peso FROM peso_diario WHERE cliente_id=$1 ORDER BY fecha DESC LIMIT 90`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: historial de entreno de una semana ───────────────────────────────
router.get('/mi-historial', cliente, async (req, res) => {
  try {
    const { semana, dia } = req.query;
    // Bloque activo
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!bloque) { console.log(`[mi-historial] cliente=${req.user.id} SIN bloque activo`); return res.json([]); }
    console.log(`[mi-historial] cliente=${req.user.id} bloque=${bloque.id} sem=${semana} dia=${dia}`);
    let q = `SELECT DISTINCT ON (semana, dia, ejercicio, serie)
       semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada
       FROM registro_entreno WHERE bloque_id=$1 AND cliente_id=$2`;
    const params = [bloque.id, req.user.id];
    if (semana) { params.push(semana); q += ` AND semana=$${params.length}`; }
    if (dia !== undefined) { params.push(String(dia)); q += ` AND dia=$${params.length}`; }
    // DISTINCT ON requiere que ORDER BY empiece por las mismas columnas, luego created_at DESC para obtener el más reciente
    q += ' ORDER BY semana, dia, ejercicio, serie, created_at DESC';
    const { rows } = await db.query(q, params);
    console.log(`[mi-historial] → ${rows.length} registros`);
    res.json(rows);
  } catch (err) {
    console.error('[mi-historial] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: todas sus revisiones ────────────────────────────────────────────
router.get('/revisiones/all', cliente, async (req, res) => {
  try {
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!bloque) return res.json([]);
    const { rows } = await db.query(
      `SELECT * FROM revisiones WHERE bloque_id=$1 AND cliente_id=$2 ORDER BY semana ASC`,
      [bloque.id, req.user.id]
    );
    const normalized = rows.map(rev => {
      const medidasRaw = typeof rev.medidas === 'string' ? JSON.parse(rev.medidas) : (rev.medidas || {});
      const fotosObj = {};
      if (rev.fotos_urls && Array.isArray(rev.fotos_urls)) {
        rev.fotos_urls.forEach((url, i) => { if (url) fotosObj['rev_' + i] = url; });
      }
      return {
        ...rev,
        fotos: fotosObj,
        medidas: normalizarMedidas(medidasRaw),
        preguntas: typeof rev.preguntas === 'string' ? JSON.parse(rev.preguntas) : (rev.preguntas || {}),
      };
    });
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: sus check-ins ────────────────────────────────────────────────────
router.get('/checkins', cliente, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM checkins WHERE cliente_id=$1 ORDER BY semana_inicio DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: menú semanal guardado ────────────────────────────────────────────
router.get('/menu-semanal', cliente, async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const { rows: [menu] } = await db.query(
      `SELECT * FROM menus_semanales WHERE cliente_id=$1 AND semana_inicio <= $2
       ORDER BY semana_inicio DESC LIMIT 1`,
      [req.user.id, hoy]
    );
    if (!menu) return res.json({ menu_semanal: {} });
    res.json({ menu_semanal: menu.configuracion || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REVISIONES ────────────────────────────────────────────────────────────────

// ── Helpers de revisiones ────────────────────────────────────────────────────

/**
 * Calcula la fecha del sábado de la semana de revisión Sn para un bloque.
 * fecha_inicio es el lunes de la semana 1 (o cualquier fecha de inicio del bloque).
 *
 * S0  = sábado ANTES del inicio del bloque (sábado de la semana previa al lunes inicio)
 * Sn  = sábado de la semana n a partir del inicio
 *       inicio + (n-1)*7 días, luego avanzar al próximo sábado
 */
function calcRevisionDate(fecha_inicio, semana) {
  const d = new Date(fecha_inicio);
  d.setHours(12, 0, 0, 0); // mediodía para evitar problemas de DST
  if (semana === 0) {
    // S0 = sábado de la semana anterior al inicio
    // Si inicio es lunes (dow=1), retrocedemos 2 días para llegar al sábado anterior
    const dow = d.getDay(); // 0=dom, 1=lun, ..., 6=sáb
    const diasHastaSabPrevio = dow === 0 ? -1 : -(dow + 1); // días a restar para llegar al sáb previo
    d.setDate(d.getDate() + diasHastaSabPrevio);
  } else {
    // Sn: movernos a la semana n-1 desde inicio (semana 1 = inicio)
    d.setDate(d.getDate() + (semana - 1) * 7);
    // Ahora avanzar al sábado de esa semana
    const dow = d.getDay();
    const diasHastaSab = (6 - dow + 7) % 7;
    d.setDate(d.getDate() + diasHastaSab);
  }
  return d;
}

/**
 * Comprueba si la fecha actual está dentro de la ventana para subir la revisión Sn.
 * Ventana: miércoles de la semana de revisión → domingo de la semana siguiente.
 * El sábado de revisión está en el medio de esa ventana.
 *
 * Ejemplo: revisión S3 cae sábado 18/10
 *   → Puede subirse desde miércoles 15/10 (3 días antes del sáb) hasta domingo 26/10 (8 días después del sáb)
 */
function estaEnVentanaRevision(fecha_inicio, semana) {
  const sabado = calcRevisionDate(fecha_inicio, semana);
  // Miércoles previo = sábado - 3 días
  const inicioVentana = new Date(sabado);
  inicioVentana.setDate(sabado.getDate() - 3);
  inicioVentana.setHours(0, 0, 0, 0);
  // Domingo siguiente = sábado + 8 días (domingo de la semana siguiente al sábado)
  const finVentana = new Date(sabado);
  finVentana.setDate(sabado.getDate() + 8);
  finVentana.setHours(23, 59, 59, 999);
  const ahora = new Date();
  return ahora >= inicioVentana && ahora <= finVentana;
}

/**
 * Normaliza medidas al formato plano { clave: numero }
 * Acepta los 3 formatos que existen en BD:
 *   1. { pecho: 107 }         → plano número   ✓
 *   2. { pecho: "107" }       → plano string    → parseFloat
 *   3. { pecho: { S3: 107 } } → nested semana   → extrae el valor
 */
function normalizarMedidas(medidas) {
  if (!medidas || typeof medidas !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(medidas)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'object') {
      // Nested: { S0: 107 } o similar — coger el primer valor numérico
      const vals = Object.values(v);
      const n = parseFloat(vals[0]);
      if (!isNaN(n)) out[k] = n;
    } else {
      const n = parseFloat(v);
      if (!isNaN(n)) out[k] = n;
    }
  }
  return out;
}

// CLIENTE: convertir HEIC/HEIF → JPEG en el servidor usando sharp
// Recibe multipart/form-data con campo "foto" (File), devuelve { jpeg_b64: 'data:image/jpeg;base64,...' }
router.post('/convert-heic', cliente, _multerMem.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Campo foto requerido' });
    const jpegBuf = await sharp(req.file.buffer)
      .rotate()               // respetar EXIF orientation
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    const b64 = 'data:image/jpeg;base64,' + jpegBuf.toString('base64');
    res.json({ jpeg_b64: b64 });
  } catch (err) {
    console.error('[convert-heic] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// CLIENTE: upload de foto de revisión (recibe base64, la guarda en BD como URL data)
// El frontend llama a este endpoint por cada foto antes de llamar a POST /revision
router.post('/upload-foto', cliente, async (req, res) => {
  try {
    const { foto_b64, pose, semana } = req.body;
    if (!foto_b64) return res.status(400).json({ error: 'foto_b64 requerida' });
    // Aceptar data:image/* y también data:application/octet-stream (HEIC en iOS sin MIME)
    if (!foto_b64.startsWith('data:')) {
      return res.status(400).json({ error: 'Formato inválido: se esperaba base64' });
    }

    // Subir a Cloudinary si está configurado
    if (process.env.CLOUDINARY_API_SECRET) {
      const folder = `enformafit/revisiones/cliente_${req.user.id}/s${semana||0}`;
      console.log('[upload-foto] intentando subir a Cloudinary, folder:', folder, '| foto size (chars):', foto_b64.length);
      const result = await cloudinary.uploader.upload(foto_b64, {
        folder,
        resource_type: 'image',
        // Comprimir y limitar tamaño para ahorrar espacio
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
      });
      console.log('[upload-foto] OK → url:', result.secure_url);
      return res.json({ url: result.secure_url, pose, semana });
    }

    // Fallback sin Cloudinary configurado (no debería llegar aquí en producción)
    console.warn('[upload-foto] CLOUDINARY_API_SECRET no configurado — foto NO subida');
    res.status(503).json({ error: 'Almacenamiento de fotos no configurado. Contacta con soporte.' });
  } catch (err) {
    console.error('[upload-foto] Error completo:', err);
    res.status(500).json({ error: err.message || 'Error subiendo foto' });
  }
});

// CLIENTE: subir o actualizar revisión
// Soporta edición de revisiones pasadas (semana < semana_actual) y S0.
// Valida ventana de tiempo para revisiones distintas de S0.
// Hace upsert: si ya existe fila → actualiza SOLO los campos enviados (no machaca lo que no viene).
router.post('/revision', cliente, async (req, res) => {
  try {
    const { bloque_id: bloqueIdFromClient, semana, peso, medidas, preguntas, fotos } = req.body;
    const clienteId = req.user.id;

    // ── 1. Resolver bloque_id ────────────────────────────────────────────────
    let bloque_id = bloqueIdFromClient || null;
    let fecha_inicio_bloque = null;

    if (!bloque_id) {
      const { rows: [bloqueActivo] } = await db.query(
        `SELECT id, fecha_inicio FROM bloques WHERE cliente_id=$1 AND estado='activo'
         ORDER BY created_at DESC LIMIT 1`,
        [clienteId]
      );
      if (bloqueActivo) {
        bloque_id = bloqueActivo.id;
        fecha_inicio_bloque = bloqueActivo.fecha_inicio;
      } else {
        return res.status(400).json({
          error: 'No tienes un plan activo. Contacta con tu entrenador para activar tu plan.'
        });
      }
    } else {
      // Obtener fecha_inicio del bloque proporcionado
      const { rows: [b] } = await db.query(
        `SELECT fecha_inicio FROM bloques WHERE id=$1`, [bloque_id]
      );
      if (b) fecha_inicio_bloque = b.fecha_inicio;
    }

    // ── 2. Validar ventana de tiempo (solo para revisiones no-S0) ────────────
    // S0 siempre se puede subir (es la inicial, puede cargarse en cualquier momento)
    // Para S3, S7, S11, S4, S8, S12: solo dentro de la ventana
    const semanaInt = parseInt(semana);
    if (semanaInt > 0 && fecha_inicio_bloque) {
      if (!estaEnVentanaRevision(fecha_inicio_bloque, semanaInt)) {
        const sabado = calcRevisionDate(fecha_inicio_bloque, semanaInt);
        const sabStr = sabado.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        // Calcular inicio y fin de ventana para informar al cliente
        const ini = new Date(sabado); ini.setDate(sabado.getDate() - 3); ini.setHours(0,0,0,0);
        const fin = new Date(sabado); fin.setDate(sabado.getDate() + 8); fin.setHours(23,59,59,999);
        const iniStr = ini.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const finStr = fin.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        return res.status(403).json({
          error: `Revisión S${semanaInt} fuera de ventana. La fecha es ${sabStr}. Puedes subirla entre el ${iniStr} y el ${finStr}.`,
          codigo: 'FUERA_VENTANA',
          sabado: sabado.toISOString().split('T')[0],
          ventana_inicio: ini.toISOString().split('T')[0],
          ventana_fin: fin.toISOString().split('T')[0],
        });
      }
    }

    // ── 3. Normalizar medidas al formato plano ───────────────────────────────
    const medidasNorm = normalizarMedidas(medidas);

    // ── 4. Preparar fotos como array ─────────────────────────────────────────
    // fotos viene como objeto { 'rev_0': url, 'rev_1': url, ... }
    // Guardamos como array de 4 posiciones [frente, perfil_d, perfil_i, espalda]
    // Si viene null/undefined para una posición, guardamos null (no filtramos)
    // para no perder posiciones existentes en el array
    let fotosArray = null;
    if (fotos && typeof fotos === 'object') {
      fotosArray = ['rev_0','rev_1','rev_2','rev_3'].map(k => fotos[k] || null);
      // Si todas son null, no tiene sentido guardar un array vacío
      if (fotosArray.every(f => !f)) fotosArray = null;
    }

    // ── 5. Upsert inteligente ─────────────────────────────────────────────────
    // Buscar revisión existente
    const { rows: [existing] } = await db.query(
      `SELECT id, medidas, fotos_urls, preguntas, peso FROM revisiones
       WHERE cliente_id=$1 AND semana=$2 AND bloque_id=$3 LIMIT 1`,
      [clienteId, semanaInt, bloque_id]
    );

    let rev;
    if (existing) {
      // UPDATE: solo actualizar los campos que vienen en la petición
      // Si fotos es null → mantener las fotos que ya había en BD
      const fotosToSave = fotosArray !== null ? fotosArray : existing.fotos_urls;
      const medidasToSave = Object.keys(medidasNorm).length > 0 ? medidasNorm :
        (typeof existing.medidas === 'string' ? JSON.parse(existing.medidas) : existing.medidas || {});
      const preguntasToSave = (preguntas && typeof preguntas === 'object') ? preguntas :
        (typeof existing.preguntas === 'string' ? JSON.parse(existing.preguntas) : existing.preguntas || {});
      const pesoToSave = (peso !== null && peso !== undefined) ? peso : existing.peso;

      const { rows: [updated] } = await db.query(
        `UPDATE revisiones
         SET peso=$1, medidas=$2, preguntas=$3, fotos_urls=$4, estado='subida', fecha_subida=NOW()
         WHERE id=$5 RETURNING *`,
        [pesoToSave, JSON.stringify(medidasToSave), JSON.stringify(preguntasToSave), fotosToSave, existing.id]
      );
      rev = updated;
    } else {
      const { rows: [inserted] } = await db.query(
        `INSERT INTO revisiones (bloque_id, cliente_id, semana, peso, medidas, preguntas, fotos_urls, estado, fecha_subida)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'subida',NOW()) RETURNING *`,
        [bloque_id, clienteId, semanaInt, peso, JSON.stringify(medidasNorm),
         JSON.stringify(preguntas || {}), fotosArray]
      );
      rev = inserted;
    }
    res.json(rev);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: guardar/editar medidas de un cliente desde el panel
// El panel llama a esto con { cliente_id, semana, medidas (JSON string), estado }
router.post('/revision-cliente', entrenador, async (req, res) => {
  try {
    const { cliente_id, semana, medidas, preguntas, fotos, estado } = req.body;
    if (!cliente_id || semana === undefined) {
      return res.status(400).json({ error: 'cliente_id y semana son obligatorios' });
    }
    const semanaInt = parseInt(semana);

    // Resolver bloque activo del cliente
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [cliente_id]
    );
    if (!bloque) return res.status(400).json({ error: 'El cliente no tiene un plan activo' });
    const bloque_id = bloque.id;

    // Normalizar medidas — pueden venir como JSON string o como objeto
    let medidasObj = medidas;
    if (typeof medidas === 'string') {
      try { medidasObj = JSON.parse(medidas); } catch(e) { medidasObj = {}; }
    }
    const medidasNorm = normalizarMedidas(medidasObj || {});

    // Preparar fotos como array si vienen
    let fotosArray = null;
    if (fotos && typeof fotos === 'object') {
      fotosArray = ['rev_0','rev_1','rev_2','rev_3'].map(k => fotos[k] || null);
      if (fotosArray.every(f => !f)) fotosArray = null;
    }

    // Upsert: si ya existe la revisión, actualizar solo lo que viene
    const { rows: [existing] } = await db.query(
      `SELECT id, medidas, fotos_urls, preguntas, peso FROM revisiones
       WHERE cliente_id=$1 AND semana=$2 AND bloque_id=$3 LIMIT 1`,
      [cliente_id, semanaInt, bloque_id]
    );

    let rev;
    if (existing) {
      const fotosToSave   = fotosArray !== null ? fotosArray : existing.fotos_urls;
      const medidasToSave = Object.keys(medidasNorm).length > 0 ? medidasNorm
        : (typeof existing.medidas === 'string' ? JSON.parse(existing.medidas) : existing.medidas || {});
      const preguntasToSave = (preguntas && typeof preguntas === 'object') ? preguntas
        : (typeof existing.preguntas === 'string' ? JSON.parse(existing.preguntas) : existing.preguntas || {});

      const { rows: [updated] } = await db.query(
        `UPDATE revisiones
         SET medidas=$1, preguntas=$2, fotos_urls=$3, estado=$4, fecha_subida=NOW()
         WHERE id=$5 RETURNING *`,
        [JSON.stringify(medidasToSave), JSON.stringify(preguntasToSave), fotosToSave,
         estado || 'revisada', existing.id]
      );
      rev = updated;
    } else {
      const { rows: [inserted] } = await db.query(
        `INSERT INTO revisiones (bloque_id, cliente_id, semana, medidas, preguntas, fotos_urls, estado, fecha_subida)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
        [bloque_id, cliente_id, semanaInt, JSON.stringify(medidasNorm),
         JSON.stringify(preguntas || {}), fotosArray, estado || 'revisada']
      );
      rev = inserted;
    }
    res.json(rev);
  } catch (err) {
    console.error('[revision-cliente]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: backup completo de todas las revisiones — DEBE ir antes de /:clienteId para que Express no lo confunda con un UUID
router.get('/revisiones/backup-all', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, c.nombre, c.tipo
       FROM revisiones r
       JOIN clientes c ON c.id = r.cliente_id
       ORDER BY c.nombre ASC, r.semana ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver revisiones pendientes — DEBE ir antes de /:clienteId para que Express no lo confunda
router.get('/revisiones/pendientes', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, c.nombre, c.tipo
       FROM revisiones r
       JOIN clientes c ON c.id = r.cliente_id
       WHERE r.estado = 'subida'
       ORDER BY r.fecha_subida ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLIENTE: info de ventanas de revisión para el bloque activo — DEBE ir antes de /:clienteId
// Devuelve para cada semana de revisión: fecha_sabado, ventana_inicio, ventana_fin, en_ventana
router.get('/revisiones/ventanas', cliente, async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { rows: [bloque] } = await db.query(
      `SELECT id, fecha_inicio FROM bloques WHERE cliente_id=$1 AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque || !bloque.fecha_inicio) {
      return res.json({ ventanas: {} });
    }

    const { rows: [cli] } = await db.query(`SELECT tipo FROM clientes WHERE id=$1`, [clienteId]);
    const tipo = cli ? cli.tipo : '1a1';
    const revSems = tipo === 'programa' ? [0, 4, 8, 12] : [0, 3, 7, 11];

    const ventanas = {};
    for (const sem of revSems) {
      const sabado = calcRevisionDate(bloque.fecha_inicio, sem);
      const ini = new Date(sabado); ini.setDate(sabado.getDate() - 3); ini.setHours(0,0,0,0);
      const fin = new Date(sabado); fin.setDate(sabado.getDate() + 8); fin.setHours(23,59,59,999);
      const ahora = new Date();
      ventanas[sem] = {
        sabado: sabado.toISOString().split('T')[0],
        ventana_inicio: ini.toISOString().split('T')[0],
        ventana_fin: fin.toISOString().split('T')[0],
        en_ventana: ahora >= ini && ahora <= fin,
      };
    }
    res.json({ bloque_id: bloque.id, ventanas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver todas las revisiones de un cliente — va DESPUÉS de /pendientes y /ventanas para evitar shadowing
router.get('/revisiones/:clienteId', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM revisiones WHERE cliente_id=$1 ORDER BY semana ASC`,
      [req.params.clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLIENTE: ver una revisión específica por semana
// Devuelve medidas normalizadas al formato plano y fotos como objeto { rev_0, rev_1, ... }
router.get('/revision/:semana', cliente, async (req, res) => {
  try {
    const clienteId = req.user.id;
    const semana = parseInt(req.params.semana);

    // Buscar el bloque activo del cliente (con o sin visible_cliente para mayor robustez)
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [clienteId]
    );

    let rev = null;
    if (bloque) {
      const { rows: [found] } = await db.query(
        `SELECT * FROM revisiones WHERE cliente_id=$1 AND semana=$2 AND bloque_id=$3 LIMIT 1`,
        [clienteId, semana, bloque.id]
      );
      rev = found || null;
    }

    if (!rev) {
      // Fallback: buscar por cliente+semana sin filtrar bloque
      const { rows: [any] } = await db.query(
        `SELECT * FROM revisiones WHERE cliente_id=$1 AND semana=$2 ORDER BY created_at DESC LIMIT 1`,
        [clienteId, semana]
      );
      rev = any || null;
    }

    if (!rev) return res.status(404).json({ error: 'Revisión no encontrada' });

    // Normalizar medidas al formato plano { clave: numero }
    const medidasRaw = typeof rev.medidas === 'string' ? JSON.parse(rev.medidas) : (rev.medidas || {});
    const medidasNorm = normalizarMedidas(medidasRaw);

    // Formatear fotos_urls como objeto { rev_0, rev_1, ... } para el frontend
    const fotosObj = {};
    if (rev.fotos_urls && Array.isArray(rev.fotos_urls)) {
      rev.fotos_urls.forEach((url, i) => { if (url) fotosObj['rev_' + i] = url; });
    }

    res.json({
      ...rev,
      fotos: fotosObj,
      medidas: medidasNorm,
      preguntas: typeof rev.preguntas === 'string' ? JSON.parse(rev.preguntas) : (rev.preguntas || {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: dar feedback en revisión
router.patch('/revision/:id/feedback', entrenador, async (req, res) => {
  try {
    const { feedback } = req.body;
    const { rows: [rev] } = await db.query(
      `UPDATE revisiones SET feedback_entrenador=$1, estado='revisada', fecha_revision=NOW()
       WHERE id=$2 RETURNING *`,
      [feedback, req.params.id]
    );
    if (!rev) return res.status(404).json({ error: 'Revisión no encontrada' });

    // Notificar al cliente
    await db.query(
      `INSERT INTO notificaciones (cliente_id, tipo, titulo, mensaje, enviar_en)
       VALUES ($1,'feedback_revision','Tienes feedback de tu revisión',
               'Álvaro ha revisado tus datos y te ha dejado feedback. Consúltalo en la app.',NOW())`,
      [rev.cliente_id]
    );

    res.json(rev);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── CHECK-IN SEMANAL (1:1) ────────────────────────────────────────────────────
router.post('/checkin', cliente, async (req, res) => {
  try {
    const { semana_inicio, dias_entreno_real, dias_nutricion, dias_pasos,
            orgullos, compromisos, sensaciones, como_semana, adherencia } = req.body;

    // Normalizar semana_inicio al lunes de esa semana (por si el cliente rellena dom, mar, etc.)
    const fechaRef = new Date(semana_inicio);
    const dow = fechaRef.getUTCDay(); // 0=dom,1=lun,...,6=sab
    const offsetToMonday = dow === 0 ? -6 : 1 - dow;
    fechaRef.setUTCDate(fechaRef.getUTCDate() + offsetToMonday);
    const semanaInicioNorm = fechaRef.toISOString().split('T')[0];

    const { rows: [ci] } = await db.query(
      `INSERT INTO checkins
         (cliente_id, semana_inicio, dias_entreno_real, dias_nutricion, dias_pasos,
          orgullos, compromisos, sensaciones, como_semana, adherencia)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (cliente_id, semana_inicio) DO UPDATE
         SET dias_entreno_real=$3, dias_nutricion=$4, dias_pasos=$5,
             orgullos=$6, compromisos=$7, sensaciones=$8,
             como_semana=$9, adherencia=$10
       RETURNING *`,
      [req.user.id, semanaInicioNorm, dias_entreno_real, dias_nutricion, dias_pasos,
       orgullos, compromisos, sensaciones, como_semana, adherencia || 0]
    );
    res.json(ci);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver check-ins pendientes de leer
router.get('/checkins/pendientes', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ci.*, c.nombre, c.tipo
       FROM checkins ci
       JOIN clientes c ON c.id = ci.cliente_id
       WHERE ci.leido_entrenador = false AND c.tipo = '1a1'
       ORDER BY ci.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver todos los check-ins de la semana actual
// Devuelve el check-in más reciente de cada cliente 1:1 que haya enviado en los últimos 14 días
router.get('/checkins/semana-actual', entrenador, async (req, res) => {
  try {
    // Calcular semana_inicio de la semana actual (misma lógica que la app)
    // semana_inicio en BD = lunesRef - 7
    // lunesRef = próximo lunes si hoy es domingo, lunes pasado si lun-sab
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=dom,1=lun,...,6=sab
    // Lunes de la semana actual (domingo también cuenta como parte de la semana siguiente)
    const lunesActual = new Date(hoy);
    if (dia === 0) {
      lunesActual.setDate(hoy.getDate() - 6); // domingo → lunes de esta misma semana
    } else {
      lunesActual.setDate(hoy.getDate() - (dia - 1)); // lun-sab → lunes de esta semana
    }
    const desdeStr = lunesActual.toISOString().split('T')[0];
    // Rango lunes a domingo de esta semana
    const semanaFin = new Date(lunesActual);
    semanaFin.setDate(lunesActual.getDate() + 6);
    const hastaStr = semanaFin.toISOString().split('T')[0];

    // Obtener el check-in de la semana actual de cada cliente 1:1
    const { rows } = await db.query(
      `SELECT DISTINCT ON (ci.cliente_id) ci.*
       FROM checkins ci
       JOIN clientes c ON c.id = ci.cliente_id
       WHERE ci.semana_inicio::date BETWEEN $1::date AND $2::date
         AND c.tipo IN ('1a1','uno')
       ORDER BY ci.cliente_id, ci.created_at DESC`,
      [desdeStr, hastaStr]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: debug — ver todos los check-ins recientes con nombre de cliente
router.get('/checkins/debug-recientes', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ci.id, ci.cliente_id, c.nombre, c.tipo,
              ci.semana_inicio, ci.dias_entreno_real, ci.dias_nutricion, ci.dias_pasos,
              ci.created_at
       FROM checkins ci
       JOIN clientes c ON c.id = ci.cliente_id
       WHERE ci.created_at > NOW() - INTERVAL '21 days'
       ORDER BY ci.created_at DESC
       LIMIT 60`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: corregir semana_inicio de checkins de un cliente (restar 7 días)
router.post('/checkins/:clienteId/fix-semana', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE checkins
       SET semana_inicio = (semana_inicio::date - interval '7 days')::date
       WHERE cliente_id = $1
       RETURNING id, semana_inicio`,
      [req.params.clienteId]
    );
    res.json({ fixed: rows.length, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DIAGNÓSTICO: ver registros recientes del cliente autenticado (temporal)
router.get('/debug-registros', cliente, async (req, res) => {
  try {
    const clienteId = req.user.id;
    // Bloque activo (cualquier estado)
    const { rows: bloques } = await db.query(
      `SELECT id, estado, visible_cliente, created_at FROM bloques WHERE cliente_id=$1 ORDER BY created_at DESC LIMIT 3`,
      [clienteId]
    );
    const bloque = bloques[0];
    let registros = [];
    if (bloque) {
      const { rows } = await db.query(
        `SELECT semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada, created_at
         FROM registro_entreno WHERE cliente_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [clienteId]
      );
      registros = rows;
    }
    res.json({ cliente_id: clienteId, bloques, registros });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: historial completo de entreno de un cliente (panel)
router.get('/historial/:clienteId', entrenador, async (req, res) => {
  try {
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.clienteId]
    );
    if (!bloque) return res.json([]);
    const { rows } = await db.query(
      `SELECT DISTINCT ON (semana, dia, ejercicio, serie)
         semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada
       FROM registro_entreno
       WHERE bloque_id=$1 AND cliente_id=$2
       ORDER BY semana, dia, ejercicio, serie, created_at DESC`,
      [bloque.id, req.params.clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: limpiar registros basura de un cliente (ejercicios que no están en su bloque actual)
router.delete('/historial/:clienteId/limpiar-basura', entrenador, async (req, res) => {
  try {
    const { ejercicios } = req.body; // array de nombres de ejercicios a eliminar
    if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
      return res.status(400).json({ error: 'Envía { ejercicios: ["nombre1","nombre2",...] }' });
    }
    const clienteId = req.params.clienteId;
    const { rows: [bloque] } = await db.query(
      `SELECT id FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque) return res.status(400).json({ error: 'Sin bloque activo' });
    const placeholders = ejercicios.map((_,i) => `$${i+3}`).join(',');
    const { rowCount } = await db.query(
      `DELETE FROM registro_entreno WHERE cliente_id=$1 AND bloque_id=$2 AND ejercicio IN (${placeholders})`,
      [clienteId, bloque.id, ...ejercicios]
    );
    res.json({ deleted: rowCount, ejercicios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: borrar todos los registros de ejercicios que no están en el plan activo del cliente
router.delete('/historial/:clienteId/limpiar-ejercicios-fuera-de-plan', entrenador, async (req, res) => {
  try {
    const clienteId = req.params.clienteId;
    // Obtener bloque activo y sus ejercicios
    const { rows: [bloque] } = await db.query(
      `SELECT id, ejercicios FROM bloques WHERE cliente_id=$1 AND visible_cliente=true AND estado='activo'
       ORDER BY created_at DESC LIMIT 1`,
      [clienteId]
    );
    if (!bloque) return res.status(400).json({ error: 'Sin bloque activo' });
    // Extraer nombres de ejercicios del bloque (campo JSONB dias[].ejercicios[].nom)
    const { rows: ejRows } = await db.query(
      `SELECT DISTINCT jsonb_array_elements(d->'ejercicios')->>'nom' AS nom
       FROM bloques, jsonb_array_elements(bloques.dias) AS d
       WHERE bloques.id=$1`,
      [bloque.id]
    );
    const ejerciciosDelPlan = ejRows.map(r => r.nom).filter(Boolean);
    if (ejerciciosDelPlan.length === 0) return res.status(400).json({ error: 'No se pudieron extraer ejercicios del bloque' });
    // Borrar registros cuyos ejercicios NO estén en el plan
    const placeholders = ejerciciosDelPlan.map((_,i) => `$${i+3}`).join(',');
    const { rowCount } = await db.query(
      `DELETE FROM registro_entreno WHERE cliente_id=$1 AND bloque_id=$2 AND ejercicio NOT IN (${placeholders})`,
      [clienteId, bloque.id, ...ejerciciosDelPlan]
    );
    res.json({ deleted: rowCount, ejercicios_del_plan: ejerciciosDelPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver todos los check-ins de un cliente (historial)
router.get('/checkins/:clienteId', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM checkins
       WHERE cliente_id = $1
       ORDER BY semana_inicio DESC`,
      [req.params.clienteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
