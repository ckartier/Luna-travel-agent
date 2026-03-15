import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/audit-log?action=xxx&user=xxx&limit=50&from=ISO&to=ISO
 * 
 * Filterable audit log viewer. Returns activity_log entries
 * with filtering by action type, user, and date range.
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
    const action = searchParams.get('action');
    const userName = searchParams.get('user');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    try {
        let query = adminDb
            .collection('tenants').doc(tenantId)
            .collection('activity_log')
            .orderBy('timestamp', 'desc') as any;

        if (action) {
            query = query.where('action', '==', action);
        }

        const snap = await query.limit(limit).get();

        let entries = snap.docs.map((d: any) => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
        }));

        // Client-side filters (Firestore limits compound queries)
        if (userName) {
            entries = entries.filter((e: any) =>
                (e.userName || '').toLowerCase().includes(userName.toLowerCase())
            );
        }

        if (fromDate) {
            const from = new Date(fromDate);
            entries = entries.filter((e: any) => e.timestamp && new Date(e.timestamp) >= from);
        }

        if (toDate) {
            const to = new Date(toDate);
            entries = entries.filter((e: any) => e.timestamp && new Date(e.timestamp) <= to);
        }

        // Group by action type for stats
        const actionCounts: Record<string, number> = {};
        entries.forEach((e: any) => {
            actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
        });

        // Unique users
        const uniqueUsers = [...new Set(entries.map((e: any) => e.userName).filter(Boolean))];

        return NextResponse.json({
            entries,
            total: entries.length,
            actionCounts,
            uniqueUsers,
        });
    } catch (error: any) {
        console.error('[Audit Log] Error:', error);
        return NextResponse.json({ entries: [], total: 0 });
    }
}
