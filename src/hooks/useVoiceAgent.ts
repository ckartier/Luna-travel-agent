'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, type LiveServerMessage } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';

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
const TRAVEL_TOOLS = [
    // ─── READ ───
    {
        name: 'get_upcoming_trips',
        description: 'Obtenir la liste des voyages à venir (confirmés, en attente, actifs).',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_client_info',
        description: 'Rechercher un client par nom ou email et retourner sa fiche.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Nom ou email du client' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_today_pipeline',
        description: 'Obtenir les leads et opportunités récents du pipeline voyage.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_recent_emails',
        description: 'Obtenir les derniers emails reçus par l\'agence.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_quote_details',
        description: 'Lire un devis existant par nom de client ou ID.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Nom du client ou ID du devis' },
            },
            required: ['query'],
        },
    },
    // ─── NAVIGATE ───
    {
        name: 'navigate_to',
        description: 'Naviguer vers une section générale du CRM.',
        parameters: {
            type: 'object' as const,
            properties: {
                section: {
                    type: 'string',
                    enum: [
                        'dashboard', 'accueil', 'clients', 'contacts', 'pipeline', 'leads',
                        'voyages', 'trips', 'planning', 'calendrier', 'bookings', 'reservations',
                        'devis', 'quotes', 'factures', 'invoices', 'paiements', 'payments',
                        'mails', 'emails', 'messages', 'taches', 'tasks', 'activites',
                        'catalogue', 'catalog', 'fournisseurs', 'suppliers', 'prestataires',
                        'documents', 'marketing', 'collections', 'analytics', 'statistiques',
                        'parametres', 'settings', 'equipe', 'team', 'templates', 'site-builder',
                        'agent-ia',
                    ],
                },
            },
            required: ['section'],
        },
    },
    {
        name: 'open_record',
        description: 'Ouvrir instantanément un dossier, client, devis ou facture ciblé par son nom ou mot-clé.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Nom ou référence à ouvrir' },
            },
            required: ['query'],
        },
    },
    // ─── WRITE ───
    {
        name: 'create_task',
        description: 'Créer une nouvelle tâche ou rappel.',
        parameters: {
            type: 'object' as const,
            properties: {
                title: { type: 'string' },
                dueDate: { type: 'string', description: 'YYYY-MM-DD (optionnel)' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            },
            required: ['title'],
        },
    },
    {
        name: 'create_quote',
        description: 'Créer un nouveau devis voyage pour un client. Demande le nom, la destination, les dates approximatives et le budget.',
        parameters: {
            type: 'object' as const,
            properties: {
                clientName: { type: 'string', description: 'Nom complet du client' },
                destination: { type: 'string', description: 'Destination du voyage' },
                startDate: { type: 'string', description: 'Date de départ approximative (YYYY-MM-DD ou description)' },
                endDate: { type: 'string', description: 'Date de retour approximative (YYYY-MM-DD ou description)' },
                budget: { type: 'number', description: 'Budget en euros' },
                notes: { type: 'string', description: 'Notes ou demandes spéciales (optionnel)' },
            },
            required: ['clientName', 'destination'],
        },
    },
    {
        name: 'create_email_draft',
        description: 'Préparer un brouillon d\'email pour un client. L\'email est créé en statut brouillon, l\'utilisateur le valide avant envoi.',
        parameters: {
            type: 'object' as const,
            properties: {
                toName: { type: 'string', description: 'Nom du destinataire (client)' },
                toEmail: { type: 'string', description: 'Email du destinataire (optionnel si le nom suffit)' },
                subject: { type: 'string', description: 'Objet de l\'email' },
                body: { type: 'string', description: 'Corps de l\'email, rédigé de manière professionnelle en français' },
                relatedTo: { type: 'string', description: 'Voyage, devis ou dossier concerné (optionnel)' },
            },
            required: ['toName', 'subject', 'body'],
        },
    },
    {
        name: 'create_client',
        description: 'Créer une nouvelle fiche client dans le CRM.',
        parameters: {
            type: 'object' as const,
            properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string', description: 'Numéro de téléphone (optionnel)' },
                notes: { type: 'string', description: 'Notes initiales (optionnel)' },
            },
            required: ['firstName', 'lastName'],
        },
    },
    {
        name: 'create_invoice',
        description: 'Créer une facture pour un client ou un voyage.',
        parameters: {
            type: 'object' as const,
            properties: {
                clientName: { type: 'string', description: 'Nom du client' },
                amount: { type: 'number', description: 'Montant TTC en euros' },
                description: { type: 'string', description: 'Description de la prestation (ex: "Voyage Bali juin 2025")' },
                dueDate: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD, optionnel)' },
            },
            required: ['clientName', 'amount', 'description'],
        },
    },
    {
        name: 'add_note_to_client',
        description: 'Ajouter une note interne sur la fiche d\'un client.',
        parameters: {
            type: 'object' as const,
            properties: {
                clientName: { type: 'string', description: 'Nom du client' },
                note: { type: 'string', description: 'Contenu de la note' },
            },
            required: ['clientName', 'note'],
        },
    },
    {
        name: 'update_lead_stage',
        description: 'Mettre à jour le stade d\'un lead dans le pipeline commercial.',
        parameters: {
            type: 'object' as const,
            properties: {
                clientName: { type: 'string', description: 'Nom du client ou prospect' },
                stage: {
                    type: 'string',
                    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
                    description: 'Nouveau stade du pipeline',
                },
            },
            required: ['clientName', 'stage'],
        },
    },
    {
        name: 'assign_supplier',
        description: 'Assigner un prestataire (chauffeur, guide, hôtel) à une prestation sur le planning. Envoie automatiquement un WhatsApp de confirmation au prestataire.',
        parameters: {
            type: 'object' as const,
            properties: {
                supplierName: { type: 'string', description: 'Nom du prestataire (chauffeur, guide, etc.)' },
                prestationName: { type: 'string', description: 'Nom de la prestation (ex: "Transfert aéroport", "Visite guidée")' },
                clientName: { type: 'string', description: 'Nom du client concerné' },
                date: { type: 'string', description: 'Date de la prestation (YYYY-MM-DD)' },
                startTime: { type: 'string', description: 'Heure de début (HH:mm, optionnel)' },
                pickupLocation: { type: 'string', description: 'Lieu de prise en charge (optionnel)' },
                numberOfGuests: { type: 'number', description: 'Nombre de personnes (optionnel)' },
                notes: { type: 'string', description: 'Notes supplémentaires (optionnel)' },
            },
            required: ['supplierName', 'prestationName', 'date'],
        },
    },
    {
        name: 'search_crm',
        description: 'Rechercher n\'importe quelle entité dans le CRM (client, voyage, email, lead).',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string' },
            },
            required: ['query'],
        },
    },
    {
        name: 'search_catalog',
        description: 'Rechercher dans le catalogue de prestations voyage (villas, hôtels, excursions, transferts, jets, spas, etc.) par mot-clé, destination ou budget.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Mot-clé de recherche (ex: villa, spa, Méditerranée, jet privé)' },
                region: { type: 'string', description: 'Région ou destination (optionnel, ex: Europe, Côte d\'Azur)' },
                maxPrice: { type: 'number', description: 'Budget max en euros (optionnel)' },
            },
            required: ['query'],
        },
    },
];

