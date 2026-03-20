'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, type LiveServerMessage } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { type VoiceVocabulary, fetchVocabulary, correctTranscription, analyzeConfidence } from '../lib/voice-vocabulary';
import { getFollowUpSuggestion, createMemory, updateMemory, resolvePronouns, getPageContextHint, type ConversationMemory } from '../lib/voice-context';
import { getCachedResponse, cacheResponse, initSessionBudget, trackTokenUsage, getBudgetStatus, getEconomySystemPrompt, getMaxResponseTokens, getSessionStats } from '../lib/voice-economy';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface TranscriptEntry {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    action?: ActionResult; // attached CRM write action result
}

export interface ActionResult {
    type: 'quote' | 'email' | 'client' | 'invoice' | 'note' | 'lead' | 'reminder' | 'dossier';
    label: string;
    id?: string;
    previewUrl?: string;
}

export type DeviceStatus = 'ok' | 'muted' | 'denied' | 'unavailable' | 'unknown';

export interface UseVoiceAgentReturn {
    state: VoiceState;
    transcript: TranscriptEntry[];
    start: () => Promise<void>;
    stop: () => void;
    /** Send a text message into the active voice session (text-voice sync) */
    sendText: (text: string) => void;
    isListening: boolean;
    isSpeaking: boolean;
    error: string | null;
    audioLevel: number;
    interimText: string;
    micStatus: DeviceStatus;
    audioOutputStatus: DeviceStatus;
}

export interface UseVoiceAgentOptions {
    /** Describe the current CRM page so the AI can give context-aware answers */
    pageContext?: string;
    /** Active vertical ('travel' | 'legal') — drives prompt + tools */
    vertical?: string;
}

/* ═══════════════════════════════════════════════════
   TRAVEL Tools
   ═══════════════════════════════════════════════════ */
