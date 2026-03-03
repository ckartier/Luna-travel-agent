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

        if (message.payload?.parts) {
            // It's a multipart email
            const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
            if (textPart && textPart.body?.data) {
                bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
            } else {
                // Fallback to HTML if no plain text
                const htmlPart = message.payload.parts.find(part => part.mimeType === 'text/html');
                if (htmlPart && htmlPart.body?.data) {
                    // In a real prod environment, strip HTML tags here using a library like 'html-to-text'
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

