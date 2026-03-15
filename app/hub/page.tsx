'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useInView, animate } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, Scale, ArrowRight, ExternalLink, Code2, Volume2, VolumeX } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   i18n — Auto FR/EN based on browser locale
   ═══════════════════════════════════════════════════════ */
type Locale = 'fr' | 'en';

const T = {
    loadingModules:  { fr: '⚡ Chargement des modules...', en: '⚡ Loading modules...' },
    saasPlat:        { fr: 'SaaS platforms', en: 'SaaS platforms' },
    crmIntel:        { fr: 'CRM intelligents', en: 'Smart CRMs' },
    customApps:      { fr: 'Applications sur mesure', en: 'Custom applications' },
    iaAgents:        { fr: 'Agents IA déployés', en: 'AI agents deployed' },
    hosting:         { fr: 'Hébergement & monitoring', en: 'Hosting & monitoring' },
    weDesign:        { fr: 'On conçoit vos solutions de A à Z', en: 'We design your solutions from A to Z' },
    ready:           { fr: '🚀 Ready. 3 produits live.', en: '🚀 Ready. 3 products live.' },
    studio:          { fr: 'Studio de création digitale', en: 'Digital design studio' },
    titlePre:        { fr: 'On conçoit vos', en: 'We build your' },
    titlePost:       { fr: 'de A à Z', en: 'from A to Z' },
    subtitle:        { fr: 'Plateformes SaaS · CRM intelligents · Applications sur mesure', en: 'SaaS platforms · Smart CRMs · Custom applications' },
    demoLabel:       { fr: '// 4 verticales CRM — démos live', en: '// 4 CRM verticals — live demos' },
    demo1:           { fr: '[01] Travel   → Conciergerie de voyage, pipeline, itinéraires IA', en: '[01] Travel   → Travel concierge, pipeline, AI itineraries' },
    demo2:           { fr: '[02] Legal    → Cabinet d\u2019avocats, analyse dossiers, jurisprudence', en: '[02] Legal    → Law firm, case analysis, case law' },
    demo3:           { fr: '[03] Events   → \u00c9v\u00e9nementiel, gestion RSVP, planning temps r\u00e9el', en: '[03] Events   → Events, RSVP management, real-time planning' },
    demo4:           { fr: '[04] Property → Immobilier, mandats, visites, portail client', en: '[04] Property → Real estate, listings, visits, client portal' },
    travelDesc:      { fr: '>> CRM IA optimis\u00e9 pour les agences de voyage. Int\u00e9gration pipeline B2B et g\u00e9n\u00e9ration d\'itin\u00e9raires.', en: '>> AI-powered CRM for travel agencies. B2B pipeline integration and itinerary generation.' },
    legalDesc:       { fr: '>> CRM Avocats. Analyse NLP performante de dossiers et base de jurisprudence temps r\u00e9el.', en: '>> Law firm CRM. High-performance NLP case analysis and real-time case law database.' },
    datarnivoreDesc: { fr: '>> Suivi permis de construire, analyse DVF et cartographie des rénovations à Paris.', en: '>> Building permits tracking, DVF analysis and renovation mapping in Paris.' },
} as const;

function useLocale(): Locale {
    const [locale, setLocale] = useState<Locale>('fr');
    useEffect(() => {
        const lang = navigator.language || navigator.languages?.[0] || 'fr';
        setLocale(lang.startsWith('fr') ? 'fr' : 'en');
    }, []);
    return locale;
}

function t(key: keyof typeof T, locale: Locale): string {
    return T[key][locale];
}

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
                            <Image
                                src="/Logo ours agence.png"
                                alt="Datarnivore"
                                width={120}
                                height={170}
                                className="object-contain"
                                priority
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



function getTerminalLines(locale: Locale) {
    return [
        { prompt: '~', text: 'datarnivore init --production', delay: 0 },
        { prompt: '', text: t('loadingModules', locale), delay: 600, dim: true },
        { prompt: '', text: '', delay: 200 },
        { prompt: '✓', text: t('saasPlat', locale), delay: 300, green: true },
        { prompt: '✓', text: t('crmIntel', locale), delay: 200, green: true },
        { prompt: '✓', text: t('customApps', locale), delay: 200, green: true },
        { prompt: '✓', text: t('iaAgents', locale), delay: 200, green: true },
        { prompt: '✓', text: t('hosting', locale), delay: 200, green: true },
        { prompt: '', text: '', delay: 300 },
        { prompt: '>', text: t('weDesign', locale), delay: 400 },
        { prompt: '', text: t('ready', locale), delay: 500, accent: true },
    ];
}

