'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Loader2, FileText, DollarSign, AlertCircle, Send, X,
  TrendingUp, TrendingDown, Briefcase, User, Calendar, MessageCircle,
  ChevronRight, CheckCircle2, Clock, Ban, Trash2
} from 'lucide-react';
import {
  CRMInvoice, getInvoices, createInvoice, updateInvoice,
  getContacts, CRMContact, deleteInvoice
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvoicesPage() {
  const { tenantId } = useAuth();
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CRMInvoice | null>(null);

  const [newInv, setNewInv] = useState({
    clientId: '', tripId: '', description: 'Prestation voyage',
    amount: 0, taxRate: 20
  });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [inv, cts] = await Promise.all([
        getInvoices(tenantId),
        getContacts(tenantId)
      ]);
      setInvoices(inv);
      setContacts(cts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!newInv.clientId || !newInv.amount || !tenantId) return;
    const contact = contacts.find(c => c.id === newInv.clientId);
    const subtotal = newInv.amount;
    const taxTotal = subtotal * (newInv.taxRate / 100);

    await createInvoice(tenantId, {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      tripId: newInv.tripId || '',
      clientId: newInv.clientId,
      clientName: contact ? `${contact.firstName} ${contact.lastName}` : 'Client',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
      items: [{
        description: newInv.description || 'Prestation voyage',
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
        taxRate: newInv.taxRate
      }],
      subtotal,
      taxTotal,
      totalAmount: subtotal + taxTotal,
      amountPaid: 0,
      currency: 'EUR',
      status: 'DRAFT',
    });

    setShowModal(false);
    setNewInv({ clientId: '', tripId: '', description: 'Prestation voyage', amount: 0, taxRate: 20 });
    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette facture ?')) return;
    await deleteInvoice(tenantId!, id);
    loadData();
  };

  const handleStatusChange = async (id: string, status: CRMInvoice['status']) => {
    if (!tenantId) return;
    await updateInvoice(tenantId, id, { status });
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'SENT': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'OVERDUE': return 'bg-red-50 text-red-600 border-red-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-amber-50 text-amber-400 border-amber-100';
    }
  };

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), 'dd MMM yyyy', { locale: fr });
    } catch {
      return d;
    }
  };

  const filtered = invoices.filter(i => filter === 'ALL' || i.status === filter);
  const totalUnpaid = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + i.totalAmount - i.amountPaid, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  if (loading && invoices.length === 0) return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
      <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-screen animate-in fade-in duration-500">

      {/* ── LEFT PANEL: Billing Stats ── */}
      <aside className="w-full md:w-[320px] shrink-0">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[40px] p-8 shadow-xl shadow-gray-100/50 sticky top-[20px] overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><TrendingUp size={80} /></div>

          <h2 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-10">Gestion Financière</h2>

          <div className="space-y-8">
            <div className="p-6 bg-emerald-500 text-white rounded-[28px] shadow-2xl shadow-emerald-100">
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Total Encaissé</p>
              <p className="text-3xl font-normal tracking-tight">{totalPaid.toLocaleString('fr-FR')} €</p>
            </div>

            <div className="p-6 bg-luna-charcoal text-white rounded-[28px] shadow-2xl shadow-gray-200">
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Encours à Percevoir</p>
              <p className="text-3xl font-normal tracking-tight">{totalUnpaid.toLocaleString('fr-FR')} €</p>
            </div>

            <div className="pt-6 border-t border-gray-100 italic text-[10px] text-gray-400 font-sans leading-relaxed">
              Les factures sont automatiquement synchronisées avec le planning et le CRM une fois marquées comme envoyées ou payées.
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal text-luna-charcoal tracking-tight"><T>Factures</T></h1>
            <p className="text-sm text-gray-400 font-sans">Visualisez vos encaissements et gérez les relances clients.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-luna-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-gray-800 transition-all flex items-center gap-2">
            <Plus size={18} /> Nouvelle Facture
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${filter === f ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
              {f === 'ALL' ? 'Tous' : f === 'DRAFT' ? 'Brouillons' : f === 'SENT' ? 'Envoyés' : f === 'PAID' ? 'Payés' : 'En Retard'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(inv => (
            <div
              key={inv.id}
              className="group p-8 bg-white rounded-[40px] border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 h-[140px]"
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${inv.status === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <FileText size={28} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{inv.invoiceNumber}</p>
                  <h3 className="text-xl font-bold text-luna-charcoal tracking-tight leading-tight uppercase truncate max-w-[200px]">{inv.clientName}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-sans">
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(inv.issueDate)}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> Échéance: {formatDate(inv.dueDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={inv.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleStatusChange(inv.id!, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(inv.status)} border cursor-pointer outline-none`}
                  >
                    {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <p className="text-2xl font-normal text-luna-charcoal tracking-tight">{inv.totalAmount.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => handleDelete(inv.id!, e)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 size={20} />
                  </button>
                  <ChevronRight size={24} className="text-gray-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal: Create Invoice */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className="bg-white rounded-[48px] w-full max-w-xl relative z-10 shadow-2xl p-10 md:p-12 overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-normal tracking-tight">Nouvelle Facture</h2>
                  <p className="text-xs text-gray-500 font-sans tracking-tight">Générez un document légal synchronisé avec votre base.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Client CRM</label>
                  <select value={newInv.clientId} onChange={e => setNewInv(p => ({ ...p, clientId: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans font-medium">
                    <option value="">Sélectionner un contact</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Libellé Principal</label>
                  <input value={newInv.description} onChange={e => setNewInv(p => ({ ...p, description: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans" placeholder="ex: Solde Voyage Bali" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Montant HT (€)</label>
                    <input type="number" value={newInv.amount || ''} onChange={e => setNewInv(p => ({ ...p, amount: +e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">TVA (%)</label>
                    <input type="number" value={newInv.taxRate} onChange={e => setNewInv(p => ({ ...p, taxRate: +e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans" />
                  </div>
                </div>

                <div className="pt-8">
                  <button onClick={handleCreate} disabled={!newInv.clientId || !newInv.amount} className="w-full py-5 bg-luna-charcoal text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-black transition-all">Créer et Synchroniser avec Firebase</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
