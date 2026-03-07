'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Download,
  Clock, CheckCircle2, CreditCard, Plane, MapPin, Trash2, Edit3,
  ExternalLink, Filter, Users, Briefcase, MessageCircle, Phone,
  Search, RefreshCw
} from 'lucide-react';
import {
  getTrips, createTrip, updateTrip, deleteTrip, CRMTrip,
  getAllSupplierBookings, updateSupplierBooking, createSupplierBooking, CRMSupplierBooking,
  getSuppliers, CRMSupplier, createInvoiceFromBooking
} from '@/src/lib/firebase/crm';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';

// ═══ STATUS CONFIG ═══
const STATUS_CONFIG: Record<CRMTrip['status'], { label: string; color: string; bg: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Brouillon', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  PROPOSAL: { label: 'Devis', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: Clock },
  CONFIRMED: { label: 'Confirmé', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  IN_PROGRESS: { label: 'En cours', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Plane },
  COMPLETED: { label: 'Terminé', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Annulé', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: X },
};

const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PROPOSED: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmé', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  TERMINATED: { label: 'Terminé', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  CANCELLED: { label: 'Annulé', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
  CANCELLED_LATE: { label: 'Annulé (tardif)', color: 'text-red-800', bg: 'bg-red-100', dot: 'bg-red-600' },
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

// ═══ VIEW MODES ═══
type ViewMode = 'ALL' | 'TRIPS' | 'PRESTATIONS';

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
  const [supplierBookings, setSupplierBookings] = useState<CRMSupplierBooking[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<CRMTrip | null>(null);
  const [form, setForm] = useState(emptyTrip());
  const [filter, setFilter] = useState<CRMTrip['status'] | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');
  const [bookingFilter, setBookingFilter] = useState<CRMSupplierBooking['status'] | 'ALL'>('ALL');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<CRMSupplierBooking | null>(null);
  const [reassignBooking, setReassignBooking] = useState<CRMSupplierBooking | null>(null);
  const [reassignSearch, setReassignSearch] = useState('');

  // ═══ LIVE NOTIFICATIONS (Uber-style real-time alerts) ═══
  interface BookingAlert {
    id: string;
    type: 'CONFIRMED' | 'CANCELLED' | 'CANCELLED_LATE' | 'NEW';
    prestationName: string;
    supplierName: string;
    date: string;
    timestamp: Date;
    bookingId: string;
    seen: boolean;
  }
  const [alerts, setAlerts] = useState<BookingAlert[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [lastPollBookings, setLastPollBookings] = useState<Map<string, string>>(new Map());
  const [toastAlert, setToastAlert] = useState<BookingAlert | null>(null);

  // ═══ LOAD ALL DATA (Cross-referenced) ═══
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [tripsData, bookingsData, suppliersData] = await Promise.all([
        getTrips(tenantId),
        getAllSupplierBookings(tenantId),
        getSuppliers(tenantId),
      ]);
      setTrips(tripsData);
      setSupplierBookings(bookingsData);
      setSuppliers(suppliersData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ═══ AUTO-POLL for supplier responses (every 15s) ═══
  useEffect(() => {
    if (!tenantId) return;
    // Request browser notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const interval = setInterval(async () => {
      try {
        const freshBookings = await getAllSupplierBookings(tenantId);
        const newAlerts: BookingAlert[] = [];

        freshBookings.forEach(b => {
          if (!b.id) return;
          const prev = lastPollBookings.get(b.id);

          // Detect status change
          const statusChanged = prev && prev !== b.status &&
            (b.status === 'CONFIRMED' || b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE');

          // Detect new supplier WhatsApp response (even if status was already set)
          const hasNewResponse = (b as any).supplierResponse?.respondedAt &&
            !lastPollBookings.has(`resp_${b.id}`);

          if (statusChanged || hasNewResponse) {
            const sup = suppliers.find(s => s.id === b.supplierId);
            const alert: BookingAlert = {
              id: `${b.id}-${Date.now()}`,
              type: b.status as any,
              prestationName: b.prestationName,
              supplierName: sup?.name || 'Prestataire',
              date: b.date,
              timestamp: new Date(),
              bookingId: b.id,
              seen: false,
            };
            newAlerts.push(alert);

            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`${b.status === 'CONFIRMED' ? '✅' : '❌'} ${sup?.name || 'Prestataire'}`, {
                body: `${b.prestationName} — ${b.status === 'CONFIRMED' ? 'Confirmé' : 'Refusé'}`,
                icon: '/favicon.ico',
              });
            }
          }
        });

        // Update tracking map with statuses + responses
        const newMap = new Map<string, string>();
        freshBookings.forEach(b => {
          if (b.id) {
            newMap.set(b.id, b.status);
            if ((b as any).supplierResponse?.respondedAt) {
              newMap.set(`resp_${b.id}`, 'responded');
            }
          }
        });
        setLastPollBookings(newMap);

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
          setToastAlert(newAlerts[0]);
          setSupplierBookings(freshBookings);
          // Auto-dismiss toast after 10s
          setTimeout(() => setToastAlert(null), 10000);
          // Play notification sound
          try { new Audio('/notification.wav').play().catch(() => { }); } catch { }
        }
      } catch (e) { /* silent poll */ }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [tenantId, lastPollBookings, suppliers]);

  // Initialize poll map on first load
  useEffect(() => {
    const map = new Map<string, string>();
    supplierBookings.forEach(b => { if (b.id) map.set(b.id, b.status); });
    setLastPollBookings(map);
  }, [supplierBookings.length]); // Only re-init when count changes

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Filter trips
  const filteredTrips = filter === 'ALL' ? trips : trips.filter(t => t.status === filter);

  // Filter bookings
  const filteredBookings = bookingFilter === 'ALL' ? supplierBookings : supplierBookings.filter(b => b.status === bookingFilter);

  // Get items for a specific day
  const getTripsForDay = (dateStr: string) => filteredTrips.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);
  const getBookingsForDay = (dateStr: string) => filteredBookings.filter(b => b.date === dateStr);

  // Get supplier name by ID
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Prestataire';

  // Stats (month)
  const monthTrips = trips.filter(t => {
    const s = t.startDate.split('-');
    return parseInt(s[0]) === year && parseInt(s[1]) - 1 === month;
  });
  const monthBookings = supplierBookings.filter(b => {
    const s = b.date.split('-');
    return parseInt(s[0]) === year && parseInt(s[1]) - 1 === month;
  });
  const totalRevenue = monthTrips.reduce((sum, t) => sum + t.amount, 0);
  const confirmedBookings = monthBookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingBookings = monthBookings.filter(b => b.status === 'PROPOSED').length;
  const totalBookingValue = monthBookings.reduce((sum, b) => sum + b.rate + (b.extraFees || 0), 0);

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
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!editingTrip?.id) return;
    if (!confirm('Supprimer ce voyage ?')) return;
    await deleteTrip(tenantId!, editingTrip.id);
    setModalOpen(false);
    loadData();
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto relative">

      {/* ═══ TOAST NOTIFICATION (slides in from top) ═══ */}
      <AnimatePresence>
        {toastAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -60, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl border max-w-md cursor-pointer
              ${toastAlert.type === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-200' :
                toastAlert.type === 'CANCELLED_LATE' ? 'bg-red-100 border-red-300' :
                  'bg-rose-50 border-rose-200'}`}
            onClick={() => {
              const b = supplierBookings.find(sb => sb.id === toastAlert.bookingId);
              if (b) setSelectedBooking(b);
              setToastAlert(null);
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg
                ${toastAlert.type === 'CONFIRMED' ? 'bg-emerald-500' :
                  toastAlert.type === 'CANCELLED_LATE' ? 'bg-red-600' : 'bg-rose-500'}`}>
                {toastAlert.type === 'CONFIRMED' ? '✓' : toastAlert.type === 'CANCELLED_LATE' ? '!!' : '✕'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-luna-charcoal">
                  {toastAlert.type === 'CONFIRMED' ? 'Prestataire a confirmé !' :
                    toastAlert.type === 'CANCELLED_LATE' ? 'ANNULATION TARDIVE !' : 'Prestataire a refusé'}
                </p>
                <p className="text-xs text-luna-text-muted">
                  {toastAlert.supplierName} — {toastAlert.prestationName}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setToastAlert(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER — Premium ═══ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light text-luna-charcoal tracking-tight">Planning</h1>
          <p className="text-luna-text-muted text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Synchronisé en temps réel — {MONTHS[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Activity Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertPanel(!showAlertPanel)}
              className="relative p-3 rounded-2xl bg-white/90 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
            >
              <MessageCircle size={18} className="text-luna-charcoal group-hover:text-sky-600 transition-colors" />
              {alerts.filter(a => !a.seen).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                  {alerts.filter(a => !a.seen).length}
                </span>
              )}
            </button>

            {/* Activity Dropdown Panel */}
            <AnimatePresence>
              {showAlertPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-luna-charcoal">Activité en direct</h4>
                    {alerts.length > 0 && (
                      <button
                        onClick={() => setAlerts(prev => prev.map(a => ({ ...a, seen: true })))}
                        className="text-xs text-sky-500 hover:text-sky-600"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-6 text-center text-luna-text-muted text-sm">
                        <Clock size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Aucune activité récente</p>
                        <p className="text-xs mt-1">Les réponses prestataires apparaîtront ici</p>
                      </div>
                    ) : (
                      alerts.map(alert => (
                        <button
                          key={alert.id}
                          onClick={() => {
                            const b = supplierBookings.find(sb => sb.id === alert.bookingId);
                            if (b) setSelectedBooking(b);
                            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, seen: true } : a));
                            setShowAlertPanel(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-all flex items-center gap-3 border-b border-gray-50
                            ${!alert.seen ? 'bg-sky-50/30' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0
                            ${alert.type === 'CONFIRMED' ? 'bg-emerald-500' :
                              alert.type === 'CANCELLED_LATE' ? 'bg-red-600' : 'bg-rose-500'}`}>
                            {alert.type === 'CONFIRMED' ? <CheckCircle2 size={14} /> : <X size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-luna-charcoal truncate">
                              {alert.supplierName}
                              <span className={`ml-1 font-normal ${alert.type === 'CONFIRMED' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {alert.type === 'CONFIRMED' ? 'a confirmé' :
                                  alert.type === 'CANCELLED_LATE' ? 'ANNULATION TARDIVE' : 'a refusé'}
                              </span>
                            </p>
                            <p className="text-[11px] text-luna-text-muted truncate">{alert.prestationName}</p>
                          </div>
                          <span className="text-[10px] text-luna-text-muted whitespace-nowrap">
                            {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}min
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-[10px] text-center text-luna-text-muted">
                      Actualisation auto toutes les 30 secondes
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => loadData()}
            className="p-3 rounded-2xl bg-white/90 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
            title="Rafraîchir"
          >
            <RefreshCw size={18} className={`text-luna-charcoal group-hover:text-emerald-600 transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={() => openNewTrip()}
            className="bg-luna-charcoal hover:bg-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-gray-200/50 hover:shadow-xl">
            <Plus size={16} /> Nouveau voyage
          </button>
        </div>
      </div>

      {/* ═══ STATS CARDS — Premium Glassmorphism ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Voyages', value: monthTrips.length, icon: Calendar, gradient: 'from-sky-500 to-blue-600', lightBg: 'bg-sky-50' },
          { label: 'Revenus prévus', value: `${totalRevenue.toLocaleString('fr-FR')}€`, icon: CreditCard, gradient: 'from-emerald-500 to-green-600', lightBg: 'bg-emerald-50' },
          { label: 'Prestations', value: monthBookings.length, icon: Briefcase, gradient: 'from-violet-500 to-purple-600', lightBg: 'bg-violet-50' },
          { label: 'Validées', value: confirmedBookings, icon: CheckCircle2, gradient: 'from-emerald-400 to-teal-500', lightBg: 'bg-emerald-50' },
          { label: 'En attente', value: pendingBookings, icon: Clock, gradient: 'from-amber-400 to-orange-500', lightBg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 p-5 overflow-hidden group hover:shadow-lg hover:border-gray-200 transition-all">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-xl ${stat.lightBg} flex items-center justify-center`}>
                <stat.icon size={15} className={`bg-gradient-to-r ${stat.gradient} bg-clip-text`} style={{ color: stat.gradient.includes('sky') ? '#3b82f6' : stat.gradient.includes('emerald') ? '#10b981' : stat.gradient.includes('violet') ? '#8b5cf6' : stat.gradient.includes('amber') ? '#f59e0b' : '#10b981' }} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-gray-400 font-medium">{stat.label}</span>
            </div>
            <p className="text-3xl font-light text-luna-charcoal tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ VIEW MODE TABS ═══ */}
      <div className="flex items-center gap-2 mb-4">
        {([
          { key: 'ALL', label: 'Tout', count: monthTrips.length + monthBookings.length },
          { key: 'TRIPS', label: 'Voyages', count: monthTrips.length },
          { key: 'PRESTATIONS', label: 'Prestations', count: monthBookings.length },
        ] as { key: ViewMode; label: string; count: number }[]).map(tab => (
          <button key={tab.key} onClick={() => setViewMode(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ${viewMode === tab.key
              ? 'bg-luna-charcoal text-white shadow-sm'
              : 'bg-white/60 text-luna-text-muted hover:bg-white/80 border border-luna-warm-gray/10'
              }`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${viewMode === tab.key ? 'bg-white/20' : 'bg-luna-cream'
              }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters + Month navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-luna-text-muted shrink-0" />
          {(viewMode === 'TRIPS' || viewMode === 'ALL') && (
            <>
              {(['ALL', ...Object.keys(STATUS_CONFIG)] as Array<CRMTrip['status'] | 'ALL'>).map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-normal whitespace-nowrap transition-all ${filter === s
                    ? 'bg-luna-charcoal text-white shadow-sm'
                    : 'bg-white/60 text-luna-text-muted hover:bg-white/80 border border-luna-warm-gray/10'
                    }`}>
                  {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s as CRMTrip['status']].label}
                </button>
              ))}
            </>
          )}
          {(viewMode === 'PRESTATIONS' || viewMode === 'ALL') && (
            <>
              <span className="w-px h-5 bg-luna-warm-gray/20 mx-1" />
              {(['ALL', ...Object.keys(BOOKING_STATUS_CONFIG)] as Array<CRMSupplierBooking['status'] | 'ALL'>).map(s => (
                <button key={`b-${s}`} onClick={() => setBookingFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-normal whitespace-nowrap transition-all ${bookingFilter === s
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/60 text-luna-text-muted hover:bg-white/80 border border-luna-warm-gray/10'
                    }`}>
                  {s === 'ALL' ? 'Toutes' : BOOKING_STATUS_CONFIG[s as CRMSupplierBooking['status']]?.label || s}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white/90 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"><ChevronLeft size={18} className="text-luna-charcoal" /></button>
          <h2 className="text-lg font-semibold text-luna-charcoal min-w-[200px] text-center tracking-tight">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white/90 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"><ChevronRight size={18} className="text-luna-charcoal" /></button>
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
            className="ml-2 px-4 py-2 rounded-xl text-xs font-medium bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 transition-all">
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* ═══ CALENDAR GRID — Enlarged & Premium ═══ */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50/80">
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(d => (
            <div key={d} className="py-4 text-center text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[140px] border-b border-r border-gray-50 bg-gray-50/30" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTrips = (viewMode === 'PRESTATIONS') ? [] : getTripsForDay(dateStr);
            const dayBookings = (viewMode === 'TRIPS') ? [] : getBookingsForDay(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const isWeekend = (firstDay + i) % 7 >= 5;

            return (
              <div key={day}
                onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                className={`min-h-[140px] border-b border-r border-gray-50 p-2 cursor-pointer transition-all duration-200
                  ${isWeekend ? 'bg-gray-50/40' : 'bg-white'}
                  ${isToday ? 'bg-sky-50/60 ring-1 ring-inset ring-sky-200' : ''}
                  ${isSelected ? 'ring-2 ring-sky-400 ring-inset bg-sky-50/30 shadow-inner' : ''}
                  hover:bg-sky-50/20`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full font-medium transition-all
                    ${isToday ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : isSelected ? 'bg-luna-charcoal text-white' : 'text-luna-charcoal hover:bg-gray-100'}`}>
                    {day}
                  </span>
                  {isSelected && (
                    <button onClick={(e) => { e.stopPropagation(); openNewTrip(dateStr); }}
                      className="w-7 h-7 rounded-full bg-luna-charcoal text-white flex items-center justify-center hover:bg-gray-800 transition-all shadow-sm">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {/* Trips */}
                  {dayTrips.slice(0, 2).map(trip => (
                    <button key={trip.id} onClick={(e) => { e.stopPropagation(); openEditTrip(trip); }}
                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium truncate transition-all hover:shadow-sm group/item"
                      style={{ backgroundColor: trip.color + '18', color: trip.color, borderLeft: `3px solid ${trip.color}` }}>
                      <span className="truncate">{trip.title}</span>
                    </button>
                  ))}
                  {/* Supplier Bookings (Prestations) */}
                  {dayBookings.slice(0, 2).map(booking => {
                    const bs = BOOKING_STATUS_CONFIG[booking.status];
                    const borderColor = booking.status === 'CONFIRMED' ? '#22c55e' : booking.status === 'CANCELLED' || booking.status === 'CANCELLED_LATE' ? '#ef4444' : '#f59e0b';
                    return (
                      <button key={booking.id} onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium truncate transition-all hover:shadow-sm ${bs.bg} ${bs.color}`}
                        style={{ borderLeft: `3px solid ${borderColor}` }}>
                        {booking.startTime && <span className="opacity-60 mr-1">{booking.startTime}</span>}
                        {booking.prestationName}
                      </button>
                    );
                  })}
                  {(dayTrips.length + dayBookings.length) > 4 && (
                    <span className="text-[10px] text-gray-400 pl-2 font-medium">+{dayTrips.length + dayBookings.length - 4} autres</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ UPCOMING BOOKINGS LIST (Prestations sync WhatsApp) ═══ */}
      {(viewMode === 'ALL' || viewMode === 'PRESTATIONS') && filteredBookings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-light text-luna-charcoal mb-4 flex items-center gap-3">
            Prestations prestataires
            <span className="text-xs px-3 py-1 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-100">{filteredBookings.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBookings.filter(b => b.date >= todayStr || b.status === 'PROPOSED').slice(0, 15).map(booking => {
              const bs = BOOKING_STATUS_CONFIG[booking.status];
              const supplierName = getSupplierName(booking.supplierId);
              return (
                <motion.div key={booking.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border bg-white/90 backdrop-blur-xl shadow-sm cursor-pointer hover:shadow-lg hover:border-gray-200 transition-all group`}
                  onClick={() => setSelectedBooking(booking)}>
                  <div className={`w-1.5 h-14 rounded-full ${bs.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-luna-charcoal truncate">{booking.prestationName}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${bs.color} ${bs.bg} border`}>
                        {bs.label}
                      </span>
                      {booking.supplierResponse && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                          WhatsApp
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1 font-medium text-gray-500"><Users size={12} />{supplierName}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{booking.date}</span>
                      {booking.startTime && <span className="flex items-center gap-1"><Clock size={11} />{booking.startTime}{booking.endTime ? ` → ${booking.endTime}` : ''}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-light text-luna-charcoal">{booking.rate.toLocaleString('fr-FR')}€</p>
                    {(booking.extraFees || 0) > 0 && (
                      <p className="text-[11px] text-amber-500 font-medium">+{booking.extraFees}€ frais</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming trips list */}
      {(viewMode === 'ALL' || viewMode === 'TRIPS') && filteredTrips.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg font-normal text-luna-charcoal mb-3 flex items-center gap-2">
            Prochains voyages
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">{filteredTrips.length}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {filteredTrips.filter(t => t.endDate >= todayStr || t.status === 'IN_PROGRESS').slice(0, 10).map(trip => {
              const sc = STATUS_CONFIG[trip.status];
              const pc = PAYMENT_CONFIG[trip.paymentStatus];
              const StatusIcon = sc.icon;
              // Cross-reference: count bookings linked to this trip's date range
              const tripBookings = supplierBookings.filter(b => b.date >= trip.startDate && b.date <= trip.endDate);
              return (
                <motion.div key={trip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${sc.bg} bg-white/60 backdrop-blur-xl shadow-sm cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => openEditTrip(trip)}>
                  <div className="w-1 h-12 rounded-full" style={{ backgroundColor: trip.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-normal text-sm text-luna-charcoal truncate">{trip.title}</h4>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-normal ${sc.color} ${sc.bg}`}>
                        <StatusIcon size={10} className="inline mr-0.5 -mt-0.5" />{sc.label}
                      </span>
                      {tripBookings.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                          {tripBookings.length} prestation{tripBookings.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-luna-text-muted">
                      <span className="flex items-center gap-1"><MapPin size={11} />{trip.destination}</span>
                      <span>{trip.clientName}</span>
                      <span>{trip.startDate} → {trip.endDate}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-normal text-luna-charcoal">{trip.amount.toLocaleString('fr-FR')}€</p>
                    <p className={`text-[11px] font-normal ${pc.color}`}>{pc.label}</p>
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

      {/* ═══ BOOKING DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-luna-warm-gray/10"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-luna-warm-gray/10">
                <h3 className="font-serif text-lg font-normal text-luna-charcoal">Détail prestation</h3>
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
                      const sup = suppliers.find(s => s.id === selectedBooking.supplierId);
                      return sup?.phone ? <p className="text-xs text-luna-text-muted mt-0.5">📞 {sup.phone}</p> : null;
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
                    <p className="text-sm text-luna-charcoal">
                      {new Date(selectedBooking.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">⏰ Horaire</p>
                    <p className="text-sm text-luna-charcoal">
                      {selectedBooking.startTime || '—'} {selectedBooking.endTime ? `→ ${selectedBooking.endTime}` : ''}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">💰 Tarif</p>
                    <p className="text-lg text-luna-charcoal">{selectedBooking.rate.toLocaleString('fr-FR')}€</p>
                  </div>
                  {(selectedBooking.extraFees || 0) > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Frais extra</p>
                      <p className="text-sm text-amber-600">+{selectedBooking.extraFees}€</p>
                    </div>
                  )}
                </div>
                {selectedBooking.clientName && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">👤 Client</p>
                    <p className="text-sm text-luna-charcoal">{selectedBooking.clientName}</p>
                  </div>
                )}
                {(selectedBooking as any).pickupLocation && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">📍 Lieu de pick-up</p>
                    <p className="text-sm text-luna-charcoal">{(selectedBooking as any).pickupLocation}</p>
                  </div>
                )}
                {(selectedBooking as any).numberOfGuests && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">👥 Personnes</p>
                    <p className="text-sm text-luna-charcoal">{(selectedBooking as any).numberOfGuests}</p>
                  </div>
                )}
                {/* WhatsApp Response Sync */}
                {selectedBooking.supplierResponse && (
                  <div className={`p-3 rounded-xl border ${selectedBooking.supplierResponse.confirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">📱 Réponse WhatsApp</p>
                    <p className={`text-sm font-medium ${selectedBooking.supplierResponse.confirmed ? 'text-emerald-700' : 'text-red-700'}`}>
                      {selectedBooking.supplierResponse.confirmed ? '✅ Validé par ' : '❌ Refusé par '}
                      {selectedBooking.supplierResponse.respondedBy}
                    </p>
                    <p className="text-xs text-luna-text-muted mt-0.5">
                      📞 {selectedBooking.supplierResponse.respondedPhone}
                    </p>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-1">Notes</p>
                    <p className="text-sm text-luna-charcoal">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* ═══ SUPPLIER STATS ═══ */}
                {(() => {
                  const supBookings = supplierBookings.filter(b => b.supplierId === selectedBooking.supplierId);
                  const total = supBookings.length;
                  const confirmed = supBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'TERMINATED').length;
                  const cancelled = supBookings.filter(b => b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE').length;
                  const lateCancels = supBookings.filter(b => (b as any).cancelledLate).length;
                  const revenue = supBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'TERMINATED').reduce((sum, b) => sum + (b.rate || 0), 0);
                  const reliability = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 100;

                  return (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-luna-cream/30 border border-gray-100">
                      <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-2">Stats prestataire</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-luna-charcoal">{total}</p>
                          <p className="text-[10px] text-luna-text-muted">Missions</p>
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${reliability >= 80 ? 'text-emerald-600' : reliability >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{reliability}%</p>
                          <p className="text-[10px] text-luna-text-muted">Fiabilité</p>
                        </div>
                        <div>
                          <p className={`text-lg font-bold ${lateCancels > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lateCancels}</p>
                          <p className="text-[10px] text-luna-text-muted">Retards</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-luna-charcoal">{revenue}€</p>
                          <p className="text-[10px] text-luna-text-muted">Revenu</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Accept / Reject Actions + WhatsApp Notification */}
                {selectedBooking.status === 'PROPOSED' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={async () => {
                        if (!tenantId || !selectedBooking.id) return;
                        await updateSupplierBooking(tenantId, selectedBooking.id, { status: 'CONFIRMED' });
                        // Send WhatsApp confirmation to supplier
                        const sup = suppliers.find(s => s.id === selectedBooking.supplierId);
                        if (sup?.phone) {
                          try {
                            await fetchWithAuth('/api/whatsapp/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: sup.phone,
                                message: `✅ *Booking confirmé !*\n\n${selectedBooking.prestationName}\n📅 ${selectedBooking.date}\n⏰ ${selectedBooking.startTime || ''} - ${selectedBooking.endTime || ''}\n💰 ${selectedBooking.rate}€\n\nMerci ${sup.name} ! À bientôt\n_Luna CRM_`,
                                clientName: sup.name,
                                clientId: sup.id,
                                recipientType: 'SUPPLIER',
                              })
                            });
                          } catch (e) { console.error('WhatsApp confirm error:', e); }
                        }
                        // Auto-generate invoice in Finances
                        try {
                          const supName = suppliers.find(s => s.id === selectedBooking.supplierId)?.name || 'Prestataire';
                          await createInvoiceFromBooking(tenantId, selectedBooking, supName);
                        } catch (e) { console.error('Auto-invoice error:', e); }
                        setSelectedBooking(null);
                        loadData();
                      }}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Accepter
                    </button>
                    <button
                      onClick={async () => {
                        if (!tenantId || !selectedBooking.id) return;
                        await updateSupplierBooking(tenantId, selectedBooking.id, { status: 'CANCELLED' });
                        // Send WhatsApp cancellation to supplier
                        const sup = suppliers.find(s => s.id === selectedBooking.supplierId);
                        if (sup?.phone) {
                          try {
                            await fetchWithAuth('/api/whatsapp/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: sup.phone,
                                message: `❌ *Booking annulé*\n\n🎨 ${selectedBooking.prestationName}\n📅 ${selectedBooking.date}\n\nDésolé ${sup.name}, cette prestation a été annulée.\n_Luna CRM_`,
                                clientName: sup.name,
                                clientId: sup.id,
                                recipientType: 'SUPPLIER',
                              })
                            });
                          } catch (e) { console.error('WhatsApp cancel error:', e); }
                        }
                        setSelectedBooking(null);
                        loadData();
                      }}
                      className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Refuser
                    </button>
                  </div>
                )}

                {/* Cancel & Reassign for CONFIRMED bookings */}
                {selectedBooking.status === 'CONFIRMED' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={async () => {
                        if (!tenantId || !selectedBooking.id) return;
                        await updateSupplierBooking(tenantId, selectedBooking.id, { status: 'CANCELLED' });
                        const sup = suppliers.find(s => s.id === selectedBooking.supplierId);
                        if (sup?.phone) {
                          try {
                            await fetchWithAuth('/api/whatsapp/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: sup.phone,
                                message: `❌ *Prestation annulée*\n\n🎨 ${selectedBooking.prestationName}\n📅 ${selectedBooking.date}\n\nDésolé ${sup.name}, cette prestation a été annulée et sera réassignée.\n_Luna CRM_`,
                                clientName: sup.name,
                                clientId: sup.id,
                                recipientType: 'SUPPLIER',
                              })
                            });
                          } catch (e) { console.error(e); }
                        }
                        // Open reassign modal
                        setReassignBooking(selectedBooking);
                        setSelectedBooking(null);
                      }}
                      className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} /> Annuler & Réassigner
                    </button>
                    <button
                      onClick={async () => {
                        if (!tenantId || !selectedBooking.id) return;
                        await updateSupplierBooking(tenantId, selectedBooking.id, { status: 'CANCELLED' });
                        const sup = suppliers.find(s => s.id === selectedBooking.supplierId);
                        if (sup?.phone) {
                          try {
                            await fetchWithAuth('/api/whatsapp/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: sup.phone,
                                message: `❌ *Prestation annulée*\n\n🎨 ${selectedBooking.prestationName}\n📅 ${selectedBooking.date}\n\nDésolé ${sup.name}, cette prestation a été annulée.\n_Luna CRM_`,
                                clientName: sup.name,
                                clientId: sup.id,
                                recipientType: 'SUPPLIER',
                              })
                            });
                          } catch (e) { console.error(e); }
                        }
                        setSelectedBooking(null);
                        loadData();
                      }}
                      className="py-3 px-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Annuler
                    </button>
                  </div>
                )}

                {/* Validated label for CONFIRMED without buttons */}
                {selectedBooking.status === 'CONFIRMED' ? null : selectedBooking.status === 'CANCELLED' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                    <p className="text-sm font-bold text-rose-600">❌ Prestation annulée</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REASSIGN SUPPLIER MODAL (Uber-style dispatch) ═══ */}
      <AnimatePresence>
        {reassignBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setReassignBooking(null); setReassignSearch(''); }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-luna-warm-gray/10 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="p-5 border-b border-luna-warm-gray/10">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-serif text-lg font-normal text-luna-charcoal">🔄 Réassigner la prestation</h3>
                  <button onClick={() => { setReassignBooking(null); setReassignSearch(''); }} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-luna-text-muted">
                  {reassignBooking.prestationName} • {new Date(reassignBooking.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {reassignBooking.startTime} - {reassignBooking.endTime}
                </p>

                {/* Search */}
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un prestataire..."
                    value={reassignSearch}
                    onChange={e => setReassignSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Supplier list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {suppliers
                  .filter(s => s.id !== reassignBooking.supplierId) // Exclude current supplier
                  .filter(s => !reassignSearch ||
                    s.name.toLowerCase().includes(reassignSearch.toLowerCase()) ||
                    (s.category || '').toLowerCase().includes(reassignSearch.toLowerCase())
                  )
                  .map(sup => (
                    <button
                      key={sup.id}
                      onClick={async () => {
                        if (!tenantId) return;
                        // Create new booking for the new supplier
                        const newBookingData: any = {
                          supplierId: sup.id,
                          prestationId: reassignBooking.prestationId,
                          prestationName: reassignBooking.prestationName,
                          date: reassignBooking.date,
                          startTime: reassignBooking.startTime || '09:00',
                          endTime: reassignBooking.endTime || '12:00',
                          status: 'PROPOSED' as const,
                          rate: reassignBooking.rate,
                          extraFees: reassignBooking.extraFees || 0,
                        };
                        if (reassignBooking.clientId) newBookingData.clientId = reassignBooking.clientId;
                        if (reassignBooking.clientName) newBookingData.clientName = reassignBooking.clientName;
                        if ((reassignBooking as any).pickupLocation) newBookingData.pickupLocation = (reassignBooking as any).pickupLocation;
                        if ((reassignBooking as any).numberOfGuests) newBookingData.numberOfGuests = (reassignBooking as any).numberOfGuests;
                        if (reassignBooking.notes) newBookingData.notes = reassignBooking.notes;

                        const newBookingId = await createSupplierBooking(tenantId, newBookingData);

                        // Send WhatsApp to new supplier
                        if (sup.phone) {
                          try {
                            const waRes = await fetchWithAuth('/api/whatsapp/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: sup.phone,
                                message: `😊 Bonjour ${sup.contactName || sup.name} !\n\nOn aurait besoin de vous pour une prestation 🌟\n\n🎨 *${reassignBooking.prestationName}*\n📅 *Date :* ${new Date(reassignBooking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ *Horaire :* ${reassignBooking.startTime || '?'} - ${reassignBooking.endTime || '?'}\n💰 *Prix :* ${reassignBooking.rate}€\n${reassignBooking.clientName ? `👤 *Client :* ${reassignBooking.clientName}\n` : ''}${(reassignBooking as any).pickupLocation ? `📍 *Pick-up :* ${(reassignBooking as any).pickupLocation}\n` : ''}\n🙏 Merci de confirmer avec les boutons ci-dessous !\n_✨ Luna CRM_`,
                                clientName: sup.name,
                                clientId: sup.id,
                                recipientType: 'SUPPLIER',
                                interactiveButtons: true,
                                bookingId: newBookingId,
                                prestationName: reassignBooking.prestationName,
                              })
                            });
                            const waData = await waRes.json();
                            console.log('[Reassign WhatsApp]', waData.status, 'to', sup.phone);
                          } catch (e) { console.error('[Reassign WhatsApp] Error:', e); }
                        } else {
                          console.warn(`[Reassign] Prestataire ${sup.name} n'a pas de numéro WhatsApp`);
                          alert(`⚠️ ${sup.name} n'a pas de numéro de téléphone. Le message WhatsApp n'a pas pu être envoyé. Ajoutez un numéro dans la fiche prestataire.`);
                        }

                        setReassignBooking(null);
                        setReassignSearch('');
                        loadData();
                      }}
                      className="w-full p-4 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center gap-4 text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {sup.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-luna-charcoal truncate">{sup.name}</p>
                        <div className="flex items-center gap-2 text-xs text-luna-text-muted">
                          {sup.category && <span className="bg-gray-100 px-2 py-0.5 rounded">{sup.category}</span>}
                          {sup.phone && <span>📞 {sup.phone}</span>}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                        <RefreshCw size={16} className="text-amber-500" />
                      </div>
                    </button>
                  ))}
                {suppliers.filter(s => s.id !== reassignBooking.supplierId).length === 0 && (
                  <div className="text-center py-8 text-luna-text-muted text-sm">
                    Aucun autre prestataire disponible
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TRIP MODAL ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-luna-warm-gray/10"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-luna-warm-gray/10">
                <h3 className="font-serif text-lg font-normal text-luna-charcoal">
                  {editingTrip ? 'Modifier le voyage' : 'Nouveau voyage'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Titre du voyage</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                    placeholder="ex: Séjour Maldives famille Dupont"
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                </div>

                {/* Destination + Client */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Destination</label>
                    <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required
                      placeholder="Maldives"
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Client</label>
                    <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required
                      placeholder="M. Dupont"
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Date départ</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Date retour</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                  </div>
                </div>

                {/* Status + Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Statut</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CRMTrip['status'] }))}
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Paiement</label>
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
                  <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Montant (€)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="5000"
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300" />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Couleur</label>
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
                  <label className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted block mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3} placeholder="Détails supplémentaires..."
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 resize-none" />
                </div>

                {/* Cross-referenced bookings for this trip */}
                {editingTrip && (() => {
                  const linkedBookings = supplierBookings.filter(b => b.date >= editingTrip.startDate && b.date <= editingTrip.endDate);
                  if (linkedBookings.length === 0) return null;
                  return (
                    <div className="border-t border-luna-warm-gray/10 pt-3">
                      <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-2">🎨 Prestations liées ({linkedBookings.length})</p>
                      <div className="space-y-1.5">
                        {linkedBookings.map(b => (
                          <div key={b.id} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${BOOKING_STATUS_CONFIG[b.status].bg}`}>
                            <span className={BOOKING_STATUS_CONFIG[b.status].color}>
                              {b.prestationName} — {getSupplierName(b.supplierId)}
                            </span>
                            <span className={`${BOOKING_STATUS_CONFIG[b.status].color} font-medium`}>
                              {BOOKING_STATUS_CONFIG[b.status].label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-luna-warm-gray/10">
                  <div className="flex gap-2">
                    {editingTrip && (
                      <>
                        <button type="button" onClick={handleDelete}
                          className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-normal transition-all">
                          <Trash2 size={14} /> Supprimer
                        </button>
                        <button type="button" onClick={() => exportToGoogleCalendar(editingTrip)}
                          className="flex items-center gap-1.5 px-3 py-2 text-luna-text-muted hover:bg-luna-cream rounded-xl text-sm font-normal transition-all">
                          <ExternalLink size={14} /> Google
                        </button>
                        <button type="button" onClick={() => exportToICS(editingTrip)}
                          className="flex items-center gap-1.5 px-3 py-2 text-luna-text-muted hover:bg-luna-cream rounded-xl text-sm font-normal transition-all">
                          <Download size={14} /> .ics
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 text-sm text-luna-text-muted hover:bg-luna-cream rounded-xl font-normal transition-all">
                      Annuler
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 bg-luna-charcoal text-white text-sm font-normal rounded-xl hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2">
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
