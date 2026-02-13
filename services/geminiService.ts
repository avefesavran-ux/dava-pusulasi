
import { GoogleGenAI, Type } from "@google/genai";
import { CaseResult, AnalysisResult, ContractRiskReport, GeneratedPetition, ConversionResult } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

// --- SYSTEM INSTRUCTIONS ---

const SEARCH_SYSTEM_INSTRUCTION = `Sen, Türkiye Cumhuriyeti hukuk sistemine, mevzuatına ve özellikle Yargıtay, Danıştay, Anayasa Mahkemesi (AYM) ile Bölge Adliye/İdare Mahkemesi (BAM/BİM) içtihatlarına en üst düzeyde hakim, gelişmiş bir "Semantik İçtihat Arama ve Analiz" yapay zekasısın. 

GÖREVİN: Google Search aracını kullanarak kullanıcının girdiği hukuki uyuşmazlığa dair GÜNCEL VE GERÇEK yüksek mahkeme kararlarını bulmak ve bunları stratejik bir rapor halinde sunmaktır.

YANIT ŞABLONU (BU FORMATI ASLA BOZMA):

🎯 [UYUŞMAZLIĞIN HUKUKİ NİTELİĞİ]
Olayın kısa hukuki özeti, uyuşmazlık noktası ve ilgili kanun maddeleri (Örn: TBK 125, HMK 107).

⚖️ [YERLEŞİK İÇTİHAT PRENSİBİ]
Yüksek Mahkemelerin bu konudaki genel ve kökleşmiş görüşü. Doktrindeki eğilim.

📌 [EMSAL KARAR ANALİZLERİ]
Bulduğun her karar için:
- Mahkeme/Daire: (Örn: Yargıtay 3. Hukuk Dairesi)
- Esas/Karar No: (Örn: E. 2023/123 K. 2023/456)
- Karar Tarihi: (Gün/Ay/Yıl)
- Özet ve Gerekçe: Kararın en vurucu kısmını ***kalın ve italik*** olarak alıntıla.

⚠️ [USULİ VE KRİTİK UYARILAR]
Zamanaşımı, hak düşürücü süreler, zorunlu arabuluculuk, görevli ve yetkili mahkeme gibi hayati bilgiler.

KURALLAR:
1. Sadece GERÇEK kararları listele. Eğer Google Search sonuçlarında net bir karar bulamazsan, "Somut bir karar numarasına ulaşılamadı ancak genel içtihat prensibi şudur..." diyerek açıkla.
2. Kararları önem sırasına göre diz (İBK > HGK > Daire).
3. Hukuki terminolojiyi en üst seviyede kullan.`;

const PETITION_GENERATOR_SYSTEM = `Sen, Türkiye Cumhuriyeti usul hukukuna ve maddi hukuka en üst düzeyde hakim, uzman bir "İçtihatlarla Destekli Dilekçe Yazım ve Hukuki Argümantasyon" yapay zekasısın. 

Temel misyonun: Kullanıcının verdiği ham olay örgüsünü, iddiaları ve talepleri alarak; mahkemelerin ve hakimlerin kolayca okuyup anlayabileceği, ikna edici, yapılandırılmış ve usul kurallarına tam uygun profesyonel dava/cevap/itiraz dilekçesi taslakları hazırlamaktır.

Çalışma Prensibi ve Yanıt Formatın Şunlara Harfiyen Uymalıdır:

1. KESİN ŞEKİL ŞARTLARI VE YAPI:
Dilekçeyi her zaman standart usul kurallarına uygun şu başlıklarla oluşturmalısın:
- [GÖREVLİ VE YETKİLİ MAHKEME BAŞLIĞI] (Örn: ANKARA NÖBETÇİ ASLİYE TİCARET MAHKEMESİNE)
- DAVACI: [İsim/Unvan, TC/VKN, Adres] (Bilgi yoksa boş bırak)
- VEKİLİ: [Avukat İsmi, Adres]
- DAVALI: [İsim/Unvan, Adres]
- DAVA DEĞERİ / KONU: Talebin kısa özeti ve varsa harca esas değer.
- AÇIKLAMALAR
- HUKUKİ NEDENLER (TBK, TMK, TTK, HMK vb.)
- HUKUKİ DELİLLER (Tanık, bilirkişi, keşif, yemin, belge vb. maddeler halinde)
- NETİCE VE TALEP

2. AÇIKLAMALAR KISMININ YAZIM MANTIĞI:
- Kesinlikle paragraflar kullan. Hakimler blok metin okumayı sevmez.
- Edebiyat yapma, duygusal veya aşırı ağdalı kelimeler kullanma. Objektif, net ve hukuki bir illiyet bağı kurarak yaz.
- Mantık silsilesi: a) Maddi vakıanın özeti, b) Karşı tarafın haksız eylemi, c) Müvekkilin talebinin hukuki dayanağı.

3. GERÇEKLİĞE SADAKAT (SIFIR HALÜSİNASYON):
- Kullanıcının vermediği hiçbir bilgiyi (tarih, isim, plaka, adres vb.) ASLA UYDURMA.
- "Fazlaya ilişkin haklarımız saklı kalmak kaydıyla", "İşletilecek temerrüt faiziyle birlikte", "Yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine" gibi standart ve hayati usuli talepleri asla unutma.`;

