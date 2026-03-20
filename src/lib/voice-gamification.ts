/* ═══════════════════════════════════════════════════
   voice-gamification.ts — XP, Levels, Achievements, Streaks
   ═══════════════════════════════════════════════════ */

// ─── XP VALUES per tool category ───
export const XP_TABLE: Record<string, number> = {
    // CRUD — basic actions
    create_client: 10,
    create_quote: 15,
    create_trip: 20,
    create_client_and_quote: 25,
    create_task: 5,
    create_invoice: 15,
    create_lead: 10,
    create_email_draft: 10,
    
    // Updates
    update_client: 5,
    update_lead_stage: 5,
    update_quote_status: 10,
    mark_invoice_paid: 15,
    complete_task: 10,
    add_note_to_client: 5,
    add_note: 5,
    add_prestation_to_trip: 10,
    assign_supplier: 15,
    record_payment: 15,
    
    // Communication
    send_whatsapp: 10,
    send_email: 10,
    
    // Mega-Actions — bonus XP
    close_deal: 50,
    prepare_trip: 30,
    generate_proposal: 40,
    follow_up_client: 20,
    batch_notify: 25,
    
    // Analytics — reward exploration
    morning_report: 15,
    compare_revenue: 10,
    top_clients: 10,
    revenue_forecast: 15,
    kpi_dashboard: 10,
    profit_analysis: 15,
    narrate_dashboard: 20,
    segment_clients: 15,
    seasonality: 10,
    client_value: 10,
    data_quality: 10,
    detect_duplicates: 10,
    
    // Smart actions
    smart_reminder: 10,
    draft_email: 15,
    dictate_note: 5,
    auto_tag: 20,
    track_expense: 5,
    set_workflow_rule: 20,
    bulk_update: 25,
    
    // Navigation — small XP
    navigate_to: 2,
    open_record: 2,
    search_crm: 3,
    search_catalog: 3,
    suggest_prestation: 5,
    voice_history: 2,
    
    // Read-only
    get_upcoming_trips: 3,
    get_client_info: 3,
    get_today_pipeline: 3,
    get_recent_emails: 3,
    get_quote_details: 3,
    get_reservations: 3,
    get_payments_summary: 3,
    get_tasks: 3,
    get_unpaid_invoices: 3,
    get_suppliers: 3,
    get_planning: 5,
    get_monthly_revenue: 5,
    get_supplier_bookings: 3,
    get_collections: 3,
    get_activities: 3,
    check_goal: 3,
    set_goal: 10,
};

// ─── LEVELS ───
export const LEVELS = [
    { level: 1, name: '🥉 Bronze',    minXp: 0,     title: 'Débutant' },
    { level: 2, name: '🥈 Argent',    minXp: 100,   title: 'Initié' },
    { level: 3, name: '🥇 Or',        minXp: 300,   title: 'Confirmé' },
    { level: 4, name: '💎 Platine',   minXp: 600,   title: 'Expert' },
    { level: 5, name: '⭐ Diamant',   minXp: 1000,  title: 'Maître' },
    { level: 6, name: '👑 Légende',   minXp: 2000,  title: 'Légende du CRM' },
    { level: 7, name: '🔥 Titan',     minXp: 5000,  title: 'Titan' },
    { level: 8, name: '🌟 Mythique',  minXp: 10000, title: 'Mythique' },
];

// ─── ACHIEVEMENTS / BADGES ───
export interface Achievement {
    id: string;
    name: string;
    emoji: string;
    description: string;
    condition: (stats: UserStats) => boolean;
    xpBonus: number;
}

