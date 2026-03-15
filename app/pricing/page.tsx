'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Check, Globe, Users, ArrowRight, Crown, Sparkles,
    Code, Server, GraduationCap, Download, Star, Shield,
    Layout, BarChart3, Headphones, Bot, Package, Rocket
} from 'lucide-react';
import Link from 'next/link';
import { LunaLogo } from '../components/LunaLogo';
import { fetchWithAuth } from '../../src/lib/utils/fetchWithAuth';
import { getVertical } from '../../src/verticals';

/* ═══════════════════════════════════════════════════════
   Terminal Prompt Animation
   ═══════════════════════════════════════════════════════ */
const TERMINAL_LINES = [
    { prompt: 'root@luna:~#', text: './init_billing --mode=pro' },
    { text: '[OK] Analyser les besoins de l\'agence...', green: true },
    { text: '[OK] Charger les modules CRM & IA...', green: true },
    { text: '[OK] Vérifier les quotas API...', green: true },
    { text: '>> Sélection du profil de performance requis.', dim: true },
    { prompt: 'root@luna:~#', text: '' }
];

function TerminalPrompt({ onComplete }: { onComplete: () => void }) {
    const [visibleLines, setVisibleLines] = useState(0);
    const [typedChars, setTypedChars] = useState(0);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const c = setInterval(() => setShowCursor(v => !v), 530);
        return () => clearInterval(c);
    }, []);

    useEffect(() => {
        if (visibleLines >= TERMINAL_LINES.length) {
            setTimeout(onComplete, 500);
            return;
        }

        const currentLine = TERMINAL_LINES[visibleLines];
        const textToType = currentLine.text || '';

        if (!currentLine.prompt && textToType.length === 0) {
            setVisibleLines(v => v + 1);
            return;
        }

        if (typedChars < textToType.length) {
            const timeout = setTimeout(() => {
                setTypedChars(v => v + 1);
            }, currentLine.prompt ? 40 : 15);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setVisibleLines(v => v + 1);
                setTypedChars(0);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [visibleLines, typedChars, onComplete]);

    return (
        <div className="font-mono text-[13px] md:text-[15px] leading-tight flex flex-col gap-1.5 md:gap-2 text-left bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10 mx-auto max-w-[600px] shadow-2xl">
            {TERMINAL_LINES.slice(0, visibleLines + 1).map((line, i) => {
                const isCurrentLine = i === visibleLines;
                const text = isCurrentLine ? line.text.substring(0, typedChars) : line.text;
                const promptColor = line.green ? 'text-emerald-400' : 'text-white/60';
                const textColor = line.dim ? 'text-white/50' : line.green ? 'text-white/90' : 'text-white';

                if (!line.prompt && !line.text) return <div key={i} className="h-2" />;

                return (
                    <div key={i} className="whitespace-nowrap overflow-hidden text-ellipsis">
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

/* ═══════════════════════════════════════════
   SaaS Plans (subscription)
   ═══════════════════════════════════════════ */
const SAAS_PLANS = [
    {
        id: 'site_builder',
        name: 'Site Builder',
        price: 29,
        tagline: 'Votre vitrine voyage professionnelle',
        icon: Globe,
        color: '#E3E2F3',
        features: [
            { text: '3 templates premium', ok: true },
            { text: 'Éditeur visuel drag & drop', ok: true },
            { text: '30+ animations & effets', ok: true },
            { text: 'Catalogue en ligne', ok: true },
            { text: 'Formulaire sur-mesure', ok: true },
            { text: 'SEO & domaine personnalisé', ok: true },
            { text: 'Analytics site basiques', ok: true },
            { text: 'CRM & Pipeline', ok: false },
            { text: 'Agents IA', ok: false },
        ],
        cta: 'Démarrer',
    },
    {
        id: 'crm',
        name: 'CRM Pro',
        price: 79,
        tagline: 'Gérez toute votre activité voyage',
        icon: Users,
        color: '#D3E8E3',
        features: [
            { text: 'Dashboard complet', ok: true },
            { text: 'Pipeline de vente', ok: true },
            { text: 'Gestion contacts illimitée', ok: true },
            { text: 'Planning & calendrier', ok: true },
            { text: 'Boîte de réception email', ok: true },
            { text: 'Devis & Factures', ok: true },
            { text: 'Catalogue prestataires', ok: true },
            { text: 'Équipe (5 membres)', ok: true },
            { text: 'Site vitrine', ok: false },
            { text: 'Agents IA avancés', ok: false },
        ],
        cta: 'Choisir CRM',
    },
    {
        id: 'all_in_one',
        name: 'All-in-One',
        price: 99,
        tagline: 'Site + CRM — la solution complète',
        popular: true,
        icon: Crown,
        color: '#bcdeea',
        features: [
            { text: 'Tout du Site Builder', ok: true, bold: true },
            { text: 'Tout du CRM Pro', ok: true, bold: true },
            { text: 'Analytics avancés', ok: true },
            { text: '15 membres d\'équipe', ok: true },
            { text: '2000 contacts', ok: true },
            { text: '200 voyages/mois', ok: true },
            { text: '100 requêtes IA/jour', ok: true },
            { text: 'Support prioritaire', ok: true },
            { text: 'Agents IA avancés', ok: false },
            { text: 'WhatsApp Business', ok: false },
        ],
        cta: 'Choisir All-in-One',
    },
];

const ENTERPRISE_FEATURES = [
    'Tout de All-in-One', 'Agents IA illimités', 'WhatsApp Business API',
    'Membres illimités', 'Contacts illimités', 'API complète + Webhooks',
    'SLA garanti 99.9%', 'Account Manager dédié', 'Formations personnalisées',
];

/* ═══════════════════════════════════════════
   Self-Hosted Plans (one-time payment)
   ═══════════════════════════════════════════ */
const SELF_HOSTED_PLANS = [
    {
        id: 'self_hosted_code',
        name: 'Code Source',
        tagline: 'Le code complet, à vous pour toujours',
        price: 2490,
        originalPrice: 15000,
        icon: Code,
        color: '#D3E8E3',
        features: [
            { text: 'Code source complet (Next.js + Firebase)', ok: true },
            { text: '3 templates premium', ok: true },
            { text: 'CRM + Pipeline + Planning', ok: true },
            { text: 'Système de facturation', ok: true },
            { text: 'Agents IA intégrés', ok: true },
            { text: '3 mois de support email', ok: true },
            { text: 'Mises à jour pendant 6 mois', ok: true },
            { text: 'Déploiement inclus', ok: false },
            { text: 'Formation personnalisée', ok: false },
        ],
        cta: 'Acheter le code',
    },
    {
        id: 'self_hosted_install',
        name: 'Code + Installation',
        tagline: 'Prêt à l\'emploi sur votre infra',
        price: 3990,
        originalPrice: 22000,
        popular: true,
        icon: Server,
        color: '#bcdeea',
        features: [
            { text: 'Tout du Code Source', ok: true, bold: true },
            { text: 'Déploiement Vercel + Firebase', ok: true },
            { text: 'Configuration domaine & DNS', ok: true },
            { text: 'Configuration Stripe & emails', ok: true },
            { text: 'Données de démo pré-remplies', ok: true },
            { text: '6 mois de support email', ok: true },
            { text: 'Mises à jour pendant 12 mois', ok: true },
            { text: 'Formation personnalisée', ok: false },
        ],
        cta: 'Acheter + Installation',
    },
    {
        id: 'self_hosted_formation',
        name: 'Code + Install + Formation',
        tagline: 'La solution tout inclus',
        price: 5990,
        originalPrice: 30000,
        icon: GraduationCap,
        color: '#E3E2F3',
        features: [
            { text: 'Tout de Code + Installation', ok: true, bold: true },
            { text: '3h de formation visio personnalisée', ok: true },
            { text: 'Guide d\'utilisation complet', ok: true },
            { text: 'Formation équipe (jusqu\'à 5 pers.)', ok: true },
            { text: '6 mois de support prioritaire', ok: true },
            { text: 'Mises à jour pendant 12 mois', ok: true },
            { text: 'Consulting personnalisation 2h', ok: true },
        ],
        cta: 'Acheter tout inclus',
    },
];

/* ═══ Comparison table rows ═══ */
const COMPARISON = [
    { feature: 'Éditeur de site', sb: true, crm: false, all: true, ent: true },
    { feature: '3 templates premium', sb: true, crm: false, all: true, ent: true },
    { feature: '30+ animations', sb: true, crm: false, all: true, ent: true },
    { feature: 'Catalogue en ligne', sb: true, crm: false, all: true, ent: true },
    { feature: 'Dashboard CRM', sb: false, crm: true, all: true, ent: true },
    { feature: 'Pipeline de vente', sb: false, crm: true, all: true, ent: true },
    { feature: 'Contacts', sb: '—', crm: '500', all: '2 000', ent: '∞' },
    { feature: 'Planning voyages', sb: false, crm: true, all: true, ent: true },
    { feature: 'Email intégré', sb: false, crm: true, all: true, ent: true },
    { feature: 'Devis & Factures', sb: false, crm: true, all: true, ent: true },
    { feature: 'Équipe', sb: '1', crm: '5', all: '15', ent: '∞' },
    { feature: 'Requêtes IA/jour', sb: '5', crm: '30', all: '100', ent: '∞' },
    { feature: 'Agents IA avancés', sb: false, crm: false, all: false, ent: true },
    { feature: 'WhatsApp Business', sb: false, crm: false, all: false, ent: true },
    { feature: 'API & Webhooks', sb: false, crm: false, all: false, ent: true },
    { feature: 'Support', sb: 'Email', crm: 'Email', all: 'Prioritaire', ent: 'Dédié' },
];

const BOTTOM_FEATURES = [
    { icon: Layout, title: 'Site Premium', desc: '3 templates ultra-léchés avec animations 2026' },
    { icon: Globe, title: 'CRM Complet', desc: 'Pipeline, contacts, planning, activités liés' },
    { icon: Users, title: 'Multi-utilisateurs', desc: 'Collaborez en équipe sur vos dossiers' },
    { icon: BarChart3, title: 'Analytics', desc: 'KPIs en temps réel et rapports automatiques' },
    { icon: Shield, title: 'Sécurité', desc: 'Données chiffrées, hébergement Firebase' },
    { icon: Headphones, title: 'Support', desc: 'Assistance dédiée selon votre formule' },
    { icon: Bot, title: 'IA Intégrée', desc: 'Agents spécialisés voyage & prestations' },
    { icon: Sparkles, title: 'Mises à jour', desc: 'Nouvelles fonctionnalités chaque mois' },
];

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [annual, setAnnual] = useState(false);
    const [mode, setMode] = useState<'saas' | 'selfhosted'>('saas');
    const [terminalDone, setTerminalDone] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { scrollY } = useScroll();
    const scrollBasedScale = useTransform(scrollY, [0, 1000], [1, 1.15]);

    // ═══ VERTICAL-AWARE CONTENT ═══
    const searchParams = useSearchParams();
    const verticalParam = searchParams.get('vertical');
    const vertical = getVertical(verticalParam || process.env.NEXT_PUBLIC_VERTICAL || 'travel');
    const isLegal = vertical.id === 'legal';
    const isTravel = vertical.id === 'travel';
    const heroTag = isTravel ? 'Plateforme B2B pour le voyage' : `Plateforme B2B — ${vertical.name}`;
    const heroDescription = isTravel
        ? 'Site vitrine, CRM complet ou les deux — chaque module est conçu pour les professionnels du voyage.'
        : `Site vitrine, CRM complet ou les deux — chaque module est conçu pour ${vertical.description.fr?.toLowerCase() || 'votre métier'}.`;
    const footerText = isTravel
        ? '© 2026 Luna — Concierge Voyage. Tous droits réservés.'
        : `© 2026 ${vertical.branding.appName}. Tous droits réservés.`;

    const checkout = async (planId: string) => {
        if (planId === 'enterprise') {
            window.location.href = 'mailto:contact@luna-travel.io?subject=Luna Enterprise';
            return;
        }
        setLoading(planId);
        try {
            const res = await fetchWithAuth('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let frameId: number;
        const checkTime = () => {
            if (video.duration > 0 && (video.duration - video.currentTime) <= 0.2) {
                video.pause();
                video.currentTime = video.duration - 0.2; // lock to final frame loosely
                setVideoEnded(true);
                return;
            }
            if (!videoEnded) {
                frameId = requestAnimationFrame(checkTime);
            }
        };
        video.addEventListener('play', () => {
            frameId = requestAnimationFrame(checkTime);
        });

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            video.removeEventListener('play', checkTime);
        };
    }, [videoEnded]);

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            
            {/* ═══ Video Background ═══ */}
            {videoEnded ? (
                <motion.div 
                    style={{ scale: scrollBasedScale }}
                    className="fixed inset-0 z-0 origin-center"
                >
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        loop={false}
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.8]"
                        poster="/hero-bg.jpg"
                    >
                        <source src="/hero-bg.webm" type="video/webm" />
                        <source src="/Platforms_random_up_down_movement_delpmaspu_.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
            ) : (
                <div className="fixed inset-0 z-0 origin-center">
                    <video
                        ref={videoRef}
                        autoPlay
                    muted
                    playsInline
                    loop={false}
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.8]"
                    poster="/hero-bg.jpg"
                >
                    <source src="/hero-bg.webm" type="video/webm" />
                    <source src="/Platforms_random_up_down_movement_delpmaspu_.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/40" />
            </div>
            )}

            {/* ── Navbar ── */}
            <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-[1200px] mx-auto opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
                <Link href="/" className="flex items-center gap-3 cursor-pointer">
                    <LunaLogo size={28} />
                </Link>
                <div className="flex items-center gap-5">
                    <Link href="/cgv" className="text-sm text-white/60 hover:text-white transition-colors">CGV</Link>
                    <Link href={isLegal ? '/login?vertical=legal' : '/login'} className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-[12px] uppercase tracking-wider transition-all">Connexion</Link>
                </div>
            </nav>

            {/* ── Main Content Area ── */}
            <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center pt-8 pb-20">
                <AnimatePresence mode="wait">
                    {!terminalDone ? (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                            transition={{ duration: 0.8 }}
                            className="w-full px-6"
                        >
                            <TerminalPrompt onComplete={() => setTerminalDone(true)} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pricing"
                            initial={{ opacity: 0, y: 40, filter: 'blur(15px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full"
                        >
                            {/* ── Hero ── */}
                            <header className="text-center px-6 pt-8 pb-10 max-w-[700px] mx-auto">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 mb-6 bg-black/40 backdrop-blur-md">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">root@luna:~/billing</p>
                                </div>
                                <h1 className="font-mono text-3xl md:text-[40px] font-light text-white tracking-tight mb-4">
                                    {'>'} Sélectionnez un profil
                                </h1>
                                <p className="font-mono text-white/50 text-[13px] leading-relaxed max-w-[520px] mx-auto">
                                    {heroDescription}
                                </p>
                            </header>

                            {/* ── Mode Toggle: SaaS ↔ Self-Hosted ── */}
                            <div className="flex items-center justify-center gap-1 mb-4">
                                <div className="inline-flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                                    <button
                                        onClick={() => setMode('saas')}
                                        className={`px-5 py-2.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${mode === 'saas'
                                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                            : 'text-white/40 hover:text-white/80'
                                            }`}
                                    >
                                        [ SaaS_CLOUD ]
                                    </button>
                                    <button
                                        onClick={() => setMode('selfhosted')}
                                        className={`px-5 py-2.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${mode === 'selfhosted'
                                            ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                            : 'text-white/40 hover:text-white/80'
                                            }`}
                                    >
                                        [ AUTO_HEBERGE ]
                                    </button>
                                </div>
                            </div>
                            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/30 mb-8">
                                {mode === 'saas' ? '>> INFRA GÉRÉE PAR LUNA' : '>> LICENCE CODE SOURCE'}
                            </p>

                            {/* ── Annual toggle (SaaS only) ── */}
                            <AnimatePresence>
                                {mode === 'saas' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-center gap-4 mb-12"
                                    >
                                        <span className={`font-mono text-[11px] uppercase tracking-wider ${!annual ? 'text-emerald-400' : 'text-white/40'}`}>/Mensuel</span>
                                        <button
                                            onClick={() => setAnnual(!annual)}
                                            className={`relative w-12 h-6 rounded-full border border-white/20 transition-colors cursor-pointer ${annual ? 'bg-emerald-500/20' : 'bg-black/40'}`}
                                        >
                                            <div className={`absolute top-[3px] w-4 h-4 bg-emerald-400 rounded-full transition-transform ${annual ? 'translate-x-[26px]' : 'translate-x-[4px]'}`} />
                                        </button>
                                        <span className={`font-mono text-[11px] uppercase tracking-wider ${annual ? 'text-emerald-400' : 'text-white/40'}`}>
                                            /Annuel <span className="text-amber-400 ml-1">[-20%]</span>
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

            {/* ════════════════════════════════
               SaaS Plans
               ════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {mode === 'saas' && (
                    <motion.div
                        key="saas"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="max-w-[1200px] mx-auto px-6 pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {SAAS_PLANS.map((plan, i) => {
                                    const Icon = plan.icon;
                                    return (
                                                <motion.div
                                                    key={plan.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className={`group rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden flex flex-col bg-black/40 backdrop-blur-xl ${plan.popular ? 'shadow-[0_0_30px_rgba(52,211,153,0.1)] border-emerald-500/30' : ''}`}
                                                >
                                                    <div className="p-6 border-b border-white/5 relative">
                                                        {plan.popular && (
                                                            <div className="absolute top-4 right-4">
                                                                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                                    [RECOMMENDED]
                                                                </span>
                                                            </div>
                                                        )}
                                                        {/* Top corner gradient glow */}
                                                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
                                                        
                                                        <div className="flex items-center gap-2 mb-3 mt-2">
                                                            <span className="font-mono text-emerald-400">{'>_'}</span>
                                                            <h3 className="font-mono text-[16px] text-white tracking-tight">{plan.name}</h3>
                                                        </div>
                                                        <p className="font-mono text-[11px] text-white/50 mb-6 min-h-[30px]">{plan.tagline}</p>

                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-mono text-3xl text-white">
                                                                {annual ? Math.round(plan.price * 0.8) : plan.price}€
                                                            </span>
                                                            <span className="font-mono text-[11px] text-white/40 uppercase">/mo</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-1 flex flex-col">
                                                        <ul className="space-y-4 mb-8 flex-1">
                                                            {plan.features.map((f, j) => (
                                                                <li key={j} className="flex items-start gap-3">
                                                                    {f.ok ? (
                                                                        <span className="font-mono text-[10px] text-emerald-400 mt-0.5">[OK]</span>
                                                                    ) : (
                                                                        <span className="font-mono text-[10px] text-white/20 mt-0.5">[--]</span>
                                                                    )}
                                                                    <span className={`font-mono text-[12px] leading-snug ${f.ok ? ('bold' in f && f.bold ? 'text-white' : 'text-white/70') : 'text-white/30'}`}>
                                                                        {f.text}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        <button
                                                            onClick={() => checkout(plan.id)}
                                                            disabled={loading === plan.id}
                                                            className="w-full py-4 rounded-lg border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                                                        >
                                                            {loading === plan.id ? (
                                                                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                            ) : (
                                                                <>INIT {plan.name.toUpperCase().replace(' ', '_')} <ArrowRight size={12} /></>
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                    );
                                })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                        {/* Enterprise */}
                        <div className="max-w-[1200px] mx-auto px-6 pb-14">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="font-mono text-fuchsia-400">{'>_'}</span>
                                            <div>
                                                <div className="font-mono text-[18px] text-white">Sys.Enterprise</div>
                                                <div className="font-mono text-[11px] text-white/50 mt-1">{'>'}{'>'} Infrastructure isolée pour les réseaux & grands groupes.</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-6">
                                            {ENTERPRISE_FEATURES.map((f, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className="font-mono text-[10px] text-fuchsia-400 mt-0.5">[OK]</span>
                                                    <span className="font-mono text-[11px] text-white/70 leading-relaxed">{f}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="shrink-0 md:text-right w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t border-white/10 md:border-none">
                                        <div className="flex items-baseline gap-1 mb-4 md:justify-end">
                                            <span className="font-mono text-3xl text-white">499€</span>
                                            <span className="font-mono text-[11px] text-white/40 uppercase">/mo</span>
                                        </div>
                                        <button
                                            onClick={() => checkout('enterprise')}
                                            className="w-full md:w-auto px-8 py-4 rounded-lg bg-white text-black font-mono text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            CONTACT_SUPPORT <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ════════════════════════════════
                   Self-Hosted Plans
                   ════════════════════════════════ */}
                <AnimatePresence mode="wait">
                    {mode === 'selfhosted' && (
                    <motion.div
                        key="selfhosted"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Launch banner */}
                        <div className="max-w-[1200px] mx-auto px-6 pb-5">
                            <div className="bg-[#D3E8E3]/40 border border-[#D3E8E3] rounded-[12px] px-5 py-3 flex items-center justify-center gap-3">
                                <Rocket size={14} className="text-luna-charcoal" />
                                <span className="text-[12px] text-luna-charcoal">
                                    Offre de lancement — Prix exclusifs pour les 50 premiers acheteurs
                                </span>
                                <span className="text-label-sharp bg-luna-charcoal text-white px-2 py-0.5 rounded-full text-[9px]">
                                    -75%
                                </span>
                            </div>
                        </div>

                        {/* Plan cards */}
                        <div className="max-w-[1200px] mx-auto px-6 pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {SELF_HOSTED_PLANS.map((plan, i) => {
                                    const Icon = plan.icon;
                                    return (
                                                    <motion.div
                                                        key={plan.id}
                                                        initial={{ opacity: 0, y: 16 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                        className={`group rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden flex flex-col bg-black/40 backdrop-blur-xl ${plan.popular ? 'shadow-[0_0_30px_rgba(251,191,36,0.1)] border-amber-400/30' : ''}`}
                                                    >
                                                        <div className="p-6 border-b border-white/5 relative">
                                                            {plan.popular && (
                                                                <div className="absolute top-4 right-4">
                                                                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20">
                                                                        [MOST_USED]
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 blur-2xl rounded-full" />

                                                            <div className="flex items-center gap-2 mb-3 mt-2">
                                                                <span className="font-mono text-amber-400">{'>_'}</span>
                                                                <h3 className="font-mono text-[16px] text-white tracking-tight">{plan.name}</h3>
                                                            </div>
                                                            <p className="font-mono text-[11px] text-white/50 mb-6 min-h-[30px]">{plan.tagline}</p>

                                                            <div className="mb-1">
                                                                <span className="font-mono text-3xl text-white">
                                                                    {plan.price.toLocaleString('fr-FR')}€
                                                                </span>
                                                                <span className="font-mono text-[11px] text-white/40 uppercase ml-2">LIFETIME</span>
                                                            </div>
                                                            <div className="font-mono text-[10px] text-white/30 mt-2">
                                                                VALEUR: <span className="line-through">{plan.originalPrice.toLocaleString('fr-FR')}€</span>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 flex-1 flex flex-col">
                                                            <ul className="space-y-4 mb-8 flex-1">
                                                                {plan.features.map((f, j) => (
                                                                    <li key={j} className="flex items-start gap-3">
                                                                        {f.ok ? (
                                                                            <span className="font-mono text-[10px] text-amber-400 mt-0.5">[OK]</span>
                                                                        ) : (
                                                                            <span className="font-mono text-[10px] text-white/20 mt-0.5">[--]</span>
                                                                        )}
                                                                        <span className={`font-mono text-[12px] leading-snug ${f.ok ? (f.bold ? 'text-white' : 'text-white/70') : 'text-white/30'}`}>
                                                                            {f.text}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>

                                                            <button
                                                                onClick={() => checkout(plan.id)}
                                                                disabled={loading === plan.id}
                                                                className="w-full py-4 rounded-lg border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                                                            >
                                                                {loading === plan.id ? (
                                                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                                ) : (
                                                                    <>EXEC: {plan.cta.toUpperCase().replace(/ /g, '_')} <ArrowRight size={12} /></>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* ── Footer ── */}
            <footer className="relative z-10 py-8 border-t border-white/10 text-center bg-black/40 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2">
                    <LunaLogo size={14} />
                    <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{footerText}</span>
                </div>
            </footer>
        </div>
    );
}
