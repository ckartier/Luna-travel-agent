import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Full i18n data for the conciergerie public site ──
// This provides translations for all dynamic content: blocks, catalog items, collections

type Lang = 'FR' | 'EN' | 'NL' | 'DA';

interface CatalogTranslation {
    name: string;
    description: string;
    location: string;
}

interface BlockTranslation {
    title?: string;
    subtitle?: string;
    description?: string;
    text?: string;
}

interface CollectionTranslation {
    name: string;
    location: string;
    description: string;
    date?: string;
}

interface TranslationData {
    blocks: Record<string, BlockTranslation>;
    catalog: Record<string, CatalogTranslation>;
    collections: CollectionTranslation[];
}

const translations: Record<Lang, TranslationData> = {
    FR: {
        blocks: {
            hero: {
                title: 'Voyagez avec Luna',
                subtitle: 'Magnifiquement.',
                description: "Une conciergerie de voyage d'exception. L'art de concevoir les évasions les plus secrètes et exclusives aux quatre coins du monde.",
            },
            collections: {
                title: 'Collections',
                subtitle: 'Privées',
                description: "Nos concierges locaux vous ouvrent les portes des propriétés les plus confidentielles. Explorez nos inspirations du moment.",
            },
            catalog: {
                title: 'Prestations',
                subtitle: '& Services',
                description: "Accédez à notre réseau international exclusif. Des villas cachées aux yachts privés, chaque expérience est certifiée par nos équipes.",
            },
            history: {
                title: 'Notre Histoire.',
                text: "Luna est née d'une conviction simple : voyager devrait être un art. Fondée par une équipe de passionnés du voyage haut de gamme, notre conciergerie réinvente l'expérience du sur-mesure.",
            },
            form: {
                title: 'Le Voyage',
                subtitle: 'Absolu.',
                description: "Remplissez vos préférences pour permettre à l'Intelligence Artificielle Luna et à nos concierges de créer une esquisse parfaite de votre évasion.",
            },
        },
        catalog: {
            'reservation-restaurant': { name: 'Réservation Restaurant Étoilé', description: "Réservation dans les meilleurs restaurants étoilés Michelin avec traitement VIP garanti.", location: 'France / Europe' },
            'itineraire-sur-mesure': { name: 'Itinéraire Sur-Mesure Europe', description: "Conception d'itinéraires personnalisés à travers les plus belles destinations européennes.", location: 'Europe' },
            'transfert-aeroport': { name: 'Transfert Aéroport VIP', description: "Transfert privé en véhicule de luxe entre l'aéroport et votre hôtel.", location: 'Europe' },
            'experience-gastronomique': { name: 'Expérience Gastronomique Privée', description: "Dîner privé avec chef étoilé dans un cadre d'exception.", location: 'France' },
            'visite-culturelle': { name: 'Visite Culturelle Guidée Premium', description: "Visite privée des sites culturels les plus prestigieux avec guide expert.", location: 'Europe' },
            'boutique-hotel': { name: 'Boutique Hôtel de Charme', description: "Séjour dans les plus beaux boutique hôtels sélectionnés par nos experts.", location: 'Europe' },
            'lune-de-miel': { name: 'Pack Lune de Miel / Romantique', description: "Escapade romantique sur-mesure avec touches exclusives et moments intimes.", location: 'Europe' },
            'billet-business': { name: 'Billet Business Class Europe', description: "Réservation de billets en classe affaires aux meilleurs tarifs négociés.", location: 'Europe' },
            'location-vehicule': { name: 'Location Véhicule de Luxe', description: "Location de véhicules prestige : Porsche, Mercedes, BMW ou SUV de luxe.", location: 'Europe' },
            'excursion-nature': { name: 'Excursion Nature & Aventure', description: "Randonnées, safaris et expéditions nature encadrées par des guides locaux.", location: 'Scandinavie / Alpes' },
            'spa-bien-etre': { name: 'Journée Spa & Bien-être Luxe', description: "Journée détente dans les spas les plus exclusifs avec soins premium.", location: 'Europe' },
            'reservation-palace': { name: 'Réservation Palace & 5★', description: "Réservation dans les palaces et hôtels 5 étoiles les plus prestigieux.", location: 'Europe' },
            'villa-privee': { name: 'Villa Privée avec Services', description: "Location de villas privées avec personnel dédié, chef et conciergerie.", location: 'Méditerranée / Côte d\'Azur' },
            'vol-prive': { name: 'Vol Privé / Jet Charter', description: "Affrètement de jets privés pour des voyages en toute flexibilité.", location: 'Europe' },
            'conciergerie-complete': { name: 'Conciergerie Complète Voyage', description: "Service de conciergerie tout inclus : organisation complète de votre voyage.", location: 'Europe' },
            'accompagnateur-local': { name: 'Accompagnateur Local Francophone', description: "Guide local francophone pour une immersion authentique dans la culture locale.", location: 'Europe' },
            'evenement-prive': { name: 'Organisation Événement Privé', description: "Organisation d'événements privés : anniversaires, demandes en mariage, célébrations.", location: 'Europe' },
            'chauffeur-prive': { name: 'Chauffeur Privé à la Journée', description: "Chauffeur privé à disposition toute la journée en véhicule de luxe.", location: 'Europe' },
        },
        collections: [
            { name: 'Tanzanie Safari VIP', date: '12 – 20 Août 2026', location: 'Tanzanie', description: "Expédition privée au cœur du Serengeti avec lodges exclusifs et survols en montgolfière." },
            { name: 'Retraite Mykonos', date: '02 – 09 Sept 2026', location: 'Grèce', description: "Villa design face à la mer Égée, avec chef privé, yoga au coucher du soleil et accès yacht." },
            { name: 'Japon Ancestral', date: '15 – 28 Oct 2026', location: 'Japon', description: "Ryokans cinq étoiles, rencontres avec des maîtres artisans et immersion culturelle absolue." },
            { name: 'Hollande / Norvège', date: '15 – 26 Fév 2026', location: 'Europe du Nord', description: "Aurores boréales, fjords majestueux et aventure en traîneau privé." },
        ],
    },
    EN: {
        blocks: {
            hero: {
                title: 'Travel with Luna',
                subtitle: 'Beautifully.',
                description: "An exceptional travel concierge. The art of designing the most secret and exclusive escapes around the world.",
            },
            collections: {
                title: 'Private',
                subtitle: 'Collections',
                description: "Our local concierges open the doors to the most confidential properties. Explore our current inspirations.",
            },
            catalog: {
                title: 'Services',
                subtitle: '& Offerings',
                description: "Access our exclusive international network. From hidden villas to private yachts, every experience is certified by our teams.",
            },
            history: {
                title: 'Our Story.',
                text: "Luna was born from a simple conviction: travel should be an art. Founded by a team of luxury travel enthusiasts, our concierge reinvents the bespoke experience.",
            },
            form: {
                title: 'The Ultimate',
                subtitle: 'Journey.',
                description: "Fill in your preferences to let Luna AI and our concierges craft a perfect sketch of your escape.",
            },
        },
        catalog: {
            'reservation-restaurant': { name: 'Starred Restaurant Booking', description: "Reservations at the finest Michelin-starred restaurants with guaranteed VIP treatment.", location: 'France / Europe' },
            'itineraire-sur-mesure': { name: 'Bespoke European Itinerary', description: "Custom-designed itineraries through Europe's most stunning destinations.", location: 'Europe' },
            'transfert-aeroport': { name: 'VIP Airport Transfer', description: "Private luxury vehicle transfer between the airport and your hotel.", location: 'Europe' },
            'experience-gastronomique': { name: 'Private Gastronomic Experience', description: "Private dinner with a starred chef in an exceptional setting.", location: 'France' },
            'visite-culturelle': { name: 'Premium Guided Cultural Tour', description: "Private tour of the most prestigious cultural sites with an expert guide.", location: 'Europe' },
            'boutique-hotel': { name: 'Charming Boutique Hotel', description: "Stay at the finest boutique hotels handpicked by our experts.", location: 'Europe' },
            'lune-de-miel': { name: 'Honeymoon / Romantic Package', description: "Tailor-made romantic escape with exclusive touches and intimate moments.", location: 'Europe' },
            'billet-business': { name: 'Business Class Europe Ticket', description: "Business class ticket bookings at the best negotiated rates.", location: 'Europe' },
            'location-vehicule': { name: 'Luxury Vehicle Rental', description: "Premium vehicle rentals: Porsche, Mercedes, BMW or luxury SUVs.", location: 'Europe' },
            'excursion-nature': { name: 'Nature & Adventure Excursion', description: "Hikes, safaris and nature expeditions led by local specialist guides.", location: 'Scandinavia / Alps' },
            'spa-bien-etre': { name: 'Luxury Spa & Wellness Day', description: "Relaxation day at the most exclusive spas with premium treatments.", location: 'Europe' },
            'reservation-palace': { name: 'Palace & 5★ Hotel Booking', description: "Reservations at the most prestigious palaces and 5-star hotels.", location: 'Europe' },
            'villa-privee': { name: 'Private Villa with Services', description: "Private villa rental with dedicated staff, chef and concierge.", location: 'Mediterranean / French Riviera' },
            'vol-prive': { name: 'Private Jet / Charter Flight', description: "Private jet charter for flexible, luxurious travel.", location: 'Europe' },
            'conciergerie-complete': { name: 'Full Travel Concierge', description: "All-inclusive concierge service: complete organisation of your trip.", location: 'Europe' },
            'accompagnateur-local': { name: 'Local French-speaking Guide', description: "French-speaking local guide for an authentic cultural immersion.", location: 'Europe' },
            'evenement-prive': { name: 'Private Event Planning', description: "Private event planning: birthdays, proposals, family celebrations.", location: 'Europe' },
            'chauffeur-prive': { name: 'Full-day Private Chauffeur', description: "Private chauffeur at your disposal all day in a luxury vehicle.", location: 'Europe' },
        },
        collections: [
            { name: 'Tanzania VIP Safari', date: '12 – 20 Aug 2026', location: 'Tanzania', description: "Private expedition in the heart of the Serengeti with exclusive lodges and hot air balloon flights." },
            { name: 'Mykonos Retreat', date: '02 – 09 Sep 2026', location: 'Greece', description: "Design villa facing the Aegean Sea, with private chef, sunset yoga and yacht access." },
            { name: 'Ancestral Japan', date: '15 – 28 Oct 2026', location: 'Japan', description: "Five-star ryokans, meetings with master craftsmen and absolute cultural immersion." },
            { name: 'Holland / Norway', date: '15 – 26 Feb 2026', location: 'Northern Europe', description: "Northern lights, majestic fjords and private sleddog adventures." },
        ],
    },
    NL: {
        blocks: {
            hero: {
                title: 'Reis met Luna',
                subtitle: 'Prachtig.',
                description: "Een uitzonderlijke reisconciërge. De kunst van het ontwerpen van de meest geheime en exclusieve ontsnappingen wereldwijd.",
            },
            collections: {
                title: 'Privé',
                subtitle: 'Collecties',
                description: "Onze lokale conciërges openen de deuren naar de meest vertrouwelijke eigenschappen. Ontdek onze huidige inspiraties.",
            },
            catalog: {
                title: 'Diensten',
                subtitle: '& Aanbod',
                description: "Krijg toegang tot ons exclusieve internationale netwerk. Van verborgen villa's tot privéjachten, elke ervaring is gecertificeerd door ons team.",
            },
            history: {
                title: 'Ons Verhaal.',
                text: "Luna is geboren vanuit een eenvoudige overtuiging: reizen zou een kunst moeten zijn. Opgericht door een team van luxe reisliefhebbers, heruitvinden wij de ervaring op maat.",
            },
            form: {
                title: 'De Ultieme',
                subtitle: 'Reis.',
                description: "Vul uw voorkeuren in zodat Luna AI en onze conciërges een perfecte schets van uw ontsnapping kunnen maken.",
            },
        },
        catalog: {
            'reservation-restaurant': { name: 'Sterrenrestaurant Reservering', description: "Reserveringen bij de beste Michelin-sterrenrestaurants met gegarandeerde VIP-behandeling.", location: 'Frankrijk / Europa' },
            'itineraire-sur-mesure': { name: 'Europese Route op Maat', description: "Op maat ontworpen routes door de mooiste Europese bestemmingen.", location: 'Europa' },
            'transfert-aeroport': { name: 'VIP Luchthaven Transfer', description: "Privé luxe voertuig transfer tussen de luchthaven en uw hotel.", location: 'Europa' },
            'experience-gastronomique': { name: 'Privé Gastronomische Ervaring', description: "Privédiner met een sterrenkok in een uitzonderlijk kader.", location: 'Frankrijk' },
            'visite-culturelle': { name: 'Premium Culturele Rondleiding', description: "Privérondleiding door de meest prestigieuze culturele sites met een deskundige gids.", location: 'Europa' },
            'boutique-hotel': { name: 'Charmant Boutique Hotel', description: "Verblijf in de mooiste boetiekhotels geselecteerd door onze experts.", location: 'Europa' },
            'lune-de-miel': { name: 'Huwelijksreis / Romantisch Pakket', description: "Romantische ontsnapping op maat met exclusieve details en intieme momenten.", location: 'Europa' },
            'billet-business': { name: 'Business Class Europa Ticket', description: "Reservering van business class tickets tegen de beste onderhandelde tarieven.", location: 'Europa' },
            'location-vehicule': { name: 'Luxe Voertuig Verhuur', description: "Premiumvoertuigverhuur: Porsche, Mercedes, BMW of luxe SUV's.", location: 'Europa' },
            'excursion-nature': { name: 'Natuur & Avontuur Excursie', description: "Wandelingen, safari's en natuurexpedities begeleid door lokale gidsen.", location: 'Scandinavië / Alpen' },
            'spa-bien-etre': { name: 'Luxe Spa & Wellness Dag', description: "Ontspanningsdag in de meest exclusieve spa's met premium behandelingen.", location: 'Europa' },
            'reservation-palace': { name: 'Palace & 5★ Hotel Reservering', description: "Reserveringen in de meest prestigieuze paleizen en 5-sterrenhotels.", location: 'Europa' },
            'villa-privee': { name: 'Privé Villa met Diensten', description: "Privévilla verhuur met toegewijd personeel, chef en conciërge.", location: 'Middellandse Zee / Côte d\'Azur' },
            'vol-prive': { name: 'Privé Jet / Chartervlucht', description: "Privéjet charter voor flexibel en luxueus reizen.", location: 'Europa' },
            'conciergerie-complete': { name: 'Volledige Reis Conciërge', description: "All-inclusive conciërgeservice: volledige organisatie van uw reis.", location: 'Europa' },
            'accompagnateur-local': { name: 'Lokale Franstalige Gids', description: "Franstalige lokale gids voor een authentieke culturele onderdompeling.", location: 'Europa' },
            'evenement-prive': { name: 'Privé Evenement Organisatie', description: "Privé-evenementen: verjaardagen, huwelijksaanzoeken, familievieringen.", location: 'Europa' },
            'chauffeur-prive': { name: 'Privé Chauffeur voor de Dag', description: "Privéchauffeur de hele dag tot uw beschikking in een luxe voertuig.", location: 'Europa' },
        },
        collections: [
            { name: 'Tanzania VIP Safari', date: '12 – 20 Aug 2026', location: 'Tanzania', description: "Privé expeditie in het hart van de Serengeti met exclusieve lodges." },
            { name: 'Mykonos Retraite', date: '02 – 09 Sep 2026', location: 'Griekenland', description: "Design villa met uitzicht op de Egeïsche Zee, privé kok en jachttoegang." },
            { name: 'Oud Japan', date: '15 – 28 Okt 2026', location: 'Japan', description: "Vijfsterren ryokans, ontmoetingen met meestervakmensen en culturele onderdompeling." },
            { name: 'Nederland / Noorwegen', date: '15 – 26 Feb 2026', location: 'Noord-Europa', description: "Noorderlicht, majestueuze fjorden en privé hondenslee avonturen." },
        ],
    },
    DA: {
        blocks: {
            hero: {
                title: 'Rejs med Luna',
                subtitle: 'Smukt.',
                description: "En enestående rejseconcierge. Kunsten at designe de mest hemmelige og eksklusive flugter rundt om i verden.",
            },
            collections: {
                title: 'Private',
                subtitle: 'Kollektioner',
                description: "Vores lokale concierger åbner dørene til de mest fortrolige ejendomme. Udforsk vores nuværende inspirationer.",
            },
            catalog: {
                title: 'Tjenester',
                subtitle: '& Tilbud',
                description: "Få adgang til vores eksklusive internationale netværk. Fra skjulte villaer til private yachter, hver oplevelse er certificeret.",
            },
            history: {
                title: 'Vores Historie.',
                text: "Luna blev født ud af en enkel overbevisning: rejser burde være en kunst. Grundlagt af et team af luksusrejseentusiaster, genopfinder vores concierge den skræddersyede oplevelse.",
            },
            form: {
                title: 'Den Ultimative',
                subtitle: 'Rejse.',
                description: "Udfyld dine præferencer så Luna AI og vores concierger kan skabe en perfekt skitse af din flugt.",
            },
        },
        catalog: {
            'reservation-restaurant': { name: 'Stjerne Restaurant Reservation', description: "Reservationer på de fineste Michelin-stjernerestauranter med garanteret VIP-behandling.", location: 'Frankrig / Europa' },
            'itineraire-sur-mesure': { name: 'Skræddersyet Europæisk Rute', description: "Specialdesignede ruter gennem Europas mest fantastiske destinationer.", location: 'Europa' },
            'transfert-aeroport': { name: 'VIP Lufthavns Transfer', description: "Privat luksuskøretøjstransfer mellem lufthavnen og dit hotel.", location: 'Europa' },
            'experience-gastronomique': { name: 'Privat Gastronomisk Oplevelse', description: "Privat middag med en stjernekok i enestående rammer.", location: 'Frankrig' },
            'visite-culturelle': { name: 'Premium Guidet Kulturtur', description: "Privat rundvisning på de mest prestigefyldte kultursteder med ekspertguide.", location: 'Europa' },
            'boutique-hotel': { name: 'Charmerende Boutique Hotel', description: "Ophold på de fineste boutique hoteller udvalgt af vores eksperter.", location: 'Europa' },
            'lune-de-miel': { name: 'Bryllupsrejse / Romantisk Pakke', description: "Skræddersyet romantisk flugt med eksklusive detaljer og intime øjeblikke.", location: 'Europa' },
            'billet-business': { name: 'Business Class Europa Billet', description: "Booking af business class billetter til de bedste forhandlede priser.", location: 'Europa' },
            'location-vehicule': { name: 'Luksus Køretøj Udlejning', description: "Premium køretøjsudlejning: Porsche, Mercedes, BMW eller luksus SUV'er.", location: 'Europa' },
            'excursion-nature': { name: 'Natur & Eventyr Ekskursion', description: "Vandreture, safaris og naturekspeditioner ledet af lokale guider.", location: 'Skandinavien / Alperne' },
            'spa-bien-etre': { name: 'Luksus Spa & Wellness Dag', description: "Afslapningsdag i de mest eksklusive spaer med premium behandlinger.", location: 'Europa' },
            'reservation-palace': { name: 'Palads & 5★ Hotel Reservation', description: "Reservationer på de mest prestigefyldte paladser og 5-stjernede hoteller.", location: 'Europa' },
            'villa-privee': { name: 'Privat Villa med Service', description: "Privat villaleje med dedikeret personale, kok og concierge.", location: 'Middelhavet / Côte d\'Azur' },
            'vol-prive': { name: 'Privat Jet / Charter Flyvning', description: "Privat jet charter til fleksibel og luksuriøs rejse.", location: 'Europa' },
            'conciergerie-complete': { name: 'Komplet Rejse Concierge', description: "Alt-inklusive concierge-service: komplet organisering af din rejse.", location: 'Europa' },
            'accompagnateur-local': { name: 'Lokal Fransktalende Guide', description: "Fransktalende lokal guide til en autentisk kulturel fordybelse.", location: 'Europa' },
            'evenement-prive': { name: 'Privat Event Planlægning', description: "Planlægning af private begivenheder: fødselsdage, frierier, familiefejringer.", location: 'Europa' },
            'chauffeur-prive': { name: 'Privat Chauffør for Dagen', description: "Privat chauffør til din rådighed hele dagen i et luksuskøretøj.", location: 'Europa' },
        },
        collections: [
            { name: 'Tanzania VIP Safari', date: '12 – 20 Aug 2026', location: 'Tanzania', description: "Privat ekspedition i hjertet af Serengeti med eksklusive lodges." },
            { name: 'Mykonos Retreat', date: '02 – 09 Sep 2026', location: 'Grækenland', description: "Designvilla ud mod Det Ægæiske Hav med privat kok." },
            { name: 'Gammelt Japan', date: '15 – 28 Okt 2026', location: 'Japan', description: "Femstjernede ryokans, møder med mesterhåndværkere og kulturel fordybelse." },
            { name: 'Holland / Norge', date: '15 – 26 Feb 2026', location: 'Nordeuropa', description: "Nordlys, majestætiske fjorde og private slædehundeeventyr." },
        ],
    },
};

