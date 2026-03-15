import { adminDb } from '../src/lib/firebase/admin';
import { generateMultimodalEmbedding } from '../src/lib/ai/gemini-embeddings';
import { FieldValue } from 'firebase-admin/firestore';

async function backfillCatalogEmbeddings() {
    console.log('🚀 Starting catalog embeddings backfill...');

    try {
        const tenantsSnap = await adminDb.collection('tenants').get();
        if (tenantsSnap.empty) {
            console.log('❌ No tenants found.');
            return;
        }

        let processed = 0;
        let skipped = 0;
        let errors = 0;

        for (const tenant of tenantsSnap.docs) {
            console.log(`\n🏢 Processing tenant: ${tenant.id} (${tenant.data().name || 'Unknown'})`);
            
            const catalogRef = adminDb.collection('tenants').doc(tenant.id).collection('catalog');
            const itemsSnap = await catalogRef.get();
            
            console.log(`Found ${itemsSnap.size} items in catalog.`);

            for (const doc of itemsSnap.docs) {
                const item = doc.data();

                // Skip if it already has an embedding
                if (item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0) {
                    console.log(`⏭️  Skipping [${item.name || doc.id}] - already has embedding`);
                    skipped++;
                    continue;
                }

                console.log(`🔄 Generating embedding for: ${item.name || doc.id} (Type: ${item.type})`);
                
                try {
                    // Combine relevant text fields for the AI
                    const textContent = [
                        item.name || '',
                        item.description || '',
                        item.location || '',
                        item.type || '',
                        item.supplier || '',
                        item.languages ? item.languages.join(', ') : ''
                    ].filter(Boolean).join('\n');

                    // Pass up to 3 images to generate a multimodal vector (saves bandwidth and API usage)
                    const imageBase64s = (item.images || []).slice(0, 3);
                    if (item.imageUrl && imageBase64s.length === 0) {
                        imageBase64s.push(item.imageUrl);
                    }

                    // For the backfill script, we might not want to download the base64 of every image natively here 
                    // unless we fetch it. But the model requires base64 if it's not a gs:// url. 
                    // To keep this script fast and reliable for the backend, we will mostly rely on TEXT embeddings
                    // for the backfill, and future edits from the UI will have base64 loaded!
                    
                    const embeddingVectorArray = await generateMultimodalEmbedding({
                        text: textContent,
                        imageBase64s: [] // we don't have base64 strings easily available server-side without fetching them
                    });

                    if (embeddingVectorArray) {
                        // Store it using the Admin SDK's native vector support
                        await doc.ref.update({
                            embedding: FieldValue.vector(embeddingVectorArray)
                        });
                        console.log(`✅ Success [${item.name}]`);
                        processed++;
                    } else {
                        console.log(`⚠️  Failed generation [${item.name}]`);
                        errors++;
                    }
                } catch (err: any) {
                    console.error(`❌ Error on [${item.name}]:`, err.message);
                    errors++;
                }

                // Sleep to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('\n=======================================');
        console.log('🎉 Backfill complete!');
        console.log(`  Processed: ${processed}`);
        console.log(`  Skipped:   ${skipped}`);
        console.log(`  Errors:    ${errors}`);
        console.log('=======================================');

    } catch (error) {
        console.error('Fatal error during backfill:', error);
    }
}

// Execute
backfillCatalogEmbeddings().then(() => process.exit(0)).catch(() => process.exit(1));
