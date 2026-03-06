'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Plus, X, Calendar, Download,
    Clock, CheckCircle2, CreditCard, Plane, MapPin, Trash2, Edit3,
    ExternalLink, Filter
} from 'lucide-react';
import { getTrips, createTrip, updateTrip, deleteTrip, CRMTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';

// ═══ STATUS CONFIG ═══
const STATUS_CONFIG: Record<CRMTrip['status'], { label: string; color: string; bg: string; icon: typeof Clock }> = {
    DRAFT: { label: 'Brouillon', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
    PROPOSAL: { label: 'Devis', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: Clock },
    CONFIRMED: { label: 'Confirmé', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
    IN_PROGRESS: { label: 'En cours', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Plane },
    COMPLETED: { label: 'Terminé', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: CheckCircle2 },
    CANCELLED: { label: 'Annulé', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: X },
};

const PAYMENT_CONFIG: Record<CRMTrip['paymentStatus'], { label: string; color: string }> = {
    UNPAID: { label: 'Non payé', color: 'text-red-500' },
    DEPOSIT: { label: 'Acompte', color: 'text-amber-500' },
    PAID: { label: 'Payé', color: 'text-emerald-500' },
};

const TRIP_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#dc2626', '#06b6d4', '#ec4899', '#6366f1'];

// ═══ CALENDAR HELPERS ═══
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ═══ EXPORT HELPERS ═══
function formatDateForGoogle(dateStr: string) {
    return dateStr.replace(/-/g, '') + 'T000000Z';
}

function exportToGoogleCalendar(trip: CRMTrip) {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${trip.title} — ${trip.destination}`,
        dates: `${formatDateForGoogle(trip.startDate)}/${formatDateForGoogle(trip.endDate)}`,
        details: `Client: ${trip.clientName}\nStatut: ${STATUS_CONFIG[trip.status].label}\nPaiement: ${PAYMENT_CONFIG[trip.paymentStatus].label}\nMontant: ${trip.amount}€\n${trip.notes}`,
        location: trip.destination,
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
}

function exportToICS(trip: CRMTrip) {
    const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luna//CRM//FR',
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${trip.startDate.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${trip.endDate.replace(/-/g, '')}`,
        `SUMMARY:${trip.title} — ${trip.destination}`,
        `DESCRIPTION:Client: ${trip.clientName}\\nMontant: ${trip.amount}€\\n${trip.notes}`,
        `LOCATION:${trip.destination}`,
        `STATUS:${trip.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
}

// ═══ EMPTY TRIP ═══
const emptyTrip = (): Omit<CRMTrip, 'id' | 'createdAt' | 'updatedAt'> => ({
    title: '', destination: '', clientName: '', clientId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'DRAFT', paymentStatus: 'UNPAID', amount: 0, notes: '', color: TRIP_COLORS[0],
});

// ═══ MAIN COMPONENT ═══
export default function PlanningPage() {
    const { tenantId } = useAuth();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<CRMTrip | null>(null);
    const [form, setForm] = useState(emptyTrip());
    const [filter, setFilter] = useState<CRMTrip['status'] | 'ALL'>('ALL');
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const loadTrips = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try { setTrips(await getTrips(tenantId)); } catch (e) { console.error(e); }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { loadTrips(); }, [loadTrips]);

    // Calendar grid
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    // Filter trips
    const filteredTrips = filter === 'ALL' ? trips : trips.filter(t => t.status === filter);

    // Get trips for a specific day
    const getTripsForDay = (dateStr: string) => filteredTrips.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);

    // Stats
    const monthTrips = trips.filter(t => {
        const s = t.startDate.split('-');
        return parseInt(s[0]) === year && parseInt(s[1]) - 1 === month;
    });
    const totalRevenue = monthTrips.reduce((sum, t) => sum + t.amount, 0);
    const paidCount = monthTrips.filter(t => t.paymentStatus === 'PAID').length;

    // Form handlers
    const openNewTrip = (dateStr?: string) => {
        const f = emptyTrip();
        if (dateStr) { f.startDate = dateStr; f.endDate = dateStr; }
        setForm(f);
        setEditingTrip(null);
        setModalOpen(true);
    };

    const openEditTrip = (trip: CRMTrip) => {
        setForm({
            title: trip.title, destination: trip.destination, clientName: trip.clientName,
            clientId: trip.clientId || '', startDate: trip.startDate, endDate: trip.endDate,
            status: trip.status, paymentStatus: trip.paymentStatus, amount: trip.amount,
            notes: trip.notes, color: trip.color,
        });
        setEditingTrip(trip);
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.destination || !form.clientName) return;
        try {
            if (editingTrip?.id) {
                await updateTrip(tenantId!, editingTrip.id, form);
            } else {
                await createTrip(tenantId!, form);
            }
            setModalOpen(false);
            loadTrips();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async () => {
        if (!editingTrip?.id) return;
        if (!confirm('Supprimer ce voyage ?')) return;
        await deleteTrip(tenantId!, editingTrip.id);
        setModalOpen(false);
        loadTrips();
    };

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-luna-charcoal">Planning</h1>
                    <p className="text-luna-text-muted text-sm mt-0.5">Calendrier des voyages et suivi des paiements</p>
                </div>
                <button onClick={() => openNewTrip()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-luna-charcoal text-white text-sm font-medium rounded-xl hover:bg-[#1a1a1a] transition-all shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <Plus size={16} /> Nouveau voyage
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Voyages ce mois', value: monthTrips.length, icon: Calendar, color: 'text-sky-500' },
                    { label: 'Revenus prévus', value: `${totalRevenue.toLocaleString('fr-FR')}€`, icon: CreditCard, color: 'text-emerald-500' },
                    { label: 'Payés', value: paidCount, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'En attente', value: monthTrips.filter(t => t.status === 'DRAFT').length, icon: Clock, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-[10px] uppercase tracking-[0.15em] text-luna-text-muted font-semibold">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-luna-charcoal">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Month navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter size={14} className="text-luna-text-muted shrink-0" />
                    {(['ALL', ...Object.keys(STATUS_CONFIG)] as Array<CRMTrip['status'] | 'ALL'>).map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === s
                                ? 'bg-luna-charcoal text-white shadow-sm'
                                : 'bg-white/60 text-luna-text-muted hover:bg-white/80 border border-luna-warm-gray/10'
                                }`}>
                            {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s as CRMTrip['status']].label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/80 transition-all"><ChevronLeft size={18} /></button>
                    <h2 className="font-serif text-lg font-semibold text-luna-charcoal min-w-[180px] text-center">{MONTHS[month]} {year}</h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/80 transition-all"><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-luna-warm-gray/10">
                    {DAYS.map(d => (
                        <div key={d} className="py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted">{d}</div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                    {/* Empty cells for days before the 1st */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="min-h-[100px] border-b border-r border-luna-warm-gray/5 bg-luna-cream/20" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTrips = getTripsForDay(dateStr);
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDay;

                        return (
                            <div key={day}
                                onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                                className={`min-h-[100px] border-b border-r border-luna-warm-gray/5 p-1.5 cursor-pointer transition-all hover:bg-sky-50/30
                                    ${isToday ? 'bg-sky-50/40' : ''} ${isSelected ? 'ring-2 ring-sky-400/40 ring-inset' : ''}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday ? 'bg-sky-500 text-white' : 'text-luna-charcoal'}`}>
                                        {day}
                                    </span>
                                    {isSelected && (
                                        <button onClick={(e) => { e.stopPropagation(); openNewTrip(dateStr); }}
                                            className="w-5 h-5 rounded-full bg-luna-charcoal text-white flex items-center justify-center hover:bg-[#1a1a1a] transition-all">
                                            <Plus size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {dayTrips.slice(0, 3).map(trip => (
                                        <button key={trip.id} onClick={(e) => { e.stopPropagation(); openEditTrip(trip); }}
                                            className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-all hover:opacity-80"
                                            style={{ backgroundColor: trip.color + '20', color: trip.color, borderLeft: `2px solid ${trip.color}` }}>
                                            {trip.title}
                                        </button>
                                    ))}
                                    {dayTrips.length > 3 && (
                                        <span className="text-[9px] text-luna-text-muted pl-1.5">+{dayTrips.length - 3} autres</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming trips list */}
            {filteredTrips.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-serif text-lg font-semibold text-luna-charcoal mb-3">Prochains voyages</h3>
                    <div className="flex flex-col gap-2">
                        {filteredTrips.filter(t => t.endDate >= todayStr || t.status === 'IN_PROGRESS').slice(0, 10).map(trip => {
                            const sc = STATUS_CONFIG[trip.status];
                            const pc = PAYMENT_CONFIG[trip.paymentStatus];
                            const StatusIcon = sc.icon;
                            return (
                                <motion.div key={trip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border ${sc.bg} bg-white/60 backdrop-blur-xl shadow-sm cursor-pointer hover:shadow-md transition-all`}
                                    onClick={() => openEditTrip(trip)}>
                                    <div className="w-1 h-12 rounded-full" style={{ backgroundColor: trip.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm text-luna-charcoal truncate">{trip.title}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sc.color} ${sc.bg}`}>
                                                <StatusIcon size={10} className="inline mr-0.5 -mt-0.5" />{sc.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-luna-text-muted">
                                            <span className="flex items-center gap-1"><MapPin size={11} />{trip.destination}</span>
                                            <span>{trip.clientName}</span>
                                            <span>{trip.startDate} → {trip.endDate}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-luna-charcoal">{trip.amount.toLocaleString('fr-FR')}€</p>
                                        <p className={`text-[10px] font-semibold ${pc.color}`}>{pc.label}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); exportToGoogleCalendar(trip); }}
                                            className="p-2 rounded-lg hover:bg-white/80 transition-all" title="Google Calendar">
                                            <ExternalLink size={14} className="text-luna-text-muted" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); exportToICS(trip); }}
                                            className="p-2 rounded-lg hover:bg-white/80 transition-all" title="Apple Calendar (.ics)">
                                            <Download size={14} className="text-luna-text-muted" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-luna-warm-gray/20 border-t-luna-charcoal rounded-full" />
                </div>
            )}

            {/* ═══ MODAL ═══ */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-luna-warm-gray/10"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-luna-warm-gray/10">
                                <h3 className="font-serif text-lg font-semibold text-luna-charcoal">
                                    {editingTrip ? 'Modifier le voyage' : 'Nouveau voyage'}
                                </h3>
                                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
                                {/* Title */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Titre du voyage</label>
                                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                                        placeholder="ex: Séjour Maldives famille Dupont"
                                        className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                </div>

                                {/* Destination + Client */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Destination</label>
                                        <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required
                                            placeholder="Maldives"
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Client</label>
                                        <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required
                                            placeholder="M. Dupont"
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Date départ</label>
                                        <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Date retour</label>
                                        <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                    </div>
                                </div>

                                {/* Status + Payment */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Statut</label>
                                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CRMTrip['status'] }))}
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300">
                                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Paiement</label>
                                        <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as CRMTrip['paymentStatus'] }))}
                                            className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300">
                                            {Object.entries(PAYMENT_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Montant (€)</label>
                                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                                        placeholder="5000"
                                        className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Couleur</label>
                                    <div className="flex gap-2">
                                        {TRIP_COLORS.map(c => (
                                            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                                                className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-luna-charcoal scale-110' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-1.5">Notes</label>
                                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={3} placeholder="Détails supplémentaires..."
                                        className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 resize-none" />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-luna-warm-gray/10">
                                    <div className="flex gap-2">
                                        {editingTrip && (
                                            <>
                                                <button type="button" onClick={handleDelete}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all">
                                                    <Trash2 size={14} /> Supprimer
                                                </button>
                                                <button type="button" onClick={() => exportToGoogleCalendar(editingTrip)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-luna-text-muted hover:bg-luna-cream rounded-xl text-sm font-medium transition-all">
                                                    <ExternalLink size={14} /> Google
                                                </button>
                                                <button type="button" onClick={() => exportToICS(editingTrip)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-luna-text-muted hover:bg-luna-cream rounded-xl text-sm font-medium transition-all">
                                                    <Download size={14} /> .ics
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setModalOpen(false)}
                                            className="px-4 py-2.5 text-sm text-luna-text-muted hover:bg-luna-cream rounded-xl font-medium transition-all">
                                            Annuler
                                        </button>
                                        <button type="submit"
                                            className="px-5 py-2.5 bg-luna-charcoal text-white text-sm font-medium rounded-xl hover:bg-[#1a1a1a] transition-all shadow-sm flex items-center gap-2">
                                            <Edit3 size={14} /> {editingTrip ? 'Modifier' : 'Créer'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
