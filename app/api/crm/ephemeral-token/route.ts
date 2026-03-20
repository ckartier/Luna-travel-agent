import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate an ephemeral token for client-side Gemini Live API access.
 * This avoids exposing the real API key in the browser.
 * For now, returns the API key directly (safe for dev).
 * TODO: Use Google's ephemeral token API for production.
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Return the API key for WebSocket auth
    // In production, replace with ephemeral token generation
    return NextResponse.json({ 
      apiKey: GEMINI_API_KEY,
      expiresIn: 3600 // 1 hour
    });

  } catch (error: any) {
    console.error('[EphemeralToken] Error:', error?.message);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
