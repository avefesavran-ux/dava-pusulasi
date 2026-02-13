
import { GoogleGenAI, Type } from "@google/genai";
import { CaseResult, AnalysisResult, ContractRiskReport, GeneratedPetition, ConversionResult } from "../types";
import JSZip from 'jszip';

const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

// --- SYSTEM INSTRUCTIONS ---

const SEARCH_SYSTEM_INSTRUCTION = `Sen, Türkiye Cumhuriyeti hukuk sistemine en üst düzeyde hakim, uzman bir "Semantik İçtihat Uzmanı"sın. 

GÖREVİN: Kullanıcının uyuşmazlığını analiz etmek ve Google Search kullanarak bu olayla doğrudan bağlantılı, GÜNCEL Yargıtay, Danıştay veya AYM kararlarını bulup raporlamaktır.

ÖNEMLİ KURALLAR:
1. EMOJİ ASLA KULLANMA.
2. KALINLAŞTIRMA İÇİN ** İŞARETİNİ ASLA KULLANMA.
3. Önemli hukuki kavramları veya karardan doğrudan alıntıları mutlaka "tırnak içinde" yaz.
4. Başlıkları tam olarak aşağıdaki gibi büyük harflerle kullan.
5. Her bir emsal kararı TEK BİR BLOK halinde sun. Bir karara ait MAHKEME, ESAS/KARAR, TARİH ve ÖZET bilgilerini asla birbirinden ayırma, hepsini aynı kutuda toplanacak şekilde ardışık yaz.

YANIT ŞABLONUN:

UYUŞMAZLIĞIN HUKUKİ NİTELİĞİ
Olayın hukuki tanımı ve uygulanacak kanun maddelerini paragraflar halinde açıkla.

YERLEŞİK İÇTİHAT PRENSİBİ
Yüksek Mahkemelerin bu konudaki genel ve kökleşmiş görüşünü, doktrindeki eğilimi anlat. Önemli ilkeleri "tırnak içinde" belirt.

EMSAL KARAR ANALİZLERİ
Bulduğun her bir karar için şu yapıyı EKSİKSİZ kullan (Her karar MAHKEME ile başlamalıdır):
MAHKEME: ... (Örn: Yargıtay 2. Hukuk Dairesi)
ESAS/KARAR: ... (Örn: 2023/123 E. , 2024/456 K.)
KARAR TARİHİ: ... (Örn: 15.01.2024)
ÖZET VE GEREKÇE: ... (Kararın gerekçesini profesyonelce açıkla. Doğrudan alıntıları "tırnak içinde" yap.)

USULİ VE KRİTİK UYARILAR
Zamanaşımı, hak düşürücü süreler, görevli mahkeme gibi hayati bilgileri paragraf olarak ver.`;

const PETITION_GENERATOR_SYSTEM = `Sen, Türkiye Cumhuriyeti usul hukukuna hakim, uzman bir "Hukuki Argümantasyon" yapay zekasısın. 

GÖREVİN: Profesyonel, ağır başlı ve hukuki terminolojiye uygun bir dilekçe oluşturmaktır.

ÖNEMLİ KURALLAR:
1. İÇTİHAT ŞARTI: Dilekçenin "AÇIKLAMALAR" veya "HUKUKİ NEDENLER" bölümüne mutlaka konuyla ilgili en az 1-2 adet güncel Yargıtay kararı (Esas ve Karar numarası belirterek) ekle. "Yargıtay ... Hukuk Dairesi'nin ... Esas, ... Karar sayılı ilamı uyarınca..." formatını kullan.
2. FORMAT: KALINLAŞTIRMA İÇİN ** İŞARETİNİ KESİNLİKLE KULLANMA. Başlıkları sadece büyük harfle yaz (Örn: DAVACI:).
3. YAPI: Yanıtına mutlaka "BASLIK:" ile başla ve içeriği "ICERIK:" etiketinden sonra ver.

Dilekçe Yapısı:
[MAHKEME BAŞLIĞI]
DAVACI / DAVALI BİLGİLERİ
KONU / DAVA DEĞERİ
AÇIKLAMALAR (Hukuki dayanaklar ve Yargıtay atıfları burada yer almalı)
DELİLLER VE HUKUKİ NEDENLER
NETİCE-İ TALEP`;

