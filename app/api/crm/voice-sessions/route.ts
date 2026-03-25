export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/crm/voice-sessions
 * Saves a completed voice/text agent conversation to Firestore.
 * Stored at /tenants/{uid}/voice-sessions/{id}
 *
 * Body: { title: string, date: string (YYYY-MM-DD), transcript: TranscriptEntry[] }
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const tenantId = (auth as any).tenantId || (auth as any).uid;

    try {
        const { title, date, transcript, vertical = 'legal' } = await request.json();

        if (!transcript || transcript.length < 2) {
            return NextResponse.json({ error: 'Transcript too short to save' }, { status: 400 });
        }

        const docRef = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('voice-sessions')
            .add({
                title: title || 'Conversation',
                date: date || new Date().toISOString().split('T')[0],
                vertical,
                transcript: transcript.map((t: any) => ({
                    id: t.id,
                    role: t.role,
                    text: t.text,
                    timestamp: t.timestamp,
                    // Don't persist action objects to save space
                    ...(t.action ? { action: t.action } : {}),
                })),
                messageCount: transcript.length,
                createdAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ id: docRef.id, saved: true });
    } catch (err: any) {
        console.error('[voice-sessions] Error saving session:', err);
        return NextResponse.json({ error: err.message || 'Failed to save session' }, { status: 500 });
    }
}

/**
 * GET /api/crm/voice-sessions
 * Returns the last 30 sessions for the tenant, ordered by date.
 */
export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const tenantId = (auth as any).tenantId || (auth as any).uid;

    try {
        const snap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('voice-sessions')
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();

        const sessions = snap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                title: d.title,
                date: d.date,
                vertical: d.vertical,
                messageCount: d.messageCount,
                createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
            };
        });

        return NextResponse.json({ sessions });
    } catch (err: any) {
        console.error('[voice-sessions] Error fetching sessions:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
