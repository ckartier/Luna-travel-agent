import { admin, adminDb } from './admin';
import { NextResponse } from 'next/server';

export interface AuthResult {
    uid: string;
    email: string;
    tenantId?: string;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns AuthResult (with tenantId if available) on success, or a 401 Response on failure.
 */
export async function verifyAuth(request: Request): Promise<AuthResult | Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);

        // Fetch tenantId from user profile for secure tenant isolation
        let tenantId: string | undefined;
        try {
            const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
            tenantId = userDoc.exists ? userDoc.data()?.tenantId : undefined;
        } catch {
            // Non-blocking: tenantId will be undefined if lookup fails
        }

        return { uid: decoded.uid, email: decoded.email || '', tenantId };
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
        if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        return auth;
    } catch {
        return NextResponse.json({ error: 'Authorization check failed' }, { status: 500 });
    }
}

