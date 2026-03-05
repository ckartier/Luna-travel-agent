'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, MapPin, Plane, Hotel, Users, Calendar, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchEvent {
    id: number;
    timestamp: string;
    destination: string;
    destinations: string[];
    budget: string;
    pax: string;
    vibe: string;
    flightsCount: number;
    hotelsCount: number;
    daysCount: number;
}

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
            <p className="font-serif text-2xl font-bold text-luna-charcoal">{value}</p>
            {sub && <p className="text-[11px] text-luna-text-muted mt-1">{sub}</p>}
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const [history, setHistory] = useState<SearchEvent[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('luna_search_history');
            if (raw) setHistory(JSON.parse(raw));
        } catch { /* silent */ }
    }, []);

    // ── COMPUTED METRICS ──
    const { destChart, vibeChart, budgetChart, timeChart, topDest, avgFlights, avgHotels, totalDays } = useMemo(() => {
        const destCount: Record<string, number> = {};
        const vibeCount: Record<string, number> = {};
        const budgetCount: Record<string, number> = {};
        const dayMap: Record<string, number> = {};
        let flights = 0, hotels = 0, days = 0;

        for (const s of history) {
            for (const d of s.destinations) {
                destCount[d] = (destCount[d] || 0) + 1;
            }
            if (s.vibe) vibeCount[s.vibe] = (vibeCount[s.vibe] || 0) + 1;
            if (s.budget) budgetCount[s.budget] = (budgetCount[s.budget] || 0) + 1;
            flights += s.flightsCount || 0;
            hotels += s.hotelsCount || 0;
            days += s.daysCount || 0;

            const day = s.timestamp?.slice(0, 10);
            if (day) dayMap[day] = (dayMap[day] || 0) + 1;
        }

        const sortedDest = Object.entries(destCount).sort((a, b) => b[1] - a[1]);

        return {
            destChart: sortedDest.slice(0, 8).map(([name, count]) => ({ name, count })),
            vibeChart: Object.entries(vibeCount).map(([name, value]) => ({ name, value })),
            budgetChart: Object.entries(budgetCount).map(([name, value]) => ({ name, value })),
            timeChart: Object.entries(dayMap).sort().slice(-14).map(([date, count]) => ({ date: date.slice(5), count })),
            topDest: sortedDest[0]?.[0] || '—',
            avgFlights: history.length ? Math.round(flights / history.length) : 0,
            avgHotels: history.length ? Math.round(hotels / history.length) : 0,
            totalDays: days,
        };
    }, [history]);

    const isEmpty = history.length === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-luna-charcoal">Analytics</h1>
                    <p className="text-sm text-luna-text-muted mt-0.5">Vue d'ensemble de l'activité de recherche</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-luna-text-muted font-semibold uppercase tracking-wider bg-white/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-luna-warm-gray/10">
                    <BarChart3 size={12} />
                    {history.length} recherche{history.length !== 1 ? 's' : ''}
                </div>
            </motion.div>

            {/* Empty State */}
            {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <Sparkles size={40} className="mx-auto text-luna-warm-gray/40 mb-4" />
                    <h2 className="font-serif text-xl font-semibold text-luna-charcoal mb-2">Aucune donnée encore</h2>
                    <p className="text-sm text-luna-text-muted max-w-md mx-auto">Lancez votre première recherche de voyage sur le dashboard pour commencer à voir vos analytics ici.</p>
                </motion.div>
            )}

            {!isEmpty && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={MapPin} label="Destination Top" value={topDest} color="#0ea5e9" delay={0} />
                        <StatCard icon={TrendingUp} label="Recherches" value={history.length} sub="total toutes destinations" color="#22c55e" delay={0.05} />
                        <StatCard icon={Plane} label="Moy. Vols" value={avgFlights} sub="options par recherche" color="#f59e0b" delay={0.1} />
                        <StatCard icon={Hotel} label="Moy. Hôtels" value={avgHotels} sub="options par recherche" color="#8b5cf6" delay={0.15} />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Destinations bar chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Destinations populaires</h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={destChart} barSize={24}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                                            formatter={(value: any) => [`${value} recherche${value > 1 ? 's' : ''}`, 'Total']}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {destChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Vibes pie chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Types de voyage</h3>
                            <div className="h-[220px] flex items-center">
                                {vibeChart.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={vibeChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                                {vibeChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-luna-text-muted text-center w-full">Pas de données de vibe</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Activity over time */}
                    {timeChart.length > 1 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                            <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Activité de recherche</h3>
                            <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeChart}>
                                        <defs>
                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eee', fontSize: 12 }} />
                                        <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} fill="url(#areaGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* Recent searches table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="text-[11px] font-bold text-luna-text-muted uppercase tracking-wider mb-4">Dernières recherches</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-luna-warm-gray/10">
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Date</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Destination</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Vibe</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 pr-4">Budget</th>
                                        <th className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider pb-3 text-right">Résultats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.slice(-10).reverse().map((s, i) => (
                                        <tr key={s.id || i} className="border-b border-luna-warm-gray/5 last:border-0">
                                            <td className="py-2.5 pr-4 text-xs text-luna-text-muted">{new Date(s.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="py-2.5 pr-4 text-sm font-medium text-luna-charcoal">{s.destinations?.join(' → ') || s.destination}</td>
                                            <td className="py-2.5 pr-4">
                                                {s.vibe && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">{s.vibe}</span>}
                                            </td>
                                            <td className="py-2.5 pr-4 text-xs text-luna-text-muted">{s.budget || '—'}</td>
                                            <td className="py-2.5 text-right text-xs text-luna-text-muted">{s.flightsCount}V · {s.hotelsCount}H · {s.daysCount}J</td>
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
