import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/crm/share-quote
 * Creates a shared quote document in Firestore and returns a public URL.
 * The shared quote can be viewed and accepted/rejected by the client.
 */
export async function POST(request: Request) {
    try {
        // Auth check
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;

        const body = await request.json();
        const {
            quoteId, quoteNumber, clientName, agencyName, agencyLogo,
            issueDate, validUntil, items, subtotal, taxTotal, totalAmount, currency
        } = body;

        if (!quoteId || !quoteNumber) {
            return NextResponse.json({ error: 'Missing quoteId or quoteNumber' }, { status: 400 });
        }

        // Get tenant ID
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        const tenantId = tenantsSnap.empty ? 'default' : tenantsSnap.docs[0].id;

        // Generate a unique share ID
        const shareId = crypto.randomBytes(16).toString('hex');

        // Create the shared quote document
        await adminDb.collection('sharedQuotes').doc(shareId).set({
            quoteId,
            tenantId,
            quoteNumber,
            clientName,
            agencyName: agencyName || 'Conciergerie',
            agencyLogo: agencyLogo || '',
            issueDate,
            validUntil,
            items,
            subtotal,
            taxTotal,
            totalAmount,
            currency: currency || 'EUR',
            status: 'SENT',
            createdAt: FieldValue.serverTimestamp(),
        });

        // Build the share URL based on the request origin
        const origin = request.headers.get('origin')
            || request.headers.get('referer')?.replace(/\/crm.*$/, '')
            || 'http://localhost:3000';
        const shareUrl = `${origin}/quote/${shareId}`;

        return NextResponse.json({ shareId, shareUrl });
    } catch (err: any) {
        console.error('[ShareQuote] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
