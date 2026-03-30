import { adminDb } from '../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { CRMCatalogItem } from '../firebase/crm';

export interface SemanticSearchResult {
    item: CRMCatalogItem;
    score: number;
}

export interface SearchOptions {
    tenantId: string;
    queryVector: number[];
    limit?: number;
    typeFilter?: string[]; // e.g. ['HOTEL', 'ACTIVITY']
}

let missingVectorIndexWarned = false;

/**
 * Perform a KNN vector search on the Firestore catalog natively
 */
export async function searchCatalogSimilar({ 
    tenantId, 
    queryVector, 
    limit = 10,
    typeFilter
}: SearchOptions): Promise<SemanticSearchResult[]> {
    try {
        let catalogRef: any = adminDb.collection('tenants').doc(tenantId).collection('catalog');

        // Optional: pre-filter by type if requested
        if (typeFilter && typeFilter.length > 0) {
            catalogRef = catalogRef.where('type', 'in', typeFilter);
        }

        // Perform nearest neighbor search
        // Note: This requires a composite vector index to be built in Firestore Google Cloud console
        const resultsOpt = catalogRef.findNearest({
            vectorField: 'embedding',
            queryVector: FieldValue.vector(queryVector),
            limit: limit,
            distanceMeasure: 'COSINE'
        });

        // But wait! `findNearest` is available on the Query object in Firestore Node.js Admin SDK v12+
        // However, if we need both distance and the document, the SDK returns the documents sorted by distance.
        const snap = await resultsOpt.get();

        const results: SemanticSearchResult[] = [];
        snap.docs.forEach((doc: any) => {
            // Note: Firebase currently doesn't expose the exact distance score natively on the DocumentData
            // in all SDK versions, but the results are strictly ordered by distance.
            results.push({
                item: { id: doc.id, ...doc.data() } as CRMCatalogItem,
                score: 1.0 // Mock score until SDK exposes the exact distance, but order is correct.
            });
        });

        return results;

    } catch (error: any) {
        // Missing vector index should not break user flows; degrade gracefully.
        if (error?.message?.includes('FAILED_PRECONDITION')) {
            if (!missingVectorIndexWarned) {
                missingVectorIndexWarned = true;
                console.warn('[Vector Store] Missing vector index: semantic search disabled until index is created.');
            }
            return [];
        }

        console.error('[Vector Store] Search error:', error);
        throw error;
    }
}
