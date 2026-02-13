
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
      setError('İçtihat araması sırasında bir hata oluştu. Lütfen sorgunuzu detaylandırarak tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text?: string) => {
    const content = text || report;
    if (!content || content.trim() === '') {
      alert('Kopyalanacak bir içerik bulunmuyor.');
      return;
    }
    navigator.clipboard.writeText(String(content))
      .then(() => alert('İçerik panoya kopyalandı.'))
      .catch(() => alert('Kopyalama sırasında bir hata oluştu.'));
  };

  const formatTextWithItalics = (text: string) => {
    if (!text) return null;
    const parts = text.split(/("[^"]*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return <i key={i} className="text-slate-900">{part}</i>;
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
        // Her kararı "MAHKEME:" ile ayırıyoruz, böylece tüm bilgiler aynı kartta kalır.
        const decisions = section.content.split(/(?=MAHKEME:)/).filter(d => d.trim().length > 10);
        return (
          <div key={idx} className="space-y-12 reveal">
            <h3 className="text-2xl font-serif font-black text-slate-900 tracking-wider uppercase border-l-4 border-[#C5A059] pl-6">
              Bulgular ve Emsaller
            </h3>
            <div className="grid grid-cols-1 gap-10">
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
                  <div key={dIdx} className="luxury-card p-12 lg:p-14 rounded-[3.5rem] bg-white border border-[#C5A059]/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#C5A059]/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#C5A059]/10 transition-all duration-700"></div>
                    
                    <div className="relative z-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">MAHKEME / DAİRE</span>
                          <p className="text-sm font-bold text-slate-900 uppercase">{mahkeme || 'Belirtilmedi'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">ESAS / KARAR NO</span>
                          <p className="text-sm font-bold text-slate-900">{esas || 'Belirtilmedi'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">KARAR TARİHİ</span>
                          <p className="text-sm font-bold text-slate-900">{tarih || 'Belirtilmedi'}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">İÇTİHAT ÖZETİ VE HUKUKİ GEREKÇE</span>
                          <button 
                            onClick={() => copyToClipboard(ozet)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#C5A059] transition-colors"
                          >
                            Dilekçeye Kopyala
                          </button>
                        </div>
                        <p className="font-serif text-xl lg:text-2xl text-slate-800 leading-relaxed text-justify">
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
          <h3 className="text-2xl font-serif font-black text-slate-900 tracking-wider uppercase border-l-4 border-[#C5A059] pl-6">
            {section.title}
          </h3>
          <div className="luxury-card p-12 lg:p-16 rounded-[4rem] bg-[#FDFCFB]/50 border border-slate-100/50">
            <div className="text-lg lg:text-xl text-slate-700 font-light leading-[2.1] whitespace-pre-wrap text-justify selection:bg-[#C5A059]/20">
              {formatTextWithItalics(section.content)}
            </div>
          </div>
        </div>
      );
    });
  }, [report]);

  return (
    <div className="space-y-24 reveal pb-32">
      {/* Header Section */}
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Yapay Zeka Destekli <span className="italic text-[#C5A059]">Semantik İçtihat</span> Araması.
        </h2>
        <p className="text-lg lg:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto">
          Uyuşmazlığın özündeki hukuki mantığı analiz eder, yüksek mahkeme kararlarını saniyeler içinde raporlarız.
        </p>
      </div>

      {/* Interface Area */}
      <div className="max-w-6xl mx-auto">
        <div className="luxury-card rounded-[3.5rem] p-1.5 bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#C5A059]/5 transition-all duration-700 ring-1 ring-slate-50 relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/5 rounded-full -mr-24 -mt-24 blur-3xl" aria-hidden="true"></div>
          <form onSubmit={handleSearch} className="relative z-10">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hukuki uyuşmazlığı, tarafları ve somut olayı anlatın..."
              className="w-full p-12 pr-12 rounded-[3.3rem] bg-transparent focus:outline-none min-h-[200px] text-xl font-light placeholder:text-slate-300 transition-all border-none resize-none leading-relaxed"
            />
            <div className="p-8 pt-0 flex justify-between items-center">
               <div className="flex gap-4">
                  <span className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">
                    <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#C5A059] animate-ping' : 'bg-emerald-400'}`}></span>
                    {loading ? 'Yargı Arşivi Taranıyor...' : 'Semantik Motor Hazır'}
                  </span>
               </div>
               <button
                 type="submit"
                 disabled={loading || !query.trim()}
                 className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-[#C5A059] transition-all duration-500 disabled:opacity-40 flex items-center justify-center gap-4 text-[11px] tracking-[0.2em] uppercase active:scale-95"
               >
                 {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 )}
                 <span>Tarama Başlat (2 Kredi)</span>
               </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-6 bg-red-50 text-red-800 rounded-3xl border border-red-100/50 text-sm text-center mb-12 animate-pulse">
            {error}
          </div>
        )}

        {/* Structured Report Result Section */}
        {report && (
          <div className="space-y-24 reveal mt-12">
            <div className="flex items-center justify-between px-8 border-b border-slate-100 pb-10">
              <h3 className="text-[11px] uppercase tracking-[0.6em] font-black text-slate-900">Semantik İçtihat Analiz Raporu</h3>
              <button 
                onClick={() => copyToClipboard()}
                className="flex items-center gap-3 text-[10px] uppercase font-bold text-[#C5A059] hover:text-slate-900 transition-colors tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Tam Raporu Kopyala
              </button>
            </div>

            <div className="space-y-24">
              {renderedReport}
            </div>
            
            <div className="pt-20 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-light italic max-w-lg mx-auto leading-relaxed">
                ⚠️ Bu mütalaa yapay zeka tarafından derlenmiştir. Karar numaralarını Yargıtay Bilgi İşlem sistemi üzerinden teyit etmeniz tavsiye edilir.
              </p>
            </div>
          </div>
        )}

        {/* Loading State Overlay */}
        {loading && (
          <div className="text-center py-24 animate-pulse">
            <div className="w-20 h-20 border-[3px] border-[#C5A059] border-t-transparent rounded-full mx-auto mb-10 animate-spin"></div>
            <p className="font-serif italic text-3xl text-slate-400">Yargı arşivi taranıyor, emsaller analiz ediliyor...</p>
          </div>
        )}

        {/* Placeholder / Empty State */}
        {!report && !loading && (
          <div className="text-center py-32 opacity-20">
            <div className="w-24 h-24 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-10">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="font-serif italic text-3xl text-slate-400">Semantik asistanınız bir uyuşmazlık tanımı bekliyor...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;
