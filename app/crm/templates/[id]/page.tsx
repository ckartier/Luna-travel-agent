'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Check, Loader2, Eye, RefreshCw, Wand2,
    ImagePlus, AlertCircle, ChevronDown, FileText, Paintbrush,
    LayoutGrid, ExternalLink, Palette, Sparkles, Upload, X, Image as ImageIcon, Crop, Download,
    Navigation, Type, Bold, Italic, Bot
} from 'lucide-react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { invalidateSiteConfigCache } from '@/src/hooks/useSiteConfig';
// ═══ Constants ═══

const FONT_OPTIONS = [
    'Playfair Display', 'Inter', 'Outfit', 'DM Sans', 'Manrope', 'Lato',
    'Cormorant Garamond', 'Poppins', 'Montserrat', 'Raleway', 'Libre Baskerville',
    'Source Sans 3', 'Merriweather', 'Josefin Sans', 'Quicksand',
];

const ANIMATION_OPTIONS = [
    { id: '', label: 'Aucune' },
    { id: 'fadeIn', label: 'Fade In' },
    { id: 'slideUp', label: 'Slide Up' },
    { id: 'slideDown', label: 'Slide Down' },
    { id: 'slideLeft', label: 'Slide Left' },
    { id: 'slideRight', label: 'Slide Right' },
    { id: 'scaleIn', label: 'Scale In' },
    { id: 'bounceIn', label: 'Bounce In' },
    { id: 'flipIn', label: 'Flip In' },
];

const ANIMATION_SPEED_OPTIONS = [
    { id: 'slow', label: 'Lent (1.2s)' },
    { id: 'normal', label: 'Normal (0.6s)' },
    { id: 'fast', label: 'Rapide (0.3s)' },
];

const ANIMATION_DELAY_OPTIONS = [
    { id: '0', label: '0ms' },
    { id: '100', label: '100ms' },
    { id: '200', label: '200ms' },
    { id: '500', label: '500ms' },
];

const EFFECT_OPTIONS = [
    { id: '', label: 'Aucun' },
    { id: 'parallax', label: 'Parallax' },
    { id: 'glassmorphism', label: 'Glassmorphism' },
    { id: 'shadow-hover', label: 'Shadow Hover' },
    { id: 'glow', label: 'Glow' },
];

const HEADING_SIZE_OPTIONS = [
    { id: 'xs', label: 'Très petit' }, { id: 'sm', label: 'Petit' },
    { id: 'md', label: 'Moyen' }, { id: 'lg', label: 'Grand' },
    { id: 'xl', label: 'Très grand' }, { id: '2xl', label: 'Énorme' },
];

const HEADING_STYLE_OPTIONS = [
    { id: 'normal', label: 'Normal' }, { id: 'italic', label: 'Italique' },
    { id: 'uppercase', label: 'Majuscules' }, { id: 'small-caps', label: 'Petites Capitales' },
];

const HEADING_WEIGHT_OPTIONS = [
    { id: 'light', label: 'Light (300)' }, { id: 'normal', label: 'Normal (400)' },
    { id: 'medium', label: 'Medium (500)' }, { id: 'bold', label: 'Bold (700)' },
    { id: 'extrabold', label: 'Extra Bold (800)' },
];

const LETTER_SPACING_OPTIONS = [
    { id: 'tighter', label: 'Très serré' }, { id: 'tight', label: 'Serré' },
    { id: 'normal', label: 'Normal' }, { id: 'wide', label: 'Large' },
    { id: 'wider', label: 'Très large' },
];

const BLOCK_META: Record<string, { label: string; desc: string }> = {
    hero: { label: 'Hero', desc: 'Section principale avec vidéo/image' },
    collections: { label: 'Collections', desc: 'Destinations exclusives (synchro CRM)' },
    divider1: { label: 'Divider 1', desc: 'Séparateur parallaxe entre Collections et Prestations' },
    catalog: { label: 'Prestations', desc: 'Catalogue de services (synchro CRM)' },
    divider2: { label: 'Divider 2', desc: 'Séparateur parallaxe entre Prestations et Formulaire' },
    form: { label: 'Formulaire', desc: 'Formulaire de contact sur-mesure' },
    history: { label: 'Notre Histoire', desc: 'Section à propos avec image' },
};

const TEMPLATE_NAMES: Record<string, string> = {
    elegance: 'Élégance', moderne: 'Moderne', immersif: 'Immersif', prestige: 'Prestige',
};

type Tab = 'contenu' | 'design' | 'blocs' | 'ia';

