import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/report?period=month|quarter|year
 * 
 * Aggregated KPIs report for the authenticated tenant.
 * Revenue, conversion rates, top clients, trip stats.
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
    const period = searchParams.get('period') || 'month';
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
        case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default: // month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Parallel queries
        const [contactsSnap, tripsSnap, quotesSnap, invoicesSnap, leadsSnap] = await Promise.all([
            tenantRef.collection('contacts').get(),
            tenantRef.collection('trips').get(),
            tenantRef.collection('quotes').get(),
            tenantRef.collection('invoices').get(),
            tenantRef.collection('leads').get(),
        ]);

        // Filter by period
        const inPeriod = (d: any) => {
            const ts = d.createdAt?.toDate?.() || new Date(d.createdAt || 0);
            return ts >= startDate;
        };

        const allTrips = tripsSnap.docs.map(d => d.data());
        const allQuotes = quotesSnap.docs.map(d => d.data());
        const allInvoices = invoicesSnap.docs.map(d => d.data());
        const allLeads = leadsSnap.docs.map(d => d.data());

        const periodTrips = allTrips.filter(inPeriod);
        const periodQuotes = allQuotes.filter(inPeriod);
        const periodInvoices = allInvoices.filter(inPeriod);
        const periodLeads = allLeads.filter(inPeriod);

        // Revenue calculation
        const totalRevenue = allInvoices
            .filter(i => i.status !== 'CANCELLED')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

        const periodRevenue = periodInvoices
            .filter(i => i.status !== 'CANCELLED')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

        const paidRevenue = allInvoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

        // Conversion rate: leads WON / total leads
        const wonLeads = allLeads.filter(l => l.status === 'WON').length;
        const conversionRate = allLeads.length > 0 ? Math.round((wonLeads / allLeads.length) * 100) : 0;

        // Top clients by revenue
        const clientRevMap: Record<string, number> = {};
        allInvoices.forEach(inv => {
            if (inv.clientName && inv.status !== 'CANCELLED') {
                clientRevMap[inv.clientName] = (clientRevMap[inv.clientName] || 0) + (inv.totalAmount || 0);
            }
        });
        const topClients = Object.entries(clientRevMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, revenue]) => ({ name, revenue }));

        // Trip status distribution
        const statusDist: Record<string, number> = {};
        allTrips.forEach(t => {
            statusDist[t.status] = (statusDist[t.status] || 0) + 1;
        });

        // Average trip value
        const tripsWithAmount = allTrips.filter(t => t.amount > 0);
        const avgTripValue = tripsWithAmount.length > 0
            ? Math.round(tripsWithAmount.reduce((s, t) => s + t.amount, 0) / tripsWithAmount.length)
            : 0;

        // Monthly revenue trend (last 6 months)
        const monthlyRevenue: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const mRev = allInvoices
                .filter(inv => {
                    const ts = inv.createdAt?.toDate?.() || new Date(inv.createdAt || 0);
                    return ts >= m && ts <= mEnd && inv.status !== 'CANCELLED';
                })
                .reduce((s, inv) => s + (inv.totalAmount || 0), 0);
            monthlyRevenue.push({
                month: m.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                revenue: mRev,
            });
        }

        return NextResponse.json({
            period,
            generatedAt: now.toISOString(),
            totals: {
                contacts: contactsSnap.size,
                trips: tripsSnap.size,
                quotes: quotesSnap.size,
                invoices: invoicesSnap.size,
                leads: leadsSnap.size,
            },
            periodStats: {
                newTrips: periodTrips.length,
                newQuotes: periodQuotes.length,
                newInvoices: periodInvoices.length,
                newLeads: periodLeads.length,
                periodRevenue,
            },
            revenue: {
                total: totalRevenue,
                paid: paidRevenue,
                outstanding: totalRevenue - paidRevenue,
                avgTripValue,
            },
            conversionRate,
            topClients,
            tripStatusDistribution: statusDist,
            monthlyRevenue,
        });
    } catch (error: any) {
        console.error('[Report] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
