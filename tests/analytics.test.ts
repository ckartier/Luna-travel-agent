import { describe, it, expect } from 'vitest';
import { track, identify, page, EVENTS } from '../src/lib/analytics';

describe('analytics', () => {
    it('track should not throw', () => {
        expect(() => track('test.event', { key: 'value' })).not.toThrow();
    });

    it('identify should not throw', () => {
        expect(() => identify('user123', { email: 'test@test.com' })).not.toThrow();
    });

    it('page should not throw', () => {
        expect(() => page('/dashboard', { source: 'direct' })).not.toThrow();
    });

    it('track with no properties should not throw', () => {
        expect(() => track('simple.event')).not.toThrow();
    });

    it('EVENTS should have auth events', () => {
        expect(EVENTS.LOGIN).toBe('auth.login');
        expect(EVENTS.LOGOUT).toBe('auth.logout');
        expect(EVENTS.SIGNUP).toBe('auth.signup');
    });

    it('EVENTS should have contact events', () => {
        expect(EVENTS.CONTACT_CREATED).toBe('contact.created');
        expect(EVENTS.CONTACT_MERGED).toBe('contact.merged');
    });

    it('EVENTS should have finance events', () => {
        expect(EVENTS.INVOICE_CREATED).toBe('invoice.created');
        expect(EVENTS.INVOICE_PAID).toBe('invoice.paid');
        expect(EVENTS.PAYMENT_RECEIVED).toBe('payment.received');
    });

    it('EVENTS should have feature events', () => {
        expect(EVENTS.SEARCH_USED).toBe('feature.search');
        expect(EVENTS.EXPORT_USED).toBe('feature.export');
        expect(EVENTS.AI_USED).toBe('feature.ai');
    });

    it('should have 22+ predefined events', () => {
        expect(Object.keys(EVENTS).length).toBeGreaterThanOrEqual(22);
    });
});
