import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No agency tenant found' }, { status: 404 });
        }

        const tenantId = tenantsSnap.docs[0].id;

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

        return NextResponse.json(collections);
    } catch (error) {
        console.error('Error fetching public collections:', error);
        return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }
}
