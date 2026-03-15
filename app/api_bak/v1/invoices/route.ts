import { NextRequest } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAPIKey, apiSuccess, apiError, apiHeaders, parsePagination } from '@/src/lib/apiKeyAuth';

/**
 * GET /api/v1/invoices — List invoices
 * POST /api/v1/invoices — Create invoice
 */

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: apiHeaders() });
}

export async function GET(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    const { limit, offset } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // DRAFT | SENT | PAID | OVERDUE

    try {
        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);
        const snap = await tenantRef.collection('invoices').orderBy('createdAt', 'desc').limit(limit).offset(offset).get();

        let invoices = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                invoiceNumber: data.invoiceNumber,
                clientName: data.clientName,
                items: data.items,
                subtotal: data.subtotal,
                taxTotal: data.taxTotal,
                totalAmount: data.totalAmount,
                currency: data.currency,
                status: data.status,
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                paidAt: data.paidAt,
                createdAt: data.createdAt,
            };
        });

        if (status) invoices = invoices.filter(i => i.status === status);

        return apiSuccess({ invoices, total: invoices.length, limit, offset });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const body = await req.json();
        const { clientName, items, currency, dueDays, quoteId } = body;

        if (!clientName) return apiError('clientName is required');
        if (!items || !Array.isArray(items) || items.length === 0) return apiError('items array is required');

        const subtotal = items.reduce((s: number, i: any) => s + (i.unitPrice || 0) * (i.quantity || 1), 0);
        const taxTotal = items.reduce((s: number, i: any) => {
            const lineTotal = (i.unitPrice || 0) * (i.quantity || 1);
            return s + lineTotal * ((i.taxRate || 0) / 100);
        }, 0);
        const totalAmount = subtotal + taxTotal;

        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (dueDays || 30));

        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);

        // Generate invoice number
        const countSnap = await tenantRef.collection('invoices').count().get();
        const invoiceNumber = `FAC-${String(countSnap.data().count + 1).padStart(4, '0')}`;

        const docRef = await tenantRef.collection('invoices').add({
            invoiceNumber,
            clientName,
            items: items.map((i: any) => ({
                description: i.description || '',
                quantity: i.quantity || 1,
                unitPrice: i.unitPrice || 0,
                total: (i.unitPrice || 0) * (i.quantity || 1),
                taxRate: i.taxRate || 0,
            })),
            subtotal,
            taxTotal,
            totalAmount,
            currency: currency || 'EUR',
            status: 'DRAFT',
            issueDate: now.toISOString(),
            dueDate: dueDate.toISOString(),
            quoteId: quoteId || null,
            source: 'api',
            createdAt: now,
            updatedAt: now,
        });

        return apiSuccess({ id: docRef.id, invoiceNumber, totalAmount, currency: currency || 'EUR' }, 201);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
