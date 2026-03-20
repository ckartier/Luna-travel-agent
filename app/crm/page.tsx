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

export default function CRMDashboard() {
    const { tenantId, userProfile } = useAuth();
    const at = useAutoTranslate();
    const { vertical, vt } = useVertical();
    const firstName = userProfile?.displayName?.split(' ')[0] || '';
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0, revenue: 0 });
    const [pendingActivities, setPendingActivities] = useState<CRMActivity[]>([]);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);

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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {vertical.dashboardWidgets.map((widget, i) => {
                        const data = kpiData[widget.dataKey];
                        const WidgetIcon = getIcon(widget.icon);
                        return (
                            <KPICard
                                key={widget.id}
                                title={vt(widget.title)}
                                value={data.value}
                                trend={data.trend}
                                icon={WidgetIcon}
                                variant={kpiVariants[i % kpiVariants.length]}
                            />
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                    {/* Main Chart — Minimalist Luxury */}
                    <div className="lg:col-span-2 glass-card-premium p-8 h-[450px] flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="text-lg font-medium text-luna-charcoal uppercase tracking-tighter">Performance Revenus</h3>
                            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-luna-charcoal transition-all"><MoreVertical size={18} /></button>
                        </div>
                        <div className="flex-1 w-full relative">
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 500, padding: '15px' }}
                                            labelStyle={{ color: '#0B1220', marginBottom: '4px' }}
                                            itemStyle={{ color: '#2E2E2E' }}
                                            formatter={(v: any) => [`${Number(v).toLocaleString()}€`, 'Revenus']}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="revenue" fill="#5a8fa3" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p className="text-label-sharp opacity-40 italic">Aucune donnée historique disponible</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Task List — Concierge Daily Feed */}
                    <div className="glass-card-premium p-8 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="text-lg font-medium text-luna-charcoal uppercase tracking-tighter"><T>Conciergerie</T></h3>
                            <span className="text-[10px] font-medium bg-indigo-50/50 text-indigo-600 px-3 py-1 rounded-full">{pendingActivities.length}</span>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                            {pendingActivities.length === 0 ? (
                                <p className="text-label-sharp opacity-40 italic flex-1 flex items-center justify-center"><T>Conciergerie à jour</T></p>
                            ) : pendingActivities.map(activity => (
                                <div key={activity.id} className="p-4 rounded-3xl bg-gray-50/50 border border-gray-100/50 hover:bg-white transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${activity.type === 'urgent' ? 'bg-rose-500' : 'bg-indigo-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-luna-charcoal uppercase tracking-tight truncate">{activity.title}</h4>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, icon: Icon, variant }: any) {
    return (
        <div className="glass-card-premium p-6">
            <div className="flex justify-between items-start mb-6">
                <Icon size={20} className="text-gray-400" />
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-medium text-luna-charcoal tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
