// Backend/node_server/routes/visits.js

const express = require('express');
const pool    = require('../db');
const router  = express.Router();

// POST /api/visits — enregistre une visite (IP, horodatage)
router.post('/', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    await pool.query(
      `INSERT INTO public.site_visits (ip_address) VALUES ($1)`,
      [ip]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error('Erreur visits POST:', err);
    res.sendStatus(500);
  }
});

// GET /api/visits/stats — stats visites sur 30 derniers jours
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        to_char(visit_time::date, 'YYYY-MM-DD') AS day,
        COUNT(*) AS count
      FROM public.site_visits
      WHERE visit_time >= current_date - INTERVAL '29 days'
      GROUP BY day
      ORDER BY day;
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erreur visits GET /stats:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
