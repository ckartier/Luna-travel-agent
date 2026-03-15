'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Plane, Hotel, Car, Eye, MoreVertical, MapPin, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { CRMBooking, getBookings, createBooking, updateBooking, deleteBooking, getContacts, getTrips, CRMContact, CRMTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import ConfirmModal from '@/src/components/ConfirmModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { T, useAutoTranslate } from '@/src/components/T';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';

export default function BookingsPage() {
  const { tenantId } = useAuth();
  const at = useAutoTranslate();
  const [bookings, setBookings] = useState<CRMBooking[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [trips, setTrips] = useState<CRMTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ tripId: '', clientId: '', clientName: '', type: 'HOTEL' as CRMBooking['type'], supplier: '', destination: '', confirmationNumber: '', checkIn: '', checkOut: '', supplierCost: 0, clientPrice: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, c, t] = await Promise.all([getBookings(tenantId!), getContacts(tenantId!), getTrips(tenantId!)]);
      setBookings(b); setContacts(c); setTrips(t);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newBooking.supplier || !newBooking.checkIn) return;
    const contact = contacts.find(c => c.id === newBooking.clientId);
    await createBooking(tenantId!, {
      ...newBooking,
      clientName: contact ? `${contact.firstName} ${contact.lastName}` : newBooking.clientName,
      status: 'PENDING',
      pnr: '',
      currency: 'EUR',
    });
    setShowModal(false);
    setNewBooking({ tripId: '', clientId: '', clientName: '', type: 'HOTEL', supplier: '', destination: '', confirmationNumber: '', checkIn: '', checkOut: '', supplierCost: 0, clientPrice: 0 });
    loadData();
  };

  const handleStatusChange = async (id: string, status: CRMBooking['status']) => {
    await updateBooking(tenantId!, id, { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenantId) return;
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!tenantId || !deleteTarget) return;
    try {
      await deleteBooking(tenantId, deleteTarget);
      loadData();
    } catch (err) {
      console.error('Delete booking error:', err);
    }
    setDeleteTarget(null);
  };

  const getTypeIcon = (t: string) => { switch (t) { case 'FLIGHT': return <Plane size={14} />; case 'HOTEL': return <Hotel size={14} />; case 'TRANSFER': return <Car size={14} />; default: return <MapPin size={14} />; } };
  const getStatusStyle = (s: string) => { switch (s) { case 'CONFIRMED': case 'TICKETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200'; case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200'; case 'CANCELLED': case 'REFUNDED': return 'bg-red-50 text-red-600 border-red-200'; default: return 'bg-gray-100 text-gray-500 border-gray-200'; } };

  const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM', { locale: fr }); } catch { return d; } };

  const filtered = bookings.filter(b => {
    const matchType = filter === 'ALL' || b.type === filter;
    const matchSearch = b.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || b.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const totalRevenue = bookings.reduce((s, b) => s + (b.clientPrice - b.supplierCost), 0);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Réservations</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">{bookings.length} {at('réservations')} — <T>Marge totale</T>: <span className="font-normal text-emerald-600">{totalRevenue.toLocaleString('fr-FR')} €</span></p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#2E2E2E] hover:bg-[#1a1a1a] text-white px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg active:scale-95">
            <Plus size={16} /> <T>Nouvelle Réservation</T>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input type="text" placeholder="Chercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#bcdeea] focus:ring-1 focus:ring-[#bcdeea]/30 shadow-sm transition-all placeholder:text-[#9CA3AF]" />
          </div>
          {['ALL', 'FLIGHT', 'HOTEL', 'ACTIVITY', 'TRANSFER'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === f ? 'bg-[#2E2E2E] text-white' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              {at(f === 'ALL' ? 'Tout' : f)}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Plane size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm"><T>Aucune réservation trouvée.</T></p></div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAF8]">
                <tr className="text-left text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                  <th className="px-5 py-3.5">Type</th><th className="px-5 py-3.5">Fournisseur</th><th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Destination</th><th className="px-5 py-3.5">Dates</th><th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Marge</th><th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-gray-600">{getTypeIcon(b.type)} {b.type}</span></td>
                    <td className="px-4 py-3 font-normal text-luna-charcoal">{b.supplier}</td>
                    <td className="px-4 py-3 text-gray-600">{b.clientName}</td>
                    <td className="px-4 py-3 text-gray-600">{b.destination}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.checkIn)}{b.checkOut ? ` → ${formatDate(b.checkOut)}` : ''}</td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={e => handleStatusChange(b.id!, e.target.value as any)}
                        className={`text-[12px] font-normal uppercase px-2 py-1 rounded border cursor-pointer ${getStatusStyle(b.status)}`}>
                        {['PENDING', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'REFUNDED'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-normal text-emerald-600">{(b.clientPrice - b.supplierCost).toLocaleString('fr-FR')} €</td>
                    <td className="px-4 py-3 text-gray-400">
                      <div className="flex items-center gap-2">
                        {b.confirmationNumber && <span className="text-[12px] bg-gray-100 px-2 py-0.5 rounded font-mono">{b.confirmationNumber}</span>}
                        <button onClick={(e) => handleDelete(b.id!, e)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={at('Nouvelle Réservation')} subtitle={at('Ajoutez une réservation de vol, hôtel ou transfert')}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <ModalField label="Client">
              <select value={newBooking.clientId} onChange={e => setNewBooking(p => ({ ...p, clientId: e.target.value }))} className={modalSelectClass}>
                <option value="">Sélectionner un client</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </ModalField>
            <ModalField label="Type">
              <select value={newBooking.type} onChange={e => setNewBooking(p => ({ ...p, type: e.target.value as any }))} className={modalSelectClass}>
                <option value="FLIGHT">{at('Vol')}</option><option value="HOTEL">{at('Hôtel')}</option><option value="ACTIVITY">{at('Activité')}</option><option value="TRANSFER">{at('Transfert')}</option>
              </select>
            </ModalField>
          </div>
          <ModalField label="Fournisseur" className="mb-4">
            <input value={newBooking.supplier} onChange={e => setNewBooking(p => ({ ...p, supplier: e.target.value }))} placeholder="Air France, Hilton..." className={modalInputClass} />
          </ModalField>
          <ModalField label="Destination" className="mb-4">
            <input value={newBooking.destination} onChange={e => setNewBooking(p => ({ ...p, destination: e.target.value }))} placeholder="Paris, Bali..." className={modalInputClass} />
          </ModalField>
          <ModalField label="N° de confirmation" className="mb-4">
            <input value={newBooking.confirmationNumber} onChange={e => setNewBooking(p => ({ ...p, confirmationNumber: e.target.value }))} placeholder="ABC123" className={modalInputClass} />
          </ModalField>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <ModalField label="Check-in">
              <input type="date" value={newBooking.checkIn} onChange={e => setNewBooking(p => ({ ...p, checkIn: e.target.value }))} className={modalInputClass} />
            </ModalField>
            <ModalField label="Check-out">
              <input type="date" value={newBooking.checkOut} onChange={e => setNewBooking(p => ({ ...p, checkOut: e.target.value }))} className={modalInputClass} />
            </ModalField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Coût fournisseur">
              <input type="number" value={newBooking.supplierCost || ''} onChange={e => setNewBooking(p => ({ ...p, supplierCost: +e.target.value }))} placeholder="0 €" className={modalInputClass} />
            </ModalField>
            <ModalField label="Prix client">
              <input type="number" value={newBooking.clientPrice || ''} onChange={e => setNewBooking(p => ({ ...p, clientPrice: +e.target.value }))} placeholder="0 €" className={modalInputClass} />
            </ModalField>
          </div>
          <ModalActions>
            <ModalCancelButton onClick={() => setShowModal(false)} />
            <ModalSubmitButton onClick={handleCreate}><T>Créer la réservation</T></ModalSubmitButton>
          </ModalActions>
        </Modal>
      </div>
    </div>
  );
}
