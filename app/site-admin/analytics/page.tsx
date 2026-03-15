'use client';

import { motion } from 'framer-motion';
import {
    Eye, FileText, TrendingUp, Globe, ArrowUpRight, ArrowDownRight,
    Clock, Users, MousePointerClick, Monitor, Smartphone, Tablet,
    MapPin
} from 'lucide-react';

// Placeholder analytics data — TODO: connect to real analytics
const STATS = [
    { label: 'Visiteurs uniques', value: '—', icon: Users, change: null, color: 'from-sky-500 to-blue-600' },
    { label: 'Pages vues', value: '—', icon: Eye, change: null, color: 'from-violet-500 to-purple-600' },
    { label: 'Formulaires envoyés', value: '—', icon: FileText, change: null, color: 'from-emerald-500 to-green-600' },
    { label: 'Taux de rebond', value: '—', icon: MousePointerClick, change: null, color: 'from-amber-500 to-orange-600' },
];

const TOP_PAGES = [
    { path: '/', name: 'Accueil', views: '—' },
    { path: '/catalog', name: 'Catalogue', views: '—' },
    { path: '/collections', name: 'Collections', views: '—' },
    { path: '/contact', name: 'Contact', views: '—' },
];

const DEVICES = [
    { name: 'Desktop', icon: Monitor, percentage: '—' },
    { name: 'Mobile', icon: Smartphone, percentage: '—' },
    { name: 'Tablette', icon: Tablet, percentage: '—' },
];

const SOURCES = [
    { name: 'Direct', percentage: '—', color: 'bg-sky-400' },
    { name: 'Google', percentage: '—', color: 'bg-emerald-400' },
    { name: 'Réseaux sociaux', percentage: '—', color: 'bg-violet-400' },
    { name: 'Email', percentage: '—', color: 'bg-amber-400' },
];

export default function SiteAnalyticsPage() {
    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light text-[#2E2E2E] tracking-tight">Analytics du Site</h1>
                    <p className="text-sm text-[#9CA3AF] mt-1">Performance de votre site vitrine</p>
                </div>
                <div className="flex items-center gap-2">
                    {['7j', '30j', '90j'].map((period) => (
                        <button key={period}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${period === '30j'
                                ? 'bg-[#2E2E2E] text-white'
                                : 'bg-gray-50 text-[#9CA3AF] hover:bg-gray-100 hover:text-[#2E2E2E]'
                                }`}>
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <Icon size={16} className="text-white" strokeWidth={1.5} />
                                </div>
                                {stat.change !== null && (
                                    <span className={`flex items-center gap-0.5 text-xs font-bold ${stat.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {stat.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {Math.abs(stat.change)}%
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl font-light text-[#2E2E2E]">{stat.value}</div>
                            <div className="text-[10px] uppercase tracking-[0.15em] text-[#9CA3AF] font-semibold mt-1">{stat.label}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Traffic Chart Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-1">Trafic</h3>
                    <p className="text-xs text-[#9CA3AF] mb-6">Visiteurs sur les 30 derniers jours</p>

                    {/* Chart placeholder */}
                    <div className="h-48 flex items-end gap-1.5 px-2">
                        {Array.from({ length: 30 }, (_, i) => {
                            const h = Math.random() * 80 + 20;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 bg-gradient-to-t from-sky-200 to-sky-100 rounded-t-sm hover:from-sky-400 hover:to-sky-300 transition-colors cursor-pointer"
                                    style={{ height: `${h}%` }}
                                    title={`Jour ${i + 1}`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between px-2 mt-2">
                        <span className="text-[9px] text-[#C4B199]">1 Mar</span>
                        <span className="text-[9px] text-[#C4B199]">15 Mar</span>
                        <span className="text-[9px] text-[#C4B199]">30 Mar</span>
                    </div>
                </motion.div>

                {/* Sources de trafic */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-1">Sources de trafic</h3>
                    <p className="text-xs text-[#9CA3AF] mb-6">D'où viennent vos visiteurs</p>

                    <div className="space-y-4">
                        {SOURCES.map((source, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#2E2E2E] font-medium">{source.name}</span>
                                    <span className="text-xs text-[#9CA3AF] font-bold">{source.percentage}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className={`h-full rounded-full ${source.color} opacity-60`} style={{ width: '0%' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-sky-50/50 rounded-xl border border-sky-100/50">
                        <p className="text-xs text-sky-700 flex items-center gap-2">
                            <Globe size={14} />
                            Connectez Google Analytics pour des données réelles
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Top Pages */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-4">Pages les plus vues</h3>
                    <div className="space-y-3">
                        {TOP_PAGES.map((page, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-[#C4B199] w-4">{i + 1}</span>
                                    <div>
                                        <div className="text-xs font-medium text-[#2E2E2E]">{page.name}</div>
                                        <div className="text-[10px] text-[#9CA3AF]">{page.path}</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-[#9CA3AF]">{page.views}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Devices */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-4">Appareils</h3>
                    <div className="space-y-4">
                        {DEVICES.map((device, i) => {
                            const Icon = device.icon;
                            return (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100">
                                        <Icon size={18} className="text-[#9CA3AF]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-[#2E2E2E]">{device.name}</div>
                                        <div className="text-xl font-light text-[#2E2E2E]">{device.percentage}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Géographie */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-4">Géographie</h3>
                    <div className="space-y-3">
                        {[
                            { country: 'France', flag: '🇫🇷' },
                            { country: 'Suisse', flag: '🇨🇭' },
                            { country: 'Belgique', flag: '🇧🇪' },
                            { country: 'Canada', flag: '🇨🇦' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50">
                                <span className="text-lg">{item.flag}</span>
                                <span className="text-xs font-medium text-[#2E2E2E] flex-1">{item.country}</span>
                                <span className="text-xs font-bold text-[#9CA3AF]">—</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-violet-50/50 border border-violet-100/50">
                        <p className="text-[10px] text-violet-600 flex items-center gap-2">
                            <MapPin size={12} />
                            Analytics géo disponible avec Google Analytics
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
