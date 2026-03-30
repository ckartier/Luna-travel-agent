'use client';

import {
    useState, useEffect, useMemo
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getLeads, getContacts, getTrips, getActivities, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { KPIGrid } from '@/src/components/crm/dashboard/KPIGrid';
import { RevenueChart } from '@/src/components/crm/dashboard/RevenueChart';
import { ActivityFeed } from '@/src/components/crm/dashboard/ActivityFeed';
import { GanttChart } from '@/src/components/crm/dashboard/GanttChart';
import { computePrestationScoresFromTrips } from '@/src/lib/analytics/prestationScores';

function toSafeNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^\d.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function toMonthIndex(value: unknown): number | null {
    const date = value instanceof Date ? value : new Date(String(value || ''));
    if (Number.isNaN(date.getTime())) return null;
    const month = date.getMonth();
    return month >= 0 && month <= 11 ? month : null;
}

export default function CRMDashboard() {
    const { tenantId, userProfile } = useAuth();
    const { vertical, vt } = useVertical();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const router = useRouter();
    const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
    const firstName = userProfile?.displayName?.split(' ')[0] || '';
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0, revenue: 0 });
    const [pendingActivities, setPendingActivities] = useState<CRMActivity[]>([]);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
    const [tripsData, setTripsData] = useState<CRMTrip[]>([]);

    const prestationScores = useMemo(
        () =>
            computePrestationScoresFromTrips(
                tripsData.map((trip) => {
                    const raw = trip as unknown as Record<string, unknown>;
                    return {
                        amount: trip.amount,
                        totalClientPrice: trip.totalClientPrice,
                        commissionAmount: trip.commissionAmount,
                        selectedItems: raw.selectedItems,
                    };
                })
            ),
        [tripsData]
    );

    const topPrestation = prestationScores[0] || null;

    // Keep `/crm` as a compatibility entrypoint only.
    // Redirect users to dedicated CRM routes to avoid cross-vertical confusion.
    useEffect(() => {
        if (pathname !== '/crm') return;

        const queryVertical = searchParams?.get('vertical');
        const target =
            queryVertical === 'legal' || vertical.id === 'legal'
                ? '/crm/legal'
                : queryVertical === 'monum' || vertical.id === 'monum'
                    ? '/crm/monum'
                    : '/crm/travel';

        router.replace(target);
    }, [pathname, router, searchParams, vertical.id]);

    useEffect(() => {
        if (vertical?.id === 'monum') {
            window.location.replace(`${monumAppUrl}/app`);
            return;
        }

        const fetchKPIs = async () => {
            if (!tenantId) return;
            const isLegal = vertical?.id === 'legal';
            const currentVertical = isLegal ? 'legal' : 'travel';
            try {
                const [allLeads, contacts, allTrips, activities] = await Promise.all([
                    getLeads(tenantId), getContacts(tenantId), getTrips(tenantId), getActivities(tenantId),
                ]);
                const leads = allLeads.filter(l => (l.vertical || 'travel') === currentVertical);
                const trips = allTrips.filter(t => (t.vertical || 'travel') === currentVertical);
                const activeTrips = trips.filter(t => t.status === 'CONFIRMED' || t.status === 'PROPOSAL' || t.status === 'IN_PROGRESS').length;
                const revenue = trips.reduce((sum, t) => sum + toSafeNumber(t.amount), 0);
                setCounts({ leads: leads.length, contacts: contacts.length, activeTrips, revenue });

                const pending = activities.filter(a => a.status === 'PENDING').slice(0, 5);
                setPendingActivities(pending);

                setTripsData(trips);

                const monthMap: Record<string, number> = {};
                const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                trips.forEach(t => {
                    const monthIdx = toMonthIndex(t.startDate);
                    if (monthIdx === null) return;
                    const key = MONTHS_SHORT[monthIdx];
                    monthMap[key] = (monthMap[key] || 0) + toSafeNumber(t.amount);
                });
                setRevenueData(
                    MONTHS_SHORT.map(m => ({ name: m, revenue: monthMap[m] || 0 }))
                );
            } catch (error) {
                console.error("Failed to fetch KPIs", error);
            }
        };
        fetchKPIs();
    }, [tenantId, vertical, monumAppUrl]);

    if (pathname === '/crm') {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    if (vertical?.id === 'monum') {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    // ═══ VERTICAL-DRIVEN KPI DATA ═══
    const kpiData: Record<string, { value: string; trend: string }> = {
        revenue: { value: `${(counts.revenue / 1000).toFixed(0)} k€`, trend: '+14% Month' },
        leads: { value: counts.leads.toString(), trend: `+${counts.leads} New` },
        contacts: { value: counts.contacts.toString(), trend: 'Active Portfolio' },
        activeTrips: { value: counts.activeTrips.toString(), trend: 'Sync Luna' },
    };
    const kpiVariants = ['hotel', 'activity', 'other', 'transfer'];

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Bonjour{firstName ? ` ${firstName}` : ''}</h1>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            <p className="text-label-sharp opacity-60">{vertical.branding.appName} • Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards — Vertical-driven */}
                <KPIGrid data={kpiData} kpiVariants={kpiVariants} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                    {/* Modularized Main Chart — Gantt for Monum, Revenue for others */}
                    {vertical.id === 'monum' ? (
                        <GanttChart trips={tripsData} title={vt('Planning Chantiers')} />
                    ) : (
                        <RevenueChart data={revenueData} title={vt('Revenus Totaux')} />
                    )}

                    {/* Task List — Modularized */}
                    <ActivityFeed activities={pendingActivities} title="Conciergerie" />
                </div>

                <div className="glass-card-premium p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h3 className="text-lg font-medium text-luna-charcoal tracking-tight">
                            Score Prestations (Gain & Ventes)
                        </h3>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                            {prestationScores.length} prestation(s) suivie(s)
                        </span>
                    </div>

                    {prestationScores.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-400">
                            Aucune prestation vendue sur les trips actuels.
                        </p>
                    ) : (
                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-[#bcdeea]/40 bg-[#f5fbfd] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a8fa3]">
                                    Top prestation
                                </p>
                                <p className="mt-2 text-base font-medium text-luna-charcoal">
                                    {topPrestation?.name || 'Prestation'}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {topPrestation?.type || 'OTHER'}
                                </p>
                                <div className="mt-4 flex items-end gap-5">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Score</p>
                                        <p className="text-2xl font-semibold text-[#2c667b]">
                                            {topPrestation?.score || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Ventes</p>
                                        <p className="text-xl font-medium text-luna-charcoal">
                                            {topPrestation?.salesCount || 0}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-gray-600">
                                    Gain vente: {(topPrestation?.gainVente || 0).toLocaleString('fr-FR')} €
                                </p>
                            </div>

                            <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-4">
                                <div className="space-y-3">
                                    {prestationScores.slice(0, 5).map((item, index) => (
                                        <div key={item.key} className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-3 py-2.5">
                                            <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-500 inline-flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-luna-charcoal truncate">{item.name}</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {item.salesCount} vente(s) · gain {item.gainVente.toLocaleString('fr-FR')} €
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e7f4f8] text-[#2c667b]">
                                                {item.score}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
