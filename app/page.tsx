'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, ArrowRight, Sparkles, Star } from 'lucide-react';
import { CapsuleBackground } from '@/app/components/CapsuleBackground';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/src/hooks/useTranslation';

export default function AgentHubPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<'voyage' | 'prestation' | null>(null);
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-white font-sans">
      {/* Background dynamique évoluant entre les dimensions */}
      <CapsuleBackground colorScheme={hovered === 'prestation' ? 'orange' : hovered === 'voyage' ? 'blue' : 'blue'} />

      {/* Profondeur et Immersion */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none z-10" />

      <div className="relative z-20 w-full max-w-5xl px-6 flex flex-col items-center">

        {/* ═══ GREETING TEXT ═══ */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl md:text-5xl font-light text-luna-charcoal tracking-tight text-center mb-20 md:mb-28"
          style={{ fontFamily: "'Outfit', 'Helvetica Neue', sans-serif" }}
        >
          {t('hub.greeting')}
        </motion.h1>

        {/* Main Experience Selector */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-24 md:gap-40 w-full">

          {/* VOYAGE DIMENSION */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onMouseEnter={() => setHovered('voyage')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push('/voyage-agent')}
          >
            <div className="relative w-40 h-64 md:w-48 md:h-72 mb-10 transition-transform duration-700 group-hover:scale-105 active:scale-95">
              <motion.div
                animate={hovered === 'voyage' ? { y: [-15, 15, -15], rotate: [-5, 5, -5] } : { y: 0 }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-full h-full bg-[#3B82F6] rounded-[80px] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)] relative z-20"
              >
                <Bot size={64} className="text-white opacity-90" strokeWidth={1} />
                <AnimatePresence>
                  {hovered === 'voyage' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl"
                    >
                      <Sparkles size={24} className="text-sky-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
            </div>

            <h2 className={`text-4xl font-light tracking-tight transition-all duration-700 uppercase ${hovered === 'voyage' ? 'text-blue-600 scale-110' : 'text-gray-300'}`}>
              {t('hub.voyage')}
            </h2>
          </div>

          {/* PRESTATION DIMENSION */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onMouseEnter={() => setHovered('prestation')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => router.push('/prestations-agent')}
          >
            <div className="relative w-40 h-64 md:w-48 md:h-72 mb-10 transition-transform duration-700 group-hover:scale-105 active:scale-95">
              <motion.div
                animate={hovered === 'prestation' ? { y: [15, -15, 15], rotate: [5, -5, 5] } : { y: 0 }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-full h-full bg-[#F59E0B] rounded-[80px] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(245,158,11,0.3)] relative z-20"
              >
                <Zap size={64} className="text-white opacity-90" strokeWidth={1} />
                <AnimatePresence>
                  {hovered === 'prestation' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-6 -left-6 bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl"
                    >
                      <Star size={24} className="text-amber-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute inset-0 bg-orange-500 blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
            </div>

            <h2 className={`text-4xl font-light tracking-tight transition-all duration-700 uppercase ${hovered === 'prestation' ? 'text-orange-600 scale-110' : 'text-gray-300'}`}>
              {t('hub.prestations')}
            </h2>
          </div>

        </div>

        {/* Minimalist CTA hints */}
        <div className="mt-32 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-medium mb-4">{t('hub.footer')}</p>
          <div className="w-px h-12 bg-gradient-to-b from-gray-200 to-transparent" />
        </div>
      </div>
    </div>
  );
}
