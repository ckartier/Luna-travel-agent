require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testMagicModel() {
  console.log("Testing magic model: gemini-2.5-flash-preview-native-audio-dialog");
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-preview-native-audio-dialog',
        config: {
          responseModalities: ['AUDIO', 'TEXT']
        },
        callbacks: {
           onopen: () => {
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE: gemini-2.5-flash-preview-native-audio-dialog survived 2 seconds without 1008 rejection!`);
                 session.close();
                 resolve();
              }, 2000);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              console.error(`❌ REJECTED: gemini-2.5-flash-preview-native-audio-dialog closed with code ${e.code}`);
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
testMagicModel();
