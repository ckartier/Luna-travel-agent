import type { LunaLocale } from '@/src/lib/i18n/translations';

export const PRO_AUTH_LOCALE_STORAGE_KEY = 'luna_pro_auth_locale';

const SUPPORTED_LOCALES: LunaLocale[] = ['fr', 'en', 'da', 'nl', 'es'];

export type ProAuthCopy = {
    languageSelectorLabel: string;
    loginTitle: string;
    loginSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    rememberMe: string;
    forgotPassword: string;
    forgotPasswordNeedEmail: string;
    resetSent: string;
    connecting: string;
    loginButton: string;
    orContinueWith: string;
    noMember: string;
    signupCta: string;
    termsPrefix: string;
    termsLink: string;
    signupTitle: string;
    signupSubtitle: string;
    creatingSpace: string;
    creatingStep1: string;
    creatingStep2: string;
    creatingStep3: string;
    nameLabel: string;
    agencyLabel: string;
    agencyPlaceholder: string;
    optional: string;
    minPassword: string;
    creatingButton: string;
    createProAccess: string;
    alreadyMember: string;
    loginCta: string;
    signupTermsPrefix: string;
    signupTermsLink: string;
};

export const PRO_AUTH_COPY: Record<LunaLocale, ProAuthCopy> = {
    fr: {
        languageSelectorLabel: 'Langue de l’accès pro',
        loginTitle: 'Accès Pro',
        loginSubtitle: 'Accédez à votre espace pro prestataire voyage',
        emailLabel: 'Email',
        emailPlaceholder: 'pro@agence.com',
        passwordLabel: 'Mot de passe',
        rememberMe: 'Se souvenir de moi',
        forgotPassword: 'Mot de passe oublié ?',
        forgotPasswordNeedEmail: 'Entrez votre email pour réinitialiser le mot de passe.',
        resetSent: 'Un lien de réinitialisation a été envoyé à',
        connecting: 'Connexion...',
        loginButton: 'Connexion',
        orContinueWith: 'ou continuer avec',
        noMember: 'Pas encore membre ?',
        signupCta: 'Inscription Pro →',
        termsPrefix: 'En vous inscrivant, vous acceptez nos',
        termsLink: 'Conditions Générales de Vente',
        signupTitle: 'Inscription Pro',
        signupSubtitle: 'Formulaire d’inscription pro connecté à Firebase.',
        creatingSpace: 'Création de votre espace…',
        creatingStep1: 'Compte pro créé ✓',
        creatingStep2: 'Profil prestataire…',
        creatingStep3: 'Connexion Firebase…',
        nameLabel: 'Votre nom',
        agencyLabel: 'Nom société / agence',
        agencyPlaceholder: 'Prestataire Voyage Premium',
        optional: '(optionnel)',
        minPassword: 'Minimum 6 caractères',
        creatingButton: 'Création…',
        createProAccess: 'Créer mon accès pro',
        alreadyMember: 'Déjà membre ?',
        loginCta: 'Se connecter',
        signupTermsPrefix: 'En créant un compte, vous acceptez nos',
        signupTermsLink: 'CGV',
    },
    en: {
        languageSelectorLabel: 'Pro access language',
        loginTitle: 'Pro Access',
        loginSubtitle: 'Access your travel supplier pro workspace',
        emailLabel: 'Email',
        emailPlaceholder: 'pro@agency.com',
        passwordLabel: 'Password',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        forgotPasswordNeedEmail: 'Enter your email to reset your password.',
        resetSent: 'A reset link was sent to',
        connecting: 'Signing in...',
        loginButton: 'Sign in',
        orContinueWith: 'or continue with',
        noMember: 'Not a member yet?',
        signupCta: 'Pro Sign up →',
        termsPrefix: 'By signing in, you agree to our',
        termsLink: 'Terms of Sale',
        signupTitle: 'Pro Sign up',
        signupSubtitle: 'Pro registration form connected to Firebase.',
        creatingSpace: 'Creating your workspace…',
        creatingStep1: 'Pro account created ✓',
        creatingStep2: 'Supplier profile…',
        creatingStep3: 'Firebase connection…',
        nameLabel: 'Your name',
        agencyLabel: 'Company / agency name',
        agencyPlaceholder: 'Premium Travel Supplier',
        optional: '(optional)',
        minPassword: 'Minimum 6 characters',
        creatingButton: 'Creating…',
        createProAccess: 'Create my pro access',
        alreadyMember: 'Already a member?',
        loginCta: 'Sign in',
        signupTermsPrefix: 'By creating an account, you agree to our',
        signupTermsLink: 'Terms of Sale',
    },
    da: {
        languageSelectorLabel: 'Sprog for pro-adgang',
        loginTitle: 'Pro-adgang',
        loginSubtitle: 'Få adgang til dit professionelle rejseleverandør-område',
        emailLabel: 'E-mail',
        emailPlaceholder: 'pro@bureau.com',
        passwordLabel: 'Adgangskode',
        rememberMe: 'Husk mig',
        forgotPassword: 'Glemt adgangskode?',
        forgotPasswordNeedEmail: 'Indtast din e-mail for at nulstille adgangskoden.',
        resetSent: 'Et nulstillingslink er sendt til',
        connecting: 'Logger ind...',
        loginButton: 'Log ind',
        orContinueWith: 'eller fortsæt med',
        noMember: 'Ikke medlem endnu?',
        signupCta: 'Pro-tilmelding →',
        termsPrefix: 'Ved login accepterer du vores',
        termsLink: 'Salgsbetingelser',
        signupTitle: 'Pro-tilmelding',
        signupSubtitle: 'Pro-registreringsformular forbundet til Firebase.',
        creatingSpace: 'Opretter dit område…',
        creatingStep1: 'Pro-konto oprettet ✓',
        creatingStep2: 'Leverandørprofil…',
        creatingStep3: 'Firebase-forbindelse…',
        nameLabel: 'Dit navn',
        agencyLabel: 'Virksomhed / bureau',
        agencyPlaceholder: 'Premium Rejseleverandør',
        optional: '(valgfrit)',
        minPassword: 'Minimum 6 tegn',
        creatingButton: 'Opretter…',
        createProAccess: 'Opret min pro-adgang',
        alreadyMember: 'Allerede medlem?',
        loginCta: 'Log ind',
        signupTermsPrefix: 'Ved oprettelse af konto accepterer du vores',
        signupTermsLink: 'Salgsbetingelser',
    },
    nl: {
        languageSelectorLabel: 'Taal voor pro-toegang',
        loginTitle: 'Pro-toegang',
        loginSubtitle: 'Toegang tot uw professionele reisleveranciersruimte',
        emailLabel: 'E-mail',
        emailPlaceholder: 'pro@bureau.com',
        passwordLabel: 'Wachtwoord',
        rememberMe: 'Onthoud mij',
        forgotPassword: 'Wachtwoord vergeten?',
        forgotPasswordNeedEmail: 'Voer uw e-mail in om uw wachtwoord te resetten.',
        resetSent: 'Een resetlink is verzonden naar',
        connecting: 'Inloggen...',
        loginButton: 'Inloggen',
        orContinueWith: 'of doorgaan met',
        noMember: 'Nog geen lid?',
        signupCta: 'Pro-registratie →',
        termsPrefix: 'Door in te loggen accepteert u onze',
        termsLink: 'Verkoopvoorwaarden',
        signupTitle: 'Pro-registratie',
        signupSubtitle: 'Pro-inschrijfformulier gekoppeld aan Firebase.',
        creatingSpace: 'Uw omgeving wordt aangemaakt…',
        creatingStep1: 'Pro-account aangemaakt ✓',
        creatingStep2: 'Leveranciersprofiel…',
        creatingStep3: 'Firebase-verbinding…',
        nameLabel: 'Uw naam',
        agencyLabel: 'Bedrijfs / bureau naam',
        agencyPlaceholder: 'Premium Reisleverancier',
        optional: '(optioneel)',
        minPassword: 'Minimaal 6 tekens',
        creatingButton: 'Aanmaken…',
        createProAccess: 'Mijn pro-toegang maken',
        alreadyMember: 'Al lid?',
        loginCta: 'Inloggen',
        signupTermsPrefix: 'Door een account aan te maken gaat u akkoord met onze',
        signupTermsLink: 'Verkoopvoorwaarden',
    },
    es: {
        languageSelectorLabel: 'Idioma del acceso pro',
        loginTitle: 'Acceso Pro',
        loginSubtitle: 'Accede a tu espacio profesional de proveedor de viajes',
        emailLabel: 'Correo',
        emailPlaceholder: 'pro@agencia.com',
        passwordLabel: 'Contraseña',
        rememberMe: 'Recordarme',
        forgotPassword: '¿Olvidaste tu contraseña?',
        forgotPasswordNeedEmail: 'Introduce tu correo para restablecer tu contraseña.',
        resetSent: 'Se envió un enlace de restablecimiento a',
        connecting: 'Conectando...',
        loginButton: 'Iniciar sesión',
        orContinueWith: 'o continuar con',
        noMember: '¿Aún no eres miembro?',
        signupCta: 'Registro Pro →',
        termsPrefix: 'Al iniciar sesión, aceptas nuestros',
        termsLink: 'Términos de Venta',
        signupTitle: 'Registro Pro',
        signupSubtitle: 'Formulario de registro pro conectado a Firebase.',
        creatingSpace: 'Creando tu espacio…',
        creatingStep1: 'Cuenta pro creada ✓',
        creatingStep2: 'Perfil proveedor…',
        creatingStep3: 'Conexión Firebase…',
        nameLabel: 'Tu nombre',
        agencyLabel: 'Nombre empresa / agencia',
        agencyPlaceholder: 'Proveedor Viajes Premium',
        optional: '(opcional)',
        minPassword: 'Mínimo 6 caracteres',
        creatingButton: 'Creando…',
        createProAccess: 'Crear mi acceso pro',
        alreadyMember: '¿Ya eres miembro?',
        loginCta: 'Iniciar sesión',
        signupTermsPrefix: 'Al crear una cuenta, aceptas nuestros',
        signupTermsLink: 'Términos de Venta',
    },
};

function normalizeLocale(value?: string | null): LunaLocale | null {
    if (!value) return null;
    const base = value.toLowerCase().split('-')[0] as LunaLocale;
    return SUPPORTED_LOCALES.includes(base) ? base : null;
}

export function detectProAuthLocale(preferred?: string | null): LunaLocale {
    const explicit = normalizeLocale(preferred);
    if (explicit) return explicit;

    if (typeof window !== 'undefined') {
        const stored = normalizeLocale(window.localStorage.getItem(PRO_AUTH_LOCALE_STORAGE_KEY));
        if (stored) return stored;
    }

    if (typeof navigator !== 'undefined') {
        const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
        for (const lang of browserLangs) {
            const normalized = normalizeLocale(lang);
            if (normalized) return normalized;
        }
    }

    return 'fr';
}
