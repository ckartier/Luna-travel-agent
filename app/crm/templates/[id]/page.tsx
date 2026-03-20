'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Check, Loader2, Eye, RefreshCw, Wand2,
    ImagePlus, AlertCircle, ChevronDown, FileText, Paintbrush,
    LayoutGrid, ExternalLink, Palette, Sparkles, Upload, X, Image as ImageIcon, Crop, Download,
    Navigation, Type, Bold, Italic, Bot, Plus, Trash2, Code
} from 'lucide-react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { invalidateSiteConfigCache } from '@/src/hooks/useSiteConfig';
import { T } from '@/src/components/T';
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
    { id: 'gradient-shimmer', label: '✨ Gradient Shimmer' },
    { id: 'neon-border', label: '💡 Neon Border' },
    { id: 'float', label: '🎈 Float' },
    { id: 'blur-reveal', label: '🌫 Blur Reveal' },
    { id: 'grain', label: '📷 Film Grain' },
    { id: 'morph-border', label: '🔮 Morph Border' },
    { id: 'spotlight', label: '🔦 Spotlight' },
    { id: 'text-gradient', label: '🌈 Text Gradient' },
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

const DEFAULT_SECTION_ORDER = ['hero', 'collections', 'divider1', 'catalog', 'divider2', 'form', 'history'];

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
                const section = e.data.section as string;
                // Support built-in sections AND custom_* blocks
                const builtIn: Record<string, string> = {
                    hero: 'hero', collections: 'collections', divider1: 'divider1',
                    catalog: 'catalog', divider2: 'divider2', form: 'form',
                    history: 'history', nav: 'nav', footer: 'footer'
                };
                const sectionId = builtIn[section] || (section.startsWith('custom_') ? section : null);
                if (sectionId) {
                    setTab('contenu');
                    setTimeout(() => {
                        const el = document.getElementById(`editor-section-${sectionId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            const btn = el.querySelector('button');
                            const content = el.querySelector('[data-section-content]');
                            if (btn && !content) btn.click();
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
    const [pendingAutoSave, setPendingAutoSave] = useState(false);
    const [tab, setTab] = useState<Tab>('contenu');
    const [previewKey, setPreviewKey] = useState(0);

    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

    // Build the current sectionOrder: stored order + any new custom blocks appended
    const getSectionOrder = (): string[] => {
        const stored = config?.sectionOrder || DEFAULT_SECTION_ORDER;
        const customIds = (config?.blocks || []).filter((b: any) => b.id?.startsWith('custom_')).map((b: any) => b.id);
        // Ensure all custom blocks appear (append missing ones)
        const allIds = [...stored];
        customIds.forEach((cid: string) => { if (!allIds.includes(cid)) allIds.push(cid); });
        // Remove IDs that no longer exist (deleted custom blocks)
        return allIds.filter((id: string) => DEFAULT_SECTION_ORDER.includes(id) || customIds.includes(id));
    };
    const sectionOrder = config ? getSectionOrder() : DEFAULT_SECTION_ORDER;

    const handleSectionDrop = (dropId: string) => {
        if (!draggedSectionId || draggedSectionId === dropId) return;
        const order = [...sectionOrder];
        const dragIdx = order.indexOf(draggedSectionId);
        const dropIdx = order.indexOf(dropId);
        if (dragIdx === -1 || dropIdx === -1) return;
        order.splice(dragIdx, 1);
        order.splice(dropIdx, 0, draggedSectionId);
        setConfig((prev: any) => ({ ...prev, sectionOrder: order }));
        setDraggedSectionId(null);
        setDragOverSectionId(null);
    };

    // AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiTarget, setAiTarget] = useState<'hero' | 'history' | 'block'>('hero');

    useEffect(() => {
        setLoading(true);
        fetchWithAuth('/api/crm/site-config')
            .then(r => r.json())
            .then(data => { setConfig(data); setLoadedConfig(JSON.parse(JSON.stringify(data))); setLoading(false); setPreviewKey(k => k + 1); })
            .catch(() => setLoading(false));
    }, []);

    // When switching template tabs, DON'T remount iframe — just send new config via postMessage
    // This avoids the race condition where API fetch overwrites the editor's template override
    const prevIdRef = useRef(id);
    useEffect(() => {
        if (prevIdRef.current !== id) {
            prevIdRef.current = id;
            // Send updated config to existing iframe (no reload needed)
            const iframe = document.querySelector('iframe');
            if (iframe && (iframe as HTMLIFrameElement).contentWindow && config) {
                const payload = { ...config, template: id };
                (iframe as HTMLIFrameElement).contentWindow!.postMessage({ type: 'editor-update-config', config: payload }, '*');
                // Retry after 500ms in case iframe is still processing
                setTimeout(() => {
                    const iframe2 = document.querySelector('iframe');
                    if (iframe2 && (iframe2 as HTMLIFrameElement).contentWindow && config) {
                        (iframe2 as HTMLIFrameElement).contentWindow!.postMessage({ type: 'editor-update-config', config: payload }, '*');
                    }
                }, 500);
            }
        }
    }, [id, config]);

    // Dirty state: true if user changed anything since last load/save
    const isDirty = config && loadedConfig && JSON.stringify(config) !== JSON.stringify(loadedConfig);


    // Helpers
    const updateGlobal = (key: string, val: string) => {
        setConfig((p: any) => ({ ...p, global: { ...p.global, [key]: val } }));
    };
    const updateBlock = (type: string, key: string, val: any) => {
        setConfig((p: any) => {
            const exists = (p.blocks || []).some((b: any) => b.type === type);
            if (!exists) {
                return { ...p, blocks: [...(p.blocks || []), { id: type, type, [key]: val }] };
            }
            return {
                ...p,
                blocks: (p.blocks || []).map((b: any) => b.type === type ? { ...b, [key]: val } : b),
            };
        });
    };
    const addCustomBlock = (layoutType: string = 'image-right', defaultTitle: string = 'Nouveau Bloc', cols: string = '1') => {
        const id = `custom_${Date.now()}`;
        setConfig((p: any) => ({
            ...p,
            blocks: [...(p.blocks || []), {
                id, type: id, order: (p.blocks || []).length,
                visible: true, title: defaultTitle, subtitle: '', text: '',
                image: '', images: [] as string[], buttonText: '', buttonUrl: '',
                button2Text: '', button2Url: '',
                layout: layoutType, textAlign: 'left', columns: cols, htmlCode: '',
                headingColor: '', bgColor: '', textColor: '',
                buttonColor: '', buttonStyle: 'solid',
                overlayOpacity: '50', sectionHeight: 'auto',
                effect: '', animation: '', animationSpeed: 'normal',
            }],
        }));
    };
    const removeCustomBlock = (blockId: string) => {
        setConfig((p: any) => ({
            ...p,
            blocks: (p.blocks || []).filter((b: any) => b.id !== blockId),
        }));
    };
    const updateBusiness = (key: string, val: string) => {
        setConfig((p: any) => ({ ...p, business: { ...p.business, [key]: val } }));
    };
    const updateDivider = (divId: string, key: string, val: string) => {
        setConfig((p: any) => ({ ...p, dividers: { ...p.dividers, [divId]: { ...(p.dividers?.[divId] || {}), [key]: val } } }));
    };
    const updateFooter = (key: string, val: any) => {
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
            const heroBlock = (payload.blocks || []).find((b: any) => b.type === 'hero');
            console.log('[SAVE] Hero block videoUrl:', heroBlock?.videoUrl, '| global.heroVideoUrl:', payload.global?.heroVideoUrl);
            console.log('[SAVE] Full blocks count:', (payload.blocks || []).length);
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

    // Auto-save when triggered (e.g. after video upload)
    useEffect(() => {
        if (pendingAutoSave && config && !saving) {
            setPendingAutoSave(false);
            handleSave();
        }
    }, [pendingAutoSave, config]);

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
        console.log('[EDITOR] postMessage attempt:', { hasIframe: !!iframe, hasContentWindow: !!iframe?.contentWindow, hasConfig: !!config, collectionsColor: config?.global?.collectionsHeadingColor });
        if (iframe && iframe.contentWindow && config) {
            // Always override template with current editor tab so preview reflects selected template
            const payload = { ...config, template: id };
            iframe.contentWindow.postMessage({ type: 'editor-update-config', config: payload }, '*');
            console.log('[EDITOR] postMessage SENT with template:', id, 'config.global:', JSON.stringify(config.global).substring(0, 200));
        }
    }, [config, id]);

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

    const renderSharedBlockOptions = (blockType: string, isCustom: boolean) => {
        const block = config.blocks?.find((b: any) => b.type === blockType) || { type: blockType };
        const layoutOptions = isCustom ? ['image-right', 'image-left', 'image-top', 'image-bg', 'text-only', 'gallery', 'slider', 'columns', 'html'] : ['default', 'image-right', 'image-left', 'image-top', 'image-bg', 'text-only', 'gallery', 'slider', 'columns', 'html'];
        const layoutLabels = isCustom ? ['Image à droite', 'Image à gauche', 'Image au-dessus', 'Image en fond', 'Texte seul', 'Galerie grille', 'Slider défilant', 'Cartes en colonnes', 'Widget externe (HTML)'] : ['Composant Standard (Défaut)', 'Image à droite', 'Image à gauche', 'Image au-dessus', 'Image en fond', 'Texte seul', 'Galerie grille', 'Slider défilant', 'Cartes en colonnes', 'Widget externe (HTML)'];

        return (
            <>
                {/* ── Contenu ── */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-1 mb-2">Contenu</p>
                <Field label="Titre" value={block.title || ''} onChange={v => updateBlock(blockType, 'title', v)} />
                <Field label="Sous-titre" value={block.subtitle || ''} onChange={v => updateBlock(blockType, 'subtitle', v)} />
                <FieldArea label="Texte" value={block.text || ''} onChange={v => updateBlock(blockType, 'text', v)} />
                <ImageField label="Image principale" value={block.image || ''} onChange={v => updateBlock(blockType, 'image', v)} />
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-300 mt-3 mb-1">Galerie / Slider (max 6)</p>
                {(block.images || []).map((img: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                        <ImageField label={`Image ${idx + 2}`} value={img} onChange={v => {
                            const newImgs = [...(block.images || [])];
                            newImgs[idx] = v;
                            updateBlock(blockType, 'images', newImgs as any);
                        }} />
                        <button onClick={() => {
                            const newImgs = [...(block.images || [])].filter((_: any, i: number) => i !== idx);
                            updateBlock(blockType, 'images', newImgs as any);
                        }} className="shrink-0 w-6 h-6 rounded bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs">✕</button>
                    </div>
                ))}
                {(block.images || []).length < 6 && (
                    <button onClick={() => {
                        const newImgs = [...(block.images || []), ''];
                        updateBlock(blockType, 'images', newImgs as any);
                        // Auto-switch to gallery layout if not already gallery or slider
                        if (block.layout !== 'gallery' && block.layout !== 'slider') {
                            updateBlock(blockType, 'layout', 'gallery');
                        }
                    }} className="text-[10px] font-semibold text-[#5a8fa3] hover:text-[#4a7f93] transition-colors">+ Ajouter une image à la galerie</button>
                )}

                {/* ── Boutons ── */}
                <div className="my-2 border-t border-gray-100" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-2">Boutons</p>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Bouton 1 — Texte" value={block.buttonText || ''} onChange={v => updateBlock(blockType, 'buttonText', v)} placeholder="Découvrir →" />
                    <Field label="Bouton 1 — Lien" value={block.buttonUrl || ''} onChange={v => updateBlock(blockType, 'buttonUrl', v)} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Bouton 2 — Texte" value={block.button2Text || ''} onChange={v => updateBlock(blockType, 'button2Text', v)} placeholder="En savoir plus" />
                    <Field label="Bouton 2 — Lien" value={block.button2Url || ''} onChange={v => updateBlock(blockType, 'button2Url', v)} placeholder="https://..." />
                </div>
                <SelectField label="Style boutons" value={block.buttonStyle || 'solid'} options={['solid', 'outline', 'ghost']} optionLabels={['Plein', 'Contour', 'Transparent']} onChange={v => updateBlock(blockType, 'buttonStyle', v)} />

                {/* ── Layout & Style ── */}
                <div className="my-2 border-t border-gray-100" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-2">Couleurs</p>
                <div className="grid grid-cols-2 gap-2">
                    <ColorField label="Texte" value={block.textColor || ''} onChange={v => updateBlock(blockType, 'textColor', v)} />
                    <ColorField label="Titre" value={block.headingColor || ''} onChange={v => updateBlock(blockType, 'headingColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <ColorField label="Fond" value={block.bgColor || ''} onChange={v => updateBlock(blockType, 'bgColor', v)} />
                    {block.buttonText && <ColorField label="Bouton" value={block.buttonColor || ''} onChange={v => updateBlock(blockType, 'buttonColor', v)} />}
                </div>

                <div className="my-2 border-t border-gray-100" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-2">Mise en page</p>
                <SelectField label="Layout" value={block.layout || (isCustom ? 'image-right' : 'default')} options={layoutOptions} optionLabels={layoutLabels} onChange={v => updateBlock(blockType, 'layout', v)} />
                <SelectField label="Colonnes" value={block.columns || '1'} options={['1', '2', '3', '4']} optionLabels={['1 colonne', '2 colonnes', '3 colonnes', '4 colonnes']} onChange={v => {
                    updateBlock(blockType, 'columns', v);
                    // Auto-switch to columns layout when user picks >1
                    const count = parseInt(v);
                    if (count > 1 && block.layout !== 'columns') {
                        updateBlock(blockType, 'layout', 'columns');
                    }
                    // Auto-create column items if needed
                    const items = block.columnItems || [];
                    if (items.length < count) {
                        const newItems = [...items];
                        while (newItems.length < count) {
                            newItems.push({ title: `Colonne ${newItems.length + 1}`, text: '', image: '', buttonText: '', buttonUrl: '' });
                        }
                        updateBlock(blockType, 'columnItems', newItems as any);
                    }
                }} />
                {/* Column card editors — only visible when layout is columns */}
                {(block.layout === 'columns') && parseInt(block.columns || '1') > 1 && (block.columnItems || []).map((col: any, idx: number) => (
                    <div key={idx} className="p-3 mt-2 bg-[#f8fafc] rounded-lg border border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5a8fa3]">Colonne {idx + 1}</p>
                        <Field label="Titre" value={col.title || ''} onChange={v => {
                            const items = [...(block.columnItems || [])]; items[idx] = { ...items[idx], title: v };
                            updateBlock(blockType, 'columnItems', items as any);
                        }} />
                        <FieldArea label="Texte" value={col.text || ''} onChange={v => {
                            const items = [...(block.columnItems || [])]; items[idx] = { ...items[idx], text: v };
                            updateBlock(blockType, 'columnItems', items as any);
                        }} />
                        <ImageField label="Image" value={col.image || ''} onChange={v => {
                            const items = [...(block.columnItems || [])]; items[idx] = { ...items[idx], image: v };
                            updateBlock(blockType, 'columnItems', items as any);
                        }} />
                        <div className="grid grid-cols-2 gap-1">
                            <Field label="Bouton texte" value={col.buttonText || ''} onChange={v => {
                                const items = [...(block.columnItems || [])]; items[idx] = { ...items[idx], buttonText: v };
                                updateBlock(blockType, 'columnItems', items as any);
                            }} placeholder="CTA →" />
                            <Field label="Bouton lien" value={col.buttonUrl || ''} onChange={v => {
                                const items = [...(block.columnItems || [])]; items[idx] = { ...items[idx], buttonUrl: v };
                                updateBlock(blockType, 'columnItems', items as any);
                            }} placeholder="https://..." />
                        </div>
                    </div>
                ))}
                
                {block.layout === 'html' && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5a8fa3] mb-2 flex items-center gap-1.5"><Code size={13} /> Code HTML, Iframe ou Widget</p>
                        <textarea value={block.htmlCode || ''} onChange={e => updateBlock(blockType, 'htmlCode', e.target.value)} className="w-full h-48 p-3 text-[11px] font-mono bg-[#1E1E1E] text-[#D4D4D4] rounded-lg border-0 outline-none focus:ring-2 focus:ring-[#5a8fa3] resize-y" placeholder={`<iframe src="..."></iframe>\n\n<!-- Ou code JS de votre widget -->`} spellCheck={false} />
                        <p className="text-[10px] text-gray-400 mt-2">Collez ici le code de votre widget (Tripadvisor, formulaire externe, iframe, etc.). Le code sera injecté tel quel sur le site.</p>
                    </div>
                )}
                <SelectField label="Alignement texte" value={block.textAlign || 'left'} options={['left', 'center', 'right']} optionLabels={['Gauche', 'Centré', 'Droite']} onChange={v => updateBlock(blockType, 'textAlign', v)} />
                <SelectField label="Hauteur section" value={block.sectionHeight || 'auto'} options={['auto', 'small', 'medium', 'large', 'fullscreen']} optionLabels={['Auto', 'Petite', 'Moyenne', 'Grande', 'Plein écran']} onChange={v => updateBlock(blockType, 'sectionHeight', v)} />
                {block.layout === 'image-bg' && (
                    <SelectField label="Obscurité overlay" value={block.overlayOpacity || '50'} options={['20', '30', '40', '50', '60', '70', '80']} optionLabels={['20%', '30%', '40%', '50%', '60%', '70%', '80%']} onChange={v => updateBlock(blockType, 'overlayOpacity', v)} />
                )}

                {/* ── Effets ── */}
                <div className="my-2 border-t border-gray-100" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-2">Effets</p>
                <SelectField label="Effet visuel" value={block.effect || ''} options={EFFECT_OPTIONS.map(e => e.id)} optionLabels={EFFECT_OPTIONS.map(e => e.label)} onChange={v => updateBlock(blockType, 'effect', v)} />
                <SelectField label="Animation entrée" value={block.animation || ''} options={ANIMATION_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_OPTIONS.map(a => a.label)} onChange={v => updateBlock(blockType, 'animation', v)} />
                <SelectField label="Vitesse" value={block.animationSpeed || 'normal'} options={ANIMATION_SPEED_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_SPEED_OPTIONS.map(a => a.label)} onChange={v => updateBlock(blockType, 'animationSpeed', v)} />

                {/* ── Delete ── */}
                {isCustom && block.id && (
                    <>
                        <div className="my-2 border-t border-gray-100" />
                        <button onClick={() => removeCustomBlock(block.id)} className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all w-full justify-center">
                            <Trash2 size={13} /> Supprimer ce bloc
                        </button>
                    </>
                )}
            </>
        );
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
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                        <Eye size={16} /> Voir le site <ExternalLink size={12} className="opacity-30" />
                    </Link>

                    <button onClick={() => setPreviewKey(k => k + 1)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                                    onClick={() => {
                                        if (key !== id) {
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

                                {/* ── ALL SECTIONS — ordered by sectionOrder, all draggable ── */}
                                {sectionOrder.map((sectionId: string) => {
                                    const isCustom = sectionId.startsWith('custom_');
                                    const customBlock = isCustom ? blocks.find((b: any) => b.id === sectionId) : null;
                                    
                                    // Section title
                                    const sectionTitles: Record<string, string> = {
                                        hero: 'Hero', collections: 'Collections', divider1: '↕ Divider 1 — Parallaxe',
                                        catalog: 'Prestations & Services', divider2: '↕ Divider 2 — Parallaxe',
                                        history: 'Notre Histoire', form: 'Formulaire de Contact',
                                    };
                                    const title = isCustom ? `✦ ${customBlock?.title || 'Bloc Custom'}` : (sectionTitles[sectionId] || sectionId);

                                    // Section content renderer
                                    const renderSectionContent = () => {
                                        switch (sectionId) {
                                            case 'hero':
                                                return <>
                                                    {renderSharedBlockOptions('hero', false)}
                                                    <VideoField label="Vidéo de fond" value={blocks.find((b: any) => b.type === 'hero')?.videoUrl || ''} onChange={v => {
                                                        console.log('[EDITOR] Hero videoUrl changed to:', v ? v.substring(0, 80) + '...' : '(empty)');
                                                        updateBlock('hero', 'videoUrl', v);
                                                        // When clearing the video, also clear the global fallback to prevent the old video from reappearing
                                                        if (!v) updateGlobal('heroVideoUrl', '');
                                                        // Auto-save after video upload so it persists to Firebase immediately
                                                        if (v) setPendingAutoSave(true);
                                                    }} />
                                                    <ImageField label="Ou Image de site via config global" value={config.global?.heroImage || ''} onChange={v => updateGlobal('heroImage', v)} aspectRatio="16/9" />
                                                </>;
                                            case 'collections':
                                                return <>
                                                    {renderSharedBlockOptions('collections', false)}
                                                    <p className="text-[11px] text-amber-500 italic mt-2">⚡ Les destinations sont synchronisées avec le CRM</p>
                                                </>;
                                            case 'divider1':
                                                return <>
                                                    <Field label="Titre" value={config.dividers?.divider1?.title || "L'Art de Recevoir."} onChange={v => updateDivider('divider1', 'title', v)} />
                                                    <FieldArea label="Texte" value={config.dividers?.divider1?.text || ''} onChange={v => updateDivider('divider1', 'text', v)} />
                                                    <ImageField label="Image de fond" value={config.dividers?.divider1?.image || ''} onChange={v => updateDivider('divider1', 'image', v)} aspectRatio="21/9" />
                                                </>;
                                            case 'catalog':
                                                return <>
                                                    {renderSharedBlockOptions('catalog', false)}
                                                    <p className="text-[11px] text-amber-500 italic mt-2">⚡ Le catalogue est synchronisé avec le CRM</p>
                                                </>;
                                            case 'divider2':
                                                return <>
                                                    <Field label="Titre" value={config.dividers?.divider2?.title || "L'Excellence à la Française."} onChange={v => updateDivider('divider2', 'title', v)} />
                                                    <FieldArea label="Texte" value={config.dividers?.divider2?.text || ''} onChange={v => updateDivider('divider2', 'text', v)} />
                                                    <ImageField label="Image de fond" value={config.dividers?.divider2?.image || ''} onChange={v => updateDivider('divider2', 'image', v)} aspectRatio="21/9" />
                                                </>;
                                            case 'history':
                                                return renderSharedBlockOptions('history', false);
                                            case 'form':
                                                return renderSharedBlockOptions('form', false);
                                            default:
                                                if (isCustom) return renderSharedBlockOptions(sectionId, true);
                                                return null;
                                        }
                                    };

                                    return (
                                        <div key={sectionId} className="relative">
                                            {/* Drop indicator line */}
                                            {dragOverSectionId === sectionId && draggedSectionId !== sectionId && (
                                                <div className="absolute -top-1 left-4 right-4 h-0.5 bg-[#5a8fa3] rounded-full z-10 shadow-[0_0_6px_rgba(90,143,163,0.5)]" />
                                            )}
                                            <div className={`${draggedSectionId === sectionId ? 'opacity-40 scale-[0.98]' : 'opacity-100'} transition-all duration-200`}>
                                                <Section
                                                    title={`⋮⋮ ${title}`}
                                                    sectionId={sectionId}
                                                    highlighted={highlightedSection === sectionId}
                                                    draggable={true}
                                                    onDragStart={(e: any) => {
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        setDraggedSectionId(sectionId);
                                                    }}
                                                    onDragOver={(e: any) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                        if (dragOverSectionId !== sectionId) setDragOverSectionId(sectionId);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggedSectionId(null);
                                                        setDragOverSectionId(null);
                                                    }}
                                                    onDrop={(e: any) => {
                                                        e.preventDefault();
                                                        handleSectionDrop(sectionId);
                                                    }}
                                                >
                                                    {renderSectionContent()}
                                                </Section>
                                            </div>
                                        </div>
                                    );
                                })}

                                <Section title="Informations Entreprise" sectionId="business" highlighted={highlightedSection === 'business'}>
                                    <Field label="Nom" value={config.business?.name || ''} onChange={v => updateBusiness('name', v)} />
                                    <Field label="Email" value={config.business?.email || ''} onChange={v => updateBusiness('email', v)} />
                                    <Field label="Téléphone" value={config.business?.phone || ''} onChange={v => updateBusiness('phone', v)} />
                                    <Field label="WhatsApp" value={config.business?.whatsapp || ''} onChange={v => updateBusiness('whatsapp', v)} />
                                    <Field label="Instagram" value={config.business?.instagram || ''} onChange={v => updateBusiness('instagram', v)} placeholder="https://..." />
                                    <Field label="Facebook" value={config.business?.facebook || ''} onChange={v => updateBusiness('facebook', v)} placeholder="https://..." />
                                    <Field label="TikTok" value={config.business?.tiktok || ''} onChange={v => updateBusiness('tiktok', v)} placeholder="https://..." />
                                </Section>

                                <Section title="Footer" sectionId="footer" highlighted={highlightedSection === 'footer'}>
                                    <Field label="Titre colonne 'Contact'" value={config.footer?.colContactTitle || ''} onChange={v => updateFooter('colContactTitle', v)} placeholder="Contact" />
                                    <Field label="Texte de copyright" value={config.footer?.copyright || ''} onChange={v => updateFooter('copyright', v)} placeholder="© 2026 Votre Agence" />
                                    <FieldArea label="Description longue" value={config.footer?.description || ''} onChange={v => updateFooter('description', v)} />

                                    <div className="my-4 border-t border-gray-100" />
                                    <Field label="Titre colonne 1" value={config.footer?.col1Title || ''} onChange={v => updateFooter('col1Title', v)} placeholder="Voyages" />
                                    <LinkListEditor label="Liens colonne 1" links={config.footer?.col1Links || []} onChange={v => updateFooter('col1Links', v)} />

                                    <div className="my-4 border-t border-gray-100" />
                                    <Field label="Titre colonne 2" value={config.footer?.col2Title || ''} onChange={v => updateFooter('col2Title', v)} placeholder="Services" />
                                    <LinkListEditor label="Liens colonne 2" links={config.footer?.col2Links || []} onChange={v => updateFooter('col2Links', v)} />

                                    <div className="my-4 border-t border-gray-100" />
                                    <Field label="Titre colonne 3" value={config.footer?.col3Title || ''} onChange={v => updateFooter('col3Title', v)} placeholder="À Propos" />
                                    <LinkListEditor label="Liens colonne 3" links={config.footer?.col3Links || []} onChange={v => updateFooter('col3Links', v)} />
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
                                    <ColorField label="Titre Collections" value={config.global?.collectionsHeadingColor || config.global?.headingColor || '#2E2E2E'} onChange={v => updateGlobal('collectionsHeadingColor', v)} />
                                    <ColorField label="Titre Prestations" value={config.global?.catalogHeadingColor || config.global?.headingColor || '#2E2E2E'} onChange={v => updateGlobal('catalogHeadingColor', v)} />
                                    <ColorField label="Couleur du texte" value={config.global?.textColor || '#2E2E2E'} onChange={v => updateGlobal('textColor', v)} />
                                    <ColorField label="Fond" value={config.global?.bgColor || '#ffffff'} onChange={v => updateGlobal('bgColor', v)} />
                                    <ColorField label="Bouton CTA" value={config.global?.ctaColor || '#2E2E2E'} onChange={v => updateGlobal('ctaColor', v)} />
                                    <ColorField label="Modal & panier" value={config.global?.modalColor || '#2E2E2E'} onChange={v => updateGlobal('modalColor', v)} />
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

                                {/* Custom blocks */}
                                {blocks.filter((b: any) => b.id?.startsWith('custom_')).map((block: any) => {
                                    const visible = block.visible !== false;
                                    return (
                                        <div key={block.id} className={`p-4 rounded-xl border transition-all ${visible ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-gray-100/50 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <p className="text-[14px] font-bold text-[#2E2E2E]">✦ {block.title || 'Bloc Custom'}</p>
                                                    <p className="text-[11px] text-gray-400">Section personnalisée</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => removeCustomBlock(block.id)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <button onClick={() => updateBlock(block.type, 'visible', !visible)}
                                                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${visible ? 'bg-[#5a8fa3]' : 'bg-gray-200'}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${visible ? 'left-[22px]' : 'left-0.5'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                            {visible && (
                                                <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
                                                    <SelectField label="Animation" value={block.animation || ''} options={ANIMATION_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_OPTIONS.map(a => a.label)} onChange={v => updateBlock(block.type, 'animation', v)} />
                                                    <SelectField label="Vitesse" value={block.animationSpeed || 'normal'} options={ANIMATION_SPEED_OPTIONS.map(a => a.id)} optionLabels={ANIMATION_SPEED_OPTIONS.map(a => a.label)} onChange={v => updateBlock(block.type, 'animationSpeed', v)} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Add custom block buttons */}
                                <div className="grid grid-cols-2 gap-2 mt-6">
                                    <button onClick={() => addCustomBlock('image-right', 'Texte & Image')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-500 hover:border-[#5a8fa3] hover:text-[#5a8fa3] hover:bg-[#5a8fa3]/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                        <Plus size={14} /> Image / Texte
                                    </button>
                                    <button onClick={() => addCustomBlock('gallery', 'Nouvelle Galerie')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-500 hover:border-[#5a8fa3] hover:text-[#5a8fa3] hover:bg-[#5a8fa3]/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                        <Plus size={14} /> Galerie
                                    </button>
                                    <button onClick={() => addCustomBlock('slider', 'Nouveau Slider')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-500 hover:border-[#5a8fa3] hover:text-[#5a8fa3] hover:bg-[#5a8fa3]/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                        <Plus size={14} /> Slider
                                    </button>
                                    <button onClick={() => addCustomBlock('columns', 'Nouvelle Grille', '3')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-500 hover:border-[#5a8fa3] hover:text-[#5a8fa3] hover:bg-[#5a8fa3]/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                        <Plus size={14} /> Grille (1-4 col)
                                    </button>
                                    <button onClick={() => addCustomBlock('html', 'Widget / Emded Externe')}
                                        className="col-span-2 w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-[12px] font-bold text-gray-400 hover:border-[#5a8fa3] hover:text-[#5a8fa3] hover:bg-[#5a8fa3]/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                                        <Plus size={16} /> Ajouter Widget / Code Externe
                                    </button>
                                </div>
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
                                        className="w-full h-20 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#5a8fa3]/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm" />
                                </div>

                                {/* Quick prompts */}
                                <div className="flex flex-wrap gap-1.5">
                                    {['Plage tropicale', 'Hôtel de luxe', 'Safari africain', 'Yacht', 'Villa Bali', 'Montagne enneigée'].map(q => (
                                        <button key={q} onClick={() => setAiPrompt(q)}
                                            className="px-2.5 py-1 text-[9px] font-medium bg-gray-100 text-gray-500 rounded-lg hover:bg-[#b9dae9]/20 hover:text-[#2E2E2E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                                                className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[11px] font-semibold hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                    <iframe
                        id="preview-iframe"
                        key={previewKey}
                        src="/conciergerie"
                        className="w-full flex-1 border-0"
                        title="Preview"
                        onLoad={(e) => {
                            // Send config to iframe after it's fully loaded (fixes timing issue)
                            const iframeEl = e.currentTarget;
                            if (iframeEl.contentWindow && config) {
                                // Always include current template tab override
                                const payload = { ...config, template: id };
                                iframeEl.contentWindow.postMessage({ type: 'editor-update-config', config: payload }, '*');
                                // Retry after delays to win the race against the API fetch in the iframe
                                setTimeout(() => {
                                    if (iframeEl.contentWindow) {
                                        iframeEl.contentWindow.postMessage({ type: 'editor-update-config', config: payload }, '*');
                                    }
                                }, 300);
                                setTimeout(() => {
                                    if (iframeEl.contentWindow) {
                                        iframeEl.contentWindow.postMessage({ type: 'editor-update-config', config: payload }, '*');
                                    }
                                }, 800);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// ═══ UI Components ═══

function Section({ title, children, sectionId, highlighted, draggable, onDragStart, onDragOver, onDragEnd, onDrop, className }: { title: string; children: React.ReactNode; sectionId?: string; highlighted?: boolean; draggable?: boolean; onDragStart?: any; onDragOver?: any; onDragEnd?: any; onDrop?: any; className?: string }) {
    const [open, setOpen] = useState(false);
    const handleToggle = () => {
        setOpen(!open);
        // Scroll preview to this section
        if (sectionId && !open) {
            const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'editor-scroll-to', section: sectionId }, '*');
            }
        }
    };
    return (
        <div id={sectionId ? `editor-section-${sectionId}` : undefined}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            className={`rounded-xl overflow-hidden transition-all duration-300 ${className || ''} ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1' : ''} ${
                highlighted ? 'ring-2 ring-[#5a8fa3]/30 shadow-lg shadow-[#5a8fa3]/10' : ''
            } ${open ? 'bg-white shadow-sm border border-gray-100/60' : 'bg-white/60 hover:bg-white border border-gray-100/40 shadow-sm'}`}>
            <button onClick={handleToggle} className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:bg-gray-50/50'}`}>
                <span className="text-[14px] font-bold text-[#2E2E2E] tracking-wide">{title}</span>
                <ChevronDown size={15} className={`text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div data-section-content className="px-4 pb-4 space-y-3">{children}</div>}
        </div>
    );
}

function LinkListEditor({ label, links = [], onChange }: { label: string; links: { label: string; href: string }[]; onChange: (v: any[]) => void }) {
    return (
        <div className="space-y-2 mb-4">
            <p className="text-[12px] font-semibold text-[#2E2E2E] mb-2">{label}</p>
            {links.map((link, i) => (
                <div key={i} className="flex gap-2 relative">
                    <input type="text" value={link.label} onChange={e => {
                        const newLinks = [...links]; newLinks[i].label = e.target.value; onChange(newLinks);
                    }} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#5a8fa3] transition-colors" placeholder="Label" />
                    <input type="text" value={link.href} onChange={e => {
                        const newLinks = [...links]; newLinks[i].href = e.target.value; onChange(newLinks);
                    }} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-mono outline-none focus:border-[#5a8fa3] transition-colors" placeholder="URL" />
                    <button onClick={() => {
                        onChange(links.filter((_, idx) => idx !== i));
                    }} className="shrink-0 px-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">✕</button>
                    {/* Add drag handles later if needed */}
                </div>
            ))}
            <button onClick={() => onChange([...links, { label: '', href: '' }])} className="text-[11px] font-bold text-[#5a8fa3] hover:underline mt-1">+ Ajouter un lien</button>
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] placeholder:text-gray-300 focus:outline-none focus:border-[#b9dae9] focus:bg-white focus:shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm" />
        </div>
    );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] resize-none focus:outline-none focus:border-[#b9dae9] focus:bg-white focus:shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm" />
        </div>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    // Normalize: always ensure exactly one # prefix
    const normalizeColor = (raw: string) => {
        const stripped = raw.replace(/^#+/, ''); // Remove all leading #
        return stripped ? `#${stripped}` : value; // Add exactly one, or keep current if empty
    };
    const normalizedValue = value?.startsWith('#') ? value : `#${value || '000000'}`;
    return (
        <div className="flex items-center gap-2.5">
            <input type="color" value={normalizedValue} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded-md border border-gray-200/60 cursor-pointer p-0.5 bg-white" />
            <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/80 block">{label}</label>
                <input type="text" value={value} onChange={e => onChange(normalizeColor(e.target.value))}
                    onBlur={e => onChange(normalizeColor(e.target.value))}
                    className="w-full px-2 py-1 bg-[#fafbfc] border border-gray-200/60 rounded text-[11px] text-gray-500 font-mono focus:outline-none focus:border-[#b9dae9] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm" />
            </div>
        </div>
    );
}

function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: string[]; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400/80 mb-1 block">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#fafbfc] border border-gray-200/60 rounded-lg text-[12px] text-[#2E2E2E] focus:outline-none focus:border-[#b9dae9] focus:bg-white appearance-none cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                            className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-[11px] font-bold hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                            Annuler
                        </button>
                        <button onClick={handleSkipCrop}
                            className="px-5 py-2.5 bg-white/20 border border-white/20 text-white rounded-xl text-[11px] font-bold hover:bg-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                            <Upload size={11} /> Upload
                        </button>
                        <button onClick={() => { setMode('ai'); onChange(''); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2E2E2E] rounded-lg text-[9px] font-bold text-white shadow-lg hover:bg-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                            <Bot size={11} /> IA
                        </button>
                        <button onClick={() => { setCropSrc(value); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                            <Crop size={11} /> Crop
                        </button>
                        <a href={value} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold text-[#2E2E2E] shadow-lg hover:bg-white transition-all cursor-pointer">
                            <Download size={11} /> DL
                        </a>
                        <button onClick={() => onChange('')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/90 rounded-lg text-[9px] font-bold text-white shadow-lg hover:bg-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                                            className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                                        className="w-full h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-[#5a8fa3] focus:ring-1 focus:ring-[#5a8fa3]/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm" />
                                    <div className="flex flex-wrap gap-1">
                                        {['Plage tropicale', 'Hôtel de luxe', 'Safari', 'Yacht', 'Montagne'].map(q => (
                                            <button key={q} onClick={() => setAiPrompt(q)}
                                                className="px-2 py-0.5 text-[8px] font-medium bg-gray-100 text-gray-500 rounded-md hover:bg-[#b9dae9]/20 hover:text-[#2E2E2E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:border-[#5a8fa3] focus:ring-1 focus:ring-[#5a8fa3]/20 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
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
                    <video key={value} className="w-full max-h-48 object-contain rounded" controls muted playsInline>
                        <source src={value} type="video/mp4" />
                    </video>
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

