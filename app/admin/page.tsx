'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, Globe, BarChart3, TrendingUp, Activity, Layers, ArrowUpRight } from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalLeads: number;
    totalContacts: number;
    totalTrips: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    mrr: number;
    arr: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats').then(r => r.json()).then(data => {
            setStats(data.stats);
            setUsers(data.users || []);
            setSubscriptions(data.subscriptions || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-white/10 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    const KPIs = [
        { label: 'MRR', value: `${stats?.mrr || 0}€`, icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
        { label: 'ARR', value: `${stats?.arr || 0}€`, icon: BarChart3, color: 'from-violet-500 to-purple-600' },
        { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: Users, color: 'from-sky-500 to-blue-600' },
        { label: 'Abonnements actifs', value: stats?.activeSubscriptions || 0, icon: CreditCard, color: 'from-amber-500 to-orange-600' },
        { label: 'Leads', value: stats?.totalLeads || 0, icon: Activity, color: 'from-pink-500 to-rose-600' },
        { label: 'Contacts', value: stats?.totalContacts || 0, icon: Globe, color: 'from-cyan-500 to-teal-600' },
        { label: 'Trips', value: stats?.totalTrips || 0, icon: Layers, color: 'from-indigo-500 to-blue-700' },
        { label: 'Total Subs', value: stats?.totalSubscriptions || 0, icon: CreditCard, color: 'from-fuchsia-500 to-pink-600' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Dashboard Admin</h1>
                <p className="text-white/40 text-sm mt-1">Vue d'ensemble de la plateforme Luna Travel SaaS</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {KPIs.map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-[#1a1a24] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                                <kpi.icon size={16} className="text-white" />
                            </div>
                            <ArrowUpRight size={14} className="text-white/20" />
                        </div>
                        <p className="text-2xl font-bold">{kpi.value}</p>
                        <p className="text-[11px] text-white/40 font-medium mt-0.5 uppercase tracking-wider">{kpi.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Users + Subscriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Derniers utilisateurs</h2>
                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{users.length}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {users.slice(0, 8).map((u: any, i: number) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold">
                                            {(u.displayName || 'U')[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{u.displayName || 'User'}</p>
                                        <p className="text-[11px] text-white/30">{u.email}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${u.role === 'Admin' ? 'bg-violet-500/20 text-violet-400' :
                                        u.role === 'Manager' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-sky-500/20 text-sky-400'
                                    }`}>{u.role || 'Agent'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscriptions */}
                <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Abonnements</h2>
                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{subscriptions.length}</span>
                    </div>
                    {subscriptions.length === 0 ? (
                        <div className="p-8 text-center text-white/20 text-sm">Aucun abonnement</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {subscriptions.slice(0, 8).map((s: any, i: number) => (
                                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium">{s.email || s.id}</p>
                                        <p className="text-[11px] text-white/30">{s.planName || s.planId}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
