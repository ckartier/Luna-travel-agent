/**
 * GENERATE GEMINI EMBEDDINGS for all catalog items
 * Usage: npx tsx scripts/embed-catalog.ts
 * 
 * Iterates all catalog items, generates text embeddings via Gemini, and updates Firestore.
 */
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ── Firebase Admin ──
if (!admin.apps.length) {
    let pk = process.env.FIREBASE_PRIVATE_KEY || '';
    if (!pk.includes('-----BEGIN PRIVATE KEY-----')) {
        try { pk = Buffer.from(pk, 'base64').toString('utf8'); } catch (e) {}
    } else {
        if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.substring(1, pk.length - 1);
        pk = pk.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: pk,
        }),
    });
}
const db = admin.firestore();

// ── Gemini Embedding ──
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: [{ text }],
            config: { outputDimensionality: 768, taskType: 'RETRIEVAL_DOCUMENT' as any }
        });
        return response.embeddings?.[0]?.values || null;
    } catch (err: any) {
        console.error(`   ❌ Embedding error: ${err.message}`);
        return null;
    }
}

async function main() {
    const tenantsSnap = await db.collection('tenants').get();
    if (tenantsSnap.empty) { console.error('❌ No tenants'); process.exit(1); }

    const tenantId = tenantsSnap.docs[0].id;
    console.log(`\n🏢 Tenant: ${tenantId}`);

    const catalogSnap = await db.collection('tenants').doc(tenantId).collection('catalog').get();
    console.log(`📦 ${catalogSnap.size} items in catalog\n`);

    let embedded = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of catalogSnap.docs) {
        const data = doc.data();

        // Skip if already has embedding
        if (data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
            console.log(`   ⏭️  ${data.name} — already has embedding`);
            skipped++;
            continue;
        }

        const text = `${data.name}\n${data.description || ''}\n${data.location || ''}\n${data.type || ''}\n${data.remarks || ''}`;

        const embedding = await generateEmbedding(text);
        if (embedding) {
            await doc.ref.update({ embedding });
            console.log(`   ✅ ${data.name} — ${embedding.length}d vector`);
            embedded++;
        } else {
            console.log(`   ❌ ${data.name} — failed`);
            failed++;
        }

        // Small delay to avoid rate limit
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n📊 Results: ${embedded} embedded, ${skipped} skipped, ${failed} failed`);
    console.log('✨ Done!\n');
    process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
