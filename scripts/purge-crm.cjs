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

const COLS = [
    'leads', 'contacts', 'trips', 'activities', 'quotes',
    'invoices', 'bookings', 'payments', 'messages', 'documents',
    'campaigns', 'tasks', 'calendar_events', 'calendar', 'catalog',
    'suppliers', 'prestations'
];

async function delCol(tenantId, col) {
    const ref = db.collection('tenants').doc(tenantId).collection(col);
    const snap = await ref.limit(500).get();
    if (snap.empty) return 0;

    // For trips, delete sub-collection 'days' first
    if (col === 'trips') {
        for (const d of snap.docs) {
            const days = await ref.doc(d.id).collection('days').get();
            if (!days.empty) {
                const b = db.batch();
                days.docs.forEach(x => b.delete(x.ref));
                await b.commit();
                console.log(`    -> deleted ${days.size} days from trip ${d.id}`);
            }
        }
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    // Recurse if more than 500
    if (snap.size >= 500) {
        return snap.size + await delCol(tenantId, col);
    }
    return snap.size;
}

async function main() {
    const tenants = await db.collection('tenants').get();
    console.log(`\nFound ${tenants.size} tenant(s)\n`);

    for (const t of tenants.docs) {
        const data = t.data();
        console.log(`Tenant: ${t.id} (${data.name || '?'}) - Plan: ${data.plan || '?'}`);
        let total = 0;

        for (const col of COLS) {
            const n = await delCol(t.id, col);
            if (n > 0) console.log(`  [x] ${col}: ${n} deleted`);
            total += n;
        }

        console.log(`  TOTAL: ${total} documents purged\n`);
    }

    console.log('Done! Database is clean.');
    process.exit(0);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
