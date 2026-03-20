'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type VoiceOrbState = 'idle' | 'listening' | 'speaking' | 'connecting' | 'error';

interface VoiceOrbProps {
  state: VoiceOrbState;
  audioLevel: number; // 0.0 to 1.0 (RMS amplitude)
  size?: 'lg' | 'sm'; // lg = center screen, sm = docked
  onClick?: () => void;
}

export function VoiceOrb({ state, audioLevel, size = 'lg', onClick }: VoiceOrbProps) {
  const isDocked = size === 'sm';
  const isSpeaking = state === 'speaking';
  
  // Animation driving variables based on state & audio level
  const baseScale = isDocked ? 0.35 : 1.0;
  
  // Give a floor audioLevel for idle breathing
  const activeLevel = Math.max(0.05, audioLevel);
  
  // Outer glowing halo scale
  const haloScale = baseScale * (1 + activeLevel * 1.8);
  const coreScale = baseScale * (1 + activeLevel * 0.4);

  // Colors: 
  // Idle/Listening = Cyan/Blue theme
  // Speaking = Red/Warm theme
  const palette = isSpeaking 
    ? {
        corePill: "rgba(255, 60, 60, 0.95)", // Solid red center
        coreGlow: "rgba(255, 40, 40, 0.7)",
        halo: "radial-gradient(circle, rgba(255,100,100,0.4) 0%, rgba(255,50,50,0.1) 50%, rgba(255,0,0,0) 70%)"
      }
    : {
        corePill: "rgba(240, 248, 255, 0.95)", // Whiteish center
        coreGlow: "rgba(50, 160, 255, 0.8)", // Cyan Blue glow
        halo: "radial-gradient(circle, rgba(100,180,255,0.4) 0%, rgba(50,140,255,0.15) 50%, rgba(0,50,255,0) 70%)"
      };

  return (
    <div 
      className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${isDocked ? 'hover:scale-105 active:scale-95' : 'hover:scale-105'}`}
      onClick={state !== 'connecting' ? onClick : undefined}
      style={{ width: isDocked ? '80px' : '300px', height: isDocked ? '80px' : '300px' }}
    >
        {/* Soft floating halo */}
        <motion.div
            className="absolute rounded-full pointer-events-none"
            animate={{
              scale: haloScale,
              opacity: state === 'idle' ? 0.4 : 0.7 + activeLevel * 0.3,
            }}
            transition={{
              scale: { duration: 0.15, ease: "easeOut" },
              opacity: { duration: 0.2 }
            }}
            style={{
              width: 300,
              height: 300,
              background: palette.halo,
              filter: "blur(20px)"
            }}
        />

        {/* Liquid Core */}
        <motion.div
            className="absolute bg-white/10 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center"
            animate={{
                scaleX: coreScale * (1 + activeLevel * 0.15), // Stretch X when loud
                scaleY: coreScale * (1 - activeLevel * 0.05), // Squash Y
                rotate: state === 'idle' ? [0, 5, -5, 0] : [0, audioLevel * 10, audioLevel * -10, 0],
                boxShadow: `0 0 ${40 + activeLevel * 80}px ${palette.coreGlow}`
            }}
            transition={{
                scaleX: { duration: 0.1, ease: 'easeOut' },
                scaleY: { duration: 0.1, ease: 'easeOut' },
                rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{
                width: 140,
                height: 140,
                border: "1px solid rgba(255,255,255,0.2)"
            }}
        >
            {/* Inner dense pill/core */}
            <motion.div
                className="absolute shadow-inner"
                animate={{
                    scale: 1 + activeLevel * 0.3,
                    backgroundColor: palette.corePill,
                    borderRadius: ["50% 50%", "45% 55%", "50% 50%"]
                }}
                transition={{
                    scale: { duration: 0.1, ease: 'easeOut' },
                    borderRadius: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
                style={{
                    width: '60%',
                    height: '60%',
                    filter: "blur(4px)"
                }}
            />
            
            {/* Connection loading ring */}
            {state === 'connecting' && (
                <motion.div 
                    className="absolute inset-[-10px] rounded-full border-t-2 border-r-2 border-white/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </motion.div>
    </div>
  );
}
