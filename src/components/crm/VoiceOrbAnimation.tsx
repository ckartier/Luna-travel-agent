'use client';

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const particles = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (i / 28) * Math.PI * 2,
  radius: 96 + (i % 4) * 10,
}));

function OrbitalDust({ intensity, active, palette }: { intensity: number; active: boolean; palette?: any }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((p) => {
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;
        return (
          <motion.span
            key={p.id}
            className={`absolute left-1/2 top-1/2 block rounded-full ${palette ? palette.dust : active ? "bg-red-100" : "bg-white"}`}
            style={{
              width: p.id % 3 === 0 ? 2.5 : 1.5,
              height: p.id % 3 === 0 ? 2.5 : 1.5,
              boxShadow: palette ? palette.dustShadow : active
                ? "0 0 12px rgba(255,170,170,0.9)"
                : "0 0 10px rgba(255,255,255,0.9)",
            }}
            initial={{ x, y, opacity: 0.16 }}
            animate={{
              x: [x, x * (1.02 + intensity * 0.08), x * 0.98, x],
              y: [y, y * 0.98, y * (1.03 + intensity * 0.08), y],
              opacity: [0.14, 0.7 + intensity * 0.25, 0.2, 0.14],
              scale: [1, 1.2 + intensity * 0.6, 1],
            }}
            transition={{
              duration: 1.2 + (p.id % 5) * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.id * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}

function OrbitRings({ intensity, active, palette }: { intensity: number; active: boolean; palette?: any }) {
  const ring = palette ? palette.ring : active ? "border-red-200/35" : "border-cyan-100/30";
  const ellipse = active ? "border-red-100/30" : "border-white/20";

  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute inset-0 m-auto rounded-full border ${ring}`}
          style={{ width: 180 + i * 26, height: 180 + i * 26 }}
          animate={{
            rotate: i % 2 === 0 ? 360 : -360,
            scale: [1, 1.02 + intensity * 0.04, 0.99, 1],
            opacity: [0.25, 0.42 + intensity * 0.25, 0.25],
          }}
          transition={{
            rotate: { duration: 14 + i * 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {[0, 1].map((i) => (
        <motion.div
          key={`ellipse-${i}`}
          className={`absolute left-1/2 top-1/2 h-[156px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ellipse}`}
          animate={{
            rotate: i === 0 ? 360 : -360,
            scaleX: [1, 1.02 + intensity * 0.05, 1],
            opacity: [0.18, 0.34 + intensity * 0.2, 0.18],
          }}
          transition={{
            rotate: { duration: 10 + i * 4, repeat: Infinity, ease: "linear" },
            scaleX: { duration: 0.85, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
    </>
  );
}

export default function VoiceOrbAnimation({ size = 'lg', onClick, state = 'idle', parentLevel = 0 }: { size?: 'sm' | 'lg', onClick?: () => void, state?: string, parentLevel?: number }) {
  const [level, setLevel] = useState(0.06);
  // If size is 'sm', we are docked (the floating button).
  const [docked, setDocked] = useState(size === 'sm');
  const [supported, setSupported] = useState(true);

  // Sync size changes to docked state
  useEffect(() => {
    setDocked(size === 'sm');
  }, [size]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallbackPhase = useRef(0);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);

    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
    };

    const startFallback = () => {
      const loop = () => {
        fallbackPhase.current += 0.06;
        const simulated =
          0.08 +
          Math.sin(fallbackPhase.current * 1.25) * 0.06 +
          Math.sin(fallbackPhase.current * 3.5) * 0.05 +
          Math.max(0, Math.sin(fallbackPhase.current * 5.4)) * 0.18;
        setLevel(Math.max(0.04, Math.min(0.72, simulated)));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    const startMic = async () => {
      // If parent explicitly passes level (e.g. speaking state), prioritize it instead of spinning up another mic instance
      // Wait, we WANT the microphone to react while the user speaks.
      // But if the *agent* is speaking, we use the parentLevel (which gives us TTS volume).
      if (!navigator.mediaDevices?.getUserMedia) {
        setSupported(false);
        startFallback();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const AudioCtor =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        const context = new AudioCtor();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.72;

        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        streamRef.current = stream;
        sourceRef.current = source;
        analyserRef.current = analyser;
        audioContextRef.current = context;

        const loop = () => {
          analyser.getByteTimeDomainData(data);
          let sumSquares = 0;
          for (let i = 0; i < data.length; i += 1) {
            const normalized = (data[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / data.length);
          const boosted = Math.min(1, Math.max(0.02, rms * 10.5));
          setLevel((prev) => prev * 0.36 + boosted * 0.64);
          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch {
        startFallback();
      }
    };

    startMic();
    return cleanup;
  }, []);

  // activeLevel controls the size and wobble.
  // For the AI, we use parentLevel. For the user, we use internal level.
  const activeLevel = state === 'speaking' ? parentLevel : level;
  
  // The user wants RED when they speak, and BLUE when the AI speaks or thinks.
  const userSpeaking = state === 'listening' && level > 0.05;
  const isRed = userSpeaking;

  // Sizing mapping based on user's exact values, adjusting container layout
  const orbSize = docked ? 64 : 140;
  const shellSize = docked ? 52 : 120;
  const haloSize = docked ? 80 : 180;
  
  const outerScale = Math.max(0.1, 1 + activeLevel * 0.3);
  const innerScale = Math.max(0.1, 1 + activeLevel * 0.18);
  const squishX = Math.max(0.1, 1 + activeLevel * 0.09);
  const squishY = Math.max(0.1, 1 - activeLevel * 0.04);

  const palette = isRed
    ? {
        glow: "rgba(255,84,84,0.72)",
        glowSoft: "rgba(255,120,120,0.34)",
        border: "rgba(255,224,224,0.34)",
        core: "radial-gradient(circle at 35% 30%, rgba(255,247,247,0.96), rgba(255,178,178,0.5) 20%, rgba(255,102,102,0.42) 40%, rgba(228,52,82,0.3) 62%, rgba(120,18,32,0.42) 82%, rgba(10,18,28,0) 88%)",
        halo: "radial-gradient(circle, rgba(255,118,118,0.34) 0%, rgba(255,98,98,0.2) 34%, rgba(220,40,70,0.14) 56%, rgba(10,30,80,0.03) 76%, rgba(10,30,80,0) 82%)",
        ring: "border-red-200/35",
        dust: "bg-red-100",
        dustShadow: "0 0 12px rgba(255,170,170,0.9)",
        innerRing: "rgba(255,225,225,0.22)",
        coreRing: "rgba(255,190,190,0.34)"
      }
    : {
        glow: "rgba(90,188,255,0.85)",
        glowSoft: "rgba(96,198,255,0.45)",
        border: "rgba(255,255,255,0.35)",
        core: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(126,208,255,0.55) 20%, rgba(76,164,255,0.45) 40%, rgba(42,112,224,0.35) 62%, rgba(10,30,80,0.5) 82%, rgba(10,18,28,0) 88%)",
        halo: "radial-gradient(circle, rgba(95,190,255,0.45) 0%, rgba(65,145,255,0.25) 30%, rgba(40,110,220,0.18) 50%, rgba(10,30,80,0.05) 70%, rgba(10,30,80,0) 78%)",
        ring: "border-cyan-100/35",
        dust: "bg-white",
        dustShadow: "0 0 10px rgba(186,236,255,0.9)",
        innerRing: "rgba(255,255,255,0.25)",
        coreRing: "rgba(186,236,255,0.35)"
      };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${docked ? 'w-[72px] h-[72px] bg-transparent' : 'w-full h-full min-h-[320px] pt-4'}`}>
      {!docked && (
        <motion.div
          className="absolute inset-0"
          animate={{
            backdropFilter: "blur(18px)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        />
      )}

      <motion.div
        className="relative z-10 flex items-center justify-center"
      >
        <motion.button
          type="button"
          onClick={onClick}
          aria-label="Toggle voice assistant"
          className={`relative flex items-center justify-center bg-transparent outline-none ${docked ? 'h-[72px] w-[72px]' : 'h-[200px] w-[200px] mt-4'}`}
          whileTap={{ scale: 0.98 }}
          style={{ border: 0, padding: 0 }}
        >
          {/* We scale down the particles and rings if not docked but in a smaller panel context */}
          <div className="absolute inset-0 scale-[0.55] origin-center pointer-events-none">
            {!docked && <OrbitalDust intensity={activeLevel} active={isRed} palette={palette} />}
            {!docked && <OrbitRings intensity={activeLevel} active={isRed} palette={palette} />}
          </div>

          <motion.div
            className="absolute rounded-full"
            animate={{
              scale: outerScale,
              opacity: 0.48 + activeLevel * 0.5,
              borderRadius: [
                "50% 50% 48% 52% / 50% 48% 52% 50%",
                "53% 47% 55% 45% / 47% 53% 45% 55%",
                "48% 52% 46% 54% / 54% 48% 52% 46%",
                "50% 50% 48% 52% / 50% 48% 52% 50%",
              ],
            }}
            transition={{ duration: 0.68, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: haloSize,
              height: haloSize,
              filter: "blur(18px)",
              background: palette.halo,
            }}
          />

          <motion.div
            className="absolute"
            animate={{
              scale: outerScale,
              rotate: [0, 4.5, 0, -3.2, 0],
              borderRadius: [
                "50% 50% 47% 53% / 51% 46% 54% 49%",
                "54% 46% 52% 48% / 47% 53% 45% 55%",
                "48% 52% 46% 54% / 54% 48% 52% 46%",
                "50% 50% 47% 53% / 51% 46% 54% 49%",
              ],
            }}
            transition={{ duration: 0.54, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: orbSize,
              height: orbSize,
              transform: `scaleX(${squishX}) scaleY(${squishY})`,
              background: palette.core,
              boxShadow: `0 0 ${docked ? 12 : 96 + activeLevel * 60}px ${palette.glow}, inset 0 0 ${42 + activeLevel * 18}px rgba(255,255,255,0.34)`,
            }}
          />

          <motion.div
            className="absolute border bg-white/10 backdrop-blur-xl"
            animate={{
              scale: innerScale,
              rotate: [0, 3 + activeLevel * 5.5, 0, -3 - activeLevel * 5.5, 0],
              borderRadius: [
                "50% 50% 49% 51% / 49% 52% 48% 51%",
                "52% 48% 54% 46% / 47% 53% 45% 55%",
                "48% 52% 46% 54% / 54% 48% 52% 46%",
                "50% 50% 49% 51% / 49% 52% 48% 51%",
              ],
            }}
            transition={{ duration: 0.48, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: shellSize,
              height: shellSize,
              borderColor: palette.border,
              boxShadow: docked ? 'none' : `inset 0 0 ${34 + activeLevel * 20}px rgba(255,255,255,0.18), 0 0 ${72 + activeLevel * 30}px ${palette.glowSoft}`,
            }}
          >
            <motion.div
              className="absolute inset-[10%]"
              animate={{
                opacity: 0.14 + activeLevel * 0.22,
                scale: 1 + activeLevel * 0.08,
                borderRadius: ["50%", "48% 52% 50% 50% / 52% 48% 52% 48%", "50%"],
              }}
              transition={{ duration: 0.46, repeat: Infinity, ease: "easeInOut" }}
              style={{ border: `1px solid ${palette.innerRing}` }}
            />

            <motion.div
              className="absolute inset-[18%]"
              animate={{
                opacity: 0.18 + activeLevel * 0.5,
                scale: 1 + activeLevel * 0.08,
                borderRadius: ["50%", "52% 48% 54% 46% / 46% 54% 46% 54%", "50%"],
              }}
              transition={{ duration: 0.44, repeat: Infinity, ease: "easeInOut" }}
              style={{ border: `1px solid ${palette.coreRing}` }}
            />

            <motion.div
              className="absolute left-[30%] top-[24%] h-[26%] w-[22%] rounded-full bg-white/34 blur-2xl"
              animate={{
                opacity: 0.18 + activeLevel * 0.24,
                scale: 1 + activeLevel * 0.22,
                x: [0, 6, -3, 0],
                y: [0, -4, 3, 0],
              }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.button>
      </motion.div>

      {!supported && <div className="hidden" aria-hidden="true" />}
    </div>
  );
}
