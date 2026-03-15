import { NextRequest, NextResponse } from "next/server";
import { generateMultimodalEmbedding } from "@/src/lib/ai/gemini-embeddings";
import { searchCatalogSimilar } from "@/src/lib/ai/vector-store";
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        // Paywall check
        const paywall = await requireSubscription(auth, 'crm');
        if (paywall) return paywall;

        // Rate limit
        const rlRes = rateLimitResponse(getRateLimitKey(req), 'ai');
        if (rlRes) return rlRes;

        const body = await req.json();
        const { text, imageBase64s, tenantId, filterType, limit } = body;

        // Basic validation
        if (!tenantId) {
            return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
        }
        if (!text && (!imageBase64s || imageBase64s.length === 0)) {
            return NextResponse.json({ error: "Query must contain text or an image." }, { status: 400 });
        }

        // 1. Generate the embedding vector for the mixed-modal query
        // The Matryoshka dimension should match what we used during backfill (768).
        const queryEmbedding = await generateMultimodalEmbedding({
            text,
            imageBase64s,
            dimension: 768
        });

        if (!queryEmbedding) {
            return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
        }

        // 2. Perform KNN semantic search on our Firestore Vector DB
        const results = await searchCatalogSimilar({
            tenantId,
            queryVector: queryEmbedding,
            typeFilter: filterType ? [filterType] : undefined,
            limit: limit || 10
        });

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error("[API] /ai/agent-search error:", error);
        
        if (error.message && error.message.includes('FAILED_PRECONDITION')) {
           return NextResponse.json(
               { error: "Vector Search Index is missing in Firestore. Please create it via Google Cloud Console." },
               { status: 428 } // Precondition Required
           );
        }

        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
