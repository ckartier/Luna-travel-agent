/**
 * RBAC (Role-Based Access Control) Middleware
 * 
 * Use in API routes to enforce role-based permissions.
 * 
 * Roles hierarchy: SuperAdmin > Admin > Manager > Agent
 */

import { NextResponse } from 'next/server';

export type Role = 'Agent' | 'Manager' | 'Admin' | 'SuperAdmin';

const ROLE_HIERARCHY: Record<Role, number> = {
    'Agent': 1,
    'Manager': 2,
    'Admin': 3,
    'SuperAdmin': 4,
};

export interface AuthData {
    uid: string;
    tenantId?: string;
    role?: string;
}

/**
 * Check if a user has the minimum required role
 */
export function hasMinRole(userRole: string | undefined, minRole: Role): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as Role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= requiredLevel;
}

/**
 * Middleware: require minimum role, return 403 Response if denied
 */
export function requireRole(auth: AuthData, minRole: Role): Response | null {
    if (!hasMinRole(auth.role, minRole)) {
        return NextResponse.json(
            { error: `Accès refusé. Rôle minimum requis : ${minRole}` },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Permission matrix — which actions require which minimum role
 */
export const PERMISSIONS = {
    // Data management
    'contacts.read': 'Agent' as Role,
    'contacts.write': 'Agent' as Role,
    'contacts.delete': 'Manager' as Role,
    
    'trips.read': 'Agent' as Role,
    'trips.write': 'Agent' as Role,
    'trips.delete': 'Manager' as Role,
    
    // Finance
    'quotes.read': 'Agent' as Role,
    'quotes.write': 'Agent' as Role,
    'quotes.delete': 'Manager' as Role,
    
    'invoices.read': 'Agent' as Role,
    'invoices.write': 'Agent' as Role,
    'invoices.delete': 'Manager' as Role,
    
    // Export
    'export.data': 'Manager' as Role,
    
    // Admin
    'settings.read': 'Agent' as Role,
    'settings.write': 'Admin' as Role,
    'api_keys.manage': 'Admin' as Role,
    'webhooks.manage': 'Admin' as Role,
    'tenants.manage': 'SuperAdmin' as Role,
};

/**
 * Check if a user has permission for a specific action
 */
export function hasPermission(auth: AuthData, action: keyof typeof PERMISSIONS): boolean {
    const minRole = PERMISSIONS[action];
    return hasMinRole(auth.role, minRole);
}

/**
 * Middleware: require permission, return 403 Response if denied
 */
export function requirePermission(auth: AuthData, action: keyof typeof PERMISSIONS): Response | null {
    if (!hasPermission(auth, action)) {
        return NextResponse.json(
            { error: `Permission refusée pour l'action : ${action}` },
            { status: 403 }
        );
    }
    return null;
}
