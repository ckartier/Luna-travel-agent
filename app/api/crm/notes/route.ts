import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/crm/notes?entityType=contact&entityId=xxx  → list notes
 * POST /api/crm/notes                                  → add a note
 * DELETE /api/crm/notes?id=xxx                          → delete a note
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

    if (!entityType || !entityId) {
        return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
    }

    try {
        const snap = await adminDb.collection('tenants').doc(tenantId)
            .collection('notes')
            .where('entityType', '==', entityType)
            .where('entityId', '==', entityId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const notes = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
        }));

        return NextResponse.json({ notes, total: notes.length });
    } catch (error: any) {
        return NextResponse.json({ notes: [], total: 0 });
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
    const { entityType, entityId, content, isPinned } = body;

    if (!entityType || !entityId || !content?.trim()) {
        return NextResponse.json({ error: 'entityType, entityId, and content required' }, { status: 400 });
    }

    try {
        const ref = await adminDb.collection('tenants').doc(tenantId)
            .collection('notes')
            .add({
                entityType, // contact, trip, supplier, invoice, quote
                entityId,
                content: content.trim(),
                isPinned: isPinned || false,
                createdBy: auth.uid,
                createdAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ success: true, id: ref.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
        await adminDb.collection('tenants').doc(tenantId).collection('notes').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
