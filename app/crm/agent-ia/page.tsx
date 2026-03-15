'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Bot, Mic, Send, Square, Keyboard, Volume2, Scale, Plane, Hotel, ArrowRight, XCircle, Mail, FileText, AlertTriangle, Calendar, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVertical } from '@/src/contexts/VerticalContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { sanitizeHtml } from '@/src/lib/sanitize';
import { useVoiceAgent } from '@/src/hooks/useVoiceAgent';
import { useSearchParams } from 'next/navigation';

// Dynamically import travel agents
import dynamic from 'next/dynamic';
const VoyageAgent = dynamic(() => import('@/app/voyage-agent/page'), { ssr: false });
const PrestationsAgent = dynamic(() => import('@/app/prestations-agent/page'), { ssr: false });

type AgentType = 'voyage' | 'prestations';
type InputMode = 'text' | 'voice';

const agents = {
    voyage: {
        label: 'Voyage',
        subtitle: 'Créez un itinéraire complet avec IA',
        icon: Plane,
        gradient: 'from-[#5a8fa3] to-[#3d7a91]',
        glow: 'shadow-[0_0_30px_rgba(90,143,163,0.15)]',
        desc: 'Vol, Hôtel, Activités, Programme jour par jour',
    },
    prestations: {
        label: 'Prestations',
        subtitle: 'Recherche sémantique dans le catalogue',
        icon: Hotel,
        gradient: 'from-[#B89B7A] to-[#9A7F60]',
        glow: 'shadow-[0_0_30px_rgba(184,155,122,0.15)]',
        desc: 'Hébergement, Transfert, Activité, Restaurant, Guide',
    },
};

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
    isGreeting?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   UNIFIED LEGAL AGENT (CHAT + VOICE)
   ═══════════════════════════════════════════════════════════════ */

