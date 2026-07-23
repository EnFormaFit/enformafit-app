'use strict';

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const ENTRENADOR_EMAIL = 'alvarocasaltrainer@gmail.com';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    // Entrenador (cuenta especial)
    if (email === ENTRENADOR_EMAIL) {
      const ok = await bcrypt.compare(password, process.env.ENTRENADOR_HASH || '');
      if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });
      return res.json({
        token: signToken({ id: 'entrenador', email, role: 'entrenador', nombre: 'Álvaro' }),
        role: 'entrenador',
      });
    }

    // Cliente
    const { rows } = await db.query(
      'SELECT * FROM clientes WHERE email = $1 AND estado != $2',
      [email.toLowerCase(), 'baja']
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const cliente = rows[0];
    const ok = await bcrypt.compare(password, cliente.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    res.json({
      token: signToken({ id: cliente.id, email: cliente.email, role: 'cliente', tipo: cliente.tipo, nombre: cliente.nombre }),
      role:  'cliente',
      tipo:  cliente.tipo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /auth/cambiar-password
router.post('/cambiar-password', async (req, res) => {
  try {
    const { email, password_nuevo } = req.body;
    if (!email || !password_nuevo) return res.status(400).json({ error: 'Datos incompletos' });
    if (password_nuevo.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });

    const hash = await bcrypt.hash(password_nuevo, 12);
    await db.query('UPDATE clientes SET password_hash = $1 WHERE email = $2', [hash, email]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
