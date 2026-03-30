import type { LunaLocale } from '@/src/lib/i18n/translations';

export type ProRequestCopy = {
    backPlanning: string;
    pageBadge: string;
    pageFallbackTitle: string;
    idLabel: string;
    sessionInvalid: string;
    requestNotFound: string;
    loadError: string;
    requiredFieldsError: string;
    saveSuccess: string;
    saveError: string;
    missingEmailError: string;
    sendSuccess: string;
    sendError: string;
    validateSuccess: string;
    validateSuccessWithEmail: string;
    validateError: string;
    workflowPending: string;
    workflowSent: string;
    workflowConfirmed: string;
    workflowValidated: string;
    workflowInReview: string;
    labelTitle: string;
    labelDestination: string;
    labelClient: string;
    labelEmail: string;
    labelStartDate: string;
    labelEndDate: string;
    labelAmount: string;
    labelCommissionRate: string;
    labelProviderMessage: string;
    providerMessagePlaceholder: string;
    labelInternalNotes: string;
    labelSelectedPrestations: string;
    prestationCountLabel: string;
    noSelectedPrestations: string;
    prestationFallback: string;
    prestationTypeFallback: string;
    prestationAvailabilityTitle: string;
    availabilityLabel: string;
    availabilityAvailable: string;
    availabilityAlternative: string;
    availabilityUnavailable: string;
    slotDateLabel: string;
    slotQuickDateLabel: string;
    slotToday: string;
    slotTomorrow: string;
    slotPlus2Days: string;
    slotStartLabel: string;
    slotEndLabel: string;
    slotQuickDurationLabel: string;
    slotDuration30: string;
    slotDuration60: string;
    slotDuration120: string;
    slotInvalidRange: string;
    slotNoteLabel: string;
    slotNotePlaceholder: string;
    emailAvailabilityTitle: string;
    labelType: string;
    labelLocation: string;
    labelQuantity: string;
    labelUnitPrice: string;
    labelTotalClient: string;
    labelCommission: string;
    labelLunaStatus: string;
    tripOk: string;
    tripTodo: string;
    bookingOk: string;
    bookingTodo: string;
    btnSave: string;
    btnSaving: string;
    btnSendBack: string;
    btnSending: string;
    btnValidateFinal: string;
    btnValidating: string;
    btnDirectEmail: string;
    emailSubjectPrefix: string;
    emailGreeting: string;
    emailReviewed: string;
    emailValidate: string;
    emailTrip: string;
    emailDestination: string;
    emailDates: string;
    emailAmount: string;
    emailMessagePrefix: string;
    emailLink: string;
    emailValidatedSubjectPrefix: string;
    emailValidatedIntro: string;
    emailValidatedStatus: string;
    dateUnknown: string;
};

