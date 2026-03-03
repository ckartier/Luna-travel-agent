import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
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

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Tu es Luna, un assistant IA pour une agence de voyage de luxe.

Analyse cet email entrant et extrait les informations de voyage:

SUJET: ${emailSubject || 'Aucun'}
DE: ${emailSender || 'Inconnu'}
CONTENU:
${emailBody || 'Contenu non disponible'}

Réponds en JSON avec ce format exact:
{
    "type": "TRAVEL_REQUEST" ou "INFORMATION" ou "COMPLAINT" ou "OTHER",
    "confidence": 0.0 à 1.0,
    "extracted": {
        "clientName": "nom du client",
        "destinations": ["destination1", "destination2"],
        "departureDate": "date ou null",
        "returnDate": "date ou null",
        "pax": "nombre de voyageurs",
        "budget": "budget mentionné ou null",
        "vibe": "ambiance souhaitée",
        "mustHaves": "exigences spécifiques",
        "specialRequests": "demandes spéciales"
    },
    "summary": "résumé court de la demande",
    "agentRecommendation": "quels agents dispatcher",
    "priority": "HIGH/MEDIUM/LOW"
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
