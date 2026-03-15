import { NextRequest, NextResponse } from "next/server";
import { generateMultimodalEmbedding } from "@/src/lib/ai/gemini-embeddings";
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        // Rate limit
        const rlRes = rateLimitResponse(getRateLimitKey(req), 'ai');
        if (rlRes) return rlRes;

        const body = await req.json();
        const { text, imageBase64s, dimension } = body;

        if (!text && (!imageBase64s || imageBase64s.length === 0)) {
            return NextResponse.json(
                { error: "Must provide either text or images to generate embedding." },
                { status: 400 }
            );
        }

        const embedding = await generateMultimodalEmbedding({
            text,
            imageBase64s,
            dimension: dimension || 768
        });

        if (!embedding) {
            return NextResponse.json(
                { error: "Failed to generate embedding" },
                { status: 500 }
            );
        }

        return NextResponse.json({ embedding });

    } catch (error: any) {
        console.error("[API] /ai/embed error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
