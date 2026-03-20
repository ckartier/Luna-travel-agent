'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, Layout, Globe, Mail, BookOpen, Check, Sparkles, ArrowRight, Eye, Pencil,
    Grid3X3, Maximize, FileText, Loader2, Send, Edit3, Trash2, Gavel, Scale, Briefcase, FileSignature, Receipt, Plane, MapPin, CreditCard, Copy, CheckCircle2, X,
    UserPlus, Heart, Star, Cake, Newspaper
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVertical } from '@/src/contexts/VerticalContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T } from '@/src/components/T';

// ═══ WEB TEMPLATES (TRAVEL) ═══
const TRAVEL_WEB_TEMPLATES = [
    {
        id: 'elegance', name: 'Élégance',
        description: 'Design editorial luxe avec grande typographie, parallax dividers et transitions fluides. Idéal conciergeries haut de gamme.',
        gradient: 'from-amber-50 via-[#faf8f5] to-amber-50', style: 'Luxe & Editorial',
        features: ['Hero plein écran avec vidéo', 'Parallax scroll dividers', 'Palette tons chauds dorés', 'Animations fade-in subtiles'],
        preview: { heroLayout: 'Full-screen', cardStyle: 'Overlay gradient', animation: 'Fade + Parallax', colorScheme: 'Warm gold' },
        defaults: { primaryColor: '#2E2E2E', secondaryColor: '#b9dae9', accentColor: '#E2C8A9', fontHeading: 'Playfair Display', fontBody: 'Inter' }
    },
    {
        id: 'moderne', name: 'Moderne',
        description: 'Layout split-screen audacieux, animations slide-in et design géométrique.',
        gradient: 'from-sky-50 via-white to-violet-50', style: 'Clean & Dynamic',
        features: ['Hero split-screen', 'Cards horizontales', 'Grille asymétrique', 'Animations slide-in latérales'],
        preview: { heroLayout: 'Split-screen', cardStyle: 'Horizontal image', animation: 'Slide-in', colorScheme: 'Cool blue' },
        defaults: { primaryColor: '#1e3a5f', secondaryColor: '#63b3ed', accentColor: '#a78bfa', fontHeading: 'Outfit', fontBody: 'DM Sans' }
    },
    {
        id: 'immersif', name: 'Immersif',
        description: 'Sections plein écran, dark mode natif, transitions cinématiques.',
        gradient: 'from-gray-900 via-[#1a1a2e] to-gray-900', style: 'Cinematic & Dark',
        features: ['Hero fullscreen vidéo', 'Dark mode élégant', 'Effets glassmorphism', 'Scroll-linked animations'],
        preview: { heroLayout: 'Full-bleed immersive', cardStyle: 'Glass card + blur', animation: 'Scroll-linked', colorScheme: 'Dark + neon' },
        defaults: { primaryColor: '#0f172a', secondaryColor: '#06b6d4', accentColor: '#f59e0b', fontHeading: 'Manrope', fontBody: 'Inter' }
    },
    {
        id: 'prestige', name: 'Prestige',
        description: "Palette chaude crème, typographie serif, grille masonry décalée.",
        gradient: 'from-[#f5efe6] via-[#f0e8da] to-[#ede4d4]', style: 'Warm & Refined',
        features: ['Hero texte superposé', 'Grille masonry décalée', 'Cards à bordure dorée', 'Animations reveal'],
        preview: { heroLayout: 'Centered overlay', cardStyle: 'Vertical gold border', animation: 'Reveal + Stagger', colorScheme: 'Cream & terracotta' },
        defaults: { primaryColor: '#3d3225', secondaryColor: '#c4956a', accentColor: '#8b9d6e', fontHeading: 'Cormorant Garamond', fontBody: 'Lato' }
    },
];

