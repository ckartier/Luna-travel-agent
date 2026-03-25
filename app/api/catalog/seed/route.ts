export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

// ═══ PRESTATIONS LUNE DMC — CATALOGUE PARIS 2026 (extracted from brochure PDF) ═══
const LUNE_PRESTATIONS = [
    // ── Guided Tours & Cultural Must-Sees ──
    {
        type: 'ACTIVITY', name: 'Visite Guidée Musées & Monuments',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Visite privée au Louvre, Musée d\'Orsay, Arc de Triomphe, Sainte-Chapelle, L\'Orangerie, Fondation LV, etc. Guide agréé, billets inclus.',
        netCost: 539, recommendedMarkup: 11, currency: 'EUR',
        duration: '~2h', capacity: '1-8 pers', remarks: 'Nous pouvons adapter toutes nos visites aux enfants ! Optez pour une visite du Louvre avec une chasse au trésor ludique.'
    },
    {
        type: 'ACTIVITY', name: 'Tour Eiffel Sommet — Visite Privée',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Visite guidée privée du sommet de la Tour Eiffel, incluant accès prioritaire ascenseur et billets.',
        netCost: 485, recommendedMarkup: 11, currency: 'EUR',
        duration: '2h', capacity: '1-8 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Notre-Dame — Visite Privée',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Visite privée de Notre-Dame avec guide agréé et accès prioritaire.',
        netCost: 413, recommendedMarkup: 11, currency: 'EUR',
        duration: '~1h30', capacity: '1-5 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'City Tour en Voiture Premium',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Explorez Paris avec un guide agréé dans un véhicule premium. Berline de luxe pour 1-3 personnes, Van luxe pour 1-6 personnes.',
        netCost: 692, recommendedMarkup: 11, currency: 'EUR',
        duration: '3h-7h', capacity: '1-6 pers', remarks: 'Véhicule Luxury Sedan 1-3 pers, Luxury Van 1-6 pers.'
    },
    {
        type: 'ACTIVITY', name: 'Tour Paris en 2CV Vintage',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Découvrez Paris dans une iconique 2CV vintage avec un guide local.',
        netCost: 206, recommendedMarkup: 11, currency: 'EUR',
        duration: '2h-7h', capacity: '1-3 pers/voiture', remarks: 'Tarifs par voiture. Options extras : champagne, macarons, bouquet de fleurs, photographe.'
    },
    {
        type: 'ACTIVITY', name: 'Paris à Pied — Balade Guidée',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Découvrez le Marais, Montmartre, Saint-Germain-des-Prés ou le Quartier Latin avec un guide agréé. Pause gourmande incluse.',
        netCost: 449, recommendedMarkup: 11, currency: 'EUR',
        duration: '2h30', capacity: '1-5 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Tour Rétro en Side-Car',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Tour en side-car (jusqu\'à 2 passagers par véhicule) pour découvrir les highlights iconiques de Paris.',
        netCost: 269, recommendedMarkup: 11, currency: 'EUR',
        duration: '1h30', capacity: '1-2 pers/véhicule', remarks: 'Tarifs par véhicule.'
    },
    {
        type: 'ACTIVITY', name: 'Bike Tour Privé à Paris',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Tour privé à vélo pour visiter les sites les plus iconiques de Paris.',
        netCost: 608, recommendedMarkup: 11, currency: 'EUR',
        duration: '4h', capacity: '1-8 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Versailles — Demi-Journée Privée',
        supplier: 'Lune DMC', location: 'Paris → Versailles',
        description: 'Transfert privé A/R depuis votre hôtel Paris, entrée coupe-file, visite guidée privée du château et des jardins avec guide agréé.',
        netCost: 674, recommendedMarkup: 11, currency: 'EUR',
        duration: '4h', capacity: '1-7 pers', remarks: 'Enrichissez votre visite avec un pique-nique dans les jardins de Versailles, un tour à vélo ou une barque privée sur le Grand Canal.'
    },

    // ── Culinary Tours & Food Experiences ──
    {
        type: 'ACTIVITY', name: 'Marais Pastry Tour',
        supplier: 'Lune DMC', location: 'Paris — Le Marais',
        description: 'Balade guidée avec un guide local, dégustation de pâtisseries françaises classiques en explorant le Marais.',
        netCost: 404, recommendedMarkup: 11, currency: 'EUR',
        duration: '~2h', capacity: '1-6 pers', remarks: 'Non recommandé les lundis.'
    },
    {
        type: 'ACTIVITY', name: 'Montmartre Food Tour',
        supplier: 'Lune DMC', location: 'Paris — Montmartre',
        description: 'Visite guidée à pied avec un guide local, dégustation de spécialités locales à Montmartre.',
        netCost: 404, recommendedMarkup: 11, currency: 'EUR',
        duration: '~2h', capacity: '1-6 pers', remarks: 'Non recommandé les lundis.'
    },
    {
        type: 'ACTIVITY', name: 'Pique-nique Parisien — Tour Eiffel',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Pique-nique français élégant dans des lieux iconiques : Tour Eiffel, Parc de Bagatelle ou Parc Monceau. Fromages artisanaux, charcuterie, baguettes, champagne ou vin fin.',
        netCost: 494, recommendedMarkup: 11, currency: 'EUR',
        duration: '1h30-3h', capacity: '1-7 pers', remarks: 'Anniversaire, demande en mariage ? Nous personnalisons votre pique-nique avec ballons, gâteau et touches personnalisées.'
    },
    {
        type: 'ACTIVITY', name: 'Cours de Cuisine Française + Marché',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Cours de cuisine mains dans la pâte en anglais, visite au marché local pour sélectionner des ingrédients frais. Techniques professionnelles pour préparer Coq au Vin ou Bœuf Bourguignon. Repas 3 plats servi avec vins.',
        netCost: 242, recommendedMarkup: 11, currency: 'EUR',
        duration: '6h', capacity: 'par personne (max 12)', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Atelier Macarons',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Apprenez à confectionner de délicats macarons français avec un chef professionnel. Maîtrisez la meringue, le macaronage et les garnitures. Tea time inclus + boîte à emporter.',
        netCost: 149, recommendedMarkup: 11, currency: 'EUR',
        duration: '3h', capacity: 'par personne', remarks: 'Convient aux enfants dès 12 ans. Option de privatisation pour enfants plus jeunes (supplément).'
    },
    {
        type: 'ACTIVITY', name: 'Dégustation de Vins Privée',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Expérience de dégustation avec sommelier professionnel. Six vins, dont un Champagne, accompagnés de fromages et charcuterie dans un espace privé.',
        netCost: 135, recommendedMarkup: 11, currency: 'EUR',
        duration: '2h', capacity: '1-6 pers', remarks: 'Les vins sont disponibles à l\'achat après la dégustation.'
    },
    {
        type: 'ACTIVITY', name: 'Atelier Gin — Distillerie Artisanale',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Atelier gin dans une distillerie artisanale. Guidé par un sommelier, découverte de la distillation et des botaniques. Création de votre propre bouteille 70cl avec étiquette personnalisée.',
        netCost: 200, recommendedMarkup: 11, currency: 'EUR',
        duration: '~3h', capacity: '1-8 pers', remarks: ''
    },

    // ── Seine River Experiences ──
    {
        type: 'ACTIVITY', name: 'Croisière Seine — The',
        supplier: 'Lune DMC', location: 'Paris — Seine',
        description: 'Croisière privée de 1h30 sur la Seine, vue panoramique sur les monuments parisiens. Vin rosé et macarons inclus.',
        netCost: 719, recommendedMarkup: 11, currency: 'EUR',
        duration: '1h30', capacity: '1-6 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Croisière Seine — The Limousine',
        supplier: 'Lune DMC', location: 'Paris — Seine',
        description: 'Croisière privée de 1h30 sur la Seine, vue panoramique sur les monuments parisiens. Champagne et macarons inclus.',
        netCost: 1125, recommendedMarkup: 11, currency: 'EUR',
        duration: '1h30', capacity: '1-8 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Croisière Seine — Cocktail Cruise',
        supplier: 'Lune DMC', location: 'Paris — Seine',
        description: 'Croisière cocktail avec options sucrées ou salées gastronomiques. Champagne vintage et boissons non-alcoolisées incluses.',
        netCost: 1349, recommendedMarkup: 11, currency: 'EUR',
        duration: '2h', capacity: '1-12 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Croisière Seine Premium Privée',
        supplier: 'Lune DMC', location: 'Paris — Seine',
        description: 'Croisière sur bateau premium avec espace intérieur. Champagne vintage, macarons et amuse-bouches inclus. Vue panoramique exceptionnelle.',
        netCost: 1259, recommendedMarkup: 11, currency: 'EUR',
        duration: '1h30', capacity: '1-12 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Croisière Seine — Déjeuner ou Dîner',
        supplier: 'Lune DMC', location: 'Paris — Seine',
        description: 'Croisière privée déjeuner ou dîner intime et romantique. Parfait pour une demande en mariage, un dîner en famille, un EVJF ou une soirée spéciale.',
        netCost: 0, recommendedMarkup: 11, currency: 'EUR',
        duration: '2-4h', capacity: 'jusqu\'à 12 pers', remarks: 'Prix sur demande.'
    },

    // ── Day Trips & Excursions ──
    {
        type: 'ACTIVITY', name: 'Excursion Champagne — 2 Domaines',
        supplier: 'Lune DMC', location: 'Paris → Champagne',
        description: 'Visite de deux domaines (Mumm ou Pommery + petit producteur), dégustations, Cathédrale de Reims, village de Dom Pérignon et Avenue de Champagne. Transport A/R depuis Paris inclus.',
        netCost: 1322, recommendedMarkup: 11, currency: 'EUR',
        duration: '10h', capacity: '1-7 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Excursion Champagne Premium',
        supplier: 'Lune DMC', location: 'Paris → Champagne',
        description: 'La journée ultime en Champagne : visites privées ou semi-privées chez Moët & Chandon, Dom Pérignon, Veuve Clicquot ou Taittinger.',
        netCost: 0, recommendedMarkup: 11, currency: 'EUR',
        duration: '10h', capacity: '1-7 pers', remarks: 'Prix sur demande.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Loire Valley',
        supplier: 'Lune DMC', location: 'Paris → Loire Valley',
        description: 'Journée complète privée vallée de la Loire avec guide et transport luxe A/R. Châteaux de Chambord et Cheverny, promenade à Blois, dégustation de vins.',
        netCost: 1349, recommendedMarkup: 11, currency: 'EUR',
        duration: '10h', capacity: '1-7 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Excursion Mont-Saint-Michel',
        supplier: 'Lune DMC', location: 'Paris → Mont-Saint-Michel',
        description: 'Visite guidée privée du Mont-Saint-Michel et son abbaye médiévale avec guide agréé. Transport A/R et billets d\'entrée inclus.',
        netCost: 1475, recommendedMarkup: 11, currency: 'EUR',
        duration: '10h', capacity: '1-7 pers', remarks: 'Personnalisez avec une session d\'équitation ou une visite guidée de la baie.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Normandie D-Day',
        supplier: 'Lune DMC', location: 'Paris → Normandie',
        description: 'Journée privée D-Day avec guide certifié et transport A/R. Mémorial de Caen, Omaha Beach, Pointe du Hoc et Cimetière américain.',
        netCost: 1436, recommendedMarkup: 11, currency: 'EUR',
        duration: '10h', capacity: '1-7 pers', remarks: 'Personnalisez avec un tour en Jeep d\'Omaha Beach ou un pique-nique déjeuner.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Versailles + Giverny',
        supplier: 'Lune DMC', location: 'Paris → Versailles → Giverny',
        description: 'Journée privée au Château de Versailles et Fondation Monet à Giverny. Intérieurs, jardins, fontaines et jardins d\'eau de Monet. Guide expert et transport A/R.',
        netCost: 1259, recommendedMarkup: 11, currency: 'EUR',
        duration: '8h', capacity: '1-7 pers', remarks: 'Enrichissez avec un déjeuner aux Jardins des Plumes ou un pique-nique dans les jardins de Versailles.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Vaux-le-Vicomte + Fontainebleau',
        supplier: 'Lune DMC', location: 'Paris → Fontainebleau',
        description: 'Visite guidée privée des Châteaux de Fontainebleau et Vaux-le-Vicomte avec transfert privé A/R, entrée coupe-file et temps libre pour déjeuner.',
        netCost: 1259, recommendedMarkup: 11, currency: 'EUR',
        duration: '8h', capacity: '1-7 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Excursion Château de Chantilly',
        supplier: 'Lune DMC', location: 'Paris → Chantilly',
        description: 'Visite guidée privée du Château de Chantilly et ses jardins avec transfert privé A/R. Exploration de l\'histoire aristocratique française.',
        netCost: 719, recommendedMarkup: 11, currency: 'EUR',
        duration: '4h', capacity: '1-7 pers', remarks: 'Ajoutez un pique-nique royal ou une balade à cheval dans la forêt de Chantilly.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Bruges — Journée Complète',
        supplier: 'Lune DMC', location: 'Paris → Bruges',
        description: 'Excursion privée à Bruges avec transport A/R depuis Paris. Visite guidée à pied de 2h, montée au Beffroi et croisière sur les canaux.',
        netCost: 1436, recommendedMarkup: 11, currency: 'EUR',
        duration: '12h', capacity: '1-7 pers', remarks: 'Personnalisez avec une nuit sur place, croisière privée, dégustation chocolat ou bière, atelier gaufres !'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Bruxelles — Journée Complète',
        supplier: 'Lune DMC', location: 'Paris → Bruxelles',
        description: 'Transfert privé + train grande vitesse A/R. Visite guidée à pied de 2h, déjeuner dans un restaurant local, visite du Musée Magritte ou Musées royaux.',
        netCost: 0, recommendedMarkup: 11, currency: 'EUR',
        duration: '~14h', capacity: '1-7 pers', remarks: 'Prix sur demande. Options : tour bière, atelier chocolat, Musée de la BD, shopping, vélo.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Amsterdam — Journée Complète',
        supplier: 'Lune DMC', location: 'Paris → Amsterdam',
        description: 'Transfert + train grande vitesse, tour vélo privé ou groupe, visite Rijksmuseum ou Van Gogh, croisière canal. Meet & greet et transfer retour.',
        netCost: 0, recommendedMarkup: 11, currency: 'EUR',
        duration: '~16h', capacity: '1-10 pers', remarks: 'Prix sur demande. Options : nuit sur place, champs de tulipes, moulins de Zaanse Schans, Anne Frank House.'
    },
    {
        type: 'ACTIVITY', name: 'Excursion Londres — Journée Complète',
        supplier: 'Lune DMC', location: 'Paris → London',
        description: 'Transfert privé + Eurostar A/R. Visite guidée à pied des highlights de Londres. Recommandations restaurants, high tea, pubs.',
        netCost: 0, recommendedMarkup: 11, currency: 'EUR',
        duration: '~16h', capacity: '1-10 pers', remarks: 'Prix sur demande. Options : Tower of London, British Museum, croisière Tamise, Notting Hill, nuit sur place.'
    },

    // ── Fashion & Shopping ──
    {
        type: 'ACTIVITY', name: 'Marché aux Puces de Saint-Ouen',
        supplier: 'Lune DMC', location: 'Paris — Saint-Ouen',
        description: 'Explorez le marché aux puces de Saint-Ouen avec un guide privé, découvrez des trésors cachés et des pièces vintage pendant un tour de 3h.',
        netCost: 566, recommendedMarkup: 11, currency: 'EUR',
        duration: '2.5-3h', capacity: '1-7 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Galerie Dior — Visite Privée',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Visite privée de la Galerie Dior avec un expert guide.',
        netCost: 495, recommendedMarkup: 11, currency: 'EUR',
        duration: '~2h', capacity: '1-8 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Luxury Vintage Shopping Experience',
        supplier: 'Lune DMC', location: 'Paris — Marais / Saint-Germain',
        description: 'Expérience privée de 3h explorant le meilleur du vintage designer : Chanel, Hermès, Dior, YSL dans des boutiques exclusives du Marais et Saint-Germain-des-Prés.',
        netCost: 566, recommendedMarkup: 11, currency: 'EUR',
        duration: '2.5-3h', capacity: '1-7 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Samaritaine VIP Lounge — Styling Privé',
        supplier: 'Lune DMC', location: 'Paris — La Samaritaine',
        description: 'Session de styling privée sur rendez-vous dans le VIP Lounge historique de La Samaritaine. Champagne, sélections personnalisées, guidance experte. Options incluses : maquillage, fragrance, skincare, cognac.',
        netCost: 495, recommendedMarkup: 11, currency: 'EUR',
        duration: '3-4h', capacity: '1 pers', remarks: ''
    },
    {
        type: 'ACTIVITY', name: 'Expérience Shopping Parisienne',
        supplier: 'Lune DMC', location: 'Paris',
        description: 'Explorez des boutiques cachées et des designers français émergents rarement trouvés hors de France. Itinéraire personnalisé selon vos goûts, avec analyse street-style.',
        netCost: 585, recommendedMarkup: 11, currency: 'EUR',
        duration: '6h', capacity: '1 pers', remarks: ''
    },

    // ── Transport ──
    {
        type: 'TRANSFER', name: 'Transfert Aéroport CDG',
        supplier: 'Lune DMC — Transport', location: 'Paris — CDG',
        description: 'Accueil en zone d\'arrivée avec panneau nominatif et transfert direct vers votre hôtel à Paris. Mercedes Classe E (1-3 pers) ou Classe V (1-7 pers).',
        netCost: 134, recommendedMarkup: 11, currency: 'EUR',
        pricingMode: 'ONE_WAY' as any, oneWayPrice: 134,
        duration: '~1h', capacity: '1-7 pers', remarks: 'Mercedes E pour 1-3 pers (€149), Mercedes V pour 1-7 pers (€189).'
    },
    {
        type: 'TRANSFER', name: 'Transfert Gare',
        supplier: 'Lune DMC — Transport', location: 'Paris',
        description: 'Accueil en gare avec panneau nominatif et transfert direct vers votre hôtel à Paris. Mercedes Classe E (1-3 pers) ou Classe V (1-7 pers).',
        netCost: 77, recommendedMarkup: 11, currency: 'EUR',
        pricingMode: 'ONE_WAY' as any, oneWayPrice: 77,
        duration: '~1h', capacity: '1-7 pers', remarks: 'Mercedes E pour 1-3 pers (€85), Mercedes V pour 1-7 pers (€110).'
    },
];

// ═══ PRESTATAIRES — PALACES PARIS (fournisseurs externes avec concierge) ═══
const PALACE_SUPPLIERS = [
    { name: 'Le Bristol Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris', phone: '+33 1 53 43 43 00', email: 'concierge.lebristolparis@oetkercollection.com', contactName: 'Jean-Marie Burlet (Chef Concierge)', website: 'https://www.oetkercollection.com/fr/hotels/le-bristol-paris/', notes: 'Palace iconique du Faubourg Saint-Honoré. Restaurant 3 étoiles Epicure, spa, jardin intérieur, piscine rooftop. Clés d\'Or.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Gastronomie'] },
    { name: 'Hôtel de Crillon', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '10 Place de la Concorde, 75008 Paris', phone: '+33 1 44 71 15 00', email: 'crillon.concierge@rosewoodhotels.com', contactName: 'Frédéric Cassel (Chef Concierge)', website: 'https://www.rosewoodhotels.com/en/hotel-de-crillon', notes: 'Palace historique Place de la Concorde. Suites avec vue, spa Sense, restaurant L\'Ecrin étoilé, bar Les Ambassadeurs.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Historique'] },
    { name: 'Plaza Athénée', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '25 Avenue Montaigne, 75008 Paris', phone: '+33 1 53 67 66 65', email: 'concierge.HPA@dorchestercollection.com', contactName: 'Pascal de Joffrey (Chef Concierge)', website: 'https://www.dorchestercollection.com/paris/hotel-plaza-athenee', notes: 'Avenue Montaigne, cœur de la haute couture. Restaurant Alain Ducasse, Dior Institut Spa, terrasse emblématique.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Mode', 'Gastronomie'] },
    { name: 'La Réserve Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '42 Avenue Gabriel, 75008 Paris', phone: '+33 1 58 36 60 60', email: 'concierge@lareserve-paris.com', contactName: 'Marie France Gregoire (Chef Concierge)', website: 'https://www.lareserve-paris.com', notes: 'Hôtel particulier de 40 suites entre Palais de l\'Élysée et Champs-Élysées. Spa Nescens, restaurant Le Gabriel étoilé.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Intime'] },
    { name: 'Le Meurice', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '228 Rue de Rivoli, 75001 Paris', phone: '+33 1 44 58 10 10', email: 'concierge.LMP@dorchestercollection.com', contactName: 'Jean-Sébastien Leguay (Chef Concierge)', website: 'https://www.dorchestercollection.com/paris/le-meurice', notes: 'Face aux Tuileries, décor Louis XVI revisité par Philippe Starck. Restaurant Alain Ducasse 2 étoiles, Bar 228.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 1er', 'Art', 'Design'] },
    { name: 'Mandarin Oriental Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '251 Rue Saint-Honoré, 75001 Paris', phone: '+33 1 70 98 78 88', email: 'mopar-concierge@mohg.com', contactName: 'Jerome Poret (Chef Concierge)', website: 'https://www.mandarinoriental.com/paris', notes: 'Art déco contemporain au cœur de la rue Saint-Honoré. Spa de 900m², restaurant Camélia, jardin intérieur.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 1er', 'Spa', 'Contemporain'] },
    { name: 'Park Hyatt Paris-Vendôme', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '5 Rue de la Paix, 75002 Paris', phone: '+33 1 58 71 12 34', email: 'paris.vendome@hyatt.com', contactName: 'Dominique Guidetti (Chef Concierge)', website: 'https://www.hyatt.com/park-hyatt/parpa-park-hyatt-paris-vendome', notes: 'Design d\'Ed Tuttle entre Place Vendôme et Opéra. Spa, restaurant Pur\' — Jean-François Rouquette.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 2ème', 'Design'] },
    { name: 'The Peninsula Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '19 Avenue Kléber, 75116 Paris', phone: '+33 1 58 12 28 88', email: 'ppr@peninsula.com', contactName: 'Bastien Lalanne (Chef Concierge)', website: 'https://www.peninsula.com/fr/paris', notes: 'Près de l\'Arc de Triomphe, toit-terrasse vue 360°. L\'Oiseau Blanc restaurant rooftop, spa, piscine intérieure.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 16ème', 'Rooftop', 'Vue'] },
    { name: 'Le Royal Monceau', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '37 Avenue Hoche, 75008 Paris', phone: '+33 1 42 99 88 00', email: 'concierge.paris@raffles.com', contactName: 'Daisuké Kimura (Chef Concierge)', website: 'https://www.raffles.com/paris', notes: 'Palace arty redesigné par Philippe Starck. Cinéma privé, galerie d\'art, spa Clarins 1500m², restaurant Il Carpaccio.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Art', 'Cinéma'] },
    { name: 'Shangri-La Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '10 Avenue d\'Iéna, 75116 Paris', phone: '+33 1 53 67 19 98', email: 'concierge.slpr@shangri-la.com', contactName: 'Tony Le Goff (Chef Concierge)', website: 'https://www.shangri-la.com/paris', notes: 'Ancien palais du Prince Roland Bonaparte avec vue Tour Eiffel. Restaurant L\'Abeille étoilé, Shang Palace cuisine cantonaise.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 16ème', 'Vue Eiffel', 'Asiatique'] },
    { name: 'Ritz Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '15 Place Vendôme, 75001 Paris', phone: '+33 1 43 16 30 30', email: 'concierge@ritzparis.com', contactName: 'Jean-Marie Burlet (Chef Concierge)', website: 'https://www.ritzparis.com', notes: 'Le palace mythique de la Place Vendôme. Bar Hemingway, L\'Espadon, Chanel au Ritz Spa, école Ritz Escoffier.', rating: 5, commission: 12, tags: ['Palace', 'Luxe', 'Paris 1er', 'Mythique', 'Hemingway'] },
    { name: 'Four Seasons George V', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '31 Avenue George V, 75008 Paris', phone: '+33 1 49 52 70 00', email: 'concierge.paris@fourseasons.com', contactName: 'Philippe Verdumo (Chef Concierge)', website: 'https://www.fourseasons.com/paris', notes: 'Triangle d\'or, 3 restaurants étoilés (Le Cinq, Le George, L\'Orangerie). Spa, art floral spectaculaire de Jeff Leatham.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 8ème', 'Gastronomie', '3 étoilés'] },
    { name: 'Hôtel Lutetia', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '45 Boulevard Raspail, 75006 Paris', phone: '+33 1 49 54 46 46', email: 'concierge@hotellutetia.com', contactName: 'Olivier Heitz (Chef Concierge)', website: 'https://www.hotellutetia.com', notes: 'Seul palace rive gauche, style Art déco magnifiquement restauré. Brasserie Lutetia, Bar Joséphine, Akasha Spa.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 6ème', 'Art Déco', 'Rive Gauche'] },
    { name: 'Cheval Blanc Paris', category: 'HÉBERGEMENT', country: 'France', city: 'Paris', address: '8 Quai du Louvre, 75001 Paris', phone: '+33 1 40 28 00 00', email: 'concierge.paris@chevalblanc.com', contactName: 'Margaux Médeau (Chef Concierge)', website: 'https://www.chevalblanc.com/paris', notes: 'Dernier-né des palaces, face au Pont Neuf. Piscine 30m, spa Dior, restaurant Plénitude par Arnaud Donckele 3 étoiles.', rating: 5, commission: 10, tags: ['Palace', 'Luxe', 'Paris 1er', 'LVMH', 'Contemporain'] },
];

