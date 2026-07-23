const jwt = require('jsonwebtoken');

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const entrenador = auth(['entrenador']);
const cliente    = auth(['cliente', 'entrenador']);

module.exports = { auth, entrenador, cliente };
