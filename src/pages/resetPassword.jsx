import React, { useState,useEffect } from 'react';
import { useSearchParams,useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ThemeToggle from '../components/ThemeToggle';

export default function ResetPassword() {
  const [search]=useSearchParams();
  const token=search.get('token');
  const nav=useNavigate();
  const [pw,setPw]=useState('');

  useEffect(()=>{ if(!token) nav('/forgot'); },[token,nav]);

  const handleSubmit=async e=>{
    e.preventDefault();
    const res=await fetch('/api/password/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,newPassword:pw})});
    const data=await res.json();
    if(res.ok){toast.success(data.message);setTimeout(()=>nav('/login'),1500);}
    else toast.error(data.error);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1 className="text-4xl font-bold text-center mb-6 text-accent">Réinitialiser mot de passe</h1>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={pw}
        onChange={e=>setPw(e.target.value)}
        required
      />
      <button type="submit" className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition">
        Réinitialiser
      </button>
      <ThemeToggle theme="light" setTheme={()=>{}}/>
    </form>
  );
}
