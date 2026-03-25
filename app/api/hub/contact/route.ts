import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export const dynamic = 'force-dynamic';

async function resolveTenantIdFromRequest(
    request: NextRequest,
    bodyTenantId?: string
): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    // Authenticated admin calls must use caller tenant.
    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    // Public form calls can pass tenantId explicitly.
    if (bodyTenantId) return bodyTenantId;
    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    // Backward-compatible fallback for single-tenant setups.
    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
    if (tenantsSnap.empty) return null;
    return tenantsSnap.docs[0].id;
}

function serializeContact(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
    const data: any = doc.data() || {};
    const toIso = (value: any) => value?.toDate?.()?.toISOString?.() || null;
    return {
        id: doc.id,
        ...data,
        createdAt: toIso(data.createdAt),
        readAt: toIso(data.readAt),
    };
}

// ── POST: Receive contact form submissions ──
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, message, phone, subject, tenantId } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: name, email, message' },
                { status: 400 }
            );
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        const resolvedTenant = await resolveTenantIdFromRequest(request, tenantId);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
        }

        const contactData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            phone: phone?.trim() || '',
            subject: subject?.trim() || 'Contact Hub',
            tenantId: resolvedTenant,
            status: 'new',
            readAt: null,
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('tenants').doc(resolvedTenant).collection('hub_contacts').add(contactData);

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('[HubContact] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── GET: List contact submissions (for admin) ──
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }

        const tenantSnap = await adminDb.collection('tenants')
            .doc(auth.tenantId)
            .collection('hub_contacts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const contacts = tenantSnap.docs.map(doc => serializeContact(doc));
        return NextResponse.json({ contacts });
    } catch (error: any) {
        console.error('[HubContact] GET error:', error);
        return NextResponse.json({ contacts: [] });
    }
}
