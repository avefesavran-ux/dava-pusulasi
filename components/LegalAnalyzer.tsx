
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
  const [petitionResult, setPetitionResult] = useState<AnalysisResult | null>(null);
  const [contractResult, setContractResult] = useState<ContractRiskReport | null>(null);
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
    setPetitionResult(null);
    setContractResult(null);
    
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
        setPetitionResult(data);
      } else {
        const data = await analyzeContractRisk(fileContent);
        setContractResult(data);
      }
      deductCredit(10);
    } catch (err) {
      setError('Hukuki analiz sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-emerald-500 border-emerald-100 bg-emerald-50/30';
    if (score <= 40) return 'text-blue-500 border-blue-100 bg-blue-50/30';
    if (score <= 60) return 'text-amber-500 border-amber-100 bg-amber-50/30';
    if (score <= 80) return 'text-orange-500 border-orange-100 bg-orange-50/30';
    return 'text-red-500 border-red-100 bg-red-50/30';
  };

  return (
    <div className="space-y-24 reveal pb-32">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Yapay Zeka ile {mode === 'petition' ? 'Dilekçe Analiz' : 'Sözleşme İnceleme'} <span className="italic text-[#C5A059]">Mühendisliği</span>.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-6xl mx-auto">
        <div className="lg:col-span-3 space-y-8">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`luxury-card rounded-[3.5rem] p-16 text-center transition-all duration-700 bg-white relative overflow-hidden border-2 border-dashed ${
              isDragging ? 'border-[#C5A059] scale-[1.02] bg-[#C5A059]/5' : 'border-slate-100 hover:border-[#C5A059]/30'
            }`}
          >
            <label htmlFor="file-upload" className="block cursor-pointer group">
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all duration-700 ${
                  isDragging ? 'bg-[#C5A059] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-[#C5A059] group-hover:text-white group-hover:-translate-y-2'
                }`}>
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <h4 className="text-2xl font-serif italic text-slate-900 mb-3 truncate px-4">
                  {fileName || (isParsing ? 'İşleniyor...' : 'Dosya Seçiniz')}
                </h4>
              </div>
              <input id="file-upload" type="file" className="hidden" accept=".udf,.xml,.txt,.pdf,.docx" onChange={handleFileUpload} />
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !fileContent || creditsRemaining < 10 || isParsing}
            className="w-full py-6 bg-slate-900 text-white font-bold rounded-3xl shadow-2xl hover:bg-[#C5A059] transition-all duration-700 disabled:opacity-40 flex items-center justify-center gap-5 text-xs tracking-[0.3em] uppercase active:scale-95"
          >
            {loading ? 'Analiz Ediliyor...' : 'Kapsamlı Raporu Oluştur (10 Kredi)'}
          </button>
        </div>

        <aside className="lg:col-span-2 space-y-10">
          <div className="luxury-card rounded-[3rem] p-12 space-y-10 border border-slate-50">
            <h5 className="text-[11px] uppercase tracking-[0.4em] font-black text-[#C5A059]">Metodoloji</h5>
            <div className="space-y-10">
              {(mode === 'petition' ? [
                { title: 'Semantik Tutarlılık', desc: 'İddialar arasındaki mantıksal ağın örülmesi.' },
                { title: 'Reaktif Strateji', desc: 'Karşı tarafın muhtemel itiraz simülasyonu.' }
              ] : [
                { title: 'Senior Associate Gözü', desc: 'Sözleşme risklerini kıdemli avukat titizliğiyle tarama.' },
                { title: 'Yargıtay Filtresi', desc: 'Maddelerin mahkeme önündeki geçerlilik pratiği.' }
              ]).map((item, i) => (
                <div key={i}>
                  <p className="font-serif italic text-xl text-slate-900 mb-2">{item.title}</p>
                  <p className="text-sm text-slate-400 font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-12 bg-red-50/50 border border-red-100 rounded-[3rem] text-red-800 text-center">
          {error}
        </div>
      )}

      {/* Rapor içerikleri buralarda petitionResult ve contractResult'a göre render edilir */}
    </div>
  );
};

export default LegalAnalyzer;
