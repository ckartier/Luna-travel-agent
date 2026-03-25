export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '@/src/lib/gmail/api';
import { sendSupplierReminder } from '@/src/lib/whatsapp/api';

/**
 * GET /api/cron/workflows
 * Intended to be run daily via a Cron Job (e.g., Vercel Cron).
 * Scans for:
 * 1. Trips starting in 7 days -> Sends pre-departure email to client.
 * 2. Supplier bookings tomorrow -> Sends WhatsApp reminder to supplier.
 */
export async function GET(request: Request) {
    try {
        // Optional Sec: Check for a cron secret header if configured
        const authHeader = request.headers.get('Authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const j7Date = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
        const j1Date = new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0];

        const tenantsSnap = await adminDb.collection('tenants').get();
        let emailsSent = 0;
        let whatsappSent = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            const tenantRef = tenantDoc.ref;

            // ══════════════════════════════════════════
            // 1. Pre-departure Emails (J-7)
            // ══════════════════════════════════════════
            const tripsSnap = await tenantRef.collection('trips')
                .where('startDate', '==', j7Date)
                .get();

            for (const tripDoc of tripsSnap.docs) {
                const trip = tripDoc.data() as any;
                if (!trip.clientId) continue;

                // Check if we already sent the J-7 email
                const auditSnap = await tenantRef.collection('workflowAudit')
                    .where('tripId', '==', tripDoc.id)
                    .where('type', '==', 'pre_departure_j7')
                    .limit(1)
                    .get();
                if (!auditSnap.empty) continue;

                const clientDoc = await tenantRef.collection('contacts').doc(trip.clientId).get();
                const client = clientDoc.exists ? clientDoc.data() as any : null;
                
                if (client && client.email) {
                    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
                    const subject = `Préparation de votre voyage J-7 : ${trip.destination}`;
                    const bodyText = `Bonjour ${clientName},\n\nVotre départ pour ${trip.destination} approche à grands pas (J-7) !\n\nPensez à bien vérifier vos documents de voyage ainsi que vos pièces d'identité.\nToute l'équipe de votre conciergerie a finalisé les derniers détails pour que votre séjour soit parfait.\n\nEn cas de question, nous restons à votre entière disposition.\n\nBonne préparation !\nVotre Conciergerie.`;

                    try {
                        await sendEmail({
                            to: client.email,
                            subject,
                            bodyText
                        });

                        // Log email to messages
                        await tenantRef.collection('messages').add({
                            clientId: trip.clientId,
                            clientName,
                            channel: 'EMAIL',
                            direction: 'OUTBOUND',
                            recipientType: 'CLIENT',
                            content: `**${subject}**\n\n${bodyText}`,
                            isRead: true,
                            source: 'automated-workflow',
                            createdAt: FieldValue.serverTimestamp(),
                        });

                        // Mark as sent
                        await tenantRef.collection('workflowAudit').add({
                            type: 'pre_departure_j7',
                            tripId: tripDoc.id,
                            clientId: trip.clientId,
                            createdAt: FieldValue.serverTimestamp()
                        });

                        emailsSent++;
                    } catch (e) {
                        console.error(`[Cron Workflows] Failed to send J-7 email for trip ${tripDoc.id}`, e);
                    }
                }
            }

            // ══════════════════════════════════════════
            // 2. Supplier Reminders (J-1)
            // ══════════════════════════════════════════
            const bookingsSnap = await tenantRef.collection('supplierBookings')
                .where('date', '==', j1Date)
                .get();

            for (const bookingDoc of bookingsSnap.docs) {
                const booking = bookingDoc.data() as any;

                // Check if we already sent the J-1 WhatsApp
                const auditSnap = await tenantRef.collection('workflowAudit')
                    .where('bookingId', '==', bookingDoc.id)
                    .where('type', '==', 'supplier_reminder_j1')
                    .limit(1)
                    .get();
                if (!auditSnap.empty) continue;

                if (booking.supplierPhone) {
                    try {
                        await sendSupplierReminder({
                            supplierName: booking.supplierName || 'Partenaire',
                            supplierPhone: booking.supplierPhone,
                            prestationName: booking.prestationName || 'Prestation',
                            clientName: booking.clientName || 'Client Luna',
                            date: booking.date,
                            startTime: booking.startTime,
                            type: 'J-1',
                        });

                        // Mark as sent
                        await tenantRef.collection('workflowAudit').add({
                            type: 'supplier_reminder_j1',
                            bookingId: bookingDoc.id,
                            supplierId: booking.supplierId,
                            createdAt: FieldValue.serverTimestamp()
                        });

                        whatsappSent++;
                    } catch (e) {
                        console.error(`[Cron Workflows] Failed to send J-1 WhatsApp for booking ${bookingDoc.id}`, e);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            summary: `Cron Job executed successfully. Emails sent: ${emailsSent}, WhatsApp sent: ${whatsappSent}`
        });

    } catch (error: any) {
        console.error('[Cron Workflows API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
