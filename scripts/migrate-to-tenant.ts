#!/usr/bin/env npx ts-node
/**
 * Firestore Migration Script — Root-level to Tenant-scoped
 *
 * Moves CRM data from root-level collections to tenants/{tenantId}/ sub-collections.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/migrate-to-tenant.ts
 *
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SA_KEY env var set to a service account JSON
 *   - Or the admin SDK initialized via apphosting.yaml
 *
 * What it does:
 *   1. Reads all users to find their tenantId
 *   2. For each root-level CRM collection, copies each document to tenants/{tenantId}/{collection}/{docId}
 *   3. Logs progress and skips already-migrated documents
 *   4. Does NOT delete source documents (dry-run safe, manual cleanup after verification)
 */

import * as admin from 'firebase-admin';

// ── Init Firebase Admin ──
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}
const db = admin.firestore();

// Collections to migrate from root to tenant-scoped
const CRM_COLLECTIONS = [
    'leads', 'contacts', 'activities', 'trips', 'bookings',
    'catalog', 'invoices', 'payments', 'messages', 'documents',
    'campaigns', 'tasks', 'calendar_events',
];

interface MigrationStats {
    collection: string;
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
}

async function getDefaultTenantId(): Promise<string> {
    // Find the first user with a tenantId, or create a default tenant
    const usersSnap = await db.collection('users').limit(10).get();

    for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        if (data.tenantId) {
            console.log(`Found tenant: ${data.tenantId} (from user ${userDoc.id})`);
            return data.tenantId;
        }
    }

    // If no user has a tenantId, create a default tenant
    const tenantRef = db.collection('tenants').doc();
    const tenantId = tenantRef.id;
    await tenantRef.set({
        name: 'Default Agency',
        plan: 'pro',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: usersSnap.docs[0]?.id || 'system',
    });

    // Update all existing users with this tenantId
    const batch = db.batch();
    for (const userDoc of usersSnap.docs) {
        batch.update(userDoc.ref, { tenantId });
    }
    await batch.commit();

    console.log(`Created default tenant: ${tenantId}`);
    return tenantId;
}

async function migrateCollection(tenantId: string, collectionName: string): Promise<MigrationStats> {
    const stats: MigrationStats = {
        collection: collectionName,
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: 0,
    };

    const sourceSnap = await db.collection(collectionName).get();
    stats.total = sourceSnap.size;

    if (stats.total === 0) {
        console.log(`  ⏭  ${collectionName}: empty, skipping`);
        return stats;
    }

    const BATCH_SIZE = 400; // Firestore batch limit is 500
    let batch = db.batch();
    let batchCount = 0;

    for (const sourceDoc of sourceSnap.docs) {
        const targetRef = db
            .collection('tenants')
            .doc(tenantId)
            .collection(collectionName)
            .doc(sourceDoc.id);

        // Check if already migrated
        const existing = await targetRef.get();
        if (existing.exists) {
            stats.skipped++;
            continue;
        }

        try {
            batch.set(targetRef, sourceDoc.data());
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }

            stats.migrated++;
        } catch (err: any) {
            stats.errors++;
            console.error(`  ❌ Error migrating ${collectionName}/${sourceDoc.id}: ${err.message}`);
        }
    }

    // Commit remaining
    if (batchCount > 0) {
        await batch.commit();
    }

    const icon = stats.errors > 0 ? '⚠️' : '✅';
    console.log(`  ${icon} ${collectionName}: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors (${stats.total} total)`);
    return stats;
}

async function main() {
    console.log('');
    console.log('══════════════════════════════════════════════');
    console.log('  Luna Travel — Firestore Tenant Migration');
    console.log('══════════════════════════════════════════════');
    console.log('');

    // Step 1: Find or create tenant
    const tenantId = await getDefaultTenantId();
    console.log(`\nTarget tenant: ${tenantId}\n`);

    // Step 2: Migrate each collection
    const results: MigrationStats[] = [];
    for (const col of CRM_COLLECTIONS) {
        const stats = await migrateCollection(tenantId, col);
        results.push(stats);
    }

    // Step 3: Summary
    console.log('\n══════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('══════════════════════════════════════════════\n');

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const r of results) {
        totalMigrated += r.migrated;
        totalSkipped += r.skipped;
        totalErrors += r.errors;
    }

    console.log(`  Total documents: ${results.reduce((s, r) => s + r.total, 0)}`);
    console.log(`  Migrated:        ${totalMigrated}`);
    console.log(`  Skipped:         ${totalSkipped} (already existed)`);
    console.log(`  Errors:          ${totalErrors}`);
    console.log(`  Target tenant:   ${tenantId}`);
    console.log('');

    if (totalErrors === 0) {
        console.log('✅ Migration complete! Root-level data is now under tenants/${tenantId}/');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Verify data in Firebase Console under tenants/ path');
        console.log('  2. Test the app to ensure all pages load tenant-scoped data');
        console.log('  3. Once verified, optionally delete root-level collections');
    } else {
        console.log('⚠️  Migration completed with errors. Review the output above.');
    }
}

main().catch(console.error);
