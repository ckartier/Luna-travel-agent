import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
    try {
        const response = await ai.models.list();
        for await (let model of response) {
            console.log(model.name, model.supportedGenerationMethods);
        }
    } catch(e) { 
        console.error("ERROR:");
        console.error(e); 
    }
})();
