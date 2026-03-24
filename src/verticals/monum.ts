/**
 * Luna Vertical — MONUM (Paris Renov Tracker)
 */

import type { VerticalConfig } from './types';

export const monumVertical: VerticalConfig = {
    id: 'monum',
    name: 'Monum',
    description: {
        fr: 'Plateforme CRM pour le suivi de chantiers et la rénovation immobilière',
        en: 'CRM platform for site tracking and property renovation',
        es: 'Plataforma CRM para seguimiento de obras y renovación de propiedades',
    },
    icon: 'HardHat',
    accentColor: '#334155',       // slate-700
    accentColorLight: '#F1F5F9',  // slate-100

    branding: {
        appName: 'Monum',
        tagline: {
            fr: 'Suivi de Chantiers & Rénovation HQE',
            en: 'Construction Site & HQE Renovation Tracking',
            es: 'Seguimiento de Obras y Renovación HQE',
        },
        metaTitle: 'Monum | Suivi de Chantiers',
        metaDescription: {
            fr: 'Gérez vos chantiers, vos artisans et vos budgets rénovation — Monum',
            en: 'Manage your construction sites, craftsmen and renovation budgets — Monum',
            es: 'Gestione sus obras, artesanos y presupuestos de renovación — Monum',
        },
    },

    sidebar: [
        {
            label: '',
            collapsible: false,
            links: [
                { name: { fr: 'Dashboard', en: 'Dashboard', es: 'Panel' }, href: '/crm', icon: 'LayoutDashboard', featureKey: 'dashboard' },
                { name: { fr: 'Boîte de Réception', en: 'Inbox', es: 'Bandeja de entrada' }, href: '/crm/mails', icon: 'Mail', featureKey: 'mails' },
                { name: { fr: 'Pipeline', en: 'Pipeline', es: 'Pipeline' }, href: '/crm/pipeline', icon: 'Trello', featureKey: 'pipeline' },
                { name: { fr: 'Planning', en: 'Planning', es: 'Planificación' }, href: '/crm/planning', icon: 'Calendar', featureKey: 'planning' },
                { name: { fr: 'Clients', en: 'Clients', es: 'Clientes' }, href: '/crm/contacts', icon: 'Users', featureKey: 'contacts' },
            ],
        },
        {
            label: { fr: 'Opérations', en: 'Operations', es: 'Operaciones' },
            collapsible: true,
            links: [
                { name: { fr: 'Chantiers', en: 'Sites', es: 'Obras' }, href: '/crm/trips', icon: 'HardHat', featureKey: 'bookings' },
                { name: { fr: 'Interventions', en: 'Interventions', es: 'Intervenciones' }, href: '/crm/bookings', icon: 'Hammer', featureKey: 'bookings' },
                { name: { fr: 'Artisans', en: 'Craftsmen', es: 'Artesanos' }, href: '/crm/suppliers', icon: 'UsersRound', featureKey: 'suppliers' },
            ],
        },
        {
            label: { fr: 'Finance', en: 'Finance', es: 'Finanzas' },
            collapsible: true,
            links: [
                { name: { fr: 'Devis', en: 'Quotes', es: 'Presupuestos' }, href: '/crm/quotes', icon: 'FileSignature', featureKey: 'quotes' },
                { name: { fr: 'Factures', en: 'Invoices', es: 'Facturas' }, href: '/crm/invoices', icon: 'FileText', featureKey: 'invoices' },
                { name: { fr: 'Paiements', en: 'Payments', es: 'Pagos' }, href: '/crm/payments', icon: 'CreditCard', featureKey: 'payments' },
            ],
        },
        {
            label: { fr: 'Gestion', en: 'Management', es: 'Gestión' },
            collapsible: true,
            links: [
                { name: { fr: 'Équipe', en: 'Team', es: 'Equipo' }, href: '/crm/team', icon: 'UsersRound', featureKey: 'team' },
                { name: { fr: 'Analytics', en: 'Analytics', es: 'Analítica' }, href: '/crm/analytics', icon: 'BarChart3', featureKey: 'analytics' },
                { name: { fr: 'Installation', en: 'Setup', es: 'Instalación' }, href: '/crm/setup', icon: 'Wrench' },
            ],
        },
    ],

    aiAgent: {
        name: { fr: 'Agent Travaux', en: 'Site Agent', es: 'Agente de Obras' },
        subtitle: { fr: 'Rénovation & Coordination', en: 'Renovation & Coordination', es: 'Renovación y Coordinación' },
        systemPromptPrefix: 'Tu es un expert en conduite de travaux et architecture. Tu assistes les maîtres d\'ouvrage dans la gestion budgétaire et le planning des chantiers.',
    },

    entities: {
        trip: { fr: 'Chantier', en: 'Site', es: 'Obra' },
        tripPlural: { fr: 'Chantiers', en: 'Sites', es: 'Obras' },
        supplier: { fr: 'Artisan', en: 'Craftsman', es: 'Artesano' },
        supplierPlural: { fr: 'Artisans', en: 'Craftsmen', es: 'Artesanos' },
        participant: { fr: 'Propriétaire', en: 'Owner', es: 'Propietario' },
        participantPlural: { fr: 'Propriétaires', en: 'Owners', es: 'Propietarios' },
        booking: { fr: 'Intervention', en: 'Intervention', es: 'Intervención' },
        bookingPlural: { fr: 'Interventions', en: 'Interventions', es: 'Intervenciones' },
        itinerary: { fr: 'Planning Gantt', en: 'Gantt Schedule', es: 'Planificación Gantt' },
        destination: { fr: 'Propriété', en: 'Property', es: 'Propiedad' },
        lead: { fr: 'Chantier', en: 'Project', es: 'Proyecto' },
        leadPlural: { fr: 'Chantiers', en: 'Projects', es: 'Proyectos' },
    },

    dashboardWidgets: [
        { id: 'revenue', title: { fr: 'Budget Consommé', en: 'Budget Used', es: 'Presupuesto Consumido' }, icon: 'TrendingUp', dataKey: 'revenue' },
        { id: 'leads', title: { fr: 'Nouveaux Projets', en: 'New Projects', es: 'Nuevos Proyectos' }, icon: 'Target', dataKey: 'leads' },
        { id: 'contacts', title: { fr: 'Investisseurs', en: 'Investors', es: 'Inversores' }, icon: 'Users', dataKey: 'contacts' },
        { id: 'activeTrips', title: { fr: 'Chantiers en Cours', en: 'Active Sites', es: 'Obras Activas' }, icon: 'HardHat', dataKey: 'activeTrips' },
    ],

    pipelineStages: [
        { id: 'new', label: { fr: 'ÉTUDE', en: 'STUDY', es: 'ESTUDIO' } },
        { id: 'ai_processing', label: { fr: 'CHIFFRAGE', en: 'ESTIMATING', es: 'VALORACIÓN' } },
        { id: 'quote_sent', label: { fr: 'DEVIS ENVOYÉ', en: 'QUOTE SENT', es: 'PRESUPUESTO ENVIADO' } },
        { id: 'won', label: { fr: 'CHANTIER DÉMARRÉ', en: 'SITE STARTED', es: 'OBRA INICIADA' } },
    ],

    translationOverrides: {
        'Revenus Totaux': { fr: 'Budget Consommé', en: 'Used Budget', es: 'Presupuesto Consumido' },
        'Voyages Actifs': { fr: 'Chantiers Actifs', en: 'Active Sites', es: 'Obras Activas' },
        'Voyageurs VIP': { fr: 'Propriétaires VIP', en: 'VIP Owners', es: 'Propietarios VIP' },
        'Ajoutez des voyages pour voir les revenus': { fr: 'Ajoutez des chantiers pour voir les budgets', en: 'Add sites to see budgets', es: 'Añade obras para ver presupuestos' },
        'Nouveau Voyage': { fr: 'Nouveau Chantier', en: 'New Site', es: 'Nueva Obra' },
        'Créer le voyage': { fr: 'Ouvrir le chantier', en: 'Open site', es: 'Abrir obra' },
        'Planning Voyages': { fr: 'Planning Chantiers', en: 'Sites Schedule', es: 'Planificación de Obras' },
        'Réservations': { fr: 'Interventions', en: 'Interventions', es: 'Intervenciones' },
        'Nouvelle Réservation': { fr: 'Nouvelle Intervention', en: 'New Intervention', es: 'Nueva Intervención' },
    },
};
