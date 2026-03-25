export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';

/**
 * POST /api/crm/migrate-invoices
 * Tags existing invoices with type: 'CLIENT' or 'SUPPLIER'
 * Matches invoices against the suppliers collection to determine type.
 */
export async function POST(request: Request) {
    try {
        const auth = await verifyAuthWithTenant(request);
        if (auth instanceof Response) return auth;

        const tenantId = auth.tenantId;

        // Get all suppliers
        const suppliersSnap = await adminDb.collection(`tenants/${tenantId}/suppliers`).get();
        const supplierNames = new Set<string>();
        const supplierIds = new Set<string>();
        suppliersSnap.docs.forEach(doc => {
            const data = doc.data();
            supplierNames.add((data.name || '').toUpperCase());
            if (data.contactName) supplierNames.add(data.contactName.toUpperCase());
            supplierIds.add(doc.id);
        });

        // Get all invoices without a type field
        const invoicesSnap = await adminDb.collection(`tenants/${tenantId}/invoices`).get();
        let clientCount = 0;
        let supplierCount = 0;
        let skipCount = 0;

        const batch = adminDb.batch();

        for (const doc of invoicesSnap.docs) {
            const data = doc.data();

            // Skip if already tagged
            if (data.type) {
                skipCount++;
                continue;
            }

            // Determine type based on:
            // 1. Invoice number starts with INV-P → likely supplier
            // 2. clientId matches a supplier ID → supplier
            // 3. clientName matches a supplier name → supplier
            // 4. notes mention "prestataire" or "fournisseur" → supplier
            const isSupplier =
                (data.invoiceNumber || '').startsWith('INV-P') &&
                (
                    supplierIds.has(data.clientId || '') ||
                    supplierNames.has((data.clientName || '').toUpperCase()) ||
                    (data.notes || '').toLowerCase().includes('prestation confirmée par') ||
                    (data.notes || '').toLowerCase().includes('fournisseur')
                );

            if (isSupplier) {
                batch.update(doc.ref, {
                    type: 'SUPPLIER',
                    supplierId: data.clientId,
                    supplierName: data.clientName,
                    updatedAt: new Date()
                });
                supplierCount++;
            } else {
                batch.update(doc.ref, {
                    type: 'CLIENT',
                    updatedAt: new Date()
                });
                clientCount++;
            }
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            migrated: { client: clientCount, supplier: supplierCount, skipped: skipCount },
            total: invoicesSnap.docs.length
        });
    } catch (e: any) {
        console.error('Migration error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
