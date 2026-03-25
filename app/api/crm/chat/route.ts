export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { trackAPIUsage } from '@/src/lib/apiUsageTracker';
import { generateAI } from '@/src/lib/ai/provider';
import { consumeAiUsage } from '@/src/lib/firebase/tenantLimits';

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
        if (auth.tenantId) {
            const usageCheck = await consumeAiUsage(auth.tenantId);
            if (!usageCheck.allowed) {
                return NextResponse.json({ error: usageCheck.message }, { status: 429 });
            }
        }

        const { message, history, systemPrompt } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
            return NextResponse.json({
                response: `Voici ma suggestion basée sur votre demande "${message}":\n\n🌴 **Destination**: Analysée avec succès\n💰 **Budget estimé**: Calcul en cours\n📅 **Durée optimale**: À déterminer\n\n> ⚠️ Pour des réponses IA en temps réel, configurez GROQ_API_KEY ou GEMINI_API_KEY.`
            });
        }

        // Build history array for provider
        const chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                chatHistory.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                });
            }
        }

        const result = await generateAI(message, {
            model: 'fast',
            systemPrompt: systemPrompt || SYSTEM_PROMPT,
            temperature: 0.8,
            maxTokens: 8192,
            history: chatHistory,
        });

        // Track API usage with actual provider used
        if (auth.tenantId) trackAPIUsage(auth.tenantId, result.provider === 'groq' ? 'groq' : 'gemini');

        return NextResponse.json({ response: result.text });
    } catch (error: any) {
        console.error('CRM AI Chat error:', error);
        return NextResponse.json(
            { error: error.message || 'AI service unavailable' },
            { status: 500 }
        );
    }
}


