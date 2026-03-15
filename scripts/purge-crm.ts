/**
 * PURGE ALL CRM DATA for a tenant
 * Usage: npx tsx scripts/purge-crm.ts
 * 
 * This uses Firebase Admin SDK to delete all collections under a tenant.
 */
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

const CRM_COLLECTIONS = [
    'leads', 'contacts', 'trips', 'activities', 'quotes',
    'invoices', 'bookings', 'payments', 'messages', 'documents',
    'campaigns', 'tasks', 'calendar_events', 'calendar', 'catalog',
    'suppliers', 'prestations',
];

async function deleteCollection(tenantId: string, colName: string): Promise<number> {
    const colRef = db.collection('tenants').doc(tenantId).collection(colName);
    const snapshot = await colRef.limit(500).get();
    if (snapshot.empty) return 0;

    let deleted = 0;

    // For trips, delete sub-collection 'days' first
    if (colName === 'trips') {
        for (const d of snapshot.docs) {
            const daysSnap = await colRef.doc(d.id).collection('days').get();
            if (!daysSnap.empty) {
                const daysBatch = db.batch();
                daysSnap.docs.forEach(day => daysBatch.delete(day.ref));
                await daysBatch.commit();
                console.log(`    ↳ Deleted ${daysSnap.size} days from trip ${d.id}`);
            }
        }
    }

    const batch = db.batch();
    snapshot.docs.forEach(d => { batch.delete(d.ref); deleted++; });
    await batch.commit();

    if (deleted >= 500) {
        deleted += await deleteCollection(tenantId, colName);
    }
    return deleted;
}

async function main() {
    // List all tenants
    const tenantsSnap = await db.collection('tenants').get();
    console.log(`\n🔍 Found ${tenantsSnap.size} tenant(s)\n`);

    for (const tenant of tenantsSnap.docs) {
        const data = tenant.data();
        console.log(`\n🏢 Tenant: ${tenant.id} (${data.name || 'unnamed'}) — Plan: ${data.plan || 'unknown'}`);
        console.log(`   Owner: ${data.ownerId || 'unknown'}`);
        console.log(`   ─────────────────────────────────`);

        let totalDeleted = 0;

        for (const col of CRM_COLLECTIONS) {
            const count = await deleteCollection(tenant.id, col);
            if (count > 0) {
                console.log(`   ✅ ${col}: ${count} document(s) deleted`);
            } else {
                console.log(`   ⬛ ${col}: empty`);
            }
            totalDeleted += count;
        }

        console.log(`   ─────────────────────────────────`);
        console.log(`   🗑️  Total: ${totalDeleted} documents purged`);
    }

    console.log('\n✨ Purge complete! Database is now clean.\n');
    process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
