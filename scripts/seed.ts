/**
 * Luna CRM — Seed Script
 * 
 * Populates a tenant with demo data for testing.
 * Run: TENANT_ID=xxx npx ts-node scripts/seed.ts
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();
const TENANT_ID = process.env.TENANT_ID || 'demo-tenant';

const CONTACTS = [
    { firstName: 'Marie', lastName: 'Laurent', email: 'marie.laurent@email.com', phone: '+33 6 12 34 56 78', company: 'Atelier ML', vipLevel: 'Gold', nationality: 'Française' },
    { firstName: 'Pierre', lastName: 'Dubois', email: 'pierre.dubois@email.com', phone: '+33 6 23 45 67 89', company: 'Dubois & Fils', vipLevel: 'Standard', nationality: 'Française' },
    { firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@email.com', phone: '+33 6 34 56 78 90', company: '', vipLevel: 'Platinum', nationality: 'Française' },
    { firstName: 'Thomas', lastName: 'Bernard', email: 'thomas.bernard@email.com', phone: '+33 6 45 67 89 01', company: 'Bernard Group', vipLevel: 'Standard', nationality: 'Française' },
    { firstName: 'Emma', lastName: 'Moreau', email: 'emma.moreau@email.com', phone: '+33 6 56 78 90 12', company: '', vipLevel: 'Gold', nationality: 'Française' },
    { firstName: 'Lucas', lastName: 'Petit', email: 'lucas.petit@email.com', phone: '+41 79 123 45 67', company: 'Petit SA', vipLevel: 'Standard', nationality: 'Suisse' },
    { firstName: 'Chloé', lastName: 'Leroy', email: 'chloe.leroy@email.com', phone: '+32 475 12 34 56', company: '', vipLevel: 'Gold', nationality: 'Belge' },
    { firstName: 'Hugo', lastName: 'Roux', email: 'hugo.roux@email.com', phone: '+33 6 67 89 01 23', company: 'Roux Consulting', vipLevel: 'Standard', nationality: 'Française' },
];

const SUPPLIERS = [
    { name: 'Ritz Paris', category: 'HOTEL', city: 'Paris', country: 'France', rating: 5, email: 'booking@ritzparis.com', isFavorite: true },
    { name: 'Four Seasons Bora Bora', category: 'HOTEL', city: 'Bora Bora', country: 'Polynésie française', rating: 5, email: 'res@fsborabora.com', isFavorite: true },
    { name: 'Aman Tokyo', category: 'HOTEL', city: 'Tokyo', country: 'Japon', rating: 5, email: 'tokyo@aman.com' },
    { name: 'Belmond Cap Juluca', category: 'HOTEL', city: 'Maundays Bay', country: 'Anguilla', rating: 4 },
    { name: 'Safari Kenya Express', category: 'ACTIVITY', city: 'Nairobi', country: 'Kenya', rating: 4, email: 'info@safarikenya.co' },
    { name: 'Hélicoptère Alpes', category: 'TRANSPORT', city: 'Chamonix', country: 'France', rating: 4 },
    { name: 'Chef Privé Méditerranée', category: 'EXPERIENCE', city: 'Nice', country: 'France', rating: 5 },
    { name: 'Yacht Charter Côte d\'Azur', category: 'TRANSPORT', city: 'Cannes', country: 'France', rating: 4, isFavorite: true },
];

const TRIPS = [
    { title: 'Lune de miel Maldives', destination: 'Maldives', clientIdx: 0, travelers: 2, amount: 18500, status: 'CONFIRMED', startDate: '2026-04-10', endDate: '2026-04-20' },
    { title: 'Safari Kenya en famille', destination: 'Kenya', clientIdx: 3, travelers: 4, amount: 24000, status: 'CONFIRMED', startDate: '2026-07-15', endDate: '2026-07-28' },
    { title: 'Week-end à Tokyo', destination: 'Tokyo', clientIdx: 2, travelers: 2, amount: 8900, status: 'DRAFT', startDate: '2026-05-01', endDate: '2026-05-06' },
    { title: 'Croisière Méditerranée', destination: 'Méditerranée', clientIdx: 4, travelers: 6, amount: 32000, status: 'COMPLETED', startDate: '2026-02-01', endDate: '2026-02-10' },
    { title: 'Escapade Bora Bora', destination: 'Bora Bora', clientIdx: 6, travelers: 2, amount: 22000, status: 'CONFIRMED', startDate: '2026-06-01', endDate: '2026-06-12' },
];

async function seed() {
    console.log(`\n🌱 Luna CRM — Seeding tenant: ${TENANT_ID}\n`);

    const tenantRef = db.collection('tenants').doc(TENANT_ID);

    // Seed contacts
    console.log('  👤 Contacts...');
    const contactIds: string[] = [];
    for (const c of CONTACTS) {
        const ref = await tenantRef.collection('contacts').add({
            ...c,
            tags: [],
            source: 'seed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        contactIds.push(ref.id);
        console.log(`    ✅ ${c.firstName} ${c.lastName}`);
    }

    // Seed suppliers
    console.log('\n  🤝 Prestataires...');
    for (const s of SUPPLIERS) {
        await tenantRef.collection('suppliers').add({
            ...s,
            tags: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`    ✅ ${s.name}`);
    }

    // Seed trips
    console.log('\n  ✈️ Voyages...');
    for (const t of TRIPS) {
        const contact = CONTACTS[t.clientIdx];
        const clientName = `${contact.firstName} ${contact.lastName}`;
        await tenantRef.collection('trips').add({
            title: t.title,
            destination: t.destination,
            clientName,
            contactId: contactIds[t.clientIdx],
            travelers: t.travelers,
            amount: t.amount,
            status: t.status,
            startDate: t.startDate,
            endDate: t.endDate,
            currency: 'EUR',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`    ✅ ${t.title} (${clientName})`);
    }

    console.log(`\n✅ Seed terminé: ${CONTACTS.length} contacts, ${SUPPLIERS.length} prestataires, ${TRIPS.length} voyages\n`);
}

seed().catch(e => { console.error('Fatal:', e); process.exit(1); });
