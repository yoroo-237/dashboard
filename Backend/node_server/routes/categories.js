// backend/node_server/routes/categories.js
const express = require('express');
const pool    = require('../db');
const { verifyToken} = require('../middleware/auth');
const router  = express.Router();

/** Catégories de produits */
// GET  /api/categories/product
router.get('/product', verifyToken, async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name FROM public.category ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Impossible de charger catégories produits' });
  }
});
// POST /api/categories/product
router.post('/product', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error:'Le nom est requis' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO public.category(name)
      VALUES($1) ON CONFLICT(name) DO NOTHING RETURNING *
    `, [name]);
    if (rows.length) return res.status(201).json(rows[0]);
    // existant
    const { rows:existing } = await pool.query(
      'SELECT id,name FROM public.category WHERE name=$1', [name]
    );
    res.json(existing[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Erreur création catégorie produit' });
  }
});
// DELETE /api/categories/product/:id
router.delete('/product/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM public.category WHERE id=$1', [req.params.id]);
    res.json({ ok:true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Erreur suppression catégorie produit' });
  }
});

router.get('/blog', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name
      FROM public.blog_category
      ORDER BY name;
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/categories/blog', err);
    res.status(500).json({ error: 'Impossible de charger les catégories' });
  }
});

// POST /api/categories/blog  → create a new blog category
router.post('/blog', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
  }
  try {
    const insert = await pool.query(`
      INSERT INTO public.blog_category(name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `, [name]);
    if (insert.rowCount) {
      return res.status(201).json(insert.rows[0]);
    }
    // If conflict, return the existing category
    const existing = await pool.query(
      `SELECT id, name FROM public.blog_category WHERE name = $1`,
      [name]
    );
    return res.json(existing.rows[0]);
  } catch (err) {
    console.error('POST /api/categories/blog', err);
    res.status(500).json({ error: 'Impossible de créer la catégorie' });
  }
});

// DELETE /api/categories/blog/:id  → delete a blog category
router.delete('/blog/:id', verifyToken, async (req, res) => {
  const catId = parseInt(req.params.id, 10);
  if (Number.isNaN(catId)) {
    return res.status(400).json({ error: 'ID de catégorie invalide.' });
  }
  try {
    // If blog_category row is in use by any blog_post, you may need to decide:
    // – either disallow deletion if blog_post.category_id references it,
    // – or set those blog_post.category_id = NULL first.
    await pool.query(`DELETE FROM public.blog_category WHERE id = $1`, [catId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/categories/blog/:id', err);
    res.status(500).json({ error: 'Impossible de supprimer la catégorie' });
  }
});

module.exports = router;
