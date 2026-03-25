export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/trip/[shareId]
 * Public endpoint — no auth required.
 * Returns trip snapshot data for the shared trip page.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ shareId: string }> }
) {
    const { shareId } = await params;
    if (!shareId) {
        return NextResponse.json({ error: 'Missing shareId' }, { status: 400 });
    }

    try {
        const doc = await adminDb.collection('sharedTrips').doc(shareId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        const data = doc.data();
        return NextResponse.json({
            trip: data?.trip,
            days: data?.days || [],
            bookings: data?.bookings || [],
            scheduledMessages: data?.scheduledMessages || [],
            shareId,
        });
    } catch (err: any) {
        console.error('[SharedTrip API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
