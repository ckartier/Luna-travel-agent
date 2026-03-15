'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, Sparkles, ArrowRight, Eye, Palette, Loader2,
    Layout, Grid3X3, Maximize, Pencil
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Template {
    id: string;
    name: string;
    description: string;
    gradient: string;
    style: string;
    features: string[];
    preview: { heroLayout: string; cardStyle: string; animation: string; colorScheme: string };
}

const TEMPLATES: Template[] = [
    {
        id: 'elegance', name: 'Élégance',
        description: 'Design editorial luxe avec grande typographie, parallax dividers et transitions fluides. Idéal pour les conciergeries haut de gamme.',
        gradient: 'from-amber-50 via-[#faf8f5] to-amber-50', style: 'Luxe & Editorial',
        features: ['Hero plein écran avec vidéo', 'Typographie serif premium', 'Parallax scroll dividers', 'Cards catalogue avec overlay', 'Palette tons chauds dorés', 'Animations fade-in subtiles'],
        preview: { heroLayout: 'Full-screen centered', cardStyle: 'Overlay gradient', animation: 'Fade + Parallax', colorScheme: 'Warm gold & cream' },
    },
    {
        id: 'moderne', name: 'Moderne',
        description: 'Layout split-screen audacieux, cards horizontales, animations slide-in et design géométrique. Pour les agences dynamiques et innovantes.',
        gradient: 'from-sky-50 via-white to-violet-50', style: 'Clean & Dynamic',
        features: ['Hero split-screen (texte + image)', 'Sans-serif moderne et bold', 'Cards horizontales avec image', 'Grille asymétrique', 'Palette froide bleu-violet', 'Animations slide-in latérales'],
        preview: { heroLayout: 'Split-screen 50/50', cardStyle: 'Horizontal + image left', animation: 'Slide-in + Scale', colorScheme: 'Cool blue & lavender' },
    },
    {
        id: 'immersif', name: 'Immersif',
        description: 'Sections plein écran, dark mode natif, transitions de scroll avancées et effets glassmorphism. Expérience cinématique.',
        gradient: 'from-gray-900 via-[#1a1a2e] to-gray-900', style: 'Cinematic & Dark',
        features: ['Hero fullscreen + vidéo auto-play', 'Dark mode natif élégant', 'Sections snap-to-scroll', 'Effets glassmorphism', 'Palette sombre + néon accents', 'Scroll-linked animations'],
        preview: { heroLayout: 'Full-bleed immersive', cardStyle: 'Glass card + blur', animation: 'Scroll-linked + Reveal', colorScheme: 'Dark + neon accents' },
    },
    {
        id: 'prestige', name: 'Prestige',
        description: "Palette chaude crème et terracotta, typographie serif raffinée, grille masonry décalée. L'élégance intemporelle pour les conciergeries premium.",
        gradient: 'from-[#f5efe6] via-[#f0e8da] to-[#ede4d4]', style: 'Warm & Refined',
        features: ['Hero centré avec texte superposé', 'Typographie serif Cormorant Garamond', 'Grille masonry décalée', 'Cards verticales avec bordure dorée', 'Palette crème, terracotta, olive', 'Animations reveal organiques'],
        preview: { heroLayout: 'Centered overlay', cardStyle: 'Vertical + gold border', animation: 'Reveal + Stagger', colorScheme: 'Cream, terracotta & olive' },
    },
];

const TEMPLATE_DEFAULTS: Record<string, {
    primaryColor: string; secondaryColor: string; accentColor: string;
    fontHeading: string; fontBody: string;
}> = {
    elegance: { primaryColor: '#2E2E2E', secondaryColor: '#b9dae9', accentColor: '#E2C8A9', fontHeading: 'Playfair Display', fontBody: 'Inter' },
    moderne: { primaryColor: '#1e3a5f', secondaryColor: '#63b3ed', accentColor: '#a78bfa', fontHeading: 'Outfit', fontBody: 'DM Sans' },
    immersif: { primaryColor: '#0f172a', secondaryColor: '#06b6d4', accentColor: '#f59e0b', fontHeading: 'Manrope', fontBody: 'Inter' },
    prestige: { primaryColor: '#3d3225', secondaryColor: '#c4956a', accentColor: '#8b9d6e', fontHeading: 'Cormorant Garamond', fontBody: 'Lato' },
};

