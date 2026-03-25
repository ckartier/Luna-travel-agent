export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/activity-feed?limit=20
 * 
 * Returns the latest CRM activity for the authenticated tenant.
 * Used by the dashboard widget.
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    try {
        const snap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('activity_log')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const activities = snap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                action: d.action,
                entityType: d.entityType,
                entityId: d.entityId,
                entityName: d.entityName,
                userName: d.userName || 'Système',
                metadata: d.metadata || {},
                timestamp: d.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        return NextResponse.json({ activities, total: activities.length });
    } catch (error: any) {
        console.error('[Activity Feed] Error:', error);
        return NextResponse.json({ activities: [], total: 0 });
    }
}
