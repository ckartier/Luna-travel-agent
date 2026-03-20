'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, X, Calendar,
    CheckCircle2, Users, RefreshCw,
    XCircle, UsersRound, ArrowRight, Loader2, Send, Palmtree
} from 'lucide-react';
import {
    getAllSupplierBookings, CRMSupplierBooking,
    getSuppliers, CRMSupplier,
    updateSupplierBooking
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { format, addDays, startOfWeek, endOfWeek, isSameMonth, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { T } from '@/src/components/T';

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

const BOOKING_STATUS_CONFIG: Record<CRMSupplierBooking['status'], { label: string; color: string; bg: string; dot: string }> = {
    PROPOSED: { label: 'En attente', color: 'text-[#2E2E2E]', bg: 'bg-[#E6D2BD]/20', dot: 'bg-gradient-to-br from-[#E2C8A9] to-[#d2b899] border border-white/40 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.8)]' },
    CONFIRMED: { label: 'Validé', color: 'text-[#2E2E2E]', bg: 'bg-[#A8C6BF]/20', dot: 'bg-gradient-to-br from-[#A8C6BF] to-[#98b6af] border border-white/40 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.8)]' },
    TERMINATED: { label: 'Terminé', color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', dot: 'bg-gradient-to-br from-[#F3F4F6] to-[#e3e4e6] border border-white/40 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.8)]' },
    CANCELLED: { label: 'Refusé', color: 'text-[#2E2E2E]', bg: 'bg-[#F2D9D3]/20', dot: 'bg-gradient-to-br from-[#F2D9D3] to-[#e2c9c3] border border-white/40 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.8)]' },
    CANCELLED_LATE: { label: 'Refusé (tardif)', color: 'text-[#2E2E2E]', bg: 'bg-[#F2D9D3]/40', dot: 'bg-gradient-to-br from-[#E5C9C1] to-[#d5b9b1] border border-white/40 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.8)]' },
};

const DAYS_FULL = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

// ═══ Jours Fériés France 2026 ═══
const JOURS_FERIES_2026: Record<string, string> = {
    '2026-01-01': 'Nouvel An',
    '2026-04-06': 'Lundi de Pâques',
    '2026-05-01': 'Fête du Travail',
    '2026-05-08': 'Victoire 1945',
    '2026-05-14': 'Ascension',
    '2026-05-25': 'Lundi de Pentecôte',
    '2026-07-14': 'Fête Nationale',
    '2026-08-15': 'Assomption',
    '2026-11-01': 'Toussaint',
    '2026-11-11': 'Armistice 1918',
    '2026-12-25': 'Noël',
};

// ═══ Vacances Scolaires 2025-2026 (Zone C - Paris) ═══
const VACANCES_SCOLAIRES: { label: string; start: string; end: string }[] = [
    { label: 'Vacances Hiver', start: '2026-02-14', end: '2026-03-02' },
    { label: 'Vacances Printemps', start: '2026-04-11', end: '2026-04-27' },
    { label: 'Vacances Été', start: '2026-07-04', end: '2026-09-01' },
    { label: 'Vacances Toussaint', start: '2026-10-17', end: '2026-11-02' },
    { label: 'Vacances Noël', start: '2026-12-19', end: '2027-01-04' },
];

function isJourFerie(dateStr: string): string | null {
    return JOURS_FERIES_2026[dateStr] || null;
}

function getVacance(dateStr: string): string | null {
    for (const v of VACANCES_SCOLAIRES) {
        if (dateStr >= v.start && dateStr <= v.end) return v.label;
    }
    return null;
}

export default function SupplierPlanningPage() {
    const { tenantId } = useAuth();
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [bookings, setBookings] = useState<CRMSupplierBooking[]>([]);
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<CRMSupplierBooking['status'] | 'ALL'>('ALL');
    const [selectedBooking, setSelectedBooking] = useState<CRMSupplierBooking | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [reassigningId, setReassigningId] = useState<string | null>(null);
    const [reassignLoadingId, setReassignLoadingId] = useState<string | null>(null);
    const [toastAlert, setToastAlert] = useState<SupplierAlert | null>(null);
    const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('WEEK');
    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedSupplierForRecap, setSelectedSupplierForRecap] = useState<string | null>(null);
    const [showVacationModal, setShowVacationModal] = useState(false);
    const [vacationSupplier, setVacationSupplier] = useState<string | null>(null);
    const [vacationStart, setVacationStart] = useState('');
    const [vacationEnd, setVacationEnd] = useState('');

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [b, s] = await Promise.all([
                getAllSupplierBookings(tenantId),
                getSuppliers(tenantId),
            ]);
            setBookings(b || []);
            setSuppliers(s || []);
        } catch (e) {
            console.error(e);
            setBookings([]);
            setSuppliers([]);
        }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { loadData(); }, [loadData]);

    const todayStr = format(today, 'yyyy-MM-dd');

    // Week Logic
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const getWeekDays = () => Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    const nextPeriod = () => setCurrentDate(d => viewMode === 'WEEK' ? addDays(d, 7) : addDays(d, 30));
    const prevPeriod = () => setCurrentDate(d => viewMode === 'WEEK' ? addDays(d, -7) : addDays(d, -30));

    // Month Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = Array.from({ length: monthEnd.getDate() }).map((_, i) => addDays(monthStart, i));
    const monthFirstDayIdx = (getDay(monthStart) + 6) % 7; // Monday start

    const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
    const getBookingsForDay = (d: string) => filtered.filter(b => b.date === d);
    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Prestataire';

    // Stats based on currently viewed month
    const visibleMonthBookings = bookings.filter(b => isSameMonth(new Date(b.date), currentDate));
    const totalValue = visibleMonthBookings.reduce((sum, b) => sum + (b.rate || 0), 0);

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
                setToastAlert({ id: `val-${Date.now()}`, type: 'CONFIRMED', prestationName: booking.prestationName, supplierName: getSupplierName(booking.supplierId), date: booking.date, timestamp: new Date(), bookingId: booking.id, seen: true });
                setTimeout(() => setToastAlert(null), 3000);
                loadData();
                setSelectedBooking(null);
            }
        } catch (e) { console.error(e); }
        finally { setValidatingId(null); }
    };

    const handleCancelBooking = async (booking: CRMSupplierBooking) => {
        if (!tenantId || !booking.id) return;
        setCancellingId(booking.id);
        try {
            await updateSupplierBooking(tenantId, booking.id, {
                status: 'CANCELLED',
                notes: `${booking.notes || ''}\n[ANNULATION le ${new Date().toLocaleDateString()}]`
            });
            const supplier = suppliers.find(s => s.id === booking.supplierId);
            if (supplier?.phone) {
                await fetchWithAuth('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: supplier.phone,
                        message: `ANNULATION : "${booking.prestationName}" du ${booking.date} annulée.`,
                        recipientType: 'SUPPLIER',
                    })
                });
            }
            setSelectedBooking(null);
            loadData();
        } catch (e) { console.error(e); }
        finally { setCancellingId(null); }
    };

    // ═══ FIX: Reassign uses deleteField() for Firestore ═══
    const handleReassign = async (booking: CRMSupplierBooking, newSupplierId: string) => {
        if (!tenantId || !booking.id) return;
        setReassignLoadingId(newSupplierId);
        try {
            // Use raw Firestore updateDoc with deleteField() to properly remove supplierResponse
            const bookingRef = doc(db, 'tenants', tenantId, 'supplier_bookings', booking.id);
            await updateDoc(bookingRef, {
                supplierId: newSupplierId,
                status: 'PROPOSED',
                supplierResponse: deleteField(),
                updatedAt: new Date()
            });

            // Send WhatsApp to new supplier
            const supplier = suppliers.find(s => s.id === newSupplierId);
            if (supplier?.phone) {
                const dateClean = format(new Date(booking.date), 'dd/MM/yyyy');
                const msg = `*MISSION*\nBonjour ${supplier.name},\nMission pour vous :\n*${booking.prestationName}*\n*${dateClean}* à ${booking.startTime || 'à préciser'}\n*${booking.rate}€*\nConfirmez via le bouton ci-dessous.`;
                try {
                    await fetchWithAuth('/api/whatsapp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: supplier.phone,
                            message: msg,
                            recipientType: 'SUPPLIER',
                            bookingId: booking.id,
                            clientName: supplier.name,
                            clientId: supplier.id,
                            interactiveButtons: true
                        })
                    });
                } catch (waErr) {
                    console.error('WhatsApp send error (non-blocking):', waErr);
                }
                setToastAlert({ id: `re-${Date.now()}`, type: 'CONFIRMED', prestationName: `Réassigné → ${supplier.name}`, supplierName: supplier.name, date: booking.date, timestamp: new Date(), bookingId: booking.id, seen: true });
            } else {
                setToastAlert({ id: `re-${Date.now()}`, type: 'CONFIRMED', prestationName: `Réassigné (pas de tél.)`, supplierName: supplier?.name || 'Inconnu', date: booking.date, timestamp: new Date(), bookingId: booking.id, seen: true });
            }
            setTimeout(() => setToastAlert(null), 4000);
            // Clean up state in correct order
            setReassigningId(null);
            setReassignLoadingId(null);
            setSelectedBooking(null);
            loadData();
        } catch (e) {
            console.error('Reassign error:', e);
            setToastAlert({ id: `err-${Date.now()}`, type: 'CANCELLED', prestationName: 'Erreur réassignation', supplierName: 'Voir console', date: '', timestamp: new Date(), bookingId: booking.id || '', seen: true });
            setTimeout(() => setToastAlert(null), 4000);
            setReassignLoadingId(null);
        }
    };

    const handleSendRecap = async (supplierId: string, range: 'DAY' | 'WEEK' | 'MONTH') => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier?.phone) return alert("Pas de téléphone enregistré.");

        let start = new Date();
        let end = new Date();
        let label = "";

        if (range === 'DAY') {
            label = "Aujourd'hui";
            end = addDays(start, 1);
        } else if (range === 'WEEK') {
            start = startOfWeek(new Date(), { weekStartsOn: 1 });
            end = endOfWeek(new Date(), { weekStartsOn: 1 });
            label = "cette Semaine";
        } else {
            start = startOfMonth(new Date());
            end = endOfMonth(new Date());
            label = `le mois de ${format(new Date(), 'MMMM', { locale: fr })}`;
        }

        const relevant = bookings.filter(b =>
            b.supplierId === supplierId &&
            b.date >= format(start, 'yyyy-MM-dd') &&
            b.date <= format(end, 'yyyy-MM-dd') &&
            b.status !== 'CANCELLED'
        ).sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));

        if (relevant.length === 0) return alert("Aucune mission prévue sur cette période.");

        const missionsStr = relevant.map(b => `• *${format(new Date(b.date), 'dd/MM')} à ${b.startTime || '--:--'}* : ${b.prestationName}`).join('\n');
        const message = `*RECAPITULATIF PLANNING*\n\nBonjour ${supplier.name},\nVoici votre planning pour ${label} :\n\n${missionsStr}\n\nMerci de nous valider la bonne réception de ce message.`;

        try {
            await fetchWithAuth('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: supplier.phone,
                    message,
                    recipientType: 'SUPPLIER',
                    clientName: supplier.name,
                    clientId: supplier.id
                })
            });
            setShowSendModal(false);
            setToastAlert({ id: `send-${Date.now()}`, type: 'CONFIRMED', prestationName: 'Planning Envoyé', supplierName: supplier.name, date: '', timestamp: new Date(), bookingId: '', seen: true });
            setTimeout(() => setToastAlert(null), 3000);
        } catch (e) { alert("Erreur lors de l'envoi WhatsApp."); }
    };

    // ═══ Set supplier on vacation ═══
    const handleSetVacation = async () => {
        if (!tenantId || !vacationSupplier || !vacationStart || !vacationEnd) return;
        const supplier = suppliers.find(s => s.id === vacationSupplier);
        if (!supplier) return;

        try {
            // Update supplier doc with vacation dates
            const supplierRef = doc(db, 'tenants', tenantId, 'suppliers', vacationSupplier);
            await updateDoc(supplierRef, {
                vacationStart,
                vacationEnd,
                onVacation: true,
                updatedAt: new Date()
            });

            // Notify via WhatsApp
            if (supplier.phone) {
                const msg = `*VACANCES ENREGISTRÉES*\n\nBonjour ${supplier.name},\nVos vacances ont été enregistrées du *${format(new Date(vacationStart), 'dd/MM/yyyy')}* au *${format(new Date(vacationEnd), 'dd/MM/yyyy')}*.\n\nAucune mission ne vous sera assignée pendant cette période.\n\n_Votre Conciergerie_`;
                await fetchWithAuth('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: supplier.phone, message: msg, recipientType: 'SUPPLIER', clientName: supplier.name, clientId: supplier.id })
                });
            }

            setShowVacationModal(false);
            setVacationSupplier(null);
            setVacationStart('');
            setVacationEnd('');
            setToastAlert({ id: `vac-${Date.now()}`, type: 'CONFIRMED', prestationName: 'Vacances enregistrées', supplierName: supplier.name, date: '', timestamp: new Date(), bookingId: '', seen: true });
            setTimeout(() => setToastAlert(null), 3000);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'enregistrement des vacances.");
        }
    };

    // Helper: check if supplier is on vacation for a given date
    const isSupplierOnVacation = (supplierId: string, dateStr: string) => {
        const supplier = suppliers.find(s => s.id === supplierId) as any;
        if (!supplier?.onVacation || !supplier?.vacationStart || !supplier?.vacationEnd) return false;
        return dateStr >= supplier.vacationStart && dateStr <= supplier.vacationEnd;
    };

    return (
        <div className="w-full h-full">
            <AnimatePresence>
                {toastAlert && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed bottom-8 right-8 z-[100] p-5 rounded-[24px] shadow-2xl border flex items-center gap-4 ${toastAlert.type === 'CONFIRMED' ? 'bg-[#D3E8E3] border-[#B8D9D1]' : 'bg-[#F2D9D3] border-[#E5C9C1]'}`}>
                        <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">{toastAlert.type === 'CONFIRMED' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}</div>
                        <div><p className="font-bold text-[#2E2E2E]">{toastAlert.supplierName}</p><p className="text-xs text-[#6B7280]">{toastAlert.prestationName}</p></div>
                        <button onClick={() => setToastAlert(null)} className="ml-4 p-2 hover:bg-black/5 rounded-full"><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Executive Planning</T></h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Logistique & Synchronisation Prestataires</T></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowVacationModal(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-[#2E2E2E] rounded-[16px] text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all border border-[#E5E7EB] active:scale-95">
                            <Palmtree size={16} /> Vacances
                        </button>
                        <button onClick={() => setShowSendModal(true)} className="flex items-center gap-2 px-6 py-3 bg-[#2E2E2E] text-white rounded-[16px] text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all shadow-lg active:scale-95">
                            <Send size={16} /> Envoyer Planning
                        </button>
                        <div className="flex items-center bg-white p-1 rounded-[16px] border border-[#E5E7EB] shadow-sm">
                            <button onClick={() => setViewMode('WEEK')} className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'WEEK' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-50'}`}>Semaine</button>
                            <button onClick={() => setViewMode('MONTH')} className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'MONTH' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-50'}`}>Mois</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-8 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-white rounded-[16px] border border-[#E5E7EB] p-1.5 shadow-sm">
                            <button onClick={prevPeriod} className="p-2 hover:bg-gray-50 rounded-[10px] text-[#2E2E2E]"><ChevronLeft size={20} /></button>
                            <span className="px-4 font-bold text-[#2E2E2E] min-w-[200px] text-center uppercase tracking-tight">
                                {viewMode === 'MONTH' ? format(currentDate, 'MMMM yyyy', { locale: fr }) : `Semaine du ${format(currentWeekStart, 'dd MMM', { locale: fr })}`}
                            </span>
                            <button onClick={nextPeriod} className="p-2 hover:bg-gray-50 rounded-[10px] text-[#2E2E2E]"><ChevronRight size={20} /></button>
                        </div>
                        <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-4">
                            <button onClick={() => setFilter('ALL')} className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all border ${filter === 'ALL' ? 'bg-[#2E2E2E] text-white border-[#2E2E2E] shadow-lg' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>Tous</button>
                            <button onClick={() => setFilter('PROPOSED')} className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all border ${filter === 'PROPOSED' ? 'bg-[#E6D2BD] text-[#2E2E2E] border-[#D9C3AC] shadow-md' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>En Attente</button>
                            <button onClick={() => setFilter('CONFIRMED')} className={`px-4 py-2.5 rounded-[14px] text-xs font-bold transition-all border ${filter === 'CONFIRMED' ? 'bg-[#D3E8E3] text-[#2E2E2E] border-[#B8D9D1] shadow-md' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>Validés</button>
                            <button onClick={loadData} className="p-3 bg-white rounded-full border border-gray-100 shadow-sm hover:rotate-180 transition-all duration-500"><RefreshCw size={16} /></button>
                        </div>
                    </div>
                    <div className="lg:col-span-4 flex justify-end">
                        <div className="bg-[#2E2E2E] text-white px-6 py-4 rounded-[24px] shadow-xl flex items-center gap-6">
                            <div><p className="text-[10px] uppercase opacity-50 font-bold mb-0.5">Missions</p><p className="text-xl font-bold">{visibleMonthBookings.length}</p></div>
                            <div className="w-px h-8 bg-white/20" />
                            <div><p className="text-[10px] uppercase opacity-50 font-bold mb-0.5">Valeur</p><p className="text-xl font-bold">{totalValue.toLocaleString('fr-FR')}€</p></div>
                        </div>
                    </div>
                </div>

                {viewMode === 'WEEK' ? (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {getWeekDays().map((dayDate, idx) => {
                            const ds = format(dayDate, 'yyyy-MM-dd');
                            const dayBookings = getBookingsForDay(ds);
                            const isCurrentDay = ds === todayStr;
                            const ferie = isJourFerie(ds);
                            const vacance = getVacance(ds);
                            return (
                                <motion.div key={ds} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                    className={`flex flex-col min-h-[600px] rounded-[32px] p-4 transition-all border
                                        ${ferie ? 'bg-[#2E2E2E] border-[#2E2E2E]' : isCurrentDay ? 'bg-white border-[#bcdeea] shadow-md' : 'bg-white border-transparent shadow-sm hover:shadow'}`}>
                                    <div className="mb-6 px-2">
                                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${ferie ? 'text-white/50' : 'text-[#6B7280]'}`}>{DAYS_FULL[idx]}</p>
                                        <div className="flex items-end justify-between">
                                            <h3 className={`text-3xl font-bold ${ferie ? 'text-white' : isCurrentDay ? 'text-[#2E2E2E]' : 'text-[#6B7280]'}`}>{dayDate.getDate()}</h3>
                                            <div className="flex flex-col items-end gap-1">
                                                {ferie && <span className="text-[8px] bg-white/20 text-white px-2 py-1 rounded-full font-bold uppercase tracking-tighter">{ferie}</span>}
                                                {vacance && <span className="text-[7px] bg-amber-400/20 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter flex items-center gap-1"><Palmtree size={8} />{vacance}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                                        {dayBookings.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-2"><Calendar size={32} className={ferie ? 'text-white' : 'text-[#6B7280]'} /><p className={`text-[10px] font-bold uppercase ${ferie ? 'text-white' : ''}`}>{ferie ? 'Férié' : 'Libre'}</p></div>
                                        ) : (
                                            dayBookings.map(b => {
                                                const bsConfig = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PROPOSED;
                                                return (
                                                    <motion.button key={b.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedBooking(b)}
                                                        className={`w-full text-left p-3 rounded-[20px] border border-transparent shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${bsConfig.bg}`}>
                                                        <div className={`absolute top-0 right-0 px-2 h-6 flex items-center justify-center text-[7px] font-black uppercase tracking-wide rounded-bl-[12px] opacity-90
                                                          ${b.status === 'CONFIRMED' ? 'bg-[#A8C6BF] text-[#1e3a45]' : b.status === 'PROPOSED' ? 'bg-[#E2C8A9] text-[#8B6E4E]' : b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE' ? 'bg-[#F2D9D3] text-[#da3832]' : 'bg-gray-200 text-gray-500'}`}>
                                                            {bsConfig.label}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mb-1 pl-1">
                                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${bsConfig.dot}`} />
                                                            <p className="text-[9px] font-bold text-[#6B7280]">{b.startTime || '--:--'}</p>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-[#2E2E2E] leading-tight mb-2 pr-8">{b.prestationName}</h4>
                                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5">
                                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[8px] font-bold shadow-sm">{getSupplierName(b.supplierId).charAt(0)}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] font-medium text-[#2E2E2E] truncate">{getSupplierName(b.supplierId)}</p>
                                                                <p className="text-[8px] text-[#6B7280] font-medium">
                                                                    {isSupplierOnVacation(b.supplierId, b.date) ? 'En vacances' : 'Prestataire'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-[40px] border border-[#E5E7EB] p-8">
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS_FULL.map(d => <div key={d} className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{d}</div>)}
                            {Array.from({ length: monthFirstDayIdx }).map((_, i) => <div key={`empty-${i}`} className="min-h-[120px] m-0.5" />)}
                            {monthDays.map(day => {
                                const ds = format(day, 'yyyy-MM-dd');
                                const dayBookings = getBookingsForDay(ds);
                                const isToday = ds === todayStr;
                                const ferie = isJourFerie(ds);
                                const vacance = getVacance(ds);
                                return (
                                    <div key={ds} className={`min-h-[120px] p-3 rounded-[20px] m-0.5 border transition-all overflow-hidden
                                        ${ferie ? 'border-[#2E2E2E] bg-[#2E2E2E]' : isToday ? 'border-[#bcdeea] bg-[#FAFBFF]' : vacance ? 'border-amber-200 bg-amber-50/30' : 'border-gray-50'} hover:border-gray-200`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`text-xs font-bold ${ferie ? 'text-white' : isToday ? 'text-sky-600' : 'text-gray-400'}`}>{day.getDate()}</p>
                                            {ferie && <span className="text-[6px] text-white/60 font-bold uppercase truncate ml-1">{ferie}</span>}
                                            {vacance && !ferie && <Palmtree size={8} className="text-amber-400" />}
                                        </div>
                                        <div className="space-y-1">
                                            {dayBookings.slice(0, 3).map(b => {
                                                const bsConfig = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PROPOSED;
                                                return (
                                                    <div key={b.id} onClick={() => setSelectedBooking(b)} className={`w-full text-[7px] p-1 rounded-lg truncate cursor-pointer font-bold text-left flex items-center gap-1.5 ${bsConfig.bg}`}>
                                                        <div className={`w-2 h-2 flex-shrink-0 rounded-full ${bsConfig.dot}`} />
                                                        <span className="truncate">{b.startTime || '--:--'} {b.prestationName}</span>
                                                    </div>
                                                )
                                            })}
                                            {dayBookings.length > 3 && <p className="text-[8px] text-gray-400 font-bold ml-1">+{dayBookings.length - 3} autres</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ BOOKING DETAIL MODAL ═══ */}
            <AnimatePresence>
                {selectedBooking && selectedBooking.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-luna-charcoal/60 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
                        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }} className="bg-white rounded-[40px] w-full max-w-xl relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            {/* Luna Header */}
                            <div className="p-8 pb-5 bg-luna-charcoal text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-light tracking-tight">{selectedBooking.prestationName}</h2>
                                        <p className="text-[#b9dae9] text-xs mt-1 font-medium flex items-center gap-2"><Users size={14} /> {selectedBooking.clientName} · {selectedBooking.date} à {selectedBooking.startTime || '--:--'}</p>
                                    </div>
                                    <button onClick={() => setSelectedBooking(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-[#FAFAF8] rounded-[28px] border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prestataire Actuel</p><p className="text-lg font-bold text-[#2E2E2E]">{getSupplierName(selectedBooking.supplierId)}</p></div>
                                    <div className="p-6 bg-[#FAFAF8] rounded-[28px] border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tarif Net</p><p className="text-2xl font-bold text-[#2E2E2E]">{selectedBooking.rate}€</p></div>
                                </div>
                                <div className="space-y-3">
                                    {selectedBooking.status === 'PROPOSED' && (
                                        <button onClick={() => handleValidateBooking(selectedBooking)} disabled={!!validatingId} className="w-full py-5 bg-[#D3E8E3] text-[#2E2E2E] rounded-[24px] font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                            {validatingId ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Valider Prestation
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setReassigningId(prev => prev === selectedBooking.id ? null : selectedBooking.id!)} className={`py-5 bg-[#E6D2BD] text-[#2E2E2E] rounded-[24px] font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ${reassigningId === selectedBooking.id ? 'ring-2 ring-[#2E2E2E]' : ''}`}><UsersRound size={18} /> Réassigner</button>
                                        <button onClick={() => handleCancelBooking(selectedBooking)} disabled={!!cancellingId} className="py-5 bg-[#F2D9D3] text-[#2E2E2E] rounded-[24px] font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3">{cancellingId ? <Loader2 className="animate-spin" /> : <XCircle size={18} />} Annuler</button>
                                    </div>
                                </div>
                                {reassigningId === selectedBooking.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between"><h4 className="text-[10px] font-bold text-[#2E2E2E] uppercase tracking-widest">Sélectionner un nouveau prestataire</h4><button onClick={() => setReassigningId(null)} className="text-xs font-bold text-gray-400">FERMER</button></div>
                                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                            {suppliers.filter(s => s.id !== selectedBooking.supplierId).map(s => (
                                                <button key={s.id} onClick={() => handleReassign(selectedBooking, s.id!)}
                                                    disabled={!!reassignLoadingId}
                                                    className="w-full p-4 bg-white border border-gray-100 rounded-[20px] hover:border-[#bcdeea] hover:shadow-lg transition-all text-left flex items-center justify-between group disabled:opacity-50">
                                                    <div>
                                                        <p className="font-bold text-[#2E2E2E]">{s.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{s.category}</p>
                                                        {isSupplierOnVacation(s.id!, selectedBooking.date) && <p className="text-[9px] text-amber-500 font-bold mt-1">En vacances ce jour</p>}
                                                    </div>
                                                    <div className="p-2 rounded-full bg-gray-50 group-hover:bg-[#bcdeea] transition-colors">
                                                        {reassignLoadingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ SEND RECAP MODAL ═══ */}
            <AnimatePresence>
                {showSendModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-luna-charcoal/60 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowSendModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }} className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Luna Header */}
                            <div className="p-8 pb-5 bg-luna-charcoal text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-light tracking-tight"><T>Envoyer Planning</T></h3>
                                        <p className="text-[#b9dae9] text-xs mt-1 font-medium">Récapitulatif WhatsApp Luna Executive</p>
                                    </div>
                                    <button onClick={() => setShowSendModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">1. Choisir le Prestataire</p>
                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                        {suppliers.map(s => (
                                            <button key={s.id}
                                                onClick={() => setSelectedSupplierForRecap(s.id!)}
                                                className={`w-full p-4 border rounded-[20px] text-left transition-all group ${selectedSupplierForRecap === s.id ? 'bg-[#bcdeea]/20 border-[#bcdeea]' : 'bg-white border-gray-100 hover:border-[#bcdeea]'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`font-bold text-sm ${selectedSupplierForRecap === s.id ? 'text-[#1e3a45]' : 'text-[#2E2E2E]'}`}>{s.name}</p>
                                                        <p className="text-[9px] text-[#6B7280] font-bold uppercase">{s.category}</p>
                                                    </div>
                                                    {selectedSupplierForRecap === s.id && <div className="w-2 h-2 rounded-full bg-[#bcdeea]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">2. Choisir la Période</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['DAY', 'WEEK', 'MONTH'] as const).map(period => (
                                            <button
                                                key={period}
                                                type="button"
                                                disabled={!selectedSupplierForRecap}
                                                onClick={() => { if (selectedSupplierForRecap) handleSendRecap(selectedSupplierForRecap, period); }}
                                                className={`py-3 rounded-[16px] text-[10px] font-bold uppercase tracking-widest transition-all border active:scale-95 ${selectedSupplierForRecap
                                                    ? 'bg-gray-50 border-transparent hover:bg-[#bcdeea]/40 hover:border-[#bcdeea] cursor-pointer'
                                                    : 'bg-gray-50/50 border-transparent text-gray-300 cursor-not-allowed'
                                                    }`}
                                            >
                                                {period === 'DAY' ? 'Jour' : period === 'WEEK' ? 'Semaine' : 'Mois'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center italic">* L'envoi se fait via WhatsApp au format premium Luna Executive.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ VACATION MODAL ═══ */}
            <AnimatePresence>
                {showVacationModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-luna-charcoal/60 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowVacationModal(false)}>
                        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }} className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Luna Header */}
                            <div className="p-8 pb-5 bg-luna-charcoal text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-light tracking-tight flex items-center gap-2"><Palmtree size={20} /> Gérer les Vacances</h3>
                                        <p className="text-[#b9dae9] text-xs mt-1 font-medium">Bloquer les créneaux prestataire</p>
                                    </div>
                                    <button onClick={() => setShowVacationModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">1. Choisir le Prestataire</p>
                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                                        {suppliers.map(s => (
                                            <button key={s.id}
                                                onClick={() => setVacationSupplier(s.id!)}
                                                className={`w-full p-4 border rounded-[20px] text-left transition-all ${vacationSupplier === s.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100 hover:border-amber-200'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`font-bold text-sm ${vacationSupplier === s.id ? 'text-amber-800' : 'text-[#2E2E2E]'}`}>{s.name}</p>
                                                        <p className="text-[9px] text-[#6B7280] font-bold uppercase">{s.category}</p>
                                                        {(s as any).onVacation && <p className="text-[8px] text-amber-500 font-bold mt-1">En vacances: {(s as any).vacationStart} → {(s as any).vacationEnd}</p>}
                                                    </div>
                                                    {vacationSupplier === s.id && <Palmtree size={16} className="text-amber-500" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {vacationSupplier && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-gray-100 space-y-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Période de Vacances</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block"><T>Début</T></label>
                                                <input type="date" value={vacationStart} onChange={e => setVacationStart(e.target.value)}
                                                    className="w-full p-3 border border-gray-200 rounded-[16px] text-sm focus:outline-none focus:border-amber-400" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block"><T>Fin</T></label>
                                                <input type="date" value={vacationEnd} onChange={e => setVacationEnd(e.target.value)}
                                                    className="w-full p-3 border border-gray-200 rounded-[16px] text-sm focus:outline-none focus:border-amber-400" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSetVacation}
                                            disabled={!vacationStart || !vacationEnd}
                                            className="w-full py-4 bg-amber-400 text-[#2E2E2E] rounded-[20px] font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                                            <Palmtree size={16} /> Enregistrer les Vacances
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
