import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const { emailBody, emailSubject, emailSender } = await request.json();

        if (!emailBody && !emailSubject) {
            return NextResponse.json({ error: 'Email content required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            // Fallback mock analysis when no API key
            return NextResponse.json({
                analysis: {
                    type: 'TRAVEL_REQUEST',
                    confidence: 0.92,
                    extracted: {
                        clientName: emailSender?.replace(/<.*>/, '').trim() || 'Client',
                        destinations: ['Bali'],
                        departureDate: '2026-04-15',
                        returnDate: '2026-04-25',
                        pax: '2 adultes',
                        budget: '5 000 €',
                        vibe: 'Détente & Bien-être',
                        mustHaves: 'Vol direct, hôtel 5 étoiles',
                        specialRequests: 'Anniversaire de mariage',
                    },
                    summary: `Demande de voyage détectée de ${emailSender?.replace(/<.*>/, '').trim() || 'client'}. Destination: Bali, 2 adultes, budget 5000€. Occasion: anniversaire de mariage. Préférence: vol direct + hôtel 5★.`,
                    agentRecommendation: 'Dispatcher immédiatement aux 4 agents pour traitement prioritaire.',
                    priority: 'HIGH',
                },
            });
        }

        // Upgrade to gemini-2.5-pro for complex reasoning and unstructured text extraction
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `Tu es Luna, l'agent IA d'élite pour une agence de voyage B2B ultra-luxe.
Ta mission est d'analyser un email entrant (parfois imprécis ou rédigé à la hâte) et d'en extraire une requête de voyage parfaitement structurée.

Voici l'email:
━━━━━━━━━━━━━━━━━━━━━━
SUJET: ${emailSubject || 'Aucun'}
DE: ${emailSender || 'Inconnu'}
CONTENU:
${emailBody || 'Contenu non disponible'}
━━━━━━━━━━━━━━━━━━━━━━

RÈGLES D'EXTRACTION STRICTES:
1. "destinations": Déduis la ou les villes exactes. Si le client dit "Japon", mets "Tokyo, Japon".
2. "departureDate" / "returnDate": Traduis les dates vagues en dates réelles au format YYYY-MM-DD. Si le client dit "le mois prochain", calcule la date approximative par rapport à aujourd'hui (nous sommes en 2026).
3. "pax": Déduis le nombre exact de personnes (ex: "ma femme et moi" = "2 adultes", "famille de 4" = "2 adultes, 2 enfants").
4. "vibe": Choisis PARMI CES CATEGORIES UNIQUEMENT: "Lune de Miel", "Détente & Bien-être", "Aventure & Découverte", "Culture & Patrimoine", "Voyage d'Affaires".
5. "budget": Si non mentionné, déduis ou mets "Premium".
6. "mustHaves": Liste les exigences spécifiques (ex: vols directs, vue mer, sans escale).

Tu DOIS répondre UNIQUEMENT en JSON valide, sans balises Markdown autour, au format exact:
{
    "type": "TRAVEL_REQUEST",
    "confidence": 0.95,
    "extracted": {
        "clientName": "Nom Prénom déduit de l'auteur",
        "destinations": ["Ville Principale"],
        "departureDate": "YYYY-MM-DD ou null",
        "returnDate": "YYYY-MM-DD ou null",
        "pax": "X adultes, Y enfants",
        "budget": "Valeur ou 'Premium (Non spécifié)'",
        "vibe": "Une des catégories exactes mentionnées ci-dessus",
        "mustHaves": "Exigences extraites",
        "specialRequests": "Demandes spéciales (anniversaire, allergies)"
    },
    "summary": "Résumé ultra-concis de 2 phrases de la demande, comme écrit par un assistant de direction.",
    "agentRecommendation": "Les agents (Transport, Hébergement, Client, Itinéraire) concernés.",
    "priority": "HIGH" (toujours HIGH pour TRAVEL_REQUEST)
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, type: 'OTHER' };
            return NextResponse.json({ analysis });
        } catch {
            return NextResponse.json({ analysis: { summary: text, type: 'OTHER', confidence: 0.5 } });
        }
    } catch (error: any) {
        console.error('Email Analysis Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to analyze email' }, { status: 500 });
    }
}
