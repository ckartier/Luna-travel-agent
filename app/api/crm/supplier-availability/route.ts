export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/supplier-availability?supplierId=xxx&from=2026-04-01&to=2026-04-10
 * 
 * Check supplier availability for given dates based on existing bookings.
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!supplierId || !from || !to) {
        return NextResponse.json({ error: 'supplierId, from, and to required' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Get supplier info
        const supplierSnap = await tenantRef.collection('suppliers').doc(supplierId).get();
        if (!supplierSnap.exists) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        const supplier = supplierSnap.data()!;

        // Get all bookings for this supplier across trips
        const tripsSnap = await tenantRef.collection('trips').get();
        const conflicts: any[] = [];

        for (const tripDoc of tripsSnap.docs) {
            const bookingsSnap = await tripDoc.ref.collection('bookings').get();
            bookingsSnap.docs.forEach(b => {
                const booking = b.data();
                if (booking.supplierId !== supplierId && booking.supplier !== supplier.name) return;
                if (booking.status === 'CANCELLED') return;

                const bStart = booking.checkIn || booking.startDate || '';
                const bEnd = booking.checkOut || booking.endDate || '';

                // Check overlap
                if (bStart && bEnd && bStart <= to && bEnd >= from) {
                    conflicts.push({
                        tripId: tripDoc.id,
                        tripTitle: tripDoc.data().title || tripDoc.data().destination || '',
                        clientName: tripDoc.data().clientName || '',
                        dates: { from: bStart, to: bEnd },
                        status: booking.status,
                    });
                }
            });
        }

        return NextResponse.json({
            supplier: { id: supplierId, name: supplier.name, category: supplier.category },
            requestedDates: { from, to },
            available: conflicts.length === 0,
            conflicts,
            message: conflicts.length === 0
                ? `${supplier.name} est disponible du ${from} au ${to}`
                : `${conflicts.length} réservation(s) en conflit`,
        });
    } catch (error: any) {
        console.error('[Supplier Availability] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
