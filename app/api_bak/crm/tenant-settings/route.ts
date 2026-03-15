import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { requireRole } from '@/src/lib/rbac';

/**
 * GET /api/crm/tenant-settings  → get agency settings
 * PUT /api/crm/tenant-settings  → update agency settings (Admin+ only)
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
        const [tenantDoc, siteConfig] = await Promise.all([
            adminDb.collection('tenants').doc(tenantId).get(),
            adminDb.collection('tenants').doc(tenantId).collection('settings').doc('siteConfig').get(),
        ]);

        return NextResponse.json({
            tenant: tenantDoc.exists ? { id: tenantDoc.id, ...tenantDoc.data() } : null,
            siteConfig: siteConfig.exists ? siteConfig.data() : null,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    // Admin+ only
    const denied = requireRole(auth as any, 'Admin');
    if (denied) return denied;

    const body = await req.json();
    const { global, business, branding } = body;

    try {
        const updates: Record<string, any> = { updatedAt: new Date() };
        if (global) updates.global = global;
        if (business) updates.business = business;
        if (branding) updates.branding = branding;

        await adminDb.collection('tenants').doc(tenantId)
            .collection('settings').doc('siteConfig')
            .set(updates, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
