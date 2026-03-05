import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// ─── Send WhatsApp Message via Meta Cloud API ───
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const { to, message, clientName } = await request.json();

        if (!to || !message) {
            return NextResponse.json({ error: 'to and message required' }, { status: 400 });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        let deliveryStatus = 'saved_locally';
        let waMessageId = null;
        let deliveryError = null;

        if (token && phoneId) {
            try {
                const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to,
                        type: 'text',
                        text: { body: message },
                    }),
                });

                const data = await response.json();
                if (response.ok) {
                    deliveryStatus = 'sent';
                    waMessageId = data.messages?.[0]?.id;
                    // WhatsApp sent successfully
                } else {
                    deliveryStatus = 'failed';
                    deliveryError = data.error?.message || 'Failed to send';
                    console.error('WhatsApp API error:', data.error);
                }
            } catch (err: any) {
                deliveryStatus = 'failed';
                deliveryError = err.message;
                console.error('WhatsApp fetch error:', err);
            }
        }

        // Always save to Firestore via Admin SDK
        await adminDb.collection('messages').add({
            clientId: to,
            clientName: clientName || to,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            content: message,
            senderId: 'luna-agent',
            isRead: true,
            deliveryStatus,
            createdAt: new Date(),
        });

        return NextResponse.json({ status: deliveryStatus, messageId: waMessageId, error: deliveryError });
    } catch (error: any) {
        console.error('WhatsApp send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
