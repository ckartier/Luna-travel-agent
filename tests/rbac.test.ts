import { describe, it, expect } from 'vitest';
import { hasMinRole, hasPermission, PERMISSIONS } from '../src/lib/rbac';

describe('hasMinRole', () => {
    it('Agent has Agent role', () => {
        expect(hasMinRole('Agent', 'Agent')).toBe(true);
    });

    it('Agent does not have Manager role', () => {
        expect(hasMinRole('Agent', 'Manager')).toBe(false);
    });

    it('Manager has Agent role', () => {
        expect(hasMinRole('Manager', 'Agent')).toBe(true);
    });

    it('Admin has Manager role', () => {
        expect(hasMinRole('Admin', 'Manager')).toBe(true);
    });

    it('SuperAdmin has all roles', () => {
        expect(hasMinRole('SuperAdmin', 'Agent')).toBe(true);
        expect(hasMinRole('SuperAdmin', 'Manager')).toBe(true);
        expect(hasMinRole('SuperAdmin', 'Admin')).toBe(true);
        expect(hasMinRole('SuperAdmin', 'SuperAdmin')).toBe(true);
    });

    it('undefined role has no access', () => {
        expect(hasMinRole(undefined, 'Agent')).toBe(false);
    });

    it('unknown role has no access', () => {
        expect(hasMinRole('Visitor', 'Agent')).toBe(false);
    });
});

describe('hasPermission', () => {
    it('Agent can read contacts', () => {
        expect(hasPermission({ uid: '1', role: 'Agent' }, 'contacts.read')).toBe(true);
    });

    it('Agent cannot delete contacts', () => {
        expect(hasPermission({ uid: '1', role: 'Agent' }, 'contacts.delete')).toBe(false);
    });

    it('Manager can delete contacts', () => {
        expect(hasPermission({ uid: '1', role: 'Manager' }, 'contacts.delete')).toBe(true);
    });

    it('Agent cannot export data', () => {
        expect(hasPermission({ uid: '1', role: 'Agent' }, 'export.data')).toBe(false);
    });

    it('Manager can export data', () => {
        expect(hasPermission({ uid: '1', role: 'Manager' }, 'export.data')).toBe(true);
    });

    it('Agent cannot manage API keys', () => {
        expect(hasPermission({ uid: '1', role: 'Agent' }, 'api_keys.manage')).toBe(false);
    });

    it('Admin can manage API keys', () => {
        expect(hasPermission({ uid: '1', role: 'Admin' }, 'api_keys.manage')).toBe(true);
    });

    it('Admin cannot manage tenants', () => {
        expect(hasPermission({ uid: '1', role: 'Admin' }, 'tenants.manage')).toBe(false);
    });

    it('SuperAdmin can manage tenants', () => {
        expect(hasPermission({ uid: '1', role: 'SuperAdmin' }, 'tenants.manage')).toBe(true);
    });
});

describe('PERMISSIONS matrix', () => {
    it('should have 18 defined permissions', () => {
        expect(Object.keys(PERMISSIONS).length).toBe(18);
    });

    it('all permissions map to valid roles', () => {
        const validRoles = ['Agent', 'Manager', 'Admin', 'SuperAdmin'];
        Object.values(PERMISSIONS).forEach(role => {
            expect(validRoles).toContain(role);
        });
    });
});