/* ═══════════════════════════════════════════════════
   LEGAL Tools
   ═══════════════════════════════════════════════════ */
const LEGAL_TOOLS = [
    // ─── READ ───
    {
        name: 'get_dossiers',
        description: 'Obtenir la liste des dossiers juridiques actifs du cabinet.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_upcoming_deadlines',
        description: 'Obtenir les échéances juridiques et procédurales dans les 30 prochains jours.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_unpaid_invoices',
        description: 'Obtenir les factures impayées ou en retard du cabinet.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_recent_emails',
        description: 'Obtenir les derniers emails reçus par le cabinet.',
        parameters: { type: 'object' as const, properties: {} },
    },
    {
        name: 'get_client_info',
        description: 'Rechercher un client par nom et retourner sa fiche.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Nom ou email du client' },
            },
            required: ['query'],
        },
    },
    // ─── NAVIGATE ───
    {
        name: 'navigate_to',
        description: 'Naviguer vers une section générale du CRM.',
        parameters: {
            type: 'object' as const,
            properties: {
                section: {
                    type: 'string',
                    enum: [
                        'dashboard', 'accueil', 'clients', 'contacts', 'pipeline',
                        'dossiers', 'jurisprudence', 'documents',
                        'devis', 'quotes', 'factures', 'invoices', 'paiements', 'payments',
                        'planning', 'calendrier', 'mails', 'emails', 'messages',
                        'taches', 'tasks', 'activites',
                        'analytics', 'statistiques', 'parametres', 'settings',
                        'equipe', 'team', 'agent-ia', 'templates',
                    ],
                },
            },
            required: ['section'],
        },
    },
    {
        name: 'open_record',
        description: 'Ouvrir instantanément un dossier juridique, client, devis ou facture ciblé par son nom ou sa référence.',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Nom ou référence du dossier à ouvrir' },
            },
            required: ['query'],
        },
    },
    // ─── WRITE ───
    {
        name: 'create_task',
        description: 'Créer une nouvelle tâche ou rappel.',
        parameters: {
            type: 'object' as const,
            properties: {
                title: { type: 'string' },
                dueDate: { type: 'string', description: 'YYYY-MM-DD (optionnel)' },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            },
            required: ['title'],
        },
    },
    {
        name: 'create_email_draft',
        description: 'Préparer un brouillon d\'email pour un client ou sur un dossier. L\'email est créé en statut brouillon.',
        parameters: {
            type: 'object' as const,
            properties: {
                toName: { type: 'string', description: 'Nom du destinataire' },
                toEmail: { type: 'string', description: 'Email du destinataire (optionnel)' },
                subject: { type: 'string', description: 'Objet de l\'email' },
                body: { type: 'string', description: 'Corps de l\'email, rédigé de manière professionnelle et juridique en français' },
                dossierName: { type: 'string', description: 'Dossier concerné (optionnel)' },
            },
            required: ['toName', 'subject', 'body'],
        },
    },
    {
        name: 'create_invoice',
        description: 'Créer une facture d\'honoraires pour un client.',
        parameters: {
            type: 'object' as const,
            properties: {
                clientName: { type: 'string', description: 'Nom du client' },
                amount: { type: 'number', description: 'Montant HT en euros' },
                description: { type: 'string', description: 'Description des prestations (ex: "Honoraires dossier Durand - consultation")' },
                dossierName: { type: 'string', description: 'Dossier associé (optionnel)' },
                dueDate: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD, optionnel)' },
            },
            required: ['clientName', 'amount', 'description'],
        },
    },
    {
        name: 'add_note_to_dossier',
        description: 'Ajouter une note interne ou un mémo sur un dossier juridique.',
        parameters: {
            type: 'object' as const,
            properties: {
                dossierName: { type: 'string', description: 'Nom ou référence du dossier' },
                note: { type: 'string', description: 'Contenu de la note' },
            },
            required: ['dossierName', 'note'],
        },
    },
    {
        name: 'update_dossier_status',
        description: 'Mettre à jour le statut d\'un dossier juridique.',
        parameters: {
            type: 'object' as const,
            properties: {
                dossierName: { type: 'string', description: 'Nom ou référence du dossier' },
                status: {
                    type: 'string',
                    enum: ['active', 'pending', 'closed', 'archived', 'urgent'],
                    description: 'Nouveau statut du dossier',
                },
            },
            required: ['dossierName', 'status'],
        },
    },
    {
        name: 'create_reminder',
        description: 'Créer une échéance critique avec alerte pour un dossier.',
        parameters: {
            type: 'object' as const,
            properties: {
                title: { type: 'string', description: 'Titre de l\'échéance' },
                dossierName: { type: 'string', description: 'Dossier concerné' },
                dueDate: { type: 'string', description: 'Date limite (YYYY-MM-DD)' },
                priority: { type: 'string', enum: ['medium', 'high', 'urgent'] },
            },
            required: ['title', 'dueDate'],
        },
    },
    {
        name: 'search_crm',
        description: 'Rechercher n\'importe quelle entité dans le CRM (client, dossier, email).',
        parameters: {
            type: 'object' as const,
            properties: {
                query: { type: 'string' },
            },
            required: ['query'],
        },
    },
];

