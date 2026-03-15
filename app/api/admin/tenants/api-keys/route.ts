import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * POST /api/admin/tenants/api-keys
 * Generate a new API key for a tenant
 */
export async function POST(req: NextRequest) {
    try {
        const { tenantId, name } = await req.json();
        if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

        const key = 'lk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const settingsRef = adminDb
            .collection('tenants').doc(tenantId)
            .collection('settings').doc('apiKeys');

        const doc = await settingsRef.get();
        const keys = doc.exists ? (doc.data()?.keys || {}) : {};

        keys[key] = {
            name: name || 'API Key',
            createdAt: new Date().toISOString(),
            tenantId,
        };

        await settingsRef.set({ keys }, { merge: true });

        return NextResponse.json({ key, name: name || 'API Key' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
