import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { getTenantUsageSummary } from '@/src/lib/firebase/tenantLimits';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'No tenant ID' }, { status: 400 });

    try {
        const summary = await getTenantUsageSummary(tenantId);
        if (!summary) {
            return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 404 });
        }
        
        return NextResponse.json(summary);
    } catch (err: any) {
        console.error('[Billing Summary GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
