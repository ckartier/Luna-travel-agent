export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/revolut/reconcile
 * Links a Revolut transaction to a CRM client/invoice.
 * Creates a CRMPayment record and updates invoice/trip status.
 * 
 * Body: {
 *   transactionId: string,
 *   amount: number,        // TTC
 *   currency: string,
 *   date: string,
 *   reference?: string,
 *   counterpartyName?: string,
 *   clientId?: string,
 *   invoiceId?: string,
 *   type: 'CLIENT' | 'SUPPLIER'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const {
      transactionId,
      amount,
      currency = 'EUR',
      date,
      reference,
      counterpartyName,
      clientId,
      invoiceId,
      type = 'CLIENT',
    } = body;

    if (!transactionId || !amount) {
      return NextResponse.json({ error: 'transactionId et amount requis' }, { status: 400 });
    }

    if (!clientId && !invoiceId) {
      return NextResponse.json({ error: 'clientId ou invoiceId requis' }, { status: 400 });
    }

    const tid = auth.tenantId;
    const now = Timestamp.now();

    // HT / TTC calculation (TVA 20%)
    const TVA_RATE = 20;
    const amountTTC = amount;
    const amountHT = Math.round((amountTTC / (1 + TVA_RATE / 100)) * 100) / 100;

    // 1. Create CRM Payment
    const paymentData: Record<string, any> = {
      invoiceId: invoiceId || '',
      clientId: clientId || '',
      amount: amountTTC,
      amountHT,
      tvaRate: TVA_RATE,
      amountTTC,
      currency,
      method: 'REVOLUT',
      paymentDate: date || new Date().toISOString().split('T')[0],
      referenceId: reference || '',
      revolutTransactionId: transactionId,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };

    const paymentRef = await adminDb
      .collection('tenants').doc(tid)
      .collection('payments')
      .add(paymentData);

    // 2. Update Invoice (if linked)
    if (invoiceId) {
      const invoiceRef = adminDb.collection('tenants').doc(tid).collection('invoices').doc(invoiceId);
      const invoiceSnap = await invoiceRef.get();

      if (invoiceSnap.exists) {
        const inv = invoiceSnap.data()!;
        const currentPaid = (inv.amountPaid || 0) + amountTTC;
        const totalAmount = inv.totalAmount || 0;

        let newStatus = inv.status;
        if (currentPaid >= totalAmount) {
          newStatus = 'PAID';
        } else if (currentPaid > 0) {
          newStatus = 'PARTIAL';
        }

        await invoiceRef.update({
          amountPaid: currentPaid,
          status: newStatus,
          updatedAt: now,
        });

        // 3. Update Trip payment status (if invoice has a tripId)
        if (inv.tripId) {
          const tripRef = adminDb.collection('tenants').doc(tid).collection('trips').doc(inv.tripId);
          const tripSnap = await tripRef.get();

          if (tripSnap.exists) {
            let tripPaymentStatus = 'DEPOSIT';
            if (currentPaid >= totalAmount) {
              tripPaymentStatus = 'PAID';
            }

            await tripRef.update({
              paymentStatus: tripPaymentStatus,
              updatedAt: now,
            });
          }
        }
      }
    }

    console.log(`[revolut/reconcile] Transaction ${transactionId} → Payment ${paymentRef.id}, Invoice: ${invoiceId || 'none'}, Client: ${clientId || 'none'}`);

    return NextResponse.json({
      success: true,
      paymentId: paymentRef.id,
      amountHT,
      amountTTC,
      message: 'Rapprochement effectué',
    });

  } catch (error: any) {
    console.error('[revolut/reconcile] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
