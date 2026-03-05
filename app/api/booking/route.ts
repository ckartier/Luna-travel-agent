import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// ── BOOKING.COM API via RapidAPI ────────────────────────────────────
// Free tier: 500 requests/month
// Subscribe: https://rapidapi.com/tipsters/api/booking-com
// Set RAPIDAPI_KEY in .env.local

const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com';

function getHeaders(): Record<string, string> | null {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return null;
    return {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
    };
}

// ── Step 1: Resolve city name → dest_id ─────────────────────────────
async function resolveDestination(city: string): Promise<{ dest_id: string; dest_type: string } | null> {
    const headers = getHeaders();
    if (!headers) return null;

    const params = new URLSearchParams({
        name: city,
        locale: 'fr',
    });

    const res = await fetch(
        `https://${RAPIDAPI_HOST}/v1/hotels/locations?${params}`,
        { headers }
    );

    if (!res.ok) {
        console.error('Booking.com location search failed:', res.status);
        return null;
    }

    const data = await res.json();
    // Find first city-type result
    const cityResult = data?.find((d: any) => d.dest_type === 'city') || data?.[0];
    if (!cityResult) return null;

    return {
        dest_id: cityResult.dest_id,
        dest_type: cityResult.dest_type || 'city',
    };
}

// ── Step 2: Search hotels ───────────────────────────────────────────
async function searchHotels(
    dest_id: string,
    dest_type: string,
    checkin: string,
    checkout: string,
    adults: number = 2,
    rooms: number = 1,
) {
    const headers = getHeaders();
    if (!headers) return [];

    const params = new URLSearchParams({
        dest_id,
        dest_type,
        checkin_date: checkin,
        checkout_date: checkout,
        adults_number: String(adults),
        room_number: String(rooms),
        order_by: 'review_score',
        filter_by_currency: 'EUR',
        locale: 'fr',
        units: 'metric',
        include_adjacency: 'true',
        page_number: '0',
    });

    const res = await fetch(
        `https://${RAPIDAPI_HOST}/v1/hotels/search?${params}`,
        { headers }
    );

    if (!res.ok) {
        console.error('Booking.com hotel search failed:', res.status);
        return [];
    }

    const data = await res.json();
    const results = data?.result || [];

    return results.slice(0, 10).map((hotel: any) => {
        const price = hotel.min_total_price || hotel.composite_price_breakdown?.gross_amount?.value || hotel.price_breakdown?.gross_price || null;
        const priceFormatted = price ? `${Math.round(Number(price))} €` : 'Sur demande';
        const nights = Math.max(1, Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
        const pricePerNight = price ? `${Math.round(Number(price) / nights)} €` : 'Sur demande';

        const stars = hotel.class || hotel.hotel_class || 0;
        const highlights: string[] = [];
        if (hotel.hotel_facilities) highlights.push(...hotel.hotel_facilities.split(',').slice(0, 3).map((s: string) => s.trim()));
        if (hotel.distance_to_cc) highlights.push(`${hotel.distance_to_cc} du centre`);
        if (stars >= 5) highlights.push('Palace');
        if (hotel.is_free_cancellable) highlights.push('Annulation gratuite');

        return {
            name: hotel.hotel_name || hotel.hotel_name_trans || 'Hôtel',
            destination: hotel.city_name_en || hotel.city || '',
            stars: Math.round(stars),
            pricePerNight,
            priceTotal: priceFormatted,
            highlights: highlights.length > 0 ? highlights : ['Hôtel de qualité'],
            recommendation: hotel.unit_configuration_label || null,
            rating: hotel.review_score ? `${hotel.review_score}/10` : null,
            reviewCount: hotel.review_nr || 0,
            reviewWord: hotel.review_score_word || null,
            photoUrl: hotel.max_photo_url || hotel.main_photo_url || null,
            url: hotel.url || `https://www.booking.com/hotel/${hotel.cc1}/${hotel.hotel_id}.html`,
            domain: 'booking.com',
            source: 'booking.com',
        };
    });
}

// ── API Route ───────────────────────────────────────────────────────
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const body = await request.json();
        const { city, checkin, checkout, adults, rooms } = body;

        if (!city) {
            return NextResponse.json({ error: 'city is required' }, { status: 400 });
        }

        const headers = getHeaders();
        if (!headers) {
            return NextResponse.json({
                available: false,
                message: 'Booking.com API non configurée. Ajoutez RAPIDAPI_KEY dans .env.local',
                hotels: [],
            });
        }

        // Default dates: tomorrow → +3 days
        const now = new Date();
        const defaultCheckin = checkin || new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
        const defaultCheckout = checkout || new Date(now.getTime() + 4 * 86400000).toISOString().slice(0, 10);

        // Resolve destination
        const dest = await resolveDestination(city);
        if (!dest) {
            return NextResponse.json({
                available: true,
                hotels: [],
                message: `Impossible de trouver la destination "${city}"`,
            });
        }

        // Search hotels
        const hotels = await searchHotels(
            dest.dest_id,
            dest.dest_type,
            defaultCheckin,
            defaultCheckout,
            adults || 2,
            rooms || 1,
        );

        return NextResponse.json({
            available: true,
            hotels,
            source: 'booking.com',
            destination: city,
            dates: { checkin: defaultCheckin, checkout: defaultCheckout },
        });

    } catch (error: any) {
        console.error('Booking.com API error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

// Health check
export async function GET(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const hasKey = !!process.env.RAPIDAPI_KEY;
    return NextResponse.json({
        available: hasKey,
        message: hasKey
            ? 'Booking.com API configurée (via RapidAPI)'
            : 'RAPIDAPI_KEY manquante. Inscrivez-vous gratuitement sur rapidapi.com',
    });
}
