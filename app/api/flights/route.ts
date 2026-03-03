import { NextResponse } from 'next/server';

// ── GLOBAL AIRPORTS DATABASE ──────────────────────────────────────
const AIRPORTS: Record<string, { code: string; iata: string; city: string; lat: number; lng: number }> = {
    'LFPG': { code: 'LFPG', iata: 'CDG', city: 'Paris', lat: 49.01, lng: 2.55 },
    'EGLL': { code: 'EGLL', iata: 'LHR', city: 'London', lat: 51.47, lng: -0.45 },
    'EDDF': { code: 'EDDF', iata: 'FRA', city: 'Frankfurt', lat: 50.04, lng: 8.56 },
    'KJFK': { code: 'KJFK', iata: 'JFK', city: 'New York', lat: 40.64, lng: -73.78 },
    'KLAX': { code: 'KLAX', iata: 'LAX', city: 'Los Angeles', lat: 33.94, lng: -118.41 },
    'RJTT': { code: 'RJTT', iata: 'HND', city: 'Tokyo', lat: 35.55, lng: 139.78 },
    'RJAA': { code: 'RJAA', iata: 'NRT', city: 'Tokyo Narita', lat: 35.76, lng: 140.39 },
    'WSSS': { code: 'WSSS', iata: 'SIN', city: 'Singapore', lat: 1.36, lng: 103.99 },
    'OMDB': { code: 'OMDB', iata: 'DXB', city: 'Dubai', lat: 25.25, lng: 55.36 },
    'YSSY': { code: 'YSSY', iata: 'SYD', city: 'Sydney', lat: -33.95, lng: 151.18 },
    'FAOR': { code: 'FAOR', iata: 'JNB', city: 'Johannesburg', lat: -26.14, lng: 28.25 },
    'SBGR': { code: 'SBGR', iata: 'GRU', city: 'São Paulo', lat: -23.43, lng: -46.47 },
    'LEMD': { code: 'LEMD', iata: 'MAD', city: 'Madrid', lat: 40.49, lng: -3.57 },
    'LTFM': { code: 'LTFM', iata: 'IST', city: 'Istanbul', lat: 41.28, lng: 28.75 },
    'VHHH': { code: 'VHHH', iata: 'HKG', city: 'Hong Kong', lat: 22.31, lng: 113.92 },
    'VIDP': { code: 'VIDP', iata: 'DEL', city: 'Delhi', lat: 28.57, lng: 77.10 },
    'EHAM': { code: 'EHAM', iata: 'AMS', city: 'Amsterdam', lat: 52.31, lng: 4.76 },
    'LIRF': { code: 'LIRF', iata: 'FCO', city: 'Rome', lat: 41.80, lng: 12.24 },
    'ZBAA': { code: 'ZBAA', iata: 'PEK', city: 'Beijing', lat: 40.08, lng: 116.58 },
    'CYYZ': { code: 'CYYZ', iata: 'YYZ', city: 'Toronto', lat: 43.68, lng: -79.63 },
    'MMMX': { code: 'MMMX', iata: 'MEX', city: 'Mexico City', lat: 19.44, lng: -99.07 },
    'HAAB': { code: 'HAAB', iata: 'ADD', city: 'Addis Ababa', lat: 8.98, lng: 38.80 },
    'NZAA': { code: 'NZAA', iata: 'AKL', city: 'Auckland', lat: -37.01, lng: 174.79 },
    'RKSI': { code: 'RKSI', iata: 'ICN', city: 'Seoul', lat: 37.46, lng: 126.44 },
    'KORD': { code: 'KORD', iata: 'ORD', city: 'Chicago', lat: 41.98, lng: -87.91 },
    'KATL': { code: 'KATL', iata: 'ATL', city: 'Atlanta', lat: 33.64, lng: -84.43 },
    'VABB': { code: 'VABB', iata: 'BOM', city: 'Mumbai', lat: 19.09, lng: 72.87 },
    'VTBS': { code: 'VTBS', iata: 'BKK', city: 'Bangkok', lat: 13.69, lng: 100.75 },
    'LFBO': { code: 'LFBO', iata: 'TLS', city: 'Toulouse', lat: 43.63, lng: 1.37 },
    'LSZH': { code: 'LSZH', iata: 'ZRH', city: 'Zürich', lat: 47.46, lng: 8.55 },
    'EGKK': { code: 'EGKK', iata: 'LGW', city: 'London Gatwick', lat: 51.15, lng: -0.19 },
    'KSFO': { code: 'KSFO', iata: 'SFO', city: 'San Francisco', lat: 37.62, lng: -122.38 },
    'KDFW': { code: 'KDFW', iata: 'DFW', city: 'Dallas', lat: 32.90, lng: -97.04 },
    'KDEN': { code: 'KDEN', iata: 'DEN', city: 'Denver', lat: 39.86, lng: -104.67 },
    'KMIA': { code: 'KMIA', iata: 'MIA', city: 'Miami', lat: 25.80, lng: -80.29 },
    'RPLL': { code: 'RPLL', iata: 'MNL', city: 'Manila', lat: 14.51, lng: 121.02 },
    'WIII': { code: 'WIII', iata: 'CGK', city: 'Jakarta', lat: -6.13, lng: 106.66 },
    'HECA': { code: 'HECA', iata: 'CAI', city: 'Cairo', lat: 30.12, lng: 31.41 },
    'GMMN': { code: 'GMMN', iata: 'CMN', city: 'Casablanca', lat: 33.37, lng: -7.59 },
    'DNMM': { code: 'DNMM', iata: 'LOS', city: 'Lagos', lat: 6.58, lng: 3.32 },
    'SCEL': { code: 'SCEL', iata: 'SCL', city: 'Santiago', lat: -33.39, lng: -70.79 },
    'SAEZ': { code: 'SAEZ', iata: 'EZE', city: 'Buenos Aires', lat: -34.82, lng: -58.54 },
    'OEJN': { code: 'OEJN', iata: 'JED', city: 'Jeddah', lat: 21.68, lng: 39.16 },
    'OTHH': { code: 'OTHH', iata: 'DOH', city: 'Doha', lat: 25.26, lng: 51.57 },
};

