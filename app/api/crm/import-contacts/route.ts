import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateContact } from '@/src/lib/validation';
import { requireRole } from '@/src/lib/rbac';

/**
 * POST /api/crm/import-contacts
 * 
 * Import contacts from CSV data. Requires Manager+ role.
 * Body: { contacts: Array<{ firstName, lastName, email, phone?, company?, ... }> }
 * 
 * Max 500 contacts per import.
 */
export async function POST(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    // Manager+ only
    const denied = requireRole(auth as any, 'Manager');
    if (denied) return denied;

    const body = await req.json();
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return NextResponse.json({ error: 'contacts[] required' }, { status: 400 });
    }
    if (contacts.length > 500) {
        return NextResponse.json({ error: 'Maximum 500 contacts par import' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const results = { imported: 0, skipped: 0, errors: [] as string[] };

        // Check existing emails to avoid duplicates
        const existingSnap = await tenantRef.collection('contacts').get();
        const existingEmails = new Set(
            existingSnap.docs.map(d => (d.data().email || '').toLowerCase()).filter(Boolean)
        );

        // Process in batches of 500 (Firestore limit)
        const batch = adminDb.batch();

        for (const contact of contacts) {
            // Validate
            const validation = validateContact(contact);
            if (!validation.valid) {
                results.skipped++;
                results.errors.push(`${contact.firstName || ''} ${contact.lastName || ''}: ${validation.errors[0]?.message}`);
                continue;
            }

            // Skip duplicates
            if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
                results.skipped++;
                results.errors.push(`${contact.email}: doublon`);
                continue;
            }

            const docRef = tenantRef.collection('contacts').doc();
            batch.set(docRef, {
                firstName: (contact.firstName || '').trim(),
                lastName: (contact.lastName || '').trim(),
                email: (contact.email || '').trim().toLowerCase(),
                phone: (contact.phone || '').trim(),
                company: (contact.company || '').trim(),
                nationality: contact.nationality || '',
                vipLevel: contact.vipLevel || 'Standard',
                tags: contact.tags || [],
                source: 'import',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });

            existingEmails.add(contact.email.toLowerCase());
            results.imported++;
        }

        if (results.imported > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            ...results,
            message: `${results.imported} contact(s) importé(s), ${results.skipped} ignoré(s)`,
        });
    } catch (error: any) {
        console.error('[Import] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
