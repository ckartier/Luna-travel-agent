'use client';

import { MapBackground } from '@/app/components/map/MapBackground';
import { WeatherWidget } from '@/src/components/widgets/WeatherWidget';
import {
  Compass,
  Plane,
  Hotel,
  CalendarRange,
  Users,
  CheckCircle2,
  ArrowRight,
  Send,
  LayoutDashboard,
  MapPin,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'DISTRIBUTING' | 'AGENTS_WORKING' | 'VALIDATION' | 'GENERATING_PROPOSALS' | 'PROPOSALS_READY';

const agentMeta = {
  transport: { title: 'Transport', subtitle: 'Vols & Routings', icon: Plane, angle: -90 },
  accommodation: { title: 'Hébergement', subtitle: 'Hôtels & Resorts', icon: Hotel, angle: 180 },
  client: { title: 'Profil Client', subtitle: 'CRM Analyse', icon: Users, angle: 0 },
  itinerary: { title: 'Itinéraire', subtitle: 'Planning Jour/Jour', icon: CalendarRange, angle: 90 },
};

type AgentKey = keyof typeof agentMeta;

interface Destination {
  id: string;
  city: string;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');
  const [destinations, setDestinations] = useState<Destination[]>([{ id: '1', city: '' }]);
  const [departureCity, setDepartureCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [budget, setBudget] = useState('');
  const [pax, setPax] = useState('');
  const [vibe, setVibe] = useState('');
  const [flexibility, setFlexibility] = useState('Dates Exactes');
  const [mustHaves, setMustHaves] = useState('');

  const [agentResults, setAgentResults] = useState<any>(null);
  const [validatedAgents, setValidatedAgents] = useState<AgentKey[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentKey | null>(null);
  const [activeAgents, setActiveAgents] = useState<AgentKey[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Orchestration state machine
  useEffect(() => {
    if (workflowState === 'ANALYSING') {
      const t = setTimeout(() => setWorkflowState('DISTRIBUTING'), 1800);
      return () => clearTimeout(t);
    }
    if (workflowState === 'DISTRIBUTING') {
      // Staggered agent activation
      const agents: AgentKey[] = ['transport', 'accommodation', 'client', 'itinerary'];
      agents.forEach((a, i) => {
        setTimeout(() => setActiveAgents(prev => [...prev, a]), i * 400);
      });
      const t = setTimeout(() => setWorkflowState('AGENTS_WORKING'), 2000);
      return () => clearTimeout(t);
    }
    if (workflowState === 'AGENTS_WORKING') {
      // Fire real API call
      callAgentsAPI();
    }
    if (workflowState === 'VALIDATION' && validatedAgents.length === 4) {
      const t = setTimeout(() => setWorkflowState('GENERATING_PROPOSALS'), 800);
      return () => clearTimeout(t);
    }
    if (workflowState === 'GENERATING_PROPOSALS') {
      const t = setTimeout(() => setWorkflowState('PROPOSALS_READY'), 2500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowState, validatedAgents]);

  const callAgentsAPI = async () => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureCity,
          destinations: destinations.filter(d => d.city.trim()),
          departureDate,
          returnDate,
          budget,
          pax,
          vibe,
          mustHaves,
        }),
      });
      const data = await res.json();
      setAgentResults(data);
      setWorkflowState('VALIDATION');
    } catch (err) {
      console.error('Agent API error:', err);
      setWorkflowState('VALIDATION');
    }
  };

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinations[0].city.trim()) return;
    setValidatedAgents([]);
    setActiveAgents([]);
    setAgentResults(null);
    setWorkflowState('ANALYSING');
  };

  const handleValidateAgent = () => {
    if (selectedAgent && !validatedAgents.includes(selectedAgent)) {
      setValidatedAgents(prev => [...prev, selectedAgent]);
    }
    setSelectedAgent(null);
  };

  const addDestination = () => {
    setDestinations(prev => [...prev, { id: Date.now().toString(), city: '' }]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length <= 1) return;
    setDestinations(prev => prev.filter(d => d.id !== id));
  };

  const updateDestination = (id: string, city: string) => {
    setDestinations(prev => prev.map(d => d.id === id ? { ...d, city } : d));
  };

  const resetWorkflow = () => {
    setWorkflowState('IDLE');
    setValidatedAgents([]);
    setActiveAgents([]);
    setAgentResults(null);
  };

  if (!mounted) return null;

  const isProcessing = workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY';

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden bg-[#f0ebe4]">
      <MapBackground />

      {/* CRM Quick Access */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <Link href="/crm" className="glass-pill px-4 py-2 flex items-center gap-2 text-luna-text-muted hover:text-luna-charcoal font-medium transition-all text-sm shadow-sm hover:shadow-md">
          <LayoutDashboard size={15} /> CRM
        </Link>
      </div>

      {/* Weather Widgets (real API) */}
      <div className="absolute top-20 right-5 z-40 w-[260px]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WeatherWidget destinations={[
            ...(departureCity.trim() ? [departureCity.trim()] : []),
            ...destinations.filter(d => d.city.trim()).map(d => d.city.trim()),
          ].filter(Boolean)} />
        </motion.div>
      </div>

      {/* ═══ ORBITAL ANIMATION (no wires) ═══ */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          {/* Concentric orbital rings */}
          {[200, 260, 320].map((size, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-sky-300/15"
              style={{ width: size, height: size }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 8 + i * 4, repeat: Infinity, ease: 'linear' }}
            >
              {/* Orbiting dot */}
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-sky-400/60 shadow-[0_0_8px_rgba(135,206,235,0.5)]"
                style={{ top: -4, left: '50%', marginLeft: -4 }}
              />
            </motion.div>
          ))}
          {/* Center glow pulse */}
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-sky-200/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 relative w-full h-full">
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <AnimatePresence mode="wait">

            {/* ═══ IDLE: LUXURY CONCIERGE FORM ═══ */}
            {workflowState === 'IDLE' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-card w-[480px] max-h-[85vh] overflow-y-auto p-10 shadow-luxury relative"
              >
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-luna-accent/10 rounded-full blur-[60px] pointer-events-none" />

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-14 h-14 rounded-full bg-luna-charcoal flex-center mb-4 shadow-lg">
                    <Compass className="w-7 h-7 text-luna-accent" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-serif text-3xl font-semibold text-luna-charcoal tracking-tight">Luna</h2>
                  <p className="text-luna-text-muted text-sm font-light tracking-wide mt-1">Votre Concierge Voyage</p>
                </div>

                <form onSubmit={handleStartAnalysis} className="flex flex-col gap-5">

                  {/* ── DEPARTURE CITY ── */}
                  <div>
                    <label className="input-label">Départ de</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ville de départ (ex: Paris)"
                        className="input-underline pr-8"
                        value={departureCity}
                        onChange={e => setDepartureCity(e.target.value)}
                      />
                      <Plane className="absolute right-0 top-3 w-4 h-4 text-luna-text-muted/40" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* ── DESTINATIONS (Multi) ── */}
                  <div>
                    <label className="input-label flex items-center justify-between">
                      <span>Destinations</span>
                      <button type="button" onClick={addDestination} className="text-luna-accent hover:text-luna-accent-dark transition-colors flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
                        <Plus size={12} /> Ajouter
                      </button>
                    </label>
                    <div className="flex flex-col gap-2">
                      {destinations.map((dest, idx) => (
                        <motion.div
                          key={dest.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative flex items-center gap-2"
                        >
                          {destinations.length > 1 && (
                            <span className="text-[10px] font-bold text-luna-accent w-5 text-center">{idx + 1}</span>
                          )}
                          <input
                            type="text"
                            placeholder={idx === 0 ? 'Où souhaitez-vous voyager ?' : `Destination ${idx + 1}`}
                            className="input-underline flex-1 pr-8"
                            value={dest.city}
                            onChange={e => updateDestination(dest.id, e.target.value)}
                            required={idx === 0}
                          />
                          {destinations.length > 1 && (
                            <button type="button" onClick={() => removeDestination(dest.id)} className="absolute right-0 top-3 text-luna-text-muted/40 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                          {idx === 0 && destinations.length === 1 && (
                            <MapPin className="absolute right-0 top-3 w-4 h-4 text-luna-text-muted/40" strokeWidth={1.5} />
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {/* Route summary */}
                    {(departureCity.trim() || destinations.filter(d => d.city.trim()).length > 1) && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {departureCity.trim() && (
                          <span className="flex items-center text-[10px] font-semibold text-luna-charcoal">
                            <Plane size={10} className="mr-0.5" />{departureCity}
                          </span>
                        )}
                        {destinations.filter(d => d.city.trim()).map((d, i) => (
                          <span key={d.id} className="flex items-center text-[10px] font-semibold text-luna-accent-dark">
                            <ArrowRight size={10} className="mx-1 text-luna-warm-gray" />
                            {d.city}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── DEPARTURE + RETURN ── */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="input-label">Départ</label>
                      <input type="date" className="input-underline [color-scheme:light]" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">Retour</label>
                      <input type="date" className="input-underline [color-scheme:light]" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                    </div>
                  </div>

                  {/* Flexibility */}
                  <div>
                    <label className="input-label">Flexibilité</label>
                    <div className="flex gap-2 mt-1">
                      {['Dates Exactes', '+/- 3 Jours', 'Mois Flexible'].map(opt => (
                        <button key={opt} type="button" onClick={() => setFlexibility(opt)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border transition-all ${flexibility === opt
                            ? 'bg-luna-charcoal text-luna-cream border-luna-charcoal'
                            : 'bg-transparent text-luna-text-muted border-luna-warm-gray/40 hover:border-luna-accent'
                            }`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>

                  {/* Budget + Pax */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="input-label">Budget</label>
                      <input type="text" placeholder="ex: 10 000 €" className="input-underline" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">Voyageurs</label>
                      <input type="text" placeholder="2 adultes" className="input-underline" value={pax} onChange={e => setPax(e.target.value)} />
                    </div>
                  </div>

                  {/* Vibe */}
                  <div>
                    <label className="input-label">Expérience souhaitée</label>
                    <select className="input-underline appearance-none cursor-pointer bg-transparent" value={vibe} onChange={e => setVibe(e.target.value)}>
                      <option value="" disabled>Sélectionnez une ambiance</option>
                      <option>Détente & Bien-être</option>
                      <option>Aventure & Découverte</option>
                      <option>Culture & Patrimoine</option>
                      <option>Lune de Miel</option>
                      <option>Voyage d'Affaires</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="input-label">Notes particulières</label>
                    <textarea placeholder="Vol direct, vue mer, transferts privés..." className="input-underline resize-none h-16 leading-relaxed" value={mustHaves} onChange={e => setMustHaves(e.target.value)} />
                  </div>

                  {/* CTA */}
                  <button type="submit" className="mt-3 w-full py-4 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-[0.15em] uppercase rounded-xl shadow-luxury transition-all hover:shadow-2xl active:scale-[0.98] flex justify-center items-center gap-3 group">
                    <span>Créer le Voyage</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ═══ PROCESSING: LUNA ORB ═══ */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="relative rounded-full bg-luna-cream/95 shadow-luxury p-2 flex-center flex-col w-52 h-52 border border-luna-warm-gray/30 backdrop-blur-xl cursor-pointer"
              >
                {/* Outer ring animations */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-luna-accent/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-[-8px] rounded-full border border-luna-accent/10"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />

                {/* Spinner */}
                {(workflowState === 'ANALYSING' || workflowState === 'AGENTS_WORKING') && (
                  <motion.div
                    className="absolute inset-1 rounded-full border-[2.5px] border-t-luna-accent border-r-transparent border-b-luna-accent-dark border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                {workflowState === 'GENERATING_PROPOSALS' && (
                  <motion.div
                    className="absolute inset-1 rounded-full border-[2.5px] border-t-emerald-500 border-r-transparent border-b-emerald-300 border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                <div className={`mb-2 p-4 rounded-full bg-luna-charcoal/5 text-luna-accent ${workflowState === 'DISTRIBUTING' || workflowState === 'GENERATING_PROPOSALS' ? 'animate-pulse' : ''}`}>
                  <Compass className="w-12 h-12" strokeWidth={1.2} />
                </div>
                <h3 className="font-serif text-lg font-semibold text-luna-charcoal">Luna</h3>
                <p className="text-[8px] text-luna-accent-dark font-bold uppercase tracking-[0.2em] mt-1.5 bg-luna-accent/10 border border-luna-accent/20 px-3 py-1 rounded-full">
                  {workflowState === 'ANALYSING' && 'Analyse en cours'}
                  {workflowState === 'DISTRIBUTING' && 'Distribution'}
                  {workflowState === 'AGENTS_WORKING' && 'Recherche active'}
                  {workflowState === 'VALIDATION' && `Validation ${validatedAgents.length}/4`}
                  {workflowState === 'GENERATING_PROPOSALS' && 'Finalisation'}
                </p>
              </motion.div>
            )}

            {/* ═══ PROPOSALS READY ═══ */}
            {workflowState === 'PROPOSALS_READY' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card w-[540px] max-h-[85vh] overflow-y-auto p-10 shadow-luxury border-2 border-white"
              >
                <div className="flex items-center gap-3 mb-8 justify-center">
                  <div className="bg-emerald-50 p-3 rounded-full"><CheckCircle2 size={28} className="text-emerald-600" /></div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-luna-charcoal">Voyage Prêt</h2>
                    <p className="text-luna-text-muted text-xs font-medium">Validé par vos 4 agents spécialistes</p>
                  </div>
                </div>

                {/* Route summary */}
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  {destinations.filter(d => d.city.trim()).map((d, i) => (
                    <span key={d.id} className="flex items-center text-sm font-semibold text-luna-charcoal">
                      {i > 0 && <ArrowRight size={14} className="mx-2 text-luna-accent" />}
                      <MapPin size={12} className="mr-1 text-luna-accent" />{d.city}
                    </span>
                  ))}
                </div>

                {/* Proposal Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { name: 'Premium Luxe', desc: agentResults?.accommodation?.hotels?.[0]?.name || 'Hôtel 5★', price: agentResults?.accommodation?.hotels?.[0]?.pricePerNight || '890 €/nuit' },
                    { name: 'Vol Recommandé', desc: agentResults?.transport?.flights?.[0]?.airline || 'Air France', price: agentResults?.transport?.flights?.[0]?.price || '3 200 €' },
                    { name: 'Itinéraire', desc: `${agentResults?.itinerary?.days?.length || 3} jours planifiés`, price: 'Inclus' },
                    { name: 'Profil Client', desc: agentResults?.client?.profile?.segment || 'Premium', price: 'Analysé' },
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-luna-cream p-5 rounded-2xl border border-luna-warm-gray/20 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <h4 className="font-semibold text-luna-charcoal text-sm group-hover:text-luna-accent-dark transition-colors">{p.name}</h4>
                      <p className="text-xs text-luna-text-muted mt-1">{p.desc}</p>
                      <span className="text-luna-accent-dark font-bold text-lg mt-2 block font-serif">{p.price}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={resetWorkflow} className="flex-1 py-3.5 bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium text-sm rounded-xl transition-all">Nouveau Voyage</button>
                  <button className="flex-[2] py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-wider uppercase rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg">
                    Exporter vers CRM <Send size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ SATELLITE AGENT NODES ═══ */}
        <AnimatePresence>
          {isProcessing && (['transport', 'accommodation', 'client', 'itinerary'] as AgentKey[]).map((agentKey, i) => {
            const meta = agentMeta[agentKey];
            const Icon = meta.icon;
            const isActive = activeAgents.includes(agentKey);
            const isValidated = validatedAgents.includes(agentKey);
            const canValidate = workflowState === 'VALIDATION' && !isValidated && agentResults;

            // Position: top, left, right, bottom
            const positionMap = [
              { top: '14%', left: '50%' },
              { top: '50%', left: '14%' },
              { top: '50%', left: '86%' },
              { top: '82%', left: '50%' },
            ];
            const pos = positionMap[i];

            return (
              <motion.div
                key={agentKey}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.3 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: isActive ? 0 : i * 0.15 }}
                className="absolute z-20 pointer-events-auto"
                style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                onClick={() => canValidate && setSelectedAgent(agentKey)}
              >
                <motion.div
                  whileHover={canValidate ? { scale: 1.05 } : {}}
                  className={`rounded-2xl p-4 flex items-center gap-3.5 border w-56 transition-all relative overflow-hidden ${isValidated
                    ? 'border-emerald-400/40 bg-white/95 backdrop-blur-xl shadow-md'
                    : canValidate
                      ? 'border-luna-accent/50 bg-white/95 backdrop-blur-xl shadow-lg cursor-pointer ring-1 ring-luna-accent/20'
                      : 'border-luna-warm-gray/30 bg-luna-cream/95 backdrop-blur-xl shadow-md'
                    }`}
                >
                  {isValidated && <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none rounded-2xl" />}

                  <div className={`p-2.5 rounded-xl flex-shrink-0 relative z-10 transition-colors ${isValidated ? 'bg-emerald-500 text-white' : canValidate ? 'bg-luna-accent/15 text-luna-accent-dark' : 'bg-luna-charcoal/5 text-luna-text-muted'
                    }`}>
                    {isValidated ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>
                  <div className="flex flex-col relative z-10">
                    <h3 className="font-semibold text-[11px] uppercase tracking-wider text-luna-charcoal">{meta.title}</h3>
                    <p className={`text-[9px] font-semibold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full w-max ${isValidated ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : canValidate ? 'text-luna-accent-dark bg-luna-accent/10 border border-luna-accent/20' : 'text-luna-text-muted bg-luna-charcoal/5'
                      }`}>
                      {isValidated ? 'Validé ✓' : canValidate ? 'Résultats prêts' : 'Recherche...'}
                    </p>
                  </div>

                  {/* Notification ping */}
                  {canValidate && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luna-accent opacity-50" />
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-luna-accent text-white font-bold text-[10px] justify-center items-center shadow-sm">!</span>
                    </span>
                  )}

                  {/* Working spinner */}
                  {!isValidated && !canValidate && isActive && (
                    <Loader2 size={14} className="absolute top-2 right-2 text-luna-accent animate-spin" />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ═══ AGENT VALIDATION MODAL ═══ */}
      <AnimatePresence>
        {selectedAgent && agentResults && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luna-charcoal/40 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl border border-luna-warm-gray/20 p-8 max-w-2xl w-full shadow-luxury max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const meta = agentMeta[selectedAgent];
                const Icon = meta.icon;
                const data = agentResults[selectedAgent];
                const summary = data?.summary || 'Données disponibles';

                return (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100"><Icon size={24} /></div>
                      <div className="flex-1">
                        <h2 className="font-serif text-xl font-semibold text-luna-charcoal">{meta.title}</h2>
                        <p className="text-luna-text-muted text-xs uppercase tracking-wider font-medium">Résultats de recherche</p>
                      </div>
                      <button onClick={() => setSelectedAgent(null)} className="p-2 text-luna-text-muted hover:text-luna-charcoal hover:bg-luna-cream rounded-xl transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="bg-luna-cream/60 p-5 rounded-2xl border border-luna-warm-gray/15 mb-6">
                      <p className="text-luna-charcoal font-normal leading-relaxed text-sm">{summary}</p>
                    </div>

                    {/* Transport: Flights (show all, with clickable search links) */}
                    {selectedAgent === 'transport' && data?.flights?.length > 0 && (
                      <div className="space-y-2.5 mb-6">
                        <div className="flex justify-between items-center">
                          <h4 className="input-label">Options de vol ({data.flights.length})</h4>
                        </div>
                        {data.flights.map((f: any, i: number) => (
                          <a key={i} href={`https://www.google.com/travel/flights?q=${encodeURIComponent((f.route || f.airline || '') + ' ' + (departureDate || ''))}`} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-luna-warm-gray/15 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-sky-50 flex items-center justify-center text-[10px] font-bold text-sky-600">{i + 1}</span>
                                <span className="font-semibold text-sm text-luna-charcoal group-hover:text-sky-600 transition-colors">{f.airline} — {f.class}</span>
                              </div>
                              <span className="font-serif font-bold text-luna-accent-dark">{f.price}</span>
                            </div>
                            <p className="text-xs text-luna-text-muted mt-1.5 ml-8">{f.route} • {f.duration} • {f.stops} escale(s)</p>
                            <p className="text-[10px] text-sky-500 mt-1.5 ml-8 font-medium group-hover:underline">Voir sur Google Flights →</p>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Accommodation: Hotels (show all, with clickable links) */}
                    {selectedAgent === 'accommodation' && data?.hotels?.length > 0 && (
                      <div className="space-y-2.5 mb-6">
                        <h4 className="input-label">Hôtels sélectionnés ({data.hotels.length})</h4>
                        {data.hotels.map((h: any, i: number) => (
                          <a key={i} href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(h.name + ' ' + (destinations[0]?.city || ''))}`} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-luna-warm-gray/15 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600">{i + 1}</span>
                                <span className="font-semibold text-sm text-luna-charcoal group-hover:text-sky-600 transition-colors">{h.name}</span>
                              </div>
                              <span className="font-serif font-bold text-luna-accent-dark">{h.pricePerNight}/nuit</span>
                            </div>
                            <p className="text-xs text-luna-text-muted mt-1.5 ml-8">{'★'.repeat(h.stars || 5)} • {h.highlights?.join(', ')}</p>
                            <p className="text-[10px] text-sky-500 mt-1.5 ml-8 font-medium group-hover:underline">Voir sur Google Hotels →</p>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Itinerary: Days (show all) */}
                    {selectedAgent === 'itinerary' && data?.days?.length > 0 && (
                      <div className="space-y-2.5 mb-6">
                        <h4 className="input-label">Planning jour par jour ({data.days.length} jours)</h4>
                        {data.days.map((d: any, i: number) => (
                          <div key={i} className="bg-white p-4 rounded-xl border border-luna-warm-gray/15">
                            <h5 className="font-semibold text-sm text-luna-charcoal flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-600">J{d.day}</span>
                              {d.title}
                            </h5>
                            <div className="text-xs text-luna-text-muted mt-2 ml-8 space-y-1">
                              <p>🌅 {d.morning}</p>
                              <p>🌤️ {d.afternoon}</p>
                              <p>🌙 {d.evening}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Client: Recommendations (show all) */}
                    {selectedAgent === 'client' && data?.recommendations?.length > 0 && (
                      <div className="space-y-2 mb-6">
                        <h4 className="input-label">Recommandations ({data.recommendations.length})</h4>
                        {data.recommendations.map((r: string, i: number) => (
                          <div key={i} className="bg-white p-3.5 rounded-xl border border-luna-warm-gray/15 text-sm text-luna-charcoal flex items-start gap-2.5">
                            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" /> {r}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md pt-4 -mx-2 px-2">
                      <button onClick={() => setSelectedAgent(null)} className="flex-1 py-3.5 bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium text-sm rounded-xl transition-all">Plus tard</button>
                      <button onClick={handleValidateAgent} className="flex-[2] py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-wider uppercase rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg">
                        Valider <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