const AIRPORT_LIST = Object.entries(AIRPORTS);

// ── AIRLINE COLORS ──────────────────────────────────────────────
const AIRLINE_COLORS: Record<string, string> = {
    'AFR': '#3b82f6', 'BAW': '#1e40af', 'DLH': '#f59e0b', 'EZY': '#f97316',
    'RYR': '#eab308', 'UAE': '#dc2626', 'THY': '#ef4444', 'SAS': '#6366f1',
    'AZA': '#22c55e', 'IBE': '#dc2626', 'KLM': '#0ea5e9', 'SWR': '#dc2626',
    'TAP': '#22c55e', 'QFA': '#dc2626', 'AAL': '#3b82f6', 'UAL': '#1e40af',
    'DAL': '#6366f1', 'ANA': '#3b82f6', 'JAL': '#dc2626', 'CPA': '#22c55e',
    'SIA': '#f59e0b', 'ETH': '#22c55e', 'SAA': '#22c55e', 'LAN': '#6366f1',
    'AVA': '#dc2626', 'CSN': '#3b82f6', 'CCA': '#dc2626', 'SWA': '#f59e0b',
    'ENY': '#6366f1', 'ASA': '#0ea5e9', 'JBU': '#3b82f6', 'ACA': '#dc2626',
};