function TerminalPrompt({ onComplete, locale }: { onComplete?: () => void; locale: Locale }) {
    const lines = getTerminalLines(locale);
    const [visibleLines, setVisibleLines] = useState(0);
    const [typedChars, setTypedChars] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const c = setInterval(() => setShowCursor(v => !v), 530);
        return () => clearInterval(c);
    }, []);

    useEffect(() => {
        if (visibleLines >= lines.length) {
            const tt = setTimeout(() => onComplete?.(), 800);
            return () => clearTimeout(tt);
        }

        const line = lines[visibleLines];
        const fullText = line.text;

        if (typedChars < fullText.length) {
            const speed = line.dim || line.green || line.accent ? 15 : 45;
            const t = setTimeout(() => setTypedChars(c => c + 1), speed);
            return () => clearTimeout(t);
        }

        const nextDelay = lines[visibleLines + 1]?.delay ?? 500;
        const t = setTimeout(() => {
            setVisibleLines(v => v + 1);
            setTypedChars(0);
        }, nextDelay);
        return () => clearTimeout(t);
    }, [visibleLines, typedChars, onComplete]);

    return (
        <div className="font-mono text-[14px] leading-[1.8] text-left">
            {lines.slice(0, visibleLines + 1).map((line, i) => {
                const isCurrentLine = i === visibleLines;
                const text = isCurrentLine ? line.text.substring(0, typedChars) : line.text;
                const promptColor = line.green ? 'text-emerald-400' : 'text-white/60';
                const textColor = line.dim ? 'text-white/50' : line.green ? 'text-white/90' : 'text-white';

                if (!line.prompt && !line.text) return <div key={i} className="h-2" />;

                return (
                    <div key={i} className="whitespace-nowrap">
                        {line.prompt && <span className={promptColor}>{line.prompt} </span>}
                        <span className={textColor}>{text}</span>
                        {isCurrentLine && visibleLines < lines.length && (
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

function TypewriterTitle({ locale }: { locale: Locale }) {
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
            const tt = setTimeout(() => setIsDeleting(true), 1600);
            return () => clearTimeout(tt);
        }
        if (isDeleting && displayed === '') {
            setIsDeleting(false);
            setWordIdx((wordIdx + 1) % TITLE_WORDS.length);
            return;
        }

        const tt = setTimeout(() => {
            setDisplayed(isDeleting
                ? word.substring(0, displayed.length - 1)
                : word.substring(0, displayed.length + 1)
            );
        }, speed);
        return () => clearTimeout(tt);
    }, [displayed, isDeleting, wordIdx]);

    return (
        <div className="text-center">
            <h2 className="font-mono text-[42px] md:text-[56px] font-light text-white leading-[1.1] tracking-tight">
                {t('titlePre', locale)}{' '}
                <span className="text-white font-light">
                    {displayed}
                    <span className={`${showCursor ? 'opacity-70' : 'opacity-0'} transition-opacity duration-100`}>▌</span>
                </span>
                <br />
                {t('titlePost', locale)}
            </h2>
            <p className="font-mono text-[13px] text-white/50 mt-4">
                {t('subtitle', locale)}
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Products
   ═══════════════════════════════════════════════════════ */
function getProducts(locale: Locale) {
    return [
        {
            id: 'travel', name: 'Luna Travel', tagline: 'sys.concierge_voyage',
            desc: t('travelDesc', locale),
            loginHref: '/crm/luna', crmHref: '/crm/luna',
            accentColor: 'text-emerald-400', hoverBorder: 'hover:border-emerald-400/50',
            glowColor: 'rgba(16,185,129,0.15)', borderGlow: 'rgba(16,185,129,0.4)',
            features: ['[OK] Agents_IA_Voyage', '[OK] Pipeline_B2B', '[OK] Routing_J/J'],
        },
        {
            id: 'legal', name: 'Le Droit Agent', tagline: 'sys.ia_juridique',
            desc: t('legalDesc', locale),
            loginHref: '/crm/avocat', crmHref: '/crm/avocat',
            accentColor: 'text-amber-400', hoverBorder: 'hover:border-amber-400/50',
            glowColor: 'rgba(245,158,11,0.15)', borderGlow: 'rgba(245,158,11,0.4)',
            features: ['[OK] Analyse_Dossiers', '[OK] Jurisprudence_RT', '[OK] Auth_Secret_Pro'],
        },
        {
            id: 'renovtracker', name: 'Paris RenovTracker', tagline: 'sys.renov_tracker',
            desc: t('datarnivoreDesc', locale),
            loginHref: 'https://datarnivore-renovtracker.web.app', crmHref: 'https://datarnivore-renovtracker.web.app',
            accentColor: 'text-fuchsia-400', hoverBorder: 'hover:border-fuchsia-400/50',
            glowColor: 'rgba(232,121,249,0.15)', borderGlow: 'rgba(232,121,249,0.4)',
            features: ['[OK] DVF_Open_Data', '[OK] Permis_Tracker', '[OK] Analyse_Marché'],
            isExternal: true,
        },
    ];
}

/* ═══════════════════════════════════════════════════════
   Feature Type-In — types each feature line like a terminal
   ═══════════════════════════════════════════════════════ */
function FeatureTypein({ text, delay, ready }: { text: string; delay: number; ready?: boolean }) {
    const [displayed, setDisplayed] = useState('');
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    // Gate: if `ready` prop is provided, wait for it; otherwise fall back to isInView
    const shouldTrigger = ready !== undefined ? ready : isInView;

    useEffect(() => {
        if (!shouldTrigger) return;
        const t = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(t);
    }, [shouldTrigger, delay]);

    useEffect(() => {
        if (!started) return;
        if (displayed.length >= text.length) return;
        const t = setTimeout(() => {
            setDisplayed(text.substring(0, displayed.length + 1));
        }, 25);
        return () => clearTimeout(t);
    }, [started, displayed, text]);

    return (
        <div ref={ref} className="flex items-center gap-2 min-h-[22px]">
            <span className="font-mono text-[11px] text-white/80">
                {displayed}
                {started && displayed.length < text.length && (
                    <span className="animate-pulse text-emerald-400">▌</span>
                )}
                {started && displayed.length >= text.length && (
                    <span className="text-emerald-400/60"> ✓</span>
                )}
            </span>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════
   Hero Videos — randomly picked on each page load
   ═══════════════════════════════════════════════════════ */
const HERO_VIDEOS = [
    { src: '/The_bear_walks_4c936ce790.mp4', poster: '/bear-walk-poster.jpg' },
    { src: '/Platforms_random_up_down_movement_delpmaspu_.mp4', poster: '/platforms-poster.jpg' },
];

/* ═══════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════ */
export default function HubPage() {
    const [loading, setLoading] = useState(true);
    const [contentReady, setContentReady] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [terminalDone, setTerminalDone] = useState(false);
    const [heroShift, setHeroShift] = useState('-10vh');
    const [heroEntry, setHeroEntry] = useState(HERO_VIDEOS[0]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const locale = useLocale();
    const products = getProducts(locale);

    // Pick a random video on each page load (client-side only to avoid hydration mismatch)
    useEffect(() => {
        setHeroEntry(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
    }, []);

    // Responsive hero shift based on viewport
    useEffect(() => {
        const updateShift = () => {
            const w = window.innerWidth;
            if (w < 640) setHeroShift('-20vh');
            else if (w < 1024) setHeroShift('-14vh');
            else setHeroShift('-10vh');
        };
        updateShift();
        window.addEventListener('resize', updateShift);
        return () => window.removeEventListener('resize', updateShift);
    }, []);

    // Scrub video based on smoothed scroll progress with hardware sync
    // Removed scrubbing logic because video seeking is inherently choppy on compressed web video.
    // We will use pure Autoplay + Smooth Parallax instead.

    // Start video only AFTER loading screen has fully exited
    useEffect(() => {
        if (!contentReady) return;
        const video = videoRef.current;
        if (!video) return;
        const t = setTimeout(() => {
            video.play().catch(() => {});
        }, 300);
        return () => clearTimeout(t);
    }, [contentReady]);

    // Mute handling will just toggle the property. No more timeupdate fade.
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

            {/* ═══ Full-screen single viewport ═══ */}
            <div className="h-screen overflow-hidden relative">

                {/* Video Background — Fixed */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={contentReady ? { opacity: 1 } : {}}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0">
                        <video
                            key={heroEntry.src}
                            ref={videoRef}
                            muted
                            playsInline
                            loop
                            className="absolute inset-0 w-full h-full object-cover"
                        >
                            <source src={heroEntry.src} type="video/mp4" />
                        </video>
                    </div>
                </motion.div>

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={contentReady ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-0 right-0 z-20 py-8 px-8"
                >
                    <div className="max-w-[1000px] mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image src="/Logo ours agence blanc.png" alt="Datarnivore" width={46} height={46} className="object-contain drop-shadow-md" />
                            <span className="text-[20px] text-white font-light tracking-wide">
                                Datar<span className="font-semibold">Nivore</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[8px] font-medium text-white/50 uppercase tracking-[0.15em]">Online</span>
                            </div>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={contentReady ? { opacity: 1 } : {}}
                                transition={{ delay: 1.5 }}
                                onClick={toggleSound}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                            >
                                {isMuted ? <VolumeX size={16} className="text-white/60" /> : <Volume2 size={16} className="text-white/80" />}
                            </motion.button>
                        </div>
                    </div>
                </motion.header>

                {/* Hero Content — all 3 blocks in a single flex column with equal spacing */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={contentReady ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-[80px] pb-6 px-4 md:px-6"
                >
                    {/* Block 1: Title with terminal prompt first */}
                    <AnimatePresence mode="wait">
                        {!terminalDone ? (
                            <motion.div
                                key="terminal"
                                initial={{ opacity: 0, y: 30 }}
                                animate={contentReady ? { opacity: 1, y: 0 } : {}}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-center mb-8"
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-white font-medium mb-4">
                                    {t('studio', locale)}
                                </p>
                                <TerminalPrompt onComplete={() => setTerminalDone(true)} locale={locale} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-center mb-8"
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-white font-medium mb-4">
                                    {t('studio', locale)}
                                </p>
                                <TypewriterTitle locale={locale} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Block 2: Demo prompt — no background, clean floating text */}
                    {terminalDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center mb-8"
                        >
                            <p className="font-mono text-[9px] text-emerald-400/60 uppercase tracking-[0.2em] mb-3">{t('demoLabel', locale)}</p>
                            <div className="inline-flex flex-col gap-0.5 items-start text-left">
                                <FeatureTypein text={t('demo1', locale)} delay={1000} />
                                <FeatureTypein text={t('demo2', locale)} delay={1400} />
                                <FeatureTypein text={t('demo3', locale)} delay={1800} />
                                <FeatureTypein text={t('demo4', locale)} delay={2200} />
                            </div>
                        </motion.div>
                    )}

                    {/* Block 3: Product Cards */}
                    <div className="w-full max-w-[1100px]">
                        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 scrollbar-hide">
                        {products.map((p, i) => {
                            const isExt = 'isExternal' in p && p.isExternal;
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 80, scale: 0.9 }}
                                    animate={terminalDone ? { opacity: 1, y: 0, scale: 1 } : {}}
                                    transition={{ delay: 3.0 + i * 0.25, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
                                    className="group relative flex-shrink-0 w-[80vw] md:w-auto snap-center flex flex-col gap-2 md:gap-3 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-4 md:p-5 overflow-hidden cursor-pointer"
                                >
                                    {/* Top accent bar */}
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={terminalDone ? { scaleX: 1 } : {}}
                                        transition={{ delay: 3.3 + i * 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute top-0 left-0 right-0 h-[2px] origin-left"
                                        style={{ background: `linear-gradient(90deg, transparent, ${p.borderGlow}, transparent)` }}
                                    />
                                    {/* Glow pulse on entry */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={terminalDone ? { opacity: [0, 0.8, 0] } : {}}
                                        transition={{ delay: 3.0 + i * 0.25 + 0.3, duration: 2.5, ease: 'easeOut' }}
                                        className="absolute inset-0 rounded-xl pointer-events-none"
                                        style={{ boxShadow: `inset 0 0 40px ${p.glowColor}, 0 0 60px ${p.glowColor}` }}
                                    />
                                    {/* Hover glow - stronger */}
                                    <div
                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                                        style={{ boxShadow: `inset 0 0 30px ${p.glowColor}, 0 0 50px ${p.glowColor}, 0 4px 30px ${p.glowColor}` }}
                                    />
                                    {/* Hover scan line */}
                                    <motion.div
                                        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100"
                                        style={{ top: '50%' }}
                                    />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono ${p.accentColor}`}>{'>'}_</span>
                                                <FeatureTypein text={p.name} delay={3500 + i * 250} ready={terminalDone} />
                                            </div>
                                            <FeatureTypein text={`[${p.tagline}]`} delay={3700 + i * 250} ready={terminalDone} />
                                        </div>
                                        <div className="mb-2 md:mb-3">
                                            <FeatureTypein text={p.desc} delay={3900 + i * 250} ready={terminalDone} />
                                        </div>
                                        <div className="flex flex-col gap-1 md:gap-1.5 mb-3 md:mb-4">
                                            {p.features.map((f, j) => (
                                                <FeatureTypein
                                                    key={j}
                                                    text={f}
                                                    delay={4200 + i * 250 + j * 300}
                                                    ready={terminalDone}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {isExt ? (
                                                <a href={p.loginHref} target="_blank" rel="noopener noreferrer"
                                                    className={`flex items-center gap-1.5 ${p.accentColor} hover:text-white font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                    <ExternalLink size={10} /> INIT_CONNECT
                                                </a>
                                            ) : (
                                                <>
                                                    <Link href={p.loginHref}
                                                        className={`flex items-center gap-1.5 ${p.accentColor} hover:text-white font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                        <ExternalLink size={10} /> LOGIN
                                                    </Link>
                                                    <span className="text-white/20">|</span>
                                                    <Link href={p.crmHref}
                                                        className={`flex items-center gap-1.5 ${p.accentColor} hover:text-white font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-300 cursor-pointer hover:drop-shadow-[0_0_8px_currentColor]`}>
                                                        <ArrowRight size={10} /> ENTER_CRM
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
                </motion.div>
            </div>
        </>
    );
}