const PETITION_ANALYSIS_SYSTEM = `Sen, Türkiye Cumhuriyeti hukukuna hakim kıdemli bir Dava Stratejistisin. 
Sana sunulan metni şu başlıklarda analiz et:
1. [USUL VE ŞEKİL İNCELEMESİ]
2. [MADDİ VAKIA VE HUKUKİ MANTIK]
3. [DELİL VE İSPAT YÜKÜ]
4. [STRATEJİK ZAYIF NOKTALAR VE KARŞI ARGÜMAN]
5. [AKSİYON VE İYİLEŞTİRME ÖNERİLERİ]`;

const CONTRACT_RISK_SYSTEM = `Sen uzman bir Sözleşme Hukukçusun. Metni şu başlıklarda incele:
1. [SÖZLEŞMENİN RÖNTGENİ]
2. [ASİMETRİK RİSKLER]
3. [EKSİK VE OLMASI GEREKEN HÜKÜMLER]
4. [REVİZYON ÖNERİLERİ (REDLINING)]
5. [ŞEKİL ŞARTLARI VE GEÇERLİLİK]`;

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
        } else if (extension === 'udf' || extension === 'xml') {
          try {
            // First try as a ZIP (UDFs are zipped XMLs sometimes)
            const zip = await JSZip.loadAsync(arrayBuffer);
            const xmlFile = Object.keys(zip.files).find(name => name.endsWith('.xml') || name.endsWith('content.xml'));
            if (xmlFile) {
              const xmlContent = await zip.file(xmlFile)?.async("string");
              if (xmlContent) {
                const cleanText = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                resolve(cleanText);
                return;
              }
            }
          } catch (zipError) {
            // Not a zip, proceed as plain XML/UDF
          }

          const decoder = new TextDecoder('utf-8'); // UDFs are typically UTF-8 XML
          const text = decoder.decode(arrayBuffer);
          // Basic XML text extraction (removes tags)
          const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          resolve(cleanText);
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
  const enhancedQuery = `Lütfen aşağıdaki uyuşmazlığa dair Google Search kullanarak en güncel Yargıtay/Danıştay kararlarını bul ve her bir kararı (Mahkeme, Esas, Tarih, Özet) eksiksiz bir blok halinde raporla: ${query}`;
  console.log("Performing search with query:", enhancedQuery);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', // Updated model for search capability
    contents: enhancedQuery,
    config: {
      systemInstruction: SEARCH_SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }]
    }
  });
  console.log("Search response:", response.text);
  return response.text || "İçtihat araması sonucunda somut bir metne ulaşılamadı.";
};

export const generatePetitionStream = async (params: {
  type: string;
  target: string;
  summary: string;
  isLongMode: boolean;
  fileContent?: string;
  caseLawContext?: string;
}) => {
  const ai = getAIInstance();
  let prompt = `Tür: ${params.type}, Makam: ${params.target}, Olay: ${params.summary}. ${params.isLongMode ? 'DETAYLI MOD: Konuyla ilgili Yargıtay ilamlarını ve hukuki gerekçeleri geniş tut.' : 'NORMAL MOD.'}`;

  if (params.caseLawContext) {
    prompt += `\n\nENTEGRE EDİLECEK GÜNCEL İÇTİHAT BİLGİSİ (Arama Sonuçları):\n${params.caseLawContext}`;
    prompt += `\n\nYukarıdaki içtihat bilgisini kullanarak dilekçeyi güçlendir. Kararları atıf yaparak kullan.`;
  }

  if (params.fileContent) {
    prompt += `\n\nEK BAĞLAM DOSYASI (Bu dosyadaki hukuki verileri ve delilleri dilekçeye entegre et):\n${params.fileContent.substring(0, 20000)}`;
  }

  console.log("Generating petition with prompt length:", prompt.length);

  return await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
    config: {
      systemInstruction: PETITION_GENERATOR_SYSTEM,
    }
  });
};

export const revisePetitionStream = async (current: GeneratedPetition, instruction: string) => {
  const ai = getAIInstance();
  return await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents: `Mevcut Dilekçe: ${current.content}\n\nRevizyon Talimatı: ${instruction}\n\nLütfen dilekçeyi bu yönde güncelle.`,
    config: {
      systemInstruction: PETITION_GENERATOR_SYSTEM,
    }
  });
};

export const analyzePetition = async (content: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
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
    model: 'gemini-2.0-flash-exp',
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
    model: 'gemini-2.0-flash-exp',
    contents: `Format: ${from} to ${to}\nContent: ${content.substring(0, 10000)}`,
    config: {
      systemInstruction: FILE_CONVERTER_SYSTEM,
      responseMimeType: "application/json"
    }
  });
  return safelyParseJSON(response.text, { status: 'failed', udf_data: {}, confidence_score: 0, output_text: "" });
};
