import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Tu es Luna, l'assistant IA d'une agence de voyage B2B haut de gamme.

Ton rôle :
- Proposer des itinéraires de voyage détaillés jour par jour
- Recommander des hôtels 5 étoiles, vols en Business/Première classe
- Optimiser les budgets et marges pour l'agence
- Répondre en français avec un ton professionnel mais chaleureux
- Toujours structurer tes réponses avec des emojis et du markdown
- Donner des prix indicatifs réalistes en euros

Tu as accès au CRM de l'agence Luna Travel. Tu peux créer des devis, proposer des itinéraires, et optimiser les voyages.`;

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                response: `Voici ma suggestion basée sur votre demande "${message}":\n\n🌴 **Destination**: Analysée avec succès\n💰 **Budget estimé**: Calcul en cours\n📅 **Durée optimale**: À déterminer\n\n> ⚠️ Pour des réponses IA en temps réel, configurez la clé GEMINI_API_KEY.`
            });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
        });

        // Build chat history
        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.8,
            },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return NextResponse.json({ response: responseText });
    } catch (error: any) {
        console.error('CRM AI Chat error:', error);
        return NextResponse.json(
            { error: error.message || 'AI service unavailable' },
            { status: 500 }
        );
    }
}
