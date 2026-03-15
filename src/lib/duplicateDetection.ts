import { adminDb } from '@/src/lib/firebase/admin';

/**
 * Duplicate Detection Module
 * 
 * Finds potential duplicate contacts and suppliers in a tenant's data.
 * Uses fuzzy matching on name, email, and phone fields.
 */

export interface DuplicateMatch {
    id1: string;
    id2: string;
    name1: string;
    name2: string;
    score: number; // 0-100
    matchFields: string[];
}

/**
 * Normalize a string for comparison: lowercase, trim, remove accents
 */
function normalize(str: string): string {
    return (str || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s@.+]/g, '');
}

/**
 * Simple similarity score (Dice coefficient on bigrams)
 */
function similarity(a: string, b: string): number {
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return 100;
    if (!na || !nb) return 0;

    const bigramsA = new Set<string>();
    const bigramsB = new Set<string>();
    for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.slice(i, i + 2));
    for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.slice(i, i + 2));

    if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

    let intersection = 0;
    bigramsA.forEach(bg => { if (bigramsB.has(bg)) intersection++; });

    return Math.round((2 * intersection) / (bigramsA.size + bigramsB.size) * 100);
}

/**
 * Detect duplicate contacts
 */
export async function detectDuplicateContacts(tenantId: string): Promise<DuplicateMatch[]> {
    const snap = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('contacts')
        .get();

    const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const duplicates: DuplicateMatch[] = [];

    for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
            const a = contacts[i] as any;
            const b = contacts[j] as any;

            const matchFields: string[] = [];
            let score = 0;

            // Email match (strongest signal)
            if (a.email && b.email && normalize(a.email) === normalize(b.email)) {
                matchFields.push('email');
                score += 50;
            }

            // Phone match
            const phoneA = (a.phone || '').replace(/\D/g, '');
            const phoneB = (b.phone || '').replace(/\D/g, '');
            if (phoneA && phoneB && phoneA.length >= 8 && phoneA === phoneB) {
                matchFields.push('phone');
                score += 30;
            }

            // Name similarity
            const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
            const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
            const nameSim = similarity(nameA, nameB);
            if (nameSim >= 80) {
                matchFields.push('name');
                score += Math.round(nameSim * 0.3);
            }

            if (score >= 40) {
                duplicates.push({
                    id1: a.id, id2: b.id,
                    name1: nameA, name2: nameB,
                    score: Math.min(score, 100),
                    matchFields,
                });
            }
        }
    }

    return duplicates.sort((a, b) => b.score - a.score);
}

/**
 * Detect duplicate suppliers
 */
export async function detectDuplicateSuppliers(tenantId: string): Promise<DuplicateMatch[]> {
    const snap = await adminDb
        .collection('tenants').doc(tenantId)
        .collection('suppliers')
        .get();

    const suppliers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const duplicates: DuplicateMatch[] = [];

    for (let i = 0; i < suppliers.length; i++) {
        for (let j = i + 1; j < suppliers.length; j++) {
            const a = suppliers[i] as any;
            const b = suppliers[j] as any;

            const matchFields: string[] = [];
            let score = 0;

            // Email match
            if (a.email && b.email && normalize(a.email) === normalize(b.email)) {
                matchFields.push('email');
                score += 50;
            }

            // Phone match
            const phoneA = (a.phone || '').replace(/\D/g, '');
            const phoneB = (b.phone || '').replace(/\D/g, '');
            if (phoneA && phoneB && phoneA.length >= 8 && phoneA === phoneB) {
                matchFields.push('phone');
                score += 30;
            }

            // Name similarity
            const nameSim = similarity(a.name || '', b.name || '');
            if (nameSim >= 75) {
                matchFields.push('name');
                score += Math.round(nameSim * 0.3);
            }

            // Same city + category
            if (a.city && b.city && normalize(a.city) === normalize(b.city) &&
                a.category && b.category && a.category === b.category) {
                matchFields.push('city+category');
                score += 15;
            }

            if (score >= 40) {
                duplicates.push({
                    id1: a.id, id2: b.id,
                    name1: a.name || '', name2: b.name || '',
                    score: Math.min(score, 100),
                    matchFields,
                });
            }
        }
    }

    return duplicates.sort((a, b) => b.score - a.score);
}
