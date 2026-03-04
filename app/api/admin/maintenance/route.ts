import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

// GET /api/admin/maintenance — get maintenance status
export async function GET() {
    try {
        const doc = await adminDb.collection('settings').doc('maintenance').get();
        if (!doc.exists) {
            return NextResponse.json({ enabled: false, message: '', plannedEnd: null });
        }
        return NextResponse.json(doc.data());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/maintenance — toggle maintenance mode
export async function POST(request: Request) {
    try {
        const data = await request.json();
        await adminDb.collection('settings').doc('maintenance').set({
            enabled: !!data.enabled,
            message: data.message || 'Maintenance en cours. Nous revenons bientôt.',
            plannedEnd: data.plannedEnd || null,
            updatedAt: new Date(),
        }, { merge: true });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
