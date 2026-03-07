'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { t, LunaLocale, LOCALE_LABELS } from '@/src/lib/i18n/translations';

/**
 * Hook to get translations based on user's language preference.
 * Reads `language` from the userProfile stored in Firebase.
 * Falls back to 'fr' (French) if not set.
 */
export function useTranslation() {
    const { userProfile } = useAuth();
    const locale: LunaLocale = (userProfile as any)?.language || 'fr';

    return {
        /** Current locale code */
        locale,
        /** All available locales */
        locales: LOCALE_LABELS,
        /** Translate a key */
        t: (key: string) => t(key, locale),
    };
}
