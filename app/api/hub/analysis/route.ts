export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * POST /api/hub/analysis
 * Runs Gemini analysis on all CRM data + bug reports
 * Returns structured analysis with action proposals
 */
async function resolveTenantIdFromRequest(request: NextRequest): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
    if (tenantsSnap.empty) return null;
    return tenantsSnap.docs[0].id;
}

async function fetchBugReportsForTenant(tenantId: string) {
    const tenantBugRef = adminDb.collection('tenants').doc(tenantId).collection('bug_reports');
    try {
        const tenantSnap = await tenantBugRef.orderBy('createdAt', 'desc').limit(50).get();
        return tenantSnap;
    } catch {
        return tenantBugRef.limit(50).get();
    }
}

export async function POST(request: NextRequest) {
    try {
        const resolvedTenant = await resolveTenantIdFromRequest(request);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) {
            return NextResponse.json({ error: 'No tenant found', analysis: 'Aucun tenant trouvé.' }, { status: 404 });
        }
        const tenantId = resolvedTenant;
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Fetch all relevant data
        const [bugSnap, leadsSnap, tripsSnap] = await Promise.all([
            fetchBugReportsForTenant(tenantId),
            tenantRef.collection('leads').limit(200).get(),
            tenantRef.collection('trips').limit(200).get(),
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