// ═══ WEB TEMPLATES (LEGAL) ═══
const LEGAL_WEB_TEMPLATES = [
    {
        id: 'cabinet', name: 'Cabinet',
        description: 'Design formel et structuré, typographie serif académique, parfait pour un cabinet d\'avocats classique.',
        gradient: 'from-slate-50 via-white to-slate-50', style: 'Formel & Académique',
        features: ['Hero avec portrait associé', 'Typographie classique (Garamond)', 'Sépia et bleu marin', 'Animations sobres'],
        preview: { heroLayout: 'Classic Centered', cardStyle: 'Shadow boxed', animation: 'Subtle Fade', colorScheme: 'Navy & Sepia' },
        defaults: { primaryColor: '#1e293b', secondaryColor: '#94a3b8', accentColor: '#A07850', fontHeading: 'Cormorant Garamond', fontBody: 'Inter' }
    },
    {
        id: 'justice', name: 'Justice',
        description: 'Un style minimaliste et droit au but pour les cabinets spécialisés en pénal ou contentieux.',
        gradient: 'from-gray-900 via-gray-800 to-gray-900', style: 'Minimaliste & Direct',
        features: ['Typographie sans-serif bold', 'Thème très contrasté', 'Mise en page épurée', 'Transitions rapides'],
        preview: { heroLayout: 'Split-Screen Bold', cardStyle: 'Flat Card', animation: 'Instant', colorScheme: 'Black & Gold' },
        defaults: { primaryColor: '#0f172a', secondaryColor: '#475569', accentColor: '#A07850', fontHeading: 'Outfit', fontBody: 'Roboto' }
    },
    {
        id: 'corporate', name: 'Corporate',
        description: 'Destiné au droit des affaires, ce template respire le professionnalisme et la clarté financière.',
        gradient: 'from-[#f0f4f8] via-white to-[#f0f4f8]', style: 'Corporate & Affaires',
        features: ['Grilles rigoureuses', 'Bleu institutionnel', 'Graphiques de statistiques', 'Aspect rapport annuel'],
        preview: { heroLayout: 'Left aligned', cardStyle: 'Clean lines', animation: 'Slide Up', colorScheme: 'Corporate Blue' },
        defaults: { primaryColor: '#00264d', secondaryColor: '#A07850', accentColor: '#d6d3d1', fontHeading: 'Inter', fontBody: 'DM Sans' }
    },
    {
        id: 'boutique', name: 'Boutique',
        description: 'Une approche premium et sur-mesure, idéale pour le droit familial ou l\'ingéniérie patrimoniale.',
        gradient: 'from-[#faf9f6] via-[#f7f5f0] to-[#faf9f6]', style: 'Premium & Intimiste',
        features: ['Marges généreuses', 'Couleurs pastels et chaudes', 'Images rondes', 'Animations fluides'],
        preview: { heroLayout: 'Centered Image', cardStyle: 'Soft Shadow', animation: 'Fade & Scale', colorScheme: 'Warm Beige' },
        defaults: { primaryColor: '#4a3f35', secondaryColor: '#A07850', accentColor: '#c7bca7', fontHeading: 'Playfair Display', fontBody: 'Lora' }
    },
];


