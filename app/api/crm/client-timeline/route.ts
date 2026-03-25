export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/client-timeline?contactId=xxx
 * 
 * Returns a complete chronological timeline of all interactions
 * with a specific client: trips, quotes, invoices, payments, activity.
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');
    if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Get contact
        const contactSnap = await tenantRef.collection('contacts').doc(contactId).get();
        if (!contactSnap.exists) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        const contact = contactSnap.data()!;
        const clientName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

        // Parallel: get all related data
        const [tripsSnap, quotesSnap, invoicesSnap, feedbackSnap, activitySnap] = await Promise.all([
            tenantRef.collection('trips').where('clientName', '==', clientName).get(),
            tenantRef.collection('quotes').where('clientName', '==', clientName).get(),
            tenantRef.collection('invoices').where('clientName', '==', clientName).get(),
            tenantRef.collection('feedback').where('clientName', '==', clientName).get(),
            tenantRef.collection('activity_log').where('entityId', '==', contactId).limit(20).get(),
        ]);

        interface TimelineEvent {
            type: string;
            title: string;
            description: string;
            timestamp: string;
            metadata: Record<string, any>;
        }

        const events: TimelineEvent[] = [];

        // Contact creation
        if (contact.createdAt) {
            events.push({
                type: 'contact',
                title: 'Contact créé',
                description: clientName,
                timestamp: contact.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                metadata: { contactId },
            });
        }

        // Trips
        tripsSnap.docs.forEach(d => {
            const t = d.data();
            events.push({
                type: 'trip',
                title: `Voyage: ${t.destination || 'Sans destination'}`,
                description: `${t.travelers || 0} voyageurs · ${t.status || 'DRAFT'}`,
                timestamp: t.createdAt?.toDate?.()?.toISOString() || '',
                metadata: { tripId: d.id, amount: t.amount, status: t.status },
            });
        });

        // Quotes
        quotesSnap.docs.forEach(d => {
            const q = d.data();
            events.push({
                type: 'quote',
                title: `Devis ${q.quoteNumber || d.id.slice(0, 6)}`,
                description: `${q.totalAmount || 0}€ · ${q.status || 'DRAFT'}`,
                timestamp: q.createdAt?.toDate?.()?.toISOString() || '',
                metadata: { quoteId: d.id, amount: q.totalAmount, status: q.status },
            });
        });

        // Invoices
        invoicesSnap.docs.forEach(d => {
            const inv = d.data();
            events.push({
                type: 'invoice',
                title: `Facture ${inv.invoiceNumber || d.id.slice(0, 6)}`,
                description: `${inv.totalAmount || 0}€ · ${inv.status || 'DRAFT'}`,
                timestamp: inv.createdAt?.toDate?.()?.toISOString() || '',
                metadata: { invoiceId: d.id, amount: inv.totalAmount, status: inv.status },
            });
        });

        // Feedback
        feedbackSnap.docs.forEach(d => {
            const f = d.data();
            if (f.npsScore !== undefined) {
                events.push({
                    type: 'feedback',
                    title: `NPS: ${f.npsScore}/10`,
                    description: f.comment || 'Pas de commentaire',
                    timestamp: f.respondedAt?.toDate?.()?.toISOString() || f.createdAt?.toDate?.()?.toISOString() || '',
                    metadata: { feedbackId: d.id, npsScore: f.npsScore },
                });
            }
        });

        // Activity
        activitySnap.docs.forEach(d => {
            const a = d.data();
            events.push({
                type: 'activity',
                title: a.action || 'Action',
                description: a.userName || 'Système',
                timestamp: a.timestamp?.toDate?.()?.toISOString() || '',
                metadata: a.metadata || {},
            });
        });

        // Sort by timestamp descending
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Client summary
        const totalSpent = invoicesSnap.docs
            .filter(d => d.data().status === 'PAID')
            .reduce((s, d) => s + (d.data().totalAmount || 0), 0);

        return NextResponse.json({
            contact: { id: contactId, name: clientName, ...contact },
            timeline: events,
            summary: {
                totalTrips: tripsSnap.size,
                totalQuotes: quotesSnap.size,
                totalInvoices: invoicesSnap.size,
                totalSpent,
                totalEvents: events.length,
            },
        });
    } catch (error: any) {
        console.error('[Client Timeline] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
