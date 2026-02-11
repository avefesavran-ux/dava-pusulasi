
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface ProfileComponentProps {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

const ProfileComponent: React.FC<ProfileComponentProps> = ({ user, setUser, onLogout, onOpenLogin }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaved, setIsSaved] = useState(false);

  // Sync internal state if external user object changes (e.g. login/logout)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 reveal">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h2 className="text-4xl font-serif italic text-slate-900 mb-6">Oturum Açılmadı</h2>
        <p className="text-slate-500 font-light mb-12">Profil detaylarınızı görmek ve kişisel kütüphanenize erişmek için lütfen giriş yapın.</p>
        <button 
          onClick={onOpenLogin}
          className="px-10 py-5 bg-[#C5A059] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-[#C5A059]/20 hover:bg-slate-900 transition-all duration-500"
        >
          Giriş Ekranına Git
        </button>
      </div>
    );
  }

  const handleSave = () => {
    setUser({
      ...user,
      name: name,
      email: email
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getInitials = (n: string) => {
    if (!n || n.trim() === '') return '?';
    const cleanName = n.replace(/^Av\.\s+/i, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 reveal">
      <div className="text-center">
        <div className="w-32 h-32 rounded-full bg-slate-900 border-[6px] border-white shadow-2xl flex items-center justify-center text-white font-serif italic text-4xl font-bold mx-auto mb-10 ring-1 ring-slate-100 overflow-hidden">
          {getInitials(name)}
        </div>
        <h2 className="text-5xl font-serif italic text-slate-900 mb-2">{name || 'İsim Belirtilmedi'}</h2>
        <p className="text-[10px] uppercase tracking-[0.5em] font-black text-[#C5A059]">{user.role}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="luxury-card p-10 rounded-[3rem] bg-white">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-8">Hesap Bilgileri</h4>
          <div className="space-y-8">
            <div className="group">
              <label className="text-[9px] uppercase font-bold text-slate-400 mb-2 block group-focus-within:text-[#C5A059] transition-colors">Meslektaş Ad Soyad</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Av. Efe Savran"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-light focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 focus:bg-white transition-all placeholder:text-slate-200"
              />
            </div>
            
            <div className="group">
              <label className="text-[9px] uppercase font-bold text-slate-400 mb-2 block group-focus-within:text-[#C5A059] transition-colors">E-Posta Adresi</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meslektas@hukuk.com"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 font-light focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 focus:bg-white transition-all placeholder:text-slate-200"
              />
              <p className="text-[9px] text-slate-300 mt-2 font-light italic">Bildirimler ve rapor çıktıları için kullanın.</p>
            </div>

            <button 
              onClick={handleSave}
              className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-500 active:scale-95 ${
                isSaved 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-900 text-white hover:bg-[#C5A059]'
              }`}
            >
              {isSaved ? 'Değişiklikler Kaydedildi' : 'Bilgileri Güncelle'}
            </button>
          </div>
        </div>

        <div className="luxury-card p-10 rounded-[3rem] bg-white">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-8">Üyelik Özeti</h4>
          <div className="space-y-8">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Üyelik Tipi</p>
              <p className="text-slate-900 font-light">Standart Avukat Planı</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Hesap Statüsü</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                <p className="text-slate-900 font-light">Aktif</p>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059] mb-4">Güvenlik</h4>
              <button className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600 font-light flex justify-between items-center group">
                <span>Şifre Değiştir</span>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-[#C5A059] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button 
                onClick={onLogout}
                className="w-full text-left p-4 rounded-xl hover:bg-red-50 transition-all text-sm text-red-500 font-bold flex justify-between items-center group mt-2"
              >
                <span>Sistemden Güvenli Çıkış</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;
