import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';

// All CRM sub-collections under tenants/{tenantId}/
const CRM_COLLECTIONS = [
    'leads',
    'contacts',
    'trips',
    'activities',
    'quotes',
    'invoices',
    'bookings',
    'payments',
    'messages',
    'documents',
    'campaigns',
    'tasks',
    'calendar_events',
    'calendar',
    'catalog',
    'suppliers',
    'prestations',
];

async function deleteCollection(tenantId: string, collectionName: string): Promise<number> {
    const colRef = adminDb.collection('tenants').doc(tenantId).collection(collectionName);
    const snapshot = await colRef.limit(500).get();

    if (snapshot.empty) return 0;

    let deleted = 0;

    // For trips, also delete sub-collection 'days'
    if (collectionName === 'trips') {
        for (const doc of snapshot.docs) {
            const daysSnap = await colRef.doc(doc.id).collection('days').get();
            const daysBatch = adminDb.batch();
            daysSnap.docs.forEach(d => daysBatch.delete(d.ref));
            if (!daysSnap.empty) await daysBatch.commit();
        }
    }

    // Batch delete (max 500 per batch)
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
    });
    await batch.commit();

    // Recurse if there are more docs
    if (deleted >= 500) {
        deleted += await deleteCollection(tenantId, collectionName);
    }

    return deleted;
}

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { tenantId, confirm } = body;

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        if (confirm !== 'PURGE_ALL_CRM_DATA') {
            return NextResponse.json({ error: 'Invalid confirmation code. Send confirm: "PURGE_ALL_CRM_DATA"' }, { status: 400 });
        }

        const results: Record<string, number> = {};
        let totalDeleted = 0;

        for (const col of CRM_COLLECTIONS) {
            const count = await deleteCollection(tenantId, col);
            results[col] = count;
            totalDeleted += count;
        }

        return NextResponse.json({
            success: true,
            message: `Purged ${totalDeleted} documents across ${CRM_COLLECTIONS.length} collections`,
            details: results,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Purge error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
