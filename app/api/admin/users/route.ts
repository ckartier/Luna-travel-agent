import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

// GET /api/admin/users — list all users
export async function GET() {
    try {
        const snapshot = await adminDb.collection('users').get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/users — update user role
export async function POST(request: Request) {
    try {
        const { uid, role } = await request.json();
        if (!uid || !role) return NextResponse.json({ error: 'uid and role required' }, { status: 400 });
        if (!['Agent', 'Admin', 'Manager'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

        await adminDb.collection('users').doc(uid).update({ role, updatedAt: new Date() });
        return NextResponse.json({ success: true, uid, role });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
