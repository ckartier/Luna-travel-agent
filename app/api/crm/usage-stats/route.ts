import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/usage-stats
 * 
 * Feature adoption metrics for the tenant.
 * Useful for understanding which CRM features are being used.
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        const [
            contactsSnap,
            tripsSnap,
            suppliersSnap,
            quotesSnap,
            invoicesSnap,
            leadsSnap,
            catalogSnap,
            webhooksSnap,
        ] = await Promise.all([
            tenantRef.collection('contacts').get(),
            tenantRef.collection('trips').get(),
            tenantRef.collection('suppliers').get(),
            tenantRef.collection('quotes').get(),
            tenantRef.collection('invoices').get(),
            tenantRef.collection('leads').get(),
            tenantRef.collection('catalog').get(),
            tenantRef.collection('webhooks').get(),
        ]);

        // Feature adoption score
        const features: Record<string, { used: boolean; count: number }> = {
            contacts: { used: !contactsSnap.empty, count: contactsSnap.size },
            trips: { used: !tripsSnap.empty, count: tripsSnap.size },
            suppliers: { used: !suppliersSnap.empty, count: suppliersSnap.size },
            quotes: { used: !quotesSnap.empty, count: quotesSnap.size },
            invoices: { used: !invoicesSnap.empty, count: invoicesSnap.size },
            pipeline: { used: !leadsSnap.empty, count: leadsSnap.size },
            catalog: { used: !catalogSnap.empty, count: catalogSnap.size },
            webhooks: { used: !webhooksSnap.empty, count: webhooksSnap.size },
        };

        const adoptedFeatures = Object.values(features).filter(f => f.used).length;
        const adoptionRate = Math.round((adoptedFeatures / Object.keys(features).length) * 100);

        // Data volume
        const totalDocs = Object.values(features).reduce((s, f) => s + f.count, 0);

        // Last activity
        const allDocs = [
            ...contactsSnap.docs, ...tripsSnap.docs, ...quotesSnap.docs,
            ...invoicesSnap.docs, ...suppliersSnap.docs,
        ];
        let lastActivityStr: string | null = null;
        let lastActivityTime = 0;
        allDocs.forEach(d => {
            const ts = d.data().updatedAt?.toDate?.() || d.data().createdAt?.toDate?.();
            if (ts) {
                const t = ts.getTime();
                if (t > lastActivityTime) {
                    lastActivityTime = t;
                    lastActivityStr = ts.toISOString();
                }
            }
        });

        return NextResponse.json({
            features,
            adoptionRate,
            adoptedFeatures,
            totalFeatures: Object.keys(features).length,
            totalDocuments: totalDocs,
            lastActivity: lastActivityStr,
        });
    } catch (error: any) {
        console.error('[Usage Stats] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
