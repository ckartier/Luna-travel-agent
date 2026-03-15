'use client';

import { useState, useRef, useEffect } from 'react';
import { sanitizeHtml } from '@/src/lib/sanitize';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, ArrowLeft, MessageCircle, Bug,
    AlertTriangle, AlertCircle, Info, CheckCircle2,
    Zap, Download, ChevronRight,
    LayoutDashboard, Mail, Trello, Calendar, Users,
    Plane, Hotel, FileSignature, FileText, CreditCard,
    Palette, Map, BarChart3, Sparkles, MessageSquare,
    Settings, Wrench, Globe, HelpCircle, Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePathname } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════
   LUNA HELP CHATBOT PRO 2026
   - Category-based menu with back navigation
   - Integrated Bug Report tab
   - Complete FAQ from full codebase scan (26 sections)
   - Downloadable PDF guide link
   ══════════════════════════════════════════════════════════════ */

interface Message { id: string; role: 'user' | 'bot'; text: string; }

type View = 'home' | 'chat' | 'bug' | 'category';

interface HelpCategory {
    id: string;
    label: string;
    icon: any;
    color: string;
    items: { q: string; a: string }[];
}

// ═══ COMPREHENSIVE FAQ — FROM FULL CODEBASE SCAN ═══
const CATEGORIES: HelpCategory[] = [
    {
        id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#5a8fa3',
        items: [
            { q: 'Que montre le Dashboard ?', a: 'Le Dashboard affiche en temps réel :\n\n• **Revenus Portefeuille** — CA total + évolution mensuelle\n• **Opportunités** — Leads actifs dans le pipeline\n• **Voyageurs VIP** — Clients Premium/VIP\n• **Missions Actives** — Voyages en cours\n• **Performance Revenus** — Graphique barres Jan-Déc\n• **Conciergerie** — Dernières notifications' },
            { q: 'Comment accéder au Dashboard ?', a: 'Le Dashboard est la page d\'accueil du CRM.\n\n**Chemin :** Menu → Dashboard\n**URL :** /crm' },
        ],
    },
    {
        id: 'inbox', label: 'Boîte de Réception', icon: Mail, color: '#6366f1',
        items: [
            { q: 'Comment synchroniser Gmail ?', a: 'Configurez Gmail dans **Installation** → **Gmail API** :\n\n**1.** Créez un projet Google Cloud\n**2.** Activez l\'API Gmail\n**3.** Configurez OAuth2 (Client ID, Secret, Redirect URI)\n**4.** Copiez les clés dans Installation' },
            { q: 'Comment analyser un email avec l\'IA ?', a: 'Depuis un email ouvert :\n\n**1.** Cliquez **IA Expert** → L\'IA analyse le contenu\n**2.** Extraction automatique : destination, dates, budget, voyageurs\n**3.** **Dispatcher** → Envoie vers l\'Agent IA avec données pré-remplies\n**4.** **Ajouter au CRM** → Crée un lead dans le Pipeline' },
            { q: 'Que puis-je faire depuis un email ?', a: 'Actions disponibles :\n\n• **IA Expert** — Analyse du contenu\n• **Dispatcher aux Agents** — Agent IA avec données\n• **Ajouter au CRM** — Crée un lead\n• **Accusé de réception** — Email de confirmation\n• **Répondre / Transférer** — Actions classiques' },
        ],
    },
    {
        id: 'pipeline', label: 'Pipeline CRM', icon: Trello, color: '#f59e0b',
        items: [
            { q: 'Comment fonctionne le Pipeline ?', a: 'Le Pipeline affiche vos opportunités en Kanban :\n\n**Colonnes :** Lead → Qualifié → Proposition → Négociation → Gagné\n\n• **Glissez-déposez** les cartes entre colonnes\n• Cliquez sur une carte pour voir les détails\n• Créez un voyage depuis un lead qualifié\n• Les leads sont créés automatiquement depuis les emails' },
            { q: 'Comment créer un lead ?', a: 'Plusieurs méthodes :\n\n• **Automatique** — Depuis un email analysé par l\'IA\n• **Manuel** — Pipeline → + Nouveau Lead\n• **Import** — Import CSV en masse' },
        ],
    },
    {
        id: 'planning', label: 'Planning & Voyages', icon: Calendar, color: '#10b981',
        items: [
            { q: 'Comment créer un voyage ?', a: 'Créer un voyage :\n\n**1.** Menu → **Planning** → **+ Nouveau Voyage**\n**2.** Renseignez destination, client, dates, budget\n**3.** Associez des prestations depuis le **Catalogue**\n**4.** Ajoutez un itinéraire jour par jour\n\n**Alternatives :**\n• Depuis l\'**Agent IA** (génération complète)\n• Depuis un **Lead** dans le Pipeline\n• Depuis un **Email** analysé' },
            { q: 'Que signifient les couleurs ?', a: 'Codes couleur du Planning :\n\n• 🟢 **Vert** — Validé / Confirmé\n• 🟠 **Orange** — En attente\n• 🔴 **Rouge** — Annulé\n• 🔵 **Bleu** — Brouillon' },
            { q: 'Comment modifier les dates ?', a: 'Changement de dates :\n\n• **Drag & drop** — Glissez le voyage sur le calendrier\n• Le client est **notifié automatiquement** par WhatsApp\n• Vous pouvez aussi modifier depuis la fiche voyage' },
            { q: 'Que contient la fiche voyage ?', a: 'Fiche voyage (/crm/trips/[id]) :\n\n• **Infos** — Destination, dates, client, budget, statut\n• **Itinéraire** — Programme jour par jour\n• **Prestations** — Hébergements, transports, activités\n• **Devis** — Génération automatique\n• **Documents** — Pièces jointes\n• **Emails** — Carnet de voyage, email pré-départ\n• **Suggestion IA** — Génération de texte' },
        ],
    },
    {
        id: 'contacts', label: 'Clients & Contacts', icon: Users, color: '#8b5cf6',
        items: [
            { q: 'Comment ajouter un client ?', a: '**Menu → Clients → + Nouveau Contact**\n\n• Nom, prénom, email, téléphone\n• Niveau VIP (Standard, Premium, VIP)\n• Tags et préférences voyage\n\n**Import :** Import CSV/Excel en masse' },
            { q: 'Que contient la fiche client ?', a: 'Fiche client (/crm/clients/[id]) :\n\n• **Historique voyages** — Trips passés et à venir\n• **Historique devis** — Envoyés, acceptés, refusés\n• **Activités** — Appels, emails, RDV\n• **Notes** — Notes internes de l\'équipe\n• **Portail** — Espace client dédié' },
            { q: 'Comment exporter les contacts ?', a: 'Depuis la page Contacts :\n\n• **Export CSV** — Téléchargez la liste complète\n• **Import CSV** — Importez vos contacts\n• **Recherche** — Par nom, email, téléphone, tag' },
        ],
    },
    {
        id: 'finance', label: 'Finance', icon: CreditCard, color: '#ef4444',
        items: [
            { q: 'Comment créer un devis ?', a: '**Menu → Devis → Créer un Devis**\n\n**1.** Sélectionnez client + voyage\n**2.** Les prestations se chargent automatiquement\n**3.** Ajustez les prix de vente (marge calculée)\n**4.** **Générer la Proposition Finale**\n\n**Envoi :** Email ou WhatsApp\n**Partage :** Lien public avec page premium\n**Conversion :** Accepté → Facture auto' },
            { q: 'Comment gérer les factures ?', a: 'Facturation :\n\n• **Automatique** — Devis accepté → facture client auto\n• **Manuel** — Menu → Factures → + Nouvelle Facture\n• **Export PDF** — Avec votre logo et branding\n• **Statuts** — Brouillon, envoyée, payée, en retard' },
            { q: 'Comment suivre les paiements ?', a: '**Menu → Paiements**\n\n• Montants dus, reçus, en attente\n• Enregistrement manuel des encaissements\n• Dashboard : revenus mensuels, évolution, top clients' },
        ],
    },
    {
        id: 'catalog', label: 'Catalogue', icon: Hotel, color: '#f97316',
        items: [
            { q: 'Comment ajouter une prestation ?', a: '**Menu → Catalogue → + Nouvelle Prestation**\n\n• Nom, catégorie, description\n• Prix d\'achat et de vente (marge auto)\n• Photos (apparaissent sur le site)\n• Disponibilité et durée\n\n**Catégories :** Hébergement, Transport, Activité, Restauration, Transfert, Guide' },
            { q: 'Comment utiliser la suggestion IA ?', a: 'Dans la fiche prestation :\n\n• Cliquez **Suggestion IA**\n• Gemini génère une description adaptée\n• Basée sur le nom, la catégorie et les détails de la prestation' },
        ],
    },
    {
        id: 'templates', label: 'Templates & Site', icon: Palette, color: '#ec4899',
        items: [
            { q: 'Quels templates sont disponibles ?', a: '**4 templates :**\n\n• **Élégance** — Luxe, serif, tons dorés\n• **Moderne** — Clean, géométrique, couleurs vives\n• **Immersif** — Cinématique, dark mode, glassmorphism\n• **Prestige** — Ultra premium, dorures\n\nChaque template change la typo, les couleurs et le layout.' },
            { q: 'Comment personnaliser le site ?', a: 'Éditeur de templates :\n\n• **Contenu** — Textes, titres, menus, boutons, vidéo hero\n• **Design** — Couleurs, polices, animations, ombres\n• **Blocs** — Activer/désactiver des sections, styles\n• **IA Image** — Générer des images avec Gemini\n\n**Auto-save** avec debounce 1.5s + aperçu temps réel' },
            { q: 'Comment revenir à la galerie ?', a: 'Depuis l\'éditeur :\n\n• Cliquez sur le **nom du template actif** dans le switcher\n• Exemple : cliquez "Élégance" quand vous éditez Élégance\n• Vous revenez à la galerie de templates' },
        ],
    },
    {
        id: 'agent-ia', label: 'Agent IA', icon: Sparkles, color: '#2F80ED',
        items: [
            { q: 'Comment utiliser l\'Agent IA ?', a: '**Menu → Agent IA** (sidebar)\n\n**Agent Voyage :**\n• Entrez destination, dates, budget, voyageurs\n• L\'IA génère itinéraire complet (vols, hôtels, activités)\n• Exportez vers le CRM\n\n**Agent Prestations :**\n• Recherche sémantique par embeddings\n• Matching intelligent adapté au profil client' },
            { q: 'Comment l\'IA analyse les emails ?', a: 'Depuis la Boîte de réception :\n\n**1.** Ouvrez un email\n**2.** Cliquez **IA Expert**\n**3.** Extraction : destination, dates, budget\n**4.** **Dispatcher** → Agent IA avec données pré-remplies' },
            { q: 'Comment configurer l\'IA ?', a: 'Clé API Gemini :\n\n**1.** Allez dans **Installation**\n**2.** Section **Gemini / OpenAI**\n**3.** Entrez votre GEMINI_API_KEY\n**4.** Testez la connexion' },
        ],
    },
    {
        id: 'whatsapp', label: 'WhatsApp & Messages', icon: MessageSquare, color: '#25D366',
        items: [
            { q: 'Comment configurer WhatsApp ?', a: '**Installation → WhatsApp Business**\n\n• Access Token\n• Phone Number ID\n• Verify Token\n\nTestez la connexion après configuration.' },
            { q: 'Quelles notifications automatiques ?', a: 'Notifications WhatsApp automatiques :\n\n• ✅ Confirmation de réservation\n• 📅 Changement de date (drag & drop planning)\n• 📋 Récap de voyage envoyé au client\n• ⏰ Rappel de départ J-3\n• 🔄 Réassignation de prestataire' },
            { q: 'Comment envoyer manuellement ?', a: 'Envoi WhatsApp manuel :\n\n• Depuis une **fiche client** → Envoyer WhatsApp\n• Depuis un **devis** → Partager via WhatsApp\n• Depuis la page **Messages** → Conversation directe' },
        ],
    },
    {
        id: 'team', label: 'Équipe & Paramètres', icon: Settings, color: '#6b7280',
        items: [
            { q: 'Comment inviter un membre ?', a: '**Menu → Équipe → Inviter**\n\nEntrez l\'email et choisissez un rôle :\n\n• **Admin** — Tout accès\n• **Agent** — Voyages, clients, pipeline\n• **Viewer** — Lecture seule' },
            { q: 'Comment modifier mon profil ?', a: '**Menu → Paramètres**\n\n• Nom, email, photo de profil\n• Mot de passe\n• Informations de l\'agence (logo, nom, mentions légales)\n• Devise et langue' },
            { q: 'Comment gérer les abonnements ?', a: 'Plans Luna :\n\n• **Site Builder** (29€) — Site + Templates\n• **CRM Pro** (79€) — Pipeline + Finance\n• **All-in-One** (99€) — Tout inclus\n• **Enterprise** (499€) — IA + illimité\n\nLes fonctionnalités 👑 sont accessibles en changeant de plan.' },
        ],
    },
    {
        id: 'install', label: 'Installation & APIs', icon: Wrench, color: '#b89b7a',
        items: [
            { q: 'Quels services configurer ?', a: '**4 modules :**\n\n**1. Firebase** — 6 clés (API Key, Auth Domain, Project ID…)\n**2. WhatsApp** — 3 clés (Access Token, Phone ID, Verify Token)\n**3. Gemini** — 1 clé API\n**4. Gmail** — 3 clés (Client ID, Secret, Redirect URI)\n\nChaque module a un guide pas-à-pas.' },
            { q: 'Comment tester une intégration ?', a: 'Depuis **Installation** ou **Intégrations** :\n\n• Chaque service a un bouton **Tester la connexion**\n• Statut vert = connecté, rouge = erreur\n• Suivez les instructions en cas d\'erreur\n\nLes clés sont stockées dans Firestore (accès restreint par tenant).' },
        ],
    },
];

