import { adminDb } from '@/src/lib/firebase/admin';

/**
 * Webhook System
 * 
 * Allows tenants to register webhook URLs that receive POST notifications
 * when events occur (quote.accepted, invoice.paid, trip.created, etc.)
 * 
 * Webhooks are stored in: tenants/{tenantId}/settings/webhooks
 * Format: { hooks: [{ url: "https://...", events: ["quote.accepted", "invoice.paid"], secret: "whk_xxx", active: true }] }
 */

export type WebhookEvent =
    | 'quote.created'
    | 'quote.accepted'
    | 'quote.rejected'
    | 'invoice.created'
    | 'invoice.paid'
    | 'trip.created'
    | 'contact.created'
    | 'booking.confirmed'
    | 'portal.viewed';

interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: any;
}

interface WebhookConfig {
    url: string;
    events: WebhookEvent[];
    secret: string;
    active: boolean;
    name?: string;
}

/**
 * Fire a webhook event for a given tenant
 */
export async function fireWebhook(tenantId: string, event: WebhookEvent, data: any): Promise<void> {
    try {
        const webhookDoc = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('settings').doc('webhooks')
            .get();

        if (!webhookDoc.exists) return;

        const hooks: WebhookConfig[] = webhookDoc.data()?.hooks || [];
        const activeHooks = hooks.filter(h => h.active && h.events.includes(event));

        if (activeHooks.length === 0) return;

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };

        const promises = activeHooks.map(async (hook) => {
            try {
                // Generate HMAC signature
                const signature = await generateSignature(JSON.stringify(payload), hook.secret);

                const response = await fetch(hook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Event': event,
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Timestamp': payload.timestamp,
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000), // 10s timeout
                });

                // Log delivery
                await adminDb
                    .collection('tenants').doc(tenantId)
                    .collection('webhook_logs').add({
                        event,
                        url: hook.url,
                        status: response.status,
                        success: response.ok,
                        timestamp: new Date(),
                    });
            } catch (error: any) {
                // Log failure
                await adminDb
                    .collection('tenants').doc(tenantId)
                    .collection('webhook_logs').add({
                        event,
                        url: hook.url,
                        status: 0,
                        success: false,
                        error: error.message,
                        timestamp: new Date(),
                    });
            }
        });

        await Promise.allSettled(promises);
    } catch (error) {
        console.error(`[Webhook] Error firing ${event}:`, error);
    }
}

/**
 * Generate HMAC-SHA256 signature
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verify incoming webhook signature (for consumers)
 */
export async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const expected = await generateSignature(payload, secret);
    return expected === signature;
}
