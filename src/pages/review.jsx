// Composant MediaCarousel réutilisable (comme dans products.jsx et blogs.jsx)
function MediaCarousel({ media = [] }) {
  const [current, setCurrent] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const intervalRef = useRef(null);

  const handleManual = (idx) => {
    setCurrent(idx);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  const handlePrevious = (e) => {
    e.stopPropagation();
    setCurrent(c => (c - 1 + media.length) % media.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrent(c => (c + 1) % media.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  useEffect(() => {
    if (!media.length || !isAutoplay) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % media.length);
    }, 3400);
    return () => clearInterval(intervalRef.current);
  }, [media, isAutoplay]);

  if (!media.length) return null;

  const boxStyle = {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    background: "#f5f5f5",
    borderRadius: "50%",
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
          <img src={m.url} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'50%'}} loading="lazy" />
        ) : (
          <img src={m.url} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'50%'}} loading="lazy" />
        )}
        {media.length > 1 && (
          <>
            <button onClick={handlePrevious} className="carousel-nav prev" style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.5)',color:'white',border:'none',borderRadius:'50%',width:24,height:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,opacity:0.7,transition:'opacity 0.2s'}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.7}>‹</button>
            <button onClick={handleNext} className="carousel-nav next" style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.5)',color:'white',border:'none',borderRadius:'50%',width:24,height:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,opacity:0.7,transition:'opacity 0.2s'}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.7}>›</button>
          </>
        )}
        {media.length > 1 && (
          <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.7)',color:'white',padding:'2px 8px',borderRadius:12,fontSize:10}}>
            {current + 1}/{media.length}
          </div>
        )}
      </div>
      {media.length > 1 && (
        <div className="carousel-dots" style={{margin:'8px 0'}}>
          {media.map((_,i) =>
            <span key={i} title={`Voir le média ${i+1}`} onClick={()=>handleManual(i)} style={{display:'inline-block',margin:'0 3px',width:current===i?10:8,height:current===i?10:8,background:current===i?'#4a90e2':'#ccc',borderRadius:'50%',cursor:'pointer',transition:'all 0.2s ease',transform:current===i?'scale(1.1)':'scale(1)'}} />
          )}
        </div>
      )}
    </div>
  );
}
// src/pages/Review.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import { uploadImageToSupabase } from '../services/supabaseUpload';
import './Pages.css';
const API_URL = process.env.REACT_APP_API_URL;

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    author: '',
    rating: '',
    text: '',
    date: '',
    avatarFile: null
  });
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef();

  // Récupérer la liste des avis au montage
  useEffect(() => {
    api.get(`${API_URL}/api/reviews`)
      .then(res => setReviews(res.data))
      .catch(() => toast.error('Impossible de charger les avis'));
  }, []);

  // Mise à jour du formulaire au changement de champ
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Gérer l’upload de fichier
  const handleFile = e => {
    const file = e.target.files[0];
    if (file) setForm(f => ({ ...f, avatarFile: file }));
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({
      author: '',
      rating: '',
      text: '',
      date: '',
      avatarFile: null
    });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Convertir la note en étoiles
  const renderStars = rawRating => {
    const r = Number(rawRating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (r >= i) stars.push(<FaStar key={i} />);
      else if (r >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
      else stars.push(<FaRegStar key={i} />);
    }
    return stars;
  };

  // Soumettre le formulaire (POST ou PUT)
  const handleSubmit = async e => {
    e.preventDefault();

    // Validation basique
    if (form.author.trim() === '' || form.text.trim() === '' || form.rating === '') {
      return toast.warn('Auteur, note et texte sont obligatoires.');
    }
    const numRating = parseFloat(form.rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) {
      return toast.warn('La note doit être un nombre entre 0 et 5.');
    }
    try {
      let avatarUrl = form.avatar;
      if (form.avatarFile) {
        avatarUrl = await uploadImageToSupabase(form.avatarFile, 'review-avatars');
      }
      const reviewData = {
        author: form.author.trim(),
        rating: numRating,
        text: form.text.trim(),
        date: form.date && form.date.trim() !== '' ? form.date : undefined,
        avatar: avatarUrl
      };
      let res;
      if (editingId) {
        res = await api.put(`${API_URL}/api/reviews/${editingId}`, reviewData);
        toast.success('Avis mis à jour !');
        setReviews(rs => rs.map(r => (r.id === editingId ? res.data : r)));
      } else {
        res = await api.post(`${API_URL}/api/reviews`, reviewData);
        toast.success('Avis publié !');
        setReviews(rs => [res.data, ...rs]);
      }
      resetForm();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(editingId ? 'Erreur mise à jour' : 'Erreur publication');
    }
  };

  // Préremplir le formulaire pour édition
  const startEdit = r => {
    setForm({
      author: r.author,
      rating: String(r.rating),
      text: r.text,
      date: r.date,
      avatarFile: null
    });
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Supprimer un avis existant
  const handleDelete = async id => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    try {
      await api.delete(`${API_URL}/api/reviews/${id}`);
      setReviews(rs => rs.filter(r => r.id !== id));
      toast.success('Avis supprimé !');
    } catch {
      toast.error('Impossible de supprimer l’avis');
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      <h2 className="section-title">
        {editingId ? 'Modifier un avis' : 'Ajouter un avis'}
      </h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        {/* Auteur */}
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

        {/* Note */}
        <div className="form-group">
          <label htmlFor="rating">Note (0–5)</label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.5"
            required
            value={form.rating}
            onChange={handleChange}
          />
        </div>

        {/* Date (optionnel) */}
        <div className="form-group">
          <label htmlFor="date">Date (optionnel)</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        {/* Texte de l’avis */}
        <div className="form-group full-width">
          <label htmlFor="text">Avis</label>
          <textarea
            id="text"
            name="text"
            rows="4"
            required
            value={form.text}
            onChange={handleChange}
          />
        </div>

        {/* Upload Avatar */}
        <div className="form-group full-width file-upload">
          <label htmlFor="avatar">Avatar (image)</label>
          <button
            type="button"
            className="btn-upload full-width"
            onClick={() => fileInputRef.current.click()}
          >
            <FiUpload /> Choisir une image
          </button>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFile}
          />
          {form.avatarFile && (
            <div className="image-preview full-width">
              <img
                src={URL.createObjectURL(form.avatarFile)}
                alt="aperçu avatar"
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Bouton Soumettre */}
        <div className="form-group full-width">
          <button type="submit" className="btn-primary full-width">
            {editingId ? 'Enregistrer' : 'Publier'}
          </button>
        </div>
      </form>

      <h2 className="section-title">Liste des avis ({reviews.length})</h2>
      <div className="grid">
        {reviews.map(r => {
          const numericRating = Number(r.rating);
          return (
            <div key={r.id} className="card enhanced">
              {/* Affichage avatar via MediaCarousel (support multi-images) */}
              {r.media && Array.isArray(r.media) && r.media.length > 0 ? (
                <MediaCarousel media={r.media} />
              ) : r.avatar ? (
                <img src={r.avatar} className="card-img" alt={`${r.author} – avatar`} />
              ) : null}
              <div className="card-body">
                <h3 className="card-title-center">{r.author}</h3>
                <p className="meta">
                  {r.date} •{' '}
                  <span className="rating-stars">
                    {renderStars(numericRating)}
                  </span>{' '}
                  <strong>({numericRating.toFixed(1)})</strong>
                </p>
                <p className="small">{r.text}</p>
              </div>
              <div className="card-actions">
                <button
                  onClick={() => startEdit(r)}
                  className="btn-icon"
                >
                  <FiEdit2 /> Modifier
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="btn-icon delete"
                >
                  <FiTrash2 /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