function findAnswer(input: string): { answer: string; category?: string } {
    const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Check all categories
    for (const cat of CATEGORIES) {
        for (const item of cat.items) {
            const qNorm = item.q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            // Exact match on question
            if (lower.includes(qNorm.slice(0, 20))) return { answer: item.a, category: cat.id };
        }
    }

    // Keyword matching
    const keywords: Record<string, string> = {
        'dashboard': 'dashboard', 'tableau de bord': 'dashboard',
        'email': 'inbox', 'mail': 'inbox', 'gmail': 'inbox', 'boite': 'inbox',
        'pipeline': 'pipeline', 'lead': 'pipeline', 'kanban': 'pipeline', 'prospect': 'pipeline',
        'planning': 'planning', 'voyage': 'planning', 'trip': 'planning', 'calendrier': 'planning', 'itineraire': 'planning',
        'client': 'contacts', 'contact': 'contacts', 'vip': 'contacts',
        'devis': 'finance', 'facture': 'finance', 'paiement': 'finance', 'prix': 'finance',
        'catalogue': 'catalog', 'prestation': 'catalog', 'hotel': 'catalog',
        'template': 'templates', 'site': 'templates', 'editeur': 'templates', 'design': 'templates', 'theme': 'templates',
        'agent': 'agent-ia', 'ia': 'agent-ia', 'intelligence': 'agent-ia', 'gemini': 'agent-ia',
        'whatsapp': 'whatsapp', 'message': 'whatsapp', 'notification': 'whatsapp',
        'equipe': 'team', 'parametr': 'team', 'profil': 'team', 'abonnement': 'team', 'role': 'team',
        'installation': 'install', 'api': 'install', 'configurer': 'install', 'cle': 'install',
    };

    for (const [kw, catId] of Object.entries(keywords)) {
        if (lower.includes(kw)) {
            const cat = CATEGORIES.find(c => c.id === catId);
            if (cat) return { answer: cat.items[0].a, category: catId };
        }
    }

    return { answer: '' };
}

