// Backend/node_server/routes/products.js
const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');

const router = express.Router();

// Multer config: stocke dans /uploads et conserve l'extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// GET all products
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id, p.name, p.price, p.description,
        p.image      AS image_url,
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

// CREATE product (multipart/form-data pour l'image)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const {
      name, price, description = '',
      category_id, rating, stock, featured = false
    } = req.body;

    // validations...
    if (!name)      return res.status(400).json({ error:'name requis' });
    if (!category_id) return res.status(400).json({ error:'category_id requis' });

    // URL de l’image
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '';

    const { rows } = await pool.query(`
      INSERT INTO public.product
        (name, price, description, image, category_id, rating, stock, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [name, price, description, image_url, category_id, rating, stock, featured]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
});
router.put('/:id', verifyToken, upload.single('avatar'), async (req, res) => {
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
// UPDATE product
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, price, description = '',
      category_id, rating, stock, featured = false
    } = req.body;

    let image_url = req.body.image_url || '';
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const { rows } = await pool.query(`
      UPDATE public.product SET
        name=$1, price=$2, description=$3,
        image=$4, category_id=$5, rating=$6, stock=$7, featured=$8
      WHERE id=$9 RETURNING *
    `, [name,price,description,image_url,category_id,rating,stock,featured,id]);

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
