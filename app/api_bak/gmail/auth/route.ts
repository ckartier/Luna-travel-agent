import { NextResponse } from 'next/server';

// Generates the Google OAuth 2.0 URL
// Auth guard temporarily removed for re-authentication
export async function GET(request: Request) {
    const clientId = process.env.APP_GMAIL_CLIENT_ID;
    const redirectUri = process.env.APP_GMAIL_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: 'Missing OAuth Configuration' }, { status: 500 });
    }

    // Scopes needed by Luna AI to read, send, and manage email
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
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
