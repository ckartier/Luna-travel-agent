export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/**
 * GET /api/hub/health
 * Returns health status for both CRM verticals (Travel + Legal)
 */
async function resolveTenantIdFromRequest(request: NextRequest): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    // Authenticated calls: use caller tenant.
    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    // Optional explicit tenant for non-auth calls.
    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    // Backward-compatible fallback only when exactly one tenant exists.
    const tenantsSnap = await adminDb.collection('tenants').limit(2).get();
    if (tenantsSnap.size === 1) return tenantsSnap.docs[0].id;
    return null;
}

async function fetchBugReportsForTenant(tenantId: string) {
    const tenantBugRef = adminDb.collection('tenants').doc(tenantId).collection('bug_reports');
    try {
        const tenantSnap = await tenantBugRef.orderBy('createdAt', 'desc').limit(50).get();
        return tenantSnap;
    } catch {
        return tenantBugRef.limit(50).get();
    }
}

export async function GET(request: NextRequest) {
    try {
        const resolvedTenant = await resolveTenantIdFromRequest(request);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) {
            return NextResponse.json({
                overall: { status: 'error', score: 0, totalBugs: 0, openBugs: 0, criticalBugs: 0 },
                travel: { status: 'error', leads: 0, contacts: 0, activeTrips: 0, totalTrips: 0, revenue: 0 },
                legal: { status: 'error', leads: 0, contacts: 0, activeDossiers: 0, totalDossiers: 0, revenue: 0 },
                bugReports: [],
                error: 'No tenant found',
            }, { status: 404 });
        }
        const tenantId = resolvedTenant;
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        const now = new Date();

        // Fetch tenant-scoped CRM data in parallel.
        const [
            leadsSnap,
            contactsSnap,
            tripsSnap,
            bugReportsSnap,
        ] = await Promise.all([
            tenantRef.collection('leads').limit(500).get(),
            tenantRef.collection('contacts').limit(500).get(),
            tenantRef.collection('trips').limit(500).get(),
            fetchBugReportsForTenant(tenantId),
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
