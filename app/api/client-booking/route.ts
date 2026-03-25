export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { getBusinessName } from '@/src/lib/firebase/getBusinessName';

/**
 * API: Client Prestation Request
 * 
 * Called from the public site when a client selects a prestation.
 * 1. Creates a booking in supplier_bookings with status PENDING
 * 2. Finds the assigned supplier for the prestation
 * 3. Sends a WhatsApp to the supplier with interactive ✅/❌ buttons
 * 4. Auto-retry is handled by /api/cron/supplier-retry every 30 min
 * 
 * No auth required (public-facing endpoint).
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            prestationId,
            clientName,
            clientEmail,
            clientPhone,
            clientMessage,
            date,
            time,
            numberOfGuests,
            pickupLocation,
        } = body;

        if (!prestationId || !clientName || !clientEmail) {
            return NextResponse.json({
                error: 'prestationId, clientName, et clientEmail sont requis',
            }, { status: 400 });
        }

        // ── Find the prestation and its assigned supplier ──
        const tenantsSnap = await adminDb.collection('tenants').get();
        let foundPrestation: any = null;
        let foundSupplier: any = null;
        let tenantId: string = '';

        for (const tenantDoc of tenantsSnap.docs) {
            const prestationDoc = await adminDb
                .collection(`tenants/${tenantDoc.id}/prestations`)
                .doc(prestationId)
                .get();

            if (prestationDoc.exists) {
                foundPrestation = { id: prestationDoc.id, ...prestationDoc.data() };
                tenantId = tenantDoc.id;

                // Find the linked supplier
                if (foundPrestation.supplierId) {
                    const supplierDoc = await adminDb
                        .collection(`tenants/${tenantDoc.id}/suppliers`)
                        .doc(foundPrestation.supplierId)
                        .get();
                    if (supplierDoc.exists) {
                        foundSupplier = { id: supplierDoc.id, ...supplierDoc.data() };
                    }
                }
                break;
            }
        }

        if (!foundPrestation) {
            return NextResponse.json({ error: 'Prestation non trouvée' }, { status: 404 });
        }

        // ── Create the booking in supplier_bookings ──
        const bookingData = {
            prestationId,
            prestationName: foundPrestation.name || 'Prestation',
            supplierId: foundSupplier?.id || null,
            supplierName: foundSupplier?.name || 'Non assigné',
            clientName,
            clientEmail,
            clientPhone: clientPhone || '',
            clientMessage: clientMessage || '',
            date: date || new Date().toISOString().slice(0, 10),
            startTime: time || '09:00',
            endTime: '',
            rate: foundPrestation.prixVente || foundPrestation.price || 0,
            costPrice: foundPrestation.prixAchat || foundPrestation.costPrice || 0,
            numberOfGuests: numberOfGuests || 1,
            pickupLocation: pickupLocation || foundPrestation.location || '',
            status: 'PENDING',
            source: 'WEBSITE', // From the public site
            retryCount: 0,
            lastRetryAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const bookingRef = await adminDb
            .collection(`tenants/${tenantId}/supplier_bookings`)
            .add(bookingData);

        const bookingId = bookingRef.id;

        // ── Save client as a contact (if not exists) ──
        const existingContact = await adminDb
            .collection(`tenants/${tenantId}/contacts`)
            .where('email', '==', clientEmail)
            .limit(1)
            .get();

        let contactId = '';
        if (existingContact.empty) {
            const contactRef = await adminDb
                .collection(`tenants/${tenantId}/contacts`)
                .add({
                    name: clientName,
                    email: clientEmail,
                    phone: clientPhone || '',
                    source: 'WEBSITE',
                    tags: ['prospect', 'website'],
                    status: 'prospect',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            contactId = contactRef.id;
        } else {
            contactId = existingContact.docs[0].id;
        }

        // Update booking with contactId
        await bookingRef.update({ contactId });

        // ── Send WhatsApp to the assigned supplier ──
        let whatsappResult = { sent: false, message: '' };

        if (foundSupplier?.phone) {
            const token = process.env.WHATSAPP_TOKEN;
            const phoneId = process.env.WHATSAPP_PHONE_ID;

            if (token && phoneId) {
                let normalizedPhone = foundSupplier.phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
                if (normalizedPhone.startsWith('0')) normalizedPhone = '33' + normalizedPhone.slice(1);

                const dateFormatted = date
                    ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'À définir';

                const bizName = await getBusinessName(tenantId);
                const supplierMessage =
                    `🌟 *Nouvelle demande client !*\n\n` +
                    `Bonjour ${foundSupplier.contactName || foundSupplier.name} 👋\n\n` +
                    `Un client vient de réserver une prestation :\n\n` +
                    `🎨 *${foundPrestation.name}*\n` +
                    `📅 *Date :* ${dateFormatted}\n` +
                    `⏰ *Horaire :* ${time || 'À confirmer'}\n` +
                    `💰 *Tarif :* ${bookingData.rate}€\n` +
                    `👤 *Client :* ${clientName}\n` +
                    `${clientPhone ? `📞 *Tel :* ${clientPhone}\n` : ''}` +
                    `${pickupLocation ? `📍 *Lieu :* ${pickupLocation}\n` : ''}` +
                    `${numberOfGuests ? `👥 *Personnes :* ${numberOfGuests}\n` : ''}` +
                    `${clientMessage ? `\n💬 *Message du client :* "${clientMessage}"\n` : ''}` +
                    `\n✅ Merci de confirmer votre disponibilité !\n` +
                    `_${bizName} — Demande depuis le site_ ✨`;

                try {
                    // Send template first to open conversation window
                    await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
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

                    // Send interactive message with buttons
                    const messageBody = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: normalizedPhone,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            header: { type: 'text', text: `🌟 ${bizName} — Nouvelle demande` },
                            body: { text: supplierMessage },
                            footer: { text: 'Confirmez votre disponibilité' },
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

                    // Save to messages
                    await adminDb.collection(`tenants/${tenantId}/messages`).add({
                        clientId: foundSupplier.id,
                        clientName: foundSupplier.name,
                        channel: 'WHATSAPP',
                        direction: 'OUTBOUND',
                        recipientType: 'SUPPLIER',
                        content: supplierMessage,
                        senderId: 'SYSTEM_WEBSITE',
                        isRead: true,
                        deliveryStatus: res.ok ? 'sent' : 'failed',
                        externalMessageId: data.messages?.[0]?.id || null,
                        hasInteractiveButtons: true,
                        bookingId,
                        prestationName: foundPrestation.name,
                        source: 'WEBSITE',
                        createdAt: new Date(),
                    });

                    whatsappResult = {
                        sent: res.ok,
                        message: res.ok
                            ? `WhatsApp envoyé à ${foundSupplier.name}`
                            : `Erreur WhatsApp: ${data.error?.message || 'Échec envoi'}`,
                    };
                } catch (sendErr: any) {
                    whatsappResult = { sent: false, message: sendErr.message };
                    console.error('[Client Booking] WhatsApp error:', sendErr);
                }
            } else {
                whatsappResult = { sent: false, message: 'WhatsApp API non configurée' };
            }
        } else {
            whatsappResult = { sent: false, message: 'Aucun prestataire assigné ou pas de téléphone' };
        }

        // ── Create an activity log ──
        await adminDb.collection(`tenants/${tenantId}/activities`).add({
            type: 'booking_request',
            title: `Nouvelle demande depuis le site`,
            description: `${clientName} a demandé "${foundPrestation.name}" pour le ${date || 'date à définir'}`,
            metadata: { bookingId, prestationId, clientName, clientEmail, supplierName: foundSupplier?.name },
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            bookingId,
            prestation: foundPrestation.name,
            supplier: foundSupplier?.name || 'Non assigné',
            whatsapp: whatsappResult,
            message: 'Votre demande a été enregistrée. Le prestataire sera notifié par WhatsApp.',
        });
    } catch (error: any) {
        console.error('[Client Booking] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
