require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testConfig(name, config) {
  return new Promise(async (resolve) => {
    try {
      console.log(`\nTesting config: ${name}...`);
      const session = await ai.live.connect({
        model: 'gemini-2.0-flash',
        config
      });
      console.log(`✅ CONNECTED: ${name}`);
      setTimeout(() => { session.close(); resolve(); }, 1000);
    } catch (err) {
      console.error(`❌ FAILED: ${name}`, err.message || err);
      resolve();
    }
  });
}

async function run() {
  await testConfig('Minimal', {});
  
  await testConfig('With Tools', {
    tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }]
  });
  
  await testConfig('With Modalities', {
    responseModalities: ['AUDIO', 'TEXT']
  });
  
  await testConfig('With System Instruction', {
    systemInstruction: { parts: [{ text: "Hello" }] }
  });
  
  await testConfig('With Speech Config', {
    speechConfig: {
       voiceConfig: {
           prebuiltVoiceConfig: { voiceName: 'Aoede' }
       }
    }
  });

  await testConfig('Full Setup (Browser Equivalent)', {
    responseModalities: ['AUDIO', 'TEXT'],
    systemInstruction: { parts: [{ text: "Hello" }] },
    tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }],
    speechConfig: {
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }
        }
    }
  });
}

run();
