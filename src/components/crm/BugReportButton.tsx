'use client';

import { useState } from 'react';
import { Bug, X, Send, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export function BugReportButton() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('normal');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const { user, userProfile } = useAuth();
    const pathname = usePathname() || '/';

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;
        setSending(true);
        try {
            await fetch('/api/crm/bug-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    severity,
                    page: pathname,
                    userAgent: navigator.userAgent,
                    userId: user?.uid || '',
                    userName: userProfile?.displayName || user?.displayName || '',
                    userEmail: userProfile?.email || user?.email || '',
                }),
            });
            setSent(true);
            setTimeout(() => { setOpen(false); setSent(false); setTitle(''); setDescription(''); setSeverity('normal'); }, 1500);
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const severities = [
        { id: 'low', label: 'Mineur', icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-200' },
        { id: 'normal', label: 'Normal', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-200' },
        { id: 'critical', label: 'Critique', icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-200' },
    ];

    return (
        <>
            <button onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-[0.12em] text-[#9CA3AF] hover:bg-black/[0.03] hover:text-[#2E2E2E] font-normal border border-transparent w-full">
                <Bug size={16} strokeWidth={1.5} />
                Signaler un bug
            </button>

            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                    <Bug size={16} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-bold text-[#2E2E2E]">Signaler un bug</h3>
                                    <p className="text-[10px] text-gray-400">Page: {pathname}</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {sent ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                    <Send size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-[14px] font-bold text-[#2E2E2E]">Bug signalé !</p>
                                <p className="text-[12px] text-gray-400 mt-1">Merci, nous allons analyser ce problème.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/80 mb-1 block">Titre</label>
                                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="Ex: Le bouton sauvegarder ne fonctionne pas"
                                        className="w-full px-3 py-2.5 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[13px] text-[#2E2E2E] placeholder:text-gray-300 focus:outline-none focus:border-[#b9dae9] focus:bg-white transition-all" />
                                </div>

                                {/* Severity */}
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/80 mb-1.5 block">Sévérité</label>
                                    <div className="flex gap-2">
                                        {severities.map(s => (
                                            <button key={s.id} onClick={() => setSeverity(s.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                                                    severity === s.id ? s.color : 'text-gray-400 bg-gray-50 border-gray-200/60 hover:bg-white'
                                                }`}>
                                                <s.icon size={12} /> {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/80 mb-1 block">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                        placeholder="Décrivez le problème en détail..."
                                        className="w-full px-3 py-2.5 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[13px] text-[#2E2E2E] placeholder:text-gray-300 resize-none focus:outline-none focus:border-[#b9dae9] focus:bg-white transition-all" />
                                </div>

                                {/* Submit */}
                                <button onClick={handleSubmit} disabled={sending || !title.trim() || !description.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[12px] font-semibold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-default">
                                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={13} />}
                                    {sending ? 'Envoi...' : 'Envoyer le rapport'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
