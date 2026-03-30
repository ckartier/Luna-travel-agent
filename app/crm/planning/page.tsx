'use client';

import { useState, useEffect, useCallback } from 'react';
import { T } from '@/src/components/T';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, X, Calendar,
  Clock, CheckCircle2, Plane, MapPin, Trash2,
  ExternalLink, Users, Briefcase, FileText,
  RefreshCw, Hotel, Car, UtensilsCrossed, Download, CreditCard, Palmtree, ShoppingCart, ZoomIn, ZoomOut
} from 'lucide-react';
import {
  getTrips, createTrip, updateTrip, deleteTrip, CRMTrip,
  getAllSupplierBookings, updateSupplierBooking, CRMSupplierBooking,
  getSuppliers, CRMSupplier, createInvoiceFromBooking, getCatalogItems, CRMCatalogItem,
  getLeads, CRMLead
} from '@/src/lib/firebase/crm';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useVertical } from '@/src/contexts/VerticalContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// ═══ NEW COLOR PALETTE ═══
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; hex: string }> = {
  HOTEL: { bg: 'bg-[#B9B6D6]/20', border: 'border-[#B9B6D6]', text: 'text-[#6B6499]', hex: '#B9B6D6' },
  FLIGHT: { bg: 'bg-[#A8C6BF]/20', border: 'border-[#A8C6BF]', text: 'text-[#5A8A7E]', hex: '#A8C6BF' },
  ACTIVITY: { bg: 'bg-[#A8C6BF]/20', border: 'border-[#A8C6BF]', text: 'text-[#5A8A7E]', hex: '#A8C6BF' },
  TRANSFER: { bg: 'bg-[#E2C8A9]/20', border: 'border-[#E2C8A9]', text: 'text-[#9A7B52]', hex: '#E2C8A9' },
  DINING: { bg: 'bg-[#D9B3BE]/20', border: 'border-[#D9B3BE]', text: 'text-[#9A6B7A]', hex: '#D9B3BE' },
  RESTAURANT: { bg: 'bg-[#D9B3BE]/20', border: 'border-[#D9B3BE]', text: 'text-[#9A6B7A]', hex: '#D9B3BE' },
  OTHER: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', hex: '#9CA3AF' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  'HOTEL': 'H', 'TRANSFER': 'T', 'RESTAURANT': 'R', 'DINING': 'R',
  'ACTIVITY': 'A', 'EXPERIENCE': 'E', 'FLIGHT': 'V', 'OTHER': '•'
};

const STATUS_CONFIG: Record<CRMTrip['status'], { label: string; color: string; bg: string; icon: typeof Clock; dot: string }> = {
  DRAFT: { label: 'Brouillon', color: 'text-[#2E2E2E]', bg: 'bg-[#F3F4F6]', icon: Clock, dot: 'bg-gradient-to-br from-[#E5E7EB] to-[#9CA3AF] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  PROPOSAL: { label: 'En attente', color: 'text-[#2E2E2E]', bg: 'bg-[#E2C8A9]', icon: Clock, dot: 'bg-gradient-to-br from-[#F5DFBF] to-[#C8AE8E] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  CONFIRMED: { label: 'Validé', color: 'text-[#2E2E2E]', bg: 'bg-[#A8C6BF]', icon: CheckCircle2, dot: 'bg-gradient-to-br from-[#C4E0D9] to-[#8CAAA3] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  IN_PROGRESS: { label: 'En cours', color: 'text-[#2E2E2E]', bg: 'bg-[#bcdeea]', icon: Plane, dot: 'bg-gradient-to-br from-[#D9F4FE] to-[#A2C2CE] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  COMPLETED: { label: 'Terminé', color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', icon: CheckCircle2, dot: 'bg-gradient-to-br from-[#E5E7EB] to-[#9CA3AF] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  CANCELLED: { label: 'Annulé', color: 'text-[#2E2E2E]', bg: 'bg-[#F2D9D3]', icon: X, dot: 'bg-gradient-to-br from-[#FF7A75] to-[#C02621] border border-white/50 shadow-[0px_1px_2px_rgba(0,0,0,0.15),inset_-1px_-1px_2px_rgba(0,0,0,0.15),inset_1px_1px_2px_rgba(255,255,255,0.5)]' },
};

const BOOKING_STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  PENDING: { label: 'En attente', bg: 'bg-[#E2C8A9]/30', dot: 'bg-gradient-to-br from-[#F5DFBF] to-[#C8AE8E] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  PROPOSED: { label: 'En attente', bg: 'bg-[#E2C8A9]/30', dot: 'bg-gradient-to-br from-[#F5DFBF] to-[#C8AE8E] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  CONFIRMED: { label: 'Validé', bg: 'bg-[#A8C6BF]/30', dot: 'bg-gradient-to-br from-[#C4E0D9] to-[#8CAAA3] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  TERMINATED: { label: 'Terminé', bg: 'bg-[#F3F4F6]', dot: 'bg-gradient-to-br from-[#E5E7EB] to-[#9CA3AF] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
  CANCELLED: { label: 'Refusé', bg: 'bg-[#F2D9D3]/30', dot: 'bg-gradient-to-br from-[#FF7A75] to-[#C02621] border border-white/50 shadow-[0px_1px_2px_rgba(0,0,0,0.15),inset_-1px_-1px_2px_rgba(0,0,0,0.15),inset_1px_1px_2px_rgba(255,255,255,0.5)]' },
  CANCELLED_LATE: { label: 'Refusé tard', bg: 'bg-[#F2D9D3]/30', dot: 'bg-gradient-to-br from-[#F8DED6] to-[#CCAFA7] border border-white/60 shadow-[0px_1px_2px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.8)]' },
};

const PAYMENT_CONFIG: Record<CRMTrip['paymentStatus'], { label: string; color: string }> = {
  UNPAID: { label: 'Non payé', color: 'text-[#da3832]' },
  DEPOSIT: { label: 'Acompte', color: 'text-[#E2C8A9]' },
  PAID: { label: 'Payé', color: 'text-[#A8C6BF]' },
};

const TRIP_COLORS = ['#bcdeea', '#B9B6D6', '#A8C6BF', '#E2C8A9', '#D9B3BE', '#06b6d4', '#8b5cf6', '#F2D9D3'];
const DAYS_FULL = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const CATEGORIES = [
  { value: 'HOTEL', label: 'Hôtel', icon: Hotel, color: '#B9B6D6' },
  { value: 'FLIGHT', label: 'Vol', icon: Plane, color: '#A8C6BF' },
  { value: 'ACTIVITY', label: 'Activité', icon: MapPin, color: '#A8C6BF' },
  { value: 'TRANSFER', label: 'Transfert', icon: Car, color: '#E2C8A9' },
  { value: 'DINING', label: 'Gastronomie', icon: UtensilsCrossed, color: '#D9B3BE' },
  { value: 'OTHER', label: 'Autre', icon: Briefcase, color: '#9CA3AF' },
];

// ═══ Jours Fériés 2026 ═══
const JOURS_FERIES: Record<string, string> = {
  '2026-01-01': 'Nouvel An', '2026-04-06': 'Lundi de Pâques', '2026-05-01': 'Fête du Travail',
  '2026-05-08': 'Victoire 1945', '2026-05-14': 'Ascension', '2026-05-25': 'Pentecôte',
  '2026-07-14': 'Fête Nationale', '2026-08-15': 'Assomption', '2026-11-01': 'Toussaint',
  '2026-11-11': 'Armistice', '2026-12-25': 'Noël',
};

const VACANCES: { label: string; start: string; end: string }[] = [
  { label: 'Vac. Hiver', start: '2026-02-14', end: '2026-03-02' },
  { label: 'Vac. Printemps', start: '2026-04-11', end: '2026-04-27' },
  { label: 'Vac. Été', start: '2026-07-04', end: '2026-09-01' },
  { label: 'Vac. Toussaint', start: '2026-10-17', end: '2026-11-02' },
  { label: 'Vac. Noël', start: '2026-12-19', end: '2027-01-04' },
];

function isJourFerie(d: string) { return JOURS_FERIES[d] || null; }
function getVacance(d: string) { for (const v of VACANCES) { if (d >= v.start && d <= v.end) return v.label; } return null; }

function exportToGoogleCalendar(trip: CRMTrip) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: `${trip.title} — ${trip.destination}`, dates: `${trip.startDate.replace(/-/g, '')}T000000Z/${trip.endDate.replace(/-/g, '')}T000000Z`, details: `Client: ${trip.clientName}\nMontant: ${trip.amount}€`, location: trip.destination });
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
}

