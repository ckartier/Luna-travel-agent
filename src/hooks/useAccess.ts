'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useMemo } from 'react';

// ═══ PLAN FEATURES ═══
// What each plan gives access to

export type PlanTier = 'starter' | 'pro' | 'enterprise';

interface PlanAccess {
    // Core CRM
    dashboard: boolean;
    pipeline: boolean;
    contacts: boolean;
    planning: boolean;
    activities: boolean;
    mails: boolean;

    // Operations
    bookings: boolean;
    catalog: boolean;
    suppliers: boolean;

    // Finance
    quotes: boolean;
    invoices: boolean;
    payments: boolean;

    // Communication
    messages: boolean;
    documents: boolean;
    marketing: boolean;

    // Management
    team: boolean;
    analytics: boolean;
    ai: boolean;
    integrations: boolean;
    settings: boolean;

    // Limits
    maxContacts: number; // -1 = unlimited
    maxTripsPerMonth: number;
    maxTeamMembers: number;
    aiQueriesPerDay: number;
}

const PLAN_ACCESS: Record<PlanTier, PlanAccess> = {
    starter: {
        // Core — all available
        dashboard: true,
        pipeline: true,
        contacts: true,
        planning: true,
        activities: true,
        mails: true,

        // Operations — limited
        bookings: true,
        catalog: false,       // Pro+
        suppliers: false,     // Pro+

        // Finance — limited
        quotes: true,
        invoices: false,      // Pro+
        payments: false,      // Pro+

        // Communication — limited
        messages: true,
        documents: false,     // Pro+
        marketing: false,     // Enterprise

        // Management — limited
        team: false,          // Pro+
        analytics: false,     // Pro+
        ai: true,             // Basic AI available
        integrations: false,  // Pro+
        settings: true,

        // Limits
        maxContacts: 100,
        maxTripsPerMonth: 20,
        maxTeamMembers: 2,
        aiQueriesPerDay: 20,
    },

    pro: {
        dashboard: true,
        pipeline: true,
        contacts: true,
        planning: true,
        activities: true,
        mails: true,
        bookings: true,
        catalog: true,
        suppliers: true,
        quotes: true,
        invoices: true,
        payments: true,
        messages: true,
        documents: true,
        marketing: false,     // Enterprise only
        team: true,
        analytics: true,
        ai: true,
        integrations: true,
        settings: true,

        maxContacts: 1000,
        maxTripsPerMonth: 100,
        maxTeamMembers: 10,
        aiQueriesPerDay: 100,
    },

    enterprise: {
        dashboard: true,
        pipeline: true,
        contacts: true,
        planning: true,
        activities: true,
        mails: true,
        bookings: true,
        catalog: true,
        suppliers: true,
        quotes: true,
        invoices: true,
        payments: true,
        messages: true,
        documents: true,
        marketing: true,
        team: true,
        analytics: true,
        ai: true,
        integrations: true,
        settings: true,

        maxContacts: -1,
        maxTripsPerMonth: -1,
        maxTeamMembers: -1,
        aiQueriesPerDay: -1,
    },
};

// Full access for SuperAdmin
const SUPER_ADMIN_ACCESS: PlanAccess = {
    ...PLAN_ACCESS.enterprise,
};

// Map CRM routes to feature keys
const ROUTE_TO_FEATURE: Record<string, keyof PlanAccess> = {
    '/crm': 'dashboard',
    '/crm/pipeline': 'pipeline',
    '/crm/contacts': 'contacts',
    '/crm/planning': 'planning',
    '/crm/activities': 'activities',
    '/crm/mails': 'mails',
    '/crm/bookings': 'bookings',
    '/crm/catalog': 'catalog',
    '/crm/suppliers': 'suppliers',
    '/crm/quotes': 'quotes',
    '/crm/invoices': 'invoices',
    '/crm/payments': 'payments',
    '/crm/messages': 'messages',
    '/crm/documents': 'documents',
    '/crm/marketing': 'marketing',
    '/crm/team': 'team',
    '/crm/analytics': 'analytics',
    '/crm/ai': 'ai',
    '/crm/integrations': 'integrations',
    '/crm/settings': 'settings',
};

export function useAccess() {
    const { userProfile } = useAuth();

    const access = useMemo(() => {
        const role = userProfile?.role || 'Agent';
        const isSuperAdmin = role === 'SuperAdmin';

        if (isSuperAdmin) return SUPER_ADMIN_ACCESS;

        // For now, derive plan from role or default to starter
        // In production, this would come from the tenant document
        const plan: PlanTier = 'starter'; // Default — will be loaded from tenant
        return PLAN_ACCESS[plan];
    }, [userProfile]);

    const isSuperAdmin = userProfile?.role === 'SuperAdmin';

    const canAccess = (feature: keyof PlanAccess): boolean => {
        return access[feature] as boolean;
    };

    const canAccessRoute = (route: string): boolean => {
        const feature = ROUTE_TO_FEATURE[route];
        if (!feature) return true; // Unknown routes are allowed
        return access[feature] as boolean;
    };

    return {
        access,
        isSuperAdmin,
        canAccess,
        canAccessRoute,
        role: userProfile?.role || 'Agent',
        plan: isSuperAdmin ? 'enterprise' as PlanTier : 'starter' as PlanTier,
    };
}

export { PLAN_ACCESS, ROUTE_TO_FEATURE };
export type { PlanAccess };
