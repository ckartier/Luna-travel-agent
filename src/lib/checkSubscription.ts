import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/* ═══════════════════════════════════════════════════
   SERVER-SIDE PAYWALL ENFORCEMENT
   Verifies subscription status + plan modules
   before serving any paid feature data.
   ═══════════════════════════════════════════════════ */

type ProductModule = 'site_builder' | 'crm' | 'ai_agents' | 'whatsapp' | 'analytics_pro';

// Mirror of client-side PLAN_DEFINITIONS — single source of truth for server
const PLAN_MODULES: Record<string, ProductModule[]> = {
    site_builder: ['site_builder'],
    crm: ['crm'],
    all_in_one: ['site_builder', 'crm', 'analytics_pro'],
    enterprise: ['site_builder', 'crm', 'ai_agents', 'whatsapp', 'analytics_pro'],
    // Legacy mappings
    starter: ['crm'],
    pro: ['site_builder', 'crm', 'analytics_pro'],
};

interface SubscriptionCheck {
    hasAccess: boolean;
    planId: string | null;
    status: string | null;
}

/**
 * Check if a user's subscription grants access to a specific module.
 * Returns { hasAccess, planId, status }
 */
export async function checkSubscription(
    email: string,
    requiredModule: ProductModule
): Promise<SubscriptionCheck> {
    try {
        const subDoc = await adminDb.collection('subscriptions').doc(email).get();

        if (!subDoc.exists) {
            return { hasAccess: false, planId: null, status: null };
        }

        const sub = subDoc.data()!;
        const status = sub.status as string;
        const planId = sub.planId as string;

        // Only active or trialing subscriptions grant access
        if (status !== 'active' && status !== 'trialing') {
            return { hasAccess: false, planId, status };
        }

        // Check if the plan includes the required module
        const modules = PLAN_MODULES[planId] || [];
        const addons = sub.addons || [];
        const allModules = [...modules, ...addons];

        return {
            hasAccess: allModules.includes(requiredModule),
            planId,
            status,
        };
    } catch (err) {
        console.error('[checkSubscription] Error:', err);
        // Fail open on errors to avoid blocking legitimate users
        // (auth layer still protects the route)
        return { hasAccess: true, planId: null, status: null };
    }
}

/**
 * Check if user is a SuperAdmin (bypasses all subscription checks).
 */
export async function isSuperAdmin(uid: string): Promise<boolean> {
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data()?.role === 'SuperAdmin';
    } catch {
        return false;
    }
}

/**
 * Middleware helper: verify subscription and return 402 if user doesn't have access.
 * Use in API routes: const paywallCheck = await requireSubscription(auth, 'crm');
 *                     if (paywallCheck) return paywallCheck;
 */
export async function requireSubscription(
    auth: { uid: string; email: string; tenantId?: string },
    requiredModule: ProductModule
): Promise<NextResponse | null> {
    // SuperAdmins bypass paywall
    if (await isSuperAdmin(auth.uid)) return null;

    const { hasAccess, planId, status } = await checkSubscription(auth.email, requiredModule);

    if (!hasAccess) {
        return NextResponse.json(
            {
                error: 'Subscription required',
                code: 'SUBSCRIPTION_REQUIRED',
                requiredModule,
                currentPlan: planId,
                currentStatus: status,
                upgradeUrl: '/pricing',
            },
            { status: 402 }
        );
    }

    return null; // Access granted
}