const TRAVEL_TOOLS_CORE = [
    // ─── READ (fast queries) ───
    { name: 'get_upcoming_trips', description: 'Liste voyages à venir.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_client_info', description: 'Chercher un client par nom/email.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou email' } }, required: ['query'] } },
    { name: 'get_today_pipeline', description: 'Leads récents du pipeline.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_tasks', description: 'Tâches en cours et à venir.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_unpaid_invoices', description: 'Factures impayées.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_reservations', description: 'Réservations actives (bookings).', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_payments_summary', description: 'Résumé paiements du mois.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'search_crm', description: 'Recherche globale CRM.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'search_catalog', description: 'Chercher dans le catalogue.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    // ─── NAVIGATE ───
    { name: 'navigate_to', description: 'Naviguer vers une section CRM.', parameters: { type: 'object' as const, properties: { section: { type: 'string', enum: ['dashboard','clients','pipeline','voyages','planning','devis','factures','paiements','mails','taches','catalogue','fournisseurs','parametres'] } }, required: ['section'] } },
    { name: 'open_record', description: 'Ouvrir un dossier/client/devis par nom.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou référence' } }, required: ['query'] } },
    // ─── WRITE (essential) ───
    { name: 'create_task', description: 'Créer tâche/rappel.', parameters: { type: 'object' as const, properties: { title: { type: 'string' }, dueDate: { type: 'string', description: 'YYYY-MM-DD' }, priority: { type: 'string', enum: ['low','medium','high','urgent'] } }, required: ['title'] } },
    { name: 'create_client_and_quote', description: 'Créer un client ET son devis. Utilise ce tool quand le user mentionne un nom + des détails de voyage.', parameters: { type: 'object' as const, properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, numberOfGuests: { type: 'number' }, budget: { type: 'number' }, notes: { type: 'string' } }, required: ['firstName', 'lastName', 'destination'] } },
    { name: 'create_client', description: 'Créer fiche client seule.', parameters: { type: 'object' as const, properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }, required: ['firstName','lastName'] } },
    { name: 'create_quote', description: 'Créer devis voyage.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, budget: { type: 'number' } }, required: ['clientName','destination'] } },
    { name: 'create_invoice', description: 'Créer facture.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' } }, required: ['clientName','amount','description'] } },
    { name: 'create_trip', description: 'Créer un voyage.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, numberOfGuests: { type: 'number' } }, required: ['clientName', 'destination', 'startDate', 'endDate'] } },
    { name: 'create_lead', description: 'Créer un lead/prospect.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, notes: { type: 'string' } }, required: ['clientName', 'destination'] } },
    // ─── ACTIONS ───
    { name: 'mark_invoice_paid', description: 'Marquer facture comme payée.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'complete_task', description: 'Marquer tâche comme terminée.', parameters: { type: 'object' as const, properties: { taskTitle: { type: 'string' } }, required: ['taskTitle'] } },
    { name: 'update_lead_stage', description: 'Changer stade pipeline.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, stage: { type: 'string', enum: ['lead','qualified','proposal','negotiation','won','lost'] } }, required: ['clientName','stage'] } },
    { name: 'send_whatsapp', description: 'Envoyer WhatsApp.', parameters: { type: 'object' as const, properties: { recipientName: { type: 'string' }, message: { type: 'string' } }, required: ['recipientName', 'message'] } },
    { name: 'add_note', description: 'Ajouter note sur client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, note: { type: 'string' } }, required: ['clientName', 'note'] } },
    // ─── REPORTS ───
    { name: 'morning_report', description: 'Rapport matinal: alertes, tâches, factures.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'kpi_dashboard', description: 'KPIs clés.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'top_clients', description: 'Classement meilleurs clients.', parameters: { type: 'object' as const, properties: { limit: { type: 'number' } } } },
];

// Advanced tools — loaded on demand via voice command "mode avancé"
const TRAVEL_TOOLS_ADVANCED = [
    { name: 'get_recent_emails', description: 'Derniers emails reçus.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_quote_details', description: 'Lire un devis par nom client.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'get_suppliers', description: 'Liste prestataires.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: [] } },
    { name: 'get_planning', description: 'Planning par date.', parameters: { type: 'object' as const, properties: { date: { type: 'string' } }, required: [] } },
    { name: 'assign_supplier', description: 'Assigner prestataire + WhatsApp.', parameters: { type: 'object' as const, properties: { supplierName: { type: 'string' }, prestationName: { type: 'string' }, clientName: { type: 'string' }, date: { type: 'string' } }, required: ['supplierName','prestationName','date'] } },
    { name: 'add_prestation_to_trip', description: 'Ajouter prestation à un voyage.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, prestationName: { type: 'string' }, date: { type: 'string' } }, required: ['clientName', 'prestationName'] } },
    { name: 'create_email_draft', description: 'Brouillon email.', parameters: { type: 'object' as const, properties: { toName: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['toName','subject','body'] } },
    { name: 'update_client', description: 'Modifier infos client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }, required: ['clientName'] } },
    { name: 'update_quote_status', description: 'Changer statut devis.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, status: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] } }, required: ['clientName', 'status'] } },
    { name: 'send_email', description: 'Envoyer email via Gmail.', parameters: { type: 'object' as const, properties: { recipientName: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['recipientName', 'subject', 'body'] } },
    { name: 'record_payment', description: 'Enregistrer paiement.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, amount: { type: 'number' } }, required: ['clientName', 'amount'] } },
    { name: 'prepare_trip', description: 'Préparer voyage complet.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'close_deal', description: 'Clore un deal.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'follow_up_client', description: 'Suivi client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'compare_revenue', description: 'Comparer CA entre périodes.', parameters: { type: 'object' as const, properties: { month1: { type: 'string' }, month2: { type: 'string' } }, required: ['month1'] } },
    { name: 'suggest_prestation', description: 'Suggérer prestations.', parameters: { type: 'object' as const, properties: { destination: { type: 'string' }, clientName: { type: 'string' } } } },
    { name: 'revenue_forecast', description: 'Prévisions CA.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'detect_duplicates', description: 'Détecter doublons contacts.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'draft_email', description: 'Rédiger email intelligent.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, purpose: { type: 'string' } }, required: ['clientName', 'purpose'] } },
    { name: 'client_value', description: 'Valeur à vie client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'set_goal', description: 'Définir objectif.', parameters: { type: 'object' as const, properties: { type: { type: 'string' }, target: { type: 'number' }, period: { type: 'string' } }, required: ['type', 'target'] } },
    { name: 'smart_reminder', description: 'Rappel intelligent.', parameters: { type: 'object' as const, properties: { text: { type: 'string' }, when: { type: 'string' } }, required: ['text', 'when'] } },
    { name: 'track_expense', description: 'Enregistrer dépense.', parameters: { type: 'object' as const, properties: { description: { type: 'string' }, amount: { type: 'number' } }, required: ['description', 'amount'] } },
    { name: 'predict_churn', description: 'Prédire churn clients.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'pipeline_coach', description: 'Coaching pipeline.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'cross_sell', description: 'Suggérer prestations complémentaires.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'client_health', description: 'Score santé client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'client_timeline', description: 'Historique complet client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' } }, required: ['clientName'] } },
    { name: 'conversion_funnel', description: 'Entonnoir de conversion.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'commission_tracker', description: 'Commissions gagnées.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'detect_anomalies', description: 'Détecter anomalies CRM.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'gamification_status', description: 'XP, niveau, badges.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'narrate_dashboard', description: 'Narrer le tableau de bord.', parameters: { type: 'object' as const, properties: {} } },
];

const TRAVEL_TOOLS = TRAVEL_TOOLS_CORE;
const TRAVEL_TOOLS_ALL = [...TRAVEL_TOOLS_CORE, ...TRAVEL_TOOLS_ADVANCED];

/* ═══════════════════════════════════════════════════
   LEGAL Tools
   ═══════════════════════════════════════════════════ */
const LEGAL_TOOLS = [
    // ─── READ ───
    { name: 'get_dossiers', description: 'Dossiers juridiques actifs.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_upcoming_deadlines', description: 'Échéances dans 30 jours.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_unpaid_invoices', description: 'Factures impayées.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_recent_emails', description: 'Derniers emails reçus.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'get_client_info', description: 'Chercher client par nom.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou email' } }, required: ['query'] } },
    { name: 'get_tasks', description: 'Tâches en cours et à venir.', parameters: { type: 'object' as const, properties: {} } },
    // ─── NAVIGATE ───
    { name: 'navigate_to', description: 'Naviguer vers une section CRM.', parameters: { type: 'object' as const, properties: { section: { type: 'string', enum: ['dashboard','clients','pipeline','dossiers','jurisprudence','documents','devis','quotes','factures','invoices','paiements','payments','planning','mails','emails','taches','tasks','analytics','parametres','settings','equipe','team','agent-ia','templates'] } }, required: ['section'] } },
    { name: 'open_record', description: 'Ouvrir dossier/client/devis par nom.', parameters: { type: 'object' as const, properties: { query: { type: 'string', description: 'Nom ou référence' } }, required: ['query'] } },
    // ─── WRITE ───
    { name: 'create_task', description: 'Créer tâche/rappel.', parameters: { type: 'object' as const, properties: { title: { type: 'string' }, dueDate: { type: 'string' }, priority: { type: 'string', enum: ['low','medium','high','urgent'] } }, required: ['title'] } },
    { name: 'create_email_draft', description: 'Brouillon email client/dossier.', parameters: { type: 'object' as const, properties: { toName: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, dossierName: { type: 'string' } }, required: ['toName','subject','body'] } },
    { name: 'create_invoice', description: 'Facture honoraires.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' }, dossierName: { type: 'string' }, dueDate: { type: 'string' } }, required: ['clientName','amount','description'] } },
    { name: 'create_client', description: 'Créer fiche client.', parameters: { type: 'object' as const, properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }, required: ['firstName','lastName'] } },
    { name: 'create_quote', description: 'Créer convention d\'honoraires.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, destination: { type: 'string' }, budget: { type: 'number' }, notes: { type: 'string' } }, required: ['clientName'] } },
    { name: 'add_note_to_dossier', description: 'Note sur dossier.', parameters: { type: 'object' as const, properties: { dossierName: { type: 'string' }, note: { type: 'string' } }, required: ['dossierName','note'] } },
    { name: 'add_note_to_client', description: 'Note sur client.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, note: { type: 'string' } }, required: ['clientName','note'] } },
    { name: 'update_dossier_status', description: 'Changer statut dossier.', parameters: { type: 'object' as const, properties: { dossierName: { type: 'string' }, status: { type: 'string', enum: ['active','pending','closed','archived','urgent'] } }, required: ['dossierName','status'] } },
    { name: 'update_lead_stage', description: 'Changer stade pipeline.', parameters: { type: 'object' as const, properties: { clientName: { type: 'string' }, stage: { type: 'string', enum: ['lead','qualified','proposal','negotiation','won','lost'] } }, required: ['clientName','stage'] } },
    { name: 'create_reminder', description: 'Échéance critique dossier.', parameters: { type: 'object' as const, properties: { title: { type: 'string' }, dossierName: { type: 'string' }, dueDate: { type: 'string' }, priority: { type: 'string', enum: ['medium','high','urgent'] } }, required: ['title','dueDate'] } },
    { name: 'get_quote_details', description: 'Lire un devis/convention.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'get_payments_summary', description: 'Résumé paiements du mois.', parameters: { type: 'object' as const, properties: {} } },
    { name: 'search_crm', description: 'Recherche globale CRM.', parameters: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
];

/* ═══════════════════════════════════════════════════
   System Prompts
   ═══════════════════════════════════════════════════ */
function buildTravelPrompt(firstName: string, pageContext?: string): string {
    const ctx = pageContext ? `\nPage actuelle: ${pageContext}.` : '';
    return `Tu es Luna, l'assistante vocale IA du CRM de conciergerie voyage. Tu parles à ${firstName}.${ctx}

RÈGLES:
- Réponds en français, phrases COURTES et naturelles (max 2 phrases).
- Agis directement avec les outils. Ne dis JAMAIS "je vais faire" — fais-le.
- Si une info critique manque (nom, destination) → pose UNE question courte.
- Les dates incomplètes ("2 novembre") → complète avec l'année en cours (2026).
- Après chaque action, confirme brièvement. Sois direct.

ROUTING DES OUTILS:
- Client + voyage/destination → create_client_and_quote (crée le contact SI inexistant + le devis).
- "crée un devis" seul → create_quote.
- "crée un voyage" → create_trip.
- "crée un lead/prospect" → create_lead.
- "ajoute [prestation] au voyage de [client]" → add_prestation_to_trip.
- "ouvre/affiche/montre [X]" → open_record (cherche dans contacts, catalogue, prestataires, devis, factures).
- "va aux/vers [section]" → navigate_to.
- "envoie un WhatsApp à [nom]" → send_whatsapp.
- "envoie un email à [nom]" → send_email.
- "marque la facture payée" → mark_invoice_paid.
- "termine la tâche [X]" → complete_task.
- "quel est le planning" → get_planning.
- "combien de CA" ou "chiffre d'affaires" → get_monthly_revenue.
- "mes prestataires" → get_suppliers.
- "réservations prestataires" → get_supplier_bookings.
- "devis [nom] accepté/envoyé" → update_quote_status.
- "change l'email/téléphone de [nom]" → update_client.
- "cherche [X]" → search_crm (cherche dans 7 collections).
- "mes collections" → get_collections.
- "prépare le voyage de [client]" → prepare_trip (analyse complète + crée les tâches manquantes).
- "rapport du matin" ou "briefing" → morning_report (santé complète du CRM).
- "clos le deal de [client]" ou "ferme le deal" → close_deal (crée voyage + facture + confirme le tout).
- "fais le suivi de [client]" ou "analyse le client" → follow_up_client (analyse complète + suggestions).
- "compare le CA janvier février" ou "CA ce mois vs le mois dernier" → compare_revenue.
- "meilleurs clients" ou "top clients" → top_clients.
- "note pour [client]" ou "ajoute une note" → add_note.
- "suggère une prestation pour [destination]" → suggest_prestation.
- "notifie tous les clients de la semaine" → batch_notify.
- "prévisions" ou "forecast" → revenue_forecast.
- "doublons" ou "détecte les doublons" → detect_duplicates.
- "génère une proposition pour [client] [destination]" → generate_proposal.
- "rédige un email de relance/confirmation/remerciement pour [client]" → draft_email.
- "valeur de [client]" ou "combien vaut [client]" → client_value.
- "saisonnalité" ou "quand partir à [destination]" → seasonality.
- "dicte" ou "note dictée" → dictate_note (sauvegarde texte long).
- "KPIs" ou "tableau de bord" → kpi_dashboard.
- "objectif" ou "fixe un objectif" → set_goal / check_goal.
- "qualité des données" ou "audit CRM" → data_quality.
- "segmente les clients" ou "RFM" → segment_clients.
- "rappelle-moi" ou "dans 3 jours" → smart_reminder.
- "qu'est-ce que j'ai fait" ou "historique" → voice_history.
- "tague les clients" ou "auto-tag" → auto_tag.
- "dépense" ou "frais" → track_expense.
- "quand [X] alors [Y]" ou "automatise" → set_workflow_rule.
- "rentabilité" ou "marge" ou "profit" → profit_analysis.
- "mets à jour en masse" ou "bulk" → bulk_update.
- "raconte-moi" ou "résume le CRM" → narrate_dashboard.
- "mon profil" ou "mon niveau" ou "XP" → gamification_status.
- "défi du jour" ou "challenge" → daily_challenge.
- "qui va churner" ou "clients à risque" → predict_churn.
- "coaching pipeline" ou "prochaine action" → pipeline_coach.
- "trouve un créneau" ou "planning libre" → smart_schedule.
- "enregistre macro" ou "crée une macro" → save_macro.
- "lance la macro" ou "exécute macro" → run_macro.
- "que proposer en plus" ou "cross-sell" → cross_sell.
- "santé de [client]" ou "score" → client_health.
- "compare [client1] et [client2]" → compare_clients.
- "applique le template [X] pour [client]" → apply_template.
- "commission" ou "combien j'ai gagné" → commission_tracker.
- "meilleur prestataire" ou "score fournisseur" → supplier_score.
- "anomalies" ou "problèmes dans le CRM" → detect_anomalies.
- "relance automatique" ou "nurture" → auto_followup.
- "histoire de [client]" ou "timeline" → client_timeline.
- "entonnoir" ou "funnel" ou "conversion" → conversion_funnel.
- "d'où viennent" ou "attribution" → revenue_attribution.
- "[client] préfère" ou "enregistre préférence" → set_preference.
- Si le user dit un nombre de personnes, c'est numberOfGuests.`;
}

function buildLegalPrompt(firstName: string, pageContext?: string): string {
    const ctx = pageContext ? `\nPage actuelle: ${pageContext}.` : '';
    return `Tu es Luna, l'assistante vocale IA du CRM juridique. Tu parles à Maître ${firstName}.${ctx}

RÈGLES:
- Réponds en français, phrases COURTES et professionnelles (max 2 phrases).
- Agis directement avec les outils. Ne dis JAMAIS "je vais faire" — fais-le.
- Si une info critique manque → pose UNE question courte.
- Après chaque action, confirme brièvement. Sois direct.

ROUTING:
- "ouvre/affiche" → open_record. "va aux" → navigate_to.
- "envoie WhatsApp" → send_whatsapp. "envoie email" → send_email.
- "marque facture payée" → mark_invoice_paid. "termine tâche" → complete_task.
- "combien de CA" → get_monthly_revenue. "cherche" → search_crm.`;
}

/* ─── Route mapping: French keywords → CRM paths ─── */
const ROUTE_MAP: Record<string, string> = {
    // Dashboard
    dashboard: '/crm', accueil: '/crm', home: '/crm',
    // Pipeline & Leads
    pipeline: '/crm/pipeline', leads: '/crm/leads', lead: '/crm/leads', prospects: '/crm/pipeline',
    // Clients & Contacts
    clients: '/crm/clients', client: '/crm/clients', contacts: '/crm/contacts', contact: '/crm/contacts',
    // Trips & Planning
    voyages: '/crm/trips', voyage: '/crm/trips', trips: '/crm/trips', planning: '/crm/planning',
    calendrier: '/crm/planning', calendar: '/crm/planning',
    // Quotes & Invoices
    devis: '/crm/quotes', quotes: '/crm/quotes', quote: '/crm/quotes',
    factures: '/crm/invoices', facture: '/crm/invoices', invoices: '/crm/invoices', invoice: '/crm/invoices',
    paiements: '/crm/payments', payments: '/crm/payments',
    // Emails & Messages
    mails: '/crm/mails', emails: '/crm/mails', email: '/crm/mails', mail: '/crm/mails',
    messages: '/crm/messages', messagerie: '/crm/messages',
    // Tasks & Activities
    taches: '/crm/tasks', tâches: '/crm/tasks', tasks: '/crm/tasks', task: '/crm/tasks',
    activites: '/crm/activities', activités: '/crm/activities', activities: '/crm/activities',
    // Catalog & Suppliers
    catalogue: '/crm/catalog', catalog: '/crm/catalog', prestations: '/crm/catalog',
    fournisseurs: '/crm/suppliers', prestataires: '/crm/suppliers', suppliers: '/crm/suppliers',
    // Bookings
    reservations: '/crm/bookings', réservations: '/crm/bookings', bookings: '/crm/bookings',
    // Documents
    documents: '/crm/documents', document: '/crm/documents',
    // Marketing & Collections
    marketing: '/crm/marketing', collections: '/crm/collections',
    // Analytics
    analytics: '/crm/analytics', statistiques: '/crm/analytics', stats: '/crm/analytics',
    // Settings & Team
    parametres: '/crm/settings', paramètres: '/crm/settings', settings: '/crm/settings', réglages: '/crm/settings',
    equipe: '/crm/team', équipe: '/crm/team', team: '/crm/team',
    // Legal-specific
    dossiers: '/crm/dossiers', dossier: '/crm/dossiers',
    jurisprudence: '/crm/jurisprudence',
    // Templates & Site Builder
    templates: '/crm/templates', modeles: '/crm/templates', modèles: '/crm/templates',
    'site-builder': '/crm/site-builder', site: '/crm/site-builder',
    // AI & Agent
    'agent-ia': '/crm/agent-ia', ia: '/crm/agent-ia', ai: '/crm/ai',
    changelog: '/crm/changelog',
    integrations: '/crm/integrations',
};

function resolveRoute(section: string): string {
    const key = section.toLowerCase().trim().replace(/\s+/g, '-');
    // Direct match
    if (ROUTE_MAP[key]) return ROUTE_MAP[key];
    // Fuzzy: find first key that's included in the input
    for (const [k, v] of Object.entries(ROUTE_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    // Fallback: try as-is
    return `/crm/${key}`;
}

function handleLocalFunctionCall(name: string, args: Record<string, any>): string | null {
    switch (name) {
        case 'navigate_to': {
            const section = args.section || 'dashboard';
            const path = resolveRoute(section);
            // Navigate INSTANTLY for optimistic UI response time
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('voice-agent:navigate', { detail: { path } }));
            }
            const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
            return `Navigation vers ${sectionName}.`;
        }
        default:
            return null; // → server call required
    }
}

/* ═══════════════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════════════ */
export function useVoiceAgent(options?: UseVoiceAgentOptions): UseVoiceAgentReturn {
    const { pageContext, vertical = 'travel' } = options || {};
    const { user, userProfile } = useAuth();
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [interimText, setInterimText] = useState('');
    const [micStatus, setMicStatus] = useState<DeviceStatus>('unknown');
    const [audioOutputStatus, setAudioOutputStatus] = useState<DeviceStatus>('unknown');

    /* ─── Audio Feedback (0 API cost) ─── */
    const playFeedbackSound = useCallback((type: 'success' | 'error' | 'action') => {
        if (typeof window === 'undefined') return;
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.08; // Very subtle
            if (type === 'success') { osc.frequency.value = 880; osc.type = 'sine'; }
            else if (type === 'error') { osc.frequency.value = 330; osc.type = 'triangle'; }
            else { osc.frequency.value = 660; osc.type = 'sine'; }
            osc.start();
            osc.stop(ctx.currentTime + (type === 'error' ? 0.25 : 0.12));
            setTimeout(() => ctx.close(), 500);
        } catch { /* audio not available */ }
    }, []);

    /* ─── Voice Action Audit Trail ─── */
    const logVoiceAction = useCallback(async (tool: string, args: Record<string, any>, result: string, success: boolean) => {
        try {
            let idToken = idTokenRef.current;
            if (!idToken && user) { idToken = await user.getIdToken(); idTokenRef.current = idToken; }
            if (!idToken) return;
            fetch('/api/crm/voice-data', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: '_audit_log', args: { tool, args, result: result.substring(0, 200), success, timestamp: new Date().toISOString() }, vertical }),
            }).catch(() => {}); // Fire-and-forget
        } catch { /* silent */ }
    }, [user, vertical]);

    const idTokenRef = useRef<string | null>(null);
    const tokenTimestampRef = useRef<number>(0);
    const recognitionRef = useRef<any>(null);
    const idCounterRef = useRef(0);
    const isPlayingRef = useRef(false);
    const resumeListeningRef = useRef<(() => void) | null>(null);
    const hasGreetedRef = useRef(false);
    const vocabRef = useRef<VoiceVocabulary | null>(null);
    const memoryRef = useRef<ConversationMemory>(createMemory());
    const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cachedApiKeyRef = useRef<string | null>(null);
    const IDLE_TIMEOUT_MS = 60_000; // 60 seconds
    // ── Stable refs to avoid stale closures in recognition callbacks ──
    const handleUserMessageRef = useRef<(text: string) => void>(() => {});
    const speakTextRef = useRef<(text: string) => void>(() => {});
    const lastSpokenTextRef = useRef<string>(''); // Track last spoken text for echo detection
    const speakIdRef = useRef<number>(0); // Track TTS requests to abort stale ones

    /* ─── Fetch real CRM data for a tool call ─── */
    const fetchVoiceData = useCallback(async (tool: string, args: Record<string, any>): Promise<{ text: string; action?: ActionResult }> => {
        try {
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken(true);
                idTokenRef.current = idToken;
            }
            if (!idToken) return { text: 'Non authentifié — veuillez vous reconnecter.' };

            const res = await fetch('/api/crm/voice-data', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool, args, vertical }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                return { text: `Erreur ${res.status} : ${errorBody.error || 'données indisponibles'}` };
            }
            const data = await res.json();
            if (data.error && !data.success) return { text: `Erreur : ${data.error}` };

            // WRITE actions
            if (data.success && data.action) {
                return { text: data.message || `Action effectuée avec succès.`, action: data.action as ActionResult };
            }

            // READ actions
            if (tool === 'get_upcoming_trips') {
                if (!data.trips?.length) return { text: 'Aucun voyage à venir pour le moment.' };
                return { text: data.trips.map((t: any) => `${t.destination} — ${t.clientName}`).join(' | ') };
            }
            if (tool === 'get_client_info') {
                if (!data.clients?.length) return { text: `Aucun client trouvé.` };
                return { text: data.clients.map((c: any) => `${c.name}${c.email ? ' (' + c.email + ')' : ''}`).join(' | ') };
            }
            if (tool === 'get_today_pipeline') {
                if (!data.leads?.length) return { text: 'Aucun lead actif récemment.' };
                return { text: data.leads.map((l: any) => `${l.clientName} (${l.stage})`).join(' | ') };
            }
            if (tool === 'get_recent_emails') {
                if (!data.emails?.length) return { text: 'Aucun email récent.' };
                return { text: data.emails.map((e: any) => `De ${e.from} : "${e.subject}"`).join(' | ') };
            }
            if (tool === 'get_quote_details') {
                if (!data.quotes?.length) return { text: `Aucun devis trouvé.` };
                return { text: data.quotes.map((q: any) => `${q.clientName} — ${q.destination}`).join(' | ') };
            }
            if (tool === 'get_dossiers') {
                if (!data.dossiers?.length) return { text: 'Aucun dossier actif.' };
                return { text: data.dossiers.map((d: any) => `${d.title} — ${d.client}`).join(' | ') };
            }
            if (tool === 'get_upcoming_deadlines') {
                if (!data.deadlines?.length) return { text: 'Aucune échéance.' };
                return { text: data.deadlines.map((d: any) => `${d.title} — priorité ${d.priority}`).join(' | ') };
            }
            if (tool === 'get_unpaid_invoices') {
                if (!data.invoices?.length) return { text: 'Aucune facture impayée.' };
                return { text: `Total impayé : ${data.total}€.` };
            }
            if (tool === 'search_catalog') {
                if (!data.catalog?.length) return { text: 'Aucune prestation trouvée dans le catalogue.' };
                return { text: data.catalog.map((c: any) => `${c.name} (${c.region || 'N/A'}) — ${c.sellPrice}€`).join(' | ') };
            }
            if (tool === 'search_crm') {
                return { text: data.summary || 'Aucun résultat.' };
            }
            if (tool === 'get_tasks') {
                return { text: data.summary || 'Aucune tâche.' };
            }
            if (tool === 'get_reservations') {
                return { text: data.summary || 'Aucune réservation.' };
            }
            if (tool === 'get_payments_summary') {
                return { text: data.summary || 'Données paiements indisponibles.' };
            }
            if (tool === 'get_unpaid_invoices') {
                if (!data.invoices?.length) return { text: 'Aucune facture impayée.' };
                return { text: `Total impayé : ${data.total}€.` };
            }
            // Generic fallback for tools that return data.message or data.summary
            const resultText = data.message || data.summary || 'Action effectuée.';
            return { text: resultText };
        } catch (e: any) {
            console.error('[VoiceAgent] fetchVoiceData error:', e);
            return { text: 'Désolé, erreur technique.' };
        }
    }, [vertical, user]);

    /* ─── TTS Playback via Google Cloud TTS ─── */
    // ── ANTI-OVERLAP: Kill ALL active speech sources ──
    const cancelAllSpeech = useCallback(() => {
        if (typeof window === 'undefined') return;
        speakIdRef.current += 1; // Abort any pending async TTS fetches
        // Kill browser TTS
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        // Kill custom audio element
        if ((window as any).__voiceAudio) {
            try {
                (window as any).__voiceAudio.pause();
                (window as any).__voiceAudio.currentTime = 0;
                (window as any).__voiceAudio = null;
            } catch {}
        }
        isPlayingRef.current = false;
    }, []);

    const speakText = useCallback(async (text: string) => {
        if (typeof window === 'undefined') return;
        
        // ── CRITICAL: Cancel any previous speech FIRST ──
        cancelAllSpeech();
        const currentSpeakId = speakIdRef.current;
        
        // Pause recognition during TTS to prevent echo (don't destroy it)
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
        }
        // Clear any pending speech captured before TTS — this is echo
        pendingSpeechRef.current = '';
        if (finalTimerRef.current) { clearTimeout(finalTimerRef.current); finalTimerRef.current = null; }
        
        setState('speaking');
        isPlayingRef.current = true;
        lastSpokenTextRef.current = text.toLowerCase().trim(); // Track for echo detection
        
        const cleanText = text
            .replace(/[#*_`>]/g, '').replace(/\\n/g, ' ')
            .replace(/⚡/g, '').replace(/\s+/g, ' ').trim();

        if (!cleanText) {
            isPlayingRef.current = false;
            // Go straight to listening if we should be listening, avoid flickering to idle
            if (wantListeningRef.current && recognitionRef.current) {
                setState('listening');
                setTimeout(() => { try { recognitionRef.current.start(); } catch {} }, 50);
            } else {
                setState('idle');
            }
            return;
        }

        try {
            // Always force-refresh the token to avoid 401 on expired tokens
            let idToken: string | null = null;
            if (user) {
                idToken = await user.getIdToken(true);
                idTokenRef.current = idToken;
            }

            const response = await fetch('/api/crm/tts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, vertical }),
            });

            // ── ANTI-OVERLAP: Abort if another speech request started while we were fetching ──
            if (currentSpeakId !== speakIdRef.current) {
                console.log(`[VoiceAgent] 🔇 Aborting stale TTS playback (${cleanText.substring(0, 30)}...)`);
                return;
            }

            if (!response.ok) throw new Error('TTS fetch failed');

            const blob = await response.blob();
            if (currentSpeakId !== speakIdRef.current) return;
            if (blob.size < 100) throw new Error('Empty audio');
            
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            (window as any).__voiceAudio = audio;

            audio.onended = () => {
                isPlayingRef.current = false;
                URL.revokeObjectURL(audioUrl);
                // Clear any echo captured during playback
                pendingSpeechRef.current = '';
                if (finalTimerRef.current) { clearTimeout(finalTimerRef.current); finalTimerRef.current = null; }
                
                // Check if a message was queued during playback
                const queued = pendingMessageRef.current;
                pendingMessageRef.current = null;
                
                if (queued && wantListeningRef.current) {
                    // Process the queued message after a brief delay
                    setState('thinking');
                    setTimeout(() => handleUserMessageRef.current(queued), 200);
                } else if (wantListeningRef.current && recognitionRef.current) {
                    setState('listening');
                    // ── ANTI-ECHO: Wait 400ms before restarting mic ──
                    setTimeout(() => {
                        pendingSpeechRef.current = ''; // Clear any captured echo
                        try { recognitionRef.current.start(); } catch {}
                    }, 400);
                } else {
                    setState('idle');
                }
            };

            audio.onerror = () => {
                isPlayingRef.current = false;
                URL.revokeObjectURL(audioUrl);
                if (wantListeningRef.current && recognitionRef.current) {
                    setState('listening');
                    setTimeout(() => { try { recognitionRef.current.start(); } catch {} }, 50);
                } else {
                    setState('idle');
                }
            };

            await audio.play();
            
        } catch (err) {
            console.error('[Voice] TTS error:', err);
            isPlayingRef.current = false;
            if (wantListeningRef.current && recognitionRef.current) {
                setState('listening');
                setTimeout(() => { try { recognitionRef.current.start(); } catch {} }, 50);
            } else {
                setState('idle');
            }
        }
    }, [vertical, user]);

    /* ─── HTTP LLM Processing ─── */
    const isProcessingRef = useRef(false);
    
    const handleUserMessage = useCallback(async (text: string) => {
        console.log('[VoiceAgent] ═══ CHECKPOINT 1: handleUserMessage called with:', text.substring(0, 50));
        if (!text.trim()) return;
        // ── GUARD: queue message if TTS is playing (will be processed after TTS ends) ──
        if (isPlayingRef.current) {
            pendingMessageRef.current = text;
            return;
        }
        // ── GUARD: reject if already processing ──
        if (isProcessingRef.current) {
            console.log('[VoiceAgent] ❌ BLOCKED: isProcessingRef is true — skipping');
            return;
        }
        setState('thinking');
        isProcessingRef.current = true;
        
        // Safety timeout: reset processing after 15s to prevent permanent hang
        const safetyTimeout = setTimeout(() => {
            if (isProcessingRef.current) {
                console.warn('[VoiceAgent] Safety timeout — resetting processing flag');
                isProcessingRef.current = false;
                if (wantListeningRef.current && recognitionRef.current) {
                    setState('listening');
                    try { recognitionRef.current.start(); } catch {}
                } else {
                    setState('idle');
                }
            }
        }, 15000);
        
        // Resolve pronouns using conversation memory ("le client" → "Marc Dupont")
        const resolvedText = resolvePronouns(text, memoryRef.current);
        if (resolvedText !== text) {
            console.log(`[VoiceAgent] Pronoun resolved: "${text}" → "${resolvedText}"`);
        }
        const userMsg: TranscriptEntry = { id: `user-${++idCounterRef.current}`, role: 'user', text: resolvedText, timestamp: Date.now() };
        setTranscript(prev => [...prev, userMsg]);

        const fullName = userProfile?.displayName || user?.displayName || 'Utilisateur';
        const firstName = fullName.split(' ')[0];
        const isLegal = vertical === 'legal';
        const tools = isLegal ? LEGAL_TOOLS : TRAVEL_TOOLS;
        const rawPrompt = (isLegal ? buildLegalPrompt(firstName, pageContext) : buildTravelPrompt(firstName, pageContext))
            + getPageContextHint(pageContext);
        const systemPrompt = getEconomySystemPrompt(rawPrompt);
        
        // ── ECONOMY: Check cache before calling Gemini ──
        const cached = getCachedResponse(resolvedText);
        if (cached) {
            console.log('[VoiceAgent] 💰 Cache hit — zero tokens used');
            const modelMsg: TranscriptEntry = { id: `model-${++idCounterRef.current}`, role: 'model', text: cached, timestamp: Date.now() };
            setTranscript(prev => [...prev, modelMsg]);
            clearTimeout(safetyTimeout);
            isProcessingRef.current = false;
            // Let speakText handle the full state flow (speaking → listening/idle)
            speakTextRef.current(cached);
            return;
        }
        
        // ── ECONOMY: Check budget ──
        const budget = getBudgetStatus();
        if (budget.isExhausted) {
            const exhaustedMsg = '⚠️ Budget de session épuisé. Reconnecte-toi pour continuer.';
            const modelMsg: TranscriptEntry = { id: `model-${++idCounterRef.current}`, role: 'model', text: exhaustedMsg, timestamp: Date.now() };
            setTranscript(prev => [...prev, modelMsg]);
            speakTextRef.current(exhaustedMsg);
            clearTimeout(safetyTimeout);
            isProcessingRef.current = false;
            setState('idle');
            return;
        }

        try {
            // ── SPEED: Cache token for 5 min — avoids network round-trip on every call ──
            let idToken: string | null = idTokenRef.current;
            const tokenAge = Date.now() - (tokenTimestampRef.current || 0);
            if (!idToken || tokenAge > 5 * 60 * 1000) {
                if (user) {
                    idToken = await user.getIdToken(true);
                    idTokenRef.current = idToken;
                    tokenTimestampRef.current = Date.now();
                }
            }

            // ── Cache API key in ref — only fetch once per session ──
            if (!cachedApiKeyRef.current) {
                const tokenRes = await fetch('/api/crm/voice-token', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                });
                const { apiKey } = await tokenRes.json();
                if (!apiKey) throw new Error("Clé API introuvable");
                cachedApiKeyRef.current = apiKey;
            }

            const ai = new GoogleGenAI({ apiKey: cachedApiKeyRef.current! });
            
            const historyBase = transcript
                .filter(t => !t.text.startsWith('⚡'))
                .slice(-4); // Keep last 4 for speed
            
            const rawContents = [...historyBase, userMsg].map(t => ({
                role: (t.role === 'model' ? 'model' : 'user') as 'model' | 'user',
                parts: [{ text: t.text.substring(0, 150) }] // Shorter = faster
            }));
            
            // Gemini requires strict user/model alternation — merge consecutive same-role messages
            const contents: typeof rawContents = [];
            for (const msg of rawContents) {
                if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
                    // Merge: append text to previous same-role message
                    contents[contents.length - 1].parts[0].text += ' ' + msg.parts[0].text;
                } else {
                    contents.push({ ...msg });
                }
            }
            // Ensure first message is 'user' (Gemini constraint)
            while (contents.length > 0 && contents[0].role === 'model') {
                contents.shift();
            }
            // Must have at least the user message
            if (contents.length === 0) {
                contents.push({ role: 'user', parts: [{ text }] });
            }
            
            console.log('[VoiceAgent] ═══ CHECKPOINT 3: Sending', contents.length, 'messages to Gemini with', tools.length, 'tools');

            // Gemini 2.5 Flash-Lite — fastest model for low-latency tool routing
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents,
                config: {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    tools: [{ functionDeclarations: tools as any }],
                    temperature: 0.1,
                    maxOutputTokens: 150,
                }
            });

            // Safe text extraction (response.text throws when only functionCall parts exist)
            const modelParts = response.candidates?.[0]?.content?.parts || [];
            const toolCalls = response.functionCalls || [];
            let finalResponseText = '';
            try { finalResponseText = response.text || ''; } catch { /* only functionCalls, no text */ }

            console.log('[VoiceAgent] ═══ CHECKPOINT 4: Gemini response received — toolCalls:', toolCalls.length, 'textLen:', finalResponseText.length);

            // Handle functional tool calls
            if (toolCalls.length > 0) {
                const toolResponses = [];
                for (const tc of toolCalls) {
                    const funcName = tc.name || '';
                    try {
                        const localResult = handleLocalFunctionCall(funcName, tc.args || {});
                        let resultText: string;
                        let action: ActionResult | undefined;
                        if (localResult !== null) {
                            resultText = localResult;
                        } else {
                            const fetched = await fetchVoiceData(funcName, tc.args || {});
                            console.log(`[VoiceAgent] ═══ CHECKPOINT 5: Tool ${funcName} → result:`, fetched.text.substring(0, 80));
                            resultText = fetched.text;
                            action = fetched.action;
                        }
                        
                        setTranscript(prev => [...prev, {
                            id: `tool-${++idCounterRef.current}`,
                            role: 'model',
                            text: `⚡ ${resultText}`,
                            timestamp: Date.now(),
                            action,
                        }]);
                        
                        // Audio feedback + audit trail
                        playFeedbackSound(action ? 'success' : 'action');
                        logVoiceAction(funcName, tc.args || {}, resultText, true);
                        
                        // Update conversation memory (tracks "le client" → actual name)
                        memoryRef.current = updateMemory(memoryRef.current, funcName, tc.args || {}, resultText);
                        
                        // Smart follow-up suggestion
                        const followUp = getFollowUpSuggestion(funcName, tc.args || {}, resultText);
                        if (followUp) {
                            resultText += ` ${followUp.text}`;
                        }
                        
                        if (action?.previewUrl && typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('voice-agent:action-created', { detail: action }));
                        }
                        toolResponses.push({ id: tc.id, name: funcName, response: { result: resultText } });
                    } catch (toolErr: any) {
                        console.error(`[VoiceAgent] Tool ${funcName} failed:`, toolErr);
                        toolResponses.push({ id: tc.id, name: funcName, response: { result: `Erreur: ${toolErr.message || 'échec'}` } });
                    }
                }

                // ── SPEED: Skip follow-up Gemini call for tools with clear results ──
                const FAST_TOOLS = new Set(['navigate_to', 'open_record', 'add_note', 'dictate_note', 'batch_notify', 'set_goal', 'send_whatsapp', 'mark_invoice_paid', 'create_task', 'smart_reminder', 'track_expense', 'set_workflow_rule']);
                const allFast = toolCalls.every(tc => FAST_TOOLS.has(tc.name || ''));
                
                if (!allFast) {
                // Follow up — NO tools here to prevent infinite tool-call loops
                try {
                    const followUp = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-lite',
                        contents: [
                            ...contents,
                            { role: 'model', parts: modelParts },
                            { role: 'user', parts: toolResponses.map(tr => ({ functionResponse: { name: tr.name, response: tr.response } })) as any }
                        ],
                        config: {
                            systemInstruction: { parts: [{ text: systemPrompt + '\nRésume brièvement le résultat des actions. Sois concis.' }] },
                            maxOutputTokens: 120,
                        }
                    });
                    
                    try { if (followUp.text) finalResponseText = followUp.text; } catch { /* safe */ }
                    console.log('[VoiceAgent] Follow-up response:', finalResponseText ? finalResponseText.substring(0, 80) : '(empty)');
                } catch (followUpErr: any) {
                    console.warn('[VoiceAgent] Follow-up failed:', followUpErr.message);
                }
                } else {
                    console.log('[VoiceAgent] ⚡ Fast-path: skipping follow-up LLM call');
                }
                
                // Fallback: if follow-up returned nothing, use tool results directly
                if (!finalResponseText) {
                    finalResponseText = toolResponses.map(tr => tr.response.result).join('. ');
                    console.log('[VoiceAgent] Using tool results as fallback:', finalResponseText.substring(0, 80));
                }
            }

            if (finalResponseText) {
                console.log('[VoiceAgent] ═══ CHECKPOINT 6: Final response to speak:', finalResponseText.substring(0, 80));
                // ── ECONOMY: Cache response + track tokens ──
                cacheResponse(resolvedText, finalResponseText);
                trackTokenUsage(Math.ceil(resolvedText.length / 3), Math.ceil(finalResponseText.length / 3)); // ~1 token per 3 chars
                
                setTranscript(prev => [...prev, {
                    id: `model-${++idCounterRef.current}`,
                    role: 'model',
                    text: finalResponseText,
                    timestamp: Date.now()
                }]);
                // ── Route ALL responses to ElevenLabs TTS for consistent high quality ──
                speakText(finalResponseText);
            } else {
                // No response text — resume listening without going to idle
                if (wantListeningRef.current && recognitionRef.current) {
                    setState('listening');
                    setTimeout(() => { try { recognitionRef.current.start(); } catch {} }, 50);
                } else {
                    setState('idle');
                }
            }

        } catch (err: any) {
            console.error('[VoiceAgent] ═══ CHECKPOINT 7: AI ERROR:', err.message || err);
            const errorMsg = "Désolé, une erreur s'est produite. Réessayez.";
            setTranscript(prev => [...prev, {
                id: `model-${++idCounterRef.current}`,
                role: 'model',
                text: errorMsg,
                timestamp: Date.now()
            }]);
            // Speak the error so the user knows, and ONeended will auto-resume listening
            speakText(errorMsg);
        } finally {
            clearTimeout(safetyTimeout);
            isProcessingRef.current = false;
            console.log('[VoiceAgent] ═══ CHECKPOINT 8: Processing complete, flag reset');
        }
    }, [transcript, user, userProfile, vertical, pageContext, fetchVoiceData, speakText]);

    // ── Keep refs synced to latest versions (breaks stale closure chain) ──
    useEffect(() => { handleUserMessageRef.current = handleUserMessage; }, [handleUserMessage]);
    useEffect(() => { speakTextRef.current = speakText; }, [speakText]);

    // Track whether we WANT recognition alive (vs intentional stop)
    const wantListeningRef = useRef(false);
    // Debounce timer so we wait for user to finish their sentence
    const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSpeechRef = useRef('');
    const pendingMessageRef = useRef<string | null>(null);
    const stopRef = useRef<() => void>(() => {});

    // ── Idle timeout: auto-stop after 60s of inactivity ──
    const resetIdleTimer = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = setTimeout(() => {
            console.log('[Voice] Idle timeout — auto-stopping');
            stopRef.current();
        }, IDLE_TIMEOUT_MS);
    }, []);

    /* ─── STT: Continuous mic — no stop/restart cycles ─── */
    const start = useCallback(async () => {
        if (state === 'speaking' || state === 'thinking') return;
        
        // ── Initial greeting on first session ──
        // ── Smart briefing on first session — analyzes CRM before greeting ──
        if (!hasGreetedRef.current) {
            hasGreetedRef.current = true;
            initSessionBudget(); // Reset economy budget on new session
            const fullName = userProfile?.displayName || user?.displayName || '';
            const firstName = fullName.split(' ')[0] || 'Laurent';
            const cap = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            
            // Simple greeting — vocabulary fetch only (no daily recap)
            let greeting = `Bonjour ${cap}, comment puis-je vous aider ?`;
            try {
                let idToken = idTokenRef.current;
                if (!idToken && user) {
                    idToken = await user.getIdToken(true);
                    idTokenRef.current = idToken;
                }
                
                // Fetch vocabulary only (for auto-correction)
                const vocabData = await fetchVocabulary(idToken || '');
                
                // Cache vocabulary for auto-correction
                if (vocabData.allTerms.length > 0) {
                    vocabRef.current = vocabData;
                    console.log(`[VoiceAgent] Vocabulary loaded: ${vocabData.allTerms.length} terms`);
                }
            } catch (e) {
                console.warn('[VoiceAgent] Vocabulary fetch failed');
            }
            
            setTranscript([{ id: `model-${++idCounterRef.current}`, role: 'model', text: greeting, timestamp: Date.now() }]);
            speakTextRef.current(greeting);
        }

        // If recognition already running, don't create a new one
        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { /* already started */ }
            setState('listening');
            return;
        }
        
        const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionApi) {
            setError("Navigateur non supporté (essayez Chrome).");
            setState('error');
            return;
        }

        try {
            setState('connecting');
            
            // Get mic with hardware echo cancellation
            await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            setMicStatus('ok');
            setAudioOutputStatus('ok');

            const recognition = new SpeechRecognitionApi();
            recognition.lang = 'fr-FR';
            recognition.interimResults = true;
            recognition.continuous = true;        // ← KEY FIX: stays alive, no restart gaps
            recognition.maxAlternatives = 1;

            recognition.onstart = () => { setState('listening'); };

            recognition.onresult = (event: any) => {
                // ── ANTI-ECHO: Don't process input while AI is speaking ──
                if (isPlayingRef.current) {
                    console.log('[VoiceAgent] 🔇 Ignoring speech during TTS playback');
                    return;
                }
                
                let finalSpeech = '';
                let interimSpeech = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalSpeech += event.results[i][0].transcript;
                    } else {
                        interimSpeech += event.results[i][0].transcript;
                    }
                }
                
                // Show interim text in real-time (what the mic is capturing)
                if (interimSpeech) {
                    setInterimText(interimSpeech);
                    setAudioLevel(0.3 + Math.random() * 0.4);
                }
                if (finalSpeech) {
                    setInterimText(''); // Clear interim when final
                    setAudioLevel(0.3 + Math.random() * 0.4);
                }

                if (finalSpeech) {
                    // Auto-correct using CRM vocabulary
                    let speechToProcess = finalSpeech;
                    if (vocabRef.current && vocabRef.current.allTerms.length > 0) {
                        const { corrected, corrections: corr } = correctTranscription(finalSpeech, vocabRef.current);
                        if (corr.length > 0) {
                            console.log('[VoiceAgent] Auto-corrected:', corr.map(c => `"${c.original}" → "${c.corrected}"`).join(', '));
                            speechToProcess = corrected;
                        }
                    }
                    
                    // Check confidence score (from first result)
                    const confidence = event.results[event.resultIndex]?.[0]?.confidence || 1;
                    const confAnalysis = analyzeConfidence(confidence);
                    if (confAnalysis.action === 'retry') {
                        setTranscript(prev => [...prev, {
                            id: `system-${++idCounterRef.current}`,
                            role: 'model',
                            text: confAnalysis.message || 'Pouvez-vous répéter ?',
                            timestamp: Date.now(),
                        }]);
                        return;
                    }
                    // Accumulate final speech (user may speak in multiple phrases)
                    pendingSpeechRef.current += ' ' + speechToProcess;
                    resetIdleTimer(); // User is active — reset the idle timer
                    
                    // ── SPEED: 500ms debounce — wait for user to finish speaking ──
                    if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
                    finalTimerRef.current = setTimeout(() => {
                        const trimmed = pendingSpeechRef.current.trim();
                        pendingSpeechRef.current = '';
                        if (trimmed.length < 3) return;
                        
                        // ── ANTI-ECHO: Check if captured text is just echo of last spoken text ──
                        const lastSpoken = lastSpokenTextRef.current;
                        if (lastSpoken && trimmed.length > 3) {
                            const normalize = (s: string) => s.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç\s]/g, '').trim();
                            const normTrimmed = normalize(trimmed);
                            const normSpoken = normalize(lastSpoken);
                            // Check if captured text is a substring of or very similar to last spoken text
                            if (normSpoken.includes(normTrimmed) || normTrimmed.includes(normSpoken) ||
                                (normTrimmed.length > 5 && normSpoken.startsWith(normTrimmed.substring(0, Math.floor(normTrimmed.length * 0.5))))) {
                                console.log('[VoiceAgent] 🔇 Echo detected, ignoring:', trimmed.substring(0, 40));
                                return;
                            }
                        }
                        
                        setAudioLevel(0);
                        handleUserMessageRef.current(trimmed);
                    }, 500);
                }
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'aborted') return;
                if (event.error === 'no-speech') {
                    // No speech detected — recognition may have auto-stopped, restart silently
                    return;
                }
                if (event.error === 'network') return;
                console.error('[Voice] STT error:', event.error);
                setError("Erreur micro: " + event.error);
                setState('error');
                setMicStatus('unavailable');
                setAudioLevel(0);
            };

            recognition.onend = () => {
                // continuous=true should keep it alive, but browsers sometimes kill it
                // Restart ONLY if we still want to be listening
                if (!wantListeningRef.current) return;
                if (isPlayingRef.current) return;
                // Auto-restart after a tiny delay
                setTimeout(() => {
                    if (wantListeningRef.current && !isPlayingRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                            // Don't overwrite the thinking visual state if we are currently analyzing
                            if (!isProcessingRef.current) {
                                setState('listening');
                            }
                        } catch { /* already running */ }
                    }
                }, 100);
            };

            wantListeningRef.current = true;
            recognitionRef.current = recognition;
            resetIdleTimer(); // Start the 60s idle countdown
            recognition.start();

        } catch (err: any) {
            console.error('[Voice] Mic error:', err);
            setError("Accès microphone refusé.");
            setState('error');
            setMicStatus('denied');
        }
    // ── start() only depends on state + user (NOT handleUserMessage/speakText) ──
    // This prevents recognition callbacks from going stale after transcript updates
    }, [state, user, userProfile, resetIdleTimer]);

    const stop = useCallback(() => {
        wantListeningRef.current = false;
        if (finalTimerRef.current) { clearTimeout(finalTimerRef.current); finalTimerRef.current = null; }
        if (idleTimeoutRef.current) { clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = null; }
        pendingSpeechRef.current = '';
        if (recognitionRef.current) {
            try { 
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
        }
        // Stop ALL playing audio (browser TTS + custom audio element)
        cancelAllSpeech();
        isProcessingRef.current = false;
        setAudioLevel(0);
        setState('idle');
        hasGreetedRef.current = false;
        cachedApiKeyRef.current = null;
        idTokenRef.current = null;
        vocabRef.current = null; // Clear vocabulary for fresh load next session
        memoryRef.current = createMemory(); // Reset conversation memory

        // Generate session summary
        setTranscript(currentTranscript => {
            const toolActions = currentTranscript.filter(t => t.text.startsWith('⚡'));
            const userMessages = currentTranscript.filter(t => t.role === 'user');
            
            if (toolActions.length > 0) {
                const summary = `📊 Session terminée — ${toolActions.length} action(s), ${userMessages.length} commande(s) vocale(s).`;
                return [...currentTranscript, {
                    id: `summary-${Date.now()}`,
                    role: 'model' as const,
                    text: summary,
                    timestamp: Date.now(),
                }];
            }
            return currentTranscript;
        });
        setTranscript(currentTranscript => {
            if (currentTranscript.length > 2 && idTokenRef.current) {
                fetch('/api/crm/analyze-conversation', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${idTokenRef.current}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transcript: currentTranscript, vertical }),
                }).catch(console.error);
            }
            return currentTranscript; // return unchanged
        });
        
    }, [vertical]);

    // Keep stopRef in sync so idle timeout callback calls the latest stop()
    useEffect(() => { stopRef.current = stop; }, [stop]);

    const sendText = useCallback((text: string) => {
        handleUserMessage(text);
    }, [handleUserMessage]);
    
    // resumeListeningRef is no longer needed — recognition stays alive with continuous=true

    // Force stop everything on unmount
    useEffect(() => {
        return () => {
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch {}
                recognitionRef.current = null;
            }
            if (typeof window !== 'undefined' && (window as any).__voiceAudio) {
                try { (window as any).__voiceAudio.pause(); (window as any).__voiceAudio = null; } catch {}
            }
        };
    }, []);

    return {
        state, transcript, start, stop, sendText,
        isListening: state === 'listening',
        isSpeaking: state === 'speaking',
        error, audioLevel, interimText, micStatus, audioOutputStatus,
    };
}
