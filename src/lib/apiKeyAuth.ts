import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

/**
 * API Key Authentication & Tenant Resolution
 * 
 * API keys are stored in Firestore: tenants/{tenantId}/settings/apiKeys
 * Format: { keys: [{ key: "lk_xxx", name: "My App", createdAt: ..., active: true }] }
 * 
 * Header: X-API-Key: lk_xxx
 */

export interface APIAuthResult {
    tenantId: string;
    keyName: string;
}

export async function verifyAPIKey(req: NextRequest): Promise<APIAuthResult | Response> {
    // Rate limit first
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Missing API key. Include X-API-Key header.' },
            { status: 401, headers: apiHeaders() }
        );
    }

    if (!apiKey.startsWith('lk_')) {
        return NextResponse.json(
            { error: 'Invalid API key format. Keys must start with "lk_".' },
            { status: 401, headers: apiHeaders() }
        );
    }

    try {
        // O(1) indexed lookup via api_keys_index collection
        // Document ID = SHA-256 hash of the key → { tenantId, keyName, active }
        const crypto = await import('crypto');
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const indexDoc = await adminDb.collection('api_keys_index').doc(keyHash).get();
        
        if (indexDoc.exists) {
            const data = indexDoc.data()!;
            if (data.active !== false) {
                return { tenantId: data.tenantId, keyName: data.keyName || 'API Key' };
            }
            return NextResponse.json(
                { error: 'API key is disabled.' },
                { status: 401, headers: apiHeaders() }
            );
        }

        // Fallback: legacy O(n) scan for keys not yet indexed
        // This ensures backward compatibility during migration
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            try {
                const keysDoc = await tenantDoc.ref.collection('settings').doc('apiKeys').get();
                if (!keysDoc.exists) continue;

                const keys = keysDoc.data()?.keys || [];
                const matchingKey = keys.find((k: any) => k.key === apiKey && k.active !== false);

                if (matchingKey) {
                    // Backfill index for next time (fire-and-forget)
                    adminDb.collection('api_keys_index').doc(keyHash).set({
                        tenantId: tenantDoc.id,
                        keyName: matchingKey.name || 'API Key',
                        active: true,
                        indexedAt: new Date().toISOString(),
                    }).catch(() => {}); // Best-effort
                    
                    return {
                        tenantId: tenantDoc.id,
                        keyName: matchingKey.name || 'API Key',
                    };
                }
            } catch {
                continue;
            }
        }

        return NextResponse.json(
            { error: 'Invalid API key.' },
            { status: 401, headers: apiHeaders() }
        );
    } catch (error) {
        console.error('[API Auth] Error:', error);
        return NextResponse.json(
            { error: 'Internal authentication error.' },
            { status: 500, headers: apiHeaders() }
        );
    }
}

/**
 * Standard API response headers (CORS + JSON)
 */
export function apiHeaders(reqOrigin?: string | null): Record<string, string> {
    // Restrict CORS to known origins only (prevents cross-origin API key abuse)
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
    
    // Always allow same-origin and localhost in dev
    const defaultOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
        'https://luna-travel.com',
    ].filter(Boolean) as string[];
    
    const allAllowed = [...new Set([...defaultOrigins, ...allowedOrigins])];
    const origin = reqOrigin && allAllowed.some(o => reqOrigin.startsWith(o)) ? reqOrigin : allAllowed[0] || '';

    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Vary': 'Origin',
    };
}

/**
 * Standard success response
 */
export function apiSuccess(data: any, status = 200): Response {
    return NextResponse.json({ data }, { status, headers: apiHeaders() });
}

/**
 * Standard error response
 */
export function apiError(message: string, status = 400): Response {
    return NextResponse.json({ error: message }, { status, headers: apiHeaders() });
}

/**
 * Parse pagination params from URL
 */
export function parsePagination(req: NextRequest): { limit: number; offset: number } {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    return { limit: Math.max(1, limit), offset: Math.max(0, offset) };
}
