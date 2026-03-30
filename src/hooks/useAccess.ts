'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { useMemo } from 'react';

// ═══ MODULE-BASED ACCESS SYSTEM ═══
// Products are sold as modules, not linear tiers

export type ProductModule = 'site_builder' | 'crm' | 'ai_agents' | 'whatsapp' | 'analytics_pro';

export type PlanId = 'site_builder' | 'crm' | 'all_in_one' | 'enterprise';

// Legacy compat
export type PlanTier = 'starter' | 'pro' | 'enterprise';

interface PlanDefinition {
    name: string;
    modules: ProductModule[];
    limits: {
        maxContacts: number;
        maxTripsPerMonth: number;
        maxTeamMembers: number;
        aiQueriesPerDay: number;
    };
}

const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
    site_builder: {
        name: 'Site Builder',
        modules: ['site_builder'],
        limits: { maxContacts: 0, maxTripsPerMonth: 0, maxTeamMembers: 1, aiQueriesPerDay: 5 },
    },
    crm: {
        name: 'CRM Pro',
        modules: ['crm'],
        limits: { maxContacts: 500, maxTripsPerMonth: 50, maxTeamMembers: 5, aiQueriesPerDay: 30 },
    },
    all_in_one: {
        name: 'All-in-One',
        modules: ['site_builder', 'crm', 'analytics_pro'],
        limits: { maxContacts: 2000, maxTripsPerMonth: 200, maxTeamMembers: 15, aiQueriesPerDay: 100 },
    },
    enterprise: {
        name: 'Enterprise',
        modules: ['site_builder', 'crm', 'ai_agents', 'whatsapp', 'analytics_pro'],
        limits: { maxContacts: -1, maxTripsPerMonth: -1, maxTeamMembers: -1, aiQueriesPerDay: -1 },
    },
};

// Map features to required module
export const FEATURE_MODULE: Record<string, ProductModule> = {
    // Site Builder features
    'website-editor': 'site_builder',
    'templates': 'site_builder',
    'site-design': 'site_builder',
    'site-analytics': 'site_builder',

    // CRM features
    'dashboard': 'crm',
    'pipeline': 'crm',
    'contacts': 'crm',
    'planning': 'crm',
    'activities': 'crm',
    'mails': 'crm',
    'bookings': 'crm',
    'catalog': 'crm',
    'suppliers': 'crm',
    'quotes': 'crm',
    'invoices': 'crm',
    'payments': 'crm',
    'team': 'crm',
    'settings': 'crm',

    // Premium addons
    'ai': 'ai_agents',
    'whatsapp': 'whatsapp',
    'analytics': 'analytics_pro',
    'integrations': 'crm',
    'marketing': 'crm',
};

// Map CRM routes to feature keys  
const ROUTE_TO_FEATURE: Record<string, string> = {
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
    '/crm/team': 'team',
    '/crm/analytics': 'analytics',
    '/crm/integrations': 'integrations',
    '/crm/settings': 'settings',
    '/crm/marketing': 'marketing',
    '/crm/messages': 'dashboard',
    '/crm/documents': 'dashboard',
    '/crm/tasks': 'dashboard',
    '/crm/ai': 'ai',
    '/crm/templates': 'templates',
    '/crm/collections': 'website-editor',
    '/crm/setup': 'settings',
    '/site-admin': 'website-editor',
    '/site-admin/editor': 'website-editor',
    '/site-admin/templates': 'templates',
    '/site-admin/collections': 'website-editor',
    '/site-admin/prestations': 'catalog',
    '/site-admin/analytics': 'site-analytics',
};

// ── Legacy PlanAccess interface for backward compat ──
export interface PlanAccess {
    dashboard: boolean;
    pipeline: boolean;
    contacts: boolean;
    planning: boolean;
    activities: boolean;
    mails: boolean;
    bookings: boolean;
    catalog: boolean;
    suppliers: boolean;
    quotes: boolean;
    invoices: boolean;
    payments: boolean;
    messages: boolean;
    documents: boolean;
    marketing: boolean;
    team: boolean;
    analytics: boolean;
    ai: boolean;
    integrations: boolean;
    settings: boolean;
    maxContacts: number;
    maxTripsPerMonth: number;
    maxTeamMembers: number;
    aiQueriesPerDay: number;
}

function modulesToPlanAccess(modules: ProductModule[], limits: PlanDefinition['limits']): PlanAccess {
    const hasCRM = modules.includes('crm');
    const hasSite = modules.includes('site_builder');
    const hasAI = modules.includes('ai_agents');
    const hasAnalytics = modules.includes('analytics_pro');

    return {
        dashboard: hasCRM,
        pipeline: hasCRM,
        contacts: hasCRM,
        planning: hasCRM,
        activities: hasCRM,
        mails: hasCRM,
        bookings: hasCRM,
        catalog: hasCRM,
        suppliers: hasCRM,
        quotes: hasCRM,
        invoices: hasCRM,
        payments: hasCRM,
        messages: hasCRM,
        documents: hasCRM,
        marketing: hasCRM,
        team: hasCRM,
        analytics: hasAnalytics || hasCRM,
        ai: hasAI || hasCRM,  // Basic AI in CRM, advanced in addon
        integrations: hasCRM,
        settings: hasCRM || hasSite,
        ...limits,
    };
}

