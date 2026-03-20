'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Scale, Search, Plus, X, ChevronRight, Clock, AlertCircle,
    Calendar, FileText, Users, Download, RefreshCcw, Loader2,
    CheckCircle2, Circle, ArrowUpRight, Briefcase, Filter, Tag,
    Star, Trash2, Gavel, Building2, Sparkles
} from 'lucide-react';
import {
    getLegalDossiers, createLegalDossier, updateLegalDossier, deleteLegalDossier,
    CRMLegalDossier, LegalDossierType, LegalDossierStatus,
    getContacts, CRMContact
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';
import ConfirmModal from '@/src/components/ConfirmModal';
import { generateLegalDossierPDF } from '@/src/lib/pdf/legalDossierPdf';
import { T } from '@/src/components/T';

/* ─── Status & Type Config ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    'OUVERT':           { label: 'Ouvert',          color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Circle },
    'EN_COURS':         { label: 'En cours',        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    'AUDIENCE_PRÉVUE':  { label: 'Audience prévue', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Calendar },
    'EN_DÉLIBÉRÉ':      { label: 'En délibéré',     color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: Clock },
    'JUGEMENT_RENDU':   { label: 'Jugement rendu',  color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',       icon: Gavel },
    'APPEL':            { label: 'Appel',           color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: ArrowUpRight },
    'CLOS':             { label: 'Clos',            color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200',       icon: CheckCircle2 },
    'ARCHIVÉ':          { label: 'Archivé',         color: 'text-gray-400',    bg: 'bg-gray-50 border-gray-100',       icon: FileText },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    'CIVIL':        { label: 'Civil',          icon: Scale,      color: 'text-blue-600 bg-blue-50' },
    'PÉNAL':        { label: 'Pénal',          icon: Gavel,      color: 'text-red-600 bg-red-50' },
    'COMMERCIAL':   { label: 'Commercial',     icon: Briefcase,  color: 'text-purple-600 bg-purple-50' },
    'TRAVAIL':      { label: 'Droit du travail', icon: Users,    color: 'text-amber-600 bg-amber-50' },
    'ADMINISTRATIF': { label: 'Administratif', icon: Building2,  color: 'text-teal-600 bg-teal-50' },
    'FAMILLE':      { label: 'Famille',        icon: Users,      color: 'text-pink-600 bg-pink-50' },
    'IMMOBILIER':   { label: 'Immobilier',     icon: Building2,  color: 'text-indigo-600 bg-indigo-50' },
    'PROPRIÉTÉ_INTELLECTUELLE': { label: 'Propriété intellectuelle', icon: FileText, color: 'text-cyan-600 bg-cyan-50' },
    'AUTRE':        { label: 'Autre',          icon: FileText,   color: 'text-gray-600 bg-gray-50' },
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'text-gray-500 bg-gray-50',
    MEDIUM: 'text-sky-600 bg-sky-50',
    HIGH: 'text-orange-600 bg-orange-50',
    URGENT: 'text-red-600 bg-red-50',
};

function getNextDeadline(dossier: CRMLegalDossier): { label: string; color: string } | null {
    const upcoming = (dossier.deadlines || [])
        .filter(d => !d.completed && d.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (upcoming.length === 0) return null;
    const date = new Date(upcoming[0].date);
    const now = new Date();
    if (isPast(date)) return { label: `Dépassé`, color: 'text-red-600 bg-red-50' };
    if (isWithinInterval(date, { start: now, end: addDays(now, 7) }))
        return { label: `J-${Math.ceil((date.getTime() - now.getTime()) / 86400000)}`, color: 'text-amber-600 bg-amber-50' };
    return { label: format(date, 'd MMM', { locale: fr }), color: 'text-gray-500 bg-gray-50' };
}

/* ─── Component ─── */
export default function DossiersPage() {
    const { user, userProfile, tenantId } = useAuth();
    const [dossiers, setDossiers] = useState<CRMLegalDossier[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [selected, setSelected] = useState<CRMLegalDossier | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [newDossier, setNewDossier] = useState({
        title: '', clientId: '', type: 'CIVIL' as LegalDossierType,
        jurisdiction: '', tribunal: '', opposingParty: '',
        fees: 0, feesType: 'FORFAIT' as const, priority: 'MEDIUM' as const, notes: '',
    });
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

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

    const handleCreate = async () => {
        if (!tenantId || !newDossier.title) return;
        const client = contacts.find(c => c.id === newDossier.clientId);
        const caseNum = `DOS-${new Date().getFullYear()}-${String(dossiers.length + 1).padStart(4, '0')}`;
        await createLegalDossier(tenantId, {
            caseNumber: caseNum,
            title: newDossier.title,
            type: newDossier.type,
            status: 'OUVERT',
            jurisdiction: newDossier.jurisdiction,
            tribunal: newDossier.tribunal,
            clientId: newDossier.clientId || undefined,
            clientName: client ? `${client.firstName} ${client.lastName}` : 'Client non assigné',
            opposingParty: newDossier.opposingParty,
            hearings: [],
            deadlines: [],
            fees: newDossier.fees,
            feesPaid: 0,
            feesType: newDossier.feesType,
            priority: newDossier.priority,
            notes: newDossier.notes,
            tags: [],
            isStarred: false,
            assignedTo: user?.uid,
            assignedToName: userProfile?.displayName || user?.displayName || 'Avocat',
        });
        setShowModal(false);
        setNewDossier({ title: '', clientId: '', type: 'CIVIL', jurisdiction: '', tribunal: '', opposingParty: '', fees: 0, feesType: 'FORFAIT', priority: 'MEDIUM', notes: '' });
        load();
    };

    const toggleStar = async (dossier: CRMLegalDossier) => {
        if (!tenantId || !dossier.id) return;
        await updateLegalDossier(tenantId, dossier.id, { isStarred: !dossier.isStarred });
        setDossiers(prev => prev.map(d => d.id === dossier.id ? { ...d, isStarred: !d.isStarred } : d));
        if (selected?.id === dossier.id) setSelected(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    };

    const handleDelete = async (id: string) => {
        if (!tenantId) return;
        await deleteLegalDossier(tenantId, id);
        setDossiers(prev => prev.filter(d => d.id !== id));
        if (selected?.id === id) setSelected(null);
        setDeleteTarget(null);
    };

    const filtered = dossiers.filter(d => {
        const matchSearch = `${d.title} ${d.clientName} ${d.jurisdiction} ${d.caseNumber} ${d.opposingParty || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || d.status === filterStatus;
        const matchType = filterType === 'all' || d.type === filterType;
        return matchSearch && matchStatus && matchType;
    });

    const stats = {
        total: dossiers.filter(d => d.status !== 'CLOS' && d.status !== 'ARCHIVÉ').length,
        urgent: dossiers.filter(d => d.priority === 'URGENT' || d.priority === 'HIGH').length,
        audiences: dossiers.filter(d => d.status === 'AUDIENCE_PRÉVUE').length,
        totalFees: dossiers.reduce((sum, d) => sum + (d.fees || 0), 0),
        totalPaid: dossiers.reduce((sum, d) => sum + (d.feesPaid || 0), 0),
    };

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#A07850]/10 flex items-center justify-center">
                                <Scale size={20} className="text-[#A07850]" />
                            </div>
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Dossiers</T></h1>
                        </div>
                        <p className="text-sm text-[#6B7280] font-medium">
                            Gestion des dossiers juridiques •{' '}
                            <span className="text-[#A07850]">{stats.total} actifs</span>
                            {stats.audiences > 0 && <> • <span className="text-amber-600">{stats.audiences} audiences prévues</span></>}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 text-white"
                        style={{ backgroundColor: '#A07850' }}>
                        <Plus size={16} /> Nouveau Dossier
                    </button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Dossiers actifs', value: stats.total, icon: Briefcase, color: 'text-[#A07850]' },
                        { label: 'Priorité haute', value: stats.urgent, icon: AlertCircle, color: 'text-red-600' },
                        { label: 'Audiences', value: stats.audiences, icon: Gavel, color: 'text-amber-600' },
                        { label: 'Honoraires', value: `${stats.totalFees.toLocaleString('fr-FR')}€`, icon: FileText, color: 'text-emerald-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                <stat.icon size={18} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-xl font-light text-[#2E2E2E]">{stat.value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par titre, numéro, client, partie adverse..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm focus:bg-white focus:shadow-xl transition-all outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter size={14} className="text-gray-400" />
                        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                            {['all', 'OUVERT', 'EN_COURS', 'AUDIENCE_PRÉVUE', 'CLOS'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[#A07850] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                            {['all', 'CIVIL', 'PÉNAL', 'COMMERCIAL', 'TRAVAIL'].map(t => (
                                <button key={t} onClick={() => setFilterType(t)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filterType === t ? 'bg-[#A07850] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {t === 'all' ? 'Tous' : (TYPE_CONFIG[t]?.label || t)}
                                </button>
                            ))}
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#A07850] transition-all shadow-sm">
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Dossiers grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="animate-spin text-[#A07850]" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <Scale size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-lg font-light text-gray-400"><T>Aucun dossier trouvé</T></p>
                        <p className="text-sm text-gray-300 mt-1"><T>Créez votre premier dossier pour commencer.</T></p>
                    </div>
                ) : (
                    <div className={`flex gap-0 ${selected ? 'flex-row' : 'flex-col'}`}>
                        {/* List */}
                        <div className={`${selected ? 'w-[55%] pr-6' : 'w-full'} space-y-3 transition-all duration-300`}>
                            {filtered.map(dossier => {
                                const typeConf = TYPE_CONFIG[dossier.type] || TYPE_CONFIG.AUTRE;
                                const statusConf = STATUS_CONFIG[dossier.status] || STATUS_CONFIG.OUVERT;
                                const StatusIcon = statusConf.icon;
                                const TypeIcon = typeConf.icon;
                                const deadline = getNextDeadline(dossier);

                                return (
                                    <motion.div
                                        key={dossier.id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setSelected(selected?.id === dossier.id ? null : dossier)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border bg-white cursor-pointer transition-all hover:shadow-md group
                                            ${selected?.id === dossier.id ? 'ring-2 ring-[#A07850]/30 border-[#A07850]/20 shadow-md' : 'border-gray-50'}`}
                                    >
                                        {/* Star */}
                                        <button onClick={e => { e.stopPropagation(); toggleStar(dossier); }}
                                            className="text-gray-300 hover:text-amber-400 transition-colors shrink-0">
                                            <Star size={16} className={dossier.isStarred ? 'fill-amber-400 text-amber-400' : ''} />
                                        </button>

                                        {/* Type icon */}
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${typeConf.color}`}>
                                            <TypeIcon size={20} />
                                        </div>

                                        {/* Main info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-[#2E2E2E] text-sm uppercase tracking-tight truncate">{dossier.title}</p>
                                                <span className="text-[9px] text-gray-300 font-mono shrink-0">{dossier.caseNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Users size={10} />{dossier.clientName || 'Client non assigné'}
                                                </span>
                                                {dossier.opposingParty && (
                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        vs {dossier.opposingParty}
                                                    </span>
                                                )}
                                                {dossier.jurisdiction && (
                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Building2 size={10} />{dossier.jurisdiction}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${PRIORITY_COLORS[dossier.priority] || ''}`}>
                                            {dossier.priority}
                                        </span>

                                        {/* Type badge */}
                                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${typeConf.color}`}>
                                            {typeConf.label}
                                        </span>

                                        {/* Status */}
                                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}>
                                            <StatusIcon size={10} />{statusConf.label}
                                        </span>

                                        {/* Deadline */}
                                        {deadline && (
                                            <span className={`text-[10px] px-2 py-1 rounded-xl font-semibold ${deadline.color}`}>
                                                {deadline.label}
                                            </span>
                                        )}

                                        {/* Fees */}
                                        {dossier.fees > 0 && (
                                            <span className="text-sm font-semibold text-emerald-600 shrink-0">
                                                {dossier.fees.toLocaleString('fr-FR')}€
                                            </span>
                                        )}

                                        {/* Delete */}
                                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(dossier.id!); }}
                                            className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                            <Trash2 size={14} />
                                        </button>

                                        <ChevronRight size={16} className={`text-gray-300 transition-transform ${selected?.id === dossier.id ? 'rotate-90 text-[#A07850]' : ''}`} />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Detail panel */}
                        <AnimatePresence>
                            {selected && (
                                <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    className="w-[45%] bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#A07850]/5 to-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-[#A07850]/10 flex items-center justify-center">
                                                    <Scale size={22} className="text-[#A07850]" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-[#2E2E2E] uppercase tracking-tight">{selected.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                                        <span className="font-mono">{selected.caseNumber}</span> •
                                                        <span className="flex items-center gap-1"><Users size={10} />{selected.clientName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Quick info */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1"><T>Honoraires</T></p>
                                                <p className="text-lg font-light text-emerald-600">{(selected.fees || 0).toLocaleString('fr-FR')}€</p>
                                                <p className="text-[10px] text-gray-300">Payé: {(selected.feesPaid || 0).toLocaleString('fr-FR')}€</p>
                                            </div>
                                            <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1"><T>Juridiction</T></p>
                                                <p className="text-sm font-medium text-[#2E2E2E]">{selected.jurisdiction || 'N/A'}</p>
                                                {selected.tribunal && <p className="text-[10px] text-gray-300">{selected.tribunal}</p>}
                                            </div>
                                            {selected.opposingParty && (
                                                <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1"><T>Partie adverse</T></p>
                                                    <p className="text-sm font-medium text-[#2E2E2E]">{selected.opposingParty}</p>
                                                    {selected.opposingCounsel && <p className="text-[10px] text-gray-300">Conseil: {selected.opposingCounsel}</p>}
                                                </div>
                                            )}
                                            {selected.judge && (
                                                <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1"><T>Magistrat</T></p>
                                                    <p className="text-sm font-medium text-[#2E2E2E]">{selected.judge}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hearings */}
                                    {selected.hearings && selected.hearings.length > 0 && (
                                        <div className="p-6 border-b border-gray-50">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Gavel size={12} /> Audiences ({selected.hearings.length})
                                            </p>
                                            <div className="space-y-2">
                                                {selected.hearings.map((h, i) => (
                                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${h.completed ? 'bg-gray-50 border-gray-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${h.completed ? 'bg-gray-300' : 'bg-amber-400'}`} />
                                                        <div className="flex-1">
                                                            <p className={`text-xs font-semibold ${h.completed ? 'text-gray-400 line-through' : 'text-[#2E2E2E]'}`}>{h.type}</p>
                                                            <p className="text-[10px] text-gray-400">{h.tribunal} • {format(new Date(h.date), 'd MMM yyyy', { locale: fr })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deadlines */}
                                    {selected.deadlines && selected.deadlines.length > 0 && (
                                        <div className="p-6 border-b border-gray-50">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Clock size={12} /> Échéances ({selected.deadlines.length})
                                            </p>
                                            <div className="space-y-2">
                                                {selected.deadlines.map((dl, i) => (
                                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${dl.completed ? 'bg-gray-50 border-gray-100' : isPast(new Date(dl.date)) ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${dl.completed ? 'bg-gray-300' : isPast(new Date(dl.date)) ? 'bg-red-400' : 'bg-blue-400'}`} />
                                                        <div className="flex-1">
                                                            <p className={`text-xs font-semibold ${dl.completed ? 'text-gray-400 line-through' : 'text-[#2E2E2E]'}`}>{dl.label}</p>
                                                            <p className="text-[10px] text-gray-400">{dl.type} • {format(new Date(dl.date), 'd MMM yyyy', { locale: fr })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {selected.notes && (
                                        <div className="p-6 flex-1">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <FileText size={12} /> Notes & Observations
                                            </p>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                {selected.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="p-6 border-t border-gray-50 space-y-3">
                                        {/* AI Analysis Panel */}
                                        {aiAnalysis && (
                                            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 rounded-2xl p-4 border border-indigo-100/50 mb-3">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                                                        <Sparkles size={10} /> Analyse Gemini
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                                        aiAnalysis.pronostic === 'favorable' ? 'bg-emerald-100 text-emerald-700' :
                                                        aiAnalysis.pronostic === 'défavorable' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>{aiAnalysis.pronostic?.toUpperCase()}</span>
                                                </div>

                                                {aiAnalysis.forces?.length > 0 && (
                                                    <div className="mb-2">
                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1"><T>Forces</T></p>
                                                        {aiAnalysis.forces.slice(0, 3).map((f: any, i: number) => (
                                                            <p key={i} className="text-[10px] text-gray-600 leading-tight mb-0.5">▲ <strong>{f.point}</strong> — {f.detail}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {aiAnalysis.faiblesses?.length > 0 && (
                                                    <div className="mb-2">
                                                        <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1"><T>Faiblesses</T></p>
                                                        {aiAnalysis.faiblesses.slice(0, 3).map((f: any, i: number) => (
                                                            <p key={i} className="text-[10px] text-gray-600 leading-tight mb-0.5">▼ <strong>{f.point}</strong> — {f.detail}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {aiAnalysis.risques?.length > 0 && (
                                                    <div className="mb-2">
                                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Risques</p>
                                                        {aiAnalysis.risques.slice(0, 3).map((r: any, i: number) => (
                                                            <p key={i} className="text-[10px] text-gray-600 leading-tight mb-0.5">⚠ [{r.niveau}] {r.description}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                {aiAnalysis.strategie && (
                                                    <div className="bg-white/60 rounded-xl p-2 mt-2">
                                                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">💡 Stratégie recommandée</p>
                                                        <p className="text-[10px] text-gray-700 leading-relaxed">{aiAnalysis.strategie}</p>
                                                    </div>
                                                )}

                                                {aiAnalysis.jurisprudence?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mb-1">📚 Jurisprudence</p>
                                                        {aiAnalysis.jurisprudence.slice(0, 2).map((j: any, i: number) => (
                                                            <p key={i} className="text-[10px] text-gray-500 leading-tight mb-0.5">• <em>{j.reference}</em> — {j.pertinence}</p>
                                                        ))}
                                                    </div>
                                                )}

                                                <button onClick={() => setAiAnalysis(null)} className="mt-2 text-[9px] text-gray-400 hover:text-gray-600 underline">Fermer l'analyse</button>
                                            </div>
                                        )}

                                        <button
                                            onClick={async () => {
                                                setAiLoading(true);
                                                setAiAnalysis(null);
                                                try {
                                                    const res = await fetch('/api/crm/ai-insights', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            type: 'legal-analysis',
                                                            data: {
                                                                type: selected.type, title: selected.title,
                                                                status: selected.status, jurisdiction: selected.jurisdiction,
                                                                opposingParty: selected.opposingParty, description: selected.notes,
                                                                priority: selected.priority, fees: selected.fees,
                                                                feesPaid: selected.feesPaid,
                                                                hearingCount: selected.hearings?.length || 0,
                                                                deadlineCount: selected.deadlines?.length || 0,
                                                            },
                                                        }),
                                                    });
                                                    if (res.ok) setAiAnalysis(await res.json());
                                                } catch (e) { console.error(e); }
                                                setAiLoading(false);
                                            }}
                                            disabled={aiLoading}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                                        >
                                            {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Analyse en cours...</> : <><Sparkles size={16} /> Analyse IA du dossier</>}
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                                <Calendar size={14} /> Audience
                                            </button>
                                            <button
                                                onClick={() => {
                                                    generateLegalDossierPDF({
                                                        caseNumber: selected.caseNumber,
                                                        title: selected.title,
                                                        type: selected.type,
                                                        status: selected.status,
                                                        priority: selected.priority,
                                                        jurisdiction: selected.jurisdiction,
                                                        chamber: selected.tribunal,
                                                        clientName: selected.clientName,
                                                        opposingParty: selected.opposingParty,
                                                        description: selected.notes,
                                                        hearings: selected.hearings?.map(h => ({
                                                            date: format(new Date(h.date), 'd MMM yyyy', { locale: fr }),
                                                            type: h.type,
                                                            notes: h.notes,
                                                        })),
                                                        deadlines: selected.deadlines?.map(d => ({
                                                            date: format(new Date(d.date), 'd MMM yyyy', { locale: fr }),
                                                            label: d.label,
                                                            done: d.completed,
                                                        })),
                                                        fees: selected.fees,
                                                        feesPaid: selected.feesPaid,
                                                    });
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-gray-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                                            >
                                                <Download size={14} /> Export PDF
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create Dossier Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)}
                title="Nouveau Dossier" subtitle="Ouvrir un nouveau dossier juridique">
                <div className="space-y-4">
                    <ModalField label="Intitulé du dossier *">
                        <input value={newDossier.title} onChange={e => setNewDossier(p => ({ ...p, title: e.target.value }))}
                            placeholder="Ex: Dupont c/ Martin — Litige commercial" className={modalInputClass} />
                    </ModalField>

                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Type de dossier">
                            <select value={newDossier.type} onChange={e => setNewDossier(p => ({ ...p, type: e.target.value as LegalDossierType }))}
                                className={modalSelectClass}>
                                <option value="CIVIL">Civil</option>
                                <option value="PÉNAL">Pénal</option>
                                <option value="COMMERCIAL">Commercial</option>
                                <option value="TRAVAIL">Droit du travail</option>
                                <option value="ADMINISTRATIF">Administratif</option>
                                <option value="FAMILLE">Famille</option>
                                <option value="IMMOBILIER">Immobilier</option>
                                <option value="PROPRIÉTÉ_INTELLECTUELLE">Propriété intellectuelle</option>
                                <option value="AUTRE">Autre</option>
                            </select>
                        </ModalField>
                        <ModalField label="Priorité">
                            <select value={newDossier.priority} onChange={e => setNewDossier(p => ({ ...p, priority: e.target.value as any }))}
                                className={modalSelectClass}>
                                <option value="LOW">Basse</option>
                                <option value="MEDIUM">Moyenne</option>
                                <option value="HIGH">Haute</option>
                                <option value="URGENT">Urgente</option>
                            </select>
                        </ModalField>
                    </div>

                    <ModalField label="Client">
                        <select value={newDossier.clientId} onChange={e => setNewDossier(p => ({ ...p, clientId: e.target.value }))}
                            className={modalSelectClass}>
                            <option value="">Sélectionner un client</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    </ModalField>

                    <ModalField label="Partie adverse">
                        <input value={newDossier.opposingParty} onChange={e => setNewDossier(p => ({ ...p, opposingParty: e.target.value }))}
                            placeholder="Ex: Société ABC, M. Martin..." className={modalInputClass} />
                    </ModalField>

                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Juridiction / Tribunal">
                            <input value={newDossier.jurisdiction} onChange={e => setNewDossier(p => ({ ...p, jurisdiction: e.target.value }))}
                                placeholder="Ex: TGI Paris" className={modalInputClass} />
                        </ModalField>
                        <ModalField label="Chambre / Section">
                            <input value={newDossier.tribunal} onChange={e => setNewDossier(p => ({ ...p, tribunal: e.target.value }))}
                                placeholder="Ex: 3ème chambre civile" className={modalInputClass} />
                        </ModalField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Honoraires prévus (€)">
                            <input type="number" value={newDossier.fees || ''} onChange={e => setNewDossier(p => ({ ...p, fees: +e.target.value }))}
                                placeholder="0" className={modalInputClass} />
                        </ModalField>
                        <ModalField label="Type d'honoraires">
                            <select value={newDossier.feesType} onChange={e => setNewDossier(p => ({ ...p, feesType: e.target.value as any }))}
                                className={modalSelectClass}>
                                <option value="FORFAIT">Forfait</option>
                                <option value="HORAIRE">Horaire</option>
                                <option value="RÉSULTAT">Au résultat</option>
                                <option value="AIDE_JURIDICTIONNELLE">Aide juridictionnelle</option>
                            </select>
                        </ModalField>
                    </div>

                    <ModalField label="Notes initiales">
                        <textarea value={newDossier.notes} onChange={e => setNewDossier(p => ({ ...p, notes: e.target.value }))}
                            rows={3} placeholder="Faits, contexte, observations..." className={`${modalInputClass} resize-none`} />
                    </ModalField>
                </div>
                <ModalActions>
                    <ModalCancelButton onClick={() => setShowModal(false)} />
                    <ModalSubmitButton onClick={handleCreate} disabled={!newDossier.title}>
                        Ouvrir le dossier
                    </ModalSubmitButton>
                </ModalActions>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmModal
                open={!!deleteTarget}
                title="Supprimer ce dossier ?"
                message="Le dossier sera supprimé définitivement."
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
