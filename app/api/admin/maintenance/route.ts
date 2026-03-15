import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { enabled } = await request.json();

        // Store the maintenance flag in a global "settings" doc
        await adminDb.collection('settings').doc('maintenance').set({
            enabled: !!enabled,
            updatedAt: new Date(),
            updatedBy: auth.uid,
        }, { merge: true });

        return NextResponse.json({ success: true, maintenanceMode: !!enabled });
    } catch (error: any) {
        console.error('Maintenance toggle error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const doc = await adminDb.collection('settings').doc('maintenance').get();
        const data = doc.exists ? doc.data() : { enabled: false };
        return NextResponse.json({ enabled: data?.enabled || false });
    } catch {
        return NextResponse.json({ enabled: false });
    }
}
