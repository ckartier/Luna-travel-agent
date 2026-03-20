/**
 * Voice Context Engine
 * 
 * 1. Smart Follow-ups — suggests the logical next action after each tool call
 * 2. Conversation Memory — resolves "le client", "ce voyage" to last mentioned entity
 * 3. Page-Aware Context — adapts AI behavior based on current CRM page
 */

// ─── Smart Follow-up Suggestions ───
// After each action, suggest what the user might want to do next

interface FollowUpSuggestion {
    text: string;        // What the AI says
    voiceHint: string;   // Command the user can say
}

const FOLLOW_UP_MAP: Record<string, (args: any, result: string) => FollowUpSuggestion | null> = {
    create_client_and_quote: (args) => ({
        text: `Voulez-vous créer un voyage pour ${args.firstName || 'ce client'} ?`,
        voiceHint: `Dis "crée un voyage pour ${args.firstName || 'ce client'}"`,
    }),
    create_quote: (args) => ({
        text: `Voulez-vous envoyer ce devis au client ?`,
        voiceHint: `Dis "envoie le devis"`,
    }),
    create_trip: (args) => ({
        text: `Voulez-vous ajouter des prestations à ce voyage ?`,
        voiceHint: `Dis "ajoute [prestation] au voyage"`,
    }),
    create_lead: (args) => ({
        text: `Voulez-vous contacter ${args.clientName || 'ce lead'} ?`,
        voiceHint: `Dis "envoie un WhatsApp à ${args.clientName || 'ce lead'}"`,
    }),
    mark_invoice_paid: () => ({
        text: `Voulez-vous enregistrer le paiement ?`,
        voiceHint: `Dis "enregistre un paiement"`,
    }),
    send_whatsapp: () => null, // No follow-up needed
    navigate_to: () => null,
    open_record: () => null,
    search_crm: (args, result) => 
        result.includes('client') ? {
            text: `Voulez-vous ouvrir la fiche ?`,
            voiceHint: `Dis "ouvre [nom]"`,
        } : null,
    prepare_trip: (args) => ({
        text: `Les tâches ont été créées. Voulez-vous voir le voyage ?`,
        voiceHint: `Dis "ouvre le voyage"`,
    }),
    get_planning: () => ({
        text: `Voulez-vous préparer un de ces voyages ?`,
        voiceHint: `Dis "prépare le voyage de [client]"`,
    }),
    get_monthly_revenue: (_, result) =>
        result.includes('impayée') ? {
            text: `Des factures sont impayées. Voulez-vous les voir ?`,
            voiceHint: `Dis "factures impayées"`,
        } : null,
    morning_report: () => ({
        text: `Voulez-vous traiter le point le plus urgent ?`,
        voiceHint: `Dis "mes tâches" ou "planning du jour"`,
    }),
    close_deal: (args) => ({
        text: `Deal clos ! Voulez-vous voir le voyage créé ?`,
        voiceHint: `Dis "ouvre le voyage"`,
    }),
    follow_up_client: (args) => ({
        text: `Voulez-vous contacter ce client ?`,
        voiceHint: `Dis "envoie un WhatsApp à ${args.clientName || 'ce client'}"`,
    }),
    compare_revenue: () => ({
        text: `Voulez-vous voir le classement des clients ?`,
        voiceHint: `Dis "meilleurs clients"`,
    }),
    top_clients: () => null, // No obvious follow-up
    add_note: () => null,
    suggest_prestation: (args) => ({
        text: `Voulez-vous ajouter une de ces prestations au voyage ?`,
        voiceHint: `Dis "ajoute [nom] au voyage"`,
    }),
    batch_notify: () => ({
        text: `Les tâches de notification ont été créées. Voulez-vous les voir ?`,
        voiceHint: `Dis "mes tâches"`,
    }),
    revenue_forecast: () => ({
        text: `Voulez-vous voir le détail des factures ?`,
        voiceHint: `Dis "factures impayées" ou "compare le CA"`,
    }),
    detect_duplicates: () => ({
        text: `Voulez-vous ouvrir les contacts pour les nettoyer ?`,
        voiceHint: `Dis "va aux clients"`,
    }),
    generate_proposal: (args) => ({
        text: `Proposition créée ! Voulez-vous l'ouvrir ?`,
        voiceHint: `Dis "ouvre le voyage"`,
    }),
    draft_email: (args) => ({
        text: `Email rédigé. Voulez-vous l'envoyer ?`,
        voiceHint: `Dis "envoie l'email à ${args.clientName || 'ce client'}"`,
    }),
    client_value: (args) => ({
        text: `Voulez-vous voir la fiche du client ?`,
        voiceHint: `Dis "ouvre ${args.clientName || 'le client'}"`,
    }),
    seasonality: () => null,
    dictate_note: () => null,
    kpi_dashboard: () => ({
        text: `Voulez-vous fixer un objectif ?`,
        voiceHint: `Dis "objectif 30000 euros ce mois"`,
    }),
    set_goal: () => ({
        text: `Objectif enregistré. Vérifiez-le quand vous voulez.`,
        voiceHint: `Dis "vérifie l'objectif"`,
    }),
    check_goal: () => null,
    data_quality: () => null,
    segment_clients: (_, result) =>
        result.includes('À risque') ? {
            text: `Des clients sont à risque. Voulez-vous les contacter ?`,
            voiceHint: `Dis "fais le suivi de [client]"`,
        } : null,
    smart_reminder: () => null,
    voice_history: () => null,
    auto_tag: () => ({
        text: `Voulez-vous voir les contacts tagués ?`,
        voiceHint: `Dis "va aux clients"`,
    }),
    track_expense: () => ({
        text: `Voulez-vous voir le total des dépenses ?`,
        voiceHint: `Dis "KPIs"`,
    }),
    set_workflow_rule: () => null,
    profit_analysis: () => null,
    bulk_update: () => null,
    narrate_dashboard: () => ({
        text: `Voulez-vous traiter un point en particulier ?`,
        voiceHint: `Dis "mes tâches" ou "factures impayées"`,
    }),
    gamification_status: () => ({
        text: `Voulez-vous voir le défi du jour ?`,
        voiceHint: `Dis "défi du jour"`,
    }),
    daily_challenge: () => null,
    predict_churn: () => ({
        text: `Voulez-vous relancer un client à risque ?`,
        voiceHint: `Dis "fais le suivi de [client]"`,
    }),
    pipeline_coach: () => null,
    smart_schedule: () => null,
    save_macro: () => null,
    run_macro: () => null,
    cross_sell: () => ({
        text: `Voulez-vous ajouter une de ces prestations ?`,
        voiceHint: `Dis "ajoute [prestation] au voyage"`,
    }),
    client_health: () => null,
    compare_clients: () => null,
    apply_template: () => ({
        text: `Voulez-vous envoyer ce devis ?`,
        voiceHint: `Dis "envoie le devis"`,
    }),
    commission_tracker: () => null,
    supplier_score: () => null,
    detect_anomalies: (_, result) =>
        result.includes('anomalie') ? {
            text: `Voulez-vous corriger les anomalies ?`,
            voiceHint: `Dis "qualité des données" pour plus de détails`,
        } : null,
    auto_followup: () => null,
    client_timeline: () => null,
    conversion_funnel: () => ({
        text: `Voulez-vous voir les deals bloqués ?`,
        voiceHint: `Dis "coaching pipeline"`,
    }),
    revenue_attribution: () => null,
    set_preference: () => null,
};

