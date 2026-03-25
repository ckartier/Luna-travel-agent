export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/crm/google-status
 * 
 * Returns the configuration status of all Google Cloud / IA services.
 * No secrets are exposed — only boolean connected/not-connected status.
 */
export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    // Check which services are configured
    const geminiConfigured = !!process.env.GEMINI_API_KEY;
    const gmailConfigured = !!(
        process.env.APP_GMAIL_CLIENT_ID &&
        process.env.APP_GMAIL_CLIENT_SECRET &&
        process.env.APP_GMAIL_REFRESH_TOKEN
    );
    const groqConfigured = !!process.env.GROQ_API_KEY;

    // Check TTS credentials file
    const keyPath = path.join(process.cwd(), 'luna-travel-agent-firebase-adminsdk-fbsvc-b2c7ba5ed8.json');
    let ttsConfigured = false;
    try {
        ttsConfigured = fs.existsSync(keyPath);
    } catch {}

    return NextResponse.json({
        services: [
            {
                id: 'gemini',
                name: 'Gemini API',
                description: 'IA conversationnelle, agent vocal, génération d\'images',
                model: 'gemini-2.5-flash',
                configured: geminiConfigured,
                consoleUrl: 'https://aistudio.google.com/',
            },
            {
                id: 'tts',
                name: 'Google Cloud TTS',
                description: 'Synthèse vocale (voix Journey-O)',
                voice: 'fr-FR-Journey-O',
                configured: ttsConfigured,
                consoleUrl: 'https://console.cloud.google.com/apis/api/texttospeech.googleapis.com',
            },
            {
                id: 'gmail',
                name: 'Gmail API',
                description: 'Envoi et réception d\'emails depuis le CRM',
                configured: gmailConfigured,
                consoleUrl: 'https://console.cloud.google.com/apis/api/gmail.googleapis.com',
            },
            {
                id: 'groq',
                name: 'Groq (Fallback IA)',
                description: 'Provider alternatif gratuit — Llama 3.3 70B',
                model: 'llama-3.3-70b-versatile',
                configured: groqConfigured,
                consoleUrl: 'https://console.groq.com/',
            },
        ],
    });
}
