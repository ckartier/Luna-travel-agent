import { describe, it, expect } from 'vitest';
import {
    validateContact,
    validateTrip,
    validateQuote,
    validateInvoice,
    validateSupplier,
    validateEmail,
    validatePhone,
    validateDate,
    sanitizeString,
} from '../src/lib/validation';

describe('validateContact', () => {
    it('should pass with valid data', () => {
        const result = validateContact({
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@example.com',
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail without firstName', () => {
        const result = validateContact({ lastName: 'Dupont', email: 'jean@example.com' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'firstName')).toBe(true);
    });

    it('should fail with invalid email', () => {
        const result = validateContact({ firstName: 'Jean', lastName: 'Dupont', email: 'invalid' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should fail with invalid phone', () => {
        const result = validateContact({ firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com', phone: 'abc' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'phone')).toBe(true);
    });

    it('should pass with valid phone', () => {
        const result = validateContact({ firstName: 'Jean', lastName: 'Dupont', email: 'j@e.com', phone: '+33 6 12 34 56 78' });
        expect(result.valid).toBe(true);
    });
});

describe('validateTrip', () => {
    it('should pass with valid data', () => {
        const result = validateTrip({ destination: 'Bali', clientName: 'Jean Dupont' });
        expect(result.valid).toBe(true);
    });

    it('should fail without destination', () => {
        const result = validateTrip({ clientName: 'Jean' });
        expect(result.valid).toBe(false);
    });

    it('should fail when endDate before startDate', () => {
        const result = validateTrip({
            destination: 'Bali', clientName: 'Jean',
            startDate: '2026-06-15', endDate: '2026-06-10',
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'endDate')).toBe(true);
    });

    it('should fail with negative amount', () => {
        const result = validateTrip({ destination: 'Bali', clientName: 'Jean', amount: -100 });
        expect(result.valid).toBe(false);
    });
});

describe('validateQuote', () => {
    it('should pass with valid items', () => {
        const result = validateQuote({
            clientName: 'Jean',
            items: [{ description: 'Hotel', unitPrice: 200, quantity: 3 }],
        });
        expect(result.valid).toBe(true);
    });

    it('should fail without items', () => {
        const result = validateQuote({ clientName: 'Jean', items: [] });
        expect(result.valid).toBe(false);
    });

    it('should fail with invalid item price', () => {
        const result = validateQuote({
            clientName: 'Jean',
            items: [{ description: 'Hotel', unitPrice: -10, quantity: 1 }],
        });
        expect(result.valid).toBe(false);
    });
});

describe('validateInvoice', () => {
    it('should pass with valid data', () => {
        const result = validateInvoice({
            clientName: 'Jean',
            items: [{ description: 'Service', unitPrice: 500 }],
        });
        expect(result.valid).toBe(true);
    });

    it('should fail without clientName', () => {
        const result = validateInvoice({ items: [{ description: 'A', unitPrice: 10 }] });
        expect(result.valid).toBe(false);
    });
});

describe('validateSupplier', () => {
    it('should pass with valid data', () => {
        const result = validateSupplier({ name: 'Hotel Bali', category: 'HOTEL', country: 'Indonésie' });
        expect(result.valid).toBe(true);
    });

    it('should fail with invalid rating', () => {
        const result = validateSupplier({ name: 'Hotel', category: 'HOTEL', country: 'FR', rating: 10 });
        expect(result.valid).toBe(false);
    });
});

describe('utility validators', () => {
    it('validateEmail accepts valid emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user+tag@domain.co')).toBe(true);
    });

    it('validateEmail rejects invalid emails', () => {
        expect(validateEmail('invalid')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
    });

    it('validatePhone accepts valid phones', () => {
        expect(validatePhone('+33 6 12 34 56 78')).toBe(true);
        expect(validatePhone('0612345678')).toBe(true);
    });

    it('validateDate accepts valid dates', () => {
        expect(validateDate('2026-06-15')).toBe(true);
        expect(validateDate('invalid')).toBe(false);
    });

    it('sanitizeString removes dangerous chars', () => {
        expect(sanitizeString('  hello <script>  ')).toBe('hello script');
    });
});
