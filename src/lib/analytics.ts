/**
 * Analytics Tracking Module
 * 
 * Abstraction layer for event tracking.
 * Supports multiple providers (console in dev, custom in prod).
 * 
 * Usage:
 *   track('trip.created', { destination: 'Bali', travelers: 4 });
 *   identify(userId, { email, name, role });
 *   page('/crm/dashboard');
 */

type EventProperties = Record<string, string | number | boolean | null>;

interface AnalyticsProvider {
    track: (event: string, properties?: EventProperties) => void;
    identify: (userId: string, traits?: EventProperties) => void;
    page: (name: string, properties?: EventProperties) => void;
}

// ── Console provider (development) ──
const consoleProvider: AnalyticsProvider = {
    track: (event, properties) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 [Analytics] ${event}`, properties || '');
        }
    },
    identify: (userId, traits) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 [Identity] ${userId}`, traits || '');
        }
    },
    page: (name, properties) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 [Page] ${name}`, properties || '');
        }
    },
};

// ── Beacon provider (production — sends to /api/analytics) ──
const beaconProvider: AnalyticsProvider = {
    track: (event, properties) => {
        sendBeacon('track', { event, properties, timestamp: Date.now() });
    },
    identify: (userId, traits) => {
        sendBeacon('identify', { userId, traits, timestamp: Date.now() });
    },
    page: (name, properties) => {
        sendBeacon('page', { name, properties, timestamp: Date.now() });
    },
};

function sendBeacon(type: string, data: any) {
    try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon(
                '/api/analytics',
                new Blob([JSON.stringify({ type, ...data })], { type: 'application/json' })
            );
        }
    } catch {
        // Silently fail — analytics should never break the app
    }
}

// ── Active provider ──
const provider: AnalyticsProvider =
    typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? beaconProvider
        : consoleProvider;

// ── Public API ──

export function track(event: string, properties?: EventProperties): void {
    provider.track(event, properties);
}

export function identify(userId: string, traits?: EventProperties): void {
    provider.identify(userId, traits);
}

export function page(name: string, properties?: EventProperties): void {
    provider.page(name, properties);
}

// ── Predefined Events ──
export const EVENTS = {
    // Auth
    LOGIN: 'auth.login',
    LOGOUT: 'auth.logout',
    SIGNUP: 'auth.signup',

    // Contacts
    CONTACT_CREATED: 'contact.created',
    CONTACT_UPDATED: 'contact.updated',
    CONTACT_DELETED: 'contact.deleted',
    CONTACT_MERGED: 'contact.merged',

    // Trips
    TRIP_CREATED: 'trip.created',
    TRIP_UPDATED: 'trip.updated',
    TRIP_SHARED: 'trip.shared',

    // Finance
    QUOTE_CREATED: 'quote.created',
    QUOTE_SENT: 'quote.sent',
    QUOTE_ACCEPTED: 'quote.accepted',
    INVOICE_CREATED: 'invoice.created',
    INVOICE_PAID: 'invoice.paid',
    PAYMENT_RECEIVED: 'payment.received',

    // Features
    SEARCH_USED: 'feature.search',
    EXPORT_USED: 'feature.export',
    AI_USED: 'feature.ai',
    WEBHOOK_REGISTERED: 'feature.webhook',

    // Pages
    DASHBOARD_VIEWED: 'page.dashboard',
    SETTINGS_VIEWED: 'page.settings',
} as const;
