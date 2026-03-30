import type { LunaLocale } from '@/src/lib/i18n/translations';

export type ProDashboardCopy = {
    unauthTitle: string;
    unauthSubtitle: string;
    login: string;
    signup: string;
    languageSelector: string;
    headerBadge: string;
    headerTitle: string;
    connected: string;
    tenant: string;
    profile: string;
    pricing: string;
    logout: string;
    navPlanning: string;
    navPrestations: string;
    navTrip: string;
    navFinance: string;
    navHint: string;
    planningTitle: string;
    planningDescription: string;
    planningCompact: string;
    trips: string;
    tripValidated: string;
    resaValidated: string;
    validationQuick: string;
    dateToDefine: string;
    noTripYet: string;
    client: string;
    destination: string;
    departure: string;
    alert: string;
    status: string;
    tripLunaValid: string;
    resaLunaValid: string;
    total: string;
    commission: string;
    invoice: string;
    open: string;
    valid: string;
    notValid: string;
    validated: string;
    notValidated: string;
    prestationsTitle: string;
    prestationsDescription: string;
    selectedCount: string;
    catalogTotal: string;
    withImage: string;
    displayed: string;
    selected: string;
    advancedFilters: string;
    hideFilters: string;
    showFilters: string;
    reset: string;
    searchPlaceholder: string;
    allTypes: string;
    allLocations: string;
    allBudgets: string;
    budgetLt500: string;
    budget5001499: string;
    budget15002999: string;
    budgetGte3000: string;
    recommendedSort: string;
    priceAsc: string;
    priceDesc: string;
    nameAsc: string;
    onlyWithImage: string;
    noLocation: string;
    noDescription: string;
    selectedTag: string;
    selectedDetail: string;
    requestedSlotTitle: string;
    requestedDateLabel: string;
    requestedStartLabel: string;
    requestedEndLabel: string;
    requestedNoteLabel: string;
    requestedNotePlaceholder: string;
    requestedNotSet: string;
    tripSectionTitle: string;
    tripSectionDescription: string;
    clientLabel: string;
    clientEmailLabel: string;
    destinationLabel: string;
    travelersLabel: string;
    startDateLabel: string;
    endDateLabel: string;
    commissionRateLabel: string;
    notesLabel: string;
    commissionHint: string;
    clientPlaceholder: string;
    clientEmailPlaceholder: string;
    destinationPlaceholder: string;
    travelersPlaceholder: string;
    notesPlaceholder: string;
    routine: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    financeTitle: string;
    financeDescription: string;
    openPricing: string;
    financialSummary: string;
    totalClient: string;
    supplierCost: string;
    selectedItems: string;
    itemUnit: string;
    selectedValue: string;
    planningAlerts: string;
    proposal: string;
    confirmationClient: string;
    deposit: string;
    immediate: string;
    dayPlus2: string;
    dayPlus4: string;
    toDefine: string;
    createTripInvoice: string;
    confirmTrip: string;
    openInvoicePdf: string;
    errorRequiredClient: string;
    errorRequiredDestination: string;
    errorRequiredItem: string;
    errorCreateTrip: string;
    errorNetworkCreate: string;
    successTripCreated: string;
    successInvoice: string;
    errorConfirm: string;
    successConfirm: string;
    errorNetworkConfirm: string;
    errorValidationUpdate: string;
    successValidationUpdate: string;
    planningFollowup: string;
    tripShort: string;
    resaShort: string;
    commissionPlaceholder: string;
    workflowLabel: string;
    workflowPending: string;
    workflowSent: string;
    workflowConfirmed: string;
    workflowFinal: string;
    workflowInReview: string;
    lunaMessageLabel: string;
    confirmReturnToLuna: string;
    confirmAction: string;
    workflowColumn: string;
    actionColumn: string;
    successSentToLuna: string;
    proposedSlots: string;
    availabilityAvailable: string;
    availabilityAlternative: string;
    availabilityUnavailable: string;
    notAvailable: string;
    crmAlertBell: string;
    crmAlertTitle: string;
    crmAlertEmpty: string;
    crmAlertTripValidated: string;
    crmAlertMarkRead: string;
    crmAlertMarking: string;
    crmAlertMarkAllRead: string;
    crmAlertUnread: string;
    errorAlertMarkRead: string;
};

