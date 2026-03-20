import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';
import { revolutFetch } from '@/src/lib/revolut';

/**
 * GET /api/revolut/accounts
 * Returns all Revolut Business accounts with balances.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;

    const res = await revolutFetch(auth.tenantId, '/accounts');

    if (!res.ok) {
      const err = await res.text();
      console.error('[revolut/accounts] API error:', res.status, err);
      return NextResponse.json({ error: 'Erreur API Revolut', details: res.status }, { status: 502 });
    }

    const accounts = await res.json();

    // Normalize the response for the frontend
    const normalized = accounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name || `Compte ${acc.currency}`,
      currency: acc.currency,
      balance: acc.balance / 100, // Revolut returns amounts in cents
      state: acc.state,
      iban: acc.iban || '',
      createdAt: acc.created_at,
    }));

    return NextResponse.json({ success: true, accounts: normalized });

  } catch (error: any) {
    console.error('[revolut/accounts] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