export default function TemplateEditorPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    // ── Listen for postMessage from preview iframe (click-to-edit) ──
    const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'editor-focus-section' && e.data.section) {
                const sectionMap: Record<string, string> = {
                    hero: 'hero', collections: 'collections', divider1: 'divider1',
                    catalog: 'catalog', divider2: 'divider2', form: 'form',
                    history: 'history'
                };
                const sectionId = sectionMap[e.data.section];
                if (sectionId) {
                    setTab('contenu');
                    setTimeout(() => {
                        const el = document.getElementById(`editor-section-${sectionId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Open section if collapsed
                            const btn = el.querySelector('button');
                            const content = el.querySelector('[data-section-content]');
                            if (btn && !content) btn.click();
                            // Highlight
                            setHighlightedSection(sectionId);
                            setTimeout(() => setHighlightedSection(null), 2000);
                        }
                    }, 100);
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);
    const [config, setConfig] = useState<any>(null);
    const [loadedConfig, setLoadedConfig] = useState<any>(null); // snapshot from Firebase
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [tab, setTab] = useState<Tab>('contenu');
    const [previewKey, setPreviewKey] = useState(0);

    // AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiTarget, setAiTarget] = useState<'hero' | 'history' | 'block'>('hero');

    useEffect(() => {
        setLoading(true);
        fetch('/api/crm/site-config')
            .then(r => r.json())
            .then(data => { setConfig(data); setLoadedConfig(JSON.parse(JSON.stringify(data))); setLoading(false); setPreviewKey(k => k + 1); })
            .catch(() => setLoading(false));
    }, [id]);

    // Dirty state: true if user changed anything since last load/save
    const isDirty = config && loadedConfig && JSON.stringify(config) !== JSON.stringify(loadedConfig);


    // Helpers
    const updateGlobal = (key: string, val: string) => {
        setConfig((p: any) => ({ ...p, global: { ...p.global, [key]: val } }));
    };
    const updateBlock = (type: string, key: string, val: any) => {
        setConfig((p: any) => ({
            ...p,
            blocks: (p.blocks || []).map((b: any) => b.type === type ? { ...b, [key]: val } : b),
        }));
    };
    const updateBusiness = (key: string, val: string) => {
        setConfig((p: any) => ({ ...p, business: { ...p.business, [key]: val } }));
    };
    const updateDivider = (divId: string, key: string, val: string) => {
        setConfig((p: any) => ({ ...p, dividers: { ...p.dividers, [divId]: { ...(p.dividers?.[divId] || {}), [key]: val } } }));
    };
    const updateFooter = (key: string, val: string) => {
        setConfig((p: any) => ({ ...p, footer: { ...p.footer, [key]: val } }));
    };
    const updateNav = (key: string, val: any) => {
        setConfig((p: any) => ({ ...p, nav: { ...p.nav, [key]: val } }));
    };
    const updateNavItem = (index: number, key: string, val: string) => {
        setConfig((p: any) => {
            const items = [...(p.nav?.menuItems || [])];
            items[index] = { ...items[index], [key]: val };
            return { ...p, nav: { ...p.nav, menuItems: items } };
        });
    };

    // Manual Save — ONLY way to persist
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...config, template: id };
            await fetchWithAuth('/api/crm/site-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setLoadedConfig(JSON.parse(JSON.stringify(config)));
            invalidateSiteConfigCache();
            setSaved(true);
            setPreviewKey(k => k + 1);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    // AI Generate
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true); setAiError(null); setAiImageUrl(null);
        try {
            const size = aiTarget === 'hero' ? '1792x1024' : '1024x1024';
            const res = await fetchWithAuth('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt, size }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            setAiImageUrl(data.url);
        } catch (e: any) { setAiError(e.message); }
        setAiGenerating(false);
    };

    // Send config to iframe for real-time preview
    useEffect(() => {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow && config) {
            iframe.contentWindow.postMessage({ type: 'editor-update-config', config }, '*');
        }
    }, [config]);

    // Apply AI image to target
    const applyAiImage = () => {
        if (!aiImageUrl) return;
        if (aiTarget === 'hero') {
            updateBlock('hero', 'videoUrl', '');
            updateGlobal('heroImage', aiImageUrl);
        } else if (aiTarget === 'history') {
            updateBlock('history', 'image', aiImageUrl);
        } else if (aiTarget === 'block') {
            // Copy to clipboard for manual paste
            navigator.clipboard.writeText(aiImageUrl);
        }
        setAiImageUrl(null);
        setAiPrompt('');
    };

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-5">
                <span className="text-3xl tracking-[0.15em] text-[#2E2E2E]" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}>LUNA</span>
                <Loader2 className="animate-spin text-[#5a8fa3]" size={20} />
            </div>
        );
    }

    const blocks = config.blocks || [];
    const templateName = TEMPLATE_NAMES[id] || id;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* ═══ Top Bar ═══ */}
            <div className="h-[48px] bg-white border-b border-gray-100/80 flex items-center justify-end px-5 shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/conciergerie" target="_blank"
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-600 transition-all">
                        <Eye size={16} /> Voir le site <ExternalLink size={12} className="opacity-30" />
                    </Link>
                    <button onClick={() => setPreviewKey(k => k + 1)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-600 transition-all">
                        <RefreshCw size={15} />
                    </button>
                    <div className="h-5 w-px bg-gray-200/50" />
                    {/* Dirty/Saved */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        isDirty ? 'text-amber-500' : 'text-gray-300'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`} />
                        {isDirty ? 'Non sauvegardé' : ''}
                    </div>
                    <button onClick={handleSave} disabled={saving || !isDirty}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                            saved ? 'bg-emerald-500 text-white' :
                            isDirty ? 'bg-[#2E2E2E] text-white hover:bg-black shadow-sm' :
                            'bg-[#bcdeea]/30 text-[#5a8fa3] border border-[#bcdeea]/40 cursor-default'
                        } disabled:opacity-60`}>
                        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
                        {saved ? 'Sauvé' : 'Sauvegarder'}
                    </button>
                </div>
            </div>

            {/* ═══ Main: Editor + Preview ═══ */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT PANEL */}
                <div className="w-[380px] bg-white border-r border-gray-100/80 flex flex-col shrink-0">

                    {/* Template switcher — clean underline tabs */}
                    <div className="px-5 pt-4 pb-0 shrink-0">
                        <div className="flex items-center gap-1 border-b border-gray-100">
                            {Object.entries(TEMPLATE_NAMES).map(([key, name]) => (
                                <button
                                    key={key}
                                    onClick={async () => {
                                        if (key !== id) {
                                            try {
                                                await fetchWithAuth('/api/crm/site-config', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ ...config, template: key }),
                                                });
                                            } catch (e) { console.error(e); }
                                            router.push(`/crm/templates/${key}`);
                                        }
                                    }}
                                    className={`px-4 py-3 text-[13px] font-medium transition-all duration-200 border-b-2 -mb-px ${
                                        key === id
                                            ? 'text-[#2E2E2E] border-[#5a8fa3]'
                                            : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content tabs — icon-based with underline */}
                    <div className="flex px-5 pt-2 gap-0 shrink-0 border-b border-gray-100">
                        {([
                            { id: 'contenu' as Tab, label: 'Contenu', icon: FileText },
                            { id: 'design' as Tab, label: 'Design', icon: Paintbrush },
                            { id: 'blocs' as Tab, label: 'Blocs', icon: LayoutGrid },
                            { id: 'ia' as Tab, label: 'IA', icon: Bot },
                        ]).map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                                    tab === t.id
                                        ? 'text-[#5a8fa3] border-[#5a8fa3]'
                                        : 'text-gray-400 border-transparent hover:text-gray-500'
                                }`}>
                                <t.icon size={13} strokeWidth={tab === t.id ? 2.5 : 1.5} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">

                         {/* ── CONTENU ── */}
                        {tab === 'contenu' && (
                            <div className="p-4 space-y-4">
                                <Section title="🧭 Navigation" sectionId="nav" highlighted={highlightedSection === 'nav'}>
                                    <p className="text-[10px] text-gray-400 mb-2">Personnalisez les noms des liens du menu et le bouton CTA</p>
                                    {(config.nav?.menuItems || []).map((item: any, i: number) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="flex-1">
                                                <Field label={`Menu ${i + 1} — Label`} value={item.label || ''} onChange={v => updateNavItem(i, 'label', v)} />
                                            </div>
                                        </div>
                                    ))}
                                    <Field label="Texte bouton CTA" value={config.nav?.ctaText || 'Espace Client'} onChange={v => updateNav('ctaText', v)} placeholder="Espace Client" />
                                </Section>

                                <Section title="Hero" sectionId="hero" highlighted={highlightedSection === 'hero'}>
                                    <Field label="Titre" value={blocks.find((b: any) => b.type === 'hero')?.title || ''} onChange={v => updateBlock('hero', 'title', v)} />
                                    <Field label="Sous-titre" value={blocks.find((b: any) => b.type === 'hero')?.subtitle || ''} onChange={v => updateBlock('hero', 'subtitle', v)} />
                                    <FieldArea label="Description" value={blocks.find((b: any) => b.type === 'hero')?.description || ''} onChange={v => updateBlock('hero', 'description', v)} />
                                    <Field label="Texte du bouton" value={blocks.find((b: any) => b.type === 'hero')?.buttonText || ''} onChange={v => updateBlock('hero', 'buttonText', v)} placeholder="Découvrir →" />
                                    <VideoField label="Vidéo de fond" value={blocks.find((b: any) => b.type === 'hero')?.videoUrl || ''} onChange={v => updateBlock('hero', 'videoUrl', v)} />
                                    <ImageField label="Image de fond" value={config.global?.heroImage || ''} onChange={v => updateGlobal('heroImage', v)} aspectRatio="16/9" />
                                </Section>

                                <Section title="Collections" sectionId="collections" highlighted={highlightedSection === 'collections'}>
                                    <Field label="Titre" value={blocks.find((b: any) => b.type === 'collections')?.title || ''} onChange={v => updateBlock('collections', 'title', v)} />
                                    <Field label="Sous-titre" value={blocks.find((b: any) => b.type === 'collections')?.subtitle || ''} onChange={v => updateBlock('collections', 'subtitle', v)} />
                                    <p className="text-[11px] text-amber-500 italic">⚡ Les destinations sont synchronisées avec le CRM</p>
                                </Section>

                                <Section title="↕ Divider 1 — Parallaxe" sectionId="divider1" highlighted={highlightedSection === 'divider1'}>
                                    <Field label="Titre" value={config.dividers?.divider1?.title || "L'Art de Recevoir."} onChange={v => updateDivider('divider1', 'title', v)} />
                                    <ImageField label="Image de fond" value={config.dividers?.divider1?.image || ''} onChange={v => updateDivider('divider1', 'image', v)} aspectRatio="21/9" />
                                </Section>

                                <Section title="Prestations & Services" sectionId="catalog" highlighted={highlightedSection === 'catalog'}>
                                    <Field label="Titre" value={blocks.find((b: any) => b.type === 'catalog')?.title || ''} onChange={v => updateBlock('catalog', 'title', v)} />
                                    <Field label="Sous-titre" value={blocks.find((b: any) => b.type === 'catalog')?.subtitle || ''} onChange={v => updateBlock('catalog', 'subtitle', v)} />
                                    <p className="text-[11px] text-amber-500 italic">⚡ Le catalogue est synchronisé avec le CRM</p>
                                </Section>

                                <Section title="↕ Divider 2 — Parallaxe" sectionId="divider2" highlighted={highlightedSection === 'divider2'}>
                                    <Field label="Titre" value={config.dividers?.divider2?.title || "L'Excellence à la Française."} onChange={v => updateDivider('divider2', 'title', v)} />
                                    <ImageField label="Image de fond" value={config.dividers?.divider2?.image || ''} onChange={v => updateDivider('divider2', 'image', v)} aspectRatio="21/9" />
                                </Section>

                                <Section title="Notre Histoire" sectionId="history" highlighted={highlightedSection === 'history'}>
                                    <Field label="Titre" value={blocks.find((b: any) => b.type === 'history')?.title || ''} onChange={v => updateBlock('history', 'title', v)} />
                                    <FieldArea label="Texte" value={blocks.find((b: any) => b.type === 'history')?.text || ''} onChange={v => updateBlock('history', 'text', v)} />
                                    <ImageField label="Image" value={blocks.find((b: any) => b.type === 'history')?.image || ''} onChange={v => updateBlock('history', 'image', v)} />
                                </Section>

                                <Section title="Formulaire de Contact" sectionId="form" highlighted={highlightedSection === 'form'}>
                                    <Field label="Titre" value={blocks.find((b: any) => b.type === 'form')?.title || ''} onChange={v => updateBlock('form', 'title', v)} />
                                    <Field label="Sous-titre" value={blocks.find((b: any) => b.type === 'form')?.subtitle || ''} onChange={v => updateBlock('form', 'subtitle', v)} />
                                </Section>

                                <Section title="Informations Entreprise" sectionId="business" highlighted={highlightedSection === 'business'}>
                                    <Field label="Nom" value={config.business?.name || ''} onChange={v => updateBusiness('name', v)} />
                                    <Field label="Email" value={config.business?.email || ''} onChange={v => updateBusiness('email', v)} />
                                    <Field label="Téléphone" value={config.business?.phone || ''} onChange={v => updateBusiness('phone', v)} />
                                    <Field label="WhatsApp" value={config.business?.whatsapp || ''} onChange={v => updateBusiness('whatsapp', v)} />
                                    <Field label="Instagram" value={config.business?.instagram || ''} onChange={v => updateBusiness('instagram', v)} placeholder="@votre_compte" />
                                </Section>

                                <Section title="Footer" sectionId="footer" highlighted={highlightedSection === 'footer'}>
                                    <Field label="Texte de copyright" value={config.footer?.copyright || ''} onChange={v => updateFooter('copyright', v)} placeholder="© 2026 Votre Agence" />
                                    <FieldArea label="Description footer" value={config.footer?.description || ''} onChange={v => updateFooter('description', v)} />
                                </Section>
                            </div>
                        )}

                        {/* ── DESIGN ── */}
                        {tab === 'design' && (
                            <div className="p-4 space-y-4">
                                <Section title="🎨 Couleurs">
                                    <ColorField label="Primaire" value={config.global?.primaryColor || '#2E2E2E'} onChange={v => updateGlobal('primaryColor', v)} />
                                    <ColorField label="Secondaire" value={config.global?.secondaryColor || '#b9dae9'} onChange={v => updateGlobal('secondaryColor', v)} />
                                    <ColorField label="Accent" value={config.global?.accentColor || '#E2C8A9'} onChange={v => updateGlobal('accentColor', v)} />
                                    <div className="my-2 border-t border-gray-100" />
                                    <ColorField label="Couleur des titres" value={config.global?.headingColor || '#2E2E2E'} onChange={v => updateGlobal('headingColor', v)} />
                                    <ColorField label="Couleur du texte" value={config.global?.textColor || '#2E2E2E'} onChange={v => updateGlobal('textColor', v)} />
                                    <ColorField label="Fond" value={config.global?.bgColor || '#ffffff'} onChange={v => updateGlobal('bgColor', v)} />
                                    <ColorField label="Bouton CTA" value={config.global?.ctaColor || '#2E2E2E'} onChange={v => updateGlobal('ctaColor', v)} />
                                </Section>

                                <Section title="✏️ Typographie">
                                    <SelectField label="Police des titres" value={config.global?.fontHeading || 'Playfair Display'} options={FONT_OPTIONS} onChange={v => updateGlobal('fontHeading', v)} />
                                    <SelectField label="Police du corps" value={config.global?.fontBody || 'Inter'} options={FONT_OPTIONS} onChange={v => updateGlobal('fontBody', v)} />
                                    <div className="my-2 border-t border-gray-100" />
                                    <SelectField label="Taille des titres" value={config.global?.headingSize || 'lg'} options={HEADING_SIZE_OPTIONS.map(o => o.id)} optionLabels={HEADING_SIZE_OPTIONS.map(o => o.label)} onChange={v => updateGlobal('headingSize', v)} />
                                    <SelectField label="Style des titres" value={config.global?.headingStyle || 'normal'} options={HEADING_STYLE_OPTIONS.map(o => o.id)} optionLabels={HEADING_STYLE_OPTIONS.map(o => o.label)} onChange={v => updateGlobal('headingStyle', v)} />
                                    <SelectField label="Épaisseur des titres" value={config.global?.headingWeight || 'light'} options={HEADING_WEIGHT_OPTIONS.map(o => o.id)} optionLabels={HEADING_WEIGHT_OPTIONS.map(o => o.label)} onChange={v => updateGlobal('headingWeight', v)} />
                                    <SelectField label="Espacement lettres" value={config.global?.letterSpacing || 'tight'} options={LETTER_SPACING_OPTIONS.map(o => o.id)} optionLabels={LETTER_SPACING_OPTIONS.map(o => o.label)} onChange={v => updateGlobal('letterSpacing', v)} />
                                </Section>

                                <Section title="Logo">
                                    <ImageField label="Logo" value={config.global?.logo || ''} onChange={v => updateGlobal('logo', v)} aspectRatio="auto" />
                                </Section>

                                <Section title="⚙️ Style">
                                    <SelectField label="Bordures" value={config.global?.borderRadius || 'lg'} options={['none', 'sm', 'md', 'lg', 'xl', 'full']} onChange={v => updateGlobal('borderRadius', v)} />
                                    <SelectField label="Espacement" value={config.global?.spacing || 'normal'} options={['compact', 'normal', 'relaxed']} onChange={v => updateGlobal('spacing', v)} />
                                    <SelectField label="Boutons" value={config.global?.buttonStyle || 'solid'} options={['solid', 'outline', 'ghost']} onChange={v => updateGlobal('buttonStyle', v)} />
                                </Section>
                            </div>
                        )}

                        {/* ── BLOCS ── */}
                        {tab === 'blocs' && (
                            <div className="p-4 space-y-3">
                                <p className="text-[12px] text-gray-400 mb-2">Activez/désactivez les sections, choisissez leurs animations et effets.</p>
                                {Object.entries(BLOCK_META).map(([type, meta]) => {
                                    const block = blocks.find((b: any) => b.type === type);
                                    if (!block) return null;
                                    const visible = block.visible !== false;
                                    return (
                                        <div key={type} className={`p-4 rounded-xl border transition-all ${visible ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="text-[14px] font-bold text-[#2E2E2E]">{meta.label}</p>
                                                    <p className="text-[11px] text-gray-400">{meta.desc}</p>
                                                </div>
                                                <button onClick={() => updateBlock(type, 'visible', !visible)}
                                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${visible ? 'bg-[#5a8fa3]' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${visible ? 'left-[22px]' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                            {visible && (
                                                <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
                                                    <SelectField label="Animation" value={block.animation || ''} options={ANIMATION_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_OPTIONS.map(a => a.label)} onChange={v => updateBlock(type, 'animation', v)} />
                                                    <SelectField label="Vitesse" value={block.animationSpeed || 'normal'} options={ANIMATION_SPEED_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_SPEED_OPTIONS.map(a => a.label)} onChange={v => updateBlock(type, 'animationSpeed', v)} />
                                                    <SelectField label="Délai d'entrée" value={block.animationDelay || '0'} options={ANIMATION_DELAY_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_DELAY_OPTIONS.map(a => a.label)} onChange={v => updateBlock(type, 'animationDelay', v)} />
                                                    <SelectField label="Effet" value={block.effect || ''} options={EFFECT_OPTIONS.map(a => a.id)} optionLabels={EFFECT_OPTIONS.map(a => a.label)} onChange={v => updateBlock(type, 'effect', v)} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── IA IMAGE ── */}
                        {tab === 'ia' && (
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#bcdeea]/20 border border-[#bcdeea]/40 flex items-center justify-center">
                                        <Bot size={16} className="text-[#5a8fa3]" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2E2E2E]">Génération d&apos;image IA</p>
                                        <p className="text-[11px] text-gray-400">Gemini • Pour vos blocs et headers</p>
                                    </div>
                                </div>

                                {/* Target selector */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Destination de l&apos;image</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'hero' as const, label: 'Header / Hero', size: '1792×1024' },
                                            { id: 'history' as const, label: 'Notre Histoire', size: '1024×1024' },
                                            { id: 'block' as const, label: 'Bloc libre', size: '1024×1024' },
                                        ].map(t => (
                                            <button key={t.id} onClick={() => setAiTarget(t.id)}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    aiTarget === t.id
                                                        ? 'border-[#5a8fa3] bg-[#b9dae9]/10 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}>
                                                <p className="text-[12px] font-bold text-[#2E2E2E]">{t.label}</p>
                                                <p className="text-[10px] text-gray-400">{t.size}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Prompt */}
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Décrivez l&apos;image</label>
                                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Ex: Un hôtel de luxe à Bali au coucher du soleil avec piscine à débordement..."
                                        className="w-full h-20 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#5a8fa3]/10 transition-all" />
                                </div>

                                {/* Quick prompts */}
                                <div className="flex flex-wrap gap-1.5">
                                    {['Plage tropicale', 'Hôtel de luxe', 'Safari africain', 'Yacht', 'Villa Bali', 'Montagne enneigée'].map(q => (
                                        <button key={q} onClick={() => setAiPrompt(q)}
                                            className="px-2.5 py-1 text-[9px] font-medium bg-gray-100 text-gray-500 rounded-lg hover:bg-[#b9dae9]/20 hover:text-[#2E2E2E] transition-all">
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                {/* Generate */}
                                <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#5a8fa3] text-white rounded-xl text-[12px] font-semibold shadow-sm hover:bg-[#4d7f93] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                                    {aiGenerating ? <><Loader2 size={14} className="animate-spin" /> Génération en cours…</> : <><Bot size={15} /> Générer l&apos;image</>}
                                </button>

                                {aiError && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                                        <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                        <p className="text-[10px] text-red-500">{aiError}</p>
                                    </div>
                                )}

                                {/* Result */}
                                {aiImageUrl && (
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Résultat</p>
                                        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                            <img src={aiImageUrl} alt="AI" className="w-full object-cover" style={{ aspectRatio: aiTarget === 'hero' ? '16/9' : '1/1' }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={applyAiImage}
                                                className="flex items-center justify-center gap-1.5 py-2.5 bg-[#5a8fa3] text-white rounded-xl text-[11px] font-semibold hover:bg-[#4d7f93] transition-all active:scale-[0.98]">
                                                <Check size={12} /> {aiTarget === 'block' ? 'Copier URL' : `Appliquer au ${aiTarget === 'hero' ? 'Header' : 'Histoire'}`}
                                            </button>
                                            <button onClick={() => { setAiImageUrl(null); }}
                                                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[11px] font-semibold hover:bg-gray-50 transition-all">
                                                Régénérer
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
                                    <p className="text-[9px] text-amber-600 font-medium leading-relaxed">💡 Choisissez la destination, décrivez l&apos;image, puis cliquez &quot;Appliquer&quot; pour l&apos;insérer directement dans le bon bloc.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className="flex-1 bg-[#F8FAFC] relative flex flex-col">
                    <iframe key={previewKey} src="/conciergerie" className="w-full flex-1 border-0" title="Preview" />
                </div>
            </div>
        </div>
    );
}

// ═══ UI Components ═══

function Section({ title, children, sectionId, highlighted }: { title: string; children: React.ReactNode; sectionId?: string; highlighted?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
        <div id={sectionId ? `editor-section-${sectionId}` : undefined}
            className={`rounded-xl overflow-hidden transition-all duration-300 ${
                highlighted ? 'ring-2 ring-[#5a8fa3]/30 shadow-lg shadow-[#5a8fa3]/10' : ''
            } ${open ? 'bg-white shadow-sm border border-gray-100/60' : 'bg-transparent'}`}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <span className="text-[14px] font-bold text-[#2E2E2E] tracking-wide">{title}</span>
                <ChevronDown size={15} className={`text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div data-section-content className="px-4 pb-4 space-y-3">{children}</div>}
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] placeholder:text-gray-300 focus:outline-none focus:border-[#b9dae9] focus:bg-white focus:shadow-sm transition-all" />
        </div>
    );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] resize-none focus:outline-none focus:border-[#b9dae9] focus:bg-white focus:shadow-sm transition-all" />
        </div>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2.5">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded-md border border-gray-200/60 cursor-pointer p-0.5 bg-white" />
            <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/80 block">{label}</label>
                <input type="text" value={value} onChange={e => onChange(e.target.value)}
                    className="w-full px-2 py-1 bg-[#fafbfc] border border-gray-200/60 rounded text-[11px] text-gray-500 font-mono focus:outline-none focus:border-[#b9dae9] transition-all" />
            </div>
        </div>
    );
}

function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: string[]; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] focus:outline-none focus:border-[#b9dae9] focus:bg-white appearance-none cursor-pointer transition-all">
                {options.map((opt, i) => (
                    <option key={opt} value={opt}>{optionLabels?.[i] || opt}</option>
                ))}
            </select>
        </div>
    );
}

// ═══ Crop helper: get cropped image as blob ═══
async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = imageSrc; });
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    return new Promise((resolve) => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.92));
}

function ImageField({ label, value, onChange, aspectRatio = '4/3' }: { label: string; value: string; onChange: (v: string) => void; aspectRatio?: string }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'upload' | 'ai'>('upload');

    // Crop state
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [cropping, setCropping] = useState(false);

    // AI state
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState<string | null>(null);

    const handleFileSelected = (file: File) => {
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) { setError('Format invalide. JPEG, PNG, WebP, GIF ou SVG.'); return; }
        if (file.size > 25 * 1024 * 1024) { setError('Image trop lourde (max 25 Mo).'); return; }
        setError(null);
        if (file.type === 'image/svg+xml') { uploadFile(file); return; }
        const reader = new FileReader();
        reader.onload = () => { setCropSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); };
        reader.readAsDataURL(file);
    };

    const uploadFile = async (fileOrBlob: File | Blob) => {
        setUploading(true); setError(null);
        try {
            const formData = new FormData();
            formData.append('file', fileOrBlob, fileOrBlob instanceof File ? fileOrBlob.name : 'cropped.jpg');
            const res = await fetchWithAuth('/api/crm/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur upload');
            onChange(data.url);
        } catch (e: any) { setError(e.message || 'Erreur upload'); }
        setUploading(false);
    };

    const handleCropConfirm = async () => {
        if (!cropSrc || !croppedArea) return;
        setCropping(true);
        try {
            const blob = await getCroppedImg(cropSrc, croppedArea);
            setCropSrc(null);
            await uploadFile(blob);
        } catch { setError('Erreur de recadrage'); }
        setCropping(false);
    };

    const handleSkipCrop = async () => {
        if (!cropSrc) return;
        const res = await fetch(cropSrc);
        const blob = await res.blob();
        setCropSrc(null);
        await uploadFile(blob);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelected(file);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true); setError(null); setAiPreview(null);
        try {
            const res = await fetchWithAuth('/api/ai/generate-image', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur IA');
            setAiPreview(data.url);
        } catch (e: any) { setError(e.message); }
        setAiGenerating(false);
    };

    const applyAiImage = () => {
        if (aiPreview) { onChange(aiPreview); setAiPreview(null); setAiPrompt(''); setMode('upload'); }
    };

    const cropAspect = aspectRatio === 'auto' ? 1 : aspectRatio === '21/9' ? 21 / 9 : aspectRatio === '16/9' ? 16 / 9 : 4 / 3;

    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">{label}</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ''; }} />

            {/* ── Crop Modal ── */}
            {cropSrc && (
                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="mb-4 text-center">
                        <p className="text-white text-[13px] font-bold">Recadrer l&apos;image</p>
                        <p className="text-white/50 text-[10px]">Faites glisser et zoomez pour ajuster</p>
                    </div>
                    <div className="w-[90vw] max-w-[600px] h-[60vh] relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                        <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={cropAspect}
                            onCropChange={setCrop} onZoomChange={setZoom}
                            onCropComplete={(_: Area, area: Area) => setCroppedArea(area)} />
                    </div>
                    <div className="mt-4 flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
                        <span className="text-white/40 text-[9px]">Zoom</span>
                        <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))}
                            className="w-32 accent-[#5a8fa3]" />
                        <span className="text-white/60 text-[10px] font-mono w-10">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <button onClick={() => setCropSrc(null)}
                            className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-[11px] font-bold hover:bg-white/20 transition-all">
                            Annuler
                        </button>
                        <button onClick={handleSkipCrop}
                            className="px-5 py-2.5 bg-white/20 border border-white/20 text-white rounded-xl text-[11px] font-bold hover:bg-white/30 transition-all">
                            Sans recadrage
                        </button>
                        <button onClick={handleCropConfirm} disabled={cropping}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#5a8fa3] text-white rounded-xl text-[11px] font-bold shadow-lg hover:bg-[#4a7f93] transition-all disabled:opacity-50">
                            {cropping ? <Loader2 size={13} className="animate-spin" /> : <Crop size={13} />}
                            {cropping ? 'Recadrage...' : 'Appliquer'}
                        </button>
                    </div>
                </div>
            )}

            {value ? (
                <div className={`relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm ${aspectRatio === 'auto' ? 'bg-gray-50 p-4 flex items-center justify-center' : ''}`}>
                    <img src={value} alt="" className={aspectRatio === 'auto' ? 'max-h-16 object-contain' : 'w-full object-cover'} style={aspectRatio !== 'auto' ? { aspectRatio } : undefined} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-1.5 flex-wrap px-3 opacity-0 group-hover:opacity-100">
                        <button onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all">
                            <Upload size={11} /> Upload
                        </button>
                        <button onClick={() => { setMode('ai'); onChange(''); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2E] rounded-lg text-[9px] font-bold text-white shadow-lg hover:bg-[#1a1a1a] transition-all">
                            <Bot size={11} /> IA
                        </button>
                        <button onClick={() => { setCropSrc(value); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all">
                            <Crop size={11} /> Crop
                        </button>
                        <a href={value} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all cursor-pointer">
                            <Download size={11} /> DL
                        </a>
                        <button onClick={() => onChange('')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/90 rounded-lg text-[9px] font-bold text-white shadow-lg hover:bg-red-600 transition-all">
                            <X size={11} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Mode toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setMode('upload')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold rounded-md transition-all ${mode === 'upload' ? 'bg-white text-[#2E2E2E] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}>
                            <Upload size={10} /> Télécharger
                        </button>
                        <button onClick={() => setMode('ai')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold rounded-md transition-all ${mode === 'ai' ? 'bg-white text-[#2E2E2E] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}>
                            <Bot size={10} /> Générer (IA)
                        </button>
                    </div>

                    {mode === 'upload' ? (
                        <div onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                                dragOver ? 'border-[#5a8fa3] bg-[#b9dae9]/10 scale-[1.01]' : 'border-gray-200 bg-gray-50/50 hover:border-[#b9dae9] hover:bg-[#b9dae9]/5'
                            }`}>
                            {uploading ? (
                                <Loader2 size={18} className="text-[#5a8fa3] animate-spin" />
                            ) : (
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <ImageIcon size={16} className="text-gray-400" />
                                </div>
                            )}
                            <p className="text-[10px] font-medium text-gray-500">{uploading ? 'Upload...' : 'Cliquez ou glissez'}</p>
                            <p className="text-[8px] text-gray-400">JPEG, PNG, WebP • Max 25 Mo</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {/* AI Preview */}
                            {aiPreview && (
                                <div className="space-y-2">
                                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                        <img src={aiPreview} alt="AI" className="w-full object-cover" style={{ aspectRatio }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={applyAiImage}
                                            className="flex items-center justify-center gap-1.5 py-2 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold hover:bg-[#1a1a2e] transition-all active:scale-[0.98]">
                                            <Check size={12} /> Appliquer
                                        </button>
                                        <button onClick={() => setAiPreview(null)}
                                            className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-all">
                                            Régénérer
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* Prompt */}
                            {!aiPreview && (
                                <>
                                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Ex: Hôtel de luxe à Bali au coucher du soleil..."
                                        className="w-full h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-[#5a8fa3] focus:ring-1 focus:ring-[#5a8fa3]/10 transition-all" />
                                    <div className="flex flex-wrap gap-1">
                                        {['Plage tropicale', 'Hôtel de luxe', 'Safari', 'Yacht', 'Montagne'].map(q => (
                                            <button key={q} onClick={() => setAiPrompt(q)}
                                                className="px-2 py-0.5 text-[8px] font-medium bg-gray-100 text-gray-500 rounded-md hover:bg-[#b9dae9]/20 hover:text-[#2E2E2E] transition-all">
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold shadow-sm hover:bg-[#1a1a1a] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                                        {aiGenerating ? <><Loader2 size={12} className="animate-spin" /> Génération...</> : <><Bot size={13} /> Générer avec l&apos;IA</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-red-500">
                    <AlertCircle size={10} /> {error}
                </div>
            )}
        </div>
    );
}


function VideoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState(value || '');

    // Keep urlInput in sync when value changes externally
    useEffect(() => { setUrlInput(value || ''); }, [value]);

    const handleFileSelected = async (file: File) => {
        if (!file) return;
        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        if (!validTypes.includes(file.type)) { setError('Format invalide. MP4, WebM ou MOV.'); return; }
        if (file.size > 100 * 1024 * 1024) { setError('Vidéo trop lourde (max 100 Mo).'); return; }
        setError(null);
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true); setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetchWithAuth('/api/crm/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur upload');
            onChange(data.url);
            setUrlInput(data.url);
        } catch (e: any) { setError(e.message || 'Erreur upload'); }
        setUploading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelected(file);
    };

    const handleUrlApply = () => {
        const trimmed = urlInput.trim();
        if (trimmed) { onChange(trimmed); setError(null); }
    };

    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">{label}</label>
            <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ''; }} />

            {/* URL input + Upload button */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onBlur={handleUrlApply}
                    onKeyDown={e => { if (e.key === 'Enter') handleUrlApply(); }}
                    placeholder="/video.mp4 ou URL complète"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:border-[#5a8fa3] focus:ring-1 focus:ring-[#5a8fa3]/20 outline-none transition-all"
                />
                <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:border-[#5a8fa3] hover:text-[#5a8fa3] transition-all disabled:opacity-50 shrink-0"
                >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploading ? 'Upload...' : 'Upload'}
                </button>
            </div>

            {/* Video preview */}
            {value && (
                <div className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex flex-col items-center justify-center p-2 min-h-[128px]">
                    <video key={value} src={value} className="w-full max-h-48 object-contain rounded" controls />
                    <div className="absolute inset-0 bg-black/60 flex-wrap items-center justify-center gap-2 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex">
                        <button onClick={() => fileRef.current?.click()}
                            className="px-2.5 py-1.5 bg-white/20 rounded-lg text-[10px] font-bold text-white hover:bg-white/30 transition-all flex items-center gap-1.5 backdrop-blur-sm">
                            <Upload size={12} /> Remplacer
                        </button>
                        <a href={value} download target="_blank" rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-white/20 rounded-lg text-[10px] font-bold text-white hover:bg-white/30 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer">
                            <Download size={12} /> DL
                        </a>
                        <button onClick={() => { onChange(''); setUrlInput(''); }}
                            className="px-2.5 py-1.5 bg-red-500/80 rounded-lg text-[10px] font-bold text-white hover:bg-red-500 transition-all flex items-center gap-1.5 backdrop-blur-sm">
                            <X size={12} /> Supprimer
                        </button>
                    </div>
                </div>
            )}

            {/* Drop zone only when no video set */}
            {!value && !uploading && (
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                        dragOver ? 'border-[#5a8fa3] bg-[#b9dae9]/10 scale-[1.01]' : 'border-gray-200 bg-gray-50/50 hover:border-[#b9dae9] hover:bg-[#b9dae9]/5'
                    }`}
                >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Upload size={14} className="text-gray-400" />
                    </div>
                    <p className="text-[10px] font-medium text-gray-400">Glissez une vidéo ici</p>
                    <p className="text-[8px] text-gray-300">MP4, WebM, MOV • Max 100 Mo</p>
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div className="flex items-center gap-2 text-[10px] text-[#5a8fa3]">
                    <Loader2 size={12} className="animate-spin" /> Upload en cours...
                </div>
            )}

            {error && (
                <div className="flex items-center gap-1.5 text-[9px] text-red-500">
                    <AlertCircle size={10} /> {error}
                </div>
            )}
        </div>
    );
}

