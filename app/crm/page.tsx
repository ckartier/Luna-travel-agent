'use client';

import {
    TrendingUp, Users, Target, PlaneTakeoff, ArrowUpRight, MoreVertical, Calendar, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { getLeads, getContacts, getTrips, getActivities, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T, useAutoTranslate } from '@/src/components/T';

export default function CRMDashboard() {
    const { tenantId } = useAuth();
    const at = useAutoTranslate();
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0, revenue: 0 });
    const [pendingActivities, setPendingActivities] = useState<CRMActivity[]>([]);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);

    useEffect(() => {
        const fetchKPIs = async () => {
            if (!tenantId) return;
            try {
                const [leads, contacts, trips, activities] = await Promise.all([
                    getLeads(tenantId), getContacts(tenantId), getTrips(tenantId), getActivities(tenantId),
                ]);
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
                    MONTHS_SHORT.map(m => ({ name: m, revenue: monthMap[m] || 0 })).filter(d => d.revenue > 0)
                );
            } catch (error) {
                console.error("Failed to fetch KPIs", error);
            }
        };
        fetchKPIs();
    }, [tenantId]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-normal text-luna-charcoal tracking-tight"><T>Dashboard</T></h1>
                    <p className="text-gray-400 font-normal mt-1 text-sm"><T>Vue d'ensemble de vos performances et leads.</T></p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-emerald-50/80 text-emerald-600 text-xs font-normal px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <T>Sync Active</T>
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <KPICard title={at('Revenus Totaux')} value={`${(counts.revenue / 1000).toFixed(0)} k€`} trend="+14%" icon={TrendingUp} color="accent" />
                <KPICard title={at('Total Leads')} value={counts.leads.toString()} trend={`+${counts.leads}`} icon={Target} color="emerald" />
                <KPICard title={at('Clients Actifs')} value={counts.contacts.toString()} trend={`+${counts.contacts}`} icon={Users} color="charcoal" />
                <KPICard title={at('Voyages Actifs')} value={counts.activeTrips.toString()} trend={`${counts.activeTrips}`} icon={PlaneTakeoff} color="warm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                {/* Main Chart */}
                <div className="md:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-normal text-luna-charcoal text-lg"><T>Revenus par Mois</T></h3>
                        <button className="text-gray-300 hover:text-gray-500 transition-colors"><MoreVertical size={18} /></button>
                    </div>
                    <div className="flex-1 w-full relative">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#b8956a" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#b8956a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#b0a99f', fontSize: 12, fontWeight: 400 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#b0a99f', fontSize: 12, fontWeight: 400 }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontWeight: 500, backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}
                                        itemStyle={{ color: '#8b6f47' }}
                                        formatter={(v: any) => [`${Number(v).toLocaleString('fr-FR')}€`, 'Revenus']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#b8956a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p className="text-sm font-normal"><T>Ajoutez des voyages pour voir les revenus</T></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task List — real data from activities */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-normal text-luna-charcoal text-lg"><T>À faire</T></h3>
                        <span className="text-xs bg-amber-50/80 text-amber-500 px-2.5 py-1 rounded-full font-normal">{pendingActivities.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        {pendingActivities.length === 0 ? (
                            <p className="text-sm text-gray-400 font-normal italic flex-1 flex items-center justify-center"><T>Aucune tâche en attente 🎉</T></p>
                        ) : pendingActivities.map(activity => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-white/80 rounded-xl cursor-pointer transition-all group">
                                <div className={`w-2 h-2 rounded-full ${activity.type === 'urgent' ? 'bg-red-400' : activity.type === 'call' ? 'bg-luna-accent' : activity.type === 'email' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-normal text-gray-700 group-hover:text-luna-charcoal transition-colors truncate">{activity.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-normal">{activity.time}</span>
                                        {activity.contactName && (
                                            <span className="text-xs bg-sky-50/80 text-sky-500 px-1.5 py-0.5 rounded font-normal">{activity.contactName}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, icon: Icon, color }: any) {
    const colorMap: Record<string, string> = {
        accent: "bg-luna-accent/10 text-luna-accent-dark",
        emerald: "bg-emerald-50/80 text-emerald-500",
        charcoal: "bg-gray-100/80 text-gray-600",
        warm: "bg-amber-50/80 text-amber-600",
    };

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
                    <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50/60 px-2 py-0.5 rounded-full text-xs font-normal">
                    <ArrowUpRight size={12} /> {trend}
                </div>
            </div>
            <div>
                <p className="text-gray-400 font-normal text-xs mb-1">{title}</p>
                <h3 className="text-2xl font-normal text-luna-charcoal">{value}</h3>
            </div>
        </div>
    );
}
