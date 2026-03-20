'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceOrb } from './VoiceOrb';
import { VoiceSocketClient, OrbState } from '../../lib/voice/socketClient';

export function VoiceAssistantLayer() {
    const [state, setState] = useState<OrbState>('idle');
    const [audioLevel, setAudioLevel] = useState(0);
    const [isDocked, setIsDocked] = useState(true); // START DOCKED
    const clientRef = useRef<VoiceSocketClient | null>(null);

    // Click anywhere to dock/undock if active
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // If we are active and they click the background (not the orb directly), dock it
            if (state !== 'idle' && !isDocked) {
                // Ensure they didn't click inside the orb bounds
                if ((e.target as HTMLElement).closest('.voice-orb-container') === null) {
                    setIsDocked(true);
                }
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [state, isDocked]);

    const handleOrbClick = async () => {
        if (state === 'idle') {
            // Undock if it was docked from a previous session
            setIsDocked(false);
            
            // Connect to relay
            if (!clientRef.current) {
                clientRef.current = new VoiceSocketClient();
                clientRef.current.onStateChange = setState;
                clientRef.current.onVolumeChange = setAudioLevel;
            }
            await clientRef.current.connect();
        } else if (isDocked) {
            // Just expand it back
            setIsDocked(false);
        } else {
            // Stop if already expanded and active
            clientRef.current?.disconnect();
            setIsDocked(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                {/* Background Blur Overlay (Only when expanded & active) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: !isDocked && state !== 'idle' ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none"
                    style={{ pointerEvents: !isDocked && state !== 'idle' ? 'auto' : 'none', zIndex: 9998 }}
                />

                {/* Orb Container */}
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        left: isDocked ? 'calc(100vw - 80px)' : '50vw',
                        top: isDocked ? 'calc(100vh - 80px)' : '50vh',
                        zIndex: 9999
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                        mass: 0.8
                    }}
                    style={{
                        position: 'absolute',
                        translateX: '-50%',
                        translateY: '-50%'
                    }}
                    className="pointer-events-auto voice-orb-container"
                >
                    <VoiceOrb 
                        state={state} 
                        audioLevel={audioLevel} 
                        size={isDocked ? 'sm' : 'lg'} 
                        onClick={handleOrbClick} 
                    />
                </motion.div>
                
                {/* Minimal Status Hint text below the orb when not docked */}
                <AnimatePresence>
                    {!isDocked && state !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-[11px] uppercase tracking-[0.2em] font-medium"
                        >
                            {state === 'connecting' ? 'Connecting to Gemini Live...' :
                             state === 'listening'  ? 'Tap empty space to dock • Tap orb to stop' :
                             state === 'speaking'   ? 'Assistant is speaking' : ''}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
}
