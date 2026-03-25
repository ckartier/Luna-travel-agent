export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { getBusinessName } from '@/src/lib/firebase/getBusinessName';

/**
 * CRON: Supplier Validation Retry
 * 
 * Called every 30 minutes (via Vercel cron or external scheduler).
 * Re-sends WhatsApp to suppliers who haven't validated a PENDING booking.
 * 
 * Flow:
 * 1. Find all supplier_bookings with status = 'PENDING'
 * 2. For each, check if the last retry was >= 30 min ago
 * 3. Resend WhatsApp with interactive buttons (✅ / ❌)
 * 4. Track retry count — max 6 retries (3 hours total)
 * 5. After max retries, escalate: mark as ESCALATED and notify admin
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';
const MAX_RETRIES = 6; // 6 × 30min = 3 hours
const RETRY_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req: Request) {
    // CRON_SECRET required
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = { retried: 0, escalated: 0, skipped: 0, errors: 0 };

    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            return NextResponse.json({
                success: false,
                message: 'WhatsApp API not configured',
            });
        }

        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;

            // ── Get all PENDING bookings ──
            const pendingSnap = await adminDb
                .collection(`tenants/${tenantId}/supplier_bookings`)
                .where('status', '==', 'PENDING')
                .get();

            // Get suppliers map for phone lookup
            const suppliersSnap = await adminDb.collection(`tenants/${tenantId}/suppliers`).get();
            const suppliersMap = new Map<string, any>();
            suppliersSnap.docs.forEach(d => suppliersMap.set(d.id, { id: d.id, ...d.data() }));

            for (const bookingDoc of pendingSnap.docs) {
                const booking = bookingDoc.data();
                const bookingId = bookingDoc.id;
                const supplier = suppliersMap.get(booking.supplierId);

                if (!supplier?.phone) {
                    results.skipped++;
                    continue;
                }

                // ── Check retry interval ──
                const retryCount = booking.retryCount || 0;
                const lastRetryAt = booking.lastRetryAt?.toDate?.() || booking.createdAt?.toDate?.() || new Date(0);
                const timeSinceLastRetry = now.getTime() - lastRetryAt.getTime();

                // Skip if last retry was less than 30 minutes ago
                if (timeSinceLastRetry < RETRY_INTERVAL_MS) {
                    results.skipped++;
                    continue;
                }

                // ── Check max retries ──
                if (retryCount >= MAX_RETRIES) {
                    // Escalate: mark as ESCALATED
                    await bookingDoc.ref.update({
                        status: 'ESCALATED',
                        escalatedAt: now,
                        escalationReason: `Pas de réponse après ${MAX_RETRIES} relances (${MAX_RETRIES * 30} min)`,
                        updatedAt: now,
                    });
                    results.escalated++;
                    console.log(`[Retry CRON] ⚠️ Booking ${bookingId} ESCALATED — No response after ${retryCount} retries`);
                    continue;
                }

                // ── Build retry message ──
                const dateFormatted = booking.date
                    ? new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Date à confirmer';

                const retryNumber = retryCount + 1;
                const urgencyEmoji = retryNumber <= 2 ? '📋' : retryNumber <= 4 ? '⏳' : '🚨';
                const urgencyText = retryNumber <= 2 ? 'Rappel' : retryNumber <= 4 ? 'Rappel urgent' : 'DERNIER RAPPEL';

                const bizName = await getBusinessName(tenantId);
                const message =
                    `${urgencyEmoji} *${urgencyText} — En attente de votre validation*\n\n` +
                    `Bonjour ${supplier.contactName || supplier.name} 👋\n\n` +
                    `Nous attendons votre confirmation pour :\n\n` +
                    `🎨 *${booking.prestationName}*\n` +
                    `📅 *Date :* ${dateFormatted}\n` +
                    `⏰ *Horaire :* ${booking.startTime || '?'} - ${booking.endTime || '?'}\n` +
                    `💰 *Tarif :* ${booking.rate || 0}€\n` +
                    `${booking.clientName ? `👤 *Client :* ${booking.clientName}\n` : ''}` +
                    `${booking.pickupLocation ? `📍 *Lieu :* ${booking.pickupLocation}\n` : ''}` +
                    `\n📨 _Relance ${retryNumber}/${MAX_RETRIES}_\n` +
                    `_${bizName}_ ✨`;

                // ── Send interactive WhatsApp ──
                try {
                    let normalizedPhone = supplier.phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
                    if (normalizedPhone.startsWith('0')) normalizedPhone = '33' + normalizedPhone.slice(1);

                    // First, try template if needed
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
                    await templateRes.json();

                    // Then send the interactive message
                    const messageBody = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: normalizedPhone,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            header: { type: 'text', text: `${urgencyEmoji} ${bizName} — ${urgencyText}` },
                            body: { text: message },
                            footer: { text: `Relance ${retryNumber}/${MAX_RETRIES}` },
                            action: {
                                buttons: [
                                    { type: 'reply', reply: { id: `CONFIRM_${bookingId}`, title: '✅ Validé' } },
                                    { type: 'reply', reply: { id: `REJECT_${bookingId}`, title: '❌ Non Validé' } },
                                ],
                            },
                        },
                    };

                    const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(messageBody),
                    });

                    const data = await res.json();

                    // ── Update booking with retry tracking ──
                    await bookingDoc.ref.update({
                        retryCount: retryNumber,
                        lastRetryAt: now,
                        lastRetryMessageId: data.messages?.[0]?.id || null,
                        updatedAt: now,
                    });

                    // ── Save retry message to CRM messages ──
                    await adminDb.collection(`tenants/${tenantId}/messages`).add({
                        clientId: supplier.id,
                        clientName: supplier.name,
                        channel: 'WHATSAPP',
                        direction: 'OUTBOUND',
                        recipientType: 'SUPPLIER',
                        content: message,
                        senderId: 'SYSTEM_CRON',
                        isRead: true,
                        deliveryStatus: res.ok ? 'sent' : 'failed',
                        externalMessageId: data.messages?.[0]?.id || null,
                        hasInteractiveButtons: true,
                        bookingId,
                        prestationName: booking.prestationName,
                        isAutoRetry: true,
                        retryNumber,
                        createdAt: now,
                    });

                    results.retried++;
                    console.log(`[Retry CRON] ✅ Retry ${retryNumber}/${MAX_RETRIES} sent for booking ${bookingId} to ${supplier.name}`);
                } catch (sendErr) {
                    results.errors++;
                    console.error(`[Retry CRON] ❌ Send error for ${bookingId}:`, sendErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            results,
        });
    } catch (error: any) {
        console.error('[Retry CRON] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
