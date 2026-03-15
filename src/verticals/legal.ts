/**
 * Luna Vertical — LEGAL (Cabinet d'Avocats / Le Droit Agent)
 */

import type { VerticalConfig } from './types';

export const legalVertical: VerticalConfig = {
    id: 'legal',
    name: 'Le Droit Agent',
    description: {
        fr: 'Plateforme CRM pour cabinets d\'avocats et professionnels du droit',
        en: 'CRM platform for law firms and legal professionals',
        es: 'Plataforma CRM para bufetes de abogados y profesionales del derecho',
    },
    icon: 'Scale',
    accentColor: '#A07850',       // warm pastel brown
    accentColorLight: '#EDE0D4',  // very light pastel brown background

    branding: {
        appName: 'Le Droit Agent',
        tagline: {
            fr: 'L\'IA au service du Droit',
            en: 'AI-Powered Legal Practice',
            es: 'IA al servicio del Derecho',
        },
        metaTitle: 'Le Droit Agent | IA Juridique',
        metaDescription: {
            fr: 'Analysez vos dossiers, recherchez la jurisprudence et planifiez vos procédures avec l\'IA — Le Droit Agent',
            en: 'Analyze cases, research jurisprudence and plan procedures with AI — Le Droit Agent',
            es: 'Analice expedientes, investigue jurisprudencia y planifique procedimientos con IA — Le Droit Agent',
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
                { name: { fr: 'Agenda', en: 'Agenda', es: 'Agenda' }, href: '/crm/planning', icon: 'Calendar', featureKey: 'planning' },
                { name: { fr: 'Clients', en: 'Clients', es: 'Clientes' }, href: '/crm/contacts', icon: 'Users', featureKey: 'contacts' },
            ],
        },
        {
            label: { fr: 'Dossiers', en: 'Cases', es: 'Expedientes' },
            collapsible: true,
            links: [
                { name: { fr: 'Dossiers', en: 'Cases', es: 'Expedientes' }, href: '/crm/dossiers', icon: 'Briefcase', featureKey: 'bookings' },
                { name: { fr: 'Collaborateurs', en: 'Associates', es: 'Asociados' }, href: '/crm/suppliers', icon: 'Scale', featureKey: 'suppliers' },
            ],
        },
        {
            label: { fr: 'Finance', en: 'Finance', es: 'Finanzas' },
            collapsible: true,
            links: [
                { name: { fr: 'Honoraires', en: 'Fees', es: 'Honorarios' }, href: '/crm/quotes', icon: 'FileSignature', featureKey: 'quotes' },
                { name: { fr: 'Factures', en: 'Invoices', es: 'Facturas' }, href: '/crm/invoices', icon: 'FileText', featureKey: 'invoices' },
                { name: { fr: 'Paiements', en: 'Payments', es: 'Pagos' }, href: '/crm/payments', icon: 'CreditCard', featureKey: 'payments' },
            ],
        },
        {
            label: { fr: 'Gestion', en: 'Management', es: 'Gestión' },
            collapsible: true,
            links: [
                { name: { fr: 'Base Documentaire', en: 'Document Library', es: 'Base Documental' }, href: '/crm/catalog', icon: 'BookOpen', featureKey: 'catalog' },
                { name: { fr: 'Site Builder & Modèles', en: 'Site Builder & Templates', es: 'Constructor & Modelos' }, href: '/crm/site-builder', icon: 'Layout', featureKey: 'website-editor' },
                { name: { fr: 'Jurisprudence', en: 'Case Law', es: 'Jurisprudencia' }, href: '/crm/jurisprudence', icon: 'ScrollText', featureKey: 'website-editor' },
                { name: { fr: 'Équipe', en: 'Team', es: 'Equipo' }, href: '/crm/team', icon: 'UsersRound', featureKey: 'team' },
                { name: { fr: 'Analytics', en: 'Analytics', es: 'Analítica' }, href: '/crm/analytics', icon: 'BarChart3', featureKey: 'analytics' },
                { name: { fr: 'Installation', en: 'Setup', es: 'Instalación' }, href: '/crm/setup', icon: 'Wrench' },
            ],
        },
    ],

    aiAgent: {
        name: { fr: 'Agent Juridique', en: 'Legal Agent', es: 'Agente Jurídico' },
        subtitle: { fr: 'Droit & Jurisprudence', en: 'Law & Jurisprudence', es: 'Derecho y Jurisprudencia' },
        systemPromptPrefix: "Tu es un expert en droit français et européen, spécialisé dans l'analyse de dossiers juridiques, la recherche de jurisprudence et la planification de procédures. Tu assistes les avocats et professionnels du droit avec rigueur et précision.",
    },

    entities: {
        trip: { fr: 'Dossier', en: 'Case', es: 'Expediente' },
        tripPlural: { fr: 'Dossiers', en: 'Cases', es: 'Expedientes' },
        supplier: { fr: 'Collaborateur', en: 'Associate', es: 'Asociado' },
        supplierPlural: { fr: 'Collaborateurs', en: 'Associates', es: 'Asociados' },
        participant: { fr: 'Client', en: 'Client', es: 'Cliente' },
        participantPlural: { fr: 'Clients', en: 'Clients', es: 'Clientes' },
        booking: { fr: 'Mission', en: 'Engagement', es: 'Encargo' },
        bookingPlural: { fr: 'Missions', en: 'Engagements', es: 'Encargos' },
        itinerary: { fr: 'Timeline', en: 'Timeline', es: 'Cronología' },
        destination: { fr: 'Juridiction', en: 'Jurisdiction', es: 'Jurisdicción' },
    },

    dashboardWidgets: [
        { id: 'revenue', title: { fr: 'Honoraires Facturés', en: 'Billed Fees', es: 'Honorarios Facturados' }, icon: 'TrendingUp', dataKey: 'revenue' },
        { id: 'leads', title: { fr: 'Nouveaux Dossiers', en: 'New Cases', es: 'Nuevos Expedientes' }, icon: 'Briefcase', dataKey: 'leads' },
        { id: 'contacts', title: { fr: 'Clients Actifs', en: 'Active Clients', es: 'Clientes Activos' }, icon: 'Users', dataKey: 'contacts' },
        { id: 'activeTrips', title: { fr: 'Dossiers en Cours', en: 'Active Cases', es: 'Expedientes Activos' }, icon: 'Scale', dataKey: 'activeTrips' },
    ],

    pipelineStages: [
        { id: 'new', label: { fr: 'NOUVEAU DOSSIER', en: 'NEW CASE', es: 'NUEVO EXPEDIENTE' } },
        { id: 'ai_processing', label: { fr: 'ANALYSE IA', en: 'AI ANALYSIS', es: 'ANÁLISIS IA' } },
        { id: 'quote_sent', label: { fr: 'DEVIS HONORAIRES', en: 'FEE PROPOSAL', es: 'PROPUESTA DE HONORARIOS' } },
        { id: 'won', label: { fr: 'DOSSIER OUVERT', en: 'CASE OPENED', es: 'EXPEDIENTE ABIERTO' } },
    ],

    translationOverrides: {
        // ═══ DASHBOARD ═══
        'Voyages Actifs': { fr: 'Dossiers Actifs', en: 'Active Cases', es: 'Expedientes Activos' },
        'Voyageurs VIP': { fr: 'Clients Prioritaires', en: 'Priority Clients', es: 'Clientes Prioritarios' },
        'Concierge Voyage': { fr: 'Assistant Juridique', en: 'Legal Assistant', es: 'Asistente Jurídico' },
        'Conciergerie': { fr: 'Dossiers Récents', en: 'Recent Cases', es: 'Expedientes Recientes' },
        'Conciergerie à jour': { fr: 'Aucun dossier urgent', en: 'No urgent cases', es: 'Sin expedientes urgentes' },
        'Ajoutez des voyages pour voir les revenus': { fr: 'Ajoutez des dossiers pour voir les honoraires', en: 'Add cases to see fees', es: 'Añade expedientes para ver honorarios' },
        'Revenus Totaux': { fr: 'Honoraires Totaux', en: 'Total Fees', es: 'Honorarios Totales' },

        // ═══ PIPELINE ═══
        'Revenus Portefeuille': { fr: 'Honoraires Facturés', en: 'Billed Fees', es: 'Honorarios Facturados' },
        'Opportunités': { fr: 'Nouveaux Dossiers', en: 'New Cases', es: 'Nuevos Expedientes' },
        'Missions Actives': { fr: 'Dossiers en Cours', en: 'Active Cases', es: 'Expedientes Activos' },
        'Aucun deal dans cette étape': { fr: 'Aucun dossier dans cette étape', en: 'No cases in this stage', es: 'Sin expedientes en esta etapa' },
        'Nouveau lead': { fr: 'Nouveau dossier', en: 'New case', es: 'Nuevo expediente' },
        'Nom du lead...': { fr: 'Nom du dossier...', en: 'Case name...', es: 'Nombre del expediente...' },
        'Créer le voyage': { fr: 'Ouvrir le dossier', en: 'Open case', es: 'Abrir expediente' },
        'Nouveau Voyage': { fr: 'Nouveau Dossier', en: 'New Case', es: 'Nuevo Expediente' },
        'DEVIS ENVOYÉ': { fr: 'CONVENTION ENVOYÉE', en: 'AGREEMENT SENT', es: 'CONVENIO ENVIADO' },
        'Gérez vos leads du premier contact au closing.': { fr: "Gérez vos affaires du premier contact à l'ouverture du dossier.", en: 'Manage your cases from first contact to file opening.', es: 'Gestiona tus asuntos desde el primer contacto hasta la apertura.' },

        // ═══ PLANNING / AGENDA ═══
        'Planning Voyages': { fr: 'Agenda Cabinet', en: 'Firm Calendar', es: 'Agenda del Despacho' },
        'Nouveau voyage': { fr: 'Nouvel événement', en: 'New event', es: 'Nuevo evento' },
        'Modifier le voyage': { fr: "Modifier l'événement", en: 'Edit event', es: 'Editar evento' },
        'Calendrier de vos voyages et prestations.': { fr: 'Agenda de vos audiences et échéances.', en: 'Calendar of your hearings and deadlines.', es: 'Agenda de tus audiencias y plazos.' },
        'VOYAGES': { fr: 'AUDIENCES', en: 'HEARINGS', es: 'AUDIENCIAS' },
        'PRESTATIONS': { fr: 'ACTES', en: 'FILINGS', es: 'ACTOS' },
        'Voyage & Prestations': { fr: 'Droit & Jurisprudence', en: 'Law & Jurisprudence', es: 'Derecho y Jurisprudencia' },

        // ═══ BOOKINGS / DOSSIERS ═══
        'Réservations': { fr: 'Dossiers', en: 'Cases', es: 'Expedientes' },
        'Nouvelle Réservation': { fr: 'Nouveau Dossier', en: 'New Case', es: 'Nuevo Expediente' },
        'Créer la réservation': { fr: 'Créer le dossier', en: 'Create case', es: 'Crear expediente' },
        'Aucune réservation trouvée.': { fr: 'Aucun dossier trouvé.', en: 'No cases found.', es: 'Sin expedientes.' },
        'Ajoutez une réservation de vol, hôtel ou transfert': { fr: 'Ouvrez un nouveau dossier juridique', en: 'Open a new legal case', es: 'Abra un nuevo expediente jurídico' },
        'Gérez vos réservations de voyages.': { fr: 'Gérez vos dossiers juridiques.', en: 'Manage your legal cases.', es: 'Gestiona tus expedientes jurídicos.' },
        'Vol': { fr: 'Procédure', en: 'Procedure', es: 'Procedimiento' },
        'Hôtel': { fr: 'Conseil', en: 'Consultation', es: 'Consultoría' },
        'Activité': { fr: 'Audience', en: 'Hearing', es: 'Audiencia' },
        'Transfert': { fr: 'Expertise', en: 'Expert Assessment', es: 'Peritaje' },
        'FLIGHT': { fr: 'PROCÉDURE', en: 'PROCEDURE', es: 'PROCEDIMIENTO' },
        'HOTEL': { fr: 'CONSEIL', en: 'CONSULTATION', es: 'CONSULTORÍA' },
        'ACTIVITY': { fr: 'AUDIENCE', en: 'HEARING', es: 'AUDIENCIA' },
        'TRANSFER': { fr: 'EXPERTISE', en: 'EXPERT', es: 'PERITAJE' },
        'ALL': { fr: 'TOUT', en: 'ALL', es: 'TODO' },
        'Voir Réservations': { fr: 'Voir Dossiers', en: 'View Cases', es: 'Ver Expedientes' },
        'Réservations Liées': { fr: 'Dossiers Liés', en: 'Related Cases', es: 'Expedientes Relacionados' },
        'Aucune réservation attachée': { fr: 'Aucun dossier attaché', en: 'No cases attached', es: 'Sin expedientes adjuntos' },

        // ═══ SUPPLIERS / COLLABORATEURS ═══
        'Prestataires': { fr: 'Collaborateurs', en: 'Associates', es: 'Asociados' },
        'Nouveau Prestataire': { fr: 'Nouveau Collaborateur', en: 'New Associate', es: 'Nuevo Asociado' },
        'NOUVEAU PRESTATAIRE': { fr: 'NOUVEAU COLLABORATEUR', en: 'NEW ASSOCIATE', es: 'NUEVO ASOCIADO' },
        'Gérez vos guides, véhicules et services avec Luna Sync.': { fr: 'Gérez vos experts, huissiers et confrères.', en: 'Manage your experts, bailiffs and colleagues.', es: 'Gestiona tus peritos, procuradores y colegas.' },
        'Hébergement': { fr: 'Expert Judiciaire', en: 'Court Expert', es: 'Perito Judicial' },
        'HÉBERGEMENT': { fr: 'EXPERT', en: 'EXPERT', es: 'PERITO' },
        'Restaurant': { fr: 'Huissier', en: 'Bailiff', es: 'Procurador' },
        'RESTAURANT': { fr: 'HUISSIER', en: 'BAILIFF', es: 'PROCURADOR' },
        'Transport': { fr: 'Greffe', en: 'Court Clerk', es: 'Secretaría Judicial' },
        'TRANSPORT': { fr: 'GREFFE', en: 'CLERK', es: 'SECRETARÍA' },
        'Guide': { fr: 'Avocat Collaborateur', en: 'Associate Lawyer', es: 'Abogado Asociado' },
        'GUIDE': { fr: 'AVOCAT', en: 'LAWYER', es: 'ABOGADO' },
        'Guide Certifié': { fr: 'Collaborateur Certifié', en: 'Certified Associate', es: 'Asociado Certificado' },

        // ═══ QUOTES / HONORAIRES ═══
        'Devis': { fr: "Convention d'Honoraires", en: 'Fee Agreement', es: 'Convenio de Honorarios' },
        'CRÉER UN DEVIS': { fr: 'ÉTABLIR UNE CONVENTION', en: 'CREATE AGREEMENT', es: 'CREAR CONVENIO' },
        'Créer un devis': { fr: 'Établir une convention', en: 'Create agreement', es: 'Crear convenio' },

        // ═══ AI AGENT ═══
        'Expert Voyages IA': { fr: 'Expert Juridique IA', en: 'AI Legal Expert', es: 'Experto Jurídico IA' },
        'Luna Conciergerie': { fr: 'Le Droit Agent', en: 'Le Droit Agent', es: 'Le Droit Agent' },
        'Votre Conciergerie': { fr: 'Votre Cabinet', en: 'Your Firm', es: 'Su Despacho' },

        // ═══ CONTACTS ═══
        'Gérez votre base de clients et prestataires.': { fr: 'Gérez votre base de clients et collaborateurs.', en: 'Manage your clients and associates.', es: 'Gestiona tus clientes y asociados.' },
    },
};
