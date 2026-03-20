import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { generateSmartBriefing } from '@/src/lib/smart-briefing';

/**
 * POST /api/crm/smart-briefing
 * Returns a context-aware greeting + CRM alerts for the voice agent.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { firstName } = await request.json();

        // Get user's tenantId
        const userDoc = await adminDb.collection('users').doc(auth.uid).get();
        const tenantId = userDoc.exists ? userDoc.data()?.tenantId : auth.uid;
        if (!tenantId) {
            return NextResponse.json({ greeting: `Bonjour ! Comment puis-je vous aider ?`, alerts: [], stats: {} });
        }

        const briefing = await generateSmartBriefing(tenantId, firstName || 'Laurent');

        return NextResponse.json(briefing);
    } catch (err: any) {
        console.error('[SmartBriefing] Error:', err.message);
        return NextResponse.json({
            greeting: `Bonjour ${(await request.json().catch(() => ({}))).firstName || ''} ! Comment puis-je vous aider ?`,
            alerts: [],
            stats: {},
        });
    }
}
