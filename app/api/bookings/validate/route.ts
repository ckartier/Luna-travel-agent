import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/**
 * POST /api/bookings/validate
 * Called from CRM planning when user manually validates a supplier booking.
 * Automatically sends a WhatsApp confirmation to the supplier.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { bookingId, tenantId } = await request.json();

        if (!bookingId || !tenantId) {
            return NextResponse.json({ error: 'bookingId and tenantId required' }, { status: 400 });
        }

        // 1. Find the booking in supplier_bookings
        const bookingRef = adminDb
            .collection('tenants').doc(tenantId)
            .collection('supplier_bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookingSnap.data()!;

        // 2. Update status to CONFIRMED
        await bookingRef.update({
            status: 'CONFIRMED',
            validatedByLuna: true,
            validatedAt: new Date(),
            validatedBy: auth.uid,
            updatedAt: new Date(),
        });

        // 3. Find the linked supplier to get their phone
        let supplier: any = null;
        if (booking.supplierId) {
            const supplierRef = adminDb
                .collection('tenants').doc(tenantId)
                .collection('suppliers').doc(booking.supplierId);
            const supplierSnap = await supplierRef.get();
            if (supplierSnap.exists) {
                supplier = { id: supplierSnap.id, ...supplierSnap.data() };
            }
        }

        // 4. Send WhatsApp confirmation if supplier has phone
        let whatsappStatus = 'no_phone';
        if (supplier?.phone) {
            const token = process.env.WHATSAPP_TOKEN;
            const phoneId = process.env.WHATSAPP_PHONE_ID;

            if (token && phoneId) {
                let normalizedPhone = supplier.phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
                if (normalizedPhone.startsWith('0')) normalizedPhone = '33' + normalizedPhone.slice(1);

                const supplierName = supplier.contactName || supplier.name || 'Partenaire';

                // Format date
                const dateObj = new Date(booking.date);
                const dateStr = dateObj.toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                });
                const horaire = booking.startTime
                    ? `${booking.startTime}${booking.endTime ? ' - ' + booking.endTime : ''}`
                    : 'À confirmer';

                const confirmMessage =
                    `✅ *Luna a validé votre prestation !* 🎉\n\n` +
                    `Bonjour ${supplierName},\n\n` +
                    `Votre prestation a été officiellement *confirmée et validée* par Luna ✨\n\n` +
                    `📋 *Récapitulatif Final :*\n` +
                    `🎨 *Prestation :* ${booking.prestationName || 'Service'}\n` +
                    `📅 *Date :* ${dateStr}\n` +
                    `⏰ *Horaire :* ${horaire}\n` +
                    `💰 *Tarif :* ${(booking.rate || 0).toLocaleString('fr-FR')} €\n` +
                    `${booking.clientName ? `👤 *Client :* ${booking.clientName}\n` : ''}` +
                    `\n📌 *Statut :* ✅ CONFIRMÉ\n\n` +
                    `🙏 Merci pour votre collaboration. Nous comptons sur vous !\n` +
                    `_Luna Travel CRM — On fait le bonheur ensemble 💫_`;

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
                    whatsappStatus = res.ok ? 'sent' : 'failed';

                    // Save to CRM messages
                    await adminDb.collection('tenants').doc(tenantId).collection('messages').add({
                        clientId: supplier.id,
                        clientName: supplier.name,
                        channel: 'WHATSAPP',
                        direction: 'OUTBOUND',
                        recipientType: 'SUPPLIER',
                        content: confirmMessage,
                        senderId: auth.uid,
                        isRead: true,
                        deliveryStatus: whatsappStatus,
                        externalMessageId: data.messages?.[0]?.id || null,
                        bookingId,
                        isLunaValidation: true,
                        createdAt: new Date(),
                    });

                    console.log(`[Luna Validate] ${whatsappStatus === 'sent' ? '✅' : '❌'} WhatsApp sent to ${supplierName} for "${booking.prestationName}"`);
                } catch (err: any) {
                    whatsappStatus = 'error';
                    console.error('[Luna Validate] WhatsApp send error:', err.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            bookingId,
            status: 'CONFIRMED',
            whatsappStatus,
            supplierName: supplier?.name || 'N/A',
        });
    } catch (error: any) {
        console.error('[Luna Validate] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
