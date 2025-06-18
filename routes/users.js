const express = require('express');
const pool    = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router  = express.Router();

// Pending
router.get('/pending', verifyToken, isAdmin, async (_,res) => {
  const { rows } = await pool.query(
    'SELECT id,username,phone FROM users WHERE is_validated=FALSE AND is_admin=FALSE'
  );
  res.json(rows);
});
router.get('/', verifyToken, isAdmin, async (_, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, phone, is_validated, is_admin FROM users'
  );
  res.json(rows);
});
// Validate
router.put('/validate/:id', verifyToken, isAdmin, async (req,res) => {
  await pool.query('UPDATE users SET is_validated=TRUE WHERE id=$1',[req.params.id]);
  res.json({ message:'Validé' });
});

// Delete
router.delete('/:id', verifyToken, isAdmin, async (req,res) => {
  await pool.query('DELETE FROM users WHERE id=$1',[req.params.id]);
  res.json({ message:'Supprimé' });
});
router.patch('/:id', verifyToken, isAdmin, async (req, res) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['name','username','phone']) {
    if (req.body[key]) {
      fields.push(`${key} = $${idx}`);
      values.push(req.body[key]);
      idx++;
    }
  }
  if (!fields.length) return res.status(400).json({ error:'Aucun champ à modifier' });
  values.push(req.params.id);
  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
    values
  );
  res.json({ message: 'Utilisateur mis à jour' });
});

// 6) Activité d’un utilisateur
router.get('/:id/activity', verifyToken, isAdmin, async (req, res) => {
  // Exemple : lire un fichier audit.log et filtrer
  const fs = require('fs');
  const lines = fs.existsSync('audit.log')
    ? fs.readFileSync('audit.log','utf8').split('\n').filter(l=>l.includes(`user:${req.params.id}`))
    : [];
  res.json(lines);
});

module.exports = router;