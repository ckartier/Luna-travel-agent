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
        // Search all tenants for matching API key
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            try {
                const keysDoc = await tenantDoc.ref.collection('settings').doc('apiKeys').get();
                if (!keysDoc.exists) continue;

                const keys = keysDoc.data()?.keys || [];
                const matchingKey = keys.find((k: any) => k.key === apiKey && k.active !== false);

                if (matchingKey) {
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
export function apiHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
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
