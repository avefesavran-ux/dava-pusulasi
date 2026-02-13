
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generatePetitionStream, revisePetitionStream } from '../services/geminiService';
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
  
  // Streaming states
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Smooth Typing Buffer - High performance queue
  const pendingTextRef = useRef<string>("");
  const displayIntervalRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamFinishedRef = useRef<boolean>(false);

  const currentPetition = history[activeIndex];

  // Auto-scroll to bottom as text flows
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming]);

  // Clean up typing interval
  useEffect(() => {
    return () => {
      if (displayIntervalRef.current) window.clearInterval(displayIntervalRef.current);
    };
  }, []);

  const parseStreamingResponse = (fullText: string): { title: string; content: string } => {
    let title = "Dilekçe Taslağı";
    let content = fullText;

    if (fullText.includes("BASLIK:")) {
      const parts = fullText.split("ICERIK:");
      title = parts[0].replace("BASLIK:", "").trim();
      content = parts[1]?.trim() || parts[0].trim();
    }
    
    return { title, content };
  };

  // Ultra-fluid typing effect using a high-frequency interval
  const startSmoothTyping = useCallback(() => {
    if (displayIntervalRef.current) return;
    
    displayIntervalRef.current = window.setInterval(() => {
      if (pendingTextRef.current.length > 0) {
        // Dynamic step: take more chars if buffer is filling up, but at least 1-2 for fluidity
        const step = Math.max(1, Math.floor(pendingTextRef.current.length / 5));
        const chars = pendingTextRef.current.substring(0, step);
        pendingTextRef.current = pendingTextRef.current.substring(step);
        setStreamingText(prev => prev + chars);
      } else if (streamFinishedRef.current) {
        // Stream is over AND buffer is empty
        window.clearInterval(displayIntervalRef.current!);
        displayIntervalRef.current = null;
        finishGeneration();
      }
    }, 12); // ~83 FPS for ultra-smooth updates
  }, []);

  const finishGeneration = () => {
    setStreamingText(prev => {
      const { title, content } = parseStreamingResponse(prev);
      const petition: GeneratedPetition = {
        title: title || "Dilekçe Taslağı",
        content: content || prev,
        version: history.length === 0 ? "v1" : `v${history.length + 1}`
      };
      
      setHistory(prevHist => {
        const newHist = [...prevHist, petition];
        setActiveIndex(newHist.length - 1);
        return newHist;
      });
      
      setIsStreaming(false);
      setLoading(false);
      return ""; // Reset streaming view
    });
  };

  const handleGenerate = async () => {
    if (creditsRemaining < 15) { setError('Dilekçe yazımı için 15 kredi gereklidir.'); return; }
    
    setLoading(true);
    setError(null);
    setStreamingText('');
    pendingTextRef.current = "";
    streamFinishedRef.current = false;
    setIsStreaming(true);
    startSmoothTyping();
    
    try {
      const stream = await generatePetitionStream(formData);
      for await (const chunk of stream) {
        pendingTextRef.current += chunk.text || "";
      }
      streamFinishedRef.current = true;
      deductCredit(15);
    } catch (err) { 
      setError('Dilekçe oluşturulurken bir hata oluştu.'); 
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!revisionText.trim() || loading || isStreaming) return;
    const cost = history.length === 1 ? 0 : 5;
    if (creditsRemaining < cost) { setError(`Revizyon için ${cost} kredi gereklidir.`); return; }

    setLoading(true);
    setError(null);
    setStreamingText('');
    pendingTextRef.current = "";
    streamFinishedRef.current = false;
    setIsStreaming(true);
    startSmoothTyping();

    try {
      const stream = await revisePetitionStream(currentPetition, revisionText);
      for await (const chunk of stream) {
        pendingTextRef.current += chunk.text || "";
      }
      streamFinishedRef.current = true;
      setRevisionText('');
      if (cost > 0) deductCredit(cost);
    } catch (err) { 
      setError('Revizyon başarısız.'); 
      setIsStreaming(false);
      setLoading(false);
    }
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
    const udfContent = `<?xml version="1.0" encoding="UTF-8"?>\n<dokuman>\n    <baslik>${currentPetition.title}</baslik>\n    <icerik>${currentPetition.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</icerik>\n    <metadata>\n        <version>${currentPetition.version}</version>\n        <generator>Dava Pusulası AI</generator>\n    </metadata>\n</dokuman>`;
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

  // Smart Header Detection for Bold Styling
  const renderFormattedContent = (rawContent: string) => {
    if (!rawContent) return null;

    const headers = [
      'GÖREVLİ MAHKEME',
      'DAVACI',
      'DAVALI',
      'VEKİLİ',
      'KONU',
      'DAVA DEĞERİ',
      'AÇIKLAMALAR',
      'DELİLLER',
      'HUKUKİ NEDENLER',
      'NETİCE-İ TALEP',
      'TANIKLARIMIZ',
      'İLGİLİ İÇTİHATLAR',
      'YARGITAY'
    ];

    return rawContent.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      // Check if line is a major section header (all caps, contains keywords, or starts with known header)
      const isHeader = headers.some(h => trimmedLine.toUpperCase().startsWith(h)) || 
                      (trimmedLine.length > 3 && trimmedLine.length < 50 && trimmedLine.toUpperCase() === trimmedLine && !trimmedLine.includes('.'));
      
      if (isHeader) {
        return (
          <div key={idx} className="mt-8 mb-4">
            <h4 className="text-slate-900 font-extrabold text-lg lg:text-xl tracking-tight border-b-2 border-[#C5A059]/10 pb-2 inline-block min-w-[200px]">
              {line}
            </h4>
          </div>
        );
      }
      return <div key={idx} className="mb-3 text-slate-700 leading-relaxed font-light">{line}</div>;
    });
  };

  const displayContent = isStreaming ? parseStreamingResponse(streamingText).content : currentPetition?.content || "";

  return (
    <div className="space-y-24 reveal pb-32">
      <header className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Akıllı <span className="italic text-[#C5A059]">Dilekçe</span> Yazım Mühendisliği.
        </h2>
        <p className="text-lg text-slate-500 font-light">Mevzuat ve Yargıtay içtihatlarıyla harmanlanmış profesyonel taslağınızı saniyeler içinde, akıcı bir şekilde oluşturun.</p>
      </header>

      {(!currentPetition && !isStreaming) ? (
        <div className="max-w-4xl mx-auto luxury-card rounded-[4rem] p-16 bg-white border border-slate-50 space-y-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Dilekçe Türü</label>
              <select 
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 text-slate-700 font-medium"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                <option value="Dava Dilekçesi">Dava Dilekçesi</option>
                <option value="Cevap Dilekçesi">Cevap Dilekçesi</option>
                <option value="İstinaf Dilekçesi">İstinaf Dilekçesi</option>
                <option value="Temyiz Dilekçesi">Temyiz Dilekçesi</option>
                <option value="Bilirkişi Raporuna İtiraz">Bilirkişi Raporuna İtiraz</option>
                <option value="Suç Duyurusu">Suç Duyurusu</option>
                <option value="İhtarname">İhtarname</option>
                <option value="Beyan Dilekçesi">Beyan Dilekçesi</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Sunulacak Makam</label>
              <input 
                placeholder="Örn: Ankara 12. Asliye Hukuk Mahkemesi"
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 font-medium"
                value={formData.target}
                onChange={e => setFormData({...formData, target: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Olay Özeti ve Talepler</label>
            <textarea 
              placeholder="Uyuşmazlığı, tarafları ve Yargıtay atıfı istediğiniz özel noktaları buraya yazın..."
              className="w-full p-8 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 min-h-[200px] resize-none font-light leading-relaxed"
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
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">İçtihatlarla Zenginleştirilmiş Mod</span>
            </label>
            <button 
              onClick={handleGenerate}
              disabled={loading || !formData.summary}
              className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-500 disabled:opacity-30 active:scale-95 shadow-lg"
            >
              {loading ? 'Yazım Motoru Aktif...' : 'Dilekçeyi Oluştur (15 Kredi)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-[1600px] mx-auto">
          <div className="lg:col-span-8 space-y-8">
            <div className="luxury-card rounded-[4rem] bg-white border border-slate-50 overflow-hidden shadow-2xl relative">
               <div className="p-10 border-b border-slate-50 bg-[#FDFCFB] flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black bg-[#C5A059] text-white px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
                      {isStreaming ? 'CANLI YAZIM' : currentPetition?.version}
                    </span>
                    <h3 className="font-serif italic text-2xl text-slate-900">
                      {isStreaming ? 'İçtihat Analizi Yapılıyor...' : currentPetition?.title}
                    </h3>
                  </div>
                  {!isStreaming && (
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
                        className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        UDF İndir
                      </button>
                    </div>
                  )}
               </div>
               
               <div ref={scrollRef} className="p-16 lg:p-24 relative min-h-[600px] max-h-[900px] overflow-y-auto custom-scrollbar bg-[#FFFFFF]">
                  <div className="font-serif text-xl leading-[1.9] text-slate-800 selection:bg-[#C5A059]/20">
                    {renderFormattedContent(displayContent)}
                    {isStreaming && (
                      <span className="inline-block w-2 h-6 ml-1 bg-[#C5A059] animate-pulse align-middle"></span>
                    )}
                  </div>
                  
                  {!isStreaming && (
                    <div className="mt-20 pt-10 border-t border-slate-50">
                      <p className="text-[10px] text-slate-400 font-light italic text-center max-w-lg mx-auto leading-relaxed">
                        ⚠️ Bu taslak yapay zekâ tarafından en güncel mevzuat ve Yargıtay içtihatları taranarak hazırlanmıştır. Sunulan Yargıtay ilamlarının güncelliğini Yargıtay Bilgi İşlem sistemi üzerinden teyit etmeniz önerilir.
                      </p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className={`luxury-card p-10 rounded-[3.5rem] bg-white border border-slate-50 transition-all duration-700 ${isStreaming ? 'opacity-30 pointer-events-none scale-95 blur-[2px]' : 'shadow-xl'}`}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Dilekçe Arşivi</h4>
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

            <div className={`luxury-card p-10 rounded-[3.5rem] bg-slate-900 text-white border border-[#C5A059]/10 sticky top-32 transition-all duration-700 ${isStreaming ? 'opacity-30 pointer-events-none grayscale' : 'shadow-2xl shadow-slate-900/20'}`}>
               <h4 className="text-xl font-serif italic text-[#C5A059] mb-8">İnteraktif Revizyon</h4>
               <p className="text-xs text-slate-400 font-light mb-8">
                 {history.length === 1 ? (
                   <span className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                     İlk Revizyon Ücretsiz
                   </span>
                 ) : (
                   <span className="text-[#C5A059] font-bold">Revizyon Ücreti: 5 Kredi</span>
                 )}
               </p>
               
               <div className="space-y-6">
                  <textarea 
                    placeholder="Örn: 'İlgili Yargıtay kararlarını arttır' veya 'İhtiyati tedbir talebimi gerekçelendir'..."
                    className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#C5A059] min-h-[140px] text-sm font-light text-slate-300 resize-none transition-all placeholder:text-slate-600"
                    value={revisionText}
                    onChange={e => setRevisionText(e.target.value)}
                  />
                  <button 
                    onClick={handleRevise}
                    disabled={loading || !revisionText || isStreaming}
                    className="w-full py-5 bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#C5A059]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                  >
                    {loading ? 'İnceleniyor...' : 'Revize Et'}
                  </button>
               </div>
            </div>

            <button 
              onClick={() => {
                if(confirm('Mevcut dilekçe taslağı ve geçmişi temizlenecektir. Emin misiniz?')) {
                  setHistory([]);
                  setActiveIndex(0);
                  setStreamingText('');
                  pendingTextRef.current = "";
                }
              }}
              disabled={isStreaming}
              className="w-full py-4 rounded-2xl border border-slate-100 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-50 hover:text-red-400 hover:border-red-100 transition-all disabled:opacity-30"
            >
              Yeni Dilekçe Başlat
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
