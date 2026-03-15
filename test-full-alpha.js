require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { apiVersion: 'v1alpha' }
});

const tool = { name: 'test_tool', description: 'test', parameters: { type: 'object', properties: {} } };

async function testV1Alpha() {
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: ['AUDIO', 'TEXT'],
          tools: [{ functionDeclarations: [tool] }],
          systemInstruction: { parts: [{ text: "Hello" }] }
        },
        callbacks: {
           onopen: () => {
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE (v1alpha with full config): survived 2 seconds`);
                 session.close();
                 resolve();
              }, 2000);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              console.error(`❌ REJECTED (v1alpha): code ${e.code}, reason: ${e.reason}`);
              resolve();
           }
        }
      });
    } catch (err) {
      console.error(`❌ EXCEPTION:`, err.message || err);
      resolve();
    }
  });
}
testV1Alpha();
