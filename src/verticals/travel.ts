/**
 * Luna Vertical — TRAVEL (default)
 * 
 * This config reproduces the current Luna behavior exactly.
 * No visual or behavioral change for existing users.
 */

import type { VerticalConfig } from './types';

export const travelVertical: VerticalConfig = {
    id: 'travel',
    name: 'Luna DMC',
    description: {
        fr: 'Plateforme CRM pour les professionnels du voyage',
        en: 'CRM platform for travel professionals',
        es: 'Plataforma CRM para profesionales del viaje',
    },
    icon: 'Plane',

    branding: {
        appName: 'Luna DMC',
        tagline: {
            fr: 'Concierge Voyage Premium',
            en: 'Premium Travel Concierge',
            es: 'Conserje de Viajes Premium',
        },
        metaTitle: 'Luna | Concierge Voyage',
        metaDescription: {
            fr: "Votre concierge voyage premium propulsé par l'intelligence artificielle",
            en: 'Your premium travel concierge powered by artificial intelligence',
            es: 'Tu conserje de viajes premium impulsado por inteligencia artificial',
        },
    },

    sidebar: [
        {
            label: '',
            collapsible: false,
            links: [
                { name: { fr: 'Dashboard', en: 'Dashboard', es: 'Panel' }, href: '/crm/travel', icon: 'LayoutDashboard', featureKey: 'dashboard' },
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
                { name: { fr: 'Voyages', en: 'Trips', es: 'Viajes' }, href: '/crm/trips', icon: 'Plane', featureKey: 'bookings' },
                { name: { fr: 'Réservations', en: 'Bookings', es: 'Reservas' }, href: '/crm/bookings', icon: 'Hotel', featureKey: 'bookings' },
                { name: { fr: 'Prestataires', en: 'Suppliers', es: 'Proveedores' }, href: '/crm/suppliers', icon: 'UsersRound', featureKey: 'suppliers' },
            ],
        },
        {
            label: { fr: 'Finance', en: 'Finance', es: 'Finanzas' },
            collapsible: true,
            links: [
                { name: { fr: 'Devis', en: 'Quotes', es: 'Presupuestos' }, href: '/crm/quotes', icon: 'FileSignature', featureKey: 'quotes' },
                { name: { fr: 'Factures', en: 'Invoices', es: 'Facturas' }, href: '/crm/invoices', icon: 'FileText', featureKey: 'invoices' },
                { name: { fr: 'Paiements', en: 'Payments', es: 'Pagos' }, href: '/crm/payments', icon: 'CreditCard', featureKey: 'payments' },
                { name: { fr: 'Banque', en: 'Banking', es: 'Banco' }, href: '/crm/banking', icon: 'Landmark', featureKey: 'payments' },
            ],
        },
        {
            label: { fr: 'Gestion', en: 'Management', es: 'Gestión' },
            collapsible: true,
            links: [
                { name: { fr: 'Catalogue', en: 'Catalog', es: 'Catálogo' }, href: '/crm/catalog', icon: 'Hotel', featureKey: 'catalog' },
                { name: { fr: 'Site Builder & Templates', en: 'Site Builder & Templates', es: 'Constructor & Plantillas' }, href: '/crm/site-builder', icon: 'Layout', featureKey: 'website-editor' },
                { name: { fr: 'Collections', en: 'Collections', es: 'Colecciones' }, href: '/crm/collections', icon: 'Map', featureKey: 'website-editor' },
                { name: { fr: 'Équipe', en: 'Team', es: 'Equipo' }, href: '/crm/team', icon: 'UsersRound', featureKey: 'team' },
                { name: { fr: 'Analytics', en: 'Analytics', es: 'Analítica' }, href: '/crm/analytics', icon: 'BarChart3', featureKey: 'analytics' },
                { name: { fr: 'Intégrations', en: 'Integrations', es: 'Integraciones' }, href: '/crm/integrations', icon: 'Plane', featureKey: 'integrations' },
                { name: { fr: 'Installation', en: 'Setup', es: 'Instalación' }, href: '/crm/setup', icon: 'Wrench' },
            ],
        },
    ],

    aiAgent: {
        name: { fr: 'Agent IA', en: 'AI Agent', es: 'Agente IA' },
        subtitle: { fr: 'Voyage & Prestations', en: 'Travel & Services', es: 'Viaje y Servicios' },
        systemPromptPrefix: 'Tu es un expert en voyage et conciergerie de luxe.',
    },

    entities: {
        trip: { fr: 'Voyage', en: 'Trip', es: 'Viaje' },
        tripPlural: { fr: 'Voyages', en: 'Trips', es: 'Viajes' },
        supplier: { fr: 'Prestataire', en: 'Supplier', es: 'Proveedor' },
        supplierPlural: { fr: 'Prestataires', en: 'Suppliers', es: 'Proveedores' },
        participant: { fr: 'Voyageur', en: 'Traveler', es: 'Viajero' },
        participantPlural: { fr: 'Voyageurs', en: 'Travelers', es: 'Viajeros' },
        booking: { fr: 'Réservation', en: 'Booking', es: 'Reserva' },
        bookingPlural: { fr: 'Réservations', en: 'Bookings', es: 'Reservas' },
        itinerary: { fr: 'Itinéraire', en: 'Itinerary', es: 'Itinerario' },
        destination: { fr: 'Destination', en: 'Destination', es: 'Destino' },
        lead: { fr: 'Demande', en: 'Lead' },
        leadPlural: { fr: 'Demandes', en: 'Leads' },
    },

    dashboardWidgets: [
        { id: 'revenue', title: { fr: 'Revenus Portefeuille', en: 'Portfolio Revenue', es: 'Ingresos del Portafolio' }, icon: 'TrendingUp', dataKey: 'revenue' },
        { id: 'leads', title: { fr: 'Opportunités', en: 'Opportunities', es: 'Oportunidades' }, icon: 'Target', dataKey: 'leads' },
        { id: 'contacts', title: { fr: 'Voyageurs VIP', en: 'VIP Travelers', es: 'Viajeros VIP' }, icon: 'Users', dataKey: 'contacts' },
        { id: 'activeTrips', title: { fr: 'Missions Actives', en: 'Active Missions', es: 'Misiones Activas' }, icon: 'PlaneTakeoff', dataKey: 'activeTrips' },
    ],

    pipelineStages: [
        { id: 'new', label: { fr: 'NOUVEAU', en: 'NEW', es: 'NUEVO' } },
        { id: 'ai_processing', label: { fr: 'IA EN COURS', en: 'AI IN PROGRESS', es: 'IA EN CURSO' } },
        { id: 'quote_sent', label: { fr: 'DEVIS ENVOYÉ', en: 'QUOTE SENT', es: 'PRESUPUESTO ENVIADO' } },
        { id: 'won', label: { fr: 'GAGNÉ', en: 'WON', es: 'GANADO' } },
    ],

    translationOverrides: {},
};
