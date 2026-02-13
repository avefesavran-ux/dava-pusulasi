
import React, { useState, useCallback } from 'react';
import { analyzePetition, analyzeContractRisk, parseDocument } from '../services/geminiService';
import { AnalysisResult, ContractRiskReport } from '../types';

interface LegalAnalyzerProps {
  mode: 'petition' | 'contract';
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

// Minimalist SVG Icons
const Icons = {
  Shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Brain: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Scale: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  Target: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  Doc: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Pen: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
};

const LegalAnalyzer: React.FC<LegalAnalyzerProps> = ({ mode, deductCredit, creditsRemaining }) => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const allowedExtensions = ['udf', 'xml', 'pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext && !allowedExtensions.includes(ext)) {
      setError(`Desteklenmeyen dosya formatı.`);
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setError(null);
    setAnalysisReport(null);
    
    try {
      const text = await parseDocument(file);
      setFileContent(text);
    } catch (err: any) {
      setError('Dosya okunurken bir hata oluştu.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = async () => {
    if (!fileContent) { setError("Lütfen önce bir dosya yükleyin."); return; }
    if (creditsRemaining < 10) { setError("Analiz için 10 kredi gereklidir."); return; }
    
    setLoading(true);
    setError(null);

    try {
      if (mode === 'petition') {
        const data = await analyzePetition(fileContent);
        setAnalysisReport(data);
      } else {
        const data = await analyzeContractRisk(fileContent);
        setAnalysisReport(data);
      }
      deductCredit(10);
    } catch (err) {
      setError('Hukuki analiz sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (analysisReport) {
      navigator.clipboard.writeText(analysisReport);
      alert('Analiz raporu kopyalandı.');
    }
  };

  return (
    <div className="space-y-24 reveal pb-32">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 dark:text-luxury-silver mb-8 leading-tight transition-colors duration-700">
          Yapay Zeka ile {mode === 'petition' ? 'Dilekçe Analiz' : 'Sözleşme İnceleme'} <span className="italic text-[#C5A059]">Mühendisliği</span>.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-6xl mx-auto">
        <div className="lg:col-span-3 space-y-8">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`luxury-card rounded-[3.5rem] p-16 text-center transition-all duration-700 bg-white dark:bg-luxury-charcoal relative overflow-hidden border-2 border-dashed ${
              isDragging ? 'border-[#C5A059] scale-[1.02] bg-[#C5A059]/5' : 'border-slate-100 dark:border-slate-800 hover:border-[#C5A059]/30'
            }`}
          >
            <label htmlFor="file-upload" className="block cursor-pointer group">
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all duration-700 ${
                  isDragging ? 'bg-[#C5A059] text-white' : 'bg-slate-50 dark:bg-luxury-midnight text-slate-400 dark:text-luxury-steel group-hover:bg-[#C5A059] group-hover:text-white group-hover:-translate-y-2'
                }`}>
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <h4 className="text-2xl font-serif italic text-slate-900 dark:text-luxury-silver mb-3 truncate px-4">
                  {fileName || (isParsing ? 'İşleniyor...' : 'Dosya Seçiniz')}
                </h4>
              </div>
              <input id="file-upload" type="file" className="hidden" accept=".udf,.xml,.txt,.pdf,.docx" onChange={handleFileUpload} />
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !fileContent || creditsRemaining < 10 || isParsing}
            className="w-full py-6 bg-slate-900 dark:bg-luxury-charcoal text-white font-bold rounded-3xl shadow-2xl hover:bg-[#C5A059] transition-all duration-700 disabled:opacity-40 flex items-center justify-center gap-5 text-xs tracking-[0.3em] uppercase active:scale-95"
          >
            {loading ? 'Analiz Ediliyor...' : 'Kapsamlı Raporu Oluştur (10 Kredi)'}
          </button>
        </div>

        <aside className="lg:col-span-2 space-y-10">
          <div className="luxury-card rounded-[3rem] p-10 space-y-10 border border-slate-50 dark:border-slate-800 bg-white dark:bg-luxury-midnight transition-colors">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-[#C5A059]">Analiz Kriterleri</h5>
            <div className="space-y-10">
              {(mode === 'petition' ? [
                { icon: <Icons.Shield />, title: 'Usul & Şekil İncelemesi', desc: 'HMK/CMK uyumluluğu ve usuli risklerin tespiti.' },
                { icon: <Icons.Brain />, title: 'Maddi Vakıa & Mantık', desc: 'İddialar ve talepler arasındaki illiyet bağı analizi.' },
                { icon: <Icons.Scale />, title: 'İspat Yükü Kontrolü', desc: 'Delil yeterliliği ve ispat yükü dağılımı denetimi.' },
                { icon: <Icons.Target />, title: 'Red Teaming', desc: 'Karşı tarafın saldırabileceği zayıf noktaların simülasyonu.' }
              ] : [
                { icon: <Icons.Doc />, title: 'Sözleşme Röntgeni', desc: 'Sözleşmenin hukuki niteliği ve uygulanacak hukuk analizi.' },
                { icon: <Icons.Alert />, title: 'Kırmızı Alarmlar', desc: 'Asimetrik riskler ve satır arası tehlikelerin tespiti.' },
                { icon: <Icons.Shield />, title: 'Beyaz Alanlar', desc: 'Eksik koruyucu hükümlerin ve boşlukların belirlenmesi.' },
                { icon: <Icons.Pen />, title: 'Redlining', desc: 'Doğrudan alternatif/revize edilmiş madde taslakları.' }
              ]).map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-[#C5A059] mt-1 shrink-0">{item.icon}</div>
                  <div>
                    <p className="font-serif italic text-lg text-slate-900 dark:text-luxury-silver mb-1.5">{item.title}</p>
                    <p className="text-xs text-slate-400 dark:text-luxury-steel font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {analysisReport && (
        <div className="max-w-6xl mx-auto space-y-12 reveal">
          <div className="flex items-center justify-between px-8">
            <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-slate-900 dark:text-luxury-steel">
              {mode === 'petition' ? 'Stratejik Hukuki Check-Up Raporu' : 'Kapsamlı Due Diligence Raporu'}
            </h3>
            <button 
              onClick={copyReport}
              className="text-[10px] uppercase font-bold text-[#C5A059] hover:underline tracking-widest"
            >
              Raporu Kopyala
            </button>
          </div>

          <article className="luxury-card p-16 lg:p-24 rounded-[4rem] bg-white dark:bg-[#060A10] relative overflow-hidden transition-all duration-700">
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-luxury-midnight rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
             <div className="relative z-10 prose prose-slate dark:prose-invert max-w-none">
                <div className="font-serif text-xl lg:text-2xl leading-[1.8] text-slate-800 dark:text-luxury-silver whitespace-pre-wrap text-justify selection:bg-[#C5A059]/20">
                  {analysisReport}
                </div>
             </div>
             
             <div className="mt-20 pt-10 border-t border-slate-50 dark:border-slate-800/50 text-center">
                <p className="text-[9px] text-slate-400 dark:text-luxury-steel font-light italic max-w-lg mx-auto leading-relaxed uppercase tracking-widest">
                  Analiz Motoru: Dava Pusulası v2.5 / Semantik Hukuki Mütalaa
                </p>
             </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default LegalAnalyzer;
