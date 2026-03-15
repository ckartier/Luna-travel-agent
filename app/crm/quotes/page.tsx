'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Loader2, FileSignature, DollarSign, AlertCircle, Send, PlusCircle, Trash2, Wand2, Mail,
    ChevronRight, X, TrendingUp, Briefcase, User, Calendar, MessageCircle, Plane, Hotel, Globe, Sparkles, FileSpreadsheet
} from 'lucide-react';
import {
    CRMQuote, getQuotes, createQuote, updateQuote, getContacts, CRMContact,
    getTrips, CRMTrip, getBookingsForTrip, CRMQuoteItem, deleteQuote,
    getLeads, CRMLead
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { generateQuoteEmail } from '@/src/lib/email/templates';
import { T } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuotesPage() {
    const { tenantId } = useAuth();
    const router = useRouter();
    const [quotes, setQuotes] = useState<CRMQuote[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<CRMQuote | null>(null);

    // Create Quote State
    const [newQuote, setNewQuote] = useState({ clientId: '', tripId: '', taxRate: 20 });
    const [quoteItems, setQuoteItems] = useState<{ id: string, description: string, quantity: number, netCost: number, unitPrice: number, selected: boolean }[]>([
        { id: '1', description: 'Prestation voyage', quantity: 1, netCost: 0, unitPrice: 0, selected: true }
    ]);

    const [sendModal, setSendModal] = useState<{ open: boolean, quote: CRMQuote | null, contact: CRMContact | null }>({ open: false, quote: null, contact: null });
    const [sending, setSending] = useState(false);

    useEffect(() => { loadData(); }, [tenantId]);

    const loadData = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [qts, cts, trps, lds] = await Promise.all([getQuotes(tenantId), getContacts(tenantId), getTrips(tenantId), getLeads(tenantId)]);
            setQuotes(qts); setContacts(cts); setTrips(trps); setLeads(lds);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleTripSelect = async (tripId: string) => {
        setNewQuote(p => ({ ...p, tripId }));
        if (!tripId) return;
        const bookings = await getBookingsForTrip(tenantId!, tripId);
        if (bookings.length > 0) {
            setQuoteItems(bookings.map((b, i) => ({
                id: i.toString(),
                description: `${b.type === 'FLIGHT' ? 'Vol' : b.type === 'HOTEL' ? 'Hôtel' : 'Prestation'} ${b.supplier} - ${b.destination}`,
                quantity: 1,
                netCost: b.supplierCost || 0,
                unitPrice: b.clientPrice || b.supplierCost || 0,
                selected: true
            })));
        } else {
            // Simulation fallback
            setQuoteItems([
                { id: 'a1', description: 'Vols Premium Aller-Retour', quantity: 2, netCost: 900, unitPrice: 1200, selected: true },
                { id: 'a2', description: 'Hôtel 5★ & Spa (7 Nuits)', quantity: 1, netCost: 2100, unitPrice: 2800, selected: true },
                { id: 'a3', description: 'Conciergerie AI & Assist.', quantity: 1, netCost: 150, unitPrice: 450, selected: true },
            ]);
        }
    };

    const handleCreate = async () => {
        if (!newQuote.clientId || !tenantId) return;
        const contact = contacts.find(c => c.id === newQuote.clientId);
        const selectedItems = quoteItems.filter(i => i.selected);
        if (selectedItems.length === 0) return;

        const subtotal = selectedItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
        const taxTotal = subtotal * (newQuote.taxRate / 100);

        const finalizedItems: CRMQuoteItem[] = selectedItems.map(it => ({
            description: it.description,
            quantity: it.quantity,
            netCost: it.netCost,
            unitPrice: it.unitPrice,
            total: it.quantity * it.unitPrice,
            taxRate: newQuote.taxRate
        }));

        await createQuote(tenantId, {
            quoteNumber: `QUO-${Date.now().toString().slice(-6)}`,
            tripId: newQuote.tripId || '',
            clientId: newQuote.clientId,
            clientName: contact ? `${contact.firstName} ${contact.lastName}` : 'Client',
            issueDate: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
            items: finalizedItems,
            subtotal,
            taxTotal,
            totalAmount: subtotal + taxTotal,
            currency: 'EUR',
            status: 'DRAFT',
        });

        setShowModal(false);
        setNewQuote({ clientId: '', tripId: '', taxRate: 20 });
        setQuoteItems([{ id: '1', description: 'Prestation voyage', quantity: 1, netCost: 0, unitPrice: 0, selected: true }]);
        loadData();
    };

    const handleDeleteQuote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!tenantId) return;
        if (deletingId !== id) {
            setDeletingId(id);
            return;
        }
        try {
            await deleteQuote(tenantId, id);
            setDeletingId(null);
            loadData();
        } catch (err) {
            console.error('Delete quote error:', err);
        }
    };

    const handleStatusChange = async (id: string, status: CRMQuote['status']) => {
        if (!tenantId) return;
        await updateQuote(tenantId, id, { status });
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));

        // Auto-create client invoice when quote is ACCEPTED
        if (status === 'ACCEPTED') {
            try {
                const { createInvoiceFromQuote } = await import('@/src/lib/firebase/crm');
                const quote = quotes.find(q => q.id === id);
                if (quote) {
                    await createInvoiceFromQuote(tenantId, { ...quote, status: 'ACCEPTED' });
                    alert('Devis accepté ! Facture client auto-générée.');
                }
            } catch (e) {
                console.warn('Auto-invoice failed:', e);
            }
        }
    };

    const handleSendQuote = async (channel: 'EMAIL' | 'WHATSAPP') => {
        if (!sendModal.quote || !sendModal.contact || !tenantId) return;
        setSending(true);
        try {
            const quote = sendModal.quote;
            const contact = sendModal.contact;
            const dest = channel === 'EMAIL' ? contact.email : (contact.phone || '');
            if (!dest) { alert('Aucun ' + (channel === 'EMAIL' ? 'email' : 'téléphone') + ' trouvé pour ce contact'); setSending(false); return; }

            // Fetch business info for branding
            let businessName = 'Votre Conciergerie';
            let businessLogo = '';
            try {
                const cfgRes = await fetch('/api/crm/site-config');
                const cfgData = await cfgRes.json();
                if (cfgData?.business?.name) businessName = cfgData.business.name;
                else if (cfgData?.global?.siteName) businessName = cfgData.global.siteName;
                if (cfgData?.global?.logo) businessLogo = cfgData.global.logo;
            } catch { /* fallback */ }

            // Create shared quote for client validation link
            const shareRes = await fetchWithAuth('/api/crm/share-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId: quote.id,
                    quoteNumber: quote.quoteNumber,
                    clientName: `${contact.firstName} ${contact.lastName}`,
                    agencyName: businessName,
                    agencyLogo: businessLogo,
                    issueDate: quote.issueDate,
                    validUntil: quote.validUntil,
                    items: quote.items,
                    subtotal: quote.subtotal,
                    taxTotal: quote.taxTotal,
                    totalAmount: quote.totalAmount,
                    currency: quote.currency,
                }),
            });
            const shareData = await shareRes.json();
            const quoteLink = shareData.shareUrl || '';

            const itemsList = quote.items.map(it => `  - ${it.description}: ${it.unitPrice.toLocaleString('fr-FR')} ${quote.currency}`).join('\n');
            const message = `\u2728 Bonjour ${contact.firstName} ! \ud83d\ude0a\n\nVoici votre devis n\u00b0${quote.quoteNumber} :\n${itemsList}\n\n\ud83d\udcb0 Total : ${quote.totalAmount.toLocaleString('fr-FR')} ${quote.currency}\n\ud83d\udcc5 Valide jusqu'au ${quote.validUntil}\n\n\ud83d\udc49 Consultez et validez votre devis en ligne :\n${quoteLink}\n\n\ud83d\ude4f N'h\u00e9sitez pas \u00e0 nous contacter !\n_\u2728 ${businessName}_`;

            // Generate branded HTML email for EMAIL channel
            const htmlBody = channel === 'EMAIL' ? generateQuoteEmail({
                clientName: `${contact.firstName} ${contact.lastName}`,
                quoteNumber: quote.quoteNumber,
                destination: trips.find(t => t.id === quote.tripId)?.destination,
                totalAmount: quote.totalAmount,
                validUntil: quote.validUntil,
                quoteUrl: quoteLink,
                items: quote.items.map(it => ({ description: it.description, total: it.total })),
                agencyName: businessName,
                logoUrl: businessLogo || undefined,
            }) : undefined;

            const endpoint = channel === 'WHATSAPP' ? '/api/whatsapp/send' : '/api/gmail/send';
            const res = await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: dest,
                    message,
                    bodyHtml: htmlBody,
                    subject: `\u2728 Devis ${quote.quoteNumber} - ${businessName}`,
                    clientId: contact.id,
                    clientName: `${contact.firstName} ${contact.lastName}`,
                    recipientType: 'CLIENT',
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Échec d'envoi (${res.status})`);
            }

            await updateQuote(tenantId, quote.id!, { status: 'SENT' });
            setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'SENT' as const } : q));
            setSendModal({ open: false, quote: null, contact: null });
            alert(`\ud83c\udf89 Devis envoy\u00e9 via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} !`);
        } catch (e: any) {
            console.error('Send quote error:', e);
            alert(`\u274c Erreur d'envoi : ${e.message || 'Vérifiez votre configuration'}`);
        } finally {
            setSending(false);
        }
    };

    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'ACCEPTED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'SENT': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'REJECTED': case 'EXPIRED': return 'bg-red-50 text-red-600 border-red-200';
            case 'DRAFT': return 'bg-gray-100 text-gray-400 border-gray-200';
            default: return 'bg-amber-50 text-amber-600 border-amber-200';
        }
    };

    const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; } };

    const filtered = quotes.filter(q => filter === 'ALL' || q.status === filter);

    // Financial calculations
    const costsTotal = selectedQuote?.items?.reduce((acc, it) => acc + (it.netCost * it.quantity), 0) || 0;
    const revTotal = selectedQuote?.subtotal || 0;
    const margin = revTotal - costsTotal;
    const marginPercent = revTotal > 0 ? Math.round((margin / revTotal) * 100) : 0;

    if (loading && quotes.length === 0) return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
            <style jsx>{`
                    @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(-20%); } 100% { transform: translateX(0%); } }
                    .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
                `}</style>
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-6  pb-20">

                {/* ── LEFT PANEL: Financial Overview ── */}
                <aside className="w-full md:w-[320px] shrink-0">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[24px] p-8 shadow-xl shadow-gray-100/50 sticky top-[20px] overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><DollarSign size={80} /></div>

                        <h2 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-10">Contrôle Financier</h2>

                        {selectedQuote ? (
                            <div className="space-y-8 ">
                                <div className="p-6 bg-[#bcdeea] text-[#2E2E2E] rounded-[28px] shadow-2xl shadow-sky-50">
                                    <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-1">Montant Total Devis</p>
                                    <p className="text-3xl font-medium tracking-tight">{selectedQuote.totalAmount.toLocaleString('fr-FR')} €</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">
                                            <span>Coût Net (Achat)</span>
                                            <span className="text-gray-900">{costsTotal.toLocaleString('fr-FR')} €</span>
                                        </div>
                                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full bg-amber-400" style={{ width: `${(costsTotal / revTotal) * 100}%` }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-[#5a8fa3] tracking-widest mb-3">
                                            <span>Marge Nette Attendue</span>
                                            <span>{marginPercent}%</span>
                                        </div>
                                        <div className="p-5 bg-sky-50 rounded-3xl flex items-center justify-center border border-sky-100 shadow-sm">
                                            <p className="text-xl font-bold text-[#5a8fa3]">+{margin.toLocaleString('fr-FR')} €</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-3">
                                    {/* Direct PDF access */}
                                    <a href={`/api/crm/quote-pdf?id=${selectedQuote.id}`} target="_blank" rel="noopener noreferrer"
                                        className="w-full py-4 bg-gradient-to-r from-[#2E2E2E] to-[#1a1a2e] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2">
                                        <Globe size={16} /> Voir la Proposition PDF
                                    </a>
                                    <a href={`/api/crm/quotes-xlsx?id=${selectedQuote.id}`} download
                                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2">
                                        <FileSpreadsheet size={16} /> Export Excel
                                    </a>
                                    <button onClick={() => setSendModal({ open: true, quote: selectedQuote, contact: contacts.find(c => c.id === selectedQuote.clientId) || null })}
                                        className="w-full py-4 bg-[#bcdeea] text-[#2E2E2E] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-all shadow-xl shadow-sky-50 flex items-center justify-center gap-2">
                                        <Send size={16} /> Envoyer au Client
                                    </button>
                                    {/* Link to AI proposal if a matching lead exists */}
                                    {(() => {
                                        const matchingLead = leads.find(l => l.clientId === selectedQuote.clientId && l.agentResults);
                                        if (!matchingLead) return null;
                                        return (
                                            <Link href={`/crm/leads/${matchingLead.id}/proposal`}
                                                className="w-full py-3 bg-gradient-to-r from-[#b9dae9]/20 to-[#b9dae9]/10 text-[#2E2E2E] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:from-[#b9dae9]/30 hover:to-[#b9dae9]/20 transition-all flex items-center justify-center gap-2 border border-[#b9dae9]/30">
                                                <Sparkles size={14} /> Voir Résultats IA
                                            </Link>
                                        );
                                    })()}
                                    <button onClick={() => setSelectedQuote(null)} className="w-full py-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Désélectionner</button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-24 text-center space-y-6 opacity-40">
                                <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto text-gray-200 border border-gray-100 border-dashed">
                                    <FileSignature size={32} />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed px-6">Sélectionnez un devis pour analyser le détail des marges et frais d'agence.</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="flex-1 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Devis</T></h1>
                            <p className="text-sm text-[#6B7280] mt-1 font-medium">Gérez vos propositions tarifaires et maximisez vos marges agents.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-luna-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-gray-800 transition-all flex items-center gap-2">
                            <Plus size={18} /> Créer un Devis
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {(['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${filter === f ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                                {f === 'ALL' ? 'Tous' : f === 'DRAFT' ? 'Brouillons' : f === 'SENT' ? 'Envoyés' : f === 'ACCEPTED' ? 'Acceptés' : 'Refusés'}
                            </button>
                        ))}
                    </div>

                    {/* Grid of Quotes */}
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map(quote => {
                            const matchingLead = leads.find(l => l.clientId === quote.clientId && l.agentResults);
                            return (
                            <div
                                key={quote.id}
                                onClick={() => {
                                    if (matchingLead?.id) {
                                        router.push(`/crm/leads/${matchingLead.id}/proposal`);
                                    } else {
                                        setSelectedQuote(quote);
                                    }
                                }}
                                className={`group p-8 bg-white rounded-[24px] border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 ${selectedQuote?.id === quote.id ? 'border-emerald-500 shadow-2xl shadow-[#bcdeea]/10 duration-500 h-[140px]' : 'border-gray-100 hover:border-gray-300 shadow-sm h-[140px]'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${selectedQuote?.id === quote.id ? 'bg-[#bcdeea] text-[#2E2E2E] shadow-xl shadow-sky-100' : 'bg-gray-50 text-gray-300 group-hover:bg-gray-100'}`}>
                                        <FileSignature size={28} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{quote.quoteNumber}</p>
                                        <h3 className="text-xl font-bold text-luna-charcoal tracking-tight leading-tight uppercase">{quote.clientName}</h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-400 font-sans">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(quote.issueDate)}</span>
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100"><Briefcase size={12} /> {quote.items.length} lignes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${getStatusStyle(quote.status)} border`}>
                                            {quote.status}
                                        </span>
                                        <p className="text-2xl font-normal text-luna-charcoal tracking-tight">{quote.totalAmount.toLocaleString('fr-FR')} €</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleDeleteQuote(quote.id!, e)}
                                            className={`px-2 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${deletingId === quote.id ? 'bg-red-500 text-white opacity-100 shadow-lg' : 'p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'}`}
                                            title="Supprimer ce devis"
                                        >
                                            <Trash2 size={14} />
                                            {deletingId === quote.id && <span>Supprimer ?</span>}
                                        </button>
                                        {deletingId === quote.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeletingId(null); }}
                                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <ChevronRight size={24} className={`text-gray-200 group-hover:translate-x-1 transition-all ${selectedQuote?.id === quote.id ? 'text-[#5a8fa3]' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </main>

                {/* Modal: Create Quote */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
                            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden">
                                {/* Luna Header */}
                                <div className="p-10 md:p-12 pb-6 bg-luna-charcoal text-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <h2 className="text-3xl font-light tracking-tight">Nouveau Devis Executive</h2>
                                            <p className="text-[#b9dae9] text-xs mt-1 font-medium">Générez une proposition sur-mesure avec contrôle de marge</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                                    </div>
                                </div>
                                <div className="p-10 md:p-12 pt-6">
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Client Privé</label>
                                                <select value={newQuote.clientId} onChange={e => setNewQuote(p => ({ ...p, clientId: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans font-medium">
                                                    <option value="">Sélectionner un contact</option>
                                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Associer à un Voyage</label>
                                                <select value={newQuote.tripId} onChange={e => handleTripSelect(e.target.value)} className="w-full px-5 py-4 bg-gray-50 rounded-[22px] border-none text-sm focus:ring-2 focus:ring-emerald-200 font-sans font-medium">
                                                    <option value="">Indépendant</option>
                                                    {trips.map(t => <option key={t.id} value={t.id!}>{t.title || t.destination}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-72 overflow-y-auto pr-3 no-scrollbar custom-scroll">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block sticky top-0 bg-white py-2 z-10">Lignes de Prestations</label>
                                            {quoteItems.map((item, idx) => (
                                                <div key={item.id} className="p-5 rounded-[28px] bg-gray-50/50 border border-gray-100 flex items-center gap-5 transition-all hover:bg-white hover:shadow-lg">
                                                    <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-emerald-500 focus:ring-emerald-500" checked={item.selected} onChange={e => {
                                                        const n = [...quoteItems]; n[idx].selected = e.target.checked; setQuoteItems(n);
                                                    }} />
                                                    <input className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-0" value={item.description} onChange={e => { const n = [...quoteItems]; n[idx].description = e.target.value; setQuoteItems(n); }} placeholder="Désignation du service..." />
                                                    <div className="flex items-center gap-2">
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest block">Achat (€)</span>
                                                            <input type="number" className="w-24 bg-white border border-gray-100 rounded-xl text-xs py-2 px-3 text-center font-sans" value={item.netCost} onChange={e => { const n = [...quoteItems]; n[idx].netCost = +e.target.value; setQuoteItems(n); }} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">Vente (€)</span>
                                                            <input type="number" className="w-24 bg-white border-emerald-100 rounded-xl text-xs py-2 px-3 text-center font-bold text-emerald-600 font-sans" value={item.unitPrice} onChange={e => { const n = [...quoteItems]; n[idx].unitPrice = +e.target.value; setQuoteItems(n); }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setQuoteItems(p => [...p, { id: Date.now().toString(), description: '', quantity: 1, netCost: 0, unitPrice: 0, selected: true }])} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[28px] text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center justify-center gap-2 hover:border-[#bcdeea]/40 hover:text-[#5a8fa3] transition-all">
                                                <Plus size={16} /> Ajouter une ligne personnalisée
                                            </button>
                                        </div>

                                        <div className="pt-8 flex gap-4">
                                            <button onClick={handleCreate} disabled={!newQuote.clientId} className="flex-1 py-5 bg-luna-charcoal text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-black transition-all">Générer la Proposition Finale</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Send Modal — Luna Branded */}
                <AnimatePresence>
                    {sendModal.open && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setSendModal({ open: false, quote: null, contact: null })} />
                            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
                                {/* Luna Header */}
                                <div className="p-10 pb-6 bg-luna-charcoal text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-light tracking-tight">Transmission Devis</h2>
                                            <p className="text-[#b9dae9] text-xs mt-1 font-medium">Envoyez la proposition à <strong className="text-white">{sendModal.contact?.firstName} {sendModal.contact?.lastName}</strong></p>
                                        </div>
                                        <button onClick={() => setSendModal({ open: false, quote: null, contact: null })} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                    </div>
                                </div>
                                <div className="p-10 pt-8 space-y-3">
                                    <button onClick={() => handleSendQuote('WHATSAPP')} disabled={sending} className="w-full py-5 bg-[#5a8fa3] text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#4a7f93] transition-all shadow-xl shadow-[#bcdeea]/15 disabled:opacity-50">
                                        <MessageCircle size={20} /> Via WhatsApp Business
                                    </button>
                                    <button onClick={() => handleSendQuote('EMAIL')} disabled={sending} className="w-full py-5 bg-indigo-500 text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50">
                                        <Mail size={20} /> Via Email Professionnel
                                    </button>
                                    <div className="pt-3 border-t border-gray-100">
                                        <button onClick={() => { if (sendModal.quote?.id) window.open(`/api/crm/quote-pdf?id=${sendModal.quote.id}`, '_blank'); }} className="w-full py-5 bg-[#b9dae9] text-[#2E2E2E] rounded-[24px] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#a8cdd8] transition-all shadow-lg">
                                            <Globe size={20} /> Télécharger PDF Premium
                                        </button>
                                    </div>
                                    <button onClick={() => setSendModal({ open: false, quote: null, contact: null })} className="w-full py-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Annuler</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
