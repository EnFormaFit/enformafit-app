'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const db      = require('./db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clientes',  require('./routes/clientes'));
app.use('/api/entreno',   require('./routes/entreno'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Version endpoint (cache busting) ──────────────────────────────────────────
// Este número debe coincidir con BUILD en los index.html del app y panel.
// Actualizarlo junto con cada deploy que cambie JS/CSS.
const BUILD_VERSION = process.env.BUILD_VERSION || '1792434747';
app.get('/api/version', (_, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ v: BUILD_VERSION });
});

// ── Cron: enviar notificaciones pendientes (cada 5 min) ───────────────────────
cron.schedule('*/5 * * * *', async () => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notificaciones
       WHERE enviada=false AND enviar_en <= NOW()
       LIMIT 50`
    );
    for (const n of rows) {
      // Aquí irá la integración con FCM/APNs cuando tengamos la app móvil
      // Por ahora solo marcamos como enviada
      console.log(`[NOTIF] → ${n.cliente_id}: ${n.titulo}`);
      await db.query(
        'UPDATE notificaciones SET enviada=true, enviada_at=NOW() WHERE id=$1',
        [n.id]
      );
    }
    if (rows.length) console.log(`[NOTIF] ${rows.length} notificaciones procesadas`);
  } catch (err) {
    console.error('[NOTIF] Error:', err.message);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Migraciones automáticas al arranque ──────────────────────────────────────
async function runMigrations() {
  try {
    // 1. Asegurar unique constraint en registro_entreno
    //    Primero limpiamos duplicados (quedamos con el más reciente de cada grupo)
    await db.query(`
      DELETE FROM registro_entreno
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY bloque_id, cliente_id, semana, dia, ejercicio, serie
              ORDER BY created_at DESC
            ) AS rn
          FROM registro_entreno
        ) t WHERE rn > 1
      )
    `);
    // 2. Crear la constraint si no existe
    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'registro_entreno_unique'
        ) THEN
          ALTER TABLE registro_entreno
            ADD CONSTRAINT registro_entreno_unique
            UNIQUE (bloque_id, cliente_id, semana, dia, ejercicio, serie);
        END IF;
      END $$
    `);
    console.log('✅ Migraciones OK');
  } catch (e) {
    console.error('⚠️ Migración falló (no crítico):', e.message);
  }
}

// ── Arrancar ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`\n✅ EnFormaFit API arrancada en puerto ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB: ${process.env.DATABASE_URL ? 'conectada' : 'sin configurar'}\n`);
  await runMigrations();
});

module.exports = app;
