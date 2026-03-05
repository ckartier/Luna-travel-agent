import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAdmin } from '@/src/lib/firebase/apiAuth';

// GET /api/admin/subscriptions
export async function GET(request: Request) {
    const auth = await verifyAdmin(request);
    if (auth instanceof Response) return auth;
    try {
        const snap = await adminDb.collection('subscriptions').get();
        const subscriptions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ subscriptions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/subscriptions — manually create/update subscription
export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (auth instanceof Response) return auth;
    try {
        const { email, planId, planName, status } = await request.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        await adminDb.collection('subscriptions').doc(email).set({
            email, planId: planId || 'pro', planName: planName || 'Pro',
            status: status || 'active', activatedAt: new Date(), updatedAt: new Date(),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
