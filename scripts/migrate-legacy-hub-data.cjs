#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Legacy Hub/CRM migration:
 * - hub_config/main                   -> tenants/{tenantId}/hub_config/main
 * - hub_contacts/*                    -> tenants/{tenantId}/hub_contacts/*
 * - bug_reports/*                     -> tenants/{tenantId}/bug_reports/*
 *
 * Safe by default:
 * - DRY RUN unless `--apply` is provided
 * - never deletes source documents
 * - never overwrites target documents that already exist
 *
 * Usage:
 *   node scripts/migrate-legacy-hub-data.cjs
 *   node scripts/migrate-legacy-hub-data.cjs --apply
 */

const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    } catch {
      // keep raw value; initialization will fail with clear error if invalid
    }
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return;
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

function printHeader() {
  console.log('\n======================================================');
  console.log(' Legacy Hub/CRM Firestore Migration');
  console.log('======================================================');
  console.log(`Mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
}

async function getTenantIds(db) {
  const tenantsSnap = await db.collection('tenants').get();
  return tenantsSnap.docs.map((d) => d.id);
}

function createTenantResolver(tenantIds) {
  const tenantIdSet = new Set(tenantIds);
  const singleTenantId = tenantIds.length === 1 ? tenantIds[0] : null;

  return function resolveTenantId(data, unresolved) {
    const explicit = typeof data?.tenantId === 'string' ? data.tenantId.trim() : '';
    if (explicit) {
      if (tenantIdSet.has(explicit)) return explicit;
      unresolved.invalidTenantId += 1;
      return null;
    }

    if (singleTenantId) {
      unresolved.assumedSingleTenant += 1;
      return singleTenantId;
    }

    unresolved.missingTenantId += 1;
    return null;
  };
}

async function migrateLegacyHubConfig(db, tenantIds) {
  const rootRef = db.collection('hub_config').doc('main');
  const rootSnap = await rootRef.get();

  const stats = {
    sourceExists: rootSnap.exists,
    tenants: tenantIds.length,
    existingTargets: 0,
    toCreate: 0,
    created: 0,
    errors: 0,
  };

  if (!rootSnap.exists) {
    console.log('\n[hub_config] No legacy root config found; skipping.');
    return stats;
  }

  const rootData = rootSnap.data() || {};
  const targetRefs = tenantIds.map((tenantId) =>
    db.collection('tenants').doc(tenantId).collection('hub_config').doc('main')
  );
  const targetSnaps = targetRefs.length > 0 ? await db.getAll(...targetRefs) : [];

  for (let i = 0; i < targetRefs.length; i += 1) {
    const targetRef = targetRefs[i];
    const targetSnap = targetSnaps[i];
    if (targetSnap.exists) {
      stats.existingTargets += 1;
      continue;
    }

    stats.toCreate += 1;
    if (!APPLY) continue;

    try {
      await targetRef.set({
        ...rootData,
        migratedFrom: 'legacy_root_hub_config/main',
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      stats.created += 1;
    } catch (error) {
      stats.errors += 1;
      console.error(`[hub_config] Failed for ${targetRef.path}:`, error.message || error);
    }
  }

  console.log('\n[hub_config]');
  console.log(`  source exists:   ${stats.sourceExists}`);
  console.log(`  tenant targets:  ${stats.tenants}`);
  console.log(`  already present: ${stats.existingTargets}`);
  console.log(`  to create:       ${stats.toCreate}`);
  console.log(`  created:         ${stats.created}`);
  console.log(`  errors:          ${stats.errors}`);

  return stats;
}

async function migrateRootCollection(db, options) {
  const {
    sourceCollection,
    targetSubcollection,
    resolveTenantId,
    pageSize = 300,
  } = options;

  const stats = {
    sourceCollection,
    targetSubcollection,
    scanned: 0,
    routable: 0,
    alreadyExists: 0,
    toWrite: 0,
    written: 0,
    errors: 0,
    unresolved: {
      missingTenantId: 0,
      invalidTenantId: 0,
      assumedSingleTenant: 0,
    },
  };

  let cursor = null;
  const sourceRef = db.collection(sourceCollection);

  while (true) {
    let query = sourceRef
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);
    if (cursor) query = query.startAfter(cursor);

    const pageSnap = await query.get();
    if (pageSnap.empty) break;

    stats.scanned += pageSnap.size;
    cursor = pageSnap.docs[pageSnap.docs.length - 1];

    const routed = [];
    for (const doc of pageSnap.docs) {
      const data = doc.data() || {};
      const tenantId = resolveTenantId(data, stats.unresolved);
      if (!tenantId) continue;
      stats.routable += 1;
      routed.push({
        sourceDoc: doc,
        targetRef: db.collection('tenants').doc(tenantId).collection(targetSubcollection).doc(doc.id),
      });
    }

    if (routed.length === 0) continue;

    const targetSnaps = await db.getAll(...routed.map((r) => r.targetRef));
    const toWrite = [];
    for (let i = 0; i < routed.length; i += 1) {
      if (targetSnaps[i].exists) {
        stats.alreadyExists += 1;
        continue;
      }
      toWrite.push(routed[i]);
      stats.toWrite += 1;
    }

    if (!APPLY || toWrite.length === 0) continue;

    let batch = db.batch();
    let batchCount = 0;
    for (const item of toWrite) {
      try {
        const data = item.sourceDoc.data() || {};
        batch.set(item.targetRef, {
          ...data,
          migratedFrom: `legacy_root_${sourceCollection}/${item.sourceDoc.id}`,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batchCount += 1;

        if (batchCount >= 400) {
          await batch.commit();
          stats.written += batchCount;
          batch = db.batch();
          batchCount = 0;
        }
      } catch (error) {
        stats.errors += 1;
        console.error(`[${sourceCollection}] Failed preparing ${item.sourceDoc.id}:`, error.message || error);
      }
    }

    if (batchCount > 0) {
      try {
        await batch.commit();
        stats.written += batchCount;
      } catch (error) {
        stats.errors += batchCount;
        console.error(`[${sourceCollection}] Batch commit failed:`, error.message || error);
      }
    }
  }

  console.log(`\n[${sourceCollection} -> ${targetSubcollection}]`);
  console.log(`  scanned:                ${stats.scanned}`);
  console.log(`  routable:               ${stats.routable}`);
  console.log(`  already exists target:  ${stats.alreadyExists}`);
  console.log(`  to write:               ${stats.toWrite}`);
  console.log(`  written:                ${stats.written}`);
  console.log(`  unresolved (missing):   ${stats.unresolved.missingTenantId}`);
  console.log(`  unresolved (invalid):   ${stats.unresolved.invalidTenantId}`);
  console.log(`  unresolved (assumed 1): ${stats.unresolved.assumedSingleTenant}`);
  console.log(`  errors:                 ${stats.errors}`);

  return stats;
}

async function main() {
  printHeader();
  initFirebase();
  const db = admin.firestore();

  const tenantIds = await getTenantIds(db);
  if (tenantIds.length === 0) {
    console.error('No tenant found. Aborting.');
    process.exit(1);
  }

  console.log(`Tenants found: ${tenantIds.length}`);
  const resolveTenantId = createTenantResolver(tenantIds);

  const hubConfigStats = await migrateLegacyHubConfig(db, tenantIds);
  const hubContactsStats = await migrateRootCollection(db, {
    sourceCollection: 'hub_contacts',
    targetSubcollection: 'hub_contacts',
    resolveTenantId,
  });
  const bugReportsStats = await migrateRootCollection(db, {
    sourceCollection: 'bug_reports',
    targetSubcollection: 'bug_reports',
    resolveTenantId,
  });

  console.log('\n================== Summary ==================');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`hub_config to create: ${hubConfigStats.toCreate}`);
  console.log(`hub_contacts to write: ${hubContactsStats.toWrite}`);
  console.log(`bug_reports to write: ${bugReportsStats.toWrite}`);
  console.log('============================================\n');

  if (!APPLY) {
    console.log('No write performed. Re-run with --apply to execute migration.\n');
  }
}

main().catch((error) => {
  console.error('Fatal migration error:', error);
  process.exit(1);
});
