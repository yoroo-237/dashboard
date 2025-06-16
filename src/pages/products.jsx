import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiUpload } from 'react-icons/fi';
import './Pages.css';

export default function Product() {
  const [products, setProducts] = useState([]);
  const handleChange1 = e => {
  const { name, value, type, checked } = e.target;
  setForm(f => ({
    ...f,
    [name]: type === 'checkbox' ? checked : value
  }));
};
  const [form, setForm] = useState({
    name: '',
    price: '',
    rating: '',
    stock: '',
    category: '',
    newCategory: '',
    imageFile: null,
    featured:false,
    description: ''
  });
    const fmtUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format;
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    // Charger catégories
    api.get('/api/categories/product') // Créer une route /api/categories si besoin
      .then(r=>setCategories(r.data))
      .catch(()=> toast.error('Impossible de charger catégories'));
    // Charger produits
    api.get('/api/products')
      .then(r=>setProducts(r.data))
      .catch(()=> toast.error('Impossible de charger produits'));
  }, []);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef();

  // Charger les produits existants
  useEffect(() => {
    api.get('/api/products')
      .then(r => setProducts(r.data.map(p => ({
        ...p,
        // forcer rating en nombre
        rating: Number(p.rating),
      }))))
      .catch(() => toast.error('Impossible de charger les produits'));
  }, []);

   const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f,
      [name]: name === 'category' ? value : value
    }));
  };

    const addCategory = async () => {
      const name = form.newCategory.trim();
      if (!name) return toast.warn("Nom vide");
      try {
        await api.post('/api/categories/product', { name });
        const { data } = await api.get('/api/categories/product');
        setCategories(data);
        toast.success("Catégorie ajoutée");
        setForm(f => ({ ...f, newCategory: '' }));
      } catch {
        toast.error("Erreur création catégorie");
      }
    };

  const handleFile = e => {
    const file = e.target.files[0];
    setForm(f => ({ ...f, imageFile: file }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      rating: '',
      stock: '',
      category: '',
      newCategory: '',
      imageFile: null,
      description: '',
      featured:false
    });
    fileInputRef.current.value = '';
    setEditingId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

  };
  const deleteCategory = async id => {
    if (!window.confirm('Supprimer cette catégorie ?')) return
    try {
      await api.delete(`/api/categories/product/${id}`)
      setCategories(cs => cs.filter(c => c.id !== id))
      toast.success('Catégorie supprimée')
    } catch {
      toast.error('Impossible de supprimer')
    }
  }
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name',        form.name);
      data.append('price',       form.price);
      data.append('rating',      form.rating);
      data.append('stock',       form.stock);
      data.append('category_id', form.category);
      data.append('featured', form.featured);
      data.append('description', form.description);
      if (form.imageFile) data.append('image', form.imageFile);

      let res;
      if (editingId) {
        res = await api.put(`/api/products/${editingId}`, data, {
          headers:{ 'Content-Type':'multipart/form-data' }
        });
        toast.success('Produit mis à jour !');
        setProducts(p=>p.map(x=> x.id===editingId ? res.data : x));
      } else {
        res = await api.post('/api/products', data, {
          headers:{ 'Content-Type':'multipart/form-data' }
        });
        toast.success('Produit ajouté !');
        setProducts(p => [res.data, ...p]);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l’envoi');
    }
  };

  const renderStars = rating => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i)            stars.push(<FaStar key={i}/>);
      else if (rating >= i - .5)  stars.push(<FaStarHalfAlt key={i}/>);
      else                         stars.push(<FaRegStar key={i}/>);
    }
    return stars;
  };
  const startEdit = product => {
    setForm({
      name: product.name,
      price: product.price,
      rating: product.rating,
      stock: product.stock,
      category: categories.find(c => c === product.category) || '',
      newCategory: '',
      imageFile: null,
      description: product.description
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

  };
  const handleDelete = async id => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produit supprimé !');
    } catch {
      toast.error('Erreur lors de la suppression !');
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      <h2 className="section-title">
        {editingId ? 'Modifier Produit' : 'Ajouter Produit'}
      </h2>

      <form className="form-grid" onSubmit={handleSubmit}>
        {/* Nom */}
        <div className="form-group">
          <label htmlFor="name">Nom du produit</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>

        {/* Prix */}
        <div className="form-group">
          <label htmlFor="price">Prix (USD)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            required
            value={form.price}
            onChange={handleChange}
          />
        </div>

        {/* Stock */}
        <div className="form-group">
          <label htmlFor="stock">Stock</label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            value={form.stock}
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
            step="0.1"
            required
            value={form.rating}
            onChange={handleChange}
          />
        </div>

        {/* Catégorie */}
        <div className="form-group">
          <label htmlFor="category">Catégorie</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
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
                className="btn-icon delete" 
                onClick={() => deleteCategory(form.category)}
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        </div>


        {/* Nouvelle catégorie */}
        <div className="form-group">
          <label>Nouvelle catégorie</label>
          <div className="combo">
            <input 
              name="newCategory" 
              placeholder="Nom…" 
              value={form.newCategory} 
              onChange={handleChange}
            />
            <button 
              type="button" 
              className="btn-small" 
              onClick={addCategory}
            ><FiPlus/></button>
          </div>
        </div>

        {/* Upload image */}
        <div className="form-group full-width file-upload">
          <label>Image du produit</label>
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
            onChange={handleFile}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          {form.imageFile && (
            <div className="image-preview full-width">
              <img src={URL.createObjectURL(form.imageFile)} style={{maxWidth:'100%'}} alt="" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-group full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            required
            value={form.description}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="featured">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange1}
            /> En avant (Featured)
          </label>
        </div>

        {/* Submit */}
        <div className="form-group full-width">
          <button type="submit" className="btn-primary full-width">
            {editingId ? 'Enregistrer' : 'Ajouter Produit'}
          </button>
        </div>
      </form>

      <h2 className="section-title">Produits ({products.length})</h2>
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card enhanced">
            {p.image_url && (
              <img
                src={p.image_url.startsWith('http')
                  ? p.image_url
                  : `http://localhost:5000${p.image_url}`}
                crossOrigin="anonymous"
                className="card-img"
                alt={p.name}
              />
            )}
            <div className="card-body">
              <h3 className="card-title-center">{p.name}</h3>
              {/* Remplacez ici la logique d’affichage d’étoiles si besoin */}
              <p className="price">{fmtUSD(p.price)}</p>
              <div className="rating">
                {renderStars(p.rating)}
                <span>{p.rating}</span>
              </div>
              <p className="stock">
                Stock : <strong>{p.stock}</strong>
              </p>
              <p className="small">{p.description}</p>
            </div>
            <div className="card-actions">
              <button
                onClick={() => startEdit(p)}
                className="btn-icon"
              >
                <FiEdit2 /> Modifier
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="btn-icon delete"
              >
                <FiTrash2 /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
);
}
