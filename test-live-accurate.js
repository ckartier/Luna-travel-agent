require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-live-2.5-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-native-audio-preview-12-2025'
];

async function testModel(modelName) {
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: modelName,
        config: {
           responseModalities: ['AUDIO', 'TEXT']
        },
        callbacks: {
           onopen: () => {
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE: ${modelName} survived 2 seconds without 1008 rejection!`);
                 session.close();
                 resolve();
              }, 2000);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              console.error(`❌ REJECTED: ${modelName} with code ${e.code}`);
              resolve();
           }
        }
      });
    } catch (err) {
      console.error(`❌ EXCEPTION ${modelName}:`, err.message || err);
      resolve();
    }
  });
}

async function run() {
  console.log(`Testing models for true Live API compatibility...`);
  for (const m of models) {
    await testModel(m);
  }
}
run();
