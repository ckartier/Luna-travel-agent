import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

export const dynamic = 'force-dynamic'; // Always serve fresh data from CRM catalog

export async function GET() {
    try {
        // 1. Find the primary tenant (assuming single-agency setup for now)
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No agency tenant found' }, { status: 404 });
        }

        const tenantId = tenantsSnap.docs[0].id;

        // 2. Fetch the catalog items from this tenant
        const catalogSnap = await adminDb.collection('tenants').doc(tenantId).collection('catalog').get();

        // 3. Map to public data format (hiding costs and margins!)
        const publicCatalog = catalogSnap.docs.map(doc => {
            const data = doc.data();
            const clientPrice = Math.round(data.netCost * (1 + (data.recommendedMarkup || 0) / 100));

            return {
                id: doc.id,
                type: data.type,
                name: data.name,
                location: data.location,
                description: data.description,
                clientPrice: clientPrice || 0,
                currency: data.currency || 'EUR',
                images: data.images || (data.imageUrl ? [data.imageUrl] : []),
                video: data.video || undefined,
                // DO NOT EXPOSE: netCost, recommendedMarkup, supplier emails/phones
            };
        }); // Show ALL catalog items, even those without images

        return NextResponse.json(publicCatalog);
    } catch (error) {
        console.error('Error fetching public catalog:', error);
        return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
    }
}
