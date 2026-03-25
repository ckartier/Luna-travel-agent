export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { trackAPIUsage } from '@/src/lib/apiUsageTracker';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/scrape';

const HOTEL_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    stars: { type: 'number' },
    description: { type: 'string' },
    amenities: { type: 'array', items: { type: 'string' } },
    price_range: { type: 'string' },
    location: { type: 'string' },
    check_in: { type: 'string' },
    check_out: { type: 'string' },
  },
};

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;
    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    // Rate limit
    const rlRes = rateLimitResponse(getRateLimitKey(req), 'scrape');
    if (rlRes) return rlRes;

    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'FIRECRAWL_API_KEY non configurée. Ajoutez-la dans .env.local' },
        { status: 500 }
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    const response = await fetch(FIRECRAWL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'extract'],
        extract: { schema: HOTEL_SCHEMA },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Firecrawl] Error:', response.status, errText);
      return NextResponse.json(
        { error: `Firecrawl error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const scraped = data?.data || {};
    const extracted = scraped?.extract || {};
    const metadata = scraped?.metadata || {};
    const markdown = scraped?.markdown || '';

    // Build enrichment result
    const result = {
      name: extracted.name || metadata.title || '',
      description: extracted.description || metadata.description || '',
      location: extracted.location || '',
      stars: extracted.stars || null,
      amenities: extracted.amenities || [],
      priceRange: extracted.price_range || '',
      checkIn: extracted.check_in || '',
      checkOut: extracted.check_out || '',
      image: metadata.ogImage || '',
      website: url,
      contentPreview: markdown.slice(0, 300),
    };

    // Track Firecrawl usage
    if (tenantId) trackAPIUsage(tenantId, 'firecrawl');

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Scrape API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
