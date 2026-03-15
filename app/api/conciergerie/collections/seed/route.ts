import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
        }
        const tenantId = tenantsSnap.docs[0].id;
        const colRef = adminDb.collection('tenants').doc(tenantId).collection('collections');

        // Check if already seeded
        const existing = await colRef.limit(1).get();
        if (!existing.empty) {
            return NextResponse.json({ message: 'Collections already seeded', count: (await colRef.get()).size });
        }

        const seedData = [
            {
                name: 'Tanzanie Safari VIP',
                date: '12 – 20 Août 2026',
                location: 'Tanzanie',
                description: "Expédition privée au cœur du Serengeti avec lodges exclusifs et survols en montgolfière.",
                images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1200'],
                order: 0,
            },
            {
                name: 'Retraite Mykonos',
                date: '02 – 09 Sept 2026',
                location: 'Grèce',
                description: "Villa design face à la mer Égée, avec chef privé, yoga au coucher du soleil.",
                images: ['https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?q=80&w=1200'],
                order: 1,
            },
            {
                name: 'Japon Ancestral',
                date: '15 – 28 Oct 2026',
                location: 'Japon',
                description: "Ryokans cinq étoiles, rencontres avec des maîtres artisans et immersion culturelle absolue.",
                images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200'],
                order: 2,
            },
            {
                name: 'Hollande / Norvège',
                date: '15 – 26 Fév 2026',
                location: 'Europe du Nord',
                description: "Aurores boréales, fjords majestueux et aventure en traîneau privé.",
                images: ['/images/Hollande%20Norveige1.png', '/images/Hollande%20Norveige2.png', '/images/Hollande%20Norveige3.png'],
                video: '/images/Hollande%20Norveige.mp4?v=2',
                order: 3,
            },
        ];

        const batch = adminDb.batch();
        for (const item of seedData) {
            const ref = colRef.doc();
            batch.set(ref, { ...item, createdAt: new Date(), updatedAt: new Date() });
        }
        await batch.commit();

        return NextResponse.json({ message: 'Seeded 4 collections', count: 4 });
    } catch (error) {
        console.error('Seed collections error:', error);
        return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
    }
}
