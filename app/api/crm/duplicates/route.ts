import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { detectDuplicateContacts, detectDuplicateSuppliers } from '@/src/lib/duplicateDetection';

/**
 * GET /api/crm/duplicates?type=contacts|suppliers
 * 
 * Scan for potential duplicates in CRM data.
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
    const type = searchParams.get('type') || 'contacts';

    try {
        if (type === 'suppliers') {
            const duplicates = await detectDuplicateSuppliers(tenantId);
            return NextResponse.json({ type: 'suppliers', duplicates, count: duplicates.length });
        }

        const duplicates = await detectDuplicateContacts(tenantId);
        return NextResponse.json({ type: 'contacts', duplicates, count: duplicates.length });
    } catch (error: any) {
        console.error('[Duplicates] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
