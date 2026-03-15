require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  const iterator = await ai.models.list();
  const arr = iterator.models || iterator;
  
  if (!Array.isArray(arr)) {
     for await (const m of iterator) {
        if (m.name.includes('gemini-2.0-flash')) {
             console.log(m.name, m.supportedGenerationMethods);
        }
     }
     return;
  }

  for (const m of arr) {
    if (m.name.includes('gemini-2.0-flash')) {
      console.log(m.name, m.supportedGenerationMethods);
    }
  }
}
list().catch(console.error);