// ── Resolve plan from subscription ──
function resolvePlan(planId: string | null, isActive: boolean): PlanId {
    if (!isActive || !planId) return 'site_builder'; // Default free tier

    // Support legacy plan IDs
    const mapping: Record<string, PlanId> = {
        'starter': 'crm',
        'pro': 'all_in_one',
        'enterprise': 'enterprise',
        'site_builder': 'site_builder',
        'crm': 'crm',
        'all_in_one': 'all_in_one',
    };

    return mapping[planId] || 'site_builder';
}

export function useAccess() {
    const { userProfile, isSuperAdmin } = useAuth();
    const { planId, isActive, subscription } = useSubscription();
    const devFullAccess =
        process.env.NODE_ENV === 'development'
        && process.env.NEXT_PUBLIC_DEV_DISABLE_ACCESS_GATES !== 'true';

    const resolvedPlanId = useMemo(() => {
        if (isSuperAdmin || devFullAccess) return 'enterprise' as PlanId;
        return resolvePlan(planId, isActive);
    }, [isSuperAdmin, devFullAccess, planId, isActive]);

    const planDef = PLAN_DEFINITIONS[resolvedPlanId];
    const subscriptionAddons = useMemo<ProductModule[]>(() => {
        const addonsUnknown = (subscription as { addons?: unknown } | null)?.addons;
        if (!Array.isArray(addonsUnknown)) return [];
        const allowedModules: ProductModule[] = ['site_builder', 'crm', 'ai_agents', 'whatsapp', 'analytics_pro'];
        return addonsUnknown.filter((m): m is ProductModule =>
            typeof m === 'string' && allowedModules.includes(m as ProductModule)
        );
    }, [subscription]);

    const activeModules = useMemo<ProductModule[]>(() => {
        if (isSuperAdmin || devFullAccess) {
            return ['site_builder', 'crm', 'ai_agents', 'whatsapp', 'analytics_pro'];
        }
        return [...planDef.modules, ...subscriptionAddons];
    }, [isSuperAdmin, devFullAccess, planDef, subscriptionAddons]);

    const access = useMemo(() => {
        if (isSuperAdmin || devFullAccess) {
            return modulesToPlanAccess(
                ['site_builder', 'crm', 'ai_agents', 'whatsapp', 'analytics_pro'],
                PLAN_DEFINITIONS.enterprise.limits
            );
        }
        return modulesToPlanAccess(activeModules, planDef.limits);
    }, [isSuperAdmin, devFullAccess, activeModules, planDef]);

    const hasModule = (mod: ProductModule): boolean => {
        return activeModules.includes(mod);
    };

    const canAccess = (feature: keyof PlanAccess): boolean => {
        return access[feature] as boolean;
    };

    const canAccessFeature = (featureKey: string): boolean => {
        const requiredModule = FEATURE_MODULE[featureKey];
        if (!requiredModule) return true;
        return hasModule(requiredModule);
    };

    const canAccessRoute = (route: string): boolean => {
        const featureKey = ROUTE_TO_FEATURE[route];
        if (!featureKey) return true;
        return canAccessFeature(featureKey);
    };

    // What module is needed to unlock a feature?
    const getRequiredModule = (featureKey: string): ProductModule | null => {
        return FEATURE_MODULE[featureKey] || null;
    };

    // What plan upgrade is suggested?
    const getUpgradeSuggestion = (featureKey: string): { planId: PlanId; planName: string; price: number } | null => {
        const requiredModule = FEATURE_MODULE[featureKey];
        if (!requiredModule || hasModule(requiredModule)) return null;

        // If they have site_builder and need CRM
        if (hasModule('site_builder') && requiredModule === 'crm') {
            return { planId: 'all_in_one', planName: 'All-in-One', price: 99 };
        }
        // If they have CRM and need site_builder
        if (hasModule('crm') && requiredModule === 'site_builder') {
            return { planId: 'all_in_one', planName: 'All-in-One', price: 99 };
        }
        // If they need an addon
        if (requiredModule === 'ai_agents') {
            return { planId: 'enterprise', planName: 'Enterprise', price: 499 };
        }
        if (requiredModule === 'whatsapp') {
            return { planId: 'enterprise', planName: 'Enterprise', price: 499 };
        }
        // Default
        if (requiredModule === 'crm') {
            return { planId: 'crm', planName: 'CRM Pro', price: 79 };
        }
        if (requiredModule === 'site_builder') {
            return { planId: 'site_builder', planName: 'Site Builder', price: 29 };
        }
        return null;
    };

    const plan = resolvedPlanId;

    // Legacy compat
    const legacyPlan: PlanTier = useMemo(() => {
        if (resolvedPlanId === 'enterprise') return 'enterprise';
        if (resolvedPlanId === 'all_in_one') return 'pro';
        return 'starter';
    }, [resolvedPlanId]);

    return {
        access,
        isSuperAdmin,
        canAccess,
        canAccessFeature,
        canAccessRoute,
        hasModule,
        getRequiredModule,
        getUpgradeSuggestion,
        activeModules,
        role: userProfile?.role || 'Agent',
        plan,
        legacyPlan,
    };
}

export { PLAN_DEFINITIONS, ROUTE_TO_FEATURE };
