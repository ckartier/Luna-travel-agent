import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

// ─── WhatsApp Cloud API Webhook ───
// 1. Meta sends a GET to verify the webhook (challenge)
// 2. Meta sends a POST for every incoming message

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'luna-travel-whatsapp-2026';

// GET — Webhook verification (Meta)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // WhatsApp webhook verified
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST — Incoming messages from WhatsApp
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            return NextResponse.json({ status: 'no_data' });
        }

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
            for (const msg of value.messages) {
                const from = msg.from;
                const text = msg.text?.body || msg.caption || '[Media]';

                const contactInfo = value.contacts?.[0];
                const senderName = contactInfo?.profile?.name || from;

                // Save to Firestore via Admin SDK
                await adminDb.collection('messages').add({
                    clientId: from,
                    clientName: senderName,
                    channel: 'WHATSAPP',
                    direction: 'INBOUND',
                    content: text,
                    senderId: from,
                    isRead: false,
                    createdAt: new Date(),
                });

            }
        }

        // Handle message status updates
        if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('WhatsApp webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
