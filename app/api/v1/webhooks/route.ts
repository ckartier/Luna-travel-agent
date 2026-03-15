import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAPIKey, apiSuccess, apiError, apiHeaders } from '@/src/lib/apiKeyAuth';

/**
 * GET /api/v1/webhooks — List webhook subscriptions
 * POST /api/v1/webhooks — Register a webhook
 * DELETE /api/v1/webhooks — Remove a webhook by URL
 */

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: apiHeaders() });
}

export async function GET(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const doc = await adminDb
            .collection('tenants').doc(auth.tenantId)
            .collection('settings').doc('webhooks')
            .get();

        const hooks = doc.exists ? (doc.data()?.hooks || []) : [];
        return apiSuccess({ webhooks: hooks.map((h: any) => ({ url: h.url, events: h.events, active: h.active, name: h.name })) });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const body = await req.json();
        const { url, events, name } = body;

        if (!url || !url.startsWith('https://')) {
            return apiError('url is required and must use HTTPS');
        }

        const validEvents = [
            'quote.created', 'quote.accepted', 'quote.rejected',
            'invoice.created', 'invoice.paid',
            'trip.created', 'contact.created',
            'booking.confirmed', 'portal.viewed',
        ];

        const selectedEvents = (events || validEvents).filter((e: string) => validEvents.includes(e));
        if (selectedEvents.length === 0) {
            return apiError(`events must include at least one of: ${validEvents.join(', ')}`);
        }

        // Generate webhook secret
        const secret = 'whk_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const settingsRef = adminDb
            .collection('tenants').doc(auth.tenantId)
            .collection('settings').doc('webhooks');

        const doc = await settingsRef.get();
        const hooks = doc.exists ? (doc.data()?.hooks || []) : [];

        // Check for duplicate URL
        if (hooks.some((h: any) => h.url === url)) {
            return apiError('A webhook with this URL already exists');
        }

        hooks.push({
            url,
            events: selectedEvents,
            secret,
            active: true,
            name: name || 'Webhook',
            createdAt: new Date().toISOString(),
        });

        await settingsRef.set({ hooks }, { merge: true });

        return apiSuccess({ url, events: selectedEvents, secret, name: name || 'Webhook' }, 201);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const { url } = await req.json();
        if (!url) return apiError('url is required');

        const settingsRef = adminDb
            .collection('tenants').doc(auth.tenantId)
            .collection('settings').doc('webhooks');

        const doc = await settingsRef.get();
        if (!doc.exists) return apiError('No webhooks found', 404);

        const hooks = (doc.data()?.hooks || []).filter((h: any) => h.url !== url);
        await settingsRef.set({ hooks }, { merge: true });

        return apiSuccess({ deleted: url });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
