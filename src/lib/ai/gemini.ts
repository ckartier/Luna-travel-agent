import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// ─── TRANSPORT AGENT ────────────────────────────────────────────────
export async function searchTransport(params: {
  destinations: { city: string }[];
  departureDate: string;
  returnDate: string;
  pax: string;
}) {
  const model = getModel();
  const destList = params.destinations.map(d => d.city).join(' → ');

  const prompt = `Tu es un agent spécialiste du transport aérien pour une agence de voyage de luxe.

Recherche les meilleures options de vol pour:
- Itinéraire: ${destList}
- Date départ: ${params.departureDate}
- Date retour: ${params.returnDate}
- Passagers: ${params.pax}

IMPORTANT: Pour chaque vol, inclus une URL réelle vers le site de la compagnie aérienne (ex: https://www.airfrance.fr, https://www.emirates.com/fr/, etc.) et le nom de domaine.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
{
  "flights": [
    {
      "airline": "nom compagnie",
      "route": "CDG → HKG",
      "class": "Business/Economy/First",
      "price": "prix estimé en €",
      "duration": "durée",
      "stops": "nombre d'escales",
      "url": "https://www.compagnie.com",
      "domain": "compagnie.com",
      "recommendation": "pourquoi cette option"
    }
  ],
  "summary": "résumé court"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, flights: [] };
  } catch {
    return { summary: text, flights: [] };
  }
}

// ─── ACCOMMODATION AGENT ────────────────────────────────────────────
export async function searchAccommodation(params: {
  destinations: { city: string }[];
  vibe: string;
  budget: string;
  pax: string;
}) {
  const model = getModel();
  const destList = params.destinations.map(d => d.city).join(', ');

  const prompt = `Tu es un agent spécialiste de l'hébergement haut de gamme pour une agence de voyage de luxe.

Recherche les meilleurs hôtels pour:
- Destinations: ${destList}
- Ambiance: ${params.vibe || 'Luxe & Détente'}
- Budget: ${params.budget || 'Premium'}
- Voyageurs: ${params.pax || '2'}

IMPORTANT: Pour chaque hôtel, inclus une URL réelle vers le site officiel de l'hôtel (ex: https://www.fourseasons.com, https://www.rosewoodhotels.com, etc.) et le nom de domaine.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
{
  "hotels": [
    {
      "name": "nom de l'hôtel",
      "destination": "ville",
      "stars": 5,
      "pricePerNight": "prix estimé en €",
      "highlights": ["vue mer", "spa", "suite"],
      "url": "https://www.hotel.com",
      "domain": "hotel.com",
      "recommendation": "pourquoi cet hôtel"
    }
  ],
  "summary": "résumé court"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, hotels: [] };
  } catch {
    return { summary: text, hotels: [] };
  }
}

// ─── CLIENT PROFILE AGENT ──────────────────────────────────────────
export async function analyzeClientProfile(params: {
  pax: string;
  vibe: string;
  budget: string;
  mustHaves: string;
}) {
  const model = getModel();

  const prompt = `Tu es un agent CRM spécialiste du profil client pour une agence de voyage de luxe.

Analyse ce profil voyageur et donne des recommandations personnalisées:
- Voyageurs: ${params.pax || '2 adultes'}
- Ambiance souhaitée: ${params.vibe || 'Non précisé'}
- Budget: ${params.budget || 'Non précisé'}
- Must-haves: ${params.mustHaves || 'Aucun'}

IMPORTANT: Pour chaque recommandation, inclus un lien URL utile si possible (site de réservation, activité, lieu, etc.).

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
{
  "profile": {
    "segment": "Luxe/Premium/Standard",
    "preferences": ["pref1", "pref2", "pref3"],
    "specialNeeds": "besoins particuliers détectés",
    "loyaltyTips": "comment fidéliser ce client"
  },
  "summary": "résumé court du profil client",
  "recommendations": [
    {
      "text": "description de la recommandation",
      "url": "https://lien-utile.com",
      "type": "activité/service/lieu"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, profile: {} };
  } catch {
    return { summary: text, profile: {} };
  }
}

// ─── ITINERARY PLANNER AGENT ────────────────────────────────────────
export async function planItinerary(params: {
  destinations: { city: string }[];
  departureDate: string;
  returnDate: string;
  vibe: string;
  mustHaves: string;
}) {
  const model = getModel();
  const destList = params.destinations.map(d => d.city).join(' → ');

  const prompt = `Tu es un agent spécialiste de la planification d'itinéraires pour une agence de voyage de luxe.

Crée un itinéraire jour par jour pour:
- Destinations: ${destList}
- Du ${params.departureDate} au ${params.returnDate}
- Ambiance: ${params.vibe || 'Découverte & Détente'}
- Must-haves: ${params.mustHaves || 'Aucun'}

IMPORTANT: Pour chaque journée, inclus des URLs réelles vers les lieux et activités mentionnés (Google Maps, TripAdvisor, sites officiels, etc).

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après:
{
  "days": [
    {
      "day": 1,
      "title": "Titre du jour",
      "destination": "ville",
      "morning": "activité du matin",
      "morningUrl": "https://lien-vers-lieu-ou-activité.com",
      "afternoon": "activité de l'après-midi",
      "afternoonUrl": "https://lien-vers-lieu-ou-activité.com",
      "evening": "activité du soir",
      "eveningUrl": "https://lien-vers-lieu-ou-activité.com",
      "highlight": "moment fort de la journée"
    }
  ],
  "summary": "résumé court de l'itinéraire",
  "tips": ["conseil1", "conseil2"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, days: [] };
  } catch {
    return { summary: text, days: [] };
  }
}
