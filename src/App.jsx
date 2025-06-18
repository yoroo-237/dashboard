// src/App.jsx

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import AuthContainer  from './pages/AuthContainer';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword  from './pages/resetPassword';
import Toast          from './components/Toast';
import Layout         from './components/Layout';
import AdminRoute     from './components/AdminRoute';

import Users          from './pages/users';
import Products       from './pages/products';
import Blogs          from './pages/blogs';
import Statistics     from './pages/statistics';
import Review         from './pages/review';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const isAdmin = localStorage.getItem('is_admin') === 'true';

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/signup"
          element={<AuthContainer mode="signup" theme={theme} setTheme={setTheme} />}
        />
        <Route
          path="/login"
          element={<AuthContainer mode="login" theme={theme} setTheme={setTheme} />}
        />
        <Route path="/forgot" element={<ForgotPassword theme={theme} />} />
        <Route path="/reset-password" element={<ResetPassword theme={theme} />} />

        <Route path="/home" element={<Layout theme={theme} setTheme={setTheme} isAdmin={isAdmin} />}>
          <Route index element={<Navigate to="products" replace />} />

          {/* ouverts à tous */}
          <Route path="products"   element={<Products />} />
          <Route path="blogs"      element={<Blogs />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="reviews"    element={<Review />} />

          {/* réservé aux admins */}
          <Route
            path="users"
            element={
              <AdminRoute isAdmin={isAdmin}>
                <Users />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}
