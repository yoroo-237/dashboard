// backend/node_server/routes/blog.js
const express = require('express');
const pool    = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { uploadToSupabaseStorage } = require('../utils/supabase');
const router  = express.Router();

/**
 * GET /api/blogs
 * On renvoie pour chaque article :
 *  - blog_post.id, title, excerpt, to_char(created_at…), image, image_caption, author, content, likes, comments_count, reading_time
 *  - c.name AS category_name
 *  - ARRAY_REMOVE(ARRAY_AGG(t.name), NULL) AS tags
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        bp.id,
        bp.title,
        bp.excerpt,
        to_char(bp.created_at, 'YYYY-MM-DD"T"HH24:MI:SSZ') AS date,
        bp.image ,
        bp.image_caption    AS imageCaption,
        bp.author,
        bp.content,
        bc.name            AS category,
        bp.likes,
        bp.comments_count  AS comments,
        bp.reading_time    AS readingTime,
        COALESCE(
          ARRAY_REMOVE(ARRAY_AGG(t.name), NULL),
          ARRAY[]::text[]
        ) AS tags
      FROM public.blog_post bp
      LEFT JOIN public.blog_category bc ON bp.category_id = bc.id
      LEFT JOIN public.post_tag pt        ON bp.id = pt.post_id
      LEFT JOIN public.tag t              ON pt.tag_id = t.id
      GROUP BY bp.id, bc.name
      ORDER BY bp.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/blogs error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des articles' });
  }
});


/**
 * POST /api/blogs
 * Body attendu (multipart/form-data):
 *   - title            (string)
 *   - excerpt          (string)
 *   - image            (file ou URL)
 *   - image_caption    (string)          [optionnel]
 *   - author           (string)
 *   - content          (string)
 *   - category_id      (integer)
 *   - likes            (integer)         [optionnel]
 *   - comments_count   (integer)         [optionnel]
 *   - reading_time     (integer)         [optionnel]
 *   - tags             (string JSON)     => ex: '["tag1","tag2"]'
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      title,
      excerpt,
      image_caption,
      author,
      content,
      category_id,
      likes,
      comments_count,
      reading_time,
      tags,
      image_url // Permet d'envoyer une URL depuis le front
    } = req.body;

    // tags est reçu comme “string JSON” => on transforme en tableau JavaScript  
    let tagsArray = [];
    try {
      tagsArray = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
    } catch (_) {
      tagsArray = [];
    }

    let finalImageUrl = image_url || '';
    // Si un fichier est envoyé (upload direct)
    if (req.files && req.files.image) {
      try {
        finalImageUrl = await uploadToSupabaseStorage(req.files.image, 'blog-images');
      } catch (e) {
        return res.status(500).json({ error: 'Erreur upload image Supabase', details: e.message });
      }
    }

    // ------------------------------------------------------------------
    // 2) Insérer d’abord dans blog_post
    // ------------------------------------------------------------------
    const insertBlogSql = `
      INSERT INTO public.blog_post (
        title, excerpt, image, image_caption,
        author, content, category_id,
        likes, comments_count, reading_time
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const { rows } = await pool.query(insertBlogSql, [
      title, excerpt, finalImageUrl, image_caption,
      author, content, category_id,
      likes, comments_count, reading_time
    ]);
    const blog = rows[0];

    // ------------------------------------------------------------------
    // 3) Pour chaque tag reçu (tagsArray contient des noms de tags),
    //    on récupère l’ID dans `tag`. Si le tag n’existe pas encore,
    //    on le crée d’abord, puis on récupère son ID.
    // ------------------------------------------------------------------
    for (let tagName of tagsArray) {
      tagName = String(tagName).trim();
      if (!tagName) continue;
      //  a) vérifier si ce tag existe déjà
      let tagRow = await pool.query(`SELECT id FROM public.tag WHERE name = $1`, [tagName]);
      let tagId;
      if (tagRow.rows.length > 0) {
        tagId = tagRow.rows[0].id;
      } else {
        // insérer un nouveau tag
        const insertTag = await pool.query(
          `INSERT INTO public.tag(name) VALUES($1) RETURNING id`,
          [tagName]
        );
        tagId = insertTag.rows[0].id;
      }
      //  b) insérer dans post_tag
      await pool.query(
        `INSERT INTO public.post_tag(post_id, tag_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
        [blog.id, tagId]
      );
    }

    // ------------------------------------------------------------------
    // 4) Pour renvoyer l’article complet (avec tags et category), on refait
    //    la même requête que pour GET /api/blogs en filtrant sur newPost.id
    // ------------------------------------------------------------------
    const { rows: rows2 } = await pool.query(`
      SELECT
        bp.id,
        bp.title,
        bp.excerpt,
        to_char(bp.created_at, 'YYYY-MM-DD"T"HH24:MI:SSZ') AS date,
        bp.image,
        bp.image_caption    AS imageCaption,
        bp.author,
        bp.content,
        bc.name            AS category,
        bp.likes,
        bp.comments_count  AS comments,
        bp.reading_time    AS readingTime,
        COALESCE(
          ARRAY_REMOVE(ARRAY_AGG(t.name), NULL),
          ARRAY[]::text[]
        ) AS tags
      FROM public.blog_post bp
      LEFT JOIN public.blog_category bc    ON bp.category_id = bc.id
      LEFT JOIN public.post_tag pt         ON bp.id = pt.post_id
      LEFT JOIN public.tag t               ON pt.tag_id = t.id
      WHERE bp.id = $1
      GROUP BY bp.id, bc.name
    `, [ blog.id ]);

    res.status(201).json(rows2[0]);
  } catch (err) {
    console.error('POST /api/blogs error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l’article' });
  }
});


/**
 * PUT /api/blogs/:id
 * Même logique que POST, mais on met à jour le blog_post existant + suppression/recréation des post_tag.
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1) Récupérer les champs du FormData
    const {
      title,
      excerpt,
      image_caption,
      author,
      content,
      category_id,
      likes,
      comments_count,
      reading_time,
      tags
    } = req.body;

    // Convertir tags JSON → tableau de noms
    let tagsArray = [];
    try {
      tagsArray = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
    } catch (_) {
      tagsArray = [];
    }
    const imagePath = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '';

    // 2) Mettre à jour blog_post
    const updateSql = `
      UPDATE public.blog_post SET
        title          = $1,
        excerpt        = $2,
        ${ imagePath ? 'image = $3,' : '' }
        image_caption  = $${ imagePath ? '4' : '3' },
        author         = $${ imagePath ? '5' : '4' },
        content        = $${ imagePath ? '6' : '5' },
        category_id    = $${ imagePath ? '7' : '6' },
        likes          = $${ imagePath ? '8' : '7' },
        comments_count = $${ imagePath ? '9' : '8' },
        reading_time   = $${ imagePath ? '10' : '9' }
      WHERE id = $${ imagePath ? '11' : '10' }
      RETURNING id;
    `;
    // Construire tableau de valeurs selon imagePath
    const vals = [];
    vals.push(title);
    vals.push(excerpt);
    if (imagePath) vals.push(imagePath);
    vals.push(image_caption || null);
    vals.push(author);
    vals.push(content);
    vals.push(category_id ? parseInt(category_id, 10) : null);
    vals.push(likes ? parseInt(likes, 10) : 0);
    vals.push(comments_count ? parseInt(comments_count, 10) : 0);
    vals.push(reading_time ? parseInt(reading_time, 10) : 0);
    vals.push(parseInt(id, 10));

    await pool.query(updateSql, vals);

    // 3) Supprimer d’abord toutes les lignes existantes dans post_tag pour ce post
    await pool.query(`DELETE FROM public.post_tag WHERE post_id = $1`, [id]);

    // 4) Réinsérer chaque tag de tagsArray (mêmes logiques que POST)
    for (let tagName of tagsArray) {
      tagName = String(tagName).trim();
      if (!tagName) continue;
      // voir si ce tag existe
      let tagRow = await pool.query(`SELECT id FROM public.tag WHERE name = $1`, [tagName]);
      let tagId;
      if (tagRow.rows.length > 0) {
        tagId = tagRow.rows[0].id;
      } else {
        const insertTag = await pool.query(
          `INSERT INTO public.tag(name) VALUES($1) RETURNING id`,
          [tagName]
        );
        tagId = insertTag.rows[0].id;
      }
      await pool.query(
        `INSERT INTO public.post_tag(post_id, tag_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
        [id, tagId]
      );
    }

    // 5) Reprendre la même requête que pour GET/:id afin de retourner l’article complet
    const { rows } = await pool.query(`
      SELECT
        bp.id,
        bp.title,
        bp.excerpt,
        to_char(bp.created_at, 'YYYY-MM-DD"T"HH24:MI:SSZ') AS date,
        bp.image,
        bp.image_caption    AS imageCaption,
        bp.author,
        bp.content,
        bc.name            AS category,
        bp.likes,
        bp.comments_count  AS comments,
        bp.reading_time    AS readingTime,
        COALESCE(
          ARRAY_REMOVE(ARRAY_AGG(t.name), NULL),
          ARRAY[]::text[]
        ) AS tags
      FROM public.blog_post bp
      LEFT JOIN public.blog_category bc    ON bp.category_id = bc.id
      LEFT JOIN public.post_tag pt         ON bp.id = pt.post_id
      LEFT JOIN public.tag t               ON pt.tag_id = t.id
      WHERE bp.id = $1
      GROUP BY bp.id, bc.name
    `, [ parseInt(id, 10) ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/blogs error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l’article' });
  }
});


/**
 * DELETE /api/blogs/:id
 * Supprime un article (cascade supprime dans post_tag grâce à ON DELETE CASCADE)
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM public.blog_post WHERE id = $1`, [ parseInt(id, 10) ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/blogs error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

module.exports = router;
