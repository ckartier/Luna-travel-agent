/**
 * CRM Registry — Dynamic schema for voice agent auto-discovery.
 * 
 * When you add a new collection or modify fields, update THIS file only.
 * The voice agent will automatically generate tool declarations and the
 * backend will handle CRUD operations generically.
 */

// ─── Collection Action Types ───
export type CRMAction = 'read' | 'create' | 'update' | 'delete' | 'search' | 'list';

export interface CRMFieldDef {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    label: string;            // French label for the AI
    required?: boolean;
    enumValues?: string[];
    searchable?: boolean;     // Include in search index
}

export interface CRMCollectionDef {
    id: string;               // Firestore collection name
    label: string;            // French name for voice AI
    labelPlural: string;      // French plural
    icon: string;             // Emoji for display
    route: string;            // CRM page route
    actions: CRMAction[];     // Allowed actions
    searchFields: string[];   // Fields to search in (for open_record, search_crm)
    displayField: string;     // Main field to display in results (e.g., "name")
    fields: CRMFieldDef[];    // All fields — used for create/update
}

// ═══════════════════════════════════════════════════
//  THE REGISTRY — Edit this to auto-wire the voice agent
// ═══════════════════════════════════════════════════

export const CRM_REGISTRY: CRMCollectionDef[] = [
    {
        id: 'contacts',
        label: 'client',
        labelPlural: 'clients',
        icon: '👤',
        route: '/crm/clients',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['firstName', 'lastName', 'email', 'phone'],
        displayField: 'firstName+lastName',
        fields: [
            { name: 'firstName', type: 'string', label: 'prénom', required: true, searchable: true },
            { name: 'lastName', type: 'string', label: 'nom', required: true, searchable: true },
            { name: 'email', type: 'string', label: 'email', searchable: true },
            { name: 'phone', type: 'string', label: 'téléphone' },
            { name: 'vipLevel', type: 'enum', label: 'niveau VIP', enumValues: ['Standard', 'Premium', 'VIP', 'Elite'] },
            { name: 'company', type: 'string', label: 'entreprise' },
            { name: 'notes', type: 'string', label: 'notes' },
        ],
    },
    {
        id: 'leads',
        label: 'lead',
        labelPlural: 'leads',
        icon: '📊',
        route: '/crm/pipeline',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['clientName', 'name', 'destination'],
        displayField: 'clientName',
        fields: [
            { name: 'clientName', type: 'string', label: 'nom client', required: true, searchable: true },
            { name: 'destination', type: 'string', label: 'destination', required: true },
            { name: 'dates', type: 'string', label: 'dates' },
            { name: 'budget', type: 'string', label: 'budget' },
            { name: 'pax', type: 'string', label: 'nombre de personnes' },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
            { name: 'source', type: 'string', label: 'source' },
            { name: 'notes', type: 'string', label: 'notes' },
        ],
    },
    {
        id: 'quotes',
        label: 'devis',
        labelPlural: 'devis',
        icon: '📋',
        route: '/crm/quotes',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['quoteNumber', 'clientName', 'destination'],
        displayField: 'quoteNumber+clientName',
        fields: [
            { name: 'clientName', type: 'string', label: 'nom client', required: true, searchable: true },
            { name: 'destination', type: 'string', label: 'destination' },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] },
            { name: 'totalAmount', type: 'number', label: 'montant total' },
        ],
    },
    {
        id: 'invoices',
        label: 'facture',
        labelPlural: 'factures',
        icon: '💳',
        route: '/crm/invoices',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['invoiceNumber', 'clientName'],
        displayField: 'invoiceNumber+clientName',
        fields: [
            { name: 'clientName', type: 'string', label: 'nom client', required: true, searchable: true },
            { name: 'totalAmount', type: 'number', label: 'montant', required: true },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['DRAFT', 'SENT', 'OVERDUE', 'PAID', 'CANCELLED'] },
            { name: 'dueDate', type: 'date', label: 'échéance' },
        ],
    },
    {
        id: 'trips',
        label: 'voyage',
        labelPlural: 'voyages',
        icon: '✈️',
        route: '/crm/trips',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['title', 'destination', 'clientName'],
        displayField: 'destination+clientName',
        fields: [
            { name: 'clientName', type: 'string', label: 'nom client', required: true, searchable: true },
            { name: 'destination', type: 'string', label: 'destination', required: true },
            { name: 'startDate', type: 'date', label: 'date début', required: true },
            { name: 'endDate', type: 'date', label: 'date fin', required: true },
            { name: 'travelers', type: 'number', label: 'nombre de voyageurs' },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            { name: 'budget', type: 'number', label: 'budget' },
        ],
    },
    {
        id: 'catalog',
        label: 'prestation',
        labelPlural: 'prestations',
        icon: '🏷️',
        route: '/crm/catalog',
        actions: ['read', 'search', 'list'],
        searchFields: ['name', 'description', 'type', 'location'],
        displayField: 'name',
        fields: [
            { name: 'name', type: 'string', label: 'nom', required: true, searchable: true },
            { name: 'type', type: 'string', label: 'type' },
            { name: 'location', type: 'string', label: 'lieu' },
            { name: 'netCost', type: 'number', label: 'coût net' },
            { name: 'sellPrice', type: 'number', label: 'prix de vente' },
            { name: 'description', type: 'string', label: 'description' },
        ],
    },
    {
        id: 'suppliers',
        label: 'prestataire',
        labelPlural: 'prestataires',
        icon: '🏢',
        route: '/crm/suppliers',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['name', 'type', 'speciality'],
        displayField: 'name',
        fields: [
            { name: 'name', type: 'string', label: 'nom', required: true, searchable: true },
            { name: 'type', type: 'string', label: 'type' },
            { name: 'speciality', type: 'string', label: 'spécialité' },
            { name: 'phone', type: 'string', label: 'téléphone' },
            { name: 'email', type: 'string', label: 'email' },
        ],
    },
    {
        id: 'tasks',
        label: 'tâche',
        labelPlural: 'tâches',
        icon: '✅',
        route: '/crm/tasks',
        actions: ['read', 'create', 'update', 'search', 'list'],
        searchFields: ['title'],
        displayField: 'title',
        fields: [
            { name: 'title', type: 'string', label: 'titre', required: true, searchable: true },
            { name: 'dueDate', type: 'date', label: 'échéance' },
            { name: 'priority', type: 'enum', label: 'priorité', enumValues: ['low', 'medium', 'high', 'urgent'] },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['TODO', 'IN_PROGRESS', 'DONE'] },
        ],
    },
    {
        id: 'payments',
        label: 'paiement',
        labelPlural: 'paiements',
        icon: '💰',
        route: '/crm/payments',
        actions: ['read', 'create', 'list'],
        searchFields: ['clientName'],
        displayField: 'clientName+amount',
        fields: [
            { name: 'clientName', type: 'string', label: 'nom client', required: true, searchable: true },
            { name: 'amount', type: 'number', label: 'montant', required: true },
            { name: 'method', type: 'enum', label: 'méthode', enumValues: ['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'STRIPE'] },
            { name: 'paymentDate', type: 'date', label: 'date' },
        ],
    },
    {
        id: 'supplierBookings',
        label: 'réservation prestataire',
        labelPlural: 'réservations prestataires',
        icon: '📅',
        route: '/crm/bookings',
        actions: ['read', 'search', 'list'],
        searchFields: ['prestationName', 'supplierName', 'clientName'],
        displayField: 'prestationName',
        fields: [
            { name: 'prestationName', type: 'string', label: 'prestation', searchable: true },
            { name: 'supplierName', type: 'string', label: 'prestataire', searchable: true },
            { name: 'date', type: 'date', label: 'date' },
            { name: 'startTime', type: 'string', label: 'heure' },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
        ],
    },
    {
        id: 'collections',
        label: 'collection',
        labelPlural: 'collections',
        icon: '📦',
        route: '/crm/collections',
        actions: ['read', 'list'],
        searchFields: ['name', 'title'],
        displayField: 'name',
        fields: [
            { name: 'name', type: 'string', label: 'nom', searchable: true },
            { name: 'title', type: 'string', label: 'titre' },
        ],
    },
    {
        id: 'activities',
        label: 'activité',
        labelPlural: 'activités',
        icon: '📝',
        route: '/crm/activities',
        actions: ['read', 'list'],
        searchFields: ['description', 'title'],
        displayField: 'description',
        fields: [
            { name: 'type', type: 'string', label: 'type' },
            { name: 'description', type: 'string', label: 'description' },
            { name: 'userName', type: 'string', label: 'utilisateur' },
        ],
    },
    {
        id: 'campaigns',
        label: 'campagne',
        labelPlural: 'campagnes',
        icon: '📢',
        route: '/crm/marketing',
        actions: ['read', 'create', 'list'],
        searchFields: ['name', 'subject'],
        displayField: 'name',
        fields: [
            { name: 'name', type: 'string', label: 'nom', required: true, searchable: true },
            { name: 'subject', type: 'string', label: 'sujet' },
            { name: 'type', type: 'enum', label: 'type', enumValues: ['EMAIL', 'WHATSAPP', 'SMS'] },
            { name: 'status', type: 'enum', label: 'statut', enumValues: ['DRAFT', 'SCHEDULED', 'SENT'] },
        ],
    },
    {
        id: 'documents',
        label: 'document',
        labelPlural: 'documents',
        icon: '📄',
        route: '/crm/documents',
        actions: ['read', 'list'],
        searchFields: ['name', 'type'],
        displayField: 'name',
        fields: [
            { name: 'name', type: 'string', label: 'nom', searchable: true },
            { name: 'type', type: 'string', label: 'type' },
            { name: 'clientId', type: 'string', label: 'client' },
        ],
    },
    {
        id: 'voiceAudit',
        label: 'audit vocal',
        labelPlural: 'audits vocaux',
        icon: '🎙️',
        route: '/crm/settings',
        actions: ['read', 'list'],
        searchFields: ['tool', 'result'],
        displayField: 'tool',
        fields: [
            { name: 'tool', type: 'string', label: 'outil', searchable: true },
            { name: 'result', type: 'string', label: 'résultat' },
            { name: 'success', type: 'boolean', label: 'succès' },
            { name: 'timestamp', type: 'string', label: 'timestamp' },
        ],
    },
];

// ─── Helper: get collection def by ID ───
export function getCollectionDef(id: string): CRMCollectionDef | undefined {
    return CRM_REGISTRY.find(c => c.id === id);
}

// ─── Helper: get display value from a document ───
export function getDisplayValue(doc: Record<string, any>, col: CRMCollectionDef): string {
    const parts = col.displayField.split('+');
    return parts.map(f => doc[f] || '').filter(Boolean).join(' ');
}

// ─── Helper: match a document against a search query ───
export function matchesQuery(doc: Record<string, any>, query: string, col: CRMCollectionDef): boolean {
    const searchText = col.searchFields.map(f => doc[f] || '').join(' ').toLowerCase();
    return searchText.includes(query.toLowerCase());
}

// ─── Auto-generate tool names from registry ───
export function getRegistryToolNames(): string[] {
    const tools: string[] = [];
    for (const col of CRM_REGISTRY) {
        if (col.actions.includes('list')) tools.push(`list_${col.id}`);
        if (col.actions.includes('create')) tools.push(`create_${col.id.replace(/s$/, '')}`);
        if (col.actions.includes('update')) tools.push(`update_${col.id.replace(/s$/, '')}`);
    }
    return tools;
}
