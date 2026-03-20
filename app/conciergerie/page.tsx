'use client';

import { useEffect, useState, useRef } from 'react';
import { sanitizeHtml, sanitizeCss } from '@/src/lib/sanitize';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Car, UtensilsCrossed, MapPin, Hotel, CheckCircle2, X } from 'lucide-react';
import { useLang } from './LangContext';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Render } from '@puckeditor/core';
import { lunaConfig } from '@/src/components/puck/puck-config';
interface PublicCatalogItem {
    id: string;
    type: string;
    name: string;
    location: string;
    description: string;
    clientPrice: number;
    currency: string;
    images: string[];
    video?: string;
}

const getTypeStyles = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'HOTEL':
            return { label: 'HÔTEL', gradient: 'from-[#E3E2F3] to-[#d1cdec]', Icon: Hotel };
        case 'ACTIVITY':
            return { label: 'ACTIVITÉ', gradient: 'from-[#D3E8E3] to-[#c1ebd9]', Icon: MapPin };
        case 'TRANSFER':
        case 'TRANSFERT':
            return { label: 'TRANSFERT', gradient: 'from-[#E6D2BD] to-[#e4ccb5]', Icon: Car };
        default:
            return { label: 'EXPÉRIENCE', gradient: 'from-[#F2D9D3] to-[#ebd0c9]', Icon: UtensilsCrossed };
    }
};

