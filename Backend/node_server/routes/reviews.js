// backend/node_server/routes/reviews.js
const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');
const { uploadToSupabaseStorage } = require('../utils/supabase');

const router = express.Router();

/**
 * GET /api/reviews
 * Renvoie la liste de tous les avis, triés par id (asc)
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        author,
        avatar,
        rating,
        text,
        to_char(date, 'YYYY-MM-DD') AS date
      FROM public.review
      ORDER BY id;
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/reviews error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des avis' });
  }
});

/**
 * POST /api/reviews
 * Crée un nouvel avis. Champ "avatar" en multipart/form-data.
 * Body attendu (FormData) :
 *  - author (string)
 *  - rating (number)
 *  - text (string)
 *  - date  (optionnel ; si absent, DEFAULT CURRENT_DATE s’applique)
 *  - avatar (fichier image ou URL)
 */
router.post('/', async (req, res) => {
  try {
    const {
      author, rating, text, date, avatar_url // Permet d'envoyer une URL depuis le front
    } = req.body;

    let finalAvatarUrl = avatar_url || '';
    // Si un fichier est envoyé (upload direct)
    if (req.files && req.files.avatar) {
      try {
        finalAvatarUrl = await uploadToSupabaseStorage(req.files.avatar, 'review-avatars');
      } catch (e) {
        return res.status(500).json({ error: 'Erreur upload avatar Supabase', details: e.message });
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO public.review (author, avatar, rating, text, date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [author, finalAvatarUrl, rating, text, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'avis' });
  }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    await pool.query(`DELETE FROM public.review WHERE id=$1`, [reviewId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/reviews/:id error:', err);
    res.status(500).json({ error: 'Impossible de supprimer l’avis' });
  }
});
module.exports = router;
