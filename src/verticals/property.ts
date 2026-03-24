/**
 * Luna Vertical — PROPERTY MANAGEMENT (Airbnb / Conciergerie Immobilière)
 */

import type { VerticalConfig } from './types';

export const propertyVertical: VerticalConfig = {
    id: 'property',
    name: 'Luna Property',
    description: {
        fr: 'Plateforme CRM pour la gestion locative et conciergerie Airbnb',
        en: 'CRM platform for rental management and Airbnb concierge',
        es: 'Plataforma CRM para gestión de alquileres y conserjería Airbnb',
    },
    icon: 'Home',

    branding: {
        appName: 'Luna Property',
        tagline: {
            fr: 'Conciergerie Immobilière Premium',
            en: 'Premium Property Concierge',
            es: 'Conserjería Inmobiliaria Premium',
        },
        metaTitle: 'Luna | Conciergerie Immobilière',
        metaDescription: {
            fr: "Gérez vos biens locatifs avec intelligence — Luna Property",
            en: 'Manage your rental properties with intelligence — Luna Property',
            es: 'Gestiona tus propiedades de alquiler con inteligencia — Luna Property',
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
                { name: { fr: 'Locataires', en: 'Tenants', es: 'Inquilinos' }, href: '/crm/contacts', icon: 'Users', featureKey: 'contacts' },
            ],
        },
        {
            label: { fr: 'Opérations', en: 'Operations', es: 'Operaciones' },
            collapsible: true,
            links: [
                { name: { fr: 'Séjours', en: 'Stays', es: 'Estancias' }, href: '/crm/bookings', icon: 'Home', featureKey: 'bookings' },
                { name: { fr: 'Services', en: 'Services', es: 'Servicios' }, href: '/crm/suppliers', icon: 'UsersRound', featureKey: 'suppliers' },
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
                { name: { fr: 'Catalogue Biens', en: 'Property Catalog', es: 'Catálogo de Propiedades' }, href: '/crm/catalog', icon: 'Building2', featureKey: 'catalog' },
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
        subtitle: { fr: 'Gestion & Services', en: 'Management & Services', es: 'Gestión y Servicios' },
        systemPromptPrefix: 'Tu es un expert en gestion locative, conciergerie Airbnb et property management.',
    },

    entities: {
        trip: { fr: 'Séjour', en: 'Stay', es: 'Estancia' },
        tripPlural: { fr: 'Séjours', en: 'Stays', es: 'Estancias' },
        supplier: { fr: 'Service', en: 'Service', es: 'Servicio' },
        supplierPlural: { fr: 'Services', en: 'Services', es: 'Servicios' },
        participant: { fr: 'Locataire', en: 'Tenant', es: 'Inquilino' },
        participantPlural: { fr: 'Locataires', en: 'Tenants', es: 'Inquilinos' },
        booking: { fr: 'Réservation', en: 'Booking', es: 'Reserva' },
        bookingPlural: { fr: 'Réservations', en: 'Bookings', es: 'Reservas' },
        itinerary: { fr: "Guide d'Accueil", en: 'Welcome Guide', es: 'Guía de Bienvenida' },
        destination: { fr: 'Bien', en: 'Property', es: 'Propiedad' },
        lead: { fr: 'Demande', en: 'Inquiry', es: 'Reserva' },
        leadPlural: { fr: 'Demandes', en: 'Inquiries', es: 'Reservas' },
    },

    dashboardWidgets: [
        { id: 'revenue', title: { fr: 'Revenus Locatifs', en: 'Rental Revenue', es: 'Ingresos por Alquiler' }, icon: 'TrendingUp', dataKey: 'revenue' },
        { id: 'leads', title: { fr: 'Demandes', en: 'Requests', es: 'Solicitudes' }, icon: 'Target', dataKey: 'leads' },
        { id: 'contacts', title: { fr: 'Locataires Actifs', en: 'Active Tenants', es: 'Inquilinos Activos' }, icon: 'Users', dataKey: 'contacts' },
        { id: 'activeTrips', title: { fr: 'Séjours en Cours', en: 'Active Stays', es: 'Estancias Activas' }, icon: 'Home', dataKey: 'activeTrips' },
    ],

    pipelineStages: [
        { id: 'new', label: { fr: 'NOUVELLE DEMANDE', en: 'NEW REQUEST', es: 'NUEVA SOLICITUD' } },
        { id: 'ai_processing', label: { fr: 'EN TRAITEMENT', en: 'PROCESSING', es: 'EN PROCESO' } },
        { id: 'quote_sent', label: { fr: 'DEVIS ENVOYÉ', en: 'QUOTE SENT', es: 'PRESUPUESTO ENVIADO' } },
        { id: 'won', label: { fr: 'CONFIRMÉ', en: 'CONFIRMED', es: 'CONFIRMADO' } },
    ],

    translationOverrides: {
        'Voyages Actifs': { fr: 'Séjours Actifs', en: 'Active Stays', es: 'Estancias Activas' },
        'Voyageurs VIP': { fr: 'Locataires VIP', en: 'VIP Tenants', es: 'Inquilinos VIP' },
        'Nouveau Voyage': { fr: 'Nouveau Séjour', en: 'New Stay', es: 'Nueva Estancia' },
        'Créer le voyage': { fr: 'Créer le séjour', en: 'Create stay', es: 'Crear estancia' },
        'Prestataires': { fr: 'Services', en: 'Services', es: 'Servicios' },
        'Ajouter un prestataire': { fr: 'Ajouter un service', en: 'Add a service', es: 'Añadir un servicio' },
        'Nouveau Prestataire': { fr: 'Nouveau Service', en: 'New Service', es: 'Nuevo Servicio' },
        'Réservations': { fr: 'Séjours', en: 'Stays', es: 'Estancias' },
        'Concierge Voyage': { fr: 'Concierge Immobilier', en: 'Property Concierge', es: 'Conserje Inmobiliario' },
        'Calendrier de vos voyages et prestations.': { fr: 'Calendrier de vos séjours et services.', en: 'Calendar of your stays and services.', es: 'Calendario de tus estancias y servicios.' },
        'Gérez vos prestataires et partenaires.': { fr: 'Gérez vos services et partenaires.', en: 'Manage your services and partners.', es: 'Gestiona tus servicios y socios.' },
        'Gérez vos réservations de voyages.': { fr: 'Gérez vos réservations de séjours.', en: 'Manage your stay bookings.', es: 'Gestiona tus reservas de estancias.' },
    },
};
