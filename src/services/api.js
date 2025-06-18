// src/services/api.js

import axios from 'axios';

// Base URL du back-end (définie dans .env.local ou fallback sur votre URL Render)
const API = process.env.REACT_APP_API_URL || 'https://dashboard-backend-eydv.onrender.com/api';

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
  api.post('/auth/signup', data);

export const login = data =>
  api.post('/auth/login', data);

/* ================================
   UTILISATEURS (JSON)
   ================================ */

// Récupérer les utilisateurs en attente
export const fetchPendingUsers = () =>
  api.get('/users/pending');

// Récupérer **tous** les utilisateurs
export const fetchAllUsers = () =>
  api.get('/users');

// Valider une inscription (PUT /users/validate/:id)
export const validateUser = id =>
  api.put(`/users/validate/${id}`);

// Rejeter (supprimer) une inscription
export const rejectUser = id =>
  api.delete(`/users/${id}`);

// Supprimer un utilisateur (depuis "Tous les utilisateurs")
export const deleteUser = id =>
  api.delete(`/users/${id}`);

// Récupérer l’activité d’un utilisateur
export const fetchUserActivity = id =>
  api.get(`/users/${id}/activity`);

// Mettre à jour un utilisateur (PATCH /users/:id)
export const updateUser = (id, data) =>
  api.patch(`/users/${id}`, data);

/* ================================
   PRODUITS (mix JSON + FormData)
   ================================ */

export const fetchProducts = () =>
  api.get('/products');

export const addProduct = formData =>
  api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteProduct = id =>
  api.delete(`/products/${id}`);

/* ================================
   CATÉGORIES DE PRODUITS
   ================================ */

export const fetchCategoriesProduct = () =>
  api.get('/categories/product');

export const addCategoryProduct = data =>
  api.post('/categories/product', data);

export const deleteCategoryProduct = id =>
  api.delete(`/categories/product/${id}`);

/* ================================
   BLOGS / ARTICLES (mix JSON + FormData)
   ================================ */

export const fetchBlogs = () =>
  api.get('/blogs');

export const addBlog = formData =>
  api.post('/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateBlog = (id, formData) =>
  api.put(`/blogs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteBlog = id =>
  api.delete(`/blogs/${id}`);

/* ================================
   CATÉGORIES DE BLOG
   ================================ */

export const fetchCategoriesBlog = () =>
  api.get('/categories/blog');

export const addCategoryBlog = data =>
  api.post('/categories/blog', data);

export const deleteCategoryBlog = id =>
  api.delete(`/categories/blog/${id}`);

/* ================================
   TAGS
   ================================ */

export const fetchTags = () =>
  api.get('/tags');

export const addTag = data =>
  api.post('/tags', data);

export const deleteTag = id =>
  api.delete(`/tags/${id}`);

/* ================================
   STATS & AUDIT (JSON)
   ================================ */

export const fetchStats = () =>
  api.get('/stats');

export const fetchAudit = () =>
  api.get('/audit');

export const fetchReviews = () =>
  api.get('/reviews');

// → CRÉER un nouvel avis (FormData)
export const addReview = data =>
  api.post('/reviews', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export default api;
