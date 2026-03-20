import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireRole } from '@/src/lib/rbac';

/**
 * POST /api/crm/merge-contacts
 * 
 * Merge two duplicate contacts into one. Requires Manager+ role.
 * Keeps the first contact (primary), merges missing fields from secondary,
 * updates all trip/invoice references, then deletes the secondary.
 * 
 * Body: { primaryId: string, secondaryId: string }
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

    // Manager+ only (destructive operation)
    const denied = requireRole(auth as any, 'Manager');
    if (denied) return denied;

    const body = await req.json();
    const { primaryId, secondaryId } = body;

    if (!primaryId || !secondaryId) {
        return NextResponse.json({ error: 'primaryId and secondaryId required' }, { status: 400 });
    }
    if (primaryId === secondaryId) {
        return NextResponse.json({ error: 'Cannot merge contact with itself' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Fetch both contacts
        const [primarySnap, secondarySnap] = await Promise.all([
            tenantRef.collection('contacts').doc(primaryId).get(),
            tenantRef.collection('contacts').doc(secondaryId).get(),
        ]);

        if (!primarySnap.exists) return NextResponse.json({ error: 'Primary contact not found' }, { status: 404 });
        if (!secondarySnap.exists) return NextResponse.json({ error: 'Secondary contact not found' }, { status: 404 });

        const primary = primarySnap.data()!;
        const secondary = secondarySnap.data()!;

        // Merge: fill empty fields in primary from secondary
        const merged: Record<string, any> = {};
        const fieldsToMerge = ['email', 'phone', 'company', 'nationality', 'address', 'notes', 'vipLevel'];

        for (const field of fieldsToMerge) {
            if (!primary[field] && secondary[field]) {
                merged[field] = secondary[field];
            }
        }

        // Merge tags (union)
        if (secondary.tags && Array.isArray(secondary.tags)) {
            merged.tags = FieldValue.arrayUnion(...secondary.tags);
        }

        // Add merge note
        const mergeNote = `[Fusionné] ${secondary.firstName || ''} ${secondary.lastName || ''} (${secondaryId.slice(0, 6)}) le ${new Date().toLocaleDateString('fr-FR')}`;
        merged.notes = primary.notes
            ? `${primary.notes}\n${mergeNote}`
            : mergeNote;

        merged.updatedAt = new Date();

        // Update primary with merged data
        await tenantRef.collection('contacts').doc(primaryId).update(merged);

        // Update references in trips
        const primaryName = `${primary.firstName || ''} ${primary.lastName || ''}`.trim();
        const secondaryName = `${secondary.firstName || ''} ${secondary.lastName || ''}`.trim();

        if (secondaryName) {
            const tripsRef = tenantRef.collection('trips');
            const tripsByClient = await tripsRef.where('clientName', '==', secondaryName).get();
            const batch = adminDb.batch();
            tripsByClient.docs.forEach(d => {
                batch.update(d.ref, { clientName: primaryName, contactId: primaryId });
            });

            // Update invoices
            const invoicesRef = tenantRef.collection('invoices');
            const invoicesByClient = await invoicesRef.where('clientName', '==', secondaryName).get();
            invoicesByClient.docs.forEach(d => {
                batch.update(d.ref, { clientName: primaryName });
            });

            // Update quotes
            const quotesRef = tenantRef.collection('quotes');
            const quotesByClient = await quotesRef.where('clientName', '==', secondaryName).get();
            quotesByClient.docs.forEach(d => {
                batch.update(d.ref, { clientName: primaryName });
            });

            await batch.commit();
        }

        // Delete secondary contact
        await tenantRef.collection('contacts').doc(secondaryId).delete();

        return NextResponse.json({
            success: true,
            message: `Contact ${secondaryName} fusionné dans ${primaryName}`,
            mergedFields: Object.keys(merged).filter(k => k !== 'updatedAt' && k !== 'notes'),
            updatedReferences: {
                trips: secondaryName ? 'checked' : 'skipped',
            },
        });
    } catch (error: any) {
        console.error('[Merge Contacts] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
