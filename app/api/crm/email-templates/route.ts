import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/crm/email-templates          → list all custom templates
 * POST /api/crm/email-templates         → create a new template
 * PUT /api/crm/email-templates?id=xxx   → update a template
 * DELETE /api/crm/email-templates?id=xxx → delete a template
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
            .collection('email_templates').orderBy('name').get();

        const templates = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
        }));

        return NextResponse.json({ templates, total: templates.length });
    } catch (error: any) {
        return NextResponse.json({ templates: [], total: 0 });
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
    const { name, subject, htmlBody, category, variables } = body;

    if (!name || !subject || !htmlBody) {
        return NextResponse.json({ error: 'name, subject, and htmlBody required' }, { status: 400 });
    }

    try {
        const ref = await adminDb.collection('tenants').doc(tenantId)
            .collection('email_templates')
            .add({
                name,
                subject,
                htmlBody,
                category: category || 'custom',
                variables: variables || [],
                createdBy: auth.uid,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ success: true, id: ref.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await req.json();
    const allowed = ['name', 'subject', 'htmlBody', 'category', 'variables'];
    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    try {
        await adminDb.collection('tenants').doc(tenantId)
            .collection('email_templates').doc(id).update(updates);
        return NextResponse.json({ success: true });
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
        await adminDb.collection('tenants').doc(tenantId)
            .collection('email_templates').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
