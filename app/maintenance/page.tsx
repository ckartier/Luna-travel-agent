'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function MaintenancePage() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
            style={{ background: '#0B1220' }}
        >
            {/* ═══ ANIMATED BACKGROUND — floating capsules ═══ */}
            <style>{`
        @keyframes floatCapsule1 {
          0%, 100% { transform: translateY(0) rotate(-12deg) scale(1); }
          50% { transform: translateY(-40px) rotate(-8deg) scale(1.03); }
        }
        @keyframes floatCapsule2 {
          0%, 100% { transform: translateY(0) rotate(8deg) scale(1); }
          50% { transform: translateY(-55px) rotate(12deg) scale(0.97); }
        }
        @keyframes floatCapsule3 {
          0%, 100% { transform: translateY(0) rotate(3deg) scale(1); }
          50% { transform: translateY(-30px) rotate(-3deg) scale(1.02); }
        }
        @keyframes shimmerBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes orbitDot {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
      `}</style>

            {/* Gradient shimmer overlay */}
            <div className="absolute inset-0 opacity-30"
                style={{
                    background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 25%, #0f1d35 50%, #1e3a5f 75%, #0B1220 100%)',
                    backgroundSize: '400% 400%',
                    animation: 'shimmerBg 15s ease infinite'
                }}
            />

            {/* Floating capsule shapes — background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Capsule 1 — top left */}
                <div className="absolute -top-20 -left-16 w-[200px] h-[380px] rounded-[100px] border border-white/[0.04] bg-white/[0.02]"
                    style={{ animation: 'floatCapsule1 18s ease-in-out infinite' }} />

                {/* Capsule 2 — top right */}
                <div className="absolute top-10 -right-10 w-[160px] h-[300px] rounded-[80px] border border-sky-400/[0.06] bg-sky-400/[0.02]"
                    style={{ animation: 'floatCapsule2 22s ease-in-out infinite' }} />

                {/* Capsule 3 — bottom center */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[280px] h-[450px] rounded-[140px] border border-white/[0.03] bg-white/[0.01]"
                    style={{ animation: 'floatCapsule3 20s ease-in-out infinite' }} />

                {/* Capsule 4 — bottom left */}
                <div className="absolute bottom-20 -left-20 w-[130px] h-[250px] rounded-[65px] border border-sky-300/[0.05] bg-sky-300/[0.01]"
                    style={{ animation: 'floatCapsule2 25s ease-in-out infinite', animationDelay: '3s' }} />

                {/* Capsule 5 — right center */}
                <div className="absolute top-1/3 -right-24 w-[180px] h-[340px] rounded-[90px] border border-white/[0.03] bg-white/[0.015]"
                    style={{ animation: 'floatCapsule1 20s ease-in-out infinite', animationDelay: '5s' }} />
            </div>

            {/* Pulsing glow circle behind content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
                    animation: 'pulseGlow 6s ease-in-out infinite'
                }}
            />

            {/* ═══ MAIN CENTER CONTENT ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
            >
                {/* LUNA Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="mb-10"
                >
                    <img src="/luna-logo-blue.svg" alt="LUNA" className="h-14 w-auto opacity-80"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Fallback if no white logo */}
                    <h1 className="text-4xl font-bold tracking-tight text-white hidden">LUNA</h1>
                </motion.div>

                {/* Orbiting dots around a center point */}
                <div className="relative w-28 h-28 mb-10">
                    {/* Center static dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)]" />

                    {/* Orbiting dot 1 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ animation: 'orbitDot 8s linear infinite' }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                    </div>

                    {/* Orbiting dot 2 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ animation: 'orbitDot 8s linear infinite', animationDelay: '-2.67s' }}>
                        <div className="w-2 h-2 rounded-full bg-sky-300/40" />
                    </div>

                    {/* Orbiting dot 3 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ animation: 'orbitDot 8s linear infinite', animationDelay: '-5.33s' }}>
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>

                    {/* Faint ring */}
                    <div className="absolute inset-0 rounded-full border border-white/[0.06]"
                        style={{ margin: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)' }} />
                </div>

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
                    style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                >
                    Maintenance en cours
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-white/40 text-base md:text-lg font-normal leading-relaxed mb-2"
                >
                    Nous améliorons votre expérience Luna.
                    <br />
                    Notre équipe déploie de nouvelles fonctionnalités{dots}
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/25 text-sm font-normal mt-4"
                >
                    Nous serons de retour très bientôt. Merci de votre patience.
                </motion.p>

                {/* Progress bar */}
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="w-48 h-1 bg-white/[0.06] rounded-full mt-8 overflow-hidden origin-left"
                >
                    <div className="h-full w-1/3 bg-gradient-to-r from-sky-400 to-sky-300 rounded-full"
                        style={{ animation: 'shimmerBg 3s ease infinite', backgroundSize: '200% 100%' }}
                    />
                </motion.div>

                {/* Contact link */}
                <motion.a
                    href="mailto:lunacconciergerie@gmail.com"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="mt-8 text-sm text-sky-400/60 hover:text-sky-400 transition-colors font-normal"
                >
                    Besoin d'aide ? Contactez-nous →
                </motion.a>
            </motion.div>

            {/* ═══ BOTTOM FOOTER ═══ */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[11px] text-white/15 font-normal tracking-wider uppercase">
                    © 2026 Luna — Concierge Voyage
                </p>
            </div>
        </div>
    );
}
