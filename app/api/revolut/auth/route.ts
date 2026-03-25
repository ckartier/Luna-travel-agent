export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';
import { getRevolutSettings, saveRevolutTokens, getRevolutBaseUrl } from '@/src/lib/revolut';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * POST /api/revolut/auth
 * Save Revolut API credentials + test the connection.
 * Body: { apiKey, env: 'sandbox' | 'production' }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;

    const { apiKey, env = 'sandbox' } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key requise' }, { status: 400 });
    }

    // Test the connection by calling /accounts
    const baseUrl = getRevolutBaseUrl(env);
    const testRes = await fetch(`${baseUrl}/accounts`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testRes.ok) {
      const err = await testRes.text();
      console.error('[revolut/auth] Connection test failed:', err);
      return NextResponse.json({
        error: 'Connexion échouée — vérifiez votre clé API',
        details: testRes.status,
      }, { status: 400 });
    }

    const accounts = await testRes.json();

    // Save to Firestore
    await adminDb.collection('tenants').doc(auth.tenantId).update({
      'settings.bankApiKey': apiKey,
      'settings.bankProvider': 'revolut',
      'settings.bankEnv': env,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Connexion Revolut réussie',
      accountCount: accounts.length,
    });

  } catch (error: any) {
    console.error('[revolut/auth] Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}

/**
 * DELETE /api/revolut/auth
 * Disconnect Revolut — remove credentials from Firestore.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;

    await adminDb.collection('tenants').doc(auth.tenantId).update({
      'settings.bankApiKey': '',
      'settings.bankProvider': '',
      'settings.bankEnv': 'sandbox',
      'settings.revolutAccessToken': '',
      'settings.revolutRefreshToken': '',
      'settings.revolutExpiresAt': 0,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Revolut déconnecté' });
  } catch (error: any) {
    console.error('[revolut/auth] Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
