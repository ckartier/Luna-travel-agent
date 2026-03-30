import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

export const dynamic = 'force-dynamic';

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
            const [configSnap, collectionsSnap] = await Promise.all([
                adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').get(),
                adminDb.collection('tenants').doc(tenantId).collection('collections').limit(1).get(),
            ]);

            const data = configSnap.data() || {};
            const businessName = String(data?.business?.name || '').toLowerCase();
            const siteName = String(data?.global?.siteName || '').toLowerCase();
            const isLunaTenant = businessName.includes('luna') || businessName.includes('conciergerie') || siteName.includes('luna');
            const hasCollections = !collectionsSnap.empty;
            const updatedAtMs = toMillis(data?.updatedAt) || toMillis(data?.createdAt) || toMillis(configSnap.updateTime);

            return { tenantId, isLunaTenant, hasCollections, hasConfig: configSnap.exists, updatedAtMs };
        })
    );

    const lunaWithCollections = pickMostRecent(tenantChecks.filter((t) => t.isLunaTenant && t.hasCollections));
    if (lunaWithCollections) return lunaWithCollections.tenantId;

    const anyWithCollections = pickMostRecent(tenantChecks.filter((t) => t.hasCollections));
    if (anyWithCollections) return anyWithCollections.tenantId;

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

        const collectionsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('collections')
            .orderBy('order', 'asc')
            .get();

        const collections = collectionsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                date: data.date,
                location: data.location,
                description: data.description,
                images: data.images || [],
                video: data.video || null,
                order: data.order ?? 0,
            };
        });

        return NextResponse.json(collections, {
            headers: { 'x-tenant-id': tenantId },
        });
    } catch (error) {
        console.error('Error fetching public collections:', error);
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            process.env.NODE_ENV === 'production'
                ? { error: 'Failed to fetch collections' }
                : { error: 'Failed to fetch collections', details },
            { status: 500 }
        );
    }
}
