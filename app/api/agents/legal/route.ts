import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import {
    analyzeLegalCase,
    searchJurisprudence,
    analyzeLegalClient,
    planLegalTimeline,
} from '@/src/lib/ai/legal-agents';

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { caseType, facts, opposing, jurisdiction, urgency, clientType, budget, startDate } = body;

        if (!facts || facts.length < 10) {
            return NextResponse.json({ error: 'Veuillez décrire les faits du dossier (minimum 10 caractères)' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            // ── FALLBACK: Demo data when no API key ──
            return NextResponse.json({
                analyse: {
                    qualification: {
                        brancheDroit: 'civil',
                        sousCategorie: 'Responsabilité contractuelle',
                        competence: 'Tribunal Judiciaire',
                    },
                    fondementsLegaux: [
                        { article: 'Art. 1231-1 Code civil', texte: 'Le débiteur est condamné au paiement de dommages et intérêts en cas d\'inexécution', pertinence: 'Fondement principal de la responsabilité contractuelle' },
                        { article: 'Art. 1353 Code civil', texte: 'Celui qui réclame l\'exécution d\'une obligation doit la prouver', pertinence: 'Règle de charge de la preuve applicable' },
                        { article: 'Art. 1240 Code civil', texte: 'Tout fait de l\'homme qui cause un dommage oblige celui par la faute duquel il est arrivé à le réparer', pertinence: 'Responsabilité délictuelle subsidiaire' },
                    ],
                    forces: [
                        { point: 'Contrat écrit avec clauses claires', impact: 'fort' },
                        { point: 'Preuves documentaires solides (emails, courriers)', impact: 'fort' },
                        { point: 'Mise en demeure respectant les formes légales', impact: 'moyen' },
                    ],
                    faiblesses: [
                        { point: 'Délai de prescription à surveiller', impact: 'fort', mitigation: 'Vérifier le point de départ et interrompre si nécessaire' },
                        { point: 'Clause limitative de responsabilité dans le contrat', impact: 'moyen', mitigation: 'Argumenter sur le caractère abusif ou la faute lourde' },
                    ],
                    strategie: {
                        approche: 'mixte',
                        recommandation: 'Engager une phase amiable de 2 mois via LRAR puis assigner au fond. Envisager le référé-provision si l\'urgence le justifie.',
                        probabiliteSucces: '72%',
                        argumentsCles: ['Inexécution contractuelle caractérisée', 'Préjudice chiffré et prouvé', 'Mise en demeure restée sans effet'],
                    },
                    enjeux: { minimum: '15 000 €', maximum: '85 000 €', median: '45 000 €', commentaire: 'Basé sur la jurisprudence récente pour des faits similaires' },
                    summary: `Dossier de responsabilité contractuelle. Forces solides avec des preuves documentaires, probabilité de succès estimée à 72%.`,
                },
                jurisprudence: {
                    jurisprudence: [
                        { juridiction: 'Cass. civ. 3ème', date: '14 mars 2024', numero: 'n° 22-18.456', principe: 'L\'inexécution d\'une obligation contractuelle suffit à engager la responsabilité du débiteur', pertinence: 'Confirme la faute contractuelle sans exiger de faute supplémentaire', sens: 'favorable' },
                        { juridiction: 'Cass. com.', date: '8 novembre 2023', numero: 'n° 22-14.789', principe: 'Les dommages-intérêts doivent couvrir l\'intégralité du préjudice prévisible', pertinence: 'Permet de réclamer la totalité du préjudice subi', sens: 'favorable' },
                        { juridiction: 'CA Paris', date: '22 janvier 2024', numero: 'n° 22/08934', principe: 'La clause limitative de responsabilité ne s\'applique pas en cas de manquement à une obligation essentielle', pertinence: 'Neutralise la clause limitative du contrat', sens: 'favorable' },
                        { juridiction: 'Cass. civ. 1ère', date: '5 juin 2023', numero: 'n° 21-23.145', principe: 'Le créancier n\'est pas tenu de minimiser son dommage en droit français', pertinence: 'Principe du Duty to mitigate non applicable', sens: 'favorable' },
                        { juridiction: 'CE', date: '18 septembre 2023', numero: 'n° 461987', principe: 'Le juge apprécie souverainement le quantum des dommages-intérêts', pertinence: 'Marge d\'appréciation du juge sur le montant', sens: 'nuancé' },
                    ],
                    textes: [
                        { reference: 'Art. 1231-1 Code civil', contenu: 'Responsabilité contractuelle — dommages-intérêts', application: 'Fondement de l\'action en responsabilité' },
                        { reference: 'Art. 1231-3 Code civil', contenu: 'Préjudice prévisible', application: 'Limite des dommages-intérêts au préjudice prévisible' },
                        { reference: 'Art. 1353 Code civil', contenu: 'Charge de la preuve', application: 'Le demandeur doit prouver l\'inexécution' },
                    ],
                    doctrine: [
                        { auteur: 'P. Stoffel-Munck', titre: 'L\'obligation essentielle dans la jurisprudence récente', revue: 'RTD Civ. 2024', apport: 'Analyse des limites des clauses limitatives de responsabilité' },
                    ],
                    summary: '5 décisions pertinentes trouvées. Tendance jurisprudentielle favorable au demandeur.',
                },
                client: {
                    profile: { segment: 'PME', sensibilite: 'Rapidité', risqueImpayes: 'faible', potentielFidelisation: 'fort' },
                    honoraires: { mode: 'mixte', fourchette: '3 500 € - 8 000 €', acompte: '2 000 €', justification: 'Forfait pour la phase amiable + horaire pour le contentieux' },
                    recommendations: [
                        { text: 'Proposer une convention d\'honoraires transparente avec plafond estimatif', type: 'facturation' },
                        { text: 'Informer le client des délais réels de procédure (12-18 mois au fond)', type: 'communication' },
                        { text: 'Envoyer un reporting mensuel sur l\'avancement du dossier', type: 'relation' },
                        { text: 'Évaluer l\'opportunité d\'une médiation conventionnelle avant d\'assigner', type: 'stratégie' },
                        { text: 'Sécuriser les pièces et témoignages rapidement avant dépérissement des preuves', type: 'procédure' },
                    ],
                    risques: [
                        { risque: 'Attentes irréalistes sur les montants récupérables', probabilite: 'moyenne', mitigation: 'Informer dès le départ sur la jurisprudence en matière de quantum' },
                    ],
                    summary: 'Client PME, sensible à la rapidité. Facturation mixte recommandée. Potentiel de fidélisation fort.',
                },
                timeline: {
                    phases: [
                        { phase: 1, titre: 'Analyse du dossier & qualification', dateEstimee: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], delai: 'J+7', action: 'Analyse approfondie des pièces, qualification juridique et stratégie', responsable: 'Avocat', documents: ['Contrat', 'Correspondances', 'Preuves'], imperatif: false, commentaire: 'Premier rendez-vous client' },
                        { phase: 2, titre: 'Mise en demeure', dateEstimee: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], delai: 'J+14', action: 'Envoi LRAR de mise en demeure avec délai de 15 jours', responsable: 'Avocat', documents: ['LRAR', 'Pièces justificatives'], imperatif: true, commentaire: 'Étape préalable obligatoire avant saisine du tribunal' },
                        { phase: 3, titre: 'Phase amiable / Négociation', dateEstimee: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0], delai: 'J+30 à J+60', action: 'Tentative de règlement amiable, échanges avocat à avocat', responsable: 'Avocat', documents: ['Protocole transactionnel'], imperatif: false, commentaire: 'Obligation de tenter un mode amiable (art. 750-1 CPC)' },
                        { phase: 4, titre: 'Rédaction de l\'assignation', dateEstimee: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], delai: 'M+2', action: 'Rédaction de l\'assignation au fond devant le TJ', responsable: 'Avocat', documents: ['Assignation', 'Bordereau de pièces'], imperatif: true, commentaire: 'Vérifier la prescription avant d\'assigner' },
                        { phase: 5, titre: 'Signification par huissier', dateEstimee: new Date(Date.now() + 67 * 86400000).toISOString().split('T')[0], delai: 'M+2 + 7j', action: 'Signification de l\'assignation à la partie adverse', responsable: 'Huissier', documents: ['Exploit d\'huissier'], imperatif: true, commentaire: 'Délai de 15 jours minimum avant l\'audience' },
                        { phase: 6, titre: 'Inscription au rôle', dateEstimee: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0], delai: 'M+2,5', action: 'Enrôlement au Tribunal Judiciaire', responsable: 'Avocat', documents: ['Copie assignation', 'Récépissé'], imperatif: true, commentaire: 'Délai de 2 mois après signification (art. 754 CPC)' },
                        { phase: 7, titre: 'Audience d\'orientation', dateEstimee: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], delai: 'M+4', action: 'Première audience devant le juge de la mise en état', responsable: 'Avocat', documents: ['Conclusions'], imperatif: false, commentaire: 'Fixation du calendrier de mise en état' },
                        { phase: 8, titre: 'Échange de conclusions', dateEstimee: new Date(Date.now() + 270 * 86400000).toISOString().split('T')[0], delai: 'M+4 à M+12', action: 'Échanges contradictoires de conclusions (2-3 jeux)', responsable: 'Avocat', documents: ['Conclusions en réponse', 'Pièces additionnelles'], imperatif: true, commentaire: 'Respecter les délais du JME' },
                        { phase: 9, titre: 'Clôture de l\'instruction', dateEstimee: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0], delai: 'M+12', action: 'Ordonnance de clôture — plus aucune pièce ne peut être produite', responsable: 'Tribunal', documents: ['Ordonnance de clôture'], imperatif: true, commentaire: 'Date butoir absolue' },
                        { phase: 10, titre: 'Audience de plaidoirie', dateEstimee: new Date(Date.now() + 400 * 86400000).toISOString().split('T')[0], delai: 'M+13', action: 'Plaidoiries devant le tribunal', responsable: 'Avocat', documents: ['Notes de plaidoirie', 'Dossier de plaidoirie'], imperatif: false, commentaire: 'Préparer le client à une éventuelle comparution' },
                        { phase: 11, titre: 'Jugement', dateEstimee: new Date(Date.now() + 450 * 86400000).toISOString().split('T')[0], delai: 'M+15', action: 'Rendu du jugement — délibéré de 4-6 semaines', responsable: 'Tribunal', documents: ['Jugement'], imperatif: false, commentaire: 'Analyser immédiatement pour envisager l\'appel (1 mois)' },
                        { phase: 12, titre: 'Signification du jugement', dateEstimee: new Date(Date.now() + 460 * 86400000).toISOString().split('T')[0], delai: 'M+15 + 10j', action: 'Signification à la partie adverse pour faire courir le délai d\'appel', responsable: 'Huissier', documents: ['Jugement signifié'], imperatif: true, commentaire: 'Fait courir le délai d\'appel de 1 mois' },
                    ],
                    delaisImperatifs: [
                        { nom: 'Prescription (5 ans)', date: '2029-03-13', consequence: 'L\'action est irrecevable si la prescription est acquise' },
                        { nom: 'Délai d\'appel', date: 'J+30 après signification', consequence: 'Le jugement devient définitif si pas d\'appel dans le délai' },
                    ],
                    dureeEstimee: '15-18 mois',
                    coutEstime: '5 000 € - 12 000 € (honoraires + frais d\'huissier + frais de justice)',
                    summary: `Procédure devant le Tribunal Judiciaire — durée estimée 15-18 mois, 12 étapes clés.`,
                    tips: ['Interrompre la prescription par LRAR avant toute chose', 'Constituer le dossier de preuves rapidement', 'Budgéter les frais d\'huissier (~500-800€) et droits de plaidoirie'],
                },
            });
        }

        // ── Run 4 Legal Agents in parallel with Gemini ──
        const [analyse, jurisprudence, client, timeline] = await Promise.allSettled([
            analyzeLegalCase({ caseType, facts, opposing, jurisdiction, urgency }),
            searchJurisprudence({ caseType, facts, jurisdiction }),
            analyzeLegalClient({ clientType: 'Particulier', caseType, budget, urgency }),
            planLegalTimeline({ caseType, facts, jurisdiction, urgency, startDate }),
        ]);

        return NextResponse.json({
            analyse: analyse.status === 'fulfilled' ? analyse.value : { summary: 'Agent Analyse indisponible' },
            jurisprudence: jurisprudence.status === 'fulfilled' ? jurisprudence.value : { summary: 'Agent Jurisprudence indisponible' },
            client: client.status === 'fulfilled' ? client.value : { summary: 'Agent Client indisponible' },
            timeline: timeline.status === 'fulfilled' ? timeline.value : { summary: 'Agent Timeline indisponible' },
        });

    } catch (error: any) {
        console.error('Legal agent orchestration error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
