require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  const response = await ai.models.list();
  const models = response; // in v1.43, it might an array or pager
  const items = models.models || models; // depends on SDK format
  
  if (!items || !items.length) {
     console.log("No models returned or different format:", response);
     return;
  }
  
  for (const m of items) {
    if (m.name.includes('flash') || m.name.includes('live')) {
      console.log(m.name, m.supportedGenerationMethods);
    }
  }
}
list().catch(console.error);