const AIRLINE_NAMES: Record<string, string> = {
    'AFR': 'Air France', 'BAW': 'British Airways', 'DLH': 'Lufthansa', 'EZY': 'easyJet',
    'RYR': 'Ryanair', 'UAE': 'Emirates', 'THY': 'Turkish Airlines', 'KLM': 'KLM',
    'QFA': 'Qantas', 'AAL': 'American Airlines', 'UAL': 'United Airlines',
    'DAL': 'Delta', 'ANA': 'ANA', 'JAL': 'JAL', 'SIA': 'Singapore Airlines',
    'ETH': 'Ethiopian', 'SWA': 'Southwest', 'CPA': 'Cathay Pacific',
    'CSN': 'China Southern', 'CCA': 'Air China', 'ACA': 'Air Canada',
    'JBU': 'JetBlue', 'ASA': 'Alaska Airlines', 'ENY': 'Envoy Air',
    'SWR': 'Swiss', 'TAP': 'TAP Portugal', 'IBE': 'Iberia', 'AVA': 'Avianca',
};

function findNearestAirport(lat: number, lng: number): typeof AIRPORTS[string] | null {
    let nearest = AIRPORT_LIST[0][1]; let minDist = Infinity;
    for (const [, airport] of AIRPORT_LIST) {
        const d = Math.pow(lat - airport.lat, 2) + Math.pow(lng - airport.lng, 2);
        if (d < minDist) { minDist = d; nearest = airport; }
    }
    return minDist < 2500 ? nearest : null; // Must be within ~50°
}

function estimateDestination(lat: number, lng: number, heading: number, speed: number): typeof AIRPORTS[string] {
    const RAD = Math.PI / 180;
    const flightDistDeg = Math.max(8, (speed || 250) / 30); // rough estimate
    const destLat = lat + Math.cos(heading * RAD) * flightDistDeg;
    const destLng = lng + Math.sin(heading * RAD) * flightDistDeg;

    let best = AIRPORT_LIST[0][1]; let minDist = Infinity;
    for (const [, airport] of AIRPORT_LIST) {
        const d = Math.pow(destLat - airport.lat, 2) + Math.pow(destLng - airport.lng, 2);
        if (d < minDist) { minDist = d; best = airport; }
    }
    return best;
}

function getColor(callsign: string): string {
    const prefix = callsign.substring(0, 3).toUpperCase();
    return AIRLINE_COLORS[prefix] || '#64748b';
}

function getAirlineName(callsign: string): string {
    const prefix = callsign.substring(0, 3).toUpperCase();
    return AIRLINE_NAMES[prefix] || callsign;
}

function getCountryFlag(country: string): string {
    const flags: Record<string, string> = {
        'France': '🇫🇷', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'United States': '🇺🇸',
        'Japan': '🇯🇵', 'Australia': '🇦🇺', 'United Arab Emirates': '🇦🇪', 'China': '🇨🇳',
        'Singapore': '🇸🇬', 'Turkey': '🇹🇷', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
        'Netherlands': '🇳🇱', 'Switzerland': '🇨🇭', 'Brazil': '🇧🇷', 'Canada': '🇨🇦',
        'India': '🇮🇳', 'South Korea': '🇰🇷', 'Thailand': '🇹🇭', 'Mexico': '🇲🇽',
        'Ethiopia': '🇪🇹', 'South Africa': '🇿🇦', 'Hong Kong': '🇭🇰', 'Portugal': '🇵🇹',
        'Ireland': '🇮🇪', 'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'Colombia': '🇨🇴',
    };
    return flags[country] || '✈️';
}

