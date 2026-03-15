import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/dashboard
 * 
 * Single endpoint returning all dashboard data in one call.
 * KPIs, recent activity, upcoming reminders, revenue trends, alerts.
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

        // Parallel queries for max speed
        const [contactsSnap, tripsSnap, quotesSnap, invoicesSnap, leadsSnap, remindersSnap, activitySnap] = await Promise.all([
            tenantRef.collection('contacts').get(),
            tenantRef.collection('trips').get(),
            tenantRef.collection('quotes').get(),
            tenantRef.collection('invoices').get(),
            tenantRef.collection('leads').get(),
            tenantRef.collection('reminders').where('completed', '==', false).orderBy('dueDate', 'asc').limit(5).get(),
            tenantRef.collection('activity_log').orderBy('timestamp', 'desc').limit(10).get(),
        ]);

        // KPIs
        const invoices = invoicesSnap.docs.map(d => d.data());
        const revenue = invoices.filter(i => i.status !== 'CANCELLED').reduce((s, i) => s + (i.totalAmount || 0), 0);
        const paidRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
        const activeTrips = tripsSnap.docs.filter(d => {
            const s = d.data().status;
            return s && s !== 'COMPLETED' && s !== 'CANCELLED';
        }).length;

        // This month's stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const inMonth = (d: any) => {
            const ts = d.createdAt?.toDate?.() || new Date(0);
            return ts >= monthStart;
        };
        const monthTrips = tripsSnap.docs.filter(d => inMonth(d.data())).length;
        const monthQuotes = quotesSnap.docs.filter(d => inMonth(d.data())).length;
        const monthInvoices = invoicesSnap.docs.filter(d => inMonth(d.data())).length;

        // Pipeline
        const wonLeads = leadsSnap.docs.filter(d => d.data().status === 'WON').length;
        const conversionRate = leadsSnap.size > 0 ? Math.round((wonLeads / leadsSnap.size) * 100) : 0;

        // Revenue trend (6 months)
        const monthlyRevenue: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const mRev = invoices
                .filter(inv => {
                    const ts = inv.createdAt?.toDate?.() || new Date(0);
                    return ts >= m && ts <= mEnd && inv.status !== 'CANCELLED';
                })
                .reduce((s, inv) => s + (inv.totalAmount || 0), 0);
            monthlyRevenue.push({
                month: m.toLocaleDateString('fr-FR', { month: 'short' }),
                revenue: mRev,
            });
        }

        // Upcoming reminders
        const reminders = remindersSnap.docs.map(d => ({
            id: d.id,
            title: d.data().title,
            dueDate: d.data().dueDate?.toDate?.()?.toISOString() || null,
            priority: d.data().priority || 'normal',
        }));

        // Recent activity
        const activity = activitySnap.docs.map(d => ({
            id: d.id,
            action: d.data().action,
            entityName: d.data().entityName,
            userName: d.data().userName || 'Système',
            timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
        }));

        // Alerts
        const alerts: { type: string; message: string; count: number }[] = [];
        const overdueInvoices = invoices.filter(i => i.status === 'SENT' && i.dueDate && new Date(i.dueDate) < now);
        if (overdueInvoices.length > 0) {
            alerts.push({ type: 'warning', message: 'Factures en retard', count: overdueInvoices.length });
        }
        const overdueReminders = remindersSnap.docs.filter(d => {
            const dd = d.data().dueDate?.toDate?.();
            return dd && dd < now;
        });
        if (overdueReminders.length > 0) {
            alerts.push({ type: 'info', message: 'Rappels en retard', count: overdueReminders.length });
        }

        return NextResponse.json({
            kpis: {
                totalContacts: contactsSnap.size,
                totalTrips: tripsSnap.size,
                activeTrips,
                totalRevenue: revenue,
                paidRevenue,
                outstandingRevenue: revenue - paidRevenue,
                conversionRate,
                totalLeads: leadsSnap.size,
            },
            thisMonth: { trips: monthTrips, quotes: monthQuotes, invoices: monthInvoices },
            monthlyRevenue,
            reminders,
            activity,
            alerts,
        });
    } catch (error: any) {
        console.error('[Dashboard] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
