export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/calendar?from=2026-03-01&to=2026-04-01
 * 
 * Returns calendar events: trips, reminders, quote expiry, invoice due dates.
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
    const from = searchParams.get('from') || new Date().toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const [tripsSnap, remindersSnap, quotesSnap, invoicesSnap] = await Promise.all([
            tenantRef.collection('trips').get(),
            tenantRef.collection('reminders').where('completed', '==', false).get(),
            tenantRef.collection('quotes').get(),
            tenantRef.collection('invoices').get(),
        ]);

        interface CalendarEvent {
            id: string;
            type: 'trip-start' | 'trip-end' | 'reminder' | 'quote-expiry' | 'invoice-due';
            title: string;
            date: string;
            color: string;
            metadata: Record<string, any>;
        }

        const events: CalendarEvent[] = [];
        const inRange = (d: string) => d >= from && d <= to;

        // Trips
        tripsSnap.docs.forEach(d => {
            const t = d.data();
            if (t.startDate && inRange(t.startDate)) {
                events.push({
                    id: `trip-start-${d.id}`,
                    type: 'trip-start',
                    title: `🛫 ${t.destination || t.title} — ${t.clientName || ''}`,
                    date: t.startDate,
                    color: '#5a8fa3',
                    metadata: { tripId: d.id, status: t.status },
                });
            }
            if (t.endDate && inRange(t.endDate)) {
                events.push({
                    id: `trip-end-${d.id}`,
                    type: 'trip-end',
                    title: `🛬 Retour ${t.destination || t.title}`,
                    date: t.endDate,
                    color: '#7ab8cc',
                    metadata: { tripId: d.id, status: t.status },
                });
            }
        });

        // Reminders
        remindersSnap.docs.forEach(d => {
            const r = d.data();
            const dd = r.dueDate?.toDate?.()?.toISOString().split('T')[0];
            if (dd && inRange(dd)) {
                events.push({
                    id: `reminder-${d.id}`,
                    type: 'reminder',
                    title: `⏰ ${r.title}`,
                    date: dd,
                    color: r.priority === 'urgent' ? '#e74c3c' : r.priority === 'high' ? '#f39c12' : '#95a5a6',
                    metadata: { priority: r.priority },
                });
            }
        });

        // Quote expiry
        quotesSnap.docs.forEach(d => {
            const q = d.data();
            if (q.expiryDate && q.status !== 'ACCEPTED' && q.status !== 'CANCELLED') {
                const ed = typeof q.expiryDate === 'string' ? q.expiryDate : q.expiryDate?.toDate?.()?.toISOString().split('T')[0];
                if (ed && inRange(ed)) {
                    events.push({
                        id: `quote-exp-${d.id}`,
                        type: 'quote-expiry',
                        title: `📄 Devis expire — ${q.clientName || ''}`,
                        date: ed,
                        color: '#f39c12',
                        metadata: { quoteId: d.id, amount: q.totalAmount },
                    });
                }
            }
        });

        // Invoice due dates
        invoicesSnap.docs.forEach(d => {
            const inv = d.data();
            if (inv.dueDate && inv.status === 'SENT') {
                const dd = typeof inv.dueDate === 'string' ? inv.dueDate : inv.dueDate?.toDate?.()?.toISOString().split('T')[0];
                if (dd && inRange(dd)) {
                    events.push({
                        id: `invoice-due-${d.id}`,
                        type: 'invoice-due',
                        title: `💳 Facture échue — ${inv.clientName || ''}`,
                        date: dd,
                        color: '#e74c3c',
                        metadata: { invoiceId: d.id, amount: inv.totalAmount },
                    });
                }
            }
        });

        events.sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            events,
            total: events.length,
            range: { from, to },
        });
    } catch (error: any) {
        console.error('[Calendar] Error:', error);
        return NextResponse.json({ events: [], total: 0, range: { from, to } });
    }
}
