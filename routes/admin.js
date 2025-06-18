const express   = require('express');
const pool      = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router    = express.Router();

router.get('/users', verifyToken, isAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,name,email,is_validated,is_admin FROM users ORDER BY id'
  );
  res.json(rows);
});

router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,name,email FROM users WHERE is_validated = FALSE'
  );
  res.json(rows);
});

router.post('/validate/:id', verifyToken, isAdmin, async (req, res) => {
  await pool.query('UPDATE users SET is_validated = TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Utilisateur validé' });
});

router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ message: 'Utilisateur supprimé' });
});

module.exports = router;
