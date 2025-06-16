// src/services/api.js
// src/services/api.js

import axios from 'axios';

// Base URL du back-end (définie dans .env.local ou fallback sur localhost:5000)
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Intercepteur pour ajouter automatiquement le token JWT si présent
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================================
   AUTHENTIFICATION (JSON)
   ================================ */

export const signup = data =>
  api.post('/api/auth/signup', data);

export const login = data =>
  api.post('/api/auth/login', data);

/* ================================
   UTILISATEURS (JSON)
   ================================ */

// Récupérer les utilisateurs en attente
export const fetchPendingUsers = () =>
  api.get('/api/users/pending');

// Récupérer **tous** les utilisateurs
export const fetchAllUsers = () =>
  api.get('/api/users');

// Valider une inscription (PUT /api/users/validate/:id)
export const validateUser = id =>
  api.put(`/api/users/validate/${id}`);

// Rejeter (supprimer) une inscription
export const rejectUser = id =>
  api.delete(`/api/users/${id}`);

// Supprimer un utilisateur (depuis "Tous les utilisateurs")
export const deleteUser = id =>
  api.delete(`/api/users/${id}`);

// Récupérer l’activité d’un utilisateur
export const fetchUserActivity = id =>
  api.get(`/api/users/${id}/activity`);

// Mettre à jour un utilisateur (PATCH /api/users/:id)
export const updateUser = (id, data) =>
  api.patch(`/api/users/${id}`, data);

/* ================================
   PRODUITS (mix JSON + FormData)
   ================================ */

// 1) Récupérer la liste des produits
export const fetchProducts = () =>
  api.get('/api/products');

// 2) Ajouter un produit (FormData : inclut image, etc.)
export const addProduct = formData =>
  api.post('/api/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// 3) Mettre à jour un produit (FormData)
export const updateProduct = (id, formData) =>
  api.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// 4) Supprimer un produit
export const deleteProduct = id =>
  api.delete(`/api/products/${id}`);

// 5) Catégories de produits
export const fetchCategoriesProduct = () =>
  api.get('/api/categories/product');

export const addCategoryProduct = data =>
  api.post('/api/categories/product', data);

export const deleteCategoryProduct = id =>
  api.delete(`/api/categories/product/${id}`);

/* ================================
   BLOGS / ARTICLES (mix JSON + FormData)
   ================================ */

// 1) Récupérer tous les articles
export const fetchBlogs = () =>
  api.get('/api/blogs');

// 2) Ajouter un nouvel article (FormData)
export const addBlog = formData =>
  api.post('/api/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// 3) Mettre à jour un article (FormData)
export const updateBlog = (id, formData) =>
  api.put(`/api/blogs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// 4) Supprimer un article
export const deleteBlog = id =>
  api.delete(`/api/blogs/${id}`);

// 5) Catégories de blog
export const fetchCategoriesBlog = () =>
  api.get('/api/categories/blog');

export const addCategoryBlog = data =>
  api.post('/api/categories/blog', data);

export const deleteCategoryBlog = id =>
  api.delete(`/api/categories/blog/${id}`);

// 6) Tags
export const fetchTags = () =>
  api.get('/api/tags');

export const addTag = data =>
  api.post('/api/tags', data);

export const deleteTag = id =>
  api.delete(`/api/tags/${id}`);

/* ================================
   STATS & AUDIT (JSON)
   ================================ */

export const fetchStats = () =>
  api.get('/api/stats');

export const fetchAudit = () =>
  api.get('/api/audit');
export const fetchReviews = () =>
  api.get('/api/reviews')

// → CRÉER un nouvel avis
export const addReview = data =>
  // Ici, data sera un FormData, donc on n’utilise pas fetchJSON (qui force JSON).
  // On peut utiliser axios directement ou fetch en multipart/form-data :
  api.post('/api/reviews', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

/* ================================
   UTILITAIRES / EXPORT PAR DÉFAUT
   ================================ */

export default api;
