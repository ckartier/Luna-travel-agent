'use client';

import {
    TrendingUp, Users, Target, PlaneTakeoff, ArrowUpRight, MoreVertical, Calendar, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { getLeads, getContacts, getTrips, getActivities, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';

export default function CRMDashboard() {
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0, revenue: 0 });
    const [pendingActivities, setPendingActivities] = useState<CRMActivity[]>([]);
    const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([]);

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const [leads, contacts, trips, activities] = await Promise.all([
                    getLeads(), getContacts(), getTrips(), getActivities(),
                ]);
                const activeTrips = trips.filter(t => t.status === 'CONFIRMED' || t.status === 'PAID' || t.status === 'IN_PROGRESS').length;
                const revenue = trips.reduce((sum, t) => sum + (t.amount || 0), 0);
                setCounts({ leads: leads.length, contacts: contacts.length, activeTrips, revenue });

                // Pending activities — treat as "À faire"
                const pending = activities.filter(a => a.status === 'PENDING').slice(0, 5);
                setPendingActivities(pending);

                // Revenue by month from trips
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
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-semibold text-luna-charcoal tracking-tight">Dashboard</h1>
                    <p className="text-luna-text-muted font-normal mt-1">Vue d'ensemble de vos performances et leads.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-emerald-50 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sync Active
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <KPICard title="Revenus Totaux" value={`${(counts.revenue / 1000).toFixed(0)} k€`} trend="+14%" icon={TrendingUp} color="accent" />
                <KPICard title="Total Leads" value={counts.leads.toString()} trend={`+${counts.leads}`} icon={Target} color="emerald" />
                <KPICard title="Clients Actifs" value={counts.contacts.toString()} trend={`+${counts.contacts}`} icon={Users} color="charcoal" />
                <KPICard title="Voyages Actifs" value={counts.activeTrips.toString()} trend={`${counts.activeTrips}`} icon={PlaneTakeoff} color="warm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Main Chart */}
                <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-luna-warm-gray/20 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-semibold text-luna-charcoal text-lg">Revenus par Mois</h3>
                        <button className="text-luna-text-muted hover:text-luna-charcoal"><MoreVertical size={20} /></button>
                    </div>
                    <div className="flex-1 w-full relative">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#b8956a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#b8956a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e2da" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8a8680', fontSize: 12, fontWeight: 500 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8680', fontSize: 12, fontWeight: 500 }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e8e2da', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 600 }}
                                        itemStyle={{ color: '#8b6f47' }}
                                        formatter={(v: any) => [`${Number(v).toLocaleString('fr-FR')}€`, 'Revenus']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#b8956a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-luna-text-muted">
                                <p className="text-sm">Ajoutez des voyages pour voir les revenus</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task List — real data from activities */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-luna-warm-gray/20 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-semibold text-luna-charcoal text-lg">À faire</h3>
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">{pendingActivities.length}</span>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                        {pendingActivities.length === 0 ? (
                            <p className="text-sm text-luna-text-muted italic flex-1 flex items-center justify-center">Aucune tâche en attente 🎉</p>
                        ) : pendingActivities.map(activity => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-luna-cream rounded-xl cursor-pointer transition-colors group">
                                <div className={`w-2 h-2 rounded-full ${activity.type === 'urgent' ? 'bg-red-500' : activity.type === 'call' ? 'bg-luna-accent' : activity.type === 'email' ? 'bg-blue-500' : 'bg-luna-warm-gray'}`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-luna-charcoal group-hover:text-luna-accent-dark transition-colors truncate">{activity.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-luna-text-muted font-medium">{activity.time}</span>
                                        {activity.contactName && (
                                            <span className="text-[9px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded font-medium">{activity.contactName}</span>
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
        emerald: "bg-emerald-50 text-emerald-600",
        charcoal: "bg-luna-charcoal/5 text-luna-charcoal",
        warm: "bg-[#f0e6d8] text-luna-accent-dark",
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-luna-warm-gray/20 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
                    <Icon size={24} strokeWidth={1.8} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-semibold">
                    <ArrowUpRight size={14} /> {trend}
                </div>
            </div>
            <div>
                <p className="text-luna-text-muted font-medium text-sm mb-1">{title}</p>
                <h3 className="text-3xl font-serif font-semibold text-luna-charcoal">{value}</h3>
            </div>
        </div>
    );
}
