'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Search, RefreshCw, AlertCircle, CalendarClock, Sparkles, Plane, Hotel, Users, CalendarRange, ArrowRight, CheckCircle2, Loader2, X, PlusCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, createActivity, createContact, findContactByEmail } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

export default function MailsPage() {
    const { tenantId } = useAuth();
    const [emails, setEmails] = useState<any[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [emailContentLoading, setEmailContentLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [dispatching, setDispatching] = useState(false);
    const [dispatched, setDispatched] = useState(false);
    const [addingToPipeline, setAddingToPipeline] = useState(false);
    const [addedToPipeline, setAddedToPipeline] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetchWithAuth('/api/gmail/list');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setEmails(data.emails || []);
        } catch (err: any) {
            setError(err.message || "Failed to load emails");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmails(); }, []);

    const handleSelectEmail = async (email: any) => {
        setSelectedEmail(email);
        setAnalysis(null);
        setDispatched(false);
        setAddedToPipeline(false);
        if (!email.bodyText) {
            setEmailContentLoading(true);
            try {
                const res = await fetch(`/api/gmail/list?action=get&messageId=${email.id}`);
                const data = await res.json();
                setEmails(prev => prev.map(e => e.id === email.id ? { ...e, ...data } : e));
                setSelectedEmail({ ...email, ...data });
            } catch (err) {
                console.error("Failed to fetch full email body", err);
            } finally {
                setEmailContentLoading(false);
            }
        }
    };

    const handleAnalyzeEmail = async () => {
        if (!selectedEmail) return;
        setAnalyzing(true);
        try {
            const res = await fetchWithAuth('/api/email-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailBody: selectedEmail.bodyText || selectedEmail.snippet || '',
                    emailSubject: selectedEmail.subject,
                    emailSender: selectedEmail.sender,
                }),
            });
            const data = await res.json();
            setAnalysis(data.analysis);
        } catch (err) {
            console.error("Failed to analyze email", err);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDispatchToAgents = async () => {
        if (!analysis) return;
        setDispatching(true);
        try {
            const ext = analysis.extracted || {};
            const destinations = (ext.destinations || ['Paris']);
            const params = new URLSearchParams({
                dest: destinations[0] || 'Paris',
                from: 'Paris',
                dep: ext.departureDate || '',
                ret: ext.returnDate || '',
                budget: ext.budget || '',
                pax: ext.pax || '2',
                vibe: ext.vibe || '',
                notes: ext.mustHaves || '',
                autoStart: 'true',
            });

            // Find or create contact
            const senderEmail = selectedEmail?.sender?.match(/<(.+)>/)?.[1] || selectedEmail?.sender || '';
            const clientName = ext.clientName || selectedEmail?.sender?.replace(/<.*>/, '').trim() || 'Client';
            let contactId = '';
            try {
                const existing = await findContactByEmail(tenantId!, senderEmail);
                if (existing?.id) {
                    contactId = existing.id;
                } else if (senderEmail) {
                    const names = clientName.split(' ');
                    contactId = await createContact(tenantId!, {
                        firstName: names[0] || clientName,
                        lastName: names.slice(1).join(' ') || '',
                        email: senderEmail.toLowerCase().trim(),
                        vipLevel: 'Standard',
                        preferences: destinations,
                    });
                }
            } catch (e) { console.error('Contact save failed:', e); }

            // Add to pipeline with contact link
            let leadId = '';
            try {
                leadId = await createLead(tenantId!, {
                    clientName,
                    clientId: contactId,
                    destination: destinations.join(', '),
                    dates: `${ext.departureDate || ''} → ${ext.returnDate || ''}`.trim() || 'À définir',
                    budget: ext.budget || 'À définir',
                    pax: ext.pax || '1',
                    vibe: ext.vibe || '',
                    mustHaves: ext.mustHaves || '',
                    status: 'ANALYSING',
                });
            } catch (e) { console.error('Pipeline save failed:', e); }

            // Auto-create follow-up activity
            try {
                await createActivity(tenantId!, {
                    title: `Suivi email — ${clientName} (${destinations.join(', ')})`,
                    time: 'Aujourd\'hui',
                    type: 'email',
                    status: 'PENDING',
                    color: 'blue',
                    iconName: 'Mail',
                    contactId,
                    contactName: clientName,
                    leadId,
                });
            } catch (e) { console.error('Activity save failed:', e); }

            setDispatched(true);
            setTimeout(() => {
                router.push(`/?${params.toString()}`);
            }, 1000);
        } catch (err) {
            console.error("Failed to dispatch", err);
        } finally {
            setDispatching(false);
        }
    };

    const handleAddToPipeline = async () => {
        if (!analysis) return;
        setAddingToPipeline(true);
        try {
            const ext = analysis.extracted || {};
            const senderEmail = selectedEmail?.sender?.match(/<(.+)>/)?.[1] || selectedEmail?.sender || '';
            const clientName = ext.clientName || selectedEmail?.sender?.replace(/<.*>/, '').trim() || 'Client';
            const destinations = ext.destinations || ['Non définie'];

            // Find or create contact
            let contactId = '';
            try {
                const existing = await findContactByEmail(tenantId!, senderEmail);
                if (existing?.id) {
                    contactId = existing.id;
                } else if (senderEmail) {
                    const names = clientName.split(' ');
                    contactId = await createContact(tenantId!, {
                        firstName: names[0] || clientName,
                        lastName: names.slice(1).join(' ') || '',
                        email: senderEmail.toLowerCase().trim(),
                        vipLevel: 'Standard',
                        preferences: destinations,
                    });
                }
            } catch (e) { console.error('Contact save failed:', e); }

            // Create lead linked to contact
            const leadId = await createLead(tenantId!, {
                clientName,
                clientId: contactId,
                destination: destinations.join(', '),
                dates: `${ext.departureDate || ''} → ${ext.returnDate || ''}`.trim() || 'À définir',
                budget: ext.budget || 'À définir',
                pax: ext.pax || '1',
                vibe: ext.vibe || '',
                mustHaves: ext.mustHaves || '',
                status: 'NEW',
            });

            // Auto-create follow-up activity
            try {
                await createActivity(tenantId!, {
                    title: `Nouvelle demande — ${clientName} (${destinations.join(', ')})`,
                    time: 'Aujourd\'hui',
                    type: 'email',
                    status: 'PENDING',
                    color: 'amber',
                    iconName: 'Mail',
                    contactId,
                    contactName: clientName,
                    leadId,
                });
            } catch (e) { console.error('Activity save failed:', e); }

            setAddedToPipeline(true);
        } catch (err) {
            console.error('Failed to add to pipeline', err);
        } finally {
            setAddingToPipeline(false);
        }
    };

    const priorityColors: Record<string, string> = {
        HIGH: 'bg-red-50 text-red-600 border-red-100',
        MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
        LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };

    const agentIcons = [
        { icon: Plane, name: 'Transport', color: 'text-sky-500' },
        { icon: Hotel, name: 'Hébergement', color: 'text-amber-500' },
        { icon: Users, name: 'Profil Client', color: 'text-purple-500' },
        { icon: CalendarRange, name: 'Itinéraire', color: 'text-emerald-500' },
    ];

    return (
        <div className="h-full flex flex-col pt-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-serif text-xl md:text-2xl font-serif font-light text-luna-charcoal tracking-tight flex items-center gap-2 md:gap-3">
                        Boîte de Réception <span className="bg-luna-accent/10 text-luna-accent-dark text-xs py-0.5 px-2.5 rounded-full font-sans font-semibold">{emails.length}</span>
                    </h1>
                    <p className="text-luna-text-muted text-xs md:text-sm mt-0.5 hidden sm:block">Analysez les demandes avec Luna AI et dispatchez aux agents.</p>
                </div>
                <button onClick={fetchEmails} disabled={loading}
                    className="bg-white hover:bg-luna-cream border border-luna-warm-gray/20 text-luna-charcoal font-medium px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 text-xs">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-luna-warm-gray/15 shadow-sm overflow-hidden flex">
                {/* Email List */}
                <div className={`w-full lg:w-80 border-r border-luna-warm-gray/10 flex flex-col bg-luna-cream/20 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-luna-warm-gray/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-luna-text-muted/40" size={14} />
                            <input type="text" placeholder="Rechercher..."
                                className="w-full pl-9 pr-3 py-2 bg-white border border-luna-warm-gray/20 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-100" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3">
                                <RefreshCw className="animate-spin" size={24} />
                                <p className="text-xs">Synchronisation…</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500 p-6 text-center space-y-3">
                                <AlertCircle size={24} />
                                <p className="text-xs">{error}</p>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3">
                                <Mail size={36} className="opacity-20" />
                                <p className="font-semibold text-sm text-luna-charcoal">Aucune demande.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-luna-warm-gray/10">
                                {emails.map(email => (
                                    <button key={email.id} onClick={() => handleSelectEmail(email)}
                                        className={`w-full text-left p-4 hover:bg-sky-50/50 transition-colors ${selectedEmail?.id === email.id ? 'bg-sky-50 border-l-2 border-l-sky-400' : 'border-l-2 border-l-transparent'}`}>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className="font-medium text-luna-charcoal truncate pr-3 text-xs">{email.sender.replace(/<.*>/, '')}</span>
                                            <span className="text-[10px] text-luna-text-muted whitespace-nowrap">
                                                {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <h4 className={`text-xs mb-0.5 truncate ${selectedEmail?.id === email.id ? 'font-semibold text-sky-600' : 'font-medium text-luna-charcoal'}`}>{email.subject}</h4>
                                        <p className="text-[10px] text-luna-text-muted truncate">{email.snippet?.replace(/&#39;/g, "'")}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Viewer + AI Analysis */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedEmail ? (
                        <div className="flex-1 overflow-y-auto flex flex-col h-full">
                            <div className="p-4 md:p-6 border-b border-luna-warm-gray/10">
                                {/* Mobile back button */}
                                <button onClick={() => setSelectedEmail(null)} className="lg:hidden text-xs text-sky-500 font-medium mb-3 flex items-center gap-1">← Retour aux emails</button>
                                <h2 className="font-serif text-lg md:text-xl font-semibold text-luna-charcoal mb-4">{selectedEmail.subject}</h2>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-semibold text-sm border border-sky-100">
                                            {selectedEmail.sender.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-luna-charcoal text-sm">{selectedEmail.sender}</p>
                                            <p className="text-[10px] text-luna-text-muted flex items-center gap-1">
                                                <CalendarClock size={10} />
                                                {new Date(selectedEmail.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleAnalyzeEmail} disabled={analyzing}
                                        className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-sky-500/20 transition-all text-xs flex items-center gap-2 disabled:opacity-60">
                                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        {analyzing ? 'Analyse…' : 'Analyser avec Luna AI'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex">
                                {/* Email body */}
                                <div className="flex-1 p-6 border-r border-luna-warm-gray/10">
                                    {emailContentLoading ? (
                                        <div className="animate-pulse space-y-3">
                                            <div className="h-3 bg-luna-cream rounded w-3/4" />
                                            <div className="h-3 bg-luna-cream rounded w-1/2" />
                                            <div className="h-3 bg-luna-cream rounded w-5/6" />
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm max-w-none text-luna-charcoal leading-relaxed whitespace-pre-wrap text-sm">
                                            {selectedEmail.bodyText || "Contenu non disponible."}
                                        </div>
                                    )}
                                </div>

                                {/* AI Analysis Panel */}
                                <AnimatePresence>
                                    {analysis && (
                                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                                            className="bg-gradient-to-b from-sky-50/50 to-white border-l border-sky-100/30 overflow-hidden flex-shrink-0">
                                            <div className="p-5 h-full overflow-y-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles size={14} className="text-sky-500" />
                                                        <h3 className="font-semibold text-sm text-luna-charcoal">Analyse Luna AI</h3>
                                                    </div>
                                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[analysis.priority] || priorityColors.MEDIUM}`}>
                                                        {analysis.priority || 'MEDIUM'}
                                                    </span>
                                                </div>

                                                {/* Summary */}
                                                <div className="bg-white rounded-xl p-3.5 border border-sky-100/30 mb-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                                                    <p className="text-xs text-luna-charcoal leading-relaxed">{analysis.summary}</p>
                                                </div>

                                                {/* Extracted data */}
                                                {analysis.extracted && (
                                                    <div className="space-y-2.5 mb-4">
                                                        <h4 className="text-[10px] uppercase tracking-wider font-semibold text-luna-text-muted">Données extraites</h4>
                                                        {[
                                                            { label: 'Client', value: analysis.extracted.clientName },
                                                            { label: 'Destinations', value: analysis.extracted.destinations?.join(', ') },
                                                            { label: 'Dates', value: `${analysis.extracted.departureDate || '—'} → ${analysis.extracted.returnDate || '—'}` },
                                                            { label: 'Voyageurs', value: analysis.extracted.pax },
                                                            { label: 'Budget', value: analysis.extracted.budget },
                                                            { label: 'Ambiance', value: analysis.extracted.vibe },
                                                            { label: 'Exigences', value: analysis.extracted.mustHaves },
                                                            { label: 'Spécial', value: analysis.extracted.specialRequests },
                                                        ].filter(item => item.value).map((item, i) => (
                                                            <div key={i} className="flex justify-between items-start bg-white rounded-lg p-2.5 border border-luna-warm-gray/10">
                                                                <span className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-wider">{item.label}</span>
                                                                <span className="text-xs font-medium text-luna-charcoal text-right max-w-[160px]">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Agent Dispatch */}
                                                <div className="mb-4">
                                                    <h4 className="text-[10px] uppercase tracking-wider font-semibold text-luna-text-muted mb-2">Agents à dispatcher</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {agentIcons.map((agent, i) => (
                                                            <div key={i} className={`bg-white rounded-lg p-2.5 border border-luna-warm-gray/10 flex items-center gap-2 ${dispatched ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                                                                <agent.icon size={14} className={dispatched ? 'text-emerald-500' : agent.color} />
                                                                <span className="text-[10px] font-medium text-luna-charcoal">{agent.name}</span>
                                                                {dispatched && <CheckCircle2 size={10} className="text-emerald-500 ml-auto" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dispatch button */}
                                                {!dispatched ? (
                                                    <button onClick={handleDispatchToAgents} disabled={dispatching}
                                                        className="w-full py-2.5 btn-primary font-semibold text-xs tracking-wider uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                                        {dispatching ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                                        {dispatching ? 'Dispatch…' : 'Dispatcher aux 4 Agents'}
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 font-semibold text-xs tracking-wider uppercase rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={14} /> Dispatché aux agents
                                                    </div>
                                                )}

                                                {/* Add to Pipeline button */}
                                                <div className="mt-3 pt-3 border-t border-sky-100/30">
                                                    {!addedToPipeline ? (
                                                        <button onClick={handleAddToPipeline} disabled={addingToPipeline}
                                                            className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs tracking-wider uppercase rounded-lg border border-sky-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                                            {addingToPipeline ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                                                            {addingToPipeline ? 'Ajout…' : 'Ajouter au Pipeline CRM'}
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 font-semibold text-xs tracking-wider uppercase rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
                                                                <CheckCircle2 size={14} /> Ajouté au Pipeline
                                                            </div>
                                                            <Link href="/crm/pipeline" className="w-full py-2 text-sky-500 hover:text-sky-600 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                                                                <ExternalLink size={12} /> Voir le Pipeline
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3 bg-luna-cream/10">
                            <Mail size={48} className="opacity-15 mb-2" />
                            <p className="font-serif font-semibold text-lg text-luna-charcoal">Aucun email sélectionné</p>
                            <p className="text-luna-text-muted max-w-xs text-xs">Sélectionnez une demande pour l'analyser avec Luna AI.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
