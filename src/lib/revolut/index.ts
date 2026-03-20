/**
 * Luna CRM — Revolut Business API Helper
 * 
 * Shared utilities for all Revolut API routes.
 * Handles token management, base URL resolution, and common API calls.
 */

import { adminDb } from '@/src/lib/firebase/admin';

// ═══ Types ═══
export interface RevolutTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix ms
  clientId?: string;
}

export interface RevolutAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  state: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevolutTransaction {
  id: string;
  type: string;
  state: string;
  created_at: string;
  completed_at?: string;
  reference?: string;
  legs: {
    leg_id: string;
    account_id: string;
    counterparty?: {
      account_id?: string;
      account_type?: string;
      name?: string;
    };
    amount: number;
    currency: string;
    description?: string;
    balance?: number;
  }[];
}

// ═══ Base URL ═══
export function getRevolutBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'sandbox'
    ? 'https://sandbox-b2b.revolut.com/api/1.0'
    : 'https://b2b.revolut.com/api/1.0';
}

// ═══ Token Management ═══

/** Read Revolut settings from Firestore tenant doc */
export async function getRevolutSettings(tenantId: string) {
  const snap = await adminDb.collection('tenants').doc(tenantId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    apiKey: data?.settings?.bankApiKey || '',
    provider: data?.settings?.bankProvider || '',
    env: (data?.settings?.bankEnv || 'sandbox') as 'sandbox' | 'production',
    accessToken: data?.settings?.revolutAccessToken || '',
    refreshToken: data?.settings?.revolutRefreshToken || '',
    expiresAt: data?.settings?.revolutExpiresAt || 0,
    clientId: data?.settings?.revolutClientId || '',
  };
}

/** Save Revolut tokens to Firestore */
export async function saveRevolutTokens(tenantId: string, tokens: Partial<RevolutTokens>) {
  const update: Record<string, any> = { updatedAt: new Date() };
  if (tokens.accessToken) update['settings.revolutAccessToken'] = tokens.accessToken;
  if (tokens.refreshToken) update['settings.revolutRefreshToken'] = tokens.refreshToken;
  if (tokens.expiresAt) update['settings.revolutExpiresAt'] = tokens.expiresAt;
  if (tokens.clientId) update['settings.revolutClientId'] = tokens.clientId;
  await adminDb.collection('tenants').doc(tenantId).update(update);
}

// ═══ API Call Helper ═══

/** Make an authenticated request to Revolut Business API */
export async function revolutFetch(
  tenantId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const settings = await getRevolutSettings(tenantId);
  if (!settings || !settings.apiKey) {
    throw new Error('Revolut not configured for this tenant');
  }

  const baseUrl = getRevolutBaseUrl(settings.env);
  const token = settings.apiKey; // Using API key as bearer token (simplified flow)

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
}
