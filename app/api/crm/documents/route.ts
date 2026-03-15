import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/documents?entityType=contact&entityId=xxx
 * 
 * Lists all uploaded files linked to an entity.
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
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        let query = tenantRef.collection('documents').orderBy('createdAt', 'desc') as any;

        if (entityType) query = query.where('entityType', '==', entityType);
        if (entityId) query = query.where('entityId', '==', entityId);

        const snap = await query.limit(100).get();
        const docs = snap.docs.map((d: any) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
        }));

        // Group by type
        const byType: Record<string, number> = {};
        docs.forEach((d: any) => {
            const ext = (d.fileName || '').split('.').pop()?.toLowerCase() || 'unknown';
            byType[ext] = (byType[ext] || 0) + 1;
        });

        return NextResponse.json({ documents: docs, total: docs.length, byType });
    } catch (error: any) {
        return NextResponse.json({ documents: [], total: 0, byType: {} });
    }
}
