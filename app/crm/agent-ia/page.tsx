'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Bot, Mic, Send, Square, Keyboard, Volume2, Scale, Plane, Hotel, ArrowRight, XCircle, Mail, FileText, AlertTriangle, Calendar, Euro, Clock, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVertical } from '@/src/contexts/VerticalContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { sanitizeHtml } from '@/src/lib/sanitize';
import { useGeminiLive as useVoiceAgent } from '@/src/hooks/useGeminiLive';
import { useSearchParams } from 'next/navigation';

// Dynamically import travel agents
import dynamic from 'next/dynamic';
import { T } from '@/src/components/T';
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

    // Auto-start session on mount so it says its greeting (only once)
    const hasAutoStarted = useRef(false);
    useEffect(() => {
        if (!hasAutoStarted.current && voiceState === 'idle') {
            hasAutoStarted.current = true;
            start();
        }
    }, [start, voiceState]);

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
                        <h1 className="text-[42px] font-light text-[#2E2E2E] tracking-tight leading-none"><T>Agent Juridique</T></h1>
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
    const [showResults, setShowResults] = useState(false);

    const searchParams = useSearchParams();
    useEffect(() => {
        const agentParam = searchParams?.get('agent');
        if (agentParam === 'prestations') {
            setAgentType('prestations');
            setLoadedAgents(prev => new Set(prev).add('prestations'));
        }
        const params: Record<string, string> = {};
        searchParams?.forEach((value, key) => {
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
        const onStart = () => { setIsSearching(true); setShowResults(false); };
        const onEnd = () => { setIsSearching(false); setShowResults(true); };
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
        setShowResults(false);
    };

    const cancelSearch = () => {
        window.dispatchEvent(new CustomEvent('luna:agentCancelSearch'));
        setIsSearching(false);
    };

    const current = agents[agentType];

    return (
        <div className="w-full h-full">
            <div className="w-full pb-20 px-6 pt-6">

                {/* ═══ PREMIUM HEADER ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between mb-6 pt-2"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5a8fa3] to-[#3d7a91] flex items-center justify-center shadow-lg shadow-[#5a8fa3]/20">
                            <Sparkles size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-[28px] font-medium text-[#2E2E2E] tracking-tight leading-none"><T>Agent IA</T></h1>
                            <p className="text-[13px] text-[#9CA3AF] mt-0.5"><T>Recherche intelligente de voyages et prestations</T></p>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#5a8fa3]/10 to-[#b9dae9]/15 border border-[#b9dae9]/30"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5a8fa3] animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a8fa3]">Gemini Pro</span>
                    </motion.div>
                </motion.div>

                {/* ═══ AGENT TAB-CARDS — Compact Premium ═══ */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {(Object.keys(agents) as AgentType[]).map((type, idx) => {
                        const agent = agents[type];
                        const isActive = agentType === type;
                        const Icon = agent.icon;
                        return (
                            <motion.button
                                key={type}
                                onClick={() => switchAgent(type)}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 400, damping: 30 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative group text-left rounded-2xl px-5 py-4 transition-all duration-300 overflow-hidden cursor-pointer ${
                                    isActive
                                        ? 'bg-white border-2 border-[#b9dae9]/50 shadow-[0_8px_32px_-8px_rgba(90,143,163,0.18)]'
                                        : 'bg-white/60 border-2 border-gray-100 hover:border-[#b9dae9]/25 hover:bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]'
                                }`}
                            >
                                {/* Active gradient overlay */}
                                {isActive && (
                                    <motion.div
                                        layoutId="agent-tab-glow"
                                        className="absolute inset-0 opacity-[0.04] bg-gradient-to-br from-[#5a8fa3] to-[#b9dae9]"
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                    />
                                )}

                                {/* Active top indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="agent-tab-indicator"
                                        className="absolute top-0 left-4 right-4 h-[2.5px] rounded-full bg-gradient-to-r from-[#5a8fa3] to-[#b9dae9]"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                                        isActive
                                            ? `bg-gradient-to-br ${agent.gradient} shadow-md shadow-[#5a8fa3]/15`
                                            : 'bg-gray-50 group-hover:bg-gray-100'
                                    }`}>
                                        <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'}`} />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-[15px] font-medium tracking-tight transition-colors duration-300 ${
                                                isActive ? 'text-[#2E2E2E]' : 'text-[#6B7280] group-hover:text-[#2E2E2E]'
                                            }`}>{agent.label}</h3>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200"
                                                >
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider"><T>Actif</T></span>
                                                </motion.div>
                                            )}
                                        </div>
                                        <p className={`text-[11px] mt-0.5 transition-colors duration-300 truncate ${
                                            isActive ? 'text-[#6B7280]' : 'text-[#B0B0B0]'
                                        }`}>{agent.subtitle}</p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight size={14} className={`shrink-0 transition-all duration-300 ${
                                        isActive ? 'text-[#5a8fa3] translate-x-0' : 'text-[#D0D0D0] -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                    }`} />
                                </div>

                                {/* Tags row */}
                                <div className="relative z-10 flex flex-wrap gap-1 mt-3 pl-[60px]">
                                    {agent.desc.split(', ').map((tag, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-[#5a8fa3]/8 text-[#5a8fa3] border border-[#b9dae9]/25'
                                                    : 'bg-gray-50 text-[#C0C0C0] border border-transparent'
                                            }`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* ═══ Cancel button when searching ═══ */}
                <AnimatePresence>
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex justify-center mb-4"
                        >
                            <button
                                onClick={cancelSearch}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm cursor-pointer"
                            >
                                <XCircle size={16} />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.1em]"><T>Annuler la recherche</T></span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ Saved session banner — Glassmorphism ═══ */}
                {savedSession && agentType === 'voyage' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 p-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-[#b9dae9]/25 shadow-[0_4px_20px_-4px_rgba(90,143,163,0.1)] flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b9dae9]/20 to-[#5a8fa3]/10 flex items-center justify-center border border-[#b9dae9]/20">
                                <Plane size={16} className="text-[#5a8fa3]" />
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-[#2E2E2E]">Dernière recherche : <span className="text-[#5a8fa3] font-medium">{savedSession.destination}</span></p>
                                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                                    {savedSession.timestamp ? new Date(savedSession.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                    {savedSession.budget ? ` · Budget: ${savedSession.budget}` : ''}
                                    {savedSession.pax ? ` · ${savedSession.pax}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setAgentType('prestations'); setTimeout(() => setAgentType('voyage'), 50); }} className="px-4 py-2.5 bg-gradient-to-r from-[#5a8fa3] to-[#3d7a91] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#5a8fa3]/20 transition-all flex items-center gap-1.5 cursor-pointer">
                                <Zap size={11} /> Reprendre
                            </button>
                            <button onClick={() => { try { localStorage.removeItem('luna_last_results'); } catch { /* */ } setSavedSession(null); }} className="p-2 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer rounded-lg hover:bg-gray-50">
                                <XCircle size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ═══ Recent searches — Improved chips ═══ */}
                {searchHistory.length > 0 && (
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock size={11} className="text-[#B0B0B0]" />
                            <span className="text-[10px] text-[#B0B0B0] uppercase tracking-widest font-semibold"><T>Récents</T></span>
                        </div>
                        {searchHistory.map(s => (
                            <motion.span
                                key={s.id}
                                whileHover={{ scale: 1.03, y: -1 }}
                                className="shrink-0 px-3 py-1.5 bg-white rounded-lg text-[11px] text-[#6B7280] border border-gray-100 font-medium hover:border-[#b9dae9]/30 hover:text-[#2E2E2E] transition-all cursor-pointer shadow-sm"
                            >
                                {s.destination} · {new Date(s.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </motion.span>
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

                {/* ═══ RESULTS CONTAINER ═══ */}
                <div className="agent-page-container">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={agentType}
                            initial={{ opacity: 0, y: 20, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.99 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.7 }}
                        >
                            {agentType === 'voyage' && (
                                <Suspense fallback={<AgentLoading />}>
                                    <VoyageAgent initialParams={agentInitialParams} />
                                </Suspense>
                            )}
                            {agentType === 'prestations' && loadedAgents.has('prestations') && (
                                <Suspense fallback={<AgentLoading />}>
                                    <PrestationsAgent />
                                </Suspense>
                            )}
                        </motion.div>
                    </AnimatePresence>
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
