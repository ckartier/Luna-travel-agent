import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quote/[shareId] — Public endpoint, no auth required
 * Returns shared quote data for the client-facing validation page.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ shareId: string }> }
) {
    const { shareId } = await params;
    if (!shareId) {
        return NextResponse.json({ error: 'Missing shareId' }, { status: 400 });
    }

    try {
        const doc = await adminDb.collection('sharedQuotes').doc(shareId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const data = doc.data();
        return NextResponse.json({
            ...data,
            shareId,
        });
    } catch (err: any) {
        console.error('[SharedQuote API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/quote/[shareId] — Public endpoint, no auth required
 * Client accepts or requests modifications on a shared quote.
 * Body: { action: 'ACCEPT' | 'REQUEST_CHANGES', message?: string }
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ shareId: string }> }
) {
    const { shareId } = await params;
    if (!shareId) {
        return NextResponse.json({ error: 'Missing shareId' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { action, message } = body;

        if (!['ACCEPT', 'REQUEST_CHANGES'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const doc = await adminDb.collection('sharedQuotes').doc(shareId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        const data = doc.data()!;

        if (data.status === 'ACCEPTED') {
            return NextResponse.json({ error: 'Ce devis a déjà été accepté' }, { status: 400 });
        }

        const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'CHANGES_REQUESTED';

        // Update the shared quote
        await adminDb.collection('sharedQuotes').doc(shareId).update({
            status: newStatus,
            clientResponse: message || '',
            respondedAt: FieldValue.serverTimestamp(),
        });

        // Also update the real quote in the tenant's collection
        if (data.tenantId && data.quoteId) {
            try {
                await adminDb.collection('tenants').doc(data.tenantId).collection('quotes').doc(data.quoteId).update({
                    status: newStatus === 'ACCEPTED' ? 'ACCEPTED' : 'SENT',
                    clientMessage: message || '',
                    clientRespondedAt: FieldValue.serverTimestamp(),
                });

                // If accepted, auto-create invoice
                if (newStatus === 'ACCEPTED') {
                    const quoteDoc = await adminDb.collection('tenants').doc(data.tenantId).collection('quotes').doc(data.quoteId).get();
                    const quoteData = quoteDoc.data();
                    if (quoteData) {
                        await adminDb.collection('tenants').doc(data.tenantId).collection('invoices').add({
                            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                            quoteId: data.quoteId,
                            clientId: quoteData.clientId,
                            clientName: quoteData.clientName,
                            issueDate: new Date().toISOString().split('T')[0],
                            dueDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
                            items: quoteData.items,
                            subtotal: quoteData.subtotal,
                            taxTotal: quoteData.taxTotal,
                            totalAmount: quoteData.totalAmount,
                            currency: quoteData.currency || 'EUR',
                            status: 'SENT',
                            createdAt: FieldValue.serverTimestamp(),
                        });
                    }
                }
            } catch (e) {
                console.error('[SharedQuote] Failed to update tenant quote:', e);
            }
        }

        return NextResponse.json({ success: true, status: newStatus });
    } catch (err: any) {
        console.error('[SharedQuote API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
