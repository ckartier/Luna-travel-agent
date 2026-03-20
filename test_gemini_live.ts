import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        console.log("Testing Live Connect...");
        // This is pseudo-code depending on SDK version. Let's inspect GoogleGenAI object.
        console.log(Object.keys(ai));
    } catch(e) {
         console.error(e);
    }
}
run();