export interface UserStats {
    totalXp: number;
    totalActions: number;
    streak: number;
    dealsCreated: number;
    dealsClosed: number;
    clientsCreated: number;
    emailsSent: number;
    whatsappSent: number;
    tripsCreated: number;
    invoicesPaid: number;
    megaActions: number;
    analyticsUsed: number;
    daysActive: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Milestones
    { id: 'first_action', name: 'Premier Pas', emoji: '👣', description: 'Première commande vocale', condition: (s) => s.totalActions >= 1, xpBonus: 10 },
    { id: 'ten_actions', name: 'Habitué', emoji: '🎯', description: '10 commandes vocales', condition: (s) => s.totalActions >= 10, xpBonus: 25 },
    { id: 'hundred_actions', name: 'Centurion', emoji: '💯', description: '100 commandes vocales', condition: (s) => s.totalActions >= 100, xpBonus: 100 },
    { id: 'thousand_actions', name: 'Machine', emoji: '🤖', description: '1000 commandes vocales', condition: (s) => s.totalActions >= 1000, xpBonus: 500 },
    
    // Streaks
    { id: 'streak_3', name: 'Régulier', emoji: '🔥', description: '3 jours consécutifs', condition: (s) => s.streak >= 3, xpBonus: 30 },
    { id: 'streak_7', name: 'Flamme', emoji: '🔥🔥', description: '7 jours consécutifs', condition: (s) => s.streak >= 7, xpBonus: 70 },
    { id: 'streak_30', name: 'Inarrêtable', emoji: '🔥🔥🔥', description: '30 jours consécutifs', condition: (s) => s.streak >= 30, xpBonus: 300 },
    
    // Deals
    { id: 'first_deal', name: 'Premier Deal', emoji: '🤝', description: 'Premier deal fermé', condition: (s) => s.dealsClosed >= 1, xpBonus: 50 },
    { id: 'ten_deals', name: 'Closer', emoji: '💼', description: '10 deals fermés', condition: (s) => s.dealsClosed >= 10, xpBonus: 200 },
    
    // Communication
    { id: 'communicator', name: 'Communicant', emoji: '📬', description: '10 emails envoyés', condition: (s) => s.emailsSent >= 10, xpBonus: 50 },
    { id: 'whatsapp_pro', name: 'WhatsApp Pro', emoji: '💬', description: '20 WhatsApp envoyés', condition: (s) => s.whatsappSent >= 20, xpBonus: 50 },
    
    // Mega-actions
    { id: 'power_user', name: 'Power User', emoji: '⚡', description: '5 mega-actions utilisées', condition: (s) => s.megaActions >= 5, xpBonus: 75 },
    { id: 'analyst', name: 'Analyste', emoji: '📊', description: '10 analyses effectuées', condition: (s) => s.analyticsUsed >= 10, xpBonus: 75 },
    
    // XP milestones
    { id: 'xp_500', name: 'Demi-Millénaire', emoji: '🏅', description: '500 XP accumulés', condition: (s) => s.totalXp >= 500, xpBonus: 50 },
    { id: 'xp_2000', name: 'Deux Millénaires', emoji: '🏆', description: '2000 XP accumulés', condition: (s) => s.totalXp >= 2000, xpBonus: 200 },
    { id: 'xp_10000', name: 'Transcendant', emoji: '🌌', description: '10000 XP accumulés', condition: (s) => s.totalXp >= 10000, xpBonus: 1000 },
    
    // Clients
    { id: 'builder', name: 'Bâtisseur', emoji: '🏗️', description: '10 clients créés', condition: (s) => s.clientsCreated >= 10, xpBonus: 50 },
    { id: 'empire', name: 'Empire', emoji: '🏛️', description: '50 clients', condition: (s) => s.clientsCreated >= 50, xpBonus: 200 },
];

// ─── DAILY CHALLENGES ───
export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    condition: string; // Serializable description for checking
}

