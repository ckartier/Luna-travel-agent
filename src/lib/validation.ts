/**
 * Data Validation Module
 * 
 * Validates CRM data before create/update operations.
 * Returns null if valid, or an error object with fields and messages.
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

function fail(errors: ValidationError[]): ValidationResult {
    return { valid: false, errors };
}

function pass(): ValidationResult {
    return { valid: true, errors: [] };
}

// ═══ CONTACTS ═══

export function validateContact(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.firstName?.trim()) {
        errors.push({ field: 'firstName', message: 'Le prénom est requis' });
    }
    if (!data.lastName?.trim()) {
        errors.push({ field: 'lastName', message: 'Le nom est requis' });
    }
    if (!data.email?.trim()) {
        errors.push({ field: 'email', message: 'L\'email est requis' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'email', message: 'Format email invalide' });
    }
    if (data.phone && !/^[\d\s+\-().]{6,20}$/.test(data.phone)) {
        errors.push({ field: 'phone', message: 'Format téléphone invalide' });
    }

    return errors.length > 0 ? fail(errors) : pass();
}

// ═══ TRIPS ═══

export function validateTrip(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.destination?.trim()) {
        errors.push({ field: 'destination', message: 'La destination est requise' });
    }
    if (!data.clientName?.trim()) {
        errors.push({ field: 'clientName', message: 'Le client est requis' });
    }
    if (data.startDate && data.endDate) {
        if (new Date(data.endDate) < new Date(data.startDate)) {
            errors.push({ field: 'endDate', message: 'La date de fin doit être après la date de début' });
        }
    }
    if (data.travelers !== undefined && (data.travelers < 1 || data.travelers > 100)) {
        errors.push({ field: 'travelers', message: 'Nombre de voyageurs entre 1 et 100' });
    }
    if (data.amount !== undefined && data.amount < 0) {
        errors.push({ field: 'amount', message: 'Le montant ne peut pas être négatif' });
    }

    return errors.length > 0 ? fail(errors) : pass();
}

// ═══ QUOTES ═══

export function validateQuote(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.clientName?.trim()) {
        errors.push({ field: 'clientName', message: 'Le client est requis' });
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push({ field: 'items', message: 'Au moins un article est requis' });
    } else {
        data.items.forEach((item: any, i: number) => {
            if (!item.description?.trim()) {
                errors.push({ field: `items[${i}].description`, message: `Description requise pour l'article ${i + 1}` });
            }
            if (item.unitPrice === undefined || item.unitPrice < 0) {
                errors.push({ field: `items[${i}].unitPrice`, message: `Prix invalide pour l'article ${i + 1}` });
            }
            if (item.quantity === undefined || item.quantity < 1) {
                errors.push({ field: `items[${i}].quantity`, message: `Quantité invalide pour l'article ${i + 1}` });
            }
        });
    }
    if (data.validUntil && new Date(data.validUntil) < new Date()) {
        errors.push({ field: 'validUntil', message: 'La date de validité est passée' });
    }

    return errors.length > 0 ? fail(errors) : pass();
}

// ═══ INVOICES ═══

export function validateInvoice(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.clientName?.trim()) {
        errors.push({ field: 'clientName', message: 'Le client est requis' });
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push({ field: 'items', message: 'Au moins un article est requis' });
    } else {
        data.items.forEach((item: any, i: number) => {
            if (!item.description?.trim()) {
                errors.push({ field: `items[${i}].description`, message: `Description requise pour l'article ${i + 1}` });
            }
            if (item.unitPrice === undefined || item.unitPrice < 0) {
                errors.push({ field: `items[${i}].unitPrice`, message: `Prix invalide pour l'article ${i + 1}` });
            }
        });
    }
    if (data.dueDate && new Date(data.dueDate) < new Date(data.issueDate || new Date())) {
        errors.push({ field: 'dueDate', message: 'L\'échéance doit être après la date d\'émission' });
    }

    return errors.length > 0 ? fail(errors) : pass();
}

// ═══ SUPPLIERS ═══

export function validateSupplier(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.name?.trim()) {
        errors.push({ field: 'name', message: 'Le nom est requis' });
    }
    if (!data.category?.trim()) {
        errors.push({ field: 'category', message: 'La catégorie est requise' });
    }
    if (!data.country?.trim()) {
        errors.push({ field: 'country', message: 'Le pays est requis' });
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({ field: 'email', message: 'Format email invalide' });
    }
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        errors.push({ field: 'rating', message: 'Note entre 1 et 5' });
    }

    return errors.length > 0 ? fail(errors) : pass();
}

// ═══ GENERIC ═══

export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
    return /^[\d\s+\-().]{6,20}$/.test(phone);
}

export function validateDate(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
}

export function sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
}
