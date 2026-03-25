export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/**
 * POST /api/signup/seed-demo
 * Seeds demo data for a new tenant to improve activation.
 * Called automatically after signup.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { tenantId } = await request.json();
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }

        // Verify the user owns this tenant
        if (tenantId !== auth.uid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const batch = adminDb.batch();
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // ═══ 1. DEMO CONTACTS ═══
        const contacts = [
            {
                firstName: 'Sophie', lastName: 'Martin',
                email: 'sophie.martin@example.com', phone: '+33 6 12 34 56 78',
                type: 'B2C', status: 'ACTIVE', vipLevel: 'VIP',
                tags: ['Famille', 'Luxe', 'Asie'],
                notes: 'Voyage en famille chaque été. Budget 15-25K. Préfère les suites.',
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                firstName: 'Jean-Pierre', lastName: 'Dubois',
                email: 'jp.dubois@enterprise.fr', phone: '+33 6 98 76 54 32',
                type: 'B2B', status: 'ACTIVE', vipLevel: 'Premium',
                tags: ['Corporate', 'Séminaire', 'Europe'],
                notes: 'Directeur commercial, organise 3-4 séminaires/an pour 20-50 personnes.',
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                firstName: 'Léa', lastName: 'Chen',
                email: 'lea.chen@gmail.com', phone: '+33 6 45 67 89 01',
                type: 'B2C', status: 'ACTIVE', vipLevel: 'Standard',
                tags: ['Couple', 'Aventure', 'Amérique du Sud'],
                notes: 'Lune de miel prévue en octobre. Budget 8-12K.',
                createdAt: new Date(), updatedAt: new Date(),
            },
        ];

        const contactIds: string[] = [];
        for (const contact of contacts) {
            const ref = tenantRef.collection('contacts').doc();
            batch.set(ref, contact);
            contactIds.push(ref.id);
        }

        // ═══ 2. DEMO SUPPLIERS ═══
        const suppliers = [
            {
                name: 'Ritz Paris', category: 'HÉBERGEMENT',
                city: 'Paris', country: 'France', rating: 5,
                phone: '+33 1 43 16 30 30', email: 'concierge@ritzparis.com',
                website: 'https://www.ritzparis.com', commission: 12,
                contactName: 'Marie Fontaine', notes: 'Suite Impériale disponible sur demande.',
                tags: ['Palace', 'Luxe', 'Paris'],
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                name: 'Aman Tokyo', category: 'HÉBERGEMENT',
                city: 'Tokyo', country: 'Japon', rating: 5,
                phone: '+81 3 5224 3333', email: 'reservation@aman.com',
                website: 'https://www.aman.com/tokyo', commission: 10,
                contactName: 'Yuki Tanaka', notes: 'Vue sur le palais impérial. Spa exceptionnel.',
                tags: ['Luxe', 'Japon', 'Design'],
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                name: 'Maison Pic', category: 'RESTAURATION',
                city: 'Valence', country: 'France', rating: 5,
                phone: '+33 4 75 44 15 32', email: 'info@pic-valence.com',
                website: 'https://www.anne-sophie-pic.com', commission: 8,
                contactName: 'Anne-Sophie Pic', notes: '3 étoiles Michelin. Menu dégustation 320€.',
                tags: ['Gastronomie', '3 étoiles', 'France'],
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                name: 'Tokyo Private Tours', category: 'GUIDE',
                city: 'Tokyo', country: 'Japon', rating: 4,
                phone: '+81 90 1234 5678', email: 'contact@tokyoprivatetours.com',
                commission: 15, contactName: 'Kenji Sato',
                notes: 'Guide francophone, spécialiste Tokyo et Kyoto. 450€/jour.',
                tags: ['Guide', 'Francophone', 'Japon'],
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                name: 'Star Alliance Transfers', category: 'TRANSFERT',
                city: 'Tokyo', country: 'Japon', rating: 4,
                phone: '+81 3 5555 0000', email: 'vip@startransfers.jp',
                commission: 10, contactName: 'Hiroshi Mori',
                notes: 'Transferts VIP avec Mercedes Classe S. Aéroport ↔ Hôtel 180€.',
                tags: ['Transfert', 'VIP', 'Japon'],
                createdAt: new Date(), updatedAt: new Date(),
            },
        ];

        for (const supplier of suppliers) {
            const ref = tenantRef.collection('suppliers').doc();
            batch.set(ref, supplier);
        }

        // ═══ 3. DEMO TRIP ═══
        const tripRef = tenantRef.collection('trips').doc();
        batch.set(tripRef, {
            name: 'Japon Impérial — 10 Jours',
            destination: 'Japon',
            clientId: contactIds[0],
            clientName: 'Sophie Martin',
            status: 'DRAFT',
            startDate: '2026-05-15',
            endDate: '2026-05-25',
            pax: 4,
            budget: 22000,
            currency: 'EUR',
            notes: 'Voyage famille avec 2 enfants (8 et 12 ans). Demande spéciale : cours de cuisine à Kyoto.',
            tags: ['Famille', 'Japon', 'Premium'],
            itinerary: [
                { day: 1, title: 'Tokyo — Arrivée', description: 'Accueil VIP aéroport Narita, transfert privé vers Aman Tokyo. Soirée libre dans Otemachi.' },
                { day: 2, title: 'Tokyo — Exploration', description: 'Visite guidée : Meiji, Harajuku, Shibuya. Déjeuner sushi Tsukiji. Shopping Ginza.' },
                { day: 3, title: 'Tokyo — Culture', description: 'Temple Senso-ji, Akihabara, TeamLab Borderless. Dîner kaiseki Ginza.' },
                { day: 4, title: 'Hakone — Onsen', description: 'Transfert Shinkansen. Croisière lac Ashi, musée en plein air, ryokan avec bain privé.' },
                { day: 5, title: 'Kyoto — Temples', description: 'Transfert TGV. Fushimi Inari, Kinkaku-ji. Check-in Four Seasons Kyoto.' },
                { day: 6, title: 'Kyoto — Artisanat', description: 'Atelier kimono, Arashiyama bambous, cours de cuisine japonaise.' },
                { day: 7, title: 'Nara — Excursion', description: 'Parc aux cerfs, temple Todai-ji, quartier Naramachi. Retour Kyoto.' },
                { day: 8, title: 'Osaka — Street Food', description: 'Transfert, château d\'Osaka, Dotonbori street food tour, Shinsekai.' },
                { day: 9, title: 'Osaka — Libre', description: 'Shopping, aquarium Kaiyukan, Universal Studios Japan (optionnel enfants).' },
                { day: 10, title: 'Osaka — Départ', description: 'Transfert aéroport Kansai, vol retour.' },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // ═══ 4. DEMO PIPELINE DEAL ═══
        const dealRef = tenantRef.collection('deals').doc();
        batch.set(dealRef, {
            title: 'Séminaire Toscane — Dubois Enterprise',
            clientId: contactIds[1],
            clientName: 'Jean-Pierre Dubois',
            stage: 'QUALIFIED',
            value: 45000,
            currency: 'EUR',
            probability: 60,
            destination: 'Toscane, Italie',
            type: 'B2B',
            notes: 'Séminaire 30 personnes, 4 nuits, château privatisé. Team building + gastronomie.',
            expectedCloseDate: '2026-04-30',
            tags: ['B2B', 'Séminaire', 'Italie'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // ═══ 5. DEMO TASK ═══
        const taskRef = tenantRef.collection('tasks').doc();
        batch.set(taskRef, {
            title: 'Envoyer proposition Toscane à J-P Dubois',
            description: 'Préparer le devis pour le séminaire Toscane (30 pax, 4 nuits) et l\'envoyer avant vendredi.',
            status: 'TODO',
            priority: 'HIGH',
            assignedTo: auth.uid,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            relatedDealId: dealRef.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            seeded: {
                contacts: contacts.length,
                suppliers: suppliers.length,
                trips: 1,
                deals: 1,
                tasks: 1,
            },
        });
    } catch (error: any) {
        console.error('[Seed Demo] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
