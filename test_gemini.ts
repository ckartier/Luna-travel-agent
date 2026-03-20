import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // uses process.env.GEMINI_API_KEY
async function run() {
    console.log("Connecting to Gemini Live API...");
    const session = await ai.live.connect({ 
        model: "gemini-2.0-flash-exp",
        config: {
            responseModalities: ["AUDIO"] as any
        },
        callbacks: {} as any
    });
    
    console.log("Connected");

    const s = session as any;

    s.on('content', (chunk: any) => {
        console.log("Received chunk", chunk);
    });
    
    s.on('close', () => {
        console.log("Closed");
    });
    
    s.send({ text: "Hello" });

}

run().catch(console.error);
