'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, MapPin, Plane, Hotel, Users, Calendar, Sparkles, DollarSign, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { getLeads, getTrips, getContacts, getActivities, CRMLead, CRMTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';

const CHART_COLORS = ['#0ea5e9', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

function StatCard({ icon: Icon, label, value, sub, color, delay }: { icon: any; label: string; value: string | number; sub?: string; color: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <span className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-luna-charcoal">{value}</p>
            {sub && <p className="text-[11px] text-luna-text-muted mt-1">{sub}</p>}
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const { tenantId } = useAuth();
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [contactCount, setContactCount] = useState(0);
    const [activityCount, setActivityCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const [l, t, c, a] = await Promise.all([
                    getLeads(tenantId),
                    getTrips(tenantId),
                    getContacts(tenantId),
                    getActivities(tenantId),
                ]);
                setLeads(l);
                setTrips(t);
                setContactCount(c.length);
                setActivityCount(a.length);
            } catch (e) { console.error('Analytics load error:', e); }
            setLoading(false);
        };
        loadData();
    }, [tenantId]);

    // ── COMPUTED METRICS from real Firestore data ──
    const { destChart, statusChart, revenueChart, topDest, totalRevenue, avgDealValue, conversionRate } = useMemo(() => {
        // Destinations from leads
        const destCount: Record<string, number> = {};
        for (const lead of leads) {
            const dest = lead.destination || 'Non définie';
            destCount[dest] = (destCount[dest] || 0) + 1;
        }
        const sortedDest = Object.entries(destCount).sort((a, b) => b[1] - a[1]);

        // Lead status distribution
        const statusCount: Record<string, number> = {};
        for (const lead of leads) {
            const label = lead.status === 'NEW' ? 'Nouveau' :
                lead.status === 'ANALYSING' ? 'IA en cours' :
                    lead.status === 'PROPOSAL_READY' ? 'Devis envoyé' :
                        lead.status === 'WON' ? 'Gagné' : lead.status === 'LOST' ? 'Perdu' : lead.status;
            statusCount[label] = (statusCount[label] || 0) + 1;
        }

        // Revenue over time from trips
        const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthMap: Record<string, number> = {};
        let totalRev = 0;
        for (const trip of trips) {
            totalRev += trip.amount || 0;
            try {
                const d = new Date(trip.startDate);
                const key = MONTHS_SHORT[d.getMonth()];
                monthMap[key] = (monthMap[key] || 0) + (trip.amount || 0);
            } catch { /* skip invalid dates */ }
        }

        const wonDeals = leads.filter(l => l.status === 'WON').length;
        const convRate = leads.length > 0 ? Math.round((wonDeals / leads.length) * 100) : 0;
        const avgDeal = trips.length > 0 ? Math.round(totalRev / trips.length) : 0;

        return {
            destChart: sortedDest.slice(0, 8).map(([name, count]) => ({ name, count })),
            statusChart: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
            revenueChart: MONTHS_SHORT.map(m => ({ name: m, revenue: monthMap[m] || 0 })).filter(d => d.revenue > 0),
            topDest: sortedDest[0]?.[0] || '—',
            totalRevenue: totalRev,
            avgDealValue: avgDeal,
            conversionRate: convRate,
        };
    }, [leads, trips]);

    const isEmpty = leads.length === 0 && trips.length === 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-luna-charcoal">Analytics</h1>
                    <p className="text-sm text-luna-text-muted mt-0.5">Vue d'ensemble de votre activité CRM</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-luna-text-muted font-semibold uppercase tracking-wider bg-white/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-luna-warm-gray/10">
                    <BarChart3 size={12} />
                    {leads.length} lead{leads.length !== 1 ? 's' : ''} · {trips.length} voyage{trips.length !== 1 ? 's' : ''}
                </div>
            </motion.div>

            {/* Empty State */}
            {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <Sparkles size={40} className="mx-auto text-luna-warm-gray/40 mb-4" />
                    <h2 className="font-serif text-xl font-semibold text-luna-charcoal mb-2">Aucune donnée encore</h2>
                    <p className="text-sm text-luna-text-muted max-w-md mx-auto">Ajoutez des leads dans le Pipeline et des voyages dans le Planning pour voir vos analytics ici.</p>
                </motion.div>
            )}

            {!isEmpty && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={DollarSign} label="Chiffre d'affaires" value={`${totalRevenue.toLocaleString('fr-FR')} €`} color="#22c55e" delay={0} />
                        <StatCard icon={MapPin} label="Destination Top" value={topDest} color="#0ea5e9" delay={0.05} />
                        <StatCard icon={TrendingUp} label="Taux de conversion" value={`${conversionRate}%`} sub={`${leads.filter(l => l.status === 'WON').length} gagné${leads.filter(l => l.status === 'WON').length > 1 ? 's' : ''} sur ${leads.length}`} color="#f59e0b" delay={0.1} />
                        <StatCard icon={Users} label="Contacts" value={contactCount} sub={`${activityCount} activités`} color="#8b5cf6" delay={0.15} />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Destinations bar chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Destinations populaires</h3>
                            <div className="h-[220px]">
                                {destChart.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={destChart} barSize={24}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                                                formatter={(value: any) => [`${value} lead${value > 1 ? 's' : ''}`, 'Total']}
                                            />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                {destChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-luna-text-muted text-center pt-20">Aucune destination</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Lead status pie chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Pipeline par statut</h3>
                            <div className="h-[220px] flex items-center">
                                {statusChart.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                                {statusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-luna-text-muted text-center w-full">Aucun lead</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Revenue over time */}
                    {revenueChart.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Chiffre d'affaires par mois</h3>
                            <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChart}>
                                        <defs>
                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }} formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} €`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#areaGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* Recent leads table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Derniers leads</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-luna-warm-gray/10">
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Client</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Destination</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Budget</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Pax</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.slice(0, 10).map((lead, i) => (
                                        <tr key={lead.id || i} className="border-b border-luna-warm-gray/5 last:border-0">
                                            <td className="py-2.5 pr-4 text-sm font-medium text-luna-charcoal">{lead.clientName || 'Client'}</td>
                                            <td className="py-2.5 pr-4 text-sm text-luna-charcoal">{lead.destination}</td>
                                            <td className="py-2.5 pr-4 text-xs text-luna-text-muted">{lead.budget || '—'}</td>
                                            <td className="py-2.5 pr-4 text-xs text-luna-text-muted">{lead.pax || '—'}</td>
                                            <td className="py-2.5 text-right">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                                                    ${lead.status === 'WON' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        lead.status === 'PROPOSAL_READY' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                            lead.status === 'ANALYSING' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                                'bg-sky-50 text-sky-600 border-sky-200'}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
