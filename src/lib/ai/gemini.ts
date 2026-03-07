import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL = 'gemini-2.5-pro';

async function generateJSON(prompt: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  const text = response.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };
}

// ══════════════════════════════════════════════════════════════════════
// ── SMART URL BUILDERS — Aggregator deep-links that ALWAYS work
// ══════════════════════════════════════════════════════════════════════
// Strategy: use major travel aggregators (Google, Skyscanner, Booking.com,
// GetYourGuide, TripAdvisor, Google Maps) which always resolve correctly
// and show real, bookable results with prices.

// ── IATA codes for deep-linking ────────────────────────────────────
const CITY_IATA: Record<string, string> = {
  'paris': 'CDG', 'lyon': 'LYS', 'marseille': 'MRS', 'nice': 'NCE', 'toulouse': 'TLS',
  'bordeaux': 'BOD', 'nantes': 'NTE', 'strasbourg': 'SXB', 'lille': 'LIL',
  'london': 'LHR', 'londres': 'LHR', 'new york': 'JFK', 'los angeles': 'LAX',
  'tokyo': 'NRT', 'dubai': 'DXB', 'singapour': 'SIN', 'singapore': 'SIN',
  'bangkok': 'BKK', 'bali': 'DPS', 'rome': 'FCO', 'barcelone': 'BCN', 'barcelona': 'BCN',
  'madrid': 'MAD', 'lisbonne': 'LIS', 'lisbon': 'LIS', 'berlin': 'BER',
  'amsterdam': 'AMS', 'istanbul': 'IST', 'athènes': 'ATH', 'athens': 'ATH',
  'marrakech': 'RAK', 'casablanca': 'CMN', 'tunis': 'TUN', 'le caire': 'CAI', 'cairo': 'CAI',
  'sydney': 'SYD', 'melbourne': 'MEL', 'auckland': 'AKL', 'hong kong': 'HKG',
  'séoul': 'ICN', 'seoul': 'ICN', 'mumbai': 'BOM', 'delhi': 'DEL', 'taipei': 'TPE',
  'kuala lumpur': 'KUL', 'san francisco': 'SFO', 'miami': 'MIA', 'chicago': 'ORD',
  'toronto': 'YYZ', 'montreal': 'YUL', 'mexico': 'MEX', 'lima': 'LIM',
  'buenos aires': 'EZE', 'são paulo': 'GRU', 'bogota': 'BOG', 'santiago': 'SCL',
  'nairobi': 'NBO', 'cape town': 'CPT', 'johannesburg': 'JNB', 'addis ababa': 'ADD',
  'doha': 'DOH', 'abu dhabi': 'AUH', 'maldives': 'MLE', 'ile maurice': 'MRU',
  'mauritius': 'MRU', 'seychelles': 'SEZ', 'phuket': 'HKT', 'cancun': 'CUN',
  'zanzibar': 'ZNZ', 'dakar': 'DSS', 'reykjavik': 'KEF', 'oslo': 'OSL',
  'copenhague': 'CPH', 'stockholm': 'ARN', 'helsinki': 'HEL', 'vienne': 'VIE',
  'vienna': 'VIE', 'prague': 'PRG', 'varsovie': 'WAW', 'warsaw': 'WAW',
  'budapest': 'BUD', 'dubrovnik': 'DBV', 'malte': 'MLA', 'malta': 'MLA',
  'santorin': 'JTR', 'santorini': 'JTR', 'mykonos': 'JMK', 'milan': 'MXP',
  'florence': 'FLR', 'venise': 'VCE', 'venice': 'VCE', 'naples': 'NAP',
  'porto': 'OPO', 'faro': 'FAO', 'ténérife': 'TFS', 'tenerife': 'TFS',
  'majorque': 'PMI', 'mallorca': 'PMI', 'ibiza': 'IBZ',
};

function getIata(city: string): string {
  const lower = city.toLowerCase().trim();
  if (CITY_IATA[lower]) return CITY_IATA[lower];
  for (const [name, code] of Object.entries(CITY_IATA)) {
    if (lower.includes(name) || name.includes(lower)) return code;
  }
  return '';
}

