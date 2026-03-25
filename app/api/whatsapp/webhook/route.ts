export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { getBusinessName } from '@/src/lib/firebase/getBusinessName';

// ─── WhatsApp Cloud API Webhook ───
// 1. Meta sends a GET to verify the webhook (challenge)
// 2. Meta sends a POST for every incoming message + button replies

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'luna-travel-whatsapp-2026';

// GET — Webhook verification (Meta)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST — Incoming messages from WhatsApp (text + interactive button replies)
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            return NextResponse.json({ status: 'no_data' });
        }

        // ── Handle incoming messages (text + interactive button replies) ──
        if (value.messages && value.messages.length > 0) {
            for (const msg of value.messages) {
                const from = msg.from; // phone number like "33612345678"
                const waMessageId = msg.id;
                const timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date();

                const contactInfo = value.contacts?.[0];
                const senderName = contactInfo?.profile?.name || from;

                // ── Check if this is a BUTTON REPLY (interactive response) ──
                if (msg.type === 'interactive' && msg.interactive?.type === 'button_reply') {
                    const buttonId = msg.interactive.button_reply.id; // "CONFIRM_bookingId" or "REJECT_bookingId"
                    const buttonTitle = msg.interactive.button_reply.title; // "✅ Validé" or "❌ Non Validé"

                    console.log(`[WhatsApp Webhook] Button reply from ${from}: ${buttonId} (${buttonTitle})`);

                    // Parse the booking ID from the button ID
                    const isConfirmed = buttonId.startsWith('CONFIRM_');
                    const bookingId = buttonId.replace('CONFIRM_', '').replace('REJECT_', '');

                    if (bookingId && bookingId !== 'unknown') {
                        // ── Sync with planning: update booking status ──
                        const bookingDetails = await syncBookingStatus(bookingId, isConfirmed, from, senderName);

                        // ── Auto-send confirmation WhatsApp back to supplier ──
                        if (isConfirmed && bookingDetails) {
                            await sendSupplierConfirmation(from, senderName, bookingDetails);
                            // ── Auto-generate invoice in Finances ──
                            await autoGenerateInvoice(bookingId, senderName);
                        }
                    }

                    // Save the button reply as a message
                    const tenantId = await findTenantByPhone(from) || await findTenantBySupplierPhone(from);
                    if (tenantId) {
                        const supplierId = await findSupplierIdByPhone(tenantId, from);
                        await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
                            clientId: supplierId || from,
                            clientName: senderName,
                            channel: 'WHATSAPP',
                            direction: 'INBOUND',
                            recipientType: 'SUPPLIER', // Response from supplier
                            content: `${buttonTitle} — Réponse automatique à la demande de disponibilité`,
                            senderId: from,
                            isRead: false,
                            externalMessageId: waMessageId,
                            deliveryStatus: 'received',
                            bookingId: bookingId !== 'unknown' ? bookingId : null,
                            buttonReply: { id: buttonId, title: buttonTitle, confirmed: isConfirmed },
                            createdAt: timestamp,
                        });
                    }
                    continue; // Don't process as normal text
                }

                // ── Standard text message ──
                const text = msg.text?.body || msg.caption || '[Media]';

                // First try to match to a SUPPLIER, then to a CLIENT contact
                const tenantId = await findTenantBySupplierPhone(from) || await findTenantByPhone(from);

                if (tenantId) {
                    // Determine if sender is a supplier or client
                    const supplierId = await findSupplierIdByPhone(tenantId, from);
                    const contactId = supplierId || await findContactIdByPhone(tenantId, from);
                    const recipientType = supplierId ? 'SUPPLIER' : 'CLIENT';

                    await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
                        clientId: contactId || from,
                        clientName: senderName,
                        channel: 'WHATSAPP',
                        direction: 'INBOUND',
                        recipientType,
                        content: text,
                        senderId: from,
                        isRead: false,
                        externalMessageId: waMessageId,
                        deliveryStatus: 'received',
                        createdAt: timestamp,
                    });
                } else {
                    // Fallback: save to the first tenant
                    const fallbackTenantId = await getFirstTenantId();
                    if (fallbackTenantId) {
                        await adminDb.collection('tenants').doc(fallbackTenantId).collection('messages').add({
                            clientId: from,
                            clientName: senderName,
                            channel: 'WHATSAPP',
                            direction: 'INBOUND',
                            recipientType: 'CLIENT',
                            content: text,
                            senderId: from,
                            isRead: false,
                            externalMessageId: waMessageId,
                            deliveryStatus: 'received',
                            createdAt: timestamp,
                        });
                    }
                }
            }
        }

        // ── Handle message status updates (delivered, read, etc.) ──
        if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
                const waMessageId = status.id;
                const statusValue = status.status;
                try {
                    const tenantsSnap = await adminDb.collection('tenants').get();
                    for (const tenantDoc of tenantsSnap.docs) {
                        const msgQuery = await adminDb
                            .collection('tenants').doc(tenantDoc.id)
                            .collection('messages')
                            .where('externalMessageId', '==', waMessageId)
                            .limit(1)
                            .get();
                        if (!msgQuery.empty) {
                            await msgQuery.docs[0].ref.update({ deliveryStatus: statusValue });
                            break;
                        }
                    }
                } catch (err) {
                    console.error('Status update error:', err);
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('WhatsApp webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── Auto-generate invoice when a booking is confirmed ──
async function autoGenerateInvoice(bookingId: string, supplierName: string) {
    try {
        const tenantsSnap = await adminDb.collection('tenants').get();
        for (const tenantDoc of tenantsSnap.docs) {
            const bookingRef = adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('supplier_bookings').doc(bookingId);
            const bookingSnap = await bookingRef.get();
            if (bookingSnap.exists) {
                const booking = bookingSnap.data()!;
                const quantity = booking.numberOfGuests || 1;
                const rate = booking.rate || 0;
                const subtotal = rate * quantity;
                const extraFees = booking.extraFees || 0;

                const invoiceData = {
                    invoiceNumber: `INV-P${Date.now().toString().slice(-6)}`,
                    tripId: '',
                    clientId: booking.clientId || booking.supplierId,
                    clientName: booking.clientName || supplierName,
                    issueDate: new Date().toISOString().slice(0, 10),
                    dueDate: new Date(new Date(booking.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                    items: [{
                        description: `${booking.prestationName} — ${supplierName} (${booking.date})`,
                        quantity,
                        unitPrice: rate,
                        total: subtotal,
                        taxRate: 0,
                    }],
                    subtotal,
                    taxTotal: 0,
                    totalAmount: subtotal + extraFees,
                    currency: 'EUR',
                    amountPaid: 0,
                    status: 'DRAFT',
                    notes: `Facture auto-générée — Prestation confirmée par ${supplierName} via WhatsApp.\nDate: ${booking.date} ${booking.startTime || ''} - ${booking.endTime || ''}\n${booking.pickupLocation ? `Lieu: ${booking.pickupLocation}` : ''}\nBooking ID: ${bookingId}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const invoiceRef = await adminDb
                    .collection('tenants').doc(tenantDoc.id)
                    .collection('invoices').add(invoiceData);

                // Link invoice to booking
                await bookingRef.update({
                    invoiceId: invoiceRef.id,
                    invoiceNumber: invoiceData.invoiceNumber,
                });

                console.log(`[Auto-Invoice] Created ${invoiceData.invoiceNumber} for booking ${bookingId} (${invoiceData.totalAmount}€)`);
                return;
            }
        }
    } catch (error) {
        console.error('[Auto-Invoice] Error:', error);
    }
}

// ── Sync booking status from button reply ──
async function syncBookingStatus(bookingId: string, isConfirmed: boolean, phone: string, name: string): Promise<{ prestationName: string; date: string; rate: number; startTime?: string; endTime?: string } | null> {
    try {
        // First try in supplier_bookings (flat collection under tenant)
        const tenantsSnap = await adminDb.collection('tenants').get();
        for (const tenantDoc of tenantsSnap.docs) {
            // Check flat supplier_bookings collection first
            const flatRef = adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('supplier_bookings').doc(bookingId);
            const flatSnap = await flatRef.get();
            if (flatSnap.exists) {
                const data = flatSnap.data()!;

                // Detect late cancellation (< 1h before prestation)
                let status = isConfirmed ? 'CONFIRMED' : 'CANCELLED';
                let cancelledLate = false;
                if (!isConfirmed && data.date && data.startTime) {
                    const prestationTime = new Date(`${data.date}T${data.startTime}:00`);
                    const hoursUntil = (prestationTime.getTime() - Date.now()) / (1000 * 60 * 60);
                    if (hoursUntil <= 1 && hoursUntil > -2) {
                        status = 'CANCELLED_LATE';
                        cancelledLate = true;
                        console.log(`[⚠️ LATE CANCELLATION] Booking ${bookingId} cancelled ${hoursUntil.toFixed(1)}h before prestation!`);
                    }
                }

                await flatRef.update({
                    status,
                    cancelledLate,
                    cancelledAt: !isConfirmed ? new Date() : null,
                    supplierResponse: {
                        confirmed: isConfirmed,
                        respondedAt: new Date(),
                        respondedBy: name,
                        respondedPhone: phone,
                    },
                    updatedAt: new Date(),
                });
                console.log(`[Booking Sync] ${bookingId} → ${status} by ${name}`);
                return {
                    prestationName: data.prestationName || 'Prestation',
                    date: data.date || new Date().toISOString().split('T')[0],
                    rate: data.rate || 0,
                    startTime: data.startTime,
                    endTime: data.endTime,
                };
            }

            // Fallback: check nested supplier/bookings subcollections
            const suppliersSnap = await adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('suppliers')
                .get();

            for (const supplierDoc of suppliersSnap.docs) {
                const bookingRef = adminDb
                    .collection('tenants').doc(tenantDoc.id)
                    .collection('suppliers').doc(supplierDoc.id)
                    .collection('bookings').doc(bookingId);

                const bookingSnap = await bookingRef.get();
                if (bookingSnap.exists) {
                    const data = bookingSnap.data()!;
                    await bookingRef.update({
                        status: isConfirmed ? 'CONFIRMED' : 'CANCELLED',
                        supplierResponse: {
                            confirmed: isConfirmed,
                            respondedAt: new Date(),
                            respondedBy: name,
                            respondedPhone: phone,
                        },
                        updatedAt: new Date(),
                    });
                    console.log(`[Booking Sync] ${bookingId} → ${isConfirmed ? 'CONFIRMED ✅' : 'CANCELLED ❌'} by ${name}`);
                    return {
                        prestationName: data.prestationName || 'Prestation',
                        date: data.date || new Date().toISOString().split('T')[0],
                        rate: data.rate || 0,
                        startTime: data.startTime,
                        endTime: data.endTime,
                    };
                }
            }
        }
        console.log(`[Booking Sync] Booking ${bookingId} not found`);
        return null;
    } catch (err) {
        console.error('[Booking Sync] Error:', err);
        return null;
    }
}

// ── Auto-send confirmation WhatsApp to supplier after they validate ──
async function sendSupplierConfirmation(
    phone: string,
    supplierName: string,
    booking: { prestationName: string; date: string; rate: number; startTime?: string; endTime?: string }
) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return;

    // Fetch dynamic business name
    const tenantId = await findTenantBySupplierPhone(phone);
    const bizName = await getBusinessName(tenantId || undefined);

    let normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
    if (normalizedPhone.startsWith('0')) normalizedPhone = '33' + normalizedPhone.slice(1);

    // Format date nicely
    const dateObj = new Date(booking.date);
    const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const horaire = booking.startTime ? `${booking.startTime}${booking.endTime ? ' - ' + booking.endTime : ''}` : 'À confirmer';

    const confirmMessage =
        `✅ *C'est validé ! Merci ${supplierName} !* 🎉\n\n` +
        `Votre confirmation a bien été enregistrée.\n\n` +
        `📋 *Récapitulatif :*\n` +
        `🎨 *Prestation :* ${booking.prestationName}\n` +
        `📅 *Date :* ${dateStr}\n` +
        `⏰ *Horaire :* ${horaire}\n` +
        `💰 *Tarif convenu :* ${booking.rate.toLocaleString('fr-FR')} €\n\n` +
        `📌 *Statut :* Confirmé ✨\n\n` +
        `🙏 Merci de votre confiance, à très bientôt !\n` +
        `_${bizName} — On fait le bonheur ensemble 💫_`;

    try {
        const res = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: normalizedPhone,
                type: 'text',
                text: { body: confirmMessage },
            }),
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`[Auto-Confirm] ✅ Confirmation WhatsApp sent to ${supplierName} (${normalizedPhone})`);
        } else {
            console.error(`[Auto-Confirm] ❌ Failed:`, data.error?.message);
        }

        // Save confirmation message to CRM messages
        const tenantId = await findTenantBySupplierPhone(phone);
        if (tenantId) {
            const supplierId = await findSupplierIdByPhone(tenantId, phone);
            await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
                clientId: supplierId || phone,
                clientName: supplierName,
                channel: 'WHATSAPP',
                direction: 'OUTBOUND',
                recipientType: 'SUPPLIER',
                content: confirmMessage,
                senderId: 'SYSTEM_AUTO',
                isRead: true,
                deliveryStatus: res.ok ? 'sent' : 'failed',
                externalMessageId: data.messages?.[0]?.id || null,
                isAutoConfirmation: true,
                createdAt: new Date(),
            });
        }
    } catch (err) {
        console.error('[Auto-Confirm] Error:', err);
    }
}

// ── Helper: find tenant by contact phone ──
async function findTenantByPhone(phone: string): Promise<string | null> {
    try {
        const tenantsSnap = await adminDb.collection('tenants').get();
        for (const tenantDoc of tenantsSnap.docs) {
            const contactsSnap = await adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('contacts')
                .where('phone', '==', phone)
                .limit(1)
                .get();
            if (!contactsSnap.empty) return tenantDoc.id;

            const altPhone = phone.startsWith('+') ? phone.slice(1) : `+${phone}`;
            const altSnap = await adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('contacts')
                .where('phone', '==', altPhone)
                .limit(1)
                .get();
            if (!altSnap.empty) return tenantDoc.id;
        }
    } catch (err) {
        console.error('findTenantByPhone error:', err);
    }
    return null;
}

// ── Helper: find tenant by SUPPLIER phone ──
async function findTenantBySupplierPhone(phone: string): Promise<string | null> {
    try {
        const tenantsSnap = await adminDb.collection('tenants').get();
        for (const tenantDoc of tenantsSnap.docs) {
            const suppliersSnap = await adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('suppliers')
                .where('phone', '==', phone)
                .limit(1)
                .get();
            if (!suppliersSnap.empty) return tenantDoc.id;

            const altPhone = phone.startsWith('+') ? phone.slice(1) : `+${phone}`;
            const altSnap = await adminDb
                .collection('tenants').doc(tenantDoc.id)
                .collection('suppliers')
                .where('phone', '==', altPhone)
                .limit(1)
                .get();
            if (!altSnap.empty) return tenantDoc.id;
        }
    } catch (err) {
        console.error('findTenantBySupplierPhone error:', err);
    }
    return null;
}

// ── Helper: find supplier ID by phone ──
async function findSupplierIdByPhone(tenantId: string, phone: string): Promise<string | null> {
    try {
        const snap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('suppliers')
            .where('phone', '==', phone)
            .limit(1)
            .get();
        if (!snap.empty) return snap.docs[0].id;

        const altPhone = phone.startsWith('+') ? phone.slice(1) : `+${phone}`;
        const altSnap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('suppliers')
            .where('phone', '==', altPhone)
            .limit(1)
            .get();
        if (!altSnap.empty) return altSnap.docs[0].id;
    } catch (err) {
        console.error('findSupplierIdByPhone error:', err);
    }
    return null;
}

// ── Helper: find contact ID by phone ──
async function findContactIdByPhone(tenantId: string, phone: string): Promise<string | null> {
    try {
        const snap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('contacts')
            .where('phone', '==', phone)
            .limit(1)
            .get();
        if (!snap.empty) return snap.docs[0].id;

        const altPhone = phone.startsWith('+') ? phone.slice(1) : `+${phone}`;
        const altSnap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('contacts')
            .where('phone', '==', altPhone)
            .limit(1)
            .get();
        if (!altSnap.empty) return altSnap.docs[0].id;
    } catch (err) {
        console.error('findContactIdByPhone error:', err);
    }
    return null;
}

// ── Helper: get the first tenant as fallback ──
async function getFirstTenantId(): Promise<string | null> {
    try {
        const snap = await adminDb.collection('tenants').limit(1).get();
        return snap.empty ? null : snap.docs[0].id;
    } catch {
        return null;
    }
}
