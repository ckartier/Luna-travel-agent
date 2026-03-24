'use client';

import {
    TrendingUp, Users, Target, PlaneTakeoff, ArrowUpRight, MoreVertical, Calendar, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { getLeads, getContacts, getTrips, getActivities, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T, useAutoTranslate } from '@/src/components/T';
import { useVertical } from '@/src/contexts/VerticalContext';
import { getIcon } from '@/src/lib/utils/iconMap';
import { KPIGrid } from '@/src/components/crm/dashboard/KPIGrid';
import { RevenueChart } from '@/src/components/crm/dashboard/RevenueChart';
import { ActivityFeed } from '@/src/components/crm/dashboard/ActivityFeed';
import { GanttChart } from '@/src/components/crm/dashboard/GanttChart';

export default function CRMDashboard() {
    const { tenantId, userProfile } = useAuth();
    const at = useAutoTranslate();
    const { vertical, vt } = useVertical();
    const firstName = userProfile?.displayName?.split(' ')[0] || '';
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0, revenue: 0 });
    const [pendingActivities, setPendingActivities] = useState<CRMActivity[]>([]);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);
    const [tripsData, setTripsData] = useState<CRMTrip[]>([]);

    useEffect(() => {
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
                const revenue = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
                setCounts({ leads: leads.length, contacts: contacts.length, activeTrips, revenue });

                const pending = activities.filter(a => a.status === 'PENDING').slice(0, 5);
                setPendingActivities(pending);

                setTripsData(trips);

                const monthMap: Record<string, number> = {};
                const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                trips.forEach(t => {
                    const d = new Date(t.startDate);
                    const key = MONTHS_SHORT[d.getMonth()];
                    monthMap[key] = (monthMap[key] || 0) + (t.amount || 0);
                });
                setRevenueData(
                    MONTHS_SHORT.map(m => ({ name: m, revenue: monthMap[m] || 0 }))
                );
            } catch (error) {
                console.error("Failed to fetch KPIs", error);
            }
        };
        fetchKPIs();
    }, [tenantId, vertical]);

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
                <KPIGrid data={kpiData as any} kpiVariants={kpiVariants} />

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
            </div>
        </div>
    );
}
