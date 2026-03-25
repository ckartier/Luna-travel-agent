'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, animate, useMotionValueEvent, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Scale, ArrowRight, ExternalLink, Code2, Volume2, VolumeX } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Loading Screen — Real Bear Logo + Animated Reveal
   ═══════════════════════════════════════════════════════ */
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const duration = 3200;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const p = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setProgress(eased * 100);
            if (p < 1) requestAnimationFrame(tick);
            else setTimeout(onComplete, 400);
        };
        requestAnimationFrame(tick);
        // Trigger reveal after a short delay
        setTimeout(() => setRevealed(true), 200);
    }, [onComplete]);

    return (
        <motion.div
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center"
        >
            {/* Bear Logo with animated reveal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 relative"
            >
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
                    className="relative"
                >
                    {/* The real bear logo with clip-path reveal */}
                    <div className="relative w-[120px] h-[170px] overflow-visible">
                        {/* Progressive reveal mask — circle expanding from center */}
                        <motion.div
                            initial={{ clipPath: 'circle(0% at 50% 45%)' }}
                            animate={revealed ? { clipPath: 'circle(75% at 50% 45%)' } : {}}
                            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full h-full"
                        >
                            <img
                                src="/Logo ours agence.png"
                                alt="Datarnivore"
                                width={120}
                                height={170}
                                className="object-contain"
                            />
                        </motion.div>

                        {/* Ambient particles floating around the bear */}
                        {Array.from({ length: 8 }).map((_, i) => {
                            const angle = (i / 8) * Math.PI * 2;
                            const radius = 65 + Math.random() * 20;
                            const x = 60 + Math.cos(angle) * radius;
                            const y = 85 + Math.sin(angle) * radius;
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                        width: 3 + Math.random() * 3,
                                        height: 3 + Math.random() * 3,
                                        left: x,
                                        top: y,
                                        background: ['#a8d0df', '#e2c8a0', '#d4a0a0', '#b8c9b8'][i % 4],
                                    }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 0.5, 0],
                                        scale: [0, 1, 0],
                                        y: [0, -15 - Math.random() * 15],
                                    }}
                                    transition={{
                                        duration: 2.5 + Math.random() * 2,
                                        delay: 1.5 + i * 0.25,
                                        repeat: Infinity,
                                        ease: 'easeOut',
                                    }}
                                />
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-[20px] text-[#3a3a3a]/25 font-light tracking-wide mb-6"
            >
                Datar<span className="font-semibold text-[#3a3a3a]/40">Nivore</span>
            </motion.p>

            {/* Progress Bar */}
            <div className="w-[200px] h-[2px] bg-[#3a3a3a]/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #a8d0df 0%, #e2c8a0 50%, #d4a0a0 100%)',
                    }}
                />
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[9px] text-[#3a3a3a]/15 mt-3 font-mono tracking-wider"
            >
                {Math.round(progress)}%
            </motion.p>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════════════════ */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const count = useMotionValue(0);
    const display = useTransform(count, (v) => Math.round(v));

    useEffect(() => {
        if (isInView) animate(count, value, { duration: 2.2, ease: [0.16, 1, 0.3, 1] });
    }, [isInView, value, count]);

    useEffect(() => {
        const u = display.on('change', (v) => { if (ref.current) ref.current.textContent = `${v}${suffix}`; });
        return u;
    }, [display, suffix]);

    return <span ref={ref}>0{suffix}</span>;
}

const TERMINAL_LINES = [
    { prompt: '~', text: 'datarnivore init --production', delay: 0 },
    { prompt: '', text: '⚡ Chargement des modules...', delay: 600, dim: true },
    { prompt: '', text: '', delay: 200 },
    { prompt: '✓', text: 'SaaS platforms', delay: 300, green: true },
    { prompt: '✓', text: 'CRM intelligents', delay: 200, green: true },
    { prompt: '✓', text: 'Applications sur mesure', delay: 200, green: true },
    { prompt: '✓', text: 'Agents IA déployés', delay: 200, green: true },
    { prompt: '✓', text: 'Hébergement & monitoring', delay: 200, green: true },
    { prompt: '', text: '', delay: 300 },
    { prompt: '>', text: 'On conçoit vos solutions de A à Z', delay: 400 },
    { prompt: '', text: '🚀 Ready. 3 produits live.', delay: 500, accent: true },
];

