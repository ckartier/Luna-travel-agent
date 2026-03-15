import { admin } from '../src/lib/firebase/admin';

async function createIndex() {
    try {
        const app = admin.app();
        
        // The Google Cloud project ID
        const projectId = process.env.FIREBASE_PROJECT_ID;
        
        const credential = app.options.credential as any;
        const tokenObj = await credential.getAccessToken();
        const token = tokenObj.access_token;
        
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/catalog/indexes`;
        
        const payload = {
          "queryScope": "COLLECTION",
          "fields": [
            {
              "fieldPath": "embedding",
              "vectorConfig": {
                "dimension": 768,
                "flat": {}
              }
            }
          ]
        };

        console.log("Sending POST request to Cloud Firestore APIs...");

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));

    } catch (e: any) {
        console.error("Error creating index:");
        console.error(e.message || e);
    }
}

createIndex();
