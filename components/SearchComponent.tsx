
import React, { useState, useMemo } from 'react';
import { performSemanticSearch } from '../services/geminiService';

interface SearchComponentProps {
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ deductCredit, creditsRemaining }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (creditsRemaining < 2) {
        setError('Yetersiz kredi. Günlük limitiniz dolmuş görünüyor.');
        return;
    }

    setLoading(true);
    setReport('');
    setError('');
    
    try {
      const data = await performSemanticSearch(query);
      if (!data) throw new Error("Sonuç üretilemedi.");
      setReport(data);
      deductCredit(2);
    } catch (err) {
      setError('İçtihat araması sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text?: string) => {
    const content = text || report;
    if (!content || content.trim() === '') return;
    navigator.clipboard.writeText(String(content))
      .then(() => alert('İçerik panoya kopyalandı.'))
      .catch(() => alert('Kopyalama sırasında bir hata oluştu.'));
  };

  const formatTextWithItalics = (text: string) => {
    if (!text) return null;
    const parts = text.split(/("[^"]*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return <i key={i} className="text-slate-900 dark:text-luxury-silver font-medium border-b border-[#C5A059]/20">{part}</i>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderedReport = useMemo(() => {
    if (!report) return null;

    const sectionNames = [
      'UYUŞMAZLIĞIN HUKUKİ NİTELİĞİ',
      'YERLEŞİK İÇTİHAT PRENSİBİ',
      'EMSAL KARAR ANALİZLERİ',
      'USULİ VE KRİTİK UYARILAR'
    ];

    const regex = new RegExp(`(${sectionNames.join('|')})`, 'g');
    const parts = report.split(regex).filter(p => p.trim() !== '');

    const sections: { title: string; content: string }[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i] && parts[i + 1]) {
        sections.push({ title: parts[i].trim(), content: parts[i + 1].trim() });
      }
    }

    return sections.map((section, idx) => {
      if (section.title === 'EMSAL KARAR ANALİZLERİ') {
        const decisions = section.content.split(/(?=MAHKEME:)/).filter(d => d.trim().length > 10);
        return (
          <div key={idx} className="space-y-12 reveal">
            <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-luxury-silver tracking-wider uppercase border-l-4 border-[#C5A059] pl-6 transition-colors">
              Emsal İlamlar
            </h3>
            <div className="grid grid-cols-1 gap-12">
              {decisions.map((decision, dIdx) => {
                const lines = decision.split('\n').map(l => l.trim()).filter(l => l);
                let mahkeme = '', esas = '', tarih = '', ozet = '';
                
                lines.forEach(line => {
                  if (line.startsWith('MAHKEME:')) mahkeme = line.replace('MAHKEME:', '').trim();
                  else if (line.startsWith('ESAS/KARAR:')) esas = line.replace('ESAS/KARAR:', '').trim();
                  else if (line.startsWith('KARAR TARİHİ:')) tarih = line.replace('KARAR TARİHİ:', '').trim();
                  else if (line.startsWith('ÖZET VE GEREKÇE:')) ozet += line.replace('ÖZET VE GEREKÇE:', '').trim() + ' ';
                });

                return (
                  <div key={dIdx} className="luxury-card p-12 lg:p-14 rounded-[3.5rem] bg-white dark:bg-[#080C14] border border-[#C5A059]/15 shadow-xl relative overflow-hidden group transition-all duration-700">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C5A059]/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#C5A059]/10 transition-all duration-700"></div>
                    
                    <div className="relative z-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Makam</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-luxury-silver uppercase transition-colors">{mahkeme || 'Yargıtay İlgili Dairesi'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Dosya No</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-luxury-silver transition-colors">{esas || 'Emsal Veri'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">İlam Tarihi</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-luxury-silver transition-colors">{tarih || 'Güncel'}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50 dark:border-slate-800/60 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Karar Gerekçesi</span>
                          <button 
                            onClick={() => copyToClipboard(ozet)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-luxury-silver hover:text-[#C5A059] transition-colors"
                          >
                            Metne Aktar
                          </button>
                        </div>
                        <p className="font-serif text-xl lg:text-2xl text-slate-800 dark:text-luxury-silver leading-[1.8] text-justify font-light opacity-90 transition-colors">
                          {formatTextWithItalics(ozet.trim())}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div key={idx} className="space-y-8 reveal">
          <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-luxury-silver tracking-wider uppercase border-l-4 border-[#C5A059] pl-6 transition-colors">
            {section.title}
          </h3>
          <div className="luxury-card p-12 lg:p-16 rounded-[4rem] bg-[#FDFCFB]/50 dark:bg-[#080C14] border border-slate-100/50 dark:border-slate-800 transition-colors">
            <div className="text-lg lg:text-xl text-slate-700 dark:text-luxury-silver font-light leading-[2.1] whitespace-pre-wrap text-justify selection:bg-[#C5A059]/20 opacity-90 transition-colors">
              {formatTextWithItalics(section.content)}
            </div>
          </div>
        </div>
      );
    });
  }, [report]);

  return (
    <div className="space-y-24 reveal pb-32">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 dark:text-luxury-silver mb-8 leading-tight transition-colors duration-700">
          Akıllı <span className="italic text-[#C5A059]">Semantik Tarama</span> Arşivi.
        </h2>
        <p className="text-lg lg:text-xl text-slate-500 dark:text-luxury-silver opacity-60 font-light max-w-2xl mx-auto transition-colors">
          Derin hukuk analizi ve gümüş-gri netliğinde raporlama.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="luxury-card rounded-[3.5rem] p-1.5 bg-white dark:bg-[#112244] shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-700 ring-1 ring-slate-50 dark:ring-slate-800 relative overflow-hidden mb-12 border border-slate-100 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <form onSubmit={handleSearch} className="relative z-10">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Olayı, hukuki düğümü ve aranacak emsalleri anlatın..."
              className="w-full p-12 pr-12 rounded-[3.3rem] bg-transparent dark:bg-transparent focus:outline-none min-h-[220px] text-xl font-light placeholder:text-slate-300 dark:placeholder:text-luxury-silver/20 transition-all border-none resize-none leading-relaxed text-slate-900 dark:text-luxury-silver"
            />
            <div className="p-8 pt-0 flex justify-between items-center mt-6">
               <div className="flex gap-4">
                  <span className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-300 dark:text-luxury-silver/40 tracking-[0.2em] transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#C5A059] animate-ping' : 'bg-emerald-400'}`}></span>
                    {loading ? 'Yargıtay Arşivi Taranıyor...' : 'Motor Aktif'}
                  </span>
               </div>
               <button
                 type="submit"
                 disabled={loading || !query.trim()}
                 className="px-16 py-6 bg-slate-900 dark:bg-luxury-charcoal text-white border border-[#C5A059] font-black rounded-2xl shadow-2xl hover:bg-[#C5A059] transition-all duration-500 disabled:opacity-40 text-[12px] tracking-[0.2em] uppercase active:scale-95 opacity-100"
               >
                 <span>Aramayı Başlat (2 Kredi)</span>
               </button>
            </div>
          </form>
        </div>

        {report && (
          <div className="space-y-24 reveal mt-12 transition-colors duration-700">
            <div className="flex items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800 pb-10 transition-colors">
              <h3 className="text-[11px] uppercase tracking-[0.6em] font-black text-slate-900 dark:text-luxury-silver transition-colors">Sorgu Analiz Raporu</h3>
              <button 
                onClick={() => copyToClipboard()}
                className="flex items-center gap-3 text-[10px] uppercase font-bold text-[#C5A059] hover:text-slate-900 dark:hover:text-luxury-silver transition-colors tracking-widest"
              >
                Raporu Kopyala
              </button>
            </div>
            <div className="space-y-24">
              {renderedReport}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-[3px] border-[#C5A059] border-t-transparent rounded-full mx-auto mb-10 animate-spin"></div>
            <p className="font-serif italic text-3xl text-slate-400 dark:text-luxury-silver transition-colors">Derin içtihat taraması yürütülüyor...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;
