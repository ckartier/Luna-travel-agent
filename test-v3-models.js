require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-3.0-pro',
  'gemini-3.0-flash',
  'gemini-3.0-pro-preview',
  'gemini-3.0-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-preview',
  'gemini-3.0-pro-native-audio-dialog',
  'gemini-3.1-pro-native-audio-dialog'
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
                 console.log(`✅ SUCCESS: ${modelName} survived 2 seconds without 1008 rejection!`);
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
  console.log(`Testing Gemini 3.0 and 3.1 Live API compatibility...`);
  for (const m of models) {
    await testModel(m);
  }
}
run();
