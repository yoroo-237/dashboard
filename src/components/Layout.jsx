// src/components/Layout.jsx
import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import TabBar from './TabBar';

export default function Layout({ theme, setTheme, isAdmin }) {
  const { pathname } = useLocation();

  return (
    <div className="layout">
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: 'var(--form-bg1)',
        borderBottom: '1px solid var(--form-border)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <img className='image' src="https://framerusercontent.com/images/2xfRRBJJsxBMq1pROrYTs4iA0.png" alt="Logo" width={100} />
          <h1  style={{ color:'var(--accent1)' }}>Admin Dashboard</h1>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <main className="content">
        <Outlet />
      </main>

      {/* TabBar affichée pour tous les admin/non-admin */}
            <TabBar isAdmin={isAdmin} />

    </div>
  );
}
