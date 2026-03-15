import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        // Fallback: use first tenant for B2C
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
        }
        const tenantId = tenantsSnap.docs[0].id;
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Fetch user's trips
        const email = auth.email;
        let displayName = '';

        try {
            const userDoc = await adminDb.collection('users').doc(auth.uid).get();
            displayName = userDoc.exists ? userDoc.data()?.displayName : '';
        } catch { }

        // Let's find trips matching the exact email, or name. But mostly we don't have exact clientId.
        // We'll search by clientName (which is often email or displayName).
        const searchName = displayName || email;
        const tripsSnap = await tenantRef.collection('trips')
            .where('clientName', '==', searchName)
            .get();

        const leadsSnap = await tenantRef.collection('leads')
            .where('clientName', '==', searchName)
            .get();

        const invoicesSnap = await tenantRef.collection('invoices')
            .where('clientName', '==', searchName)
            .get();

        const trips = tripsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const invoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ trips, leads, invoices });
    } catch (error: any) {
        console.error('API Client Data Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
