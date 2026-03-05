import { admin, adminDb } from './admin';
import { NextResponse } from 'next/server';

export interface AuthResult {
    uid: string;
    email: string;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns AuthResult on success, or a 401 Response on failure.
 */
export async function verifyAuth(request: Request): Promise<AuthResult | Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email || '' };
    } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
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
