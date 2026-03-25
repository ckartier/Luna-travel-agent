export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import {
    analyzeProjectFeasibility,
    generateSiteReport,
} from '@/src/lib/ai/monum-agents';

export async function POST(request: Request) {
    await headers(); // Force dynamic rendering
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { projectType, facts, budget, deadline, location, consumedBudget, status, action } = body;

        if (!facts || facts.length < 10) {
            return NextResponse.json({ error: 'Veuillez décrire le chantier ou l\'avancement (minimum 10 caractères)' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            // FALLBACK DEMO WHEN NO API KEY IS PRESENT
             return NextResponse.json({
                feasibility: {
                    faisabilite: { statut: 'favorable', commentaire: 'Projet classique de rénovation.' },
                    budget: { coherence: 'bonne', minimum: '50 000€', maximum: '75 000€', explication: 'Budget aligné avec les prix du marché.' },
                    probabiliteSucces: '85%',
                    risques: [{ point: 'Retard livraison matériaux', impact: 'moyen', mitigation: 'Commander avec 30 jours d\'avance' }],
                    planning: { dureeEstimee: '3 mois', phasesCles: ['Démolition', 'Gros oeuvre', 'Plomberie', 'Finitions'] },
                    summary: 'Projet réalisable avec une probabilité de succès de 85%.'
                },
                report: null
            });
        }

        // Action routing:
        if (action === 'report') {
            const report = await generateSiteReport({ projectType, facts, consumedBudget, status });
            return NextResponse.json({ report, feasibility: null });
        }

        // Default: Full Feasibility Analysis (Probability & Risk)
        const feasibility = await analyzeProjectFeasibility({ projectType, facts, budget, deadline, location });
        
        return NextResponse.json({
            feasibility: feasibility.summary === 'Agent Analyse Faisabilité indisponible' ? null : feasibility,
            report: null
        });

    } catch (error: any) {
        console.error('Monum agent orchestration error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
