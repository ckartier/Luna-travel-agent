export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAdmin } from '@/src/lib/firebase/apiAuth';

// GET /api/admin/stats — platform statistics
export async function GET(request: Request) {
    const auth = await verifyAdmin(request);
    if (auth instanceof Response) return auth;
    try {
        const [usersSnap, subsSnap, leadsCountSnap, contactsCountSnap, tripsCountSnap] = await Promise.all([
            adminDb.collection('users').get(),
            adminDb.collection('subscriptions').get(),
            adminDb.collectionGroup('leads').count().get(),
            adminDb.collectionGroup('contacts').count().get(),
            adminDb.collectionGroup('trips').count().get(),
        ]);

        const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        const subscriptions = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalLeads = leadsCountSnap.data().count || 0;
        const totalContacts = contactsCountSnap.data().count || 0;
        const totalTrips = tripsCountSnap.data().count || 0;

        const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
        const mrr = activeSubscriptions.reduce((sum: number, s: any) => {
            const prices: Record<string, number> = { starter: 99, pro: 249, enterprise: 499 };
            return sum + (prices[s.planId] || 0);
        }, 0);

        return NextResponse.json({
            stats: {
                totalUsers: usersSnap.size,
                totalLeads,
                totalContacts,
                totalTrips,
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
