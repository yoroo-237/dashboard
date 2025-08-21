// src/pages/Blog.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiUpload, FiClock } from 'react-icons/fi';
import './Pages.css';
import { uploadImageToSupabase } from '../services/supabaseUpload';
const API_URL = process.env.REACT_APP_API_URL;

export default function Blog() {
  const [blogs, setBlogs]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [tagsList, setTagsList]       = useState([]);

  // Utilisé pour scroller vers le haut quand on édite
  const fileInputRef = useRef();

  // ID de l’article en cours d’édition (ou null si nouveau)
  const [editingId, setEditingId]     = useState(null);

  // État du formulaire
  const [form, setForm] = useState({
    title: '',
    author: '',
    category_id: '',
    newCategory: '',
    tags: [],       // contient un array d’IDs (string) de tags sélectionnés
    newTag: '',
    excerpt: '',
    content: '',
    imageFile: null,    // le File object sélectionné
    imageCaption: '',
    readingTime: '',
    likes: 0,
    commentsCount: 0
  });


  // → Au montage, on charge catégories, tags et articles
  useEffect(() => {
    api.get(`${API_URL}/api/categories/blog`)
      .then(r => setCategories(r.data))
      .catch(() => toast.error('Impossible de charger les catégories'));

    api.get(`${API_URL}/api/tags`)
      .then(r => setTagsList(r.data))
      .catch(() => toast.error('Impossible de charger les tags'));

    api.get(`${API_URL}/api/blogs`)
      .then(r => setBlogs(r.data))
      .catch(() => toast.error('Impossible de charger les articles'));
  }, []);


  // Met à jour n’importe quel champ du formulaire (texte, numérique, select…)
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // -------------------------------------------------------------
  // 1) GESTION DES CATÉGORIES
  // -------------------------------------------------------------
  const addCategory = async () => {
    const name = form.newCategory.trim();
    if (!name) return toast.warn('Le nom de la catégorie est requis');
    try {
      await api.post(`${API_URL}/api/categories/blog`, { name });
      const { data } = await api.get(`${API_URL}/api/categories/blog`);
      setCategories(data);
      toast.success('Catégorie ajoutée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l’ajout de la catégorie');
    } finally {
      setForm(f => ({ ...f, newCategory: '' }));
    }
  };

  const deleteCategory = async (catId) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`${API_URL}/api/categories/blog/${catId}`);
      setCategories(cs => cs.filter(c => c.id !== catId));
      toast.success('Catégorie supprimée');
      // Si c’était la catégorie actuellement sélectionnée
      setForm(f => ({
        ...f,
        category_id: f.category_id === String(catId) ? '' : f.category_id
      }));
    } catch (err) {
      console.error(err);
      toast.error('Impossible de supprimer la catégorie');
    }
  };

  // -------------------------------------------------------------
  // 2) GESTION DES TAGS (table “tag”)
  // -------------------------------------------------------------
  const addTagToList = async () => {
    const name = form.newTag.trim();
    if (!name) return toast.warn('Le nom du tag est requis');
    try {
      const { data } = await api.post(`${API_URL}/api/tags`, { name });
      // On l’insère en tête de liste
      setTagsList(ts => [data, ...ts]);
      toast.success('Tag ajouté');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l’ajout du tag');
    } finally {
      setForm(f => ({ ...f, newTag: '' }));
    }
  };

  const deleteTagOnList = async (tagId) => {
    if (!window.confirm('Supprimer ce tag définitivement ?')) return;
    try {
      await api.delete(`${API_URL}/api/tags/${tagId}`);
      setTagsList(ts => ts.filter(t => t.id !== tagId));
      toast.success('Tag supprimé');
      // Si ce tag était sélectionné dans le formulaire, on le retire
      setForm(f => ({
        ...f,
        tags: f.tags.filter(tid => tid !== String(tagId))
      }));
    } catch (err) {
      console.error(err);
      toast.error('Impossible de supprimer le tag');
    }
  };

  // Sélection d’un tag existant dans <select> → on ajoute l’ID à form.tags
  const selectTag = e => {
    const tagId = e.target.value; // c’est une string
    if (tagId && !form.tags.includes(tagId)) {
      setForm(f => ({ ...f, tags: [...f.tags, tagId] }));
    }
  };

  // Retirer du formulaire (sans toucher à la base) : retire un ID de form.tags
  const removeTagFromForm = (tagId) => {
    setForm(f => ({
      ...f,
      tags: f.tags.filter(tid => tid !== tagId)
    }));
  };

  // -------------------------------------------------------------
  // 3) GESTION DE L’IMAGE (Multer a mis le File dans req.file)
  // -------------------------------------------------------------
  const handleFile = e => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, imageFile: file }));
    }
  };

  // Utilise la fonction utilitaire partagée pour uploader sur Supabase
  // (déjà importée en haut)
