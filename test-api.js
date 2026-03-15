require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test(modelName) {
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });
    console.log(`✅ TEXT AI ${modelName} SUCCESS:`, res.text.substring(0, 20));
  } catch (e) {
    console.error(`❌ TEXT AI ${modelName} ERROR:`, e.message);
  }
}

async function run() {
  await test('gemini-2.5-flash');
  await test('gemini-3.1-pro-preview');
  await test('gemini-2.0-flash-exp');
}

run();
