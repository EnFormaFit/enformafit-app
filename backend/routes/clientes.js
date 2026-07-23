'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const { entrenador, cliente } = require('../middleware/auth');
const { generarPlanNutricion, ajustarKcal } = require('../engine/nutricion');
const { asignarRutina, sugerirSiguienteRutina, programarNotificacionesRevision } = require('../engine/rutinas');

// ── ENTRENADOR: listar todos los clientes ─────────────────────────────────────
router.get('/', entrenador, async (req, res) => {
  try {
    const { tipo, estado } = req.query;
    let q = `SELECT id, nombre, email, tipo, estado, fecha_inicio,
                    kcal_asignadas, rutina_actual, dias_entreno, nivel,
                    created_at
             FROM clientes WHERE 1=1`;
    const params = [];
    if (tipo)   { params.push(tipo);   q += ` AND tipo = $${params.length}`; }
    if (estado) { params.push(estado); q += ` AND estado = $${params.length}`; }
    q += ' ORDER BY created_at DESC';

    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: crear cliente manualmente (sin formulario) ────────────────────
router.post('/', entrenador, async (req, res) => {
  try {
    const {
      nombre, email, tipo = 'programa',
      peso, altura, fecha_nacimiento, objetivo = 'def',
      actividad = 1.375, comidas = 3, dias_entreno = 3,
      lugar = 'gym', tiempo_ent = 45, nivel = 1,
      lesiones, excluir_alimentos = [],
      fecha_inicio, semanas_bloque = 10,
      semanas_revision,
      notas,
    } = req.body;

    if (!nombre || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });

    // Contraseña temporal = primeros 6 chars del email
    const passTemp = email.split('@')[0].slice(0, 6) + '2024';
    const hash     = await bcrypt.hash(passTemp, 12);

    // Semanas de revisión según tipo
    const semRev = semanas_revision ||
      (tipo === '1a1' ? [3, 7, 11] : [4, 9]);

    const { rows } = await db.query(
      `INSERT INTO clientes
         (nombre, email, password_hash, tipo, peso_inicial, altura, fecha_nacimiento,
          objetivo, actividad, comidas, dias_entreno, lugar, tiempo_ent, nivel,
          lesiones, excluir_alimentos, fecha_inicio, semanas_bloque, semanas_revision, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [nombre, email.toLowerCase(), hash, tipo, peso, altura, fecha_nacimiento,
       objetivo, actividad, comidas, dias_entreno, lugar, tiempo_ent, nivel,
       lesiones, excluir_alimentos, fecha_inicio, semanas_bloque, semRev, notas]
    );

    res.status(201).json({ cliente: rows[0], password_temporal: passTemp });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: ver cliente ───────────────────────────────────────────────────
router.get('/:id', entrenador, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: actualizar cliente ────────────────────────────────────────────
router.patch('/:id', entrenador, async (req, res) => {
  try {
    const campos = ['nombre','tipo','peso_inicial','altura','objetivo','actividad',
                    'comidas','dias_entreno','lugar','tiempo_ent','nivel','lesiones',
                    'excluir_alimentos','kcal_asignadas','rutina_actual','estado',
                    'semanas_bloque','semanas_revision','notas','fecha_inicio'];

    const updates = []; const params = [req.params.id];
    for (const campo of campos) {
      if (req.body[campo] !== undefined) {
        params.push(req.body[campo]);
        updates.push(`${campo} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

    const { rows } = await db.query(
      `UPDATE clientes SET ${updates.join(',')} WHERE id = $1 RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: generar plan completo ─────────────────────────────────────────
router.post('/:id/generar-plan', entrenador, async (req, res) => {
  try {
    const { rows: [cli] } = await db.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });

    const { rutina_manual, factor = 1.0, kcal_ajuste = 0, fecha_inicio } = req.body;

    // 1. Calcular nutrición
    const plan = generarPlanNutricion({ ...cli, factor, kcal_ajuste });

    // 2. Asignar rutina
    const rutinaCod = rutina_manual ||
      asignarRutina(cli.dias_entreno, cli.lugar, cli.tiempo_ent, cli.nivel);

    if (!rutinaCod) return res.status(400).json({ error: 'No se pudo asignar rutina para estos parámetros' });

    // 3. Número de bloque
    const { rows: bloques } = await db.query(
      'SELECT COUNT(*) FROM bloques WHERE cliente_id = $1', [cli.id]
    );
    const numBloque = parseInt(bloques[0].count) + 1;

    const fInicio = fecha_inicio || cli.fecha_inicio || new Date().toISOString().split('T')[0];
    const fFin    = new Date(fInicio);
    fFin.setDate(fFin.getDate() + cli.semanas_bloque * 7);

    // 4. Crear bloque (pendiente de aprobación)
    const { rows: [bloque] } = await db.query(
      `INSERT INTO bloques
         (cliente_id, numero_bloque, rutina_cod, kcal_inicio, fecha_inicio, fecha_fin,
          semanas, estado, visible_cliente)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'activo',false)
       RETURNING *`,
      [cli.id, numBloque, rutinaCod, plan.kcal_total, fInicio, fFin, cli.semanas_bloque]
    );

    // 5. Guardar plan de nutrición
    await db.query(
      `INSERT INTO planes_nutricion
         (bloque_id, kcal_total, proteina_g, carbos_g, grasas_g, distribucion)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [bloque.id, plan.kcal_total, plan.proteina_g, plan.carbos_g, plan.grasas_g,
       JSON.stringify(plan.distribucion)]
    );

    // 6. Actualizar datos del cliente
    await db.query(
      'UPDATE clientes SET kcal_asignadas=$1, rutina_actual=$2 WHERE id=$3',
      [plan.kcal_total, rutinaCod, cli.id]
    );

    res.json({
      bloque,
      plan_nutricion: plan,
      rutina_cod: rutinaCod,
      mensaje: 'Plan generado. Revísalo y apruébalo para que el cliente lo vea.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: aprobar plan y hacerlo visible al cliente ─────────────────────
router.post('/:id/aprobar-plan/:bloqueId', entrenador, async (req, res) => {
  try {
    const { rows: [bloque] } = await db.query(
      `UPDATE bloques SET visible_cliente=true, aprobado_por='entrenador', aprobado_at=NOW()
       WHERE id=$1 AND cliente_id=$2 RETURNING *`,
      [req.params.bloqueId, req.params.id]
    );
    if (!bloque) return res.status(404).json({ error: 'Bloque no encontrado' });

    const { rows: [cli] } = await db.query('SELECT * FROM clientes WHERE id=$1', [req.params.id]);

    // Programar notificaciones de revisión
    const n = await programarNotificacionesRevision(
      cli.id, bloque.id, bloque.fecha_inicio,
      bloque.semanas, cli.semanas_revision
    );

    // Notificación de plan listo al cliente
    await db.query(
      `INSERT INTO notificaciones (cliente_id, tipo, titulo, mensaje, enviar_en)
       VALUES ($1,'plan_listo','Tu plan está listo','Álvaro ha preparado tu plan. Ábrelo en la app.',NOW())`,
      [cli.id]
    );

    res.json({ bloque, notificaciones_programadas: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: ajuste rápido de kcal ─────────────────────────────────────────
router.post('/:id/ajuste-kcal', entrenador, async (req, res) => {
  try {
    const { ajuste, tipo = 'carbos' } = req.body;
    if (!ajuste) return res.status(400).json({ error: 'Ajuste requerido (±100, ±200, ±300)' });

    const { rows: [cli] } = await db.query('SELECT * FROM clientes WHERE id=$1', [req.params.id]);
    const { rows: [planActual] } = await db.query(
      `SELECT pn.* FROM planes_nutricion pn
       JOIN bloques b ON b.id = pn.bloque_id
       WHERE b.cliente_id=$1 AND pn.activo=true
       ORDER BY pn.created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (!planActual) return res.status(404).json({ error: 'No hay plan activo' });

    const planNuevo = ajustarKcal(planActual, parseInt(ajuste), tipo);

    await db.query(
      'UPDATE planes_nutricion SET kcal_total=$1,carbos_g=$2,grasas_g=$3,version=version+1 WHERE id=$4',
      [planNuevo.kcal_total, planNuevo.carbos_g, planNuevo.grasas_g, planActual.id]
    );
    await db.query('UPDATE clientes SET kcal_asignadas=$1 WHERE id=$2', [planNuevo.kcal_total, req.params.id]);

    // Registrar cambio
    await db.query(
      `INSERT INTO cambios_plan (cliente_id,tipo_cambio,valor_anterior,valor_nuevo,motivo)
       VALUES ($1,'ajuste_kcal',$2,$3,$4)`,
      [req.params.id, planActual.kcal_total, planNuevo.kcal_total, `Ajuste ${ajuste > 0 ? '+' : ''}${ajuste} kcal a ${tipo}`]
    );

    res.json({ plan: planNuevo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENTRENADOR: sugerir siguiente rutina ──────────────────────────────────────
router.get('/:id/siguiente-rutina', entrenador, async (req, res) => {
  try {
    const sugerencia = await sugerirSiguienteRutina(req.params.id);
    res.json(sugerencia || { mensaje: 'No hay sugerencia disponible, asignar manualmente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENTE: ver su propio perfil y plan ──────────────────────────────────────
router.get('/me/perfil', cliente, async (req, res) => {
  try {
    const clienteId = req.user.role === 'cliente' ? req.user.id : req.query.id;
    const { rows: [cli] } = await db.query(
      `SELECT id,nombre,email,tipo,estado,fecha_inicio,kcal_asignadas,rutina_actual,
              dias_entreno,nivel,objetivo,comidas,semanas_revision
       FROM clientes WHERE id=$1`,
      [clienteId]
    );
    if (!cli) return res.status(404).json({ error: 'No encontrado' });
    res.json(cli);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
