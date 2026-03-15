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
import { useSearchParams } from 'next/navigation';
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

export function VerticalProvider({ children }: { children: ReactNode }) {
    const { userProfile, isSuperAdmin } = useAuth();
    const { locale } = useTranslation();
    const [activeVerticalId, setActiveVerticalId] = useState<string | null>(null);

    // ── Reactively detect vertical from URL search params ──
    const searchParams = useSearchParams();
    const urlVertical = searchParams.get('vertical');

    // If NEXT_PUBLIC_VERTICAL is set:
    // - SuperAdmins can still override via ?vertical=xxx URL param (stored in sessionStorage)
    // - Everyone else is locked to the env var (localStorage cleared)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (ENV_VERTICAL && VERTICALS[ENV_VERTICAL]) {
            if (!isSuperAdmin) {
                // Lock non-superadmins — clear any stale stored vertical
                localStorage.removeItem('luna-vertical');
                sessionStorage.removeItem('luna-vertical-override');
                setActiveVerticalId(null);
            } else {
                // SuperAdmins: restore any session override they previously set
                const sessionOverride = sessionStorage.getItem('luna-vertical-override');
                if (sessionOverride && VERTICALS[sessionOverride]) {
                    setActiveVerticalId(sessionOverride);
                }
            }
        }
    }, [isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update active vertical whenever URL param changes
    // SuperAdmins: always honoured (even with env lock)
    // Others: only when no env lock
    useEffect(() => {
        if (!urlVertical || !VERTICALS[urlVertical]) return;
        if (ENV_VERTICAL && !isSuperAdmin) return; // locked for non-superadmins

        setActiveVerticalId(urlVertical);
        if (isSuperAdmin && ENV_VERTICAL) {
            // Store in sessionStorage only (resets on browser close)
            sessionStorage.setItem('luna-vertical-override', urlVertical);
        } else {
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
        if (ENV_VERTICAL) return; // locked by env — no switching allowed
        if (VERTICALS[id]) {
            setActiveVerticalId(id);
            localStorage.setItem('luna-vertical', id);
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

