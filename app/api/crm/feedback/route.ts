export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/crm/feedback?tripId=xxx  → get feedback for a trip
 * GET /api/crm/feedback              → all feedback, sorted by date
 * POST /api/crm/feedback             → send NPS survey link (creates feedback doc)
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
        let query = tenantRef.collection('feedback').orderBy('createdAt', 'desc') as any;

        if (tripId) {
            query = query.where('tripId', '==', tripId);
        }

        const snap = await query.limit(50).get();
        const feedback = snap.docs.map((d: any) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
            respondedAt: d.data().respondedAt?.toDate?.()?.toISOString() || null,
        }));

        // NPS calculation
        const responded = feedback.filter((f: any) => f.npsScore !== undefined);
        const promoters = responded.filter((f: any) => f.npsScore >= 9).length;
        const detractors = responded.filter((f: any) => f.npsScore <= 6).length;
        const nps = responded.length > 0
            ? Math.round(((promoters - detractors) / responded.length) * 100)
            : null;

        return NextResponse.json({
            feedback,
            total: feedback.length,
            nps,
            stats: {
                sent: feedback.length,
                responded: responded.length,
                responseRate: feedback.length > 0 ? Math.round((responded.length / feedback.length) * 100) : 0,
                promoters,
                passives: responded.filter((f: any) => f.npsScore >= 7 && f.npsScore <= 8).length,
                detractors,
            },
        });
    } catch (error: any) {
        console.error('[Feedback] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
    const { tripId, clientName, clientEmail } = body;

    if (!tripId || !clientName) {
        return NextResponse.json({ error: 'tripId and clientName required' }, { status: 400 });
    }

    try {
        const feedbackRef = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('feedback')
            .add({
                tripId,
                clientName,
                clientEmail: clientEmail || '',
                status: 'SENT',
                createdAt: FieldValue.serverTimestamp(),
                sentBy: auth.uid,
            });

        return NextResponse.json({
            success: true,
            feedbackId: feedbackRef.id,
            message: `Enquête NPS créée pour ${clientName}`,
        });
    } catch (error: any) {
        console.error('[Feedback POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
