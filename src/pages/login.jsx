import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {FiUser, FiEye, FiEyeOff,FiPhone } from 'react-icons/fi';
import {  FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
const API_URL = process.env.REACT_APP_API_URL;

export default function Login({ toggle, theme, setTheme }) {
  const [form, setForm] = useState({ identifier:'', password:'' });
  const [search] = useSearchParams();
  const token=search.get('token');

  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  useEffect(()=>{
    if(token){
      localStorage.setItem('token',token);
      toast.success('Connecté via Telegram');
      navigate('/home');
    }
  },[token,navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      // après le fetch réussi…

      if (res.ok) {
        toast.success(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('is_admin', data.user.is_admin);
        console.log('🔐 is_admin flag:', data.user.is_admin);
        navigate('/home');
      } else if (res.status === 403) {
        toast.info(data.error);
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    }
  };
  const onTelegramAuth = async user => {
    const res = await fetch(`${API_URL}/api/auth/telegram`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(user)
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      toast.success(data.message);
      navigate('/dashboard');
    } else {
      toast.error(data.error);
    }
  };

  const isPhone = form.identifier.startsWith('+') || form.identifier.startsWith('6');
  // après le fetch réussi…

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="side-design left" />
      <div className="side-design right" />
      <div className="bg-bubble1" />
      <div className="bg-bubble2" />

      <form onSubmit={handleSubmit} className="form-container">
        <div className='image'>
          <img
            src="https://framerusercontent.com/images/2xfRRBJJsxBMq1pROrYTs4iA0.png"
            alt="Company Logo"
            className="navbar-logo"
          />
        </div>

        <h1 className="text-4xl font-bold text-center mb-6 text-accent">
          Connexion
        </h1>
        <div className="input-icon-wrapper">
          <input
            name="identifier"
            type="text"
            placeholder="Nom d’utilisateur ou +2376XXXXXXXX"
            value={form.identifier}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-transparent border border-gray-300 dark:border-gray-700 focus:outline-none"
            required
          />
          {isPhone ? (
            <FiPhone className="input-icon" />
          ) : (
            <FiUser className="input-icon" />
          )}
        </div>

        {/* Mot de passe */}
        <div className="input-icon-wrapper">
          <input
            name="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Mot de passe"
            onChange={handleChange}
            required
          />
          {showPwd
            ? <FiEyeOff className="input-icon" onClick={() => setShowPwd(false)} />
            : <FiEye    className="input-icon" onClick={() => setShowPwd(true)} />}
        </div>
        <div className='button'>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition"
          >
            Se connecter
          </button>
          {/* Google */}

        </div>


        {/* Footer liens */}
        <div className="form-footer text-sm">
          <Link to="/forgot" onClick={toggle} className='a'>Mot de passe oublié ?</Link>
          <Link to="/signup" onClick={toggle} className='a'>Pas encore de compte ? S’inscrire</Link>
        </div>

        {/* Réseaux sociaux */}
        <div className="social-links">
          <Link className='al' target="_blank" rel="noopener noreferrer">
            <FaTelegramPlane />
          </Link>
          <Link className='al' href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </Link>

        </div>

        <ThemeToggle theme={theme} setTheme={setTheme} />
      </form>
    </div>
  );
}
