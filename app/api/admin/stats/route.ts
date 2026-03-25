export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAdmin } from '@/src/lib/firebase/apiAuth';

// GET /api/admin/stats — platform statistics
export async function GET(request: Request) {
    const auth = await verifyAdmin(request);
    if (auth instanceof Response) return auth;
    try {
        const [usersSnap, leadsSnap, contactsSnap, tripsSnap, subsSnap] = await Promise.all([
            adminDb.collection('users').get(),
            adminDb.collection('leads').get(),
            adminDb.collection('contacts').get(),
            adminDb.collection('trips').get(),
            adminDb.collection('subscriptions').get(),
        ]);

        const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        const subscriptions = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
        const mrr = activeSubscriptions.reduce((sum: number, s: any) => {
            const prices: Record<string, number> = { starter: 99, pro: 249, enterprise: 499 };
            return sum + (prices[s.planId] || 0);
        }, 0);

        return NextResponse.json({
            stats: {
                totalUsers: usersSnap.size,
                totalLeads: leadsSnap.size,
                totalContacts: contactsSnap.size,
                totalTrips: tripsSnap.size,
                totalSubscriptions: subsSnap.size,
                activeSubscriptions: activeSubscriptions.length,
                mrr,
                arr: mrr * 12,
            },
            users,
            subscriptions,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
