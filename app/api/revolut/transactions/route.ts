import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';
import { revolutFetch } from '@/src/lib/revolut';

/**
 * GET /api/revolut/transactions
 * Returns Revolut transactions with optional filters.
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&count=50&type=transfer
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const count = searchParams.get('count') || '50';
    const type = searchParams.get('type');

    // Build query string
    const params = new URLSearchParams();
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to).toISOString());
    params.set('count', count);
    if (type) params.set('type', type);

    const res = await revolutFetch(auth.tenantId, `/transactions?${params.toString()}`);

    if (!res.ok) {
      const err = await res.text();
      console.error('[revolut/transactions] API error:', res.status, err);
      return NextResponse.json({ error: 'Erreur API Revolut', details: res.status }, { status: 502 });
    }

    const transactions = await res.json();

    // Normalize for frontend
    const normalized = transactions.map((tx: any) => {
      const leg = tx.legs?.[0] || {};
      const amount = Math.abs(leg.amount || 0) / 100; // cents → euros
      const isCredit = (leg.amount || 0) > 0;

      return {
        id: tx.id,
        date: tx.completed_at || tx.created_at,
        description: leg.description || tx.reference || 'Transaction',
        counterpartyName: leg.counterparty?.name || 'Inconnu',
        amount,
        currency: leg.currency || 'EUR',
        type: isCredit ? 'CREDIT' : 'DEBIT',
        reference: tx.reference || '',
        status: tx.state === 'completed' ? 'COMPLETED'
          : tx.state === 'pending' ? 'PENDING'
          : tx.state === 'declined' ? 'DECLINED'
          : tx.state === 'reverted' ? 'REVERTED'
          : tx.state?.toUpperCase() || 'PENDING',
        reconciled: false, // Will be enriched by the frontend
        revolutRawState: tx.state,
      };
    });

    return NextResponse.json({ success: true, transactions: normalized });

  } catch (error: any) {
    console.error('[revolut/transactions] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
