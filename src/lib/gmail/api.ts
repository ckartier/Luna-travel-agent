import { getGmailClient } from './auth';

export async function getEmailContent(messageId: string) {
    const gmail = getGmailClient();

    try {
        const res = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full', // Need 'full' to properly parse multipart emails
        });

        const message = res.data;

        // Extract subject and sender for context
        const headers = message.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
        const sender = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers?.find(h => h.name === 'Date')?.value || new Date().toISOString();

        // Parse the body
        let bodyText = '';

        // Helper function to recursively find text parts
        const findTextPart = (parts: any[], mimeType: string): any => {
            if (!parts) return null;
            for (const part of parts) {
                if (part.mimeType === mimeType) return part;
                if (part.parts) {
                    const found = findTextPart(part.parts, mimeType);
                    if (found) return found;
                }
            }
            return null;
        };

        if (message.payload?.parts) {
            // It's a multipart email (potentially nested)
            const textPart = findTextPart(message.payload.parts, 'text/plain');
            if (textPart && textPart.body?.data) {
                bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
            } else {
                // Fallback to HTML if no plain text
                const htmlPart = findTextPart(message.payload.parts, 'text/html');
                if (htmlPart && htmlPart.body?.data) {
                    bodyText = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
                }
            }
        } else if (message.payload?.body?.data) {
            // It's a simple text email
            bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
        }

        return {
            sender,
            subject,
            date,
            bodyText,
        };
    } catch (error) {
        console.error(`Error fetching email ${messageId}:`, error);
        throw error;
    }
}

export async function listEmails(query: string = '', maxResults: number = 20) {
    const gmail = getGmailClient();

    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults,
            q: query,
        });

        const messages = res.data.messages || [];

        // Fetch basic metadata (subject, sender, date) for each message in the list
        const detailedMessages = await Promise.all(
            messages.map(async (msg) => {
                if (!msg.id) return null;
                try {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['Subject', 'From', 'Date'],
                    });

                    const headers = detail.data.payload?.headers;
                    const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
                    const sender = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
                    const date = headers?.find(h => h.name === 'Date')?.value || new Date().toISOString();

                    // Simple snippet for preview
                    const snippet = detail.data.snippet || '';

                    return {
                        id: msg.id,
                        threadId: msg.threadId,
                        subject,
                        sender,
                        date,
                        snippet,
                        labelIds: detail.data.labelIds || []
                    };
                } catch (e) {
                    console.error(`Error fetching metadata for msg ${msg.id}`, e);
                    return null;
                }
            })
        );

        return detailedMessages.filter(Boolean); // Remove any nulls from failed fetches
    } catch (error) {
        console.error('Error listing emails:', error);
        throw error;
    }
}

export async function sendEmail({ to, subject, bodyText, bodyHtml }: { to: string, subject: string, bodyText: string, bodyHtml?: string }) {
    const gmail = getGmailClient();
    try {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

        let emailLines: string[];
        if (bodyHtml) {
            // Send as HTML email
            emailLines = [
                `To: ${to}`,
                'Content-Type: text/html; charset=utf-8',
                'MIME-Version: 1.0',
                `Subject: ${utf8Subject}`,
                '',
                bodyHtml
            ];
        } else {
            emailLines = [
                `To: ${to}`,
                'Content-Type: text/plain; charset=utf-8',
                'MIME-Version: 1.0',
                `Subject: ${utf8Subject}`,
                '',
                bodyText
            ];
        }

        const rawEmail = Buffer.from(emailLines.join('\r\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: rawEmail }
        });

        return { success: true, messageId: res.data.id };
    } catch (error: any) {
        console.error('Error sending email:', error);
        throw new Error(error.message || 'Failed to send email');
    }
}
