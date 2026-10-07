'use strict';

const router = require('express').Router();
const db     = require('../db');
const { cliente, entrenador } = require('../middleware/auth');

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
    res.json(bloque);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: registrar serie ──────────────────────────────────────────────────
router.post('/registrar-serie', cliente, async (req, res) => {
  try {
    const { bloque_id, semana, dia, ejercicio, serie, kg, reps_reales, rir_real } = req.body;
    const clienteId = req.user.id;

    const { rows: [reg] } = await db.query(
      `INSERT INTO registro_entreno
         (bloque_id, cliente_id, semana, dia, ejercicio, serie, kg, reps_reales, rir_real, completada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
       ON CONFLICT (bloque_id, cliente_id, semana, dia, ejercicio, serie)
       DO UPDATE SET kg=$7, reps_reales=$8, rir_real=$9
       RETURNING *`,
      [bloque_id, clienteId, semana, dia, ejercicio, serie, kg, reps_reales, rir_real]
    );
    res.json(reg);
  } catch (err) {
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

// ── REVISIONES ────────────────────────────────────────────────────────────────

// CLIENTE: subir revisión
router.post('/revision', cliente, async (req, res) => {
  try {
    const { bloque_id, semana, peso, medidas, preguntas } = req.body;
    const clienteId = req.user.id;

    const { rows: [rev] } = await db.query(
      `INSERT INTO revisiones (bloque_id, cliente_id, semana, peso, medidas, preguntas, estado, fecha_subida)
       VALUES ($1,$2,$3,$4,$5,$6,'subida',NOW())
       ON CONFLICT (bloque_id, semana) DO UPDATE
         SET peso=$4, medidas=$5, preguntas=$6, estado='subida', fecha_subida=NOW()
       RETURNING *`,
      [bloque_id, clienteId, semana, peso, JSON.stringify(medidas), JSON.stringify(preguntas)]
    );
    res.json(rev);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENTRENADOR: ver revisiones pendientes
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
            orgullos, compromisos, sensaciones } = req.body;

    const { rows: [ci] } = await db.query(
      `INSERT INTO checkins
         (cliente_id, semana_inicio, dias_entreno_real, dias_nutricion, dias_pasos,
          orgullos, compromisos, sensaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (cliente_id, semana_inicio) DO UPDATE
         SET dias_entreno_real=$3, dias_nutricion=$4, dias_pasos=$5,
             orgullos=$6, compromisos=$7, sensaciones=$8
       RETURNING *`,
      [req.user.id, semana_inicio, dias_entreno_real, dias_nutricion, dias_pasos,
       orgullos, compromisos, sensaciones]
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
    // Ventana: los últimos 14 días hasta hoy+1
    // Coge check-ins de la semana pasada y la semana actual sin importar el día exacto
    const hoy = new Date();
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 1); // incluir hoy aunque sea lunes
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 14);
    const desdeStr = desde.toISOString().split('T')[0];
    const hastaStr = hasta.toISOString().split('T')[0];

    // Obtener el check-in más reciente de cada cliente 1:1 dentro de la ventana
    const { rows } = await db.query(
      `SELECT DISTINCT ON (ci.cliente_id) ci.*
       FROM checkins ci
       JOIN clientes c ON c.id = ci.cliente_id
       WHERE ci.semana_inicio BETWEEN $1 AND $2
         AND c.tipo IN ('1a1','uno')
       ORDER BY ci.cliente_id, ci.semana_inicio DESC, ci.created_at DESC`,
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
