'use client';

import { CapsuleBackground } from '@/app/components/CapsuleBackground';
import { useAuth } from '@/src/contexts/AuthContext';
import {
    Hotel,
    CheckCircle2,
    ArrowRight,
    Send,
    MapPin,
    Loader2,
    Bot,
    Zap,
    Star,
    DollarSign,
    UsersRound,
    FileText,
    Check,
    X,
    MessageCircle,
    ArrowLeft,
    Users,
    ExternalLink,
    Eye,
    ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getCatalogItems, CRMCatalogItem, getContacts, CRMContact,
    getSuppliers, CRMSupplier, createSupplierBooking, createQuote,
    getAllSupplierBookings, CRMSupplierBooking
} from '@/src/lib/firebase/crm';
import { LunaLogo } from '@/app/components/LunaLogo';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'mapbox-gl/dist/mapbox-gl.css';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'CATALOG_MATCHING' | 'MARGIN_CALC' | 'VALIDATION' | 'READY';

const prestations = [
    { id: 'hotel', label: 'Hôtel' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'activity', label: 'Activité' },
    { id: 'transfer', label: 'Transfert / Chauffeur' },
    { id: 'spa', label: 'Spa & Bien-être' },
    { id: 'event', label: 'Événement' },
];

const agentMeta = {
    catalog: { title: 'Catalogue', subtitle: 'Matching Services', desc: 'Analyse du catalogue pour trouver les prestations les plus pertinentes', icon: Hotel, color: '#f59e0b' },
    suppliers: { title: 'Prestataires', subtitle: 'Disponibilités', desc: 'Vérification de la base prestataires et coordination des contacts', icon: UsersRound, color: '#f59e0b' },
    finance: { title: 'Finance', subtitle: 'Calcul des Marges', desc: 'Optimisation de la rentabilité et markups recommandés', icon: DollarSign, color: '#f59e0b' },
    proposal: { title: 'Proposition', subtitle: 'Fiche Expert', desc: 'Génération de la fiche prestation complète', icon: FileText, color: '#f59e0b' },
};

type AgentKey = keyof typeof agentMeta;

// ═══ MAPBOX 3D GLOBE BACKGROUND (shown when agents are processing) ═══
function MapGlobeBackground() {
  const mapRef = useRef<any>(null);
  const frameRef = useRef<number>(0);

  const mapCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node || mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    (async () => {
    const mapboxgl = (await import('mapbox-gl')).default;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: node,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [2.35, 48.85],
      zoom: 1.8,
      projection: 'globe',
      attributionControl: false,
      interactive: false,
    });

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(255,255,255)',
        'high-color': 'rgb(230,238,245)',
        'horizon-blend': 0.06,
        'space-color': 'rgb(255,255,255)' as any,
        'star-intensity': 0,
      });
      node.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-group')
        .forEach(el => (el as HTMLElement).style.display = 'none');
    });

    let t = 0;
    const spin = () => {
      t += 0.002;
      if (!map.isMoving()) {
        map.setCenter([2.35 + Math.sin(t) * 80, 35 + Math.cos(t * 0.5) * 15]);
      }
      frameRef.current = requestAnimationFrame(spin);
    };
    frameRef.current = requestAnimationFrame(spin);
    mapRef.current = map;
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={mapCallback} className="absolute inset-0" />
      <div className="absolute inset-0 bg-white/30 pointer-events-none" />
    </>
  );
}

export default function PrestationsAgentWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <PrestationsAgentPage />
        </Suspense>
    );
}

