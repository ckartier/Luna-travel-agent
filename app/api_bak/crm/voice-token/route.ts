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

    try {
        // Exchange API key for ephemeral token via Google's endpoint
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-audio-dialog:generateEphemeralToken?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            languageCode: 'fr-FR',
                        },
                    },
                }),
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[voice-token] Ephemeral token error:', res.status, errorText);

            // Fallback: return the API key directly (dev mode only)
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    apiKey,
                    model: 'gemini-2.5-flash-preview-native-audio-dialog',
                    fallback: true,
                });
            }

            return NextResponse.json(
                { error: 'Failed to generate ephemeral token' },
                { status: 502 }
            );
        }

        const data = await res.json();
        return NextResponse.json({
            token: data.token || data.ephemeralToken,
            model: 'gemini-2.5-flash-preview-native-audio-dialog',
            expiresIn: data.expiresIn || 120,
        });
    } catch (error: any) {
        console.error('[voice-token] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Token generation failed' },
            { status: 500 }
        );
    }
}