// Composant MediaCarousel réutilisable (comme dans products.jsx)
function MediaCarousel({ media = [] }) {
  const [current, setCurrent] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const intervalRef = useRef(null);

  const handleManual = useCallback((idx) => {
    setCurrent(idx);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  }, []);

  const handlePrevious = useCallback((e) => {
    e.stopPropagation();
    setCurrent(c => (c - 1 + media.length) % media.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  }, [media.length]);

  const handleNext = useCallback((e) => {
    e.stopPropagation();
    setCurrent(c => (c + 1) % media.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  }, [media.length]);

  useEffect(() => {
    if (!media.length || !isAutoplay) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % media.length);
    }, 3400);
    return () => clearInterval(intervalRef.current);
  }, [media, isAutoplay]);

  if (!media.length) return null;

  const boxStyle = {
    width: "300px",
    height: "220px",
    objectFit: "cover",
    background: "#f5f5f5",
    borderRadius: "12px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  };
  const m = media[current];
  return (
    <div className="carousel-box" style={{textAlign:'center'}}>
      <div style={boxStyle}>
        {m.type && m.type.startsWith('image') ? (
          <img src={m.url} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'12px'}} loading="lazy" />
        ) : m.type && m.type.startsWith('video') ? (
          <video src={m.url} controls style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'12px'}} preload="metadata" />
        ) : (
          <img src={m.url} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'12px'}} loading="lazy" />
        )}
        {media.length > 1 && (
          <>
            <button onClick={handlePrevious} className="carousel-nav prev" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.5)',color:'white',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,opacity:0.7,transition:'opacity 0.2s'}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.7}>‹</button>
            <button onClick={handleNext} className="carousel-nav next" style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.5)',color:'white',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,opacity:0.7,transition:'opacity 0.2s'}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.7}>›</button>
          </>
        )}
        {media.length > 1 && (
          <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.7)',color:'white',padding:'2px 8px',borderRadius:12,fontSize:12}}>
            {current + 1}/{media.length}
          </div>
        )}
      </div>
      {media.length > 1 && (
        <div className="carousel-dots" style={{margin:'8px 0'}}>
          {media.map((_,i) =>
            <span key={i} title={`Voir le média ${i+1}`} onClick={()=>handleManual(i)} style={{display:'inline-block',margin:'0 3px',width:current===i?12:10,height:current===i?12:10,background:current===i?'#4a90e2':'#ccc',borderRadius:'50%',cursor:'pointer',transition:'all 0.2s ease',transform:current===i?'scale(1.1)':'scale(1)'}} />
          )}
        </div>
      )}
    </div>
  );
}

  // -------------------------------------------------------------
  // 4) RÉINITIALISER LE FORMULAIRE
  // -------------------------------------------------------------
  const resetForm = () => {
    setForm({
      title: '',
      author: '',
      category_id: '',
      newCategory: '',
      tags: [],
      newTag: '',
      excerpt: '',
      content: '',
      imageFile: null,
      imageCaption: '',
      readingTime: '',
      likes: 0,
      commentsCount: 0
    });
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // 5) SOUMISSION DU FORMULAIRE (CREATION OU MISE À JOUR)
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = form.image;
      if (form.imageFile) {
        imageUrl = await uploadImageToSupabase(form.imageFile);
      }
      // Préparer FormData ou objet simple
      const blogData = {
        title: form.title,
        excerpt: form.excerpt,
        image_caption: form.imageCaption || '',
        author: form.author,
        content: form.content,
        category_id: form.category_id || '',
        likes: form.likes || 0,
        comments_count: form.commentsCount || 0,
        reading_time: form.readingTime || 0,
        tags: form.tags.map(tid => {
          const obj = tagsList.find(x => String(x.id) === String(tid));
          return obj ? obj.name : null;
        }).filter(x => x !== null),
        image: imageUrl
      };
      let res;
      if (editingId) {
        res = await api.put(`${API_URL}/api/blogs/${editingId}`, blogData);
        toast.success('Article mis à jour !');
        setBlogs(bs => bs.map(b => (b.id === editingId ? res.data : b)));
      } else {
        res = await api.post(`${API_URL}/api/blogs`, blogData);
        toast.success('Article publié !');
        setBlogs(bs => [res.data, ...bs]);
      }
      resetForm();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(editingId ? 'Erreur mise à jour' : 'Erreur publication');
    }
  };

  // -------------------------------------------------------------
  // 6) PRÉREMPLIR LE FORMULAIRE POUR ÉDITION
  // -------------------------------------------------------------
  const startEdit = (b) => {
    setForm({
      title: b.title,
      author: b.author,
      category_id: b.category ? String(
        categories.find(c => c.name === b.category)?.id
      ) : '',
      newCategory: '',
      tags: (b.tags || []).map(tagName => {
        // convertir nom → ID si possible
        const found = tagsList.find(t => t.name === tagName);
        return found ? String(found.id) : '';
      }).filter(x => x !== ''),
      newTag: '',
      excerpt: b.excerpt,
      content: b.content,
      imageFile: null,
      imageCaption: b.imageCaption || '',
      readingTime: b.readingTime ? String(b.readingTime) : '',
      likes: b.likes || 0,
      commentsCount: b.comments || 0
    });
    setEditingId(b.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // 7) SUPPRIMER UN ARTICLE
  // -------------------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
      await api.delete(`${API_URL}/api/blogs/${id}`);
      setBlogs(bs => bs.filter(x => x.id !== id));
      toast.success('Article supprimé');
    } catch {
      toast.error('Impossible de supprimer');
    }
  };

  // -------------------------------------------------------------
  // 8) RENDU JSX COMPLET
  // -------------------------------------------------------------
  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      <h2 className="section-title">
        {editingId ? 'Modifier Article' : 'Ajouter Article'}
      </h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        {/* ── TITRE ── */}
        <div className="form-group">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
          />
        </div>

        {/* ── AUTEUR ── */}
        <div className="form-group">
          <label htmlFor="author">Auteur</label>
          <input
            id="author"
            name="author"
            type="text"
            required
            value={form.author}
            onChange={handleChange}
          />
        </div>

        {/* ── CATÉGORIE + BOUTON SUPPRIMER ── */}
        <div className="form-group">
          <label>Catégorie</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              name="category_id"
              required
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">Sélectionner…</option>
              {categories.map(cat => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
            {form.category_id && (
              <button
                type="button"
                className="btn-icon delete"
                onClick={() => deleteCategory(parseInt(form.category_id, 10))}
                style={{ marginLeft: '0.5rem' }}
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        </div>

        {/* ── NOUVELLE CATÉGORIE ── */}
        <div className="form-group">
          <label htmlFor="newCategory">Nouvelle catégorie</label>
          <div className="combo">
            <input
              id="newCategory"
              name="newCategory"
              type="text"
              placeholder="Nom de la catégorie"
              value={form.newCategory}
              onChange={handleChange}
            />
            <button
              type="button"
              className="btn-small"
              onClick={addCategory}
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* ── TAGS (sélection) ── */}
        <div className="form-group">
          <label>Tags existants</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select onChange={selectTag} defaultValue="">
              <option value="">…</option>
              {tagsList.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {/* Afficher “chips” des tags sélectionnés */}
          <div className="tag-chips">
            {form.tags.map((tid, idx) => {
              const obj = tagsList.find(x => String(x.id) === tid);
              const name = obj ? obj.name : tid;
              return (
                <span key={`chip-${tid}-${idx}`} className="tag-chip">
                  {name}
                  <button
                    type="button"
                    onClick={() => removeTagFromForm(tid)}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── NOUVEAU TAG ── */}
        <div className="form-group">
          <label htmlFor="newTag">Nouveau tag</label>
          <div className="combo">
            <input
              id="newTag"
              name="newTag"
              type="text"
              placeholder="Nom du tag"
              value={form.newTag}
              onChange={handleChange}
            />
            <button
              type="button"
              className="btn-small"
              onClick={addTagToList}
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* ── SUPPRIMER LES TAGS DANS tagsList ── */}
        <div className="form-group full-width">
          <label>Liste complète des tags</label>
          <div className="grid-tags">
            {tagsList.map(t => (
              <div key={t.id} className="tag-row">
                <span>{t.name}</span>
                <button
                  type="button"
                  className="btn-icon delete small"
                  onClick={() => deleteTagOnList(t.id)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── EXCERPT ── */}
        <div className="form-group full-width">
          <label htmlFor="excerpt">Extrait</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows="2"
            required
            value={form.excerpt}
            onChange={handleChange}
          />
        </div>

        {/* ── CONTENU ── */}
        <div className="form-group full-width">
          <label htmlFor="content">Contenu complet</label>
          <textarea
            id="content"
            name="content"
            rows="6"
            required
            value={form.content}
            onChange={handleChange}
          />
        </div>

        {/* ── TEMPS DE LECTURE ── */}
        <div className="form-group">
          <label htmlFor="readingTime">Temps de lecture (min)</label>
          <input
            id="readingTime"
            name="readingTime"
            type="number"
            min="1"
            required
            value={form.readingTime}
            onChange={handleChange}
          />
        </div>

        {/* ── LIKES & COMMENTS COUNT ── */}
        <div className="form-group">
          <label htmlFor="likes">Likes</label>
          <input
            id="likes"
            name="likes"
            type="number"
            min="0"
            value={form.likes}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="commentsCount">Nombre de commentaires</label>
          <input
            id="commentsCount"
            name="commentsCount"
            type="number"
            min="0"
            value={form.commentsCount}
            onChange={handleChange}
          />
        </div>

        {/* ── IMAGE + IMAGE CAPTION ── */}
        <div className="form-group">
          <label htmlFor="imageCaption">Légende de l’image</label>
          <input
            id="imageCaption"
            name="imageCaption"
            type="text"
            placeholder="Texte sous l’image"
            value={form.imageCaption}
            onChange={handleChange}
          />
        </div>
        <div className="form-group full-width file-upload">
          <label>Image de l’article</label>
          <button
            type="button"
            className="btn-upload full-width"
            onClick={() => fileInputRef.current.click()}
          >
            <FiUpload /> Choisir une image
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {form.imageFile && (
            <div className="image-preview full-width">
              <img
                src={URL.createObjectURL(form.imageFile)}
                alt="aperçu"
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}
        </div>

        {/* ── BOUTON SUBMIT ── */}
        <div className="form-group full-width">
          <button type="submit" className="btn-primary full-width">
            {editingId ? 'Enregistrer' : 'Publier'}
          </button>
        </div>
      </form>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Liste des articles (Cartes) */}
      <h2 className="section-title">Articles ({blogs.length})</h2>
      <div className="grid">
        {blogs.map(b => (
          <div key={b.id} className="card enhanced">
            {/* Affichage image/article via MediaCarousel (support multi-images) */}
            {b.media && Array.isArray(b.media) && b.media.length > 0 ? (
              <MediaCarousel media={b.media} />
            ) : b.image ? (
              <img src={b.image} className="card-img" alt={b.title} />
            ) : null}
            <div className="card-body">
              <h3 className="card-title-center">{b.title}</h3>
              <p className="meta">
                {b.category} • {b.author} •{' '}
                <time dateTime={b.date}>
                  {new Date(b.date).toLocaleString()}
                </time>{' '}
                • <FiClock /> {b.readingTime} min
              </p>
              <div className="tags">
                {(b.tags || []).map((tn, idx) => (
                  <span
                    key={`badge-${b.id}-${tn}-${idx}`}
                    className="badge badge-tag"
                  >
                    {tn}
                  </span>
                ))}
              </div>
              <p className="small">{b.excerpt}</p>
            </div>
            <div className="card-actions">
              <button onClick={() => startEdit(b)} className="btn-icon">
                <FiEdit2 /> Modifier
              </button>
              <button onClick={() => handleDelete(b.id)} className="btn-icon delete">
                <FiTrash2 /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
