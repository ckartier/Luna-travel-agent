import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// ═══ PRESTATIONS LUNE DMC (ce que Lune propose aux clients) ═══
const LUNE_PRESTATIONS = [
    { type: 'ACTIVITY', name: 'Itinéraire Sur-Mesure Europe', supplier: 'Lune DMC', location: 'Europe', description: 'Création d\'itinéraires sur-mesure reflétant les préférences uniques de chaque client. Fine dining, visites exclusives, activités immersives locales — chaque détail planifié et exécuté pour dépasser les attentes.', netCost: 500, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Expérience Gastronomique Privée', supplier: 'Lune DMC', location: 'France', description: 'Dîners privés dans des restaurants étoilés, dégustations de vins exclusives, cours de cuisine avec des chefs renommés. Une immersion culinaire personnalisée.', netCost: 350, recommendedMarkup: 35, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Visite Culturelle Guidée Premium', supplier: 'Lune DMC', location: 'Europe', description: 'Visites guidées privées de musées, monuments historiques et sites culturels avec des guides experts et accès prioritaire.', netCost: 200, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Excursion Nature & Aventure', supplier: 'Lune DMC', location: 'Scandinavie / Alpes', description: 'Randonnées privées, fjords, aurores boréales, ski de fond, kayak — des aventures en pleine nature encadrées par des guides locaux experts.', netCost: 280, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Journée Spa & Bien-être Luxe', supplier: 'Lune DMC', location: 'Europe', description: 'Journées complètes de détente dans les meilleurs spas européens, soins corporels haut de gamme, bains thermaux, yoga privé et programmes wellness personnalisés.', netCost: 400, recommendedMarkup: 25, currency: 'EUR' },
    { type: 'HOTEL', name: 'Réservation Palace & 5★', supplier: 'Lune DMC — Réseau Hôtelier', location: 'Europe', description: 'Accès exclusif aux meilleurs palaces et hôtels 5 étoiles à travers l\'Europe. Tarifs négociés, surclassements, late check-out et avantages VIP.', netCost: 600, recommendedMarkup: 20, currency: 'EUR' },
    { type: 'HOTEL', name: 'Boutique Hôtel de Charme', supplier: 'Lune DMC — Réseau Hôtelier', location: 'Europe', description: 'Sélection de boutique hôtels de charme avec caractère unique : maisons de maître, riads, châteaux et demeures historiques.', netCost: 300, recommendedMarkup: 25, currency: 'EUR' },
    { type: 'HOTEL', name: 'Villa Privée avec Services', supplier: 'Lune DMC — Réseau Hôtelier', location: 'Méditerranée / Côte d\'Azur', description: 'Villas privées haut de gamme avec chef cuisinier, majordome, piscine privée et conciergerie dédiée.', netCost: 1200, recommendedMarkup: 20, currency: 'EUR' },
    { type: 'TRANSFER', name: 'Transfert Aéroport VIP', supplier: 'Lune DMC — Transport', location: 'Europe', description: 'Service de transfert aéroport en berline de luxe ou van premium. Chauffeur professionnel, accueil personnalisé à l\'arrivée.', netCost: 120, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'TRANSFER', name: 'Chauffeur Privé à la Journée', supplier: 'Lune DMC — Transport', location: 'Europe', description: 'Chauffeur privé à disposition toute la journée en Mercedes Classe S, BMW Série 7 ou SUV de luxe.', netCost: 450, recommendedMarkup: 25, currency: 'EUR' },
    { type: 'TRANSFER', name: 'Location Véhicule de Luxe', supplier: 'Lune DMC — Transport', location: 'Europe', description: 'Location de véhicules de prestige (Porsche, Range Rover, Tesla Model X) avec livraison à l\'hôtel.', netCost: 350, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'OTHER', name: 'Conciergerie Complète Voyage', supplier: 'Lune DMC — Concierge', location: 'Europe', description: 'Service de conciergerie tout inclus : restaurants, spectacles, événements exclusifs, shopping personnel, interlocuteur dédié 24/7.', netCost: 250, recommendedMarkup: 35, currency: 'EUR' },
    { type: 'OTHER', name: 'Réservation Restaurant Étoilé', supplier: 'Lune DMC — Concierge', location: 'France / Europe', description: 'Accès aux tables les plus prisées d\'Europe, restaurants étoilés Michelin, menus dégustation personnalisés, accords mets-vins.', netCost: 80, recommendedMarkup: 25, currency: 'EUR' },
    { type: 'OTHER', name: 'Organisation Événement Privé', supplier: 'Lune DMC — Concierge', location: 'Europe', description: 'Organisation d\'événements privés : anniversaires, demandes en mariage, célébrations en famille.', netCost: 800, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'FLIGHT', name: 'Billet Business Class Europe', supplier: 'Lune DMC — Aérien', location: 'Europe', description: 'Billets en classe affaires sur Air France, KLM, Lufthansa, Swiss. Salon VIP, embarquement prioritaire.', netCost: 900, recommendedMarkup: 15, currency: 'EUR' },
    { type: 'FLIGHT', name: 'Vol Privé / Jet Charter', supplier: 'Lune DMC — Aérien', location: 'Europe', description: 'Organisation de vols privés et charters à travers l\'Europe. Flexibilité totale, terminal privé, service sur-mesure.', netCost: 5000, recommendedMarkup: 15, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Accompagnateur Local Francophone', supplier: 'Lune DMC', location: 'Europe', description: 'Guide accompagnateur francophone présent sur site pendant tout le séjour. Assistance 24h/24, gestion des imprévus.', netCost: 300, recommendedMarkup: 30, currency: 'EUR' },
    { type: 'ACTIVITY', name: 'Pack Lune de Miel / Romantique', supplier: 'Lune DMC', location: 'Europe', description: 'Forfait romantique incluant champagne, dîner aux chandelles, massage duo, excursion privée, suite junior avec vue.', netCost: 700, recommendedMarkup: 25, currency: 'EUR' },
];

// ═══ PRESTATAIRES — PALACES PARIS (fournisseurs externes avec concierge) ═══
const PALACE_SUPPLIERS = [
    { name: 'Le Bristol Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris', phone: '+33 1 53 43 43 00', email: 'concierge.lebristolparis@oetkercollection.com', contactName: 'Jean-Marie Burlet (Chef Concierge)', website: 'https://www.oetkercollection.com/fr/hotels/le-bristol-paris/', notes: 'Palace iconique du Faubourg Saint-Honoré. Restaurant 3 étoiles Epicure, spa, jardin intérieur, piscine rooftop. Clés d\'Or.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Gastronomie'] },
    { name: 'Hôtel de Crillon', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '10 Place de la Concorde, 75008 Paris', phone: '+33 1 44 71 15 00', email: 'crillon.concierge@rosewoodhotels.com', contactName: 'Frédéric Cassel (Chef Concierge)', website: 'https://www.rosewoodhotels.com/en/hotel-de-crillon', notes: 'Palace historique Place de la Concorde. Suites avec vue, spa Sense, restaurant L\'Ecrin étoilé, bar Les Ambassadeurs.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Historique'] },
    { name: 'Plaza Athénée', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '25 Avenue Montaigne, 75008 Paris', phone: '+33 1 53 67 66 65', email: 'concierge.HPA@dorchestercollection.com', contactName: 'Pascal de Joffrey (Chef Concierge)', website: 'https://www.dorchestercollection.com/paris/hotel-plaza-athenee', notes: 'Avenue Montaigne, cœur de la haute couture. Restaurant Alain Ducasse, Dior Institut Spa, terrasse emblématique.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Mode', 'Gastronomie'] },
    { name: 'La Réserve Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '42 Avenue Gabriel, 75008 Paris', phone: '+33 1 58 36 60 60', email: 'concierge@lareserve-paris.com', contactName: 'Marie France Gregoire (Chef Concierge)', website: 'https://www.lareserve-paris.com', notes: 'Hôtel particulier de 40 suites entre Palais de l\'Élysée et Champs-Élysées. Spa Nescens, restaurant Le Gabriel étoilé.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Intime'] },
    { name: 'Le Meurice', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '228 Rue de Rivoli, 75001 Paris', phone: '+33 1 44 58 10 10', email: 'concierge.LMP@dorchestercollection.com', contactName: 'Jean-Sébastien Leguay (Chef Concierge)', website: 'https://www.dorchestercollection.com/paris/le-meurice', notes: 'Face aux Tuileries, décor Louis XVI revisité par Philippe Starck. Restaurant Alain Ducasse 2 étoiles, Bar 228.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 1er', 'Art', 'Design'] },
    { name: 'Mandarin Oriental Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '251 Rue Saint-Honoré, 75001 Paris', phone: '+33 1 70 98 78 88', email: 'mopar-concierge@mohg.com', contactName: 'Jerome Poret (Chef Concierge)', website: 'https://www.mandarinoriental.com/paris', notes: 'Art déco contemporain au cœur de la rue Saint-Honoré. Spa de 900m², restaurant Camélia, jardin intérieur.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 1er', 'Spa', 'Contemporain'] },
    { name: 'Park Hyatt Paris-Vendôme', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '5 Rue de la Paix, 75002 Paris', phone: '+33 1 58 71 12 34', email: 'paris.vendome@hyatt.com', contactName: 'Dominique Guidetti (Chef Concierge)', website: 'https://www.hyatt.com/park-hyatt/parpa-park-hyatt-paris-vendome', notes: 'Design d\'Ed Tuttle entre Place Vendôme et Opéra. Spa, restaurant Pur\' — Jean-François Rouquette.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 2ème', 'Design'] },
    { name: 'The Peninsula Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '19 Avenue Kléber, 75116 Paris', phone: '+33 1 58 12 28 88', email: 'ppr@peninsula.com', contactName: 'Bastien Lalanne (Chef Concierge)', website: 'https://www.peninsula.com/fr/paris', notes: 'Près de l\'Arc de Triomphe, toit-terrasse vue 360°. L\'Oiseau Blanc restaurant rooftop, spa, piscine intérieure.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 16ème', 'Rooftop', 'Vue'] },
    { name: 'Le Royal Monceau', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '37 Avenue Hoche, 75008 Paris', phone: '+33 1 42 99 88 00', email: 'concierge.paris@raffles.com', contactName: 'Daisuké Kimura (Chef Concierge)', website: 'https://www.raffles.com/paris', notes: 'Palace arty redesigné par Philippe Starck. Cinéma privé, galerie d\'art, spa Clarins 1500m², restaurant Il Carpaccio.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Art', 'Cinéma'] },
    { name: 'Shangri-La Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '10 Avenue d\'Iéna, 75116 Paris', phone: '+33 1 53 67 19 98', email: 'concierge.slpr@shangri-la.com', contactName: 'Tony Le Goff (Chef Concierge)', website: 'https://www.shangri-la.com/paris', notes: 'Ancien palais du Prince Roland Bonaparte avec vue Tour Eiffel. Restaurant L\'Abeille étoilé, Shang Palace cuisine cantonaise.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 16ème', 'Vue Eiffel', 'Asiatique'] },
    { name: 'Ritz Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '15 Place Vendôme, 75001 Paris', phone: '+33 1 43 16 30 30', email: 'concierge@ritzparis.com', contactName: 'Jean-Marie Burlet (Chef Concierge)', website: 'https://www.ritzparis.com', notes: 'Le palace mythique de la Place Vendôme. Bar Hemingway, L\'Espadon, Chanel au Ritz Spa, école Ritz Escoffier.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 1er', 'Mythique', 'Hemingway'] },
    { name: 'Four Seasons George V', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '31 Avenue George V, 75008 Paris', phone: '+33 1 49 52 70 00', email: 'concierge.paris@fourseasons.com', contactName: 'Philippe Verdumo (Chef Concierge)', website: 'https://www.fourseasons.com/paris', notes: 'Triangle d\'or, 3 restaurants étoilés (Le Cinq, Le George, L\'Orangerie). Spa, art floral spectaculaire de Jeff Leatham.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Gastronomie', '3 étoilés'] },
    { name: 'Hôtel Lutetia', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '45 Boulevard Raspail, 75006 Paris', phone: '+33 1 49 54 46 46', email: 'concierge@hotellutetia.com', contactName: 'Olivier Heitz (Chef Concierge)', website: 'https://www.hotellutetia.com', notes: 'Seul palace rive gauche, style Art déco magnifiquement restauré. Brasserie Lutetia, Bar Joséphine, Akasha Spa.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 6ème', 'Art Déco', 'Rive Gauche'] },
    { name: 'Cheval Blanc Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '8 Quai du Louvre, 75001 Paris', phone: '+33 1 40 28 00 00', email: 'concierge.paris@chevalblanc.com', contactName: 'Margaux Médeau (Chef Concierge)', website: 'https://www.chevalblanc.com/paris', notes: 'Dernier-né des palaces, face au Pont Neuf. Piscine 30m, spa Dior, restaurant Plénitude par Arnaud Donckele 3 étoiles.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 1er', 'LVMH', 'Contemporain'] },
];