const CHALLENGE_POOL: DailyChallenge[] = [
    { id: 'close_1_deal', title: '🎯 Closer du jour', description: 'Ferme 1 deal aujourd\'hui', xpReward: 50, condition: 'close_deal:1' },
    { id: 'create_3_tasks', title: '📋 Organisateur', description: 'Crée 3 tâches', xpReward: 30, condition: 'create_task:3' },
    { id: 'send_5_emails', title: '📧 Messenger', description: 'Envoie 5 emails', xpReward: 40, condition: 'send_email:5' },
    { id: 'use_analytics_3', title: '📊 Data Scientist', description: 'Utilise 3 outils d\'analyse', xpReward: 35, condition: 'analytics:3' },
    { id: 'create_2_quotes', title: '💰 Vendeur', description: 'Crée 2 devis', xpReward: 30, condition: 'create_quote:2' },
    { id: 'morning_routine', title: '☀️ Routine matinale', description: 'Fais un rapport du matin + check un objectif', xpReward: 25, condition: 'morning_routine:1' },
    { id: 'follow_up_2', title: '🔄 Relanceur', description: 'Fais le suivi de 2 clients', xpReward: 40, condition: 'follow_up_client:2' },
    { id: 'tag_clients', title: '🏷️ Classifieur', description: 'Lance un auto-tag clients', xpReward: 20, condition: 'auto_tag:1' },
    { id: 'profit_check', title: '💎 CFO du jour', description: 'Analyse ta rentabilité', xpReward: 20, condition: 'profit_analysis:1' },
    { id: 'narrate_crm', title: '🎙️ Narrateur', description: 'Demande une narration CRM', xpReward: 15, condition: 'narrate_dashboard:1' },
];

/** Get today's challenge (deterministic based on date) */
export function getTodayChallenge(): DailyChallenge {
    const today = new Date().toISOString().substring(0, 10);
    const hash = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return CHALLENGE_POOL[hash % CHALLENGE_POOL.length];
}

/** Get level info for a given XP */
export function getLevelForXP(xp: number) {
    let current = LEVELS[0];
    for (const level of LEVELS) {
        if (xp >= level.minXp) current = level;
        else break;
    }
    const nextLevel = LEVELS[current.level] || null; // Next level or null if max
    const xpToNext = nextLevel ? nextLevel.minXp - xp : 0;
    const progress = nextLevel
        ? Math.round(((xp - current.minXp) / (nextLevel.minXp - current.minXp)) * 100)
        : 100;
    
    return { ...current, xpToNext, progress, nextLevel };
}

/** Get XP for a tool call */
export function getXPForTool(toolName: string): number {
    return XP_TABLE[toolName] || 1; // Default 1 XP
}

/** Check which new achievements are unlocked */
export function checkNewAchievements(stats: UserStats, existingBadges: string[]): Achievement[] {
    return ACHIEVEMENTS.filter(a => 
        !existingBadges.includes(a.id) && a.condition(stats)
    );
}

/** Build XP gain message */
export function formatXPGain(xp: number, toolName: string, levelInfo: ReturnType<typeof getLevelForXP>): string {
    const bar = '█'.repeat(Math.min(10, Math.floor(levelInfo.progress / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(levelInfo.progress / 10)));
    return `+${xp} XP (${toolName}) | ${levelInfo.name} ${bar} ${levelInfo.progress}%`;
}

// Categorize tools for stats tracking
export const MEGA_ACTION_TOOLS = new Set(['close_deal', 'prepare_trip', 'generate_proposal', 'batch_notify', 'bulk_update']);
export const ANALYTICS_TOOLS = new Set(['morning_report', 'compare_revenue', 'top_clients', 'revenue_forecast', 'kpi_dashboard', 'profit_analysis', 'narrate_dashboard', 'segment_clients', 'seasonality', 'client_value', 'data_quality', 'detect_duplicates']);
export const DEAL_CLOSE_TOOLS = new Set(['close_deal']);
export const CLIENT_CREATE_TOOLS = new Set(['create_client', 'create_client_and_quote']);
export const EMAIL_TOOLS = new Set(['send_email', 'draft_email', 'create_email_draft']);
export const WHATSAPP_TOOLS = new Set(['send_whatsapp']);
export const TRIP_TOOLS = new Set(['create_trip']);
export const INVOICE_TOOLS = new Set(['mark_invoice_paid']);
