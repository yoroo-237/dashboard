import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPassword({ theme, setTheme }) {
const [telegramId,setTelegramId]=useState('');
  const handleSubmit=async e=>{
    e.preventDefault();
    const res=await fetch('/api/password/forgot-telegram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telegramId})});
    const data=await res.json();
    res.ok?toast.success(data.message):toast.error(data.error);
  };
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1 className="text-4xl font-bold text-center mb-6 text-accent">Récupération Telegram</h1>
      <input
        placeholder="Votre Telegram ID"
        value={telegramId}
        onChange={e=>setTelegramId(e.target.value)}
        required
      />
      <button type="submit" className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition">
        Envoyer lien Telegram
      </button>
      <ThemeToggle theme="light" setTheme={()=>{}}/>
    </form>
  );
}
