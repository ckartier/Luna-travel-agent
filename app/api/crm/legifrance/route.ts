import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/**
 * POST /api/crm/legifrance
 * Proxy for Légifrance API (PISTE/DILA).
 * 
 * Actions:
 *   - search_articles: Search codes (civil, pénal, travail, etc.) by keyword
 *   - get_article: Get a specific article by code + article number
 *   - search_jurisprudence: Search court decisions by keyword + filters
 */

// ── OAuth2 Token Cache ──
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getLegifranceToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken.token;
    }

    const clientId = process.env.LEGIFRANCE_CLIENT_ID;
    const clientSecret = process.env.LEGIFRANCE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('LEGIFRANCE_CLIENT_ID et LEGIFRANCE_CLIENT_SECRET requis dans .env');
    }

    const res = await fetch('https://sandbox-oauth.piste.gouv.fr/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'openid',
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OAuth PISTE error ${res.status}: ${err}`);
    }

    const data = await res.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return cachedToken.token;
}

// ── Légifrance API base URL ──
const LEGI_BASE = 'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app';

// ── Code identifiers ──
const CODE_IDS: Record<string, string> = {
    'civil': 'LEGITEXT000006070721',
    'penal': 'LEGITEXT000006070719',
    'travail': 'LEGITEXT000006072050',
    'commerce': 'LEGITEXT000005634379',
    'procedure_civile': 'LEGITEXT000006070716',
    'procedure_penale': 'LEGITEXT000006071154',
    'securite_sociale': 'LEGITEXT000006073189',
    'environnement': 'LEGITEXT000006074220',
    'urbanisme': 'LEGITEXT000006074075',
    'propriete_intellectuelle': 'LEGITEXT000006069414',
    'consommation': 'LEGITEXT000006069565',
    'famille': 'LEGITEXT000006070721', // Part of Code Civil
};

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const { action, ...params } = await request.json();
        const token = await getLegifranceToken();

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // ═══════════════════════════════════════
        //  SEARCH ARTICLES in Codes
        // ═══════════════════════════════════════
        if (action === 'search_articles') {
            const { query, codeId, pageSize = 10, page = 1 } = params;

            // Resolve code name to ID
            const resolvedCodeId = CODE_IDS[codeId?.toLowerCase()] || codeId || CODE_IDS['civil'];

            const body = {
                recherche: {
                    champs: [
                        {
                            typeChamp: 'ALL',
                            criteres: [
                                {
                                    typeRecherche: 'EXACTE',
                                    valeur: query,
                                    operateur: 'ET',
                                }
                            ],
                            operateur: 'ET',
                        }
                    ],
                    filtres: [
                        {
                            facette: 'TEXT_LEGAL_STATUS',
                            valeurs: ['VIGUEUR'], // Only articles currently in force
                        }
                    ],
                    pageNumber: page,
                    pageSize,
                    typePagination: 'ARTICLE',
                },
                fond: 'CODE_ETAT',
            };

            const res = await fetch(`${LEGI_BASE}/search`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[Légifrance] Search error:', res.status, errText);
                return NextResponse.json({ error: `Erreur Légifrance ${res.status}` }, { status: res.status });
            }

            const data = await res.json();
            const results = (data.results || []).map((r: any) => ({
                title: r.titles?.[0]?.title || r.title || 'Article',
                id: r.id || '',
                cid: r.cid || '',
                textId: r.textId || '',
                num: r.num || '',
                content: (r.texte || r.text || '').substring(0, 500),
                dateDebut: r.dateDebut || null,
                etat: r.etat || 'VIGUEUR',
            }));

            return NextResponse.json({
                results,
                totalCount: data.totalResultNumber || results.length,
                page,
            });
        }

        // ═══════════════════════════════════════
        //  GET SPECIFIC ARTICLE
        // ═══════════════════════════════════════
        if (action === 'get_article') {
            const { articleId } = params;

            if (!articleId) {
                return NextResponse.json({ error: 'articleId requis' }, { status: 400 });
            }

            const res = await fetch(`${LEGI_BASE}/consult/getArticleWithIdEliOrAlias`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ id: articleId }),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[Légifrance] GetArticle error:', res.status, errText);
                return NextResponse.json({ error: `Erreur Légifrance ${res.status}` }, { status: res.status });
            }

            const data = await res.json();
            const article = data.article || data;

            return NextResponse.json({
                article: {
                    id: article.id || articleId,
                    num: article.num || '',
                    title: article.titre || article.title || '',
                    content: article.texte || article.texteHtml || article.text || '',
                    dateDebut: article.dateDebut || null,
                    dateFin: article.dateFin || null,
                    etat: article.etat || 'VIGUEUR',
                    nota: article.nota || '',
                    codeTitle: article.context?.titreTxt || '',
                },
            });
        }

        // ═══════════════════════════════════════
        //  SEARCH JURISPRUDENCE
        // ═══════════════════════════════════════
        if (action === 'search_jurisprudence') {
            const { query, court, pageSize = 10, page = 1 } = params;

            // Map French court names to fond values
            const fondMap: Record<string, string> = {
                'cassation': 'JURI',
                'conseil_etat': 'CETA',
                'constitutionnel': 'CONSTIT',
                'appel': 'INCA',
            };
            const fond = fondMap[court?.toLowerCase()] || 'JURI'; // Default: Cour de Cassation

            const body = {
                recherche: {
                    champs: [
                        {
                            typeChamp: 'ALL',
                            criteres: [
                                {
                                    typeRecherche: 'EXACTE',
                                    valeur: query,
                                    operateur: 'ET',
                                }
                            ],
                            operateur: 'ET',
                        }
                    ],
                    pageNumber: page,
                    pageSize,
                },
                fond,
            };

            const res = await fetch(`${LEGI_BASE}/search`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[Légifrance] Jurisprudence search error:', res.status, errText);
                return NextResponse.json({ error: `Erreur Légifrance ${res.status}` }, { status: res.status });
            }

            const data = await res.json();
            const results = (data.results || []).map((r: any) => ({
                title: r.titles?.[0]?.title || r.title || 'Décision',
                id: r.id || '',
                date: r.date || r.dateTexte || '',
                jurisdiction: r.origin || r.juridiction || '',
                number: r.num || r.numero || '',
                summary: (r.texte || r.text || r.sommaire || '').substring(0, 400),
                solution: r.solution || '',
            }));

            return NextResponse.json({
                results,
                totalCount: data.totalResultNumber || results.length,
                page,
            });
        }

        return NextResponse.json({ error: `Action "${action}" non reconnue. Actions disponibles: search_articles, get_article, search_jurisprudence` }, { status: 400 });

    } catch (err: any) {
        console.error('[Légifrance] Error:', err);
        return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
    }
}
