
import React, { useState, useCallback } from 'react';
import { parseDocument, convertFile } from '../services/geminiService';
import { ConversionResult } from '../types';

interface FileConverterProps {
  deductCredit: (amount?: number) => void;
  creditsRemaining: number;
}

const FileConverter: React.FC<FileConverterProps> = ({ deductCredit, creditsRemaining }) => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversionType, setConversionType] = useState('word-to-udf');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conversionOptions = [
    { id: 'word-to-udf', label: 'Word → UDF', from: 'docx', to: 'udf' },
    { id: 'udf-to-word', label: 'UDF → Word', from: 'udf', to: 'docx' },
    { id: 'pdf-to-udf', label: 'PDF → UDF', from: 'pdf', to: 'udf' },
    { id: 'udf-to-pdf', label: 'UDF → PDF', from: 'udf', to: 'pdf' },
    { id: 'pdf-to-word', label: 'PDF → Word', from: 'pdf', to: 'docx' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setError(null);
    setResult(null);

    try {
      const text = await parseDocument(file);
      setFileContent(text);
    } catch (err: any) {
      setError('Dosya okunamadı.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConvert = async () => {
    if (!fileContent) { setError('Lütfen önce dosya yükleyin.'); return; }
    
    setLoading(true);
    setError(null);
    
    try {
      const option = conversionOptions.find(o => o.id === conversionType);
      if (!option) return;

      const data = await convertFile(fileContent, option.from, option.to);
      setResult(data);
      // deductCredit(0); // Ücretsiz araçlar
    } catch (err) {
      setError('Dönüşüm motoru hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const option = conversionOptions.find(o => o.id === conversionType);
    const ext = option?.to || 'txt';
    
    let contentBlob;
    if (ext === 'udf') {
      contentBlob = new Blob([JSON.stringify(result.udf_data, null, 2)], { type: 'application/json' });
    } else {
      contentBlob = new Blob([result.output_text], { type: 'text/plain' });
    }

    const url = URL.createObjectURL(contentBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donusturulmus_${fileName.split('.')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-20 reveal pb-32">
      <header className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Dosya <span className="italic text-[#C5A059]">Dönüştürme</span> Robotu.
        </h2>
        <p className="text-lg text-slate-500 font-light">
          Hukuki belgelerinizi ücretsiz olarak Word, PDF ve UDF formatları arasında dönüştürün.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="luxury-card p-10 rounded-[3rem] bg-white border border-slate-50">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Dönüşüm Tipi</h4>
            <div className="space-y-3">
              {conversionOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setConversionType(opt.id)}
                  className={`w-full p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all text-left flex justify-between items-center ${
                    conversionType === opt.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-[#C5A059]/30'
                  }`}
                >
                  {opt.label}
                  {conversionType === opt.id && <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-pulse"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="luxury-card p-10 rounded-[3rem] bg-white border border-slate-50">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Dosya Yükle</h4>
            <label className="block border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center cursor-pointer hover:border-[#C5A059]/30 transition-all group">
              <input type="file" className="hidden" onChange={handleFileUpload} />
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#C5A059]/10 transition-all">
                <svg className="w-6 h-6 text-slate-300 group-hover:text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-900 truncate">
                {fileName || 'Dosya Seçiniz'}
              </p>
            </label>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading || !fileContent || isParsing}
            className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-30"
          >
            {loading ? 'Dönüştürülüyor...' : 'Ücretsiz Dönüştür'}
          </button>
        </div>

        <div className="lg:col-span-8">
          {result ? (
            <div className="luxury-card rounded-[4rem] bg-white border border-slate-50 overflow-hidden shadow-2xl reveal h-full flex flex-col">
              <div className="p-10 border-b border-slate-50 bg-[#FDFCFB] flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-4 py-1.5 rounded-full uppercase tracking-widest">BAŞARILI</span>
                </div>
                <button 
                  onClick={downloadResult}
                  className="flex items-center gap-3 px-8 py-4 bg-[#C5A059] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
                >
                  İndir
                </button>
              </div>
              <div className="p-16 flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar">
                <div className="font-serif text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {result.output_text}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full luxury-card rounded-[4rem] border border-slate-50 flex flex-col items-center justify-center p-20 text-center bg-white/50 border-dashed border-2">
              <h4 className="text-3xl font-serif italic text-slate-300 mb-4">Dönüşüm Bekleniyor</h4>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-sm font-medium shadow-2xl z-[100]">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileConverter;