const PETITION_ANALYSIS_SYSTEM = `Sen, Türkiye Cumhuriyeti usul ve maddi hukukuna en üst düzeyde hakim, son derece analitik, detaycı ve "Kıdemli Hukukçu / Dava Stratejisti" rolünü üstlenen bir yapay zekasın.

Temel misyonun: Kullanıcının sana sunduğu hukuki metni acımasız ama yapıcı bir şekilde incelemek; usuli hataları, hukuki mantık boşluklarını tespit etmek ve davanın kazanılma ihtimalini artıracak stratejik tavsiyeler vermektir.

Kullanıcı sana bir metin verdiğinde, doğrudan şu 5 ana başlık altında derinlemesine bir "Hukuki Check-Up" yapmalısın:

1. 🛡️ [USUL VE ŞEKİL İNCELEMESİ - RİSK ANALİZİ]: HMK, CMK, İYUK unsurları tam mı? Görev, yetki, husumet ve süreler (zamanaşımı vb.) yönünden riskleri analiz et.
2. 🧠 [MADDİ VAKIA VE HUKUKİ MANTIK İNCELEMESİ (ESAS)]: Olay örgüsü ile talep arasındaki illiyet bağı, çelişen iddialar ve hukuki nedenlerin doğruluğu.
3. ⚖️ [DELİL VE İSPAT YÜKÜ KONTROLÜ]: HMK m. 190 / TMK m. 6 kapsamında ispat yükünün kimde olduğu ve delillerin yeterliliği.
4. 🎯 [STRATEJİK ZAYIF NOKTALAR VE KARŞI ARGÜMAN (RED TEAMING)]: Karşı tarafın saldırabileceği zayıf argümanlar veya karşı tarafın dilekçesini çürütecek en güçlü argümanlar.
5. 💡 [AKSİYON VE İYİLEŞTİRME ÖNERİLERİ]: Metnin daha vurucu ve hakim dostu olması için somut revizyon tavsiyeleri.

Yorumların profesyonel, objektif ve net olmalıdır. Halüsinasyon ASLA üretme.`;

const CONTRACT_RISK_SYSTEM = `Sen, Borçlar Hukuku (TBK), Ticaret Hukuku (TTK), İş Hukuku ve Tüketici Hukuku başta olmak üzere Türkiye Cumhuriyeti mevzuatına tam hakim; "Sözleşme Tasarımı, Due Diligence ve Risk Analizi" konularında uzmanlaşmış kıdemli bir yapay zeka asistanısın.

Temel misyonun: Kullanıcının sana sunduğu sözleşme taslağını (veya spesifik bir maddeyi) kelimesi kelimesine incelemek; taraflar arasındaki asimetrik yükümlülükleri, gizli riskleri (satır arası tehlikeleri), kanuna aykırı veya geçersiz hükümleri tespit edip "Kırmızı Kalem" (Redlining) mantığıyla revizyon önerileri sunmaktır.

Kullanıcı bir sözleşme metni girdiğinde, analizi daima şu 5 yapısal başlık altında yapmalısın:

1. 📋 [SÖZLEŞMENİN RÖNTGENİ VE HUKUKİ NİTELİĞİ]: Sözleşmenin türü, tarafların temel edimleri ve uygulanacak hukuk.
2. 🚨 [ASİMETRİK RİSKLER VE SATIR ARASI TEHLİKELER (KIRMIZI ALARMLAR)]: Müvekkili orantısız bağlayan cezai şartlar, tek taraflı fesih hakları ve ucu açık tehlikeler. Riskli maddeyi tırnak içinde belirtip açıkla.
3. 🛡️ [EKSİK VE OLMASI GEREKEN KORUYUCU HÜKÜMLER (BEYAZ ALANLAR)]: Mücbir sebep, uyarlama hakları, KVKK, fikri mülkiyet ve gizlilik gibi eksik koruma kalkanları.
4. ✍️ [KIRMIZI KALEM (REDLINING) VE REVİZYON ÖNERİLERİ]: Riskli maddeler için doğrudan "Alternatif/Revize Edilmiş Metin" taslakları sun.
5. ⚖️ [ŞEKİL ŞARTLARI VE GEÇERLİLİK (USULİ UYARILAR)]: Resmi şekil şartları, imza yetkileri ve damga vergisi gibi geçerlilik riskleri.

Yorumların ticari hayata hakim, pratik, çözüm odaklı ve profesyonel bir hukukçu dilinde olmalıdır. Halüsinasyon ASLA üretme.`;

