import { NextResponse } from 'next/server';
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
    try {
        const body = await request.json();
        const { destinations, departureCity, departureDate, returnDate, budget, pax, vibe, mustHaves } = body;

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
                { airline: 'Air France', route: `${fromCode} → ${code}`, class: 'Business (La Première)', price: 'À partir de 3 200 € par personne', duration: 'Environ 11h', stops: '0', stopCity: null },
                { airline: 'Emirates', route: `${fromCode} → DXB → ${code}`, class: 'First', price: 'À partir de 6 800 € par personne', duration: 'Environ 14h (escale incluse)', stops: '1', stopCity: 'Dubai' },
                { airline: 'Qatar Airways', route: `${fromCode} → DOH → ${code}`, class: 'Business (Qsuite)', price: 'À partir de 4 100 € par personne', duration: 'Environ 13h30 (escale incluse)', stops: '1', stopCity: 'Doha' },
                { airline: 'Singapore Airlines', route: `${fromCode} → SIN → ${code}`, class: 'First (Suites)', price: 'À partir de 7 500 € par personne', duration: 'Environ 16h (escale incluse)', stops: '1', stopCity: 'Singapour' },
                { airline: 'Lufthansa', route: `${fromCode} → FRA → ${code}`, class: 'Business', price: 'À partir de 2 950 € par personne', duration: 'Environ 12h30 (escale incluse)', stops: '1', stopCity: 'Francfort' },
                { airline: 'Air France', route: `${fromCode} → ${code}`, class: 'Economy Premium', price: 'À partir de 1 800 € par personne', duration: 'Environ 11h', stops: '0', stopCity: null },
                { airline: 'British Airways', route: `${fromCode} → LHR → ${code}`, class: 'Business (Club World)', price: 'À partir de 3 400 € par personne', duration: 'Environ 14h (escale incluse)', stops: '1', stopCity: 'Londres' },
                { airline: 'Etihad', route: `${fromCode} → AUH → ${code}`, class: 'Business', price: 'À partir de 3 900 € par personne', duration: 'Environ 15h (escale incluse)', stops: '1', stopCity: 'Abu Dhabi' },
                { airline: 'Turkish Airlines', route: `${fromCode} → IST → ${code}`, class: 'Business', price: 'À partir de 2 600 € par personne', duration: 'Environ 13h (escale incluse)', stops: '1', stopCity: 'Istanbul' },
                { airline: 'Cathay Pacific', route: `${fromCode} → HKG → ${code}`, class: 'Business', price: 'À partir de 4 300 € par personne', duration: 'Environ 17h (escale incluse)', stops: '1', stopCity: 'Hong Kong' },
                { airline: 'KLM', route: `${fromCode} → AMS → ${code}`, class: 'Economy', price: 'À partir de 890 € par personne', duration: 'Environ 14h (escale incluse)', stops: '1', stopCity: 'Amsterdam' },
                { airline: 'Swiss', route: `${fromCode} → ZRH → ${code}`, class: 'Business', price: 'À partir de 3 100 € par personne', duration: 'Environ 13h (escale incluse)', stops: '1', stopCity: 'Zürich' },
            ].map(f => {
                const link = buildFlightSearchUrl(f.airline, from, dest);
                return { ...f, url: link.url, domain: link.domain };
            });

            const hotelData = [
                { name: 'Four Seasons Resort', destination: dest, stars: 5, pricePerNight: '890 €', highlights: ['Vue mer', 'Spa privé', 'Suite présidentielle'], recommendation: 'Le choix iconique pour une expérience sans compromis. Service impeccable et localisation exceptionnelle.' },
                { name: 'Aman Resort', destination: dest, stars: 5, pricePerNight: '1 200 €', highlights: ['Plage privée', 'Butler service', 'Restaurant étoilé'], recommendation: 'Intimité absolue et design minimaliste sublime. Pour les connaisseurs recherchant le calme.' },
                { name: 'The Ritz-Carlton', destination: dest, stars: 5, pricePerNight: '750 €', highlights: ['Club Level', 'Spa Guerlain', 'Pool infinity'], recommendation: 'Élégance classique avec tous les codes du grand luxe. Programme Club Level exclusif.' },
                { name: 'Mandarin Oriental', destination: dest, stars: 5, pricePerNight: '820 €', highlights: ['Gastronomie 2 étoiles', 'Spa signature', 'Vue panoramique'], recommendation: 'Art de vivre asiatique et raffinement européen. Spa parmi les meilleurs au monde.' },
                { name: 'One&Only', destination: dest, stars: 5, pricePerNight: '1 500 €', highlights: ['Villa privée avec piscine', 'Chef privé', 'Île privée'], recommendation: 'Expérience ultra-exclusive en villa avec piscine privée. Idéal lune de miel ou célébration.' },
                { name: 'Rosewood', destination: dest, stars: 5, pricePerNight: '680 €', highlights: ['Design contemporain', 'Rooftop bar', 'Fitness premium'], recommendation: 'Design contemporain spectaculaire et sens du lieu remarquable. Excellent rapport qualité-prix luxe.' },
                { name: 'Park Hyatt', destination: dest, stars: 5, pricePerNight: '620 €', highlights: ['Art contemporain', 'Bar speakeasy', 'Suite duplex'], recommendation: 'Architecture épurée et localisation en cœur de ville. Parfait pour les amateurs d\'art.' },
                { name: 'Shangri-La', destination: dest, stars: 5, pricePerNight: '550 €', highlights: ['Jardin tropical', 'Kids club', 'Beach club'], recommendation: 'Hospitalité légendaire avec prestations famille haut de gamme. Cadre tropical enchanteur.' },
                { name: 'Belmond', destination: dest, stars: 5, pricePerNight: '980 €', highlights: ['Heritage colonial', 'Jardins primés', 'Afternoon tea'], recommendation: 'Charme historique incomparable et sens du détail exquis. Expérience hors du temps.' },
                { name: 'St. Regis', destination: dest, stars: 5, pricePerNight: '720 €', highlights: ['Butler 24h', 'Bloody Mary bar', 'Ballroom'], recommendation: 'Service butler 24/7 légendaire. Tradition du luxe à son plus haut niveau.' },
            ].map(h => {
                const link = buildHotelSearchUrl(h.name, dest);
                return { ...h, url: link.url, domain: link.domain };
            });

            return NextResponse.json({
                transport: {
                    summary: `${flightData.length} options de vol trouvées de ${from} vers ${dest}. Vols directs et avec escales en Business, Première et Economy.`,
                    flights: flightData,
                },
                accommodation: {
                    summary: `${hotelData.length} hôtels d'exception sélectionnés à ${dest}. Du palace 5 étoiles au boutique-hôtel exclusif.`,
                    hotels: hotelData,
                },
                client: {
                    summary: `Client segment ${budget ? 'Premium' : 'Standard'}. 10 recommandations personnalisées basées sur le profil.`,
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

        // ── Try Booking.com API for real hotel data ──
        let bookingHotels: any[] = [];
        try {
            const bookingRes = await fetch(new URL('/api/booking', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city: destinations[0].city,
                    checkin: departureDate || undefined,
                    checkout: returnDate || undefined,
                    adults: parseInt(pax) || 2,
                }),
            });
            const bookingData = await bookingRes.json();
            if (bookingData.available && bookingData.hotels?.length > 0) {
                bookingHotels = bookingData.hotels;
            }
        } catch (e) {
            console.warn('Booking.com API unavailable, using Gemini fallback:', e);
        }

        // Run all 4 agents in parallel
        const [transport, accommodation, client, itinerary] = await Promise.allSettled([
            searchTransport({ destinations, departureDate, returnDate, pax }),
            searchAccommodation({ destinations, vibe, budget, pax }),
            analyzeClientProfile({ pax, vibe, budget, mustHaves }),
            planItinerary({ destinations, departureDate, returnDate, vibe, mustHaves }),
        ]);

        // Use Booking.com hotels if available, otherwise fall back to Gemini
        const accommodationResult = bookingHotels.length > 0
            ? {
                summary: `${bookingHotels.length} hôtels trouvés à ${destinations[0].city} via Booking.com — prix réels et disponibilités vérifiées.`,
                hotels: bookingHotels,
                source: 'booking.com',
            }
            : accommodation.status === 'fulfilled'
                ? accommodation.value
                : { summary: 'Agent Hébergement indisponible', hotels: [] };

        return NextResponse.json({
            transport: transport.status === 'fulfilled' ? transport.value : { summary: 'Agent Transport indisponible', flights: [] },
            accommodation: accommodationResult,
            client: client.status === 'fulfilled' ? client.value : { summary: 'Agent Client indisponible', profile: {} },
            itinerary: itinerary.status === 'fulfilled' ? itinerary.value : { summary: 'Agent Itinéraire indisponible', days: [] },
        });

    } catch (error: any) {
        console.error('Agent orchestration error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