export function getFollowUpSuggestion(tool: string, args: Record<string, any>, result: string): FollowUpSuggestion | null {
    const handler = FOLLOW_UP_MAP[tool];
    if (!handler) return null;
    return handler(args, result);
}

// ─── Conversation Memory ───
// Tracks the last mentioned entities so "le client", "ce voyage" resolve correctly

export interface ConversationMemory {
    lastClientName: string | null;
    lastTripDestination: string | null;
    lastPrestationName: string | null;
    lastInvoiceId: string | null;
    lastActionType: string | null;
}

export function createMemory(): ConversationMemory {
    return {
        lastClientName: null,
        lastTripDestination: null,
        lastPrestationName: null,
        lastInvoiceId: null,
        lastActionType: null,
    };
}

export function updateMemory(memory: ConversationMemory, tool: string, args: Record<string, any>, result: string): ConversationMemory {
    const updated = { ...memory, lastActionType: tool };

    // Extract client name from args or result
    if (args.clientName) updated.lastClientName = args.clientName;
    else if (args.firstName) updated.lastClientName = `${args.firstName} ${args.lastName || ''}`.trim();
    else if (args.recipientName) updated.lastClientName = args.recipientName;

    // Extract destination
    if (args.destination) updated.lastTripDestination = args.destination;

    // Extract prestation
    if (args.prestationName) updated.lastPrestationName = args.prestationName;

    return updated;
}