export function HelpChatbot() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>('home');
    const [selectedCat, setSelectedCat] = useState<string | null>(null);
    const [selectedQ, setSelectedQ] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Bug report
    const [bugTitle, setBugTitle] = useState('');
    const [bugDesc, setBugDesc] = useState('');
    const [bugSeverity, setBugSeverity] = useState('normal');
    const [bugSending, setBugSending] = useState(false);
    const [bugSent, setBugSent] = useState(false);

    const { user, userProfile } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, [messages, isTyping]);

    // Auto-close on CRM pages — the voice agent handles assistance there
    useEffect(() => {
        if (pathname?.startsWith('/crm')) {
            setOpen(false);
            setView('home');
            setSelectedCat(null);
            setSelectedQ(null);
        }
    }, [pathname]);

    useEffect(() => {
        if (open && inputRef.current && view === 'chat') setTimeout(() => inputRef.current?.focus(), 300);
    }, [open, view]);

    const goBack = () => {
        if (selectedQ !== null) { setSelectedQ(null); return; }
        if (selectedCat) { setSelectedCat(null); return; }
        if (view !== 'home') { setView('home'); return; }
    };

    const handleSend = (text?: string) => {
        const msg = text || input.trim();
        if (!msg) return;
        if (['bug', 'signaler', 'signaler un bug'].includes(msg.toLowerCase())) { setView('bug'); setInput(''); return; }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: msg }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const { answer } = findAnswer(msg);
            const botText = answer || 'Je n\'ai pas trouvé de réponse exacte. Parcourez les **catégories** ci-dessus ou tapez un mot-clé : voyage, devis, agent ia, template…';
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: botText }]);
            setIsTyping(false);
        }, 400 + Math.random() * 400);
    };

    const handleBugSubmit = async () => {
        if (!bugTitle.trim() || !bugDesc.trim()) return;
        setBugSending(true);
        try {
            await fetch('/api/crm/bug-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: bugTitle.trim(), description: bugDesc.trim(), severity: bugSeverity,
                    page: pathname, userAgent: navigator.userAgent,
                    userId: user?.uid || '', userName: userProfile?.displayName || user?.displayName || '',
                    userEmail: userProfile?.email || user?.email || '',
                }),
            });
            setBugSent(true);
            setTimeout(() => { setBugSent(false); setBugTitle(''); setBugDesc(''); setBugSeverity('normal'); setView('home'); }, 2000);
        } catch (err) { console.error(err); }
        finally { setBugSending(false); }
    };

    const fmt = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#2E2E2E;font-weight:600">$1</strong>').replace(/\n/g, '<br/>');

    const currentCat = CATEGORIES.find(c => c.id === selectedCat);
    const showBack = view !== 'home' || selectedCat !== null;

    const severities = [
        { id: 'low', label: 'Mineur', icon: Info, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
        { id: 'normal', label: 'Normal', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        { id: 'critical', label: 'Critique', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    ];

    return (
        <>
            {/* ═══ TRIGGER ═══ */}
            <AnimatePresence>
                {!open && (
                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        onClick={() => setOpen(true)} className="fixed bottom-6 right-24 z-[80] group">
                        <span className="absolute inset-[-3px] rounded-full bg-gradient-to-r from-[#5a8fa3] to-[#b9dae9] opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500" />
                        <span className="absolute inset-0 rounded-full bg-[#2E2E2E]/8 animate-ping" style={{ animationDuration: '3s' }} />
                        <div className="relative w-14 h-14 bg-[#2E2E2E] rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group-hover:scale-110">
                            <MessageCircle size={22} className="text-white" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white shadow-sm" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ═══ PANEL ═══ */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed bottom-24 right-24 z-[80] w-[400px] h-[600px] flex flex-col overflow-hidden"
                        style={{
                            borderRadius: '24px',
                            background: 'rgba(250, 250, 248, 0.97)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 80px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                        }}
                    >
                        {/* ── Header ── */}
                        <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {showBack && (
                                    <button onClick={goBack} className="w-7 h-7 rounded-lg bg-[#2E2E2E]/5 hover:bg-[#2E2E2E]/10 flex items-center justify-center transition-all">
                                        <ArrowLeft size={13} className="text-[#2E2E2E]/50" />
                                    </button>
                                )}
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-2xl bg-[#2E2E2E] flex items-center justify-center shadow-sm">
                                        <span className="text-white font-light text-base" style={{ fontFamily: 'var(--font-heading, serif)' }}>L</span>
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-[1.5px] border-[#FAFAF8]" />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-semibold text-[#2E2E2E] tracking-tight">Luna Aide</h3>
                                    <p className="text-[9px] text-[#2E2E2E]/30 font-medium">
                                        {view === 'bug' ? 'Signaler un bug' : view === 'chat' ? 'Chat libre' : selectedCat ? currentCat?.label : 'Centre d\'aide'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setOpen(false); setView('home'); setSelectedCat(null); setSelectedQ(null); }}
                                className="w-7 h-7 rounded-full bg-[#2E2E2E]/5 hover:bg-[#2E2E2E]/10 flex items-center justify-center transition-all hover:rotate-90 duration-300">
                                <X size={13} className="text-[#2E2E2E]/50" />
                            </button>
                        </div>

                        <div className="mx-4 h-px bg-[#2E2E2E]/[0.05]" />

                        {/* ═══ HOME VIEW — Category Grid ═══ */}
                        {view === 'home' && !selectedCat && (
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
                                {/* Quick actions */}
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button onClick={() => setView('chat')}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-[#2E2E2E]/[0.05] hover:border-[#b9dae9] hover:bg-[#b9dae9]/5 transition-all group">
                                        <MessageCircle size={16} className="text-[#5a8fa3] group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold text-[#2E2E2E]/40 group-hover:text-[#2E2E2E]/60">Chat libre</span>
                                    </button>
                                    <button onClick={() => setView('bug')}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-[#2E2E2E]/[0.05] hover:border-red-200 hover:bg-red-50/30 transition-all group">
                                        <Bug size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold text-[#2E2E2E]/40 group-hover:text-[#2E2E2E]/60">Bug</span>
                                    </button>
                                    <a href="/luna-guide-complet.pdf" target="_blank"
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-[#2E2E2E]/[0.05] hover:border-[#b89b7a]/30 hover:bg-[#b89b7a]/5 transition-all group">
                                        <Download size={16} className="text-[#b89b7a] group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold text-[#2E2E2E]/40 group-hover:text-[#2E2E2E]/60">Guide PDF</span>
                                    </a>
                                </div>

                                {/* Category list */}
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]/25 px-1 pt-1">Rubriques d'aide</p>
                                <div className="space-y-1">
                                    {CATEGORIES.map(cat => {
                                        const Icon = cat.icon;
                                        return (
                                            <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[#2E2E2E]/[0.04] hover:border-[#2E2E2E]/[0.1] hover:bg-[#2E2E2E]/[0.01] transition-all group text-left">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '12' }}>
                                                    <Icon size={13} style={{ color: cat.color }} />
                                                </div>
                                                <span className="text-[11px] font-medium text-[#2E2E2E]/60 group-hover:text-[#2E2E2E]/80 flex-1">{cat.label}</span>
                                                <span className="text-[9px] text-[#2E2E2E]/20 font-medium">{cat.items.length}</span>
                                                <ChevronRight size={12} className="text-[#2E2E2E]/15 group-hover:text-[#2E2E2E]/30 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ═══ CATEGORY VIEW — Questions ═══ */}
                        {view === 'home' && selectedCat && currentCat && selectedQ === null && (
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5" style={{ scrollbarWidth: 'none' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentCat.color + '15' }}>
                                        <currentCat.icon size={15} style={{ color: currentCat.color }} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-[#2E2E2E]">{currentCat.label}</p>
                                        <p className="text-[9px] text-[#2E2E2E]/30">{currentCat.items.length} questions</p>
                                    </div>
                                </div>
                                {currentCat.items.map((item, i) => (
                                    <button key={i} onClick={() => setSelectedQ(i)}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white border border-[#2E2E2E]/[0.04] hover:border-[#2E2E2E]/[0.1] transition-all group text-left">
                                        <HelpCircle size={13} className="text-[#2E2E2E]/20 shrink-0 group-hover:text-[#2E2E2E]/40" />
                                        <span className="text-[11px] font-medium text-[#2E2E2E]/55 group-hover:text-[#2E2E2E]/75 flex-1">{item.q}</span>
                                        <ChevronRight size={11} className="text-[#2E2E2E]/15 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ═══ ANSWER VIEW ═══ */}
                        {view === 'home' && selectedCat && currentCat && selectedQ !== null && (
                            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
                                <div className="bg-white rounded-2xl border border-[#2E2E2E]/[0.05] p-4">
                                    <p className="text-[12px] font-bold text-[#2E2E2E] mb-3">{currentCat.items[selectedQ].q}</p>
                                    <div className="text-[11px] text-[#2E2E2E]/55 leading-[1.7]"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(fmt(currentCat.items[selectedQ].a)) }}
                                    />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => setSelectedQ(null)}
                                        className="flex-1 py-2 text-[10px] font-semibold text-[#2E2E2E]/40 hover:text-[#2E2E2E]/60 bg-white rounded-xl border border-[#2E2E2E]/[0.05] transition-all">
                                        ← Autres questions
                                    </button>
                                    <button onClick={() => { setView('chat'); setSelectedCat(null); setSelectedQ(null); }}
                                        className="flex-1 py-2 text-[10px] font-semibold text-[#5a8fa3] bg-[#5a8fa3]/5 rounded-xl border border-[#5a8fa3]/10 transition-all hover:bg-[#5a8fa3]/10">
                                        💬 Poser une question
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ CHAT VIEW ═══ */}
                        {view === 'chat' && (
                            <>
                                <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ scrollbarWidth: 'none' }}>
                                    {messages.length === 0 && !isTyping && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5 pt-1">
                                            <div className="w-6 h-6 rounded-lg bg-[#2E2E2E] flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-white text-[9px]" style={{ fontFamily: 'var(--font-heading, serif)' }}>L</span>
                                            </div>
                                            <div className="bg-white rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#2E2E2E]/[0.04]">
                                                <p className="text-[12px] text-[#2E2E2E]/60 leading-relaxed">
                                                    Posez votre question ! Je connais tout sur <strong className="text-[#2E2E2E]">Luna CRM</strong> : voyages, pipeline, finance, IA, templates…
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {messages.map(msg => (
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex items-end gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                {msg.role === 'bot' && (
                                                    <div className="w-6 h-6 rounded-lg bg-[#2E2E2E] flex items-center justify-center shrink-0 mb-0.5">
                                                        <span className="text-white text-[9px]" style={{ fontFamily: 'var(--font-heading, serif)' }}>L</span>
                                                    </div>
                                                )}
                                                <div className={`px-3.5 py-2.5 text-[11px] leading-[1.65] ${
                                                    msg.role === 'user'
                                                        ? 'bg-[#2E2E2E] text-white/90 rounded-2xl rounded-br-md'
                                                        : 'bg-white text-[#2E2E2E]/55 rounded-2xl rounded-bl-md shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#2E2E2E]/[0.04]'
                                                }`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(fmt(msg.text)) }} />
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <div className="flex items-end gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-[#2E2E2E] flex items-center justify-center shrink-0">
                                                <span className="text-white text-[9px]" style={{ fontFamily: 'var(--font-heading, serif)' }}>L</span>
                                            </div>
                                            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-[#2E2E2E]/[0.04] flex gap-1 items-center">
                                                {[0,1,2].map(i => (
                                                    <motion.span key={i} className="w-1 h-1 bg-[#2E2E2E]/20 rounded-full"
                                                        animate={{ opacity: [0.3,1,0.3], scale: [0.85,1.15,0.85] }}
                                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0 px-4 pb-3 pt-1">
                                    <form onSubmit={e => { e.preventDefault(); handleSend(); }}
                                        className="flex items-center gap-2 bg-white rounded-2xl border border-[#2E2E2E]/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.03)] px-3.5 py-1 transition-all focus-within:border-[#b9dae9]">
                                        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                                            placeholder="Posez votre question…"
                                            className="flex-1 py-2 bg-transparent text-[11px] text-[#2E2E2E] placeholder:text-[#2E2E2E]/20 focus:outline-none font-medium" />
                                        <button type="submit" disabled={!input.trim()}
                                            className="w-7 h-7 rounded-lg bg-[#2E2E2E] flex items-center justify-center transition-all disabled:opacity-0 disabled:scale-75 hover:bg-black">
                                            <Send size={11} className="text-white" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}

                        {/* ═══ BUG VIEW ═══ */}
                        {view === 'bug' && (
                            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
                                {bugSent ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                                            <CheckCircle2 size={24} className="text-emerald-500" />
                                        </div>
                                        <p className="text-[14px] font-bold text-[#2E2E2E]">Bug signalé !</p>
                                        <p className="text-[10px] text-gray-400 mt-1.5">Notre IA va analyser ce problème.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-[#2E2E2E]/[0.03] rounded-xl">
                                            <Zap size={10} className="text-[#5a8fa3]" />
                                            <span className="text-[9px] text-[#2E2E2E]/35 font-medium">Page : <strong className="text-[#2E2E2E]/55">{pathname}</strong></span>
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]/25 mb-1 block">Titre</label>
                                            <input type="text" value={bugTitle} onChange={e => setBugTitle(e.target.value)}
                                                placeholder="Ex: Le bouton ne fonctionne pas"
                                                className="w-full px-3 py-2 bg-white border border-[#2E2E2E]/[0.06] rounded-xl text-[11px] text-[#2E2E2E] placeholder:text-[#2E2E2E]/18 focus:outline-none focus:border-[#b9dae9] transition-all" />
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]/25 mb-1 block">Sévérité</label>
                                            <div className="flex gap-1.5">
                                                {severities.map(s => (
                                                    <button key={s.id} onClick={() => setBugSeverity(s.id)}
                                                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold border transition-all ${
                                                            bugSeverity === s.id ? `${s.bg} ${s.color}` : 'text-[#2E2E2E]/25 bg-white border-[#2E2E2E]/[0.06]'
                                                        }`}>
                                                        <s.icon size={10} /> {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]/25 mb-1 block">Description</label>
                                            <textarea value={bugDesc} onChange={e => setBugDesc(e.target.value)} rows={3}
                                                placeholder="Décrivez le problème en détail…"
                                                className="w-full px-3 py-2 bg-white border border-[#2E2E2E]/[0.06] rounded-xl text-[11px] text-[#2E2E2E] placeholder:text-[#2E2E2E]/18 resize-none focus:outline-none focus:border-[#b9dae9] transition-all" />
                                        </div>

                                        <button onClick={handleBugSubmit}
                                            disabled={bugSending || !bugTitle.trim() || !bugDesc.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[11px] font-bold hover:bg-black transition-all disabled:opacity-30 shadow-sm">
                                            {bugSending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bug size={12} />}
                                            {bugSending ? 'Envoi…' : 'Envoyer le rapport'}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <p className="text-center text-[7px] text-[#2E2E2E]/12 pb-2.5 font-medium tracking-[0.15em] uppercase">Luna Conciergerie • 2026</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
