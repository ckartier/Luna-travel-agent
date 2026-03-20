import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * AI Usage Tracking per Tenant
 * 
 * GET  → Returns today's AI query count + daily limit
 * POST → Increments today's counter (call before each AI request)
 * 
 * Stores daily counters in: tenants/{tenantId}/usage/{YYYY-MM-DD}
 */

function todayKey() {
    return new Date().toISOString().split('T')[0]; // e.g. "2026-03-20"
}

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    try {
        // Get tenant limits
        const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
        const tenant = tenantSnap.data();
        const dailyLimit = tenant?.limits?.aiQueriesPerDay ?? 5;

        // Get today's usage
        const usageRef = adminDb.collection('tenants').doc(tenantId).collection('usage').doc(todayKey());
        const usageSnap = await usageRef.get();
        const count = usageSnap.exists ? (usageSnap.data()?.aiQueries ?? 0) : 0;

        return NextResponse.json({
            today: todayKey(),
            count,
            limit: dailyLimit,
            remaining: dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - count),
            unlimited: dailyLimit === -1,
        });
    } catch (err: any) {
        console.error('[AI Usage GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    try {
        // Get tenant limits
        const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
        const tenant = tenantSnap.data();
        const dailyLimit = tenant?.limits?.aiQueriesPerDay ?? 5;

        // Get today's usage
        const key = todayKey();
        const usageRef = adminDb.collection('tenants').doc(tenantId).collection('usage').doc(key);
        const usageSnap = await usageRef.get();
        const currentCount = usageSnap.exists ? (usageSnap.data()?.aiQueries ?? 0) : 0;

        // Check limit (skip if unlimited)
        if (dailyLimit !== -1 && currentCount >= dailyLimit) {
            return NextResponse.json({
                allowed: false,
                count: currentCount,
                limit: dailyLimit,
                error: 'LIMIT_EXCEEDED',
                message: `Limite IA atteinte (${dailyLimit} requêtes/jour). Passez au plan supérieur.`,
            }, { status: 429 });
        }

        // Increment counter
        if (usageSnap.exists) {
            await usageRef.update({
                aiQueries: FieldValue.increment(1),
                lastQuery: FieldValue.serverTimestamp(),
            });
        } else {
            await usageRef.set({
                date: key,
                aiQueries: 1,
                lastQuery: FieldValue.serverTimestamp(),
            });
        }

        const newCount = currentCount + 1;

        return NextResponse.json({
            allowed: true,
            count: newCount,
            limit: dailyLimit,
            remaining: dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - newCount),
        });
    } catch (err: any) {
        console.error('[AI Usage POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
