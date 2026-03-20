/**
 * Luna — Legal AI Agents (Le Droit Agent)
 *
 * 4 specialized Gemini agents for legal professionals:
 * - analyzeLegalCase: Analyze facts, identify legal branch, assess strengths/weaknesses
 * - searchJurisprudence: Find relevant case law, statutes, and legal decisions
 * - analyzeLegalClient: Client profile analysis, risk assessment, strategy
 * - planLegalTimeline: Procedure planning with deadlines, hearings, and filings
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

async function generateJSON(prompt: string): Promise<any> {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
    });
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };
}

// ══════════════════════════════════════════════════════════════════════
// ── AGENT 1: ANALYSE DOSSIER ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function analyzeLegalCase(params: {
    caseType: string;
    facts: string;
    opposing?: string;
    jurisdiction?: string;
    urgency?: string;
}) {
    const prompt = `Tu es un AVOCAT EXPERT Senior avec 25 ans d'expérience, spécialisé en droit français et européen.

MISSION: Analyser en profondeur le dossier juridique suivant pour un confrère avocat:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type de contentieux: ${params.caseType || 'À déterminer'}
• Faits: ${params.facts}
• Partie adverse: ${params.opposing || 'Non précisée'}
• Juridiction: ${params.jurisdiction || 'À déterminer'}
• Urgence: ${params.urgency || 'Normale'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE REQUISE:
1. 📋 QUALIFICATION JURIDIQUE: Identifie la branche du droit (civil, pénal, commercial, social, administratif, etc.)
2. ⚖️ FONDEMENTS LÉGAUX: Articles de loi applicables (Code civil, Code du travail, Code pénal, etc.)
3. 💪 FORCES DU DOSSIER: 3-5 points forts avec explications
4. ⚠️ FAIBLESSES: 3-5 risques ou points faibles
5. 🎯 STRATÉGIE RECOMMANDÉE: Approche contentieuse et/ou amiable
6. 💰 ESTIMATION ENJEUX: Amplitude des dommages-intérêts possibles

Réponds UNIQUEMENT en JSON valide:
{
    "qualification": {
        "brancheDroit": "civil/pénal/commercial/social/administratif",
        "sousCategorie": "précision spécifique",
        "competence": "TJ/TC/CPH/TA/CA/Cour de Cassation"
    },
    "fondementsLegaux": [
        { "article": "Art. XXX Code civil", "texte": "Contenu résumé de l'article", "pertinence": "Explique pourquoi c'est clé" }
    ],
    "forces": [
        { "point": "Description du point fort", "impact": "fort/moyen/faible" }
    ],
    "faiblesses": [
        { "point": "Description du risque", "impact": "fort/moyen/faible", "mitigation": "Comment le gérer" }
    ],
    "strategie": {
        "approche": "contentieuse/amiable/mixte",
        "recommandation": "Stratégie détaillée en 2-3 phrases",
        "probabiliteSucces": "X%",
        "argumentsCles": ["Arg 1", "Arg 2", "Arg 3"]
    },
    "enjeux": {
        "minimum": "XXX €",
        "maximum": "XXX €",
        "median": "XXX €",
        "commentaire": "Base de l'estimation"
    },
    "summary": "Synthèse en 2 phrases maximum"
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Analyse indisponible', qualification: {}, forces: [], faiblesses: [] };
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── AGENT 2: RECHERCHE JURISPRUDENCE ────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function searchJurisprudence(params: {
    caseType: string;
    facts: string;
    legalBasis?: string;
    jurisdiction?: string;
}) {
    const prompt = `Tu es un JURISTE CHERCHEUR Expert spécialisé en recherche de jurisprudence française et européenne.

MISSION: Trouver la jurisprudence et les textes de loi les plus pertinents pour ce dossier:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type: ${params.caseType || 'À déterminer'}
• Faits clés: ${params.facts}
• Base légale identifiée: ${params.legalBasis || 'À rechercher'}
• Juridiction: ${params.jurisdiction || 'Toutes juridictions'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLES:
1. 📚 10 décisions de jurisprudence pertinentes (Cour de Cassation, Conseil d'État, CEDH, CJUE)
2. 📜 5-8 articles de loi fondamentaux applicables
3. 📖 3 textes doctrinaux ou notes de jurisprudence si pertinent
4. ⚡ Prioriser les décisions RÉCENTES (2020-2026)
5. Chaque décision doit avoir: juridiction, date, numéro, résumé du principe, et pertinence pour le dossier

Réponds UNIQUEMENT en JSON valide:
{
    "jurisprudence": [
        {
            "juridiction": "Cass. civ. 1ère / Cass. soc. / CE / CEDH / etc.",
            "date": "12 janvier 2024",
            "numero": "n° XX-XXXXX",
            "principe": "Principe dégagé par la décision en 1-2 phrases",
            "pertinence": "Pourquoi cette décision est cruciale pour le dossier",
            "sens": "favorable/défavorable/nuancé"
        }
    ],
    "textes": [
        {
            "reference": "Art. 1240 Code civil",
            "contenu": "Résumé du texte",
            "application": "Comment il s'applique au cas"
        }
    ],
    "doctrine": [
        {
            "auteur": "Nom de l'auteur",
            "titre": "Titre de la note ou de l'article",
            "revue": "Dalloz / JCP / RTD Civ. / etc.",
            "apport": "Ce que ça ajoute au dossier"
        }
    ],
    "summary": "Synthèse de la recherche: X décisions trouvées, tendance jurisprudentielle [favorable/défavorable]"
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Jurisprudence indisponible', jurisprudence: [], textes: [] };
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── AGENT 3: PROFIL CLIENT ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function analyzeLegalClient(params: {
    clientType: string;
    caseType: string;
    budget?: string;
    urgency?: string;
    previousCases?: string;
}) {
    const prompt = `Tu es un EXPERT en gestion de relation client pour un cabinet d'avocats premium.

MISSION: Analyser le profil du client et ses besoins pour optimiser la stratégie cabinet:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type de client: ${params.clientType || 'Particulier'}
• Nature du dossier: ${params.caseType || 'À préciser'}
• Budget estimé: ${params.budget || 'Non communiqué'}
• Urgence: ${params.urgency || 'Normale'}
• Historique: ${params.previousCases || 'Nouveau client'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE REQUISE:
1. 🎯 SEGMENTATION: Type de client (particulier/PME/grand compte/institutionnel)
2. 💰 CONVENTION D'HONORAIRES: Recommandation de facturation (forfait/horaire/résultat/mixte)
3. 📋 8-10 RECOMMANDATIONS CONCRÈTES pour la gestion du dossier
4. ⚠️ RISQUES CLIENT: Impayés, attentes irréalistes, médiatisation

Réponds UNIQUEMENT en JSON valide:
{
    "profile": {
        "segment": "Particulier Premium/PME/ETI/Grand Compte/Institutionnel",
        "sensibilite": "Prix/Qualité/Rapidité/Confidentialité",
        "risqueImpayes": "faible/moyen/élevé",
        "potentielFidelisation": "fort/moyen/faible"
    },
    "honoraires": {
        "mode": "forfait/horaire/résultat/mixte",
        "fourchette": "XXX € - XXX €",
        "acompte": "XXX €",
        "justification": "Pourquoi ce mode de facturation"
    },
    "recommendations": [
        {
            "text": "Recommandation concrète et actionnable",
            "type": "stratégie/communication/facturation/procédure/relation"
        }
    ],
    "risques": [
        {
            "risque": "Description du risque",
            "probabilite": "forte/moyenne/faible",
            "mitigation": "Comment le prévenir"
        }
    ],
    "summary": "Profil [segment]. Client [sensibilité]. Stratégie de facturation recommandée."
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Client indisponible', profile: {}, recommendations: [] };
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── AGENT 4: TIMELINE PROCÉDURE ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export async function planLegalTimeline(params: {
    caseType: string;
    facts: string;
    jurisdiction?: string;
    urgency?: string;
    startDate?: string;
}) {
    const startDate = params.startDate || new Date().toISOString().split('T')[0];

    const prompt = `Tu es un AVOCAT PROCÉDURIER Expert, spécialiste de la stratégie contentieuse et des délais de procédure.

MISSION: Créer un CALENDRIER PROCÉDURAL complet et réaliste pour ce dossier:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type: ${params.caseType || 'À déterminer'}
• Faits: ${params.facts}
• Juridiction: ${params.jurisdiction || 'À déterminer'}
• Urgence: ${params.urgency || 'Normale'}
• Date de début: ${startDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLES:
1. 📅 12-20 étapes chronologiques réalistes
2. ⏰ Délais RÉELS (mise en état TJ: 12-18 mois, CA: 12 mois, Cass: 18 mois)
3. 📝 Chaque étape a: date estimée, action, responsable, documents nécessaires
4. ⚠️ Identifier les délais impératifs (prescription, appel, recours)
5. 💡 Inclure les étapes de négociation/médiation si pertinent

Réponds UNIQUEMENT en JSON valide:
{
    "phases": [
        {
            "phase": 1,
            "titre": "Titre de la phase",
            "dateEstimee": "YYYY-MM-DD",
            "delai": "J+XX / S+XX / M+XX depuis le début",
            "action": "Description détaillée de l'action",
            "responsable": "Avocat / Client / Huissier / Expert / Tribunal",
            "documents": ["Document 1", "Document 2"],
            "imperatif": true,
            "commentaire": "Note importante ou alerte sur les délais"
        }
    ],
    "delaisImperatifs": [
        {
            "nom": "Prescription",
            "date": "YYYY-MM-DD",
            "consequence": "Que se passe-t-il si on rate ce délai"
        }
    ],
    "dureeEstimee": "X-X mois",
    "coutEstime": "X XXX € - X XXX € (honoraires + frais)",
    "summary": "Procédure devant [juridiction] — durée estimée X mois, XX étapes clés.",
    "tips": ["Conseil pratique 1", "Conseil 2", "Conseil 3"]
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Timeline indisponible', phases: [], delaisImperatifs: [] };
    }
}
