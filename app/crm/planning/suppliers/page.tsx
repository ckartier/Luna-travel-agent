'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, X, Calendar,
    Clock, CheckCircle2, Briefcase, Users, MapPin,
    Filter, Send, MessageCircle, Loader2, Phone, Bell, BellRing, RefreshCw
} from 'lucide-react';
import {
    getAllSupplierBookings, CRMSupplierBooking,
    getSuppliers, CRMSupplier,
    updateSupplierBooking
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

interface SupplierAlert {
    id: string;
    type: 'CONFIRMED' | 'CANCELLED' | 'CANCELLED_LATE';
    prestationName: string;
    supplierName: string;
    date: string;
    timestamp: Date;
    bookingId: string;
    seen: boolean;
}

// ═══ STATUS CONFIG ═══
const BOOKING_STATUS_CONFIG: Record<CRMSupplierBooking['status'], { label: string; color: string; bg: string; dot: string }> = {
    PROPOSED: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
    CONFIRMED: { label: 'Validé ✅', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    TERMINATED: { label: 'Terminé', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
    CANCELLED: { label: 'Annulé ❌', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
    CANCELLED_LATE: { label: 'Annulé tardif ⚠️', color: 'text-red-800', bg: 'bg-red-100', dot: 'bg-red-600' },
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    return (new Date(year, month, 1).getDay() + 6) % 7;
}

export default function SupplierPlanningPage() {
    const { tenantId } = useAuth();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [bookings, setBookings] = useState<CRMSupplierBooking[]>([]);
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<CRMSupplierBooking['status'] | 'ALL'>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<CRMSupplierBooking | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<SupplierAlert[]>([]);
    const [toastAlert, setToastAlert] = useState<SupplierAlert | null>(null);
    const [lastPollMap, setLastPollMap] = useState<Map<string, string>>(new Map());
    const [showAlerts, setShowAlerts] = useState(false);

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [b, s] = await Promise.all([
                getAllSupplierBookings(tenantId),
                getSuppliers(tenantId),
            ]);
            setBookings(b);
            setSuppliers(s);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Initialize poll map
    useEffect(() => {
        const map = new Map<string, string>();
        bookings.forEach(b => {
            if (b.id) {
                map.set(b.id, b.status);
                if ((b as any).supplierResponse?.respondedAt) map.set(`resp_${b.id}`, 'responded');
            }
        });
        setLastPollMap(map);
    }, [bookings.length]);

    // ═══ AUTO-POLL for supplier responses (every 15s) ═══
    useEffect(() => {
        if (!tenantId) return;
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        const interval = setInterval(async () => {
            try {
                const fresh = await getAllSupplierBookings(tenantId);
                const newAlerts: SupplierAlert[] = [];
                fresh.forEach(b => {
                    if (!b.id) return;
                    const prev = lastPollMap.get(b.id);
                    const statusChanged = prev && prev !== b.status &&
                        (b.status === 'CONFIRMED' || b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE');
                    const hasNewResponse = (b as any).supplierResponse?.respondedAt &&
                        !lastPollMap.has(`resp_${b.id}`);
                    if (statusChanged || hasNewResponse) {
                        const sup = suppliers.find(s => s.id === b.supplierId);
                        newAlerts.push({
                            id: `${b.id}-${Date.now()}`,
                            type: b.status as any,
                            prestationName: b.prestationName,
                            supplierName: sup?.name || 'Prestataire',
                            date: b.date,
                            timestamp: new Date(),
                            bookingId: b.id,
                            seen: false,
                        });
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            new Notification(`${b.status === 'CONFIRMED' ? '✅' : '❌'} ${sup?.name || 'Prestataire'}`, {
                                body: `${b.prestationName} — ${b.status === 'CONFIRMED' ? 'Confirmé' : 'Refusé'}`,
                                icon: '/favicon.ico',
                            });
                        }
                    }
                });
                const newMap = new Map<string, string>();
                fresh.forEach(b => {
                    if (b.id) {
                        newMap.set(b.id, b.status);
                        if ((b as any).supplierResponse?.respondedAt) newMap.set(`resp_${b.id}`, 'responded');
                    }
                });
                setLastPollMap(newMap);
                if (newAlerts.length > 0) {
                    setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
                    setToastAlert(newAlerts[0]);
                    setBookings(fresh);
                    setTimeout(() => setToastAlert(null), 10000);
                    try { new Audio('/notification.wav').play().catch(() => { }); } catch { }
                }
            } catch (e) { /* silent */ }
        }, 15000);
        return () => clearInterval(interval);
    }, [tenantId, lastPollMap, suppliers]);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
    const getBookingsForDay = (d: string) => filtered.filter(b => b.date === d);
    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Prestataire';
    const getSupplier = (id: string) => suppliers.find(s => s.id === id);

    // Stats
    const monthBookings = bookings.filter(b => {
        const s = b.date.split('-');
        return parseInt(s[0]) === year && parseInt(s[1]) - 1 === month;
    });
    const confirmed = monthBookings.filter(b => b.status === 'CONFIRMED').length;
    const pending = monthBookings.filter(b => b.status === 'PROPOSED').length;
    const totalValue = monthBookings.reduce((sum, b) => sum + b.rate + (b.extraFees || 0), 0);

    // ═══ VALIDATE BOOKING (sends WhatsApp confirmation) ═══
    const handleValidateBooking = async (booking: CRMSupplierBooking) => {
        if (!tenantId || !booking.id) return;
        setValidatingId(booking.id);
        try {
            const res = await fetchWithAuth('/api/bookings/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id, tenantId }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Prestation validée ! WhatsApp de confirmation ${data.whatsappStatus === 'sent' ? 'envoyé' : 'non envoyé (pas de téléphone)'} à ${data.supplierName}.`);
                loadData();
                setSelectedBooking(null);
            } else {
                alert(`Erreur: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la validation.");
        } finally {
            setValidatingId(null);
        }
    };

    const unseenAlerts = alerts.filter(a => !a.seen).length;

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {/* ═══ TOAST ALERT ═══ */}
            <AnimatePresence>
                {toastAlert && (
                    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                        className={`fixed top-20 right-6 z-[100] max-w-sm p-4 rounded-2xl shadow-2xl border backdrop-blur-xl
                            ${toastAlert.type === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-200' :
                                toastAlert.type === 'CANCELLED_LATE' ? 'bg-red-100 border-red-300' :
                                    'bg-rose-50 border-rose-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg
                                ${toastAlert.type === 'CONFIRMED' ? 'bg-emerald-500' :
                                    toastAlert.type === 'CANCELLED_LATE' ? 'bg-red-600' : 'bg-rose-500'}`}>
                                {toastAlert.type === 'CONFIRMED' ? '✓' : toastAlert.type === 'CANCELLED_LATE' ? '!!' : '✕'}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-luna-charcoal">
                                    {toastAlert.type === 'CONFIRMED' ? 'Prestataire a confirmé !' :
                                        toastAlert.type === 'CANCELLED_LATE' ? 'ANNULATION TARDIVE !' : 'Prestataire a refusé'}
                                </p>
                                <p className="text-xs text-luna-text-muted">
                                    {toastAlert.supplierName} — {toastAlert.prestationName}
                                </p>
                            </div>
                            <button onClick={() => setToastAlert(null)} className="p-1 rounded-lg hover:bg-white/60">
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-light text-luna-charcoal">Planning Prestataires</h1>
                    <p className="text-luna-text-muted text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Synchronisé en temps réel — {MONTHS[month]} {year}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Alert bell */}
                    <div className="relative">
                        <button onClick={() => setShowAlerts(!showAlerts)}
                            className="p-2.5 rounded-xl border border-gray-100 hover:bg-white/80 transition-all relative">
                            {unseenAlerts > 0 ? <BellRing size={18} className="text-amber-500" /> : <Bell size={18} className="text-gray-400" />}
                            {unseenAlerts > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-bounce">
                                    {unseenAlerts}
                                </span>
                            )}
                        </button>
                        {showAlerts && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                    <span className="text-sm font-medium text-luna-charcoal">🔔 Alertes prestataires</span>
                                    <button onClick={() => setAlerts(prev => prev.map(a => ({ ...a, seen: true })))}
                                        className="text-xs text-sky-500 hover:underline">Tout marquer lu</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {alerts.length === 0 ? (
                                        <p className="p-4 text-center text-xs text-luna-text-muted">Aucune alerte</p>
                                    ) : alerts.slice(0, 10).map(alert => (
                                        <div key={alert.id}
                                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-all ${!alert.seen ? 'bg-amber-50/30' : ''}`}
                                            onClick={() => {
                                                setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, seen: true } : a));
                                                const b = bookings.find(sb => sb.id === alert.bookingId);
                                                if (b) setSelectedBooking(b);
                                                setShowAlerts(false);
                                            }}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{alert.type === 'CONFIRMED' ? '✅' : '❌'}</span>
                                                <span className="text-xs font-medium text-luna-charcoal">{alert.supplierName}</span>
                                                {!alert.seen && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
                                            </div>
                                            <p className="text-[11px] text-luna-text-muted mt-0.5">{alert.prestationName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => loadData()}
                        className="p-2.5 rounded-xl border border-gray-100 hover:bg-white/80 transition-all">
                        <RefreshCw size={18} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Ce mois', value: monthBookings.length, icon: Calendar, color: 'text-purple-500' },
                    { label: 'Validées ✅', value: confirmed, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'En attente', value: pending, icon: Clock, color: 'text-amber-500' },
                    { label: 'Valeur totale', value: `${totalValue.toLocaleString('fr-FR')}€`, icon: Briefcase, color: 'text-sky-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-xs uppercase tracking-[0.15em] text-luna-text-muted">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-normal text-luna-charcoal">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Month navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter size={14} className="text-luna-text-muted shrink-0" />
                    {(['ALL', ...Object.keys(BOOKING_STATUS_CONFIG)] as Array<CRMSupplierBooking['status'] | 'ALL'>).map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-normal whitespace-nowrap transition-all ${filter === s
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white/60 text-luna-text-muted hover:bg-white/80 border border-luna-warm-gray/10'
                                }`}>
                            {s === 'ALL' ? '🎨 Toutes' : BOOKING_STATUS_CONFIG[s as CRMSupplierBooking['status']].label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/80 transition-all"><ChevronLeft size={18} /></button>
                    <h2 className="text-lg font-normal text-luna-charcoal min-w-[180px] text-center">{MONTHS[month]} {year}</h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/80 transition-all"><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/10 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-luna-warm-gray/10">
                    {DAYS.map(d => (
                        <div key={d} className="py-3 text-center text-xs uppercase tracking-[0.15em] text-luna-text-muted">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="min-h-[100px] border-b border-r border-luna-warm-gray/5 bg-luna-cream/20" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayBookings = getBookingsForDay(dateStr);
                        const isToday = dateStr === todayStr;

                        return (
                            <div key={day} className={`min-h-[100px] border-b border-r border-luna-warm-gray/5 p-1.5 transition-all hover:bg-purple-50/30 ${isToday ? 'bg-purple-50/40' : ''}`}>
                                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-500 text-white' : 'text-luna-charcoal'}`}>
                                    {day}
                                </span>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    {dayBookings.slice(0, 3).map(b => {
                                        const bs = BOOKING_STATUS_CONFIG[b.status];
                                        return (
                                            <button key={b.id} onClick={() => setSelectedBooking(b)}
                                                className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate transition-all hover:opacity-80 ${bs.bg} ${bs.color}`}
                                                style={{ borderLeft: `2px solid ${b.status === 'CONFIRMED' ? '#22c55e' : b.status === 'CANCELLED' ? '#ef4444' : '#f59e0b'}` }}>
                                                🎨 {b.prestationName}
                                            </button>
                                        );
                                    })}
                                    {dayBookings.length > 3 && (
                                        <span className="text-[10px] text-luna-text-muted pl-1">+{dayBookings.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bookings list */}
            <div className="mt-6">
                <h3 className="text-lg font-normal text-luna-charcoal mb-3 flex items-center gap-2">
                    🎨 Prestations prestataires
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{filtered.length}</span>
                </h3>
                <div className="flex flex-col gap-2">
                    {filtered.filter(b => b.date >= todayStr || b.status === 'PROPOSED').slice(0, 20).map(booking => {
                        const bs = BOOKING_STATUS_CONFIG[booking.status];
                        const supplier = getSupplier(booking.supplierId);
                        return (
                            <motion.div key={booking.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border ${bs.bg} bg-white/60 backdrop-blur-xl shadow-sm cursor-pointer hover:shadow-md transition-all`}
                                onClick={() => setSelectedBooking(booking)}>
                                <div className={`w-2 h-12 rounded-full ${bs.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-normal text-sm text-luna-charcoal truncate">🎨 {booking.prestationName}</h4>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${bs.color} ${bs.bg} border`}>
                                            {bs.label}
                                        </span>
                                        {booking.supplierResponse && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                                📱 Répondu WhatsApp
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-luna-text-muted">
                                        <span className="flex items-center gap-1"><Users size={11} />{supplier?.name || 'Prestataire'}</span>
                                        <span>📅 {booking.date}</span>
                                        {booking.startTime && <span>⏰ {booking.startTime}{booking.endTime ? ` - ${booking.endTime}` : ''}</span>}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-normal text-luna-charcoal">{booking.rate.toLocaleString('fr-FR')}€</p>
                                </div>
                                {booking.status === 'PROPOSED' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleValidateBooking(booking); }}
                                        disabled={validatingId === booking.id}
                                        className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {validatingId === booking.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                        Valider
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-luna-warm-gray/20 border-t-purple-500 rounded-full" />
                </div>
            )}

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedBooking(null)}>
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-luna-warm-gray/10"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-luna-warm-gray/10">
                                <h3 className="text-lg font-normal text-luna-charcoal">🎨 Détail prestation</h3>
                                <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Prestation</p>
                                    <p className="text-lg font-normal text-luna-charcoal">{selectedBooking.prestationName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Prestataire</p>
                                        <p className="text-sm text-luna-charcoal">{getSupplierName(selectedBooking.supplierId)}</p>
                                        {(() => {
                                            const s = getSupplier(selectedBooking.supplierId);
                                            return s?.phone ? <p className="text-xs text-luna-text-muted flex items-center gap-1 mt-0.5"><Phone size={10} /> {s.phone}</p> : null;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Statut</p>
                                        <span className={`text-sm px-3 py-1 rounded-full ${BOOKING_STATUS_CONFIG[selectedBooking.status].bg} ${BOOKING_STATUS_CONFIG[selectedBooking.status].color} border`}>
                                            {BOOKING_STATUS_CONFIG[selectedBooking.status].label}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">📅 Date</p>
                                        <p className="text-sm text-luna-charcoal">{selectedBooking.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">💰 Tarif</p>
                                        <p className="text-lg text-luna-charcoal">{selectedBooking.rate.toLocaleString('fr-FR')}€</p>
                                    </div>
                                </div>
                                {selectedBooking.supplierResponse && (
                                    <div className={`p-3 rounded-xl border ${selectedBooking.supplierResponse.confirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">📱 Réponse WhatsApp</p>
                                        <p className={`text-sm font-medium ${selectedBooking.supplierResponse.confirmed ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {selectedBooking.supplierResponse.confirmed ? '✅ Validé par ' : '❌ Refusé par '}
                                            {selectedBooking.supplierResponse.respondedBy}
                                        </p>
                                    </div>
                                )}
                                {selectedBooking.notes && (
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Notes</p>
                                        <p className="text-sm text-luna-charcoal">{selectedBooking.notes}</p>
                                    </div>
                                )}

                                {/* VALIDATE BUTTON */}
                                {selectedBooking.status === 'PROPOSED' && (
                                    <button
                                        onClick={() => handleValidateBooking(selectedBooking)}
                                        disabled={!!validatingId}
                                        className="w-full py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {validatingId === selectedBooking.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        Valider & Envoyer Rappel WhatsApp
                                    </button>
                                )}
                                {selectedBooking.status === 'CONFIRMED' && (
                                    <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium text-center border border-emerald-200">
                                        ✅ Prestation validée par Luna
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
