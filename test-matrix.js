require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-live-2.5-flash-preview',
  'gemini-2.5-flash-preview-native-audio-dialog'
];

const versions = ['v1beta', 'v1alpha'];

async function testConnection(model, apiVersion) {
  return new Promise(async (resolve) => {
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion }
    });
    
    let timeout;
    try {
      const session = await ai.live.connect({
        model: model,
        config: { responseModalities: ['AUDIO', 'TEXT'] },
        callbacks: {
           onopen: () => {
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE: ${model} on ${apiVersion}`);
                 session.close();
                 resolve();
              }, 1500);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              if (e.code === 1008) {
                 console.log(`❌ 1008: ${model} on ${apiVersion}`);
              } else {
                 console.log(`❌ Code ${e.code}: ${model} on ${apiVersion}`);
              }
              resolve();
           }
        }
      });
    } catch(e) {
      console.log(`❌ ERROR: ${model} on ${apiVersion} (${e.message})`);
      resolve();
    }
  });
}

async function run() {
  for (const v of versions) {
    for (const m of models) {
      await testConnection(m, v);
    }
  }
}
run();
