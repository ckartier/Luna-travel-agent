'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, FileText, DollarSign, AlertCircle, Send } from 'lucide-react';
import { CRMInvoice, getInvoices, createInvoice, updateInvoice, getContacts, CRMContact } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvoicesPage() {
  const { tenantId } = useAuth();
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newInv, setNewInv] = useState({ clientId: '', tripId: '', description: '', amount: 0, taxRate: 20 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, cts] = await Promise.all([getInvoices(tenantId!), getContacts(tenantId!)]);
      setInvoices(inv); setContacts(cts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newInv.clientId || !newInv.amount) return;
    const contact = contacts.find(c => c.id === newInv.clientId);
    const subtotal = newInv.amount;
    const taxTotal = subtotal * (newInv.taxRate / 100);
    await createInvoice(tenantId!, {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      tripId: newInv.tripId || '',
      clientId: newInv.clientId,
      clientName: contact ? `${contact.firstName} ${contact.lastName}` : 'Client',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
      items: [{ description: newInv.description || 'Prestation voyage', quantity: 1, unitPrice: subtotal, total: subtotal, taxRate: newInv.taxRate }],
      subtotal,
      taxTotal,
      totalAmount: subtotal + taxTotal,
      amountPaid: 0,
      currency: 'EUR',
      status: 'DRAFT',
    });
    setShowModal(false);
    setNewInv({ clientId: '', tripId: '', description: '', amount: 0, taxRate: 20 });
    loadData();
  };

  const handleStatusChange = async (id: string, status: CRMInvoice['status']) => {
    await updateInvoice(tenantId!, id, { status });
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const getStatusStyle = (s: string) => { switch (s) { case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-200'; case 'SENT': return 'bg-sky-50 text-sky-600 border-sky-200'; case 'OVERDUE': return 'bg-red-50 text-red-600 border-red-200'; case 'DRAFT': return 'bg-gray-100 text-gray-500 border-gray-200'; default: return 'bg-amber-50 text-amber-600 border-amber-200'; } };
  const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; } };

  const filtered = invoices.filter(i => filter === 'ALL' || i.status === filter);
  const totalUnpaid = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + i.totalAmount - i.amountPaid, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-luna-charcoal mb-1">Factures</h1>
          <p className="text-sm text-luna-text-muted">{invoices.length} factures</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ">
          <Plus size={16} /> Nouvelle Facture
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 ">
          <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">Total Encaissé</p>
          <p className="text-2xl font-semibold text-emerald-600">{totalPaid.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 ">
          <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">En Attente</p>
          <p className="text-2xl font-semibold text-amber-600">{totalUnpaid.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 ">
          <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">Factures</p>
          <p className="text-2xl font-semibold text-luna-charcoal">{invoices.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-luna-charcoal text-white' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
            {f === 'ALL' ? 'Tout' : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden ">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/50">
            <tr className="text-left text-xs font-medium tracking-wide text-gray-400">
              <th className="px-4 py-3">N°</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Émission</th>
              <th className="px-4 py-3">Échéance</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 font-bold text-luna-charcoal">{inv.clientName}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3 font-bold text-luna-charcoal">{inv.totalAmount.toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3">
                  <select value={inv.status} onChange={e => handleStatusChange(inv.id!, e.target.value as any)}
                    className={`text-[11px] font-bold uppercase px-2 py-1 rounded border cursor-pointer ${getStatusStyle(inv.status)}`}>
                    {['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-white/50" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-luna-charcoal mb-4">Nouvelle Facture</h2>
            <select value={newInv.clientId} onChange={e => setNewInv(p => ({ ...p, clientId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3">
              <option value="">Sélectionner un client</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            <input value={newInv.description} onChange={e => setNewInv(p => ({ ...p, description: e.target.value }))} placeholder="Description"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" value={newInv.amount || ''} onChange={e => setNewInv(p => ({ ...p, amount: +e.target.value }))} placeholder="Montant HT (€)"
                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
              <input type="number" value={newInv.taxRate} onChange={e => setNewInv(p => ({ ...p, taxRate: +e.target.value }))} placeholder="TVA %"
                className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl bg-luna-charcoal hover:bg-gray-800 text-white text-sm font-medium transition-all">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