function TerminalPrompt({ onComplete }: { onComplete?: () => void }) {
    const [visibleLines, setVisibleLines] = useState(0);
    const [typedChars, setTypedChars] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const c = setInterval(() => setShowCursor(v => !v), 530);
        return () => clearInterval(c);
    }, []);

    useEffect(() => {
        if (visibleLines >= TERMINAL_LINES.length) {
            const t = setTimeout(() => onComplete?.(), 800);
            return () => clearTimeout(t);
        }

        const line = TERMINAL_LINES[visibleLines];
        const fullText = line.text;

        if (typedChars < fullText.length) {
            const speed = line.dim || line.green || line.accent ? 15 : 45;
            const t = setTimeout(() => setTypedChars(c => c + 1), speed);
            return () => clearTimeout(t);
        }

        const nextDelay = TERMINAL_LINES[visibleLines + 1]?.delay ?? 500;
        const t = setTimeout(() => {
            setVisibleLines(v => v + 1);
            setTypedChars(0);
        }, nextDelay);
        return () => clearTimeout(t);
    }, [visibleLines, typedChars, onComplete]);

    return (
        <div className="font-mono text-[14px] leading-[1.8] text-left">
            {TERMINAL_LINES.slice(0, visibleLines + 1).map((line, i) => {
                const isCurrentLine = i === visibleLines;
                const text = isCurrentLine ? line.text.substring(0, typedChars) : line.text;
                const promptColor = line.green ? 'text-emerald-400' : 'text-white/60';
                const textColor = line.dim ? 'text-white/50' : line.green ? 'text-white/90' : 'text-white';

                if (!line.prompt && !line.text) return <div key={i} className="h-2" />;

                return (
                    <div key={i} className="whitespace-nowrap">
                        {line.prompt && <span className={promptColor}>{line.prompt} </span>}
                        <span className={textColor}>{text}</span>
                        {isCurrentLine && visibleLines < TERMINAL_LINES.length && (
                            <span className={`${showCursor ? 'opacity-70' : 'opacity-0'} text-white transition-opacity duration-100`}>▌</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Typewriter Title — Shows after terminal completes
   ═══════════════════════════════════════════════════════ */
const TITLE_WORDS = ['SaaS', 'CRM', 'Apps', 'IA', 'Web'];

function TypewriterTitle() {
    const [wordIdx, setWordIdx] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const c = setInterval(() => setShowCursor(v => !v), 530);
        return () => clearInterval(c);
    }, []);

    useEffect(() => {
        const word = TITLE_WORDS[wordIdx];
        const speed = isDeleting ? 50 : 100;

        if (!isDeleting && displayed === word) {
            const t = setTimeout(() => setIsDeleting(true), 1600);
            return () => clearTimeout(t);
        }
        if (isDeleting && displayed === '') {
            setIsDeleting(false);
            setWordIdx((wordIdx + 1) % TITLE_WORDS.length);
            return;
        }

        const t = setTimeout(() => {
            setDisplayed(isDeleting
                ? word.substring(0, displayed.length - 1)
                : word.substring(0, displayed.length + 1)
            );
        }, speed);
        return () => clearTimeout(t);
    }, [displayed, isDeleting, wordIdx]);

    return (
        <div className="text-center">
            <h2 className="font-mono text-[42px] md:text-[56px] font-light text-white leading-[1.1] tracking-tight">
                On conçoit vos{' '}
                <span className="text-white font-medium">
                    {displayed}
                    <span className={`${showCursor ? 'opacity-70' : 'opacity-0'} transition-opacity duration-100`}>▌</span>
                </span>
                <br />
                de A à Z
            </h2>
            <p className="font-mono text-[13px] text-white/50 mt-4">
                Plateformes SaaS · CRM intelligents · Applications sur mesure
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Products
   ═══════════════════════════════════════════════════════ */
const PRODUCTS = [
    {
        id: 'travel', name: 'Luna Travel', tagline: 'sys.concierge_voyage',
        desc: '>> CRM IA optimisé pour les agences de voyage. Intégration pipeline B2B et génération d\'itinéraires.',
        loginHref: '/crm/luna?vertical=travel', crmHref: '/crm/luna?vertical=travel',
        accentColor: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400/50',
        glowColor: 'rgba(16,185,129,0.15)', borderGlow: 'rgba(16,185,129,0.4)',
        features: ['[OK] Agents_IA_Voyage', '[OK] Pipeline_B2B', '[OK] Routing_J/J'],
    },
    {
        id: 'legal', name: 'Le Droit Agent', tagline: 'sys.ia_juridique',
        desc: '>> CRM Avocats. Analyse NLP performante de dossiers et base de jurisprudence temps réel.',
        loginHref: '/crm/avocat?vertical=legal', crmHref: '/crm/avocat?vertical=legal',
        accentColor: 'text-amber-400', hoverBorder: 'hover:border-amber-400/50',
        glowColor: 'rgba(245,158,11,0.15)', borderGlow: 'rgba(245,158,11,0.4)',
        features: ['[OK] Analyse_Dossiers', '[OK] Jurisprudence_RT', '[OK] Auth_Secret_Pro'],
    },
    {
        id: 'monum', name: 'Monum', tagline: 'sys.renov_tracker',
        desc: '>> CRM chantiers : suivi opérationnel, planning, budget et coordination équipe.',
        loginHref: '/crm/monum?vertical=monum', crmHref: '/crm/monum?vertical=monum',
        accentColor: 'text-fuchsia-400', hoverBorder: 'hover:border-fuchsia-400/50',
        glowColor: 'rgba(232,121,249,0.15)', borderGlow: 'rgba(232,121,249,0.4)',
        features: ['[OK] Planning_Chantier', '[OK] Budget_Tracker', '[OK] Coordination_Equipe'],
    },
];

/* ═══════════════════════════════════════════════════════
   Feature Type-In — types each feature line like a terminal
   ═══════════════════════════════════════════════════════ */
function FeatureTypein({ text, delay }: { text: string; delay: number }) {
    const [displayed, setDisplayed] = useState('');
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!isInView) return;
        const t = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(t);
    }, [isInView, delay]);

    useEffect(() => {
        if (!started) return;
        if (displayed.length >= text.length) return;
        const t = setTimeout(() => {
            setDisplayed(text.substring(0, displayed.length + 1));
        }, 30);
        return () => clearTimeout(t);
    }, [started, displayed, text]);

    return (
        <div ref={ref} className="flex items-center gap-2 min-h-[20px]">
            <span className="font-mono text-[11px] text-white/60">
                {displayed}
                {started && displayed.length < text.length && (
                    <span className="animate-pulse text-white/40">▌</span>
                )}
            </span>
        </div>
    );
}

const STATS = [
    { value: 3, suffix: '+', label: 'Produits' },
    { value: 15, suffix: '+', label: 'Agents IA' },
    { value: 99, suffix: '%', label: 'Uptime' },
    { value: 24, suffix: '/7', label: 'Support' },
];

/* ═══════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════ */
export default function HubPage() {
    const [loading, setLoading] = useState(true);
    const [contentReady, setContentReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [terminalDone, setTerminalDone] = useState(false);
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [videoSrc, setVideoSrc] = useState('/Platforms_random_up_down_movement_delpmaspu_.mp4');
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: containerRef });
    
    // Smooth scroll progress to avoid jittery video scrubbing
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.001
    });

    // Parallax transforms (now using smoothed progress)
    // Removed Y translation, applying only a mild zoom over the entire page scroll
    const heroY = useTransform(smoothProgress, [0, 1], ['0%', '0%']);
    const contentOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
    const productsY = useTransform(smoothProgress, [0.25, 0.5], ['60px', '0px']);

    // Scrub video based on smoothed scroll progress with hardware sync
    // Removed scrubbing logic because video seeking is inherently choppy on compressed web video.
    // We will use pure Autoplay + Smooth Parallax instead.

    // Randomize video on mount
    useEffect(() => {
        const videos = [
            '/Platforms_random_up_down_movement_delpmaspu_.mp4',
            '/The_bear_walks_4c936ce790.mp4'
        ];
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        setVideoSrc(randomVideo);
    }, []);

    // Start video only AFTER loading screen has fully exited
    useEffect(() => {
        if (!contentReady) return;
        const video = videoRef.current;
        if (!video) return;
        const t = setTimeout(() => {
            video.load(); // Ensure new src is loaded
            video.play().catch(() => {});
        }, 300);
        return () => clearTimeout(t);
    }, [contentReady, videoSrc]);

    // Auto-unmute on first user interaction
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const unmute = () => {
            if (video.muted) {
                video.muted = false;
                setIsMuted(false);
            }
            ['click', 'scroll', 'touchstart', 'keydown'].forEach(e =>
                window.removeEventListener(e, unmute)
            );
        };
        ['click', 'scroll', 'touchstart', 'keydown'].forEach(e =>
            window.addEventListener(e, unmute, { once: true })
        );

        return () => {
            ['click', 'scroll', 'touchstart', 'keydown'].forEach(e =>
                window.removeEventListener(e, unmute)
            );
        };
    }, [loading]);

    const toggleSound = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLoadingComplete = () => setLoading(false);

    return (
        <>
            <AnimatePresence mode="wait" onExitComplete={() => setContentReady(true)}>
                {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
            </AnimatePresence>

            <div ref={containerRef} className="min-h-[200vh] bg-transparent overflow-x-hidden">

                {/* ═══ HERO — Sticky with Parallax ═══ */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={contentReady ? { opacity: 1 } : {}}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="relative h-screen flex items-center justify-center overflow-hidden sticky top-0 z-0"
                >

                    {/* Video Background — Autoplay + Scale after end */}
                    <motion.div 
                        className="fixed inset-0 z-[-1] will-change-transform"
                        style={{ y: heroY }}
                        animate={{ scale: isVideoEnded ? 1.05 : 1 }}
                        transition={{ duration: 15, ease: 'easeOut' }}
                    >
                        <video
                            key={videoSrc} // Force re-render on random selection
                            ref={videoRef}
                            muted
                            playsInline
                            loop
                            className="absolute inset-0 w-full h-full object-cover brightness-[1.15]"
                        >
                            <source src={videoSrc} type="video/mp4" />
                            <source src="/hero-bg.webm" type="video/webm" />
                        </video>
                        {/* Subtle dark overlay for contrast — fades in when loading ends */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={contentReady ? { opacity: 1 } : {}}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute inset-0 bg-black/30"
                        />
                    </motion.div>

                    {/* ── Header ── */}
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={contentReady ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-0 left-0 right-0 z-20 py-8 px-8"
                    >
                        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/Logo ours agence blanc.png" alt="Datarnivore" width={46} height={46} className="object-contain drop-shadow-md" />
                                <span className="text-[20px] text-white font-light tracking-wide">
                                    Datar<span className="font-semibold">Nivore</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[8px] font-medium text-white/50 uppercase tracking-[0.15em]">Online</span>
                            </div>
                        </div>
                    </motion.header>

                    {/* ── Hero Content: Terminal → Title ── */}
                    <motion.div style={{ opacity: contentOpacity }} className="relative z-10 text-center px-6">
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={contentReady ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-[9px] uppercase tracking-[0.4em] text-white font-medium mb-8"
                        >
                            Studio de création digitale
                        </motion.p>

                        <AnimatePresence mode="wait">
                            {!terminalDone ? (
                                <motion.div
                                    key="terminal"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={contentReady ? { opacity: 1, y: 0 } : {}}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: 1.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <TerminalPrompt onComplete={() => setTerminalDone(true)} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="title"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <TypewriterTitle />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Scroll line */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={contentReady ? { opacity: 1 } : {}}
                        transition={{ delay: 3 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
                    >
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent"
                        />
                    </motion.div>

                    {/* Sound Toggle */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={contentReady ? { opacity: 1 } : {}}
                        transition={{ delay: 1.5 }}
                        onClick={toggleSound}
                        className="absolute bottom-8 right-8 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                    >
                        {isMuted ? <VolumeX size={16} className="text-white/60" /> : <Volume2 size={16} className="text-white/80" />}
                    </motion.button>
                </motion.section>

                {/* ═══ PRODUCTS — Parallax rise-up ═══ */}
                <motion.section
                    style={{ y: productsY }}
                    className="relative z-10 -mt-[1px] pb-24 px-6 pt-12"
                >
                    <div className="max-w-[1000px] mx-auto">

                        {/* Stats - Glassmorphism Cards with Glow */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 mb-20 flex-wrap">
                            {STATS.map((s, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: i * 0.12, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative px-6 py-5 text-center min-w-[140px] will-change-transform rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] overflow-hidden group"
                                >
                                    {/* Glow pulse on entry */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: [0, 0.6, 0] }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.12 + 0.3, duration: 1.5 }}
                                        className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl"
                                    />
                                    <p className="font-mono text-[28px] text-white relative z-10">
                                        <Counter value={s.value} suffix={s.suffix} />
                                    </p>
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 mt-1 relative z-10">sys.{s.label.toLowerCase()}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Title - Terminal Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center mb-20 will-change-transform"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="inline-flex items-center gap-3 mb-6"
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">root@luna:~/ecosystem</p>
                            </motion.div>
                            <h2 className="font-mono text-[24px] md:text-[32px] font-light text-white tracking-tight">
                                {'>'} ls -la ./products
                            </h2>
                        </motion.div>

                        {/* Cards - Glassmorphism + Terminal UI + Glow Borders */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {PRODUCTS.map((p, i) => {
                                const isExt = 'isExternal' in p && p.isExternal;
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 80, scale: 0.95 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ delay: i * 0.2, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                                        whileHover={{ y: -4, transition: { duration: 0.3 } }}
                                        className="group relative flex flex-col gap-6 will-change-transform rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] p-6 overflow-hidden cursor-pointer"
                                    >
                                        {/* Border glow pulse on entry */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: [0, 1, 0] }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.2 + 0.5, duration: 2, ease: 'easeOut' }}
                                            className="absolute inset-0 rounded-2xl pointer-events-none"
                                            style={{ boxShadow: `inset 0 0 30px ${p.glowColor}, 0 0 40px ${p.glowColor}` }}
                                        />
                                        {/* Hover glow */}
                                        <div
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                            style={{ boxShadow: `inset 0 0 20px ${p.glowColor}, 0 0 30px ${p.glowColor}` }}
                                        />

                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -10 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: i * 0.2 + 0.3 }}
                                                        className={`font-mono ${p.accentColor}`}
                                                    >
                                                        {'>'}_
                                                    </motion.span>
                                                    <h3 className="font-mono text-[16px] text-white tracking-tight">{p.name}</h3>
                                                </div>
                                            </div>
                                            <p className={`font-mono text-[10px] uppercase tracking-[0.1em] ${p.accentColor} mb-3`}>[{p.tagline}]</p>
                                            <p className="font-mono text-[12px] text-white/50 leading-relaxed min-h-[60px]">{p.desc}</p>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex flex-col gap-2 mb-8">
                                                {p.features.map((f, j) => (
                                                    <FeatureTypein
                                                        key={j}
                                                        text={f}
                                                        delay={i * 200 + j * 400 + 800}
                                                    />
                                                ))}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    whileInView={{ opacity: 1 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.2 + 2 }}
                                                    className="animate-pulse font-mono text-[11px] text-white/30 mt-1"
                                                >
                                                    ...
                                                </motion.div>
                                            </div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.2 + 1.5, duration: 0.6 }}
                                                className="flex flex-wrap gap-4"
                                            >
                                                {isExt ? (
                                                    <a href={p.loginHref} target="_blank" rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 ${p.accentColor} hover:text-white font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                        <ExternalLink size={12} /> INIT_CONNECT
                                                    </a>
                                                ) : (
                                                    <>
                                                        <Link href={p.loginHref}
                                                            className={`flex items-center gap-2 ${p.accentColor} hover:text-white font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                            <ExternalLink size={12} /> LOGIN
                                                        </Link>
                                                        <span className="text-white/20">|</span>
                                                        <Link href={p.crmHref}
                                                            className={`flex items-center gap-2 ${p.accentColor} hover:text-white font-mono text-[10px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                            <ArrowRight size={12} /> ENTER_CRM
                                                        </Link>
                                                    </>
                                                )}
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                {/* ═══ FOOTER ═══ */}
                <footer className="relative z-10 py-8 text-center mt-12">
                    <div className="flex items-center justify-center gap-2">
                        <Image src="/Logo ours agence.png" alt="" width={14} height={14} className="object-contain opacity-15" />
                        <span className="text-[9px] text-[#3a3a3a]/15">datarnivore © 2026</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
