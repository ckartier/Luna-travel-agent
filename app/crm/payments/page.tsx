'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { CRMPayment, getPayments, createPayment, getInvoices, CRMInvoice } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PaymentsPage() {
  const { tenantId } = useAuth();
  const [payments, setPayments] = useState<CRMPayment[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({ invoiceId: '', amount: 0, method: 'CREDIT_CARD' as CRMPayment['method'] });

  useEffect(() => { if (tenantId) loadData(); }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [p, inv] = await Promise.all([getPayments(tenantId), getInvoices(tenantId)]);
      setPayments(p); setInvoices(inv);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!tenantId || !newPayment.invoiceId || !newPayment.amount) return;
    const inv = invoices.find(i => i.id === newPayment.invoiceId);
    await createPayment(tenantId!, {
      invoiceId: newPayment.invoiceId,
      clientId: inv?.clientId || '',
      amount: newPayment.amount,
      currency: 'EUR',
      method: newPayment.method,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
    });
    setShowModal(false);
    setNewPayment({ invoiceId: '', amount: 0, method: 'CREDIT_CARD' });
    await loadData(); // Reload to reflect invoice status changes (PARTIAL/PAID)
  };

  const getMethodLabel = (m: string) => { switch (m) { case 'CREDIT_CARD': return '💳 Carte'; case 'BANK_TRANSFER': return '🏦 Virement'; case 'CASH': return '💵 Espèces'; case 'STRIPE': return '🟣 Stripe'; default: return m; } };
  const getStatusStyle = (s: string) => { switch (s) { case 'COMPLETED': return 'bg-emerald-50/80 text-emerald-600'; case 'PENDING': return 'bg-amber-50/80 text-amber-500'; case 'FAILED': return 'bg-red-50/80 text-red-500'; default: return 'bg-gray-50 text-gray-400'; } };
  const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; } };

  const totalReceived = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-normal text-luna-charcoal mb-1"><T>Paiements</T></h1>
          <p className="text-sm text-gray-400 font-normal">{payments.length} paiements — Total encaissé: <span className="font-normal text-emerald-500">{totalReceived.toLocaleString('fr-FR')} €</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Nouveau Paiement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50/80 rounded-full flex items-center justify-center text-emerald-400"><CheckCircle2 size={20} strokeWidth={1.5} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Encaissé</p><p className="text-xl font-normal text-emerald-600">{totalReceived.toLocaleString('fr-FR')} €</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-sky-50/80 rounded-full flex items-center justify-center text-sky-400"><CreditCard size={20} strokeWidth={1.5} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Paiements</p><p className="text-xl font-normal text-luna-charcoal">{payments.length}</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50/80 rounded-full flex items-center justify-center text-amber-400"><DollarSign size={20} strokeWidth={1.5} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Moyen</p><p className="text-xl font-normal text-luna-charcoal">{payments.length > 0 ? Math.round(totalReceived / payments.length).toLocaleString('fr-FR') : 0} €</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden ">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/50">
            <tr className="text-left text-xs font-normal text-gray-400 tracking-wide">
              <th className="px-5 py-3.5">Facture</th><th className="px-5 py-3.5">Date</th><th className="px-5 py-3.5">Méthode</th>
              <th className="px-5 py-3.5">Montant</th><th className="px-5 py-3.5">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const inv = invoices.find(i => i.id === p.invoiceId);
              return (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-500">{inv?.invoiceNumber || p.invoiceId.slice(0, 8)}</span><br /><span className="text-xs text-gray-400 font-normal">{inv?.clientName}</span></td>
                  <td className="px-5 py-3.5 text-gray-400 font-normal">{formatDate(p.paymentDate)}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-normal">{getMethodLabel(p.method)}</td>
                  <td className="px-5 py-3.5 font-normal text-luna-charcoal">{p.amount.toLocaleString('fr-FR')} €</td>
                  <td className="px-5 py-3.5"><span className={`text-[12px] font-normal uppercase px-2.5 py-1 rounded-full ${getStatusStyle(p.status)}`}>{p.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-white/50" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-normal text-luna-charcoal mb-6">Nouveau Paiement</h2>
            <select value={newPayment.invoiceId} onChange={e => setNewPayment(p => ({ ...p, invoiceId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none">
              <option value="">Sélectionner une facture</option>
              {invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.clientName} ({i.totalAmount}€)</option>)}
            </select>
            <input type="number" value={newPayment.amount || ''} onChange={e => setNewPayment(p => ({ ...p, amount: +e.target.value }))} placeholder="Montant (€)"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
            <select value={newPayment.method} onChange={e => setNewPayment(p => ({ ...p, method: e.target.value as any }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-6 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none">
              <option value="CREDIT_CARD">Carte bancaire</option><option value="BANK_TRANSFER">Virement</option><option value="CASH">Espèces</option><option value="STRIPE">Stripe</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl btn-secondary text-sm">Annuler</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
