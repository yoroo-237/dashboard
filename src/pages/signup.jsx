import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link }  from 'react-router-dom';
import { FiUser, FiPhone,FiEye, FiEyeOff } from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
const validatePassword = pw =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pw);

const validatePhone = phone =>
  /^6\d{8}$/.test(phone);
export default function Signup({ toggle, theme, setTheme }) {
  
  const [form, setForm] = useState({ username:'', phone:'' ,password:'', confirm:'' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm)
      return toast.error("Les mots de passe ne correspondent pas");
        if (!validatePassword(form.password)) {
      return toast.error('Mot de passe trop faible.');
    }
    // 3) Phone format
    if (!validatePhone(form.phone)) {
      return toast.error('Numéro de téléphone invalide.');
    }
    try {
      const res = await fetch('/api/auth/signup', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({  username: form.username, phone:form.phone,password: form.password })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setTimeout(toggle, 1200);
      } else toast.error(data.error||'Erreur');
    } catch {
      toast.error('Impossible de contacter le serveur');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="side-design left" />
      <div className="side-design right" />
      <div className="bg-bubble1" />
      <div className="bg-bubble2" />

      <form onSubmit={handleSubmit} className="form-container1">
              <div className='image'>
                  <img
                  src="https://framerusercontent.com/images/2xfRRBJJsxBMq1pROrYTs4iA0.png"
                  alt="Company Logo"
                  className="navbar-logo"
                />
              </div>
        <h1 className="text-4xl font-bold text-center mb-6 text-accent">
          Créer un compte
        </h1>

      
        <div className="input-icon-wrapper">
          <input
            name="username"
            placeholder="Nom d utilisateur"
            onChange={handleChange}
            required
          />
          <FiUser className="input-icon" />
        </div>
        {/* Phone */}
        <div className="input-icon-wrapper">
          <input
            name="phone"
            placeholder="Numéro Camerounais (ex. 6XXXXXXXX)"
            onChange={handleChange}
            required
          />
          <FiPhone className="input-icon" />
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

        {/* Confirmation */}
        <div className="input-icon-wrapper">
          <input
            name="confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirmer mot de passe"
            onChange={handleChange}
            required
          />
          {showConfirm
            ? <FiEyeOff className="input-icon" onClick={() => setShowConfirm(false)} />
            : <FiEye    className="input-icon" onClick={() => setShowConfirm(true)} />}
        </div>
        <div className='button'>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition"
          >
            S'inscrire
          </button>
        </div>


        {/* Footer lien vers login */}
        <div className="form-footer text-sm">
          <Link to="/login" className='a' onClick={toggle}>Déjà un compte ? Se connecter</Link>
        </div>

        {/* Liens réseaux sociaux */}
        <div className="social-links">
          <Link className='al' href="https://t.me/tonCompte" target="_blank" rel="noopener noreferrer">
            <FaTelegramPlane />
          </Link>
          <Link className='al' href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </Link>

        </div>

        {/* Theme toggle */}
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </form>
    </div>
  );
}
