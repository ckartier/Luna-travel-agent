'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, RefreshCw, AlertCircle, CalendarClock } from 'lucide-react';

export default function MailsPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [emailContentLoading, setEmailContentLoading] = useState(false);

    const fetchEmails = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/gmail/list?q=subject:"demande" OR subject:"renseignement"');
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

    return (
        <div className="h-full flex flex-col pt-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-semibold text-luna-charcoal tracking-tight flex items-center gap-3">
                        Boîte de Réception <span className="bg-luna-accent/10 text-luna-accent-dark text-sm py-1 px-3 rounded-full font-sans font-semibold">{emails.length} Nouveaux</span>
                    </h1>
                    <p className="text-luna-text-muted font-normal mt-1">Gérez automatiquement les nouvelles demandes entrantes.</p>
                </div>
                <button
                    onClick={fetchEmails}
                    disabled={loading}
                    className="bg-white hover:bg-luna-cream border border-luna-warm-gray/30 text-luna-charcoal font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualiser
                </button>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-luna-warm-gray/20 shadow-sm overflow-hidden flex">
                {/* Email List */}
                <div className={`w-1/3 border-r border-luna-warm-gray/15 flex flex-col bg-luna-cream/30 ${selectedEmail ? 'hidden lg:flex' : 'flex w-full'}`}>
                    <div className="p-4 border-b border-luna-warm-gray/15">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-luna-text-muted/50" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher une demande..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-luna-warm-gray/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-8 text-center space-y-4">
                                <RefreshCw className="animate-spin" size={32} />
                                <p>Synchronisation avec Gmail...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center space-y-4">
                                <AlertCircle size={32} />
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-8 text-center space-y-4">
                                <Mail size={48} className="opacity-20" />
                                <p className="font-semibold text-lg text-luna-charcoal">Aucune nouvelle demande.</p>
                                <p className="text-sm">Nous surveillons les nouvelles demandes pour vous.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-luna-warm-gray/15">
                                {emails.map(email => (
                                    <button
                                        key={email.id}
                                        onClick={() => handleSelectEmail(email)}
                                        className={`w-full text-left p-5 hover:bg-luna-accent/5 transition-colors ${selectedEmail?.id === email.id ? 'bg-luna-accent/10 border-l-4 border-l-luna-accent' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-luna-charcoal truncate pr-4">{email.sender.replace(/<.*>/, '')}</span>
                                            <span className="text-xs text-luna-text-muted font-medium whitespace-nowrap">
                                                {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm mb-1 truncate ${selectedEmail?.id === email.id ? 'font-semibold text-luna-accent-dark' : 'font-medium text-luna-charcoal'}`}>{email.subject}</h4>
                                        <p className="text-xs text-luna-text-muted truncate">{email.snippet?.replace(/&#39;/g, "'")}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Viewer */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedEmail ? (
                        <div className="flex-1 overflow-y-auto flex flex-col h-full">
                            <div className="p-8 border-b border-luna-warm-gray/15">
                                <h2 className="font-serif text-2xl font-semibold text-luna-charcoal mb-6">{selectedEmail.subject}</h2>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-luna-accent/15 flex items-center justify-center text-luna-accent-dark font-semibold text-lg">
                                            {selectedEmail.sender.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-luna-charcoal">{selectedEmail.sender}</p>
                                            <p className="text-xs text-luna-text-muted flex items-center gap-1 mt-0.5">
                                                <CalendarClock size={12} />
                                                {new Date(selectedEmail.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2 rounded-xl shadow-md transition-all text-sm">
                                        Créer une Fiche Client
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 flex-1">
                                {emailContentLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-luna-cream rounded w-3/4"></div>
                                        <div className="h-4 bg-luna-cream rounded w-1/2"></div>
                                        <div className="h-4 bg-luna-cream rounded w-5/6"></div>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none text-luna-charcoal leading-relaxed whitespace-pre-wrap font-normal">
                                        {selectedEmail.bodyText || "Impossible de charger le contenu complet de l'email."}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-8 text-center space-y-4 bg-luna-cream/20">
                            <Mail size={64} className="opacity-20 mb-4" />
                            <p className="font-serif font-semibold text-xl text-luna-charcoal">Aucun email sélectionné</p>
                            <p className="text-luna-text-muted max-w-sm text-sm">Sélectionnez une demande dans la liste de gauche pour lire les détails.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