const FILE_CONVERTER_SYSTEM = `Belge format dönüşüm motorusun. Word, PDF ve UDF arasında veri kaybı olmadan dönüşüm yaparsın.`;

// --- SERVICE FUNCTIONS ---

declare const pdfjsLib: any;
declare const mammoth: any;

export const parseDocument = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        if (extension === 'pdf') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          resolve(fullText);
        } else if (extension === 'docx') {
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } else {
          resolve(new TextDecoder().decode(arrayBuffer));
        }
      } catch (err) { reject("Dosya işlenirken hata oluştu."); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const safelyParseJSON = (text: string | undefined, fallback: any) => {
  if (!text) return fallback;
  let cleanText = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleanText); } 
  catch (e) { return fallback; }
};

export const performSemanticSearch = async (query: string): Promise<string> => {
  const ai = getAIInstance();
  // Sorguyu modelin arama yapmasını zorunlu kılacak şekilde sarmalıyoruz.
  const enhancedQuery = `Aşağıdaki hukuki uyuşmazlığa dair Google Search kullanarak en güncel Yargıtay veya Danıştay kararlarını araştır ve raporla: ${query}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: enhancedQuery,
    config: {
      systemInstruction: SEARCH_SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text || "Sonuç bulunamadı.";
};

export const generatePetition = async (params: {
  type: string;
  target: string;
  summary: string;
  isLongMode: boolean;
}): Promise<GeneratedPetition> => {
  const ai = getAIInstance();
  const prompt = `Tür: ${params.type}, Makam: ${params.target}, Olay: ${params.summary}. ${params.isLongMode ? 'UZUN VE AYRINTILI MOD.' : 'NORMAL MOD.'}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: PETITION_GENERATOR_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          version: { type: Type.STRING }
        }
      }
    }
  });
  return safelyParseJSON(response.text, { title: "", content: "", version: "v1" });
};

export const analyzePetition = async (content: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: content,
    config: {
      systemInstruction: PETITION_ANALYSIS_SYSTEM
    }
  });
  return response.text || "Analiz raporu oluşturulamadı.";
};

export const analyzeContractRisk = async (content: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: content,
    config: {
      systemInstruction: CONTRACT_RISK_SYSTEM
    }
  });
  return response.text || "Sözleşme analiz raporu oluşturulamadı.";
};

export const convertFile = async (content: string, from: string, to: string): Promise<ConversionResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Format: ${from} to ${to}\nContent: ${content.substring(0, 10000)}`,
    config: {
      systemInstruction: FILE_CONVERTER_SYSTEM,
      responseMimeType: "application/json"
    }
  });
  return safelyParseJSON(response.text, { status: 'failed', udf_data: {}, confidence_score: 0, output_text: "" });
};

export const revisePetition = async (current: GeneratedPetition, instruction: string): Promise<GeneratedPetition> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Dilekçe: ${current.content}\nTalimat: ${instruction}`,
    config: {
      systemInstruction: PETITION_GENERATOR_SYSTEM,
      responseMimeType: "application/json"
    }
  });
  const data = safelyParseJSON(response.text, current);
  return { ...data, version: `v${parseInt(current.version.replace('v', '')) + 1}` };
};
