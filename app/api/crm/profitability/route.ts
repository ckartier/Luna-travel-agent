export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/profitability?tripId=xxx  (single trip)
 * GET /api/crm/profitability              (all trips summary)
 * 
 * Trip profitability analysis: revenue vs supplier costs = margin.
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
    const tripId = searchParams.get('tripId');

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        const tripsSnap = tripId
            ? await tenantRef.collection('trips').where('__name__', '==', tripId).get()
            : await tenantRef.collection('trips').get();

        // Get invoices for revenue matching
        const invoicesSnap = await tenantRef.collection('invoices').get();
        const invoicesByClient: Record<string, number> = {};
        invoicesSnap.docs.forEach(d => {
            const inv = d.data();
            if (inv.status !== 'CANCELLED') {
                const key = inv.clientName || '';
                invoicesByClient[key] = (invoicesByClient[key] || 0) + (inv.totalAmount || 0);
            }
        });

        const results = await Promise.all(tripsSnap.docs.map(async (tripDoc) => {
            const trip = tripDoc.data();
            const tid = tripDoc.id;

            // Get bookings (supplier costs)
            const bookingsSnap = await tripDoc.ref.collection('bookings').get();
            const bookings = bookingsSnap.docs.map(b => b.data());

            const supplierCost = bookings.reduce(
                (sum, b) => sum + (b.supplierPrice || 0), 0
            );
            const sellingPrice = trip.amount || 0;
            const invoicedRevenue = invoicesByClient[trip.clientName || ''] || 0;

            // Use invoice revenue if available, else trip amount
            const revenue = invoicedRevenue > 0 ? invoicedRevenue : sellingPrice;

            const margin = revenue - supplierCost;
            const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;

            return {
                tripId: tid,
                title: trip.title || trip.destination || 'Sans titre',
                destination: trip.destination || '',
                clientName: trip.clientName || '',
                travelers: trip.travelers || 0,
                status: trip.status || 'DRAFT',
                currency: trip.currency || 'EUR',
                financials: {
                    sellingPrice,
                    supplierCost,
                    invoicedRevenue,
                    margin,
                    marginPercent,
                    bookingsCount: bookings.length,
                },
            };
        }));

        // Summary stats
        const totalRevenue = results.reduce((s, r) => s + (r.financials.invoicedRevenue || r.financials.sellingPrice), 0);
        const totalCost = results.reduce((s, r) => s + r.financials.supplierCost, 0);
        const totalMargin = totalRevenue - totalCost;
        const avgMarginPercent = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

        // Top profitable trips
        const sorted = [...results].sort((a, b) => b.financials.margin - a.financials.margin);

        return NextResponse.json({
            trips: tripId ? (results[0] || null) : sorted,
            totalTrips: results.length,
            summary: {
                totalRevenue,
                totalCost,
                totalMargin,
                avgMarginPercent,
                mostProfitable: sorted[0]?.title || null,
                leastProfitable: sorted[sorted.length - 1]?.title || null,
            },
        });
    } catch (error: any) {
        console.error('[Profitability] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
