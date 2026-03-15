'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, X, VolumeX, Zap, MessageCircle, AlertTriangle, MapPin,
    FileText, Mail, User, Receipt, StickyNote, ArrowRight, ExternalLink,
    CheckCircle2,
} from 'lucide-react';
import { useVoiceAgent, type TranscriptEntry, type VoiceState, type DeviceStatus, type ActionResult } from '@/src/hooks/useVoiceAgent';
import { useVertical } from '@/src/contexts/VerticalContext';
import VoiceOrbAnimation from './VoiceOrbAnimation';

/* ─── Build a human-readable context label from the CRM path ─── */
const CRM_PAGE_LABELS: Record<string, string> = {
    'dashboard': 'Tableau de bord',
    'clients': 'Liste des clients',
    'contacts': 'Contacts',
    'leads': 'Leads / Prospects',
    'pipeline': 'Pipeline commercial',
    'dossiers': 'Liste des dossiers',
    'trips': 'Voyages',
    'bookings': 'Réservations',
    'quotes': 'Devis',
    'invoices': 'Factures',
    'payments': 'Paiements',
    'planning': 'Planning',
    'documents': 'Documents',
    'mails': 'Boîte de réception',
    'messages': 'Messages',
    'tasks': 'Tâches',
    'analytics': 'Statistiques',
    'marketing': 'Marketing',
    'agent-ia': 'Agent IA',
    'settings': 'Paramètres',
    'team': 'Équipe',
    'templates': 'Modèles',
    'catalog': 'Catalogue',
    'suppliers': 'Prestataires',
};

function buildPageContext(pathname: string): string {
    const parts = pathname.replace(/^\/crm\/?/, '').split('/').filter(Boolean);
    if (parts.length === 0) return 'Tableau de bord';
    const section = parts[0];
    const label = CRM_PAGE_LABELS[section] || section;
    if (parts.length >= 2) {
        const subpage = parts[2] || '';
        if (subpage === 'edit') return `Édition de ${label.toLowerCase().replace('liste des ', '')} (ID: ${parts[1]})`;
        return `Fiche détail ${label.toLowerCase().replace('liste des ', '')} (ID: ${parts[1]})`;
    }
    return label;
}

/* ─── Travel quick hints ─── */
const TRAVEL_HINTS = [
    '📋 Prochain voyage ?',
    '✍️ Crée un devis',
    '📧 Rédige un email',
    '👤 Nouveau client',
    '🔍 Cherche un contact',
];

const LEGAL_HINTS = [
    '📋 Résumé des dossiers',
    '⚠️ Échéances urgentes',
    '💰 Factures impayées',
    '📧 Rédige un email',
    '📝 Note sur dossier',
];

/* ══════════════════════════════════════════════════
   Action type metadata
   ══════════════════════════════════════════════════ */
