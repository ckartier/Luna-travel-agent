import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

// GET /api/admin/subscriptions
export async function GET() {
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
