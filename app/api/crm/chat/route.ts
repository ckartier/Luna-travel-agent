import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { trackAPIUsage } from '@/src/lib/apiUsageTracker';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_PROMPT = `Tu es Luna, l'assistant IA d'une agence de voyage B2B haut de gamme.

Ton rôle :
- Proposer des itinéraires de voyage détaillés jour par jour
- Recommander des hôtels 5 étoiles, vols en Business/Première classe
- Optimiser les budgets et marges pour l'agence
- Répondre en français avec un ton professionnel mais chaleureux
- Toujours structurer tes réponses avec des emojis et du markdown
- Donner des prix indicatifs réalistes en euros

Tu as accès au CRM de l'agence. Tu peux créer des devis, proposer des itinéraires, et optimiser les voyages.`;

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;
    try {
        const { message, history, systemPrompt } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                response: `Voici ma suggestion basée sur votre demande "${message}":\n\n🌴 **Destination**: Analysée avec succès\n💰 **Budget estimé**: Calcul en cours\n📅 **Durée optimale**: À déterminer\n\n> ⚠️ Pour des réponses IA en temps réel, configurez la clé GEMINI_API_KEY.`
            });
        }

        // Build contents array with history + new message
        const contents: { role: string; parts: { text: string }[] }[] = [];

        // Add chat history
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                });
            }
        }

        // Add the new user message
        contents.push({
            role: 'user',
            parts: [{ text: message }],
        });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: {
                systemInstruction: systemPrompt || SYSTEM_PROMPT,
                maxOutputTokens: 8192,
                temperature: 0.8,
            },
        });

        const responseText = result.text || '';

        // Track API usage
        if (auth.tenantId) trackAPIUsage(auth.tenantId, 'gemini');

        return NextResponse.json({ response: responseText });
    } catch (error: any) {
        console.error('CRM AI Chat error:', error);
        return NextResponse.json(
            { error: error.message || 'AI service unavailable' },
            { status: 500 }
        );
    }
}

