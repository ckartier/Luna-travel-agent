import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

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

        // Build catalog summary for AI
        const catalogSummary = catalog.map((c: any) =>
            `- "${c.name}" (${c.type || 'service'}) à ${c.location || 'N/A'}. Coût Net: ${c.netCost || 0}€. ${c.description ? c.description.slice(0, 120) : ''}`
        ).join('\n');

        // Try AI-powered matching first
        let result = await callGemini(`Tu es l'Expert Prestations Luna 🎨.
Ton rôle est de sélectionner dans le catalogue ci-dessous les prestations qui correspondent le mieux à la demande.

DEMANDE CLIENT: "${message}"
CONTEXTE: Destination: ${context?.destination || 'Non spécifiée'}, Budget: ${context?.budget || 'Non spécifié'}

CATALOGUE DISPONIBLE:
${catalogSummary}

INSTRUCTIONS:
1. Sélectionne entre 1 et 5 prestations du catalogue uniquement.
2. Utilise les NOMS EXACTS des prestations du catalogue.
3. Calcule un Total Net estimé (somme des coûts nets sélectionnés).
4. Explique en une phrase courte et élégante pourquoi ces choix.
5. Retourne UNIQUEMENT un JSON avec cette structure EXACTE:
{
  "selected": [{"name": "Nom Exact Du Catalogue"}],
  "reason": "Une explication courte et élégante",
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
                    selected: catalog.slice(0, 3).map((c: any) => ({ name: c.name })),
                    reason: 'Voici les prestations les plus populaires de votre catalogue Luna.',
                    totalNet: catalog.slice(0, 3).reduce((sum: number, c: any) => sum + (c.netCost || 0), 0),
                };
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Prestations Agent Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
