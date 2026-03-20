'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, Star, Diamond, RefreshCw, ArrowRight, TrendingUp, Clock, UserPlus, Plane, Mail } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T } from '@/src/components/T';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Segment {
    id: string;
    name: string;
    count: number;
    contacts: string[];
    icon: string;
}

const SEGMENT_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    'vip':        { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200/50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    'high-value': { bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-200/50', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
    'recurring':  { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200/50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    'inactive':   { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200/50', text: 'text-gray-500', iconBg: 'bg-gray-100' },
    'new':        { bg: 'from-sky-50 to-cyan-50', border: 'border-sky-200/50', text: 'text-sky-700', iconBg: 'bg-sky-100' },
    'no-trip':    { bg: 'from-rose-50 to-pink-50', border: 'border-rose-200/50', text: 'text-rose-600', iconBg: 'bg-rose-100' },
};

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
    'vip':        'Clients Gold & Platinum — votre cercle premium',
    'high-value': 'Clients ayant dépensé 10 000€ ou plus',
    'recurring':  'Clients avec 2 voyages ou plus — fidèles',
    'inactive':   'Aucune activité depuis plus de 3 mois',
    'new':        'Contacts créés ce mois-ci',
    'no-trip':    'Contacts sans aucun voyage associé',
};

export default function SegmentsPage() {
    const { tenantId } = useAuth();
    const [segments, setSegments] = useState<Segment[]>([]);
    const [totalContacts, setTotalContacts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

    useEffect(() => { loadSegments(); }, []);

    const loadSegments = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('/api/crm/segments');
            const data = await res.json();
            setSegments(data.segments || []);
            setTotalContacts(data.totalContacts || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const totalCategorized = segments.reduce((sum, s) => sum + s.count, 0);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
                            <T>Segments Clients</T>
                        </h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium">
                            Segmentation automatique de vos {totalContacts} contacts
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={loadSegments}
                            className="bg-white border border-gray-200 text-gray-500 hover:text-luna-charcoal px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
                            <RefreshCw size={14} /> Actualiser
                        </button>
                        <Link href="/crm/marketing"
                            className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2">
                            <Mail size={14} /> Envoyer campagne
                        </Link>
                    </div>
                </div>

                {/* Overview bar */}
                <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Répartition Globale</p>
                        <p className="text-sm text-gray-400">{totalContacts} contacts au total</p>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
                        {segments.filter(s => s.count > 0).map(s => {
                            const style = SEGMENT_STYLES[s.id] || SEGMENT_STYLES['no-trip'];
                            const width = totalContacts > 0 ? (s.count / totalContacts) * 100 : 0;
                            const gradientColors: Record<string, string> = {
                                'vip': '#f59e0b', 'high-value': '#6366f1', 'recurring': '#10b981',
                                'inactive': '#9ca3af', 'new': '#0ea5e9', 'no-trip': '#f43f5e',
                            };
                            return (
                                <motion.div
                                    key={s.id}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(width, 2)}%` }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    style={{ backgroundColor: gradientColors[s.id] || '#9ca3af' }}
                                    className="h-full"
                                    title={`${s.name}: ${s.count}`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                        {segments.filter(s => s.count > 0).map(s => {
                            const gradientColors: Record<string, string> = {
                                'vip': '#f59e0b', 'high-value': '#6366f1', 'recurring': '#10b981',
                                'inactive': '#9ca3af', 'new': '#0ea5e9', 'no-trip': '#f43f5e',
                            };
                            return (
                                <div key={s.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradientColors[s.id] || '#9ca3af' }} />
                                    <span className="text-[10px] font-medium text-gray-500">{s.icon} {s.name.split('(')[0].trim()}</span>
                                    <span className="text-[10px] font-bold text-[#2E2E2E]">{s.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Segment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {segments.map((s, i) => {
                        const style = SEGMENT_STYLES[s.id] || SEGMENT_STYLES['no-trip'];
                        const desc = SEGMENT_DESCRIPTIONS[s.id] || '';
                        const pct = totalContacts > 0 ? Math.round((s.count / totalContacts) * 100) : 0;

                        return (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={`bg-gradient-to-br ${style.bg} rounded-[24px] border ${style.border} p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden`}
                                onClick={() => setSelectedSegment(selectedSegment?.id === s.id ? null : s)}
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full -z-0 group-hover:scale-110 transition-transform" />

                                <div className="relative z-10">
                                    {/* Icon + count */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 ${style.iconBg} rounded-2xl flex items-center justify-center text-xl shadow-sm`}>
                                            {s.icon}
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-3xl font-light ${style.text} tracking-tight`}>{s.count}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{pct}% du total</p>
                                        </div>
                                    </div>

                                    {/* Name + description */}
                                    <h3 className="text-[14px] font-medium text-[#2E2E2E] mb-1">{s.name}</h3>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>

                                    {/* Action bar */}
                                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/5">
                                        <Link href={`/crm/contacts?segment=${s.id}`}
                                            className="flex-1 py-2.5 bg-white/70 hover:bg-white text-[#2E2E2E] rounded-xl text-[11px] font-medium text-center transition-all border border-white/50 shadow-sm flex items-center justify-center gap-1.5"
                                            onClick={e => e.stopPropagation()}>
                                            <Users size={13} /> Voir les contacts
                                        </Link>
                                        <Link href={`/crm/marketing?segment=${s.id}`}
                                            className="py-2.5 px-4 bg-[#2E2E2E] hover:bg-black text-white rounded-xl text-[11px] font-medium transition-all shadow-sm flex items-center gap-1.5"
                                            onClick={e => e.stopPropagation()}>
                                            <Mail size={13} /> Campagne
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {segments.length === 0 && (
                    <div className="text-center py-16">
                        <Users size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-lg font-light text-[#2E2E2E]">Aucun segment</p>
                        <p className="text-sm text-gray-400 mt-1">Ajoutez des contacts pour voir la segmentation automatique</p>
                    </div>
                )}
            </div>
        </div>
    );
}