// ── FLIGHT URL → Google Flights (text search — ALWAYS works) ────────
export function buildFlightSearchUrl(airline: string, from: string, to: string, date?: string): { url: string; domain: string } {
  // Google Flights text search — always resolves to the right results page
  const query = `vols ${from} vers ${to} ${airline}`.trim();
  const dateParam = date ? `&tfs=CBwQAhoaEgoyMDI2LTAzLTE1agcIARIDQ0RHcgcIARIDTlJU` : '';
  return {
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&curr=EUR`,
    domain: 'google.com/flights',
  };
}

// ── HOTEL URL → Google Hotels (always works, real prices) ────────────
export function buildHotelSearchUrl(hotelName: string, destination: string): { url: string; domain: string } {
  return {
    url: `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotelName + ' ' + destination)}&utm_source=luna`,
    domain: 'google.com/hotels',
  };
}

// ── TRAIN URL → SNCF Connect / Omio (real search pages) ─────────────
export function buildTrainSearchUrl(from: string, to: string): { url: string; domain: string } {
  // Omio (formerly GoEuro) — works for all European trains
  return {
    url: `https://www.omio.fr/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&mode=train`,
    domain: 'omio.fr',
  };
}

// ── CAR ROUTE URL → Google Maps directions ──────────────────────────
export function buildCarSearchUrl(from: string, to: string): { url: string; domain: string } {
  return {
    url: `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
    domain: 'google.com/maps',
  };
}

// ── CAR RENTAL URL → Rentalcars.com ─────────────────────────────────
export function buildCarRentalUrl(destination: string): { url: string; domain: string } {
  return {
    url: `https://www.rentalcars.com/fr/search-results?location=${encodeURIComponent(destination)}`,
    domain: 'rentalcars.com',
  };
}

// ── ACTIVITY URL → Routed to best platform per type ─────────────────
export function buildActivityUrl(activity: string, destination: string): string {
  const lower = (activity + ' ' + destination).toLowerCase();

  // Restaurant / Gastronomy → Google Maps (always shows real places with reviews)
  if (/restaurant|dîner|déjeuner|gastronomie|michelin|étoilé|chef|culinaire|table|bistrot|brasserie|bar|cocktail/.test(lower))
    return `https://www.google.com/maps/search/restaurants+${encodeURIComponent(destination)}`;

  // Spa / Wellness → Google Maps
  if (/spa|bien-être|yoga|massage|hammam|onsen|sauna|thalasso|soin/.test(lower))
    return `https://www.google.com/maps/search/spa+wellness+${encodeURIComponent(destination)}`;

  // Guided tours / Visits / Excursions → GetYourGuide
  if (/visite|tour|excursion|guide|monument|temple|musée|palais|château|randonnée|trek|culturel|historique/.test(lower))
    return `https://www.getyourguide.fr/s/?q=${encodeURIComponent(destination + ' ' + activity.split(' ').slice(0, 4).join(' '))}&searchSource=1`;

  // Boat / Cruise → GetYourGuide
  if (/croisière|bateau|catamaran|voile|yacht|ferry|pirogue|gondole|kayak/.test(lower))
    return `https://www.getyourguide.fr/s/?q=${encodeURIComponent(destination + ' bateau croisière')}&searchSource=1`;

  // Cooking class → GetYourGuide
  if (/cuisine|cooking|cuisson|recette|marché|cours de/.test(lower))
    return `https://www.getyourguide.fr/s/?q=${encodeURIComponent(destination + ' cours cuisine')}&searchSource=1`;

  // Diving / Snorkeling → GetYourGuide 
  if (/plongée|snorkeling|diving|récif|corail|sous-marin/.test(lower))
    return `https://www.getyourguide.fr/s/?q=${encodeURIComponent(destination + ' plongée snorkeling')}&searchSource=1`;

  // Shopping → Google Maps
  if (/shopping|boutique|marché|souk|bazaar|personal shopper/.test(lower))
    return `https://www.google.com/maps/search/shopping+${encodeURIComponent(destination)}`;

  // Nightlife / Shows → Google Maps
  if (/spectacle|show|concert|opéra|cabaret|soirée|nightlife|club/.test(lower))
    return `https://www.google.com/maps/search/${encodeURIComponent(activity.split(' ').slice(0, 3).join(' '))}+${encodeURIComponent(destination)}`;

  // Transfer / Transport → Google Maps (taxi/transfert)
  if (/transfert|limousine|chauffeur|navette|transport|aéroport/.test(lower))
    return `https://www.google.com/maps/search/transfert+aéroport+${encodeURIComponent(destination)}`;

  // Helicopter / Adventure → GetYourGuide
  if (/hélicoptère|helicopter|montgolfière|parachute|aventure|safari/.test(lower))
    return `https://www.getyourguide.fr/s/?q=${encodeURIComponent(destination + ' ' + activity.split(' ').slice(0, 3).join(' '))}&searchSource=1`;

  // Default → TripAdvisor (always works, always relevant)
  return `https://www.tripadvisor.fr/Search?q=${encodeURIComponent(destination + ' ' + activity.split(' ').slice(0, 5).join(' '))}`;
}

