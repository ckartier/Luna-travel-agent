/**
 * Luna CRM — Data Backup Script
 * 
 * Exports all tenant data to JSON files for backup purposes.
 * Run: npx ts-node scripts/backup.ts
 * 
 * Set environment variables:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin if not already
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

const COLLECTIONS = [
    'contacts', 'trips', 'leads', 'quotes', 'invoices', 'payments',
    'suppliers', 'supplier_bookings', 'catalog', 'bookings',
    'activities', 'calendar', 'messages', 'documents',
    'activity_log', 'shared-quotes',
];

async function backup() {
    console.log('\n📦 Luna CRM — Backup\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(process.cwd(), 'backups', timestamp);
    fs.mkdirSync(backupDir, { recursive: true });

    // Get all tenants
    const tenantsSnap = await db.collection('tenants').get();
    console.log(`  Found ${tenantsSnap.size} tenant(s)\n`);

    const summary: Record<string, Record<string, number>> = {};

    for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        const tenantData = tenantDoc.data();
        const tenantName = tenantData.name || tenantId;
        const tenantDir = path.join(backupDir, tenantId);
        fs.mkdirSync(tenantDir, { recursive: true });

        console.log(`  📂 Tenant: ${tenantName} (${tenantId})`);
        summary[tenantId] = {};

        // Save tenant document
        fs.writeFileSync(
            path.join(tenantDir, '_tenant.json'),
            JSON.stringify({ id: tenantId, ...tenantData }, null, 2)
        );

        // Backup each collection
        for (const collName of COLLECTIONS) {
            try {
                const snap = await db
                    .collection('tenants').doc(tenantId)
                    .collection(collName)
                    .get();

                if (snap.empty) continue;

                const docs = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                }));

                fs.writeFileSync(
                    path.join(tenantDir, `${collName}.json`),
                    JSON.stringify(docs, null, 2)
                );

                summary[tenantId][collName] = docs.length;
                console.log(`    ✅ ${collName}: ${docs.length} docs`);
            } catch (e: any) {
                console.log(`    ⚠️ ${collName}: ${e.message}`);
            }
        }

        // Backup trip days (sub-collections)
        try {
            const tripsSnap = await db
                .collection('tenants').doc(tenantId)
                .collection('trips')
                .get();

            let totalDays = 0;
            for (const tripDoc of tripsSnap.docs) {
                const daysSnap = await tripDoc.ref.collection('days').get();
                if (!daysSnap.empty) {
                    const days = daysSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    fs.writeFileSync(
                        path.join(tenantDir, `trip-days-${tripDoc.id}.json`),
                        JSON.stringify(days, null, 2)
                    );
                    totalDays += days.length;
                }
            }
            if (totalDays > 0) {
                console.log(`    ✅ trip-days: ${totalDays} days across ${tripsSnap.size} trips`);
                summary[tenantId]['trip-days'] = totalDays;
            }
        } catch (e: any) {
            console.log(`    ⚠️ trip-days: ${e.message}`);
        }

        console.log('');
    }

    // Backup global collections
    const globalDir = path.join(backupDir, '_global');
    fs.mkdirSync(globalDir, { recursive: true });

    for (const col of ['users', 'subscriptions', 'settings']) {
        try {
            const snap = await db.collection(col).get();
            if (!snap.empty) {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                fs.writeFileSync(path.join(globalDir, `${col}.json`), JSON.stringify(docs, null, 2));
                console.log(`  ✅ global/${col}: ${docs.length} docs`);
            }
        } catch (e: any) {
            console.log(`  ⚠️ global/${col}: ${e.message}`);
        }
    }

    // Write summary
    fs.writeFileSync(
        path.join(backupDir, '_summary.json'),
        JSON.stringify({ timestamp, summary }, null, 2)
    );

    console.log(`\n✅ Backup terminé → ${backupDir}\n`);
}

backup().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
