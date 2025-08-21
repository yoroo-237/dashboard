// Backend/node_server/routes/products.js
const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');

const multer = require('multer');
const upload = multer();
const { uploadToSupabaseStorage } = require('../utils/supabase');

const router = express.Router();

// GET all products (retourne le champ media)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id, p.name, p.price, p.description,
        p.media, -- tableau JSON [{url,type}]
        p.rating, p.stock, p.featured,
        c.id   AS category_id,
        c.name AS category_name
      FROM public.product p
      LEFT JOIN public.category c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement' });
  }
});

// CREATE product (multipart/form-data pour les médias)
router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const {
      name, price, description = '',
      category_id, rating, stock, featured = false,
      existingMedia // JSON.stringify([{url,type}]) depuis le front (pour édition)
    } = req.body;

    if (!name)      return res.status(400).json({ error:'name requis' });
    if (!category_id) return res.status(400).json({ error:'category_id requis' });

    // Gestion des médias (upload Supabase + concat existants)
    let mediaArray = [];
    // 1. Upload des nouveaux fichiers
    if (req.files && req.files.mediaFiles) {
      const files = Array.isArray(req.files.mediaFiles) ? req.files.mediaFiles : [req.files.mediaFiles];
      for (const file of files) {
        const url = await uploadToSupabaseStorage(file, 'product-images');
        mediaArray.push({ url, type: file.mimetype });
      }
    }
    // 2. Ajouter les médias existants (si édition)
    if (existingMedia) {
      try {
        const existing = JSON.parse(existingMedia);
        mediaArray = mediaArray.concat(existing);
      } catch {}
    }

    const { rows } = await pool.query(`
      INSERT INTO public.product
        (name, price, description, media, category_id, rating, stock, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [name, price, description, JSON.stringify(mediaArray), category_id, rating, stock, featured]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du produit' });
  }
});
// UPDATE product (multipart/form-data pour les médias)
router.put('/:id', verifyToken, upload.any(), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const { author, rating, text, date } = req.body;
    const numRating = parseFloat(rating);
    if (!author || isNaN(numRating) || numRating < 0 || numRating > 5 || !text) {
      return res.status(400).json({ error: 'Champs manquants ou invalides' });
    }

    // Déterminer nouveau chemin avatar si uploadé
    let avatarPath = null;
    if (req.file) {
      avatarPath = `/uploads/${req.file.filename}`;
    }

    // On met à jour uniquement le champ avatar s’il a été fourni
    let query, params;
    if (avatarPath) {
      query = `
        UPDATE public.review
        SET author=$1, avatar=$2, rating=$3, text=$4, date=COALESCE($5, date)
        WHERE id=$6
        RETURNING id, author, avatar, rating, text, to_char(date, 'YYYY-MM-DD') AS date
      `;
      params = [author.trim(), avatarPath, numRating, text.trim(), date || null, reviewId];
    } else {
      // On ne change pas l’avatar existant
      query = `
        UPDATE public.review
        SET author=$1, rating=$2, text=$3, date=COALESCE($4, date)
        WHERE id=$5
        RETURNING id, author, avatar, rating, text, to_char(date, 'YYYY-MM-DD') AS date
      `;
      params = [author.trim(), numRating, text.trim(), date || null, reviewId];
    }

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/reviews/:id error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l’avis' });
  }
});
// UPDATE product (multipart/form-data pour les médias)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, price, description = '',
      category_id, rating, stock, featured = false,
      existingMedia // JSON.stringify([{url,type}]) depuis le front (pour édition)
    } = req.body;

    // Gestion des médias (upload Supabase + concat existants)
    let mediaArray = [];
    if (req.files && req.files.mediaFiles) {
      const files = Array.isArray(req.files.mediaFiles) ? req.files.mediaFiles : [req.files.mediaFiles];
      for (const file of files) {
        const url = await uploadToSupabaseStorage(file, 'product-images');
        mediaArray.push({ url, type: file.mimetype });
      }
    }
    if (existingMedia) {
      try {
        const existing = JSON.parse(existingMedia);
        mediaArray = mediaArray.concat(existing);
      } catch {}
    }

    const { rows } = await pool.query(`
      UPDATE public.product SET
        name=$1, price=$2, description=$3,
        media=$4, category_id=$5, rating=$6, stock=$7, featured=$8
      WHERE id=$9 RETURNING *
    `, [name,price,description,JSON.stringify(mediaArray),category_id,rating,stock,featured,id]);

    if (!rows[0]) return res.status(404).json({ error:'Produit non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE product
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM public.product WHERE id=$1', [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error:'Non trouvé' });
    res.json({ message:'Supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Erreur serveur lors de la suppression' });
  }
});

module.exports = router;
