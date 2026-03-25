export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { generateAIJSON } from '@/src/lib/ai/provider';

/**
 * AI Text Suggestion API
 * 
 * Generates contextual text suggestions for prestations and voyages
 * based on provided metadata (name, type, location, etc.)
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { context, field, type, language } = body;

        // context = { name, type, location, ... } — metadata about the item
        // field = which field to generate for (e.g., 'description', 'highlights', 'pitch')
        // type = 'prestation' | 'voyage' | 'itinerary'
        // language = 'fr' (default)

        if (!context || !field) {
            return NextResponse.json(
                { error: 'Missing context or field parameter' },
                { status: 400 }
            );
        }

        const lang = language || 'fr';
        let prompt = '';

        if (type === 'prestation') {
            prompt = buildPrestationPrompt(context, field, lang);
        } else if (type === 'voyage') {
            prompt = buildVoyagePrompt(context, field, lang);
        } else if (type === 'itinerary') {
            prompt = buildItineraryPrompt(context, field, lang);
        } else {
            prompt = buildGenericPrompt(context, field, lang);
        }

        if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
            // Fallback: generate a smart static suggestion based on context
            const fallback = generateFallbackText(context, field, type || 'prestation');
            return NextResponse.json({ suggestion: fallback, source: 'fallback' });
        }

        const result = await generateAIJSON(prompt, { model: 'fast' });
        const parsed = result.data;

        return NextResponse.json({
            suggestion: parsed.text || parsed.suggestion || parsed.description || result.data.summary || '',
            alternatives: parsed.alternatives || [],
            source: result.provider
        });

    } catch (error: any) {
        console.error('[AI Suggest] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate suggestion' },
            { status: 500 }
        );
    }
}

function buildPrestationPrompt(context: any, field: string, lang: string): string {
    const { name, type: prestationType, location, netCost, highlights } = context;

    const fieldInstructions: Record<string, string> = {
        description: `Génère une DESCRIPTION COMMERCIALE captivante et professionnelle pour cette prestation.
La description doit :
- Être rédigée en français professionnel, style agence de voyage haut de gamme
- Faire entre 2 et 4 phrases maximum (concis mais impactant)
- Mettre en valeur les points forts et l'unicité de l'expérience
- Donner envie au client de réserver
- Ne PAS mentionner le prix
- Utiliser un ton chaleureux, élégant et inspirant`,

        highlights: `Génère 3 à 5 POINTS FORTS (highlights) pour cette prestation.
Chaque point fort doit être :
- Court (3-6 mots maximum)
- Percutant et concret
- Commencer par un emoji pertinent`,

        pitch: `Génère un PITCH COMMERCIAL court (1-2 phrases) pour présenter cette prestation à un client VIP.
Le pitch doit être percutant, élégant et donner envie.`,

        notes: `Génère des NOTES INTERNES de recommandation pour l'équipe concernant cette prestation.
Les notes doivent inclure :
- Points d'attention logistiques
- Conseils de vente
- Moment idéal pour proposer cette prestation`,
    };

    return `Tu es un rédacteur expert pour une conciergerie de voyage haut de gamme.

${fieldInstructions[field] || fieldInstructions.description}

CONTEXTE DE LA PRESTATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nom: ${name || 'Non défini'}
• Type: ${prestationType || 'Non défini'}
• Localisation: ${location || 'Non défini'}
${netCost ? `• Budget indicatif: ${netCost}€` : ''}
${highlights ? `• Points existants: ${highlights}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Langue: ${lang === 'fr' ? 'Français' : 'English'}

Réponds UNIQUEMENT en JSON valide:
{
  "text": "Le texte principal généré",
  "alternatives": ["Alternative 1 plus courte", "Alternative 2 plus détaillée"]
}`;
}

function buildVoyagePrompt(context: any, field: string, lang: string): string {
    const { destinations, departureDate, returnDate, pax, vibe, budget, clientName } = context;

    const destList = Array.isArray(destinations)
        ? destinations.map((d: any) => typeof d === 'string' ? d : d.city).join(' → ')
        : destinations || 'Non défini';

    const fieldInstructions: Record<string, string> = {
        description: `Génère une DESCRIPTION INSPIRANTE pour ce voyage sur mesure.
La description doit :
- Être rédigée comme une invitation au voyage (2-4 phrases)
- Mentionner les destinations et l'ambiance
- Évoquer les expériences qui attendent le client
- Ton chaleureux et premium`,

        recap: `Génère un RÉCAPITULATIF COMMERCIAL professionnel du voyage.
Le récapitulatif doit :
- Résumer l'itinéraire et les temps forts
- Être structuré et clair
- Inclure dates, nombre de personnes, ambiance
- Style professionnel et élégant`,

        email: `Génère le CORPS D'UN EMAIL professionnel pour présenter ce voyage au client.
L'email doit :
- Commencer par un accueil personnalisé
- Présenter le voyage de manière séduisante
- Être professionnel mais chaleureux
- Terminer par une invitation à en discuter`,

        notes: `Génère des NOTES INTERNES pour l'équipe concernant ce voyage.`,
    };

    return `Tu es un rédacteur expert pour une conciergerie de voyage haut de gamme.

${fieldInstructions[field] || fieldInstructions.description}

CONTEXTE DU VOYAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Destinations: ${destList}
• Date aller: ${departureDate || 'À définir'}
• Date retour: ${returnDate || 'À définir'}
• Voyageurs: ${pax || '2'}
• Ambiance: ${vibe || 'Non définie'}
${budget ? `• Budget: ${budget}` : ''}
${clientName ? `• Client: ${clientName}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Langue: ${lang === 'fr' ? 'Français' : 'English'}

Réponds UNIQUEMENT en JSON valide:
{
  "text": "Le texte principal généré",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;
}

function buildItineraryPrompt(context: any, field: string, lang: string): string {
    const { destination, dayNumber, morning, afternoon, evening } = context;

    return `Tu es un rédacteur expert pour une conciergerie de voyage haut de gamme.

Génère un texte ${field === 'highlight' ? 'HIGHLIGHT (moment fort de la journée)' : `pour le champ "${field}"`} de cet itinéraire.

CONTEXTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Destination: ${destination || 'Non définie'}
• Jour: ${dayNumber || '?'}
${morning ? `• Matin: ${morning}` : ''}
${afternoon ? `• Après-midi: ${afternoon}` : ''}
${evening ? `• Soir: ${evening}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Réponds UNIQUEMENT en JSON valide:
{
  "text": "Le texte principal généré",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;
}

function buildGenericPrompt(context: any, field: string, lang: string): string {
    return `Tu es un rédacteur expert pour une conciergerie de voyage haut de gamme.

Génère un texte professionnel et captivant pour le champ "${field}".

CONTEXTE:
${JSON.stringify(context, null, 2)}

Langue: ${lang === 'fr' ? 'Français' : 'English'}

Réponds UNIQUEMENT en JSON valide:
{
  "text": "Le texte principal généré",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;
}

function generateFallbackText(context: any, field: string, type: string): string {
    const { name, type: prestationType, location } = context;

    if (type === 'prestation') {
        const templates: Record<string, string[]> = {
            HOTEL: [
                `Découvrez ${name || 'cet établissement d\'exception'} à ${location || 'une destination privilégiée'}, un havre de paix alliant luxe discret et authenticité locale. Chaque détail a été pensé pour offrir une expérience mémorable : de la literie premium aux espaces bien-être exclusifs. Un choix idéal pour les voyageurs en quête d'excellence.`,
                `${name || 'Cet hôtel'} à ${location || 'cette destination'} incarne l'art de l'hospitalité raffinée. Un cadre exceptionnel, un service irréprochable et des prestations haut de gamme vous attendent pour un séjour inoubliable.`,
            ],
            ACTIVITY: [
                `Vivez une expérience unique avec ${name || 'cette activité exclusive'} à ${location || 'cette destination de rêve'}. Une immersion authentique qui révèle les trésors cachés de la destination, encadrée par des experts passionnés. Un moment privilégié qui marquera votre voyage.`,
                `${name || 'Cette expérience'} à ${location || 'cette destination'} offre un moment d'exception hors des sentiers battus. Une aventure soigneusement orchestrée pour créer des souvenirs impérissables.`,
            ],
            TRANSFER: [
                `Service de transfert premium avec ${name || 'notre partenaire de confiance'} à ${location || 'destination'}. Véhicule haut de gamme, chauffeur professionnel et ponctualité assurée pour un déplacement en toute sérénité. Accueil personnalisé et flexibilité garantie.`,
            ],
            FLIGHT: [
                `Vol ${name || 'premium'} au départ de ${location || 'votre ville'}. Un trajet confortable et fluide avec toutes les commodités pour commencer votre voyage dans les meilleures conditions.`,
            ],
            OTHER: [
                `${name || 'Cette prestation exclusive'} à ${location || 'cette destination'} a été sélectionnée avec soin par notre équipe de conciergerie. Une expérience authentique et raffinée qui complète parfaitement votre itinéraire sur mesure.`,
            ],
        };

        const typeTemplates = templates[prestationType] || templates.OTHER;
        return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    }

    if (type === 'voyage') {
        const destinations = context.destinations || 'une destination d\'exception';
        return `Un voyage sur mesure vers ${destinations}, pensé dans les moindres détails pour une expérience inoubliable. De la découverte culturelle aux moments de détente, chaque étape de cet itinéraire a été conçue pour créer des souvenirs précieux.`;
    }

    return `${name || 'Cette expérience'} à ${location || 'cette destination'} offre un moment unique et raffiné. Sélectionnée par notre équipe de conciergerie pour sa qualité exceptionnelle.`;
}