/* ═══════════════════════════════════════════════════
   System Prompts
   ═══════════════════════════════════════════════════ */
function buildTravelPrompt(firstName: string, pageContext?: string): string {
    const ctx = pageContext
        ? `\n\nCONTEXTE ACTUEL : L'utilisateur est sur la page « ${pageContext} » du CRM. Adapte tes actions à ce contexte.`
        : '';
    return `Assistant vocal Luna Conciergerie Voyage. Tu parles à ${firstName}.${ctx}

Outils disponibles : get_upcoming_trips, get_client_info, get_today_pipeline, get_recent_emails, get_quote_details, search_crm, navigate_to, create_quote, create_email_draft, create_client, create_invoice, create_task, add_note_to_client, update_lead_stage, assign_supplier, search_catalog.

RÈGLES :
1. MAXIMISE LA VITESSE : Fais des phrases TRÈS COURTES (1 seule courte phrase maximum). Ne dis pas "Je vais..." ni "Patientez...", agit directement.
2. Exécute les outils immédiatement.
3. Si une info manque, demande l'info précise en une phrase. Pas de listes.
4. Ton chaleureux. Toujours agir plutôt que de parler inutilement.
5. Si un utilisateur dit "ouvre le dossier", "affiche le client", utilise \`open_record\`.`;
}

