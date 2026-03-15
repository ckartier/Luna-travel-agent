import { adminDb } from '../src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

async function trigger() {
    try {
        console.log("Attempting vector search to trigger index creation...");
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            console.log("No tenants found.");
            return;
        }
        const tenantId = tenantsSnap.docs[0].id;
        
        let catalogRef = adminDb.collection('tenants').doc(tenantId).collection('catalog');
        
        // Dummy 768-D vector
        const dummyVector = Array(768).fill(0.1);
        
        const resultsOpt = catalogRef.findNearest({
            vectorField: 'embedding',
            queryVector: FieldValue.vector(dummyVector),
            limit: 1,
            distanceMeasure: 'COSINE'
        });
        
        await resultsOpt.get();
        console.log("Success? (Index already exists)");
    } catch (e: any) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
    }
}

trigger();
