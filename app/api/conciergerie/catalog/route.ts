import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

export const dynamic = 'force-dynamic'; // Always serve fresh data from CRM catalog

function toMillis(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value?.toMillis === 'function') return value.toMillis();
    return 0;
}

function pickMostRecent<T extends { updatedAtMs: number }>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    return [...items].sort((a, b) => b.updatedAtMs - a.updatedAtMs)[0];
}

async function resolvePublicTenantId(request: NextRequest): Promise<string | null> {
    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    const envTenantId = process.env.LUNA_TENANT_ID
        || process.env.DEFAULT_PUBLIC_TENANT_ID
        || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
    if (envTenantId) return envTenantId;

    const tenantsSnap = await adminDb.collection('tenants').limit(20).get();
    if (tenantsSnap.empty) return null;
    if (tenantsSnap.size === 1) return tenantsSnap.docs[0].id;

    const tenantChecks = await Promise.all(
        tenantsSnap.docs.map(async (tenantDoc) => {
            const tenantId = tenantDoc.id;
            const [configSnap, catalogSnap] = await Promise.all([
                adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').get(),
                adminDb.collection('tenants').doc(tenantId).collection('catalog').limit(1).get(),
            ]);

            const data = configSnap.data() || {};
            const businessName = String(data?.business?.name || '').toLowerCase();
            const siteName = String(data?.global?.siteName || '').toLowerCase();
            const isLunaTenant = businessName.includes('luna') || businessName.includes('conciergerie') || siteName.includes('luna');
            const hasCatalog = !catalogSnap.empty;
            const updatedAtMs = toMillis(data?.updatedAt) || toMillis(data?.createdAt) || toMillis(configSnap.updateTime);

            return { tenantId, isLunaTenant, hasCatalog, hasConfig: configSnap.exists, updatedAtMs };
        })
    );

    const lunaWithCatalog = pickMostRecent(tenantChecks.filter((t) => t.isLunaTenant && t.hasCatalog));
    if (lunaWithCatalog) return lunaWithCatalog.tenantId;

    const anyWithCatalog = pickMostRecent(tenantChecks.filter((t) => t.hasCatalog));
    if (anyWithCatalog) return anyWithCatalog.tenantId;

    const lunaWithConfig = pickMostRecent(tenantChecks.filter((t) => t.isLunaTenant && t.hasConfig));
    if (lunaWithConfig) return lunaWithConfig.tenantId;

    const anyWithConfig = pickMostRecent(tenantChecks.filter((t) => t.hasConfig));
    if (anyWithConfig) return anyWithConfig.tenantId;

    const lunaTenant = pickMostRecent(tenantChecks.filter((t) => t.isLunaTenant));
    if (lunaTenant) return lunaTenant.tenantId;

    return tenantsSnap.docs[0].id;
}

export async function GET(request: NextRequest) {
    try {
        const tenantId = await resolvePublicTenantId(request);
        if (!tenantId) {
            return NextResponse.json([]);
        }

        // 2. Fetch catalog items; fallback to legacy 'prestations' if needed
        let catalogSnap = await adminDb.collection('tenants').doc(tenantId).collection('catalog').get();
        if (catalogSnap.empty) {
            catalogSnap = await adminDb.collection('tenants').doc(tenantId).collection('prestations').get();
        }

        // 3. Map to public data format (hiding costs and margins!)
        const publicCatalog = catalogSnap.docs.map(doc => {
            const data = doc.data();
            const netCost = Number(data.netCost || 0);
            const recommendedMarkup = Number(data.recommendedMarkup || 0);
            const computedClientPrice = Math.round(netCost * (1 + recommendedMarkup / 100));
            const directClientPrice = Number(data.clientPrice);
            const clientPrice = Number.isFinite(directClientPrice) && directClientPrice > 0 ? directClientPrice : computedClientPrice;

            return {
                id: doc.id,
                type: data.type || 'OTHER',
                name: data.name || 'Prestation',
                location: data.location || '',
                description: data.description || '',
                clientPrice: clientPrice || 0,
                currency: data.currency || 'EUR',
                images: data.images || (data.imageUrl ? [data.imageUrl] : []),
                video: data.video || undefined,
                // DO NOT EXPOSE: netCost, recommendedMarkup, supplier emails/phones
            };
        }); // Show ALL catalog items, even those without images

        return NextResponse.json(publicCatalog, {
            headers: { 'x-tenant-id': tenantId },
        });
    } catch (error) {
        console.error('Error fetching public catalog:', error);
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            process.env.NODE_ENV === 'production'
                ? { error: 'Failed to fetch catalog' }
                : { error: 'Failed to fetch catalog', details },
            { status: 500 }
        );
    }
}