function buildLegalPrompt(firstName: string, pageContext?: string): string {
    const ctx = pageContext
        ? `\n\nCONTEXTE ACTUEL : Maître ${firstName} est sur la page « ${pageContext} » du CRM. Adapte tes actions à ce contexte.`
        : '';
    return `Assistant vocal du cabinet juridique Luna. Tu parles à Maître ${firstName}.${ctx}

Outils : get_dossiers, get_upcoming_deadlines, get_unpaid_invoices, get_recent_emails, get_client_info, search_crm, navigate_to, create_email_draft, create_invoice, create_task, create_reminder, add_note_to_dossier, update_dossier_status.

RÈGLES :
1. MAXIMISE LA VITESSE : Fais des phrases TRÈS COURTES (1 seule courte phrase). Ne dis pas "Permettez-moi...", agit directement.
2. Exécute les outils immédiatement.
3. Si une info manque, pose UNE question très courte.
4. Ton professionnel et précis. Pas de détails inutiles.
5. Si un collaborateur dit "ouvre le document/dossier/client", utilise \`open_record\`.`;
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
        case 'search_crm': {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('voice-agent:search', { detail: { query: args.query } }));
            }
            return `Recherche lancée pour "${args.query}".`;
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
    const [micStatus, setMicStatus] = useState<DeviceStatus>('unknown');
    const [audioOutputStatus, setAudioOutputStatus] = useState<DeviceStatus>('unknown');

    const idTokenRef = useRef<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const idCounterRef = useRef(0);
    const isPlayingRef = useRef(false);
    const resumeListeningRef = useRef<(() => void) | null>(null);
    const hasGreetedRef = useRef(false);
    // ── Stable refs to avoid stale closures in recognition callbacks ──
    const handleUserMessageRef = useRef<(text: string) => void>(() => {});
    const speakTextRef = useRef<(text: string) => void>(() => {});

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
            return { text: JSON.stringify(data).substring(0, 300) };
        } catch (err) {
            return { text: 'Erreur lors de la récupération des données.' };
        }
    }, [vertical, user]);

    /* ─── TTS Playback via Google Cloud TTS ─── */
    const speakText = useCallback(async (text: string) => {
        if (typeof window === 'undefined') return;
        
        // Pause recognition during TTS to prevent echo (don't destroy it)
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
        }
        if ((window as any).__voiceAudio) {
            try { (window as any).__voiceAudio.pause(); } catch {}
        }
        
        setState('speaking');
        isPlayingRef.current = true;
        
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
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken();
                idTokenRef.current = idToken;
            }

            const response = await fetch('/api/crm/tts', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, vertical }),
            });

            if (!response.ok) throw new Error('TTS fetch failed');

            const blob = await response.blob();
            if (blob.size < 100) throw new Error('Empty audio');
            
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            (window as any).__voiceAudio = audio;

            audio.onended = () => {
                isPlayingRef.current = false;
                URL.revokeObjectURL(audioUrl);
                if (wantListeningRef.current && recognitionRef.current) {
                    setState('listening');
                    setTimeout(() => { try { recognitionRef.current.start(); } catch {} }, 50);
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
        if (!text.trim()) return;
        // ── GUARD: reject input while TTS is playing or AI is analyzing ──
        if (isPlayingRef.current || isProcessingRef.current) return;
        setState('thinking');
        isProcessingRef.current = true;
        
        const userMsg: TranscriptEntry = { id: `user-${++idCounterRef.current}`, role: 'user', text, timestamp: Date.now() };
        setTranscript(prev => [...prev, userMsg]);

        const fullName = userProfile?.displayName || user?.displayName || 'Utilisateur';
        const firstName = fullName.split(' ')[0];
        const isLegal = vertical === 'legal';
        const tools = isLegal ? LEGAL_TOOLS : TRAVEL_TOOLS;
        const systemPrompt = isLegal ? buildLegalPrompt(firstName, pageContext) : buildTravelPrompt(firstName, pageContext);

        try {
            let idToken = idTokenRef.current;
            if (!idToken && user) {
                idToken = await user.getIdToken();
                idTokenRef.current = idToken;
            }

            const tokenRes = await fetch('/api/crm/voice-token', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            });
            const { apiKey } = await tokenRes.json();
            if (!apiKey) throw new Error("Clé API introuvable");

            const ai = new GoogleGenAI({ apiKey });
            
            // Build contents — only keep last 4 messages for token reduction & speed
            let historyBase = transcript.slice(-4);
            const contents = [...historyBase, userMsg].map(t => ({
                role: t.role === 'model' ? 'model' : 'user',
                parts: [{ text: t.text.substring(0, 300) }] // Truncate long messages for speed
            }));

            // Gemini 2.5 Flash — fast, reliable, excellent tool orchestration
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    tools: [{ functionDeclarations: tools as any }],
                    temperature: 0.3,
                    maxOutputTokens: 200,
                }
            });

            // Safe text extraction (response.text throws when only functionCall parts exist)
            const modelParts = response.candidates?.[0]?.content?.parts || [];
            const toolCalls = response.functionCalls || [];
            let finalResponseText = '';
            try { finalResponseText = response.text || ''; } catch { /* only functionCalls, no text */ }

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
                        
                        if (action?.previewUrl && typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('voice-agent:action-created', { detail: action }));
                        }
                        toolResponses.push({ id: tc.id, name: funcName, response: { result: resultText } });
                    } catch (toolErr: any) {
                        console.error(`[VoiceAgent] Tool ${funcName} failed:`, toolErr);
                        toolResponses.push({ id: tc.id, name: funcName, response: { result: `Erreur: ${toolErr.message || 'échec'}` } });
                    }
                }

                // Follow up response after tools — echo back ALL model parts (thought_signatures + functionCalls)
                try {
                    const followUp = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            ...contents,
                            { role: 'model', parts: modelParts },
                            { role: 'user', parts: toolResponses.map(tr => ({ functionResponse: tr })) as any }
                        ],
                        config: {
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            tools: [{ functionDeclarations: tools as any }],
                        }
                    });
                    
                    try { if (followUp.text) finalResponseText = followUp.text; } catch { /* safe */ }
                } catch (followUpErr: any) {
                    console.warn('[VoiceAgent] Follow-up failed, using tool results directly:', followUpErr.message);
                    // Build a summary from tool responses as fallback
                    finalResponseText = toolResponses.map(tr => tr.response.result).join(' ');
                }
            }

            if (finalResponseText) {
                setTranscript(prev => [...prev, {
                    id: `model-${++idCounterRef.current}`,
                    role: 'model',
                    text: finalResponseText,
                    timestamp: Date.now()
                }]);
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
            console.error('[VoiceAgent] AI processing error:', err);
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
            isProcessingRef.current = false;
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

    /* ─── STT: Continuous mic — no stop/restart cycles ─── */
    const start = useCallback(async () => {
        if (state === 'speaking' || state === 'thinking') return;
        
        // ── Initial greeting on first session ──
        if (!hasGreetedRef.current) {
            hasGreetedRef.current = true;
            const fullName = userProfile?.displayName || user?.displayName || '';
            const firstName = fullName.split(' ')[0] || 'Laurent';
            const cap = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            const greeting = `Bonjour ${cap}, comment puis-je vous aider ?`;
            setTranscript([{ id: `model-${++idCounterRef.current}`, role: 'model', text: greeting, timestamp: Date.now() }]);
            speakTextRef.current(greeting);
            return;
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
                // Don't process input while AI is speaking
                if (isPlayingRef.current) return;
                
                let finalSpeech = '';
                let interimSpeech = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalSpeech += event.results[i][0].transcript;
                    } else {
                        interimSpeech += event.results[i][0].transcript;
                    }
                }
                
                if (interimSpeech || finalSpeech) {
                    setAudioLevel(0.3 + Math.random() * 0.4);
                }

                if (finalSpeech) {
                    // Accumulate final speech (user may speak in multiple phrases)
                    pendingSpeechRef.current += ' ' + finalSpeech;
                    
                    // Debounce: quickly detect if user stops speaking (300ms instead of 400ms for faster act)
                    if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
                    finalTimerRef.current = setTimeout(() => {
                        const trimmed = pendingSpeechRef.current.trim();
                        pendingSpeechRef.current = '';
                        if (trimmed.length < 3) return;
                        
                        setAudioLevel(0);
                        // Don't stop recognition — just pause it during processing
                        // recognition stays alive in background
                        handleUserMessageRef.current(trimmed);
                    }, 300);
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
            recognition.start();

        } catch (err: any) {
            console.error('[Voice] Mic error:', err);
            setError("Accès microphone refusé.");
            setState('error');
            setMicStatus('denied');
        }
    // ── start() only depends on state + user (NOT handleUserMessage/speakText) ──
    // This prevents recognition callbacks from going stale after transcript updates
    }, [state, user, userProfile]);

    const stop = useCallback(() => {
        wantListeningRef.current = false;
        if (finalTimerRef.current) { clearTimeout(finalTimerRef.current); finalTimerRef.current = null; }
        pendingSpeechRef.current = '';
        if (recognitionRef.current) {
            try { 
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
        }
        if (typeof window !== 'undefined' && (window as any).__voiceAudio) {
            (window as any).__voiceAudio.pause();
        }
        isPlayingRef.current = false;
        setAudioLevel(0);
        setState('idle');

        // Async save and analyze conversation
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

    const sendText = useCallback((text: string) => {
        handleUserMessage(text);
    }, [handleUserMessage]);
    
    // resumeListeningRef is no longer needed — recognition stays alive with continuous=true

    // Force stop everything on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
            if (typeof window !== 'undefined' && (window as any).__voiceAudio) {
                (window as any).__voiceAudio.pause();
            }
        };
    }, []);

    return {
        state, transcript, start, stop, sendText,
        isListening: state === 'listening',
        isSpeaking: state === 'speaking',
        error, audioLevel, micStatus, audioOutputStatus,
    };
}
