'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Mic, MessageCircle, Bot, X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   AI HUB — Unified floating entry point for all AI features
   ═══════════════════════════════════════════════════════════════
   Replaces the separate Voice Agent button + Chatbot button
   with a single premium button that expands into a vertical menu:
     • 🎙️ Voice Agent
     • 💬 Help Chatbot
     • 🤖 Agent IA (page shortcut)
   ═══════════════════════════════════════════════════════════════ */

const MENU_ITEMS = [
    {
        id: 'agents' as const,
        label: 'Agent IA',
        sublabel: 'Super Agents',
        icon: Bot,
        color: '#5a8fa3',
        bg: 'rgba(90,143,163,0.08)',
        border: 'rgba(90,143,163,0.15)',
    },
    {
        id: 'chat' as const,
        label: 'Chat',
        sublabel: 'Aide & FAQ',
        icon: MessageCircle,
        color: '#2E2E2E',
        bg: 'rgba(46,46,46,0.06)',
        border: 'rgba(46,46,46,0.1)',
    },
    {
        id: 'voice' as const,
        label: 'Voice',
        sublabel: 'Agent Vocal',
        icon: Mic,
        color: '#b9dae9',
        bg: 'rgba(185,218,233,0.12)',
        border: 'rgba(185,218,233,0.25)',
    },
] as const;

type MenuItemId = typeof MENU_ITEMS[number]['id'];

interface AIHubProps {
    onOpenVoice: () => void;
    onOpenChat: () => void;
}

export function AIHub({ onOpenVoice, onOpenChat }: AIHubProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSelect = useCallback((id: MenuItemId) => {
        setIsOpen(false);
        if (id === 'voice') {
            onOpenVoice();
        } else if (id === 'chat') {
            onOpenChat();
        } else if (id === 'agents') {
            router.push('/crm/agent-ia');
        }
    }, [onOpenVoice, onOpenChat, router]);

    return (
        <>
            {/* ═══ BACKDROP — subtle blur when menu open ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[998]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ═══ MENU ITEMS — vertical stack above button ═══ */}
            <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2.5">
                <AnimatePresence>
                    {isOpen && MENU_ITEMS.map((item, idx) => {
                        const Icon = item.icon;
                        const reverseIdx = MENU_ITEMS.length - 1 - idx;
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: 15, scale: 0.8, x: 10 }}
                                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8, x: 10 }}
                                transition={{
                                    delay: reverseIdx * 0.06,
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                }}
                                onClick={() => handleSelect(item.id)}
                                className="group flex items-center gap-3 pr-3 pl-4 py-2.5 rounded-2xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-lg"
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    backdropFilter: 'blur(20px)',
                                    borderColor: item.border,
                                    boxShadow: '0 8px 32px -6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
                                }}
                            >
                                {/* Text */}
                                <div className="text-right">
                                    <p className="text-[12px] font-bold text-[#0B1220] leading-tight">{item.label}</p>
                                    <p className="text-[10px] text-[#667085] font-medium">{item.sublabel}</p>
                                </div>

                                {/* Icon circle */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0"
                                    style={{ background: item.bg, border: `1px solid ${item.border}` }}
                                >
                                    <Icon size={18} style={{ color: item.color }} strokeWidth={1.8} />
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {/* ═══ MAIN BUTTON — Luna IA ═══ */}
                <motion.button
                    onClick={() => setIsOpen(v => !v)}
                    className="relative group"
                    whileTap={{ scale: 0.92 }}
                >
                    {/* Glow ring */}
                    <span className={`absolute inset-[-4px] rounded-full transition-all duration-500 ${
                        isOpen
                            ? 'bg-gradient-to-r from-[#5a8fa3] to-[#b9dae9] opacity-30 blur-lg'
                            : 'bg-gradient-to-r from-[#5a8fa3] to-[#b9dae9] opacity-0 group-hover:opacity-25 blur-md'
                    }`} />

                    {/* Subtle ping when closed */}
                    {!isOpen && (
                        <span className="absolute inset-0 rounded-full bg-[#5a8fa3]/10 animate-ping" style={{ animationDuration: '3s' }} />
                    )}

                    {/* Button body */}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.15)] ${
                        isOpen
                            ? 'bg-[#0B1220] rotate-0 shadow-[0_8px_32px_rgba(0,0,0,0.25)]'
                            : 'bg-gradient-to-br from-[#4a7d8f] to-[#5a8fa3] group-hover:shadow-[0_8px_32px_rgba(90,143,163,0.3)]'
                    }`}>
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <X size={20} className="text-white" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="spark"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Sparkles size={22} className="text-white" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Online indicator */}
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white shadow-sm" />
                </motion.button>
            </div>
        </>
    );
}
