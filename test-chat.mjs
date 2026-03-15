import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
try {
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: "Test",
    config: {
        systemInstruction: "test"
    }
  });
  console.log(result.text);
} catch (e) {
  console.error("ERROR:");
  console.error(e);
}