function PrestationsAgentPage() {
    const [mounted, setMounted] = useState(false);
    const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');
    const { tenantId, user, userProfile } = useAuth();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Form State
    const [request, setRequest] = useState('');
    const [budget, setBudget] = useState('');
    const [destination, setDestination] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [inspirationImages, setInspirationImages] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).slice(0, 3); // Max 3 images
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ev.target?.result && typeof ev.target.result === 'string') {
                        setInspirationImages(prev => [...prev, ev.target!.result as string].slice(0, 3));
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const toggleType = (id: string) => {
        setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };
    const [pax, setPax] = useState('');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState('');

    // Data State
    const [catalog, setCatalog] = useState<CRMCatalogItem[]>([]);
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [activeAgents, setActiveAgents] = useState<AgentKey[]>([]);
    const [validatedAgents, setValidatedAgents] = useState<AgentKey[]>([]);
    const [agentResults, setAgentResults] = useState<any>(null);
    const [sentItems, setSentItems] = useState<string[]>([]);
    const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
    const [overriddenSuppliers, setOverriddenSuppliers] = useState<Record<string, string>>({}); // Mapping: ItemID -> SupplierID
    const [addedToQuote, setAddedToQuote] = useState<string[]>([]);
    const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<string>>(new Set());
    const [selectedAiSuggestions, setSelectedAiSuggestions] = useState<Set<number>>(new Set());
    const [existingBookings, setExistingBookings] = useState<CRMSupplierBooking[]>([]);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [saveResult, setSaveResult] = useState<{ ok: number; conflicts: string[] } | null>(null);
    const DEFAULT_MARKUP = 25; // Default markup percentage

    const userPhotoURL = userProfile?.photoURL || user?.photoURL || null;
    const userDisplayName = userProfile?.displayName || user?.displayName || 'Expert';

    useEffect(() => {
        setMounted(true);
        if (tenantId) {
            Promise.all([
                getCatalogItems(tenantId),
                getSuppliers(tenantId),
                getContacts(tenantId),
                getAllSupplierBookings(tenantId)
            ]).then(([cat, sup, cts, bks]) => {
                setCatalog(cat);
                setSuppliers(sup);
                setContacts(cts);
                setExistingBookings(bks);
            });
        }
    }, [tenantId]);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!request.trim()) return;
        setValidatedAgents([]);
        setActiveAgents([]);
        setAgentResults(null);
        setWorkflowState('ANALYSING');
    };

    useEffect(() => {
        if (workflowState === 'ANALYSING') {
            const t = setTimeout(() => setWorkflowState('CATALOG_MATCHING'), 1800);
            return () => clearTimeout(t);
        }
        if (workflowState === 'CATALOG_MATCHING') {
            const agents: AgentKey[] = ['catalog', 'suppliers', 'finance', 'proposal'];
            // Sequential activation with validation
            agents.forEach((a, i) => {
                setTimeout(() => setActiveAgents(prev => [...prev, a]), i * 600);
                setTimeout(() => setValidatedAgents(prev => [...prev, a]), (i + 1) * 600 + 300);
            });
            const t = setTimeout(() => {
                callAgentAI();
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [workflowState]);

    const callAgentAI = async () => {
        try {
            // Filter catalog by selected types (if any)
            // Each prestation type maps to catalog types AND fuzzy keywords
            const typeConfig: Record<string, { catalogTypes: string[]; keywords: string[] }> = {
                hotel: { catalogTypes: ['HOTEL'], keywords: ['hotel', 'hôtel', 'hébergement', 'palace', 'resort'] },
                restaurant: { catalogTypes: ['OTHER', 'ACTIVITY'], keywords: ['restaurant', 'gastro', 'dîner', 'cuisine', 'étoilé', 'table'] },
                activity: { catalogTypes: ['ACTIVITY'], keywords: ['activité', 'excursion', 'visite', 'expérience', 'tour'] },
                transfer: { catalogTypes: ['TRANSFER'], keywords: ['transfert', 'chauffeur', 'transport', 'voiture', 'privé', 'navette', 'taxi', 'accompagnateur'] },
                spa: { catalogTypes: ['ACTIVITY'], keywords: ['spa', 'bien-être', 'wellness', 'massage', 'detente'] },
                event: { catalogTypes: ['ACTIVITY', 'OTHER'], keywords: ['événement', 'event', 'soirée', 'concert', 'organisation'] },
            };
            const filteredCatalog = selectedTypes.length > 0
                ? catalog.filter(c => {
                    const cType = (c.type || '').toUpperCase();
                    const cName = (c.name || '').toLowerCase();
                    const cDesc = (c.description || '').toLowerCase();
                    const cText = `${cName} ${cDesc}`;
                    return selectedTypes.some(t => {
                        const config = typeConfig[t];
                        if (!config) return false;
                        // Match by catalog type
                        if (config.catalogTypes.includes(cType)) return true;
                        // Fuzzy: match by any keyword
                        return config.keywords.some(kw => cText.includes(kw));
                    });
                })
                : catalog;

            const catalogToSend = filteredCatalog.length > 0 ? filteredCatalog : catalog;
            const selectedLabels = selectedTypes.map(t => prestations.find(p => p.id === t)?.label || t);

            console.log('[Prestations Agent] Sending catalog with', catalogToSend.length, 'items (filtered from', catalog.length, ')');
            const res = await fetchWithAuth('/api/agents/prestations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: request,
                    catalog: catalogToSend.map(c => ({
                        id: c.id, name: c.name, type: c.type, location: c.location,
                        description: c.description, netCost: c.netCost,
                        recommendedMarkup: c.recommendedMarkup, supplier: c.supplier,
                        supplierId: c.supplierId, images: c.images
                    })),
                    context: { budget, destination, types: selectedLabels, inspirationImages }
                })
            });
            const data = await res.json();
            console.log('[Prestations Agent] API result:', data);

            // Map AI names to real objects — use fuzzy matching (includes + lowercase)
            const matchedItems = data.selected ? catalog.filter(item => {
                const itemNameLower = item.name.toLowerCase();
                return data.selected.some((s: any) => {
                    const sName = (typeof s === 'string' ? s : s.name || '').toLowerCase();
                    return itemNameLower.includes(sName) || sName.includes(itemNameLower)
                        || itemNameLower === sName;
                });
            }) : [];

            // If AI matching found nothing, fallback to all catalog items (max 5)
            const finalMatched = matchedItems.length > 0 ? matchedItems : catalog.slice(0, 5);

            setAgentResults({ ...data, matchedItems: finalMatched });
            // Auto-select all matched catalog items
            setSelectedCatalogItems(new Set(finalMatched.map((i: CRMCatalogItem) => i.id!)));
            setSelectedAiSuggestions(new Set());
            setSaveResult(null);
            setValidatedAgents(['catalog', 'suppliers', 'finance', 'proposal']);
            setWorkflowState('READY');
        } catch (err) {
            console.error(err);
            // On error, still show catalog items as fallback
            if (catalog.length > 0) {
                setAgentResults({
                    selected: catalog.slice(0, 5).map(c => ({ name: c.name })),
                    reason: 'Voici les prestations disponibles dans votre catalogue Luna.',
                    totalNet: catalog.slice(0, 5).reduce((sum, c) => sum + (c.netCost || 0), 0),
                    matchedItems: catalog.slice(0, 5)
                });
                setValidatedAgents(['catalog', 'suppliers', 'finance', 'proposal']);
                setWorkflowState('READY');
            } else {
                setWorkflowState('IDLE');
            }
        }
    };

    const handleInstantValidation = async (item: CRMCatalogItem) => {
        let finalSupplierId = overriddenSuppliers[item.id!] || item.supplierId;

        // Auto-find a relevant supplier if none is linked
        if (!finalSupplierId && suppliers.length > 0) {
            const typeToCategory: Record<string, string[]> = {
                'HOTEL': ['HÉBERGEMENT'],
                'ACTIVITY': ['ACTIVITÉ', 'GUIDE', 'CULTURE'],
                'TRANSFER': ['TRANSPORT', 'GUIDE'],
                'OTHER': ['RESTAURANT', 'AUTRE', 'ACTIVITÉ'],
            };
            const itemType = (item.type || '').toUpperCase();
            const itemName = (item.name || '').toLowerCase();
            const relevantCats = typeToCategory[itemType] || [];
            const isChauffeur = itemName.includes('chauffeur') || itemName.includes('transfert') || itemName.includes('transport') || itemName.includes('accompagn');

            const matchingSupplier = suppliers.find(s =>
                relevantCats.includes(s.category) ||
                (isChauffeur && (s.isChauffeur || s.category === 'TRANSPORT'))
            );
            if (matchingSupplier) {
                finalSupplierId = matchingSupplier.id;
                setOverriddenSuppliers(prev => ({ ...prev, [item.id!]: matchingSupplier.id! }));
            }
        }

        if (!tenantId || !finalSupplierId) {
            alert("Veuillez d'abord sélectionner un prestataire dans le menu \"Choisir Expert\" ↑");
            return;
        }

        setIsProcessingAction(item.id!);
        try {
            const supplier = suppliers.find(s => s.id === finalSupplierId);
            if (!supplier) throw new Error("Fournisseur introuvable");

            // 1. Création du Booking Planning
            const bookingData: any = {
                supplierId: finalSupplierId,
                prestationId: item.id!,
                prestationName: item.name,
                date: bookingDate || new Date().toISOString().split('T')[0],
                startTime: bookingTime || '09:00',
                endTime: '',
                status: 'PROPOSED',
                rate: item.netCost,
                extraFees: 0,
                numberOfGuests: pax ? parseInt(pax) : undefined,
                notes: `Validation via Luna Agent.\nDemande: ${request}${pax ? `\nPax: ${pax}` : ''}${selectedContactId ? `\nClient: ${contacts.find(c => c.id === selectedContactId)?.firstName || ''} ${contacts.find(c => c.id === selectedContactId)?.lastName || ''}` : ''}`,
                clientName: selectedContactId ? `${contacts.find(c => c.id === selectedContactId)?.firstName || ''} ${contacts.find(c => c.id === selectedContactId)?.lastName || ''}`.trim() : 'Client Luna Agent'
            };
            const bookingId = await createSupplierBooking(tenantId, bookingData);

            // 2. Envoi WhatsApp / Mail
            const channel = supplier.phone ? 'WHATSAPP' : 'EMAIL';
            const to = channel === 'WHATSAPP' ? supplier.phone : supplier.email;

            if (to) {
                const clientContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null;
                const clientFullName = clientContact ? `${clientContact.firstName} ${clientContact.lastName}` : '';
                const dateStr = bookingDate ? format(new Date(bookingDate), 'dd MMMM yyyy', { locale: fr }) : format(new Date(), 'dd MMMM yyyy', { locale: fr });
                const timeStr = bookingTime || '09:00';

                const message = `😊 Bonjour ${supplier.contactName || supplier.name} !\n\n` +
                    `On aurait besoin de vous pour une super prestation 🌟\n\n` +
                    `🎨 *${item.name}*\n` +
                    `📅 *Date :* ${dateStr}\n` +
                    `⏰ *Horaire :* ${timeStr}\n` +
                    `💰 *Prix :* ${item.netCost} €\n` +
                    (pax ? `👥 *Pax :* ${pax} personne${parseInt(pax) > 1 ? 's' : ''}\n` : '') +
                    (clientFullName ? `👤 *Client :* ${clientFullName}\n` : '') +
                    (request && request !== item.name ? `\n📝 *Note interne :*\n_${request}_\n` : '') +
                    `\n🙏 Merci de confirmer avec les boutons ci-dessous !\n` +
                    `_✨ Luna CRM - On compte sur vous !_`;

                const endpoint = channel === 'WHATSAPP' ? '/api/whatsapp/send' : '/api/gmail/send';
                await fetchWithAuth(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to,
                        message,
                        subject: `🌟 Luna Agent : Demande de disponibilité - ${item.name}`,
                        clientName: supplier.name,
                        clientId: supplier.id,
                        recipientType: 'SUPPLIER',
                        interactiveButtons: channel === 'WHATSAPP',
                        bookingId,
                        prestationName: item.name,
                    })
                });
            }

            setSentItems(prev => [...prev, item.id!]);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la validation.");
        } finally {
            setIsProcessingAction(null);
        }
    };

    const resetWorkflow = () => {
        setWorkflowState('IDLE');
        setValidatedAgents([]);
        setActiveAgents([]);
        setAgentResults(null);
        setInspirationImages([]);
    };

    if (!mounted) return null;

    const isProcessing = workflowState !== 'IDLE' && workflowState !== 'READY';

    return (
        <div ref={containerRef} className="relative w-full flex flex-col overflow-hidden">
            {/* Clean background — no animated capsules/globe */}



            {/* ═══ PROCESSING ANIMATIONS ═══ */}
            {isProcessing && (
                <style>{`
                    @keyframes agentFloat {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-8px); }
                    }
                    @keyframes superFloat {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                    @keyframes glowPulseOrange {
                        0%, 100% { box-shadow: 0 0 20px 4px rgba(245,158,11,0.15), 0 0 60px 10px rgba(245,158,11,0.05); }
                        50% { box-shadow: 0 0 40px 8px rgba(245,158,11,0.3), 0 0 80px 20px rgba(245,158,11,0.1); }
                    }
                    .agent-active-glow-orange { animation: glowPulseOrange 2s ease-in-out infinite; }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .shimmer-bar {
                        background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.3) 50%, transparent 100%);
                        background-size: 200% 100%;
                        animation: shimmer 2s ease-in-out infinite;
                    }
                    @keyframes particleRise {
                        0% { transform: translateY(0) scale(1); opacity: 0.6; }
                        100% { transform: translateY(-30px) scale(0); opacity: 0; }
                    }
                `}</style>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="flex-1 relative w-full" data-agent-wrapper>
                <div className="relative z-30 pointer-events-auto w-full overflow-y-auto" data-agent-content>
                    <AnimatePresence mode="wait">

                        {/* ═══ IDLE: PRO DASHBOARD FORM ═══ */}
                        {workflowState === 'IDLE' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full pb-6" data-agent-form
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <motion.h1
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-xl font-medium text-[#2E2E2E] tracking-tight"
                                        >
                                            Nouvelle recherche prestation
                                        </motion.h1>
                                        <p className="text-[10px] text-[#2E2E2E]/30 font-medium tracking-[0.2em] uppercase mt-0.5">Expert Prestations IA</p>
                                    </div>
                                </div>

                                <form onSubmit={handleStart} className="w-full">
                                    {/* Main grid: sidebar + form */}
                                    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

                                        {/* ── LEFT: Type de Prestation ── */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2E2E2E]/50 block">Type</label>
                                            <div className="flex flex-col gap-2">
                                                {prestations.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => toggleType(p.id)}
                                                        className={`w-full px-3.5 py-2 rounded-xl text-[12px] text-left transition-all duration-200 border ${selectedTypes.includes(p.id)
                                                            ? 'bg-[#2E2E2E] text-white shadow-sm border-[#2E2E2E] font-medium'
                                                            : 'bg-white text-[#2E2E2E]/50 border-[#2E2E2E]/[0.06] hover:border-[#2E2E2E]/[0.12] hover:text-[#2E2E2E]/70'
                                                            }`}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedTypes.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTypes([])}
                                                    className="w-full mt-3 text-[9px] text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest font-medium"
                                                >
                                                    Tout désélectionner ({selectedTypes.length})
                                                </button>
                                            )}
                                        </div>

                                        {/* ── RIGHT: Form fields ── */}
                                        <div className="space-y-4">
                                            {/* Demande & Inspiration Images */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E] flex justify-between items-center">
                                                    Votre demande
                                                    <button
                                                        type="button"
                                                        onClick={() => imageInputRef.current?.click()}
                                                        className="text-gray-400 hover:text-black transition-colors flex items-center gap-1 normal-case tracking-normal"
                                                    >
                                                            <ImageIcon size={12} />
                                                            <span className="text-[10px]">Photo d'inspiration ({inspirationImages.length}/3)</span>
                                                        </button>
                                                    </label>
                                                    <textarea
                                                        placeholder="Recherche pour un groupe de 12 personnes, vue mer, budget flexible..."
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none placeholder:text-gray-300 resize-none h-24 text-gray-700"
                                                        value={request}
                                                        onChange={e => setRequest(e.target.value)}
                                                    />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        hidden
                                                        ref={imageInputRef}
                                                        onChange={handleImageUpload}
                                                    />
                            
                                                    {/* Image Preview Row */}
                                                    {inspirationImages.length > 0 && (
                                                        <div className="flex gap-2">
                                                            {inspirationImages.map((src, i) => (
                                                                <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0">
                                                                    <img src={src} alt="Inspiration" className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspirationImages(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            {/* 3-col fields grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {/* Client */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E] block">Client</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none appearance-none cursor-pointer text-gray-700 pr-10"
                                                            value={selectedContactId}
                                                            onChange={e => setSelectedContactId(e.target.value)}
                                                        >
                                                            <option value="" disabled>Sélectionner...</option>
                                                            {contacts.map(c => (
                                                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                                            ))}
                                                        </select>
                                                        <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
                                                    </div>
                                                </div>

                                                {/* Personnes */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Personnes</label>
                                                    <input
                                                        type="number"
                                                        placeholder="2"
                                                        min={1}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none placeholder:text-gray-300 text-gray-700"
                                                        value={pax}
                                                        onChange={e => setPax(e.target.value)}
                                                    />
                                                </div>

                                                {/* Lieu */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Lieu</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Bali, Paris..."
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none placeholder:text-gray-300 text-gray-700"
                                                        value={destination}
                                                        onChange={e => setDestination(e.target.value)}
                                                    />
                                                </div>

                                                {/* Date */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none [color-scheme:light] text-gray-700"
                                                        value={bookingDate}
                                                        onChange={e => setBookingDate(e.target.value)}
                                                    />
                                                </div>

                                                {/* Heure */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Heure</label>
                                                    <input
                                                        type="time"
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none [color-scheme:light] text-gray-700"
                                                        value={bookingTime}
                                                        onChange={e => setBookingTime(e.target.value)}
                                                    />
                                                </div>

                                                {/* Budget */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Budget</label>
                                                    <input
                                                        type="text"
                                                        placeholder="5 000 €"
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#2E2E2E] focus:ring-0 transition-all outline-none placeholder:text-gray-300 text-gray-700"
                                                        value={budget}
                                                        onChange={e => setBudget(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div className="pt-3 flex justify-center w-full md:col-span-2">
                                                <button
                                                    type="submit"
                                                    className="w-full max-w-sm py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] bg-[#b9dae9] text-luna-charcoal hover:bg-[#a5cadc] shadow-[0_8px_30px_-8px_rgba(185,218,233,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(185,218,233,0.7)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative group overflow-hidden"
                                                >
                                                    <span className="relative z-10">Lancer l'expert</span>
                                                    <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}


                        {/* ═══ PROCESSING: HORIZONTAL AGENT LINE ═══ */}
                        {isProcessing && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[400px]"
                            >
                                <div className="mb-12">
                                    <LunaLogo size={65} className="mx-auto mb-8 animate-pulse" />
                                    <h3 className="text-2xl font-normal text-luna-charcoal tracking-tighter text-center uppercase">Analyse du Catalogue Luna...</h3>
                                    <motion.p
                                        key={activeAgents[activeAgents.length - 1] || 'init'}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-gray-400 text-center mt-3 font-medium uppercase tracking-widest"
                                    >
                                        {activeAgents.length === 0 && 'Initialisation...'}
                                        {activeAgents.includes('catalog') && !validatedAgents.includes('catalog') && 'Scan du catalogue en cours...'}
                                        {validatedAgents.includes('catalog') && !validatedAgents.includes('suppliers') && 'Matching des prestataires...'}
                                        {validatedAgents.includes('suppliers') && !validatedAgents.includes('finance') && 'Calcul de marge & optimisation...'}
                                        {validatedAgents.includes('finance') && 'Génération de la proposition...'}
                                    </motion.p>
                                </div>

                                <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                                    {/* Agent pipeline - horizontal steps */}
                                    <div className="flex items-center gap-0 w-full">
                                        {Object.entries(agentMeta).map(([key, meta], i) => {
                                            const Icon = meta.icon;
                                            const isActive = activeAgents.includes(key as AgentKey);
                                            const isDone = validatedAgents.includes(key as AgentKey);
                                            return (
                                                <div key={key} className="flex items-center flex-1">
                                                    <div className="flex flex-col items-center gap-2 flex-1">
                                                        <motion.div
                                                            initial={{ opacity: 0.3 }}
                                                            animate={{ opacity: isDone ? 1 : isActive ? 0.9 : 0.3 }}
                                                            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                                                                ${isDone ? 'bg-[#D3E8E3] border border-[#B8D9D1]' :
                                                                    isActive ? 'bg-[#E6D2BD]/30 border border-[#E6D2BD]' :
                                                                        'bg-gray-50 border border-gray-100'}`}
                                                        >
                                                            {isDone ? (
                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                                                                    <Check size={18} className="text-[#2E2E2E]" strokeWidth={2.5} />
                                                                </motion.div>
                                                            ) : (
                                                                <Icon size={18} className={isActive ? 'text-[#2E2E2E]' : 'text-gray-300'} />
                                                            )}
                                                            {/* Pulse ring on active */}
                                                            {isActive && !isDone && (
                                                                <span className="absolute inset-0 rounded-2xl border-2 border-[#E6D2BD] animate-ping opacity-20" />
                                                            )}
                                                        </motion.div>
                                                        <span className={`text-[8px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300
                                                            ${isDone ? 'text-[#2E2E2E]' : isActive ? 'text-[#2E2E2E]/70' : 'text-gray-300'}`}>
                                                            {meta.title}
                                                        </span>
                                                    </div>
                                                    {/* Connector line */}
                                                    {i < Object.keys(agentMeta).length - 1 && (
                                                        <div className="w-full h-[2px] bg-gray-100 relative overflow-hidden mx-1 mt-[-20px]">
                                                            <motion.div
                                                                className="absolute inset-y-0 left-0 bg-[#E6D2BD]"
                                                                initial={{ width: '0%' }}
                                                                animate={{ width: isDone ? '100%' : isActive ? '50%' : '0%' }}
                                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Global progress bar */}
                                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-[#E6D2BD] rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${(validatedAgents.length / 4) * 100}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ RESULTS READY ═══ */}
                        {workflowState === 'READY' && agentResults && (
                            <motion.div
                                key="ready"
                                initial={{ opacity: 0, scale: 0.97, y: 20, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full p-6 md:p-8 lg:p-10"
                            >
                                <div
                                    className="bg-white p-6 md:p-8 border border-gray-100 rounded-2xl"
                                >
                                    <div className="mb-10 border-b border-gray-50 pb-6">
                                        <p className="text-[9px] uppercase tracking-[0.4em] text-amber-500 font-bold mb-2">Résultats de matching 360°</p>
                                        <h2 className="text-2xl md:text-3xl font-normal text-luna-charcoal tracking-tighter uppercase leading-tight">Votre sélection sur-mesure</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                        <div className="space-y-6">
                                            <p className="text-sm text-[#B89B7A] font-medium uppercase tracking-widest border-l-2 border-[#E6D2BD] pl-4 mb-6">Prestations catalogue</p>

                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                                {agentResults.matchedItems?.map((item: CRMCatalogItem) => {
                                                    const isSelected = selectedCatalogItems.has(item.id!);

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => {
                                                                setSelectedCatalogItems(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(item.id!)) next.delete(item.id!);
                                                                    else next.add(item.id!);
                                                                    return next;
                                                                });
                                                            }}
                                                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ease-out ${isSelected ? 'bg-[#F8F4EC] border-[#E6D2BD] shadow-md scale-[1.01]' : 'bg-white border-[#F0EBE3] hover:border-[#E6D2BD]/60 hover:shadow-sm hover:scale-[1.005]'}`}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex gap-3 items-center flex-1 min-w-0">
                                                                    {/* Toggle Switch */}
                                                                    <div className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors duration-300 ${isSelected ? 'bg-[#E6D2BD]' : 'bg-[#E8E4DE]'}`}>
                                                                        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isSelected ? 'left-[21px]' : 'left-[3px]'}`} />
                                                                    </div>
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#F0EBE3] shrink-0 bg-[#FDFBF8]">
                                                                        {(item.images?.[0] || item.imageUrl) ? <img src={item.images?.[0] || item.imageUrl} className="w-full h-full object-cover" /> : <Hotel className="m-auto text-[#D4C5B0] mt-2" size={20} />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-semibold text-[#2E2E2E] text-[12px] tracking-tight truncate">{item.name}</h4>
                                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                            <span className="text-[8px] text-[#B89B7A] uppercase tracking-widest font-medium">{item.location}</span>
                                                                            <span className="text-[8px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#F8F4EC] text-[#B89B7A] border border-[#E6D2BD]/30">{item.type}</span>
                                                                        </div>
                                                                        {/* Supplier dropdown */}
                                                                        {isSelected && (
                                                                            <div className="mt-2 bg-white border border-[#E6D2BD]/30 rounded-xl px-2.5 py-1.5 w-fit flex items-center gap-1.5 shadow-sm" onClick={e => e.stopPropagation()}>
                                                                                <Users size={10} className="text-[#B89B7A]" />
                                                                                <select
                                                                                    value={overriddenSuppliers[item.id!] || item.supplierId || ''}
                                                                                    onChange={(e) => setOverriddenSuppliers(prev => ({ ...prev, [item.id!]: e.target.value }))}
                                                                                    className="bg-transparent text-[10px] font-medium text-[#2E2E2E] outline-none cursor-pointer tracking-tight max-w-[140px]"
                                                                                >
                                                                                    <option value="">Choisir expert...</option>
                                                                                    {suppliers.map(s => (
                                                                                        <option key={s.id} value={s.id}>{s.name}{s.id === item.supplierId ? ' ✓' : ''}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0 pl-3">
                                                                    <span className="text-lg font-semibold text-[#2E2E2E] tracking-tight">{item.netCost}€</span>
                                                                    <p className="text-[8px] text-[#B89B7A] font-medium uppercase tracking-widest">Net</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {(!agentResults.matchedItems || agentResults.matchedItems.length === 0) && (
                                                    <div className="p-8 border-2 border-dashed border-[#E6D2BD]/30 rounded-2xl text-center bg-[#FDFBF8]">
                                                        <p className="text-sm text-[#B89B7A] italic">Aucune prestation trouvée dans votre catalogue.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── AI External Suggestions (selectable) ── */}
                                            {agentResults.aiSuggestions && agentResults.aiSuggestions.length > 0 && (
                                                <div className="mt-6 pt-5 border-t border-[#F0EBE3]">
                                                    <p className="text-sm text-[#B89B7A] font-medium uppercase tracking-widest border-l-2 border-[#E6D2BD] pl-4 mb-1">Recommandations IA</p>
                                                    <p className="text-[10px] text-[#C4B199] mb-3">Sélectionnez pour ajouter au package :</p>
                                                    <div className="space-y-2">
                                                        {agentResults.aiSuggestions.map((s: any, idx: number) => {
                                                            const isSelected = selectedAiSuggestions.has(idx);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        setSelectedAiSuggestions(prev => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(idx)) next.delete(idx);
                                                                            else next.add(idx);
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-[#F8F4EC] border-[#E6D2BD] shadow-md scale-[1.01]' : 'bg-[#FDFBF8] border-[#F0EBE3] hover:border-[#E6D2BD]/60 hover:shadow-sm hover:scale-[1.005]'}`}
                                                                >
                                                                    <div className="flex gap-2.5 items-center min-w-0">
                                                                        {/* Toggle Switch */}
                                                                        <div className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-300 ${isSelected ? 'bg-[#E6D2BD]' : 'bg-[#E8E4DE]'}`}>
                                                                            <div className={`absolute top-[2.5px] w-[15px] h-[15px] rounded-full bg-white shadow-sm transition-all duration-300 ${isSelected ? 'left-[19px]' : 'left-[2.5px]'}`} />
                                                                        </div>
                                                                        <span className="text-sm">{s.type === 'RESTAURANT' ? '🍽' : s.type === 'HOTEL' ? '🏨' : s.type === 'TRANSFER' ? '🚗' : s.type === 'EXPERIENCE' ? '✨' : '🎯'}</span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-semibold text-[#2E2E2E] truncate">{s.name}</p>
                                                                            <p className="text-[8px] text-[#B89B7A] uppercase tracking-widest">{s.type} — {s.location}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {s.estimatedPrice && <span className="text-sm font-semibold text-[#2E2E2E]">{s.estimatedPrice}€</span>}
                                                                        {s.link && (
                                                                            <a href={s.link} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg text-[#C4B199] hover:text-[#2E2E2E] hover:bg-[#F8F4EC] transition-colors">
                                                                                <ExternalLink size={12} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-[#FDFBF8] rounded-[32px] p-6 md:p-8 flex flex-col justify-between border border-[#F0EBE3] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                                <LunaLogo size={100} />
                                            </div>

                                            {/* Financial Breakdown */}
                                            {(() => {
                                                const catalogNet = agentResults.matchedItems
                                                    ?.filter((i: CRMCatalogItem) => selectedCatalogItems.has(i.id!))
                                                    .reduce((sum: number, i: CRMCatalogItem) => sum + (i.netCost || 0), 0) || 0;
                                                const aiNet = agentResults.aiSuggestions
                                                    ?.filter((_: any, idx: number) => selectedAiSuggestions.has(idx))
                                                    .reduce((sum: number, s: any) => sum + (s.estimatedPrice || 0), 0) || 0;
                                                const totalNet = catalogNet + aiNet;
                                                const totalSell = Math.round(totalNet * (1 + DEFAULT_MARKUP / 100));
                                                const margin = totalSell - totalNet;
                                                const itemCount = selectedCatalogItems.size + selectedAiSuggestions.size;

                                                return (
                                                    <div className="space-y-5 relative z-10">
                                                        <p className="text-[9px] uppercase tracking-[0.3em] text-[#B89B7A] font-bold">Votre Package</p>

                                                        {/* Selected count */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-[#E6D2BD]/30 flex items-center justify-center">
                                                                <span className="text-xs font-bold text-[#2E2E2E]">{itemCount}</span>
                                                            </div>
                                                            <span className="text-xs text-[#B89B7A]">prestation{itemCount > 1 ? 's' : ''} sélectionnée{itemCount > 1 ? 's' : ''}</span>
                                                        </div>

                                                        {/* Net Cost */}
                                                        <div className="bg-white rounded-2xl p-4 border border-[#F0EBE3]">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="text-[9px] uppercase tracking-widest text-[#B89B7A] font-bold">Coût Net</span>
                                                                <span className="text-2xl font-light text-[#2E2E2E] tracking-tighter">{totalNet.toLocaleString()}€</span>
                                                            </div>
                                                            <p className="text-[8px] text-[#C4B199]">Ce que vous payez aux prestataires</p>
                                                        </div>

                                                        {/* Sell Price */}
                                                        <div className="bg-white rounded-2xl p-4 border border-[#E6D2BD]/30">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="text-[9px] uppercase tracking-widest text-[#B89B7A] font-bold">Prix de vente (+{DEFAULT_MARKUP}%)</span>
                                                                <span className="text-3xl font-semibold text-[#2E2E2E] tracking-tighter">{totalSell.toLocaleString()}€</span>
                                                            </div>
                                                            <p className="text-[8px] text-[#C4B199]">Ce que vous facturez au client</p>
                                                        </div>

                                                        {/* Margin */}
                                                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">Votre Marge</span>
                                                                <span className="text-2xl font-bold text-emerald-600 tracking-tighter">+{margin.toLocaleString()}€</span>
                                                            </div>
                                                            <p className="text-[8px] text-emerald-500">{totalNet > 0 ? Math.round((margin / totalNet) * 100) : 0}% de marge nette</p>
                                                        </div>

                                                        {/* AI Reason */}
                                                        {agentResults.reason && (
                                                            <div className="p-4 bg-white rounded-2xl border border-[#F0EBE3] text-left">
                                                                <p className="text-[9px] font-bold text-[#B89B7A] uppercase tracking-widest mb-1">IA Recommendation</p>
                                                                <p className="text-[11px] text-[#6B5C4C] leading-relaxed italic">"{agentResults.reason}"</p>
                                                            </div>
                                                        )}

                                                        {/* Save result feedback */}
                                                        {saveResult && (
                                                            <div className={`p-3 rounded-xl text-xs ${saveResult.conflicts.length > 0 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                                                                {saveResult.ok > 0 && <p className="font-bold">✅ {saveResult.ok} prestation{saveResult.ok > 1 ? 's' : ''} sauvegardée{saveResult.ok > 1 ? 's' : ''}</p>}
                                                                {saveResult.conflicts.map((c, i) => <p key={i} className="mt-1">⚠️ {c}</p>)}
                                                            </div>
                                                        )}

                                                        {/* Unified Save Button */}
                                                        <button
                                                            onClick={async () => {
                                                                if (!tenantId || itemCount === 0) return;
                                                                setIsSavingAll(true);
                                                                setSaveResult(null);
                                                                const conflicts: string[] = [];
                                                                let ok = 0;
                                                                const targetDate = bookingDate || new Date().toISOString().split('T')[0];

                                                                try {
                                                                    // Save catalog items
                                                                    for (const itemId of selectedCatalogItems) {
                                                                        const item = agentResults.matchedItems?.find((i: CRMCatalogItem) => i.id === itemId);
                                                                        if (!item) continue;

                                                                        let suppId = overriddenSuppliers[item.id!] || item.supplierId;
                                                                        // Auto-find supplier if none
                                                                        if (!suppId) {
                                                                            const typeToCategory: Record<string, string[]> = { 'HOTEL': ['HÉBERGEMENT'], 'ACTIVITY': ['ACTIVITÉ', 'GUIDE', 'CULTURE'], 'TRANSFER': ['TRANSPORT', 'GUIDE'], 'OTHER': ['RESTAURANT', 'AUTRE'] };
                                                                            const cats = typeToCategory[(item.type || '').toUpperCase()] || [];
                                                                            const match = suppliers.find(s => cats.includes(s.category));
                                                                            suppId = match?.id;
                                                                        }
                                                                        if (!suppId) { conflicts.push(`${item.name}: aucun prestataire trouvé`); continue; }

                                                                        // Check availability
                                                                        const supplierBusy = existingBookings.find(b =>
                                                                            b.supplierId === suppId && b.date === targetDate && b.status !== 'CANCELLED'
                                                                        );
                                                                        if (supplierBusy) {
                                                                            const supplierName = suppliers.find(s => s.id === suppId)?.name || 'Prestataire';
                                                                            conflicts.push(`${supplierName} déjà réservé le ${targetDate} (${supplierBusy.prestationName})`);
                                                                            continue;
                                                                        }

                                                                        const supplier = suppliers.find(s => s.id === suppId);
                                                                        const clientContact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null;
                                                                        const clientFullName = clientContact ? `${clientContact.firstName} ${clientContact.lastName}`.trim() : 'Client Luna';

                                                                        const bookingId = await createSupplierBooking(tenantId, {
                                                                            supplierId: suppId!,
                                                                            prestationId: item.id!,
                                                                            prestationName: item.name,
                                                                            prestationType: (item.type || 'OTHER') as any,
                                                                            date: targetDate,
                                                                            startTime: bookingTime || '09:00',
                                                                            endTime: '',
                                                                            status: 'PROPOSED',
                                                                            rate: item.netCost,
                                                                            extraFees: 0,
                                                                            numberOfGuests: pax ? parseInt(pax) : undefined,
                                                                            notes: `Package Luna Agent. ${request}`,
                                                                            clientName: clientFullName,
                                                                        });

                                                                        // Send WhatsApp
                                                                        if (supplier?.phone) {
                                                                            try {
                                                                                const dateStr = format(new Date(targetDate), 'dd MMMM yyyy', { locale: fr });
                                                                                await fetchWithAuth('/api/whatsapp/send', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({
                                                                                        to: supplier.phone,
                                                                                        message: `😊 Bonjour ${supplier.contactName || supplier.name} !\n\n🎨 *${item.name}*\n📅 ${dateStr} à ${bookingTime || '09:00'}\n💰 ${item.netCost}€\n${pax ? `👥 ${pax} pax\n` : ''}${clientFullName ? `👤 ${clientFullName}\n` : ''}\n🙏 Merci de confirmer !`,
                                                                                        recipientType: 'SUPPLIER',
                                                                                        bookingId,
                                                                                        prestationName: item.name,
                                                                                        clientName: supplier.name,
                                                                                    })
                                                                                });
                                                                            } catch (e) { console.warn('WhatsApp failed:', e); }
                                                                        }
                                                                        ok++;
                                                                    }

                                                                    // Create unified quote
                                                                    const allItems = [
                                                                        ...agentResults.matchedItems?.filter((i: CRMCatalogItem) => selectedCatalogItems.has(i.id!)).map((i: CRMCatalogItem) => ({
                                                                            description: `${i.name} — ${i.location}`,
                                                                            quantity: 1,
                                                                            netCost: i.netCost,
                                                                            unitPrice: Math.round(i.netCost * (1 + DEFAULT_MARKUP / 100)),
                                                                            total: Math.round(i.netCost * (1 + DEFAULT_MARKUP / 100)),
                                                                            taxRate: 20,
                                                                        })) || [],
                                                                        ...agentResults.aiSuggestions?.filter((_: any, idx: number) => selectedAiSuggestions.has(idx)).map((s: any) => ({
                                                                            description: `${s.name} — ${s.location} (Reco IA)`,
                                                                            quantity: 1,
                                                                            netCost: s.estimatedPrice || 0,
                                                                            unitPrice: Math.round((s.estimatedPrice || 0) * (1 + DEFAULT_MARKUP / 100)),
                                                                            total: Math.round((s.estimatedPrice || 0) * (1 + DEFAULT_MARKUP / 100)),
                                                                            taxRate: 20,
                                                                        })) || [],
                                                                    ];

                                                                    if (allItems.length > 0) {
                                                                        const subtotal = allItems.reduce((sum, i) => sum + i.total, 0);
                                                                        const contact = selectedContactId ? contacts.find(c => c.id === selectedContactId) : null;
                                                                        await createQuote(tenantId, {
                                                                            quoteNumber: `PKG-${Date.now().toString().slice(-6)}`,
                                                                            tripId: '',
                                                                            clientId: selectedContactId || '',
                                                                            clientName: contact ? `${contact.firstName} ${contact.lastName}`.trim() : 'Client Luna',
                                                                            issueDate: new Date().toISOString().split('T')[0],
                                                                            validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                                                                            items: allItems,
                                                                            subtotal,
                                                                            taxTotal: Math.round(subtotal * 0.2),
                                                                            totalAmount: Math.round(subtotal * 1.2),
                                                                            currency: 'EUR',
                                                                            status: 'DRAFT',
                                                                            notes: `Package Luna Agent.\nDemande: ${request}\nDestination: ${destination}`,
                                                                        });
                                                                    }

                                                                    // Refresh bookings
                                                                    const updatedBookings = await getAllSupplierBookings(tenantId);
                                                                    setExistingBookings(updatedBookings);
                                                                } catch (e) {
                                                                    console.error('Save all error:', e);
                                                                    conflicts.push('Erreur technique lors de la sauvegarde');
                                                                }

                                                                setSaveResult({ ok, conflicts });
                                                                setIsSavingAll(false);
                                                                // Auto-redirect to planning after success
                                                                if (ok > 0) {
                                                                    setTimeout(() => router.push('/crm/planning/suppliers'), 1500);
                                                                }
                                                            }}
                                                            disabled={isSavingAll || itemCount === 0}
                                                            className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all duration-300 ${saveResult && saveResult.ok > 0 && saveResult.conflicts.length === 0
                                                                ? 'bg-emerald-500 text-white'
                                                                : itemCount === 0
                                                                    ? 'bg-[#F0EBE3] text-[#C4B199] cursor-not-allowed'
                                                                    : 'bg-[#2E2E2E] text-white hover:bg-[#1a1a1a] active:scale-[0.98] shadow-lg'
                                                                } disabled:opacity-60`}
                                                        >
                                                            {isSavingAll ? (
                                                                <><Loader2 className="animate-spin" size={14} /> Sauvegarde en cours...</>
                                                            ) : saveResult && saveResult.ok > 0 && saveResult.conflicts.length === 0 ? (
                                                                <><CheckCircle2 size={14} /> Sauvegardé ✓</>
                                                            ) : (
                                                                <><Send size={14} /> Confirmer & Sauvegarder</>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={resetWorkflow}
                                                            className="w-full py-2.5 text-[#B89B7A] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-[#2E2E2E] transition-colors"
                                                        >
                                                            Nouvelle recherche
                                                        </button>

                                                        <p className="text-[8px] text-[#C4B199] text-center">Vérifie la dispo, crée le devis & notifie les prestataires</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


        </div>
    );
}
