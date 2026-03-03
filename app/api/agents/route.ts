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
        const { destinations, departureDate, returnDate, budget, pax, vibe, mustHaves } = body;

        if (!destinations || destinations.length === 0) {
            return NextResponse.json({ error: 'At least one destination is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            // Fallback to mock data if no API key
            return NextResponse.json({
                transport: {
                    summary: `Vol direct vers ${destinations[0].city} trouvé. Options Business et Economy disponibles.`,
                    flights: [
                        { airline: 'Air France', route: `PAR → ${destinations[0].city.substring(0, 3).toUpperCase()}`, class: 'Business', price: '3 200 €', duration: '11h', stops: '0', recommendation: 'Vol direct, meilleur confort' },
                        { airline: 'Emirates', route: `PAR → DXB → ${destinations[0].city.substring(0, 3).toUpperCase()}`, class: 'First', price: '6 800 €', duration: '14h', stops: '1', recommendation: 'Expérience First Class unique' },
                    ]
                },
                accommodation: {
                    summary: `2 hôtels 5 étoiles sélectionnés à ${destinations[0].city}.`,
                    hotels: [
                        { name: 'Four Seasons Resort', destination: destinations[0].city, stars: 5, pricePerNight: '890 €', highlights: ['Vue mer', 'Spa privé', 'Suite présidentielle'], recommendation: 'Le meilleur de la destination' },
                        { name: 'Aman Resort', destination: destinations[0].city, stars: 5, pricePerNight: '1 200 €', highlights: ['Plage privée', 'Butler service', 'Restaurant étoilé'], recommendation: 'Exclusivité absolue' },
                    ]
                },
                client: {
                    summary: `Client segment ${budget ? 'Premium' : 'Standard'}. Préférences détectées.`,
                    profile: { segment: 'Premium', preferences: [vibe || 'Luxe', 'Confort', 'Exclusivité'], specialNeeds: mustHaves || 'Aucun', loyaltyTips: 'Offrir upgrade gratuit au premier voyage' },
                    recommendations: ['Proposer un transfert privé', 'Ajouter une expérience locale unique', 'Envoyer un welcome pack à l\'hôtel']
                },
                itinerary: {
                    summary: `Itinéraire de ${destinations.length} destination(s) planifié.`,
                    days: [
                        { day: 1, title: 'Arrivée & Installation', destination: destinations[0].city, morning: 'Transfert aéroport VIP', afternoon: 'Check-in & découverte de l\'hôtel', evening: 'Dîner de bienvenue au restaurant panoramique', highlight: 'Coucher de soleil depuis la terrasse' },
                        { day: 2, title: 'Découverte Locale', destination: destinations[0].city, morning: 'Excursion privée avec guide', afternoon: 'Déjeuner gastronomique local', evening: 'Spa & détente', highlight: 'Rencontre avec les artisans locaux' },
                        { day: 3, title: 'Aventure & Nature', destination: destinations[0].city, morning: 'Croisière en catamaran', afternoon: 'Plongée avec masque et tuba', evening: 'Cocktail coucher de soleil sur le bateau', highlight: 'Nage avec les dauphins' },
                    ],
                    tips: ['Réserver la table Michelin 2 semaines à l\'avance', 'Prévoir une protection solaire SPF50+']
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