export const PRO_DASHBOARD_COPY: Record<LunaLocale, ProDashboardCopy> = {
    fr: {
        unauthTitle: 'Acces Pro Luna Travel',
        unauthSubtitle: 'Connecte-toi ou cree un compte pro pour gerer les trips, commissions, planning, confirmations et factures.',
        login: 'Connexion',
        signup: 'Inscription',
        languageSelector: 'Langue dashboard pro',
        headerBadge: 'Luna Pro',
        headerTitle: 'Routine Pro: Creation de Trip',
        connected: 'Connecte',
        tenant: 'Tenant',
        profile: 'Ma fiche pro',
        pricing: 'Prix & commissions',
        logout: 'Deconnexion',
        navPlanning: 'Planning',
        navPrestations: 'Prestations',
        navTrip: 'Creation Trip',
        navFinance: 'Finance',
        navHint: 'Menus deployables animes',
        planningTitle: 'Planning Luna: Trips et Resas',
        planningDescription: 'Suivi des validations cote Luna dans Firebase: trip valide ou non, resa validee ou non.',
        planningCompact: 'Vue compacte: ouvre ou referme cette section selon ton besoin.',
        trips: 'Trips',
        tripValidated: 'Trip valides',
        resaValidated: 'Resas validees',
        validationQuick: 'Validation rapide',
        dateToDefine: 'Date a definir',
        noTripYet: 'Aucun trip cree pour le moment.',
        client: 'Client',
        destination: 'Destination',
        departure: 'Depart',
        alert: 'Alerte',
        status: 'Statut',
        tripLunaValid: 'Trip valide Luna',
        resaLunaValid: 'Resa validee Luna',
        total: 'Total',
        commission: 'Commission',
        invoice: 'Facture',
        open: 'Ouvrir',
        valid: 'Valide',
        notValid: 'Non valide',
        validated: 'Validee',
        notValidated: 'Non validee',
        prestationsTitle: 'Selection des prestations',
        prestationsDescription: 'Catalogue, filtres et selection rapide.',
        selectedCount: 'selection(s)',
        catalogTotal: 'Catalogue total',
        withImage: 'Avec image',
        displayed: 'Affichees',
        selected: 'Selectionnees',
        advancedFilters: 'Filtres avances',
        hideFilters: 'Masquer les filtres',
        showFilters: 'Afficher les filtres',
        reset: 'Reinitialiser',
        searchPlaceholder: 'Recherche rapide: prestation, lieu, type...',
        allTypes: 'Tous les types',
        allLocations: 'Tous les lieux',
        allBudgets: 'Tous les budgets',
        budgetLt500: 'Moins de 500 EUR',
        budget5001499: '500 a 1499 EUR',
        budget15002999: '1500 a 2999 EUR',
        budgetGte3000: '3000 EUR et plus',
        recommendedSort: 'Tri recommande',
        priceAsc: 'Prix croissant',
        priceDesc: 'Prix decroissant',
        nameAsc: 'Nom A-Z',
        onlyWithImage: 'Afficher seulement les prestations avec image',
        noLocation: 'Sans localisation',
        noDescription: 'Aucune description disponible.',
        selectedTag: 'Selectionnee',
        selectedDetail: 'Prestations selectionnees (detail)',
        requestedSlotTitle: 'Creneau demande au prestataire',
        requestedDateLabel: 'Jour',
        requestedStartLabel: 'Debut',
        requestedEndLabel: 'Fin',
        requestedNoteLabel: 'Note',
        requestedNotePlaceholder: 'Ex: flexible +/- 30 min',
        requestedNotSet: 'Non defini',
        tripSectionTitle: 'Client et details du trip',
        tripSectionDescription: 'Renseigne le client, les dates, la commission et les notes.',
        clientLabel: 'Nom du client',
        clientEmailLabel: 'Email client',
        destinationLabel: 'Destination',
        travelersLabel: 'Nombre de voyageurs',
        startDateLabel: 'Date de depart',
        endDateLabel: 'Date de retour',
        commissionRateLabel: 'Commission Luna (%)',
        notesLabel: 'Notes operationnelles',
        commissionHint: '12 = 12% de commission appliquee au total client.',
        clientPlaceholder: 'Client (nom complet)',
        clientEmailPlaceholder: 'Email client',
        destinationPlaceholder: 'Destination principale',
        travelersPlaceholder: 'Voyageurs',
        notesPlaceholder: 'Notes operationnelles',
        routine: 'Routine',
        step1: 'Etape 1: trip cree en statut PROPOSAL.',
        step2: 'Etape 2: rappel planning auto genere.',
        step3: 'Etape 3: facture creee en DRAFT.',
        step4: 'Etape 4: confirmation passe le trip en CONFIRMED.',
        financeTitle: 'Prix, Commission, Confirmation, Facture',
        financeDescription: "Synthese financiere et actions de finalisation.",
        openPricing: 'Ouvrir ma fiche prix & commissions',
        financialSummary: 'Resume financier',
        totalClient: 'Total client',
        supplierCost: 'Cout fournisseur estime',
        selectedItems: 'Selection prestations',
        itemUnit: 'prestation(s)',
        selectedValue: 'Valeur selection',
        planningAlerts: 'Planning & alertes',
        proposal: 'Proposition',
        confirmationClient: 'Confirmation client',
        deposit: 'Acompte',
        immediate: 'Immediat',
        dayPlus2: 'J+2',
        dayPlus4: 'J+4',
        toDefine: 'A definir',
        createTripInvoice: 'Creer Trip + Facture',
        confirmTrip: 'Confirmer Trip',
        openInvoicePdf: 'Ouvrir Facture PDF',
        errorRequiredClient: 'Le nom client est obligatoire.',
        errorRequiredDestination: 'La destination est obligatoire.',
        errorRequiredItem: 'Selectionne au moins une prestation.',
        errorCreateTrip: 'Erreur creation trip.',
        errorNetworkCreate: 'Erreur reseau pendant la creation du trip.',
        successTripCreated: 'Trip cree:',
        successInvoice: 'Facture:',
        errorConfirm: 'Erreur confirmation.',
        successConfirm: 'Trip confirme. Facture passee en statut SENT.',
        errorNetworkConfirm: 'Erreur reseau pendant la confirmation.',
        errorValidationUpdate: 'Erreur mise a jour validation.',
        successValidationUpdate: 'Validation planning mise a jour.',
        planningFollowup: "Controle des montants, planning d'alerte et actions facture.",
        tripShort: 'Trip',
        resaShort: 'Resa',
        commissionPlaceholder: 'Commission %',
        workflowLabel: 'Workflow',
        workflowPending: 'En attente de traitement',
        workflowSent: 'Action demandee par Luna',
        workflowConfirmed: 'Confirme par vous',
        workflowFinal: 'Valide final Luna',
        workflowInReview: 'En revue Luna',
        lunaMessageLabel: 'Message Luna',
        confirmReturnToLuna: 'Confirmer et renvoyer a Luna',
        confirmAction: 'Confirmer',
        workflowColumn: 'Workflow',
        actionColumn: 'Action',
        successSentToLuna: 'Validation envoyee a Luna. En attente de revalidation finale.',
        proposedSlots: 'Creneaux proposes par Luna',
        availabilityAvailable: 'Disponible',
        availabilityAlternative: 'Alternative',
        availabilityUnavailable: 'Indisponible',
        notAvailable: 'N/A',
        crmAlertBell: 'Alertes CRM',
        crmAlertTitle: 'Trips valides par Luna',
        crmAlertEmpty: 'Aucune nouvelle validation CRM.',
        crmAlertTripValidated: 'Trip valide par le CRM',
        crmAlertMarkRead: 'Marquer lu',
        crmAlertMarking: 'Mise a jour...',
        crmAlertMarkAllRead: 'Tout marquer lu',
        crmAlertUnread: 'non lue(s)',
        errorAlertMarkRead: 'Impossible de marquer cette alerte comme lue.',
    },
    en: {
        unauthTitle: 'Luna Travel Pro Access',
        unauthSubtitle: 'Sign in or create a pro account to manage trips, commissions, planning, confirmations and invoices.',
        login: 'Sign in',
        signup: 'Sign up',
        languageSelector: 'Pro dashboard language',
        headerBadge: 'Luna Pro',
        headerTitle: 'Pro Routine: Trip Creation',
        connected: 'Signed in',
        tenant: 'Tenant',
        profile: 'My pro profile',
        pricing: 'Pricing & commissions',
        logout: 'Log out',
        navPlanning: 'Planning',
        navPrestations: 'Services',
        navTrip: 'Trip Creation',
        navFinance: 'Finance',
        navHint: 'Animated collapsible menus',
        planningTitle: 'Luna Planning: Trips & Bookings',
        planningDescription: 'Track Luna-side validations in Firebase: trip valid or not, booking validated or not.',
        planningCompact: 'Compact view: open or close this section as needed.',
        trips: 'Trips',
        tripValidated: 'Trips validated',
        resaValidated: 'Bookings validated',
        validationQuick: 'Quick validation',
        dateToDefine: 'Date to define',
        noTripYet: 'No trip created yet.',
        client: 'Client',
        destination: 'Destination',
        departure: 'Departure',
        alert: 'Alert',
        status: 'Status',
        tripLunaValid: 'Trip validated by Luna',
        resaLunaValid: 'Booking validated by Luna',
        total: 'Total',
        commission: 'Commission',
        invoice: 'Invoice',
        open: 'Open',
        valid: 'Valid',
        notValid: 'Not valid',
        validated: 'Validated',
        notValidated: 'Not validated',
        prestationsTitle: 'Service Selection',
        prestationsDescription: 'Catalog, filters and quick selection.',
        selectedCount: 'selected',
        catalogTotal: 'Total catalog',
        withImage: 'With image',
        displayed: 'Displayed',
        selected: 'Selected',
        advancedFilters: 'Advanced filters',
        hideFilters: 'Hide filters',
        showFilters: 'Show filters',
        reset: 'Reset',
        searchPlaceholder: 'Quick search: service, location, type...',
        allTypes: 'All types',
        allLocations: 'All locations',
        allBudgets: 'All budgets',
        budgetLt500: 'Below 500 EUR',
        budget5001499: '500 to 1499 EUR',
        budget15002999: '1500 to 2999 EUR',
        budgetGte3000: '3000 EUR and above',
        recommendedSort: 'Recommended sort',
        priceAsc: 'Price ascending',
        priceDesc: 'Price descending',
        nameAsc: 'Name A-Z',
        onlyWithImage: 'Show only services with images',
        noLocation: 'No location',
        noDescription: 'No description available.',
        selectedTag: 'Selected',
        selectedDetail: 'Selected services (details)',
        requestedSlotTitle: 'Requested slot for provider',
        requestedDateLabel: 'Day',
        requestedStartLabel: 'Start',
        requestedEndLabel: 'End',
        requestedNoteLabel: 'Note',
        requestedNotePlaceholder: 'Example: flexible +/- 30 min',
        requestedNotSet: 'Not set',
        tripSectionTitle: 'Client and trip details',
        tripSectionDescription: 'Fill in client info, dates, commission and notes.',
        clientLabel: 'Client name',
        clientEmailLabel: 'Client email',
        destinationLabel: 'Destination',
        travelersLabel: 'Number of travelers',
        startDateLabel: 'Departure date',
        endDateLabel: 'Return date',
        commissionRateLabel: 'Luna commission (%)',
        notesLabel: 'Operational notes',
        commissionHint: '12 means a 12% commission applied to the client total.',
        clientPlaceholder: 'Client (full name)',
        clientEmailPlaceholder: 'Client email',
        destinationPlaceholder: 'Main destination',
        travelersPlaceholder: 'Travelers',
        notesPlaceholder: 'Operational notes',
        routine: 'Routine',
        step1: 'Step 1: trip created with PROPOSAL status.',
        step2: 'Step 2: planning reminder auto-created.',
        step3: 'Step 3: invoice created as DRAFT.',
        step4: 'Step 4: confirmation moves trip to CONFIRMED.',
        financeTitle: 'Pricing, Commission, Confirmation, Invoice',
        financeDescription: 'Financial summary and finalization actions.',
        openPricing: 'Open my pricing & commissions profile',
        financialSummary: 'Financial summary',
        totalClient: 'Client total',
        supplierCost: 'Estimated supplier cost',
        selectedItems: 'Selected services',
        itemUnit: 'item(s)',
        selectedValue: 'Selected value',
        planningAlerts: 'Planning & alerts',
        proposal: 'Proposal',
        confirmationClient: 'Client confirmation',
        deposit: 'Deposit',
        immediate: 'Immediate',
        dayPlus2: 'D+2',
        dayPlus4: 'D+4',
        toDefine: 'To define',
        createTripInvoice: 'Create Trip + Invoice',
        confirmTrip: 'Confirm Trip',
        openInvoicePdf: 'Open Invoice PDF',
        errorRequiredClient: 'Client name is required.',
        errorRequiredDestination: 'Destination is required.',
        errorRequiredItem: 'Select at least one service.',
        errorCreateTrip: 'Trip creation error.',
        errorNetworkCreate: 'Network error while creating trip.',
        successTripCreated: 'Trip created:',
        successInvoice: 'Invoice:',
        errorConfirm: 'Confirmation error.',
        successConfirm: 'Trip confirmed. Invoice moved to SENT status.',
        errorNetworkConfirm: 'Network error during confirmation.',
        errorValidationUpdate: 'Validation update error.',
        successValidationUpdate: 'Planning validation updated.',
        planningFollowup: 'Amount control, reminder schedule and invoice actions.',
        tripShort: 'Trip',
        resaShort: 'Booking',
        commissionPlaceholder: 'Commission %',
        workflowLabel: 'Workflow',
        workflowPending: 'Pending review',
        workflowSent: 'Action requested by Luna',
        workflowConfirmed: 'Confirmed by you',
        workflowFinal: 'Final Luna validated',
        workflowInReview: 'Under Luna review',
        lunaMessageLabel: 'Luna message',
        confirmReturnToLuna: 'Confirm and send back to Luna',
        confirmAction: 'Confirm',
        workflowColumn: 'Workflow',
        actionColumn: 'Action',
        successSentToLuna: 'Validation sent to Luna. Waiting for final revalidation.',
        proposedSlots: 'Slots proposed by Luna',
        availabilityAvailable: 'Available',
        availabilityAlternative: 'Alternative',
        availabilityUnavailable: 'Unavailable',
        notAvailable: 'N/A',
        crmAlertBell: 'CRM alerts',
        crmAlertTitle: 'Trips validated by Luna',
        crmAlertEmpty: 'No new CRM validation.',
        crmAlertTripValidated: 'Trip validated by CRM',
        crmAlertMarkRead: 'Mark as read',
        crmAlertMarking: 'Updating...',
        crmAlertMarkAllRead: 'Mark all as read',
        crmAlertUnread: 'unread',
        errorAlertMarkRead: 'Unable to mark this alert as read.',
    },
    da: {} as ProDashboardCopy,
    nl: {} as ProDashboardCopy,
    es: {} as ProDashboardCopy,
};

// Keep non-FR/EN locales available with English fallback for now.
PRO_DASHBOARD_COPY.da = { ...PRO_DASHBOARD_COPY.en };
PRO_DASHBOARD_COPY.nl = { ...PRO_DASHBOARD_COPY.en };
PRO_DASHBOARD_COPY.es = { ...PRO_DASHBOARD_COPY.en };
