import { NextResponse } from 'next/server';

// ── AMADEUS API INTEGRATION ─────────────────────────────────────────
// Requires free registration at https://developers.amadeus.com
// Set AMADEUS_API_KEY and AMADEUS_API_SECRET in .env.local
//
// Endpoints used:
// - POST /v1/security/oauth2/token  (auth)
// - GET  /v2/shopping/flight-offers (flights)
// - GET  /v1/reference-data/locations (airport search)

const AMADEUS_BASE = 'https://api.amadeus.com'; // production
const AMADEUS_TEST_BASE = 'https://test.api.amadeus.com'; // test env

let cachedToken: { token: string; expires: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
    const key = process.env.AMADEUS_API_KEY;
    const secret = process.env.AMADEUS_API_SECRET;
    if (!key || !secret) return null;

    // Use cached token if still valid
    if (cachedToken && cachedToken.expires > Date.now()) {
        return cachedToken.token;
    }

    const base = process.env.AMADEUS_ENV === 'production' ? AMADEUS_BASE : AMADEUS_TEST_BASE;

    const res = await fetch(`${base}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${key}&client_secret=${secret}`,
    });

    if (!res.ok) {
        console.error('Amadeus auth failed:', res.status);
        return null;
    }

    const data = await res.json();
    cachedToken = {
        token: data.access_token,
        expires: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s before expiry
    };
    return cachedToken.token;
}

// ── IATA CODE LOOKUP ────────────────────────────────────────────────
const CITY_IATA: Record<string, string> = {
    'paris': 'CDG', 'lyon': 'LYS', 'marseille': 'MRS', 'nice': 'NCE', 'toulouse': 'TLS',
    'bordeaux': 'BOD', 'nantes': 'NTE', 'strasbourg': 'SXB', 'lille': 'LIL', 'montpellier': 'MPL',
    'london': 'LHR', 'londres': 'LHR', 'new york': 'JFK', 'los angeles': 'LAX', 'tokyo': 'NRT',
    'dubai': 'DXB', 'singapour': 'SIN', 'singapore': 'SIN', 'bangkok': 'BKK', 'bali': 'DPS',
    'rome': 'FCO', 'barcelone': 'BCN', 'barcelona': 'BCN', 'madrid': 'MAD', 'lisbonne': 'LIS',
    'lisbon': 'LIS', 'berlin': 'BER', 'amsterdam': 'AMS', 'istanbul': 'IST', 'athènes': 'ATH',
    'athens': 'ATH', 'marrakech': 'RAK', 'casablanca': 'CMN', 'tunis': 'TUN', 'le caire': 'CAI',
    'cairo': 'CAI', 'sydney': 'SYD', 'melbourne': 'MEL', 'auckland': 'AKL', 'hong kong': 'HKG',
    'séoul': 'ICN', 'seoul': 'ICN', 'mumbai': 'BOM', 'delhi': 'DEL', 'taipei': 'TPE',
    'kuala lumpur': 'KUL', 'san francisco': 'SFO', 'miami': 'MIA', 'chicago': 'ORD',
    'toronto': 'YYZ', 'montreal': 'YUL', 'mexico': 'MEX', 'lima': 'LIM', 'buenos aires': 'EZE',
    'são paulo': 'GRU', 'bogota': 'BOG', 'santiago': 'SCL', 'nairobi': 'NBO', 'cape town': 'CPT',
    'johannesburg': 'JNB', 'addis ababa': 'ADD', 'doha': 'DOH', 'abu dhabi': 'AUH',
    'maldives': 'MLE', 'ile maurice': 'MRU', 'mauritius': 'MRU', 'seychelles': 'SEZ',
    'phuket': 'HKT', 'cancun': 'CUN', 'zanzibar': 'ZNZ', 'dakar': 'DSS',
    'reykjavik': 'KEF', 'oslo': 'OSL', 'copenhague': 'CPH', 'stockholm': 'ARN', 'helsinki': 'HEL',
    'vienne': 'VIE', 'vienna': 'VIE', 'prague': 'PRG', 'varsovie': 'WAW', 'warsaw': 'WAW',
    'budapest': 'BUD', 'dubrovnik': 'DBV', 'malte': 'MLA', 'malta': 'MLA',
};

function getIata(city: string): string {
    const lower = city.toLowerCase().trim();
    if (CITY_IATA[lower]) return CITY_IATA[lower];
    // Try partial match
    for (const [name, code] of Object.entries(CITY_IATA)) {
        if (lower.includes(name) || name.includes(lower)) return code;
    }
    return city.substring(0, 3).toUpperCase();
}

// ── SEARCH FLIGHTS ──────────────────────────────────────────────────
async function searchFlights(token: string, from: string, to: string, date: string, pax: number = 1) {
    const base = process.env.AMADEUS_ENV === 'production' ? AMADEUS_BASE : AMADEUS_TEST_BASE;
    const fromCode = getIata(from);
    const toCode = getIata(to);

    const params = new URLSearchParams({
        originLocationCode: fromCode,
        destinationLocationCode: toCode,
        departureDate: date,
        adults: String(pax),
        max: '10',
        currencyCode: 'EUR',
    });

    const res = await fetch(`${base}/v2/shopping/flight-offers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        console.error('Amadeus flight search failed:', res.status);
        return [];
    }

    const data = await res.json();
    return (data.data || []).map((offer: any) => {
        const seg = offer.itineraries?.[0]?.segments || [];
        const airline = seg[0]?.carrierCode || '??';
        const stops = seg.length - 1;
        const dep = seg[0]?.departure?.iataCode || fromCode;
        const arr = seg[seg.length - 1]?.arrival?.iataCode || toCode;
        const via = stops > 0 ? seg.slice(0, -1).map((s: any) => s.arrival?.iataCode).join(', ') : null;
        const duration = offer.itineraries?.[0]?.duration?.replace('PT', '').replace('H', 'h').replace('M', 'min') || '';
        const price = offer.price?.total ? `${parseFloat(offer.price.total).toFixed(0)} €` : '—';
        const cabin = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';

        return {
            airline: airline,
            route: stops > 0 ? `${dep} → ${via} → ${arr}` : `${dep} → ${arr}`,
            class: cabin.charAt(0) + cabin.slice(1).toLowerCase(),
            price: `À partir de ${price} par personne`,
            duration: duration,
            stops: String(stops),
            stopCity: via,
            domain: `${airline.toLowerCase()}.com`,
        };
    });
}

// ── API ROUTE ───────────────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { from, to, date, pax, type } = body;

        if (!from || !to) {
            return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
        }

        const token = await getAmadeusToken();
        if (!token) {
            return NextResponse.json({
                available: false,
                message: 'Amadeus API non configurée. Ajoutez AMADEUS_API_KEY et AMADEUS_API_SECRET dans .env.local',
            });
        }

        if (type === 'flights' || !type) {
            const flights = await searchFlights(token, from, to, date || new Date().toISOString().slice(0, 10), pax || 1);
            return NextResponse.json({ available: true, flights, source: 'amadeus' });
        }

        return NextResponse.json({ available: true, message: 'Endpoint ready' });
    } catch (error: any) {
        console.error('Amadeus API error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

// Also support GET for health check
export async function GET() {
    const hasKeys = !!(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
    return NextResponse.json({
        available: hasKeys,
        env: process.env.AMADEUS_ENV || 'test',
        message: hasKeys
            ? 'Amadeus API configurée et prête'
            : 'Clés API manquantes. Inscrivez-vous gratuitement sur developers.amadeus.com',
    });
}
