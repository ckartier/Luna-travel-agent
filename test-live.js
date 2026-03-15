require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testLive(modelName) {
  try {
    const session = await ai.live.connect({
      model: modelName,
      config: {
        responseModalities: ['AUDIO', 'TEXT'],
        tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }]
      },
      callbacks: {
          onclose: (e) => console.log(`[${modelName}] Closed: Code ${e.code}`)
      }
    });
    console.log(`✅ LIVE AI ${modelName} CONNECTED! Waiting 2 seconds...`);
    await new Promise(r => setTimeout(r, 2000));
    session.close();
  } catch (err) {
    console.error(`❌ LIVE AI ${modelName} ERROR:`, err.message || err);
  }
}

async function run() {
  await testLive('gemini-2.0-flash');
}

run();
