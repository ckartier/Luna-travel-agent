import * as admin from 'firebase-admin';

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PRIVATE_KEY) {
            let pk = process.env.FIREBASE_PRIVATE_KEY;
            
            // If it doesn't smell like a PEM key, it must be our new Base64 encoded format
            if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
                try {
                    pk = Buffer.from(pk, 'base64').toString('utf8');
                } catch (e) {
                    console.error("Failed to decode base64 Firebase key");
                }
            } else {
                if (pk.startsWith('"') && pk.endsWith('"')) {
                    pk = pk.substring(1, pk.length - 1);
                }
                pk = pk.replace(/\\n/g, '\n');
            }
            

            // Local Development: Use explicit service account credentials
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: pk,
                    }),
                    storageBucket,
                });

            } catch (initErr) {
                console.error("DEBUG: initializeApp FAILED:", initErr);
            }
        } else {
            // Production (App Hosting / Cloud Run): Use Application Default Credentials
            admin.initializeApp({ storageBucket });
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

const adminDb = admin.firestore();
export { adminDb, admin };
