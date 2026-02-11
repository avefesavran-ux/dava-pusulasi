
import React, { useState } from 'react';
import { generatePetition, revisePetition } from '../services/geminiService';
import { GeneratedPetition } from '../types';

interface PetitionGeneratorProps {
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

const PetitionGenerator: React.FC<PetitionGeneratorProps> = ({ deductCredit, creditsRemaining }) => {
  const [formData, setFormData] = useState({ type: '', target: '', summary: '', isLongMode: true });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedPetition[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revisionText, setRevisionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const currentPetition = history[activeIndex];

  const handleGenerate = async () => {
    if (creditsRemaining < 15) { setError('Dilekçe yazımı için 15 kredi gereklidir.'); return; }
    setLoading(true);
    setError(null);
    try {
      const petition = await generatePetition(formData);
      setHistory([petition]);
      setActiveIndex(0);
      deductCredit(15);
    } catch (err) { setError('Dilekçe oluşturulurken bir hata oluştu.'); }
    finally { setLoading(false); }
  };

  const handleRevise = async () => {
    if (!revisionText.trim() || loading) return;
    
    // Revision Logic: 1st revision (history length 1) is 0 credits, others are 5
    const cost = history.length === 1 ? 0 : 5;
    if (creditsRemaining < cost) {
      setError(`Revizyon için ${cost} kredi gereklidir.`);
      return;
    }

    setLoading(true);
    try {
      const revised = await revisePetition(currentPetition, revisionText);
      const newHistory = [...history, revised];
      setHistory(newHistory);
      setActiveIndex(newHistory.length - 1);
      setRevisionText('');
      if (cost > 0) deductCredit(cost);
    } catch (err) { setError('Revizyon başarısız.'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = async () => {
    if (!currentPetition) return;
    try {
      await navigator.clipboard.writeText(currentPetition.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Kopyalama hatası:", err);
    }
  };

  const downloadUDF = () => {
    if (!currentPetition) return;
    
    const udfContent = `<?xml version="1.0" encoding="UTF-8"?>
<dokuman>
    <baslik>${currentPetition.title}</baslik>
    <icerik>${currentPetition.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</icerik>
    <metadata>
        <version>${currentPetition.version}</version>
        <generator>Dava Pusulası AI</generator>
    </metadata>
</dokuman>`;

    const blob = new Blob([udfContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPetition.title.replace(/\s+/g, '_')}_${currentPetition.version}.udf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-24 reveal pb-32">
      <header className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Akıllı <span className="italic text-[#C5A059]">Dilekçe</span> Yazım Mühendisliği.
        </h2>
        <p className="text-lg text-slate-500 font-light">Hukuki olayınızı anlatın, sistem mevzuat ve içtihatla harmanlanmış profesyonel taslağı saniyeler içinde üretsin.</p>
      </header>

      {!currentPetition ? (
        <div className="max-w-4xl mx-auto luxury-card rounded-[4rem] p-16 bg-white border border-slate-50 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Dilekçe Türü</label>
              <select 
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 text-slate-700"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                <option value="Dava Dilekçesi">Dava Dilekçesi</option>
                <option value="Cevap Dilekçesi">Cevap Dilekçesi</option>
                <option value="Bilirkişi Raporuna İtiraz">Bilirkişi Raporuna İtiraz</option>
                <option value="Tanık Beyanlarına İtiraz">Tanık Beyanlarına İtiraz</option>
                <option value="Ödeme Emrine İtiraz">Ödeme Emrine İtiraz</option>
                <option value="KYOK İtiraz (Takipsizlik)">KYOK İtiraz (Takipsizlik)</option>
                <option value="Suç Duyurusu">Suç Duyurusu</option>
                <option value="İhtarname">İhtarname</option>
                <option value="Beyan Dilekçesi">Beyan Dilekçesi</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Sunulacak Makam</label>
              <input 
                placeholder="Örn: Ankara 5. Asliye Hukuk Mahkemesi"
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30"
                value={formData.target}
                onChange={e => setFormData({...formData, target: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Olay Özeti ve Talepler</label>
            <textarea 
              placeholder="Uyuşmazlığın özünü, tarafları ve somut taleplerinizi buraya yazın..."
              className="w-full p-8 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 min-h-[200px] resize-none"
              value={formData.summary}
              onChange={e => setFormData({...formData, summary: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.isLongMode}
                  onChange={e => setFormData({...formData, isLongMode: e.target.checked})}
                />
                <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:bg-[#C5A059] transition-all duration-500"></div>
                <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all duration-500 peer-checked:translate-x-7"></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Gerekçeli Uzun Mod</span>
            </label>
            <button 
              onClick={handleGenerate}
              disabled={loading || !formData.summary}
              className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-500 disabled:opacity-30"
            >
              {loading ? 'Sistem Yazıyor...' : 'Dilekçeyi Oluştur (15 Kredi)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-[1600px] mx-auto">
          <div className="lg:col-span-8 space-y-8">
            <div className="luxury-card rounded-[4rem] bg-white border border-slate-50 overflow-hidden shadow-2xl relative">
               <div className="p-10 border-b border-slate-50 bg-[#FDFCFB] flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black bg-[#C5A059] text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
                      {currentPetition.version}
                    </span>
                    <h3 className="font-serif italic text-2xl text-slate-900">{currentPetition.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={copyToClipboard} 
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                        copySuccess 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-[#C5A059] hover:text-[#C5A059]'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {copySuccess ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    
                    <button 
                      onClick={downloadUDF}
                      className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-lg shadow-slate-900/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      UDF İndir
                    </button>
                  </div>
               </div>
               
               <div className="p-16 relative">
                  <div className="font-serif text-xl leading-[1.8] text-slate-800 whitespace-pre-wrap text-justify selection:bg-[#C5A059]/20">
                    {currentPetition.content}
                  </div>
                  
                  <div className="mt-16 pt-10 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 font-light italic text-center max-w-lg mx-auto leading-relaxed">
                      ⚠️ Bu metin yapay zekâ tarafından hazırlanmıştır, hukuki bağlayıcılığı yoktur. Resmi kullanım öncesi bir avukata danışılması önerilir.
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className="luxury-card p-10 rounded-[3.5rem] bg-white border border-slate-50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Versiyon Geçmişi</h4>
              <div className="space-y-3">
                {history.map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveIndex(i)}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all duration-500 border ${
                      activeIndex === i 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-[#C5A059]/30 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center ${
                        activeIndex === i ? 'bg-[#C5A059] text-white' : 'bg-white text-slate-300 border border-slate-100'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold tracking-widest uppercase">{p.version}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="luxury-card p-10 rounded-[3.5rem] bg-slate-900 text-white border border-[#C5A059]/10 sticky top-32">
               <h4 className="text-xl font-serif italic text-[#C5A059] mb-8">İnteraktif Revizyon</h4>
               <p className="text-xs text-slate-400 font-light mb-8">
                 {history.length === 1 ? (
                   <span className="text-emerald-400 font-bold uppercase tracking-widest">İlk Revizyon Ücretsiz</span>
                 ) : (
                   <span className="text-[#C5A059] font-bold">Revizyon Ücreti: 5 Kredi</span>
                 )}
               </p>
               
               <div className="space-y-6">
                  <textarea 
                    placeholder="Değişiklik talimatınızı buraya yazın..."
                    className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#C5A059] min-h-[140px] text-sm font-light text-slate-300 resize-none transition-all placeholder:text-slate-600"
                    value={revisionText}
                    onChange={e => setRevisionText(e.target.value)}
                  />
                  <button 
                    onClick={handleRevise}
                    disabled={loading || !revisionText}
                    className="w-full py-5 bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#C5A059]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                  >
                    {loading ? 'Revize Ediliyor...' : 'Değişikliği Uygula'}
                  </button>
               </div>
            </div>

            <button 
              onClick={() => {
                if(confirm('Mevcut dilekçe geçmişi silinecektir. Emin misiniz?')) {
                  setHistory([]);
                  setActiveIndex(0);
                }
              }}
              className="w-full py-4 rounded-2xl border border-slate-100 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-50 hover:text-red-400 hover:border-red-100 transition-all"
            >
              Yeni Dilekçe Taslağı Başlat
            </button>
          </aside>
        </div>
      )}

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-sm font-medium shadow-2xl z-[100] animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
};

export default PetitionGenerator;
