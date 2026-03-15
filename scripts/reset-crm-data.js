/**
 * FULL Reset CRM data — clears ALL operational collections
 * Run: node -r dotenv/config scripts/reset-crm-data.js dotenv_config_path=.env.local
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function deleteCollection(collectionRef, label) {
  const snap = await collectionRef.get();
  if (snap.empty) {
    console.log(`  ✓ ${label}: vide`);
    return 0;
  }
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = db.batch();
    snap.docs.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(500, snap.docs.length - i);
  }
  console.log(`  🗑 ${label}: ${deleted} supprimés`);
  return deleted;
}

// ALL operational collections to clear
const COLLECTIONS_TO_CLEAR = [
  'leads',
  'trips', 
  'quotes',
  'invoices',
  'bookings',
  'prestations',
  'supplier_bookings',
  'activities',
  'calendar',
  'messages',
  'documents',
  'payments',
  'apiUsage',
];

// Collections to KEEP (don't delete):
// - contacts (client data)
// - catalog (product catalog)
// - collections
// - suppliers (prestataires)
// - templates

async function main() {
  console.log('\n🚀 FULL Reset CRM — Luna Conciergerie\n');
  
  const tenantsSnap = await db.collection('tenants').get();
  if (tenantsSnap.empty) {
    console.log('❌ Aucun tenant trouvé.');
    process.exit(1);
  }
  
  let totalDeleted = 0;
  
  for (const tenantDoc of tenantsSnap.docs) {
    const tenantId = tenantDoc.id;
    const tenantData = tenantDoc.data();
    console.log(`\n📋 Tenant: ${tenantData.name || tenantId}`);
    
    // Clear trips sub-collections first
    const tripsSnap = await db.collection('tenants').doc(tenantId).collection('trips').get();
    for (const tripDoc of tripsSnap.docs) {
      await deleteCollection(tripDoc.ref.collection('days'), `  Trip sub: days`);
      await deleteCollection(tripDoc.ref.collection('scheduledMessages'), `  Trip sub: msgs`);
    }
    
    // Clear all operational collections
    for (const col of COLLECTIONS_TO_CLEAR) {
      totalDeleted += await deleteCollection(
        db.collection('tenants').doc(tenantId).collection(col), col
      );
    }
  }
  
  console.log(`\n✅ TOUT vidé ! ${totalDeleted} éléments supprimés.`);
  console.log('   Pipeline, Planning, Devis, Factures, Bookings, etc. à zéro. 🧹\n');
  console.log('   ℹ️  Conservés: contacts, catalogue, prestataires, templates\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
