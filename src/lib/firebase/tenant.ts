'use client';

import { db } from './client';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';

// ═══ TENANT INTERFACE ═══
export type TenantPlan = 'starter' | 'site_builder' | 'crm' | 'all_in_one' | 'pro' | 'enterprise';

export interface Tenant {
    id?: string;
    name: string;
    slug: string;
    plan: TenantPlan;
    ownerId: string;
    members: {
        [uid: string]: {
            role: 'owner' | 'admin' | 'agent' | 'viewer';
            email: string;
            displayName: string;
            joinedAt: Timestamp | Date;
        };
    };
    settings: {
        currency: string;
        timezone: string;
        defaultMarkup: number;
        logo?: string;
        emailSignature?: string;
        whatsappPhoneId?: string;
        stripeCustomerId?: string;
    };
    limits: {
        maxContacts: number;
        maxTripsPerMonth: number;
        maxTeamMembers: number;
        aiQueriesPerDay: number;
    };
    /** Multi-vertical: 'travel' | 'property' | 'events' | ... (defaults to 'travel') */
    vertical?: string;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

// Plan-based limits — aligned with pricing page
const PLAN_LIMITS: Record<TenantPlan, Tenant['limits']> = {
    starter: {
        maxContacts: 100,
        maxTripsPerMonth: 10,
        maxTeamMembers: 1,
        aiQueriesPerDay: 5,
    },
    site_builder: {
        maxContacts: 0,
        maxTripsPerMonth: 0,
        maxTeamMembers: 1,
        aiQueriesPerDay: 5,
    },
    crm: {
        maxContacts: 500,
        maxTripsPerMonth: 50,
        maxTeamMembers: 5,
        aiQueriesPerDay: 30,
    },
    all_in_one: {
        maxContacts: 2000,
        maxTripsPerMonth: 200,
        maxTeamMembers: 15,
        aiQueriesPerDay: 100,
    },
    pro: {
        maxContacts: 2000,
        maxTripsPerMonth: 200,
        maxTeamMembers: 15,
        aiQueriesPerDay: 100,
    },
    enterprise: {
        maxContacts: -1, // unlimited
        maxTripsPerMonth: -1,
        maxTeamMembers: -1,
        aiQueriesPerDay: -1,
    },
};

/**
 * Create a new tenant for a user (called on first signup).
 * Uses the user's uid as the default tenantId for simplicity.
 */
export async function createTenant(
    uid: string,
    email: string,
    displayName: string,
    agencyName?: string,
): Promise<string> {
    const tenantId = uid; // Default: 1 user = 1 tenant
    const tenantRef = doc(db, 'tenants', tenantId);

    const existing = await getDoc(tenantRef);
    if (existing.exists()) {
        return tenantId; // Already exists
    }

    const plan: Tenant['plan'] = 'starter';

    const tenant: Omit<Tenant, 'id'> = {
        name: agencyName || `${displayName}'s Agency`,
        slug: tenantId,
        plan,
        ownerId: uid,
        members: {
            [uid]: {
                role: 'owner',
                email,
                displayName,
                joinedAt: new Date(),
            },
        },
        settings: {
            currency: 'EUR',
            timezone: 'Europe/Paris',
            defaultMarkup: 0.15,
        },
        limits: PLAN_LIMITS[plan],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await setDoc(tenantRef, tenant);
    return tenantId;
}

/**
 * Get a tenant by ID.
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
    const tenantRef = doc(db, 'tenants', tenantId);
    const snapshot = await getDoc(tenantRef);
    return snapshot.exists()
        ? ({ id: snapshot.id, ...snapshot.data() } as Tenant)
        : null;
}

/**
 * Update tenant settings.
 */
export async function updateTenantSettings(
    tenantId: string,
    settings: Partial<Tenant['settings']>,
): Promise<void> {
    const tenantRef = doc(db, 'tenants', tenantId);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(settings)) {
        updates[`settings.${key}`] = value;
    }
    await updateDoc(tenantRef, updates);
}

/**
 * Update tenant plan and limits.
 */
export async function updateTenantPlan(
    tenantId: string,
    plan: Tenant['plan'],
): Promise<void> {
    const tenantRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantRef, {
        plan,
        limits: PLAN_LIMITS[plan],
        updatedAt: new Date(),
    });
}

/**
 * Add a member to a tenant.
 */
export async function addTenantMember(
    tenantId: string,
    uid: string,
    email: string,
    displayName: string,
    role: 'admin' | 'agent' | 'viewer' = 'agent',
): Promise<void> {
    const tenantRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantRef, {
        [`members.${uid}`]: {
            role,
            email,
            displayName,
            joinedAt: new Date(),
        },
        updatedAt: new Date(),
    });
}

/**
 * Remove a member from a tenant.
 */
export async function removeTenantMember(
    tenantId: string,
    uid: string,
): Promise<void> {
    const tenantRef = doc(db, 'tenants', tenantId);
    const { deleteField } = await import('firebase/firestore');
    await updateDoc(tenantRef, {
        [`members.${uid}`]: deleteField(),
        updatedAt: new Date(),
    });
}

/**
 * Update a member's role in a tenant.
 */
export async function updateTenantMemberRole(
    tenantId: string,
    uid: string,
    role: 'admin' | 'agent' | 'viewer' | 'owner',
): Promise<void> {
    const tenantRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantRef, {
        [`members.${uid}.role`]: role,
        updatedAt: serverTimestamp(),
    });
}

export { PLAN_LIMITS };
