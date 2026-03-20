'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import type { useHubVoice } from '@/src/hooks/useHubVoice';

const GREEN = '#19c37d';
const CYAN = '#16b8c8';

export default function VoiceView({ voice, scrollRef }: {
    voice: ReturnType<typeof useHubVoice>;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
    const { voiceState, transcript, audioLevel, start, stop } = voice;
    const isActive = voiceState !== 'idle' && voiceState !== 'error';

    return (
        <div className="flex items-center justify-center animate-[fadeUp_.8s_cubic-bezier(0.22,1,0.36,1)]">
            <div className="w-full max-w-[720px] rounded-[32px] border border-white/50 bg-white/18 p-8 text-center backdrop-blur-xl">
                {/* Orb */}
                <div className="mb-6 flex justify-center">
                    <motion.div
                        animate={{
                            scale: isActive ? 1 + audioLevel * 0.2 : 1,
                            boxShadow: voiceState === 'listening'
                                ? `0 0 ${30 + audioLevel * 50}px rgba(25,195,125,${0.2 + audioLevel * 0.3})`
                                : voiceState === 'speaking'
                                    ? `0 0 ${30 + audioLevel * 50}px rgba(22,184,200,${0.2 + audioLevel * 0.3})`
                                    : '0 0 40px rgba(25,195,125,0.25)',
                        }}
                        transition={{ duration: 0.08 }}
                        className="flex h-28 w-28 items-center justify-center rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(25,195,125,0.35), rgba(22,184,200,0.25))' }}>
                        {isActive ? (
                            <div className="flex items-center gap-[2px]">
                                {Array.from({ length: 9 }).map((_, i) => {
                                    const d = Math.abs(i - 4) / 4;
                                    const h = Math.max(4, audioLevel * 36 * (1 - d * 0.4));
                                    return (
                                        <motion.div key={i} className="w-[3px] rounded-full"
                                            style={{ background: voiceState === 'listening' ? GREEN : CYAN }}
                                            animate={{ height: `${h}px`, opacity: audioLevel > 0.01 ? 0.7 + audioLevel * 0.3 : 0.3 }}
                                            transition={{ duration: 0.05 }} />
                                    );
                                })}
                            </div>
                        ) : (
                            <Mic className="h-10 w-10 text-white" />
                        )}
                    </motion.div>
                </div>

                <h2 className="mb-3 text-2xl text-zinc-800 font-mono">AI Voice Assistant</h2>
                <p className="mb-1 text-sm text-zinc-600 font-mono">
                    {voiceState === 'listening' ? '🎤 En écoute — parlez maintenant…' :
                     voiceState === 'speaking' ? '🔊 Réponse en cours…' :
                     voiceState === 'connecting' ? '⏳ Connexion à Gemini…' :
                     'Supervise les CRM, analyse les bugs, propose des actions.'}
                </p>

                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: voiceState === 'listening' ? '#ef4444' : voiceState === 'speaking' ? '#60a5fa' : voiceState === 'connecting' ? '#ffd15c' : GREEN }} />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        {voiceState === 'idle' ? 'Prêt' : voiceState === 'listening' ? 'En écoute' : voiceState === 'speaking' ? 'Parle' : voiceState === 'connecting' ? 'Connexion' : 'Erreur'}
                    </span>
                </div>

                <div className="flex justify-center gap-3">
                    <button onClick={start} disabled={isActive}
                        className="rounded-[14px] px-5 py-3 text-white font-mono text-[12px] transition-all disabled:opacity-40" style={{ backgroundColor: GREEN }}>
                        Démarrer
                    </button>
                    <button onClick={stop} disabled={!isActive}
                        className="rounded-[14px] bg-white/30 px-5 py-3 font-mono text-[12px] transition-all disabled:opacity-40">
                        Arrêter
                    </button>
                </div>

                {/* Transcript */}
                {transcript.length > 0 && (
                    <div ref={scrollRef} className="mt-8 rounded-[20px] bg-white/20 p-4 text-left max-h-[300px] overflow-y-auto space-y-3">
                        <div className="mb-2 text-[11px] text-zinc-400 font-mono uppercase tracking-wider">Conversation</div>
                        {transcript.map((e, i) => (
                            <div key={i} className={`flex ${e.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] font-mono leading-relaxed ${
                                    e.role === 'user' ? 'bg-zinc-700 text-white' : 'border border-white/40'
                                }`} style={e.role !== 'user' ? { background: `${GREEN}15`, color: '#2d6b4f' } : undefined}>
                                    {e.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
