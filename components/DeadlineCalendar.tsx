
import React, { useState, useEffect, useMemo } from 'react';

interface DeadlineResult {
  lastDay: string;
  notes: string[];
  isWeekend: boolean;
  isJudicialHoliday: boolean;
}

const DeadlineCalendar: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationValue, setDurationValue] = useState(15);
  const [durationType, setDurationType] = useState<'day' | 'week' | 'month'>('day');
  const [isJudicialHolidayExtension, setIsJudicialHolidayExtension] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [savedDeadlines, setSavedDeadlines] = useState<{title: string, date: string}[]>([]);

  // Resmi Tatiller (Sabitler)
  const officialHolidays = [
    '01-01', // Yılbaşı
    '04-23', // Ulusal Egemenlik
    '05-01', // İşçi Bayramı
    '05-19', // Atatürk'ü Anma
    '07-15', // Demokrasi Günü
    '08-30', // Zafer Bayramı
    '10-29', // Cumhuriyet Bayramı
  ];

  const calculateDeadline = useMemo((): DeadlineResult => {
    let date = new Date(startDate);
    const notes: string[] = [];
    
    // Süre hesaplama başlangıcı (Tebliği izleyen günden itibaren başlar)
    date.setDate(date.getDate() + 1);
    notes.push("Hesaplama tebliği izleyen günden (H+1) itibaren başlatılmıştır.");

    // Temel süreyi ekle
    if (durationType === 'day') {
      date.setDate(date.getDate() + (durationValue - 1)); // -1 çünkü başlangıç günü zaten 1 sayıldı
    } else if (durationType === 'week') {
      date.setDate(date.getDate() + (durationValue * 7) - 1);
    } else if (durationType === 'month') {
      // Ay hesabı: HMK m. 92
      const startMonthDay = new Date(startDate).getDate();
      date = new Date(startDate);
      date.setMonth(date.getMonth() + durationValue);
      // Eğer o ayda o gün yoksa ayın son günü kabul edilir
      if (date.getDate() !== startMonthDay) {
        date.setDate(0);
      }
    }

    let isJudicialHoliday = false;
    // Adli Tatil Kontrolü (20 Temmuz - 31 Ağustos)
    const year = date.getFullYear();
    const judicialStart = new Date(year, 6, 20); // July is 6
    const judicialEnd = new Date(year, 7, 31); // August is 7

    if (isJudicialHolidayExtension) {
      if (date >= judicialStart && date <= judicialEnd) {
        isJudicialHoliday = true;
        date = new Date(year, 8, 7); // 7 Eylül
        notes.push("Sürenin sonu adli tatile rastladığı için HMK m. 93 uyarınca 7 Eylül tarihine uzatılmıştır.");
      }
    }

    // Hafta Sonu ve Resmi Tatil Kontrolü (Sürekli kontrol döngüsü)
    let isAdjusted = true;
    while (isAdjusted) {
      isAdjusted = false;
      const day = date.getDay();
      const monthDayStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const isWeekend = day === 0 || day === 6;
      const isHoliday = officialHolidays.includes(monthDayStr);

      if (isWeekend || isHoliday) {
        date.setDate(date.getDate() + 1);
        isAdjusted = true;
        if (isWeekend) notes.push(`Sürenin son günü hafta sonuna (${day === 0 ? 'Pazar' : 'Cumartesi'}) rastladığı için ilk iş gününe uzatılmıştır.`);
        if (isHoliday) notes.push(`Sürenin son günü resmi tatile (${monthDayStr}) rastladığı için bir sonraki güne uzatılmıştır.`);
      }
    }

    return {
      lastDay: date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' }),
      notes: Array.from(new Set(notes)), // Tekrar eden notları temizle
      isWeekend: false,
      isJudicialHoliday
    };
  }, [startDate, durationValue, durationType, isJudicialHolidayExtension]);

  const saveDeadline = () => {
    if (!customTitle) return;
    setSavedDeadlines([...savedDeadlines, { title: customTitle, date: calculateDeadline.lastDay }]);
    setCustomTitle('');
  };

  return (
    <div className="space-y-16 reveal pb-32 max-w-6xl mx-auto">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h2 className="text-5xl lg:text-6xl font-serif font-light text-slate-900 mb-8 leading-tight">
          Süreli İş <span className="italic text-[#C5A059]">Takvimi</span> ve Hesaplayıcı.
        </h2>
        <p className="text-lg text-slate-500 font-light">
          HMK, CMK ve İYUK uyarınca tebliğ ve kesinleşme sürelerini adli tatil ve resmi tatil parametreleriyle hatasız hesaplayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="luxury-card rounded-[3.5rem] p-10 lg:p-12 bg-white border border-slate-50 space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Tebliğ / Karar Tarihi</label>
              <input 
                type="date"
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 text-slate-700 font-medium"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Süre Miktarı</label>
                <input 
                  type="number"
                  className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30"
                  value={durationValue}
                  onChange={(e) => setDurationValue(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Birim</label>
                <select 
                  className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30"
                  value={durationType}
                  onChange={(e) => setDurationType(e.target.value as any)}
                >
                  <option value="day">Gün</option>
                  <option value="week">Hafta</option>
                  <option value="month">Ay</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isJudicialHolidayExtension}
                    onChange={(e) => setIsJudicialHolidayExtension(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-slate-100 rounded-full peer peer-checked:bg-[#C5A059] transition-all duration-500"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-500 peer-checked:translate-x-6 shadow-sm"></div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Adli Tatil Uzatması Uygula</span>
              </label>
            </div>

            <div className="pt-8 border-t border-slate-50 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">Ajandaya Kaydet (Opsiyonel)</label>
                <input 
                  placeholder="Dosya Adı veya Not..."
                  className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-1 focus:ring-[#C5A059]/30 text-sm"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <button 
                onClick={saveDeadline}
                disabled={!customTitle}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#C5A059] transition-all disabled:opacity-20"
              >
                Takvime Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7 space-y-10">
          <div className="luxury-card rounded-[4rem] bg-white border border-[#C5A059]/20 p-12 lg:p-16 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
             
             <div className="relative z-10 text-center space-y-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A059] mb-4 block">Hesaplanan Son Gün</span>
                  <h3 className="text-4xl lg:text-5xl font-serif italic text-slate-900 leading-tight">
                    {calculateDeadline.lastDay}
                  </h3>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  {calculateDeadline.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-4 text-left p-4 bg-slate-50 rounded-2xl">
                      <svg className="w-5 h-5 text-[#C5A059] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t border-slate-50 grid grid-cols-2 gap-8 text-center">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Tebliğ Tarihi</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(startDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Süre Türü</p>
                    <p className="text-sm font-bold text-slate-900">
                      {durationValue} {durationType === 'day' ? 'Gün' : durationType === 'week' ? 'Hafta' : 'Ay'}
                    </p>
                  </div>
                </div>
             </div>
          </div>

          {/* Saved Deadlines List */}
          {savedDeadlines.length > 0 && (
            <div className="luxury-card rounded-[3.5rem] p-10 bg-[#FDFCFB] border border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Ajandamdaki Süreler</h4>
              <div className="space-y-4">
                {savedDeadlines.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-6 bg-white border border-slate-50 rounded-[2rem] shadow-sm hover:border-[#C5A059]/30 transition-all group">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mb-1">{item.title}</p>
                      <p className="text-sm font-serif italic text-slate-700">{item.date}</p>
                    </div>
                    <button 
                      onClick={() => setSavedDeadlines(savedDeadlines.filter((_, i) => i !== idx))}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Quick Tips */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white/90">
            <h4 className="text-xl font-serif italic text-[#C5A059] mb-8">Hukuki Notlar</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">HMK m. 93</p>
                <p className="text-xs font-light leading-relaxed">Sürenin son günü adli tatile rastlarsa, bu süre adli tatilin bittiği günden itibaren bir hafta uzatılmış sayılır (7 Eylül).</p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#C5A059]">HMK m. 92</p>
                <p className="text-xs font-light leading-relaxed">Süreler gün olarak belirlenmişse tebliğ günü sayılmaz; süre ay veya yıl olarak belirlenmişse son ayın aynı gününde biter.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeadlineCalendar;
