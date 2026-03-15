import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/admin/tenants
 * Returns all tenants with aggregated stats (contacts, trips, quotes, invoices, revenue, api keys)
 * Used by /site-admin/tenants dashboard
 */
export async function GET() {
    try {
        const tenantsSnap = await adminDb.collection('tenants').get();
        const tenants = [];

        for (const doc of tenantsSnap.docs) {
            const tenantData = doc.data();
            const tenantRef = doc.ref;

            // Count sub-collections in parallel
            const [contactsSnap, tripsSnap, quotesSnap, invoicesSnap, apiKeysDoc] = await Promise.all([
                tenantRef.collection('contacts').count().get(),
                tenantRef.collection('trips').count().get(),
                tenantRef.collection('quotes').count().get(),
                tenantRef.collection('invoices').get(),
                tenantRef.collection('settings').doc('apiKeys').get(),
            ]);

            // Calculate revenue from invoices
            let revenue = 0;
            const invoicesList = invoicesSnap.docs;
            invoicesList.forEach(inv => {
                const d = inv.data();
                if (d.status !== 'CANCELLED') {
                    revenue += d.totalAmount || 0;
                }
            });

            // Get API keys
            const apiKeysData = apiKeysDoc.exists ? apiKeysDoc.data() : {};
            const apiKeys = Object.entries(apiKeysData?.keys || {}).map(([key, meta]: [string, any]) => ({
                key,
                name: meta?.name || 'API Key',
                createdAt: meta?.createdAt || '',
            }));

            tenants.push({
                id: doc.id,
                name: tenantData.name || tenantData.agencyName || doc.id,
                domain: tenantData.domain || '',
                plan: tenantData.subscription?.plan || 'free',
                createdAt: tenantData.createdAt || '',
                stats: {
                    contacts: contactsSnap.data().count,
                    trips: tripsSnap.data().count,
                    quotes: quotesSnap.data().count,
                    invoices: invoicesList.length,
                    revenue,
                },
                apiKeys,
            });
        }

        return NextResponse.json({ tenants });
    } catch (error: any) {
        console.error('[Admin Tenants] Error:', error);
        return NextResponse.json({ error: error.message, tenants: [] }, { status: 500 });
    }
}
