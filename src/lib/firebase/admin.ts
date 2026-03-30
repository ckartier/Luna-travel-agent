import * as admin from 'firebase-admin';

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;
const isCloudRuntime = !!(process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG);

if (!admin.apps.length) {
    try {
        if (!isCloudRuntime && process.env.FIREBASE_PRIVATE_KEY) {
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
            

            // Local development: use explicit service account credentials when provided.
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: pk,
                    }),
                    projectId,
                    storageBucket,
                });

            } catch (initErr) {
                console.error("DEBUG: initializeApp FAILED:", initErr);
            }
        } else {
            // Cloud / emulator: use Application Default Credentials.
            admin.initializeApp({ projectId, storageBucket });
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

const adminDb = admin.firestore();
export { adminDb, admin };
