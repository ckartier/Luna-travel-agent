import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { trackAPIUsage } from '@/src/lib/apiUsageTracker';

// ─── Send WhatsApp Message via Meta Cloud API ───
const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const {
            to, message, clientName, clientId,
            // NEW: recipientType separates CLIENT vs SUPPLIER
            recipientType = 'CLIENT', // 'CLIENT' | 'SUPPLIER'
            // NEW: interactive buttons for supplier availability
            interactiveButtons = false,
            bookingId,
            prestationName
        } = await request.json();

        if (!to || !message) {
            return NextResponse.json({ error: 'to and message required' }, { status: 400 });
        }

        // Normalize phone to digits only (Meta WhatsApp API format)
        let normalizedPhone = to.replace(/[\s\-\(\)\.]/g, '');
        normalizedPhone = normalizedPhone.replace(/^\+/, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '33' + normalizedPhone.slice(1);
        }

        console.log(`[WhatsApp Send] Original: "${to}" → Normalized: "${normalizedPhone}" | Type: ${recipientType}`);

        // Get user's tenantId for tenant-scoped storage
        const userDoc = await adminDb.collection('users').doc(auth.uid).get();
        const tenantId = userDoc.exists ? userDoc.data()?.tenantId : auth.uid;
        if (!tenantId) {
            return NextResponse.json({ error: 'No tenant found for user' }, { status: 400 });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        let deliveryStatus = 'saved_locally';
        let waMessageId = null;
        let deliveryError = null;

        if (token && phoneId) {
            try {
                // ── Choose message type: Interactive Buttons vs Plain Text ──
                let messageBody: any;

                if (interactiveButtons && recipientType === 'SUPPLIER') {
                    // Interactive button message for supplier confirmation
                    messageBody = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: normalizedPhone,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            header: {
                                type: 'text',
                                text: '🌟 Confirmation de disponibilité'
                            },
                            body: {
                                text: message
                            },
                            footer: {
                                text: '✨ Répondez directement depuis ce message'
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: `CONFIRM_${bookingId || 'unknown'}`,
                                            title: '✅ Validé'
                                        }
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: `REJECT_${bookingId || 'unknown'}`,
                                            title: '❌ Non Validé'
                                        }
                                    }
                                ]
                            }
                        }
                    };
                } else {
                    // Standard text message
                    messageBody = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: normalizedPhone,
                        type: 'text',
                        text: { body: message },
                    };
                }

                let response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messageBody),
                });

                let data = await response.json();
                console.log('[WhatsApp API Response]', data);

                // If recipient not in allowed list (sandbox) or no conversation window,
                // initiate with a template first, then send the actual message
                if (!response.ok && (data.error?.code === 131030 || data.error?.code === 131047)) {
                    console.log(`[WhatsApp] Initiating conversation with template for ${normalizedPhone}...`);

                    // Send hello_world template to open the conversation window
                    const templateRes = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            to: normalizedPhone,
                            type: 'template',
                            template: { name: 'hello_world', language: { code: 'en_US' } },
                        }),
                    });

                    const templateData = await templateRes.json();
                    if (templateRes.ok) {
                        console.log(`[WhatsApp] Template sent successfully, now sending interactive/text...`);
                        deliveryStatus = 'sent';
                        waMessageId = templateData.messages?.[0]?.id;

                        // Now try sending the actual message (conversation window is open)
                        const textRes = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(messageBody),
                        });
                        const textData = await textRes.json();
                        if (textRes.ok) {
                            waMessageId = textData.messages?.[0]?.id;
                        } else {
                            console.log(`[WhatsApp] Message after template failed:`, textData.error?.message);
                        }
                    } else {
                        deliveryStatus = 'failed';
                        deliveryError = templateData.error?.message || 'Template failed';
                        console.error('WhatsApp template error:', templateData.error);
                    }
                } else if (response.ok) {
                    deliveryStatus = 'sent';
                    waMessageId = data.messages?.[0]?.id;
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

        // ── Save to messages collection with CLIENT/SUPPLIER separation ──
        await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
            clientId: clientId || to,
            clientName: clientName || to,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            recipientType: recipientType, // 'CLIENT' or 'SUPPLIER' — cross-referenced
            content: message,
            senderId: auth.uid,
            isRead: true,
            deliveryStatus,
            externalMessageId: waMessageId,
            recipientPhone: to,
            bookingId: bookingId || null,
            prestationName: prestationName || null,
            hasInteractiveButtons: interactiveButtons,
            createdAt: new Date(),
        });

        // Track WhatsApp usage
        if (deliveryStatus === 'sent') trackAPIUsage(tenantId, 'whatsapp');

        return NextResponse.json({
            status: deliveryStatus,
            messageId: waMessageId,
            error: deliveryError,
            recipientType
        });
    } catch (error: any) {
        console.error('WhatsApp send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
