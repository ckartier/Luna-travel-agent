import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { checkTenantLimit } from '@/src/lib/firebase/tenantLimits';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'No tenant ID' }, { status: 400 });

    try {
        const { resource } = await request.json();
        if (!['contacts', 'trips', 'ai'].includes(resource)) {
            return NextResponse.json({ error: 'Resource invalide' }, { status: 400 });
        }

        const check = await checkTenantLimit(tenantId, resource as any);
        return NextResponse.json(check);
    } catch (err: any) {
        console.error('[Limit Check POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
