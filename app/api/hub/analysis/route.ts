export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * POST /api/hub/analysis
 * Runs Gemini analysis on all CRM data + bug reports
 * Returns structured analysis with action proposals
 */
export async function POST() {
    try {
        // Fetch all relevant data
        const [bugSnap, leadsSnap, tripsSnap] = await Promise.all([
            adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(50).get(),
            adminDb.collection('leads').limit(200).get(),
            adminDb.collection('trips').limit(200).get(),
        ]);

        const bugs = bugSnap.docs.map((d: any) => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title,
                description: data.description,
                severity: data.severity,
                status: data.status,
                page: data.page,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
            };
        });

        const leads = leadsSnap.docs.map((d: any) => d.data());
        const trips = tripsSnap.docs.map((d: any) => d.data());

        const travelLeads = leads.filter((l: any) => (l.vertical || 'travel') === 'travel').length;
        const legalLeads = leads.filter((l: any) => l.vertical === 'legal').length;
        const travelTrips = trips.filter((t: any) => (t.vertical || 'travel') === 'travel');
        const legalTrips = trips.filter((t: any) => t.vertical === 'legal');
        const travelRevenue = travelTrips.reduce((s: number, t: any) => s + (t.amount || 0), 0);
        const legalRevenue = legalTrips.reduce((s: number, t: any) => s + (t.amount || 0), 0);

        const openBugs = bugs.filter((b: any) => b.status === 'open');
        const criticalBugs = bugs.filter((b: any) => b.severity === 'critical' && b.status === 'open');

        // Build Gemini prompt
        const bugsSummary = openBugs.length > 0
            ? openBugs.map((b: any, i: number) =>
                `${i + 1}. [${b.severity}] ${b.title} — ${b.description} (page: ${b.page || 'N/A'}, date: ${b.createdAt || 'N/A'})`
            ).join('\n')
            : 'Aucun bug ouvert.';

        const prompt = `Tu es un expert DevOps et CTO technique. Tu analyses le tableau de bord du Hub de contrôle de Datarnivore, une agence qui gère deux CRM SaaS:

1. **CRM Travel** (Luna Conciergerie) — Conciergerie de voyage de luxe
   - ${travelLeads} leads actifs
   - ${travelTrips.length} voyages (${travelTrips.filter((t: any) => t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS').length} actifs)
   - CA: ${(travelRevenue / 1000).toFixed(0)}k€

2. **CRM Legal** (Le Droit Agent) — Cabinet d'avocats
   - ${legalLeads} leads actifs
   - ${legalTrips.length} dossiers (${legalTrips.filter((t: any) => t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS').length} actifs)
   - CA: ${(legalRevenue / 1000).toFixed(0)}k€

## Bug Reports ouverts (${openBugs.length} total, ${criticalBugs.length} critiques):
${bugsSummary}

## Ta mission:
Génère un rapport d'analyse structuré en français avec:

1. **🏥 Score de Santé Global** — Note sur 10 avec justification
2. **🚨 Alertes Critiques** — Bugs ou problèmes urgents à traiter immédiatement
3. **📊 Analyse CRM Travel** — État de santé, tendances, points forts/faibles
4. **⚖️ Analyse CRM Legal** — État de santé, tendances, points forts/faibles
5. **🔍 Tendances & Patterns** — Patterns récurrents dans les bugs, corrélations
6. **🎯 Plan d'Action** — Liste d'actions concrètes classées par priorité:
   - 🔴 URGENT (< 24h)
   - 🟠 HAUTE (< 1 semaine)
   - 🟡 MOYENNE (< 1 mois)
   - 🟢 BASSE (maintenance continue)
7. **💡 Recommandations Stratégiques** — Améliorations long terme

Utilise des emojis et un format Markdown propre. Sois concis mais actionnable.`;

        try {
            const result = await ai.models.generateContent({ model: 'gemini-3.1-flash', contents: prompt });
            return NextResponse.json({
                analysis: result.text || 'Analyse indisponible.',
                metadata: {
                    totalBugs: bugs.length,
                    openBugs: openBugs.length,
                    criticalBugs: criticalBugs.length,
                    travelLeads,
                    legalLeads,
                    travelRevenue,
                    legalRevenue,
                    analyzedAt: new Date().toISOString(),
                },
            });
        } catch {
            // Fallback if Gemini is unavailable
            return NextResponse.json({
                analysis: `## Rapport Automatique\n\n📊 **Données agrégées:**\n- ${openBugs.length} bugs ouverts (${criticalBugs.length} critiques)\n- Travel: ${travelLeads} leads, ${travelTrips.length} voyages, ${(travelRevenue / 1000).toFixed(0)}k€ CA\n- Legal: ${legalLeads} leads, ${legalTrips.length} dossiers, ${(legalRevenue / 1000).toFixed(0)}k€ CA\n\n⚠️ Analyse IA indisponible — vérifiez GEMINI_API_KEY.`,
                metadata: {
                    totalBugs: bugs.length,
                    openBugs: openBugs.length,
                    criticalBugs: criticalBugs.length,
                    analyzedAt: new Date().toISOString(),
                },
            });
        }
    } catch (error: any) {
        console.error('[Hub Analysis] Error:', error);
        return NextResponse.json({ error: error.message, analysis: 'Erreur lors de l\'analyse.' }, { status: 500 });
    }
}
