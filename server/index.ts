import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env vars from Next.js standard paths
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const PORT = 3001; // Relay server port
const wss = new WebSocketServer({ port: PORT });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: "v1alpha" });

console.log(`🎙️  Luna Voice Relay Server started on ws://localhost:${PORT}`);

wss.on('connection', async (clientWs) => {
    console.log('[Relay] Client connected');
    let geminiSession: any = null;

    try {
        console.log('[Relay] Connecting to Gemini Live...');
        // Init Gemini Live Session (Bidi WebSockets API via SDK)
        geminiSession = await ai.live.connect({
            model: "gemini-2.5-flash-native-audio-latest",
            config: {
                systemInstruction: {
                    parts: [{ text: "Tu es Luna, l'assistant vocal du CRM Luna Conciergerie. Commence par dire bonjour à l'utilisateur. Réponds toujours en français, de manière concise et naturelle." }]
                },
                responseModalities: [Modality.AUDIO],
            },
            callbacks: {
                onmessage: (chunk: any) => {
                    try {
                        const keys = Object.keys(chunk || {});
                        console.log('[Relay] Gemini msg keys:', keys.join(', '));
                        
                        if (chunk?.setupComplete) {
                            console.log('[Relay] ✅ Gemini setupComplete received');
                            // Send initial greeting request
                            if (geminiSession) {
                                console.log('[Relay] Sending greeting prompt...');
                                geminiSession.sendClientContent({
                                    turns: [{
                                        role: "user",
                                        parts: [{ text: "Bonjour, présente-toi brièvement." }]
                                    }],
                                    turnComplete: true
                                });
                            }
                            return;
                        }

                        // The chunk shape may be { serverContent: { modelTurn: { parts: [...] } } } or { modelTurn: ... } depending on SDK layers
                        const parts = chunk?.serverContent?.modelTurn?.parts || chunk?.modelTurn?.parts;
                        
                        // Check if TTS audio was returned
                        if (parts) {
                            let audioChunks = 0;
                            for (const part of parts) {
                                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
                                    audioChunks++;
                                    // Relay audio back to the React client
                                    if (clientWs.readyState === WebSocket.OPEN) {
                                        clientWs.send(JSON.stringify({
                                            type: 'audio',
                                            data: part.inlineData.data // Base64 PCM
                                        }));
                                    }
                                }
                                if (part.text) {
                                    console.log('[Relay] Gemini text:', part.text.substring(0, 100));
                                }
                            }
                            if (audioChunks > 0) {
                                console.log(`[Relay] Sent ${audioChunks} audio chunk(s) to client`);
                            }
                        }
                        
                        // Log turn completion
                        if (chunk?.serverContent?.turnComplete) {
                            console.log('[Relay] Turn complete');
                        }
                    } catch (err) {
                        console.error('[Relay] Gemini stream read error:', err);
                    }
                },
                onerror: (err: any) => {
                    console.error('[Relay] ❌ Gemini Live connection error:', err);
                },
                onclose: () => {
                    console.log('[Relay] Gemini Live connection closed');
                    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
                }
            }
        });
        console.log('[Relay] ✅ Gemini Live session created successfully');

    } catch (err) {
        console.error('[Relay] ❌ Failed to start Gemini session:', err);
        clientWs.close();
        return;
    }

    // Handle messages coming from the React client (Microphone audio or Text)
    clientWs.on('message', (message) => {
        try {
            const msg = JSON.parse(message.toString());
            
            if (msg.type === 'audio' && geminiSession) {
                // MSG.data is Base64 PCM16 audio
                // Send real-time audio chunk to Gemini
                // Note: the SDK structure for live streaming chunks depends on the GoogleGenAI Bidi API.
                geminiSession.sendRealtimeInput([{
                    mimeType: "audio/pcm;rate=16000",
                    data: msg.data
                }] as any);
            } else if (msg.type === 'text' && geminiSession) {
                geminiSession.sendClientContent({
                    turns: [{
                        role: "user",
                        parts: [{ text: msg.data }]
                    }],
                    turnComplete: true
                });
            } else if (msg.type === 'client_content') {
                 // Barge-in or forceful interruption
                 // Send empty or stop signal if SDK supports it, or handle local playback stop.
            }
        } catch (e) {
            console.error('[Relay] Message parsing error:', e);
        }
    });

    clientWs.on('close', () => {
        console.log('[Relay] Client disconnected');
        if (geminiSession) {
            try { geminiSession.close(); } catch (e) {}
            geminiSession = null;
        }
    });
});
