'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Plane, MapPin, Calendar, Users, Check, MessageCircle,
    Loader2, AlertCircle, CheckCircle2, Clock, ArrowRight,
    FileText, CreditCard, ChevronDown, Send,
} from 'lucide-react';

/* ═══════════════════════════════════════
   CLIENT PORTAL — Unified Branded View
   Access via /portal/[token]
   Tabs: Voyage | Devis | Paiements | Messages
   ═══════════════════════════════════════ */

const SEGMENT_ICONS: Record<string, string> = {
    FLIGHT: '✈️', HOTEL: '🏨', ACTIVITY: '🎯', TRANSFER: '🚗',
    TRAIN: '🚆', RESTAURANT: '🍽', BOAT: '⛵', SPA: '🧖',
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
    CONFIRMED: { label: 'Confirmé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    TICKETED: { label: 'Billets émis', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    CANCELLED: { label: 'Annulé', color: 'bg-red-50 text-red-500 border-red-200' },
};

type Tab = 'voyage' | 'devis' | 'paiements' | 'messages';

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('voyage');
    const [expandedDay, setExpandedDay] = useState<number | null>(0);

    // Quote action state
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<string | null>(null);
    const [showChanges, setShowChanges] = useState(false);
    const [changesMsg, setChangesMsg] = useState('');
    const [signatureName, setSignatureName] = useState('');
    const [showSignature, setShowSignature] = useState(false);

    useEffect(() => {
        fetch(`/api/portal/${token}`)
            .then(r => r.json())
            .then(json => {
                if (json.error) setError(json.error);
                else setData(json);
            })
            .catch(() => setError('Portail introuvable'))
            .finally(() => setLoading(false));
    }, [token]);

    const daysUntil = useMemo(() => {
        if (!data?.trip?.startDate) return null;
        const diff = differenceInDays(parseISO(data.trip.startDate), new Date());
        return diff >= 0 ? diff : null;
    }, [data]);

    const handleQuoteAction = async (action: string) => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/portal/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, message: changesMsg, signatureName }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setSubmitted(json.status);
        } catch (e: any) {
            alert(e.message || 'Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ──
    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border border-gray-200 animate-ping" />
                    <div className="absolute inset-2 rounded-full border border-gray-300 animate-pulse" />
                </div>
                <p className="text-[#2E2E2E] text-xs tracking-[0.3em] uppercase font-medium">Chargement…</p>
            </div>
        </div>
    );

    // ── Error ──
    if (error || !data) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <AlertCircle size={28} className="text-gray-400" />
                </div>
                <h1 className="text-2xl font-light text-[#2E2E2E] mb-3">Portail introuvable</h1>
                <p className="text-gray-500 text-sm">Ce lien est invalide ou a expiré.</p>
            </div>
        </div>
    );

    const { branding, trip, days, bookings, quote, invoices, scheduledMessages, clientName } = data;
    const hasTrip = trip && days?.length > 0;
    const hasQuote = !!quote;
    const hasInvoices = invoices?.length > 0;
    const hasMessages = scheduledMessages?.length > 0;

    // Build available tabs
    const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
        ...(hasTrip ? [{ key: 'voyage' as Tab, label: 'Mon Voyage', icon: Plane, count: days?.length }] : []),
        ...(hasQuote ? [{ key: 'devis' as Tab, label: 'Mon Devis', icon: FileText }] : []),
        ...(hasInvoices ? [{ key: 'paiements' as Tab, label: 'Paiements', icon: CreditCard, count: invoices.length }] : []),
        ...(hasMessages ? [{ key: 'messages' as Tab, label: 'Messages', icon: MessageCircle, count: scheduledMessages.length }] : []),
    ];

    // Default to first available tab
    if (!tabs.find(t => t.key === activeTab) && tabs.length > 0) {
        setActiveTab(tabs[0].key);
    }

    const accentColor = branding?.accentColor || '#5a8fa3';

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
            {/* ═══ HEADER — Branded ═══ */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    {branding?.logo ? (
                        <img src={branding.logo} alt={branding.name} className="h-8 w-auto object-contain brightness-0" />
                    ) : (
                        <span className="text-lg font-medium text-[#2E2E2E] tracking-tight">{branding?.name || 'Conciergerie'}</span>
                    )}
                    <span className="text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: accentColor }}>
                        Espace Client
                    </span>
                </div>
            </header>

            {/* ═══ HERO ═══ */}
            <section className="max-w-4xl mx-auto px-6 pt-10 pb-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: accentColor }}>
                        Bonjour {clientName}
                    </p>
                    {trip ? (
                        <>
                            <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight text-[#2E2E2E] mb-2">
                                {trip.destination || trip.title || 'Votre Voyage'}
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {trip.startDate && (
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs text-[#2E2E2E]">
                                        <Calendar size={13} className="text-gray-400" />
                                        {format(parseISO(trip.startDate), "d MMM", { locale: fr })}
                                        {trip.endDate && ` — ${format(parseISO(trip.endDate), "d MMM yyyy", { locale: fr })}`}
                                    </div>
                                )}
                                {days?.length > 0 && (
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs text-[#2E2E2E]">
                                        <MapPin size={13} className="text-gray-400" />
                                        {days.length} jours
                                    </div>
                                )}
                                {trip.travelers && (
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs text-[#2E2E2E]">
                                        <Users size={13} className="text-gray-400" />
                                        {trip.travelers} voyageur{trip.travelers > 1 ? 's' : ''}
                                    </div>
                                )}
                                {daysUntil !== null && daysUntil > 0 && (
                                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white font-bold" style={{ backgroundColor: '#2E2E2E' }}>
                                        🛫 J-{daysUntil}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <h1 className="text-3xl font-light tracking-tight text-[#2E2E2E]">Votre Espace</h1>
                    )}
                </motion.div>
            </section>

            {/* ═══ TABS ═══ */}
            {tabs.length > 1 && (
                <div className="max-w-4xl mx-auto px-6 mb-8">
                    <div className="flex gap-1 bg-gray-50 rounded-2xl p-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-white text-[#2E2E2E] shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <tab.icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.count && (
                                    <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ CONTENT ═══ */}
            <main className="max-w-4xl mx-auto px-6 pb-20">
                <AnimatePresence mode="wait">
                    {/* ── TAB: VOYAGE ── */}
                    {activeTab === 'voyage' && hasTrip && (
                        <motion.div key="voyage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {/* Itinerary */}
                            <div className="space-y-3 mb-10">
                                {days.map((day: any, idx: number) => {
                                    const isExpanded = expandedDay === idx;
                                    const dayDate = day.date ? new Date(day.date) : null;
                                    return (
                                        <div key={day.id || idx}>
                                            <button
                                                onClick={() => setExpandedDay(isExpanded ? null : idx)}
                                                className="w-full bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-lg bg-gray-50 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-[7px] text-gray-400 uppercase font-bold">Jour</span>
                                                        <span className="text-base font-light text-[#2E2E2E]">{day.dayIndex || idx + 1}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-sm text-[#2E2E2E] truncate">{day.title || `Jour ${idx + 1}`}</h3>
                                                        {dayDate && <p className="text-[10px] text-gray-400 mt-0.5">{format(dayDate, "EEEE d MMMM", { locale: fr })}</p>}
                                                    </div>
                                                    <ChevronDown size={14} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (day.segments || []).length > 0 && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden">
                                                        <div className="ml-6 border-l border-gray-100 space-y-0 mt-1 mb-2">
                                                            {day.segments.map((seg: any, sIdx: number) => (
                                                                <div key={seg.id || sIdx} className="relative pl-6 py-2">
                                                                    <div className="absolute left-[-3px] top-4 w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-50">
                                                                        <div className="flex items-start gap-3">
                                                                            <span className="text-sm">{SEGMENT_ICONS[seg.type] || '📌'}</span>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-medium text-xs text-[#2E2E2E]">{seg.title}</h4>
                                                                                {seg.description && <p className="text-[11px] text-gray-400 mt-0.5">{seg.description}</p>}
                                                                                {seg.location && <p className="text-[9px] text-gray-300 mt-0.5">📍 {seg.location}</p>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bookings */}
                            {bookings?.length > 0 && (
                                <div>
                                    <h2 className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-300 mb-4 flex items-center gap-3">
                                        <span className="h-px bg-gray-100 flex-1" />
                                        Réservations
                                        <span className="h-px bg-gray-100 flex-1" />
                                    </h2>
                                    <div className="space-y-2">
                                        {bookings.map((b: any, i: number) => {
                                            const status = BOOKING_STATUS[b.status] || BOOKING_STATUS.PENDING;
                                            return (
                                                <div key={i} className="bg-white rounded-lg p-3 border border-gray-50 flex items-center gap-3">
                                                    <span className="text-sm">{SEGMENT_ICONS[b.type] || '📌'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-xs text-[#2E2E2E] truncate">{b.supplier || b.destination}</p>
                                                        <p className="text-[9px] text-gray-400">{b.checkIn}{b.checkOut ? ` → ${b.checkOut}` : ''}</p>
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TAB: DEVIS ── */}
                    {activeTab === 'devis' && hasQuote && (
                        <motion.div key="devis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {submitted ? (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 text-center">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${submitted === 'ACCEPTED' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                        {submitted === 'ACCEPTED' ? <CheckCircle2 size={36} className="text-emerald-500" /> : <MessageCircle size={36} className="text-amber-500" />}
                                    </div>
                                    <h2 className="text-2xl font-light text-[#2E2E2E] mb-2">
                                        {submitted === 'ACCEPTED' ? 'Devis accepté !' : 'Demande envoyée'}
                                    </h2>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                                        {submitted === 'ACCEPTED'
                                            ? 'Merci pour votre confiance. Votre conseiller va préparer la suite.'
                                            : 'Votre demande de modification a été transmise.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                                    {/* Quote header */}
                                    <div className="bg-[#2E2E2E] text-white px-8 py-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Devis n°</p>
                                                <p className="text-lg font-medium">{quote.quoteNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Total</p>
                                                <p className="text-2xl font-bold tracking-tight">{quote.totalAmount?.toLocaleString('fr-FR')} {quote.currency}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> Émis le {quote.issueDate ? new Date(quote.issueDate).toLocaleDateString('fr-FR') : '—'}</span>
                                        {quote.validUntil && (
                                            <span className={`font-bold px-3 py-1 rounded-full ${new Date(quote.validUntil) < new Date() ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {new Date(quote.validUntil) < new Date() ? 'Expiré' : `Valide jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Items */}
                                    <div className="px-8 py-6 space-y-3">
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Détail des prestations</p>
                                        {(quote.items || []).map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-300">{i + 1}</div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#2E2E2E]">{item.description}</p>
                                                        {item.quantity > 1 && <p className="text-[10px] text-gray-400">x{item.quantity}</p>}
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-[#2E2E2E]">{(item.total || item.unitPrice * item.quantity)?.toLocaleString('fr-FR')} {quote.currency}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Sous-total</span>
                                                <span>{quote.subtotal?.toLocaleString('fr-FR')} {quote.currency}</span>
                                            </div>
                                            {quote.taxTotal > 0 && (
                                                <div className="flex justify-between text-sm text-gray-500">
                                                    <span>TVA</span>
                                                    <span>{quote.taxTotal.toLocaleString('fr-FR')} {quote.currency}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-3 border-t border-gray-200">
                                                <span className="text-base font-bold text-[#2E2E2E]">Total</span>
                                                <span className="text-xl font-bold text-[#2E2E2E]">{quote.totalAmount?.toLocaleString('fr-FR')} {quote.currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {quote.status !== 'ACCEPTED' && !(quote.validUntil && new Date(quote.validUntil) < new Date()) && (
                                        <div className="px-8 py-6 space-y-3">
                                            {!showSignature ? (
                                                <button onClick={() => setShowSignature(true)} disabled={submitting}
                                                    className="w-full py-4 bg-[#2E2E2E] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-black transition-all cursor-pointer">
                                                    <Check size={16} /> Accepter le devis
                                                </button>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                                    <p className="text-xs text-gray-500">Signez en tapant votre nom complet :</p>
                                                    <input type="text" value={signatureName} onChange={e => setSignatureName(e.target.value)}
                                                        placeholder="Prénom Nom" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-gray-400 outline-none" />
                                                    <label className="flex items-start gap-2 text-[11px] text-gray-500">
                                                        <input type="checkbox" className="mt-0.5 accent-[#2E2E2E]" required />
                                                        J&apos;accepte ce devis et les conditions générales de vente.
                                                    </label>
                                                    <button onClick={() => handleQuoteAction('ACCEPT_QUOTE')} disabled={submitting || !signatureName.trim()}
                                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer">
                                                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                        Confirmer la signature
                                                    </button>
                                                </motion.div>
                                            )}

                                            {!showChanges ? (
                                                <button onClick={() => setShowChanges(true)}
                                                    className="w-full py-3 text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-[#2E2E2E] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                                    <MessageCircle size={14} /> Demander des modifications
                                                </button>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                                    <textarea value={changesMsg} onChange={e => setChangesMsg(e.target.value)}
                                                        placeholder="Décrivez les modifications souhaitées..."
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:border-gray-400 outline-none" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setShowChanges(false)}
                                                            className="flex-1 py-3 text-gray-400 text-xs font-bold border border-gray-200 rounded-xl cursor-pointer">Annuler</button>
                                                        <button onClick={() => handleQuoteAction('REQUEST_CHANGES')} disabled={submitting || !changesMsg.trim()}
                                                            className="flex-1 py-3 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                                                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                            Envoyer
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {quote.status === 'ACCEPTED' && (
                                        <div className="px-8 py-6">
                                            <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium">
                                                <CheckCircle2 size={18} /> Ce devis a été accepté. Merci !
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TAB: PAIEMENTS ── */}
                    {activeTab === 'paiements' && hasInvoices && (
                        <motion.div key="paiements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="space-y-3">
                                {invoices.map((inv: any, i: number) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-300 font-bold">Facture</p>
                                                <p className="text-sm font-medium text-[#2E2E2E]">{inv.invoiceNumber || `#${i + 1}`}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full ${
                                                inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600'
                                                    : inv.status === 'OVERDUE' ? 'bg-red-50 text-red-500'
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {inv.status === 'PAID' ? 'Payée' : inv.status === 'OVERDUE' ? 'En retard' : 'En attente'}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div className="text-xs text-gray-400">
                                                {inv.issueDate && <p>Émise le {new Date(inv.issueDate).toLocaleDateString('fr-FR')}</p>}
                                                {inv.dueDate && <p>Échéance : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>}
                                            </div>
                                            <p className="text-xl font-bold text-[#2E2E2E]">{inv.totalAmount?.toLocaleString('fr-FR')} {inv.currency || '€'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── TAB: MESSAGES ── */}
                    {activeTab === 'messages' && hasMessages && (
                        <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="space-y-3">
                                {scheduledMessages.map((msg: any, i: number) => {
                                    const isPast = new Date(msg.scheduledDate) <= new Date();
                                    return (
                                        <div key={i} className={`bg-white rounded-2xl border p-5 ${isPast ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-50'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isPast ? 'bg-[#2E2E2E] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {isPast ? '✓' : '🔒'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#2E2E2E]">{msg.title}</p>
                                                    <p className="text-[9px] text-gray-400">
                                                        {format(new Date(msg.scheduledDate), "d MMMM yyyy", { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                            {isPast ? (
                                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{msg.message}</p>
                                            ) : (
                                                <p className="text-[10px] text-gray-300 italic">Message programmé — visible le jour venu</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ═══ FOOTER ═══ */}
            <footer className="border-t border-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    {branding?.logo && (
                        <img src={branding.logo} alt={branding.name} className="h-6 w-auto object-contain brightness-0 mx-auto mb-3" />
                    )}
                    <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase font-medium">
                        {branding?.name || 'Votre Conciergerie Voyage'}
                    </p>
                    <p className="text-[9px] text-gray-200 mt-1">© {new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
}
