export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export async function GET(req: Request) {
    try {
        // Auth check
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        const tenantsSnap = await adminDb.collection('tenants').get();
        let tenantId = '';
        for (const doc of tenantsSnap.docs) {
            const contactsSnap = await adminDb.collection('tenants').doc(doc.id).collection('contacts').limit(1).get();
            if (!contactsSnap.empty) { tenantId = doc.id; break; }
        }

        if (!tenantId) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

        const catalogSnap = await adminDb.collection('tenants').doc(tenantId).collection('catalog')
            .where('name', '==', 'Accompagnateur Local Francophone')
            .limit(1).get();

        if (catalogSnap.empty) return NextResponse.json({ error: 'Prestation not found' }, { status: 404 });

        const docId = catalogSnap.docs[0].id;
        // The image is saved in the artifacts directory
        const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'datarnivore.firebasestorage.app';
        const imgUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/placeholders%2Fguide_paris.jpg?alt=media`; // Fallback to public for now if base64 is too big for firestore

        // Actually I can just base64 it here since I'm running on the same server
        const fs = require('fs');
        const imgPath = '/Users/laurentclement/.gemini/antigravity/brain/221954d9-671e-40ee-8d75-5f703f633795/paris_guide_eiffel_tower_1772896513973.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        await adminDb.collection('tenants').doc(tenantId).collection('catalog').doc(docId).update({
            images: [dataUrl]
        });

        return NextResponse.json({ success: true, message: `Updated photo for ${docId}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
