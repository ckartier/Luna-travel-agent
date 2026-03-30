import type { LunaLocale } from '@/src/lib/i18n/translations';

export type ProProfileCopy = {
    languageSelector: string;
    unauthTitle: string;
    unauthSubtitle: string;
    login: string;
    headerBadge: string;
    headerTitle: string;
    headerSubtitle: string;
    backProSpace: string;
    logout: string;
    logoutLoading: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    emailLabel: string;
    agencyLabel: string;
    agencyPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    bioLabel: string;
    bioPlaceholder: string;
    pricingTitle: string;
    currencyLabel: string;
    currencyPlaceholder: string;
    commissionDefaultLabel: string;
    minBudgetLabel: string;
    minBudgetPlaceholder: string;
    targetTicketLabel: string;
    targetTicketPlaceholder: string;
    commissionCard: string;
    minBudgetCard: string;
    targetTicketCard: string;
    saveError: string;
    saveSuccess: string;
    save: string;
    saving: string;
    defaultUser: string;
};

export const PRO_PROFILE_COPY: Record<LunaLocale, ProProfileCopy> = {
    fr: {
        languageSelector: 'Langue fiche pro',
        unauthTitle: 'Fiche Pro',
        unauthSubtitle: 'Connecte-toi pour acceder a ta fiche pro.',
        login: 'Connexion',
        headerBadge: 'Luna Pro',
        headerTitle: 'Ma fiche pro',
        headerSubtitle: 'Modifie ton profil puis sauvegarde.',
        backProSpace: 'Retour espace pro',
        logout: 'Deconnexion',
        logoutLoading: 'Deconnexion...',
        displayNameLabel: 'Nom affichage',
        displayNamePlaceholder: 'Nom pro',
        emailLabel: 'Email',
        agencyLabel: 'Agence',
        agencyPlaceholder: 'Nom agence',
        phoneLabel: 'Telephone',
        phonePlaceholder: '+33 ...',
        bioLabel: 'Bio',
        bioPlaceholder: 'Presentation courte...',
        pricingTitle: 'Prix & commissions',
        currencyLabel: 'Devise',
        currencyPlaceholder: 'EUR',
        commissionDefaultLabel: 'Commission par defaut (%)',
        minBudgetLabel: 'Budget minimum trip',
        minBudgetPlaceholder: 'ex: 1500',
        targetTicketLabel: 'Ticket moyen cible',
        targetTicketPlaceholder: 'ex: 2800',
        commissionCard: 'Commission',
        minBudgetCard: 'Budget minimum',
        targetTicketCard: 'Ticket moyen',
        saveError: 'Impossible de sauvegarder la fiche pro.',
        saveSuccess: 'Fiche pro mise a jour.',
        save: 'Enregistrer',
        saving: 'Enregistrement...',
        defaultUser: 'Utilisateur',
    },
    en: {
        languageSelector: 'Pro profile language',
        unauthTitle: 'Pro Profile',
        unauthSubtitle: 'Sign in to access your pro profile.',
        login: 'Sign in',
        headerBadge: 'Luna Pro',
        headerTitle: 'My Pro Profile',
        headerSubtitle: 'Update your profile and save.',
        backProSpace: 'Back to pro space',
        logout: 'Log out',
        logoutLoading: 'Logging out...',
        displayNameLabel: 'Display name',
        displayNamePlaceholder: 'Pro name',
        emailLabel: 'Email',
        agencyLabel: 'Agency',
        agencyPlaceholder: 'Agency name',
        phoneLabel: 'Phone',
        phonePlaceholder: '+33 ...',
        bioLabel: 'Bio',
        bioPlaceholder: 'Short presentation...',
        pricingTitle: 'Pricing & commissions',
        currencyLabel: 'Currency',
        currencyPlaceholder: 'EUR',
        commissionDefaultLabel: 'Default commission (%)',
        minBudgetLabel: 'Minimum trip budget',
        minBudgetPlaceholder: 'e.g. 1500',
        targetTicketLabel: 'Target average ticket',
        targetTicketPlaceholder: 'e.g. 2800',
        commissionCard: 'Commission',
        minBudgetCard: 'Minimum budget',
        targetTicketCard: 'Average ticket',
        saveError: 'Unable to save pro profile.',
        saveSuccess: 'Pro profile updated.',
        save: 'Save',
        saving: 'Saving...',
        defaultUser: 'User',
    },
    da: {} as ProProfileCopy,
    nl: {} as ProProfileCopy,
    es: {} as ProProfileCopy,
};

PRO_PROFILE_COPY.da = { ...PRO_PROFILE_COPY.en };
PRO_PROFILE_COPY.nl = { ...PRO_PROFILE_COPY.en };
PRO_PROFILE_COPY.es = { ...PRO_PROFILE_COPY.en };
