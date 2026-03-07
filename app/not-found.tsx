'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function NotFound() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/landing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
            style={{ background: '#0B1220' }}
        >
            {/* Floating capsules */}
            <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
      `}</style>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -left-16 w-[200px] h-[380px] rounded-[100px] border border-white/[0.04] bg-white/[0.015]"
                    style={{ animation: 'floatSlow 18s ease-in-out infinite' }} />
                <div className="absolute bottom-10 -right-12 w-[160px] h-[300px] rounded-[80px] border border-sky-400/[0.05] bg-sky-400/[0.01]"
                    style={{ animation: 'floatSlow 22s ease-in-out infinite', animationDelay: '4s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center text-center px-6"
            >
                {/* 404 Capsule */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="relative w-[200px] h-[320px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-10"
                    style={{ borderRadius: '100px' }}
                >
                    {/* Pin dot */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[45%] w-5 h-5 rounded-full bg-sky-400/20 border-4 border-[#0B1220] shadow-sm" />

                    <span className="text-7xl font-bold text-white/10" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                        404
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3"
                    style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                >
                    Page introuvable
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/40 text-base font-normal mb-6 max-w-sm"
                >
                    Cette page n'existe pas ou a été déplacée.<br />
                    Redirection automatique dans <span className="text-sky-400 font-medium">{countdown}s</span>
                </motion.p>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    onClick={() => router.push('/landing')}
                    className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-sm font-medium rounded-full transition-all hover:-translate-y-0.5"
                >
                    Retour à l'accueil →
                </motion.button>
            </motion.div>

            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[11px] text-white/15 font-normal tracking-wider uppercase">
                    © 2026 Luna — Concierge Voyage
                </p>
            </div>
        </div>
    );
}
