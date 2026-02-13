
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generatePetitionStream, revisePetitionStream, parseDocument } from '../services/geminiService';
import { GeneratedPetition } from '../types';

interface PetitionGeneratorProps {
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

const PetitionGenerator: React.FC<PetitionGeneratorProps> = ({ deductCredit, creditsRemaining }) => {
  const [formData, setFormData] = useState({ type: '', target: '', summary: '', isLongMode: true });
  const [attachedFile, setAttachedFile] = useState<{ name: string, content: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedPetition[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revisionText, setRevisionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const pendingTextRef = useRef<string>("");
  const displayIntervalRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamFinishedRef = useRef<boolean>(false);

  const currentPetition = history[activeIndex];

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming]);

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

  const startSmoothTyping = useCallback(() => {
    if (displayIntervalRef.current) return;

    displayIntervalRef.current = window.setInterval(() => {
      if (pendingTextRef.current.length > 0) {
        // Hızlandırılmış akışkanlık: tampon doldukça daha fazla karakter al
        const step = Math.max(1, Math.floor(pendingTextRef.current.length / 4));
        const chars = pendingTextRef.current.substring(0, step);
        pendingTextRef.current = pendingTextRef.current.substring(step);
        setStreamingText(prev => prev + chars);
      } else if (streamFinishedRef.current) {
        window.clearInterval(displayIntervalRef.current!);
        displayIntervalRef.current = null;
        finishGeneration();
      }
    }, 15);
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
      return "";
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
      const stream = await generatePetitionStream({
        ...formData,
        fileContent: attachedFile?.content
      });
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

  const renderFormattedContent = (rawContent: string) => {
    if (!rawContent) return null;

    const headers = [
      'GÖREVLİ MAHKEME', 'DAVACI', 'DAVALI', 'VEKİLİ', 'KONU', 'DAVA DEĞERİ',
      'AÇIKLAMALAR', 'DELİLLER', 'HUKUKİ NEDENLER', 'NETİCE-İ TALEP',
      'TANIKLARIMIZ', 'İLGİLİ İÇTİHATLAR', 'YARGITAY'
    ];

    return rawContent.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      const isHeader = headers.some(h => trimmedLine.toUpperCase().startsWith(h)) ||
        (trimmedLine.length > 3 && trimmedLine.length < 50 && trimmedLine.toUpperCase() === trimmedLine && !trimmedLine.includes('.'));

      if (isHeader) {
        return (
          <div key={idx} className="mt-10 mb-5">
            <strong className="text-slate-900 dark:text-luxury-silver font-black text-lg lg:text-xl tracking-tight border-b-2 border-[#C5A059]/30 pb-2 inline-block min-w-[220px] uppercase transition-colors">
              {line}
            </strong>
          </div>
        );
      }
      return <div key={idx} className="mb-3 text-slate-700 dark:text-luxury-silver font-light leading-[1.95] transition-colors">{line}</div>;
    });
  };

  const displayContent = isStreaming ? parseStreamingResponse(streamingText).content : currentPetition?.content || "";

  return (
    <div className="space-y-24 reveal pb-32">
      <header className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 dark:text-luxury-silver mb-8 leading-tight transition-colors duration-700">
          Akıllı <span className="italic text-[#C5A059]">Dilekçe</span> Yazım Mühendisliği.
        </h2>
        <p className="text-lg text-slate-500 dark:text-luxury-silver opacity-60 font-light transition-colors">En güncel Yargıtay içtihatlarıyla harmanlanmış, gümüş-gri netliğinde profesyonel taslaklar.</p>
      </header>

      {(!currentPetition && !isStreaming) ? (
        <div className="max-w-4xl mx-auto luxury-card rounded-[4rem] p-16 bg-white dark:bg-luxury-midnight border border-slate-50 dark:border-slate-800/50 space-y-12 shadow-2xl transition-all duration-700">

          {/* File Upload Area */}
          <div
            className={`relative rounded-3xl border-2 border-dashed p-8 transition-all duration-300 ${isDragging
                ? 'border-[#C5A059] bg-[#C5A059]/5'
                : 'border-slate-200 dark:border-slate-700 hover:border-[#C5A059]/50'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file && (file.type === "application/pdf" || file.name.endsWith('.docx') || file.name.endsWith('.udf') || file.name.endsWith('.xml'))) {
                try {
                  const text = await parseDocument(file);
                  setAttachedFile({ name: file.name, content: text });
                } catch (err) {
                  setError("Dosya okunamadı.");
                }
              } else {
                setError("Sadece PDF, DOCX ve UDF dosyaları desteklenmektedir.");
              }
            }}
          >
            {attachedFile ? (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-luxury-charcoal p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-luxury-silver">{attachedFile.name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Dosya Analiz Edildi</p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3 cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-luxury-charcoal mx-auto flex items-center justify-center text-slate-400 dark:text-luxury-silver mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-luxury-silver">
                  <span className="text-[#C5A059] font-bold">Dosya Yükle</span> veya sürükleyip bırakın
                </p>
                <p className="text-xs text-slate-400 dark:text-luxury-silver opacity-50">PDF, DOCX veya UDF (Maks. 10MB)</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.udf,.xml"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const text = await parseDocument(file);
                        setAttachedFile({ name: file.name, content: text });
                      } catch (err) {
                        setError("Dosya okunamadı.");
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Dilekçe Türü</label>
              <select
                className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-luxury-silver font-medium focus:ring-1 focus:ring-[#C5A059]/30 transition-colors"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Seçiniz...</option>
                <option value="Dava Dilekçesi">Dava Dilekçesi</option>
                <option value="Cevap Dilekçesi">Cevap Dilekçesi</option>
                <option value="İstinaf Dilekçesi">İstinaf Dilekçesi</option>
                <option value="Temyiz Dilekçesi">Temyiz Dilekçesi</option>
                <option value="Suç Duyurusu">Suç Duyurusu</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Sunulacak Makam</label>
              <input
                placeholder="Örn: Ankara 12. Asliye Hukuk Mahkemesi"
                className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver font-medium transition-colors"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Olay Özeti ve Talepler</label>
            <textarea
              placeholder="Uyuşmazlığı ve içtihat istediğiniz noktaları gümüş-gri netliğinde anlatın..."
              className="w-full p-8 rounded-3xl bg-slate-50 dark:bg-luxury-charcoal border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-luxury-silver min-h-[220px] resize-none font-light leading-relaxed transition-colors"
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isLongMode}
                  onChange={e => setFormData({ ...formData, isLongMode: e.target.checked })}
                />
                <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-[#C5A059] transition-all duration-500"></div>
                <div className="absolute left-1 top-1 bg-white dark:bg-luxury-silver w-5 h-5 rounded-full transition-all duration-500 peer-checked:translate-x-7 shadow-sm"></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-luxury-silver opacity-60 group-hover:text-slate-900 dark:group-hover:text-luxury-silver transition-all">İçtihat Entegreli Mod</span>
            </label>
            <button
              onClick={handleGenerate}
              disabled={loading || !formData.summary}
              className="px-12 py-5 bg-slate-900 dark:bg-luxury-charcoal text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-500 disabled:opacity-30 shadow-lg"
            >
              {loading ? 'Dilekçe İnşa Ediliyor...' : 'Taslağı Oluştur (15 Kredi)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-[1600px] mx-auto">
          <div className="lg:col-span-8 space-y-8">
            <div className="luxury-card rounded-[4rem] bg-white dark:bg-luxury-charcoal border border-slate-50 dark:border-slate-800/50 overflow-hidden shadow-2xl relative transition-all duration-700">
              <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-[#FDFCFB] dark:bg-luxury-midnight/30 flex justify-between items-center sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black bg-[#C5A059] text-white px-5 py-2 rounded-full uppercase tracking-widest animate-pulse">
                    {isStreaming ? 'STREAMING' : currentPetition?.version}
                  </span>
                  <h3 className="font-serif italic text-2xl text-slate-900 dark:text-luxury-silver transition-colors">
                    {isStreaming ? 'İçtihatlar Yazılıyor...' : currentPetition?.title}
                  </h3>
                </div>
                {!isStreaming && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={copyToClipboard}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${copySuccess
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white dark:bg-luxury-midnight border-slate-100 dark:border-slate-800 text-slate-600 dark:text-luxury-silver hover:border-[#C5A059]'
                        }`}
                    >
                      {copySuccess ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    <button
                      onClick={downloadUDF}
                      className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-luxury-navy text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-lg"
                    >
                      UDF İndir
                    </button>
                  </div>
                )}
              </div>

              <div ref={scrollRef} className="p-16 lg:p-24 relative min-h-[600px] max-h-[900px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#060A10] transition-colors">
                <div className="font-serif text-xl leading-[1.95] text-slate-800 dark:text-luxury-silver selection:bg-[#C5A059]/30 transition-colors">
                  {renderFormattedContent(displayContent)}
                  {isStreaming && (
                    <span className="inline-block w-2.5 h-6 ml-1 bg-[#C5A059] animate-pulse align-middle"></span>
                  )}
                </div>

                {!isStreaming && (
                  <div className="mt-20 pt-10 border-t border-slate-50 dark:border-slate-800/50 transition-colors">
                    <p className="text-[10px] text-slate-400 dark:text-luxury-silver opacity-40 font-light italic text-center max-w-lg mx-auto leading-relaxed transition-colors">
                      ⚠️ Bu taslak yapay zekâ tarafından en güncel Yargıtay içtihatları taranarak hazırlanmıştır.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className={`luxury-card p-10 rounded-[3.5rem] bg-white dark:bg-luxury-midnight border border-slate-50 dark:border-slate-800 transition-all duration-700 ${isStreaming ? 'opacity-30 grayscale pointer-events-none' : 'shadow-xl'}`}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Dilekçe Arşivi</h4>
              <div className="space-y-3">
                {history.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all duration-500 border ${activeIndex === i
                        ? 'bg-slate-900 dark:bg-luxury-charcoal text-white border-slate-900 dark:border-[#C5A059]/40 shadow-xl'
                        : 'bg-slate-50 dark:bg-luxury-midnight text-slate-400 dark:text-luxury-silver opacity-60 border-slate-100 dark:border-slate-800 hover:text-slate-900 dark:hover:text-luxury-silver'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center ${activeIndex === i ? 'bg-[#C5A059] text-white' : 'bg-white dark:bg-luxury-charcoal text-slate-300 dark:text-luxury-silver border border-slate-100 dark:border-slate-800 transition-colors'
                        }`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold tracking-widest uppercase transition-colors">{p.version}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`luxury-card p-10 rounded-[3.5rem] bg-slate-900 dark:bg-luxury-charcoal text-white border border-[#C5A059]/20 sticky top-32 transition-all duration-700 ${isStreaming ? 'opacity-30 pointer-events-none grayscale' : 'shadow-2xl shadow-black/40'}`}>
              <h4 className="text-xl font-serif italic text-[#C5A059] mb-8">İnteraktif Revizyon</h4>
              <p className="text-xs text-slate-400 dark:text-luxury-silver opacity-40 font-light mb-8 transition-colors">
                {history.length === 1 ? (
                  <span className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    Revizyon Aktif
                  </span>
                ) : (
                  <span className="text-[#C5A059] font-bold">Maliyet: 5 Kredi</span>
                )}
              </p>

              <div className="space-y-6">
                <textarea
                  placeholder="Örn: 'Karşı tarafın itirazlarına daha sert cevap ver'..."
                  className="w-full p-6 rounded-2xl bg-white/5 dark:bg-luxury-midnight border border-white/10 dark:border-slate-800 focus:ring-[#C5A059] min-h-[140px] text-sm font-light text-slate-300 dark:text-luxury-silver transition-colors resize-none placeholder:text-slate-600"
                  value={revisionText}
                  onChange={e => setRevisionText(e.target.value)}
                />
                <button
                  onClick={handleRevise}
                  disabled={loading || !revisionText || isStreaming}
                  className="w-full py-5 bg-[#C5A059] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#C5A059]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                >
                  {loading ? 'Yenileniyor...' : 'Değişikliği Uygula'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default PetitionGenerator;
