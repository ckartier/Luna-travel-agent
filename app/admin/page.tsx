'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, Globe, BarChart3, TrendingUp, Activity, Layers, ArrowUpRight, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

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
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceLoading, setMaintenanceLoading] = useState(false);

    useEffect(() => {
        fetchWithAuth('/api/admin/stats').then(r => r.json()).then(data => {
            setStats(data.stats);
            setUsers(data.users || []);
            setSubscriptions(data.subscriptions || []);
            setLoading(false);
        }).catch(() => setLoading(false));

        // Load maintenance mode state from localStorage (or could be Firestore)
        const saved = localStorage.getItem('luna_maintenance_mode');
        if (saved === 'true') setMaintenanceMode(true);
    }, []);

    const toggleMaintenance = async () => {
        setMaintenanceLoading(true);
        const newState = !maintenanceMode;

        // Save to localStorage and optionally to a server-side flag
        localStorage.setItem('luna_maintenance_mode', String(newState));

        // Also save to Firestore via API so middleware can check it
        try {
            await fetchWithAuth('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState }),
            });
        } catch (err) {
            console.error('Failed to toggle maintenance on server:', err);
        }

        setMaintenanceMode(newState);
        setMaintenanceLoading(false);
    };

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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-normal">Dashboard Admin</h1>
                    <p className="text-white/40 text-sm mt-1">Vue d'ensemble de la plateforme Luna Travel SaaS</p>
                </div>
            </div>

            {/* ═══ MAINTENANCE MODE TOGGLE ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={`mb-8 rounded-2xl border overflow-hidden transition-all duration-500 ${maintenanceMode
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
                        : 'bg-[#1a1a24] border-white/5'
                    }`}
            >
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${maintenanceMode
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20'
                                : 'bg-white/5'
                            }`}>
                            {maintenanceMode ? (
                                <AlertTriangle size={18} className="text-white" />
                            ) : (
                                <Shield size={18} className="text-white/40" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                Mode Maintenance
                                {maintenanceMode && (
                                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold animate-pulse">
                                        ACTIF
                                    </span>
                                )}
                            </h3>
                            <p className="text-[12px] text-white/30 mt-0.5">
                                {maintenanceMode
                                    ? 'Les utilisateurs voient la page de maintenance. Seuls les admins peuvent accéder au site.'
                                    : 'Activer pour mettre le site en maintenance. Les visiteurs seront redirigés.'
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleMaintenance}
                        disabled={maintenanceLoading}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${maintenanceMode
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                                : 'bg-white/10'
                            }`}
                    >
                        {maintenanceLoading ? (
                            <Loader2 size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-spin" />
                        ) : (
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${maintenanceMode ? 'left-8' : 'left-1'
                                }`} />
                        )}
                    </button>
                </div>

                {/* Preview link */}
                {maintenanceMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t border-amber-500/10 px-5 py-3 flex items-center justify-between"
                    >
                        <span className="text-[12px] text-amber-400/60">Page de maintenance visible par les visiteurs</span>
                        <a href="/maintenance" target="_blank" rel="noopener"
                            className="text-[12px] text-amber-400 hover:text-amber-300 transition-colors font-medium">
                            Prévisualiser →
                        </a>
                    </motion.div>
                )}
            </motion.div>

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
                        <p className="text-2xl font-normal">{kpi.value}</p>
                        <p className="text-[12px] text-white/40 font-normal mt-0.5 uppercase tracking-wider">{kpi.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Users + Subscriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-normal text-sm">Derniers utilisateurs</h2>
                        <span className="text-[12px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{users.length}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {users.slice(0, 8).map((u: any, i: number) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-[12px] font-normal">
                                            {(u.displayName || 'U')[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-normal">{u.displayName || 'User'}</p>
                                        <p className="text-[12px] text-white/30">{u.email}</p>
                                    </div>
                                </div>
                                <span className={`text-[12px] font-normal px-2 py-0.5 rounded-full uppercase tracking-wider ${u.role === 'Admin' ? 'bg-violet-500/20 text-violet-400' :
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
                        <h2 className="font-normal text-sm">Abonnements</h2>
                        <span className="text-[12px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{subscriptions.length}</span>
                    </div>
                    {subscriptions.length === 0 ? (
                        <div className="p-8 text-center text-white/20 text-sm">Aucun abonnement</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {subscriptions.slice(0, 8).map((s: any, i: number) => (
                                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <p className="text-sm font-normal">{s.email || s.id}</p>
                                        <p className="text-[12px] text-white/30">{s.planName || s.planId}</p>
                                    </div>
                                    <span className={`text-[12px] font-normal px-2 py-0.5 rounded-full uppercase tracking-wider ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
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
