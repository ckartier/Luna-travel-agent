require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testFull() {
  return new Promise(async (resolve) => {
    try {
      const session = await ai.live.connect({
        model: 'gemini-2.0-flash',
        config: {
          responseModalities: ['AUDIO', 'TEXT'],
          systemInstruction: { parts: [{ text: "Hello" }] },
          tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }],
          speechConfig: {
              voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Aoede' }
              }
          }
        }
      });
      
      session.client.on('close', (event) => {
         console.error(`❌ CLOSED. Code: ${event.code}, Reason: ${event.reason}`);
         resolve();
      });
      
      session.client.on('open', () => {
         console.log(`✅ OPENED SUCCESSFULLY!`);
         setTimeout(() => { session.close(); resolve(); }, 1000);
      });

    } catch (err) {
      console.error(`❌ EXCEPTION:`, err.message || err);
      resolve();
    }
  });
}

testFull();