function exportToICS(trip: CRMTrip) {
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART;VALUE=DATE:${trip.startDate.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${trip.endDate.replace(/-/g, '')}`, `SUMMARY:${trip.title}`, `LOCATION:${trip.destination}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${trip.title.replace(/\s+/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url);
}

const emptyTrip = (): Omit<CRMTrip, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '', destination: '', clientName: '', clientId: '',
  startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  status: 'DRAFT', paymentStatus: 'UNPAID', amount: 0, notes: '', color: TRIP_COLORS[0],
});

// ═══ MAIN COMPONENT ═══
export default function PlanningPage() {
  const { tenantId, user } = useAuth();
  const { vertical, vEntity, vt } = useVertical();
  const isLegal = vertical.id === 'legal';
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [trips, setTrips] = useState<CRMTrip[]>([]);
  const [bookings, setBookings] = useState<CRMSupplierBooking[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [catalogItems, setCatalogItems] = useState<CRMCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [filter, setFilter] = useState<CRMTrip['status'] | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<CRMTrip | null>(null);
  const [form, setForm] = useState(emptyTrip());
  const [selectedBooking, setSelectedBooking] = useState<CRMSupplierBooking | null>(null);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [expandedTripsDays, setExpandedTripsDays] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(60);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null); 
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);

  const toggleDayTrips = (ds: string) => {
    setExpandedTripsDays(prev => ({ ...prev, [ds]: !prev[ds] }));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('bookingId', id);
    setDraggedBookingId(id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData('bookingId');
    if (!bookingId) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const START_HOUR = 7;
    let MathHour = Math.floor(y / zoomLevel) + START_HOUR;
    let MathMin = Math.floor(((y % zoomLevel) / zoomLevel) * 60);
    const snappedMin = Math.round(MathMin / 15) * 15;
    
    if (snappedMin === 60) { MathHour += 1; MathMin = 0; }
    else MathMin = snappedMin;
    
    if (MathHour > 23) MathHour = 23;
    if (MathHour < START_HOUR) MathHour = START_HOUR;
    
    const startTime = `${MathHour.toString().padStart(2, '0')}:${MathMin.toString().padStart(2, '0')}`;
    
    try {
      await updateSupplierBooking(tenantId!, bookingId, { date: dateStr, startTime });
      
      // Send WhatsApp notification to supplier about the schedule change
      const movedBooking = bookings.find(b => b.id === bookingId);
      if (movedBooking) {
        const supplier = suppliers.find(s => s.id === movedBooking.supplierId);
        if (supplier?.phone) {
          const dateClean = format(new Date(dateStr), 'EEEE dd/MM/yyyy', { locale: fr });
          try {
            await fetchWithAuth('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: supplier.phone,
                message: `📅 *CHANGEMENT D'HORAIRE*\n\nBonjour ${supplier.name},\nVotre prestation *"${movedBooking.prestationName}"* a été déplacée :\n\n📅 *${dateClean}*\n⏰ *${startTime}*\n\nMerci de prendre note de ce changement.\n_Votre Conciergerie_`,
                recipientType: 'SUPPLIER',
                clientName: supplier.name,
                clientId: supplier.id,
              })
            });
          } catch (waErr) { console.error('WhatsApp drag notification error:', waErr); }
        }
      }
      
      loadData();
    } catch (err) { console.error(err); }
    setDraggedBookingId(null);
  };

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const currentVertical = isLegal ? 'legal' : 'travel';
    try {
      // Phase 1: Load trips first → instant render (filtered by vertical)
      const allTrips = await getTrips(tenantId);
      const verticalTrips = (allTrips || []).filter(t => (t.vertical || 'travel') === currentVertical);
      setTrips(verticalTrips);
      setLoading(false);

      // Phase 2: Load secondary data in background
      const [b, s, c, l] = await Promise.all([getAllSupplierBookings(tenantId), getSuppliers(tenantId), getCatalogItems(tenantId), getLeads(tenantId)]);
      setBookings(b || []); setSuppliers(s || []); setCatalogItems(c || []); setLeads((l || []).filter(lead => (lead.vertical || 'travel') === currentVertical));
    } catch (e) { console.error(e); setLoading(false); }
  }, [tenantId, isLegal]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const getWeekDays = () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const monthStart2 = startOfMonth(currentDate);
  const monthEnd2 = endOfMonth(currentDate);
  const monthDays = Array.from({ length: monthEnd2.getDate() }).map((_, i) => addDays(monthStart2, i));
  const monthFirstDayIdx = (getDay(monthStart2) + 6) % 7;

  const nextPeriod = () => setCurrentDate(d => viewMode === 'WEEK' ? addDays(d, 7) : addDays(d, 30));
  const prevPeriod = () => setCurrentDate(d => viewMode === 'WEEK' ? addDays(d, -7) : addDays(d, -30));

  const filteredTrips = filter === 'ALL' ? trips : trips.filter(t => t.status === filter);
  const filteredBookings = categoryFilter === 'ALL' ? bookings : bookings.filter(b => {
    const item = catalogItems.find(c => c.id === b.prestationId);
    return item?.type === categoryFilter || (categoryFilter === 'DINING' && item?.type === 'OTHER');
  });

  const getTripsForDay = (d: string) => filteredTrips.filter(t => t.startDate <= d && t.endDate >= d);
  const getBookingsForDay = (d: string) => filteredBookings.filter(b => b.date === d);
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Prestataire';

  // Stats
  const monthTrips = trips.filter(t => isSameMonth(new Date(t.startDate), currentDate));
  const monthBookings = bookings.filter(b => isSameMonth(new Date(b.date), currentDate));
  const totalRevenue = monthTrips.reduce((sum, t) => sum + t.amount, 0);

  const openNewTrip = (dateStr?: string) => {
    const f = emptyTrip();
    if (dateStr) {
      f.startDate = dateStr;
      f.endDate = dateStr;
    }
    setForm(f);
    setEditingTrip(null);
    setModalOpen(true);
  };

  const openEditTrip = (trip: CRMTrip) => {
    setForm({
      title: trip.title,
      destination: trip.destination,
      clientName: trip.clientName,
      clientId: trip.clientId || '',
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      paymentStatus: trip.paymentStatus,
      amount: trip.amount,
      notes: trip.notes,
      color: trip.color,
    });
    setEditingTrip(trip);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.destination || !form.clientName) return;

    try {
      const shouldSyncProValidation =
        !isLegal &&
        editingTrip?.source === 'pro-workflow' &&
        form.status === 'CONFIRMED' &&
        editingTrip.proWorkflowState !== 'LUNA_VALIDATED';

      const nowIso = new Date().toISOString();
      const dataWithVertical = {
        ...form,
        vertical: isLegal ? 'legal' : 'travel',
        ...(shouldSyncProValidation
          ? {
              proWorkflowState: 'LUNA_VALIDATED',
              proWorkflowUpdatedAt: nowIso,
              proWorkflowUpdatedBy: user?.uid || '',
              proWorkflowValidatedAt: nowIso,
              proLunaAlertSeen: false,
              proLunaAlertAt: nowIso,
              lunaTripValidated: true,
              lunaReservationValidated: true,
            }
          : {}),
      };

      if (editingTrip?.id) {
        await updateTrip(tenantId!, editingTrip.id, dataWithVertical);
      } else {
        await createTrip(tenantId!, dataWithVertical);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!editingTrip?.id || !confirm(isLegal ? 'Supprimer ce dossier ?' : 'Supprimer ce voyage ?')) return;
    await deleteTrip(tenantId!, editingTrip.id);
    setModalOpen(false);
    loadData();
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col flex-1 overflow-hidden gap-4">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>{vt(vertical.aiAgent.subtitle)}</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">{vEntity('tripPlural')} • {format(currentDate, 'MMMM yyyy', { locale: fr })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => openNewTrip()} className="flex items-center gap-2 px-6 py-3 bg-[#bcdeea] text-[#2E2E2E] rounded-[16px] text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95">
              <Plus size={16} /> <T>Nouveau</T> {vEntity('trip')}
            </button>
            <div className="flex items-center bg-white p-1.5 rounded-[16px] border border-[#E5E7EB] shadow-sm gap-1">
              <button title="Dézoomer" onClick={() => setZoomLevel(Math.max(30, zoomLevel - 10))} className="p-2 text-[#9CA3AF] hover:text-[#2E2E2E] hover:bg-gray-50 rounded-lg transition-all active:scale-90"><ZoomOut size={16} /></button>
              <input type="range" min={30} max={150} value={zoomLevel} onChange={e => setZoomLevel(Number(e.target.value))} className="w-20 h-1 accent-[#2E2E2E] cursor-pointer" title={`Zoom: ${zoomLevel}px/h`} />
              <button title="Zoomer" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-2 text-[#9CA3AF] hover:text-[#2E2E2E] hover:bg-gray-50 rounded-lg transition-all active:scale-90"><ZoomIn size={16} /></button>
              <div className="w-px h-6 bg-[#E5E7EB] mx-1" />
              <button onClick={() => setViewMode('WEEK')} className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'WEEK' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-50'}`}>Semaine</button>
              <button onClick={() => setViewMode('MONTH')} className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'MONTH' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-[#6B7280] hover:bg-gray-50'}`}>Mois</button>
            </div>
          </div>
        </div>

        {/* ═══ STATS ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: vEntity('tripPlural').toUpperCase(), value: monthTrips.length, icon: isLegal ? Briefcase : Plane },
            { label: vt('Revenus'), value: `${totalRevenue.toLocaleString('fr-FR')}€`, icon: CreditCard },
            { label: vEntity('bookingPlural').toUpperCase(), value: monthBookings.length, icon: Briefcase },
            { label: 'Validées', value: monthBookings.filter(b => b.status === 'CONFIRMED').length, icon: CheckCircle2 },
            { label: 'En attente', value: monthBookings.filter(b => b.status === 'PROPOSED' || b.status === 'PENDING').length, icon: Clock },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-[24px] border border-[#E5E7EB] p-5 flex items-center gap-4">
              <s.icon size={18} className="text-[#9CA3AF] shrink-0" />
              <div><p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest"><T>{s.label}</T></p><p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{s.value}</p></div>
            </motion.div>
          ))}
        </div>



        {/* ═══ FILTERS — Compact single line ═══ */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center bg-white rounded-full border border-[#E5E7EB] p-1 shadow-sm">
            <button onClick={prevPeriod} className="p-1.5 hover:bg-gray-50 rounded-full"><ChevronLeft size={16} /></button>
            <span className="px-3 font-bold text-[#2E2E2E] min-w-[160px] text-center uppercase tracking-tight text-[11px]">
              {viewMode === 'MONTH' ? format(currentDate, 'MMMM yyyy', { locale: fr }) : `Semaine du ${format(weekStart, 'dd MMM', { locale: fr })}`}
            </span>
            <button onClick={nextPeriod} className="p-1.5 hover:bg-gray-50 rounded-full"><ChevronRight size={16} /></button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          {/* Status filters */}
          <div className="flex items-center gap-1">
            <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === 'ALL' ? 'bg-[#2E2E2E] text-white' : 'text-[#6B7280] hover:bg-gray-50'}`}>Tous</button>
            <button onClick={() => setFilter('PROPOSAL')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === 'PROPOSAL' ? 'bg-[#E2C8A9] text-[#2E2E2E]' : 'text-[#6B7280] hover:bg-gray-50'}`}>En attente</button>
            <button onClick={() => setFilter('CONFIRMED')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === 'CONFIRMED' ? 'bg-[#A8C6BF] text-[#2E2E2E]' : 'text-[#6B7280] hover:bg-gray-50'}`}>Validés</button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 hidden md:block" />

          {/* Category filters — icon pills */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setCategoryFilter('ALL')} className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${categoryFilter === 'ALL' ? 'bg-[#2E2E2E] text-white' : 'text-[#9CA3AF] hover:bg-gray-50'}`}>Tous</button>
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
                className={`p-1.5 rounded-full transition-all ${categoryFilter === cat.value ? 'shadow-md scale-110' : 'hover:bg-gray-50'}`}
                style={categoryFilter === cat.value ? { backgroundColor: cat.color } : undefined}
                title={cat.label}
              >
                <cat.icon size={13} className={categoryFilter === cat.value ? 'text-white' : 'text-[#9CA3AF]'} />
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={loadData} className="p-2 bg-white rounded-full border border-gray-100 hover:rotate-180 transition-all duration-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        </div>

        {/* ═══ WEEK VIEW ═══ */}
        {viewMode === 'WEEK' ? (
          <div className="flex gap-1.5 md:gap-2 flex-1 overflow-hidden" onMouseLeave={() => setHoveredDay(null)}>
            {getWeekDays().map((dayDate, idx) => {
              const ds = format(dayDate, 'yyyy-MM-dd');
              const dayTrips = getTripsForDay(ds);
              const dayBookings = getBookingsForDay(ds);
              const isCurrentDay = ds === todayStr;
              const ferie = isJourFerie(ds);
              const vacance = getVacance(ds);
              const isHovered = hoveredDay === ds;
              const hasHover = hoveredDay !== null;
              return (
                <motion.div key={ds} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onMouseEnter={() => setHoveredDay(ds)}
                  style={{ 
                    flex: isHovered ? '2.2 1 0%' : hasHover ? '0.8 1 0%' : '1 1 0%',
                    transition: 'flex 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                  }}
                  className={`flex flex-col rounded-[24px] p-2 md:p-2.5 pb-3 border min-w-0 relative overflow-hidden
                    ${ferie ? 'bg-[#2E2E2E] border-[#2E2E2E]' : isCurrentDay ? 'bg-gradient-to-b from-white to-[#f8fcfe] border-[#bcdeea]/60 shadow-[0_8px_30px_-8px_rgba(90,143,163,0.2)]' : isHovered ? 'bg-gradient-to-b from-white to-[#fafafa] border-[#E5E7EB] shadow-lg' : 'bg-gradient-to-b from-white to-[#fafbfc] border-[#f0f0f0] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]'}`}>
                  
                  {/* STICKY DAY HEADER */}
                  <div className={`sticky top-[80px] z-30 pb-1.5 rounded-t-[20px] transition-all backdrop-blur-md ${ferie ? 'bg-[#2E2E2E]/90' : isCurrentDay ? 'bg-white/95' : 'bg-white/95'}`}>
                    <div className="mb-2 px-1.5">
                      <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] mb-0.5 ${ferie ? 'text-white/50' : isCurrentDay ? 'text-[#5a8fa3]' : 'text-[#9CA3AF]'}`}>{DAYS_FULL[idx]}</p>
                      <div className="flex items-end justify-between">
                        <h3 className={`text-2xl font-bold ${ferie ? 'text-white' : isCurrentDay ? 'text-[#2E2E2E]' : 'text-[#6B7280]'}`}>{dayDate.getDate()}</h3>
                        <div className="flex flex-col items-end gap-1">
                          {ferie && <span className="text-[7px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">{ferie}</span>}
                          {vacance && <span className="text-[7px] bg-amber-400/20 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5"><Palmtree size={7} />{vacance}</span>}
                        </div>
                      </div>
                    </div>
                  
                    {/* TRIPS ACORDION */}
                    {dayTrips.length > 0 && (
                      <div className="bg-[#bcdeea]/10 rounded-[20px] p-2 border border-[#bcdeea]/20 shadow-sm relative z-40">
                        <button
                          onClick={() => toggleDayTrips(ds)}
                          className="w-full flex items-center justify-between p-2 hover:bg-[#bcdeea]/20 rounded-[14px] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isLegal ? <Briefcase size={13} className="text-[#A07850]" /> : <Plane size={13} className="text-[#bcdeea]" />}
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isLegal ? 'text-[#A07850]' : 'text-[#bcdeea]'}`}>{dayTrips.length} {vEntity('trip')}{dayTrips.length > 1 ? 's' : ''} <T>en cours</T></span>
                          </div>
                          <ChevronDown size={14} className={`text-[#bcdeea] transition-transform duration-300 ${expandedTripsDays[ds] ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {expandedTripsDays[ds] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 space-y-2">
                                {dayTrips.map(trip => {
                                  const sc = STATUS_CONFIG[trip.status];
                                  return (
                                    <motion.button key={trip.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                      onClick={() => openEditTrip(trip)}
                                      className={`w-full text-left p-2.5 rounded-[16px] shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${sc.bg}`}>
                                      <div className="flex items-center gap-1.5 mb-1 pl-1">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                                        <span className={`text-[7px] font-bold uppercase tracking-widest ${ferie ? 'text-white/50' : isLegal ? 'text-[#A07850]' : 'text-[#bcdeea]'}`}>{isLegal ? 'Dossier' : 'Voyage'}</span>
                                      </div>
                                      <h4 className={`text-[11px] font-bold leading-tight ${ferie ? 'text-white' : 'text-[#2E2E2E]'}`}>{trip.title}</h4>
                                      <p className={`text-[8px] mt-0.5 ${ferie ? 'text-white/60' : 'text-[#6B7280]'}`}>{trip.destination} · {trip.clientName}</p>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* ═══ TIME GRID — 7h→Minuit ═══ */}
                  {(() => {
                    const START_HOUR = 7;
                    const END_HOUR = 24;
                    const HOURS_COUNT = END_HOUR - START_HOUR;
                    const gridHeight = HOURS_COUNT * zoomLevel;
                    
                    // Current time indicator
                    const now = new Date();
                    const nowH = now.getHours();
                    const nowM = now.getMinutes();
                    const showNowLine = isCurrentDay && nowH >= START_HOUR && nowH < END_HOUR;
                    const nowTop = ((nowH - START_HOUR) + nowM / 60) * zoomLevel;
                    
                    // Sort bookings by startTime then compute overlap columns
                    const sorted = [...dayBookings].sort((a, b2) => {
                      const tA = a.startTime || '09:00';
                      const tB = b2.startTime || '09:00';
                      return tA.localeCompare(tB);
                    });
                    
                    // Simple overlap detection: assign columns
                    const cols: Record<string, { col: number; totalCols: number }> = {};
                    const placed: { id: string; start: number; end: number; col: number }[] = [];
                    
                    sorted.forEach(b => {
                      let bH = 9, bM = 0;
                      if (b.startTime) {
                        const p = b.startTime.split(':');
                        if (p.length === 2) { bH = parseInt(p[0], 10); bM = parseInt(p[1], 10); }
                      }
                      const startMin = bH * 60 + bM;
                      const endMin = startMin + 60; // assume 1h per booking
                      
                      // find first column that doesn't overlap
                      let col = 0;
                      while (placed.some(p => p.col === col && startMin < p.end && endMin > p.start)) {
                        col++;
                      }
                      placed.push({ id: b.id!, start: startMin, end: endMin, col });
                      cols[b.id!] = { col, totalCols: 1 };
                    });
                    
                    // compute totalCols per group
                    placed.forEach(p => {
                      const overlapping = placed.filter(o => p.start < o.end && p.end > o.start);
                      const maxCol = Math.max(...overlapping.map(o => o.col)) + 1;
                      overlapping.forEach(o => { cols[o.id].totalCols = Math.max(cols[o.id].totalCols, maxCol); });
                    });
                    
                    return (
                      <div className="flex-1 mt-1 overflow-y-auto no-scrollbar">
                        <div 
                          className="relative rounded-[16px] border border-[#f0f0f0] overflow-hidden"
                          style={{ height: gridHeight }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, ds)}
                        >
                          {/* Hour bands + lines */}
                          {Array.from({ length: HOURS_COUNT }).map((_, i) => {
                            const hour = START_HOUR + i;
                            const isMidi = hour === 12;
                            const isEvening = hour >= 19;
                            const displayHour = hour === 24 ? '00' : hour.toString();
                            return (
                              <div key={hour} className="absolute w-full pointer-events-none" style={{ top: i * zoomLevel, height: zoomLevel }}>
                                {/* Alternating subtle background bands */}
                                <div className={`absolute inset-0 ${isEvening ? 'bg-[#f8f7f5]/60' : i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`} />
                                {isMidi ? (
                                  <div className="w-full border-t-2 border-dashed border-[#bcdeea]/30 relative z-10" />
                                ) : (
                                  <div className={`w-full border-t relative z-10 ${hour % 2 === 0 ? 'border-[#eee]' : 'border-[#f5f5f5]'}`} />
                                )}
                                <span className={`text-[8px] font-medium absolute left-1.5 top-[3px] leading-none relative z-10 ${isMidi ? 'text-[#5a8fa3] font-semibold text-[9px]' : isEvening ? 'text-[#d4d4d4]' : 'text-[#c0c0c0]'}`}>
                                  {displayHour}h
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* Matin label */}
                          {isHovered && (
                            <>
                              <div className="absolute left-1.5 pointer-events-none z-10" style={{ top: 4 }}>
                                <span className="text-[7px] font-bold text-[#bcdeea] uppercase tracking-widest bg-white/80 px-1 py-0.5 rounded">☀ Matin</span>
                              </div>
                              <div className="absolute left-1.5 pointer-events-none z-10" style={{ top: (12 - START_HOUR) * zoomLevel + 4 }}>
                                <span className="text-[7px] font-bold text-[#E2C8A9] uppercase tracking-widest bg-white/80 px-1 py-0.5 rounded">🌙 Après-midi</span>
                              </div>
                            </>
                          )}
                          
                          {/* Current time red line */}
                          {showNowLine && (
                            <div className="absolute w-full z-20 pointer-events-none flex items-center" style={{ top: nowTop }}>
                              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                              <div className="flex-1 h-[1.5px] bg-red-500/60" />
                            </div>
                          )}
                          
                          {/* Booking cards with overlap handling */}
                          {dayBookings.map(b => {
                            const bsConfig = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PROPOSED;
                            const isCancelled = b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE';
                            const isConfirmed = b.status === 'CONFIRMED';
                            const isWaiting = b.status === 'PROPOSED' || b.status === 'PENDING';
                            
                            // Status-based colors
                            const statusBg = isCancelled ? '#F2D9D3' : isConfirmed ? '#D3E8E3' : isWaiting ? '#FFF3E0' : '#F3F4F6';
                            const statusBorder = isCancelled ? '#da3832' : isConfirmed ? '#6BAF8D' : isWaiting ? '#E2A84B' : '#9CA3AF';
                            const statusText = isCancelled ? 'text-[#da3832]' : isConfirmed ? 'text-[#3d7a5c]' : isWaiting ? 'text-[#b07d2e]' : 'text-[#6B7280]';
                            
                            let bH = 9, bM = 0;
                            if (b.startTime) {
                              const parts = b.startTime.split(':');
                              if (parts.length === 2) { bH = parseInt(parts[0], 10); bM = parseInt(parts[1], 10); }
                            }
                            const top = ((bH - START_HOUR) + bM / 60) * zoomLevel;
                            const { col, totalCols } = cols[b.id!] || { col: 0, totalCols: 1 };
                            const widthPercent = 100 / totalCols;
                            const leftPercent = col * widthPercent;
                            
                            return (
                              <motion.div key={b.id} 
                                whileHover={{ scale: 1.03, zIndex: 30, y: -1 }} 
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                draggable
                                onDragStart={(e: any) => handleDragStart(e, b.id!)}
                                onDragEnd={() => setDraggedBookingId(null)}
                                onClick={() => setSelectedBooking(b)}
                                style={{ 
                                  top: Math.max(0, top), 
                                  left: `calc(${leftPercent}% + 2px)`, 
                                  width: `calc(${widthPercent}% - 4px)`,
                                  zIndex: 10 + col,
                                  minHeight: Math.max(zoomLevel * 0.85, 36),
                                  backgroundColor: statusBg,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                                }}
                                className={`absolute text-left p-1.5 rounded-[12px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow cursor-grab active:cursor-grabbing overflow-hidden ${draggedBookingId === b.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                              >
                                <div className="relative z-10">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${bsConfig.dot}`} />
                                    <span className={`text-[7px] font-bold ${statusText}`}>{b.startTime || '--:--'}</span>
                                    {b.endTime && <span className="text-[7px] text-gray-400">→{b.endTime}</span>}
                                  </div>
                                  <h4 className={`text-[9px] font-bold leading-tight line-clamp-2 ${isCancelled ? 'text-[#da3832] line-through' : 'text-[#2E2E2E]'}`}>{b.prestationName}</h4>
                                  {zoomLevel >= 50 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center text-[6px] font-bold shadow-sm border border-gray-100" style={{ color: statusBorder }}>{getSupplierName(b.supplierId).charAt(0)}</div>
                                      <span className="text-[7px] text-gray-500 truncate">{getSupplierName(b.supplierId)}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                          
                          {/* Empty state */}
                          {dayTrips.length === 0 && dayBookings.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.04] gap-1 pointer-events-none">
                              <Calendar size={28} className="text-[#6B7280]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick add button removed from outside scroll area */}
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ═══ MONTH VIEW ═══ */
          <div className="rounded-[24px] border border-[#E5E7EB] p-6">
            <div className="grid grid-cols-7 gap-1">
              {DAYS_FULL.map(d => <div key={d} className="py-3 text-center text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{d}</div>)}
              {Array.from({ length: monthFirstDayIdx }).map((_, i) => <div key={`e-${i}`} className="min-h-[100px]" />)}
              {monthDays.map(day => {
                const ds = format(day, 'yyyy-MM-dd');
                const dayTrips = getTripsForDay(ds);
                const dayBookings = getBookingsForDay(ds);
                const isToday = ds === todayStr;
                const ferie = isJourFerie(ds);
                const vacance = getVacance(ds);
                return (
                  <div key={ds} className={`min-h-[100px] p-2 rounded-[16px] m-0.5 border transition-all overflow-hidden
                    ${ferie ? 'bg-[#2E2E2E] border-[#2E2E2E]' : isToday ? 'border-[#bcdeea] bg-[#FAFBFF]' : vacance ? 'border-amber-200 bg-amber-50/20' : 'border-transparent hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold ${ferie ? 'text-white' : isToday ? 'text-[#bcdeea]' : 'text-[#9CA3AF]'}`}>{day.getDate()}</span>
                      {ferie && <span className="text-[5px] text-white/50 font-bold uppercase truncate ml-1">{ferie}</span>}
                      {vacance && !ferie && <Palmtree size={7} className="text-amber-400" />}
                    </div>
                    <div className="space-y-0.5">
                      {dayTrips.slice(0, 2).map(trip => {
                        const sc = STATUS_CONFIG[trip.status];
                        return (
                          <button key={trip.id} onClick={() => openEditTrip(trip)} className="w-full text-[7px] p-1 rounded-lg truncate cursor-pointer font-bold bg-[#bcdeea]/30 text-left flex items-center gap-1.5">
                            <div className={`w-2 h-2 flex-shrink-0 rounded-full ${sc.dot}`} />
                            <span className="truncate">{trip.title}</span>
                          </button>
                        );
                      })}
                      {dayBookings.slice(0, 2).map(b => {
                        const bsConfig = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.PROPOSED;
                        const isCancelled = b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE';
                        const monthStatusBg = isCancelled ? 'bg-[#F2D9D3]/50' : b.status === 'CONFIRMED' ? 'bg-[#D3E8E3]/50' : (b.status === 'PROPOSED' || b.status === 'PENDING') ? 'bg-[#FFF3E0]/50' : 'bg-gray-100';
                        return (
                          <button key={b.id} onClick={() => setSelectedBooking(b)} className={`w-full text-[7px] p-1 rounded-lg truncate cursor-pointer font-bold text-left flex items-center gap-1.5 ${monthStatusBg}`}>
                            <div className={`w-2 h-2 flex-shrink-0 rounded-full ${bsConfig.dot}`} />
                            <span className="truncate">{b.prestationName}</span>
                          </button>
                        );
                      })}
                      {(dayTrips.length + dayBookings.length) > 4 && <p className="text-[6px] text-gray-400 font-bold ml-1">+{dayTrips.length + dayBookings.length - 4}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ BOOKING DETAIL MODAL — Luna Pro ═══ */}
      <AnimatePresence>
        {selectedBooking && (() => {
          const bStatus = BOOKING_STATUS_CONFIG[selectedBooking.status] || BOOKING_STATUS_CONFIG.PROPOSED;
          const isCancelled = selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'CANCELLED_LATE';
          const isConfirmed = selectedBooking.status === 'CONFIRMED';
          const isWaiting = selectedBooking.status === 'PROPOSED' || selectedBooking.status === 'PENDING';
          const supplierName = getSupplierName(selectedBooking.supplierId);
          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#2E2E2E]/70 backdrop-blur-2xl flex items-center justify-center p-4" onClick={() => { setSelectedBooking(null); setEditingTrip(null); }}>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-[28px] w-full max-w-xl relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.18)]"
              onClick={e => e.stopPropagation()}
            >
              {/* ─── Header ─── */}
              <div className="relative p-8 pb-6 bg-[#2E2E2E] text-white overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-0 right-0 h-[3px] origin-left"
                  style={{ background: isConfirmed ? 'linear-gradient(90deg, #6BAF8D, transparent)' : isCancelled ? 'linear-gradient(90deg, #da3832, transparent)' : 'linear-gradient(90deg, #E2C8A9, transparent)' }}
                />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Prestation</motion.p>
                      <span className={`text-[8px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${isConfirmed ? 'bg-emerald-500/20 text-emerald-300' : isCancelled ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {bStatus.label}
                      </span>
                    </div>
                    <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className={`text-2xl font-light tracking-tight ${isCancelled ? 'line-through text-white/50' : ''}`}>
                      {selectedBooking.prestationName}
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                      className="text-white/40 text-xs mt-2 flex items-center gap-2">
                      <Users size={12} /> {selectedBooking.clientName}
                    </motion.p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { setSelectedBooking(null); setEditingTrip(null); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                  </motion.button>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Prestataire', value: supplierName },
                    { label: 'Tarif', value: `${selectedBooking.rate}€` },
                    { label: 'Date', value: selectedBooking.date },
                    { label: 'Heure', value: selectedBooking.startTime || '--:--' },
                  ].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                      className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/25 font-medium">{item.label}</p>
                      <p className="text-xs font-light text-white/80 mt-0.5 truncate">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-6 space-y-4">
                {isWaiting && (
                  <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!tenantId || !selectedBooking.id) return;
                      try {
                        const res = await fetchWithAuth('/api/bookings/validate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingId: selectedBooking.id, tenantId }),
                        });
                        const data = await res.json();
                        if (data.success) { setSelectedBooking(null); loadData(); }
                        else console.error('Validate failed:', data);
                      } catch (err) { console.error(err); }
                    }}
                    className="w-full py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 size={16} /> Valider Prestation
                  </motion.button>
                )}
                {!isCancelled && (
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { if (!selectedBooking?.id) return; setEditingTrip(prev => prev ? null : ({} as any)); }}
                      className={`py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 bg-[#FAFAF8] border text-[#2E2E2E] hover:border-[#bcdeea] hover:bg-[#bcdeea]/10 ${editingTrip ? 'border-[#2E2E2E] ring-1 ring-[#2E2E2E]' : 'border-[#E5E7EB]'}`}>
                      <Users size={15} /> Réassigner
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (!tenantId || !selectedBooking.id) return;
                        try {
                          await updateSupplierBooking(tenantId, selectedBooking.id, {
                            status: 'CANCELLED',
                            notes: `${selectedBooking.notes || ''}\n[ANNULATION le ${new Date().toLocaleDateString()}]`
                          });
                          const supplier = suppliers.find(s => s.id === selectedBooking.supplierId);
                          if (supplier?.phone) {
                            try {
                              await fetchWithAuth('/api/whatsapp/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  to: supplier.phone,
                                  message: `❌ ANNULATION : "${selectedBooking.prestationName}" du ${selectedBooking.date} annulée.\n\n_Votre Conciergerie_`,
                                  recipientType: 'SUPPLIER',
                                })
                              });
                            } catch { }
                          }
                          setSelectedBooking(null); loadData();
                        } catch (err) { console.error(err); }
                      }}
                      className="py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 hover:border-red-200">
                      <X size={15} /> Annuler
                    </motion.button>
                  </div>
                )}

                <AnimatePresence>
                  {editingTrip && selectedBooking && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-medium text-[#2E2E2E] uppercase tracking-[0.15em]">Sélectionner un nouveau prestataire</h4>
                          <button onClick={() => setEditingTrip(null)} className="text-[10px] font-medium text-[#9CA3AF] hover:text-[#6B7280] uppercase tracking-wider transition-colors">Fermer</button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                          {suppliers.filter(s => s.id !== selectedBooking.supplierId).map(s => (
                            <motion.button key={s.id} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                if (!tenantId || !selectedBooking.id) return;
                                try {
                                  await updateSupplierBooking(tenantId, selectedBooking.id, { supplierId: s.id!, status: 'PROPOSED' });
                                  if (s.phone) {
                                    const dateClean = format(new Date(selectedBooking.date), 'dd/MM/yyyy');
                                    await fetchWithAuth('/api/whatsapp/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        to: s.phone,
                                        message: `*MISSION*\nBonjour ${s.name},\nMission pour vous :\n*${selectedBooking.prestationName}*\n*${dateClean}* à ${selectedBooking.startTime || 'à préciser'}\n*${selectedBooking.rate}€*\nConfirmez via le bouton ci-dessous.`,
                                        recipientType: 'SUPPLIER', bookingId: selectedBooking.id,
                                        clientName: s.name, clientId: s.id, interactiveButtons: true,
                                      })
                                    });
                                  }
                                  setSelectedBooking(null); setEditingTrip(null); loadData();
                                } catch (err) { console.error(err); }
                              }}
                              className="w-full p-4 bg-[#FAFAF8] border border-[#E5E7EB] rounded-2xl hover:border-[#bcdeea] hover:bg-[#bcdeea]/5 transition-all text-left flex items-center justify-between group">
                              <div>
                                <p className="font-medium text-[#2E2E2E] text-sm">{s.name}</p>
                                <p className="text-[9px] text-[#9CA3AF] uppercase tracking-[0.15em] font-medium mt-0.5">{s.category}</p>
                              </div>
                              <div className="p-2 rounded-full bg-[#E5E7EB]/50 group-hover:bg-[#bcdeea] transition-colors">
                                <ExternalLink size={13} className="text-[#9CA3AF] group-hover:text-white" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══ TRIP MODAL ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-luna-charcoal/60 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }} className="bg-white rounded-[24px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Luna Header */}
              <div className="p-8 pb-5 bg-luna-charcoal text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-light tracking-tight">{editingTrip ? <T>{isLegal ? 'Modifier le dossier' : 'Modifier le voyage'}</T> : <T>{isLegal ? 'Nouveau dossier' : 'Nouveau voyage'}</T>}</h3>
                    <p className="text-[#b9dae9] text-xs mt-1 font-medium">Planning synchronisé en temps réel</p>
                    {editingTrip?.source === 'pro-workflow' && (
                      <p className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-200">
                        <T>Demande Pro Workflow</T>
                      </p>
                    )}
                  </div>
                  <button onClick={() => setModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={18} /></button>
                </div>
              </div>
              <form onSubmit={handleSave} className="p-8 pt-6 flex flex-col gap-5">
                <div>
                  <label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Titre</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder={isLegal ? 'Dossier divorce Dupont' : 'Séjour Maldives'} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">{isLegal ? 'Juridiction' : 'Destination'}</label><input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required placeholder={isLegal ? 'TGI Paris' : 'Maldives'} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" /></div>
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Client</label><input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required placeholder="M. Dupont" className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Départ</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" /></div>
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Retour</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Statut</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CRMTrip['status'] }))} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Paiement</label>
                    <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as CRMTrip['paymentStatus'] }))} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]">
                      {Object.entries(PAYMENT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div><label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Montant (€)</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea]" /></div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Couleur</label>
                  <div className="flex gap-2 flex-wrap">{TRIP_COLORS.map(c => (<button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-[#2E2E2E] scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />))}</div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-2">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Détails..." className="w-full py-3 px-4 bg-gray-50 rounded-[16px] border border-gray-100 text-sm focus:outline-none focus:border-[#bcdeea] resize-none" />
                </div>
                {/* ── Actions ── */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {editingTrip && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 text-[#da3832] hover:bg-red-50 rounded-[12px] text-xs font-bold transition-colors"><Trash2 size={14} /></button>
                      <button type="button" onClick={() => exportToGoogleCalendar(editingTrip)} className="flex items-center gap-1.5 px-3 py-2 text-[#6B7280] hover:bg-gray-50 rounded-[12px] text-xs font-bold transition-colors"><ExternalLink size={14} /> Google</button>
                      <button type="button" onClick={() => exportToICS(editingTrip)} className="flex items-center gap-1.5 px-3 py-2 text-[#6B7280] hover:bg-gray-50 rounded-[12px] text-xs font-bold transition-colors"><Download size={14} /> .ics</button>
                      {editingTrip.source === 'pro-workflow' && editingTrip.id && (
                        <a
                          href={`/crm/pro-requests/${editingTrip.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-[12px] text-xs font-bold transition-colors"
                        >
                          <FileText size={14} /> <T>Ouvrir Demande Pro</T>
                        </a>
                      )}
                      {leads.find(l => l.tripId === editingTrip.id) && (
                        <a href={`/crm/leads/${leads.find(l => l.tripId === editingTrip.id)?.id}/proposal`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-[#bcdeea] bg-[#bcdeea]/10 hover:bg-[#bcdeea]/20 rounded-[12px] text-xs font-bold transition-colors">
                          <ExternalLink size={14} /> Devis
                        </a>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-3 text-xs text-[#6B7280] hover:bg-gray-50 rounded-[16px] font-bold transition-colors">Annuler</button>
                    <button type="submit" className="px-8 py-3 rounded-[16px] text-xs font-bold bg-[#bcdeea] text-[#2E2E2E] hover:scale-[1.02] transition-all shadow-md">{editingTrip ? 'Sauvegarder' : isLegal ? 'Créer le dossier' : 'Créer le voyage'}</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
