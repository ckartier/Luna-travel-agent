export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { generateAIJSON } from '@/src/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'No AI API key configured (GROQ_API_KEY or GEMINI_API_KEY)' }, { status: 500 });
    }

    let prompt = '';

    switch (type) {
      case 'analytics':
        prompt = `Tu es un consultant business expert en agence de voyage haut de gamme.
Analyse ces KPIs et donne 3-5 insights actionnables courts (max 2 lignes chacun). 
Format JSON: { "insights": [{ "type": "positive"|"warning"|"opportunity", "title": "...", "detail": "..." }] }

KPIs:
- CA brut: ${data.revenue}€
- Marge nette: ${data.profit}€ (${data.margin}%)
- Impayés: ${data.unpaid}€
- Taux de conversion: ${data.conversionRate}% (${data.wonLeads}/${data.totalLeads})
- Contacts: ${data.contacts}

Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks.`;
        break;

      case 'marketing':
        prompt = `Tu es un expert marketing digital pour une agence de voyage/conciergerie de luxe.
Suggère 3 idées de campagnes marketing basées sur ces données. 
Format JSON: { "suggestions": [{ "name": "...", "channel": "EMAIL"|"SMS", "subject": "...", "content": "..." (max 50 mots), "targetAudience": "..." }] }

Données:
- Campagnes existantes: ${data.campaignCount}
- Taux d'ouverture moyen: ${data.openRate}%
- Contacts: ${data.contacts}
- Saison actuelle: ${data.season}

Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks.`;
        break;

      case 'lead-scoring':
        prompt = `Tu es un expert commercial dans le voyage haut de gamme. Analyse ce lead et donne un score de conversion sur 100 avec des facteurs détaillés.
Format JSON: { "score": number, "confidence": "haute"|"moyenne"|"faible", "recommendation": "..." (1 phrase d'action), "factors": [{ "label": "...", "impact": "positif"|"négatif"|"neutre", "detail": "..." }] }

Lead:
- Client: ${data.clientName || 'Inconnu'}
- Destination: ${data.destination || 'Non précisée'}
- Budget: ${data.budget || 'Non précisé'}
- Dates: ${data.dates || 'Non précisées'}
- Voyageurs: ${data.pax || 'Non précisé'}
- Source: ${data.source || 'Inconnue'}
- Statut actuel: ${data.status || 'NOUVEAU'}
- Notes: ${data.notes || 'Aucune'}
- Nombre d'échanges: ${data.messageCount || 0}

Critères de scoring: budget élevé (+), dates précises (+), destination premium (+), nombre de voyageurs élevé (+), source B2C (+), réactivité (+), demande vague (-).
Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks.`;
        break;

      case 'legal-analysis':
        prompt = `Tu es un avocat conseil expérimenté. Analyse ce dossier juridique et donne une évaluation stratégique.
Format JSON: { "forces": [{ "point": "...", "detail": "..." }], "faiblesses": [{ "point": "...", "detail": "..." }], "risques": [{ "niveau": "élevé"|"moyen"|"faible", "description": "..." }], "strategie": "..." (max 3 phrases), "jurisprudence": [{ "reference": "...", "pertinence": "..." }], "pronostic": "favorable"|"incertain"|"défavorable" }

Dossier:
- Type: ${data.type || 'Non précisé'}
- Titre: ${data.title || 'N/A'}
- Statut: ${data.status || 'N/A'}
- Juridiction: ${data.jurisdiction || 'Non précisée'}
- Partie adverse: ${data.opposingParty || 'Non renseignée'}
- Description: ${data.description || 'Aucune'}
- Priorité: ${data.priority || 'Normale'}
- Honoraires: ${data.fees || 0}€ (payé: ${data.feesPaid || 0}€)
- Audiences prévues: ${data.hearingCount || 0}
- Échéances en cours: ${data.deadlineCount || 0}

Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks.`;
        break;

      default:
        return NextResponse.json({ error: 'Unknown insight type' }, { status: 400 });
    }

    const result = await generateAIJSON(prompt, { model: 'fast' });
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('AI CRM insights error:', error);
    return NextResponse.json({ error: error.message || 'AI analysis failed' }, { status: 500 });
  }
}
