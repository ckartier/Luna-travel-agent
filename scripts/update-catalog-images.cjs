const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
});

const db = admin.firestore();

// Mapping of prestation names (partial match) -> image filenames
const IMAGE_MAP = {
    'Chauffeur Privé à la Journée': '/catalog/chauffeur-prive.png',
    'Organisation Événement': '/catalog/evenement-prive.png',
    'Accompagnateur Local': '/catalog/accompagnateur-local.png',
    'Conciergerie Complète': '/catalog/conciergerie-complete.png',
    'Vol Privé': '/catalog/vol-prive-jet.png',
    'Villa Privée': '/catalog/villa-privee.png',
    'Réservation Palace': '/catalog/palace-hotel.png',
    'Spa': '/catalog/spa-bienetre.png',
    'Excursion Nature': '/catalog/excursion-nature.png',
    'Location Véhicule': '/catalog/location-vehicule.png',
    'Billet Business': '/catalog/billet-business.png',
    'Lune de Miel': '/catalog/lune-de-miel.png',
    'Boutique Hôtel': '/catalog/boutique-hotel.png',
    'Visite Culturelle': '/catalog/visite-culturelle.png',
    'Expérience Gastronomique': '/catalog/experience-gastronomique.png',
    'Transfert Aéroport': '/catalog/transfert-aeroport.png',
    'Itinéraire Sur-Mesure': '/catalog/itineraire-surmesure.png',
    'Réservation Restaurant': '/catalog/restaurant-etoile.png',
};

async function updateCatalogImages() {
    // Find tenant
    const tenantsSnap = await db.collection('tenants').get();
    let tenantId = null;
    tenantsSnap.forEach(doc => {
        tenantId = doc.id;
        console.log(`Found tenant: ${tenantId} (${doc.data().name || doc.data().agencyName || 'unknown'})`);
    });

    if (!tenantId) {
        console.error('No tenant found!');
        process.exit(1);
    }

    // Get all catalog items
    const catalogSnap = await db.collection('tenants').doc(tenantId).collection('catalog').get();
    console.log(`\nFound ${catalogSnap.size} catalog items.\n`);

    let updated = 0;
    for (const doc of catalogSnap.docs) {
        const data = doc.data();
        const name = data.name || '';

        // Find matching image
        let imageUrl = null;
        for (const [key, url] of Object.entries(IMAGE_MAP)) {
            if (name.includes(key) || key.includes(name.substring(0, 15))) {
                imageUrl = url;
                break;
            }
        }

        if (imageUrl) {
            await doc.ref.update({ imageUrl });
            console.log(`✅ ${name} → ${imageUrl}`);
            updated++;
        } else {
            console.log(`⚠️  No image match for: "${name}"`);
        }
    }

    console.log(`\n✨ Updated ${updated}/${catalogSnap.size} prestations with images.`);
    process.exit(0);
}

updateCatalogImages().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
