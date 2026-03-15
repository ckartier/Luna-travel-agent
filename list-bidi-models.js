require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list();
    const liveModels = [];
    let count = 0;
    
    for await (const model of response) {
      count++;
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('bidiGenerateContent')) {
        liveModels.push(model.name);
      }
      if (model.name.includes('gemini-2.0-flash')) {
          console.log(`\nModel: ${model.name}`);
          console.log(`Methods:`, model.supportedGenerationMethods);
      }
    }
    
    console.log(`\nTotal models checked: ${count}`);
    console.log("Models supporting bidiGenerateContent:", liveModels);
    
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
