import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// Generates the Google OAuth 2.0 URL
export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const clientId = process.env.APP_GMAIL_CLIENT_ID;
    const redirectUri = process.env.APP_GMAIL_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: 'Missing OAuth Configuration' }, { status: 500 });
    }

    // Scopes needed by Luna AI to read and send email
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent`; // Forces refresh token generation

    return NextResponse.redirect(authUrl);
}
