'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { CRMPayment, getPayments, createPayment, getInvoices, CRMInvoice } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';

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
      const [p, inv] = await Promise.all([getPayments(tenantId), getInvoices(tenantId, 'SUPPLIER')]);
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

  const getMethodLabel = (m: string) => { switch (m) { case 'CREDIT_CARD': return 'Carte'; case 'BANK_TRANSFER': return 'Virement'; case 'CASH': return 'Espèces'; case 'STRIPE': return 'Stripe'; default: return m; } };
  const getStatusStyle = (s: string) => { switch (s) { case 'COMPLETED': return 'bg-emerald-50/80 text-emerald-600'; case 'PENDING': return 'bg-amber-50/80 text-amber-500'; case 'FAILED': return 'bg-red-50/80 text-red-500'; default: return 'bg-gray-50 text-gray-400'; } };
  const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; } };

  const totalReceived = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Paiements</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">{payments.length} paiements — Total réglé: <span className="font-normal text-[#b8836e]">{totalReceived.toLocaleString('fr-FR')} €</span></p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Nouveau Paiement
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-orange-50/80 rounded-full flex items-center justify-center text-[#b8836e]"><CheckCircle2 size={20} strokeWidth={1.5} /></div>
            <div><p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Total réglé</p><p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{totalReceived.toLocaleString('fr-FR')} €</p></div>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-sky-50/80 rounded-full flex items-center justify-center text-sky-400"><CreditCard size={20} strokeWidth={1.5} /></div>
            <div><p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Paiements</p><p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{payments.length}</p></div>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-amber-50/80 rounded-full flex items-center justify-center text-amber-400"><DollarSign size={20} strokeWidth={1.5} /></div>
            <div><p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Moyen</p><p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{payments.length > 0 ? Math.round(totalReceived / payments.length).toLocaleString('fr-FR') : 0} €</p></div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF8]">
              <tr className="text-left text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                <th className="px-5 py-3.5">Facture</th><th className="px-5 py-3.5">Date</th><th className="px-5 py-3.5">Méthode</th>
                <th className="px-5 py-3.5">Montant</th><th className="px-5 py-3.5">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const inv = invoices.find(i => i.id === p.invoiceId);
                return (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-500">{inv?.invoiceNumber || p.invoiceId.slice(0, 8)}</span><br /><span className="text-xs text-gray-400 font-normal">{inv?.supplierName || inv?.clientName}</span></td>
                    <td className="px-5 py-3.5 text-gray-400 font-normal">{formatDate(p.paymentDate)}</td>
                    <td className="px-5 py-3.5 text-gray-600 font-normal">{getMethodLabel(p.method)}</td>
                    <td className="px-5 py-3.5 font-normal text-[#2E2E2E]">{p.amount.toLocaleString('fr-FR')} €</td>
                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getStatusStyle(p.status)}`}>{p.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau Paiement" subtitle="Enregistrez un règlement" size="sm">
        <ModalField label="Facture" className="mb-4">
          <select value={newPayment.invoiceId} onChange={e => setNewPayment(p => ({ ...p, invoiceId: e.target.value }))} className={modalSelectClass}>
            <option value="">Sélectionner une facture</option>
            {invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.supplierName} ({i.totalAmount}€)</option>)}
          </select>
        </ModalField>
        <ModalField label="Montant" className="mb-4">
          <input type="number" value={newPayment.amount || ''} onChange={e => setNewPayment(p => ({ ...p, amount: +e.target.value }))} placeholder="0 €" className={modalInputClass} />
        </ModalField>
        <ModalField label="Méthode">
          <select value={newPayment.method} onChange={e => setNewPayment(p => ({ ...p, method: e.target.value as any }))} className={modalSelectClass}>
            <option value="CREDIT_CARD">Carte bancaire</option><option value="BANK_TRANSFER">Virement</option><option value="CASH">Espèces</option><option value="STRIPE">Stripe</option>
          </select>
        </ModalField>
        <ModalActions>
          <ModalCancelButton onClick={() => setShowModal(false)} />
          <ModalSubmitButton onClick={handleCreate}>Enregistrer</ModalSubmitButton>
        </ModalActions>
      </Modal>
      </div>
    </div>
  );
}
