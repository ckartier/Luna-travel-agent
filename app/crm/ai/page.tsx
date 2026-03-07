'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Sparkles, User, Loader2, Plane, Hotel, Map, Briefcase,
  Users, CheckCircle2, ArrowRight, Star, Calendar, Plus, X, Check
} from 'lucide-react';
import {
  getCatalogItems, CRMCatalogItem, getContacts, CRMContact,
  getSuppliers, CRMSupplier, getTrips, CRMTrip,
  createTrip, createSupplierBooking, CRMSupplierBooking
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

// ═══ TYPES ═══
type AgentMode = 'CLIENT' | 'PRESTATION';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposals?: ProposalItem[];
}

interface ProposalItem {
  catalogItem: CRMCatalogItem;
  supplier?: CRMSupplier;
  date?: string;
  accepted?: boolean;
  note?: string;
}

// ═══ SUPER AGENT PAGE ═══
export default function SuperAgentPage() {
  const { tenantId } = useAuth();

  // Mode selection
  const [mode, setMode] = useState<AgentMode | null>(null);

  // Data
  const [catalog, setCatalog] = useState<CRMCatalogItem[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [trips, setTrips] = useState<CRMTrip[]>([]);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Planning builder
  const [selectedClient, setSelectedClient] = useState<CRMContact | null>(null);
  const [selectedPrestations, setSelectedPrestations] = useState<ProposalItem[]>([]);
  const [tripTitle, setTripTitle] = useState('');
  const [tripDest, setTripDest] = useState('');
  const [tripStart, setTripStart] = useState(new Date().toISOString().split('T')[0]);
  const [tripEnd, setTripEnd] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchClient, setSearchClient] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [cat, con, sup, trp] = await Promise.all([
        getCatalogItems(tenantId),
        getContacts(tenantId),
        getSuppliers(tenantId),
        getTrips(tenantId),
      ]);
      setCatalog(cat);
      setContacts(con);
      setSuppliers(sup);
      setTrips(trp);
    } catch (e) { console.error(e); }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ═══ AI SEND ═══
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context with available catalog items
      const catalogContext = catalog.map(c => `- ${c.name} (${c.type}, ${c.location}, ${c.netCost}€, supplier: ${c.supplier})`).join('\n');

      const systemPrompt = mode === 'PRESTATION'
        ? `Tu es le Super Agent Luna Travel spécialisé dans les PRESTATIONS. Tu as accès au catalogue de prestations suivant:\n${catalogContext}\n\nPropose des prestations du catalogue qui correspondent à la demande. Formate ta réponse en incluant pour chaque proposition: le nom, le prix, le lieu. Sois enthousiaste et utilise des emojis. Si la demande concerne un voyage, propose un ensemble cohérent de prestations.`
        : `Tu es le Super Agent Luna Travel spécialisé dans l'accompagnement CLIENT. Tu aides à créer des voyages sur-mesure pour les clients. Tu as accès au catalogue:\n${catalogContext}\n\nConseille le meilleur parcours, propose des options avec les prix. Sois chaleureux, professionnel et utilise des emojis.`;

      const res = await fetchWithAuth('/api/crm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
        }),
      });
      const data = await res.json();

      // Try to extract catalog items mentioned in the response
      const mentionedItems = catalog.filter(c =>
        data.response?.toLowerCase().includes(c.name.toLowerCase())
      );

      const proposals: ProposalItem[] = mentionedItems.map(item => ({
        catalogItem: item,
        supplier: suppliers.find(s => s.id === item.supplierId),
        accepted: undefined,
      }));

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'Erreur',
        proposals: proposals.length > 0 ? proposals : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: '❌ Erreur de connexion au Super Agent.'
      }]);
    }
    setIsLoading(false);
  };

  // ═══ ACCEPT/REJECT PROPOSALS ═══
  const handleAcceptProposal = (msgId: string, itemId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.proposals) return msg;
      return {
        ...msg,
        proposals: msg.proposals.map(p =>
          p.catalogItem.id === itemId ? { ...p, accepted: true } : p
        )
      };
    }));
    // Add to selected prestations
    const proposal = messages.find(m => m.id === msgId)?.proposals?.find(p => p.catalogItem.id === itemId);
    if (proposal) {
      setSelectedPrestations(prev => {
        if (prev.find(p => p.catalogItem.id === itemId)) return prev;
        return [...prev, { ...proposal, accepted: true }];
      });
    }
  };

  const handleRejectProposal = (msgId: string, itemId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.proposals) return msg;
      return {
        ...msg,
        proposals: msg.proposals.map(p =>
          p.catalogItem.id === itemId ? { ...p, accepted: false } : p
        )
      };
    }));
  };

  // ═══ PUSH TO PIPELINE ═══
  const handlePushToPipeline = async () => {
    if (!tenantId || !selectedClient || selectedPrestations.length === 0) return;
    setSaving(true);
    try {
      // 1. Create trip
      const totalAmount = selectedPrestations.reduce((sum, p) =>
        sum + Math.round(p.catalogItem.netCost * (1 + p.catalogItem.recommendedMarkup / 100)), 0);

      const tripId = await createTrip(tenantId, {
        title: tripTitle || `Voyage ${selectedClient.firstName} ${selectedClient.lastName}`,
        destination: tripDest || selectedPrestations[0]?.catalogItem.location || 'À définir',
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        clientId: selectedClient.id || '',
        startDate: tripStart,
        endDate: tripEnd,
        status: 'PROPOSAL',
        paymentStatus: 'UNPAID',
        amount: totalAmount,
        notes: `Créé par Super Agent Luna AI\nPrestations: ${selectedPrestations.map(p => p.catalogItem.name).join(', ')}`,
        color: '#8b5cf6',
      });

      // 2. Create supplier bookings for each prestation
      for (const prestation of selectedPrestations) {
        if (prestation.catalogItem.supplierId) {
          await createSupplierBooking(tenantId, {
            supplierId: prestation.catalogItem.supplierId,
            prestationId: prestation.catalogItem.id!,
            prestationName: prestation.catalogItem.name,
            clientId: selectedClient.id,
            clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
            date: prestation.date || tripStart,
            status: 'PROPOSED',
            rate: prestation.catalogItem.netCost,
          });
        }
      }

      setShowPlanningModal(false);
      setSelectedPrestations([]);
      alert('🎉 Voyage créé et prestations envoyées dans le planning !');
      loadData();
    } catch (e) {
      console.error(e);
      alert('❌ Erreur lors de la création');
    }
    setSaving(false);
  };

  // Filtered clients
  const filteredClients = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchClient.toLowerCase())
  );

  // ═══ MODE SELECTION ═══
  if (!mode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-200">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-normal text-luna-charcoal tracking-tight mb-3">Super Agent Luna ✨</h1>
          <p className="text-luna-text-muted text-sm max-w-md mx-auto">
            Choisissez votre mode d'action — l'agent s'adapte à votre besoin.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Client Mode */}
          <motion.button
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setMode('CLIENT')}
            className="group p-8 bg-white rounded-[32px] border border-gray-100 hover:border-sky-300 hover:shadow-2xl hover:shadow-sky-50 transition-all text-left"
          >
            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-100 transition-colors">
              <Users size={28} className="text-sky-600" />
            </div>
            <h2 className="text-xl font-normal text-luna-charcoal mb-2">👤 Mode Client</h2>
            <p className="text-sm text-luna-text-muted leading-relaxed">
              Créez un voyage sur-mesure pour votre client. L'agent propose des itinéraires, hôtels et activités adaptés.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sky-600 text-sm font-medium">
              Commencer <ArrowRight size={16} />
            </div>
          </motion.button>

          {/* Prestation Mode */}
          <motion.button
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            onClick={() => setMode('PRESTATION')}
            className="group p-8 bg-white rounded-[32px] border border-gray-100 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-50 transition-all text-left"
          >
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
              <Briefcase size={28} className="text-purple-600" />
            </div>
            <h2 className="text-xl font-normal text-luna-charcoal mb-2">🎨 Mode Prestations Luna</h2>
            <p className="text-sm text-luna-text-muted leading-relaxed">
              Explorez et composez depuis votre catalogue de prestations. L'agent propose des combinaisons intelligentes.
            </p>
            <div className="mt-4 flex items-center gap-2 text-purple-600 text-sm font-medium">
              Commencer <ArrowRight size={16} />
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // ═══ MAIN CHAT + SIDEBAR ═══
  const accentColor = mode === 'CLIENT' ? 'sky' : 'purple';

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6">
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl`}>
          <div className="flex items-center gap-3">
            <button onClick={() => { setMode(null); setMessages([]); setSelectedPrestations([]); }}
              className="text-luna-text-muted hover:text-luna-charcoal transition-colors text-sm">
              ← Changer de mode
            </button>
            <span className="w-px h-5 bg-gray-200" />
            <div className={`w-8 h-8 rounded-xl bg-${accentColor}-50 flex items-center justify-center`}>
              {mode === 'CLIENT' ? <Users size={16} className={`text-${accentColor}-600`} /> : <Briefcase size={16} className={`text-${accentColor}-600`} />}
            </div>
            <div>
              <h2 className="text-sm font-normal text-luna-charcoal">
                {mode === 'CLIENT' ? '👤 Super Agent Client' : '🎨 Super Agent Prestations'}
              </h2>
              <p className="text-[11px] text-luna-text-muted">
                {catalog.length} prestations • {suppliers.length} prestataires • {contacts.length} contacts
              </p>
            </div>
          </div>

          {selectedPrestations.length > 0 && (
            <button onClick={() => setShowPlanningModal(true)}
              className={`flex items-center gap-2 px-5 py-2.5 bg-${accentColor}-600 text-white rounded-xl text-sm font-normal hover:bg-${accentColor}-700 transition-all shadow-lg shadow-${accentColor}-100`}>
              <Calendar size={16} />
              Envoyer au Planning ({selectedPrestations.length})
            </button>
          )}
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`w-16 h-16 bg-${accentColor}-50 rounded-2xl flex items-center justify-center mb-6`}>
              <Sparkles size={28} className={`text-${accentColor}-500`} />
            </div>
            <h2 className="text-xl font-normal text-luna-charcoal mb-2">
              {mode === 'CLIENT' ? 'Décrivez le voyage idéal de votre client 😊' : 'Cherchez des prestations dans votre catalogue 🎨'}
            </h2>
            <p className="text-luna-text-muted text-sm mb-6 max-w-md text-center">
              {mode === 'CLIENT'
                ? 'Je connais votre catalogue et vos prestataires. Dites-moi le budget, la destination, les envies !'
                : 'Décrivez ce que vous cherchez et je propose des combinaisons de prestations depuis votre base.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
              {(mode === 'CLIENT' ? [
                { icon: '✈️', text: 'Voyage Bali 10 jours couple, 6000€' },
                { icon: '🏖️', text: 'Séjour Maldives luxe famille' },
                { icon: '🗾', text: 'Circuit Japon 2 semaines aventure' },
              ] : [
                { icon: '🏨', text: 'Quels hôtels j\'ai en Thaïlande ?' },
                { icon: '🎯', text: 'Propose des activités pour Bali' },
                { icon: '📋', text: 'Compose un package tout compris Grèce' },
              ]).map((s, i) => (
                <button key={i} onClick={() => setInput(s.text)}
                  className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-normal hover:bg-${accentColor}-50 hover:border-${accentColor}-200 transition-colors`}>
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {messages.map(msg => (
              <div key={msg.id}>
                <div className={`flex gap-3 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-xl bg-${accentColor}-50 flex items-center justify-center shrink-0 mt-1`}>
                      <Bot size={16} className={`text-${accentColor}-500`} />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl max-w-[85%] ${msg.role === 'user'
                      ? `bg-${accentColor}-600 text-white rounded-br-sm`
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>

                {/* Proposal cards */}
                {msg.proposals && msg.proposals.length > 0 && (
                  <div className="max-w-3xl mx-auto mt-3 ml-11">
                    <p className="text-xs text-luna-text-muted mb-2 uppercase tracking-widest">
                      🎯 Prestations proposées — Validez celles que vous souhaitez
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {msg.proposals.map(proposal => (
                        <motion.div key={proposal.catalogItem.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border transition-all ${proposal.accepted === true ? 'bg-emerald-50 border-emerald-200' :
                              proposal.accepted === false ? 'bg-red-50 border-red-200 opacity-50' :
                                'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                            }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-luna-charcoal">{proposal.catalogItem.name}</p>
                              <p className="text-xs text-luna-text-muted mt-0.5">📍 {proposal.catalogItem.location} • {proposal.catalogItem.supplier}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{proposal.catalogItem.type}</span>
                                <span className="text-sm font-medium text-emerald-600">
                                  {Math.round(proposal.catalogItem.netCost * (1 + proposal.catalogItem.recommendedMarkup / 100))}€
                                </span>
                                <span className="text-[10px] text-gray-400">(coût: {proposal.catalogItem.netCost}€)</span>
                              </div>
                            </div>
                          </div>
                          {proposal.accepted === undefined && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleAcceptProposal(msg.id, proposal.catalogItem.id!)}
                                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-1">
                                <Check size={14} /> Valider
                              </button>
                              <button onClick={() => handleRejectProposal(msg.id, proposal.catalogItem.id!)}
                                className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-1">
                                <X size={14} /> Refuser
                              </button>
                            </div>
                          )}
                          {proposal.accepted === true && (
                            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
                              <CheckCircle2 size={14} /> Validée ✅
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-3xl mx-auto">
                <div className={`w-8 h-8 rounded-xl bg-${accentColor}-50 flex items-center justify-center shrink-0 mt-1`}>
                  <Bot size={16} className={`text-${accentColor}-500`} />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Super Agent réfléchit... ✨</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className={`bg-gray-50 rounded-2xl border border-gray-200 p-2 flex items-end gap-2 focus-within:border-${accentColor}-400 focus-within:ring-2 focus-within:ring-${accentColor}-100 transition-all`}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={mode === 'CLIENT' ? 'Décrivez le voyage idéal...' : 'Cherchez dans vos prestations...'}
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:ring-0 text-sm py-3 px-2 text-luna-charcoal placeholder-gray-400" rows={1} />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl flex items-center justify-center transition-colors ${input.trim() && !isLoading ? `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700` : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR: Selected Prestations ═══ */}
      {selectedPrestations.length > 0 && (
        <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="w-[320px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-normal text-luna-charcoal flex items-center gap-2">
              <Star size={14} className={`text-${accentColor}-500`} />
              Prestations validées
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${accentColor}-50 text-${accentColor}-600`}>
                {selectedPrestations.length}
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedPrestations.map((p, i) => (
              <div key={p.catalogItem.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-luna-charcoal">{p.catalogItem.name}</p>
                    <p className="text-xs text-luna-text-muted">📍 {p.catalogItem.location}</p>
                  </div>
                  <button onClick={() => setSelectedPrestations(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{p.catalogItem.type}</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {Math.round(p.catalogItem.netCost * (1 + p.catalogItem.recommendedMarkup / 100))}€
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-luna-text-muted">Total estimé</span>
              <span className="font-medium text-luna-charcoal">
                {selectedPrestations.reduce((sum, p) =>
                  sum + Math.round(p.catalogItem.netCost * (1 + p.catalogItem.recommendedMarkup / 100)), 0
                ).toLocaleString('fr-FR')}€
              </span>
            </div>
            <button onClick={() => setShowPlanningModal(true)}
              className={`w-full py-3 bg-${accentColor}-600 text-white rounded-xl text-sm font-normal hover:bg-${accentColor}-700 transition-all flex items-center justify-center gap-2`}>
              <Calendar size={16} /> Créer le voyage →
            </button>
          </div>
        </motion.aside>
      )}

      {/* ═══ PLANNING MODAL ═══ */}
      <AnimatePresence>
        {showPlanningModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPlanningModal(false)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-luna-warm-gray/10"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-luna-warm-gray/10">
                <h3 className="font-serif text-lg font-normal text-luna-charcoal">📅 Créer le voyage & pousser au pipeline</h3>
                <button onClick={() => setShowPlanningModal(false)} className="p-1.5 rounded-lg hover:bg-luna-cream">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Client selector */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-luna-text-muted block mb-1.5">👤 Client</label>
                  <input value={searchClient} onChange={e => setSearchClient(e.target.value)}
                    placeholder="Rechercher un client..."
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm" />
                  {searchClient && !selectedClient && (
                    <div className="mt-1 border border-luna-warm-gray/10 rounded-xl max-h-32 overflow-y-auto">
                      {filteredClients.map(c => (
                        <button key={c.id} onClick={() => { setSelectedClient(c); setSearchClient(`${c.firstName} ${c.lastName}`); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-luna-cream transition-colors">
                          {c.firstName} {c.lastName} — {c.email}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <p className="text-xs text-emerald-600 mt-1">✅ {selectedClient.firstName} {selectedClient.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-luna-text-muted block mb-1.5">Titre du voyage</label>
                  <input value={tripTitle} onChange={e => setTripTitle(e.target.value)}
                    placeholder="ex: Séjour Bali Famille Dupont"
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm" />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-luna-text-muted block mb-1.5">Destination</label>
                  <input value={tripDest} onChange={e => setTripDest(e.target.value)}
                    placeholder="Bali, Indonésie"
                    className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-luna-text-muted block mb-1.5">Départ</label>
                    <input type="date" value={tripStart} onChange={e => setTripStart(e.target.value)}
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-luna-text-muted block mb-1.5">Retour</label>
                    <input type="date" value={tripEnd} onChange={e => setTripEnd(e.target.value)}
                      className="w-full py-2.5 px-3 bg-luna-cream/30 rounded-xl border border-luna-warm-gray/15 text-sm" />
                  </div>
                </div>

                {/* Prestations summary */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-luna-text-muted mb-2">🎨 Prestations ({selectedPrestations.length})</p>
                  <div className="space-y-1.5">
                    {selectedPrestations.map(p => (
                      <div key={p.catalogItem.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl text-xs">
                        <span className="text-emerald-700">{p.catalogItem.name}</span>
                        <span className="text-emerald-600 font-medium">
                          {Math.round(p.catalogItem.netCost * (1 + p.catalogItem.recommendedMarkup / 100))}€
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-2 border-t border-luna-warm-gray/10">
                    <span className="text-sm text-luna-text-muted">Total</span>
                    <span className="text-lg font-medium text-luna-charcoal">
                      {selectedPrestations.reduce((sum, p) =>
                        sum + Math.round(p.catalogItem.netCost * (1 + p.catalogItem.recommendedMarkup / 100)), 0
                      ).toLocaleString('fr-FR')}€
                    </span>
                  </div>
                </div>

                <button onClick={handlePushToPipeline} disabled={!selectedClient || saving}
                  className={`w-full py-3 bg-${accentColor}-600 text-white rounded-xl text-sm font-normal hover:bg-${accentColor}-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {saving ? 'Création en cours...' : 'Pousser au Pipeline & Planning 🚀'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