export default function TemplatesPage() {
    const router = useRouter();
    const [selectedTemplate, setSelectedTemplate] = useState<string>('elegance');
    const [currentActive, setCurrentActive] = useState('elegance');

    useEffect(() => {
        fetch('/api/crm/site-config')
            .then(r => r.json())
            .then(data => {
                if (data.template) {
                    setSelectedTemplate(data.template);
                    setCurrentActive(data.template);
                }
            })
            .catch(console.error);
    }, []);

    const selected = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

    return (
        <div className="w-full h-full">
        <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-sky-50 flex items-center justify-center border border-gray-100">
                            <Palette size={18} className="text-violet-500" />
                        </div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Templates</h1>
                    </div>
                    <p className="text-sm text-[#9CA3AF] font-light mt-1">Choisissez un template puis cliquez pour le personnaliser entièrement.</p>
                </div>
                <Link href="/conciergerie" target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-300 transition-all shadow-sm">
                    <Eye size={14} /> Voir le site
                </Link>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEMPLATES.map((template, i) => {
                    const isSelected = selectedTemplate === template.id;
                    const isActive = currentActive === template.id;
                    const isDark = template.id === 'immersif';

                    return (
                        <motion.button
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 group ${isSelected
                                ? 'border-[#2E2E2E] shadow-2xl shadow-[#2E2E2E]/10 scale-[1.02]'
                                : 'border-gray-100 shadow-lg hover:shadow-xl hover:border-gray-200 hover:scale-[1.01]'
                            }`}
                        >
                            {/* Preview Area */}
                            <div className={`bg-gradient-to-br ${template.gradient} p-6 h-48 relative overflow-hidden`}>
                                {template.id === 'elegance' && (
                                    <div className="space-y-3">
                                        <div className="h-1.5 w-12 bg-amber-400/50 rounded" />
                                        <div className="h-4 w-3/4 bg-amber-800/20 rounded" />
                                        <div className="h-2 w-1/2 bg-amber-700/15 rounded" />
                                        <div className="h-7 w-20 bg-amber-400/25 rounded-lg mt-3" />
                                        <div className="flex gap-2 mt-4">
                                            {[1, 2, 3].map(n => (
                                                <div key={n} className="w-16 h-20 bg-amber-200/30 rounded-lg border border-amber-300/20 group-hover:translate-y-[-2px] transition-transform" style={{ transitionDelay: `${n * 50}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {template.id === 'moderne' && (
                                    <div className="flex gap-3 h-full">
                                        <div className="flex-1 flex flex-col gap-2 justify-center">
                                            <div className="h-1.5 w-16 bg-sky-400/40 rounded" />
                                            <div className="h-5 w-full bg-violet-800/20 rounded" />
                                            <div className="h-2 w-2/3 bg-violet-600/15 rounded" />
                                            <div className="h-7 w-20 bg-sky-500/30 rounded-lg mt-2" />
                                        </div>
                                        <div className="w-1/3 bg-sky-200/40 rounded-xl group-hover:scale-[1.02] transition-transform" />
                                    </div>
                                )}
                                {template.id === 'immersif' && (
                                    <div className="space-y-3">
                                        <div className="h-1.5 w-10 bg-cyan-400/50 rounded" />
                                        <div className="h-5 w-3/4 bg-white/15 rounded" />
                                        <div className="h-2 w-1/2 bg-white/10 rounded" />
                                        <div className="h-7 w-20 bg-cyan-400/20 rounded-lg mt-3 border border-cyan-400/30" />
                                        <div className="flex gap-2 mt-4">
                                            {[1, 2, 3].map(n => (
                                                <div key={n} className="w-16 h-20 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm group-hover:bg-white/8 transition-colors" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {template.id === 'prestige' && (
                                    <div className="space-y-3">
                                        <div className="h-1 w-16 bg-[#c4956a]/50 rounded" />
                                        <div className="h-5 w-2/3 bg-[#3d3225]/20 rounded" />
                                        <div className="h-2 w-1/3 bg-[#3d3225]/15 rounded" />
                                        <div className="h-7 w-24 bg-[#c4956a]/20 rounded-lg mt-3 border border-[#c4956a]/30" />
                                        <div className="flex gap-3 mt-4">
                                            <div className="w-20 h-28 bg-[#c4956a]/15 rounded-lg border-l-2 border-[#c4956a]/40 group-hover:translate-y-[-3px] transition-transform" />
                                            <div className="w-20 h-28 bg-[#8b9d6e]/15 rounded-lg border-l-2 border-[#8b9d6e]/40 mt-4 group-hover:translate-y-[-3px] transition-transform" style={{ transitionDelay: '100ms' }} />
                                        </div>
                                    </div>
                                )}

                                {/* Active badge */}
                                {isActive && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="absolute top-3 right-3 bg-[#2E2E2E] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                        <Check size={11} strokeWidth={3} /> Actif
                                    </motion.div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-[#2E2E2E] tracking-tight">{template.name}</h3>
                                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#9CA3AF] font-bold px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100">
                                        {template.style}
                                    </span>
                                </div>
                                <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2 font-light">{template.description}</p>
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                    {Object.values(TEMPLATE_DEFAULTS[template.id] || {}).filter(v => typeof v === 'string' && v.startsWith('#')).slice(0, 3).map((color, ci) => (
                                        <div key={ci} className="w-4 h-4 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: color as string }} />
                                    ))}
                                    <span className="text-[9px] text-[#C4C4C4] ml-1 uppercase tracking-wider font-medium">
                                        {TEMPLATE_DEFAULTS[template.id]?.fontHeading || ''}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Template Details + Edit Button */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Features */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                        <h3 className="text-sm font-bold text-[#2E2E2E] mb-5 flex items-center gap-2">
                            <Sparkles size={16} className="text-[#bcdeea]" /> Fonctionnalités
                        </h3>
                        <ul className="space-y-3">
                            {selected.features.map((feature, i) => (
                                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                    className="flex items-center gap-3 text-xs text-[#2E2E2E]">
                                    <div className="w-5 h-5 rounded-full bg-[#bcdeea]/15 flex items-center justify-center shrink-0">
                                        <Check size={10} className="text-[#2E2E2E]" />
                                    </div>
                                    {feature}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Specs */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                        <h3 className="text-sm font-bold text-[#2E2E2E] mb-5 flex items-center gap-2">
                            <Layout size={16} className="text-violet-400" /> Spécifications
                        </h3>
                        <div className="space-y-3.5">
                            {[
                                { label: 'Hero Layout', value: selected.preview.heroLayout, icon: Maximize },
                                { label: 'Style des Cards', value: selected.preview.cardStyle, icon: Grid3X3 },
                                { label: 'Animations', value: selected.preview.animation, icon: Sparkles },
                                { label: 'Palette', value: selected.preview.colorScheme, icon: Palette },
                            ].map((spec, i) => {
                                const Icon = spec.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50/60 border border-gray-100/50">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                            <Icon size={13} className="text-[#9CA3AF]" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase tracking-[0.12em] text-[#C4C4C4] font-bold">{spec.label}</div>
                                            <div className="text-xs text-[#2E2E2E] font-medium">{spec.value}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-[#bcdeea]/10 to-white rounded-2xl border border-[#bcdeea]/20 p-7">
                            <h3 className="text-sm font-bold text-[#2E2E2E] mb-3">Design System</h3>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">Titres</span>
                                    <span className="text-xs text-[#2E2E2E] font-medium">{TEMPLATE_DEFAULTS[selected.id]?.fontHeading}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">Corps</span>
                                    <span className="text-xs text-[#2E2E2E] font-medium">{TEMPLATE_DEFAULTS[selected.id]?.fontBody}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">Couleurs</span>
                                    <div className="flex gap-1.5">
                                        {[TEMPLATE_DEFAULTS[selected.id]?.primaryColor, TEMPLATE_DEFAULTS[selected.id]?.secondaryColor, TEMPLATE_DEFAULTS[selected.id]?.accentColor].map((c, i) => (
                                            <div key={i} className="w-6 h-6 rounded-lg shadow-sm border border-gray-100" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EDIT BUTTON → routes to /crm/templates/[id] */}
                        <button
                            onClick={() => router.push(`/crm/templates/${selectedTemplate}`)}
                            className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#2E2E2E] text-white hover:bg-[#1a1a1a] shadow-lg shadow-[#2E2E2E]/10 hover:shadow-xl transition-all"
                        >
                            <Pencil size={16} />
                            Personnaliser &quot;{selected.name}&quot;
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-[10px] text-center text-[#C4C4C4]">Modifiez les textes, couleurs, images et animations</p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
        </div>
    );
}
