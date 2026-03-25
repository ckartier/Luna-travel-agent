export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { requireRole } from '@/src/lib/rbac';

/**
 * GET /api/crm/team            → list team members
 * POST /api/crm/team           → invite a member (Admin+)
 * DELETE /api/crm/team?uid=xxx → remove a member (Admin+)
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
        const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
        const members = tenantDoc.data()?.members || [];

        const enriched = await Promise.all(members.map(async (m: any) => {
            try {
                const userDoc = await adminDb.collection('users').doc(m.uid || m).get();
                const userData = userDoc.exists ? userDoc.data() : {};
                return {
                    uid: m.uid || m,
                    email: userData?.email || m.email || '',
                    displayName: userData?.displayName || m.displayName || '',
                    role: m.role || 'Agent',
                    joinedAt: m.joinedAt?.toDate?.()?.toISOString() || null,
                    photoURL: userData?.photoURL || null,
                };
            } catch {
                return { uid: m.uid || m, role: m.role || 'Agent', email: m.email || '' };
            }
        }));

        return NextResponse.json({ members: enriched, total: enriched.length });
    } catch (error: any) {
        return NextResponse.json({ members: [], total: 0 });
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

    const denied = requireRole(auth as any, 'Admin');
    if (denied) return denied;

    const body = await req.json();
    const { email, role } = body;

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    const validRoles = ['Agent', 'Manager', 'Admin'];
    if (role && !validRoles.includes(role)) {
        return NextResponse.json({ error: `Role must be: ${validRoles.join(', ')}` }, { status: 400 });
    }

    try {
        await adminDb.collection('tenants').doc(tenantId)
            .collection('invitations').add({
                email: email.toLowerCase(),
                role: role || 'Agent',
                invitedBy: auth.uid,
                status: 'pending',
                createdAt: new Date(),
            });

        return NextResponse.json({
            success: true,
            message: `Invitation envoyée à ${email} (rôle: ${role || 'Agent'})`,
        });
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

    const denied = requireRole(auth as any, 'Admin');
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

    if (uid === auth.uid) {
        return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const tenantDoc = await tenantRef.get();
        const members = tenantDoc.data()?.members || [];
        const updated = members.filter((m: any) => (m.uid || m) !== uid);

        await tenantRef.update({ members: updated });

        return NextResponse.json({ success: true, message: 'Membre retiré' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
