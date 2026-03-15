import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test(model) {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const session = await ai.live.connect({ model });
        console.log(`[${model}] Connected successfully!`);
        session.close();
    } catch (e) {
        console.log(`[${model}] Error:`, e.message);
    }
}

async function run() {
    await test('gemini-2.0-flash-exp');
    await test('gemini-2.5-flash');
    await test('gemini-2.5-flash-preview-native-audio-dialog');
}
run();
