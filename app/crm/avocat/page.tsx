'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Scale, FileText, Users, Calendar, AlertCircle, Clock,
    TrendingUp, Gavel, ArrowUpRight, Briefcase, Star,
    CheckCircle2, Loader2, Plus, Building2
} from 'lucide-react';
import {
    getLegalDossiers, CRMLegalDossier,
    getContacts, CRMContact,
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion } from 'framer-motion';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { T } from '@/src/components/T';

/* ─── Dashboard Legal ─── */
export default function AvocatDashboard() {
    const router = useRouter();
    const { tenantId } = useAuth();
    const [dossiers, setDossiers] = useState<CRMLegalDossier[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [d, c] = await Promise.all([getLegalDossiers(tenantId), getContacts(tenantId)]);
            setDossiers(d);
            setContacts(c);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { load(); }, [load]);

    // KPIs
    const active = dossiers.filter(d => !['CLOS', 'ARCHIVÉ'].includes(d.status));
    const urgent = dossiers.filter(d => d.priority === 'URGENT' || d.priority === 'HIGH');
    const upcoming = dossiers.filter(d => d.status === 'AUDIENCE_PRÉVUE');
    const totalFees = dossiers.reduce((s, d) => s + (d.fees || 0), 0);
    const totalPaid = dossiers.reduce((s, d) => s + (d.feesPaid || 0), 0);
    const starred = dossiers.filter(d => d.isStarred);

    // Upcoming deadlines across all dossiers
    const allDeadlines = dossiers.flatMap(d =>
        (d.deadlines || []).filter(dl => !dl.completed && dl.date).map(dl => ({ ...dl, dossierTitle: d.title, dossierId: d.id }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);

    // Upcoming hearings
    const allHearings = dossiers.flatMap(d =>
        (d.hearings || []).filter(h => !h.completed && h.date).map(h => ({ ...h, dossierTitle: d.title, dossierId: d.id }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

    // Status distribution
    const statusCounts = dossiers.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Type distribution
    const typeCounts = dossiers.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-[#A07850]" size={32} />
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A07850] to-[#C4A57B] flex items-center justify-center shadow-lg">
                                <Scale size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>CRM Legal</T></h1>
                                <p className="text-sm text-[#6B7280] font-medium">
                                    Tableau de bord juridique • <span className="text-[#A07850]">{active.length} dossiers actifs</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => router.push('/crm/dossiers')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
                            style={{ backgroundColor: '#A07850' }}>
                            <Plus size={16} /> Nouveau Dossier
                        </button>
                        <button onClick={() => router.push('/crm/jurisprudence')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-[#A07850]/20 text-[#A07850] hover:bg-[#A07850]/5 transition-all">
                            <Gavel size={16} /> Jurisprudence
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Actifs', value: active.length, icon: Briefcase, color: 'text-[#A07850]', bg: 'bg-[#A07850]/5' },
                        { label: 'Priorité Haute', value: urgent.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'Audiences', value: upcoming.length, icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Clients', value: contacts.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Honoraires', value: `${(totalFees / 1000).toFixed(0)}k€`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Encaissé', value: `${(totalPaid / 1000).toFixed(0)}k€`, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon size={18} className={stat.color} />
                            </div>
                            <p className="text-2xl font-light text-[#2E2E2E]">{stat.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Upcoming Hearings */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2E2E2E] flex items-center gap-2">
                                <Gavel size={16} className="text-amber-500" /> Audiences à venir
                            </h3>
                            <span className="text-[10px] text-gray-400 font-semibold">{allHearings.length} prévues</span>
                        </div>
                        {allHearings.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-8"><T>Aucune audience planifiée</T></p>
                        ) : (
                            <div className="space-y-3">
                                {allHearings.map((h, i) => {
                                    const date = new Date(h.date);
                                    const isUrgent = isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 7) });
                                    return (
                                        <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${isUrgent ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50/50 border-gray-100'}`}
                                            onClick={() => router.push('/crm/dossiers')}>
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                <span className="text-lg font-bold leading-none">{format(date, 'd')}</span>
                                                <span className="text-[9px] font-semibold uppercase">{format(date, 'MMM', { locale: fr })}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#2E2E2E] truncate">{h.type}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {h.dossierTitle} • {h.tribunal}
                                                </p>
                                            </div>
                                            {h.time && <span className="text-xs font-mono text-gray-400">{h.time}</span>}
                                            <ArrowUpRight size={16} className="text-gray-300" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Status Distribution */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2E2E2E] flex items-center gap-2 mb-5">
                            <FileText size={16} className="text-[#A07850]" /> Répartition
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                                const pct = dossiers.length > 0 ? (count / dossiers.length) * 100 : 0;
                                const colors: Record<string, string> = {
                                    OUVERT: 'bg-blue-500', EN_COURS: 'bg-emerald-500', 'AUDIENCE_PRÉVUE': 'bg-amber-500',
                                    'EN_DÉLIBÉRÉ': 'bg-purple-500', JUGEMENT_RENDU: 'bg-teal-500', APPEL: 'bg-orange-500',
                                    CLOS: 'bg-gray-400', 'ARCHIVÉ': 'bg-gray-300',
                                };
                                const labels: Record<string, string> = {
                                    OUVERT: 'Ouvert', EN_COURS: 'En cours', 'AUDIENCE_PRÉVUE': 'Audience',
                                    'EN_DÉLIBÉRÉ': 'Délibéré', JUGEMENT_RENDU: 'Jugement', APPEL: 'Appel',
                                    CLOS: 'Clos', 'ARCHIVÉ': 'Archivé',
                                };
                                return (
                                    <div key={status}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-600">{labels[status] || status}</span>
                                            <span className="text-xs font-bold text-gray-400">{count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${colors[status] || 'bg-gray-400'}`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Type breakdown */}
                        <div className="mt-8">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3"><T>Par type</T></h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                    <span key={type} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                        {type} ({count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Deadlines & Starred */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Deadlines */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2E2E2E] flex items-center gap-2 mb-5">
                            <Clock size={16} className="text-red-500" /> Échéances proches
                        </h3>
                        {allDeadlines.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-8"><T>Aucune échéance</T></p>
                        ) : (
                            <div className="space-y-2">
                                {allDeadlines.map((dl, i) => {
                                    const date = new Date(dl.date);
                                    const overdue = isPast(date);
                                    return (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${overdue ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100'}`}>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${overdue ? 'bg-red-400 animate-pulse' : 'bg-blue-400'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${overdue ? 'text-red-600' : 'text-[#2E2E2E]'}`}>{dl.label}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{dl.dossierTitle} • {dl.type}</p>
                                            </div>
                                            <span className={`text-[10px] font-semibold shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                {format(date, 'd MMM', { locale: fr })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Starred Dossiers */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2E2E2E] flex items-center gap-2 mb-5">
                            <Star size={16} className="text-amber-400 fill-amber-400" /> Dossiers prioritaires
                        </h3>
                        {starred.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-8">Marquez des dossiers comme prioritaires en les favoritant ⭐</p>
                        ) : (
                            <div className="space-y-2">
                                {starred.map(d => (
                                    <div key={d.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => router.push('/crm/dossiers')}>
                                        <div className="w-10 h-10 rounded-xl bg-[#A07850]/10 flex items-center justify-center shrink-0">
                                            <Scale size={18} className="text-[#A07850]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#2E2E2E] truncate">{d.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                                <span className="font-mono">{d.caseNumber}</span>
                                                <span>•</span>
                                                <span>{d.clientName}</span>
                                            </p>
                                        </div>
                                        <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${
                                            d.priority === 'URGENT' ? 'text-red-600 bg-red-50' :
                                            d.priority === 'HIGH' ? 'text-orange-600 bg-orange-50' :
                                            'text-gray-500 bg-gray-50'
                                        }`}>{d.priority}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Dossiers', icon: Briefcase, href: '/crm/dossiers', color: 'from-[#A07850] to-[#C4A57B]' },
                        { label: 'Jurisprudence', icon: Gavel, href: '/crm/jurisprudence', color: 'from-amber-500 to-amber-600' },
                        { label: 'Contacts', icon: Users, href: '/crm/contacts', color: 'from-blue-500 to-blue-600' },
                        { label: 'Documents', icon: FileText, href: '/crm/documents', color: 'from-teal-500 to-teal-600' },
                    ].map((item, i) => (
                        <motion.button key={i}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                            onClick={() => router.push(item.href)}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                <item.icon size={18} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold text-[#2E2E2E] group-hover:text-[#A07850] transition-colors">{item.label}</span>
                            <ArrowUpRight size={16} className="text-gray-300 ml-auto group-hover:text-[#A07850] transition-colors" />
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
