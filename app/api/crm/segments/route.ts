export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/segments
 * 
 * Dynamic contact segmentation based on activity and profile.
 * Returns pre-built segments: VIP, inactive, high-value, new, etc.
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const [contactsSnap, tripsSnap, invoicesSnap] = await Promise.all([
            tenantRef.collection('contacts').get(),
            tenantRef.collection('trips').get(),
            tenantRef.collection('invoices').get(),
        ]);

        const contacts: any[] = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const trips = tripsSnap.docs.map(d => d.data());
        const invoices = invoicesSnap.docs.map(d => d.data());

        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Build client revenue map
        const clientRevenue: Record<string, number> = {};
        invoices.forEach(inv => {
            if (inv.status !== 'CANCELLED') {
                clientRevenue[inv.clientName || ''] = (clientRevenue[inv.clientName || ''] || 0) + (inv.totalAmount || 0);
            }
        });

        // Build client trip map
        const clientTrips: Record<string, number> = {};
        const clientLastTrip: Record<string, Date> = {};
        trips.forEach(t => {
            const name = t.clientName || '';
            clientTrips[name] = (clientTrips[name] || 0) + 1;
            const ts = t.createdAt?.toDate?.() || new Date(0);
            if (!clientLastTrip[name] || ts > clientLastTrip[name]) {
                clientLastTrip[name] = ts;
            }
        });

        const getName = (c: any) => `${c.firstName || ''} ${c.lastName || ''}`.trim();

        // Segments
        const vip = contacts.filter(c => c.vipLevel === 'Platinum' || c.vipLevel === 'Gold');
        const highValue = contacts.filter(c => (clientRevenue[getName(c)] || 0) >= 10000);
        const recurring = contacts.filter(c => (clientTrips[getName(c)] || 0) >= 2);
        const inactive = contacts.filter(c => {
            const last = clientLastTrip[getName(c)];
            return !last || last < threeMonthsAgo;
        });
        const newContacts = contacts.filter(c => {
            const ts = c.createdAt?.toDate?.() || new Date(0);
            return ts >= oneMonthAgo;
        });
        const noTrip = contacts.filter(c => !clientTrips[getName(c)]);

        const segments = [
            { id: 'vip', name: 'VIP (Gold & Platinum)', count: vip.length, contacts: vip.map(c => c.id), icon: '⭐' },
            { id: 'high-value', name: 'High Value (10k€+)', count: highValue.length, contacts: highValue.map(c => c.id), icon: '💎' },
            { id: 'recurring', name: 'Clients récurrents (2+ voyages)', count: recurring.length, contacts: recurring.map(c => c.id), icon: '🔄' },
            { id: 'inactive', name: 'Inactifs (3+ mois)', count: inactive.length, contacts: inactive.map(c => c.id), icon: '😴' },
            { id: 'new', name: 'Nouveaux (ce mois)', count: newContacts.length, contacts: newContacts.map(c => c.id), icon: '🆕' },
            { id: 'no-trip', name: 'Sans voyage', count: noTrip.length, contacts: noTrip.map(c => c.id), icon: '📋' },
        ];

        return NextResponse.json({
            segments,
            totalContacts: contacts.length,
        });
    } catch (error: any) {
        console.error('[Segments] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
