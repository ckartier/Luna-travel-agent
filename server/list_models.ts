import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.list();
    for await (const m of response) {
        const model = m as any;
        if (model.name && model.name.includes("flash") && model.supportedGenerationMethods?.includes("bidiGenerateContent")) {
            console.log("Supported BIDI:", model.name, model.supportedGenerationMethods);
        }
    }
}
listModels().catch(console.error);
