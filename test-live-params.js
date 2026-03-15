require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const tool = { name: 'test_tool', description: 'test', parameters: { type: 'object', properties: {} } };

const configsToTest = [
  {
    name: "Empty Config",
    config: {}
  },
  {
    name: "Only Modalities",
    config: { responseModalities: ['AUDIO', 'TEXT'] }
  },
  {
    name: "Only Modalities AUDIO",
    config: { responseModalities: ['AUDIO'] }
  },
  {
    name: "Only Tools",
    config: { tools: [{ functionDeclarations: [tool] }] }
  },
  {
    name: "Only System Prompt",
    config: { systemInstruction: { parts: [{ text: "Hello" }] } }
  },
  {
    name: "Only Speech Config",
    config: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } } }
  },
  {
    name: "All except tools",
    config: {
        responseModalities: ['AUDIO', 'TEXT'],
        systemInstruction: { parts: [{ text: "Hello" }] },
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
    }
  },
  {
    name: "All Config",
    config: {
        responseModalities: ['AUDIO', 'TEXT'],
        systemInstruction: { parts: [{ text: "Hello" }] },
        tools: [{ functionDeclarations: [tool] }],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
    }
  }
];

async function testConfig(testCase) {
  return new Promise(async (resolve) => {
    let timeout;
    try {
      const session = await ai.live.connect({
        model: 'gemini-2.0-flash',
        config: testCase.config,
        callbacks: {
           onopen: () => {
              // Wait 1.5 seconds to ensure it STAYS open
              timeout = setTimeout(() => {
                 console.log(`✅ STABLE: ${testCase.name}`);
                 session.close();
                 resolve();
              }, 1500);
           },
           onclose: (e) => {
              clearTimeout(timeout);
              if (e.code === 1008) {
                 console.error(`❌ REJECTED 1008: ${testCase.name} (${e.reason})`);
              } else {
                 console.error(`❌ CLOSED ${e.code}: ${testCase.name}`);
              }
              resolve();
           }
        }
      });
    } catch (err) {
      console.error(`❌ EXCEPTION ${testCase.name}:`, err.message || err);
      resolve();
    }
  });
}

async function run() {
  console.log(`Testing configurations against Live API to isolate 1008...`);
  for (const t of configsToTest) {
    await testConfig(t);
  }
  process.exit(0);
}
run();
