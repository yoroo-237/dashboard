// backend/node_server/routes/tags.js
const express = require('express');
const pool    = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * GET  /api/tags       → liste tous les tags
 * POST /api/tags       → créer un nouveau tag
 * DELETE /api/tags/:id → supprimer un tag
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name
      FROM public.tag
      ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/tags error:', err);
    res.status(500).json({ error: 'Impossible de charger les tags' });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Le nom du tag est requis.' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO public.tag(name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `, [ name ]);
    if (rows.length > 0) return res.status(201).json(rows[0]);
    // sinon renvoyer l’existant
    const existing = await pool.query(
      `SELECT id, name FROM public.tag WHERE name = $1`,
      [ name ]
    );
    res.json(existing.rows[0]);
  } catch (err) {
    console.error('POST /api/tags error:', err);
    res.status(500).json({ error: 'Impossible de créer le tag' });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM public.tag WHERE id = $1`, [ parseInt(req.params.id, 10) ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/tags/:id error:', err);
    res.status(500).json({ error: 'Impossible de supprimer le tag' });
  }
});

module.exports = router;
