import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { sendEmail } from '@/src/lib/gmail/api';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const {
            to, // Can be a single email string OR an array of emails
            subject = 'Nouveau Message - Luna 🌟',
            message,
            bodyHtml,
            clientId,
            clientName,
            recipientType = 'CLIENT', // 'CLIENT' | 'SUPPLIER'
        } = await request.json();

        if (!to || (!message && !bodyHtml)) {
            return NextResponse.json({ error: 'to and message (or bodyHtml) required' }, { status: 400 });
        }

        // Get user's tenantId
        const userDoc = await adminDb.collection('users').doc(auth.uid).get();
        const tenantId = userDoc.exists ? userDoc.data()?.tenantId : auth.uid;
        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant found for user' }, { status: 400 });
        }

        // Normalize "to" to an array of email addresses
        const recipients: string[] = Array.isArray(to) ? to : [to];
        const results: { email: string; status: string; messageId?: string; error?: string }[] = [];

        for (const recipientEmail of recipients) {
            let deliveryStatus = 'saved_locally';
            let emailMessageId = null;

            try {
                const emailResult = await sendEmail({
                    to: recipientEmail,
                    subject,
                    bodyText: message || '',
                    bodyHtml,
                });
                deliveryStatus = 'sent';
                emailMessageId = emailResult.messageId;
            } catch (error: any) {
                deliveryStatus = 'failed';
                console.error(`Email send error for ${recipientEmail}:`, error);
            }

            // Save each email as a separate message in CRM with CLIENT/SUPPLIER separation
            await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
                clientId: clientId || recipientEmail,
                clientName: clientName || recipientEmail,
                channel: 'EMAIL',
                direction: 'OUTBOUND',
                recipientType, // 'CLIENT' or 'SUPPLIER'
                content: message,
                senderId: auth.uid,
                isRead: true,
                deliveryStatus,
                externalMessageId: emailMessageId,
                recipientEmail: recipientEmail,
                allRecipients: recipients, // Cross-reference: all recipients in this batch
                createdAt: new Date(),
            });

            results.push({
                email: recipientEmail,
                status: deliveryStatus,
                messageId: emailMessageId || undefined,
                error: deliveryStatus === 'failed' ? 'Send failed' : undefined,
            });
        }

        const allSent = results.every(r => r.status === 'sent');
        return NextResponse.json({
            status: allSent ? 'sent' : 'partial',
            results,
            totalSent: results.filter(r => r.status === 'sent').length,
            totalFailed: results.filter(r => r.status === 'failed').length,
        });
    } catch (error: any) {
        console.error('Gmail send route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