function UnifiedLegalAgent() {
    const { userProfile, user } = useAuth();
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const firstName = displayName.split(' ')[0];

    const [inputText, setInputText] = useState('');
    const [isMicActive, setIsMicActive] = useState(false); // mic layer on top of session
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const sessionSavedRef = useRef(false);

    const quickActions = [
        { id: 'email', label: 'Rédiger un email', icon: Mail, prompt: 'Rédige une correspondance formelle au client en utilisant mon style et ma signature enregistrés. Demande-moi le sujet.' },
        { id: 'summary', label: 'Synthèse du dossier', icon: FileText, prompt: 'Fais une synthèse claire et concise de ce dossier.' },
        { id: 'risks', label: 'Analyse des risques', icon: AlertTriangle, prompt: 'Fais une analyse des risques juridiques liés à cette affaire.' },
        { id: 'deadlines', label: 'Vérifier les échéances', icon: Calendar, prompt: 'Vérifie les échéances légales et procédurales à venir.' },
        { id: 'unpaid', label: 'Gestion des impayés', icon: Euro, prompt: 'Prépare une mise en demeure pour les factures impayées de ce client.' }
    ];

    // ─── Single Voice Agent session — drives both text and voice ───
    const {
        state: voiceState,
        start,
        stop,
        sendText,
        transcript,
        audioLevel,
    } = useVoiceAgent({ pageContext: 'Agent IA', vertical: 'legal' });

    const isConnected = voiceState !== 'idle' && voiceState !== 'error' && voiceState !== 'connecting';
    const isConnecting = voiceState === 'connecting';

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // ─── Save conversation to Firestore when session ends ───
    useEffect(() => {
        if (voiceState === 'idle' && transcript.length > 1 && !sessionSavedRef.current) {
            sessionSavedRef.current = true;
            saveConversation(transcript, user);
        }
        if (voiceState !== 'idle') sessionSavedRef.current = false;
    }, [voiceState, transcript, user]);

    // ─── Handle text submit — route through Live session ───
    const handleSendText = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;
        const msg = inputText.trim();
        setInputText('');

        // Auto-start session if not yet running
        if (voiceState === 'idle' || voiceState === 'error') {
            await start();
            // Small delay for session to establish
            await new Promise(r => setTimeout(r, 600));
        }

        sendText(msg);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // ─── Toggle mic (doesn't start/stop session — just enables mic input) ───
    const toggleMic = async () => {
        if (!isConnected && !isConnecting) {
            // Start session first time
            await start();
            setIsMicActive(true);
        } else if (isMicActive) {
            // Stop entire session when mic deactivated
            stop();
            setIsMicActive(false);
        } else {
            setIsMicActive(true);
        }
    };

    const fmt = (text: string) => text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#2E2E2E;font-weight:600">$1</strong>')
        .replace(/\n/g, '<br/>');

    return (
        <div className="w-full h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[1000px] h-full max-h-[850px] flex flex-col relative w-full">
                
                {/* ═══ PREMIUM BACKGROUND GLOW ═══ */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#A07850]/8 to-transparent blur-[80px] rounded-full pointer-events-none z-0" />

                {/* ═══ HEADER ═══ */}
                <div className="flex flex-col items-center text-center mb-8 shrink-0 relative z-10 pt-4">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-[24px] flex items-center justify-center bg-white shadow-[0_8px_30px_rgba(160,120,80,0.12)] border border-[#A07850]/20 relative">
                            <motion.div className="absolute inset-0 rounded-[28px] border-2 border-[#A07850]/30 flex items-center justify-center"
                                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.98, 1.05, 0.98] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <Scale size={40} className="text-[#A07850]" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <h1 className="text-[42px] font-light text-[#2E2E2E] tracking-tight leading-none">Agent Juridique</h1>
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="px-3 py-1.5 rounded-full text-white shadow-lg mx-auto flex items-center gap-2"
                            style={{ background: 'linear-gradient(to right, #A07850, #7a5c38)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] relative top-[0.5px]">
                                {isConnected ? (isMicActive ? '🎙 Session Vocale Active' : '💬 Session Active') : 'Assistant IA Actif'}
                            </span>
                        </motion.div>
                    </div>
                </div>

                {/* ═══ CHAT CONTAINER ═══ */}
                <div className="flex-1 bg-white/95 backdrop-blur-xl rounded-[40px] border border-[#E5E7EB]/80 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col relative z-10">
                <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ scrollbarWidth: 'none' }}>
                    <AnimatePresence initial={false}>
                        {/* Greeting when session not started */}
                        {transcript.length === 0 && (
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                <div className="flex items-end gap-4 max-w-[85%]">
                                    <div className="w-10 h-10 rounded-[14px] bg-[#2E2E2E] flex items-center justify-center shrink-0 shadow-md">
                                        <Scale size={18} className="text-white" />
                                    </div>
                                    <div className="px-6 py-4 text-[15.5px] leading-relaxed shadow-sm bg-[#FAFAF8] text-[#2E2E2E] rounded-[28px] rounded-bl-[8px] border border-[#E5E7EB]">
                                        Bonjour Maître {firstName}, que puis-je faire pour vous ?
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {transcript.map((msg, i) => (
                            <motion.div 
                                key={msg.id} 
                                initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-10 h-10 rounded-[14px] bg-[#2E2E2E] flex items-center justify-center shrink-0 shadow-md relative">
                                            <Scale size={18} className="text-white" />
                                            {i === transcript.length - 1 && voiceState !== 'thinking' && (
                                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white z-10" />
                                            )}
                                        </div>
                                    )}
                                    <div className={`px-6 py-4 text-[15.5px] leading-relaxed shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-[#2E2E2E] to-[#1a1a1a] text-white/95 rounded-[28px] rounded-br-[8px]'
                                            : msg.text.startsWith('⚡')
                                                ? 'bg-[#A07850]/8 border border-[#A07850]/20 text-[#7a5c38] rounded-[28px] rounded-bl-[8px] text-[13px]'
                                                : 'bg-[#FAFAF8] text-[#2E2E2E] rounded-[28px] rounded-bl-[8px] border border-[#E5E7EB]'
                                    }`}>
                                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(fmt(msg.text)) }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Thinking indicator */}
                    {voiceState === 'thinking' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="flex items-end gap-4">
                                <div className="w-10 h-10 rounded-[14px] bg-[#2E2E2E] flex items-center justify-center shrink-0 shadow-md">
                                    <Scale size={18} className="text-white" />
                                </div>
                                <div className="bg-[#FAFAF8] border border-[#E5E7EB] rounded-[28px] rounded-bl-[8px] px-6 py-5 flex items-center gap-2 shadow-sm">
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} className="w-2 h-2 bg-[#2E2E2E]/40 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8], y: [0, -4, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}


                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* ═══ ANIMATED MIC MODAL OVERLAY ═══ */}
                <AnimatePresence>
                    {isMicActive && (voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'thinking' || voiceState === 'connecting') && (
                        <motion.div
                            key="mic-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)' }}
                        >
                            {/* Ambient gradient glow */}
                            <div className="absolute inset-0 pointer-events-none">
                                <motion.div
                                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                    style={{
                                        width: 300, height: 300,
                                        background: voiceState === 'speaking'
                                            ? 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)'
                                            : voiceState === 'thinking'
                                                ? 'radial-gradient(circle, rgba(160,120,80,0.1) 0%, transparent 70%)'
                                                : 'radial-gradient(circle, rgba(160,120,80,0.2) 0%, transparent 70%)',
                                    }}
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            </div>

                            {/* Central Orb */}
                            <div className="relative mb-10 z-10">
                                {/* Outer pulse rings */}
                                {voiceState === 'listening' && (
                                    <>
                                        <motion.div
                                            className="absolute inset-0 -m-8 rounded-full border border-[#A07850]/20"
                                            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <motion.div
                                            className="absolute inset-0 -m-5 rounded-full border border-[#A07850]/30"
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        />
                                    </>
                                )}

                                {/* Audio level reactive ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: voiceState === 'speaking'
                                            ? 'rgba(52,211,153,0.15)'
                                            : 'rgba(160,120,80,0.1)',
                                        margin: -20,
                                    }}
                                    animate={{
                                        scale: voiceState === 'listening' ? [1, 1 + audioLevel * 1.5, 1] : 1,
                                        opacity: voiceState === 'listening' ? [0.3, Math.min(0.8, audioLevel * 3 + 0.2), 0.3] : 0.3,
                                    }}
                                    transition={{ duration: 0.2 }}
                                />

                                {/* Main orb button */}
                                <motion.button
                                    onClick={() => { stop(); setIsMicActive(false); }}
                                    className={`relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] ${
                                        voiceState === 'speaking'
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                            : voiceState === 'thinking'
                                                ? 'bg-gradient-to-br from-[#c4a67a] to-[#A07850]'
                                                : 'bg-gradient-to-br from-[#A07850] to-[#7a5c38]'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {voiceState === 'thinking' ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                            className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full"
                                        />
                                    ) : voiceState === 'speaking' ? (
                                        <Volume2 size={44} className="text-white" />
                                    ) : (
                                        <Mic size={44} className="text-white" />
                                    )}
                                </motion.button>
                            </div>

                            {/* Waveform Bars */}
                            {(voiceState === 'listening' || voiceState === 'speaking') && (
                                <div className="flex gap-2 items-end h-8 mb-8 z-10">
                                    {[...Array(7)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-1.5 rounded-full ${
                                                voiceState === 'speaking' ? 'bg-emerald-400' : 'bg-[#A07850]'
                                            }`}
                                            animate={{
                                                height: voiceState === 'listening'
                                                    ? [6, Math.max(8, 32 * (audioLevel * 3 + (i % 3) * 0.2)), 6]
                                                    : [6, 12 + Math.random() * 20, 6],
                                            }}
                                            transition={{
                                                duration: voiceState === 'listening' ? 0.3 : 0.5,
                                                repeat: Infinity,
                                                delay: i * 0.08,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* State label */}
                            <motion.p
                                className="text-[14px] font-semibold uppercase tracking-[0.2em] z-10"
                                style={{
                                    color: voiceState === 'speaking' ? '#34D399'
                                        : voiceState === 'thinking' ? '#9CA3AF'
                                        : '#A07850',
                                }}
                                key={voiceState}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {voiceState === 'listening' && "Je vous écoute..."}
                                {voiceState === 'thinking' && "Analyse en cours..."}
                                {voiceState === 'speaking' && "L'IA vous répond..."}
                                {voiceState === 'connecting' && "Connexion..."}
                            </motion.p>

                            {/* Stop hint */}
                            <p className="mt-4 text-[11px] text-[#9CA3AF] z-10">
                                Cliquez sur l'orbe pour arrêter
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-6 bg-white/80 backdrop-blur-md border-t border-[#E5E7EB]">
                    <div className="max-w-[800px] mx-auto">
                        {/* Quick Actions */}
                        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                            {quickActions.map(qa => (
                                <button
                                    key={qa.id}
                                    type="button"
                                    onClick={() => { setInputText(qa.prompt); inputRef.current?.focus(); }}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#A07850]/30 hover:bg-[#A07850]/5 text-[#4B5563] hover:text-[#A07850] rounded-xl text-[12px] font-medium transition-all shadow-sm"
                                >
                                    <qa.icon size={13} />
                                    {qa.label}
                                </button>
                            ))}
                        </div>

                        {/* Unified Input Bar */}
                        <form onSubmit={handleSendText} className="relative flex items-center gap-3">
                            {/* Mic toggle button */}
                            <button
                                type="button"
                                onClick={toggleMic}
                                disabled={isConnecting}
                                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                                    isMicActive
                                        ? 'bg-red-500 text-white shadow-red-400/30 hover:bg-red-600'
                                        : isConnecting
                                            ? 'bg-[#A07850]/20 text-[#A07850]'
                                            : 'bg-gradient-to-br from-[#A07850] to-[#7a5c38] text-white hover:scale-105 shadow-[#A07850]/30'
                                }`}
                                title={isMicActive ? 'Arrêter le micro' : 'Activer le micro'}
                            >
                                {isConnecting ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-[#A07850]/30 border-t-[#A07850] rounded-full" />
                                ) : isMicActive ? (
                                    <Square size={16} className="fill-white" />
                                ) : (
                                    <Mic size={20} />
                                )}
                            </button>

                            {/* Text input */}
                            <div className="relative flex-1">
                                <input
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Écrivez votre message..."
                                    className="w-full pr-[60px] py-4 px-5 bg-[#FAFAF8] border-2 border-[#E5E7EB]/80 rounded-[28px] text-[15.5px] text-[#2E2E2E] focus:outline-none focus:border-[#A07850]/40 focus:bg-white transition-all placeholder:text-[#9CA3AF]/60 shadow-inner"
                                    disabled={isConnecting}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isConnecting}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E2E2E] to-[#1a1a1a] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:scale-95 hover:scale-105 shadow-md"
                                >
                                    <Send size={15} className="ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}


/** Save conversation to Firestore at /tenants/{uid}/voice-sessions */
async function saveConversation(transcript: any[], user: any) {
    if (!user || transcript.length < 2) return;
    try {
        const token = await user.getIdToken();
        // Auto-generate title from first user message
        const firstUserMsg = transcript.find(t => t.role === 'user')?.text || 'Conversation';
        const title = firstUserMsg.length > 60 ? firstUserMsg.slice(0, 57) + '…' : firstUserMsg;
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        await fetch('/api/crm/voice-sessions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, date, transcript }),
        });
    } catch (err) {
        console.error('[VoiceAgent] Failed to save session:', err);
    }
}
/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE — switches between Travel and Legal agents
   ═══════════════════════════════════════════════════════════════ */

export default function AgentIAPage() {
    const { vertical } = useVertical();
    const isLegal = vertical?.id === 'legal';
    if (isLegal) return <UnifiedLegalAgent />;
    return <TravelAgentPage />;
}

function TravelAgentPage() {
    const [agentType, setAgentType] = useState<AgentType>('voyage');
    const [agentInitialParams, setAgentInitialParams] = useState<Record<string, string> | null>(null);
    const [savedSession, setSavedSession] = useState<{ destination: string; timestamp: string; budget?: string; pax?: string } | null>(null);
    const [searchHistory, setSearchHistory] = useState<{ id: number; destination: string; timestamp: string }[]>([]);
    const [loadedAgents, setLoadedAgents] = useState<Set<AgentType>>(new Set(['voyage']));
    const [isSearching, setIsSearching] = useState(false);

    const searchParams = useSearchParams();
    useEffect(() => {
        const agentParam = searchParams.get('agent');
        if (agentParam === 'prestations') {
            setAgentType('prestations');
            setLoadedAgents(prev => new Set(prev).add('prestations'));
        }
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            if (key !== 'agent') params[key] = value;
        });
        if (Object.keys(params).length > 0) {
            setAgentInitialParams(params);
        }
    }, [searchParams]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('luna_last_results');
            if (saved) {
                const session = JSON.parse(saved);
                if (session.results && session.destination) {
                    setSavedSession({
                        destination: session.destination,
                        timestamp: session.timestamp,
                        budget: session.budget,
                        pax: session.pax,
                    });
                }
            }
            const hist = localStorage.getItem('luna_search_history');
            if (hist) {
                const parsed = JSON.parse(hist);
                setSearchHistory(parsed.slice(-5).reverse());
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            setAgentInitialParams(detail);
            setAgentType(detail.agentType || 'voyage');
        };
        window.addEventListener('luna:openAgent', handler);
        return () => window.removeEventListener('luna:openAgent', handler);
    }, []);

    useEffect(() => {
        const onStart = () => setIsSearching(true);
        const onEnd = () => setIsSearching(false);
        window.addEventListener('luna:agentSearchStart', onStart);
        window.addEventListener('luna:agentSearchEnd', onEnd);
        return () => {
            window.removeEventListener('luna:agentSearchStart', onStart);
            window.removeEventListener('luna:agentSearchEnd', onEnd);
        };
    }, []);

    const switchAgent = (type: AgentType) => {
        if (type === agentType) return;
        setLoadedAgents(prev => new Set(prev).add(type));
        setAgentType(type);
    };

    const cancelSearch = () => {
        window.dispatchEvent(new CustomEvent('luna:agentCancelSearch'));
        setIsSearching(false);
    };

    const current = agents[agentType];

    return (
        <div className="w-full h-full">
            <div className="max-w-[1200px] mx-auto w-full pb-20 -mt-[100px]">
                <div className="flex flex-col items-center text-center mb-6 pt-2">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center agent-ia-glow">
                            <Bot size={48} className="text-[#5a8fa3]" strokeWidth={1.5} />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#f8f8f8]" />
                    </div>

                    <style>{`
                        .agent-ia-glow { animation: agentIaGlow 3s ease-in-out infinite; }
                        @keyframes agentIaGlow {
                            0%, 100% { box-shadow: 0 0 15px 5px rgba(188,222,234,0.25), 0 0 35px 12px rgba(90,143,163,0.08); }
                            50% { box-shadow: 0 0 25px 10px rgba(188,222,234,0.4), 0 0 55px 20px rgba(90,143,163,0.15); }
                        }
                    `}</style>

                    <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-[36px] font-light text-[#2E2E2E] tracking-tight">Agent IA</h1>
                        <div className="px-2.5 py-1 rounded-lg bg-[#b9dae9]/20 border border-[#b9dae9]/25">
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#5a8fa3]">Super Agent</span>
                        </div>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF] font-medium">Recherche intelligente de voyages et prestations • Gemini</p>

                    <div className="flex items-center gap-3 mt-6">
                        {(Object.keys(agents) as AgentType[]).map((type) => {
                            const agent = agents[type];
                            const isActive = agentType === type;
                            const Icon = agent.icon;
                            return (
                                <button
                                    key={type}
                                    onClick={() => switchAgent(type)}
                                    className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-200 border h-[52px] min-w-[180px]
                                        ${isActive ? 'bg-white border-[#e0e0e0] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]' : 'bg-white border-[#f0f0f0] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] hover:border-[#e0e0e0]'}`}
                                >
                                    {isActive && (
                                        <motion.div layoutId="agent-active-line" className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] rounded-full bg-gradient-to-r ${agent.gradient}`} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                                    )}
                                    <Icon size={17} className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-[#5a8fa3]' : 'text-[#9CA3AF]'}`} />
                                    <div className="flex flex-col items-start">
                                        <span className={`font-semibold uppercase tracking-[0.1em] text-[11px] transition-colors duration-200 ${isActive ? 'text-[#2E2E2E]' : 'text-[#9CA3AF]'}`}>{agent.label}</span>
                                        <span className={`text-[9px] transition-colors duration-200 ${isActive ? 'text-[#5a8fa3]' : 'text-[#C0C0C0]'}`}>{agent.desc.split(',')[0]}</span>
                                    </div>
                                </button>
                            );
                        })}

                        <AnimatePresence>
                            {isSearching && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={cancelSearch}
                                    className="flex items-center gap-2 px-5 py-3 h-[52px] rounded-2xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:border-red-300 transition-all duration-200 overflow-hidden whitespace-nowrap"
                                >
                                    <XCircle size={16} />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Annuler</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={agentType}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="flex items-center justify-center gap-2 px-4 py-2 mb-4 rounded-xl bg-gradient-to-r from-[#2E2E2E]/[0.02] to-transparent border border-[#2E2E2E]/[0.04]"
                    >
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${current.gradient}`} />
                        <span className="text-[10px] font-medium text-[#2E2E2E]/30">{current.subtitle}</span>
                        <ArrowRight size={8} className="text-[#2E2E2E]/15" />
                        <span className="text-[10px] text-[#2E2E2E]/20">{current.desc}</span>
                    </motion.div>
                </AnimatePresence>

                {savedSession && agentType === 'voyage' && (
                    <div className="mb-4 p-3.5 bg-gradient-to-r from-[#b9dae9]/10 to-white rounded-2xl border border-[#b9dae9]/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#b9dae9]/15 flex items-center justify-center">
                                <Plane size={14} className="text-[#5a8fa3]" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[#2E2E2E]">Dernière recherche : <span className="text-[#5a8fa3]">{savedSession.destination}</span></p>
                                <p className="text-[9px] text-[#9CA3AF] mt-0.5">
                                    {savedSession.timestamp ? new Date(savedSession.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                    {savedSession.budget ? ` • Budget: ${savedSession.budget}` : ''}
                                    {savedSession.pax ? ` • ${savedSession.pax}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setAgentType('prestations'); setTimeout(() => setAgentType('voyage'), 50); }} className="px-4 py-2 bg-[#b9dae9] text-[#2E2E2E] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#a5cadc] transition-all shadow-sm flex items-center gap-1.5">
                                <ArrowRight size={11} /> Reprendre
                            </button>
                            <button onClick={() => { try { localStorage.removeItem('luna_last_results'); } catch { /* */ } setSavedSession(null); }} className="px-3 py-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                    </div>
                )}

                {searchHistory.length > 0 && (
                    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
                        <span className="text-[9px] text-[#9CA3AF] uppercase tracking-widest font-bold shrink-0">Récents:</span>
                        {searchHistory.map(s => (
                            <span key={s.id} className="shrink-0 px-3 py-1 bg-white rounded-full text-[9px] text-[#2E2E2E]/50 border border-[#2E2E2E]/[0.06] font-medium">
                                {s.destination} • {new Date(s.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                        ))}
                    </div>
                )}

                <style jsx global>{`
                    .agent-page-container > div > .absolute.inset-0.z-0 { display: none !important; }
                    .agent-page-container > div > .absolute.top-16, .agent-page-container > div > .absolute.top-20 { display: none !important; }
                    .agent-page-container > div { background: transparent !important; min-height: auto !important; overflow: visible !important; }
                    .agent-page-container [data-agent-wrapper] { min-height: auto !important; overflow: visible !important; }
                    .agent-page-container [data-agent-content] { padding-top: 0 !important; }
                    .agent-page-container [data-agent-form] { padding: 0 !important; max-width: 100% !important; }
                    .agent-page-container footer, .agent-page-container > div > .fixed.bottom-10 { display: none !important; }
                    .agent-page-container .weather-sidebar { position: fixed !important; top: 80px !important; right: 16px !important; left: auto !important; width: 230px !important; max-height: calc(100vh - 100px) !important; overflow-y: auto !important; z-index: 50 !important; scrollbar-width: none; }
                    .agent-page-container .weather-sidebar::-webkit-scrollbar { display: none; }
                `}</style>

                <div className="agent-page-container">
                    <div className={`transition-opacity duration-200 ease-in-out ${agentType === 'voyage' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
                        <Suspense fallback={<AgentLoading />}>
                            <VoyageAgent initialParams={agentInitialParams} />
                        </Suspense>
                    </div>

                    <div className={`transition-opacity duration-200 ease-in-out ${agentType === 'prestations' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
                        {loadedAgents.has('prestations') && (
                            <Suspense fallback={<AgentLoading />}>
                                <PrestationsAgent />
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AgentLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Bot size={20} className="text-[#b9dae9]" />
                </motion.div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.2em] font-bold">Initialisation de l&apos;agent</p>
            </div>
        </div>
    );
}
