export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * POST /api/crm/voice-vocabulary
 * Returns CRM-specific vocabulary for voice recognition auto-correction.
 * Called once at voice agent startup, cached client-side.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const userDoc = await adminDb.collection('users').doc(auth.uid).get();
        const tenantId = userDoc.exists ? userDoc.data()?.tenantId : auth.uid;
        if (!tenantId) {
            return NextResponse.json({ clientNames: [], destinations: [], prestations: [], suppliers: [], allTerms: [] });
        }

        const base = adminDb.collection('tenants').doc(tenantId);

        const [contactsSnap, tripsSnap, catalogSnap, suppliersSnap] = await Promise.all([
            base.collection('contacts').limit(100).get(),
            base.collection('trips').limit(50).get(),
            base.collection('catalog').limit(100).get(),
            base.collection('suppliers').limit(50).get(),
        ]);

        // Extract unique terms
        const clientNames = contactsSnap.docs.map(d => {
            const c = d.data();
            return `${c.firstName || ''} ${c.lastName || ''}`.trim();
        }).filter(Boolean);

        const destinations = [...new Set(
            tripsSnap.docs.map(d => d.data().destination || '').filter(Boolean)
        )];

        const prestations = catalogSnap.docs.map(d => d.data().name || '').filter(Boolean);

        const suppliers = suppliersSnap.docs.map(d => d.data().name || '').filter(Boolean);

        // Combined for quick fuzzy lookup
        const allTerms = [...new Set([...clientNames, ...destinations, ...prestations, ...suppliers])];

        return NextResponse.json({
            clientNames,
            destinations,
            prestations,
            suppliers,
            allTerms,
        });
    } catch (err: any) {
        console.error('[VoiceVocabulary] Error:', err.message);
        return NextResponse.json({ clientNames: [], destinations: [], prestations: [], suppliers: [], allTerms: [] });
    }
}
