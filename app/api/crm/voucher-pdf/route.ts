export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { generateVoucherPdf } from '@/src/lib/pdf/voucherPdf';

/**
 * GET /api/crm/voucher-pdf?bookingId=xxx&tripId=xxx
 * 
 * Generate a voucher PDF for a confirmed booking.
 * Auth required. Uses tenant from auth token.
 */
export async function GET(req: NextRequest) {
    // Rate limit
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    // Auth
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    // Paywall
    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const tripId = searchParams.get('tripId');

    if (!bookingId || !tripId) {
        return NextResponse.json({ error: 'bookingId and tripId required' }, { status: 400 });
    }

    try {
        const tenantId = auth.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
        }
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Get booking
        const bookingSnap = await tenantRef
            .collection('trips').doc(tripId)
            .collection('bookings').doc(bookingId)
            .get();

        if (!bookingSnap.exists) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        const booking = bookingSnap.data()!;

        // Get trip info
        const tripSnap = await tenantRef.collection('trips').doc(tripId).get();
        const trip = tripSnap.data() || {};

        // Get tenant branding
        let agencyName = 'Conciergerie';
        let agencyEmail = '';
        let agencyPhone = '';
        let agencyLogo = '';

        const tenantDoc = await tenantRef.get();
        if (tenantDoc.exists) {
            agencyName = tenantDoc.data()?.name || agencyName;
        }

        try {
            const configSnap = await tenantRef.collection('settings').doc('siteConfig').get();
            if (configSnap.exists) {
                const cfg = configSnap.data();
                agencyName = cfg?.global?.agencyName || agencyName;
                agencyEmail = cfg?.global?.email || '';
                agencyPhone = cfg?.global?.phone || '';
                agencyLogo = cfg?.global?.logo || '';
            }
        } catch { /* Use defaults */ }

        // Get supplier info if available
        let supplierData: any = {};
        if (booking.supplierId) {
            try {
                const supplierSnap = await tenantRef.collection('suppliers').doc(booking.supplierId).get();
                if (supplierSnap.exists) {
                    supplierData = supplierSnap.data();
                }
            } catch { /* Use booking data */ }
        }

        const doc = generateVoucherPdf({
            agencyName,
            agencyLogo,
            agencyEmail,
            agencyPhone,
            bookingRef: booking.reference || booking.confirmationNumber || `BK-${bookingId.slice(0, 8).toUpperCase()}`,
            supplierName: booking.supplier || supplierData.name || 'Fournisseur',
            supplierAddress: supplierData.address || booking.location || '',
            supplierPhone: supplierData.phone || '',
            supplierEmail: supplierData.email || '',
            type: booking.type || 'HOTEL',
            clientName: trip.clientName || booking.clientName || 'Client',
            clientPhone: trip.clientPhone || '',
            pax: trip.travelers || booking.pax || 1,
            checkIn: booking.checkIn || booking.startDate || '',
            checkOut: booking.checkOut || booking.endDate || '',
            time: booking.time || '',
            roomType: booking.roomType || booking.category || '',
            mealPlan: booking.mealPlan || '',
            notes: booking.notes || '',
            specialRequests: booking.specialRequests || '',
            confirmationNumber: booking.confirmationNumber || '',
            supplierPrice: booking.supplierPrice || booking.price || undefined,
            currency: booking.currency || trip.currency || 'EUR',
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const filename = `voucher-${booking.supplier || 'booking'}-${bookingId.slice(0, 6)}.pdf`;

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error('[Voucher PDF] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
