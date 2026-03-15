import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

/**
 * POST /api/crm/scrape-supplier
 * Scrapes a supplier's website via Firecrawl to extract images and metadata.
 * Strategy: ogImage → twitterImage → first large image from markdown → screenshot
 * Body: { url: string }
 * Returns: { image, title, description }
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;

        // Rate limit
        const rlRes = rateLimitResponse(getRateLimitKey(request), 'scrape');
        if (rlRes) return rlRes;

        const body = await request.json();
        const { url } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL requise' }, { status: 400 });
        }

        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'FIRECRAWL_API_KEY non configurée' }, { status: 500 });
        }

        // Scrape the URL with Firecrawl — request both markdown and screenshot
        const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                formats: ['markdown', 'screenshot'],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('[scrape-supplier] Firecrawl error:', err);
            return NextResponse.json({ error: 'Erreur Firecrawl' }, { status: 502 });
        }

        const data = await res.json();
        const metadata = data?.data?.metadata || {};
        const markdown = data?.data?.markdown || '';
        const screenshot = data?.data?.screenshot || '';

        // Strategy 1: OG / Twitter meta images
        let image = metadata.ogImage || metadata.twitterImage || metadata.image || '';

        // Strategy 2: Extract images from markdown content
        if (!image && markdown) {
            const imgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
            const images: string[] = [];
            let match;
            while ((match = imgRegex.exec(markdown)) !== null) {
                const imgUrl = match[1];
                // Filter out tiny icons, SVGs, tracking pixels
                if (
                    !imgUrl.includes('.svg') &&
                    !imgUrl.includes('pixel') &&
                    !imgUrl.includes('tracking') &&
                    !imgUrl.includes('favicon') &&
                    !imgUrl.includes('logo') &&
                    !imgUrl.includes('icon') &&
                    !imgUrl.includes('badge') &&
                    !imgUrl.includes('1x1')
                ) {
                    images.push(imgUrl);
                }
            }
            // Pick the first qualifying image (usually hero/banner)
            if (images.length > 0) {
                image = images[0];
            }
        }

        // Strategy 3: Use Firecrawl screenshot as last resort
        if (!image && screenshot) {
            image = screenshot;
        }

        // Extract useful metadata
        const title = metadata.ogTitle || metadata.title || '';
        const description = metadata.ogDescription || metadata.description || '';

        console.log(`[scrape-supplier] ${url} → image: ${image ? 'FOUND' : 'NONE'} (source: ${image === screenshot ? 'screenshot' : image === metadata.ogImage ? 'ogImage' : 'markdown'})`);

        return NextResponse.json({
            success: true,
            image,
            title,
            description,
            sourceUrl: metadata.sourceURL || url,
        });

    } catch (error: any) {
        console.error('[scrape-supplier] Error:', error);
        return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
    }
}