const ACTION_META: Record<string, { icon: any; color: string; bg: string }> = {
    quote:    { icon: FileText,    color: '#7C3AED', bg: '#F5F3FF' },
    email:    { icon: Mail,        color: '#2563EB', bg: '#EFF6FF' },
    client:   { icon: User,        color: '#059669', bg: '#ECFDF5' },
    invoice:  { icon: Receipt,     color: '#D97706', bg: '#FFFBEB' },
    note:     { icon: StickyNote,  color: '#6B7280', bg: '#F9FAFB' },
    lead:     { icon: ArrowRight,  color: '#0891B2', bg: '#ECFEFF' },
    reminder: { icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2' },
    dossier:  { icon: FileText,    color: '#7C3AED', bg: '#F5F3FF' },
    task:     { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' },
};

/* ═══════════════════════════════════════════════════
   Voice Agent Panel — Floating CRM Voice Assistant
   ═══════════════════════════════════════════════════ */

export function VoiceAgentPanel() {
    const pathname = usePathname();
    const pageContext = buildPageContext(pathname || '');
    const { vertical } = useVertical();

    const [isOpen, setIsOpen] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const { state, transcript, start, stop, audioLevel, error, micStatus, audioOutputStatus } = useVoiceAgent({
        pageContext,
        vertical: vertical?.id,
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const hints = vertical?.id === 'legal' ? LEGAL_HINTS : TRAVEL_HINTS;

    // Handle voice-agent:navigate events
    useEffect(() => {
        const handleNavigate = (e: Event) => {
            const path = (e as CustomEvent).detail?.path;
            if (path) router.push(path);
        };
        const handleAction = (e: Event) => {
            const actionUrl = (e as CustomEvent).detail?.previewUrl;
            if (actionUrl && !actionUrl.startsWith('http')) router.push(actionUrl);
        };
        window.addEventListener('voice-agent:navigate', handleNavigate);
        window.addEventListener('voice-agent:action-created', handleAction);
        return () => {
            window.removeEventListener('voice-agent:navigate', handleNavigate);
            window.removeEventListener('voice-agent:action-created', handleAction);
        };
    }, [router]);

    // Auto-scroll transcript
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleToggle = () => {
        if (isOpen) { stop(); setIsOpen(false); }
        else setIsOpen(true);
    };

    const handleStartVoice = async () => { await start(); };
    const handleStop = () => { stop(); };

    const isActive = state !== 'idle' && state !== 'error';

    return (
        <>
            {/* ═══ FLOATING ORB BUTTON ═══ */}
            <div className="fixed bottom-6 right-6 z-[999]">
                <div
                    className="cursor-pointer transition-transform duration-300 ease-out hover:scale-110 active:scale-95"
                    style={{ background: 'transparent' }}
                >
                    <VoiceOrbAnimation
                        parentLevel={isActive ? audioLevel : 0}
                        state={state}
                        size="sm"
                        onClick={handleToggle}
                    />
                </div>
            </div>

            {/* ═══ EXPANDED PANEL ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-[1001] flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-[400px] flex flex-col overflow-visible">
                        {/* ── Header ── */}
                        <div className="px-6 py-5 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-[13px] font-bold text-white tracking-[0.2em] uppercase">Agent Vocal</h3>
                                <span className={`w-2 h-2 rounded-full ${
                                    state === 'listening' ? 'bg-[#2ECC71]' :
                                    state === 'speaking'  ? 'bg-cyan-400' :
                                    state === 'thinking'  ? 'bg-amber-400' :
                                    state === 'connecting'? 'bg-amber-400 animate-pulse' :
                                    state === 'error'     ? 'bg-red-400' :
                                    'bg-white/20'
                                }`} />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 flex-nowrap shrink-0 px-3 py-1.5 rounded-full bg-black/10 border border-white/5">
                                    <MapPin size={10} className="text-[#888]" />
                                    <span className="text-[9px] font-medium text-[#888] uppercase tracking-[0.1em]">{pageContext}</span>
                                </div>
                                <button
                                    onClick={handleToggle}
                                    className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* ── Orb Visualization (centerpiece) ── */}
                        {isActive && (
                            <div className="relative flex flex-col items-center justify-center pt-2 pb-6 min-h-[220px] pointer-events-auto">
                                <VoiceOrbAnimation parentLevel={audioLevel} state={state} size="lg" />
                                {/* Status label below the orb */}
                                <div className="mt-4 flex justify-center">
                                    <span className={`text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full flex items-center gap-2 ${
                                        state === 'listening' ? 'text-[#2ECC71] bg-[#2ECC71]/10' :
                                        state === 'speaking'  ? 'text-cyan-300 bg-cyan-500/10' :
                                        state === 'thinking'  ? 'text-amber-300 bg-amber-500/10' :
                                        'text-white/40 bg-white/5'
                                    }`}>
                                        {state === 'listening' ? <><Mic size={10} /> EN ÉCOUTE</> : state === 'speaking' ? <><Mic size={10} /> PARLE</> : state === 'thinking' ? <><Zap size={10} /> ANALYSE</> : state === 'connecting' ? 'Connexion...' : ''}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => setShowTranscript(p => !p)}
                                    className="mt-4 text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors"
                                >
                                    {showTranscript ? 'Masquer le texte' : 'Afficher le texte'}
                                </button>
                            </div>
                        )}

                        {/* ── Transcript Area ── */}
                        <AnimatePresence>
                            {showTranscript && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        ref={scrollRef}
                                        className="overflow-y-auto px-6 py-2 space-y-4 max-h-[220px] scrollbar-none pointer-events-auto"
                                    >
                                        {/* Idle empty state */}
                                        {transcript.length === 0 && state === 'idle' && (
                                            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6">
                                                <p className="text-[11px] text-white/40 max-w-[240px] leading-relaxed">
                                                    La transcription apparaîtra ici.
                                                </p>
                                            </div>
                                        )}

                                        {transcript.map((entry) => (
                                            <TranscriptBubble key={entry.id} entry={entry} onNavigate={(url) => router.push(url)} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Error ── */}
                        {error && (
                            <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
                                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                                <p className="text-[11px] text-red-400">{error}</p>
                            </div>
                        )}

                        {/* ── Action bar ── */}
                        <div className="px-6 py-5 pointer-events-auto">
                            {state === 'idle' || state === 'error' ? (
                                <button
                                    onClick={handleStartVoice}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white rounded-full text-[12px] font-bold uppercase tracking-[0.15em] transition-all active:scale-95 border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                                >
                                    <Mic size={15} className="text-cyan-300" />
                                    Démarrer la session vocale
                                </button>
                            ) : (
                                <button
                                    onClick={handleStop}
                                    className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-[#5c3e3e]/80 hover:bg-[#6c4848] border-[2px] border-[#3B82F6] text-[#e36363] rounded-full text-[12px] font-bold uppercase tracking-[0.15em] transition-all active:scale-95 shadow-md"
                                >
                                    <MicOff size={16} />
                                    TERMINER
                                </button>
                            )}
                        </div>
                      </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ DEVICE STATUS ALERTS ═══ */}
            <DeviceAlertToasts micStatus={micStatus} audioOutputStatus={audioOutputStatus} isActive={isActive} />

            <style>{`
                @keyframes voicePulse {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1); }
                }
            `}</style>
        </>
    );
}

/* ═══════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════ */

function StatusText({ state }: { state: VoiceState }) {
    switch (state) {
        case 'idle':       return <>Prêt · Appuyez pour parler</>;
        case 'connecting': return <>Connexion en cours...</>;
        case 'listening':  return <>🎤 En écoute...</>;
        case 'thinking':   return <>⚡ Exécution de l'action...</>;
        case 'speaking':   return <>🔊 Réponse en cours...</>;
        case 'error':      return <>⚠️ Erreur de connexion</>;
        default:           return null;
    }
}

function TranscriptBubble({ entry, onNavigate }: { entry: TranscriptEntry; onNavigate: (url: string) => void }) {
    const isUser = entry.role === 'user';
    const isTool = entry.text.startsWith('⚡');
    const hasAction = !!entry.action;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}
        >
            <div className={`max-w-[90%] px-4 py-3 rounded-3xl text-[13px] leading-relaxed ${
                isUser
                    ? 'bg-[#121212] text-white'
                    : isTool && !hasAction
                        ? 'bg-transparent text-[#999] font-mono text-[11px]'
                        : isTool && hasAction
                            ? 'bg-transparent p-0 border-0'
                            : 'bg-[#121212] text-white shadow-sm border border-[#222]'
            }`}>
                {isTool && !hasAction && <Zap size={10} className="inline mr-1.5 -mt-0.5 text-[#666]" />}
                {!hasAction && entry.text}
            </div>

            {/* Action card — shown for CRM write results */}
            {hasAction && entry.action && (
                <ActionCard action={entry.action} onNavigate={onNavigate} />
            )}
        </motion.div>
    );
}

function ActionCard({ action, onNavigate }: { action: ActionResult; onNavigate: (url: string) => void }) {
    const meta = ACTION_META[action.type] || ACTION_META['note'];
    const IconComponent = meta.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="w-full max-w-[90%] rounded-2xl border border-[#444] overflow-hidden bg-[#222] shadow-lg"
        >
            <div className="px-4 py-3 flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#333] border border-[#444]"
                >
                    <IconComponent size={16} className="text-[#A29A90]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold tracking-widest uppercase mb-0.5 text-[#999]">
                        {action.type === 'quote' ? 'Devis créé' :
                         action.type === 'email' ? 'Email brouillon' :
                         action.type === 'client' ? 'Client créé' :
                         action.type === 'invoice' ? 'Facture créée' :
                         action.type === 'note' ? 'Note ajoutée' :
                         action.type === 'lead' ? 'Lead mis à jour' :
                         action.type === 'reminder' ? 'Échéance créée' :
                         action.type === 'dossier' ? 'Dossier mis à jour' :
                         action.type === 'task' ? 'Tâche créée' : 'Action effectuée'}
                    </p>
                    <p className="text-[12px] text-white font-medium truncate">{action.label}</p>
                </div>
                {action.previewUrl && (
                    <button
                        onClick={() => onNavigate(action.previewUrl!)}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[#444] active:scale-90 border border-[#444]"
                        title="Voir"
                    >
                        <ExternalLink size={13} className="text-[#A29A90]" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function AudioVisualizer({ level, state }: { level: number; state: VoiceState }) {
    const bars = 24;
    return (
        <div className="flex items-center justify-center gap-[2px] h-6">
            {Array.from({ length: bars }).map((_, i) => {
                const center = bars / 2;
                const distFromCenter = Math.abs(i - center) / center;
                const heightFactor = state === 'listening'
                    ? Math.max(0.15, level * (1 - distFromCenter * 0.6) + Math.sin(Date.now() / 200 + i) * 0.05)
                    : state === 'speaking'
                        ? Math.max(0.15, level * (1 - distFromCenter * 0.4) + Math.sin(Date.now() / 150 + i * 0.5) * 0.1)
                        : 0.15;

                return (
                    <motion.div
                        key={i}
                        className="w-[3px] rounded-full"
                        style={{
                            background: state === 'listening' ? '#E2C8A9' : state === 'speaking' ? '#F5DFBF' : '#404040',
                        }}
                        animate={{
                            height: `${Math.max(3, heightFactor * 24)}px`,
                            opacity: state === 'listening' || state === 'speaking' ? 0.6 + level * 0.4 : 0.4,
                        }}
                        transition={{ duration: 0.05 }}
                    />
                );
            })}
        </div>
    );
}

function VoiceWaveIcon({ level }: { level: number }) {
    return (
        <div className="flex items-center gap-[2px]">
            {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full bg-white"
                    animate={{ height: `${8 + level * 14 * (1 - Math.abs(i - 2) * 0.2)}px` }}
                    transition={{ duration: 0.1, delay: i * 0.02 }}
                />
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   Device Alert Toasts
   ═══════════════════════════════════════════════════ */

interface AlertItem {
    id: string;
    icon: React.ReactNode;
    message: string;
    type: 'warning' | 'error';
}

function DeviceAlertToasts({ micStatus, audioOutputStatus, isActive }: {
    micStatus: DeviceStatus;
    audioOutputStatus: DeviceStatus;
    isActive: boolean;
}) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    useEffect(() => { if (!isActive) setDismissed(new Set()); }, [isActive]);
    if (!isActive) return null;

    const alerts: AlertItem[] = [];
    if (micStatus === 'muted' && !dismissed.has('mic-muted'))
        alerts.push({ id: 'mic-muted', icon: <MicOff size={16} className="text-amber-600 shrink-0" />, message: 'Microphone coupé — vérifiez les paramètres de votre système ou navigateur.', type: 'warning' });
    if (micStatus === 'denied' && !dismissed.has('mic-denied'))
        alerts.push({ id: 'mic-denied', icon: <MicOff size={16} className="text-red-500 shrink-0" />, message: 'Accès micro refusé. Autorisez le micro dans les paramètres du navigateur.', type: 'error' });
    if (micStatus === 'unavailable' && !dismissed.has('mic-unavailable'))
        alerts.push({ id: 'mic-unavailable', icon: <MicOff size={16} className="text-red-500 shrink-0" />, message: 'Aucun microphone détecté. Branchez un micro et réessayez.', type: 'error' });
    if (audioOutputStatus === 'muted' && !dismissed.has('audio-muted'))
        alerts.push({ id: 'audio-muted', icon: <VolumeX size={16} className="text-amber-600 shrink-0" />, message: 'Audio coupé — vous n\'entendrez pas les réponses vocales.', type: 'warning' });
    if (audioOutputStatus === 'unavailable' && !dismissed.has('audio-unavailable'))
        alerts.push({ id: 'audio-unavailable', icon: <VolumeX size={16} className="text-red-500 shrink-0" />, message: 'Sortie audio indisponible. Vérifiez vos haut-parleurs.', type: 'error' });

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 max-w-[360px]">
            <AnimatePresence>
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm ${
                            alert.type === 'error' ? 'bg-red-50/95 border-red-200 shadow-red-100/30' : 'bg-amber-50/95 border-amber-200 shadow-amber-100/30'
                        }`}
                    >
                        <div className="mt-0.5">{alert.icon}</div>
                        <p className={`text-[11px] leading-relaxed flex-1 ${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                            {alert.message}
                        </p>
                        <button
                            onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
                            className={`shrink-0 mt-0.5 p-0.5 rounded-md transition-colors ${
                                alert.type === 'error' ? 'text-red-400 hover:text-red-600 hover:bg-red-100' : 'text-amber-400 hover:text-amber-600 hover:bg-amber-100'
                            }`}
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
