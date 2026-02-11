
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Start with blank profile to allow user to define themselves
    onLogin({
      name: "",
      role: "Meslektaş",
      email: email || ""
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-12 reveal luxury-card">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-serif italic text-slate-900 mb-2">Hoş Geldiniz</h3>
          <p className="text-sm text-slate-400 font-light">Lütfen mesleki hesabınızla giriş yapın.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">E-Posta</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="meslektas@hukuk.com"
              className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 transition-all font-light"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Parola</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 transition-all font-light"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-500 shadow-xl shadow-slate-900/10 active:scale-95"
          >
            Sisteme Giriş Yap
          </button>
        </form>

        <div className="mt-10 text-center">
          <button className="text-[10px] uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">Şifremi Unuttum</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
