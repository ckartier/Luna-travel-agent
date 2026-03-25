export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: `OAuth Error: ${error}` }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    try {
        // Exchange the authorization code for an access token and refresh token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.APP_GMAIL_CLIENT_ID || '',
                client_secret: process.env.APP_GMAIL_CLIENT_SECRET || '',
                redirect_uri: process.env.APP_GMAIL_REDIRECT_URI || '',
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Token Exchange Error:", tokens);
            return NextResponse.json({ error: 'Failed to exchange token', details: tokens }, { status: 400 });
        }

        // In a real app, you would save these securely to the database (Supabase)
        // For local development, we'll return them so the user can paste them into .env.local

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; padding: 40px; background: #f8fafc; color: #0f172a;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h1 style="color: #10b981;">🎉 Succès de la Connexion !</h1>
                        <p>Google a validé l'accès. Voici le Refresh Token (très important) à copier dans votre fichier <b>.env.local</b> :</p>
                        
                        <div style="background: #1e293b; color: #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 20px 0;">
                            GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'Non fourni (déjà généré dans le passé ?)'}
                        </div>

                        <p style="color: #64748b; font-size: 14px;">
                            Access Token (expire dans 1h, le système utilisera le refresh token pour en recréer un nouveau en automatique) :<br/>
                            <span style="font-family: monospace; word-break: break-all;">${tokens.access_token}</span>
                        </p>

                        <a href="/" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Retour au Dashboard Luna</a>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (err: any) {
        console.error("OAuth Callback Exception:", err);
        return NextResponse.json({ error: 'Internal Server Error during callback processing', details: err?.message }, { status: 500 });
    }
}