async function findTenantId() {
    const tenantsSnap = await adminDb.collection('tenants').get();
    for (const doc of tenantsSnap.docs) {
        const contactsSnap = await adminDb.collection('tenants').doc(doc.id).collection('contacts').limit(1).get();
        if (!contactsSnap.empty) return doc.id;
    }
    return tenantsSnap.docs.length > 0 ? tenantsSnap.docs[0].id : null;
}

export async function GET(req: Request) {
    try {
        // Auth check — prevent unauthorized catalog seeding
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;

        const tenantId = await findTenantId();
        if (!tenantId) return NextResponse.json({ error: 'No tenant found' }, { status: 404 });

        // 1) Clear ALL existing catalog items
        const oldCatalog = await adminDb.collection('tenants').doc(tenantId).collection('catalog').get();
        const deleteBatch = adminDb.batch();
        oldCatalog.docs.forEach(d => deleteBatch.delete(d.ref));
        if (oldCatalog.docs.length > 0) await deleteBatch.commit();

        // 1b) Also clear the legacy "prestations" collection
        const oldPrestations = await adminDb.collection('tenants').doc(tenantId).collection('prestations').get();
        if (!oldPrestations.empty) {
            const delBatch2 = adminDb.batch();
            oldPrestations.docs.forEach(d => delBatch2.delete(d.ref));
            await delBatch2.commit();
        }

        // 2) Seed PRESTATIONS into catalog
        const catalogCol = adminDb.collection('tenants').doc(tenantId).collection('catalog');
        const now = new Date();

        // Firestore batch max is 500 ops — we have 40, so one batch is fine
        const batch1 = adminDb.batch();
        for (const item of LUNE_PRESTATIONS) {
            batch1.set(catalogCol.doc(), { ...item, createdAt: now, updatedAt: now });
        }
        await batch1.commit();

        // 3) Seed SUPPLIERS (palaces) into suppliers — skip existing
        const batch2 = adminDb.batch();
        const suppliersCol = adminDb.collection('tenants').doc(tenantId).collection('suppliers');

        const existingSuppliers = await suppliersCol.get();
        const existingNames = new Set(existingSuppliers.docs.map(d => d.data().name));

        let addedSuppliers = 0;
        for (const supplier of PALACE_SUPPLIERS) {
            if (!existingNames.has(supplier.name)) {
                batch2.set(suppliersCol.doc(), { ...supplier, isFavorite: true, currency: 'EUR', createdAt: now, updatedAt: now });
                addedSuppliers++;
            }
        }
        if (addedSuppliers > 0) await batch2.commit();

        return NextResponse.json({
            success: true,
            tenantId,
            catalogCleared: oldCatalog.docs.length,
            prestationsCleared: oldPrestations.docs.length,
            prestationsCreated: LUNE_PRESTATIONS.length,
            suppliersCreated: addedSuppliers,
            suppliersSkipped: PALACE_SUPPLIERS.length - addedSuppliers,
            message: `✅ ${LUNE_PRESTATIONS.length} prestations Paris 2026 → Catalog | ${addedSuppliers} palaces → Suppliers`
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
