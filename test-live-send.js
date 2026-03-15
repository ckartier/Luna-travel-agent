require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testLiveSend(modelName) {
  return new Promise(async (resolve) => {
    try {
      console.log(`Testing model: ${modelName}...`);
      
      const session = await ai.live.connect({
        model: modelName,
        config: {
          responseModalities: ['AUDIO', 'TEXT'],
          tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }]
        }
      });
      
      try {
        await session.send({ text: "Hello" });
        console.log(`✅ ${modelName} OPENED AND SENT SUCCESSFULLY!`);
      } catch (e) {
        console.error(`❌ ${modelName} SEND ERROR:`, e.message || e);
      } finally {
        // give it a moment to receive potential error frames
        setTimeout(() => {
            session.close();
            resolve();
        }, 1000);
      }

    } catch (err) {
      console.error(`❌ ${modelName} EXCEPTION:`, err.message || err);
      resolve();
    }
  });
}

async function run() {
  await testLiveSend('gemini-2.0-flash');
  await testLiveSend('gemini-2.0-flash-exp');
  await testLiveSend('gemini-2.5-flash');
  await testLiveSend('gemini-3.1-pro-preview');
}

run();
