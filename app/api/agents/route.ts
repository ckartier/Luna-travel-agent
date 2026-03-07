import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import {
    searchTransport,
    searchAccommodation,
    analyzeClientProfile,
    planItinerary,
    buildFlightSearchUrl,
    buildHotelSearchUrl,
    buildActivityUrl,
} from '@/src/lib/ai/gemini';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];

    try {
        const body = await request.json();
        const { destinations, departureCity, departureDate, returnDate, budget, pax, vibe, mustHaves } = body;
        const budgetNum = parseInt((budget || '').replace(/[^\d]/g, '')) || 0;

        if (!destinations || destinations.length === 0) {
            return NextResponse.json({ error: 'At least one destination is required' }, { status: 400 });
        }

        const dest = destinations[0].city;
        const code = dest.substring(0, 3).toUpperCase();
        const from = departureCity || 'Paris';
        const fromCode = from.substring(0, 3).toUpperCase();

        if (!process.env.GEMINI_API_KEY) {
            // Build smart URLs dynamically using the URL builders
            const flightData = [
                { airline: 'Air France', route: `${fromCode} → ${code}`, class: 'Economy', price: 'À partir de 450 €/pers', duration: 'Environ 12h', stops: '0', stopCity: null },
                { airline: 'KLM', route: `${fromCode} → AMS → ${code}`, class: 'Economy', price: 'À partir de 480 €/pers', duration: 'Environ 14h', stops: '1', stopCity: 'Amsterdam' },
                { airline: 'Turkish Airlines', route: `${fromCode} → IST → ${code}`, class: 'Economy', price: 'À partir de 520 €/pers', duration: 'Environ 15h', stops: '1', stopCity: 'Istanbul' },
                { airline: 'Qatar Airways', route: `${fromCode} → DOH → ${code}`, class: 'Economy', price: 'À partir de 590 €/pers', duration: 'Environ 16h', stops: '1', stopCity: 'Doha' },
                { airline: 'Emirates', route: `${fromCode} → DXB → ${code}`, class: 'Economy', price: 'À partir de 560 €/pers', duration: 'Environ 15h', stops: '1', stopCity: 'Dubai' },
                { airline: 'Singapore Airlines', route: `${fromCode} → SIN → ${code}`, class: 'Premium Economy', price: 'À partir de 850 €/pers', duration: 'Environ 17h', stops: '1', stopCity: 'Singapour' },
                { airline: 'Cathay Pacific', route: `${fromCode} → HKG → ${code}`, class: 'Premium Economy', price: 'À partir de 920 €/pers', duration: 'Environ 19h', stops: '1', stopCity: 'Hong Kong' },
                { airline: 'Etihad', route: `${fromCode} → AUH → ${code}`, class: 'Economy', price: 'À partir de 540 €/pers', duration: 'Environ 16h', stops: '1', stopCity: 'Abu Dhabi' },
                { airline: 'Lufthansa', route: `${fromCode} → FRA → ${code}`, class: 'Economy', price: 'À partir de 490 €/pers', duration: 'Environ 14h', stops: '1', stopCity: 'Francfort' },
                { airline: 'British Airways', route: `${fromCode} → LHR → ${code}`, class: 'Economy', price: 'À partir de 510 €/pers', duration: 'Environ 13h', stops: '1', stopCity: 'Londres' },
            ].map(f => {
                const link = buildFlightSearchUrl(f.airline, from, dest);
                return { ...f, url: link.url, domain: link.domain };
            });

            const hotelData = [
                { name: 'Ubud Village Hotel', destination: dest, stars: 3, pricePerNight: '45 €', highlights: ['Jardin tropical', 'Piscine', 'Central'], recommendation: 'Option budget avec tout le nécessaire pour explorer Ubud.' },
                { name: 'The Kayon Jungle Resort', destination: dest, stars: 4, pricePerNight: '65 €', highlights: ['Piscine infinity jungle', 'Petit-déjeuner flottant', 'Yoga gratuit'], recommendation: 'Boutique-hôtel abordable avec une atmosphère magique.' },
                { name: 'Komaneka at Bisma', destination: dest, stars: 4, pricePerNight: '85 €', highlights: ['Vue rizières', 'Spa balinais', 'Petit-déjeuner inclus'], recommendation: 'Excellent rapport qualité-prix avec tout le charme d\'Ubud.' },
                { name: 'Bisma Eight', destination: dest, stars: 4, pricePerNight: '95 €', highlights: ['Design contemporain', 'Rooftop lounge bar', 'Centre-ville Ubud'], recommendation: 'Hôtel design tendance à quelques pas du centre d\'Ubud.' },
                { name: 'COMO Shambhala Estate', destination: dest, stars: 5, pricePerNight: '200 €', highlights: ['Retraite bien-être', 'Cuisine saine', 'Source sacrée'], recommendation: 'Idéal pour une retraite bien-être immergée dans la nature.' },
                { name: 'Four Seasons Resort Bali at Sayan', destination: dest, stars: 5, pricePerNight: '250 €', highlights: ['Architecture primée', 'Passerelle suspendue', 'Vue panoramique vallée'], recommendation: 'Arrivée spectaculaire via une passerelle au-dessus de la canopée.' },
                { name: 'Alila Villas Uluwatu', destination: dest, stars: 5, pricePerNight: '260 €', highlights: ['Falaise océan', 'Architecture éco', 'Cage cabana'], recommendation: 'Spectaculaire resort éco-luxe perché au-dessus de l\'océan Indien.' },
                { name: 'Mandapa, a Ritz-Carlton Reserve', destination: dest, stars: 5, pricePerNight: '280 €', highlights: ['Restaurant Kubu au bord de rivière', 'Cocons privés en bambou', 'Majordome personnel'], recommendation: 'Resort iconique d\'Ubud niché dans la vallée de la rivière Ayung.' },
                { name: 'Capella Ubud, Bali', destination: dest, stars: 5, pricePerNight: '320 €', highlights: ['Tentes luxe dans la jungle', 'Camp néo-colonial', 'Service exclusif'], recommendation: 'Concept unique de glamping ultra-luxe en pleine jungle balinaise.' },
                { name: 'Amandari', destination: dest, stars: 5, pricePerNight: '220 €', highlights: ['Style village balinais', 'Piscine à débordement', 'Galerie d\'art'], recommendation: 'L\'élégance Aman avec vue imprenable sur les rizières en terrasse.' },
            ].map(h => {
                const link = buildHotelSearchUrl(h.name, dest);
                return { ...h, url: link.url, domain: link.domain };
            });

            return NextResponse.json({
                transport: {
                    summary: `${flightData.length} options de vol trouvées de ${from} vers ${dest}. Vols directs et avec escales en Economy et Premium Economy.`,
                    flights: flightData,
                },
                accommodation: {
                    summary: `${hotelData.length} hôtels d'exception sélectionnés à ${dest}. Du palace 5 étoiles au boutique-hôtel exclusif.`,
                    hotels: hotelData,
                },
                client: {
                    summary: `Profil voyage ${budget || 'à définir'}. Recommandations adaptées au budget et au style.`,
                    profile: { segment: 'Premium', preferences: [vibe || 'Luxe', 'Confort', 'Exclusivité'], specialNeeds: mustHaves || 'Aucun', loyaltyTips: 'Offrir upgrade gratuit et welcome pack personnalisé' },
                    recommendations: [
                        { text: 'Transfert privé limousine aéroport → hôtel avec accueil VIP', type: 'transport', url: 'https://www.blacklane.com/fr/' },
                        { text: 'Welcome pack personnalisé avec champagne Krug et macarons Ladurée', type: 'service', url: null },
                        { text: `Réservation table gastronomique étoilée Michelin à ${dest}`, type: 'restaurant', url: buildActivityUrl(`restaurant michelin ${dest}`, dest) },
                        { text: `Excursion privée avec guide francophone certifié à ${dest}`, type: 'activité', url: buildActivityUrl(`visite guidée ${dest}`, dest) },
                        { text: 'Soins spa couple dans une suite privée — massage aux pierres chaudes', type: 'bien-être', url: buildActivityUrl(`spa couple ${dest}`, dest) },
                        { text: `Croisière privée au coucher du soleil avec cocktails et canapés`, type: 'activité', url: buildActivityUrl(`croisière coucher de soleil ${dest}`, dest) },
                        { text: `Cours de cuisine locale avec chef étoilé — marché et dégustation inclus`, type: 'expérience', url: buildActivityUrl(`cours cuisine ${dest}`, dest) },
                        { text: 'Shopping VIP avec personal shopper dans les meilleures boutiques', type: 'service', url: buildActivityUrl(`shopping boutique ${dest}`, dest) },
                        { text: `Séance photo professionnelle sur site iconique de ${dest}`, type: 'expérience', url: 'https://www.flytographer.com/' },
                        { text: 'Surclassement suite si disponible + late check-out garanti', type: 'service', url: null },
                    ]
                },
                itinerary: {
                    summary: `Itinéraire complet de 7 jours à ${dest}. Chaque journée est optimisée pour l'expérience.`,
                    days: [
                        { day: 1, title: 'Arrivée & Installation Prestige', destination: dest, morning: 'Transfert aéroport VIP en limousine Mercedes Classe S', morningUrl: 'https://www.blacklane.com/fr/', afternoon: 'Check-in & découverte de l\'hôtel, cocktail de bienvenue au rooftop bar', afternoonUrl: null, evening: 'Dîner de bienvenue au restaurant panoramique étoilé', eveningUrl: buildActivityUrl(`restaurant étoilé ${dest}`, dest), highlight: '🌟 Premier cocktail surplombant la ville au coucher du soleil' },
                        { day: 2, title: 'Immersion Culturelle', destination: dest, morning: 'Visite guidée privée du centre historique avec guide expert', morningUrl: buildActivityUrl(`visite guidée centre historique ${dest}`, dest), afternoon: 'Déjeuner gastronomique local & temps libre shopping artisanal', afternoonUrl: buildActivityUrl(`shopping artisanal ${dest}`, dest), evening: 'Spectacle traditionnel & dîner thématique au marché nocturne', eveningUrl: buildActivityUrl(`spectacle traditionnel ${dest}`, dest), highlight: '🌟 Rencontre avec un artisan local dans son atelier' },
                        { day: 3, title: 'Aventure & Grands Espaces', destination: dest, morning: 'Croisière en catamaran privé le long de la côte', morningUrl: buildActivityUrl(`croisière catamaran ${dest}`, dest), afternoon: 'Plongée snorkeling sur récif corallien vierge', afternoonUrl: buildActivityUrl(`snorkeling ${dest}`, dest), evening: 'Cocktails coucher de soleil sur le bateau & BBQ de fruits de mer', eveningUrl: null, highlight: '🌟 Nage avec les tortues marines dans une crique secrète' },
                        { day: 4, title: 'Journée Bien-être & Sérénité', destination: dest, morning: 'Séance de yoga au lever du soleil face à la mer', morningUrl: null, afternoon: 'Spa journey complète — massage balinais, gommage, bain floral', afternoonUrl: buildActivityUrl(`spa ${dest}`, dest), evening: 'Dîner pieds dans le sable au restaurant étoilé de l\'hôtel', eveningUrl: buildActivityUrl(`restaurant étoilé ${dest}`, dest), highlight: '🌟 Massage en plein air dans un pavillon face à l\'océan' },
                        { day: 5, title: 'Excursion Exclusive & Panoramas', destination: dest, morning: 'Hélicoptère vers site naturel exceptionnel — vue à 360°', morningUrl: buildActivityUrl(`helicopter excursion ${dest}`, dest), afternoon: 'Pique-nique gourmet dans un lieu secret préparé par le chef', afternoonUrl: null, evening: 'Retour & soirée libre — bar à cocktails avec mixologue', eveningUrl: null, highlight: '🌟 Survol en hélicoptère de paysages à couper le souffle' },
                        { day: 6, title: 'Art de Vivre & Gastronomie', destination: dest, morning: 'Cours de cuisine avec chef primé — visite du marché local incluse', morningUrl: buildActivityUrl(`cours cuisine chef ${dest}`, dest), afternoon: 'Visite de marché local & dégustation street food gastronomique', afternoonUrl: buildActivityUrl(`food tour ${dest}`, dest), evening: 'Dîner d\'adieu dans un lieu exclusif privatisé pour l\'occasion', eveningUrl: buildActivityUrl(`restaurant exclusif ${dest}`, dest), highlight: '🌟 Préparer un plat signature sous la direction d\'un chef étoilé' },
                        { day: 7, title: 'Départ en Douceur', destination: dest, morning: 'Petit-déjeuner in-room avec champagne & late check-out', morningUrl: null, afternoon: 'Transfert personnalisé vers aéroport avec cadeau de départ', afternoonUrl: null, evening: 'Vol retour en classe affaires', eveningUrl: null, highlight: '🌟 Un au revoir en douceur avec des souvenirs inoubliables' },
                    ],
                    tips: [`Réserver la table Michelin 2 semaines à l'avance — très prisée à ${dest}`, 'Prévoir une protection solaire SPF50+ et un chapeau pour les excursions', 'Emporter un adaptateur électrique universel et des chaussures de marche']
                },
            });
        }

        // ── 1. Fetch REAL DATA first (Amadeus & Booking) ──
        let realFlights: any[] = [];
        let realHotels: any[] = [];

        try {
            // Already extracted token from headers above

            // Leg 1: From Home to First Dest
            const leg1Res = await fetch(new URL('/api/amadeus', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ from: departureCity || 'Paris', to: destinations[0].city, date: departureDate, pax: parseInt(pax) || 2 })
            });
            const leg1Data = await leg1Res.json();
            if (leg1Data.flights) realFlights = [...realFlights, ...leg1Data.flights];

            // If multi-destination, fetch internal legs
            if (destinations.length > 1) {
                for (let i = 0; i < destinations.length - 1; i++) {
                    const internalRes = await fetch(new URL('/api/amadeus', request.url).toString(), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ from: destinations[i].city, to: destinations[i + 1].city, date: new Date(new Date(departureDate).getTime() + (i + 1) * 3 * 24 * 3600000).toISOString().split('T')[0], pax: parseInt(pax) || 2 })
                    });
                    const internalData = await internalRes.json();
                    if (internalData.flights) realFlights = [...realFlights, ...internalData.flights];
                }
            }

            // Real Hotels via Booking.com API — fetch for ALL destinations
            for (const dest of destinations) {
                try {
                    const hotelRes = await fetch(new URL('/api/booking', request.url).toString(), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ city: dest.city, checkin: departureDate, adults: parseInt(pax) || 2 })
                    });
                    const hotelData = await hotelRes.json();
                    if (hotelData.hotels) {
                        // Tag each hotel with its destination
                        const taggedHotels = hotelData.hotels.map((h: any) => ({ ...h, destination: dest.city }));
                        realHotels = [...realHotels, ...taggedHotels];
                    }
                } catch (e) {
                    console.warn(`Booking fetch failed for ${dest.city}:`, e);
                }
            }

        } catch (e) {
            console.warn('Real data pre-fetch failed, falling back to AI intuition:', e);
        }

        // ── 2. Run Agents with REAL context ──
        const [transport, accommodation, client, itinerary] = await Promise.allSettled([
            searchTransport({ destinations, departureCity, departureDate, returnDate, pax, budget, realData: realFlights }),
            searchAccommodation({ destinations, vibe, budget, pax, realData: realHotels }),
            analyzeClientProfile({ pax, vibe, budget, mustHaves }),
            planItinerary({ destinations, departureDate, returnDate, vibe, mustHaves, budget }),
        ]);

        return NextResponse.json({
            transport: transport.status === 'fulfilled' ? transport.value : { summary: 'Agent Transport indisponible', flights: [] },
            accommodation: accommodation.status === 'fulfilled' ? accommodation.value : { summary: 'Agent Hébergement indisponible', hotels: [] },
            client: client.status === 'fulfilled' ? client.value : { summary: 'Agent Client indisponible', profile: {} },
            itinerary: itinerary.status === 'fulfilled' ? itinerary.value : { summary: 'Agent Itinéraire indisponible', days: [] },
            meta: {
                hasRealFlights: realFlights.length > 0,
                hasRealHotels: realHotels.length > 0,
                sources: ['Amadeus', 'Booking.com', 'Gemini 2.5 Pro']
            }
        });

    } catch (error: any) {
        console.error('Agent orchestration error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
