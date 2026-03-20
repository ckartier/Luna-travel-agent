/**
 * SEED CATALOG — LUNE PARIS 2026 BROCHURE
 * Usage: npx tsx scripts/seed-catalog.ts
 * 
 * Clears all existing catalog + prestations and seeds 40 experiences from the PDF brochure.
 */
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
    let pk = process.env.FIREBASE_PRIVATE_KEY || '';
    if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
        try { pk = Buffer.from(pk, 'base64').toString('utf8'); } catch (e) {}
    } else {
        if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.substring(1, pk.length - 1);
        pk = pk.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: pk,
        }),
    });
}

const db = admin.firestore();

const LUNE_PRESTATIONS = [
    // ── Guided Tours & Cultural Must-Sees ──
    { type: 'ACTIVITY', name: 'Visite Guidée Musées & Monuments', supplier: 'Lune DMC', location: 'Paris', description: 'Visite privée au Louvre, Musée d\'Orsay, Arc de Triomphe, Sainte-Chapelle, L\'Orangerie, Fondation LV, etc. Guide agréé, billets inclus.', netCost: 539, recommendedMarkup: 11, currency: 'EUR', duration: '~2h', capacity: '1-8 pers', remarks: 'Nous pouvons adapter toutes nos visites aux enfants ! Optez pour une visite du Louvre avec une chasse au trésor ludique.' },
    { type: 'ACTIVITY', name: 'Tour Eiffel Sommet — Visite Privée', supplier: 'Lune DMC', location: 'Paris', description: 'Visite guidée privée du sommet de la Tour Eiffel, incluant accès prioritaire ascenseur et billets.', netCost: 485, recommendedMarkup: 11, currency: 'EUR', duration: '2h', capacity: '1-8 pers' },
    { type: 'ACTIVITY', name: 'Notre-Dame — Visite Privée', supplier: 'Lune DMC', location: 'Paris', description: 'Visite privée de Notre-Dame avec guide agréé et accès prioritaire.', netCost: 413, recommendedMarkup: 11, currency: 'EUR', duration: '~1h30', capacity: '1-5 pers' },
    { type: 'ACTIVITY', name: 'City Tour en Voiture Premium', supplier: 'Lune DMC', location: 'Paris', description: 'Explorez Paris avec un guide agréé dans un véhicule premium. Berline de luxe pour 1-3 personnes, Van luxe pour 1-6 personnes.', netCost: 692, recommendedMarkup: 11, currency: 'EUR', duration: '3h-7h', capacity: '1-6 pers', remarks: 'Véhicule Luxury Sedan 1-3 pers, Luxury Van 1-6 pers.' },
    { type: 'ACTIVITY', name: 'Tour Paris en 2CV Vintage', supplier: 'Lune DMC', location: 'Paris', description: 'Découvrez Paris dans une iconique 2CV vintage avec un guide local.', netCost: 206, recommendedMarkup: 11, currency: 'EUR', duration: '2h-7h', capacity: '1-3 pers/voiture', remarks: 'Tarifs par voiture. Options extras : champagne, macarons, bouquet de fleurs, photographe.' },
    { type: 'ACTIVITY', name: 'Paris à Pied — Balade Guidée', supplier: 'Lune DMC', location: 'Paris', description: 'Découvrez le Marais, Montmartre, Saint-Germain-des-Prés ou le Quartier Latin avec un guide agréé. Pause gourmande incluse.', netCost: 449, recommendedMarkup: 11, currency: 'EUR', duration: '2h30', capacity: '1-5 pers' },
    { type: 'ACTIVITY', name: 'Tour Rétro en Side-Car', supplier: 'Lune DMC', location: 'Paris', description: 'Tour en side-car (jusqu\'à 2 passagers par véhicule) pour découvrir les highlights iconiques de Paris.', netCost: 269, recommendedMarkup: 11, currency: 'EUR', duration: '1h30', capacity: '1-2 pers/véhicule', remarks: 'Tarifs par véhicule.' },
    { type: 'ACTIVITY', name: 'Bike Tour Privé à Paris', supplier: 'Lune DMC', location: 'Paris', description: 'Tour privé à vélo pour visiter les sites les plus iconiques de Paris.', netCost: 608, recommendedMarkup: 11, currency: 'EUR', duration: '4h', capacity: '1-8 pers' },
    { type: 'ACTIVITY', name: 'Versailles — Demi-Journée Privée', supplier: 'Lune DMC', location: 'Paris → Versailles', description: 'Transfert privé A/R depuis votre hôtel Paris, entrée coupe-file, visite guidée privée du château et des jardins avec guide agréé.', netCost: 674, recommendedMarkup: 11, currency: 'EUR', duration: '4h', capacity: '1-7 pers', remarks: 'Enrichissez votre visite avec un pique-nique dans les jardins de Versailles, un tour à vélo ou une barque privée sur le Grand Canal.' },

    // ── Culinary Tours & Food Experiences ──
    { type: 'ACTIVITY', name: 'Marais Pastry Tour', supplier: 'Lune DMC', location: 'Paris — Le Marais', description: 'Balade guidée avec un guide local, dégustation de pâtisseries françaises classiques en explorant le Marais.', netCost: 404, recommendedMarkup: 11, currency: 'EUR', duration: '~2h', capacity: '1-6 pers', remarks: 'Non recommandé les lundis.' },
    { type: 'ACTIVITY', name: 'Montmartre Food Tour', supplier: 'Lune DMC', location: 'Paris — Montmartre', description: 'Visite guidée à pied avec un guide local, dégustation de spécialités locales à Montmartre.', netCost: 404, recommendedMarkup: 11, currency: 'EUR', duration: '~2h', capacity: '1-6 pers', remarks: 'Non recommandé les lundis.' },
    { type: 'ACTIVITY', name: 'Pique-nique Parisien — Tour Eiffel', supplier: 'Lune DMC', location: 'Paris', description: 'Pique-nique français élégant dans des lieux iconiques : Tour Eiffel, Parc de Bagatelle ou Parc Monceau. Fromages artisanaux, charcuterie, baguettes, champagne ou vin fin.', netCost: 494, recommendedMarkup: 11, currency: 'EUR', duration: '1h30-3h', capacity: '1-7 pers', remarks: 'Anniversaire, demande en mariage ? Nous personnalisons votre pique-nique.' },
    { type: 'ACTIVITY', name: 'Cours de Cuisine Française + Marché', supplier: 'Lune DMC', location: 'Paris', description: 'Cours de cuisine mains dans la pâte, visite au marché local. Techniques pour Coq au Vin ou Bœuf Bourguignon. Repas 3 plats servi avec vins.', netCost: 242, recommendedMarkup: 11, currency: 'EUR', duration: '6h', capacity: 'par personne (max 12)' },
    { type: 'ACTIVITY', name: 'Atelier Macarons', supplier: 'Lune DMC', location: 'Paris', description: 'Apprenez à confectionner de délicats macarons français avec un chef professionnel. Meringue, macaronage et garnitures. Tea time inclus + boîte à emporter.', netCost: 149, recommendedMarkup: 11, currency: 'EUR', duration: '3h', capacity: 'par personne', remarks: 'Dès 12 ans. Option de privatisation pour enfants plus jeunes (supplément).' },
    { type: 'ACTIVITY', name: 'Dégustation de Vins Privée', supplier: 'Lune DMC', location: 'Paris', description: 'Dégustation avec sommelier professionnel. Six vins dont un Champagne, accompagnés de fromages et charcuterie dans un espace privé.', netCost: 135, recommendedMarkup: 11, currency: 'EUR', duration: '2h', capacity: '1-6 pers', remarks: 'Vins disponibles à l\'achat après la dégustation.' },
    { type: 'ACTIVITY', name: 'Atelier Gin — Distillerie Artisanale', supplier: 'Lune DMC', location: 'Paris', description: 'Atelier gin dans une distillerie artisanale. Guidé par un sommelier, découverte de la distillation. Création de votre propre bouteille 70cl personnalisée.', netCost: 200, recommendedMarkup: 11, currency: 'EUR', duration: '~3h', capacity: '1-8 pers' },

    // ── Seine River Experiences ──
    { type: 'ACTIVITY', name: 'Croisière Seine — The', supplier: 'Lune DMC', location: 'Paris — Seine', description: 'Croisière privée de 1h30 sur la Seine, vue panoramique. Vin rosé et macarons inclus.', netCost: 719, recommendedMarkup: 11, currency: 'EUR', duration: '1h30', capacity: '1-6 pers' },
    { type: 'ACTIVITY', name: 'Croisière Seine — The Limousine', supplier: 'Lune DMC', location: 'Paris — Seine', description: 'Croisière privée de 1h30, vue panoramique. Champagne et macarons inclus.', netCost: 1125, recommendedMarkup: 11, currency: 'EUR', duration: '1h30', capacity: '1-8 pers' },
    { type: 'ACTIVITY', name: 'Croisière Seine — Cocktail Cruise', supplier: 'Lune DMC', location: 'Paris — Seine', description: 'Croisière cocktail avec options gastronomiques sucrées ou salées. Champagne vintage inclus.', netCost: 1349, recommendedMarkup: 11, currency: 'EUR', duration: '2h', capacity: '1-12 pers' },
    { type: 'ACTIVITY', name: 'Croisière Seine Premium Privée', supplier: 'Lune DMC', location: 'Paris — Seine', description: 'Croisière bateau premium avec espace intérieur. Champagne vintage, macarons et amuse-bouches inclus.', netCost: 1259, recommendedMarkup: 11, currency: 'EUR', duration: '1h30', capacity: '1-12 pers' },
    { type: 'ACTIVITY', name: 'Croisière Seine — Déjeuner ou Dîner', supplier: 'Lune DMC', location: 'Paris — Seine', description: 'Croisière privée déjeuner ou dîner. Parfait pour une demande en mariage, un dîner en famille ou une soirée spéciale.', netCost: 0, recommendedMarkup: 11, currency: 'EUR', duration: '2-4h', capacity: 'jusqu\'à 12 pers', remarks: 'Prix sur demande.' },

    // ── Day Trips & Excursions ──
    { type: 'ACTIVITY', name: 'Excursion Champagne — 2 Domaines', supplier: 'Lune DMC', location: 'Paris → Champagne', description: 'Visite de deux domaines (Mumm/Pommery + petit producteur), dégustations, Cathédrale de Reims, village Dom Pérignon. Transport A/R inclus.', netCost: 1322, recommendedMarkup: 11, currency: 'EUR', duration: '10h', capacity: '1-7 pers' },
    { type: 'ACTIVITY', name: 'Excursion Champagne Premium', supplier: 'Lune DMC', location: 'Paris → Champagne', description: 'Journée ultime en Champagne : visites privées chez Moët & Chandon, Dom Pérignon, Veuve Clicquot ou Taittinger.', netCost: 0, recommendedMarkup: 11, currency: 'EUR', duration: '10h', capacity: '1-7 pers', remarks: 'Prix sur demande.' },
    { type: 'ACTIVITY', name: 'Excursion Loire Valley', supplier: 'Lune DMC', location: 'Paris → Loire Valley', description: 'Journée privée vallée de la Loire avec guide et transport luxe A/R. Châteaux de Chambord et Cheverny, Blois, dégustation de vins.', netCost: 1349, recommendedMarkup: 11, currency: 'EUR', duration: '10h', capacity: '1-7 pers' },
    { type: 'ACTIVITY', name: 'Excursion Mont-Saint-Michel', supplier: 'Lune DMC', location: 'Paris → Mont-Saint-Michel', description: 'Visite guidée privée du Mont-Saint-Michel et son abbaye médiévale. Transport A/R et billets inclus.', netCost: 1475, recommendedMarkup: 11, currency: 'EUR', duration: '10h', capacity: '1-7 pers', remarks: 'Option équitation ou visite guidée de la baie.' },
    { type: 'ACTIVITY', name: 'Excursion Normandie D-Day', supplier: 'Lune DMC', location: 'Paris → Normandie', description: 'Journée privée D-Day avec guide certifié et transport A/R. Mémorial de Caen, Omaha Beach, Pointe du Hoc, Cimetière américain.', netCost: 1436, recommendedMarkup: 11, currency: 'EUR', duration: '10h', capacity: '1-7 pers', remarks: 'Option tour en Jeep ou pique-nique déjeuner.' },
    { type: 'ACTIVITY', name: 'Excursion Versailles + Giverny', supplier: 'Lune DMC', location: 'Paris → Versailles → Giverny', description: 'Journée privée Château de Versailles et Fondation Monet à Giverny. Guide expert et transport A/R.', netCost: 1259, recommendedMarkup: 11, currency: 'EUR', duration: '8h', capacity: '1-7 pers', remarks: 'Option déjeuner aux Jardins des Plumes ou pique-nique à Versailles.' },
    { type: 'ACTIVITY', name: 'Excursion Vaux-le-Vicomte + Fontainebleau', supplier: 'Lune DMC', location: 'Paris → Fontainebleau', description: 'Visite guidée privée Châteaux de Fontainebleau et Vaux-le-Vicomte. Transfert A/R, entrée coupe-file.', netCost: 1259, recommendedMarkup: 11, currency: 'EUR', duration: '8h', capacity: '1-7 pers' },
    { type: 'ACTIVITY', name: 'Excursion Château de Chantilly', supplier: 'Lune DMC', location: 'Paris → Chantilly', description: 'Visite guidée privée du Château de Chantilly et ses jardins. Transfert privé A/R.', netCost: 719, recommendedMarkup: 11, currency: 'EUR', duration: '4h', capacity: '1-7 pers', remarks: 'Option pique-nique royal ou balade à cheval en forêt de Chantilly.' },
    { type: 'ACTIVITY', name: 'Excursion Bruges — Journée Complète', supplier: 'Lune DMC', location: 'Paris → Bruges', description: 'Transport A/R, visite guidée à pied 2h, montée au Beffroi et croisière sur les canaux.', netCost: 1436, recommendedMarkup: 11, currency: 'EUR', duration: '12h', capacity: '1-7 pers', remarks: 'Options : nuit sur place, dégustation chocolat/bière, atelier gaufres.' },
    { type: 'ACTIVITY', name: 'Excursion Bruxelles — Journée Complète', supplier: 'Lune DMC', location: 'Paris → Bruxelles', description: 'Transfert + train grande vitesse A/R. Visite guidée à pied 2h, déjeuner, visite Musée Magritte ou Musées royaux.', netCost: 0, recommendedMarkup: 11, currency: 'EUR', duration: '~14h', capacity: '1-7 pers', remarks: 'Prix sur demande.' },
    { type: 'ACTIVITY', name: 'Excursion Amsterdam — Journée Complète', supplier: 'Lune DMC', location: 'Paris → Amsterdam', description: 'Train grande vitesse, tour vélo, visite Rijksmuseum/Van Gogh, croisière canal. Meet & greet retour.', netCost: 0, recommendedMarkup: 11, currency: 'EUR', duration: '~16h', capacity: '1-10 pers', remarks: 'Prix sur demande.' },
    { type: 'ACTIVITY', name: 'Excursion Londres — Journée Complète', supplier: 'Lune DMC', location: 'Paris → London', description: 'Transfert + Eurostar A/R. Visite guidée à pied des highlights de Londres.', netCost: 0, recommendedMarkup: 11, currency: 'EUR', duration: '~16h', capacity: '1-10 pers', remarks: 'Prix sur demande.' },

    // ── Fashion & Shopping ──
    { type: 'ACTIVITY', name: 'Marché aux Puces de Saint-Ouen', supplier: 'Lune DMC', location: 'Paris — Saint-Ouen', description: 'Explorez le marché aux puces avec un guide privé, découvrez des trésors cachés et des pièces vintage.', netCost: 566, recommendedMarkup: 11, currency: 'EUR', duration: '2.5-3h', capacity: '1-7 pers' },
    { type: 'ACTIVITY', name: 'Galerie Dior — Visite Privée', supplier: 'Lune DMC', location: 'Paris', description: 'Visite privée de la Galerie Dior avec un expert guide.', netCost: 495, recommendedMarkup: 11, currency: 'EUR', duration: '~2h', capacity: '1-8 pers' },
    { type: 'ACTIVITY', name: 'Luxury Vintage Shopping Experience', supplier: 'Lune DMC', location: 'Paris — Marais / Saint-Germain', description: 'Expérience privée 3h : meilleur du vintage designer Chanel, Hermès, Dior, YSL dans des boutiques exclusives.', netCost: 566, recommendedMarkup: 11, currency: 'EUR', duration: '2.5-3h', capacity: '1-7 pers' },
    { type: 'ACTIVITY', name: 'Samaritaine VIP Lounge — Styling Privé', supplier: 'Lune DMC', location: 'Paris — La Samaritaine', description: 'Session de styling privée dans le VIP Lounge de La Samaritaine. Champagne, sélections personnalisées, guidance experte.', netCost: 495, recommendedMarkup: 11, currency: 'EUR', duration: '3-4h', capacity: '1 pers' },
    { type: 'ACTIVITY', name: 'Expérience Shopping Parisienne', supplier: 'Lune DMC', location: 'Paris', description: 'Boutiques cachées et designers français émergents. Itinéraire personnalisé avec analyse street-style.', netCost: 585, recommendedMarkup: 11, currency: 'EUR', duration: '6h', capacity: '1 pers' },

    // ── Transport ──
    { type: 'TRANSFER', name: 'Transfert Aéroport CDG', supplier: 'Lune DMC — Transport', location: 'Paris — CDG', description: 'Accueil en zone d\'arrivée avec panneau nominatif et transfert direct vers votre hôtel. Mercedes E (1-3p) ou V (1-7p).', netCost: 134, recommendedMarkup: 11, currency: 'EUR', pricingMode: 'ONE_WAY', oneWayPrice: 134, duration: '~1h', capacity: '1-7 pers', remarks: 'Mercedes E 1-3p (€149), Mercedes V 1-7p (€189).' },
    { type: 'TRANSFER', name: 'Transfert Gare', supplier: 'Lune DMC — Transport', location: 'Paris', description: 'Accueil en gare avec panneau nominatif et transfert direct vers votre hôtel. Mercedes E (1-3p) ou V (1-7p).', netCost: 77, recommendedMarkup: 11, currency: 'EUR', pricingMode: 'ONE_WAY', oneWayPrice: 77, duration: '~1h', capacity: '1-7 pers', remarks: 'Mercedes E 1-3p (€85), Mercedes V 1-7p (€110).' },
];

