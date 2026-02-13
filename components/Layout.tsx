
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
    <div className="flex flex-col h-full bg-white dark:bg-luxury-charcoal transition-colors duration-700 relative">
      {/* Brand Section */}
      <div className={`p-8 pb-10 transition-all duration-700 ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-5">
          <div 
            className="relative group cursor-pointer flex-shrink-0" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <div className={`w-12 h-12 border border-[#C5A059]/30 rounded-full flex items-center justify-center transition-all duration-1000 group-hover:rotate-[360deg] bg-white dark:bg-luxury-midnight ${!isSidebarOpen ? 'shadow-lg border-[#C5A059]/60' : ''}`}>
              <div className="w-7 h-[1.5px] bg-[#C5A059] absolute"></div>
              <div className="w-[1.5px] h-7 bg-[#C5A059]/40 absolute"></div>
            </div>
          </div>

          <div className={`transition-all duration-700 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 pointer-events-none'}`}>
            <h1 
              onClick={() => setActiveTab('search')}
              className="text-2xl font-serif tracking-tight text-slate-900 dark:text-luxury-silver leading-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              Dava<span className="italic text-[#C5A059] ml-1 font-light">Pusulası</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 dark:text-luxury-silver mt-2 font-bold opacity-80">Adalet Uzmanı</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { 
            id: 'search', 
            label: 'İçtihat Tarama', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5h3m-3 3h3" />
          },
          { 
            id: 'petition-generator', 
            label: 'Dilekçe Yazımı', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          },
          { 
            id: 'petition-analysis', 
            label: 'Dilekçe Analizi', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          },
          { 
            id: 'contract-analysis', 
            label: 'Sözleşme Analizi', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
          },
          { 
            id: 'deadline-calendar', 
            label: 'Süreli İş Takvimi', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008z" />
          },
          { 
            id: 'forum', 
            label: 'Hukuk Forumu', 
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.303.025-.607.045-.912.059A11.483 11.483 0 0118 19.773a11.581 11.581 0 00-2.686-1.5c-.327-.109-.659-.204-.995-.282A8.96 8.96 0 0115 15.75v-1.5c0-1.31-.329-2.546-.911-3.623b" />
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-500 group ${
              activeTab === tab.id 
              ? 'text-slate-900 dark:text-luxury-silver bg-slate-50 dark:bg-luxury-midnight shadow-sm' 
              : 'text-slate-400 dark:text-luxury-silver/60 hover:text-slate-900 dark:hover:text-luxury-silver hover:translate-x-1'
            } ${!isSidebarOpen ? 'justify-center' : 'gap-4'}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
              activeTab === tab.id 
              ? 'bg-[#C5A059] text-white shadow-lg' 
              : 'bg-slate-50 dark:bg-luxury-charcoal group-hover:bg-slate-100 dark:group-hover:bg-luxury-midnight'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {tab.icon}
              </svg>
            </div>
            <span className={`text-[12px] font-semibold tracking-wide transition-all duration-700 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Compact Credit Section at the Bottom - HIDDEN WHEN SIDEBAR CLOSED */}
      {isSidebarOpen && (
        <div className="p-4 border-t border-slate-50 dark:border-slate-800/60 bg-white dark:bg-luxury-charcoal transition-all duration-500">
          <div className="bg-slate-900 dark:bg-[#060A10] rounded-2xl p-4 shadow-xl border border-[#C5A059]/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-[#C5A059] font-black uppercase tracking-[0.2em]">Kredi</span>
              <span className="text-sm font-serif text-white italic font-bold leading-none">{credits.remaining} / {credits.total}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#C5A059]" style={{ width: `${(credits.remaining / credits.total) * 100}%` }}></div>
            </div>
            <button 
              onClick={onOpenPricing}
              className="w-full py-2 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-[#C5A059] hover:text-white transition-all duration-500"
            >
              Yükselt
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFCFB] dark:bg-luxury-charcoal overflow-hidden transition-colors duration-800">
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-luxury-charcoal border-r border-slate-100 dark:border-slate-800/60 z-40 transition-all duration-700 ${isSidebarOpen ? 'w-[300px]' : 'w-[80px]'}`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 bg-white/70 dark:bg-luxury-charcoal/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between px-8 lg:px-14 sticky top-0 z-30 transition-colors duration-800">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#C5A059] mb-1">Dava Pusulası</span>
              <div className="text-lg font-serif italic font-medium text-slate-800 dark:text-luxury-silver transition-colors">
                {activeTab === 'search' ? 'Semantik İçtihat Uzmanı' : 'Hukuki Asistan'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#C5A059] transition-all hover:scale-110"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.344l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => user ? setActiveTab('profile') : onOpenLogin()}
            >
              {user ? (
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[#C5A059] font-serif italic text-lg font-bold group-hover:bg-[#C5A059] group-hover:text-white transition-all duration-700">
                  {getInitials(user.name)}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest hidden sm:block">Üye Girişi</span>
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-luxury-midnight border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-luxury-silver">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar transition-colors duration-800">
          <div className="max-w-[1440px] mx-auto p-8 lg:p-14 lg:pb-32 w-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
