
import React, { useState, useCallback } from 'react';
import { analyzePetition, analyzeContractRisk, parseDocument } from '../services/geminiService';
import { AnalysisResult, ContractRiskReport } from '../types';

interface LegalAnalyzerProps {
  mode: 'petition' | 'contract';
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

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
            className={`luxury-card rounded-[3.5rem] p-16 text-center transition-all duration-700 bg-white dark:bg-[#112244] relative overflow-hidden border-2 border-dashed ${
              isDragging ? 'border-[#C5A059] scale-[1.02] bg-[#C5A059]/5' : 'border-slate-100 dark:border-slate-800/60 hover:border-[#C5A059]/30 transition-colors'
            }`}
          >
            <label htmlFor="file-upload" className="block cursor-pointer group">
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all duration-700 ${
                  isDragging ? 'bg-[#C5A059] text-white' : 'bg-slate-50 dark:bg-luxury-midnight text-slate-400 dark:text-luxury-silver group-hover:bg-[#C5A059] group-hover:text-white group-hover:-translate-y-2 transition-colors'
                }`}>
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <h4 className="text-2xl font-serif italic text-slate-900 dark:text-luxury-silver mb-3 truncate px-4 transition-colors">
                  {fileName || (isParsing ? 'İşleniyor...' : 'Dosya Seçiniz')}
                </h4>
              </div>
              <input id="file-upload" type="file" className="hidden" accept=".udf,.xml,.txt,.pdf,.docx" onChange={handleFileUpload} />
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !fileContent || creditsRemaining < 10 || isParsing}
            className="w-full py-6 bg-slate-900 dark:bg-luxury-midnight text-white font-bold rounded-3xl shadow-2xl hover:bg-[#C5A059] transition-all duration-700 disabled:opacity-40 flex items-center justify-center gap-5 text-xs tracking-[0.3em] uppercase active:scale-95 border border-[#C5A059]/20"
          >
            {loading ? 'Analiz Ediliyor...' : 'Kapsamlı Raporu Oluştur (10 Kredi)'}
          </button>
        </div>

        <aside className="lg:col-span-2 space-y-10">
          <div className="luxury-card rounded-[3rem] p-12 space-y-10 border border-slate-50 dark:border-slate-800/60 bg-white dark:bg-[#112244] transition-colors">
            <h5 className="text-[11px] uppercase tracking-[0.4em] font-black text-[#C5A059]">Analiz Kriterleri</h5>
            <div className="space-y-10">
              {(mode === 'petition' ? [
                { title: 'Usul ve Şekil İncelemesi', desc: 'HMK/CMK uyumluluğu ve usuli risklerin tespiti.' },
                { title: 'Maddi Vakıa ve Mantık', desc: 'İddialar ve talepler arasındaki illiyet bağı analizi.' },
                { title: 'İspat Yükü Kontrolü', desc: 'Delil yeterliliği ve ispat yükü dağılımı denetimi.' },
                { title: 'Red Teaming', desc: 'Karşı tarafın saldırabileceği zayıf noktaların simülasyonu.' }
              ] : [
                { title: 'Sözleşme Röntgeni', desc: 'Sözleşmenin hukuki niteliği ve uygulanacak hukuk analizi.' },
                { title: 'Kırmızı Alarmlar', desc: 'Asimetrik riskler ve satır arası tehlikelerin tespiti.' },
                { title: 'Beyaz Alanlar', desc: 'Eksik koruyucu hükümlerin ve boşlukların belirlenmesi.' },
                { title: 'Redlining', desc: 'Doğrudan alternatif/revize edilmiş madde taslakları.' }
              ]).map((item, i) => (
                <div key={i}>
                  <p className="font-serif italic text-xl text-slate-900 dark:text-luxury-silver mb-2 border-l-2 border-[#C5A059] pl-4 transition-colors">{item.title}</p>
                  <p className="text-sm text-slate-400 dark:text-luxury-silver/60 font-light transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-12 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-[3rem] text-red-800 dark:text-red-400 text-center transition-colors">
          {error}
        </div>
      )}

      {analysisReport && (
        <div className="max-w-6xl mx-auto space-y-12 reveal">
          <div className="flex items-center justify-between px-8">
            <h3 className="text-[11px] uppercase tracking-[0.6em] font-black text-slate-900 dark:text-luxury-silver transition-colors">
              {mode === 'petition' ? 'Stratejik Hukuki Check-Up Raporu' : 'Kapsamlı Due Diligence Raporu'}
            </h3>
            <button 
              onClick={copyReport}
              className="text-[10px] uppercase font-bold text-[#C5A059] hover:underline tracking-widest"
            >
              Raporu Kopyala
            </button>
          </div>

          <article className="luxury-card p-16 lg:p-24 rounded-[4rem] bg-white dark:bg-[#060A10] relative overflow-hidden transition-all duration-700 border border-slate-50 dark:border-slate-800">
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-luxury-midnight rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
             <div className="relative z-10 prose prose-slate dark:prose-invert max-w-none transition-colors">
                <div className="font-serif text-xl lg:text-2xl leading-[1.8] text-slate-800 dark:text-luxury-silver whitespace-pre-wrap text-justify selection:bg-[#C5A059]/20 transition-colors">
                  {analysisReport}
                </div>
             </div>
             
             <div className="mt-20 pt-10 border-t border-slate-50 dark:border-slate-800/50 text-center transition-colors">
                <p className="text-[10px] text-slate-400 dark:text-luxury-silver/40 font-light italic max-w-lg mx-auto leading-relaxed uppercase tracking-widest transition-colors">
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