// ── Build a slug from the French catalog name for matching ──
function slugify(name: string): string {
    const map: Record<string, string> = {
        'Réservation Restaurant Étoilé': 'reservation-restaurant',
        'Itinéraire Sur-Mesure Europe': 'itineraire-sur-mesure',
        'Transfert Aéroport VIP': 'transfert-aeroport',
        'Expérience Gastronomique Privée': 'experience-gastronomique',
        'Visite Culturelle Guidée Premium': 'visite-culturelle',
        'Boutique Hôtel de Charme': 'boutique-hotel',
        'Pack Lune de Miel / Romantique': 'lune-de-miel',
        'Billet Business Class Europe': 'billet-business',
        'Location Véhicule de Luxe': 'location-vehicule',
        'Excursion Nature & Aventure': 'excursion-nature',
        'Journée Spa & Bien-être Luxe': 'spa-bien-etre',
        'Réservation Palace & 5★': 'reservation-palace',
        'Villa Privée avec Services': 'villa-privee',
        'Vol Privé / Jet Charter': 'vol-prive',
        'Conciergerie Complète Voyage': 'conciergerie-complete',
        'Accompagnateur Local Francophone': 'accompagnateur-local',
        'Organisation Événement Privé': 'evenement-prive',
        'Chauffeur Privé à la Journée': 'chauffeur-prive',
    };
    return map[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') || 'FR').toUpperCase() as Lang;

    const data = translations[lang] || translations['FR'];

    return NextResponse.json({
        lang,
        blocks: data.blocks,
        catalog: data.catalog,
        collections: data.collections,
        slugify: Object.fromEntries(
            Object.entries(translations['FR'].catalog).map(([slug, item]) => [item.name, slug])
        ),
    });
}
