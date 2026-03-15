import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/forecast?months=6
 * 
 * Revenue forecast based on confirmed trips and pipeline.
 * Returns expected revenue per month with confidence levels.
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
    const months = Math.min(parseInt(searchParams.get('months') || '6'), 12);

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const [tripsSnap, leadsSnap, invoicesSnap] = await Promise.all([
            tenantRef.collection('trips').get(),
            tenantRef.collection('leads').get(),
            tenantRef.collection('invoices').get(),
        ]);

        const now = new Date();
        const forecast: { month: string; confirmed: number; probable: number; potential: number; total: number }[] = [];

        for (let i = 0; i < months; i++) {
            const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const mEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
            const monthLabel = m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

            // Confirmed trips with start date in this month
            let confirmed = 0;
            let probable = 0;
            let potential = 0;

            tripsSnap.docs.forEach(d => {
                const t = d.data();
                const start = t.startDate ? new Date(t.startDate) : null;
                if (!start || start < m || start > mEnd) return;

                const amount = t.amount || 0;
                if (t.status === 'CONFIRMED') confirmed += amount;
                else if (t.status === 'DRAFT') probable += amount * 0.5;
            });

            // Pipeline leads expected to close this month
            leadsSnap.docs.forEach(d => {
                const l = d.data();
                const closeDate = l.expectedCloseDate ? new Date(l.expectedCloseDate) : null;
                if (!closeDate || closeDate < m || closeDate > mEnd) return;

                const amount = l.dealValue || 0;
                if (l.status === 'NEGOTIATION') probable += amount * 0.6;
                else if (l.status === 'QUALIFICATION') potential += amount * 0.3;
                else if (l.status === 'DISCOVERY') potential += amount * 0.1;
            });

            forecast.push({
                month: monthLabel,
                confirmed: Math.round(confirmed),
                probable: Math.round(probable),
                potential: Math.round(potential),
                total: Math.round(confirmed + probable + potential),
            });
        }

        // Historical average for comparison
        const pastInvoices = invoicesSnap.docs.map(d => d.data()).filter(i => i.status !== 'CANCELLED');
        const totalPastRevenue = pastInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
        const monthsActive = Math.max(1, new Set(
            pastInvoices.map(i => {
                const ts = i.createdAt?.toDate?.() || new Date();
                return `${ts.getFullYear()}-${ts.getMonth()}`;
            })
        ).size);
        const avgMonthlyRevenue = Math.round(totalPastRevenue / monthsActive);

        return NextResponse.json({
            forecast,
            summary: {
                totalConfirmed: forecast.reduce((s, f) => s + f.confirmed, 0),
                totalProbable: forecast.reduce((s, f) => s + f.probable, 0),
                totalPotential: forecast.reduce((s, f) => s + f.potential, 0),
                grandTotal: forecast.reduce((s, f) => s + f.total, 0),
                avgMonthlyRevenue,
            },
        });
    } catch (error: any) {
        console.error('[Forecast] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
