'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus, Search, Loader2, FileText, DollarSign, AlertCircle, Send, X,
  TrendingUp, TrendingDown, Briefcase, User, Calendar, MessageCircle,
  ChevronRight, CheckCircle2, Clock, Ban, Trash2, Mail, Download, Eye,
  ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import SupplierPicker from '@/src/components/crm/SupplierPicker';
import {
  CRMInvoice, getInvoices, createInvoice, updateInvoice,
  getContacts, CRMContact, deleteInvoice, getSuppliers, CRMSupplier,
  logSendNotification
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { T } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { CRMSkeleton } from '@/app/components/CRMSkeleton';
import ConfirmModal from '@/src/components/ConfirmModal';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { generateInvoiceEmail } from '@/src/lib/email/templates';

export default function InvoicesPage() {
  const { tenantId } = useAuth();
  const { vertical } = useVertical();
  const isLegal = vertical.id === 'legal';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoiceType, setInvoiceType] = useState<'CLIENT' | 'SUPPLIER'>(
    (searchParams?.get('type') as 'CLIENT' | 'SUPPLIER') || 'CLIENT'
  );

  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CRMInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ id: string, msg: string, ok: boolean } | null>(null);

  const [newInv, setNewInv] = useState({
    clientId: '', supplierId: '', tripId: '', description: '',
    amount: 0, taxRate: 20
  });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const currentVertical = isLegal ? 'legal' : 'travel';
    try {
      const [inv, cts, sups] = await Promise.all([
        getInvoices(tenantId, invoiceType),
        getContacts(tenantId),
        getSuppliers(tenantId)
      ]);
      setInvoices(inv.filter(i => (i.vertical || 'travel') === currentVertical));
      setContacts(cts);
      setSuppliers(sups);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [tenantId, invoiceType, isLegal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!newInv.clientId || !newInv.amount || !tenantId) return;
    const contact = contacts.find(c => c.id === newInv.clientId);
    const subtotal = newInv.amount;
    const taxTotal = subtotal * (newInv.taxRate / 100);

    await createInvoice(tenantId, {
      invoiceNumber: `INV-${invoiceType === 'CLIENT' ? 'C' : 'P'}${Date.now().toString().slice(-6)}`,
      type: invoiceType,
      tripId: newInv.tripId || '',
      clientId: invoiceType === 'CLIENT' ? newInv.clientId : '',
      clientName: invoiceType === 'CLIENT'
        ? (contact ? `${contact.firstName} ${contact.lastName}` : 'Client')
        : (suppliers.find(s => s.id === newInv.supplierId)?.name || 'Prestataire'),
      supplierId: invoiceType === 'SUPPLIER' ? newInv.supplierId : '',
      supplierName: invoiceType === 'SUPPLIER' ? suppliers.find(s => s.id === newInv.supplierId)?.name : '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
      items: [{
        description: newInv.description || (invoiceType === 'CLIENT' ? 'Prestation voyage' : 'Facture prestataire'),
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
      vertical: isLegal ? 'legal' : 'travel',
    });

    setShowModal(false);
    setNewInv({ clientId: '', supplierId: '', tripId: '', description: '', amount: 0, taxRate: 20 });
    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenantId) return;
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!tenantId || !deleteTarget) return;
    try {
      await deleteInvoice(tenantId, deleteTarget);
      loadData();
    } catch (err) {
      console.error('Delete invoice error:', err);
    }
    setDeleteTarget(null);
  };

  const handleStatusChange = async (id: string, status: CRMInvoice['status']) => {
    if (!tenantId) return;
    await updateInvoice(tenantId, id, { status });
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));

    // If marked as PAID → notify linked supplier via WhatsApp (only for client invoices)
    if (status === 'PAID' && invoiceType === 'CLIENT') {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        notifySupplierPaid(inv);
      }
    }
  };

  // ── SEND INVOICE TO CLIENT (WhatsApp or Email) ──
  const handleSendToClient = async (inv: CRMInvoice, channel: 'WHATSAPP' | 'EMAIL') => {
    if (!tenantId) return;
    const contact = contacts.find(c => c.id === (inv.clientId || inv.supplierId));
    const recipientName = inv.clientName || inv.supplierName || 'Partenaire';

    const to = channel === 'WHATSAPP' ? (contact?.phone || (inv as any).recipientPhone) : contact?.email;
    if (!to) {
      setSendResult({ id: inv.id!, msg: `Pas de ${channel === 'WHATSAPP' ? 'téléphone' : 'email'} disponible.`, ok: false });
      setTimeout(() => setSendResult(null), 3000);
      return;
    }

    // Fetch business name for branding
    let bizName = 'Votre Conciergerie';
    let bizLogo = '';
    try {
      const cfgRes = await fetchWithAuth('/api/crm/site-config');
      const cfgData = await cfgRes.json();
      if (cfgData?.business?.name) bizName = cfgData.business.name;
      else if (cfgData?.global?.siteName) bizName = cfgData.global.siteName;
      if (cfgData?.global?.logo) bizLogo = cfgData.global.logo;
    } catch { /* fallback */ }

    setSendingId(inv.id!);
    const remaining = inv.totalAmount - inv.amountPaid;
    const dateStr = formatDate(inv.issueDate);
    const details = inv.items.map(it => `• ${it.description} — ${it.total.toLocaleString('fr-FR')} €`).join(channel === 'WHATSAPP' ? '\n' : '<br/>');

    const message = channel === 'WHATSAPP'
      ? `*FACTURE ${inv.invoiceNumber}*\n\n` +
      `Bonjour ${recipientName},\n\n` +
      `Voici le récapitulatif de votre facture :\n` +
      `*Date d'émission :* ${dateStr}\n` +
      `*Détails prestations :*\n${details}\n\n` +
      `*Montant Total :* ${inv.totalAmount.toLocaleString('fr-FR')} €\n` +
      `*Déjà réglé :* ${inv.amountPaid.toLocaleString('fr-FR')} €\n` +
      `*Reste à payer :* *${remaining.toLocaleString('fr-FR')} €*\n` +
      `*Échéance :* ${formatDate(inv.dueDate)}\n\n` +
      `Merci pour votre confiance.\n_${bizName}_`
      : generateInvoiceEmail({
          clientName: recipientName,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.totalAmount,
          amountPaid: inv.amountPaid,
          dueDate: formatDate(inv.dueDate),
          invoiceUrl: `/api/crm/invoice-pdf?id=${inv.id}`,
          items: inv.items.map(it => ({ description: it.description, total: it.total })),
          agencyName: bizName,
          logoUrl: bizLogo || undefined,
        });

    const endpoint = channel === 'WHATSAPP' ? '/api/whatsapp/send' : '/api/gmail/send';

    try {
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          message: channel === 'WHATSAPP' ? message : message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '),
          bodyHtml: channel === 'EMAIL' ? message : undefined,
          subject: `Facture ${inv.invoiceNumber} — ${bizName}`,
          clientName: recipientName,
          clientId: inv.clientId || inv.supplierId,
          recipientType: inv.type === 'SUPPLIER' ? 'SUPPLIER' : 'CLIENT',
        })
      });
      const data = await res.json();
      if (res.ok && data.status !== 'failed') {
        setSendResult({ id: inv.id!, msg: `Facture envoyée via ${channel}`, ok: true });
        if (inv.status === 'DRAFT') {
          await updateInvoice(tenantId, inv.id!, { status: 'SENT' });
          setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'SENT' as const } : i));
        }
        // Log successful send to Firebase
        if (tenantId) logSendNotification(tenantId, {
          type: 'INVOICE_SENT',
          channel,
          recipientName: recipientName,
          recipientType: inv.type === 'SUPPLIER' ? 'SUPPLIER' : 'CLIENT',
          referenceId: inv.id!,
          referenceNumber: inv.invoiceNumber,
          success: true,
        });
      } else {
        setSendResult({ id: inv.id!, msg: `Erreur: ${data.error || 'échec'}`, ok: false });
        if (tenantId) logSendNotification(tenantId, {
          type: 'INVOICE_SENT',
          channel,
          recipientName: recipientName,
          recipientType: inv.type === 'SUPPLIER' ? 'SUPPLIER' : 'CLIENT',
          referenceId: inv.id!,
          referenceNumber: inv.invoiceNumber,
          success: false,
          error: data.error || 'Send failed',
        });
      }
    } catch (e: any) {
      setSendResult({ id: inv.id!, msg: `${e.message}`, ok: false });
    }
    setSendingId(null);
    setTimeout(() => setSendResult(null), 4000);
  };


  // ── NOTIFY SUPPLIER WHEN PAID ──
  // Only notify suppliers linked to the invoice (via trip bookings or direct supplier match)
  const notifySupplierPaid = async (inv: CRMInvoice) => {
    // If the invoice has an explicit supplierId, notify only that supplier
    // Otherwise, try to find related suppliers from the invoice items descriptions
    const targetSuppliers = inv.supplierId
      ? suppliers.filter(s => s.id === inv.supplierId && s.phone)
      : suppliers.filter(s => {
          if (!s.phone) return false;
          // Match suppliers whose name appears in invoice item descriptions
          return inv.items.some(it => 
            it.description.toLowerCase().includes(s.name.toLowerCase())
          );
        });

    // Fallback: if no match found and there's a tripId, notify suppliers
    // that have the same category as the invoice items
    const notifyList = targetSuppliers.length > 0 ? targetSuppliers : [];

    for (const sup of notifyList) {
      try {
        await fetchWithAuth('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: sup.phone,
            message: `*PAIEMENT REÇU*\n\nBonjour ${sup.contactName || sup.name},\n\nNous vous informons que la facture *${inv.invoiceNumber}* (${inv.totalAmount.toLocaleString('fr-FR')} €) a été réglée.\nPrestation : ${inv.items[0]?.description || 'Service Luna'}\n\nMerci pour votre collaboration !\n_Luna CRM_`,
            clientName: sup.name,
            clientId: sup.id,
            recipientType: 'SUPPLIER',
          })
        });
        if (tenantId) logSendNotification(tenantId, {
          type: 'PAYMENT_NOTIFICATION',
          channel: 'WHATSAPP',
          recipientName: sup.name,
          recipientType: 'SUPPLIER',
          referenceId: inv.id!,
          referenceNumber: inv.invoiceNumber,
          success: true,
        });
      } catch { /* silent */ }
    }
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

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'PAID': return 'Payé';
      case 'SENT': return 'Envoyé';
      case 'OVERDUE': return 'En Retard';
      case 'DRAFT': return 'Brouillon';
      case 'CANCELLED': return 'Annulé';
      default: return s;
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
  const totalUnpaid = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + (i.totalAmount || 0) - (i.amountPaid || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;

  const accentColor = invoiceType === 'CLIENT' ? '#bcdeea' : '#F2D9D3';
  const accentDark = invoiceType === 'CLIENT' ? '#5a8fa3' : '#b8836e';
  const accentBg = invoiceType === 'CLIENT' ? 'bg-[#bcdeea]' : 'bg-[#F2D9D3]';
  const accentText = 'text-[#2E2E2E]';

  if (loading && invoices.length === 0) return <CRMSkeleton variant="table" rows={6} />;

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-6  pb-20">

        {/* ── LEFT PANEL: Billing Stats ── */}
        <aside className="w-full md:w-[320px] shrink-0">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[24px] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sticky top-[20px] overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-10`} style={{ color: accentDark }}><TrendingUp size={80} /></div>

            <h2 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-10">Gestion Financière</h2>

            <div className="space-y-6">
              <div className={`p-6 rounded-[20px] shadow-lg transition-all duration-500 ${invoiceType === 'CLIENT' ? 'bg-[#bcdeea] shadow-[#bcdeea]/20 text-[#2E2E2E]' : 'bg-[#F2D9D3] shadow-[#F2D9D3]/20 text-[#2E2E2E]'}`}>
                <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">{invoiceType === 'CLIENT' ? 'Total Encaissé' : 'Total Payé'}</p>
                <p className="text-3xl font-medium tracking-tight">{totalPaid.toLocaleString('fr-FR')} €</p>
              </div>

              <div className="p-6 bg-white border border-gray-100 rounded-[28px] shadow-xl shadow-gray-50 text-[#2E2E2E]">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{invoiceType === 'CLIENT' ? 'Encours à Percevoir' : 'Restant à Payer'}</p>
                <p className="text-3xl font-medium tracking-tight">{totalUnpaid.toLocaleString('fr-FR')} €</p>
              </div>

              {overdueCount > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} className="text-[#da3832] shrink-0" />
                  <p className="text-xs text-[#da3832] font-medium">{overdueCount} facture{overdueCount > 1 ? 's' : ''} en retard !</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 italic text-[10px] text-gray-400 font-sans leading-relaxed">
                Les factures sont synchronisées avec Firestore. Quand une facture passe en "Payé", le prestataire est notifié automatiquement via WhatsApp.
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 space-y-6">
          {/* ═══ TYPE SWITCHER — À Recevoir / À Payer ═══ */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm w-fit">
            <button
              onClick={() => setInvoiceType('CLIENT')}
              className="relative flex items-center gap-2 px-6 py-3 rounded-xl text-xs transition-all duration-300"
            >
              {invoiceType === 'CLIENT' && (
                <motion.div
                  layoutId="invoice-tab"
                  className="absolute inset-0 rounded-xl bg-[#bcdeea] shadow-lg shadow-sky-100/50"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className={`relative flex items-center gap-2 font-bold uppercase tracking-[0.1em] text-[10px] ${invoiceType === 'CLIENT' ? 'text-[#2E2E2E]' : 'text-gray-400 hover:text-gray-600'}`}>
                <ArrowDownLeft size={14} />
                À Recevoir
                <span className="text-[8px] font-medium opacity-50">(Clients)</span>
              </span>
            </button>
            <button
              onClick={() => setInvoiceType('SUPPLIER')}
              className="relative flex items-center gap-2 px-6 py-3 rounded-xl text-xs transition-all duration-300"
            >
              {invoiceType === 'SUPPLIER' && (
                <motion.div
                  layoutId="invoice-tab"
                  className="absolute inset-0 rounded-xl bg-[#F2D9D3] shadow-lg shadow-orange-100/50"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className={`relative flex items-center gap-2 font-bold uppercase tracking-[0.1em] text-[10px] ${invoiceType === 'SUPPLIER' ? 'text-[#2E2E2E]' : 'text-gray-400 hover:text-gray-600'}`}>
                <ArrowUpRight size={14} />
                À Payer
                <span className="text-[8px] font-medium opacity-50">(Prestataires)</span>
              </span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
                <T>{invoiceType === 'CLIENT' ? 'Factures Clients' : 'Factures Prestataires'}</T>
              </h1>
              <p className="text-sm text-[#6B7280] mt-1 font-medium">
                {invoiceType === 'CLIENT' ? 'Factures émises — ce que vos clients vous doivent.' : 'Factures reçues — ce que vous devez à vos prestataires.'}
              </p>
            </div>
            <button onClick={() => setShowModal(true)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${invoiceType === 'CLIENT' ? 'bg-[#bcdeea] text-[#2E2E2E] hover:opacity-80 shadow-[#bcdeea]/20' : 'bg-[#F2D9D3] text-[#2E2E2E] hover:opacity-80 shadow-[#F2D9D3]/20'}`}>
              <Plus size={18} /> {invoiceType === 'CLIENT' ? 'Nouvelle Facture' : 'Facture Prestataire'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap 
                ${filter === f ? `${accentBg} ${accentText} border-transparent shadow-lg scale-[1.02]` : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                {f === 'ALL' ? 'Tous' : f === 'DRAFT' ? 'Brouillons' : f === 'SENT' ? 'Envoyés' : f === 'PAID' ? 'Payés' : 'En Retard'}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(inv => (
              <div
                key={inv.id}
                className={`group p-6 md:p-8 bg-white rounded-[24px] border border-gray-100 hover:shadow-lg transition-all cursor-pointer`}
                style={{ borderColor: 'transparent' }} // Handled via hover styles in global or classes
                onClick={() => { setSelectedInvoice(inv); setShowDetailModal(true); }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0`}
                      style={{ backgroundColor: inv.status === 'PAID' ? accentColor : undefined, color: inv.status === 'PAID' ? '#2E2E2E' : '#9CA3AF' }}>
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{inv.invoiceNumber}</p>
                      <h3 className="text-lg font-bold text-luna-charcoal tracking-tight leading-tight uppercase">{inv.clientName}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-sans">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(inv.issueDate)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> Éch: {formatDate(inv.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Send buttons */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSendToClient(inv, 'WHATSAPP'); }}
                        disabled={sendingId === inv.id}
                        className="p-2.5 bg-[#bcdeea]/15 text-[#5a8fa3] rounded-xl hover:bg-[#bcdeea]/30 transition-all disabled:opacity-40"
                        title="Envoyer via WhatsApp"
                      >
                        {sendingId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSendToClient(inv, 'EMAIL'); }}
                        disabled={sendingId === inv.id}
                        className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-40"
                        title="Envoyer via Email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(inv.id!, e)}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Supprimer cette facture"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={inv.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatusChange(inv.id!, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(inv.status)} border cursor-pointer outline-none`}
                      >
                        {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                      </select>
                      <p className="text-2xl font-normal text-luna-charcoal tracking-tight">{inv.totalAmount.toLocaleString('fr-FR')} €</p>
                    </div>

                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-16 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                <FileText size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune facture {filter !== 'ALL' ? 'dans cette catégorie' : 'pour le moment'}</p>
              </div>
            )}
          </div>
        </main>

        {/* ── MODAL: Invoice Detail — Luna Pro ── */}
        <AnimatePresence>
          {showDetailModal && selectedInvoice && (() => {
            const remaining = selectedInvoice.totalAmount - selectedInvoice.amountPaid;
            const isPaid = selectedInvoice.status === 'PAID';
            const progressPct = selectedInvoice.totalAmount > 0 ? Math.round((selectedInvoice.amountPaid / selectedInvoice.totalAmount) * 100) : 0;
            return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#2E2E2E]/70 backdrop-blur-2xl" onClick={() => setShowDetailModal(false)} />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="bg-white rounded-[28px] w-full max-w-xl relative z-10 shadow-[0_30px_100px_rgba(0,0,0,0.18)] overflow-hidden"
              >
                {/* ─── HEADER ─── */}
                <div className="relative p-8 pb-6 bg-[#2E2E2E] text-white overflow-hidden">
                  <motion.div 
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} 
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-0 right-0 h-[3px] origin-left"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
                        {selectedInvoice.invoiceNumber}
                      </motion.p>
                      <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="text-2xl font-light tracking-tight mt-1.5">
                        {selectedInvoice.clientName || selectedInvoice.supplierName}
                      </motion.h2>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-white/40 text-xs mt-2 flex items-center gap-2">
                        <Calendar size={12} /> {formatDate(selectedInvoice.issueDate)} · Éch. {formatDate(selectedInvoice.dueDate)}
                      </motion.p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDetailModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                      <X size={18} />
                    </motion.button>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total', value: selectedInvoice.totalAmount, emphasis: false },
                      { label: 'Payé', value: selectedInvoice.amountPaid, emphasis: false },
                      { label: 'Reste', value: remaining, emphasis: true },
                    ].map((item, i) => (
                      <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-medium">{item.label}</p>
                        <p className={`text-xl tracking-tight mt-1 ${item.emphasis ? 'font-medium text-white' : 'font-light text-white/80'}`}>
                          {item.value.toLocaleString('fr-FR')} €
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-[9px] text-white/30 font-medium">
                      <span>Progression paiement</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: isPaid ? '#6BAF8D' : accentColor }} />
                    </div>
                  </div>
                </div>

                {/* ─── BODY ─── */}
                <div className="p-8 pt-6 space-y-5">
                  <div>
                    <h4 className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.15em] mb-3">Détails de la prestation</h4>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((it, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex justify-between items-center p-4 bg-[#FAFAF8] rounded-2xl border border-[#E5E7EB]/50 hover:border-[#E5E7EB] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-[#2E2E2E]">{it.description}</p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{it.quantity} × {it.unitPrice.toLocaleString('fr-FR')} € · TVA {it.taxRate}%</p>
                          </div>
                          <p className="text-base font-medium text-[#2E2E2E] tabular-nums">{it.total.toLocaleString('fr-FR')} €</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendToClient(selectedInvoice, 'WHATSAPP')}
                      disabled={sendingId === selectedInvoice.id}
                      className="py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 bg-[#FAFAF8] border border-[#E5E7EB] text-[#2E2E2E] hover:border-[#bcdeea] hover:bg-[#bcdeea]/10">
                      {sendingId === selectedInvoice.id ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                      WhatsApp
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendToClient(selectedInvoice, 'EMAIL')}
                      disabled={sendingId === selectedInvoice.id}
                      className="py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 bg-[#2E2E2E] text-white hover:bg-[#1a1a1a]">
                      <Mail size={15} /> Email
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {sendResult && sendResult.id === selectedInvoice.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium ${sendResult.ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {sendResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {sendResult.msg}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isPaid && (
                    <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { handleStatusChange(selectedInvoice.id!, 'PAID'); setShowDetailModal(false); }}
                      className="w-full py-4 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 size={16} />
                      {selectedInvoice.type === 'CLIENT' ? 'Marquer Payée (+ notifier prestataire)' : 'Marquer comme Payée'}
                    </motion.button>
                  )}
                  {isPaid && (
                    <div className="flex items-center justify-center gap-2 py-3 text-emerald-500 text-xs font-medium">
                      <CheckCircle2 size={16} /> Facture réglée
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            );
          })()}
        </AnimatePresence>

        {/* ── MODAL: Create Invoice ── */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
              <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-xl relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden">
                {/* Luna Header */}
                <div className="p-10 md:p-12 pb-6 bg-luna-charcoal text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-light tracking-tight">{invoiceType === 'CLIENT' ? 'Nouvelle Facture Client' : 'Nouvelle Facture Prestataire'}</h2>
                      <p className="text-[#b9dae9] text-xs mt-1 font-medium">Enregistrez les mouvements financiers en un clic</p>
                    </div>
                    <button onClick={() => { setShowModal(false); setNewInv({ clientId: '', supplierId: '', tripId: '', description: '', amount: 0, taxRate: 20 }); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                  </div>
                </div>
                <div className="p-10 md:p-12 pt-6">
                <div className="space-y-6">
                  {invoiceType === 'CLIENT' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Client CRM</label>
                      <select value={newInv.clientId} onChange={e => setNewInv(p => ({ ...p, clientId: e.target.value }))} className={`w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-[${accentColor}] font-sans font-medium`}>
                        <option value="">Sélectionner un contact</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SupplierPicker
                        suppliers={suppliers}
                        value={newInv.supplierId}
                        onChange={(id) => setNewInv(p => ({ ...p, supplierId: id }))}
                        label="Prestataire"
                        placeholder="Rechercher un prestataire..."
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Libellé Principal</label>
                    <input value={newInv.description} onChange={e => setNewInv(p => ({ ...p, description: e.target.value }))} className={`w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-[${accentColor}] font-sans`} placeholder={invoiceType === 'CLIENT' ? 'ex: Solde Voyage Bali' : 'ex: Prestation Chauffeur'} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Montant HT (€)</label>
                      <input type="number" value={newInv.amount || ''} onChange={e => setNewInv(p => ({ ...p, amount: +e.target.value }))} className={`w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-[${accentColor}] font-sans font-bold`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">TVA (%)</label>
                      <input type="number" value={newInv.taxRate} onChange={e => setNewInv(p => ({ ...p, taxRate: +e.target.value }))} className={`w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-[${accentColor}] font-sans`} />
                    </div>
                  </div>

                  {newInv.amount > 0 && (
                    <div className={`p-5 rounded-2xl border`} style={{ backgroundColor: `${accentColor}20`, borderColor: accentColor }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentDark }}>Total TTC</span>
                        <span className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{Math.round(newInv.amount * (1 + newInv.taxRate / 100)).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handleCreate}
                      disabled={!(invoiceType === 'CLIENT' ? newInv.clientId : newInv.supplierId) || !newInv.amount}
                      className={`${accentBg} ${accentText} w-full py-5 rounded-[24px] text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:opacity-80 transition-all disabled:opacity-40`}>
                      Créer la Facture {invoiceType === 'CLIENT' ? 'Client' : 'Prestataire'}
                    </button>
                  </div>
                </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmModal
          open={!!deleteTarget}
          title="Supprimer cette facture ?"
          message="La facture sera supprimée définitivement."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
