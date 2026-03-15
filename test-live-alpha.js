require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { apiVersion: 'v1alpha' }
});

const models = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-live-2.5-flash-preview',
  'gemini-2.5-flash'
];

async function testModel(modelName) {
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: modelName,
        config: { responseModalities: ['AUDIO', 'TEXT'] },
        callbacks: {
           onopen: () => {
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE (${modelName}): survived 2 seconds`);
                 session.close();
                 resolve();
              }, 2000);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              console.error(`❌ REJECTED (${modelName}): code ${e.code}`);
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
  console.log(`Testing Live API with v1alpha enforced...`);
  for (const m of models) {
    await testModel(m);
  }
}
run();
