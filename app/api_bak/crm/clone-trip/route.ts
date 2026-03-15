import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/crm/clone-trip
 * 
 * Clone a trip with its full itinerary (days + activities).
 * Body: { tripId: string, newClientName?: string }
 */
export async function POST(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const body = await req.json();
    const { tripId, newClientName } = body;

    if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const tripRef = tenantRef.collection('trips').doc(tripId);
        const tripSnap = await tripRef.get();

        if (!tripSnap.exists) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        const tripData = tripSnap.data()!;

        // Clone trip document (exclude shareId)
        const { shareId: _removed, ...cloneBase } = tripData as any;
        const newTripData = {
            ...cloneBase,
            title: `${tripData.title || 'Voyage'} (copie)`,
            clientName: newClientName || tripData.clientName || '',
            status: 'DRAFT',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            clonedFrom: tripId,
        };

        const newTripRef = await tenantRef.collection('trips').add(newTripData);

        // Clone days sub-collection
        const daysSnap = await tripRef.collection('days').get();
        let clonedDays = 0;

        if (!daysSnap.empty) {
            const batch = adminDb.batch();
            for (const dayDoc of daysSnap.docs) {
                const dayData = dayDoc.data();
                const newDayRef = newTripRef.collection('days').doc();
                batch.set(newDayRef, {
                    ...dayData,
                    createdAt: FieldValue.serverTimestamp(),
                });
                clonedDays++;
            }
            await batch.commit();
        }

        // Clone bookings sub-collection
        const bookingsSnap = await tripRef.collection('bookings').get();
        let clonedBookings = 0;

        if (!bookingsSnap.empty) {
            const batch = adminDb.batch();
            for (const bookingDoc of bookingsSnap.docs) {
                const bookingData = bookingDoc.data();
                const newBookingRef = newTripRef.collection('bookings').doc();
                batch.set(newBookingRef, {
                    ...bookingData,
                    status: 'DRAFT',
                    createdAt: FieldValue.serverTimestamp(),
                });
                clonedBookings++;
            }
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            newTripId: newTripRef.id,
            cloned: {
                days: clonedDays,
                bookings: clonedBookings,
            },
            message: `Voyage cloné avec ${clonedDays} jour(s) et ${clonedBookings} réservation(s)`,
        });
    } catch (error: any) {
        console.error('[Clone Trip] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
