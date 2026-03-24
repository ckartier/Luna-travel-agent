/**
 * Luna — Monum AI Agents (Travaux & BTP)
 *
 * Specialized Gemini agents for construction & renovation:
 * - analyzeProjectFeasibility: Analyze facts, identify risks, budget coherence, and probability of success
 * - generateSiteReport: Generate structured site reports for clients
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

export async function analyzeProjectFeasibility(params: {
    projectType: string;
    facts: string;
    budget?: string;
    deadline?: string;
    location?: string;
}) {
    const prompt = `Tu es un ARCHITECTE CHEF DE PROJET Senior spécialisé dans la rénovation et le suivi de chantiers.

MISSION: Analyser la faisabilité, les risques et la probabilité de réussite du chantier suivant:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Type de chantier: ${params.projectType || 'Rénovation globale'}
• Faits/Besoins: ${params.facts}
• Budget estimé: ${params.budget || 'À déterminer'}
• Délai demandé: ${params.deadline || 'Non précisé'}
• Localisation: ${params.location || 'Non précisée'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE REQUISE:
1. 📋 FAISABILITÉ: Faisabilité technique globale
2. 💰 BUDGET: Analyse de la cohérence du budget par rapport à la demande
3. ⚠️ RISQUES: 3-5 risques majeurs (ex: amiante, délais fournisseurs, PLU, structure)
4. 🎯 PROBABILITÉ DE SUCCÈS: Score sur 100% de respecter le budget et les délais, avec justification.
5. 📅 PLANNING: Estimation réaliste de la durée et grandes phases.

Réponds UNIQUEMENT en JSON valide:
{
    "faisabilite": {
        "statut": "favorable/réservé/défavorable",
        "commentaire": "Analyse technique"
    },
    "budget": {
        "coherence": "bonne/sous-estimé/sur-estimé",
        "minimum": "XXX €",
        "maximum": "XXX €",
        "explication": "Pourquoi cette fourchette"
    },
    "risques": [
        { "point": "Description du risque", "impact": "fort/moyen/faible", "mitigation": "Comment le gérer" }
    ],
    "probabiliteSucces": "X%",
    "planning": {
        "dureeEstimee": "X mois",
        "phasesCles": ["Installation de chantier", "Dépose", "Gros oeuvre", "Finitions", "Réception"]
    },
    "summary": "Synthèse en 2 phrases de la faisabilité du chantier"
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Analyse Faisabilité indisponible' };
    }
}

export async function generateSiteReport(params: {
    projectType: string;
    facts: string;
    consumedBudget?: string;
    status?: string;
}) {
    const prompt = `Tu es un CONDUCTEUR DE TRAVAUX expert.

MISSION: Rédiger un compte-rendu de chantier professionnel et structuré pour le client final.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Chantier: ${params.projectType}
• État actuel/Avancement: ${params.facts}
• Budget consommé à date: ${params.consumedBudget || 'Non renseigné'}
• Statut: ${params.status || 'En cours'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE REQUISE:
Génère un rapport structuré et rassurant pour le client propriétaire, en identifiant les prochaines étapes. Le ton doit être professionnel, transparent et centré sur l'expérience client.

Réponds UNIQUEMENT en JSON valide:
{
    "titre": "Compte-rendu de chantier - Semaine X",
    "etatAvancement": "Résumé précis de l'avancement des derniers jours",
    "pointsAttention": ["Ce qui a bloqué", "Ce qu'il faut surveiller"],
    "prochainesEtapes": ["Étape prévue demain", "Étape en fin de semaine"],
    "messageClient": "Un message chaleureux de 3 lignes pour rassurer le client sur la bonne tenue du budget et des délais",
    "summary": "Rapport généré avec succès"
}`;

    try {
        return await generateJSON(prompt);
    } catch {
        return { summary: 'Agent Rapport indisponible' };
    }
}
