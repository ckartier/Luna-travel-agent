'use client';

import { useState, useEffect, Suspense } from 'react';
import { X, Plane, Hotel, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const VoyageAgent = dynamic(() => import('@/app/voyage-agent/page'), { ssr: false });
const PrestationsAgent = dynamic(() => import('@/app/prestations-agent/page'), { ssr: false });

type AgentType = 'voyage' | 'prestations';

const agents = {
    voyage: {
        label: 'Voyage',
        subtitle: 'Itinéraire complet avec IA',
        icon: Plane,
        desc: 'Vol, Hôtel, Activités, Programme',
    },
    prestations: {
        label: 'Prestations',
        subtitle: 'Recherche sémantique catalogue',
        icon: Hotel,
        desc: 'Hébergement, Transfert, Activité',
    },
};

/* ═══ Inline Robot Head SVG ═══ */
function RobotIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Antenna */}
            <line x1="12" y1="2" x2="12" y2="5" />
            <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
            {/* Head */}
            <rect x="4" y="5" width="16" height="13" rx="3" />
            {/* Eyes */}
            <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11" r="1.5" fill="currentColor" stroke="none" />
            {/* Mouth */}
            <path d="M9 15h6" />
            {/* Ears */}
            <line x1="2" y1="10" x2="4" y2="10" />
            <line x1="20" y1="10" x2="22" y2="10" />
        </svg>
    );
}

interface AgentIAModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AgentIAModal({ isOpen, onClose }: AgentIAModalProps) {
    const [agentType, setAgentType] = useState<AgentType>('voyage');
    const [agentInitialParams, setAgentInitialParams] = useState<Record<string, string> | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Listen for external events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            setAgentInitialParams(detail);
            setAgentType(detail.agentType || 'voyage');
        };
        window.addEventListener('luna:openAgent', handler);
        return () => window.removeEventListener('luna:openAgent', handler);
    }, []);

    // Escape key
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const switchAgent = (type: AgentType) => {
        if (type === agentType) return;
        setIsTransitioning(true);
        setTimeout(() => { setAgentType(type); setIsTransitioning(false); }, 150);
    };

    const current = agents[agentType];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — clean, no blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100] bg-[#2E2E2E]/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className={`fixed z-[101] bg-white rounded-2xl border border-gray-200/60 flex flex-col overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.12)] ${
                            expanded
                                ? 'inset-3'
                                : 'inset-0 m-auto w-[90vw] max-w-[1100px] h-[88vh] max-h-[900px]'
                        }`}
                        style={{ transition: 'all 0.3s ease' }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3.5">
                                {/* Robot icon — Luna blue circle */}
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-xl bg-[#5a8fa3] flex items-center justify-center">
                                        <RobotIcon size={18} className="text-white" />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[2px] border-white" />
                                </div>

                                {/* Title */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-[15px] font-bold text-[#2E2E2E] tracking-tight">Agent IA</h2>
                                        <span className="px-1.5 py-0.5 rounded-md bg-[#b9dae9]/20 text-[7px] font-bold uppercase tracking-[0.15em] text-[#5a8fa3]">
                                            Gemini
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 -mt-0.5">{current.subtitle}</p>
                                </div>

                                {/* ── Tab switcher — Luna palette ── */}
                                <div className="flex items-center ml-3 bg-gray-50/80 rounded-lg p-0.5 border border-gray-100">
                                    {(Object.keys(agents) as AgentType[]).map(type => {
                                        const agent = agents[type];
                                        const isActive = agentType === type;
                                        const Icon = agent.icon;
                                        return (
                                            <button key={type} onClick={() => switchAgent(type)}
                                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-150 ${
                                                    isActive
                                                        ? 'bg-[#5a8fa3] text-white shadow-sm'
                                                        : 'text-gray-400 hover:text-[#2E2E2E] hover:bg-white'
                                                }`}>
                                                <Icon size={12} />
                                                {agent.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button onClick={() => setExpanded(!expanded)}
                                    className="p-2 rounded-lg text-gray-300 hover:text-[#5a8fa3] hover:bg-[#b9dae9]/10 transition-colors">
                                    {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                </button>
                                <button onClick={onClose}
                                    className="p-2 rounded-lg text-gray-300 hover:text-[#2E2E2E] hover:bg-gray-50 transition-colors">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* ── CSS overrides for embedded agent pages ── */}
                        <style jsx global>{`
                            .agent-modal-container > div > .absolute.inset-0.z-0 { display: none !important; }
                            .agent-modal-container > div > .absolute.top-16,
                            .agent-modal-container > div > .absolute.top-20 { display: none !important; }
                            .agent-modal-container > div {
                                background: transparent !important;
                                min-height: auto !important;
                                overflow: visible !important;
                            }
                            .agent-modal-container [data-agent-wrapper] {
                                min-height: auto !important;
                                overflow: visible !important;
                            }
                            .agent-modal-container [data-agent-content] {
                                padding-top: 0 !important;
                            }
                            .agent-modal-container [data-agent-form] {
                                padding: 0 !important;
                                max-width: 100% !important;
                            }
                            .agent-modal-container footer,
                            .agent-modal-container > div > .fixed.bottom-10 { display: none !important; }
                        `}</style>

                        {/* ── Agent Content ── */}
                        <div className={`flex-1 overflow-y-auto p-6 agent-modal-container transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                            <Suspense fallback={
                                <div className="flex items-center justify-center min-h-[300px]">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#5a8fa3]/10 flex items-center justify-center">
                                            <Loader2 size={18} className="text-[#5a8fa3] animate-spin" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Chargement</p>
                                    </div>
                                </div>
                            }>
                                <AnimatePresence mode="wait">
                                    <motion.div key={agentType}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.2 }}>
                                        {agentType === 'voyage'
                                            ? <VoyageAgent initialParams={agentInitialParams} />
                                            : <PrestationsAgent />
                                        }
                                    </motion.div>
                                </AnimatePresence>
                            </Suspense>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
