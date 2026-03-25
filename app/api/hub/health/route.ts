export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/hub/health
 * Returns health status for both CRM verticals (Travel + Legal)
 */
export async function GET() {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Fetch data from Firebase in parallel for both verticals
        const [
            leadsSnap,
            contactsSnap,
            tripsSnap,
            bugReportsSnap,
        ] = await Promise.all([
            adminDb.collection('leads').limit(500).get(),
            adminDb.collection('contacts').limit(500).get(),
            adminDb.collection('trips').limit(500).get(),
            adminDb.collection('bug_reports').orderBy('createdAt', 'desc').limit(50).get(),
        ]);

        // Count by vertical
        const leads = leadsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        const contacts = contactsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        const trips = tripsSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        const travelLeads = leads.filter((l: any) => (l.vertical || 'travel') === 'travel');
        const legalLeads = leads.filter((l: any) => l.vertical === 'legal');

        const travelTrips = trips.filter((t: any) => (t.vertical || 'travel') === 'travel');
        const legalTrips = trips.filter((t: any) => t.vertical === 'legal');

        const travelActiveTrips = travelTrips.filter((t: any) => ['CONFIRMED', 'PROPOSAL', 'IN_PROGRESS'].includes(t.status));
        const legalActiveTrips = legalTrips.filter((t: any) => ['CONFIRMED', 'PROPOSAL', 'IN_PROGRESS'].includes(t.status));

        const travelRevenue = travelTrips.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const legalRevenue = legalTrips.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Bug reports
        const bugReports = bugReportsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
            };
        });

        const openBugs = bugReports.filter((b: any) => b.status === 'open');
        const criticalBugs = bugReports.filter((b: any) => b.severity === 'critical' && b.status === 'open');

        // Health score: 10 - (critical bugs * 2) - (open bugs * 0.3)
        const healthScore = Math.max(0, Math.min(10,
            10 - (criticalBugs.length * 2) - (openBugs.length * 0.3)
        ));

        const healthStatus = healthScore >= 8 ? 'healthy' : healthScore >= 5 ? 'degraded' : 'critical';

        const result = {
            overall: {
                status: healthStatus,
                score: Math.round(healthScore * 10) / 10,
                totalBugs: bugReports.length,
                openBugs: openBugs.length,
                criticalBugs: criticalBugs.length,
            },
            travel: {
                status: criticalBugs.length === 0 ? 'healthy' : 'degraded',
                leads: travelLeads.length,
                contacts: contacts.length,
                activeTrips: travelActiveTrips.length,
                totalTrips: travelTrips.length,
                revenue: travelRevenue,
            },
            legal: {
                status: 'healthy',
                leads: legalLeads.length,
                contacts: 0,
                activeDossiers: legalActiveTrips.length,
                totalDossiers: legalTrips.length,
                revenue: legalRevenue,
            },
            bugReports,
            timestamp: now.toISOString(),
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Hub Health] Error:', error);
        return NextResponse.json({
            overall: { status: 'error', score: 0 },
            travel: { status: 'error' },
            legal: { status: 'error' },
            bugReports: [],
            error: error.message,
        }, { status: 500 });
    }
}