async function main() {
    // Find first tenant
    const tenantsSnap = await db.collection('tenants').get();
    if (tenantsSnap.empty) { console.error('❌ No tenants found'); process.exit(1); }

    const tenantId = tenantsSnap.docs[0].id;
    const tenantData = tenantsSnap.docs[0].data();
    console.log(`\n🏢 Tenant: ${tenantId} (${tenantData.name || 'unnamed'})\n`);

    // 1) Clear catalog
    const catalogCol = db.collection('tenants').doc(tenantId).collection('catalog');
    const oldCatalog = await catalogCol.get();
    if (!oldCatalog.empty) {
        const batch = db.batch();
        oldCatalog.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`🗑️  Cleared ${oldCatalog.size} items from catalog`);
    }

    // 2) Clear legacy prestations
    const prestCol = db.collection('tenants').doc(tenantId).collection('prestations');
    const oldPrest = await prestCol.get();
    if (!oldPrest.empty) {
        const batch = db.batch();
        oldPrest.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`🗑️  Cleared ${oldPrest.size} items from prestations`);
    }

    // 3) Seed new catalog
    const now = new Date();
    const batch = db.batch();
    for (const item of LUNE_PRESTATIONS) {
        batch.set(catalogCol.doc(), { ...item, createdAt: now, updatedAt: now });
    }
    await batch.commit();
    console.log(`\n✅ Seeded ${LUNE_PRESTATIONS.length} prestations LUNE PARIS 2026 into catalog`);

    console.log('\n📋 Prestations créées :');
    LUNE_PRESTATIONS.forEach((p, i) => {
        console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${p.name} — ${p.netCost > 0 ? p.netCost + '€' : 'Sur demande'} (${p.location})`);
    });

    console.log('\n✨ Done!\n');
    process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
