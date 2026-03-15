'use client';

import { useEffect, useState, useRef } from 'react';
import { sanitizeHtml, sanitizeCss } from '@/src/lib/sanitize';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Car, UtensilsCrossed, MapPin, Hotel, CheckCircle2, X } from 'lucide-react';
import { useLang } from './LangContext';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';

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

const ParallaxDivider = ({ image, title, text }: { image: string, title?: string, text?: string }) => {
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
                        className="text-white text-[45px] md:text-[65px] lg:text-[75px] italic drop-shadow-2xl font-light tracking-tight leading-tight mb-6"
                        style={{ fontFamily: 'var(--font-heading)' }}
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
                        className="text-white/90 text-[14px] md:text-[18px] font-light max-w-3xl mx-auto leading-relaxed"
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [videoError, setVideoError] = useState(false);

    // Tailor-Made Form State
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        destination: '', dates: '', budget: '', pax: '2', vibe: '', notes: ''
    });
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [siteConfig, setSiteConfig] = useState<any>(null);
    const [i18nData, setI18nData] = useState<any>(null);
    const [dynamicCollections, setDynamicCollections] = useState<any[] | null>(null);

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

        // Speed mapping
        const speedMap: Record<string, number> = { slow: 1.6, normal: 0.8, fast: 0.35 };
        const duration = speedMap[block?.animationSpeed || 'normal'] || 0.8;
        const delay = block?.animationDelay ? parseInt(block.animationDelay) / 1000 : 0;

        const map: Record<string, any> = {
            fadeIn: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration, delay } },
            slideUp: { initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration, delay } },
            slideDown: { initial: { opacity: 0, y: -50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration, delay } },
            slideLeft: { initial: { opacity: 0, x: 50 }, whileInView: { opacity: 1, x: 0 }, transition: { duration, delay } },
            slideRight: { initial: { opacity: 0, x: -50 }, whileInView: { opacity: 1, x: 0 }, transition: { duration, delay } },
            scaleIn: { initial: { opacity: 0, scale: 0.8 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration, delay } },
            bounceIn: { initial: { opacity: 0, scale: 0.3 }, whileInView: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 200, delay } },
            flipIn: { initial: { opacity: 0, rotateY: 90 }, whileInView: { opacity: 1, rotateY: 0 }, transition: { duration, delay } },
        };
        return map[animId] || {};
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
        };
        return effectMap[effect] || '';
    };

    // ── Cart helper ──
    const isInCart = (id: string) => cart.some(c => c.id === id);

    useEffect(() => {
        fetch('/api/crm/site-config')
            .then(res => res.json())
            .then(data => setSiteConfig(data))
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
            if (e.data?.type === 'editor-update-config' && e.data.config) {
                setSiteConfig(e.data.config);
            }
        };
        window.addEventListener('message', handleConfigUpdate);
        
        const style = document.createElement('style');
        style.textContent = `
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
        if (customValue) return customValue;

        if (!i18nData?.blocks?.[blockType]?.[field]) return fallback;
        return i18nData.blocks[blockType][field];
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
            heroBg: 'bg-[#1e3a5f]/30',
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
    const colorOverrides = `
        ${g.bgColor ? `[data-editor-section] { background-color: ${g.bgColor} !important; }` : ''}
        ${g.textColor ? `
            [data-editor-section] h1, [data-editor-section] h2, [data-editor-section] h3,
            [data-editor-section] p, [data-editor-section] span { color: ${g.textColor}; }
        ` : ''}
        ${headingCol ? `
            [data-editor-section] h1, [data-editor-section] h2, [data-editor-section] h3 { color: ${headingCol} !important; }
        ` : ''}
        ${g.ctaColor ? `
            [data-editor-section] button[type="submit"],
            [data-editor-section] a.cta-button,
            form button[type="submit"] { background-color: ${g.ctaColor} !important; }
        ` : ''}
        ${g.secondaryColor ? `
            [data-editor-section] .border-[#b9dae9],
            [data-editor-section] .bg-\\[\\#b9dae9\\] { border-color: ${g.secondaryColor}; background-color: ${g.secondaryColor}; }
        ` : ''}
    `;

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

    return (
        <div className={`w-full ${ts.bg} overflow-x-hidden ${ts.selection}`} style={{ ...editorStyle, ...(g.bgColor ? { backgroundColor: g.bgColor } : {}) }}>
            {/* ── Dynamic color overrides from editor Design tab ── */}
            {colorOverrides.trim() && <style dangerouslySetInnerHTML={{ __html: sanitizeCss(colorOverrides) }} />}
            {/* ═══ 1. HERO SECTION ═══ */}
            {isBlockVisible('hero') && <div data-editor-section="hero" className={`relative ${getHeroSizeClass()} w-full top-0 z-0`}>
                {/* Background: Use editor image if set, otherwise video */}
                {heroBlock?.image && !heroBlock.image.endsWith('.mp4') ? (
                    <img
                        src={heroBlock.image}
                        alt="Hero"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                ) : (!videoError && (heroBlock?.videoUrl || siteConfig?.global?.heroVideoUrl)) ? (
                    <video
                        key={heroBlock?.videoUrl || siteConfig.global.heroVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => setVideoError(true)}
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-100"
                    >
                        <source
                            src={heroBlock?.videoUrl || siteConfig.global.heroVideoUrl}
                            type="video/mp4"
                            onError={() => setVideoError(true)}
                        />
                    </video>
                ) : (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-100"
                    >
                        <source src="/luna-conciergerie-travel.mp4" type="video/mp4" />
                    </video>
                )}

                {/* Overlay for legibility — template-aware */}
                <div className={`absolute inset-0 ${ts.heroBg} z-0`} />
                <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${ts.heroGradient} z-0`} />

                <motion.div
                    initial={getBlockAnimation('hero')?.initial || { opacity: 0, y: 40 }}
                    animate={getBlockAnimation('hero')?.whileInView || { opacity: 1, y: 0 }}
                    transition={getBlockAnimation('hero')?.transition || { duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute inset-0 z-10 px-6 md:px-24 flex ${
                        template === 'moderne'
                            ? 'items-end justify-start pb-24'
                            : template === 'immersif'
                                ? 'items-end justify-center pb-32'
                                : 'items-center justify-center flex-col'
                    }`}
                >
                    <div className={`${template === 'moderne' ? 'max-w-2xl text-left' : 'max-w-4xl text-center'}`}>
                        {/* Logo — hidden for moderne (shown as badge instead) */}
                        {template !== 'moderne' && (
                            <div className={`mb-8 flex ${template === 'immersif' ? 'justify-center' : 'flex-col items-center'}`}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, duration: 2 }}
                                    className="inline-flex items-center justify-center"
                                >
                                    <img src={siteConfig?.global?.logo || "/luna-logo-blue.svg"} alt="Luna Conciergerie"
                                        className={`h-[70px] md:h-[120px] ${template === 'immersif' ? 'brightness-200 invert' : 'brightness-0'}`} />
                                </motion.div>
                            </div>
                        )}

                        {/* Moderne badge */}
                        {template === 'moderne' && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 1.5 }}
                                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-full mb-8 shadow-lg">
                                <img src={siteConfig?.global?.logo || "/luna-logo-blue.svg"} alt="Luna" className="h-6 brightness-0" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1e3a5f]">Conciergerie</span>
                            </motion.div>
                        )}

                        <h1 className={`${ts.heroText} mb-4 leading-[0.9] flex flex-col ${template === 'moderne' ? 'items-start' : 'items-center'}`}>
                            <span className={`block font-extralight text-[45px] md:text-[65px] tracking-tight`} style={{ fontFamily: 'var(--font-body)' }}>{localText.hero1}</span>
                            <span className={`block italic text-[50px] md:text-[80px] ${ts.heroText} leading-[0.9]`} style={{ fontFamily: 'var(--font-heading)' }}>{localText.hero2}</span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 1.5 }}
                            className={`${ts.heroSubText} font-sans text-[14px] md:text-[16px] font-light tracking-wide max-w-xl leading-relaxed ${template === 'moderne' ? '' : 'mx-auto text-center'}`}
                        >
                            {localText.heroDesc}
                        </motion.p>
                    </div>
                </motion.div>
            </div>}



            {/* ═══ 3. VOYAGES EXCLUSIFS (Full width grid) ═══ */}
            {isBlockVisible('collections') && <section data-editor-section="collections" id="destinations" className={`${sectionPadding} w-full mx-auto z-10 relative ${ts.sectionBg} ${getBlockEffectClass('collections')}`}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-16">
                    <div className="flex flex-col mb-16">
                        <motion.div
                            initial={getBlockAnimation('collections')?.initial || { opacity: 0, y: 30 }}
                            whileInView={getBlockAnimation('collections')?.whileInView || { opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={getBlockAnimation('collections')?.transition || { duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="flex items-center gap-6 mb-8">
                                <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-white/30' : 'text-luna-charcoal/40'} block`}>{t('dest.subtitle')}</span>
                                <div className={`h-px w-32 ${template === 'immersif' ? 'bg-white/10' : 'bg-luna-charcoal/10'}`} />
                            </div>
                            <h2 className={`flex flex-col font-light text-[45px] md:text-[75px] leading-[1.1] tracking-tight ${template === 'immersif' ? 'text-white' : 'text-luna-charcoal'} mb-10`} style={{ fontFamily: 'var(--font-body)' }}>
                                <span>{localText.col1}</span>
                                <span className="italic leading-[1.1]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--luna-secondary, #b9dae9)', opacity: 0.9 }}>{localText.col2}</span>
                            </h2>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl"
                        >
                            <p className="text-[14px] md:text-[16px] text-luna-charcoal/60 font-light leading-relaxed">
                                {localText.colDesc}
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className={`w-full ${template === 'elegance' ? 'px-[20px]' : 'px-6 md:px-16 max-w-[1600px] mx-auto'}`}>
                    <div className={
                        template === 'elegance'
                            ? `w-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden ${radius}`
                            : template === 'moderne'
                                ? "w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12"
                                : "w-full grid grid-cols-1 md:grid-cols-2 gap-6"
                    }>
                    {exclusives.map((dest: any, i: number) => {
                        // ── Skin: Elegance ──
                        if (template === 'elegance') {
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 1.2 }}
                                    className="group relative h-[600px] md:h-[800px] overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" alt={dest.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-80 group-hover:opacity-95 transition-opacity duration-700" />
                                    <div className="absolute inset-0 p-12 md:p-20 flex flex-col justify-end">
                                        <motion.div className="mb-8 inline-flex px-6 py-2 backdrop-blur-md bg-white/10 border border-white/20 text-[12px] uppercase font-bold tracking-[0.3em] text-white/90 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-100 w-max">
                                            {dest.date}
                                        </motion.div>
                                        <h3 className="italic text-[35px] md:text-[50px] text-white leading-tight mb-6 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[14px] md:text-[16px] text-white/70 font-sans font-light leading-relaxed max-w-lg transform translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }

                        // ── Skin: Prestige ──
                        if (template === 'prestige') {
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 1.2, delay: i * 0.15 }}
                                    className={`group relative overflow-hidden cursor-pointer ${i % 2 === 0 ? 'h-[550px] md:h-[700px]' : 'h-[450px] md:h-[600px] mt-0 md:mt-20'}`}
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[2.5s] ease-out" alt={dest.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#3d3225]/90 via-[#3d3225]/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-700" />
                                    <div className="absolute left-0 bottom-0 w-1 h-1/3 bg-gradient-to-t from-[#c4956a] to-transparent" />
                                    <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                                            <div className="w-10 h-px bg-[#c4956a]/60" />
                                            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#c4956a]">{dest.date}</span>
                                        </div>
                                        <h3 className="text-[32px] md:text-[45px] text-white leading-tight mb-4 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[14px] text-white/60 font-light leading-relaxed max-w-lg opacity-0 transform translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }
                        
                        // ── Skin: Moderne ──
                        if (template === 'moderne') {
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 1 }}
                                    className={`group cursor-pointer ${i === 0 ? 'md:col-span-7' : 'md:col-span-5 mt-0 md:mt-32'}`}
                                    onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                                >
                                    <div className={`relative w-full h-[500px] md:h-[650px] overflow-hidden ${radius} shadow-xl mb-8`}>
                                        <img src={dest.images[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out" alt={dest.title} />
                                        <div className="absolute top-6 left-6 inline-flex px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] uppercase font-bold tracking-[0.3em] text-[#2c3e50] shadow-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                            {dest.date}
                                        </div>
                                    </div>
                                    <div className="px-4">
                                        <h3 className="text-[30px] md:text-[40px] text-luna-charcoal leading-tight mb-4 group-hover:text-[#b9dae9] transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                        <p className="text-[14px] md:text-[15px] text-luna-charcoal/60 font-sans font-light leading-relaxed">
                                            {dest.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        }

                        // ── Skin: Immersif ──
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 1.2 }}
                                className={`group relative h-[500px] md:h-[700px] overflow-hidden cursor-pointer rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-700`}
                                onClick={() => setSelectedItem({ id: dest.title, type: 'activity', name: dest.title, location: dest.location, description: dest.desc, clientPrice: 'Sur mesure' as any, images: dest.images, video: (dest as any).video } as any)}
                            >
                                <img src={dest.images[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-[2s] ease-out mix-blend-luminosity" alt={dest.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                                
                                <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-end">
                                    <div className="flex items-center gap-4 mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 text-cyan-400">
                                        <div className="w-8 h-px bg-cyan-400/50" />
                                        <span className="text-[10px] uppercase font-bold tracking-[0.4em]">{dest.date}</span>
                                    </div>
                                    <h3 className="text-[32px] md:text-[45px] text-white leading-tight mb-6 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700" style={{ fontFamily: 'var(--font-heading)' }}>{dest.title}</h3>
                                    <p className="text-[14px] md:text-[15px] text-white/50 font-sans font-light leading-relaxed max-w-md opacity-0 transform translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                                        {dest.desc}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div></div>
            </section>}

            {/* DIVIDER 1 */}
            <div data-editor-section="divider1" className="px-[20px]"><ParallaxDivider
                image={siteConfig?.dividers?.divider1?.image || "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000"}
                title={siteConfig?.dividers?.divider1?.title || "L'Art de Recevoir."}
            /></div>

            {/* ═══ 4. CONCIERGE SERVICES (Full width layout) ═══ */}
            {isBlockVisible('catalog') && <section data-editor-section="catalog" id="services" className={`${sectionPadding} w-full mx-auto z-10 relative ${ts.sectionBg} ${getBlockEffectClass('catalog')} border-t ${ts.borderColor}`}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-16">
                    <motion.div
                        initial={getBlockAnimation('catalog')?.initial || { opacity: 0, y: 30 }}
                        whileInView={getBlockAnimation('catalog')?.whileInView || { opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={getBlockAnimation('catalog')?.transition || { duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-16 max-w-4xl"
                    >
                        <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-white/30' : 'text-luna-charcoal/40'} mb-8 flex items-center gap-6`}>
                            {t('cat.subtitle')}
                            <div className="w-32 h-px bg-gray-200" />
                        </span>
                        <h2 className={`flex flex-col italic text-[50px] md:text-[80px] ${template === 'immersif' ? 'text-white' : 'text-luna-charcoal'} mb-2 leading-[0.9]`} style={{ fontFamily: 'var(--font-heading)' }}>
                            <span>{trBlock('catalog', 'title', catalogBlock?.title || 'Prestations')}</span>
                            <span className="not-italic font-light tracking-tight leading-[0.9]" style={{ fontFamily: 'var(--font-body)', color: 'var(--luna-secondary, #b9dae9)', opacity: 0.9 }}>
                                {trBlock('catalog', 'subtitle', catalogBlock?.subtitle || '& Services')}
                            </span>
                        </h2>
                        <p className={`text-[14px] md:text-[16px] font-light ${template === 'immersif' ? 'text-white/50' : 'text-luna-charcoal/60'} leading-relaxed max-w-2xl`}>
                            {trBlock('catalog', 'description', catalogBlock?.description || "Accédez à notre réseau international exclusif. Des villas cachées aux yachts privés, chaque expérience est certifiée par nos équipes.")}
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-16 h-16 rounded-full border-2 border-luna-charcoal/10 border-t-blue-900 animate-spin" />
                        </div>
                    ) : catalog.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border border-gray-100">
                            <p className="text-luna-charcoal/40 italic text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>{t('cat.empty')}</p>
                        </div>
                    ) : (
                        <div className={
                            template === 'elegance'
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                                : template === 'moderne'
                                    ? "grid grid-cols-1 md:grid-cols-2 gap-8"
                                    : template === 'prestige'
                                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                                        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        }>
                            {catalog.map((rawItem, i) => {
                                const item = trCatalog(rawItem);
                                const style = getTypeStyles(item.type);
                                const hasImage = item.images && item.images.length > 0;
                                const itemInCart = isInCart(item.id);

                                // ── Skin: Elegance (Vertical Classic) ──
                                if (template === 'elegance') {
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: (i % 4) * 0.12, duration: 0.9 }} onClick={() => setSelectedItem(item)} className={`group relative ${ts.cardBg} overflow-hidden flex flex-col ${radius} transition-all duration-700 cursor-pointer h-[520px] ${ts.cardShadow} hover:-translate-y-2 ${itemInCart ? 'ring-2 ring-[var(--luna-secondary)]/50' : ''}`}>
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
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }} onClick={() => setSelectedItem(item)} className={`group relative flex flex-row items-center gap-6 p-4 rounded-3xl bg-white ${ts.cardShadow} hover:-translate-y-1 transition-all duration-500 cursor-pointer ${itemInCart ? 'ring-2 ring-[var(--luna-secondary)]/50' : ''}`}>
                                            {itemInCart && (
                                                <div className="absolute top-0 right-0 z-20 bg-indigo-500 text-white rounded-bl-3xl rounded-tr-3xl w-10 h-10 flex items-center justify-center shadow-lg">
                                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                                </div>
                                            )}
                                            <div className="w-1/3 min-w-[120px] max-w-[160px] h-[160px] rounded-2xl overflow-hidden relative shrink-0">
                                                {hasImage ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1.5s] ease-out" />
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                                                        <style.Icon size={32} className="text-white/60" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
                                            </div>
                                            <div className="flex-1 flex flex-col py-2 pr-2">
                                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#b9dae9] mb-2">{style.label}</span>
                                                <h3 className="text-[22px] text-luna-charcoal leading-tight mb-2 group-hover:text-[#b9dae9] transition-colors duration-300" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-luna-charcoal/50 text-[13px] font-sans font-light leading-relaxed line-clamp-2 mb-4">{item.description || "Une prestation sélectionnée avec un niveau d'exigence maximal, taillée pour vous."}</p>
                                                <div className="flex items-center gap-4 mt-auto">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">{t('cat.from')}</span>
                                                        <span className="text-lg text-luna-charcoal font-sans">{item.clientPrice} €</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // ── Skin: Prestige (Warm Vertical) ──
                                if (template === 'prestige') {
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: (i % 3) * 0.1, duration: 0.9 }} onClick={() => setSelectedItem(item)} className={`group relative bg-white overflow-hidden flex flex-col ${radius} transition-all duration-700 cursor-pointer h-[520px] shadow-[0_4px_30px_rgba(61,50,37,0.06)] hover:shadow-[0_20px_60px_rgba(196,149,106,0.15)] hover:-translate-y-2 ${itemInCart ? 'ring-2 ring-[#c4956a]/50' : ''}`}>
                                            {itemInCart && (
                                                <div className="absolute top-5 right-5 z-20 bg-[#c4956a] text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                                </div>
                                            )}
                                            <div className={`relative w-full h-[55%] ${!hasImage ? `bg-gradient-to-br from-[#f5efe6] to-[#ede4d4]` : 'bg-[#f5efe6]'} overflow-hidden`}>
                                                {hasImage ? (
                                                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-all duration-[2s] ease-out" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <style.Icon size={48} className="text-[#c4956a]/40" strokeWidth={1} />
                                                    </div>
                                                )}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c4956a] via-[#c4956a]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            </div>
                                            <div className="flex-1 p-7 flex flex-col">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#c4956a] mb-3">{style.label}</span>
                                                <h3 className="text-[20px] text-[#3d3225] leading-tight mb-2 group-hover:text-[#c4956a] transition-colors duration-500" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                                                <p className="text-[#3d3225]/45 text-[12px] font-light leading-relaxed line-clamp-2 mb-auto">{item.description || "Une prestation sélectionnée avec soin."}</p>
                                                <div className="w-full pt-4 mt-3 border-t border-[#c4956a]/10 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#3d3225]/30 mb-1">{t('cat.from')}</p>
                                                        <p className="font-light text-[22px] text-[#3d3225] tracking-tight">{item.clientPrice} €</p>
                                                    </div>
                                                    <div className="w-11 h-11 rounded-xl bg-[#f5efe6] border border-[#c4956a]/15 flex items-center justify-center group-hover:bg-[#c4956a] group-hover:border-[#c4956a] group-hover:text-white transition-all duration-500 text-[#3d3225]/40">
                                                        <ChevronRight size={18} strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // ── Skin: Immersif (Dark Neo-Noir) ──
                                return (
                                    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }} onClick={() => setSelectedItem(item)} className={`group relative overflow-hidden flex flex-col rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md transition-all duration-700 cursor-pointer h-[500px] hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] ${itemInCart ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`}>
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
                    )}
                </div>
            </section>}

            {/* DIVIDER 2 */}
            <div data-editor-section="divider2" className="px-[20px]"><ParallaxDivider
                image={siteConfig?.dividers?.divider2?.image || "/images/Conciergerie/paris-eiffel-sunset.png"}
                title={siteConfig?.dividers?.divider2?.title || "L'Excellence à la Française."}
            /></div>

            {/* ═══ 5. TAILOR MADE FORM ═══ */}
            {isBlockVisible('form') && <section data-editor-section="form" id="tailor-made" className={`${sectionPadding} w-full mx-auto z-10 ${ts.sectionBg} ${getBlockEffectClass('form')}`}>
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
                        initial={getBlockAnimation('form')?.initial || { opacity: 0, x: -30 }}
                        whileInView={getBlockAnimation('form')?.whileInView || { opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={getBlockAnimation('form')?.transition || { duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:w-4/12 flex flex-col justify-center"
                    >
                        <div className="flex items-center gap-6 mb-8">
                            <span className={`text-[12px] font-bold uppercase tracking-[0.4em] ${template === 'immersif' ? 'text-white/30' : 'text-luna-charcoal/40'} block`}>CRÉATION SUR-MESURE</span>
                            <div className={`h-px w-32 ${template === 'immersif' ? 'bg-white/10' : 'bg-luna-charcoal/10'}`} />
                        </div>
                        <h2 className={`flex flex-col font-light text-[45px] md:text-[75px] ${template === 'immersif' ? 'text-white' : 'text-luna-charcoal'} tracking-tight leading-[0.9] mb-2`} style={{ fontFamily: 'var(--font-body)' }}>
                            <span>{trBlock('form', 'title', formBlock?.title || 'Le Voyage')}</span>
                            <span className="italic leading-[0.9]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--luna-secondary, #b9dae9)' }}>{trBlock('form', 'subtitle', 'Absolu.')}</span>
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
                        <div className={`${ts.formBg} border ${ts.borderColor} p-10 md:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.02)] relative w-full ${template === 'immersif' ? 'rounded-2xl' : ''}`}>
                            {!isSent ? (
                                <form onSubmit={handleFormSubmit} className="relative z-10 space-y-12 font-sans w-full">
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
                                                <option value="" disabled selected hidden className="text-gray-400">{t('form.budget')}</option>
                                                <option value="5k-10k">5K - 10K €</option>
                                                <option value="10k-25k">10K - 25K €</option>
                                                <option value="25k-50k">25K - 50K €</option>
                                                <option value="50k+">50K+ €</option>
                                            </select>
                                            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                        </div>
                                        <div className="relative group w-full">
                                            <select value={formData.pax} onChange={e => setFormData({ ...formData, pax: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} appearance-none peer relative z-10 rounded-none`}>
                                                <option value="1">1 Pax</option>
                                                <option value="2">2 Pax</option>
                                                <option value="3">3 Pax</option>
                                                <option value="4">4 Pax</option>
                                                <option value="5">5 Pax</option>
                                                <option value="6+">6+ Pax</option>
                                            </select>
                                            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                        </div>
                                        <div className="relative group w-full">
                                            <select value={formData.vibe} onChange={e => setFormData({ ...formData, vibe: e.target.value })} className={`w-full bg-transparent border-b ${ts.borderColor} pb-5 focus:border-[#b9dae9] focus:outline-none transition-all text-[14px] font-light ${ts.formText} appearance-none peer relative z-10 rounded-none`}>
                                                <option value="" disabled selected hidden className="text-gray-400">{t('form.vibe')}</option>
                                                <option value="Relax & Beach">Relax & Beach</option>
                                                <option value="Adventure">Adventure</option>
                                                <option value="Culture & Heritage">Culture & Heritage</option>
                                                <option value="Full Party VIP">Full Party VIP</option>
                                            </select>
                                            <span className="absolute bottom-0 left-0 w-0 h-px bg-[#b9dae9] transition-all duration-500 peer-focus:w-full z-20" />
                                        </div>
                                    </div>

                                    <div className="pt-8 w-full">
                                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`w-full ${ts.formBg} border ${ts.borderColor} p-8 h-48 hover:border-[#b9dae9] focus:border-[#b9dae9] focus:outline-none transition-all duration-300 resize-none text-[14px] font-light ${ts.formText} placeholder-gray-400`} placeholder={t('form.notes_ph')} />
                                    </div>

                                    <div className="pt-10 flex justify-end w-full">
                                        <button type="submit" disabled={isSending} className={`w-full md:w-auto ${ts.btnBg} transition-all shadow-xl hover:-translate-y-1 px-14 py-6 text-[14px] uppercase font-bold tracking-[0.3em] flex items-center justify-center gap-6 disabled:opacity-50 group ${radius}`}>
                                            {isSending ? t('form.sending') : t('form.btn')}
                                            <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32 px-6 w-full">
                                    <div className="w-32 h-32 bg-[#b9dae9]/20/50 text-[#b9dae9] flex items-center justify-center mx-auto mb-12 border border-[#b9dae9]/30">
                                        <CheckCircle2 size={50} strokeWidth={1} />
                                    </div>
                                    <h3 className="italic text-6xl text-luna-charcoal mb-8" style={{ fontFamily: 'var(--font-heading)' }}>{t('form.success')}</h3>
                                    <p className="text-luna-charcoal/60 font-light text-[22px] leading-relaxed max-w-xl mx-auto">{t('form.success_desc')}</p>
                                    <button onClick={() => setIsSent(false)} className="mt-20 text-[13px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-[#b9dae9] border-b border-gray-300 hover:border-[#b9dae9] pb-2 transition-all">{t('form.another')}</button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>}

            {/* ═══ HISTORY SECTION ═══ */}
            {isBlockVisible('history') && <section data-editor-section="history" className={`relative w-full ${ts.sectionBg} z-10 pb-0 border-t ${ts.borderColor} px-[20px] ${getBlockEffectClass('history')}`}>
                <ParallaxDivider
                    image={historyBlock?.image || "/creators.jpg"}
                    title={trBlock('history', 'title', historyBlock?.title || localText.historyTitle)}
                    text={trBlock('history', 'text', historyBlock?.text || localText.historyDesc)}
                />
            </section>}

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
                                                            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
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
                                                className="w-full py-8 bg-black text-white font-bold text-[15px] tracking-[0.3em] uppercase hover:bg-[#b9dae9] transition-all duration-500 shadow-xl flex items-center justify-center gap-6 group"
                                            >
                                                <CheckCircle2 size={22} /> {t('cat.add')}
                                            </button>
                                        )}
                                        {cart.length > 0 && (
                                            <button
                                                onClick={() => router.push('/client')}
                                                className="w-full py-5 bg-[#b9dae9] text-luna-charcoal font-bold text-[13px] tracking-[0.3em] uppercase hover:bg-[#a0cee0] transition-all duration-500 flex items-center justify-center gap-4 group"
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
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-luna-charcoal/95 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 max-w-2xl w-[90vw]"
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
                            className="px-6 py-3 bg-[#b9dae9] text-luna-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#a0cee0] transition-all shrink-0 flex items-center gap-2"
                        >
                            Continuer <ChevronRight size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
