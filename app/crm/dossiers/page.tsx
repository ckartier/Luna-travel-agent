'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Scale, Search, Plus, X, ChevronRight, Clock, AlertCircle,
    Calendar, FileText, Users, Download, RefreshCcw, Loader2,
    CheckCircle2, Circle, ArrowUpRight, Briefcase, Filter, Tag
} from 'lucide-react';
import { getTrips, createTrip, CRMTrip, getContacts, CRMContact } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';

/* ─── Types ─── */
type DossierStatus = 'active' | 'pending' | 'urgent' | 'closed' | 'PROPOSAL' | 'CONFIRMED' | 'ONGOING';
type DossierType = 'PROCEDURE' | 'CONSEIL' | 'AUDIENCE' | 'EXPERTISE' | string;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active:    { label: 'Actif',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    CONFIRMED: { label: 'Actif',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    ONGOING:   { label: 'En cours', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Circle },
    pending:   { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',     icon: Clock },
    PROPOSAL:  { label: 'Proposition', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Tag },
    urgent:    { label: 'Urgent',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: AlertCircle },
    closed:    { label: 'Clôturé', color: 'text-gray-500',     bg: 'bg-gray-50 border-gray-200',       icon: CheckCircle2 },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    PROCEDURE: { label: 'Procédure', icon: Scale,     color: 'text-blue-600 bg-blue-50' },
    CONSEIL:   { label: 'Conseil',   icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
    AUDIENCE:  { label: 'Audience',  icon: Calendar,  color: 'text-amber-600 bg-amber-50' },
    EXPERTISE: { label: 'Expertise', icon: FileText,  color: 'text-teal-600 bg-teal-50' },
};

function getDeadlineStatus(deadline?: string): { label: string; color: string } | null {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    if (isPast(date)) return { label: `Dépassé`, color: 'text-red-600 bg-red-50' };
    if (isWithinInterval(date, { start: now, end: addDays(now, 7) })) return { label: `Dans ${Math.ceil((date.getTime() - now.getTime()) / 86400000)} j`, color: 'text-amber-600 bg-amber-50' };
    return { label: format(date, 'd MMM', { locale: fr }), color: 'text-gray-500 bg-gray-50' };
}

/* ─── Component ─── */
export default function DossiersPage() {
    const { tenantId } = useAuth();
    const [dossiers, setDossiers] = useState<CRMTrip[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [selected, setSelected] = useState<CRMTrip | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newDossier, setNewDossier] = useState({
        title: '', clientId: '', clientName: '', type: 'PROCEDURE' as DossierType,
        jurisdiction: '', startDate: new Date().toISOString().split('T')[0],
        endDate: '', amount: 0, notes: '',
    });

    const load = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [trips, ctcts] = await Promise.all([getTrips(tenantId), getContacts(tenantId)]);
            setDossiers(trips);
            setContacts(ctcts);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!tenantId || !newDossier.title) return;
        const client = contacts.find(c => c.id === newDossier.clientId);
        await createTrip(tenantId, {
            title: newDossier.title,
            destination: newDossier.jurisdiction || 'France',
            clientId: newDossier.clientId || '',
            clientName: client ? `${client.firstName} ${client.lastName}` : newDossier.clientName,
            startDate: newDossier.startDate,
            endDate: newDossier.endDate || '',
            status: 'IN_PROGRESS',
            paymentStatus: 'UNPAID',
            amount: newDossier.amount || 0,
            notes: `Type: ${newDossier.type}\n${newDossier.notes || ''}`,
            color: '#5a3e91',
        });
        setShowModal(false);
        setNewDossier({ title: '', clientId: '', clientName: '', type: 'PROCEDURE', jurisdiction: '', startDate: new Date().toISOString().split('T')[0], endDate: '', amount: 0, notes: '' });
        load();
    };

    const filtered = dossiers.filter(d => {
        const matchSearch = `${d.title} ${d.clientName} ${d.destination}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || (d.status as string) === filterStatus;
        const noteType = (d.notes || '').match(/Type: (\w+)/)?.[1] || '';
        const matchType = filterType === 'all' || noteType === filterType;
        return matchSearch && matchStatus && matchType;
    });

    const stats = {
        total: dossiers.filter(d => (d.status as string) !== 'closed').length,
        urgent: dossiers.filter(d => (d.status as string) === 'urgent').length,
        thisMonth: dossiers.filter(d => {
            if (!d.startDate) return false;
            const now = new Date();
            const start = new Date(d.startDate);
            return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
        }).length,
        totalFees: dossiers.reduce((sum, d) => sum + (d.amount || 0), 0),
    };

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#5a3e91]/10 flex items-center justify-center">
                                <Scale size={20} className="text-[#5a3e91]" />
                            </div>
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Dossiers</h1>
                        </div>
                        <p className="text-sm text-[#6B7280] font-medium">
                            Gestion des dossiers juridiques •{' '}
                            <span className="text-[#5a3e91]">{stats.total} dossiers actifs</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 text-white"
                        style={{ backgroundColor: '#5a3e91' }}
                    >
                        <Plus size={16} /> Nouveau Dossier
                    </button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Dossiers actifs', value: stats.total, icon: Briefcase, color: 'text-[#5a3e91]' },
                        { label: 'Urgents', value: stats.urgent, icon: AlertCircle, color: 'text-red-600' },
                        { label: 'Ce mois', value: stats.thisMonth, icon: Calendar, color: 'text-blue-600' },
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
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par titre, client, juridiction..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm focus:bg-white focus:shadow-xl transition-all outline-none text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                            {['all', 'ONGOING', 'CONFIRMED', 'PROPOSAL', 'closed'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[#5a3e91] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                            {['all', 'PROCEDURE', 'CONSEIL', 'AUDIENCE'].map(t => (
                                <button key={t} onClick={() => setFilterType(t)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filterType === t ? 'bg-[#5a3e91] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {t === 'all' ? 'Tous' : (TYPE_CONFIG[t]?.label || t)}
                                </button>
                            ))}
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#5a3e91] transition-all shadow-sm">
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Dossiers grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="animate-spin text-[#5a3e91]" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <Scale size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-lg font-light text-gray-400">Aucun dossier trouvé</p>
                        <p className="text-sm text-gray-300 mt-1">Créez votre premier dossier pour commencer.</p>
                    </div>
                ) : (
                    <div className={`flex gap-0 ${selected ? 'flex-row' : 'flex-col'}`}>
                        {/* List */}
                        <div className={`${selected ? 'w-[55%] pr-6' : 'w-full'} space-y-3 transition-all duration-300`}>
                            {filtered.map(dossier => {
                                const noteType = (dossier.notes || '').match(/Type: (\w+)/)?.[1] || 'PROCEDURE';
                                const typeConf = TYPE_CONFIG[noteType] || TYPE_CONFIG.PROCEDURE;
                                const statusConf = STATUS_CONFIG[dossier.status] || STATUS_CONFIG.active;
                                const StatusIcon = statusConf.icon;
                                const TypeIcon = typeConf.icon;
                                const deadline = getDeadlineStatus(dossier.endDate);

                                return (
                                    <motion.div
                                        key={dossier.id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setSelected(selected?.id === dossier.id ? null : dossier)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border bg-white cursor-pointer transition-all hover:shadow-md
                                            ${selected?.id === dossier.id ? 'ring-2 ring-[#5a3e91]/30 border-[#5a3e91]/20 shadow-md' : 'border-gray-50'}`}
                                    >
                                        {/* Type icon */}
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${typeConf.color}`}>
                                            <TypeIcon size={20} />
                                        </div>

                                        {/* Main info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#2E2E2E] text-sm uppercase tracking-tight truncate">{dossier.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Users size={10} />{dossier.clientName || 'Client non assigné'}
                                                </span>
                                                {dossier.destination && dossier.destination !== 'France' && (
                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Scale size={10} />{dossier.destination}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

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
                                        {dossier.amount > 0 && (
                                            <span className="text-sm font-semibold text-emerald-600 shrink-0">
                                                {dossier.amount.toLocaleString('fr-FR')}€
                                            </span>
                                        )}

                                        <ChevronRight size={16} className={`text-gray-300 transition-transform ${selected?.id === dossier.id ? 'rotate-90 text-[#5a3e91]' : ''}`} />
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
                                    <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#5a3e91]/5 to-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-[#5a3e91]/10 flex items-center justify-center">
                                                    <Scale size={22} className="text-[#5a3e91]" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-[#2E2E2E] uppercase tracking-tight">{selected.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Users size={10} />{selected.clientName || 'Client non assigné'}
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
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Honoraires</p>
                                                <p className="text-lg font-light text-emerald-600">{(selected.amount || 0).toLocaleString('fr-FR')}€</p>
                                            </div>
                                            <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Juridiction</p>
                                                <p className="text-sm font-medium text-[#2E2E2E]">{selected.destination || 'N/A'}</p>
                                            </div>
                                            {selected.startDate && (
                                                <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Ouverture</p>
                                                    <p className="text-sm font-medium text-[#2E2E2E]">
                                                        {format(new Date(selected.startDate), 'd MMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                            )}
                                            {selected.endDate && (
                                                <div className="p-3 bg-white rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Échéance</p>
                                                    <p className={`text-sm font-medium ${getDeadlineStatus(selected.endDate)?.color || 'text-[#2E2E2E]'}`}>
                                                        {format(new Date(selected.endDate), 'd MMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selected.notes && (
                                        <div className="p-6 flex-1">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <FileText size={12} /> Notes & Observations
                                            </p>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                {selected.notes.replace(/^Type: \w+\n?/, '')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="p-6 border-t border-gray-50 space-y-3">
                                        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all"
                                            style={{ backgroundColor: '#5a3e91' }}>
                                            <ArrowUpRight size={16} /> Ouvrir le dossier complet
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                                <Calendar size={14} /> Audience
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                                                <Download size={14} /> Export
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

                    <ModalField label="Type de mission">
                        <select value={newDossier.type} onChange={e => setNewDossier(p => ({ ...p, type: e.target.value }))}
                            className={modalSelectClass}>
                            <option value="PROCEDURE">Procédure judiciaire</option>
                            <option value="CONSEIL">Consultation / Conseil</option>
                            <option value="AUDIENCE">Audience</option>
                            <option value="EXPERTISE">Mission d'expertise</option>
                        </select>
                    </ModalField>

                    <ModalField label="Client">
                        <select value={newDossier.clientId} onChange={e => setNewDossier(p => ({ ...p, clientId: e.target.value }))}
                            className={modalSelectClass}>
                            <option value="">Sélectionner un client</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    </ModalField>

                    <ModalField label="Juridiction / Tribunal">
                        <input value={newDossier.jurisdiction} onChange={e => setNewDossier(p => ({ ...p, jurisdiction: e.target.value }))}
                            placeholder="Ex: TGI Paris, Cour d'Appel de Lyon..." className={modalInputClass} />
                    </ModalField>

                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Date d'ouverture">
                            <input type="date" value={newDossier.startDate} onChange={e => setNewDossier(p => ({ ...p, startDate: e.target.value }))}
                                className={modalInputClass} />
                        </ModalField>
                        <ModalField label="Échéance">
                            <input type="date" value={newDossier.endDate} onChange={e => setNewDossier(p => ({ ...p, endDate: e.target.value }))}
                                className={modalInputClass} />
                        </ModalField>
                    </div>

                    <ModalField label="Honoraires prévus (€)">
                        <input type="number" value={newDossier.amount || ''} onChange={e => setNewDossier(p => ({ ...p, amount: +e.target.value }))}
                            placeholder="0" className={modalInputClass} />
                    </ModalField>

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
        </div>
    );
}
