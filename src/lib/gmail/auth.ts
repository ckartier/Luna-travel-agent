import { google } from 'googleapis';

export function getGmailClient() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.APP_GMAIL_CLIENT_ID,
        process.env.APP_GMAIL_CLIENT_SECRET,
        process.env.APP_GMAIL_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.APP_GMAIL_REFRESH_TOKEN,
    });

    return google.gmail({ version: 'v1', auth: oAuth2Client });
}
