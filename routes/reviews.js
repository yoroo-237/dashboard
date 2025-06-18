// backend/node_server/routes/reviews.js
const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');

// 1) Configuration de multer pour stocker les avatars dans /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Préfixe timestamp + nom d’origine pour éviter collision
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

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
 *  - avatar (fichier image)
 */
router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const {
      author,
      rating,
      text,
      // date peut être transmis (YYYY-MM-DD) ou absent
      date
    } = req.body;

    if (!author || author.trim() === '') {
      return res.status(400).json({ error: 'Le champ "author" est requis.' });
    }
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Le champ "text" est requis.' });
    }
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) {
      return res.status(400).json({ error: 'Le champ "rating" doit être un nombre entre 0 et 5.' });
    }

    // Construire le chemin de l’avatar stocké
    let avatarPath = null;
    if (req.file) {
      // On sert les uploads via express.static("/uploads")
      avatarPath = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '';
    }


    // Insertion en base
    const { rows } = await pool.query(
      `
      INSERT INTO public.review(
        author,
        avatar,
        rating,
        text,
        date
      ) VALUES ($1,$2,$3,$4, COALESCE($5, CURRENT_DATE))
      RETURNING
        id,
        author,
        avatar,
        rating,
        text,
        to_char(date, 'YYYY-MM-DD') AS date
      `,
      [author.trim(), avatarPath, numRating, text.trim(), date && date.trim() !== '' ? date : null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l’avis' });
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
