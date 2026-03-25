export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/supplier-score?supplierId=xxx  (single)
 * GET /api/crm/supplier-score                  (all, ranked)
 * 
 * Auto-scores suppliers based on: bookings count, avg rating, response reliability.
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
    const supplierId = searchParams.get('supplierId');

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Get all suppliers
        const suppliersSnap = supplierId
            ? await tenantRef.collection('suppliers').where('__name__', '==', supplierId).get()
            : await tenantRef.collection('suppliers').get();

        if (suppliersSnap.empty) {
            return NextResponse.json({ scores: [], message: 'Aucun prestataire trouvé' });
        }

        // Get all bookings for scoring
        const tripsSnap = await tenantRef.collection('trips').get();
        const allBookings: any[] = [];

        for (const tripDoc of tripsSnap.docs) {
            const bookingsSnap = await tripDoc.ref.collection('bookings').get();
            bookingsSnap.docs.forEach(b => {
                allBookings.push({ tripId: tripDoc.id, ...b.data() });
            });
        }

        const scores = suppliersSnap.docs.map(doc => {
            const s = doc.data();
            const sid = doc.id;

            // Bookings with this supplier
            const supplierBookings = allBookings.filter(
                b => b.supplierId === sid || b.supplier === s.name
            );

            // Metrics
            const bookingsCount = supplierBookings.length;
            const confirmedBookings = supplierBookings.filter(b => b.status === 'CONFIRMED').length;
            const reliabilityRate = bookingsCount > 0
                ? Math.round((confirmedBookings / bookingsCount) * 100)
                : 0;

            // Manual rating (1-5)
            const manualRating = s.rating || 0;

            // Revenue generated
            const totalRevenue = supplierBookings.reduce(
                (sum: number, b: any) => sum + (b.supplierPrice || b.price || 0), 0
            );

            // Score calculation (0-100)
            let score = 0;
            score += Math.min(bookingsCount * 5, 25);        // Up to 25pts for volume
            score += Math.round(reliabilityRate * 0.25);       // Up to 25pts for reliability
            score += Math.round((manualRating / 5) * 25);      // Up to 25pts for rating
            score += s.isFavorite ? 15 : 0;                    // 15pts if favorited
            score += s.hasLicense ? 5 : 0;                     // 5pts if licensed
            score += s.photoURL ? 5 : 0;                       // 5pts if has photo
            score = Math.min(score, 100);

            // Tier classification
            let tier: string;
            if (score >= 80) tier = 'Platinum';
            else if (score >= 60) tier = 'Gold';
            else if (score >= 40) tier = 'Silver';
            else tier = 'Bronze';

            return {
                id: sid,
                name: s.name,
                category: s.category,
                city: s.city,
                country: s.country,
                score,
                tier,
                metrics: {
                    bookingsCount,
                    confirmedBookings,
                    reliabilityRate,
                    manualRating,
                    totalRevenue,
                    isFavorite: !!s.isFavorite,
                    hasLicense: !!s.hasLicense,
                },
            };
        });

        scores.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            scores: supplierId ? scores[0] || null : scores,
            totalSuppliers: scores.length,
            tierDistribution: {
                platinum: scores.filter(s => s.tier === 'Platinum').length,
                gold: scores.filter(s => s.tier === 'Gold').length,
                silver: scores.filter(s => s.tier === 'Silver').length,
                bronze: scores.filter(s => s.tier === 'Bronze').length,
            },
        });
    } catch (error: any) {
        console.error('[Supplier Score] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
