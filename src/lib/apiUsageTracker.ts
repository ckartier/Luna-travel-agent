import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Track API usage per tenant per month.
 * Stored in: tenants/{tenantId}/apiUsage/{YYYY-MM}
 *
 * Each document has counters for each API:
 * {
 *   gemini: { count: 42, lastUsed: Timestamp },
 *   firecrawl: { count: 10, lastUsed: Timestamp },
 *   whatsapp: { count: 5, lastUsed: Timestamp },
 *   gmail: { count: 120, lastUsed: Timestamp },
 *   imageGen: { count: 3, lastUsed: Timestamp },
 *   mapbox: { count: 200, lastUsed: Timestamp },
 *   devisPdf: { count: 1, lastUsed: Timestamp },
 * }
 */

export type APIName = 'gemini' | 'firecrawl' | 'whatsapp' | 'gmail' | 'imageGen' | 'mapbox' | 'devisPdf';

// Cost per unit (€) - approximate
export const API_COSTS: Record<APIName, number> = {
    gemini: 0.015,       // ~0.015€ per request (blended)
    firecrawl: 0.04,     // ~0.04€ per scrape
    whatsapp: 0.05,      // ~0.05€ per message
    gmail: 0,            // Free (Google Workspace)
    imageGen: 0.04,      // ~0.04€ per image
    mapbox: 0,           // Free tier (50k/month)
    devisPdf: 0,         // Free (server-side)
};

// Monthly soft limits
export const API_LIMITS: Record<APIName, number> = {
    gemini: 1500,
    firecrawl: 500,
    whatsapp: 1000,
    gmail: 2000,
    imageGen: 200,
    mapbox: 50000,
    devisPdf: 100,
};

function getMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Increment the usage counter for an API.
 * Call this from any API route after a successful API call.
 */
export async function trackAPIUsage(tenantId: string, api: APIName, count: number = 1): Promise<void> {
    if (!tenantId) return;

    const monthKey = getMonthKey();
    const docRef = adminDb.collection('tenants').doc(tenantId).collection('apiUsage').doc(monthKey);

    try {
        await docRef.set({
            [api]: {
                count: FieldValue.increment(count),
                lastUsed: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        // Silent fail — don't break the actual API call
        console.error(`[API Tracker] Failed to track ${api}:`, err);
    }
}

/**
 * Get usage data for a tenant for the current month.
 */
export async function getAPIUsage(tenantId: string): Promise<Record<string, { count: number; lastUsed?: any }>> {
    if (!tenantId) return {};

    const monthKey = getMonthKey();
    const docRef = adminDb.collection('tenants').doc(tenantId).collection('apiUsage').doc(monthKey);

    try {
        const snap = await docRef.get();
        if (!snap.exists) return {};

        const data = snap.data() || {};
        const result: Record<string, { count: number; lastUsed?: any }> = {};

        for (const api of Object.keys(API_COSTS)) {
            if (data[api]) {
                result[api] = {
                    count: data[api].count || 0,
                    lastUsed: data[api].lastUsed || null,
                };
            } else {
                result[api] = { count: 0 };
            }
        }

        return result;
    } catch (err) {
        console.error('[API Tracker] Failed to read usage:', err);
        return {};
    }
}
