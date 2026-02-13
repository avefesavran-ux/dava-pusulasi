
import { GoogleGenAI, Type } from "@google/genai";
import { CaseResult, AnalysisResult, ContractRiskReport, GeneratedPetition, ConversionResult } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

// --- SYSTEM INSTRUCTIONS ---

const SEARCH_SYSTEM_INSTRUCTION = `Sen, Türkiye Cumhuriyeti hukuk sistemine en üst düzeyde hakim, uzman bir "Semantik İçtihat Uzmanı"sın. 

GÖREVİN: Kullanıcının uyuşmazlığını analiz etmek ve Google Search kullanarak bu olayla doğrudan bağlantılı, GÜNCEL Yargıtay, Danıştay veya AYM kararlarını bulup raporlamaktır.

YANIT ŞABLONUN (BU FORMATI ASLA BOZMA, KARARLARI MUTLAKA LİSTELE):

🎯 [UYUŞMAZLIĞIN HUKUKİ NİTELİĞİ]
Olayın hukuki tanımı ve ihlal edilen/uygulanacak kanun maddelerini (Örn: TBK m. 347, HMK m. 107) belirt.

⚖️ [YERLEŞİK İÇTİHAT PRENSİBİ]
Yüksek Mahkemelerin bu tür uyuşmazlıklardaki genel bakış açısını, yerleşik içtihatların temel mantığını özetle.

📌 [EMSAL KARAR ANALİZLERİ - BULGULAR VE EMSALLER]
En az 2-3 adet somut karar bul ve şu alt başlıklarla sun:
- MAHKEME/DAİRE: (Örn: Yargıtay 3. Hukuk Dairesi)
- ESAS/KARAR: (Örn: E. 2023/1455 K. 2024/210)
- KARAR TARİHİ: (Gün/Ay/Yıl formatında MUTLAKA belirt)
- ÖZET: Kararın can alıcı kısmını, hakimi ikna edecek gerekçeyi ***kalın ve italik*** olarak yaz.

⚠️ [USULİ VE KRİTİK UYARILAR]
Zamanaşımı, zorunlu arabuluculuk, görevli mahkeme gibi usuli hataları önleyecek uyarıları ekle.

KRİTİK KURAL: Eğer tam bir karar numarası bulamazsan, 'Şu tarihli ve şu dairenin kararları bu yöndedir' diyerek bulabildiğin tüm detayları (Yıl/Daire) ver. Karar kısmını asla boş bırakma.`;

const PETITION_GENERATOR_SYSTEM = `Sen, Türkiye Cumhuriyeti usul hukukuna hakim, uzman bir "Hukuki Argümantasyon" yapay zekasısın. 

Dilekçeyi standart usul kurallarına uygun şu başlıklarla oluşturmalısın:
- [GÖREVLİ MAHKEME BAŞLIĞI]
- DAVACI / DAVALI BİLGİLERİ
- KONU / DAVA DEĞERİ
- AÇIKLAMALAR (Paragraf bazlı, net, hukuki illiyet bağı kurulmuş)
- DELİLLER VE HUKUKİ NEDENLER
- NETİCE-İ TALEP

Usuli talepleri (faiz, vekalet ücreti, harç vb.) eklemeyi asla unutma.`;

const PETITION_ANALYSIS_SYSTEM = `Sen, Türkiye Cumhuriyeti hukukuna hakim kıdemli bir Dava Stratejistisin. 
Sana sunulan metni şu başlıklarda analiz et:
1. 🛡️ [USUL VE ŞEKİL İNCELEMESİ]
2. 🧠 [MADDİ VAKIA VE HUKUKİ MANTIK]
3. ⚖️ [DELİL VE İSPAT YÜKÜ]
4. 🎯 [STRATEJİK ZAYIF NOKTALAR VE KARŞI ARGÜMAN]
5. 💡 [AKSİYON VE İYİLEŞTİRME ÖNERİLERİ]`;

const CONTRACT_RISK_SYSTEM = `Sen uzman bir Sözleşme Hukukçususun. Metni şu başlıklarda incele:
1. 📋 [SÖZLEŞMENİN RÖNTGENİ]
2. 🚨 [ASİMETRİK RİSKLER]
3. 🛡️ [EKSİK VE OLMASI GEREKEN HÜKÜMLER]
4. ✍️ [REVİZYON ÖNERİLERİ (REDLINING)]
5. ⚖️ [ŞEKİL ŞARTLARI VE GEÇERLİLİK]`;

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
  const enhancedQuery = `Aşağıdaki uyuşmazlığa dair Google Search kullanarak gerçek Yargıtay/Danıştay kararlarını (Esas/Karar no ile) bul ve şablona uygun raporla: ${query}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: enhancedQuery,
    config: {
      systemInstruction: SEARCH_SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text || "İçtihat araması sonucunda somut bir metne ulaşılamadı. Lütfen aramayı detaylandırın.";
};

export const generatePetition = async (params: {
  type: string;
  target: string;
  summary: string;
  isLongMode: boolean;
}): Promise<GeneratedPetition> => {
  const ai = getAIInstance();
  const prompt = `Tür: ${params.type}, Makam: ${params.target}, Olay: ${params.summary}. ${params.isLongMode ? 'UZUN MOD.' : 'NORMAL MOD.'}`;
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