// ═══ DOC/EMAIL TEMPLATES (LEGAL) ═══
const LEGAL_DOC_TEMPLATES = [
    { id: 'assignation', name: 'Assignation', icon: Gavel, category: 'procédure', color: '#5a3e91', description: 'Acte d\'huissier introductif d\'instance devant le tribunal compétent.', content: 'PAR DEVANT LE TRIBUNAL JUDICIAIRE DE [VILLE]\n\nASSIGNATION...' },
    { id: 'conclusions', name: 'Conclusions', icon: BookOpen, category: 'plaidoirie', color: '#2563eb', description: 'Mémoire en demande ou en défense devant le tribunal.', content: 'CONCLUSIONS EN [DEMANDE/DÉFENSE]...' },
    { id: 'mise-en-demeure', name: 'Mise en Demeure', icon: FileSignature, category: 'courrier', color: '#dc2626', description: 'Lettre de mise en demeure formelle pour obtenir l\'exécution d\'une obligation.', content: 'LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION...', previewKey: 'legal-mise-en-demeure' },
    { id: 'convention-honoraires', name: 'Convention d\'Honoraires', icon: Receipt, category: 'cabinet', color: '#059669', description: 'Convention d\'honoraires entre l\'avocat et son client pour la fixation des modalités.', content: 'CONVENTION D\'HONORAIRES...' },
    { id: 'requete', name: 'Requête', icon: Scale, category: 'procédure', color: '#7c3aed', description: 'Requête introductive d\'instance ou requête aux fins d\'ordonnance.', content: 'REQUÊTE AUX FINS DE [OBJET]...' },
    { id: 'protocole-transaction', name: 'Protocole Transactionnel', icon: Briefcase, category: 'amiable', color: '#d97706', description: 'Accord transactionnel pour mettre fin à un litige à l\'amiable.', content: 'PROTOCOLE D\'ACCORD TRANSACTIONNEL...' },
    { id: 'notif-dossier', name: 'Notification Dossier', icon: Mail, category: 'courrier', color: '#1e40af', description: 'Email de notification d\'ouverture ou de mise à jour d\'un dossier client.', previewKey: 'legal-dossier' },
    { id: 'convocation-audience', name: 'Convocation Audience', icon: Gavel, category: 'procédure', color: '#d97706', description: 'Convocation client pour une audience au tribunal avec détails pratiques.', previewKey: 'legal-hearing' },
    { id: 'note-honoraires', name: 'Note d\'Honoraires', icon: Receipt, category: 'cabinet', color: '#059669', description: 'Facture d\'honoraires avec détail des prestations et heures passées.', previewKey: 'legal-invoice' },
];
const LEGAL_CATEGORIES = [{ id: 'all', label: 'Tous' }, { id: 'procédure', label: 'Procédure' }, { id: 'plaidoirie', label: 'Plaidoirie' }, { id: 'courrier', label: 'Courrier' }, { id: 'cabinet', label: 'Cabinet' }, { id: 'amiable', label: 'Amiable' }];

// ═══ DOC/EMAIL TEMPLATES (TRAVEL) ═══
const TRAVEL_EMAIL_TEMPLATES = [
    { id: 'acknowledgment', name: 'Accusé de Réception', icon: Mail, category: 'auto-reply', color: '#2E2E2E', description: 'Email de confirmation automatique envoyé à la réception d\'une demande client.', previewKey: 'master' },
    { id: 'quote', name: 'Devis / Proposition', icon: FileSignature, category: 'finance', color: '#2E2E2E', description: 'Proposition tarifaire détaillée avec récapitulatif des prestations.', previewKey: 'quote' },
    { id: 'invoice', name: 'Facture', icon: Receipt, category: 'finance', color: '#059669', description: 'Facture client avec suivi des paiements et montants restants.', previewKey: 'invoice' },
    { id: 'roadmap', name: 'Carnet de Voyage', icon: MapPin, category: 'voyage', color: '#C4956A', description: 'Itinéraire jour par jour avec les highlights du voyage.', previewKey: 'roadmap' },
    { id: 'departure', name: 'Avant le Départ', icon: Plane, category: 'voyage', color: '#f59e0b', description: 'Checklist et conseils pratiques pour préparer le départ.', previewKey: 'departure' },
    { id: 'portal', name: 'Espace Client', icon: Globe, category: 'portail', color: '#5a8fa3', description: 'Invitation à accéder à l\'espace client personnalisé.', previewKey: 'master' },
    { id: 'payment-reminder', name: 'Rappel de Paiement', icon: CreditCard, category: 'finance', color: '#f59e0b', description: 'Relance de paiement avec suivi des échéances.', previewKey: 'invoice' },
    { id: 'welcome', name: 'Bienvenue Client', icon: UserPlus, category: 'crm', color: '#0284c7', description: 'Email d\'accueil envoyé lors de la création d\'un nouveau client.', previewKey: 'welcome' },
    { id: 'post-trip', name: 'Merci Post-Voyage', icon: Heart, category: 'crm', color: '#C4956A', description: 'Remerciements et offre de fidélité après le retour du client.', previewKey: 'post-trip' },
    { id: 'review-request', name: 'Demande d\'Avis', icon: Star, category: 'crm', color: '#f59e0b', description: 'Solliciter un témoignage ou un avis client après un voyage.', previewKey: 'review' },
    { id: 'birthday', name: 'Anniversaire', icon: Cake, category: 'marketing', color: '#ec4899', description: 'Souhait d\'anniversaire avec offre promotionnelle personnalisée.', previewKey: 'birthday' },
    { id: 'newsletter', name: 'Inspiration Voyage', icon: Newspaper, category: 'marketing', color: '#0891b2', description: 'Newsletter saisonnière avec destinations coup de cœur.', previewKey: 'newsletter' },
];
const TRAVEL_CATEGORIES = [{ id: 'all', label: 'Tous' }, { id: 'auto-reply', label: 'Auto-Reply' }, { id: 'finance', label: 'Finance' }, { id: 'voyage', label: 'Voyage' }, { id: 'crm', label: 'CRM' }, { id: 'marketing', label: 'Marketing' }, { id: 'portail', label: 'Portail' }];


