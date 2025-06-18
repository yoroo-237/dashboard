// backend/routes/stats.js

const express = require('express');
const pool    = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router  = express.Router();

// Données de base : nombre total de chaque entité
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [u,p,b] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM public.users'),
      pool.query('SELECT COUNT(*) AS count FROM public.product'),
      pool.query('SELECT COUNT(*) AS count FROM public.blog_post')
    ]);

    res.json({
      users:   Number(u.rows[0].count),
      products:Number(p.rows[0].count),
      blogs:   Number(b.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
