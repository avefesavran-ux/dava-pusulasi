
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
    <div className="flex flex-col h-full bg-white dark:bg-luxury-charcoal transition-colors duration-700">
      {/* Brand Section */}
      <div className={`p-6 pb-8 transition-all duration-700 ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-4">
          <div 
            className="relative group cursor-pointer flex-shrink-0" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <div className={`w-10 h-10 border border-[#C5A059]/30 rounded-full flex items-center justify-center transition-all duration-1000 group-hover:rotate-[360deg] bg-white dark:bg-luxury-midnight ${!isSidebarOpen ? 'shadow-lg border-[#C5A059]/60' : ''}`}>
              <div className="w-6 h-[1.2px] bg-[#C5A059] absolute"></div>
              <div className="w-[1.2px] h-6 bg-[#C5A059]/40 absolute"></div>
            </div>
          </div>

          <div className={`transition-all duration-700 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 pointer-events-none'}`}>
            <h1 className="text-xl font-serif tracking-tight text-slate-900 dark:text-luxury-silver leading-none">
              Dava<span className="italic text-[#C5A059] ml-1 font-light">Pusulası</span>
            </h1>
            <p className="text-[8px] uppercase tracking-[0.4em] text-slate-400 dark:text-luxury-steel mt-1.5 font-bold">Semantik Adalet</p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-4">
        {[
          { id: 'search', label: 'İçtihat Tarama', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { id: 'petition-generator', label: 'Dilekçe Yazımı', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { id: 'petition-analysis', label: 'Dilekçe Analizi', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'contract-analysis', label: 'Sözleşme Analizi', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0020 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 1.99.581 3.843 1.587 5.407' },
          { id: 'deadline-calendar', label: 'Süreli İş Takvimi', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { id: 'forum', label: 'Hukuk Forumu', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-500 group ${
              activeTab === tab.id 
              ? 'text-slate-900 dark:text-luxury-silver bg-slate-50 dark:bg-luxury-midnight shadow-sm' 
              : 'text-slate-400 dark:text-luxury-steel hover:text-slate-900 dark:hover:text-luxury-silver hover:translate-x-1'
            } ${!isSidebarOpen ? 'justify-center' : 'gap-3'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
              activeTab === tab.id 
              ? 'bg-[#C5A059] text-white shadow-md' 
              : 'bg-slate-50 dark:bg-luxury-charcoal group-hover:bg-slate-100 dark:group-hover:bg-luxury-midnight'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={tab.icon} />
              </svg>
            </div>
            <span className={`text-[12px] font-semibold tracking-wide transition-all duration-700 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Credit Section - Compact & Fixed Visibility */}
      <div className="p-4 mt-auto border-t border-slate-50 dark:border-slate-800/50">
        <div className={`transition-all duration-700 ${isSidebarOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none invisible'}`}>
          <div className="bg-slate-900 dark:bg-[#060A10] rounded-2xl p-4 shadow-lg space-y-3 border border-[#C5A059]/10">
            <div className="flex justify-between items-center">
              <span className="text-[8px] text-[#C5A059] font-black uppercase tracking-[0.2em]">Kredi</span>
              <span className="text-xs font-serif text-white italic font-bold">{credits.remaining} / {credits.total}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C5A059] transition-all duration-1000" 
                style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
              ></div>
            </div>
            <button 
              onClick={onOpenPricing}
              className="w-full py-2 bg-[#C5A059] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-500"
            >
              Yükselt
            </button>
          </div>
        </div>
        {!isSidebarOpen && (
           <div className="flex justify-center py-2">
             <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></div>
           </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFCFB] dark:bg-luxury-midnight overflow-hidden transition-colors duration-800">
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-luxury-charcoal border-r border-slate-100 dark:border-slate-800/60 z-40 transition-all duration-700 ${isSidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white/70 dark:bg-luxury-midnight/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30 transition-colors duration-800">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#C5A059] mb-0.5">Dava Pusulası</span>
              <div className="text-md font-serif italic font-medium text-slate-800 dark:text-luxury-silver">
                {activeTab === 'search' ? 'Semantik İçtihat Uzmanı' : 'Hukuki Asistan'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-full bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#C5A059] transition-all hover:scale-110"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => user ? setActiveTab('profile') : onOpenLogin()}
            >
              {user ? (
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#C5A059] font-serif italic text-md font-bold group-hover:bg-[#C5A059] group-hover:text-white transition-all duration-700">
                  {getInitials(user.name)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest hidden sm:block">Üye Girişi</span>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar transition-colors duration-800">
          <div className="max-w-[1440px] mx-auto p-8 lg:p-12 lg:pb-32 w-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
