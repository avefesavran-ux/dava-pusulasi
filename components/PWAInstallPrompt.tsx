
import React, { useState, useEffect } from 'react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Sadece kullanıcı 10 saniye durduktan sonra göster (zarif bir dokunuş)
      setTimeout(() => setIsVisible(true), 10000);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[200] reveal">
      <div className="luxury-card bg-slate-900 dark:bg-luxury-charcoal border border-[#C5A059]/30 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#C5A059] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
             </svg>
          </div>
          <div>
            <h4 className="text-sm font-serif italic text-[#C5A059]">Pusula'yı Uygulama Olarak Kullan</h4>
            <p className="text-[10px] text-slate-400 dark:text-luxury-steel uppercase tracking-widest leading-tight">Hızlı erişim ve tam ekran deneyimi için ana ekrana ekleyin.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Daha Sonra
          </button>
          <button 
            onClick={handleInstallClick}
            className="flex-1 py-3 bg-[#C5A059] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-lg"
          >
            Hemen Yükle
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
