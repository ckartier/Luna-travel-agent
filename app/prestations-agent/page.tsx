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
    Sparkles,
    Zap,
    Star,
    DollarSign,
    UsersRound,
    FileText,
    Check,
    X,
    MessageCircle,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getCatalogItems, CRMCatalogItem, getContacts, CRMContact,
    getSuppliers, CRMSupplier, createSupplierBooking
} from '@/src/lib/firebase/crm';
import { LunaLogo } from '@/app/components/LunaLogo';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'CATALOG_MATCHING' | 'MARGIN_CALC' | 'VALIDATION' | 'READY';

const agentMeta = {
    catalog: { title: 'Catalogue', subtitle: 'Matching Services', desc: 'Analyse du catalogue pour trouver les prestations les plus pertinentes', icon: Hotel, color: '#f59e0b' },
    suppliers: { title: 'Prestataires', subtitle: 'Disponibilités', desc: 'Vérification de la base prestataires et coordination des contacts', icon: UsersRound, color: '#f59e0b' },
    finance: { title: 'Finance', subtitle: 'Calcul des Marges', desc: 'Optimisation de la rentabilité et markups recommandés', icon: DollarSign, color: '#f59e0b' },
    proposal: { title: 'Proposition', subtitle: 'Fiche Expert', desc: 'Génération de la fiche prestation complète', icon: FileText, color: '#f59e0b' },
};