// ── FETCH REAL FLIGHTS FROM OPENSKY ─────────────────────────────
export async function GET() {
    try {
        // Query OpenSky — no bounding box = worldwide
        const response = await fetch('https://opensky-network.org/api/states/all', {
            next: { revalidate: 30 }, // Refresh every 30s
            headers: { 'User-Agent': 'LunaTravelSaaS/2.0' },
        });

        if (!response.ok) throw new Error(`OpenSky HTTP ${response.status}`);
        const data = await response.json();

        if (!data?.states || data.states.length === 0) throw new Error('No states');

        // Filter valid flights with callsign + position + altitude > 1000m (airborne)
        const validFlights = data.states.filter((s: any) =>
            s[1]?.trim() &&          // has callsign
            s[5] !== null &&          // has longitude
            s[6] !== null &&          // has latitude
            (s[7] || 0) > 1000 &&    // airborne (altitude > 1km)
            (s[9] || 0) > 100        // moving (speed > 100 m/s ~ 360 km/h)
        );

        // Distribute geographically: pick from different world regions
        const regions = {
            europe: validFlights.filter((s: any) => s[6] > 35 && s[6] < 72 && s[5] > -15 && s[5] < 45),
            northAmerica: validFlights.filter((s: any) => s[6] > 15 && s[6] < 72 && s[5] > -140 && s[5] < -50),
            asia: validFlights.filter((s: any) => s[6] > 0 && s[6] < 60 && s[5] > 60 && s[5] < 150),
            middleEast: validFlights.filter((s: any) => s[6] > 10 && s[6] < 45 && s[5] > 25 && s[5] < 65),
            africa: validFlights.filter((s: any) => s[6] > -40 && s[6] < 35 && s[5] > -20 && s[5] < 55),
            southAmerica: validFlights.filter((s: any) => s[6] > -60 && s[6] < 15 && s[5] > -90 && s[5] < -30),
            oceania: validFlights.filter((s: any) => s[6] > -50 && s[6] < 0 && s[5] > 100 && s[5] < 180),
            atlantic: validFlights.filter((s: any) => s[6] > 20 && s[6] < 60 && s[5] > -50 && s[5] < -15),
        };

        // Pick up to 4 from each region for good distribution
        const selected: any[] = [];
        for (const [, regionFlights] of Object.entries(regions)) {
            const shuffled = regionFlights.sort(() => Math.random() - 0.5);
            selected.push(...shuffled.slice(0, 4));
        }

        // If we have fewer than 20, add more from the global pool
        if (selected.length < 20) {
            const remaining = validFlights
                .filter((s: any) => !selected.includes(s))
                .sort(() => Math.random() - 0.5);
            selected.push(...remaining.slice(0, 20 - selected.length));
        }

        // Map to our format
        const flights = selected.slice(0, 30).map((s: any) => {
            const callsign = s[1].trim();
            const lat = s[6];
            const lng = s[5];
            const heading = s[10] || 0;
            const speed = s[9] || 250;
            const altitude = s[7] || 10000;
            const country = s[2] || 'Unknown';
            const color = getColor(callsign);
            const airline = getAirlineName(callsign);
            const flag = getCountryFlag(country);

            // Find nearest airport as departure
            const dep = findNearestAirport(lat, lng);
            // Estimate arrival based on heading + speed
            const arr = estimateDestination(lat, lng, heading, speed);

            // Avoid same dep/arr
            const departure = dep || AIRPORT_LIST[0][1];
            let arrival = arr;
            if (departure.iata === arrival.iata) {
                // Pick a different airport far away
                const farAirports = AIRPORT_LIST
                    .filter(([, a]) => Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2) > 500)
                    .sort(() => Math.random() - 0.5);
                arrival = farAirports[0]?.[1] || AIRPORT_LIST[Math.floor(Math.random() * AIRPORT_LIST.length)][1];
            }

            return {
                id: s[0] || callsign,
                callsign, lat, lng,
                rotate: heading,
                label: callsign,
                origin_country: country,
                altitude: Math.round(altitude),
                velocity: Math.round(speed),
                airline,
                airlineLogo: flag,
                flightNumber: callsign,
                color,
                departure: { code: departure.iata, city: departure.city, lat: departure.lat, lng: departure.lng },
                arrival: { code: arrival.iata, city: arrival.city, lat: arrival.lat, lng: arrival.lng },
                stops: Math.random() > 0.8 ? 1 : 0,
                stopCity: null,
                live: true,
            };
        });

        return NextResponse.json({
            flights,
            live: true,
            source: 'OpenSky Network',
            count: flights.length,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Flight API Error:', error.message);

        // Return minimal worldwide fallback
        return NextResponse.json({
            flights: [
                { id: '1', callsign: 'AF1234', lat: 48.5, lng: 8.0, rotate: 45, label: 'AF1234', origin_country: 'France', altitude: 10500, velocity: 250, airline: 'Air France', airlineLogo: '🇫🇷', flightNumber: 'AF1234', color: '#3b82f6', departure: { code: 'CDG', city: 'Paris', lat: 49.01, lng: 2.55 }, arrival: { code: 'JFK', city: 'New York', lat: 40.64, lng: -73.78 }, stops: 0, stopCity: null, live: false },
                { id: '2', callsign: 'JL802', lat: 30.0, lng: 125.0, rotate: -60, label: 'JL802', origin_country: 'Japan', altitude: 11000, velocity: 270, airline: 'JAL', airlineLogo: '🇯🇵', flightNumber: 'JL802', color: '#dc2626', departure: { code: 'HND', city: 'Tokyo', lat: 35.55, lng: 139.78 }, arrival: { code: 'SIN', city: 'Singapore', lat: 1.36, lng: 103.99 }, stops: 0, stopCity: null, live: false },
                { id: '3', callsign: 'QF1', lat: -25.0, lng: 140.0, rotate: 300, label: 'QF1', origin_country: 'Australia', altitude: 12000, velocity: 280, airline: 'Qantas', airlineLogo: '🇦🇺', flightNumber: 'QF1', color: '#dc2626', departure: { code: 'SYD', city: 'Sydney', lat: -33.95, lng: 151.18 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 1, stopCity: 'Singapore', live: false },
                { id: '4', callsign: 'AA100', lat: 50.0, lng: -35.0, rotate: 70, label: 'AA100', origin_country: 'USA', altitude: 10500, velocity: 260, airline: 'American Airlines', airlineLogo: '🇺🇸', flightNumber: 'AA100', color: '#8b5cf6', departure: { code: 'JFK', city: 'New York', lat: 40.64, lng: -73.78 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 0, stopCity: null, live: false },
                { id: '5', callsign: 'ET700', lat: 20.0, lng: 45.0, rotate: 60, label: 'ET700', origin_country: 'Ethiopia', altitude: 11500, velocity: 250, airline: 'Ethiopian', airlineLogo: '🇪🇹', flightNumber: 'ET700', color: '#22c55e', departure: { code: 'ADD', city: 'Addis Ababa', lat: 8.98, lng: 38.80 }, arrival: { code: 'PEK', city: 'Beijing', lat: 40.08, lng: 116.58 }, stops: 0, stopCity: null, live: false },
                { id: '6', callsign: 'LA800', lat: -10.0, lng: -35.0, rotate: 30, label: 'LA800', origin_country: 'Brazil', altitude: 9000, velocity: 240, airline: 'LATAM', airlineLogo: '🇧🇷', flightNumber: 'LA800', color: '#6366f1', departure: { code: 'GRU', city: 'São Paulo', lat: -23.43, lng: -46.47 }, arrival: { code: 'CDG', city: 'Paris', lat: 49.01, lng: 2.55 }, stops: 0, stopCity: null, live: false },
                { id: '7', callsign: 'EK001', lat: 40.0, lng: 30.0, rotate: -30, label: 'EK001', origin_country: 'UAE', altitude: 11500, velocity: 290, airline: 'Emirates', airlineLogo: '🇦🇪', flightNumber: 'EK001', color: '#dc2626', departure: { code: 'DXB', city: 'Dubai', lat: 25.25, lng: 55.36 }, arrival: { code: 'LHR', city: 'London', lat: 51.47, lng: -0.45 }, stops: 0, stopCity: null, live: false },
            ],
            live: false,
            source: 'Fallback',
            fallback: true,
        });
    }
}
