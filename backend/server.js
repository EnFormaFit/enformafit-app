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

// ── Arrancar ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ EnFormaFit API arrancada en puerto ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB: ${process.env.DATABASE_URL ? 'conectada' : 'sin configurar'}\n`);
});

module.exports = app;
