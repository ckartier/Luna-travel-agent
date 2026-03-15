import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

/**
 * GET /api/portal/[token]
 * 
 * Public API — no Firebase auth required.
 * Access via unique share token (from shared-quotes collection).
 * Returns aggregated data: trip, quote, invoices, documents.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    // Rate limit
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const { token } = await params;
    if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    try {
        // 1. Find the shared quote by shareId to identify the tenant and client
        const sharedSnap = await adminDb.collectionGroup('shared-quotes')
            .where('shareId', '==', token)
            .limit(1)
            .get();

        if (sharedSnap.empty) {
            return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
        }

        const sharedDoc = sharedSnap.docs[0];
        const sharedData = sharedDoc.data();
        
        // Get tenantId from doc path: tenants/{tenantId}/shared-quotes/{docId}
        const tenantId = sharedDoc.ref.parent.parent?.id;
        if (!tenantId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // 2. Get tenant branding
        let branding = { name: '', logo: '', primaryColor: '#2E2E2E', accentColor: '#5a8fa3' };
        try {
            const configSnap = await tenantRef.collection('settings').doc('siteConfig').get();
            if (configSnap.exists) {
                const cfg = configSnap.data();
                branding = {
                    name: cfg?.global?.agencyName || '',
                    logo: cfg?.global?.logo || '',
                    primaryColor: cfg?.global?.primaryColor || '#2E2E2E',
                    accentColor: cfg?.global?.accentColor || '#5a8fa3',
                };
            }
        } catch { /* Use defaults */ }

        // Also try tenant doc for name
        if (!branding.name) {
            const tenantDoc = await tenantRef.get();
            if (tenantDoc.exists) {
                branding.name = tenantDoc.data()?.name || 'Conciergerie';
            }
        }

        // 3. Get the quote data
        const quoteId = sharedData.quoteId;
        let quote: any = null;
        if (quoteId) {
            const quoteSnap = await tenantRef.collection('quotes').doc(quoteId).get();
            if (quoteSnap.exists) {
                quote = { id: quoteSnap.id, ...quoteSnap.data() };
            }
        }

        // 4. Find related trip (by clientName or leadId)
        let trip = null;
        let days: any[] = [];
        let bookings: any[] = [];
        const clientName = sharedData.clientName || quote?.clientName;

        if (clientName) {
            // Find trip by client name
            const tripsSnap = await tenantRef.collection('trips')
                .where('clientName', '==', clientName)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (!tripsSnap.empty) {
                const tripDoc = tripsSnap.docs[0];
                trip = { id: tripDoc.id, ...tripDoc.data() };

                // Get days
                const daysSnap = await tenantRef.collection('trips').doc(tripDoc.id)
                    .collection('days')
                    .orderBy('dayIndex')
                    .get();
                days = daysSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Get day segments
                for (const day of days) {
                    const segsSnap = await tenantRef.collection('trips').doc(tripDoc.id)
                        .collection('days').doc(day.id)
                        .collection('segments')
                        .orderBy('order')
                        .get();
                    day.segments = segsSnap.docs.map(s => ({ id: s.id, ...s.data() }));
                }

                // Get bookings
                const bookingsSnap = await tenantRef.collection('trips').doc(tripDoc.id)
                    .collection('bookings')
                    .get();
                bookings = bookingsSnap.docs.map(b => ({ id: b.id, ...b.data() }));
            }
        }

        // 5. Find invoices for this client
        let invoices: any[] = [];
        if (clientName) {
            const invoicesSnap = await tenantRef.collection('invoices')
                .where('clientName', '==', clientName)
                .orderBy('createdAt', 'desc')
                .get();
            invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // 6. Get scheduled messages for the trip
        let scheduledMessages: any[] = [];
        if (trip) {
            try {
                const msgsSnap = await tenantRef.collection('trips').doc(trip.id)
                    .collection('scheduled-messages')
                    .orderBy('scheduledDate')
                    .get();
                scheduledMessages = msgsSnap.docs.map(m => ({ id: m.id, ...m.data() }));
            } catch { /* No scheduled messages */ }
        }

        return NextResponse.json({
            branding,
            clientName,
            trip,
            days,
            bookings,
            quote: quote ? {
                id: quote.id,
                quoteNumber: quote.quoteNumber || sharedData.quoteNumber,
                items: quote.items || sharedData.items || [],
                subtotal: quote.subtotal || sharedData.subtotal || 0,
                taxTotal: quote.taxTotal || sharedData.taxTotal || 0,
                totalAmount: quote.totalAmount || sharedData.totalAmount || 0,
                currency: quote.currency || sharedData.currency || 'EUR',
                status: quote.status || sharedData.status || 'SENT',
                issueDate: quote.issueDate || sharedData.issueDate,
                validUntil: quote.validUntil || sharedData.validUntil,
            } : null,
            invoices,
            scheduledMessages,
            shareId: token,
        });
    } catch (error: any) {
        console.error('[Portal API] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * POST /api/portal/[token]
 * Handle client actions: accept quote, request changes, signature
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const { token } = await params;
    const body = await req.json();
    const { action, message, signatureName } = body;

    try {
        const sharedSnap = await adminDb.collectionGroup('shared-quotes')
            .where('shareId', '==', token)
            .limit(1)
            .get();

        if (sharedSnap.empty) {
            return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
        }

        const sharedDoc = sharedSnap.docs[0];
        const tenantId = sharedDoc.ref.parent.parent?.id;
        if (!tenantId) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

        if (action === 'ACCEPT_QUOTE') {
            // Update shared quote status
            await sharedDoc.ref.update({
                status: 'ACCEPTED',
                acceptedAt: new Date(),
                signatureName: signatureName || '',
            });

            // Also update the source quote if it exists
            const quoteId = sharedDoc.data().quoteId;
            if (quoteId) {
                await adminDb.collection('tenants').doc(tenantId)
                    .collection('quotes').doc(quoteId)
                    .update({ status: 'ACCEPTED', acceptedAt: new Date() });
            }

            return NextResponse.json({ success: true, status: 'ACCEPTED' });
        }

        if (action === 'REQUEST_CHANGES') {
            await sharedDoc.ref.update({
                status: 'CHANGES_REQUESTED',
                changesMessage: message || '',
                changesRequestedAt: new Date(),
            });

            return NextResponse.json({ success: true, status: 'CHANGES_REQUESTED' });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        console.error('[Portal API POST] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