/**
 * Resolve pronouns in user speech using conversation memory.
 * "le client" → last mentioned client name
 * "ce voyage" → last mentioned trip destination
 */
export function resolvePronouns(text: string, memory: ConversationMemory): string {
    let resolved = text;

    // Client pronouns
    if (memory.lastClientName) {
        resolved = resolved
            .replace(/\b(le client|ce client|du client|au client|pour le client|de ce client)\b/gi, memory.lastClientName)
            .replace(/\b(lui|son|sa)\b/gi, (match) => match); // Keep these — too ambiguous
    }

    // Trip pronouns
    if (memory.lastTripDestination) {
        resolved = resolved
            .replace(/\b(ce voyage|le voyage|du voyage|au voyage)\b/gi, `le voyage ${memory.lastTripDestination}`);
    }

    // Prestation pronouns
    if (memory.lastPrestationName) {
        resolved = resolved
            .replace(/\b(cette prestation|la prestation)\b/gi, memory.lastPrestationName);
    }

    return resolved;
}

// ─── Page-Aware Context ───
// Enhance the system prompt based on current CRM page

export function getPageContextHint(pageContext?: string): string {
    if (!pageContext) return '';
    
    const page = pageContext.toLowerCase();
    
    if (page.includes('/clients') || page.includes('/contacts')) {
        return '\nL\'utilisateur est sur la page CLIENTS. Priorise les actions liées aux clients (ouvrir fiche, créer client, chercher contact).';
    }
    if (page.includes('/trips')) {
        if (page.includes('/itinerary')) {
            return '\nL\'utilisateur est sur un ITINÉRAIRE. Priorise: ajouter prestation, modifier jour, chercher dans catalogue.';
        }
        return '\nL\'utilisateur est sur la page VOYAGES. Priorise les actions voyage (créer voyage, préparer voyage, chercher destination).';
    }
    if (page.includes('/pipeline') || page.includes('/leads')) {
        return '\nL\'utilisateur est sur le PIPELINE. Priorise: créer lead, mettre à jour statut, contacter prospect.';
    }
    if (page.includes('/invoices') || page.includes('/factures')) {
        return '\nL\'utilisateur est sur les FACTURES. Priorise: marquer payée, chercher facture, enregistrer paiement.';
    }
    if (page.includes('/quotes') || page.includes('/devis')) {
        return '\nL\'utilisateur est sur les DEVIS. Priorise: créer devis, envoyer devis, changer statut.';
    }
    if (page.includes('/catalog') || page.includes('/catalogue')) {
        return '\nL\'utilisateur est sur le CATALOGUE. Priorise: chercher prestation, ouvrir fiche, ajouter au voyage.';
    }
    if (page.includes('/suppliers') || page.includes('/prestataires')) {
        return '\nL\'utilisateur est sur les PRESTATAIRES. Priorise: chercher prestataire, appeler, envoyer WhatsApp.';
    }
    if (page.includes('/planning')) {
        return '\nL\'utilisateur est sur le PLANNING. Priorise: planning du jour, préparer voyage, vérifier réservations.';
    }
    if (page.includes('/dashboard') || page === '/crm') {
        return '\nL\'utilisateur est sur le DASHBOARD. Priorise: rapport matinal, résumé CA, tâches du jour.';
    }
    if (page.includes('/marketing')) {
        return '\nL\'utilisateur est sur la page MARKETING. Priorise: campagnes, envoi email, statistiques.';
    }
    
    return '';
}
