import { admin, adminDb } from './admin';
import { NextResponse } from 'next/server';

export interface AuthResult {
    uid: string;
    email: string;
    tenantId?: string;
    role?: string;
    accessScope?: 'full' | 'pro_travel';
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns AuthResult (with tenantId if available) on success, or a 401 Response on failure.
 */
export async function verifyAuth(request: Request): Promise<AuthResult | Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        console.error('[verifyAuth] Missing or invalid header:', authHeader);
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);

        let tenantId: string | undefined;
        let role: string | undefined;
        let accessScope: 'full' | 'pro_travel' | undefined;
        try {
            const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
            if (userDoc.exists) {
                tenantId = userDoc.data()?.tenantId;
                role = userDoc.data()?.role;
                accessScope = userDoc.data()?.accessScope;
            }
        } catch {
            // Non-blocking: tenantId/role will be undefined if lookup fails
        }

        const pathname = new URL(request.url).pathname;
        if (accessScope === 'pro_travel' && pathname.startsWith('/api/crm/')) {
            return NextResponse.json({ error: 'Pro account cannot access CRM APIs' }, { status: 403 });
        }

        return { uid: decoded.uid, email: decoded.email || '', tenantId, role, accessScope };
    } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
}

/**
 * Verify Firebase ID token + resolve tenantId (REQUIRED).
 * Returns AuthResult with guaranteed tenantId, or a 401/403 Response on failure.
 * Use this for any route that accesses tenant-scoped data.
 */
export async function verifyAuthWithTenant(request: Request): Promise<(AuthResult & { tenantId: string }) | Response> {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    if (!auth.tenantId) {
        return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    return auth as AuthResult & { tenantId: string };
}

/**
 * Verify Firebase ID token + check Admin role in Firestore.
 * Returns AuthResult on success, or a 401/403 Response on failure.
 */
export async function verifyAdmin(request: Request): Promise<AuthResult | Response> {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const userDoc = await adminDb.collection('users').doc(auth.uid).get();
        const role = userDoc.data()?.role;
        if (!userDoc.exists || !['Admin', 'SuperAdmin'].includes(role)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        return auth;
    } catch {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
    }
}
