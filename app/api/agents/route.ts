import { NextResponse } from 'next/server';
import {
    searchTransport,
    searchAccommodation,
    analyzeClientProfile,
    planItinerary
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
            return NextResponse.json({
                transport: {
                    summary: `${12} options de vol trouvées de ${from} vers ${dest}. Vols directs et avec escales disponibles en Business, Première et Economy.`,
                    flights: [
                        { airline: 'Air France', route: `${fromCode} → ${code}`, class: 'Business', price: '3 200 €', duration: '11h', stops: '0', recommendation: 'Vol direct, meilleur confort' },
                        { airline: 'Emirates', route: `${fromCode} → DXB → ${code}`, class: 'First', price: '6 800 €', duration: '14h', stops: '1', recommendation: 'First Class unique' },
                        { airline: 'Qatar Airways', route: `${fromCode} → DOH → ${code}`, class: 'Business', price: '4 100 €', duration: '13h30', stops: '1', recommendation: 'QSuites, meilleure Business au monde' },
                        { airline: 'Singapore Airlines', route: `${fromCode} → SIN → ${code}`, class: 'First', price: '7 500 €', duration: '16h', stops: '1', recommendation: 'Suites privées avec lit double' },
                        { airline: 'Lufthansa', route: `${fromCode} → FRA → ${code}`, class: 'Business', price: '2 950 €', duration: '12h30', stops: '1', recommendation: 'Very good rapport qualité-prix' },
                        { airline: 'Air France', route: `${fromCode} → ${code}`, class: 'Economy Premium', price: '1 800 €', duration: '11h', stops: '0', recommendation: 'Direct, budget optimisé' },
                        { airline: 'British Airways', route: `${fromCode} → LHR → ${code}`, class: 'Business', price: '3 400 €', duration: '14h', stops: '1', recommendation: 'Club World avec accès Lounge' },
                        { airline: 'Etihad', route: `${fromCode} → AUH → ${code}`, class: 'Business', price: '3 900 €', duration: '15h', stops: '1', recommendation: 'Appartement Business avec douche' },
                        { airline: 'Turkish Airlines', route: `${fromCode} → IST → ${code}`, class: 'Business', price: '2 600 €', duration: '13h', stops: '1', recommendation: 'Excellent service, bon prix' },
                        { airline: 'Cathay Pacific', route: `${fromCode} → HKG → ${code}`, class: 'Business', price: '4 300 €', duration: '17h', stops: '1', recommendation: 'The Pier lounge à HKG' },
                        { airline: 'KLM', route: `${fromCode} → AMS → ${code}`, class: 'Economy', price: '890 €', duration: '14h', stops: '1', recommendation: 'Option la plus économique' },
                        { airline: 'Swiss', route: `${fromCode} → ZRH → ${code}`, class: 'Business', price: '3 100 €', duration: '13h', stops: '1', recommendation: 'Qualité suisse, chocolat offert' },
                    ]
                },
                accommodation: {
                    summary: `10 hôtels d'exception sélectionnés à ${dest}. Du palace 5 étoiles au boutique-hôtel exclusif.`,
                    hotels: [
                        { name: 'Four Seasons Resort', destination: dest, stars: 5, pricePerNight: '890 €', highlights: ['Vue mer', 'Spa privé', 'Suite présidentielle'], recommendation: 'Le meilleur de la destination' },
                        { name: 'Aman Resort', destination: dest, stars: 5, pricePerNight: '1 200 €', highlights: ['Plage privée', 'Butler service', 'Restaurant étoilé'], recommendation: 'Exclusivité absolue' },
                        { name: 'The Ritz-Carlton', destination: dest, stars: 5, pricePerNight: '750 €', highlights: ['Club Level', 'Spa Guerlain', 'Pool infinity'], recommendation: 'Service impeccable' },
                        { name: 'Mandarin Oriental', destination: dest, stars: 5, pricePerNight: '820 €', highlights: ['Gastronomie 2 étoiles', 'Spa signature', 'Vue panoramique'], recommendation: 'Art de vivre oriental' },
                        { name: 'One&Only', destination: dest, stars: 5, pricePerNight: '1 500 €', highlights: ['Villa privée avec piscine', 'Chef privé', 'Île privée'], recommendation: 'Ultra-luxe, intimité totale' },
                        { name: 'Rosewood', destination: dest, stars: 5, pricePerNight: '680 €', highlights: ['Design contemporain', 'Rooftop bar', 'Fitness premium'], recommendation: 'Chic et tendance' },
                        { name: 'Park Hyatt', destination: dest, stars: 5, pricePerNight: '620 €', highlights: ['Art contemporain', 'Bar speakeasy', 'Suite duplex'], recommendation: 'Design minimaliste luxueux' },
                        { name: 'Shangri-La', destination: dest, stars: 5, pricePerNight: '550 €', highlights: ['Jardin tropical', 'Kids club', 'Beach club'], recommendation: 'Idéal familles luxury' },
                        { name: 'Belmond', destination: dest, stars: 5, pricePerNight: '980 €', highlights: ['Heritage colonial', 'Jardins primés', 'Afternoon tea'], recommendation: 'Charme authentique' },
                        { name: 'St. Regis', destination: dest, stars: 5, pricePerNight: '720 €', highlights: ['Butler 24h', 'Bloody Mary bar', 'Ballroom'], recommendation: 'Grand luxe classique' },
                    ]
                },
                client: {
                    summary: `Client segment ${budget ? 'Premium' : 'Standard'}. 10 recommandations personnalisées basées sur le profil.`,
                    profile: { segment: 'Premium', preferences: [vibe || 'Luxe', 'Confort', 'Exclusivité'], specialNeeds: mustHaves || 'Aucun', loyaltyTips: 'Offrir upgrade gratuit' },
                    recommendations: [
                        'Transfert privé limousine aéroport → hôtel',
                        'Welcome pack personnalisé avec champagne à l\'arrivée',
                        'Réservation table gastronomique étoilée Michelin',
                        'Excursion privée avec guide francophone certifié',
                        'Soins spa couple dans une suite privée',
                        'Croisière privée au coucher du soleil',
                        'Cours de cuisine locale avec chef étoilé',
                        'Shopping VIP avec personal shopper',
                        'Séance photo professionnelle sur site iconique',
                        'Surclassement suite si disponible à l\'arrivée',
                    ]
                },
                itinerary: {
                    summary: `Itinéraire complet de 7 jours à ${dest}. Chaque journée est optimisée pour l'expérience.`,
                    days: [
                        { day: 1, title: 'Arrivée & Installation', destination: dest, morning: 'Transfert aéroport VIP en limousine', afternoon: 'Check-in & découverte de l\'hôtel, cocktail de bienvenue', evening: 'Dîner de bienvenue au restaurant panoramique' },
                        { day: 2, title: 'Découverte Culturelle', destination: dest, morning: 'Visite guidée privée du centre historique', afternoon: 'Déjeuner gastronomique local & temps libre shopping', evening: 'Spectacle traditionnel & dîner thématique' },
                        { day: 3, title: 'Aventure & Nature', destination: dest, morning: 'Croisière en catamaran privé', afternoon: 'Plongée snorkeling sur récif corallien', evening: 'Cocktails coucher de soleil sur le bateau' },
                        { day: 4, title: 'Bien-être & Relaxation', destination: dest, morning: 'Séance de yoga au lever du soleil', afternoon: 'Spa journey complète (4 soins)', evening: 'Dîner pieds dans le sable au restaurant étoilé' },
                        { day: 5, title: 'Excursion Exclusive', destination: dest, morning: 'Hélicoptère vers site naturel exceptionnel', afternoon: 'Pique-nique gourmet dans un lieu secret', evening: 'Retour & soirée libre en ville' },
                        { day: 6, title: 'Art de Vivre Local', destination: dest, morning: 'Cours de cuisine avec chef primé', afternoon: 'Visite de marché local & dégustation', evening: 'Dîner d\'adieu dans un lieu exclusif privatisé' },
                        { day: 7, title: 'Départ en Douceur', destination: dest, morning: 'Petit-déjeuner in-room & late check-out', afternoon: 'Transfert personnalisé vers aéroport', evening: 'Vol retour' },
                    ],
                    tips: ['Réserver la table Michelin 2 semaines à l\'avance', 'Prévoir une protection solaire SPF50+', 'Emporter adaptateur électrique universel']
                }
            });
        }

        // Run all 4 agents in parallel
        const [transport, accommodation, client, itinerary] = await Promise.allSettled([
            searchTransport({ destinations, departureDate, returnDate, pax }),
            searchAccommodation({ destinations, vibe, budget, pax }),
            analyzeClientProfile({ pax, vibe, budget, mustHaves }),
            planItinerary({ destinations, departureDate, returnDate, vibe, mustHaves }),
        ]);

        return NextResponse.json({
            transport: transport.status === 'fulfilled' ? transport.value : { summary: 'Agent Transport indisponible', flights: [] },
            accommodation: accommodation.status === 'fulfilled' ? accommodation.value : { summary: 'Agent Hébergement indisponible', hotels: [] },
            client: client.status === 'fulfilled' ? client.value : { summary: 'Agent Client indisponible', profile: {} },
            itinerary: itinerary.status === 'fulfilled' ? itinerary.value : { summary: 'Agent Itinéraire indisponible', days: [] },
        });

    } catch (error: any) {
        console.error('Agent orchestration error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