export default function SiteBuilderUnifiedPage() {
    const { vertical } = useVertical();
    const router = useRouter();
    const isLegal = vertical.id === 'legal';
    const accentColor = isLegal ? '#A07850' : '#5a8fa3';

    const [activeTab, setActiveTab] = useState<'web' | 'docs'>('web');

    // Web Templates State
    const WEB_TEMPLATES = isLegal ? LEGAL_WEB_TEMPLATES : TRAVEL_WEB_TEMPLATES;
    const [selectedWebTemplate, setSelectedWebTemplate] = useState<string>(WEB_TEMPLATES[0].id);
    const [currentActiveWeb, setCurrentActiveWeb] = useState(WEB_TEMPLATES[0].id);

    // Docs Templates State
    const DOC_TEMPLATES = isLegal ? LEGAL_DOC_TEMPLATES : TRAVEL_EMAIL_TEMPLATES;
    const DOC_CATEGORIES = isLegal ? LEGAL_CATEGORIES : TRAVEL_CATEGORIES;
    const [docSearch, setDocSearch] = useState('');
    const [docCategory, setDocCategory] = useState('all');
    const [selectedDocTemplate, setSelectedDocTemplate] = useState<any>(null);
    const [previewDocHtml, setPreviewDocHtml] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [docCopied, setDocCopied] = useState(false);
    const [docSending, setDocSending] = useState(false);
    const [docSent, setDocSent] = useState(false);

    useEffect(() => {
        if (activeTab === 'web') {
            fetchWithAuth('/api/crm/site-config')
                .then(r => r.json())
                .then(data => {
                    if (data.template) {
                        setSelectedWebTemplate(data.template);
                        setCurrentActiveWeb(data.template);
                    }
                })
                .catch(console.error);
        }
    }, [activeTab]);

    const activeWebTemplateData = WEB_TEMPLATES.find(t => t.id === selectedWebTemplate) || WEB_TEMPLATES[0];

    const filteredDocs = DOC_TEMPLATES.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(docSearch.toLowerCase()) || t.description.toLowerCase().includes(docSearch.toLowerCase());
        const matchCat = docCategory === 'all' || t.category === docCategory;
        return matchSearch && matchCat;
    });

    const handlePreviewDoc = async (t: any) => {
        setSelectedDocTemplate(t);
        if (!isLegal && t.previewKey) {
            setPreviewLoading(true);
            setPreviewDocHtml(null);
            try {
                const res = await fetchWithAuth(`/api/crm/email-preview?template=${t.previewKey}&embed=true`);
                if (res.ok) {
                    const html = await res.text();
                    setPreviewDocHtml(html);
                }
            } catch (e) { console.error('Preview error:', e); }
            setPreviewLoading(false);
        }
    };

    const handleCopyDoc = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            setDocCopied(true);
            setTimeout(() => setDocCopied(false), 2000);
        });
    };

    const handleSendTestDoc = async (t: any) => {
        setDocSending(true);
        try {
            // Fetch the rendered HTML template first
            let htmlBody: string | null = null;
            if (t.previewKey) {
                try {
                    const previewRes = await fetchWithAuth(`/api/crm/email-preview?template=${t.previewKey}&embed=true`);
                    if (previewRes.ok) {
                        htmlBody = await previewRes.text();
                    }
                } catch (e) { console.error('Preview fetch error:', e); }
            }

            const res = await fetchWithAuth('/api/gmail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'ckartier@gmail.com',
                    subject: `[Test Luna] ${t.name}`,
                    message: `Template "${t.name}" — Luna Conciergerie`,
                    ...(htmlBody ? { bodyHtml: htmlBody } : {}),
                }),
            });
            if (res.ok) {
                setDocSent(true);
                setTimeout(() => setDocSent(false), 3000);
            }
        } catch (err) { console.error('Test email error:', err); }
        setDocSending(false);
    };


    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* HEADER & TABS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                                <Layout size={24} style={{ color: accentColor }} />
                            </div>
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
                                Site Builder & Templates
                            </h1>
                        </div>
                        <p className="text-sm text-[#9CA3AF] font-medium">
                            {isLegal ? 'Gérez le site vitrine du cabinet et vos modèles d\'actes' : 'Gérez votre site vitrine et vos templates email'}
                        </p>
                    </div>

                    <div className="flex bg-gray-100/50 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('web')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTab === 'web' ? 'bg-white shadow-sm text-[#2E2E2E]' : 'text-gray-400 hover:text-gray-600'
                            }`}>
                            <Globe size={14} /> Site Web
                        </button>
                        <button onClick={() => setActiveTab('docs')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTab === 'docs' ? 'bg-white shadow-sm text-[#2E2E2E]' : 'text-gray-400 hover:text-gray-600'
                            }`}>
                            {isLegal ? <BookOpen size={14} /> : <Mail size={14} />}
                            {isLegal ? 'Modèles d\'Actes' : 'Templates Email'}
                        </button>
                    </div>
                </div>

                {/* ═══ TAB: WEB TEMPLATES ═══ */}
                {activeTab === 'web' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-semibold text-[#2E2E2E]"><T>Templates Web</T></h2>
                                <p className="text-sm text-gray-500 mt-1">Choisissez un template pour personnaliser le site de votre {isLegal ? 'cabinet' : 'agence'}.</p>
                            </div>
                            <Link href={isLegal ? '/' : '/conciergerie'} target="_blank"
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-300 transition-all shadow-sm">
                                <Eye size={14} /> Voir le site
                            </Link>
                        </div>

                        {/* Layout Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {WEB_TEMPLATES.map((template, i) => {
                                const isSelected = selectedWebTemplate === template.id;
                                const isActive = currentActiveWeb === template.id;

                                return (
                                    <motion.button key={template.id} onClick={() => setSelectedWebTemplate(template.id)}
                                        className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 group ${isSelected
                                            ? `border-[${accentColor}] shadow-xl shadow-[${accentColor}]/10 scale-[1.02]`
                                            : 'border-gray-100 shadow-md hover:shadow-lg hover:border-gray-200 hover:scale-[1.01]'
                                        }`}>
                                        <div className={`bg-gradient-to-br ${template.gradient} p-6 h-40 relative overflow-hidden flex flex-col justify-center`}>
                                            <div className="text-center opacity-70 group-hover:scale-110 transition-transform duration-500">
                                                <Layout size={40} className="mx-auto mb-2 opacity-50 text-gray-800" />
                                            </div>
                                            {isActive && (
                                                <div className="absolute top-3 right-3 bg-[#2E2E2E] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex gap-1.5 shadow-lg">
                                                    <Check size={11} strokeWidth={3} /> Actif
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 bg-white">
                                            <div className="flex justify-between mb-2">
                                                <h3 className="text-base font-semibold text-[#2E2E2E]">{template.name}</h3>
                                                <span className="text-[9px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">{template.style}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Web Details */}
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedWebTemplate} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-5 flex items-center gap-2">
                                        <Sparkles size={16} style={{ color: accentColor }} /> Fonctionnalités
                                    </h3>
                                    <ul className="space-y-3">
                                        {activeWebTemplateData.features.map((f, i) => (
                                            <li key={i} className="flex gap-3 text-xs text-[#2E2E2E]">
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                                                    <Check size={10} style={{ color: accentColor }} />
                                                </div>{f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                                    <h3 className="text-sm font-bold text-[#2E2E2E] mb-5 flex items-center gap-2">
                                        <Layout size={16} className="text-violet-400" /> Spécifications
                                    </h3>
                                    <div className="space-y-3.5">
                                        {[
                                            { label: 'Hero', value: activeWebTemplateData.preview.heroLayout, icon: Maximize },
                                            { label: 'Cards', value: activeWebTemplateData.preview.cardStyle, icon: Grid3X3 },
                                            { label: 'Animations', value: activeWebTemplateData.preview.animation, icon: Sparkles },
                                            { label: 'Palette', value: activeWebTemplateData.preview.colorScheme, icon: Palette },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 border border-gray-100/50">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border shadow-sm">
                                                    <s.icon size={13} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{s.label}</div>
                                                    <div className="text-xs text-[#2E2E2E] font-medium">{s.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border p-7">
                                        <h3 className="text-sm font-bold text-[#2E2E2E] mb-3">Design System</h3>
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between"><span className="text-[10px] text-gray-400 uppercase font-bold">Titres</span><span className="text-xs font-medium">{activeWebTemplateData.defaults.fontHeading}</span></div>
                                            <div className="flex justify-between"><span className="text-[10px] text-gray-400 uppercase font-bold">Corps</span><span className="text-xs font-medium">{activeWebTemplateData.defaults.fontBody}</span></div>
                                            <div className="flex justify-between pt-2 border-t"><span className="text-[10px] text-gray-400 uppercase font-bold">Couleurs</span>
                                                <div className="flex gap-1.5">
                                                    {[activeWebTemplateData.defaults.primaryColor, activeWebTemplateData.defaults.secondaryColor, activeWebTemplateData.defaults.accentColor].map((c, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-lg shadow-sm border border-gray-100" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => router.push(`/crm/templates/${selectedWebTemplate}`)}
                                        className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all"
                                        style={{ backgroundColor: accentColor }}>
                                        <Pencil size={16} />
                                        Modifier &quot;{activeWebTemplateData.name}&quot;
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ═══ TAB: DOCS/EMAILS ═══ */}
                {activeTab === 'docs' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input value={docSearch} onChange={e => setDocSearch(e.target.value)}
                                    placeholder={isLegal ? 'Rechercher un acte...' : 'Rechercher un email...'}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:shadow-md outline-none text-sm transition-all" />
                            </div>
                            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm overflow-x-auto no-scrollbar">
                                {DOC_CATEGORIES.map(c => (
                                    <button key={c.id} onClick={() => setDocCategory(c.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${docCategory === c.id ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                        style={docCategory === c.id ? { backgroundColor: accentColor } : {}}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid — Premium Luna Design */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDocs.map((t, i) => {
                                const Icon = t.icon;
                                return (
                                    <motion.div key={t.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                                        whileHover={{ y: -3 }}
                                        className="relative bg-white rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer group"
                                        onClick={() => handlePreviewDoc(t)}>

                                        <div className="p-6 pb-5">
                                            {/* Header: icon + category */}
                                            <div className="flex justify-between items-start mb-4">
                                                <Icon size={22} style={{ color: t.color }} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
                                                <span className="text-[9px] font-medium uppercase tracking-[0.12em]"
                                                    style={{ color: t.color }}>
                                                    {t.category}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <h3 className="text-[14px] font-medium text-[#2E2E2E] mb-1.5 tracking-tight">
                                                {t.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-[11px] text-[#9CA3AF] leading-relaxed line-clamp-2 mb-4">
                                                {t.description}
                                            </p>

                                            {/* Action hint */}
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
                                                style={{ color: t.color }}>
                                                <Eye size={11} />
                                                <span>Prévisualiser</span>
                                                <ArrowRight size={9} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Doc Preview Modal — Luna Pro */}
            <AnimatePresence>
                {selectedDocTemplate && activeTab === 'docs' && (() => {
                    const DocIcon = selectedDocTemplate.icon;
                    return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center"
                        onClick={() => { setSelectedDocTemplate(null); setPreviewDocHtml(null); }}>
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="bg-[#F8FAFC] w-full max-w-[900px] max-h-[92vh] overflow-hidden flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.12)] sm:rounded-2xl"
                            onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100/80">
                                <div className="flex items-center gap-3 min-w-0">
                                    <DocIcon size={18} className="text-[#6B7280] shrink-0" strokeWidth={1.5} />
                                    <div className="min-w-0">
                                        <h2 className="text-[14px] font-medium text-[#2E2E2E] truncate">{selectedDocTemplate.name}</h2>
                                        <p className="text-[11px] text-[#9CA3AF] truncate">{selectedDocTemplate.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {!isLegal && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSendTestDoc(selectedDocTemplate)}
                                            disabled={docSending}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-medium text-white transition-all disabled:opacity-40"
                                            style={{ backgroundColor: docSent ? '#22c55e' : '#2E2E2E' }}>
                                            {docSending ? <Loader2 size={13} className="animate-spin" /> : docSent ? <CheckCircle2 size={13} /> : <Send size={13} />}
                                            {docSending ? 'Envoi…' : docSent ? 'Envoyé ✓' : 'Tester'}
                                        </motion.button>
                                    )}
                                    {isLegal && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleCopyDoc(selectedDocTemplate.content)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-medium bg-[#2E2E2E] text-white transition-all">
                                            {docCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                            {docCopied ? 'Copié' : 'Copier'}
                                        </motion.button>
                                    )}
                                    <button
                                        onClick={() => { setSelectedDocTemplate(null); setPreviewDocHtml(null); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#2E2E2E] hover:bg-gray-100 transition-all">
                                        <X size={16} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto bg-[#F0F1F3]">
                                {isLegal ? (
                                    <div className="p-8"><pre className="text-[13px] text-[#374151] bg-white p-8 rounded-xl whitespace-pre-wrap font-sans leading-relaxed shadow-sm border border-gray-100">{selectedDocTemplate.content}</pre></div>
                                ) : previewLoading ? (
                                    <div className="flex flex-col items-center justify-center h-[500px] gap-3">
                                        <Loader2 className="animate-spin text-[#bcdeea]" size={28} />
                                        <span className="text-[11px] text-[#9CA3AF]">Chargement de l'aperçu…</span>
                                    </div>
                                ) : previewDocHtml ? (
                                    <div className="p-4 sm:p-6">
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                            <iframe srcDoc={previewDocHtml} className="w-full h-[70vh] border-0" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] gap-2">
                                        <FileText size={24} className="text-gray-300" />
                                        <span className="text-[12px] text-[#9CA3AF]">Aperçu indisponible</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                    );
                })()}
            </AnimatePresence>

        </div>
    );
}
