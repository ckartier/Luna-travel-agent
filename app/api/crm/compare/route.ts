export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/compare?periodA=2026-01&periodB=2026-02
 * GET /api/crm/compare?periodA=2025&periodB=2026
 * 
 * Compare KPIs between two periods (month or year).
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
    const periodA = searchParams.get('periodA');
    const periodB = searchParams.get('periodB');

    if (!periodA || !periodB) {
        return NextResponse.json({ error: 'periodA and periodB required (YYYY-MM or YYYY)' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const [contactsSnap, tripsSnap, invoicesSnap, leadsSnap] = await Promise.all([
            tenantRef.collection('contacts').get(),
            tenantRef.collection('trips').get(),
            tenantRef.collection('invoices').get(),
            tenantRef.collection('leads').get(),
        ]);

        function getRange(period: string): { start: Date; end: Date } {
            if (period.length === 7) { // YYYY-MM
                const [y, m] = period.split('-').map(Number);
                return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) };
            }
            const y = parseInt(period);
            return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) };
        }

        function getMetrics(range: { start: Date; end: Date }) {
            const inRange = (doc: any) => {
                const ts = doc.createdAt?.toDate?.() || new Date(0);
                return ts >= range.start && ts <= range.end;
            };

            const contacts = contactsSnap.docs.filter(d => inRange(d.data())).length;
            const trips = tripsSnap.docs.filter(d => inRange(d.data())).length;
            const leads = leadsSnap.docs.filter(d => inRange(d.data())).length;
            const wonLeads = leadsSnap.docs.filter(d => inRange(d.data()) && d.data().status === 'WON').length;

            const periodInvoices = invoicesSnap.docs.filter(d => inRange(d.data()));
            const revenue = periodInvoices.reduce((s, d) => {
                const inv = d.data();
                return s + (inv.status !== 'CANCELLED' ? (inv.totalAmount || 0) : 0);
            }, 0);
            const paid = periodInvoices.reduce((s, d) => {
                const inv = d.data();
                return s + (inv.status === 'PAID' ? (inv.totalAmount || 0) : 0);
            }, 0);

            return { contacts, trips, leads, wonLeads, revenue, paid, invoices: periodInvoices.length };
        }

        const rangeA = getRange(periodA);
        const rangeB = getRange(periodB);
        const metricsA = getMetrics(rangeA);
        const metricsB = getMetrics(rangeB);

        // Calculate deltas
        function delta(a: number, b: number) {
            if (a === 0 && b === 0) return { value: 0, percent: 0 };
            if (a === 0) return { value: b, percent: 100 };
            return { value: b - a, percent: Math.round(((b - a) / a) * 100) };
        }

        return NextResponse.json({
            periodA: { label: periodA, ...metricsA },
            periodB: { label: periodB, ...metricsB },
            deltas: {
                contacts: delta(metricsA.contacts, metricsB.contacts),
                trips: delta(metricsA.trips, metricsB.trips),
                leads: delta(metricsA.leads, metricsB.leads),
                revenue: delta(metricsA.revenue, metricsB.revenue),
                paid: delta(metricsA.paid, metricsB.paid),
                invoices: delta(metricsA.invoices, metricsB.invoices),
            },
        });
    } catch (error: any) {
        console.error('[Compare] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
