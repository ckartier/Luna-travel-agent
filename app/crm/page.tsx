'use client';

import {
    TrendingUp,
    Users,
    Target,
    PlaneTakeoff,
    ArrowUpRight,
    MoreVertical
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Fév', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Avr', revenue: 2780 },
    { name: 'Mai', revenue: 1890 },
    { name: 'Juin', revenue: 2390 },
    { name: 'Juil', revenue: 3490 },
];

import { useState, useEffect } from 'react';
import { getLeads, getContacts } from '@/src/lib/firebase/crm';

export default function CRMDashboard() {
    const [counts, setCounts] = useState({ leads: 0, contacts: 0, activeTrips: 0 });

    useEffect(() => {
        const fetchKPIs = async () => {
            try {
                const [leads, contacts] = await Promise.all([getLeads(), getContacts()]);
                const activeTrips = leads.filter(l => l.status === 'WON' || l.status === 'PROPOSAL_READY').length;
                setCounts({ leads: leads.length, contacts: contacts.length, activeTrips });
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
                    <button className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all text-sm">
                        + Nouveau Deal
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
                <KPICard title="Revenus Générés" value="124 500 €" trend="+14%" icon={TrendingUp} color="accent" />
                <KPICard title="Total Leads" value={counts.leads.toString()} trend="+6" icon={Target} color="emerald" />
                <KPICard title="Clients Actifs" value={counts.contacts.toString()} trend="+2%" icon={Users} color="charcoal" />
                <KPICard title="Demandes en cours" value={counts.activeTrips.toString()} trend="+1" icon={PlaneTakeoff} color="warm" />
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
                {/* Main Chart */}
                <div className="col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-luna-warm-gray/20 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-semibold text-luna-charcoal text-lg">Croissance des Revenus</h3>
                        <button className="text-luna-text-muted hover:text-luna-charcoal"><MoreVertical size={20} /></button>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#b8956a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-luna-warm-gray/20 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-semibold text-luna-charcoal text-lg">À faire aujourd'hui</h3>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <TaskItem title="Envoyer Devis Maurice" time="10:00" type="urgent" />
                        <TaskItem title="Appel Client M. Dupont" time="14:30" type="call" />
                        <TaskItem title="Vérifier Booking Lux*" time="16:00" type="normal" />
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

function TaskItem({ title, time, type }: any) {
    return (
        <div className="flex items-center gap-4 p-3 hover:bg-luna-cream rounded-xl cursor-pointer transition-colors group">
            <div className={`w-2 h-2 rounded-full ${type === 'urgent' ? 'bg-red-500' : type === 'call' ? 'bg-luna-accent' : 'bg-luna-warm-gray'}`} />
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-luna-charcoal group-hover:text-luna-accent-dark transition-colors">{title}</h4>
                <span className="text-xs text-luna-text-muted font-medium">{time}</span>
            </div>
        </div>
    );
}
