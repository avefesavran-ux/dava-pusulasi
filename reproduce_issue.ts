import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
    console.error("Hata: GEMINI_API_KEY bulunamadı!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    // gemini-3-pro-preview modelini çağırıyoruz
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    try {
        const result = await model.generateContent("Selam, sistem çalışıyor mu?");
        const response = await result.response;
        console.log("Model Yanıtı:", response.text());
    } catch (error: any) {
        console.error("Bir hata oluştu:", error.message);
    }
}

run();
