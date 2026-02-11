
import { GoogleGenAI, Type } from "@google/genai";
import { CaseResult, AnalysisResult, ContractRiskReport, GeneratedPetition, ConversionResult } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

// Global library declarations
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
  const repairJSON = (str: string) => {
    let openBraces = (str.match(/\{/g) || []).length;
    let closeBraces = (str.match(/\}/g) || []).length;
    while (openBraces > closeBraces) { str += '}'; closeBraces++; }
    return str;
  };
  try { return JSON.parse(cleanText); } 
  catch (e) { try { return JSON.parse(repairJSON(cleanText)); } catch (e2) { return fallback; } }
};

const PETITION_GENERATOR_SYSTEM = `Sen Türkiye hukuk mevzuatı uzmanı bir asistanısın. 
GÖREVİN: Kullanıcıdan alınan bilgilerle profesyonel, resmi ve Türk mahkemelerine uygun dilekçe üretmek.
KURALLAR:
1. Resmi hukuk dili kullan.
2. Başlık, Taraflar, Konu, Açıklamalar, Hukuki Nedenler ve Sonuç bölümlerini eksiksiz hazırla.
3. Uzun Modda: Yargıtay emsalleri ve kanun maddeleri (HMK, TBK vb.) detaylıca işlenmelidir.
4. Çıktıyı mutlaka JSON formatında üret.
5. Her dilekçenin sonuna "Bu metin yapay zekâ tarafından hazırlanmıştır, resmi kullanım öncesi bir avukata danışılması önerilir." uyarısını ekle.`;

const FILE_CONVERTER_SYSTEM = `🎓 Rol Tanımı: Sen yüksek doğruluklu belge format dönüşümü yapan profesyonel bir yapay zekâ dönüşüm motorusun. Amaç: Word, PDF ve UDF formatları arasında veri kaybı olmadan, layout bozulmadan, güvenilir dönüşüm sağlamak.
Dönüşüm sonrası içerik UDF (Platform içi standart JSON tabanlı belge formatı) yapısında normalize edilir.
Hatasız Unicode ve Türkçe karakter desteği sağla.
Model çıktıyı structured JSON olarak üretmeli:
{
  "conversion_id": "uuid",
  "status": "success",
  "udf_data": { "metadata": { "title": "" }, "structure": [] },
  "confidence_score": 0.98,
  "output_text": "Dönüştürülmüş tam metin"
}`;

export const convertFile = async (content: string, from: string, to: string): Promise<ConversionResult> => {
  const ai = getAIInstance();
  const prompt = `Girdi Formatı: ${from}, Hedef Format: ${to}\n\nİçerik: ${content.substring(0, 15000)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: FILE_CONVERTER_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conversion_id: { type: Type.STRING },
          status: { type: Type.STRING },
          udf_data: { type: Type.OBJECT, properties: { metadata: { type: Type.OBJECT }, structure: { type: Type.ARRAY, items: { type: Type.OBJECT } } } },
          confidence_score: { type: Type.NUMBER },
          output_text: { type: Type.STRING }
        }
      }
    }
  });

  return safelyParseJSON(response.text, { 
    conversion_id: Math.random().toString(), 
    status: 'failed', 
    udf_data: {}, 
    confidence_score: 0, 
    output_text: "" 
  });
};

export const generatePetition = async (params: {
  type: string;
  target: string;
  summary: string;
  isLongMode: boolean;
}): Promise<GeneratedPetition> => {
  const ai = getAIInstance();
  const prompt = `Tür: ${params.type}, Makam: ${params.target}, Olay: ${params.summary}. 
  ${params.isLongMode ? 'UZUN VE AYRINTILI MODDA YAZ.' : 'NORMAL MODDA YAZ.'}`;

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

export const revisePetition = async (
  currentPetition: GeneratedPetition, 
  userInstruction: string
): Promise<GeneratedPetition> => {
  const ai = getAIInstance();
  const nextVersion = `v${parseInt(currentPetition.version.replace('v', '')) + 1}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Mevcut Dilekçe: ${currentPetition.content}. \n\nREVİZYON TALİMATI: ${userInstruction}`,
    config: {
      systemInstruction: `${PETITION_GENERATOR_SYSTEM}\nSadece istenen revizyonu uygula ve tam metni üret.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          version: { type: Type.STRING },
          change_type: { type: Type.STRING },
          diff: { type: Type.STRING }
        }
      }
    }
  });

  const data = safelyParseJSON(response.text, { ...currentPetition, version: nextVersion });
  return { ...data, version: nextVersion, change_type: 'revise' };
};

export const analyzePetition = async (content: string): Promise<AnalysisResult> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analiz: ${content.substring(0, 20000)}`,
    config: {
      thinkingConfig: { thinkingBudget: 22000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          claimsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
          weakPoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, suggestion: { type: Type.STRING } } } },
          recommendedCases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { court: { type: Type.STRING }, basisNo: { type: Type.STRING }, decisionNo: { type: Type.STRING }, summary: { type: Type.STRING }, citation: { type: Type.STRING } } } },
          counterArguments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opposingView: { type: Type.STRING }, defenseStrategy: { type: Type.STRING } } } }
        }
      }
    }
  });
  return safelyParseJSON(response.text, { claimsIdentified: [], weakPoints: [], recommendedCases: [], counterArguments: [] });
};

export const analyzeContractRisk = async (content: string): Promise<ContractRiskReport> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Risk Analizi: ${content.substring(0, 25000)}`,
    config: {
      systemInstruction: CONTRACT_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 24000 },
      responseMimeType: "application/json"
    }
  });
  return safelyParseJSON(response.text, { contractOverview: "", riskScore: 0, riskExplanation: "", clauseAnalysis: [], yargitayInsights: [], riskAlerts: [], revisionRecommendations: [], finalAssessment: "" });
};

const CONTRACT_SYSTEM_INSTRUCTION = `Senior Legal Associate prompt for contracts...`;

export const performSemanticSearch = async (query: string): Promise<CaseResult[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `İçtihat Tarama: ${query}`,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return safelyParseJSON(response.text, []);
};
