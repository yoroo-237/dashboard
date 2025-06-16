const jwt  = require('jsonwebtoken');
const pool = require('../db');

exports.verifyToken = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' });
  const token = h.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token invalide' });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT is_admin FROM users WHERE id=$1', [req.user.id]);
    if (rows[0]?.is_admin) return next();
    res.status(403).json({ error: 'Accès réservé aux admins' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
