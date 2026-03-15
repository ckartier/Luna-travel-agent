require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  console.log("Connecting using EXACT official example configuration...");
  let timeout;
  try {
    const session = await ai.live.connect({
      model: 'gemini-2.0-flash',
      config: {
        responseModalities: ['AUDIO']
      },
      callbacks: {
        onopen: () => {
          console.log("✅ WebSocket opened.");
          timeout = setTimeout(() => {
            console.log("✅ Survived 2 seconds, no 1008 error! It works!!!");
            session.close();
          }, 2000);
        },
        onclose: (e) => {
          clearTimeout(timeout);
          console.error(`❌ WebSocket closed. Code: ${e.code}, Reason: ${e.reason}`);
        },
        onerror: (e) => {
          console.error("❌ WebSocket error:", e);
        }
      }
    });
  } catch (err) {
    console.error("Fatal:", err);
  }
}

run();
