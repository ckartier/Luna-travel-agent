export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/crm/reminders            → upcoming reminders
 * POST /api/crm/reminders           → create a reminder
 * DELETE /api/crm/reminders?id=xxx  → mark completed/delete
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
    const status = searchParams.get('status') || 'pending';

    try {
        let query = adminDb
            .collection('tenants').doc(tenantId)
            .collection('reminders')
            .orderBy('dueDate', 'asc') as any;

        if (status === 'pending') {
            query = query.where('completed', '==', false);
        }

        const snap = await query.limit(50).get();
        const reminders = snap.docs.map((d: any) => ({
            id: d.id,
            ...d.data(),
            dueDate: d.data().dueDate?.toDate?.()?.toISOString() || null,
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
        }));

        // Group by urgency
        const now = new Date();
        const overdue = reminders.filter((r: any) => r.dueDate && new Date(r.dueDate) < now && !r.completed);
        const today = reminders.filter((r: any) => {
            if (!r.dueDate || r.completed) return false;
            const d = new Date(r.dueDate);
            return d.toDateString() === now.toDateString();
        });
        const upcoming = reminders.filter((r: any) => {
            if (!r.dueDate || r.completed) return false;
            return new Date(r.dueDate) > now && new Date(r.dueDate).toDateString() !== now.toDateString();
        });

        return NextResponse.json({
            reminders,
            total: reminders.length,
            overdue: overdue.length,
            today: today.length,
            upcoming: upcoming.length,
        });
    } catch (error: any) {
        console.error('[Reminders] Error:', error);
        return NextResponse.json({ reminders: [], total: 0 });
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
    const { title, description, dueDate, priority, entityType, entityId, entityName } = body;

    if (!title || !dueDate) {
        return NextResponse.json({ error: 'title and dueDate required' }, { status: 400 });
    }

    try {
        const ref = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('reminders')
            .add({
                title,
                description: description || '',
                dueDate: new Date(dueDate),
                priority: priority || 'normal', // low, normal, high, urgent
                entityType: entityType || null,   // contact, trip, invoice...
                entityId: entityId || null,
                entityName: entityName || null,
                completed: false,
                createdBy: auth.uid,
                createdAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ success: true, id: ref.id });
    } catch (error: any) {
        console.error('[Reminders POST] Error:', error);
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
    const action = searchParams.get('action') || 'complete';

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
        const docRef = adminDb.collection('tenants').doc(tenantId).collection('reminders').doc(id);

        if (action === 'delete') {
            await docRef.delete();
            return NextResponse.json({ success: true, action: 'deleted' });
        }

        await docRef.update({ completed: true, completedAt: new Date() });
        return NextResponse.json({ success: true, action: 'completed' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
