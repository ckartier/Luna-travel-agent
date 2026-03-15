'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { t, LunaLocale, LOCALE_LABELS } from '@/src/lib/i18n/translations';

const SUPPORTED_LOCALES: LunaLocale[] = ['fr', 'en', 'da', 'nl', 'es'];

/**
 * Detects the best matching locale from the browser's navigator.language.
 * Maps browser codes (e.g. "en-US", "fr-FR", "da-DK") to Luna's supported locales.
 * Falls back to 'fr' if no match is found.
 */
function detectBrowserLocale(): LunaLocale {
    if (typeof navigator === 'undefined') return 'fr';

    // navigator.languages gives an ordered list of user preferences; navigator.language is the primary
    const browserLangs = navigator.languages?.length
        ? Array.from(navigator.languages)
        : [navigator.language];

    for (const raw of browserLangs) {
        const code = raw.toLowerCase();
        // Exact match (e.g. "fr", "en", "da")
        const base = code.split('-')[0] as LunaLocale;
        if (SUPPORTED_LOCALES.includes(base)) return base;
    }

    return 'fr'; // Default fallback
}

/**
 * Hook to get translations based on user's language preference.
 * Priority: 1) userProfile.language (manual choice in settings) → 2) navigator.language (auto-detect) → 3) 'fr'
 */
export function useTranslation() {
    const { userProfile } = useAuth();

    // Manual choice from settings always wins
    const manualLang = (userProfile as any)?.language as LunaLocale | undefined;
    const locale: LunaLocale = manualLang || detectBrowserLocale();

    return {
        /** Current locale code */
        locale,
        /** All available locales */
        locales: LOCALE_LABELS,
        /** Translate a key */
        t: (key: string) => t(key, locale),
        /** Whether locale was auto-detected (vs manually set) */
        isAutoDetected: !manualLang,
    };
}
