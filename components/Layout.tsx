
import React, { useState, useEffect } from 'react';
import { AppTab, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  credits: { remaining: number; total: number };
  onOpenPricing: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, credits, onOpenPricing, user, onOpenLogin }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return '?';
    const cleanName = name.replace(/^Av\.\s+/i, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Section */}
      <div className={`p-8 pb-12 transition-all duration-700 ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-5">
          <div 
            className="relative group cursor-pointer flex-shrink-0" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Paneli Kapat" : "Paneli Aç"}
            role="button"
            aria-label="Panel Kontrolü"
          >
            <div className={`w-12 h-12 border border-[#C5A059]/30 rounded-full flex items-center justify-center transition-all duration-1000 group-hover:rotate-[360deg] bg-white ${!isSidebarOpen ? 'shadow-lg shadow-[#C5A059]/10 border-[#C5A059]/60' : ''}`}>
              <div className="w-7 h-[1.5px] bg-[#C5A059] absolute"></div>
              <div className="w-[1.5px] h-7 bg-[#C5A059]/40 absolute"></div>
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C5A059] rounded-full ring-4 ring-white shadow-sm"></div>
          </div>

          <div className={`transition-all duration-700 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 pointer-events-none'}`}>
            <h1 className="text-2xl font-serif tracking-tight text-slate-900 leading-none">
              Dava<span className="italic text-[#C5A059] ml-1 font-light">Pusulası</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mt-2 font-bold">Adalet Kılavuzu</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-3" aria-label="Ana Menü">
        {[
          { id: 'search', label: 'İçtihat Tarama', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { id: 'petition-generator', label: 'Dilekçe Yazımı', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { id: 'petition-analysis', label: 'Dilekçe Analizi', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'contract-analysis', label: 'Sözleşme Analizi', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0020 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 1.99.581 3.843 1.587 5.407' },
          { id: 'deadline-calendar', label: 'Süreli İş Takvimi', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { id: 'file-converter', label: 'Araçlar', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
          { id: 'forum', label: 'Hukuk Forumu', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`w-full flex items-center p-4 rounded-2xl transition-all duration-500 group relative ${
              activeTab === tab.id 
              ? 'text-slate-900 bg-slate-50 shadow-sm' 
              : 'text-slate-400 hover:text-slate-900 hover:translate-x-1'
            } ${!isSidebarOpen ? 'justify-center' : 'gap-4'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
              activeTab === tab.id 
              ? 'bg-[#C5A059] text-white shadow-lg shadow-[#C5A059]/30' 
              : 'bg-slate-50 group-hover:bg-slate-100'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={tab.icon} />
              </svg>
            </div>
            <span className={`text-[13px] font-semibold tracking-wide transition-all duration-700 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Credit Section */}
      <div className="p-4 lg:p-5">
        <div className={`transition-all duration-700 transform ${isSidebarOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90 pointer-events-none invisible'}`}>
          <div className="bg-slate-900 rounded-[2rem] p-5 shadow-xl space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A059]/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#C5A059]/20 transition-all duration-700"></div>
            <div className="relative space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Kalan Kredi</p>
                  <p className="text-xl font-serif text-[#C5A059] font-bold italic">{credits.remaining}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Günlük Limit</p>
                  <p className="text-xs font-medium text-white/80">{credits.total}</p>
                </div>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden" role="progressbar">
                <div 
                  className="h-full bg-[#C5A059] transition-all duration-1000 shadow-[0_0_8px_rgba(197,160,89,0.4)]" 
                  style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                ></div>
              </div>
              <button 
                onClick={onOpenPricing}
                className="w-full py-3 bg-[#C5A059] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-500 shadow-lg"
              >
                Üyeliği Yükselt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
      <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden fixed bottom-8 right-8 z-50 w-14 h-14 bg-slate-900 text-[#C5A059] rounded-full shadow-2xl flex items-center justify-center border border-[#C5A059]/20">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-100 z-40 transition-all duration-700 ${isSidebarOpen ? 'w-[320px]' : 'w-[100px]'}`}>
        <SidebarContent />
      </aside>

      <div className={`lg:hidden fixed inset-0 z-[60] transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
        <aside className={`absolute left-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl transition-transform duration-700 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </aside>
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 flex items-center justify-between px-8 lg:px-14 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C5A059] mb-1">Dava Pusulası</span>
              <div className="text-lg font-serif italic font-medium text-slate-800">
                {activeTab === 'search' ? 'Semantik İçtihat Araması' : activeTab === 'petition-analysis' ? 'Dilekçe Analiz Mühendisliği' : activeTab === 'contract-analysis' ? 'Sözleşme Risk Laboratuvarı' : activeTab === 'petition-generator' ? 'Akıllı Dilekçe Yazımı' : activeTab === 'file-converter' ? 'Dosya Dönüştürme Robotu' : activeTab === 'forum' ? 'Mesleki Paylaşım Forumu' : activeTab === 'deadline-calendar' ? 'Süreli İş Takvimi' : 'Kullanıcı Profili'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => user ? setActiveTab('profile') : onOpenLogin()}
            >
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#C5A059] transition-colors">{user.name || 'Meslektaş'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.role}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#C5A059] font-serif italic text-lg font-bold group-hover:bg-[#C5A059] group-hover:text-white transition-all duration-700">
                    {getInitials(user.name)}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold text-[#C5A059] uppercase tracking-widest group-hover:underline">Giriş Yapın</p>
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1440px] mx-auto p-8 lg:p-14 lg:pb-32 w-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
