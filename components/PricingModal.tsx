
import React from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'Asistan',
      price: '0₺',
      description: 'Yeni başlayanlar için temel rehberlik.',
      features: ['Günlük 30 kredi limiti', 'Semantik içtihat araması', 'Standart hızda analiz'],
      buttonText: 'Kullanıma Başla',
      isPopular: false,
    },
    {
      name: 'Professional',
      price: '399₺',
      period: '/ay',
      description: 'Bağımsız vekiller için tam kapasite.',
      features: ['Sınırsız derin sorgulama', 'Gelişmiş mühendislik analizi', 'Öncelikli GPU erişimi', 'Vektörel rapor çıktısı'],
      buttonText: 'Hemen Abone Ol',
      isPopular: true,
    },
    {
      name: 'Hukuk Bürosu',
      price: '1499₺',
      period: '/ay',
      description: 'Ekipler için ortak zeka alanı.',
      features: ['10 Kullanıcıya kadar erişim', 'Kolektif vaka kütüphanesi', 'Kurumsal muhasebe desteği', 'API ve webhook entegrasyonu'],
      buttonText: 'Bize Ulaşın',
      isPopular: false,
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity duration-700" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-[#FDFCFB] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-7xl max-h-full overflow-hidden flex flex-col reveal luxury-card">
        
        {/* Sticky Header with matching rounded corners */}
        <div className="sticky top-0 flex justify-end p-8 lg:p-10 bg-[#FDFCFB]/90 backdrop-blur-md z-30 rounded-t-[3.5rem] border-b border-slate-50/50">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-[#C5A059] transition-all duration-500 bg-white/50"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-20 lg:px-24 lg:pb-32">
          {/* Modal Content Header */}
          <div className="text-center mb-20 mt-10 max-w-3xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.6em] font-black text-[#C5A059] mb-6 block">Premium Erişim</span>
            <h2 className="text-5xl lg:text-6xl font-serif italic font-light text-slate-900 mb-8 leading-tight">İşinizi <span className="text-[#C5A059]">Sanata</span> Dönüştürün.</h2>
            <p className="text-lg text-slate-500 font-light leading-relaxed">Siz adalete odaklanın, biz teknolojinin tüm imkanlarını sizin için seferber edelim.</p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 items-stretch mb-20">
            {plans.map((plan, i) => (
              <div 
                key={i} 
                className={`relative p-10 lg:p-12 rounded-[3rem] border transition-all duration-700 flex flex-col ${
                  plan.isPopular 
                  ? 'border-[#C5A059] bg-white shadow-2xl md:scale-105 z-10' 
                  : 'border-slate-100 bg-white/50 hover:bg-white hover:border-slate-200'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#C5A059] text-white text-[9px] uppercase tracking-[0.4em] font-black py-2.5 px-6 rounded-full shadow-xl shadow-[#C5A059]/30 whitespace-nowrap">
                    Önerilen Seçim
                  </div>
                )}
                
                <div className="mb-10 text-center lg:text-left">
                  <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-12 flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-5xl lg:text-6xl font-serif font-black text-slate-900 tracking-tighter">{plan.price}</span>
                  {plan.period && <span className="text-slate-300 text-lg font-serif italic">{plan.period}</span>}
                </div>

                <ul className="space-y-6 mb-16 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-4 text-[13px] text-slate-600 leading-relaxed font-light">
                      <svg className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-5 rounded-[2rem] font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-700 active:scale-95 ${
                    plan.isPopular 
                    ? 'bg-slate-900 text-white hover:bg-[#C5A059] shadow-2xl shadow-slate-900/10' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black text-slate-300">Güvenli SSL Altyapısı ile Korumalı Ödeme</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
