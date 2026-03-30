'use client';

/**
 * Luna Multi-Vertical Context
 * 
 * Provides the active VerticalConfig to the entire app.
 * 
 * Resolution order:
 * 1. URL search param `?vertical=xxx` (demo switching)
 * 2. localStorage 'luna-vertical' (persisted choice)
 * 3. NEXT_PUBLIC_VERTICAL env variable (white-label / multi-app)
 * 4. Tenant's `vertical` field in Firestore (SaaS)
 * 5. Default: 'travel'
 */

import { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { getVertical, VERTICALS, type VerticalConfig, type LocalizedString } from '@/src/verticals';
import { useAuth } from './AuthContext';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { LunaLocale } from '@/src/lib/i18n/translations';

interface VerticalContextValue {
    /** The active vertical configuration */
    vertical: VerticalConfig;
    /** Resolve a LocalizedString to the user's current locale */
    vt: (ls: LocalizedString | string | '') => string;
    /** Get a vertical entity label (e.g., vEntity('trip') → 'Voyage' or 'Séjour') */
    vEntity: (key: keyof VerticalConfig['entities']) => string;
    /** Switch to a different vertical (persists to localStorage) */
    switchVertical: (id: string) => void;
}

const VerticalContext = createContext<VerticalContextValue | null>(null);

// ═══ ENV-BASED VERTICAL (checked once at import time) ═══
const ENV_VERTICAL = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_VERTICAL || null
    : process.env.NEXT_PUBLIC_VERTICAL || null;

// ═══ PATH → VERTICAL mapping ═══
// When both CRMs coexist in the same app, specific path prefixes
// force the vertical regardless of the ENV lock.
const PATH_VERTICAL_MAP: { prefix: string; vertical: string }[] = [
    { prefix: '/crm/travel', vertical: 'travel' },
    { prefix: '/crm/legal', vertical: 'legal' },
    { prefix: '/crm/monum', vertical: 'monum' },
    { prefix: '/crm/avocat', vertical: 'legal' },
    { prefix: '/crm/dossiers', vertical: 'legal' },
    { prefix: '/crm/jurisprudence', vertical: 'legal' },
];

export function VerticalProvider({ children }: { children: ReactNode }) {
    const { userProfile, isSuperAdmin } = useAuth();
    const { locale } = useTranslation();
    const [activeVerticalId, setActiveVerticalId] = useState<string | null>(null);
    const pathname = usePathname() || '/';

    // ── Reactively detect vertical from URL search params ──
    const searchParams = useSearchParams();
    const urlVertical = searchParams?.get('vertical');

    // ── Path-based vertical detection (BYPASSES env lock) ──
    // When both CRMs live in the same app, navigating to a legal-specific
    // path must switch the vertical even if ENV_VERTICAL is set.
    const pathVertical = PATH_VERTICAL_MAP.find(m => pathname.startsWith(m.prefix))?.vertical || null;

    useEffect(() => {
        if (!pathVertical) return;
        if (activeVerticalId !== pathVertical) {
            setActiveVerticalId(pathVertical);
            // Persist so shared pages (/crm/pipeline, /crm/settings) keep the context
            sessionStorage.setItem('luna-vertical-override', pathVertical);
        }
    }, [pathVertical, activeVerticalId]);

    // If NEXT_PUBLIC_VERTICAL is set:
    // - SuperAdmins can still override via ?vertical=xxx URL param (stored in sessionStorage)
    // - Everyone else is locked to the env var (localStorage cleared)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (ENV_VERTICAL && VERTICALS[ENV_VERTICAL]) {
            // Restore any session override (used by both superadmins and path-based switches)
            const sessionOverride = sessionStorage.getItem('luna-vertical-override');
            if (sessionOverride && VERTICALS[sessionOverride]) {
                setActiveVerticalId(sessionOverride);
            } else if (!isSuperAdmin) {
                // No override stored — fall back to env default
                localStorage.removeItem('luna-vertical');
                setActiveVerticalId(null);
            }
        }
    }, [isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update active vertical whenever URL param changes
    // SuperAdmins: always honoured (even with env lock)
    // Others: only when no env lock
    useEffect(() => {
        if (!urlVertical || !VERTICALS[urlVertical]) return;

        setActiveVerticalId(urlVertical);
        // Always persist to sessionStorage so it survives navigation to shared pages
        sessionStorage.setItem('luna-vertical-override', urlVertical);
        if (!ENV_VERTICAL) {
            localStorage.setItem('luna-vertical', urlVertical);
        }
    }, [urlVertical, isSuperAdmin]);

    // Fallback to localStorage on first mount (when no URL param AND no env var)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (ENV_VERTICAL && !isSuperAdmin) return; // locked for non-superadmins
        if (urlVertical) return; // URL param takes priority, already handled above
        const stored = localStorage.getItem('luna-vertical');
        if (stored && VERTICALS[stored]) {
            setActiveVerticalId(stored);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const switchVertical = (id: string) => {
        if (ENV_VERTICAL && !isSuperAdmin) return; // locked by env — no switching allowed for non-superadmins
        if (VERTICALS[id]) {
            setActiveVerticalId(id);
            if (isSuperAdmin && ENV_VERTICAL) {
                sessionStorage.setItem('luna-vertical-override', id);
            } else {
                localStorage.setItem('luna-vertical', id);
            }
        }
    };

    const value = useMemo<VerticalContextValue>(() => {
        // Resolution: URL/localStorage > env > tenant > default
        const verticalId = activeVerticalId
            || ENV_VERTICAL
            || (userProfile as any)?.vertical
            || 'travel';

        const vertical = getVertical(verticalId);

        // Helper: resolve a LocalizedString to current locale
        const vt = (ls: LocalizedString | string | ''): string => {
            if (typeof ls === 'string') return ls;
            if (!ls) return '';
            return ls[locale as LunaLocale] || ls.fr || '';
        };

        // Helper: get entity label in current locale
        const vEntity = (key: keyof VerticalConfig['entities']): string => {
            const entity = vertical.entities[key];
            return entity[locale as LunaLocale] || entity.fr;
        };

        return { vertical, vt, vEntity, switchVertical };
    }, [userProfile, locale, activeVerticalId]);

    return (
        <VerticalContext.Provider value={value}>
            {children}
        </VerticalContext.Provider>
    );
}

/**
 * Hook to access the active vertical configuration.
 * Must be used within a VerticalProvider.
 */
export function useVertical(): VerticalContextValue {
    const ctx = useContext(VerticalContext);
    if (!ctx) {
        // Fallback for components rendered outside provider (e.g., server components)
        const fallback = getVertical('travel');
        return {
            vertical: fallback,
            vt: (ls) => typeof ls === 'string' ? ls : (ls as any)?.fr || '',
            vEntity: (key) => fallback.entities[key]?.fr || key,
            switchVertical: () => {},
        };
    }
    return ctx;
}
