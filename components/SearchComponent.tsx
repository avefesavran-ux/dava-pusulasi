
import React, { useState } from 'react';
import { performSemanticSearch } from '../services/geminiService';
import { CaseResult } from '../types';

interface SearchComponentProps {
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ deductCredit, creditsRemaining }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || creditsRemaining < 2) return;

    setLoading(true);
    setError('');
    try {
      const data = await performSemanticSearch(query);
      setResults(data);
      deductCredit(2);
    } catch (err) {
      setError('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-24 reveal pb-32">
      {/* Header Section */}
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Yapay Zeka Destekli <span className="italic text-[#C5A059]">Semantik İçtihat</span> Araması.
        </h2>
        <p className="text-lg lg:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto">
          Sadece anahtar kelimeleri değil, uyuşmazlığın özündeki hukuki mantığı analiz eder ve davanız için en isabetli emsal kararları buluruz.
        </p>
      </div>

      {/* Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-6xl mx-auto">
        {/* Search Input Area */}
        <div className="lg:col-span-3 space-y-8">
          <div className="luxury-card rounded-[3.5rem] p-1.5 bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#C5A059]/5 transition-all duration-700 ring-1 ring-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/5 rounded-full -mr-24 -mt-24 blur-3xl" aria-hidden="true"></div>
            <form onSubmit={handleSearch} className="relative z-10">
              <label htmlFor="semantic-search" className="sr-only">Hukuki olay özeti veya uyuşmazlık detayı girin</label>
              <textarea
                id="semantic-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Olayın hukuki kurgusunu, tarafların durumunu ve uyuşmazlığın özünü detaylıca anlatın..."
                className="w-full p-12 pr-12 rounded-[3.3rem] bg-transparent focus:outline-none min-h-[250px] text-xl font-light placeholder:text-slate-300 transition-all border-none resize-none leading-relaxed"
              />
              <div className="p-8 pt-0 flex justify-between items-center">
                 <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      Semantik Motor Aktif
                    </span>
                 </div>
                 <button
                   type="submit"
                   disabled={loading || !query.trim() || creditsRemaining < 2}
                   className="px-10 py-5 bg-[#C5A059] text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-[11px] tracking-[0.2em] uppercase active:scale-95 border border-[#C5A059]/30"
                 >
                   {loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   )}
                   <span className="font-bold">Emsal Karar Ara (2 Kredi)</span>
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* Methodology Sidebar */}
        <aside className="lg:col-span-2 space-y-10" aria-label="Tarama Yöntemimiz">
          <div className="luxury-card rounded-[3rem] p-12 space-y-10 border border-slate-50">
            <h5 className="text-[11px] uppercase tracking-[0.4em] font-black text-[#C5A059] flex items-center gap-4">
              <span className="w-12 h-[1px] bg-[#C5A059]/30"></span>
              Tarama Protokolü
            </h5>
            <div className="space-y-10">
              {[
                { title: 'Bağlamsal Çözümleme', desc: 'Sorgu içindeki saklı hukuki kavramların AI tarafından saptanması.' },
                { title: 'Daire İhtisası', desc: 'Uyuşmazlık türüne göre ilgili Yargıtay Daireleri üzerinde derin odak.' },
                { title: 'Güncellik Denetimi', desc: 'İçtihatların yürürlükteki mevzuat ile uyumluluk kontrolü.' }
              ].map((item, i) => (
                <div key={i} className="group cursor-default">
                  <p className="font-serif italic text-xl text-slate-900 mb-2 group-hover:text-[#C5A059] transition-colors duration-500">{item.title}</p>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto p-6 bg-red-50 text-red-800 rounded-3xl border border-red-100/50 text-sm text-center reveal" role="alert">
          {error}
        </div>
      )}

      {/* Results Section */}
      <section className="max-w-6xl mx-auto space-y-16" aria-label="Arama Sonuçları">
        {results.length > 0 && (
          <div className="flex items-center gap-6 px-4">
            <h3 className="text-[11px] uppercase tracking-[0.6em] font-black text-slate-900">Bulgular & Emsaller</h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-100 via-[#C5A059]/20 to-slate-100"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-12">
          {results.map((item, idx) => (
            <article key={item.id || idx} className="luxury-card p-14 rounded-[4rem] reveal group hover:border-[#C5A059]/20 transition-all duration-700 bg-white">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
                <div className="space-y-6">
                  <span className="inline-block px-5 py-2 bg-[#C5A059]/5 text-[#C5A059] text-[10px] font-bold rounded-full uppercase tracking-[0.2em] border border-[#C5A059]/10">
                    {item.court}
                  </span>
                  <h4 className="text-3xl lg:text-5xl font-serif text-slate-900 group-hover:text-[#C5A059] transition-colors duration-700 leading-tight">
                    {item.basisNo} <span className="text-slate-200 mx-2 font-light">/</span> {item.decisionNo}
                  </h4>
                  <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      Karar Tarihi: {item.date || '—'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => copyToClipboard(item.citation)}
                  aria-label="Karar özetini kopyala"
                  className="w-full lg:w-auto px-10 py-5 bg-slate-900 text-white hover:bg-[#C5A059] rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-700 shadow-xl shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                >
                  Dilekçeye Kopyala
                </button>
              </div>
              
              <div className="relative p-12 lg:p-16 bg-[#FDFCFB] rounded-[3.5rem] border border-slate-50 mb-12 group-hover:border-[#C5A059]/10 transition-all duration-700">
                <div className="absolute top-10 left-10 text-[10rem] font-serif text-[#C5A059]/5 leading-none select-none" aria-hidden="true">“</div>
                <p className="text-xl lg:text-2xl font-serif text-slate-700 leading-relaxed italic relative z-10 text-justify">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-start gap-8 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-50 group-hover:bg-white group-hover:border-[#C5A059]/10 transition-all duration-700">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 group-hover:border-[#C5A059]/20">
                  <svg className="w-7 h-7 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[#C5A059] mb-3">İlişkilendirme Analizi</p>
                  <p className="text-lg text-slate-500 leading-relaxed font-light text-justify">{item.relevanceReason}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SearchComponent;