async function findTenantId() {
    const tenantsSnap = await adminDb.collection('tenants').get();
    for (const doc of tenantsSnap.docs) {
        const contactsSnap = await adminDb.collection('tenants').doc(doc.id).collection('contacts').limit(1).get();
        if (!contactsSnap.empty) return doc.id;
    }
    return tenantsSnap.docs.length > 0 ? tenantsSnap.docs[0].id : null;
}

export async function GET(req: Request) {
    try {
        // Auth check — prevent unauthorized catalog seeding
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        const tenantId = await findTenantId();
        if (!tenantId) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

        // 1) Clear ALL existing catalog items (previous bad seed)
        const oldCatalog = await adminDb.collection('tenants').doc(tenantId).collection('catalog').get();
        const deleteBatch = adminDb.batch();
        oldCatalog.docs.forEach(d => deleteBatch.delete(d.ref));
        if (oldCatalog.docs.length > 0) await deleteBatch.commit();

        // 2) Seed PRESTATIONS into catalog
        const batch1 = adminDb.batch();
        const catalogCol = adminDb.collection('tenants').doc(tenantId).collection('catalog');
        const now = new Date();
        for (const item of LUNE_PRESTATIONS) {
            batch1.set(catalogCol.doc(), { ...item, createdAt: now, updatedAt: now });
        }
        await batch1.commit();

        // 3) Seed SUPPLIERS (palaces) into suppliers
        const batch2 = adminDb.batch();
        const suppliersCol = adminDb.collection('tenants').doc(tenantId).collection('suppliers');

        // Check for existing suppliers to avoid duplicates
        const existingSuppliers = await suppliersCol.get();
        const existingNames = new Set(existingSuppliers.docs.map(d => d.data().name));

        let addedSuppliers = 0;
        for (const supplier of PALACE_SUPPLIERS) {
            if (!existingNames.has(supplier.name)) {
                batch2.set(suppliersCol.doc(), { ...supplier, isFavorite: true, currency: 'EUR', createdAt: now, updatedAt: now });
                addedSuppliers++;
            }
        }
        if (addedSuppliers > 0) await batch2.commit();

        return NextResponse.json({
            success: true,
            tenantId,
            catalogCleared: oldCatalog.docs.length,
            prestationsCreated: LUNE_PRESTATIONS.length,
            suppliersCreated: addedSuppliers,
            suppliersSkipped: PALACE_SUPPLIERS.length - addedSuppliers,
            message: `✅ ${LUNE_PRESTATIONS.length} prestations Lune → Catalog | ${addedSuppliers} palaces Paris → Suppliers`
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
