import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetching live real-world flights over Europe (Bounding box) from OpenSky Network
        // lamin, lomin, lamax, lomax
        // Europe approx: lamin=35, lomin=-10, lamax=60, lomax=30
        const response = await fetch('https://opensky-network.org/api/states/all?lamin=35&lomin=-10&lamax=60&lomax=30', {
            next: { revalidate: 30 },
            headers: {
                'User-Agent': 'LunaTravelSaaS/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`OpenSky API responded with ${response.status}`);
        }

        const data = await response.json();

        if (data && data.states) {
            // Map OpenSky state vectors to our App's Plane format
            // State vector index:
            // 0: icao24, 1: callsign, 2: origin_country, 5: longitude, 6: latitude, 10: true_track
            const livePlanes = data.states
                .filter((state: any) => state[5] !== null && state[6] !== null && state[1] !== null && state[1].trim() !== '')
                .slice(0, 40) // Limit to 40 planes so we don't overwhelm the UI/Mapbox
                .map((state: any, index: number) => ({
                    id: state[0] || index,
                    callsign: state[1].trim(),
                    lng: state[5],
                    lat: state[6],
                    rotate: state[10] || 0,
                    label: state[1].trim(),
                    origin_country: state[2] || 'Unknown',
                    altitude: state[7] || null,
                    velocity: state[9] || null,
                }));

            return NextResponse.json({ flights: livePlanes, live: true });
        }
    } catch (error) {
        console.error("Flight API Error (OpenSky):", error);
    }

    // Fallback if OpenSky fails (rate limits, etc)
    const fallbackFlights = [
        { id: '1', lat: 48.8566, lng: 2.3522, rotate: 45, label: 'LNA-212' },
        { id: '2', lat: 40.7128, lng: -74.0060, rotate: -15, label: 'LNA-401' },
        { id: '3', lat: 35.6762, lng: 139.6503, rotate: 110, label: 'LNA-410' },
        { id: '4', lat: 25.2048, lng: 55.2708, rotate: -10, label: 'DXB-SYR' },
        { id: '5', lat: -33.8688, lng: 151.2093, rotate: 135, label: 'DXB-SYD' },
    ];

    return NextResponse.json({ flights: fallbackFlights, live: false, fallback: true });
}
