import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/cron/quote-expiry
 * 
 * Runs daily — finds quotes expiring in 3 days and notifies agents.
 * Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: any[] = [];

    try {
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            const quotesSnap = await tenantDoc.ref.collection('quotes').get();

            for (const quoteDoc of quotesSnap.docs) {
                const quote = quoteDoc.data();

                // Only check SENT quotes
                if (quote.status !== 'SENT') continue;

                const validUntil = new Date(quote.validUntil);
                if (isNaN(validUntil.getTime())) continue;

                const diffDays = Math.round((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 3 || diffDays === 1 || diffDays === 0) {
                    // Check dedup
                    const existing = await tenantDoc.ref
                        .collection('notifications')
                        .where('quoteId', '==', quoteDoc.id)
                        .where('type', '==', `QUOTE_EXPIRY_${diffDays}`)
                        .limit(1)
                        .get();

                    if (existing.empty) {
                        await tenantDoc.ref.collection('notifications').add({
                            quoteId: quoteDoc.id,
                            quoteNumber: quote.quoteNumber,
                            clientName: quote.clientName,
                            totalAmount: quote.totalAmount,
                            validUntil: quote.validUntil,
                            daysUntilExpiry: diffDays,
                            type: `QUOTE_EXPIRY_${diffDays}`,
                            message: diffDays === 0
                                ? `⚠️ Devis ${quote.quoteNumber} expire aujourd'hui !`
                                : `📋 Devis ${quote.quoteNumber} expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}.`,
                            read: false,
                            createdAt: now,
                        });

                        results.push({
                            tenant: tenantDoc.id,
                            quote: quote.quoteNumber,
                            daysUntilExpiry: diffDays,
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            ok: true,
            notificationsCreated: results.length,
            details: results,
            timestamp: now.toISOString(),
        });
    } catch (error: any) {
        console.error('[Cron Quote Expiry] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
