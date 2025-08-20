import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiUpload, FiX, FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import './Pages.css';
import { uploadImageToSupabase } from '../services/supabaseUpload';
const API_URL = process.env.REACT_APP_API_URL;

// Carousel component for images and videos
function MediaCarousel({ media = [] }) {
  const [current, setCurrent] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!media.length || !isAutoplay) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % media.length);
    }, 3400);
    return () => clearInterval(intervalRef.current);
  }, [media, isAutoplay]);

  if (!media.length) return null;

  const handleManual = useCallback((idx) => {
    setCurrent(idx);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000); // Resume autoplay after 5s
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

  // Max size normalization (responsive)
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
        {m.type.startsWith('image') ? (
          <img 
            src={m.url} 
            alt="" 
            style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'12px'}} 
            loading="lazy"
          />
        ) : (
          <video 
            src={m.url} 
            controls 
            style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover', borderRadius:'12px'}} 
            preload="metadata"
          />
        )}
        
        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="carousel-nav prev"
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.7}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="carousel-nav next"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.7}
            >
              ›
            </button>
          </>
        )}
        
        {/* Media counter */}
        {media.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 12
          }}>
            {current + 1}/{media.length}
          </div>
        )}
      </div>
      
      {/* Dots */}
      {media.length > 1 && (
        <div className="carousel-dots" style={{margin:'8px 0'}}>
          {media.map((_,i) =>
            <span
              key={i}
              title={`Voir le média ${i+1}`}
              onClick={()=>handleManual(i)}
              style={{
                display:'inline-block',
                margin:'0 3px',
                width: current === i ? 12 : 10,
                height: current === i ? 12 : 10,
                background: current===i?'#4a90e2':'#ccc',
                borderRadius:'50%',
                cursor:'pointer',
                transition: 'all 0.2s ease',
                transform: current === i ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Search and Filter component
function ProductFilters({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories, 
  sortBy, 
  setSortBy,
  viewMode,
  setViewMode,
  showFeaturedOnly,
  setShowFeaturedOnly
}) {
  return (
    <div className="filters-container" style={{
      background: '#f8f9fa',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center'
    }}>
      {/* Search */}
      <div style={{ position: 'relative', minWidth: '200px', flex: '1' }}>
        <FiSearch style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#666'
        }} />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            paddingLeft: '40px',
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px'
          }}
        />
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiFilter />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
        >
          <option value="">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
      >
        <option value="name">Nom A-Z</option>
        <option value="name-desc">Nom Z-A</option>
        <option value="price">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
        <option value="rating">Note croissante</option>
        <option value="rating-desc">Note décroissante</option>
        <option value="stock">Stock croissant</option>
        <option value="stock-desc">Stock décroissant</option>
      </select>

      {/* Featured filter */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showFeaturedOnly}
          onChange={e => setShowFeaturedOnly(e.target.checked)}
        />
        Produits en avant seulement
      </label>

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setViewMode('grid')}
          className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
          title="Vue grille"
        >
          <FiGrid />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
          title="Vue liste"
        >
          <FiList />
        </button>
      </div>
    </div>
  );
}

export default function Product() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    rating: '',
    stock: '',
    category: '',
    newCategory: '',
    mediaFiles: [], // For new uploads (array of File)
    mediaPreview: [], // For local preview before upload [{url, type}]
    featured: false,
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [existingMedia, setExistingMedia] = useState([]); // For editing, [{url,type}]
  const [mediaToRemove, setMediaToRemove] = useState([]); // For editing, to delete
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  // Formatter currency
  const fmtUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format;

  // Load categories and products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          api.get(`${API_URL}/api/categories/product`),
          api.get(`${API_URL}/api/products`)
        ]);
        
        setCategories(categoriesRes.data);
        setProducts(
          productsRes.data.map(p => ({
            ...p,
            rating: Number(p.rating),
            media: Array.isArray(p.media) ? p.media : [], // [{url, type}]
          }))
        );
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = !selectedCategory || product.category_id == selectedCategory;
      
      // Featured filter
      const matchesFeatured = !showFeaturedOnly || product.featured;
      
      return matchesSearch && matchesCategory && matchesFeatured;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'rating':
          return a.rating - b.rating;
        case 'rating-desc':
          return b.rating - a.rating;
        case 'stock':
          return Number(a.stock) - Number(b.stock);
        case 'stock-desc':
          return Number(b.stock) - Number(a.stock);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, showFeaturedOnly]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = 'Le nom est requis';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Prix invalide';
    if (!form.stock || Number(form.stock) < 0) newErrors.stock = 'Stock invalide';
    if (!form.rating || Number(form.rating) < 0 || Number(form.rating) > 5) {
      newErrors.rating = 'Note entre 0 et 5 requise';
    }
    if (!form.category) newErrors.category = 'Catégorie requise';
    if (!form.description.trim()) newErrors.description = 'Description requise';
    
    // Media validation
    const totalMedia = existingMedia.length + form.mediaFiles.length;
    if (totalMedia > 6) newErrors.media = 'Maximum 6 médias autorisés';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, existingMedia]);

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // File handler for multiple images/videos with validation
  const handleFile = useCallback((e) => {
    const files = Array.from(e.target.files);
    
    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'video/'];
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: fichier trop volumineux (max 10MB)`);
      } else if (!allowedTypes.some(type => file.type.startsWith(type))) {
        invalidFiles.push(`${file.name}: type non supporté`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`Fichiers invalides:\n${invalidFiles.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      const totalAfterAdd = existingMedia.length + form.mediaFiles.length + validFiles.length;
      if (totalAfterAdd > 6) {
        toast.warn('Maximum 6 médias autorisés');
        return;
      }
      
      const previews = validFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name
      }));
      
      setForm(f => ({
        ...f,
        mediaFiles: [...f.mediaFiles, ...validFiles],
        mediaPreview: [...f.mediaPreview, ...previews]
      }));
    }
  }, [existingMedia, form.mediaFiles]);

  // Remove preview before upload
  const removeMediaPreview = useCallback((idx) => {
    setForm(f => {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(f.mediaPreview[idx].url);
      return {
        ...f,
        mediaFiles: f.mediaFiles.filter((_,i)=>i!==idx),
        mediaPreview: f.mediaPreview.filter((_,i)=>i!==idx)
      };
    });
  }, []);

  // Remove existing media (when editing)
  const removeExistingMedia = useCallback((idx) => {
    setMediaToRemove(arr => [...arr, existingMedia[idx]]);
    setExistingMedia(arr => arr.filter((_,i)=>i!==idx));
  }, [existingMedia]);

  const resetForm = useCallback(() => {
    // Clean up object URLs
    form.mediaPreview.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
    
    setForm({
      name: '',
      price: '',
      rating: '',
      stock: '',
      category: '',
      newCategory: '',
      mediaFiles: [],
      mediaPreview: [],
      description: '',
      featured: false
    });
    setExistingMedia([]);
    setMediaToRemove([]);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form.mediaPreview]);

  const addCategory = async () => {
    const name = form.newCategory.trim();
    if (!name) return toast.warn("Nom de catégorie vide");
    
    try {
      setLoading(true);
      await api.post(`${API_URL}/api/categories/product`, { name });
      const { data } = await api.get(`${API_URL}/api/categories/product`);
      setCategories(data);
      toast.success("Catégorie ajoutée avec succès");
      setForm(f => ({ ...f, newCategory: '' }));
    } catch (error) {
      console.error('Add category error:', error);
      toast.error("Erreur lors de la création de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ? Les produits associés perdront leur catégorie.')) return;
    
    try {
      setLoading(true);
      await api.delete(`${API_URL}/api/categories/product/${id}`);
      setCategories(cs => cs.filter(c => c.id !== id));
      // Update form if current category is deleted
      if (form.category == id) {
        setForm(f => ({ ...f, category: '' }));
      }
      toast.success('Catégorie supprimée');
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('Impossible de supprimer la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload all files (images/videos) in parallel
      let uploadedMedia = [];
      if (form.mediaFiles.length) {
        toast.info('Upload des médias en cours...');
        uploadedMedia = await Promise.all(form.mediaFiles.map(async file => {
          const url = await uploadImageToSupabase(file, 'product-media');
          return { url, type: file.type };
        }));
      }
      
      // For editing, keep existing media except those marked for removal
      let finalMedia = [...existingMedia, ...uploadedMedia];
      
      const productData = {
        name: form.name.trim(),
        price: Number(form.price),
        rating: Number(form.rating),
        stock: Number(form.stock),
        category_id: form.category,
        featured: form.featured,
        description: form.description.trim(),
        media: finalMedia
      };
      
      let res;
      if (editingId) {
        res = await api.put(`${API_URL}/api/products/${editingId}`, {
          ...productData,
          removeMedia: mediaToRemove
        });
        toast.success('Produit mis à jour avec succès !');
        setProducts(p => p.map(x => 
          x.id === editingId ? { ...res.data, media: res.data.media || [] } : x
        ));
      } else {
        res = await api.post(`${API_URL}/api/products`, productData);
        toast.success('Produit ajouté avec succès !');
        setProducts(p => [{ ...res.data, media: res.data.media || [] }, ...p]);
      }
      
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erreur lors de l'enregistrement du produit');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = useCallback((rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i)            stars.push(<FaStar key={i} style={{color: '#ffd700'}}/>);
      else if (rating >= i - .5)  stars.push(<FaStarHalfAlt key={i} style={{color: '#ffd700'}}/>);
      else                        stars.push(<FaRegStar key={i} style={{color: '#ddd'}}/>);
    }
    return stars;
  }, []);

  const startEdit = useCallback((product) => {
    setForm({
      name: product.name,
      price: product.price,
      rating: product.rating,
      stock: product.stock,
      category: product.category_id || '',
      newCategory: '',
      mediaFiles: [],
      mediaPreview: [],
      description: product.description,
      featured: !!product.featured
    });
    setExistingMedia(product.media || []);
    setMediaToRemove([]);
    setErrors({});
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ce produit ?")) return;
    
    try {
      setLoading(true);
      await api.delete(`${API_URL}/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produit supprimé avec succès !');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !products.length) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      <h2 className="section-title">
        {editingId ? 'Modifier Produit' : 'Ajouter Produit'}
      </h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        {/* Nom */}
        <div className="form-group">
          <label htmlFor="name">Nom du produit *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* Prix */}
        <div className="form-group">
          <label htmlFor="price">Prix (USD) *</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={handleChange}
            className={errors.price ? 'error' : ''}
          />
          {errors.price && <span className="error-text">{errors.price}</span>}
        </div>

        {/* Stock */}
        <div className="form-group">
          <label htmlFor="stock">Stock *</label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            value={form.stock}
            onChange={handleChange}
            className={errors.stock ? 'error' : ''}
          />
          {errors.stock && <span className="error-text">{errors.stock}</span>}
        </div>

        {/* Note */}
        <div className="form-group">
          <label htmlFor="rating">Note (0–5) *</label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            required
            value={form.rating}
            onChange={handleChange}
            className={errors.rating ? 'error' : ''}
          />
          {errors.rating && <span className="error-text">{errors.rating}</span>}
        </div>

        {/* Catégorie */}
        <div className="form-group">
          <label htmlFor="category">Catégorie *</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Sélectionner...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Bouton de suppression à côté du menu déroulant */}
            {form.category && (
              <button 
                type="button"
                className="btn-icon delete" 
                onClick={() => deleteCategory(form.category)}
                disabled={loading}
                title="Supprimer cette catégorie"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
          {errors.category && <span className="error-text">{errors.category}</span>}
        </div>

        {/* Nouvelle catégorie */}
        <div className="form-group">
          <label>Nouvelle catégorie</label>
          <div className="combo">
            <input 
              name="newCategory" 
              placeholder="Nom de la catégorie..." 
              value={form.newCategory} 
              onChange={handleChange}
              disabled={loading}
            />
            <button 
              type="button" 
              className="btn-small" 
              onClick={addCategory}
              disabled={loading || !form.newCategory.trim()}
            >
              <FiPlus/>
            </button>
          </div>
        </div>

        {/* Upload images/videos */}
        <div className="form-group full-width file-upload">
          <label>Médias du produit (images/vidéos, max 6)</label>
          <button
            type="button"
            className="btn-upload full-width"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <FiUpload /> Ajouter images/vidéos ({existingMedia.length + form.mediaFiles.length}/6)
          </button>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFile}
            ref={fileInputRef}
            style={{ display: 'none' }}
            disabled={loading}
          />
          
          {errors.media && <span className="error-text">{errors.media}</span>}
          
          {/* Preview for new files */}
          {form.mediaPreview.length > 0 && (
            <div>
              <h4 style={{margin: '12px 0 8px', fontSize: '14px', color: '#666'}}>Nouveaux médias:</h4>
              <div className="media-preview-row" style={{display:"flex", gap:12, flexWrap: 'wrap'}}>
                {form.mediaPreview.map((m, idx) => (
                  <div key={idx} style={{position:'relative', width:90,height:66, background:'#fff',borderRadius:7,overflow:'hidden',border:'1px solid #eee'}}>
                    {m.type.startsWith('image') ? (
                      <img src={m.url} alt={m.name} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover'}} />
                    ) : (
                      <video src={m.url} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover'}} />
                    )}
                    <button
                      type="button"
                      className="btn-icon"
                      title="Supprimer"
                      style={{position:'absolute',top:2,right:2,background:'rgba(255,255,255,0.9)',borderRadius:4, padding:2, fontSize: 12}}
                      onClick={()=>removeMediaPreview(idx)}
                      disabled={loading}
                    ><FiX/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Existing media for editing */}
          {existingMedia.length > 0 && (
            <div>
              <h4 style={{margin: '12px 0 8px', fontSize: '14px', color: '#666'}}>Médias existants:</h4>
              <div className="media-preview-row" style={{display:"flex", gap:12, flexWrap: 'wrap'}}>
                {existingMedia.map((m, idx) => (
                  <div key={idx} style={{position:'relative', width:90, height:66, background:'#fff',borderRadius:7,overflow:'hidden',border:'1px solid #eee'}}>
                    {m.type.startsWith('image') ? (
                      <img src={m.url} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover'}} />
                    ) : (
                      <video src={m.url} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'cover'}} />
                    )}
                    <button
                      type="button"
                      className="btn-icon"
                      title="Supprimer média existant"
                      style={{position:'absolute',top:2,right:2,background:'rgba(255,255,255,0.9)',borderRadius:4, padding:2, fontSize: 12}}
                      onClick={()=>removeExistingMedia(idx)}
                      disabled={loading}
                    ><FiX/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-group full-width">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            required
            value={form.description}
            onChange={handleChange}
            className={errors.description ? 'error' : ''}
            placeholder="Décrivez votre produit..."
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
          <small style={{color: '#666', fontSize: '12px'}}>
            {form.description.length}/500 caractères
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="featured" style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
            <input
              id="featured"
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              disabled={loading}
            /> 
            <span>Produit en avant (Featured)</span>
          </label>
          <small style={{color: '#666', fontSize: '12px'}}>
            Les produits en avant sont mis en évidence dans la boutique
          </small>
        </div>

        {/* Submit */}
        <div className="form-group full-width">
          <button 
            type="submit" 
            className="btn-primary full-width"
            disabled={loading}
            style={{opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Enregistrement...' : (editingId ? 'Enregistrer les modifications' : 'Ajouter le produit')}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="btn-small" 
              style={{marginLeft:8}} 
              onClick={resetForm}
              disabled={loading}
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Filters and search */}
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showFeaturedOnly={showFeaturedOnly}
        setShowFeaturedOnly={setShowFeaturedOnly}
      />

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
        <h2 className="section-title" style={{margin: 0}}>
          Produits ({filteredProducts.length})
        </h2>
        
        {/* Quick stats */}
        <div style={{fontSize: '14px', color: '#666', display: 'flex', gap: '1rem'}}>
          <span>Total: {products.length}</span>
          <span>En stock: {products.filter(p => p.stock > 0).length}</span>
          <span>Rupture: {products.filter(p => p.stock === 0).length}</span>
          <span>En avant: {products.filter(p => p.featured).length}</span>
        </div>
      </div>

      {/* Products display */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          color: '#666'
        }}>
          {searchTerm || selectedCategory || showFeaturedOnly ? 
            'Aucun produit ne correspond aux critères de recherche.' :
            'Aucun produit ajouté pour le moment.'
          }
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid' : 'list-view'}>
          {filteredProducts.map(p => (
            <div key={p.id} className={`card enhanced ${viewMode === 'list' ? 'card-list' : ''} ${p.featured ? 'featured-product' : ''}`}>
              {/* Stock status indicator */}
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: p.stock > 0 ? '#28a745' : '#dc3545',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 1
              }}>
                {p.stock > 0 ? `${p.stock} en stock` : 'Rupture'}
              </div>

              {/* Featured indicator */}
              {p.featured && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#ffd700',
                  color: '#333',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 1
                }}>
                  ⭐ Featured
                </div>
              )}

              {/* Carousel for multiple media */}
              {Array.isArray(p.media) && p.media.length > 0 && (
                <MediaCarousel media={p.media.map(m => ({
                  ...m,
                  url: m.url.startsWith('http')
                    ? m.url
                    : `${API_URL || ''}${m.url}`
                }))}/>
              )}
              
              <div className="card-body">
                <h3 className="card-title-center">{p.name}</h3>
                <p className="price" style={{fontSize: '1.2em', fontWeight: 'bold', color: '#28a745'}}>
                  {fmtUSD(p.price)}
                </p>
                
                <div className="rating" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <div style={{display: 'flex'}}>
                    {renderStars(p.rating)}
                  </div>
                  <span style={{fontSize: '14px', color: '#666'}}>({p.rating})</span>
                </div>
                
                <div style={{margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span className={`stock ${p.stock === 0 ? 'out-of-stock' : ''}`}>
                    Stock: <strong style={{color: p.stock > 0 ? '#28a745' : '#dc3545'}}>
                      {p.stock === 0 ? 'Épuisé' : p.stock}
                    </strong>
                  </span>
                  
                  {/* Category badge */}
                  {p.category_name && (
                    <span style={{
                      background: '#e9ecef',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#495057'
                    }}>
                      {p.category_name}
                    </span>
                  )}
                </div>
                
                <p className="small" style={{
                  color: '#666',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {p.description}
                </p>
              </div>
              
              <div className="card-actions" style={{padding: '1rem', borderTop: '1px solid #eee'}}>
                <button
                  onClick={() => startEdit(p)}
                  className="btn-icon"
                  disabled={loading}
                  title="Modifier ce produit"
                  style={{background: '#007bff', color: 'white'}}
                >
                  <FiEdit2 /> Modifier
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="btn-icon delete"
                  disabled={loading}
                  title="Supprimer ce produit"
                  style={{background: '#dc3545', color: 'white'}}
                >
                  <FiTrash2 /> Supprimer
                </button>
                
                {/* Additional quick actions */}
                <div style={{marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <small style={{color: '#666'}}>
                    {p.media?.length || 0} média{(p.media?.length || 0) > 1 ? 's' : ''}
                  </small>
                  {p.updated_at && (
                    <small style={{color: '#666'}} title={`Mis à jour: ${new Date(p.updated_at).toLocaleString()}`}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </small>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scroll to top button */}
      {filteredProducts.length > 6 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            fontSize: '18px'
          }}
          title="Retour en haut"
        >
          ↑
        </button>
      )}
    </div>
  );
}