const ParallaxDivider = ({ image, title, text, headingColor, textColor }: { image: string, title?: string, text?: string, headingColor?: string, textColor?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

    return (
        <div ref={ref} className="relative h-[100vh] w-full overflow-hidden z-10 rounded-xl">
            <motion.div
                style={{ y }}
                className="absolute top-[-20%] left-0 w-full h-[140%] hidden md:block"
            >
                <img src={image} className="w-full h-full object-cover" alt="" />
            </motion.div>
            {/* Fallback for mobile performance */}
            <img src={image} className="absolute inset-0 w-full h-full object-cover md:hidden" alt="" />

            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                {title && (
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[45px] md:text-[65px] lg:text-[75px] italic drop-shadow-2xl font-light tracking-tight leading-tight mb-6"
                        style={{ fontFamily: 'var(--font-heading)', color: headingColor || 'white' }}
                    >
                        {title}
                    </motion.h2>
                )}
                {text && (
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[14px] md:text-[18px] font-light max-w-3xl mx-auto leading-relaxed"
                        style={{ color: textColor || 'rgba(255,255,255,0.9)' }}
                    >
                        {text}
                    </motion.p>
                )}
            </div>
        </div>
    );
};

export default function ConciergeHomePage() {
    const { t, lang } = useLang();
    const router = useRouter();
    const { addToCart, removeFromCart, cart } = useCart();
    const [catalog, setCatalog] = useState<PublicCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<PublicCatalogItem | null>(null);
    const [catalogFilter, setCatalogFilter] = useState<string>('all');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [videoError, setVideoError] = useState(false);

    // Tailor-Made Form State
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        destination: '', dates: '', budget: '', pax: '2', vibe: '', notes: '',
        _hp_website: '' // Honeypot anti-spam field (must stay empty for humans)
    });
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [siteConfig, setSiteConfig] = useState<any>(null);
    const [configKey, setConfigKey] = useState(0); // bumped on editor postMessage → forces Framer animation replay
    const [i18nData, setI18nData] = useState<any>(null);
    const [dynamicCollections, setDynamicCollections] = useState<any[] | null>(null);

    // ── Detect if loaded inside editor iframe — skip blur animations to prevent stuck filters ──
    const inIframe = typeof window !== 'undefined' && window !== window.parent;

    // ── Ambient background sound (Web Audio API — warm pad + gentle chimes) ──
    const [ambientOn, setAmbientOn] = useState(false);
    const ambientCtxRef = useRef<AudioContext | null>(null);
    const chimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (inIframe || !ambientOn) return;

        // Kill any prior context first (safety)
        if (ambientCtxRef.current && ambientCtxRef.current.state !== 'closed') {
            try { ambientCtxRef.current.close(); } catch {}
        }

        const ctx = new AudioContext();
        ambientCtxRef.current = ctx;

        // Master gain — very soft
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
        master.connect(ctx.destination);

        // ── Warm pad: C major triad (C4 + E4 + G4) ──
        [261.63, 329.63, 392.0].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = (i - 1) * 4;
            const g = ctx.createGain();
            g.gain.value = 0.012;
            // Slow tremolo
            const trem = ctx.createOscillator();
            trem.type = 'sine';
            trem.frequency.value = 0.15 + i * 0.05;
            const tg = ctx.createGain();
            tg.gain.value = 0.004;
            trem.connect(tg);
            tg.connect(g.gain);
            trem.start();
            osc.connect(g);
            g.connect(master);
            osc.start();
        });

        // ── Random chimes (pentatonic) ──
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
        const scheduleChime = () => {
            if (ctx.state === 'closed') return;
            const freq = notes[Math.floor(Math.random() * notes.length)];
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const env = ctx.createGain();
            env.gain.setValueAtTime(0, ctx.currentTime);
            env.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, ctx.currentTime + 0.1);
            env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3 + Math.random() * 2);
            osc.connect(env);
            env.connect(master);
            osc.start();
            osc.stop(ctx.currentTime + 5);
            chimeTimerRef.current = setTimeout(scheduleChime, 3000 + Math.random() * 5000);
        };
        chimeTimerRef.current = setTimeout(scheduleChime, 2000);

        // Cleanup: stop everything immediately
        return () => {
            if (chimeTimerRef.current) clearTimeout(chimeTimerRef.current);
            chimeTimerRef.current = null;
            if (ctx.state !== 'closed') { try { ctx.close(); } catch {} }
            ambientCtxRef.current = null;
        };
    }, [ambientOn, inIframe]);

    /** Strip filter: blur(...) from animation states when in iframe (prevents stuck blur) */
    const stripBlur = (animObj: any) => {
        if (!inIframe || !animObj) return animObj;
        const clean = { ...animObj };
        if (clean.initial) {
            const { filter, ...rest } = clean.initial;
            clean.initial = rest;
        }
        if (clean.whileInView) {
            const { filter, ...rest } = clean.whileInView;
            clean.whileInView = rest;
        }
        return clean;
    };

    // ── Apply editor CSS custom properties (colors + fonts) ──
    useEffect(() => {
        if (!siteConfig?.global) return;
        const g = siteConfig.global;
        const root = document.documentElement;
        if (g.primaryColor) root.style.setProperty('--luna-primary', g.primaryColor);
        if (g.secondaryColor) root.style.setProperty('--luna-secondary', g.secondaryColor);
        if (g.accentColor) root.style.setProperty('--luna-accent', g.accentColor);

        // Dynamic Google Font loading
        const fontsToLoad: string[] = [];
        if (g.fontHeading && g.fontHeading !== 'Outfit' && g.fontHeading !== 'Quicksand') fontsToLoad.push(g.fontHeading);
        if (g.fontBody && g.fontBody !== 'Outfit' && g.fontBody !== 'Quicksand') fontsToLoad.push(g.fontBody);
        if (fontsToLoad.length > 0) {
            const existing = document.querySelector('link[data-luna-fonts]');
            if (existing) existing.remove();
            const families = fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@200;300;400;500;600;700`).join('&');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
            link.setAttribute('data-luna-fonts', 'true');
            document.head.appendChild(link);
        }
        if (g.fontHeading) root.style.setProperty('--font-heading', `'${g.fontHeading}', serif`);
        if (g.fontBody) root.style.setProperty('--font-body', `'${g.fontBody}', sans-serif`);
        if (g.headingColor) root.style.setProperty('--luna-heading-color', g.headingColor);
        if (g.textColor) root.style.setProperty('--luna-text-color', g.textColor);

        return () => {
            root.style.removeProperty('--luna-primary');
            root.style.removeProperty('--luna-secondary');
            root.style.removeProperty('--luna-accent');
            root.style.removeProperty('--font-heading');
            root.style.removeProperty('--font-body');
            root.style.removeProperty('--luna-heading-color');
            root.style.removeProperty('--luna-text-color');
        };
    }, [siteConfig?.global]);

    // ── Block visibility helper ──
    const isBlockVisible = (type: string): boolean => {
        if (!siteConfig?.blocks) return true;
        const block = siteConfig.blocks.find((b: any) => b.type === type);
        return block ? block.visible !== false : true;
    };

    // ── Animation mapping: editor animation ID → Framer Motion variants ──
    const getBlockAnimation = (type: string) => {
        if (!siteConfig?.blocks) return {};
        const block = siteConfig.blocks.find((b: any) => b.type === type);
        const animId = block?.animation;
        if (!animId) return {};

        const speedMap: Record<string, number> = { slow: 1.6, normal: 0.8, fast: 0.35 };
        const duration = speedMap[block?.animationSpeed || 'normal'] || 0.8;
        const delay = block?.animationDelay ? parseInt(block.animationDelay) / 1000 : 0;
        const ease = [0.16, 1, 0.3, 1]; // "Wow" 2026 smooth ease-out curve

        const map: Record<string, any> = {
            fadeIn: { initial: { opacity: 0, filter: 'blur(10px)' }, whileInView: { opacity: 1, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            slideUp: { initial: { opacity: 0, y: 80, filter: 'blur(10px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            slideDown: { initial: { opacity: 0, y: -80, filter: 'blur(10px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            slideLeft: { initial: { opacity: 0, x: 80, filter: 'blur(10px)' }, whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            slideRight: { initial: { opacity: 0, x: -80, filter: 'blur(10px)' }, whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            scaleIn: { initial: { opacity: 0, scale: 0.85, filter: 'blur(15px)' }, whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
            bounceIn: { initial: { opacity: 0, scale: 0.4, y: 40 }, whileInView: { opacity: 1, scale: 1, y: 0 }, transition: { type: 'spring', damping: 15, stiffness: 120, delay } },
            flipIn: { initial: { opacity: 0, rotateX: -90, y: 40, filter: 'blur(10px)' }, whileInView: { opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)' }, transition: { duration, delay, ease } },
        };
        return stripBlur(map[animId] || {});
    };

    // ── Effect mapping: get CSS class for block effect ──
    const getBlockEffectClass = (type: string): string => {
        if (!siteConfig?.blocks) return '';
        const block = siteConfig.blocks.find((b: any) => b.type === type);
        const effect = block?.effect;
        if (!effect) return '';
        const effectMap: Record<string, string> = {
            glassmorphism: 'backdrop-blur-md bg-white/10 border border-white/20',
            'shadow-hover': 'hover:shadow-2xl hover:shadow-black/10 transition-shadow duration-500',
            glow: 'shadow-lg shadow-[var(--luna-secondary)]/20',
            'gradient-shimmer': 'cb-gradient-shimmer',
            'neon-border': 'cb-neon-border',
            float: 'cb-float',
            'blur-reveal': 'cb-blur-reveal',
            grain: 'cb-grain',
            'morph-border': 'cb-morph-border',
            spotlight: 'cb-spotlight overflow-hidden',
            'text-gradient': 'cb-text-gradient',
        };
        return effectMap[effect] || '';
    };

    // ── Cart helper ──
    const isInCart = (id: string) => cart.some(c => c.id === id);
    // Track whether we received config from editor postMessage (prevents race condition)
    const configFromEditorRef = useRef(false);

    useEffect(() => {
        // Only fetch from API if NOT in iframe (or as fallback if editor hasn't sent config)
        fetch('/api/crm/site-config')
            .then(res => res.json())
            .then(data => {
                // Don't overwrite if editor already sent config via postMessage
                if (!configFromEditorRef.current) {
                    setSiteConfig(data);
                }
            })
            .catch(console.error);

        fetch('/api/conciergerie/catalog')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCatalog(data);
                } else if (data.items && data.items.length > 0) {
                    setCatalog(data.items);
                } else {
                    setCatalog([]);
                }
                setLoading(false);
            })
            .catch(() => {
                setCatalog([]);
                setLoading(false);
            });

        // Fetch dynamic collections from Firestore
        fetch('/api/conciergerie/collections')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setDynamicCollections(data);
                }
            })
            .catch(() => { /* Fallback to hardcoded */ });
    }, []);

    // ── Click-to-edit: when loaded in iframe, send section clicks to parent editor ──
    useEffect(() => {
        if (typeof window === 'undefined' || window === window.parent) return;
        
        // Listen for real-time config updates from editor
        const handleConfigUpdate = (e: MessageEvent) => {
            console.log('[PREVIEW] Message received:', e.data?.type, 'hasConfig:', !!e.data?.config);
            if (e.data?.type === 'editor-update-config' && e.data.config) {
                configFromEditorRef.current = true; // Prevent API fetch from overwriting
                setSiteConfig(e.data.config);
                setVideoError(false); // Reset video error so new video URLs can load
                // Bump configKey to force Framer Motion animation replay
                setConfigKey(k => k + 1);
                console.log('[PREVIEW] Config applied! collectionsColor:', e.data.config?.global?.collectionsHeadingColor);
            }
            // Scroll to section when editor clicks a section
            if (e.data?.type === 'editor-scroll-to' && e.data.section) {
                const el = document.querySelector(`[data-editor-section="${e.data.section}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };
        window.addEventListener('message', handleConfigUpdate);
        
        const style = document.createElement('style');
        style.textContent = `
            /* ── Prevent stuck blur filters in editor iframe ── */
            * { filter: none !important; }
            [data-editor-section] { cursor: pointer; position: relative; }
            [data-editor-section]:hover::after {
                content: '';
                position: absolute;
                inset: 0;
                border: 2px solid #5a8fa3;
                border-radius: 12px;
                pointer-events: none;
                z-index: 9999;
                animation: editorPulse 1.5s ease-in-out infinite;
            }
            @keyframes editorPulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
        const handler = (e: MouseEvent) => {
            const section = (e.target as HTMLElement).closest('[data-editor-section]');
            if (section) {
                e.preventDefault();
                e.stopPropagation();
                window.parent.postMessage({ type: 'editor-focus-section', section: section.getAttribute('data-editor-section') }, '*');
            }
        };
        document.addEventListener('click', handler, true);
        return () => { 
            document.removeEventListener('click', handler, true); 
            document.head.removeChild(style); 
            window.removeEventListener('message', handleConfigUpdate);
        };
    }, []);

    // ── Fetch translations when lang changes ──
    useEffect(() => {
        fetch(`/api/conciergerie/translations?lang=${lang}`)
            .then(r => r.json())
            .then(data => setI18nData(data))
            .catch(console.error);
    }, [lang]);

    // ── i18n helpers: translate catalog item ──
    const trCatalog = (item: PublicCatalogItem) => {
        if (!i18nData?.catalog || !i18nData?.slugify) return item;
        const slug = i18nData.slugify[item.name] || Object.entries(i18nData.slugify).find(([name]) => item.name.includes(name))?.[1];
        if (!slug || !i18nData.catalog[slug]) return item;
        const tr = i18nData.catalog[slug];
        return { ...item, name: tr.name, description: tr.description, location: tr.location };
    };

    // ── i18n helpers: translate block text ──
    const trBlock = (blockType: string, field: string, fallback: string) => {
        const customValue = siteConfig?.blocks?.find((b: any) => b.type === blockType)?.[field];
        const frTranslation = i18nData?.blocks?.[blockType]?.[field]; // For comparing if customValue is just the default French

        // If no custom value, or if custom value strictly equals the French default/fallback, use translation!
        if (!customValue || customValue === fallback || (lang !== 'FR' && customValue === frTranslation) || (lang === 'FR' && !customValue)) {
             if (i18nData?.blocks?.[blockType]?.[field]) {
                 return i18nData.blocks[blockType][field];
             }
             return fallback;
        }

        // If they heavily customized the text, we have no choice but to show the custom text (un-translated)
        return customValue;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await fetch('/api/conciergerie/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            setIsSent(true);
        } catch (err) {
            console.error(err);
        }
        setIsSending(false);
    };

    const heroBlock = siteConfig?.blocks?.find((b: any) => b.type === 'hero');
    const collectionsBlock = siteConfig?.blocks?.find((b: any) => b.type === 'collections');
    const catalogBlock = siteConfig?.blocks?.find((b: any) => b.type === 'catalog');
    const historyBlock = siteConfig?.blocks?.find((b: any) => b.type === 'history');
    const formBlock = siteConfig?.blocks?.find((b: any) => b.type === 'form');

    // ── localText: Editor Config > i18n API > Hardcoded Fallbacks ──
    const localText = {
        hero1: trBlock('hero', 'title', 'Voyagez'),
        hero2: trBlock('hero', 'subtitle', 'magnifiquement.'),
        heroDesc: trBlock('hero', 'description', "Une conciergerie de voyage d'exception. L'art de concevoir les évasions les plus secrètes et exclusives aux quatre coins du monde."),
        col1: trBlock('collections', 'title', 'Collections'),
        col2: trBlock('collections', 'subtitle', 'Privées'),
        colDesc: trBlock('collections', 'description', "Nos concierges locaux vous ouvrent les portes des propriétés les plus confidentielles. Explorez nos inspirations du moment."),
        historyTitle: trBlock('history', 'title', 'Notre Histoire.'),
        historyDesc: trBlock('history', 'text', "Luna, fondée par un couple multiculturel, est spécialisée dans les expériences de voyage de luxe."),
    };

    // ── Collections: dynamic from Firestore OR static fallback ──
    const collectionsMedia = [
        {
            images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1200'],
        },
        {
            images: ['https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?q=80&w=1200'],
        },
        {
            images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200'],
        },
        {
            images: [
                '/images/Hollande%20Norveige1.png',
                '/images/Hollande%20Norveige2.png',
                '/images/Hollande%20Norveige3.png'
            ],
            video: '/images/Hollande%20Norveige.mp4?v=2'
        },
    ];

    const defaultCollections = [
        { name: 'Tanzanie Safari VIP', date: '12 – 20 Août 2026', location: 'Tanzanie', description: "Expédition privée au cœur du Serengeti avec lodges exclusifs et survols en montgolfière." },
        { name: 'Retraite Mykonos', date: '02 – 09 Sept 2026', location: 'Grèce', description: "Villa design face à la mer Égée, avec chef privé, yoga au coucher du soleil." },
        { name: 'Japon Ancestral', date: '15 – 28 Oct 2026', location: 'Japon', description: "Ryokans cinq étoiles, rencontres avec des maîtres artisans et immersion culturelle absolue." },
        { name: 'Hollande / Norvège', date: '15 – 26 Fév 2026', location: 'Europe du Nord', description: "Aurores boréales, fjords majestueux et aventure en traîneau privé." },
    ];

    // Use Firestore dynamic collections if available, otherwise fallback to i18n/hardcoded
    const exclusives = dynamicCollections && dynamicCollections.length > 0
        ? dynamicCollections.map((col: any) => ({
            title: col.name,
            date: col.date,
            location: col.location,
            desc: col.description,
            images: col.images || [],
            video: col.video || undefined,
        }))
        : (i18nData?.collections || defaultCollections).map((col: any, i: number) => ({
            title: col.name,
            date: col.date,
            location: col.location,
            desc: col.description,
            images: collectionsMedia[i]?.images || [],
            video: collectionsMedia[i]?.video,
        }));

    // ── Template-aware styles ──
    const template = siteConfig?.template || 'elegance';

    // Template-specific CSS classes and overrides
    const templateStyles = {
        elegance: {
            bg: 'bg-[#fcfcfc]',
            heroBg: 'bg-white/50',
            heroGradient: 'from-[#fcfcfc] via-[#fcfcfc]/80 to-transparent',
            heroText: 'text-[#2E2E2E]',
            heroSubText: 'text-[#2E2E2E]/70',
            sectionBg: 'bg-[#fcfcfc]',
            cardBg: 'bg-white',
            cardShadow: 'shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]',
            borderColor: 'border-gray-100',
            formBg: 'bg-[#fcfcfc]',
            formText: 'text-luna-charcoal',
            btnBg: 'bg-luna-charcoal text-white hover:bg-black',
            selection: 'selection:bg-[#b9dae9] selection:text-white',
            overlayModal: 'bg-[#fcfcfc]/95',
        },
        moderne: {
            bg: 'bg-white',
            heroBg: 'bg-black/20',
            heroGradient: 'from-white via-white/80 to-transparent',
            heroText: 'text-[#1e3a5f]',
            heroSubText: 'text-[#1e3a5f]/60',
            sectionBg: 'bg-white',
            cardBg: 'bg-white',
            cardShadow: 'shadow-[0_4px_24px_rgba(30,58,95,0.06)] hover:shadow-[0_20px_60px_rgba(30,58,95,0.12)]',
            borderColor: 'border-blue-100',
            formBg: 'bg-slate-50',
            formText: 'text-[#1e3a5f]',
            btnBg: 'bg-[#1e3a5f] text-white hover:bg-[#0f2a4a]',
            selection: 'selection:bg-[#63b3ed] selection:text-white',
            overlayModal: 'bg-white/95',
        },
        immersif: {
            bg: 'bg-[#0a0a14]',
            heroBg: 'bg-black/60',
            heroGradient: 'from-[#0a0a14] via-[#0a0a14]/80 to-transparent',
            heroText: 'text-white',
            heroSubText: 'text-white/60',
            sectionBg: 'bg-[#0a0a14]',
            cardBg: 'bg-white/5 backdrop-blur-xl border-white/10',
            cardShadow: 'shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.15)]',
            borderColor: 'border-white/10',
            formBg: 'bg-white/5 backdrop-blur-xl',
            formText: 'text-white',
            btnBg: 'bg-cyan-500 text-white hover:bg-cyan-400',
            selection: 'selection:bg-cyan-500 selection:text-white',
            overlayModal: 'bg-[#0a0a14]/95',
        },
        prestige: {
            bg: 'bg-[#f5efe6]',
            heroBg: 'bg-[#3d3225]/30',
            heroGradient: 'from-[#f5efe6] via-[#f5efe6]/80 to-transparent',
            heroText: 'text-[#3d3225]',
            heroSubText: 'text-[#3d3225]/60',
            sectionBg: 'bg-[#f5efe6]',
            cardBg: 'bg-white',
            cardShadow: 'shadow-[0_4px_30px_rgba(61,50,37,0.06)] hover:shadow-[0_20px_60px_rgba(196,149,106,0.15)]',
            borderColor: 'border-[#c4956a]/15',
            formBg: 'bg-white',
            formText: 'text-[#3d3225]',
            btnBg: 'bg-[#3d3225] text-white hover:bg-[#2a2118]',
            selection: 'selection:bg-[#c4956a] selection:text-white',
            overlayModal: 'bg-[#f5efe6]/95',
        },
    };

    const ts = templateStyles[template as keyof typeof templateStyles] || templateStyles.elegance;

    // ── Template-specific default animations (distinct motion personality per template) ──
    // Élégance  = soft voile blur — like silk lifting
    // Moderne   = clip-path rideau — theater curtain reveal
    // Immersif  = cinéma zoom + blur — camera focusing
    // Prestige  = slow majestic scale — palace doors opening
    const tda: Record<string, Record<string, any>> = {
        elegance: {
            hero:        { initial: { opacity: 0, filter: 'blur(16px)' }, whileInView: { opacity: 1, filter: 'blur(0px)' }, transition: { duration: 2, delay: 0.3, ease: [0.16, 1, 0.3, 1] } },
            heroWord:    { initial: { opacity: 0, y: 30, filter: 'blur(8px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' } },
            collections: { initial: { opacity: 0, y: 50, filter: 'blur(8px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } },
            catalog:     { initial: { opacity: 0, y: 40, filter: 'blur(10px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
            form:        { initial: { opacity: 0, x: -50, filter: 'blur(8px)' }, whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' }, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } },
        },
        moderne: {
            hero:        { initial: { opacity: 0, clipPath: 'inset(100% 0 0 0)' }, whileInView: { opacity: 1, clipPath: 'inset(0% 0 0 0)' }, transition: { duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] } },
            heroWord:    { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 } },
            collections: { initial: { opacity: 0, x: 80, rotate: -2 }, whileInView: { opacity: 1, x: 0, rotate: 0 }, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } },
            catalog:     { initial: { opacity: 0, scale: 0.9, rotate: -1.5 }, whileInView: { opacity: 1, scale: 1, rotate: 0 }, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
            form:        { initial: { opacity: 0, y: 70, scale: 0.93 }, whileInView: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
        },
        immersif: {
            hero:        { initial: { opacity: 0, scale: 1.2, filter: 'blur(25px)' }, whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' }, transition: { duration: 2.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] } },
            heroWord:    { initial: { opacity: 0, y: 50, filter: 'blur(12px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' } },
            collections: { initial: { opacity: 0, y: 100, filter: 'blur(20px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } },
            catalog:     { initial: { opacity: 0, rotateX: -20, y: 60, filter: 'blur(10px)' }, whileInView: { opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)' }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
            form:        { initial: { opacity: 0, scale: 0.85, filter: 'blur(25px)' }, whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' }, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } },
        },
        prestige: {
            hero:        { initial: { opacity: 0, scale: 1.1 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 2.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] } },
            heroWord:    { initial: { opacity: 0, y: 25 }, whileInView: { opacity: 1, y: 0 } },
            collections: { initial: { opacity: 0, y: 60, clipPath: 'inset(0 0 40% 0)' }, whileInView: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } },
            catalog:     { initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 1.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] } },
            form:        { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] } },
        },
    };
    const tdaFor = (section: string) => stripBlur(tda[template]?.[section] || tda.elegance[section]);

    // ── Global style settings from editor ──
    const radiusMap: Record<string, string> = { none: 'rounded-none', sm: 'rounded-lg', lg: 'rounded-2xl', full: 'rounded-full' };
    const spacingMap: Record<string, string> = { compact: 'py-10', normal: 'py-20', relaxed: 'py-32' };
    const radius = radiusMap[siteConfig?.global?.borderRadius || 'lg'] || 'rounded-2xl';
    const sectionPadding = spacingMap[siteConfig?.global?.spacing || 'normal'] || 'py-20';

    // Dynamic style object from editor config
    const editorStyle: React.CSSProperties = {
        '--luna-primary': siteConfig?.global?.primaryColor || '#2E2E2E',
        '--luna-secondary': siteConfig?.global?.secondaryColor || '#b9dae9',
        '--luna-accent': siteConfig?.global?.accentColor || '#E2C8A9',
        '--luna-text': siteConfig?.global?.textColor || '#2E2E2E',
        '--luna-bg': siteConfig?.global?.bgColor || '',
        '--luna-cta': siteConfig?.global?.ctaColor || '#2E2E2E',
        '--luna-heading': siteConfig?.global?.headingColor || siteConfig?.global?.primaryColor || '#2E2E2E',
        '--font-heading': siteConfig?.global?.fontHeading ? `'${siteConfig.global.fontHeading}', serif` : "'Playfair Display', serif",
        '--font-body': siteConfig?.global?.fontBody ? `'${siteConfig.global.fontBody}', sans-serif` : "'Inter', sans-serif",
    } as React.CSSProperties;

    // Build CSS overrides from editor colors (only when custom values are set)
    const g = siteConfig?.global || {};
    const headingCol = g.headingColor || g.primaryColor;
    const heroHeadingCol = heroBlock?.headingColor || headingCol;
    const collectionsCol = collectionsBlock?.headingColor || g.collectionsHeadingColor || headingCol;
    const catalogCol = catalogBlock?.headingColor || g.catalogHeadingColor || headingCol;
    const historyHeadingCol = historyBlock?.headingColor || headingCol;
    const formHeadingCol = formBlock?.headingColor || headingCol;
    const sec = g.secondaryColor || '#b9dae9';
    const accent = g.accentColor || '#E2C8A9';
    const primary = g.primaryColor || '#2E2E2E';
    const colorOverrides = `
        ${g.bgColor ? `
            [data-editor-section="collections"],
            [data-editor-section="catalog"],
            [data-editor-section="form"] { background-color: ${g.bgColor} !important; }
        ` : ''}
        ${g.textColor ? `
            [data-editor-section="collections"] > div p:not([data-no-override]),
            [data-editor-section="catalog"] > div p:not([data-no-override]),
            [data-editor-section="form"] p:not([data-no-override]) { color: ${g.textColor}; }
        ` : ''}
        ${collectionsCol ? `
            h2[data-heading="collections"] { color: ${collectionsCol} !important; }
        ` : ''}
        ${catalogCol ? `
            h2[data-heading="catalog"] { color: ${catalogCol} !important; }
        ` : ''}
        ${g.ctaColor ? `
            [data-editor-section] button[type="submit"],
            [data-editor-section] a.cta-button,
            form button[type="submit"] { background-color: ${g.ctaColor} !important; color: white !important; }
        ` : ''}
        ${g.secondaryColor ? `
            .focus\\:border-\\[\\#b9dae9\\]:focus { border-color: ${sec} !important; }
            .bg-\\[\\#b9dae9\\] { background-color: ${sec} !important; }
            .text-\\[\\#b9dae9\\] { color: ${sec} !important; }
            .border-\\[\\#b9dae9\\] { border-color: ${sec} !important; }
            .hover\\:text-\\[\\#b9dae9\\]:hover { color: ${sec} !important; }
            .hover\\:border-\\[\\#b9dae9\\]:hover { border-color: ${sec} !important; }
            .bg-\\[\\#b9dae9\\]\\/10, .bg-\\[\\#b9dae9\\]\\/20 { background-color: ${sec}1a !important; }
            .border-\\[\\#b9dae9\\]\\/30 { border-color: ${sec}4d !important; }
            .group-hover\\:bg-\\[\\#b9dae9\\]:hover, .peer-focus ~ .bg-\\[\\#b9dae9\\] { background-color: ${sec} !important; }
            input:focus, select:focus, textarea:focus { border-color: ${sec} !important; }
            .peer:focus ~ span { background-color: ${sec} !important; }
        ` : ''}
    `;

    const renderGenericBlock = (block: any, isPredefined = false) => {
                const bHeading = block.headingColor || headingCol || '#2E2E2E';
                const bText = block.textColor || g.textColor || (template === 'immersif' ? 'rgba(255,255,255,0.6)' : '#6b7280');
                const bBg = block.bgColor || '';
                const bBtnColor = block.buttonColor || g.ctaColor || primary;
                const bBtnStyle = block.buttonStyle || 'solid';
        const layout = block.layout || (isPredefined ? 'default' : 'image-right');
        if (isPredefined && layout === 'default') return null;
                const align = block.textAlign || 'left';
                const anim = getBlockAnimation(block.type);
                const overlayOp = (parseInt(block.overlayOpacity || '50') / 100);

                // Section height
                const heightMap: Record<string, string> = { auto: '', small: 'min-h-[40vh]', medium: 'min-h-[60vh]', large: 'min-h-[80vh]', fullscreen: 'min-h-screen' };
                const heightClass = heightMap[block.sectionHeight || 'auto'] || '';

                // Text align
                const alignClass = align === 'center' ? 'text-center items-center' : align === 'right' ? 'text-right items-end' : 'text-left items-start';

                // Button renderer
                const renderBtn = (text: string, url: string, isPrimary = true) => {
                    if (!text) return null;
                    const base = `inline-flex items-center gap-3 px-10 py-4 text-[13px] font-bold uppercase tracking-[0.2em] ${radius} transition-all hover:-translate-y-1`;
                    if (bBtnStyle === 'outline') {
                        return <a href={url || '#'} className={`${base} border-2 shadow-sm hover:shadow-lg`} style={{ borderColor: bBtnColor, color: bBtnColor, backgroundColor: 'transparent' }}>{text} <ChevronRight size={16} /></a>;
                    }
                    if (bBtnStyle === 'ghost') {
                        return <a href={url || '#'} className={`${base} hover:opacity-80`} style={{ color: bBtnColor, backgroundColor: 'transparent' }}>{text} <ChevronRight size={16} /></a>;
                    }
                    // solid
                    return <a href={url || '#'} className={`${base} shadow-lg hover:shadow-xl`} style={{ backgroundColor: bBtnColor, color: 'white' }}>{text} <ChevronRight size={16} /></a>;
                };

                const sectionStyle: React.CSSProperties = bBg ? { backgroundColor: bBg } : {};
                const effectClass = getBlockEffectClass(block.type);
                const cols = parseInt(block.columns || '1');
                const allImages = [block.image, ...(block.images || [])].filter(Boolean);

                // WOW 2026 Stagger Variants
                const staggerContainer = {
                    initial: anim?.initial ? { ...anim.initial, transition: {} } : { opacity: 0 },
                    whileInView: anim?.whileInView ? { 
                        ...anim.whileInView, 
                        transition: { staggerChildren: 0.15, delayChildren: anim?.transition?.delay || 0.1, ...anim?.transition }
                    } : { opacity: 1, transition: { staggerChildren: 0.15 } }
                };
                const itemVariant = {
                    initial: { opacity: 0, y: 40, ...(inIframe ? {} : { filter: 'blur(10px)' }) },
                    whileInView: { opacity: 1, y: 0, ...(inIframe ? {} : { filter: 'blur(0px)' }) },
                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                };

                // ── Layout: HTML Widget ──
                if (layout === 'html') {
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass}`} style={sectionStyle}>
                            <div className="max-w-[1400px] mx-auto px-6 md:px-16">
                                {(block.title || block.subtitle) && (
                                    <motion.div
                                        variants={staggerContainer}
                                        initial="initial"
                                        whileInView="whileInView"
                                        viewport={{ once: true, margin: "-10%" }}
                                        className={`flex flex-col ${alignClass} mb-12`}
                                    >
                                        {block.subtitle && <span className="text-[12px] font-bold uppercase tracking-[0.4em] mb-4 block" style={{ color: `${bText}80` }}>{block.subtitle}</span>}
                                        {block.title && <motion.h2 variants={itemVariant} className="text-[30px] md:text-[50px] leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>}
                                    </motion.div>
                                )}
                                <div className="w-full" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.htmlCode || '') }} />
                            </div>
                        </section>
                    );
                }

                // ── Layout: Gallery grid ──
                if (layout === 'gallery') {
                    const galleryCols = Math.min(cols || 3, 4);
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass}`} style={sectionStyle}>
                            <div className="max-w-[1400px] mx-auto px-6 md:px-16">
                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="whileInView"
                                    viewport={{ once: true, margin: "-10%" }}
                                    className={`flex flex-col ${alignClass} mb-12`}
                                >
                                    {block.subtitle && <span className="text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block" style={{ color: `${bText}80` }}>{block.subtitle}</span>}
                                    <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                    {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed mb-6 max-w-2xl" style={{ color: bText }}>{block.text}</motion.p>}
                                </motion.div>
                                <div className="grid gap-4 md:gap-6" style={{ gridTemplateColumns: `repeat(${galleryCols}, 1fr)` }}>
                                    {allImages.map((img: string, idx: number) => (
                                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.6 }}
                                            className={`${radius} overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 group ${idx === 0 && galleryCols >= 3 ? 'col-span-2 row-span-2' : ''}`}
                                        >
                                            <img src={img} alt="" className={`w-full ${idx === 0 && galleryCols >= 3 ? 'h-full min-h-[300px]' : 'h-[250px] md:h-[300px]'} object-cover group-hover:scale-110 transition-transform duration-700`} />
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div variants={itemVariant} className={`flex flex-wrap gap-4 mt-10 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                    {renderBtn(block.buttonText, block.buttonUrl)}
                                    {renderBtn(block.button2Text, block.button2Url, false)}
                                </motion.div>
                            </div>
                        </section>
                    );
                }

                // ── Layout: Slider (auto-scroll) ──
                if (layout === 'slider') {
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass} overflow-hidden`} style={sectionStyle}>
                            <div className="max-w-[1400px] mx-auto px-6 md:px-16 mb-10">
                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="whileInView"
                                    viewport={{ once: true, margin: "-10%" }}
                                    className={`flex flex-col ${alignClass}`}
                                >
                                    {block.subtitle && <span className="text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block" style={{ color: `${bText}80` }}>{block.subtitle}</span>}
                                    <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                    {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed mb-6 max-w-2xl" style={{ color: bText }}>{block.text}</motion.p>}
                                </motion.div>
                            </div>
                            <div className="relative w-full overflow-hidden">
                                <div className="cb-slider-track">
                                    {[...allImages, ...allImages].map((img: string, idx: number) => (
                                        <div key={idx} className={`shrink-0 w-[350px] md:w-[500px] h-[300px] md:h-[400px] mx-3 ${radius} overflow-hidden shadow-lg`}>
                                            <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <motion.div variants={itemVariant} className={`flex flex-wrap gap-4 mt-10 max-w-[1400px] mx-auto px-6 md:px-16 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                {renderBtn(block.buttonText, block.buttonUrl)}
                                {renderBtn(block.button2Text, block.button2Url, false)}
                            </motion.div>
                        </section>
                    );
                }

                // ── Layout: Column cards ──
                if (layout === 'columns') {
                    const colItems = block.columnItems || [];
                    const colCount = Math.min(parseInt(block.columns || '2'), 4);
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass}`} style={sectionStyle}>
                            <div className="max-w-[1400px] mx-auto px-6 md:px-16">
                                {(block.title || block.subtitle) && (
                                    <motion.div
                                        variants={staggerContainer}
                                        initial="initial"
                                        whileInView="whileInView"
                                        viewport={{ once: true, margin: "-10%" }}
                                        className={`flex flex-col ${alignClass} mb-16`}
                                    >
                                        {block.subtitle && <span className="text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block" style={{ color: `${bText}80` }}>{block.subtitle}</span>}
                                        <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                        {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed max-w-2xl" style={{ color: bText }}>{block.text}</motion.p>}
                                    </motion.div>
                                )}
                                <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                                    {colItems.slice(0, colCount).map((col: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 40 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className={`group ${radius} overflow-hidden bg-white shadow-[0_4px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-2`}
                                        >
                                            {col.image && (
                                                <div className="overflow-hidden h-[220px]">
                                                    <img src={col.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                </div>
                                            )}
                                            <div className="p-8">
                                                {col.title && <h3 className="text-[22px] font-semibold mb-3 leading-tight" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{col.title}</h3>}
                                                {col.text && <p className="text-[14px] font-light leading-relaxed mb-6" style={{ color: bText }}>{col.text}</p>}
                                                {col.buttonText && col.buttonUrl && (
                                                    <a href={col.buttonUrl} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:gap-4"
                                                        style={{ color: bBtnColor }}
                                                    >
                                                        {col.buttonText} <ChevronRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                }

                // ── Layout: Image as full background ──
                if (layout === 'image-bg') {
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`relative w-full ${heightClass || 'min-h-[70vh]'} flex items-center z-10 overflow-hidden ${effectClass}`} style={sectionStyle}>
                            {block.image && <img src={block.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOp})` }} />
                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                whileInView="whileInView"
                                viewport={{ once: true, margin: "-10%" }}
                                className={`relative z-10 max-w-3xl mx-auto px-6 md:px-16 py-20 flex flex-col ${align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center'}`}
                            >
                                {block.subtitle && <motion.span variants={itemVariant} className="text-[12px] font-bold uppercase tracking-[0.4em] text-white/50 mb-6 block">{block.subtitle}</motion.span>}
                                <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)' }}>{block.title}</motion.h2>
                                {block.text && <motion.p variants={itemVariant} className="text-white/70 text-[15px] md:text-[17px] font-light leading-relaxed mb-10 max-w-2xl">{block.text}</motion.p>}
                                <motion.div variants={itemVariant} className="flex flex-wrap gap-4">
                                        {renderBtn(block.buttonText, block.buttonUrl)}
                                        {renderBtn(block.button2Text, block.button2Url, false)}
                                    </motion.div>
                            </motion.div>
                        </section>
                    );
                }

                // ── Layout: Image on top ──
                if (layout === 'image-top') {
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass}`} style={sectionStyle}>
                            <div className="max-w-[1200px] mx-auto px-6 md:px-16">
                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="whileInView"
                                    viewport={{ once: true, margin: "-10%" }}
                                    className={`flex flex-col ${alignClass}`}
                                >
                                    {block.image && (
                                        <div className={`w-full h-[400px] md:h-[500px] ${radius} overflow-hidden mb-12 shadow-xl`}>
                                            <img src={block.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {block.subtitle && <span className={`text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block`} style={{ color: `${bText}80` }}>{block.subtitle}</span>}
                                    <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                    {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed mb-10 max-w-2xl" style={{ color: bText }}>{block.text}</motion.p>}
                                    <motion.div variants={itemVariant} className="flex flex-wrap gap-4">
                                        {renderBtn(block.buttonText, block.buttonUrl)}
                                        {renderBtn(block.button2Text, block.button2Url, false)}
                                    </motion.div>
                                </motion.div>
                            </div>
                        </section>
                    );
                }

                // ── Layout: Text only (no image) ──
                if (layout === 'text-only') {
                    return (
                        <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${heightClass ? 'flex items-center' : ''} ${effectClass}`} style={sectionStyle}>
                            <div className="max-w-[900px] mx-auto px-6 md:px-16">
                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="whileInView"
                                    viewport={{ once: true, margin: "-10%" }}
                                    className={`flex flex-col ${alignClass}`}
                                >
                                    {block.subtitle && (
                                        <div className={`flex items-center gap-6 mb-6 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                            <span className="text-[12px] font-bold uppercase tracking-[0.4em]" style={{ color: `${bText}80` }}>{block.subtitle}</span>
                                            <div className="h-px w-20" style={{ backgroundColor: `${bText}30` }} />
                                        </div>
                                    )}
                                    <motion.h2 variants={itemVariant} className="text-[40px] md:text-[65px] leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                    {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed mb-10 max-w-2xl" style={{ color: bText }}>{block.text}</motion.p>}
                                    <motion.div variants={itemVariant} className="flex flex-wrap gap-4">
                                        {renderBtn(block.buttonText, block.buttonUrl)}
                                        {renderBtn(block.button2Text, block.button2Url, false)}
                                    </motion.div>
                                </motion.div>
                            </div>
                        </section>
                    );
                }

                // ── Layout: image-left / image-right (side by side) ──
                const imgLeft = layout === 'image-left';
                return (
                    <section key={block.id} data-editor-section={block.id} className={`${sectionPadding} w-full z-10 relative ${heightClass} ${effectClass}`} style={sectionStyle}>
                        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
                            <motion.div
                                variants={staggerContainer}
                                initial="initial"
                                whileInView="whileInView"
                                viewport={{ once: true, margin: "-10%" }}
                                className={`flex flex-col ${imgLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}
                            >
                                {/* Image */}
                                {block.image && (
                                    <motion.div variants={itemVariant} className={`w-full lg:w-1/2 h-[350px] md:h-[500px] ${radius} overflow-hidden shadow-xl`}>
                                        <img src={block.image} alt="" className="w-full h-full object-cover" />
                                    </motion.div>
                                )}
                                {/* Content */}
                                <div className={`w-full ${block.image ? 'lg:w-1/2' : ''} flex flex-col ${alignClass}`}>
                                    {block.subtitle && (
                                        <motion.div variants={itemVariant} className={`flex items-center gap-6 mb-6 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                            <span className="text-[12px] font-bold uppercase tracking-[0.4em]" style={{ color: `${bText}80` }}>{block.subtitle}</span>
                                            <div className="h-px w-20" style={{ backgroundColor: `${bText}30` }} />
                                        </motion.div>
                                    )}
                                    <motion.h2 variants={itemVariant} className="text-[35px] md:text-[55px] leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)', color: bHeading }}>{block.title}</motion.h2>
                                    {block.text && <motion.p variants={itemVariant} className="text-[15px] md:text-[17px] font-light leading-relaxed mb-10" style={{ color: bText }}>{block.text}</motion.p>}
                                    <motion.div variants={itemVariant} className="flex flex-wrap gap-4">
                                        {renderBtn(block.buttonText, block.buttonUrl)}
                                        {renderBtn(block.button2Text, block.button2Url, false)}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                );
    };

    // ── Hero Size mapping ──
    const getHeroSizeClass = () => {
        const size = siteConfig?.global?.heroSize;
        if (size === 'medium') return 'h-[60vh]';
        if (size === 'large') return 'h-[80vh]';
        return 'h-screen'; // Default to full
    };

    // ═══ [LEGACY] If GrapesJS HTML is available (published before removal), render it directly ═══
    // Kept for backwards compatibility with any tenants who published via the old Site Builder.
    if (siteConfig?.grapesHtml) {
        // Attach form handler after GrapesJS HTML renders
        const GrapesPage = () => {
            useEffect(() => {
                const form = document.querySelector('form[data-luna-form="contact"], #luna-contact-form') as HTMLFormElement;
                if (!form) return;
                const handler = async (e: Event) => {
                    e.preventDefault();
                    const fd = new FormData(form);
                    const btn = form.querySelector('button[type="submit"], [data-luna="submit"]') as HTMLButtonElement;
                    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours...'; }
                    try {
                        await fetch('/api/conciergerie/contact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lastName: fd.get('lastName') || '',
                                firstName: '',
                                email: fd.get('email') || '',
                                destination: fd.get('destination') || '',
                                notes: fd.get('notes') || '',
                                phone: '', dates: '', budget: '', pax: '2', vibe: '',
                            }),
                        });
                        form.innerHTML = '<div style="text-align:center;padding:40px"><h3 style="font-family:Playfair Display,serif;font-size:28px;color:#2E2E2E;margin-bottom:12px">Merci !</h3><p style="color:#9CA3AF;font-size:14px">Votre demande a bien été envoyée. Notre équipe vous contactera sous 24h.</p></div>';
                    } catch {
                        if (btn) { btn.disabled = false; btn.textContent = 'Envoyer ma demande →'; }
                    }
                };
                form.addEventListener('submit', handler);
                return () => form.removeEventListener('submit', handler);
            }, []);
            return null;
        };

        return (
            <div className="w-full overflow-x-hidden" style={editorStyle}>
                <link rel="stylesheet" href="/css/luna-canvas.css" />
                {siteConfig.grapesCss && (
                    <style dangerouslySetInnerHTML={{ __html: sanitizeCss(siteConfig.grapesCss) }} />
                )}
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(siteConfig.grapesHtml) }} />
                <GrapesPage />
            </div>
        );
    }

    // ── Section reordering via sectionOrder ──
    const conciergerieSectionOrder: string[] = siteConfig?.sectionOrder || ['hero', 'collections', 'divider1', 'catalog', 'divider2', 'form', 'history'];
    // Append custom block IDs not already in the order
    const allCustomIds = (siteConfig?.blocks || []).filter((b: any) => b.id?.startsWith('custom_') && b.visible !== false).map((b: any) => b.id);
    allCustomIds.forEach((cid: string) => { if (!conciergerieSectionOrder.includes(cid)) conciergerieSectionOrder.push(cid); });

    // Reorder DOM sections based on sectionOrder
    useEffect(() => {
        const container = document.getElementById('luna-sections-container');
        if (!container) return;
        // Sort children by sectionOrder using CSS order
        conciergerieSectionOrder.forEach((sectionId, idx) => {
            const el = container.querySelector(`[data-editor-section="${sectionId}"]`);
            // Walk up to direct child of container
            if (el) {
                let target: HTMLElement = el as HTMLElement;
                while (target.parentElement && target.parentElement !== container) {
                    target = target.parentElement;
                }
                target.style.order = String(idx);
            }
        });
    }, [siteConfig?.sectionOrder, configKey]);

    return (
        <div id="luna-sections-container" className={`w-full ${ts.bg} overflow-x-hidden ${ts.selection} flex flex-col`} style={{ ...editorStyle, ...(g.bgColor ? { backgroundColor: g.bgColor } : {}) }}>
            {/* ── Ambient sound toggle — floating bottom-left ── */}
            {!inIframe && (
                <button
                    onClick={() => setAmbientOn(p => !p)}
                    aria-label={ambientOn ? 'Couper le son ambiant' : 'Activer le son ambiant'}
                    className={`fixed bottom-6 left-6 z-[9999] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-xl shadow-lg group hover:scale-110 ${
                        ambientOn
                            ? 'bg-white/90 text-[#2E2E2E] shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
                            : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'
                    }`}
                >
                    {ambientOn ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <line x1="23" y1="9" x2="17" y2="15"/>
                            <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                    )}
                </button>
            )}
            {/* ── Dynamic color overrides from editor Design tab ── */}
            {colorOverrides.trim() && <style dangerouslySetInnerHTML={{ __html: sanitizeCss(colorOverrides) }} />}
            {/* ═══ 1. HERO SECTION ═══ */}
            {(() => {
                if (!isBlockVisible('hero')) return null;
                const blockDef = siteConfig?.blocks?.find((b: any) => b.type === 'hero') || { type: 'hero' };
                if (blockDef.layout && blockDef.layout !== 'default') {
                    return <div key="hero" data-editor-fallback="hero">{renderGenericBlock({ ...blockDef, type: 'hero', id: blockDef.id || 'hero' })}</div>;
                }
                return (
                    <div data-editor-section="hero" className={`relative ${getHeroSizeClass()} w-full top-0 z-0 overflow-hidden`}>
                {/* Background: Single source of truth for hero media — exactly ONE element */}
                {(() => {
                    const blockVideo = heroBlock?.videoUrl;
                    const globalVideo = siteConfig?.global?.heroVideoUrl;
                    const heroImage = heroBlock?.image || siteConfig?.global?.heroImage || '';
                    const imageIsVideo = /\.(mp4|mov|webm)$/i.test(heroImage);

                    // Resolve to exactly ONE source
                    let mediaSrc: string;
                    let mediaType: 'video' | 'image';

                    if (!videoError && (blockVideo || globalVideo)) {
                        mediaSrc = (blockVideo || globalVideo) as string;
                        mediaType = 'video';
                    } else if (heroImage && imageIsVideo) {
                        mediaSrc = heroImage;
                        mediaType = 'video';
                    } else if (heroImage && !imageIsVideo) {
                        mediaSrc = heroImage;
                        mediaType = 'image';
                    } else {
                        // Fallback
                        mediaSrc = '/luna-conciergerie-travel.mp4';
                        mediaType = 'video';
                    }

                    if (mediaType === 'video') {
                        return (
                            <video
                                key={mediaSrc}
                                autoPlay loop muted playsInline
                                poster="/hero-poster.jpg"
                                ref={(el) => { if (el) { el.muted = true; el.volume = 0; } }}
                                onLoadedData={(e) => { const v = e.currentTarget; v.muted = true; v.volume = 0; }}
                                onError={() => setVideoError(true)}
                                className="absolute inset-0 w-full h-full object-cover z-[1]"
                            >
                                <source src={mediaSrc} type="video/mp4" />
                            </video>
                        );
                    }
                    return (
                        <img src={mediaSrc} alt="Hero" className="absolute inset-0 w-full h-full object-cover z-[1]" />
                    );
                })()}

                {/* Overlay for legibility — template-aware */}
                <div className={`absolute inset-0 ${ts.heroBg} z-[2]`} />
                <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${ts.heroGradient} z-[3]`} />

                <motion.div
                    initial={getBlockAnimation('hero')?.initial || tdaFor('hero').initial}
                    animate={getBlockAnimation('hero')?.whileInView || tdaFor('hero').whileInView}
                    transition={getBlockAnimation('hero')?.transition || tdaFor('hero').transition}
                    className={`absolute inset-0 z-[5] px-6 md:px-24 flex ${
                        template === 'moderne'
                            ? 'items-end justify-start pb-24'
                            : template === 'immersif'
                                ? 'items-end justify-center pb-32'
                                : template === 'prestige'
                                    ? 'items-end justify-center pb-40 md:pb-52'
                                    : 'items-center justify-center flex-col'
                    }`}
                >
                    <div className={`${template === 'moderne' ? 'max-w-2xl text-left' : 'max-w-4xl text-center'}`}>
                        {/* Logo — hidden for moderne (shown as badge instead) */}
                        {template !== 'moderne' && (
                            <div className={`mb-8 flex ${template === 'immersif' ? 'justify-center' : 'flex-col items-center'}`}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ delay: template === 'prestige' ? 1.5 : 1.2, duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="inline-flex items-center justify-center"
                                >
                                    <img src={siteConfig?.global?.logo || "/luna-logo-blue.svg"} alt="Luna Conciergerie"
                                        className={`h-[70px] md:h-[120px] ${template === 'immersif' ? 'brightness-200 invert' : 'brightness-0'}`} />
                                </motion.div>
                            </div>
                        )}

                        {/* Moderne badge — clips in from left with spring bounce */}
                        {template === 'moderne' && (
                            <motion.div
                                initial={{ opacity: 0, x: -40, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ delay: 0.6, type: 'spring', damping: 18, stiffness: 120 }}
                                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-full mb-8 shadow-lg"
                            >
                                <img src={siteConfig?.global?.logo || "/luna-logo-blue.svg"} alt="Luna" className="h-6 brightness-0" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1e3a5f]">Conciergerie</span>
                            </motion.div>
                        )}

                        {/* Hero heading: stagger each word for wow effect */}
                        <h1 className={`${ts.heroText} mb-4 leading-[0.9] flex flex-col ${template === 'moderne' ? 'items-start' : 'items-center'}`} style={heroHeadingCol ? { color: heroHeadingCol } : undefined}>
                            <motion.span
                                initial={tdaFor('heroWord').initial}
                                animate={tdaFor('heroWord').whileInView}
                                transition={{ duration: 1.2, delay: template === 'prestige' ? 1.0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className={`block font-extralight text-[45px] md:text-[65px] tracking-tight`}
                                style={{ fontFamily: 'var(--font-body)', ...(heroHeadingCol ? { color: heroHeadingCol } : {}) }}
                            >
                                {localText.hero1}
                            </motion.span>
                            <motion.span
                                initial={tdaFor('heroWord').initial}
                                animate={tdaFor('heroWord').whileInView}
                                transition={{ duration: 1.4, delay: template === 'prestige' ? 1.3 : 0.85, ease: [0.16, 1, 0.3, 1] }}
                                className={`block italic text-[50px] md:text-[80px] leading-[0.9]`}
                                style={{ fontFamily: 'var(--font-heading)', ...(heroHeadingCol ? { color: heroHeadingCol } : {}) }}
                            >
                                {localText.hero2}
                            </motion.span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ delay: template === 'prestige' ? 2.0 : 1.6, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                            className={`${ts.heroSubText} font-sans text-[14px] md:text-[16px] font-light tracking-wide max-w-xl leading-relaxed ${template === 'moderne' ? '' : 'mx-auto text-center'}`}
                        >
                            {localText.heroDesc}
                        </motion.p>
                    </div>
                </motion.div>
            </div>
                );
            })()}



            {/* ═══ 3. VOYAGES EXCLUSIFS (Full width grid) ═══ */}
            {(() => {
                if (!isBlockVisible('collections')) return null;
                const blockDef = siteConfig?.blocks?.find((b: any) => b.type === 'collections') || { type: 'collections' };
                if (blockDef.layout && blockDef.layout !== 'default') {
                    return <div key="collections" data-editor-fallback="collections">{renderGenericBlock({ ...blockDef, type: 'collections', id: blockDef.id || 'collections' })}</div>;
                }
                return (
                    <section data-editor-section="collections" id="destinations" className={`${template === 'prestige' ? 'pt-0 pb-12 md:pb-20' : sectionPadding} w-full mx-auto z-10 relative ${ts.sectionBg} ${getBlockEffectClass('collections')}`}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-16">
                    <div className="flex flex-col mb-16 relative">
                        {/* Decorative bottom-left shadow (portée) */}
                        {template === 'elegance' && <div className="absolute -bottom-6 -left-8 w-[60%] h-24 bg-gradient-to-r from-[#b9dae9]/15 to-transparent rounded-full blur-3xl pointer-events-none" />}
                        <motion.div
                            initial={getBlockAnimation('collections')?.initial || tdaFor('collections').initial}
                            whileInView={getBlockAnimation('collections')?.whileInView || tdaFor('collections').whileInView}
                            viewport={{ once: true }}
                            transition={getBlockAnimation('collections')?.transition || tdaFor('collections').transition}
                        >
                            <div className="flex items-center gap-6 mb-8">
                                <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-cyan-400/50' : template === 'prestige' ? 'text-[#CA8A04]/60' : template === 'moderne' ? 'text-[#1e3a5f]/40' : 'text-luna-charcoal/40'} block`}>{t('dest.subtitle')}</span>
                                <motion.div initial={{ width: 0 }} whileInView={{ width: 128 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className={`h-px ${template === 'immersif' ? 'bg-cyan-400/30' : template === 'prestige' ? 'bg-[#CA8A04]/30' : template === 'moderne' ? 'bg-[#1e3a5f]/20' : 'bg-luna-charcoal/10'}`} />
                            </div>
                            <h2 data-heading="collections" className={`flex flex-col font-light text-[38px] md:text-[60px] leading-[1.1] tracking-tight mb-10`} style={{ fontFamily: 'var(--font-body)', color: template === 'immersif' ? 'white' : (g.collectionsHeadingColor || g.headingColor || '#2E2E2E') }}>
                                <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>{localText.col1}</motion.span>
                                <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="italic leading-[1.1]" style={{ fontFamily: 'var(--font-heading)', color: template === 'prestige' ? '#CA8A04' : template === 'immersif' ? '#22d3ee' : 'var(--luna-secondary, #b9dae9)', opacity: 0.9 }}>{localText.col2}</motion.span>
                            </h2>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl"
                        >
                            <p className={`text-[14px] md:text-[16px] ${template === 'immersif' ? 'text-white/50' : template === 'prestige' ? 'text-[#44403C]/60' : 'text-luna-charcoal/60'} font-light leading-relaxed`}>
                                {localText.colDesc}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* ── IMMERSIF: Horizontal Infinite Carousel ── */}
                {template === 'immersif' ? (
                    <div className="w-full overflow-hidden">
                        <div className="cb-collections-carousel-track">
                            {[...exclusives, ...exclusives].map((dest: any, i: number) => (
                                <div
                                    key={i}
                                    className="shrink-0 w-[350px] md:w-[500px] h-[400px] md:h-[550px] mx-3 rounded-2xl overflow-hidden cursor-pointer group relative border border-white/5 hover:border-cyan-400/40 transition-all duration-700 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
                                    style={{ perspective: '1000px' }}
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <img src={dest.images[0]} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-[2s] ease-out mix-blend-luminosity" alt={dest.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
                                    {/* Neon glow accent line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 text-cyan-400">
                                            <div className="w-8 h-px bg-cyan-400/50" />
                                            <span className="text-[10px] uppercase font-bold tracking-[0.4em]">{dest.date}</span>
                                        </div>
                                        <h3 className="text-[26px] md:text-[36px] text-white leading-tight mb-4 translate-y-3 group-hover:translate-y-0 transition-all duration-700" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[13px] md:text-[14px] text-white/40 font-light leading-relaxed max-w-sm opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                <div className={`w-full ${template === 'elegance' ? 'px-[20px]' : 'px-6 md:px-16 max-w-[1600px] mx-auto'} ${template === 'prestige' ? 'relative z-20 -mt-32 md:-mt-44' : ''}`}>
                    {/* Prestige glass container */}
                    <motion.div
                        className={template === 'prestige' ? 'bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] shadow-[0_8px_60px_rgba(61,50,37,0.08)] border border-[#c4956a]/8 p-5 md:p-10' : ''}
                        {...(template === 'prestige' ? {
                            initial: { opacity: 0, y: 80, backdropFilter: 'blur(0px)' },
                            whileInView: { opacity: 1, y: 0, backdropFilter: 'blur(20px)' },
                            viewport: { once: true, margin: "-100px" },
                            transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] }
                        } : {})}
                    >
                    <div className={
                        template === 'elegance'
                            ? `w-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden ${radius}`
                            : template === 'prestige'
                                ? "w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7"
                                : "w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12"
                    }>
                    {exclusives.map((dest: any, i: number) => {
                        // ── Skin: Elegance — magazine editorial flush grid with breathing hover ──
                        if (template === 'elegance') {
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                                    whileInView={{ opacity: 1, filter: 'blur(0px)' }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 1.4, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative h-[600px] md:h-[800px] overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-[2.5s] ease-out" alt={dest.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-80 group-hover:opacity-95 transition-opacity duration-700" />
                                    <div className="absolute inset-0 p-12 md:p-20 flex flex-col justify-end">
                                        <motion.div className="mb-8 inline-flex px-6 py-2 backdrop-blur-md bg-white/10 border border-white/20 text-[12px] uppercase font-bold tracking-[0.3em] text-white/90 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-150 w-max">
                                            {dest.date}
                                        </motion.div>
                                        <h3 className="italic text-[35px] md:text-[50px] text-white leading-tight mb-6 translate-y-4 group-hover:translate-y-0 transition-all duration-700" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[14px] md:text-[16px] text-white/70 font-sans font-light leading-relaxed max-w-lg translate-y-6 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-200">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }

                        // ── Skin: Prestige — clip-path polaroid reveal + gold accent line ──
                        if (template === 'prestige') {
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 50, clipPath: 'inset(0 0 25% 0)' }}
                                    whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                                    viewport={{ once: true, margin: "-80px" }}
                                    transition={{ duration: 1.2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(61,50,37,0.08)] group-hover:shadow-[0_20px_50px_rgba(61,50,37,0.15)] transition-shadow duration-500">
                                        <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[2s] ease-out" alt={dest.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-[#1C1917]/20 to-transparent" />
                                        {/* Gold accent line — filet d'or qui coule */}
                                        <div className="absolute left-0 bottom-0 w-[3px] h-0 group-hover:h-2/3 bg-gradient-to-t from-[#CA8A04] via-[#CA8A04]/60 to-transparent transition-all duration-1000 ease-out" />
                                        {/* Badge — sceau */}
                                        <motion.div
                                            className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[9px] uppercase font-bold tracking-[0.3em] text-[#1C1917] shadow-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-500"
                                        >
                                            {dest.date}
                                        </motion.div>
                                    </div>
                                    <div className="pt-5 px-1">
                                        <h3 className="text-[22px] md:text-[26px] text-[#1C1917] leading-tight mb-2 group-hover:text-[#CA8A04] transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[13px] text-[#44403C]/60 font-light leading-relaxed line-clamp-2">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }
                        
                        // ── Skin: Moderne — magazine feuilleter with rotate + slide ──
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 60, rotate: -2 }}
                                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 1.1, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className={`group cursor-pointer ${i === 0 ? 'md:col-span-7' : 'md:col-span-5 mt-0 md:mt-32'}`}
                                onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                            >
                                <div className={`relative w-full h-[500px] md:h-[650px] overflow-hidden ${radius} shadow-xl mb-8`}>
                                    <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[2s] ease-out" alt={dest.title} />
                                    {/* Blue accent bar that grows on hover */}
                                    <div className="absolute left-0 top-0 w-[3px] h-0 group-hover:h-full bg-gradient-to-b from-[#1e3a5f] via-[#1e3a5f]/60 to-transparent transition-all duration-700 ease-out" />
                                    <motion.div
                                        className="absolute top-6 left-6 inline-flex px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] uppercase font-bold tracking-[0.3em] text-[#2c3e50] shadow-sm translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
                                    >
                                        {dest.date}
                                    </motion.div>
                                </div>
                                <div className="px-4">
                                    <h3 className="text-[30px] md:text-[40px] text-luna-charcoal leading-tight mb-4 group-hover:text-[#b9dae9] transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                    <p className="text-[14px] md:text-[15px] text-luna-charcoal/60 font-sans font-light leading-relaxed">
                                        {dest.desc}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                </motion.div>
                </div>
                )}
            </section>
                );
            })()}

            {/* DIVIDER 1 */}
            <div data-editor-section="divider1" className="px-[20px]"><ParallaxDivider
                image={siteConfig?.dividers?.divider1?.image || "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000"}
                title={siteConfig?.dividers?.divider1?.title || "L'Art de Recevoir."}
                text={siteConfig?.dividers?.divider1?.text}
            /></div>

            {/* ═══ 4. CONCIERGE SERVICES (Full width layout) ═══ */}
            {(() => {
                if (!isBlockVisible('catalog')) return null;
                const blockDef = siteConfig?.blocks?.find((b: any) => b.type === 'catalog') || { type: 'catalog' };
                if (blockDef.layout && blockDef.layout !== 'default') {
                    return <div key="catalog" data-editor-fallback="catalog">{renderGenericBlock({ ...blockDef, type: 'catalog', id: blockDef.id || 'catalog' })}</div>;
                }
                return (
                    <section data-editor-section="catalog" id="services" className={`${sectionPadding} w-full mx-auto z-10 relative ${ts.sectionBg} ${getBlockEffectClass('catalog')} ${template !== 'prestige' ? `border-t ${ts.borderColor}` : ''}`}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-16">
                    <motion.div
                        initial={getBlockAnimation('catalog')?.initial || tdaFor('catalog').initial}
                        whileInView={getBlockAnimation('catalog')?.whileInView || tdaFor('catalog').whileInView}
                        viewport={{ once: true }}
                        transition={getBlockAnimation('catalog')?.transition || tdaFor('catalog').transition}
                        className="mb-16 max-w-4xl relative"
                    >
                        {/* Decorative bottom-left shadow (portée) */}
                        {template === 'elegance' && <div className="absolute -bottom-6 -left-8 w-[60%] h-24 bg-gradient-to-r from-[#b9dae9]/15 to-transparent rounded-full blur-3xl pointer-events-none" />}
                        <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-cyan-400/50' : template === 'prestige' ? 'text-[#CA8A04]/60' : template === 'moderne' ? 'text-[#1e3a5f]/40' : 'text-luna-charcoal/40'} mb-8 flex items-center gap-6`}>
                            {t('cat.subtitle')}
                            <motion.div initial={{ width: 0 }} whileInView={{ width: 128 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={`h-px ${template === 'immersif' ? 'bg-cyan-400/30' : template === 'prestige' ? 'bg-[#CA8A04]/30' : template === 'moderne' ? 'bg-[#1e3a5f]/20' : 'bg-gray-200'}`} />
                        </span>
                        <h2 data-heading="catalog" className={`flex flex-col italic text-[42px] md:text-[65px] mb-2 leading-[0.9]`} style={{ fontFamily: 'var(--font-heading)', color: template === 'immersif' ? 'white' : (g.catalogHeadingColor || g.headingColor || '#2E2E2E') }}>
                            <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>{trBlock('catalog', 'title', catalogBlock?.title || 'Prestations')}</motion.span>
                            <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="not-italic font-light tracking-tight leading-[0.9]" style={{ fontFamily: 'var(--font-body)', color: template === 'prestige' ? '#CA8A04' : template === 'immersif' ? '#22d3ee' : 'var(--luna-secondary, #b9dae9)', opacity: 0.9 }}>
                                {trBlock('catalog', 'subtitle', catalogBlock?.subtitle || '& Services')}
                            </motion.span>
                        </h2>
                        <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className={`text-[14px] md:text-[16px] font-light ${template === 'immersif' ? 'text-white/50' : template === 'prestige' ? 'text-[#44403C]/60' : 'text-luna-charcoal/60'} leading-relaxed max-w-2xl`}>
                            {trBlock('catalog', 'description', catalogBlock?.description || "Accédez à notre réseau international exclusif. Des villas cachées aux yachts privés, chaque expérience est certifiée par nos équipes.")}
                        </motion.p>
                    </motion.div>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-16 h-16 rounded-full border-2 border-luna-charcoal/10 border-t-blue-900 animate-spin" />
                        </div>
                    ) : catalog.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border border-gray-100">
                            <p className="text-luna-charcoal/40 italic text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>{t('cat.empty')}</p>
                        </div>
                    ) : (() => {
                        // Extract unique types for filter pills
                        const typeMap: Record<string, { label: string; count: number }> = {};
                        catalog.forEach((item: any) => {
                            const key = (item.type || 'EXPERIENCE').toUpperCase();
                            const style = getTypeStyles(key);
                            if (!typeMap[key]) typeMap[key] = { label: style.label, count: 0 };
                            typeMap[key].count++;
                        });
                        const filteredCatalog = catalogFilter === 'all' ? catalog : catalog.filter((item: any) => (item.type || 'EXPERIENCE').toUpperCase() === catalogFilter);

                        return (
                        <>
                        {/* ── Modern Filter Pills ── */}
                        <div className="flex flex-wrap gap-2 mb-10">
                            <button
                                onClick={() => setCatalogFilter('all')}
                                className={`px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-300 ${
                                    catalogFilter === 'all'
                                        ? 'bg-luna-charcoal text-white shadow-lg shadow-luna-charcoal/20'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }`}
                            >
                                Tout <span className="ml-1.5 opacity-60">{catalog.length}</span>
                            </button>
                            {Object.entries(typeMap).map(([key, { label, count }]) => (
                                <button
                                    key={key}
                                    onClick={() => setCatalogFilter(key)}
                                    className={`px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-300 ${
                                        catalogFilter === key
                                            ? 'bg-luna-charcoal text-white shadow-lg shadow-luna-charcoal/20'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                    }`}
                                >
                                    {label} <span className="ml-1.5 opacity-60">{count}</span>
                                </button>
                            ))}
                        </div>

                        <div className={template === 'prestige' ? 'bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] shadow-[0_8px_60px_rgba(61,50,37,0.08)] border border-[#CA8A04]/8 p-5 md:p-10' : ''}>
                        <div className={
                            template === 'elegance'
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                                : template === 'moderne'
                                    ? "grid grid-cols-1 md:grid-cols-2 gap-8"
                                    : template === 'prestige'
                                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7"
                                        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        }>
                            {filteredCatalog.map((rawItem: any, i: number) => {
                                const item = trCatalog(rawItem);
                                const style = getTypeStyles(item.type);
                                const hasImage = item.images && item.images.length > 0;
                                const itemInCart = isInCart(item.id);

                                // ── Skin: Elegance (Vertical Classic) ──
                                if (template === 'elegance') {
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 50, filter: 'blur(8px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: (i % 4) * 0.12, duration: 1.2, ease: [0.16, 1, 0.3, 1] }} onClick={() => setSelectedItem(item)} className={`group relative ${ts.cardBg} overflow-hidden flex flex-col ${radius} transition-all duration-700 cursor-pointer h-[520px] ${ts.cardShadow} hover:-translate-y-3 ${itemInCart ? 'ring-2 ring-[var(--luna-secondary)]/50' : ''}`}>
                                            {itemInCart && (
                                                <div className="absolute top-5 right-5 z-20 bg-[#b9dae9] text-luna-charcoal rounded-full w-9 h-9 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                                </div>
                                            )}
                                            <div className={`absolute inset-0 w-full h-[52%] ${!hasImage ? `bg-gradient-to-br ${style.gradient}` : 'bg-gray-100'} overflow-hidden rounded-t-2xl`}>
                                                {hasImage ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.08] transition-all duration-[2s] ease-out brightness-[0.97] group-hover:brightness-105" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <style.Icon size={48} className="text-white/60 drop-shadow-md" strokeWidth={1} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 h-[53%] bg-white p-7 flex flex-col items-center text-center transform group-hover:-translate-y-2 transition-transform duration-700 ease-out z-10 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#b9dae9] mb-5 border border-[#b9dae9]/30 bg-[#b9dae9]/10 px-4 py-1.5 rounded-full">{style.label}</span>
                                                <h3 className="text-[20px] text-luna-charcoal leading-tight mb-3 group-hover:text-[#b9dae9] transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-luna-charcoal/45 text-[12px] font-light leading-relaxed line-clamp-2 mb-auto w-full xl:max-w-[85%] mx-auto">{item.description || "Une prestation sélectionnée avec un niveau d'exigence maximal, taillée pour vous."}</p>
                                                <div className="w-full pt-5 mt-4 border-t border-gray-100/80 flex items-center justify-between">
                                                    <div className="text-left">
                                                        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-1">{t('cat.from')}</p>
                                                        <p className="font-sans font-light text-[22px] text-luna-charcoal tracking-tight">{item.clientPrice} €</p>
                                                    </div>
                                                    <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center group-hover:bg-[#b9dae9] group-hover:border-[#b9dae9] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#b9dae9]/20 transition-all duration-500 text-luna-charcoal/40">
                                                        <ChevronRight size={18} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // ── Skin: Moderne (Horizontal) ──
                                if (template === 'moderne') {
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, x: 50, rotate: -1.5 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} onClick={() => setSelectedItem(item)} className={`group relative flex flex-row items-stretch gap-0 rounded-2xl bg-white overflow-hidden ${ts.cardShadow} hover:-translate-y-1 transition-all duration-500 cursor-pointer ${itemInCart ? 'ring-2 ring-[#1e3a5f]/40' : ''}`}>
                                            {itemInCart && (
                                                <div className="absolute top-0 right-0 z-20 bg-[#1e3a5f] text-white rounded-bl-2xl rounded-tr-2xl w-10 h-10 flex items-center justify-center shadow-lg">
                                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                                </div>
                                            )}
                                            <div className="w-1/3 min-w-[140px] max-w-[200px] relative shrink-0">
                                                {hasImage ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1.5s] ease-out" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                                                        <style.Icon size={32} className="text-white/60" />
                                                    </div>
                                                )}
                                                {/* Blue accent bar on left */}
                                                <div className="absolute left-0 top-0 w-[3px] h-0 group-hover:h-full bg-gradient-to-b from-[#1e3a5f] via-[#1e3a5f]/60 to-transparent transition-all duration-700 ease-out" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center py-6 px-7">
                                                <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#1e3a5f]/50 mb-2 bg-[#1e3a5f]/5 px-3 py-1 rounded-full w-max">{style.label}</span>
                                                <h3 className="text-[20px] text-[#1e3a5f] leading-tight mb-2 group-hover:text-[#2d6a9f] transition-colors duration-300" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-[#1e3a5f]/40 text-[12px] font-sans font-light leading-relaxed line-clamp-2 mb-4">{item.description || "Une prestation sélectionnée avec un niveau d'exigence maximal, taillée pour vous."}</p>
                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">{t('cat.from')}</span>
                                                        <span className="text-lg text-[#1e3a5f] font-sans font-light">{item.clientPrice} €</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-[#1e3a5f] group-hover:border-[#1e3a5f] group-hover:text-white transition-all duration-500 text-slate-400">
                                                        <ChevronRight size={16} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // ── Skin: Prestige (Premium Warm) ──
                                if (template === 'prestige') {
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 45, clipPath: 'inset(0 0 20% 0)' }} whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: (i % 3) * 0.12, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} onClick={() => setSelectedItem(item)} className={`group cursor-pointer ${itemInCart ? 'ring-2 ring-[#CA8A04]/40 rounded-2xl' : ''}`}>
                                            {itemInCart && (
                                                <div className="absolute top-4 right-4 z-20 bg-[#CA8A04] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                                                    <CheckCircle2 size={14} strokeWidth={2.5} />
                                                </div>
                                            )}
                                            <div className={`relative w-full h-[240px] md:h-[280px] rounded-2xl overflow-hidden ${!hasImage ? `bg-gradient-to-br from-[#FAFAF9] to-[#f0ebe3]` : 'bg-[#FAFAF9]'} shadow-[0_4px_20px_rgba(61,50,37,0.06)] group-hover:shadow-[0_16px_40px_rgba(61,50,37,0.12)] transition-shadow duration-500`}>
                                                {hasImage ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[2s] ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <style.Icon size={40} className="text-[#CA8A04]/30" strokeWidth={1} />
                                                    </div>
                                                )}
                                                {/* Gold accent line on hover */}
                                                <div className="absolute left-0 bottom-0 w-[3px] h-0 group-hover:h-full bg-gradient-to-t from-[#CA8A04] via-[#CA8A04]/60 to-transparent transition-all duration-700 ease-out" />
                                                {/* Type badge */}
                                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[8px] uppercase font-bold tracking-[0.2em] text-[#1C1917] shadow-sm">
                                                    {style.label}
                                                </div>
                                            </div>
                                            <div className="pt-4 px-1">
                                                <h3 className="text-[18px] md:text-[20px] text-[#1C1917] leading-tight mb-1.5 group-hover:text-[#CA8A04] transition-colors duration-400" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-[#44403C]/50 text-[12px] font-light leading-relaxed line-clamp-2 mb-3">{item.description || "Une prestation sélectionnée avec soin."}</p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-[#44403C]/30">{t('cat.from')}</p>
                                                        <p className="font-light text-[20px] text-[#1C1917] tracking-tight">{item.clientPrice} €</p>
                                                    </div>
                                                    <div className="w-9 h-9 rounded-full bg-[#FAFAF9] border border-[#CA8A04]/15 flex items-center justify-center group-hover:bg-[#1C1917] group-hover:border-[#1C1917] group-hover:text-white transition-all duration-400 text-[#44403C]/40">
                                                        <ChevronRight size={16} strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // ── Skin: Immersif (Dark Neo-Noir) ──
                                return (
                                    <motion.div key={item.id} initial={{ opacity: 0, rotateX: -20, y: 60, filter: 'blur(8px)' }} whileInView={{ opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} onClick={() => setSelectedItem(item)} className={`group relative overflow-hidden flex flex-col rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md transition-all duration-700 cursor-pointer h-[500px] hover:border-cyan-500/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.12)] ${itemInCart ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`}>
                                        {itemInCart && (
                                            <div className="absolute top-5 right-5 z-20 bg-cyan-400 text-black rounded-full w-9 h-9 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                                                <CheckCircle2 size={16} strokeWidth={2.5} />
                                            </div>
                                        )}
                                        <div className={`absolute inset-0 w-full h-full ${!hasImage ? `bg-gradient-to-br ${style.gradient} opacity-20` : ''}`}>
                                            {hasImage && (
                                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-[2s] mix-blend-luminosity" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                                        
                                        <div className="absolute inset-0 p-8 flex flex-col">
                                            <div className="mt-auto flex flex-col">
                                                <div className="flex items-center gap-3 mb-4 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                                                    <style.Icon size={16} className="text-cyan-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">{style.label}</span>
                                                </div>
                                                <h3 className="text-[26px] text-white leading-tight mb-4 group-hover:text-cyan-300 transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-white/50 text-[13px] font-light leading-relaxed line-clamp-3 mb-6 transition-colors duration-500 group-hover:text-white/70">{item.description || "Une prestation sélectionnée avec un niveau d'exigence maximal, taillée pour vous."}</p>
                                                <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-auto">
                                                    <div>
                                                        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/40 mb-1">{t('cat.from')}</p>
                                                        <p className="font-sans font-light text-[22px] text-white tracking-tight">{item.clientPrice} €</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 group-hover:bg-cyan-500/20 group-hover:border-cyan-400 group-hover:text-cyan-400 transition-all duration-500">
                                                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        </div>
                        </>
                        );
                    })()}
                </div>
            </section>
                );
            })()}

            {/* DIVIDER 2 */}
            <div data-editor-section="divider2" className="px-[20px]"><ParallaxDivider
                image={siteConfig?.dividers?.divider2?.image || "/images/Conciergerie/paris-eiffel-sunset.png"}
                title={siteConfig?.dividers?.divider2?.title || "L'Excellence à la Française."}
                text={siteConfig?.dividers?.divider2?.text}
            /></div>

            {/* ═══ CUSTOM BLOCKS EFFECTS CSS ═══ */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes cb-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes cb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes cb-morph { 0%,100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; } 50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; } }
                @keyframes cb-spotlight { 0% { background-position: -100% -100%; } 100% { background-position: 200% 200%; } }
                @keyframes cb-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .cb-gradient-shimmer { position: relative; }
                .cb-gradient-shimmer::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); background-size: 200% 100%; animation: cb-shimmer 3s infinite; z-index: 1; pointer-events: none; }
                .cb-neon-border { box-shadow: 0 0 15px rgba(185,218,233,0.3), 0 0 60px rgba(185,218,233,0.1), inset 0 0 15px rgba(185,218,233,0.05); border: 1px solid rgba(185,218,233,0.4); }
                .cb-float { animation: cb-float 6s ease-in-out infinite; }
                .cb-blur-reveal { animation: cb-blur-reveal 1.5s ease-out forwards; }
                @keyframes cb-blur-reveal { 0% { filter: blur(20px); opacity: 0; } 100% { filter: blur(0); opacity: 1; } }
                .cb-grain { position: relative; }
                .cb-grain::after { content: ''; position: absolute; inset: 0; opacity: 0.04; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events: none; z-index: 1; }
                .cb-morph-border { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; animation: cb-morph 8s ease-in-out infinite; overflow: hidden; }
                .cb-spotlight { position: relative; }
                .cb-spotlight::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle 300px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06), transparent); pointer-events: none; z-index: 1; }
                .cb-text-gradient h2 { background: linear-gradient(135deg, var(--luna-secondary, #b9dae9), var(--luna-primary, #2E2E2E), var(--luna-accent, #E2C8A9)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .cb-slider-track { display: flex; animation: cb-slide 20s linear infinite; width: max-content; }
                .cb-slider-track:hover { animation-play-state: paused; }
                .cb-collections-carousel-track { display: flex; animation: cb-slide 30s linear infinite; width: max-content; }
                .cb-collections-carousel-track:hover { animation-play-state: paused; }
            ` }} />

            {/* ═══ CUSTOM BLOCKS ═══ */}
            {(siteConfig?.blocks || []).filter((b: any) => b.id?.startsWith('custom_') && b.visible !== false).map((block: any) => {
                // Check if this block is the first section right after the hero in sectionOrder
                const heroIdx = conciergerieSectionOrder.indexOf('hero');
                const isFirstAfterHero = heroIdx >= 0 && conciergerieSectionOrder[heroIdx + 1] === block.id;
                
                if (isFirstAfterHero) {
                    return (
                        <div key={block.id} className="relative z-20 mx-auto w-[70%]" style={{ marginTop: '-100px' }}>
                            <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] shadow-[0_8px_50px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden">
                                {renderGenericBlock(block, false)}
                            </div>
                        </div>
                    );
                }
                return renderGenericBlock(block, false);
            })}

            {/* ═══ 5. TAILOR MADE FORM ═══ */}
            {(() => {
                if (!isBlockVisible('form')) return null;
                const blockDef = siteConfig?.blocks?.find((b: any) => b.type === 'form') || { type: 'form' };
                if (blockDef.layout && blockDef.layout !== 'default') {
                    return <div key="form" data-editor-fallback="form">{renderGenericBlock({ ...blockDef, type: 'form', id: blockDef.id || 'form' })}</div>;
                }
                return (
                    <section data-editor-section="form" id="tailor-made" className={`${sectionPadding} w-full mx-auto z-10 ${ts.sectionBg} ${getBlockEffectClass('form')}`}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    input:-webkit-autofill,
                    input:-webkit-autofill:hover, 
                    input:-webkit-autofill:focus, 
                    textarea:-webkit-autofill,
                    textarea:-webkit-autofill:hover,
                    textarea:-webkit-autofill:focus,
                    select:-webkit-autofill,
                    select:-webkit-autofill:hover,
                    select:-webkit-autofill:focus {
                        -webkit-box-shadow: 0 0 0px 1000px #fcfcfc inset;
                        transition: background-color 5000s ease-in-out 0s;
                    }
                `}} />

                <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex flex-col lg:flex-row gap-16 lg:gap-24 w-full">
                    {/* Editorial Description Column */}
                    <motion.div
                        initial={getBlockAnimation('form')?.initial || tdaFor('form').initial}
                        whileInView={getBlockAnimation('form')?.whileInView || tdaFor('form').whileInView}
                        viewport={{ once: true }}
                        transition={getBlockAnimation('form')?.transition || tdaFor('form').transition}
                        className="lg:w-4/12 flex flex-col justify-center"
                    >
                        <div className="flex items-center gap-6 mb-8">
                            <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-cyan-400/50' : template === 'prestige' ? 'text-[#CA8A04]/60' : template === 'moderne' ? 'text-[#1e3a5f]/40' : 'text-luna-charcoal/40'} block`}>CRÉATION SUR-MESURE</span>
                            <motion.div initial={{ width: 0 }} whileInView={{ width: 128 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={`h-px ${template === 'immersif' ? 'bg-cyan-400/30' : template === 'prestige' ? 'bg-[#CA8A04]/30' : template === 'moderne' ? 'bg-[#1e3a5f]/20' : 'bg-luna-charcoal/10'}`} />
                        </div>
                        <h2 data-heading="form" className={`flex flex-col font-light text-[45px] md:text-[75px] tracking-tight leading-[0.9] mb-2`} style={{ fontFamily: 'var(--font-body)', color: template === 'immersif' ? 'white' : (formHeadingCol || '#2E2E2E') }}>
                            <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>{trBlock('form', 'title', formBlock?.title || 'Le Voyage')}</motion.span>
                            <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="italic leading-[0.9]" style={{ fontFamily: 'var(--font-heading)', color: template === 'prestige' ? '#CA8A04' : template === 'immersif' ? '#22d3ee' : 'var(--luna-secondary, #b9dae9)' }}>{trBlock('form', 'subtitle', 'Absolu.')}</motion.span>
                        </h2>
                        <p className={`text-[14px] md:text-[16px] ${template === 'immersif' ? 'text-white/50' : 'text-luna-charcoal/60'} font-light leading-relaxed xl:max-w-md`}>
                            {trBlock('form', 'description', t('form.subtitle'))}
                        </p>
                    </motion.div>

                    {/* Form Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:w-7/12"
                    >
                        <div className={`${
                            template === 'moderne' ? 'bg-white border border-blue-100 rounded-2xl shadow-[0_20px_60px_rgba(30,58,95,0.08)] p-10 md:p-16' :
                            template === 'immersif' ? 'bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-10 md:p-16' :
                            template === 'prestige' ? 'bg-[#FAFAF9] border border-[#CA8A04]/10 rounded-[2rem] p-10 md:p-20' :
                            `${ts.formBg} border ${ts.borderColor} p-10 md:p-20`
                        } shadow-[0_40px_100px_rgba(0,0,0,0.02)] relative w-full`}>
                            {!isSent ? (
                                <form onSubmit={handleFormSubmit} className="relative z-10 font-sans w-full">
                                    {/* Honeypot anti-spam — invisible to humans, bots auto-fill it */}
                                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                                        <label htmlFor="_hp_website">Website</label>
                                        <input type="text" id="_hp_website" name="_hp_website" tabIndex={-1} autoComplete="off"
                                            value={formData._hp_website} onChange={e => setFormData(p => ({ ...p, _hp_website: e.target.value }))} />
                                    </div>

                                    {/* ── MODERNE: Card form with floating labels & icons ── */}
                                    {template === 'moderne' ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="relative">
                                                    <input required placeholder=" " type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none peer" />
                                                    <label className="absolute left-5 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-translate-y-7 peer-focus:text-[10px] peer-focus:text-[#1e3a5f] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest">{t('form.firstname')}</label>
                                                </div>
                                                <div className="relative">
                                                    <input required placeholder=" " type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none peer" />
                                                    <label className="absolute left-5 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-translate-y-7 peer-focus:text-[10px] peer-focus:text-[#1e3a5f] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest">{t('form.lastname')}</label>
                                                </div>
                                                <div className="relative">
                                                    <input required placeholder=" " type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none peer" />
                                                    <label className="absolute left-5 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-translate-y-7 peer-focus:text-[10px] peer-focus:text-[#1e3a5f] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest">{t('form.email')}</label>
                                                </div>
                                                <div className="relative">
                                                    <input required placeholder=" " type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none peer" />
                                                    <label className="absolute left-5 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-translate-y-7 peer-focus:text-[10px] peer-focus:text-[#1e3a5f] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest">{t('form.phone')}</label>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <input required placeholder={t('form.destination')} type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none" />
                                                <input required type="date" value={formData.dates} onChange={e => setFormData({ ...formData, dates: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none appearance-none">
                                                    <option value="" disabled hidden>{t('form.budget')}</option>
                                                    <option value="5k-10k">5K - 10K €</option><option value="10k-25k">10K - 25K €</option><option value="25k-50k">25K - 50K €</option><option value="50k+">50K+ €</option>
                                                </select>
                                                <select value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none appearance-none">
                                                    <option value="1">1 Pax</option><option value="2">2 Pax</option><option value="3">3 Pax</option><option value="4">4 Pax</option><option value="5">5 Pax</option><option value="6+">6+ Pax</option>
                                                </select>
                                                <select value={formData.vibe} onChange={e => setFormData({ ...formData, vibe: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none appearance-none">
                                                    <option value="" disabled hidden>{t('form.vibe')}</option>
                                                    <option value="Relax & Beach">Relax & Beach</option><option value="Adventure">Adventure</option><option value="Culture & Heritage">Culture & Heritage</option><option value="Full Party VIP">Full Party VIP</option>
                                                </select>
                                            </div>
                                            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 h-32 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white transition-all outline-none resize-none text-[14px] text-[#1e3a5f] placeholder-slate-400" placeholder={t('form.notes_ph')} />
                                            <button type="submit" disabled={isSending}
                                                className="w-full bg-[#1e3a5f] text-white rounded-xl py-5 text-[13px] uppercase font-bold tracking-[0.2em] hover:bg-[#0f2a4a] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                {isSending ? t('form.sending') : t('form.btn')}
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>

                                    /* ── IMMERSIF: Glassmorphism neon form ── */
                                    ) : template === 'immersif' ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {[
                                                    { ph: t('form.firstname'), val: formData.firstName, key: 'firstName' },
                                                    { ph: t('form.lastname'), val: formData.lastName, key: 'lastName' },
                                                    { ph: t('form.email'), val: formData.email, key: 'email', type: 'email' },
                                                    { ph: t('form.phone'), val: formData.phone, key: 'phone', type: 'tel' },
                                                ].map(f => (
                                                    <input key={f.key} required placeholder={f.ph} type={f.type || 'text'} value={f.val}
                                                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                        className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white placeholder-white/30 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:bg-white/[0.08] transition-all outline-none backdrop-blur-sm" />
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <input required placeholder={t('form.destination')} type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white placeholder-white/30 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:bg-white/[0.08] transition-all outline-none backdrop-blur-sm" />
                                                <input required type="date" value={formData.dates} onChange={e => setFormData({ ...formData, dates: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:bg-white/[0.08] transition-all outline-none backdrop-blur-sm" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white/80 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all outline-none appearance-none backdrop-blur-sm">
                                                    <option value="" disabled hidden className="bg-[#0a0a14] text-white">{t('form.budget')}</option>
                                                    <option value="5k-10k" className="bg-[#0a0a14]">5K - 10K €</option><option value="10k-25k" className="bg-[#0a0a14]">10K - 25K €</option><option value="25k-50k" className="bg-[#0a0a14]">25K - 50K €</option><option value="50k+" className="bg-[#0a0a14]">50K+ €</option>
                                                </select>
                                                <select value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white/80 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all outline-none appearance-none backdrop-blur-sm">
                                                    <option value="1" className="bg-[#0a0a14]">1 Pax</option><option value="2" className="bg-[#0a0a14]">2 Pax</option><option value="3" className="bg-[#0a0a14]">3 Pax</option><option value="4" className="bg-[#0a0a14]">4 Pax</option><option value="5" className="bg-[#0a0a14]">5 Pax</option><option value="6+" className="bg-[#0a0a14]">6+ Pax</option>
                                                </select>
                                                <select value={formData.vibe} onChange={e => setFormData({ ...formData, vibe: e.target.value })}
                                                    className="w-full px-5 py-4 bg-white/[0.05] border border-white/10 rounded-lg text-[14px] text-white/80 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all outline-none appearance-none backdrop-blur-sm">
                                                    <option value="" disabled hidden className="bg-[#0a0a14]">{t('form.vibe')}</option>
                                                    <option value="Relax & Beach" className="bg-[#0a0a14]">Relax & Beach</option><option value="Adventure" className="bg-[#0a0a14]">Adventure</option><option value="Culture & Heritage" className="bg-[#0a0a14]">Culture & Heritage</option><option value="Full Party VIP" className="bg-[#0a0a14]">Full Party VIP</option>
                                                </select>
                                            </div>
                                            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full bg-white/[0.05] border border-white/10 rounded-lg p-5 h-36 text-[14px] text-white placeholder-white/20 focus:border-cyan-400/60 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:bg-white/[0.08] transition-all outline-none resize-none backdrop-blur-sm" placeholder={t('form.notes_ph')} />
                                            <button type="submit" disabled={isSending}
                                                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#0a0a14] rounded-lg py-5 text-[13px] uppercase font-extrabold tracking-[0.2em] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                {isSending ? t('form.sending') : t('form.btn')}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>

                                    /* ── PRESTIGE: Luxury pill inputs with gold accent ── */
                                    ) : template === 'prestige' ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[
                                                    { ph: t('form.firstname'), val: formData.firstName, key: 'firstName' },
                                                    { ph: t('form.lastname'), val: formData.lastName, key: 'lastName' },
                                                    { ph: t('form.email'), val: formData.email, key: 'email', type: 'email' },
                                                    { ph: t('form.phone'), val: formData.phone, key: 'phone', type: 'tel' },
                                                ].map(f => (
                                                    <div key={f.key} className="space-y-2">
                                                        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>{f.ph}</label>
                                                        <input required placeholder={f.ph} type={f.type || 'text'} value={f.val}
                                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                            className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] placeholder-[#BEB5A8] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>{t('form.destination')}</label>
                                                    <input required placeholder={t('form.destination')} type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] placeholder-[#BEB5A8] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>{t('form.dates')}</label>
                                                    <input required type="date" value={formData.dates} onChange={e => setFormData({ ...formData, dates: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>{t('form.budget')}</label>
                                                    <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none appearance-none">
                                                        <option value="" disabled hidden>{t('form.budget')}</option>
                                                        <option value="5k-10k">5K - 10K €</option><option value="10k-25k">10K - 25K €</option><option value="25k-50k">25K - 50K €</option><option value="50k+">50K+ €</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>Voyageurs</label>
                                                    <select value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none appearance-none">
                                                        <option value="1">1 Pax</option><option value="2">2 Pax</option><option value="3">3 Pax</option><option value="4">4 Pax</option><option value="5">5 Pax</option><option value="6+">6+ Pax</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>Ambiance</label>
                                                    <select value={formData.vibe} onChange={e => setFormData({ ...formData, vibe: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full text-[14px] text-[#3d3225] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none appearance-none">
                                                        <option value="" disabled hidden>{t('form.vibe')}</option>
                                                        <option value="Relax & Beach">Relax & Beach</option><option value="Adventure">Adventure</option><option value="Culture & Heritage">Culture & Heritage</option><option value="Full Party VIP">Full Party VIP</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B7355]" style={{ fontFamily: 'var(--font-heading)' }}>Notes</label>
                                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                    className="w-full bg-[#FAF8F5] border border-[#E8DFD3] rounded-2xl p-6 h-36 text-[14px] text-[#3d3225] placeholder-[#BEB5A8] focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/10 focus:bg-white transition-all outline-none resize-none" placeholder={t('form.notes_ph')} />
                                            </div>
                                            <button type="submit" disabled={isSending}
                                                className="w-full bg-[#1C1917] text-white rounded-full py-5 text-[13px] uppercase font-bold tracking-[0.3em] hover:bg-[#CA8A04] hover:shadow-[0_20px_60px_rgba(202,138,4,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                                {isSending ? t('form.sending') : t('form.btn')}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>

                                    /* ── ÉLÉGANCE: Classic underline inputs (default) ── */
                                    ) : (
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 w-full">
                                                <div className="relative group w-full">
                                                    <input required placeholder={t('form.firstname')} type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light placeholder-gray-400 ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <input required placeholder={t('form.lastname')} type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light placeholder-gray-400 ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <input required placeholder={t('form.email')} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light placeholder-gray-400 ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <input required placeholder={t('form.phone')} type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light placeholder-gray-400 ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 pt-6 w-full">
                                                <div className="relative group w-full">
                                                    <input required placeholder={t('form.destination')} type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light placeholder-gray-400 ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <label className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400 block mb-4">{t('form.dates')}</label>
                                                    <input required type="date" value={formData.dates} onChange={e => setFormData({ ...formData, dates: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} peer`} />
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-12 pt-6 w-full">
                                                <div className="relative group w-full">
                                                    <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} appearance-none peer relative z-10 rounded-none`}>
                                                        <option value="" disabled hidden className="text-gray-400">{t('form.budget')}</option>
                                                        <option value="5k-10k">5K - 10K €</option><option value="10k-25k">10K - 25K €</option><option value="25k-50k">25K - 50K €</option><option value="50k+">50K+ €</option>
                                                    </select>
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <select value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} appearance-none peer relative z-10 rounded-none`}>
                                                        <option value="1">1 Pax</option><option value="2">2 Pax</option><option value="3">3 Pax</option><option value="4">4 Pax</option><option value="5">5 Pax</option><option value="6+">6+ Pax</option>
                                                    </select>
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                                </div>
                                                <div className="relative group w-full">
                                                    <select value={formData.vibe} onChange={e => setFormData({ ...formData, vibe: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} appearance-none peer relative z-10 rounded-none`}>
                                                        <option value="" disabled selected hidden className="text-gray-400">{t('form.vibe')}</option>
                                                        <option value="Relax & Beach">Relax & Beach</option><option value="Adventure">Adventure</option><option value="Culture & Heritage">Culture & Heritage</option><option value="Full Party VIP">Full Party VIP</option>
                                                    </select>
                                                    <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                                </div>
                                            </div>
                                            <div className="pt-8 w-full">
                                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`w-full ${ts.formBg} border ${ts.borderColor} p-8 h-48 hover:border-[#b9dae9] focus:border-[#b9dae9] focus:outline-none transition-all duration-300 resize-none text-[14px] font-light ${ts.formText} placeholder-gray-400`} placeholder={t('form.notes_ph')} />
                                            </div>
                                            <div className="pt-10 flex justify-end w-full">
                                                <button type="submit" disabled={isSending} className={`w-full md:w-auto ${ts.btnBg} ${radius} transition-all shadow-xl hover:-translate-y-1 px-14 py-6 text-[14px] uppercase font-bold tracking-[0.3em] flex items-center justify-center gap-6 disabled:opacity-50 group`}>
                                                    {isSending ? t('form.sending') : t('form.btn')}
                                                    <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32 px-6 w-full">
                                    <div className={`w-32 h-32 ${template === 'immersif' ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' : template === 'prestige' ? 'bg-[#CA8A04]/10 text-[#CA8A04] border-[#CA8A04]/20' : 'bg-[#b9dae9]/20 text-[#b9dae9] border-[#b9dae9]/30'} flex items-center justify-center mx-auto mb-12 border ${template === 'prestige' ? 'rounded-full' : template === 'moderne' ? 'rounded-2xl' : ''}`}>
                                        <CheckCircle2 size={50} strokeWidth={1} />
                                    </div>
                                    <h3 className={`italic text-6xl mb-8 ${template === 'immersif' ? 'text-white' : 'text-luna-charcoal'}`} style={{ fontFamily: 'var(--font-heading)' }}>{t('form.success')}</h3>
                                    <p className={`font-light text-[22px] leading-relaxed max-w-xl mx-auto ${template === 'immersif' ? 'text-white/50' : 'text-luna-charcoal/60'}`}>{t('form.success_desc')}</p>
                                    <button onClick={() => setIsSent(false)} className={`mt-20 text-[13px] font-bold uppercase tracking-[0.3em] border-b pb-2 transition-all ${template === 'immersif' ? 'text-white/40 border-white/20 hover:text-cyan-400 hover:border-cyan-400' : template === 'prestige' ? 'text-[#8B7355] border-[#CA8A04]/20 hover:text-[#CA8A04] hover:border-[#CA8A04]' : 'text-gray-400 hover:text-[#b9dae9] border-gray-300 hover:border-[#b9dae9]'}`}>{t('form.another')}</button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
                );
            })()}

            {/* ═══ PUCK EDITOR RENDERER ═══ */}
            {siteConfig?.puckData?.content?.length > 0 && (
                <div className="relative z-10 bg-white w-full">
                    <Render config={lunaConfig as any} data={siteConfig.puckData} />
                </div>
            )}


            {/* ═══ HISTORY SECTION ═══ */}
            {(() => {
                if (!isBlockVisible('history')) return null;
                const blockDef = siteConfig?.blocks?.find((b: any) => b.type === 'history') || { type: 'history' };
                if (blockDef.layout && blockDef.layout !== 'default') {
                    return <div key="history" data-editor-fallback="history">{renderGenericBlock({ ...blockDef, type: 'history', id: blockDef.id || 'history' })}</div>;
                }
                return (
                    <section data-editor-section="history" className={`relative w-full ${ts.sectionBg} z-10 pb-0 border-t ${ts.borderColor} px-[20px] ${getBlockEffectClass('history')}`}>
                <ParallaxDivider
                    image={historyBlock?.image || "/creators.jpg"}
                    title={trBlock('history', 'title', historyBlock?.title || localText.historyTitle)}
                    text={trBlock('history', 'text', historyBlock?.text || localText.historyDesc)}
                    headingColor={historyHeadingCol}
                    textColor={historyBlock?.textColor}
                />
            </section>
                );
            })()}

            {/* ═══ PRESTATION MODAL ═══ */}
            <AnimatePresence>
                {
                    selectedItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-[#fcfcfc]/95 backdrop-blur-3xl"
                                onClick={() => setSelectedItem(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-white w-full max-w-[1400px] xl:max-w-[1600px] relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[70vh]"
                            >
                                {/* Image Side */}
                                <div className="w-full md:w-1/2 relative min-h-[400px] md:min-h-full bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {(() => {
                                        const mediaItems: { type: 'video' | 'image', src: string }[] = [];
                                        if ((selectedItem as any).video) mediaItems.push({ type: 'video', src: (selectedItem as any).video });
                                        if (selectedItem.images) selectedItem.images.forEach(img => mediaItems.push({ type: 'image', src: img }));

                                        if (mediaItems.length === 0) {
                                            return (
                                                <div className={`absolute inset-0 bg-gradient-to-br ${getTypeStyles(selectedItem.type).gradient} flex items-center justify-center`}>
                                                    <UtensilsCrossed size={100} className="text-white/50" />
                                                </div>
                                            );
                                        }

                                        return (
                                            <>
                                                {mediaItems.map((media, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: idx === currentImageIndex ? 1 : 0 }}
                                                        transition={{ duration: 0.8 }}
                                                        className="absolute inset-0 w-full h-full"
                                                        style={{ pointerEvents: idx === currentImageIndex ? 'auto' : 'none', zIndex: idx === currentImageIndex ? 10 : 0 }}
                                                    >
                                                        {media.type === 'video' ? (
                                                            <video autoPlay loop muted playsInline className="w-full h-full object-cover"
                                                                ref={(el) => { if (el) { el.muted = true; el.volume = 0; } }}
                                                                onLoadedData={(e) => { const v = e.currentTarget; v.muted = true; v.volume = 0; }}>
                                                                <source src={media.src} type="video/mp4" />
                                                            </video>
                                                        ) : (
                                                            <img src={media.src} alt="" className="w-full h-full object-cover" />
                                                        )}
                                                    </motion.div>
                                                ))}
                                                {mediaItems.length > 1 && (
                                                    <div className="absolute inset-x-0 bottom-10 flex justify-center gap-3 z-20">
                                                        {mediaItems.map((_: any, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setCurrentImageIndex(idx)}
                                                                className={`w-12 h-1 transition-all duration-500 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/60'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    <div className="absolute top-12 left-12">
                                        <span className="bg-white/95 backdrop-blur-md text-luna-charcoal font-bold text-[12px] uppercase tracking-[0.3em] px-8 py-4 shadow-xl">
                                            {getTypeStyles(selectedItem.type).label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Side */}
                                <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col relative bg-white">
                                    <button onClick={() => { setSelectedItem(null); setCurrentImageIndex(0); }} className="absolute top-12 right-12 w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-white hover:bg-black transition-all duration-300 shadow-sm z-20">
                                        <X size={28} strokeWidth={1} />
                                    </button>

                                    <div className="flex-1 mt-10">
                                        <div className="flex items-center gap-4 text-gray-400 text-[13px] uppercase tracking-[0.3em] font-bold mb-10">
                                            <MapPin size={18} /> {selectedItem.location || 'Destination Secrète'}
                                        </div>
                                        <h2 className="text-5xl md:text-[70px] text-luna-charcoal mb-10 leading-[1.05]" style={{ fontFamily: 'var(--font-heading)' }}>{selectedItem.name}</h2>
                                        <p className="text-gray-500 font-light text-[20px] leading-relaxed mb-16 xl:max-w-xl">
                                            {selectedItem.description}
                                        </p>

                                        <div className="py-10 border-t border-b border-gray-100 mb-16">
                                            <span className="text-[12px] uppercase tracking-[0.3em] text-gray-400 font-bold block mb-4">{t('cat.client_price')}</span>
                                            <span className="text-6xl font-sans font-light tracking-tight text-luna-charcoal">{selectedItem.clientPrice} €</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        {selectedItem && isInCart(selectedItem.id || selectedItem.name) ? (
                                            <button
                                                onClick={() => {
                                                    removeFromCart(selectedItem.id || selectedItem.name);
                                                }}
                                                className="w-full py-8 bg-red-500/10 border-2 border-red-400 text-red-600 font-bold text-[15px] tracking-[0.3em] uppercase hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm flex items-center justify-center gap-6 group"
                                            >
                                                <X size={22} /> Retirer du panier
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (selectedItem) {
                                                        addToCart({
                                                            id: selectedItem.id || selectedItem.name,
                                                            type: selectedItem.type,
                                                            name: selectedItem.name,
                                                            location: selectedItem.location,
                                                            description: selectedItem.description,
                                                            clientPrice: selectedItem.clientPrice,
                                                            images: selectedItem.images,
                                                            video: (selectedItem as any).video
                                                        });
                                                    }
                                                }}
                                                className="w-full py-8 text-white font-bold text-[15px] tracking-[0.3em] uppercase hover:opacity-90 transition-all duration-500 shadow-xl flex items-center justify-center gap-6 group"
                                                style={{ backgroundColor: g.modalColor || g.ctaColor || '#2E2E2E' }}
                                            >
                                                <CheckCircle2 size={22} /> {t('cat.add')}
                                            </button>
                                        )}
                                        {cart.length > 0 && (
                                            <button
                                                onClick={() => router.push('/client')}
                                                className="w-full py-5 text-white font-bold text-[13px] tracking-[0.3em] uppercase hover:opacity-90 transition-all duration-500 flex items-center justify-center gap-4 group"
                                                style={{ backgroundColor: g.modalColor || g.ctaColor || '#2E2E2E' }}
                                            >
                                                Continuer ({cart.length} prestation{cart.length > 1 ? 's' : ''}) <ChevronRight size={18} className="group-hover:translate-x-3 transition-transform duration-500" />
                                            </button>
                                        )}
                                        <p className="text-center italic text-[16px] text-gray-400 mt-4" style={{ fontFamily: 'var(--font-heading)' }}>{t('cat.disclaimer')}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>

            {/* ═══ FLOATING CART BAR ═══ */}
            <AnimatePresence>
                {cart.length > 0 && !selectedItem && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 max-w-2xl w-[90vw]"
                        style={{ backgroundColor: `${g.modalColor || '#2E2E2E'}f0` }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#b9dae9] mb-1">
                                {cart.length} prestation{cart.length > 1 ? 's' : ''} sélectionnée{cart.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-white/60 text-xs truncate">
                                {cart.map(c => c.name).join(' • ')}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/client')}
                            className="px-6 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shrink-0 flex items-center gap-2"
                            style={{ backgroundColor: sec }}
                        >
                            Continuer <ChevronRight size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
