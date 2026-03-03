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
                setCounts({
                    leads: leads.length,
                    contacts: contacts.length,
                    activeTrips
                });
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 font-medium mt-1">Vue d'ensemble de vos performances et leads LUNA.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LUNA Sync Active
                    </span>
                    <button className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all">
                        + Nouveau Deal Manuel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
                <KPICard title="Revenus Générés" value="124 500 €" trend="+14%" icon={TrendingUp} color="blue" />
                <KPICard title="Total Leads (Demandes)" value={counts.leads.toString()} trend="+6" icon={Target} color="emerald" />
                <KPICard title="Clients Actifs" value={counts.contacts.toString()} trend="+2%" icon={Users} color="purple" />
                <KPICard title="Demandes en cours" value={counts.activeTrips.toString()} trend="+1" icon={PlaneTakeoff} color="amber" />
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
                {/* Main Chart */}
                <div className="col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Croissance des Revenus</h3>
                        <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task List / Recent Activity */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">À faire aujourd'hui</h3>
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
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                    <ArrowUpRight size={14} /> {trend}
                </div>
            </div>
            <div>
                <p className="text-gray-500 font-bold text-sm mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900">{value}</h3>
            </div>
        </div>
    );
}

function TaskItem({ title, time, type }: any) {
    return (
        <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
            <div className={`w-2 h-2 rounded-full ${type === 'urgent' ? 'bg-red-500' : type === 'call' ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h4>
                <span className="text-xs text-gray-400 font-medium">{time}</span>
            </div>
        </div>
    );
}
