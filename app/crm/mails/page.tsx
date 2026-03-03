'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, RefreshCw, AlertCircle, CalendarClock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            // Filter emails by the required subject "demande de renseignements"
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

    useEffect(() => {
        fetchEmails();
    }, []);

    const handleSelectEmail = async (email: any) => {
        setSelectedEmail(email);
        if (!email.bodyText) {
            setEmailContentLoading(true);
            try {
                const res = await fetch(`/api/gmail/list?action=get&messageId=${email.id}`);
                const data = await res.json();

                // Update specific email in state with its full content
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Boîte de Réception <span className="bg-blue-100 text-blue-600 text-sm py-1 px-3 rounded-full">{emails.length} Nouveaux</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez automatiquement les nouvelles demandes entrantes de vos clients VIP.</p>
                </div>
                <button
                    onClick={fetchEmails}
                    disabled={loading}
                    className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualiser
                </button>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex">

                {/* Email List Panel */}
                <div className={`w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedEmail ? 'hidden lg:flex' : 'flex w-full'}`}>
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher une demande..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center space-y-4">
                                <RefreshCw className="animate-spin" size={32} />
                                <p>Synchronisation avec Gmail...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center space-y-4">
                                <AlertCircle size={32} />
                                <p>{error}</p>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center space-y-4">
                                <Mail size={48} className="opacity-20" />
                                <p className="font-medium text-lg text-gray-500">Aucune nouvelle demande.</p>
                                <p className="text-sm">Nous surveillons "demande de renseignements" pour vous.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {emails.map(email => (
                                    <button
                                        key={email.id}
                                        onClick={() => handleSelectEmail(email)}
                                        className={`w-full text-left p-5 hover:bg-blue-50/50 transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900 truncate pr-4">{email.sender.replace(/<.*>/, '')}</span>
                                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <h4 className={`text-sm mb-1 truncate ${selectedEmail?.id === email.id ? 'font-bold text-blue-700' : 'font-semibold text-gray-700'}`}>{email.subject}</h4>
                                        <p className="text-xs text-gray-500 truncate">{email.snippet.replace(/&#39;/g, "'")}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Viewer Panel */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedEmail ? (
                        <div className="flex-1 overflow-y-auto flex flex-col h-full">
                            <div className="p-8 border-b border-gray-100">
                                <h2 className="text-2xl font-black text-gray-900 mb-6">{selectedEmail.subject}</h2>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                                            {selectedEmail.sender.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{selectedEmail.sender}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <CalendarClock size={12} />
                                                {new Date(selectedEmail.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl shadow-md transition-all text-sm">
                                        Créer une Fiche Client
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 flex-1">
                                {emailContentLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-100 rounded w-full mt-8"></div>
                                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                        {selectedEmail.bodyText || "Impossible de charger le contenu complet de l'email."}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center space-y-4 bg-gray-50/30">
                            <Mail size={64} className="opacity-20 mb-4" />
                            <p className="font-bold text-xl text-gray-600">Aucun email sélectionné</p>
                            <p className="text-gray-500 max-w-sm">Sélectionnez une demande de renseignements dans la liste de gauche pour lire les détails et l'ajouter à votre pipeline CRM.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
