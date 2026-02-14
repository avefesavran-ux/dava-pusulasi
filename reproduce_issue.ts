import { GoogleGenerativeAI } from "@google/generative-ai"; 
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const getApiKey = (): string => {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
};

const apiKey = getApiKey();
console.log("API Key found:", apiKey ? "Evet (Uzunluk: " + apiKey.length + ")" : "Hayır");

if (!apiKey) {
    console.error("API anahtarı bulunamadı. Lütfen .env.local dosyasını kontrol et.");
    process.exit(1);
}

// SDK Başlatma
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
    // İstediğin yeni model ismini buraya tanımladım
    const modelName = 'gemini-3-pro-preview';
    console.log(`Test ediliyor: ${modelName}`);

    try {
        // 1. Önce model nesnesini oluşturuyoruz
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // 2. Mesajı gönderiyoruz
        const result = await model.generateContent("Test message. Respond with 'Hello'.");
        
        // 3. Yanıtı bekleyip metne çeviriyoruz
        const response = await result.response;
        const text = response.text();
        
        console.log("Modelden gelen yanıt:", text);
    } catch (error: any) {
        console.error("Model testi sırasında hata oluştu:");
        console.log("Hata Mesajı:", error.message);
        
        // Eğer model ismi henüz senin bölgen veya API key'in için aktif değilse 
        // 404 veya 400 hatası alabilirsin, burada onu yakalıyoruz.
        if (error.status) {
            console.error("Hata Kodu:", error.status);
        }
    }
}

testModel();
