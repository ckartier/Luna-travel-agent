export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/notification-prefs  → user notification preferences
 * PUT /api/crm/notification-prefs  → update preferences
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    try {
        const doc = await adminDb.collection('users').doc(auth.uid)
            .collection('preferences').doc('notifications').get();

        const defaults = {
            emailNewLead: true,
            emailInvoicePaid: true,
            emailQuoteAccepted: true,
            emailDailyDigest: false,
            emailWeeklyReport: true,
            pushNewMessage: true,
            pushReminder: true,
            pushTripUpdate: true,
            soundEnabled: true,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
        };

        return NextResponse.json({
            preferences: doc.exists ? { ...defaults, ...doc.data() } : defaults,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    // Whitelist allowed keys
    const allowed = [
        'emailNewLead', 'emailInvoicePaid', 'emailQuoteAccepted',
        'emailDailyDigest', 'emailWeeklyReport',
        'pushNewMessage', 'pushReminder', 'pushTripUpdate',
        'soundEnabled', 'quietHoursStart', 'quietHoursEnd',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    try {
        await adminDb.collection('users').doc(auth.uid)
            .collection('preferences').doc('notifications')
            .set({ ...updates, updatedAt: new Date() }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
