import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { google } from 'googleapis';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.APP_GMAIL_CLIENT_ID,
            process.env.APP_GMAIL_CLIENT_SECRET,
            process.env.APP_GMAIL_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.APP_GMAIL_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });

        return NextResponse.json({
            success: true,
            emailAddress: profile.data.emailAddress,
            messagesTotal: profile.data.messagesTotal
        });

    } catch (err: any) {
        console.error("Gmail App Route Test Failed:", err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}
