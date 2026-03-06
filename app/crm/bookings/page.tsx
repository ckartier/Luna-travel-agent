'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Plane, Hotel, Car, Eye, MoreVertical, MapPin, Calendar, DollarSign } from 'lucide-react';
import { CRMBooking, getBookings, createBooking, updateBooking, deleteBooking, getContacts, getTrips, CRMContact, CRMTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BookingsPage() {
    const { tenantId } = useAuth();
    const [bookings, setBookings] = useState<CRMBooking[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
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
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-luna-charcoal mb-1">Réservations</h1>
                    <p className="text-sm text-luna-text-muted">{bookings.length} réservations — Marge totale: <span className="font-bold text-emerald-600">{totalRevenue.toLocaleString('fr-FR')} €</span></p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-luna-charcoal to-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <Plus size={16} /> Nouvelle Réservation
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Chercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none focus:outline-none focus:border-luna-charcoal" />
                </div>
                {['ALL', 'FLIGHT', 'HOTEL', 'ACTIVITY', 'TRANSFER'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${filter === f ? 'bg-luna-charcoal text-white' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
                        {f === 'ALL' ? 'Tout' : f}
                    </button>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Plane size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune réservation trouvée.</p></div>
            ) : (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left text-xs font-medium tracking-wide text-gray-400">
                                <th className="px-4 py-3">Type</th><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Destination</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3 text-right">Marge</th><th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(b => (
                                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-gray-600">{getTypeIcon(b.type)} {b.type}</span></td>
                                    <td className="px-4 py-3 font-bold text-luna-charcoal">{b.supplier}</td>
                                    <td className="px-4 py-3 text-gray-600">{b.clientName}</td>
                                    <td className="px-4 py-3 text-gray-600">{b.destination}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatDate(b.checkIn)}{b.checkOut ? ` → ${formatDate(b.checkOut)}` : ''}</td>
                                    <td className="px-4 py-3">
                                        <select value={b.status} onChange={e => handleStatusChange(b.id!, e.target.value as any)}
                                            className={`text-[11px] font-bold uppercase px-2 py-1 rounded border cursor-pointer ${getStatusStyle(b.status)}`}>
                                            {['PENDING', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'REFUNDED'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{(b.clientPrice - b.supplierCost).toLocaleString('fr-FR')} €</td>
                                    <td className="px-4 py-3 text-gray-400">{b.confirmationNumber && <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded font-mono">{b.confirmationNumber}</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-luna-charcoal mb-4">Nouvelle Réservation</h2>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <select value={newBooking.clientId} onChange={e => setNewBooking(p => ({ ...p, clientId: e.target.value }))}
                                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none">
                                <option value="">Client</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                            </select>
                            <select value={newBooking.type} onChange={e => setNewBooking(p => ({ ...p, type: e.target.value as any }))}
                                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none">
                                <option value="FLIGHT">Vol</option><option value="HOTEL">Hôtel</option><option value="ACTIVITY">Activité</option><option value="TRANSFER">Transfert</option>
                            </select>
                        </div>
                        <input value={newBooking.supplier} onChange={e => setNewBooking(p => ({ ...p, supplier: e.target.value }))} placeholder="Fournisseur (ex: Air France)"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" />
                        <input value={newBooking.destination} onChange={e => setNewBooking(p => ({ ...p, destination: e.target.value }))} placeholder="Destination"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" />
                        <input value={newBooking.confirmationNumber} onChange={e => setNewBooking(p => ({ ...p, confirmationNumber: e.target.value }))} placeholder="N° de confirmation"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" />
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="date" value={newBooking.checkIn} onChange={e => setNewBooking(p => ({ ...p, checkIn: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                            <input type="date" value={newBooking.checkOut} onChange={e => setNewBooking(p => ({ ...p, checkOut: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <input type="number" value={newBooking.supplierCost || ''} onChange={e => setNewBooking(p => ({ ...p, supplierCost: +e.target.value }))} placeholder="Coût fournisseur (€)"
                                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                            <input type="number" value={newBooking.clientPrice || ''} onChange={e => setNewBooking(p => ({ ...p, clientPrice: +e.target.value }))} placeholder="Prix client (€)"
                                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
                            <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-luna-charcoal to-gray-800 text-white text-sm font-medium shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all">Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
