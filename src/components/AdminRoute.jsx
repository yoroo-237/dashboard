import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ isAdmin, children }) {
  return isAdmin
    ? children
    : <Navigate to="/home/products" replace />; 
}
