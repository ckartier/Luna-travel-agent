import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env.local', 'utf8');
const keyLine = envFile.split('\n').find(l => l.startsWith('GEMINI_API_KEY='));
const apiKey = keyLine ? keyLine.split('=')[1].trim() : null;

if (!apiKey) {
    console.error("No API key found.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const session = await ai.live.connect({
      model: modelName,
      config: {
        responseModalities: ['AUDIO', 'TEXT'],
        tools: [{ functionDeclarations: [{ name: 'test_tool', description: 'test' }] }]
      }
    });
    console.log(`✅ ${modelName} CONNECTED!`);
    session.close();
  } catch (err) {
    console.error(`❌ ${modelName} FAILED:`, err.message || err);
  }
}

await testModel('gemini-2.0-flash-exp');
await testModel('gemini-2.0-flash-live-001');
await testModel('gemini-live-2.5-flash-preview');
await testModel('gemini-2.5-flash-native-audio-preview-12-2025');
await testModel('gemini-3.1-pro-preview');
