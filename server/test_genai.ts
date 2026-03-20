import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1alpha' });
    try {
        const session = await ai.live.connect({
            model: "gemini-2.5-flash-native-audio-latest",
            config: {
                systemInstruction: { parts: [{ text: "Hello" }]} ,
                responseModalities: [Modality.AUDIO],
            },
            callbacks: {
                onmessage: (e) => {
                    console.log("Got message:", JSON.stringify(e).substring(0, 100));
                },
                onerror: (e) => { console.error("Error from AI:", e); },
                onclose: (e) => { console.log("Closed by AI", e.reason || e.code || e); process.exit(0); }
            }
        });

        console.log("Connected to Gemini session.");
        
        // Attempt sending audio via RealtimeInput
        session.sendRealtimeInput([{
            mimeType: "audio/pcm;rate=16000",
            data: Buffer.alloc(1024).toString('base64')
        }] as any);
        console.log("Sent realtime input 1");

        session.sendRealtimeInput({
            mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: Buffer.alloc(1024).toString('base64')
            }]
        } as any);
        console.log("Sent realtime input 2");

    } catch(e) {
        console.error("Catch Exception:", e);
    }
}
test().catch(console.error);
