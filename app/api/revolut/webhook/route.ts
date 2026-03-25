export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/revolut/webhook
 * Receives Revolut webhook events (TransactionCreated, TransactionStateChanged).
 * Auto-reconciles by matching transaction reference to invoice numbers.
 * 
 * To register: POST https://b2b.revolut.com/api/1.0/webhook
 * Body: { "url": "https://your-domain.com/api/revolut/webhook" }
 * 
 * NOTE: In production, validate the webhook signature for security.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log(`[revolut/webhook] Event: ${event}`, JSON.stringify(data).substring(0, 200));

    // Only process completed transactions
    if (event !== 'TransactionCreated' && event !== 'TransactionStateChanged') {
      return NextResponse.json({ received: true });
    }

    // Only auto-reconcile completed incoming transactions
    if (data?.state !== 'completed') {
      return NextResponse.json({ received: true, skipped: 'not completed' });
    }

    const leg = data?.legs?.[0];
    if (!leg || leg.amount <= 0) {
      // Outgoing transaction — skip auto-reconciliation
      return NextResponse.json({ received: true, skipped: 'outgoing' });
    }

    const reference = data?.reference || '';
    const amount = Math.abs(leg.amount) / 100;
    const counterpartyName = leg.counterparty?.name || '';

    if (!reference) {
      return NextResponse.json({ received: true, skipped: 'no reference' });
    }

    // Try to find a matching invoice across all tenants
    // In production, this should be scoped to the tenant that registered the webhook
    const tenantsSnap = await adminDb.collection('tenants').get();

    for (const tenantDoc of tenantsSnap.docs) {
      const tid = tenantDoc.id;
      const settings = tenantDoc.data()?.settings;

      // Only process tenants with Revolut connected
      if (!settings?.bankApiKey || settings?.bankProvider !== 'revolut') continue;

      // Search for invoice matching the reference
      const invoicesSnap = await adminDb
        .collection('tenants').doc(tid)
        .collection('invoices')
        .where('invoiceNumber', '==', reference)
        .limit(1)
        .get();

      if (invoicesSnap.empty) {
        // Try ref starting with LUNA-
        const lunaRef = reference.replace(/^LUNA-/, '');
        const altSnap = await adminDb
          .collection('tenants').doc(tid)
          .collection('invoices')
          .where('invoiceNumber', '==', lunaRef)
          .limit(1)
          .get();
        
        if (altSnap.empty) continue;
      }

      const invoiceDoc = invoicesSnap.empty ? null : invoicesSnap.docs[0];
      if (!invoiceDoc) continue;

      const inv = invoiceDoc.data();
      const now = Timestamp.now();

      // Create auto-reconciled payment
      const TVA_RATE = 20;
      const amountTTC = amount;
      const amountHT = Math.round((amountTTC / (1 + TVA_RATE / 100)) * 100) / 100;

      await adminDb.collection('tenants').doc(tid).collection('payments').add({
        invoiceId: invoiceDoc.id,
        clientId: inv.clientId || '',
        amount: amountTTC,
        amountHT,
        tvaRate: TVA_RATE,
        amountTTC,
        currency: leg.currency || 'EUR',
        method: 'REVOLUT',
        paymentDate: data.completed_at || new Date().toISOString().split('T')[0],
        referenceId: reference,
        revolutTransactionId: data.id,
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
        autoReconciled: true, // Flag for auto-reconciled via webhook
      });

      // Update invoice
      const currentPaid = (inv.amountPaid || 0) + amountTTC;
      const totalAmount = inv.totalAmount || 0;
      const newStatus = currentPaid >= totalAmount ? 'PAID' : currentPaid > 0 ? 'PARTIAL' : inv.status;

      await invoiceDoc.ref.update({
        amountPaid: currentPaid,
        status: newStatus,
        updatedAt: now,
      });

      // Update trip if linked
      if (inv.tripId) {
        const tripRef = adminDb.collection('tenants').doc(tid).collection('trips').doc(inv.tripId);
        const tripSnap = await tripRef.get();
        if (tripSnap.exists) {
          await tripRef.update({
            paymentStatus: currentPaid >= totalAmount ? 'PAID' : 'DEPOSIT',
            updatedAt: now,
          });
        }
      }

      console.log(`[revolut/webhook] Auto-reconciled: ${reference} → Invoice ${invoiceDoc.id} (${amountTTC}€) for tenant ${tid}`);
      return NextResponse.json({ received: true, reconciled: true, invoiceId: invoiceDoc.id });
    }

    console.log(`[revolut/webhook] No matching invoice for reference: ${reference}`);
    return NextResponse.json({ received: true, reconciled: false });

  } catch (error: any) {
    console.error('[revolut/webhook] Error:', error);
    // Always return 200 to Revolut to prevent retries
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}
