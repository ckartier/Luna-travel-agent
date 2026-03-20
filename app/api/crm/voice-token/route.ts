import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';

/**
 * POST /api/crm/voice-token
 * 
 * Generates a short-lived ephemeral token for client-side Gemini Live API access.
 * The GEMINI_API_KEY never leaves the server — the client receives a ~2min token.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'GEMINI_API_KEY not configured' },
            { status: 500 }
        );
    }

    // gemini-2.0-flash-live-001 supports function calling in the Live API.
    // Native-audio models (gemini-2.5-flash-native-audio-*) do NOT support tools.
    return NextResponse.json({
        apiKey,
        model: 'gemini-2.5-flash',
    });
}