export const PRO_REQUEST_COPY: Record<LunaLocale, ProRequestCopy> = {
    fr: {
        backPlanning: 'Retour planning',
        pageBadge: 'Demande Pro',
        pageFallbackTitle: 'Trip sans titre',
        idLabel: 'ID',
        sessionInvalid: 'Session invalide.',
        requestNotFound: 'Demande introuvable.',
        loadError: 'Impossible de charger la demande.',
        requiredFieldsError: 'Titre, destination et client sont obligatoires.',
        saveSuccess: 'Modifications enregistrées.',
        saveError: 'Enregistrement impossible.',
        missingEmailError: 'Email prestataire manquant.',
        sendSuccess: 'Demande renvoyée au prestataire avec email.',
        sendError: 'Impossible de renvoyer la demande.',
        validateSuccess: 'Validation finale Luna enregistrée.',
        validateSuccessWithEmail: 'Validation finale Luna enregistrée et email envoyé au prestataire.',
        validateError: 'Validation finale impossible.',
        workflowPending: 'En attente de traitement',
        workflowSent: 'Envoyé au prestataire',
        workflowConfirmed: 'Confirmé par le prestataire',
        workflowValidated: 'Validé final Luna',
        workflowInReview: 'En revue',
        labelTitle: 'Titre',
        labelDestination: 'Destination',
        labelClient: 'Client / prestataire',
        labelEmail: 'Email',
        labelStartDate: 'Départ',
        labelEndDate: 'Retour',
        labelAmount: 'Montant client (EUR)',
        labelCommissionRate: 'Commission (%)',
        labelProviderMessage: 'Message pour le prestataire',
        providerMessagePlaceholder: 'Précisez ce qui doit être modifié ou validé.',
        labelInternalNotes: 'Notes internes',
        labelSelectedPrestations: 'Prestations sélectionnées par le pro',
        prestationCountLabel: 'prestation(s)',
        noSelectedPrestations: 'Aucune prestation détaillée trouvée pour ce trip.',
        prestationFallback: 'Prestation',
        prestationTypeFallback: 'AUTRE',
        prestationAvailabilityTitle: 'Disponibilités proposées au prestataire',
        availabilityLabel: 'Disponibilité',
        availabilityAvailable: 'Disponible',
        availabilityAlternative: 'Alternative',
        availabilityUnavailable: 'Indisponible',
        slotDateLabel: 'Jour',
        slotQuickDateLabel: 'Raccourcis date',
        slotToday: "Aujourd'hui",
        slotTomorrow: 'Demain',
        slotPlus2Days: '+2 jours',
        slotStartLabel: 'Début',
        slotEndLabel: 'Fin',
        slotQuickDurationLabel: 'Durée rapide',
        slotDuration30: '30 min',
        slotDuration60: '1h',
        slotDuration120: '2h',
        slotInvalidRange: "Heure de fin invalide (elle doit être après l'heure de début).",
        slotNoteLabel: 'Note disponibilité',
        slotNotePlaceholder: 'Ex: possible uniquement le matin / à confirmer',
        emailAvailabilityTitle: 'Créneaux proposés par Luna',
        labelType: 'Type',
        labelLocation: 'Lieu',
        labelQuantity: 'Qté',
        labelUnitPrice: 'Prix unitaire',
        labelTotalClient: 'Total client',
        labelCommission: 'Commission',
        labelLunaStatus: 'Statut Luna',
        tripOk: 'Trip OK',
        tripTodo: 'Trip à valider',
        bookingOk: 'Résa OK',
        bookingTodo: 'Résa à valider',
        btnSave: 'Enregistrer modifications',
        btnSaving: 'Enregistrement...',
        btnSendBack: 'Renvoyer au prestataire',
        btnSending: 'Envoi...',
        btnValidateFinal: 'Valider final Luna',
        btnValidating: 'Validation...',
        btnDirectEmail: 'Email direct',
        emailSubjectPrefix: 'Action requise',
        emailGreeting: 'Bonjour',
        emailReviewed: 'Votre demande trip a été revue par Luna.',
        emailValidate: 'Merci de valider les éléments mis à jour depuis votre espace Pro.',
        emailTrip: 'Trip',
        emailDestination: 'Destination',
        emailDates: 'Dates',
        emailAmount: 'Montant',
        emailMessagePrefix: 'Message Luna',
        emailLink: 'Lien',
        emailValidatedSubjectPrefix: 'Trip validé par Luna',
        emailValidatedIntro: 'Votre trip est maintenant validé côté CRM Luna.',
        emailValidatedStatus: 'Statut',
        dateUnknown: '-',
    },
    en: {
        backPlanning: 'Back to planning',
        pageBadge: 'Pro Request',
        pageFallbackTitle: 'Untitled trip',
        idLabel: 'ID',
        sessionInvalid: 'Invalid session.',
        requestNotFound: 'Request not found.',
        loadError: 'Unable to load request.',
        requiredFieldsError: 'Title, destination and client are required.',
        saveSuccess: 'Changes saved.',
        saveError: 'Unable to save changes.',
        missingEmailError: 'Provider email is missing.',
        sendSuccess: 'Request sent back to provider by email.',
        sendError: 'Unable to send request back.',
        validateSuccess: 'Final Luna validation saved.',
        validateSuccessWithEmail: 'Final Luna validation saved and email sent to provider.',
        validateError: 'Unable to finalize validation.',
        workflowPending: 'Pending review',
        workflowSent: 'Sent to provider',
        workflowConfirmed: 'Confirmed by provider',
        workflowValidated: 'Final Luna validated',
        workflowInReview: 'In review',
        labelTitle: 'Title',
        labelDestination: 'Destination',
        labelClient: 'Client / provider',
        labelEmail: 'Email',
        labelStartDate: 'Departure',
        labelEndDate: 'Return',
        labelAmount: 'Client amount (EUR)',
        labelCommissionRate: 'Commission (%)',
        labelProviderMessage: 'Message to provider',
        providerMessagePlaceholder: 'Describe what must be updated or validated.',
        labelInternalNotes: 'Internal notes',
        labelSelectedPrestations: 'Services selected by provider',
        prestationCountLabel: 'service(s)',
        noSelectedPrestations: 'No detailed service found for this trip.',
        prestationFallback: 'Service',
        prestationTypeFallback: 'OTHER',
        prestationAvailabilityTitle: 'Availability proposed to provider',
        availabilityLabel: 'Availability',
        availabilityAvailable: 'Available',
        availabilityAlternative: 'Alternative',
        availabilityUnavailable: 'Unavailable',
        slotDateLabel: 'Day',
        slotQuickDateLabel: 'Date shortcuts',
        slotToday: 'Today',
        slotTomorrow: 'Tomorrow',
        slotPlus2Days: '+2 days',
        slotStartLabel: 'Start',
        slotEndLabel: 'End',
        slotQuickDurationLabel: 'Quick duration',
        slotDuration30: '30 min',
        slotDuration60: '1h',
        slotDuration120: '2h',
        slotInvalidRange: 'Invalid end time (must be after start time).',
        slotNoteLabel: 'Availability note',
        slotNotePlaceholder: 'Example: only possible in the morning / to confirm',
        emailAvailabilityTitle: 'Slots proposed by Luna',
        labelType: 'Type',
        labelLocation: 'Location',
        labelQuantity: 'Qty',
        labelUnitPrice: 'Unit price',
        labelTotalClient: 'Client total',
        labelCommission: 'Commission',
        labelLunaStatus: 'Luna status',
        tripOk: 'Trip OK',
        tripTodo: 'Trip to validate',
        bookingOk: 'Booking OK',
        bookingTodo: 'Booking to validate',
        btnSave: 'Save changes',
        btnSaving: 'Saving...',
        btnSendBack: 'Send back to provider',
        btnSending: 'Sending...',
        btnValidateFinal: 'Validate final Luna',
        btnValidating: 'Validating...',
        btnDirectEmail: 'Direct email',
        emailSubjectPrefix: 'Action required',
        emailGreeting: 'Hello',
        emailReviewed: 'Your trip request has been reviewed by Luna.',
        emailValidate: 'Please validate the updated items from your Pro area.',
        emailTrip: 'Trip',
        emailDestination: 'Destination',
        emailDates: 'Dates',
        emailAmount: 'Amount',
        emailMessagePrefix: 'Luna message',
        emailLink: 'Link',
        emailValidatedSubjectPrefix: 'Trip validated by Luna',
        emailValidatedIntro: 'Your trip is now validated on Luna CRM side.',
        emailValidatedStatus: 'Status',
        dateUnknown: '-',
    },
    da: {} as ProRequestCopy,
    nl: {} as ProRequestCopy,
    es: {} as ProRequestCopy,
};

PRO_REQUEST_COPY.da = { ...PRO_REQUEST_COPY.en };
PRO_REQUEST_COPY.nl = { ...PRO_REQUEST_COPY.en };
PRO_REQUEST_COPY.es = { ...PRO_REQUEST_COPY.en };