// ══════════════════════════════════════════════════════════════════════
// ── TRANSPORT AGENT (Multi-modal: vols, trains, voitures) ───────────
// ══════════════════════════════════════════════════════════════════════
export async function searchTransport(params: {
  destinations: { city: string }[];
  departureCity?: string;
  departureDate: string;
  returnDate: string;
  pax: string;
  budget?: string;
  realData?: any[];
}) {
  const destList = params.destinations.map(d => d.city).join(' → ');
  const from = params.departureCity || 'Paris';
  const realFlightsContext = params.realData && params.realData.length > 0
    ? `\n\n🎯 DONNÉES RÉELLES (AMADEUS):\nVoici les vols RÉELS trouvés pour ce trajet. Utilise UNIQUEMENT ces vols s'ils sont pertinents :\n${JSON.stringify(params.realData, null, 2)}`
    : '';

  const budgetNote = params.budget ? `\n⚠️ BUDGET TOTAL DU VOYAGE: ${params.budget} (pour ${params.pax || '2'} personnes, TOUT COMPRIS: vol + hôtel + activités).\nLe transport ne doit PAS dépasser 30-40% du budget total.` : '';

  const prompt = `Tu es un agent EXPERT TRANSPORT pour une agence de voyage professionnelle.

MISSION: Trouver TOUTES les options de transport (avion, train, voiture) pour:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Départ: ${from}
• Itinéraire: ${from} → ${destList}
• Date aller: ${params.departureDate || 'flexible'}
• Date retour: ${params.returnDate || 'flexible'}
• Passagers: ${params.pax || '2'}${budgetNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLES OBLIGATOIRES:
1. ✈️ VOLS: Utilise en priorité les DONNÉES RÉELLES fournies ci-dessus.
2. Si les données réelles sont incomplètes, propose 6-8 options avec compagnies RÉELLES, prix RÉALISTES
   - Au moins 4-5 options Economy (400-900€/pers)
   - 1-2 options Premium Economy (800-1500€/pers)
   - 1 option Business SEULEMENT si le budget le permet
3. 🚄 TRAINS: 3-4 options si pertinent (TGV, Eurostar, ICE, Thalys, AVE, Frecciarossa, Nightjet...)
   - Inclure gare de départ et d'arrivée (ex: Paris Gare de Lyon → Lyon Part-Part Dieu)
   - Prix réalistes (1ère: 80-200€, 2nde: 30-100€ selon distance)
   - Si la destination est trop loin pour le train (>8h), mettre seulement 1 option train avec mention "longue durée"
4. 🚗 VOITURE: 2 options (location + trajet estimé)
   - Distance et durée réelles
   - Coût carburant estimé et prix location/jour
5. Chaque option a un "type": "flight", "train" ou "car"${realFlightsContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Réponds UNIQUEMENT en JSON valide, AUCUN texte avant ou après:
{
  "flights": [
    {
      "type": "flight",
      "airline": "Nom compagnie exact",
      "route": "CDG → NRT",
      "class": "Business",
      "price": "À partir de X XXX €/pers",
      "duration": "Environ XXh",
      "stops": "0 ou 1",
      "stopCity": "ville ou null"
    }
  ],
  "trains": [
    {
      "type": "train",
      "operator": "TGV INOUI / Eurostar / ICE / etc.",
      "route": "Paris Gare de Lyon → Lyon Part-Dieu",
      "class": "1ère classe",
      "price": "À partir de XX €/pers",
      "duration": "Xh XXmin",
      "frequency": "Toutes les Xh environ"
    }
  ],
  "cars": [
    {
      "type": "car",
      "mode": "Location voiture / Trajet personnel",
      "route": "${from} → destination",
      "distance": "XXX km",
      "duration": "Xh XX",
      "price": "Environ XX €/jour location + XX € carburant",
      "details": "Via autoroute A6, péages inclus estimés à XX €"
    }
  ],
  "summary": "X options multimodales de ${from} vers ${destList}: Y vols, Z trains, W options voiture."
}`;

  try {
    const parsed = await generateJSON(prompt);

    // Post-process: add smart booking URLs per transport type
    if (parsed.flights) {
      parsed.flights = parsed.flights.map((f: any) => {
        const link = buildFlightSearchUrl(f.airline, from, destList, params.departureDate);
        return { ...f, type: 'flight', url: link.url, domain: link.domain };
      });
    }
    if (parsed.trains) {
      parsed.trains = parsed.trains.map((t: any) => {
        const link = buildTrainSearchUrl(from, params.destinations[0]?.city || destList);
        return { ...t, type: 'train', url: link.url, domain: link.domain };
      });
    }
    if (parsed.cars) {
      parsed.cars = parsed.cars.map((c: any) => {
        const isRental = /location/i.test(c.mode || '');
        const link = isRental
          ? buildCarRentalUrl(params.destinations[0]?.city || destList)
          : buildCarSearchUrl(from, params.destinations[0]?.city || destList);
        return { ...c, type: 'car', url: link.url, domain: link.domain };
      });
    }
    return parsed;
  } catch {
    return { summary: 'Agent Transport indisponible', flights: [], trains: [], cars: [] };
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── ACCOMMODATION AGENT ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function searchAccommodation(params: {
  destinations: { city: string }[];
  vibe: string;
  budget: string;
  pax: string;
  realData?: any[];
}) {
  const destList = params.destinations.map(d => d.city).join(', ');
  const destCount = params.destinations.length;
  const hotelsPerDest = Math.max(3, Math.ceil(10 / destCount));

  const realHotelsContext = params.realData && params.realData.length > 0
    ? `\n\n🎯 DONNÉES RÉELLES (BOOKING):\nUtilise ces hôtels comme priorité absolue :\n${JSON.stringify(params.realData, null, 2)}`
    : '';

  const budgetPerNight = params.budget ? Math.round(parseInt(params.budget.replace(/[^\d]/g, '')) * 0.35 / (parseInt(params.pax) || 2) / 7) : 0;

  const prompt = `Tu es un agent EXPERT de l'hébergement pour une agence de voyage professionnelle.

MISSION: Trouver les MEILLEURS hôtels ADAPTÉS AU BUDGET pour un voyage MULTI-DESTINATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Destinations: ${destList} (${destCount} ville${destCount > 1 ? 's' : ''})
• Ambiance: ${params.vibe || 'Découverte & Détente'}
• Budget TOTAL voyage: ${params.budget || 'Non précisé'}
• Voyageurs: ${params.pax || '2'}
${budgetPerNight > 0 ? `• Budget hébergement estimé: ~${budgetPerNight}€/nuit/personne` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ RÈGLE CRITIQUE: Tu DOIS proposer ${hotelsPerDest} hôtels POUR CHAQUE DESTINATION séparément.
${params.destinations.map(d => `- ${hotelsPerDest} hôtels à ${d.city}`).join('\n')}

Chaque hôtel DOIT avoir un champ "destination" correspondant EXACTEMENT à sa ville.

RESPECTE LE BUDGET ! Propose un MIX réaliste pour CHAQUE ville :
- Hôtels économiques (3★, 30-80€/nuit)
- Hôtels milieu de gamme (4★, 80-200€/nuit) 
- Hôtels premium (5★, 200-400€/nuit)

RÈGLES:
1. 🏨 Utilise les DONNÉES RÉELLES ci-dessous en priorité.
2. Hôtels qui EXISTENT RÉELLEMENT dans chaque ville.
3. 💰 Prix RÉELS par nuit.
4. ⭐ Mélange de gammes (3★ à 5★) DANS CHAQUE ville.${realHotelsContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Réponds UNIQUEMENT en JSON valide:
{
  "hotels": [
    {
      "name": "Nom complet officiel",
      "destination": "NOM DE LA VILLE EXACTE (${destList})",
      "stars": 5,
      "pricePerNight": "XXX €",
      "highlights": ["Service 1", "Service 2", "Service 3"],
      "recommendation": "Pourquoi ce choix pour ce profil client."
    }
  ],
  "summary": "Sélection de X hôtels à travers ${destList}."
}`;

  try {
    const parsed = await generateJSON(prompt);
    if (parsed.hotels) {
      parsed.hotels = parsed.hotels.map((h: any) => {
        const link = buildHotelSearchUrl(h.name, h.destination || destList);
        return { ...h, url: link.url, domain: link.domain };
      });
    }
    return parsed;
  } catch {
    return { summary: 'Agent Hébergement indisponible', hotels: [] };
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── CLIENT PROFILE AGENT ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function analyzeClientProfile(params: {
  pax: string;
  vibe: string;
  budget: string;
  mustHaves: string;
}) {
  // Uses generateJSON helper

  const prompt = `Tu es un agent CRM EXPERT spécialiste du profil client pour une agence de voyage ultra-luxe.

MISSION: Analyser le profil voyageur et créer des recommandations ACTIONNABLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Voyageurs: ${params.pax || '2 adultes'}
• Ambiance souhaitée: ${params.vibe || 'Non précisé'}
• Budget: ${params.budget || 'Non précisé'}
• Must-haves: ${params.mustHaves || 'Aucun'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLES OBLIGATOIRES:
1. 🎯 10 recommandations ULTRA-CONCRÈTES et spécifiques (pas de recommandations vagues)
2. 🏷️ Chaque recommandation a un type: activité, service, restaurant, bien-être, expérience, transport
3. 💡 Inclure des services premium réalistes (transfert privé, conciergerie, personal shopper, etc.)
4. 🎏 Adapter au profil: ${params.vibe === 'Lune de Miel' ? 'couple romantique' : params.vibe === "Voyage d'Affaires" ? 'professionnel exigeant' : 'voyageur découverte'}

Réponds UNIQUEMENT en JSON valide, AUCUN texte avant ou après:
{
  "profile": {
    "segment": "Ultra-Luxe/Luxe/Premium",
    "preferences": ["pref1", "pref2", "pref3"],
    "specialNeeds": "besoins particuliers détectés",
    "loyaltyTips": "stratégie de fidélisation en 1 phrase"
  },
  "summary": "Profil [segment]. Recommandations personnalisées pour maximiser l'expérience.",
  "recommendations": [
    {
      "text": "Description concrète et actionnable de la recommandation avec nom du prestataire si applicable",
      "type": "activité/service/restaurant/bien-être/expérience/transport"
    }
  ]
}`;

  try {
    const parsed = await generateJSON(prompt);
    if (parsed.recommendations) {
      parsed.recommendations = parsed.recommendations.map((r: any) => ({
        ...r,
        url: buildActivityUrl(r.text || '', r.type || ''),
      }));
    }
    return parsed;
  } catch {
    return { summary: 'Agent Client indisponible', profile: {} };
  }
}

// ══════════════════════════════════════════════════════════════════════
// ── ITINERARY PLANNER AGENT ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function planItinerary(params: {
  destinations: { city: string }[];
  departureDate: string;
  returnDate: string;
  vibe: string;
  mustHaves: string;
  budget?: string;
}) {
  const destList = params.destinations.map(d => d.city).join(' → ');
  const destCount = params.destinations.length;
  const primaryDest = params.destinations[0]?.city || 'destination';

  // Calculate actual trip duration
  let numDays = 7;
  if (params.departureDate && params.returnDate) {
    const dep = new Date(params.departureDate);
    const ret = new Date(params.returnDate);
    const diff = Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff <= 30) numDays = diff;
  }

  // Multi-destination allocation
  const daysPerDest = Math.max(2, Math.floor(numDays / destCount));
  const destAllocation = params.destinations.map((d, i) => {
    const days = i === params.destinations.length - 1
      ? numDays - daysPerDest * (destCount - 1)
      : daysPerDest;
    return `${d.city}: ${days} jours`;
  }).join(', ');

  const multiDestInstructions = destCount > 1 ? `
⚠️ MULTI-DESTINATION CRITIQUE:
Ce voyage couvre ${destCount} villes: ${destList}
Répartition recommandée: ${destAllocation}

RÈGLES MULTI-DEST:
- Chaque jour DOIT avoir un champ "destination" = le nom EXACT de la ville
- Inclure 1 jour de TRANSFERT entre chaque ville (vol/train)
- Les jours de transfert combinent départ d'une ville et arrivée dans la suivante
- NE PAS mélanger les activités de deux villes dans un même jour (sauf jour de transfert)
- Résumer le jour de transfert: matin dans ville A, voyage, soir dans ville B
` : '';

  const prompt = `Tu es un agent EXPERT planificateur d'itinéraires pour une agence de voyage professionnelle.

MISSION: Créer un itinéraire jour par jour EXCEPTIONNEL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Destinations: ${destList}
• Durée: ${numDays} jours (du ${params.departureDate || 'J1'} au ${params.returnDate || `J${numDays}`})
• Ambiance: ${params.vibe || 'Découverte & Détente'}
• Must-haves: ${params.mustHaves || 'Aucun'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${multiDestInstructions}
RÈGLES OBLIGATOIRES:
1. 📍 Noms de lieux RÉELS: vrais restaurants, vrais monuments, vraies adresses
2. 📐 Exactement ${numDays} jours, pas plus pas moins
3. 🕐 Rythme réaliste: pas trop d'activités par jour
4. 🌟 Chaque jour a un "highlight" — le moment fort
5. 🍽️ Au moins 1 restaurant nommé par jour
6. 📌 Chaque jour a un champ "destination" = nom de la ville

Réponds UNIQUEMENT en JSON valide:
{
  "days": [
    {
      "day": 1,
      "title": "Titre évocateur",
      "destination": "${primaryDest}",
      "morning": "Activité avec NOM DU LIEU",
      "afternoon": "Activité avec NOM DU LIEU",
      "evening": "Restaurant NOM + activité",
      "highlight": "🌟 Moment fort en 1 phrase"
    }
  ],
  "summary": "Itinéraire de ${numDays} jours: ${destList}.",
  "tips": ["Conseil pratique #1", "Conseil #2", "Conseil #3"]
}`;

  try {
    const parsed = await generateJSON(prompt);
    if (parsed.days) {
      parsed.days = parsed.days.map((d: any) => ({
        ...d,
        morningUrl: d.morning ? buildActivityUrl(d.morning, d.destination || primaryDest) : null,
        afternoonUrl: d.afternoon ? buildActivityUrl(d.afternoon, d.destination || primaryDest) : null,
        eveningUrl: d.evening ? buildActivityUrl(d.evening, d.destination || primaryDest) : null,
      }));
    }
    return parsed;
  } catch {
    return { summary: 'Agent Itinéraire indisponible', days: [] };
  }
}
