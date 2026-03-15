/**
 * WhatsApp Cloud API (Meta) — Send messages to suppliers
 * Uses the WhatsApp Business Platform Cloud API
 * 
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_API = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`;

export interface WhatsAppMessage {
    to: string; // Phone number in international format: +33612345678
    text: string;
}

/**
 * Normalize phone number to WhatsApp format (no +, no spaces, no dashes)
 */
function normalizePhone(phone: string): string {
    let clean = phone.replace(/[\s\-\(\)\.]/g, '');
    // Remove leading +
    if (clean.startsWith('+')) clean = clean.substring(1);
    // French numbers: 06... → 336...
    if (clean.startsWith('0') && clean.length === 10) {
        clean = '33' + clean.substring(1);
    }
    return clean;
}

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage({ to, text }: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        console.warn('[WhatsApp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID — message not sent');
        return { success: false, error: 'WhatsApp not configured' };
    }

    const phone = normalizePhone(to);

    try {
        const res = await fetch(WHATSAPP_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('[WhatsApp] API error:', JSON.stringify(data));
            return { success: false, error: data.error?.message || 'WhatsApp API error' };
        }

        const messageId = data.messages?.[0]?.id;
        console.log(`[WhatsApp] ✅ Message sent to ${phone} — ID: ${messageId}`);
        return { success: true, messageId };
    } catch (err: any) {
        console.error('[WhatsApp] Send error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Send a booking notification to a supplier
 */
export async function notifySupplierBooking(params: {
    supplierName: string;
    supplierPhone: string;
    prestationName: string;
    clientName: string;
    date: string;
    numberOfGuests?: number;
    pickupLocation?: string;
    notes?: string;
}): Promise<{ success: boolean; error?: string }> {
    const { supplierName, supplierPhone, prestationName, clientName, date, numberOfGuests, pickupLocation, notes } = params;

    if (!supplierPhone) {
        console.warn(`[WhatsApp] No phone number for supplier "${supplierName}" — skipping notification`);
        return { success: false, error: 'No phone number' };
    }

    const message = [
        `🌙 *VOTRE CONCIERGERIE*`,
        ``,
        `Bonjour ${supplierName},`,
        ``,
        `Vous avez une nouvelle réservation confirmée :`,
        ``,
        `📋 *${prestationName}*`,
        `👤 Client : ${clientName}`,
        `📅 Date : ${date}`,
        numberOfGuests ? `👥 Nombre de personnes : ${numberOfGuests}` : null,
        pickupLocation ? `📍 Lieu : ${pickupLocation}` : null,
        notes ? `💬 Notes : ${notes}` : null,
        ``,
        `Merci de confirmer votre disponibilité en répondant à ce message.`,
        ``,
        `— Votre Conciergerie 🌙`,
    ].filter(Boolean).join('\n');

    return sendWhatsAppMessage({ to: supplierPhone, text: message });
}

/**
 * Send a booking reminder to a supplier (J-1 or H-3)
 */
export async function sendSupplierReminder(params: {
    supplierName: string;
    supplierPhone: string;
    prestationName: string;
    clientName: string;
    date: string;
    startTime?: string;
    type: 'J-1' | 'H-3';
}): Promise<{ success: boolean; error?: string }> {
    const { supplierName, supplierPhone, prestationName, clientName, date, startTime, type } = params;

    if (!supplierPhone) {
        return { success: false, error: 'No phone number' };
    }

    const timeInfo = startTime ? ` à ${startTime}` : '';
    const urgency = type === 'H-3' ? '⚡' : '📆';

    const message = [
        `${urgency} *RAPPEL — ${type}*`,
        ``,
        `Bonjour ${supplierName},`,
        ``,
        type === 'J-1'
            ? `Rappel : vous avez une prestation demain.`
            : `Rappel : votre prestation est dans 3 heures.`,
        ``,
        `📋 *${prestationName}*`,
        `👤 Client : ${clientName}`,
        `📅 ${date}${timeInfo}`,
        ``,
        type === 'H-3'
            ? `Merci de confirmer que tout est prêt en répondant ✅`
            : `Bonne préparation ! À demain.`,
        ``,
        `— Votre Conciergerie 🌙`,
    ].join('\n');

    return sendWhatsAppMessage({ to: supplierPhone, text: message });
}
