import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/api-usage
 * 
 * Tracks API key usage stats.
 * Returns calls count, last used, endpoints breakdown.
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

    try {
        const snap = await adminDb.collection('tenants').doc(tenantId)
            .collection('api_usage').orderBy('timestamp', 'desc').limit(200).get();

        const logs = snap.docs.map(d => d.data());

        // Aggregate by endpoint
        const endpoints: Record<string, { count: number; lastUsed: string }> = {};
        logs.forEach(l => {
            const key = `${l.method} ${l.endpoint}`;
            if (!endpoints[key]) {
                endpoints[key] = { count: 0, lastUsed: l.timestamp?.toDate?.()?.toISOString() || '' };
            }
            endpoints[key].count++;
        });

        // Aggregate by day (last 30 days)
        const daily: Record<string, number> = {};
        logs.forEach(l => {
            const ts = l.timestamp?.toDate?.();
            if (ts) {
                const day = ts.toISOString().split('T')[0];
                daily[day] = (daily[day] || 0) + 1;
            }
        });

        // Aggregate by API key
        const byKey: Record<string, number> = {};
        logs.forEach(l => {
            const key = l.apiKey ? `${l.apiKey.slice(0, 8)}...` : 'session';
            byKey[key] = (byKey[key] || 0) + 1;
        });

        return NextResponse.json({
            totalCalls: logs.length,
            endpoints,
            dailyUsage: Object.entries(daily).map(([date, count]) => ({ date, count })).slice(0, 30),
            byApiKey: byKey,
        });
    } catch (error: any) {
        return NextResponse.json({ totalCalls: 0, endpoints: {}, dailyUsage: [], byApiKey: {} });
    }
}
