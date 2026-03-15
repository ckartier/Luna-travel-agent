'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MessageCircle, FileSignature, Loader2, AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface QuoteItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
}

interface SharedQuote {
    quoteNumber: string;
    clientName: string;
    agencyName: string;
    agencyLogo?: string;
    issueDate: string;
    validUntil: string;
    items: QuoteItem[];
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
    currency: string;
    status: string;
    shareId: string;
}

export default function QuoteValidationPage() {
    const params = useParams();
    const shareId = params.shareId as string;

    const [quote, setQuote] = useState<SharedQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<'ACCEPTED' | 'CHANGES_REQUESTED' | null>(null);
    const [showChangesForm, setShowChangesForm] = useState(false);
    const [changesMessage, setChangesMessage] = useState('');

    useEffect(() => {
        if (!shareId) return;
        fetch(`/api/quote/${shareId}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setError(data.error); }
                else { setQuote(data); }
            })
            .catch(() => setError('Impossible de charger le devis'))
            .finally(() => setLoading(false));
    }, [shareId]);

    const handleAction = async (action: 'ACCEPT' | 'REQUEST_CHANGES') => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/quote/${shareId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, message: changesMessage }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSubmitted(action === 'ACCEPT' ? 'ACCEPTED' : 'CHANGES_REQUESTED');
        } catch (e: any) {
            alert(e.message || 'Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
        catch { return d; }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
            <Loader2 size={32} className="text-[#b9dae9] animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={28} className="text-red-400" />
                </div>
                <h1 className="text-xl font-medium text-[#2E2E2E]">Devis introuvable</h1>
                <p className="text-sm text-gray-500">Ce lien de devis n&apos;existe pas ou a expiré.</p>
            </div>
        </div>
    );

    if (!quote) return null;

    const isExpired = new Date(quote.validUntil) < new Date();
    const alreadyAccepted = quote.status === 'ACCEPTED';

    return (
        <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
            {/* Background pattern */}
            <div className="fixed inset-0 z-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #2E2E2E 1px, transparent 0)`,
                backgroundSize: '32px 32px',
            }} />

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 md:py-20">
                {/* Logo / Agency Name */}
                <div className="text-center mb-12">
                    {quote.agencyLogo ? (
                        <img src={quote.agencyLogo} alt={quote.agencyName} className="h-8 w-auto mx-auto brightness-0 mb-3" />
                    ) : (
                        <h2 className="text-lg font-medium text-[#2E2E2E] tracking-tight">{quote.agencyName}</h2>
                    )}
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#B89B7A] font-bold mt-1">Proposition tarifaire</p>
                </div>

                {/* Success State */}
                <AnimatePresence>
                    {submitted && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-10 text-center space-y-6"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${submitted === 'ACCEPTED' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                {submitted === 'ACCEPTED'
                                    ? <CheckCircle2 size={36} className="text-emerald-500" />
                                    : <MessageCircle size={36} className="text-amber-500" />
                                }
                            </div>
                            <h2 className="text-2xl font-light text-[#2E2E2E] tracking-tight">
                                {submitted === 'ACCEPTED' ? 'Devis accepté !' : 'Demande envoyée'}
                            </h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                {submitted === 'ACCEPTED'
                                    ? 'Merci pour votre confiance. Votre conseiller va préparer la facture et reviendra vers vous très rapidement.'
                                    : 'Votre demande de modification a été transmise. Votre conseiller reviendra vers vous avec une proposition mise à jour.'
                                }
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Quote Card */}
                {!submitted && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-[#2E2E2E] text-white px-8 py-7">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Devis n°</p>
                                        <p className="text-lg font-medium tracking-tight">{quote.quoteNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Destinataire</p>
                                        <p className="text-lg font-medium tracking-tight">{quote.clientName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock size={13} />
                                    Émis le {formatDate(quote.issueDate)}
                                </div>
                                <div className={`text-xs font-bold px-3 py-1 rounded-full ${isExpired ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {isExpired ? 'Expiré' : `Valide jusqu'au ${formatDate(quote.validUntil)}`}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="px-8 py-6 space-y-3">
                                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Détail des prestations</p>
                                {quote.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#b9dae9]/15 rounded-xl flex items-center justify-center text-xs font-bold text-[#2E2E2E]/40">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#2E2E2E]">{item.description}</p>
                                                {item.quantity > 1 && <p className="text-[10px] text-gray-400">x{item.quantity}</p>}
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-[#2E2E2E]">{item.total?.toLocaleString('fr-FR') || (item.unitPrice * item.quantity).toLocaleString('fr-FR')} {quote.currency}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="px-8 py-6 bg-[#FAFAFA] border-t border-gray-100">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Sous-total</span>
                                        <span>{quote.subtotal.toLocaleString('fr-FR')} {quote.currency}</span>
                                    </div>
                                    {quote.taxTotal > 0 && (
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>TVA</span>
                                            <span>{quote.taxTotal.toLocaleString('fr-FR')} {quote.currency}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-3 border-t border-gray-200">
                                        <span className="text-base font-bold text-[#2E2E2E]">Total</span>
                                        <span className="text-2xl font-bold text-[#2E2E2E] tracking-tight">{quote.totalAmount.toLocaleString('fr-FR')} {quote.currency}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {!alreadyAccepted && !isExpired && (
                                <div className="px-8 py-6 space-y-3">
                                    <button
                                        onClick={() => handleAction('ACCEPT')}
                                        disabled={submitting}
                                        className="w-full py-4.5 bg-[#2E2E2E] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        Accepter le devis
                                    </button>
                                    {!showChangesForm ? (
                                        <button
                                            onClick={() => setShowChangesForm(true)}
                                            className="w-full py-3.5 text-[#9CA3AF] text-xs font-bold uppercase tracking-[0.15em] hover:text-[#2E2E2E] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={14} />
                                            Demander des modifications
                                        </button>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                            <textarea
                                                value={changesMessage}
                                                onChange={e => setChangesMessage(e.target.value)}
                                                placeholder="Décrivez les modifications souhaitées..."
                                                className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm resize-none h-24 focus:border-[#b9dae9] focus:ring-2 focus:ring-[#b9dae9]/20 outline-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowChangesForm(false)}
                                                    className="flex-1 py-3 text-gray-400 text-xs font-bold uppercase tracking-wider border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={() => handleAction('REQUEST_CHANGES')}
                                                    disabled={submitting || !changesMessage.trim()}
                                                    className="flex-1 py-3 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                                    Envoyer
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {alreadyAccepted && (
                                <div className="px-8 py-6">
                                    <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium">
                                        <CheckCircle2 size={18} />
                                        Ce devis a déjà été accepté. Merci !
                                    </div>
                                </div>
                            )}

                            {isExpired && !alreadyAccepted && (
                                <div className="px-8 py-6">
                                    <div className="bg-red-50 text-red-600 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium">
                                        <AlertCircle size={18} />
                                        Ce devis a expiré. Contactez votre conseiller pour un nouveau devis.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-8">
                            <p className="text-[10px] text-gray-300 tracking-wider">
                                Propulsé par Luna · Conciergerie Intelligente
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
