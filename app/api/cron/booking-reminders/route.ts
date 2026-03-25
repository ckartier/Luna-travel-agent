export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * CRON: Booking Reminders
 * 
 * Called every hour (via Vercel cron or external scheduler).
 * Sends WhatsApp reminders to suppliers:
 * - J-1 (24h before): Friendly reminder with full details + confirm/cancel buttons
 * - H-3 (3h before): Urgent reminder with pickup info + confirm/cancel buttons
 * 
 * Also handles late cancellation detection and auto-escalation.
 */

const WHATSAPP_SEND_URL = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp/send`
    : 'http://localhost:3001/api/whatsapp/send';

async function sendWhatsApp(to: string, message: string, supplierName: string, supplierId: string, interactiveButtons = false, prestationName = '') {
    try {
        await fetch(WHATSAPP_SEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                message,
                clientName: supplierName,
                clientId: supplierId,
                recipientType: 'SUPPLIER',
                interactiveButtons,
                prestationName,
            }),
        });
        return true;
    } catch (e) {
        console.error('[CRON] WhatsApp send error:', e);
        return false;
    }
}

export async function GET(req: Request) {
    // CRON_SECRET required — prevents unauthorized execution
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = { j1Sent: 0, h3Sent: 0, lateCancellations: 0, errors: 0 };

    try {
        // Get all tenants (organizations)
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;

            // Get all CONFIRMED bookings
            const bookingsSnap = await adminDb
                .collection(`tenants/${tenantId}/supplier_bookings`)
                .where('status', '==', 'CONFIRMED')
                .get();

            // Get suppliers for phone lookup
            const suppliersSnap = await adminDb.collection(`tenants/${tenantId}/suppliers`).get();
            const suppliersMap = new Map<string, any>();
            suppliersSnap.docs.forEach(d => suppliersMap.set(d.id, { id: d.id, ...d.data() }));

            for (const bookingDoc of bookingsSnap.docs) {
                const booking = bookingDoc.data();
                const bookingId = bookingDoc.id;
                const supplier = suppliersMap.get(booking.supplierId);
                if (!supplier?.phone) continue;

                // Calculate time until prestation
                const prestationDateTime = new Date(`${booking.date}T${booking.startTime || '09:00'}:00`);
                const hoursUntil = (prestationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                // ═══ J-1 REMINDER (between 23h and 25h before) ═══
                if (hoursUntil >= 23 && hoursUntil <= 25 && !booking.reminderJ1Sent) {
                    const dateFormatted = new Date(booking.date).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                    });

                    const message =
                        `📅 *Rappel — Demain !*\n\n` +
                        `Bonjour ${supplier.contactName || supplier.name} 👋\n\n` +
                        `Petit rappel pour votre prestation de demain :\n\n` +
                        `🎨 *${booking.prestationName}*\n` +
                        `📅 *Date :* ${dateFormatted}\n` +
                        `⏰ *Horaire :* ${booking.startTime || '?'} - ${booking.endTime || '?'}\n` +
                        `💰 *Tarif :* ${booking.rate}€\n` +
                        `${booking.clientName ? `👤 *Client :* ${booking.clientName}\n` : ''}` +
                        `${booking.pickupLocation ? `📍 *Pick-up :* ${booking.pickupLocation}\n` : ''}` +
                        `${booking.numberOfGuests ? `👥 *Personnes :* ${booking.numberOfGuests}\n` : ''}` +
                        `\n✅ Merci de confirmer votre présence !\n` +
                        `_Luna CRM — À demain !_ 🌟`;

                    const sent = await sendWhatsApp(
                        supplier.phone, message, supplier.name, supplier.id, true, booking.prestationName
                    );
                    if (sent) {
                        await bookingDoc.ref.update({ reminderJ1Sent: true });
                        results.j1Sent++;
                    } else {
                        results.errors++;
                    }
                }

                // ═══ H-3 REMINDER (between 2.5h and 3.5h before) ═══
                if (hoursUntil >= 2.5 && hoursUntil <= 3.5 && !booking.reminderH3Sent) {
                    const message =
                        `⏰ *Rappel urgent — Dans 3 heures !*\n\n` +
                        `${supplier.contactName || supplier.name}, c'est bientôt l'heure ! 🚀\n\n` +
                        `🎨 *${booking.prestationName}*\n` +
                        `⏰ *Début :* ${booking.startTime || '?'}\n` +
                        `${booking.pickupLocation ? `📍 *Rendez-vous :* ${booking.pickupLocation}\n` : ''}` +
                        `${booking.clientName ? `👤 *Client :* ${booking.clientName}\n` : ''}` +
                        `${booking.numberOfGuests ? `👥 *${booking.numberOfGuests} personnes*\n` : ''}` +
                        `\n✅ Confirmez que vous êtes en route !\n` +
                        `_Luna CRM_ 🌟`;

                    const sent = await sendWhatsApp(
                        supplier.phone, message, supplier.name, supplier.id, true, booking.prestationName
                    );
                    if (sent) {
                        await bookingDoc.ref.update({ reminderH3Sent: true });
                        results.h3Sent++;
                    } else {
                        results.errors++;
                    }
                }

                // ═══ LATE CANCELLATION DETECTION ═══
                // If a CONFIRMED booking is within 1h and supplier just cancelled
                // (handled in webhook, but also check for stale confirmations)
                if (hoursUntil <= 1 && hoursUntil > -0.5 && booking.status === 'CONFIRMED') {
                    // Nothing to do here — handled by webhook when supplier cancels
                    // But we could add a "final check" message
                }
            }

            // ═══ CHECK FOR LATE CANCELLATIONS (CANCELLED_LATE status) ═══
            const lateCancelSnap = await adminDb
                .collection(`tenants/${tenantId}/supplier_bookings`)
                .where('status', '==', 'CANCELLED_LATE')
                .where('reassignedTo', '==', null)
                .get();

            for (const cancelDoc of lateCancelSnap.docs) {
                const cancelled = cancelDoc.data();
                const prestationDateTime = new Date(`${cancelled.date}T${cancelled.startTime || '09:00'}:00`);
                const hoursUntil = (prestationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                // Only auto-reassign if the prestation hasn't passed yet
                if (hoursUntil > 0) {
                    // Find available suppliers (exclude the one who cancelled)
                    const availableSuppliers = Array.from(suppliersMap.values())
                        .filter(s => s.id !== cancelled.supplierId && s.phone);

                    if (availableSuppliers.length > 0) {
                        // Broadcast to all available suppliers
                        for (const backupSup of availableSuppliers.slice(0, 3)) { // Max 3 broadcasts
                            const urgentMessage =
                                `🚨 *Mission urgente disponible !*\n\n` +
                                `Un prestataire a annulé, nous avons besoin de vous !\n\n` +
                                `🎨 *${cancelled.prestationName}*\n` +
                                `📅 *Aujourd'hui* — ${cancelled.startTime || '?'}\n` +
                                `💰 *${cancelled.rate}€*\n` +
                                `${cancelled.pickupLocation ? `📍 ${cancelled.pickupLocation}\n` : ''}` +
                                `\n⚡ Premier arrivé, premier servi !\n` +
                                `_Luna CRM — Urgent_ 🚨`;

                            await sendWhatsApp(
                                backupSup.phone, urgentMessage, backupSup.name, backupSup.id, true, cancelled.prestationName
                            );
                        }
                        results.lateCancellations++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            results,
        });
    } catch (error: any) {
        console.error('[CRON] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
