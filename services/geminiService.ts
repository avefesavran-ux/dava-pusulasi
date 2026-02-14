import { GoogleGenerativeAI } from "@google/generative-ai";
import { CaseResult, AnalysisResult, ContractRiskReport, GeneratedPetition, ConversionResult } from "../types";
import JSZip from 'jszip';

const getApiKey = () => {
  try {
    // Vite projelerinde genelde import.meta.env kullanılır, 
    // ama senin yapına sadık kalarak process.env bırakıyorum.
    return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

// Instance oluşturma mantığını SDK'ya uygun güncelledik
const genAI = new GoogleGenerativeAI(getApiKey());

// --- SYSTEM INSTRUCTIONS (HİÇ DOKUNULMADI) ---

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
2. FORMAT: KALINLAŞTIRMA İÇİN ** İŞARETİNİ KESİNLİKLE KULLANMA. Başlıkları büyük harfle yaz (Örn: DAVACI    :).
3. YAPI: Yanıtına mutlaka "BASLIK:" ile başla ve içeriği "ICERIK:" etiketinden sonra ver.

Dilekçe Yapısı:
[MAHKEME BAŞLIĞI]
DAVACI / DAVALI BİLGİLERİ
KONU / DAVA DEĞERİ
AÇIKLAMALAR (Hukuki dayanaklar ve Yargıtay atıfları burada yer almalı)
DELİLLER VE HUKUKİ NEDENLER
NETİCE ve TALEP`;

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

// --- SERVICE FUNCTIONS (SDK YAPISI DÜZELTİLDİ) ---

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
          } catch (zipError) {}
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(arrayBuffer);
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
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: SEARCH_SYSTEM_INSTRUCTION 
  }, { apiVersion: 'v1beta' });

  const enhancedQuery = `Lütfen aşağıdaki uyuşmazlığa dair Google Search kullanarak en güncel Yargıtay/Danıştay kararlarını bul ve raporla: ${query}`;
  
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedQuery }] }],
      tools: [{ googleSearch: {} } as any]
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Search error:", error);
    return "İçtihat araması yapılamadı.";
  }
};

export const generatePetitionStream = async (params: {
  type: string;
  target: string;
  summary: string;
  isLongMode: boolean;
  fileContent?: string;
  caseLawContext?: string;
}) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: PETITION_GENERATOR_SYSTEM 
  });

  let prompt = `Tür: ${params.type}, Makam: ${params.target}, Olay: ${params.summary}. ${params.isLongMode ? 'DETAYLI MOD: Konuyla ilgili Yargıtay ilamlarını ve hukuki gerekçeleri geniş tut.' : 'NORMAL MOD.'}`;

  if (params.caseLawContext) prompt += `\n\nİÇTİHATLAR:\n${params.caseLawContext}`;
  if (params.fileContent) prompt += `\n\nEK DOSYA:\n${params.fileContent.substring(0, 15000)}`;

  const result = await model.generateContentStream(prompt);
  return result;
};

export const revisePetitionStream = async (current: GeneratedPetition, instruction: string) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: PETITION_GENERATOR_SYSTEM 
  });

  return await model.generateContentStream(`Mevcut Dilekçe: ${current.content}\n\nRevizyon Talimatı: ${instruction}`);
};

export const analyzePetition = async (content: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: PETITION_ANALYSIS_SYSTEM 
  });
  const result = await model.generateContent(content);
  return result.response.text();
};

export const analyzeContractRisk = async (content: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: CONTRACT_RISK_SYSTEM 
  });
  const result = await model.generateContent(content);
  return result.response.text();
};

export const convertFile = async (content: string, from: string, to: string): Promise<ConversionResult> => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-pro-preview',
    systemInstruction: FILE_CONVERTER_SYSTEM
  });
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Format: ${from} to ${to}\nContent: ${content.substring(0, 10000)}` }] }],
    generationConfig: { responseMimeType: "application/json" }
  });
  
  return safelyParseJSON(result.response.text(), { status: 'failed', udf_data: {}, confidence_score: 0, output_text: "" });
};
