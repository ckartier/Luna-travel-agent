import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { generateMultimodalEmbedding } from '@/src/lib/ai/gemini-embeddings';
import { searchCatalogSimilar } from '@/src/lib/ai/vector-store';

// Use Gemini via Google GenAI — same stack as the voyage agent
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt: string): Promise<any> {
    if (!GEMINI_API_KEY) return null;

    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (err) {
        console.error('[Prestations Agent] Gemini error:', err);
        return null;
    }
}

/**
 * Smart keyword matching fallback when Gemini is unavailable.
 * Scores catalog items based on text similarity with the user request.
 */
function smartMatch(catalog: any[], message: string, context?: { budget?: string; destination?: string }) {
    const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const destWords = (context?.destination || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const budgetNum = parseInt((context?.budget || '').replace(/[^\d]/g, '')) || 0;

    const scored = catalog.map(item => {
        let score = 0;
        const text = `${item.name} ${item.description || ''} ${item.type || ''} ${item.location || ''} ${item.category || ''}`.toLowerCase();

        // Keyword matching
        words.forEach(w => { if (text.includes(w)) score += 10; });

        // Location matching
        destWords.forEach(w => { if (text.includes(w)) score += 15; });

        // Budget proximity
        if (budgetNum > 0 && item.netCost) {
            const ratio = item.netCost / budgetNum;
            if (ratio <= 1 && ratio >= 0.3) score += 8; // within budget
            if (ratio > 1 && ratio <= 1.3) score += 3; // slightly over
        }

        // Type matching keywords
        if (message.toLowerCase().includes('hôtel') && (item.type || '').toLowerCase().includes('hotel')) score += 12;
        if (message.toLowerCase().includes('restaurant') && (item.type || '').toLowerCase().includes('restaurant')) score += 12;
        if (message.toLowerCase().includes('transfert') && (item.type || '').toLowerCase().includes('transport')) score += 12;
        if (message.toLowerCase().includes('yacht') && text.includes('yacht')) score += 20;
        if (message.toLowerCase().includes('spa') && text.includes('spa')) score += 20;
        if (message.toLowerCase().includes('excursion') && text.includes('excursion')) score += 15;
        if (message.toLowerCase().includes('activité') && text.includes('activit')) score += 12;

        return { item, score };
    });

    // Sort by score descending, take top 5
    return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function POST(req: NextRequest) {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    try {
        const { message, catalog, context } = await req.json();

        if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
            return NextResponse.json({ error: 'Catalogue vide — ajoutez des prestations dans le CRM d\'abord' }, { status: 400 });
        }

        // ═══ 1. Fetch Semantic Internal Catalog (Gemini Embeddings 2) ═══
        let semanticMatches: any[] = [];
        try {
            const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
            if (!tenantsSnap.empty) {
                const tenantId = tenantsSnap.docs[0].id;
                
                // Embed the user's message + context to find the best internal catalog items
                const queryText = `${message} ${context?.destination || ''} ${context?.types?.join(' ') || ''}`;
                const queryEmbedding = await generateMultimodalEmbedding({ text: queryText, dimension: 768 });
                
                if (queryEmbedding) {
                    const results = await searchCatalogSimilar({
                        tenantId: tenantId,
                        queryVector: queryEmbedding,
                        limit: 8 // Top 8 best matching prestations
                    });
                    
                    semanticMatches = results.map(r => r.item);
                    console.log(`[Prestations Semantic Search] Found ${semanticMatches.length} high-fidelity matches.`);
                }
            }
        } catch (e) {
            console.warn('[Prestations Semantic Search] Failed:', e);
        }

        // If semantic search found results, use them as the primary catalogue context!
        const finalCatalogToSearch = semanticMatches.length > 0 ? semanticMatches : catalog;

        // Build catalog summary for AI
        const catalogSummary = finalCatalogToSearch.map((c: any) =>
            `- "${c.name}" (${c.type || 'service'}) à ${c.location || 'N/A'}. Coût Net: ${c.netCost || 0}€. ${c.description ? c.description.slice(0, 120) : ''}`
        ).join('\n');

        // Build types context
        const typesContext = context?.types?.length > 0
            ? `Types demandés: ${context.types.join(', ')}`
            : 'Aucun type spécifique demandé';

        // Try AI-powered matching first
        let result = await callGemini(`Tu es l'Expert Prestations Luna 🎨 — agent de matching pour conciergerie de voyage premium.
Ton rôle est de sélectionner dans le catalogue ci-dessous les prestations qui correspondent le mieux à la demande client.

DEMANDE CLIENT: "${message}"
CONTEXTE: Destination: ${context?.destination || 'Non spécifiée'}, Budget: ${context?.budget || 'Non spécifié'}, ${typesContext}

${context?.types?.length > 1 ? `
🔴 CROSS-MATCHING OBLIGATOIRE:
Le client demande EXPLICITEMENT ${context.types.length} types de prestations: ${context.types.join(' + ')}.
Tu DOIS sélectionner AU MINIMUM une prestation de CHAQUE type demandé pour construire un PACKAGE CROISÉ.
Par exemple, si le client demande "Transfert + Restaurant", tu dois inclure AU MOINS 1 transfert ET 1 restaurant.
Si la catégorie n'a pas de match exact, choisis la plus proche dans le catalogue.
NE PAS ignorer un type même s'il semble secondaire.
` : context?.types?.length === 1 ? `
🔴 TYPE UNIQUE DEMANDÉ: ${context.types[0]}
Tu dois UNIQUEMENT sélectionner des prestations qui correspondent à ce type.
NE SÉLECTIONNE PAS de prestations d'un autre type (pas d'hôtels si on demande un chauffeur, pas de restaurants si on demande un hôtel, etc.).
Privilégie les items dont le type ou la description correspondent au type demandé.
` : ''}

CATALOGUE DISPONIBLE:
${catalogSummary}

INSTRUCTIONS:
1. Sélectionne entre 1 et 5 prestations du catalogue uniquement.
2. ${context?.types?.length > 1 ? `OBLIGATOIRE: Inclus au moins 1 prestation par type demandé (${context.types.join(', ')}).` : context?.types?.length === 1 ? `OBLIGATOIRE: Ne sélectionne QUE des prestations du type "${context.types[0]}". Si aucune ne correspond, sélectionne la plus proche.` : 'Sélectionne les plus pertinentes.'}
3. Utilise les NOMS EXACTS des prestations du catalogue (copier-coller).
4. Calcule le Total Net = somme de tous les coûts nets sélectionnés.
5. Donne une raison élégante en 1-2 phrases expliquant le package.
6. Retourne UNIQUEMENT un JSON valide (pas de markdown, pas de texte autour):
{
  "selected": [{"name": "Nom Exact Du Catalogue"}],
  "reason": "Explication élégante du package croisé",
  "totalNet": 0
}`);

        // Fallback: smart keyword matching if Gemini unavailable
        if (!result || !result.selected || result.selected.length === 0) {
            console.log('[Prestations Agent] Using smart match fallback');
            const matches = smartMatch(catalog, message, context);

            if (matches.length > 0) {
                result = {
                    selected: matches.map(m => ({ name: m.item.name })),
                    reason: `${matches.length} prestation${matches.length > 1 ? 's' : ''} trouvée${matches.length > 1 ? 's' : ''} correspondant à votre demande — matching intelligent Luna.`,
                    totalNet: matches.reduce((sum, m) => sum + (m.item.netCost || 0), 0),
                };
            } else {
                result = {
                    selected: finalCatalogToSearch.slice(0, 3).map((c: any) => ({ name: c.name })),
                    reason: 'Voici les prestations les plus pertinentes de votre catalogue Luna via recherche sémantique.',
                    totalNet: finalCatalogToSearch.slice(0, 3).reduce((sum: number, c: any) => sum + (c.netCost || 0), 0),
                };
            }
        }

        // ═══ SECOND AI CALL: External recommendations from Gemini's knowledge ═══
        let aiSuggestions: any[] = [];
        try {
            const destination = context?.destination || 'France';
            const typesRequested = context?.types?.length > 0 ? context.types.join(', ') : '';

            // Map types to specific instructions for Gemini
            const typeInstructions: Record<string, string> = {
                'Hôtel': 'Recommande des hôtels, palaces et hébergements de luxe',
                'Restaurant': 'Recommande des restaurants étoilés Michelin, bistrots gastronomiques haut de gamme',
                'Activité': 'Recommande des activités premium, visites guidées exclusives, expériences culturelles',
                'Transfert / Chauffeur': 'Recommande des services de transport privé, chauffeurs VTC premium, services de transfert aéroport avec voiture de luxe, limousines',
                'Spa & Bien-être': 'Recommande des spas de luxe, centres de bien-être, thalassothérapie',
                'Événement': 'Recommande des lieux événementiels, organisations de soirées exclusives',
            };

            const specificInstructions = typesRequested
                ? typesRequested.split(', ').map((t: string) => typeInstructions[t] || `Recommande des ${t}`).join('\n- ')
                : 'Recommande des restaurants, activités et expériences de luxe';

            const suggestionsResult = await callGemini(`Tu es un expert en conciergerie de voyage de luxe.
Le client voyage à "${destination}" et cherche: "${message}".
Types SPÉCIFIQUEMENT demandés: ${typesRequested || 'aucun type spécifique'}.

MISSION: Recommande 4 à 6 établissements/services RÉELS et EXISTANTS.

🔴 RÈGLE STRICTE: Tu dois UNIQUEMENT recommander des services du MÊME TYPE que la demande.
${typesRequested ? `Le client demande: ${typesRequested}. Tu dois recommander EXCLUSIVEMENT:
- ${specificInstructions}

NE RECOMMANDE PAS d'hôtels si on demande un chauffeur.
NE RECOMMANDE PAS de restaurants si on demande un hôtel.
RESTE STRICTEMENT dans le type demandé.` : 'Propose un mix varié de restaurants, activités et expériences.'}

IMPORTANT: Ce sont des établissements/services RÉELS qui existent vraiment.
Inclus un lien vers leur site web officiel quand possible.

Retourne UNIQUEMENT un JSON valide:
{
  "suggestions": [
    {
      "name": "Nom réel",
      "type": "RESTAURANT" | "ACTIVITY" | "HOTEL" | "TRANSFER" | "EXPERIENCE",
      "location": "Ville, Pays",
      "estimatedPrice": 150,
      "description": "Description courte (1 phrase)",
      "link": "https://site-officiel.com",
      "stars": "⭐⭐"
    }
  ]
}`);

            if (suggestionsResult?.suggestions && Array.isArray(suggestionsResult.suggestions)) {
                aiSuggestions = suggestionsResult.suggestions;
            }
        } catch (err) {
            console.error('[Prestations Agent] AI Suggestions error:', err);
        }

        return NextResponse.json({ ...result, aiSuggestions });

    } catch (error: any) {
        console.error('Prestations Agent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
