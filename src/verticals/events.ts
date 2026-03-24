/**
 * Luna Vertical — EVENTS (Event Planning / Wedding Planner)
 */

import type { VerticalConfig } from './types';

export const eventsVertical: VerticalConfig = {
    id: 'events',
    name: 'Luna Events',
    description: {
        fr: "Plateforme CRM pour l'événementiel et le wedding planning",
        en: 'CRM platform for event planning and wedding coordination',
        es: 'Plataforma CRM para planificación de eventos y bodas',
    },
    icon: 'PartyPopper',

    branding: {
        appName: 'Luna Events',
        tagline: {
            fr: 'Conciergerie Événementielle Premium',
            en: 'Premium Event Concierge',
            es: 'Conserjería de Eventos Premium',
        },
        metaTitle: 'Luna | Conciergerie Événementielle',
        metaDescription: {
            fr: "Organisez des événements exceptionnels avec l'IA — Luna Events",
            en: 'Organize exceptional events with AI — Luna Events',
            es: 'Organiza eventos excepcionales con IA — Luna Events',
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
            label: { fr: 'Événements', en: 'Events', es: 'Eventos' },
            collapsible: true,
            links: [
                { name: { fr: 'Événements', en: 'Events', es: 'Eventos' }, href: '/crm/bookings', icon: 'PartyPopper', featureKey: 'bookings' },
                { name: { fr: 'Prestataires', en: 'Vendors', es: 'Proveedores' }, href: '/crm/suppliers', icon: 'UsersRound', featureKey: 'suppliers' },
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
                { name: { fr: 'Catalogue', en: 'Catalog', es: 'Catálogo' }, href: '/crm/catalog', icon: 'Sparkles', featureKey: 'catalog' },
                { name: { fr: 'Templates', en: 'Templates', es: 'Plantillas' }, href: '/crm/templates', icon: 'Palette', featureKey: 'website-editor' },
                { name: { fr: 'Collections', en: 'Collections', es: 'Colecciones' }, href: '/crm/collections', icon: 'Map', featureKey: 'website-editor' },
                { name: { fr: 'Équipe', en: 'Team', es: 'Equipo' }, href: '/crm/team', icon: 'UsersRound', featureKey: 'team' },
                { name: { fr: 'Analytics', en: 'Analytics', es: 'Analítica' }, href: '/crm/analytics', icon: 'BarChart3', featureKey: 'analytics' },
                { name: { fr: 'Intégrations', en: 'Integrations', es: 'Integraciones' }, href: '/crm/integrations', icon: 'Plug', featureKey: 'integrations' },
                { name: { fr: 'Installation', en: 'Setup', es: 'Instalación' }, href: '/crm/setup', icon: 'Wrench' },
            ],
        },
    ],

    aiAgent: {
        name: { fr: 'Agent IA', en: 'AI Agent', es: 'Agente IA' },
        subtitle: { fr: 'Événements & Prestations', en: 'Events & Services', es: 'Eventos y Servicios' },
        systemPromptPrefix: "Tu es un expert en organisation d'événements, wedding planning et conciergerie événementielle de luxe.",
    },

    entities: {
        trip: { fr: 'Événement', en: 'Event', es: 'Evento' },
        tripPlural: { fr: 'Événements', en: 'Events', es: 'Eventos' },
        supplier: { fr: 'Prestataire', en: 'Vendor', es: 'Proveedor' },
        supplierPlural: { fr: 'Prestataires', en: 'Vendors', es: 'Proveedores' },
        participant: { fr: 'Invité', en: 'Guest', es: 'Invitado' },
        participantPlural: { fr: 'Invités', en: 'Guests', es: 'Invitados' },
        booking: { fr: 'Réservation', en: 'Booking', es: 'Reserva' },
        bookingPlural: { fr: 'Réservations', en: 'Bookings', es: 'Reservas' },
        itinerary: { fr: 'Programme', en: 'Program', es: 'Programa' },
        destination: { fr: 'Lieu', en: 'Venue', es: 'Lugar' },
        lead: { fr: 'Opportunité', en: 'Opportunity', es: 'Oportunidad' },
        leadPlural: { fr: 'Opportunités', en: 'Opportunities', es: 'Oportunidades' },
    },

    dashboardWidgets: [
        { id: 'revenue', title: { fr: 'Revenus Événements', en: 'Event Revenue', es: 'Ingresos por Eventos' }, icon: 'TrendingUp', dataKey: 'revenue' },
        { id: 'leads', title: { fr: 'Demandes', en: 'Inquiries', es: 'Consultas' }, icon: 'Target', dataKey: 'leads' },
        { id: 'contacts', title: { fr: 'Clients Actifs', en: 'Active Clients', es: 'Clientes Activos' }, icon: 'Users', dataKey: 'contacts' },
        { id: 'activeTrips', title: { fr: 'Événements en Cours', en: 'Active Events', es: 'Eventos Activos' }, icon: 'PartyPopper', dataKey: 'activeTrips' },
    ],

    pipelineStages: [
        { id: 'new', label: { fr: 'NOUVELLE DEMANDE', en: 'NEW INQUIRY', es: 'NUEVA CONSULTA' } },
        { id: 'ai_processing', label: { fr: 'PROPOSITION EN COURS', en: 'PROPOSAL IN PROGRESS', es: 'PROPUESTA EN CURSO' } },
        { id: 'quote_sent', label: { fr: 'DEVIS ENVOYÉ', en: 'QUOTE SENT', es: 'PRESUPUESTO ENVIADO' } },
        { id: 'won', label: { fr: 'CONFIRMÉ', en: 'CONFIRMED', es: 'CONFIRMADO' } },
    ],

    translationOverrides: {
        'Voyages Actifs': { fr: 'Événements Actifs', en: 'Active Events', es: 'Eventos Activos' },
        'Voyageurs VIP': { fr: 'Clients VIP', en: 'VIP Clients', es: 'Clientes VIP' },
        'Nouveau Voyage': { fr: 'Nouvel Événement', en: 'New Event', es: 'Nuevo Evento' },
        'Créer le voyage': { fr: "Créer l'événement", en: 'Create event', es: 'Crear evento' },
        'Réservations': { fr: 'Événements', en: 'Events', es: 'Eventos' },
        'Concierge Voyage': { fr: 'Concierge Événementiel', en: 'Event Concierge', es: 'Conserje de Eventos' },
        'Calendrier de vos voyages et prestations.': { fr: 'Calendrier de vos événements et prestations.', en: 'Calendar of your events and services.', es: 'Calendario de tus eventos y servicios.' },
        'Gérez vos réservations de voyages.': { fr: 'Gérez vos événements.', en: 'Manage your events.', es: 'Gestiona tus eventos.' },
        'Missions Actives': { fr: 'Événements Actifs', en: 'Active Events', es: 'Eventos Activos' },
    },
};
