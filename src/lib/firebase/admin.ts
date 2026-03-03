import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PRIVATE_KEY) {
            // Local Development: Use explicit service account credentials
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        } else {
            // Production (App Hosting / Cloud Run): Use Application Default Credentials
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

const adminDb = admin.firestore();
export { adminDb, admin };
