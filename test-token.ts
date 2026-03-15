import { GoogleGenAI } from '@google/genai';
async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateEphemeralToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { responseModalities: ['AUDIO'] } })
    });
    console.log(res.status, await res.text());
}
test();