type AgentKey = keyof typeof agentMeta;

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

    // Data State
    const [catalog, setCatalog] = useState<CRMCatalogItem[]>([]);
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [activeAgents, setActiveAgents] = useState<AgentKey[]>([]);
    const [validatedAgents, setValidatedAgents] = useState<AgentKey[]>([]);
    const [agentResults, setAgentResults] = useState<any>(null);
    const [sentItems, setSentItems] = useState<string[]>([]);
    const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

    const userPhotoURL = userProfile?.photoURL || user?.photoURL || null;
    const userDisplayName = userProfile?.displayName || user?.displayName || 'Expert';

    useEffect(() => {
        setMounted(true);
        if (tenantId) {
            Promise.all([
                getCatalogItems(tenantId),
                getSuppliers(tenantId)
            ]).then(([cat, sup]) => {
                setCatalog(cat);
                setSuppliers(sup);
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
            agents.forEach((a, i) => {
                setTimeout(() => setActiveAgents(prev => [...prev, a]), i * 400);
            });
            const t = setTimeout(() => {
                callAgentAI();
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [workflowState]);

    const callAgentAI = async () => {
        try {
            console.log('[Prestations Agent] Sending catalog with', catalog.length, 'items');
            const res = await fetchWithAuth('/api/agents/prestations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: request,
                    catalog: catalog.map(c => ({
                        id: c.id, name: c.name, type: c.type, location: c.location,
                        description: c.description, netCost: c.netCost,
                        recommendedMarkup: c.recommendedMarkup, supplier: c.supplier,
                        supplierId: c.supplierId, images: c.images
                    })),
                    context: { budget, destination }
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
        if (!tenantId || !item.supplierId) {
            alert("Aucun prestataire n'est lié à cette fiche catalogue. Désolé !");
            return;
        }

        setIsProcessingAction(item.id!);
        try {
            const supplier = suppliers.find(s => s.id === item.supplierId);
            if (!supplier) throw new Error("Fournisseur introuvable");

            // 1. Création du Booking Planning
            const bookingData: any = {
                supplierId: item.supplierId,
                prestationId: item.id!,
                prestationName: item.name,
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '12:00',
                status: 'PROPOSED',
                rate: item.netCost,
                extraFees: 0,
                notes: `Validation Instantanée via Luna Agent.\nDemande: ${request}`,
                clientName: 'Client Luna Agent'
            };
            const bookingId = await createSupplierBooking(tenantId, bookingData);

            // 2. Envoi WhatsApp / Mail
            const channel = supplier.phone ? 'WHATSAPP' : 'EMAIL';
            const to = channel === 'WHATSAPP' ? supplier.phone : supplier.email;

            if (to) {
                const message = `😊 Bonjour ${supplier.contactName || supplier.name} !\n\n` +
                    `On aurait besoin de vous pour une super prestation 🌟\n\n` +
                    `🎨 *${item.name}*\n` +
                    `📅 *Date :* ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}\n` +
                    `💰 *Prix :* ${item.netCost} €\n\n` +
                    `🙏 Merci de confirmer avec les boutons ci-dessous !\n` +
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
    };

    if (!mounted) return null;

    const isProcessing = workflowState !== 'IDLE' && workflowState !== 'READY';

    return (
        <div ref={containerRef} className="relative w-full min-h-screen flex flex-col overflow-hidden">
            {/* Background — Capsule anim: orange idle, cream during processing */}
            <div className="absolute inset-0 z-0">
                <CapsuleBackground colorScheme={isProcessing ? 'cream' : 'orange'} />
            </div>

            {/* ═══ HUB LINK — top-left, same position on both agents ═══ */}
            <Link
                href="/"
                className="fixed top-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/80 transition-all group shadow-sm"
            >
                <ArrowLeft size={16} className="text-luna-charcoal group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-luna-charcoal">Mission Hub</span>
            </Link>

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
                `}</style>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="flex-1 relative w-full h-full">
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                    <AnimatePresence mode="wait">

                        {/* ═══ IDLE: LUXURY CONCIERGE FORM — mirrors Voyage design ═══ */}
                        {workflowState === 'IDLE' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.2, ease: 'easeIn' } }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="relative w-[90vw] max-w-[480px]"
                                style={{ animation: 'superFloat 12s cubic-bezier(0.22,1,0.36,1) infinite' }}
                            >
                                {/* Avatar circle — sits ABOVE the card, overflowing (identical to Voyage) */}
                                <div className="flex justify-center relative z-10">
                                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-[5px] border-white shadow-[0_10px_40px_rgba(0,0,0,0.18)] mb-[-60px] md:mb-[-65px]">
                                        {userPhotoURL ? (
                                            <img src={userPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl md:text-4xl font-normal">
                                                {(userDisplayName || 'U').split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ═══ CAPSULE WHITE CARD — exact same design as Voyage ═══ */}
                                <div
                                    className="relative bg-white flex flex-col items-center max-h-[78vh] overflow-y-auto p-6 pt-[85px] pb-14 md:p-10 md:pt-[100px] md:pb-20"
                                    style={{
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.03)',
                                        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
                                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgba(0,0,0,0.1) transparent'
                                    }}
                                >
                                    {/* Pin dot at top — same as Voyage (orange tint) */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[45%] w-6 h-6 rounded-full bg-[#fff7ed] border-4 border-white shadow-sm z-10" />
                                    <div className="flex flex-col items-center mb-6">
                                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#0B1220', letterSpacing: '-0.01em', textAlign: 'center' }}>
                                            Bonjour{userDisplayName ? `, ${userDisplayName.split(' ')[0]}` : ''} — quelle prestation ? 🎨
                                        </p>
                                    </div>

                                    <form id="prestation-form" onSubmit={handleStart} className="flex flex-col gap-5 w-full">

                                        {/* ── REQUEST ── */}
                                        <div>
                                            <label className="input-label">Besoin du client</label>
                                            <textarea
                                                placeholder="Ex: Un transfert yacht privé à Bali avec champagne..."
                                                className="input-underline resize-none h-20 leading-relaxed w-full"
                                                value={request}
                                                onChange={e => setRequest(e.target.value)}
                                            />
                                        </div>

                                        {/* ── DESTINATION + BUDGET ── */}
                                        <div className="flex gap-3 md:gap-6">
                                            <div className="flex-1">
                                                <label className="input-label">Lieu</label>
                                                <input
                                                    type="text"
                                                    placeholder="Bali, Paris..."
                                                    className="input-underline"
                                                    value={destination}
                                                    onChange={e => setDestination(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="input-label">Budget</label>
                                                <input
                                                    type="text"
                                                    placeholder="5 000 €"
                                                    className="input-underline"
                                                    value={budget}
                                                    onChange={e => setBudget(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                    </form>
                                </div>

                                {/* CTA button — overflows below the card (identical structure to Voyage) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex justify-center relative z-10"
                                >
                                    <button
                                        type="submit"
                                        form="prestation-form"
                                        className="w-[85%] -mt-7 text-sm tracking-[0.15em] uppercase group py-4 rounded-3xl font-medium text-luna-charcoal transition-all hover:-translate-y-1 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid rgba(0,0,0,0.04)',
                                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <span>Lancer l'Expert</span>
                                        <Zap size={16} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ═══ PROCESSING: HORIZONTAL AGENT LINE ═══ */}
                        {isProcessing && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center justify-center"
                            >
                                <div className="mb-12">
                                    <LunaLogo size={48} className="mx-auto mb-6 animate-pulse" />
                                    <h3 className="text-3xl font-light text-luna-charcoal tracking-tight text-center">Analyse du Catalogue Luna...</h3>
                                </div>
                                <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
                                    {Object.entries(agentMeta).map(([key, meta], i) => {
                                        const Icon = meta.icon;
                                        const isActive = activeAgents.includes(key as AgentKey);
                                        const isDone = validatedAgents.includes(key as AgentKey);
                                        return (
                                            <motion.div
                                                key={key}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.15 }}
                                                className={`w-28 h-28 md:w-32 md:h-32 rounded-[40px] flex flex-col items-center justify-center border transition-all duration-700 ${isDone ? 'bg-emerald-50 border-emerald-100 shadow-xl' :
                                                    isActive ? 'bg-white border-amber-300 shadow-2xl agent-active-glow-orange' : 'bg-gray-50/50 border-gray-100 opacity-20'
                                                    }`}
                                                style={{ animation: isActive && !isDone ? 'agentFloat 3s ease-in-out infinite' : undefined }}
                                            >
                                                <Icon size={28} className={isDone ? 'text-emerald-500' : isActive ? 'text-amber-500' : 'text-gray-300'} />
                                                <span className="text-[8px] mt-3 uppercase tracking-widest font-bold text-gray-400">{meta.title}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ RESULTS READY ═══ */}
                        {workflowState === 'READY' && agentResults && (
                            <motion.div key="ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl w-full">
                                <div
                                    className="bg-white p-8 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.08)] border border-gray-100"
                                    style={{ borderRadius: '80px' }}
                                >
                                    <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-bold mb-2">Résultats de matching</p>
                                            <h2 className="text-3xl md:text-4xl font-light text-luna-charcoal tracking-tighter">Votre sélection sur-mesure</h2>
                                        </div>
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                                            <Sparkles size={24} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                        <div className="space-y-6">
                                            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest border-l-2 border-amber-400 pl-4 mb-6">Prestations recommandées</p>

                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                                {agentResults.matchedItems?.map((item: CRMCatalogItem) => {
                                                    const isSent = sentItems.includes(item.id!);
                                                    const isProcessingItem = isProcessingAction === item.id;

                                                    return (
                                                        <div key={item.id} className="p-5 md:p-6 bg-white rounded-[28px] border border-gray-100/50 shadow-sm hover:border-amber-200 transition-all group flex flex-col gap-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex gap-3 md:gap-4">
                                                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden shadow-sm bg-gray-50 shrink-0">
                                                                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <Hotel className="m-auto text-gray-200" size={24} />}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-luna-charcoal text-sm">{item.name}</h4>
                                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                                                                            <MapPin size={10} className="text-amber-500" /> {item.location}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-lg font-light text-luna-charcoal">{item.netCost}€</span>
                                                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Prix Net Expert</p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleInstantValidation(item)}
                                                                disabled={isSent || !!isProcessingAction}
                                                                className={`w-full py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSent ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner' :
                                                                    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-100 active:scale-95'
                                                                    } disabled:opacity-50`}
                                                            >
                                                                {isProcessingItem ? <Loader2 className="animate-spin" size={14} /> : isSent ? <Check size={14} /> : <Send size={14} />}
                                                                {isSent ? 'Projet Envoyé ✅' : 'Créer & Envoyer'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {(!agentResults.matchedItems || agentResults.matchedItems.length === 0) && (
                                                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-[32px] text-center">
                                                        <p className="text-sm text-gray-400 italic">Aucune prestation exacte trouvée pour vos critères.</p>
                                                        <button onClick={resetWorkflow} className="mt-4 text-[10px] uppercase tracking-widest font-bold text-amber-500 hover:underline">Réessayer</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50/50 rounded-[48px] p-6 md:p-8 flex flex-col justify-center border border-gray-100 text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <LunaLogo size={120} />
                                            </div>

                                            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-4">Total Package Suggéré</p>
                                            <p className="text-5xl md:text-6xl font-light text-luna-charcoal tracking-tighter mb-8">
                                                {Math.round(agentResults.totalNet || 0).toLocaleString()}€<span className="text-xl text-gray-300 ml-1">NET</span>
                                            </p>

                                            <div className="space-y-4 relative z-10">
                                                <div className="p-5 bg-white rounded-3xl shadow-sm border border-gray-50 text-left">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">IA Recommendation</p>
                                                    <p className="text-sm text-gray-600 leading-relaxed italic">"{agentResults.reason || "Ces prestations optimisent l'expérience client tout en respectant vos critères de marge."}"</p>
                                                </div>

                                                <button
                                                    onClick={() => router.push('/crm/planning/suppliers')}
                                                    className="w-full py-4 md:py-5 text-white rounded-[24px] text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                                    }}
                                                >
                                                    <FileText size={16} /> Voir dans le Planning
                                                </button>

                                                <button
                                                    onClick={resetWorkflow}
                                                    className="w-full py-3 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-luna-charcoal transition-colors"
                                                >
                                                    Nouvelle recherche
                                                </button>

                                                <p className="text-[9px] text-gray-400 font-medium">L'envoi aux prestataires synchronise votre planning en temps réel.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Logo bottom-left */}
            <div className="fixed bottom-6 left-6 z-30 opacity-60 hover:opacity-100 transition-opacity">
                <LunaLogo size={44} />
            </div>

            {/* Footer copyright — same as Voyage */}
            <footer className="absolute bottom-0 left-0 right-0 z-20 text-center py-3">
                <p className="text-[12px] text-gray-400 tracking-wider">© 2026 Luna — Expert Prestations</p>
            </footer>
        </div>
    );
}
