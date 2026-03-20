import { adminDb } from '@/src/lib/firebase/admin';

/**
 * Server-side tenant limit checks.
 * Call these before creating contacts, trips, or AI queries.
 */

export async function checkTenantLimit(
    tenantId: string,
    resource: 'contacts' | 'trips' | 'ai',
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantSnap.exists) {
        return { allowed: false, current: 0, limit: 0, message: 'Tenant introuvable' };
    }

    const tenant = tenantSnap.data()!;
    const limits = tenant.limits || {};

    if (resource === 'contacts') {
        const max = limits.maxContacts ?? 100;
        if (max === -1) return { allowed: true, current: 0, limit: -1 }; // unlimited

        const contactsSnap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('contacts')
            .count()
            .get();
        const count = contactsSnap.data().count;

        if (count >= max) {
            return {
                allowed: false,
                current: count,
                limit: max,
                message: `Limite de contacts atteinte (${count}/${max}). Passez au plan supérieur.`,
            };
        }
        return { allowed: true, current: count, limit: max };
    }

    if (resource === 'trips') {
        const max = limits.maxTripsPerMonth ?? 10;
        if (max === -1) return { allowed: true, current: 0, limit: -1 };

        // Count trips created this month
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const tripsSnap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('trips')
            .where('createdAt', '>=', firstOfMonth)
            .count()
            .get();
        const count = tripsSnap.data().count;

        if (count >= max) {
            return {
                allowed: false,
                current: count,
                limit: max,
                message: `Limite de voyages/mois atteinte (${count}/${max}). Passez au plan supérieur.`,
            };
        }
        return { allowed: true, current: count, limit: max };
    }

    if (resource === 'ai') {
        const max = limits.aiQueriesPerDay ?? 5;
        if (max === -1) return { allowed: true, current: 0, limit: -1 };

        const todayKey = new Date().toISOString().split('T')[0];
        const usageSnap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('usage').doc(todayKey)
            .get();
        const count = usageSnap.exists ? (usageSnap.data()?.aiQueries ?? 0) : 0;

        if (count >= max) {
            return {
                allowed: false,
                current: count,
                limit: max,
                message: `Limite IA quotidienne atteinte (${count}/${max}). Passez au plan supérieur.`,
            };
        }
        return { allowed: true, current: count, limit: max };
    }

    return { allowed: true, current: 0, limit: -1 };
}

/**
 * Get full usage summary for a tenant (for settings/billing UI).
 */
export async function getTenantUsageSummary(tenantId: string) {
    const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantSnap.exists) return null;

    const tenant = tenantSnap.data()!;
    const limits = tenant.limits || {};

    // Contacts count
    const contactsSnap = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('contacts')
        .count()
        .get();

    // Trips this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const tripsSnap = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('trips')
        .where('createdAt', '>=', firstOfMonth)
        .count()
        .get();

    // AI queries today
    const todayKey = now.toISOString().split('T')[0];
    const usageSnap = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('usage').doc(todayKey)
        .get();

    // Team members
    const memberCount = Object.keys(tenant.members || {}).length;

    return {
        plan: tenant.plan || 'starter',
        contacts: {
            current: contactsSnap.data().count,
            limit: limits.maxContacts ?? 100,
        },
        tripsThisMonth: {
            current: tripsSnap.data().count,
            limit: limits.maxTripsPerMonth ?? 10,
        },
        aiToday: {
            current: usageSnap.exists ? (usageSnap.data()?.aiQueries ?? 0) : 0,
            limit: limits.aiQueriesPerDay ?? 5,
        },
        team: {
            current: memberCount,
            limit: limits.maxTeamMembers ?? 1,
        },
    };
}

/**
 * Check and consume 1 AI query limit.
 * Increments the daily counter if allowed.
 */
export async function consumeAiUsage(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
    const tenantSnap = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantSnap.exists) return { allowed: false, message: 'Tenant introuvable' };

    const tenant = tenantSnap.data()!;
    const max = tenant.limits?.aiQueriesPerDay ?? 5;
    
    if (max === -1) return { allowed: true }; // Unlimited

    const todayKey = new Date().toISOString().split('T')[0];
    const usageRef = adminDb.collection('tenants').doc(tenantId).collection('usage').doc(todayKey);
    const usageSnap = await usageRef.get();
    const count = usageSnap.exists ? (usageSnap.data()?.aiQueries ?? 0) : 0;

    if (count >= max) {
        return {
            allowed: false,
            message: `Limite IA quotidienne atteinte (${count}/${max}). Passez au plan supérieur.`
        };
    }

    // Allowed, so increment.
    const { FieldValue } = await import('firebase-admin/firestore');
    if (usageSnap.exists) {
        await usageRef.update({
            aiQueries: FieldValue.increment(1),
            lastQuery: FieldValue.serverTimestamp(),
        });
    } else {
        await usageRef.set({
            date: todayKey,
            aiQueries: 1,
            lastQuery: FieldValue.serverTimestamp(),
        });
    }

    return { allowed: true };
}
