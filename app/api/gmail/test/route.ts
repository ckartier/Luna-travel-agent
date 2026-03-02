import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
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
