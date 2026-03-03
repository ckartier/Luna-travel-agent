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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'DISTRIBUTING' | 'AGENTS_WORKING' | 'VALIDATION' | 'GENERATING_PROPOSALS' | 'PROPOSALS_READY';

// Mock data for validations
const agentsData = {
  'agent-transport': {
    title: 'Transport',
    data: 'Billet Air France direct (CDG -> MRU) validé. Options Business Class incluses.',
    icon: <Plane size={24} />,
    links: [{ name: 'Voir sur AirFrance.fr', url: 'https://www.airfrance.fr' }, { name: 'Comparer Skyscanner', url: 'https://www.skyscanner.fr' }]
  },
  'agent-accommodation': {
    title: 'Hébergement',
    data: '2 suggestions d\'hôtels 5 étoiles (One&Only Le Saint Géran, Lux* Grand Gaube) avec vue mer.',
    icon: <Hotel size={24} />,
    links: [{ name: 'One&Only sur Booking.com', url: 'https://www.booking.com' }, { name: 'Site Officiel Lux*', url: 'https://www.luxresorts.com' }]
  },
  'agent-customer': {
    title: 'Profil Client',
    data: 'Client VIP. Préférences : Côté hublot, lit King Size, transferts privés. Budget illimité.',
    icon: <Users size={24} />,
    links: [{ name: 'Ouvrir Profil CRM', url: '/crm/contacts/1' }]
  },
  'agent-itinerary': {
    title: 'Itinéraire',
    data: 'Planning de 7 jours incluant croisière catamaran et guide privé pour excursion locale.',
    icon: <CalendarRange size={24} />,
    links: [{ name: 'Activité Croisière (GetYourGuide)', url: 'https://www.getyourguide.fr' }]
  },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');

  const [requestData, setRequestData] = useState({
    destination: '',
    dates: '',
    budget: '',
    pax: '',
    vibe: '',
    flexibility: 'Dates Exactes',
    mustHaves: ''
  });
  const [validatedAgents, setValidatedAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<keyof typeof agentsData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Orchestration Timer Logic
  useEffect(() => {
    if (workflowState === 'ANALYSING') {
      const t = setTimeout(() => setWorkflowState('DISTRIBUTING'), 2000);
      return () => clearTimeout(t);
    }
    if (workflowState === 'DISTRIBUTING') {
      const t = setTimeout(() => setWorkflowState('AGENTS_WORKING'), 2000);
      return () => clearTimeout(t);
    }
    if (workflowState === 'AGENTS_WORKING') {
      const t = setTimeout(() => setWorkflowState('VALIDATION'), 3000);
      return () => clearTimeout(t);
    }
    if (workflowState === 'VALIDATION' && validatedAgents.length === 4) {
      const t = setTimeout(() => setWorkflowState('GENERATING_PROPOSALS'), 1000);
      return () => clearTimeout(t);
    }
    if (workflowState === 'GENERATING_PROPOSALS') {
      const t = setTimeout(() => setWorkflowState('PROPOSALS_READY'), 3000);
      return () => clearTimeout(t);
    }
  }, [workflowState, validatedAgents]);

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.destination) return;
    setWorkflowState('ANALYSING');
  };

  const handleValidateAgent = () => {
    if (selectedAgent && !validatedAgents.includes(selectedAgent)) {
      setValidatedAgents(prev => [...prev, selectedAgent]);
    }
    setSelectedAgent(null);
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#e8e2da]/60">
      <MapBackground />

      {/* Subtle warm overlay */}
      <div className="absolute inset-0 bg-[#f5f0eb]/30 pointer-events-none z-10" />

      {/* CRM Quick Access */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <Link
          href="/crm"
          className="glass-pill px-4 py-2 flex items-center gap-2 text-luna-text-muted hover:text-luna-charcoal font-medium transition-all text-sm shadow-sm hover:shadow-md"
        >
          <LayoutDashboard size={15} />
          CRM
        </Link>
      </div>

      {/* Weather Widget */}
      <div className="absolute top-28 right-6 z-40 w-[280px]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WeatherWidget destination={requestData.destination.trim() ? requestData.destination : 'Paris'} />
        </motion.div>
      </div>

      {/* Main Content Canvas */}
      <div className="flex-1 relative w-full h-full">

        {/* SVG Flow Lines (only during orchestration) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <AnimatedPath d="M 50% 25% Q 50% 40%, 50% 50%" state={workflowState} />
            <AnimatedPath d="M 25% 45% Q 40% 45%, 50% 50%" state={workflowState} />
            <AnimatedPath d="M 75% 45% Q 60% 45%, 50% 50%" state={workflowState} />
            <AnimatedPath d="M 30% 70% Q 40% 60%, 50% 50%" state={workflowState} />
          </g>

          {(workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY') && (
            <>
              <circle cx="50%" cy="25%" r="3" fill="#b8956a" stroke="#fff" strokeWidth="2" />
              <circle cx="25%" cy="45%" r="3" fill="#b8956a" stroke="#fff" strokeWidth="2" />
              <circle cx="75%" cy="45%" r="3" fill="#b8956a" stroke="#fff" strokeWidth="2" />
              <circle cx="30%" cy="70%" r="3" fill="#b8956a" stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>

        {/* Central Content */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <AnimatePresence mode="wait">

            {/* ===== IDLE STATE: Luxury Concierge Form ===== */}
            {workflowState === 'IDLE' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="glass-card w-[440px] p-10 shadow-luxury relative overflow-hidden"
              >
                {/* Subtle warm gradient shine */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-luna-accent/10 rounded-full blur-[60px] pointer-events-none"></div>

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-14 h-14 rounded-full bg-luna-charcoal flex-center mb-4 shadow-lg">
                    <Compass className="w-7 h-7 text-luna-accent" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-serif text-3xl font-semibold text-luna-charcoal tracking-tight">Luna</h2>
                  <p className="text-luna-text-muted text-sm font-light tracking-wide mt-1">Votre Concierge Voyage</p>
                </div>

                <form onSubmit={handleStartAnalysis} className="flex flex-col gap-5">
                  {/* Destination */}
                  <div>
                    <label className="input-label">Destination</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Où souhaitez-vous voyager ?"
                        className="input-underline pr-8"
                        value={requestData.destination}
                        onChange={e => setRequestData({ ...requestData, destination: e.target.value })}
                        required
                      />
                      <MapPin className="absolute right-0 top-3 w-4 h-4 text-luna-text-muted/40" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Date + Flexibility */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="input-label">Date</label>
                      <input
                        type="date"
                        className="input-underline [color-scheme:light]"
                        value={requestData.dates}
                        onChange={e => setRequestData({ ...requestData, dates: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">Flexibilité</label>
                      <select
                        className="input-underline appearance-none cursor-pointer bg-transparent"
                        value={requestData.flexibility}
                        onChange={e => setRequestData({ ...requestData, flexibility: e.target.value })}
                      >
                        <option>Dates Exactes</option>
                        <option>+/- 3 Jours</option>
                        <option>Mois Flexible</option>
                      </select>
                    </div>
                  </div>

                  {/* Budget + Travelers */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="input-label">Budget</label>
                      <input
                        type="text"
                        placeholder="ex: 10 000 €"
                        className="input-underline"
                        value={requestData.budget}
                        onChange={e => setRequestData({ ...requestData, budget: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">Voyageurs</label>
                      <input
                        type="text"
                        placeholder="2 adultes"
                        className="input-underline"
                        value={requestData.pax}
                        onChange={e => setRequestData({ ...requestData, pax: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="input-label">Expérience souhaitée</label>
                    <select
                      className="input-underline appearance-none cursor-pointer bg-transparent"
                      value={requestData.vibe}
                      onChange={e => setRequestData({ ...requestData, vibe: e.target.value })}
                    >
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
                    <textarea
                      placeholder="Vol direct, vue mer, transferts privés..."
                      className="input-underline resize-none h-16 leading-relaxed"
                      value={requestData.mustHaves}
                      onChange={e => setRequestData({ ...requestData, mustHaves: e.target.value })}
                    />
                  </div>

                  {/* CTA Button */}
                  <button
                    type="submit"
                    className="mt-3 w-full py-4 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-[0.15em] uppercase rounded-xl shadow-luxury transition-all hover:shadow-2xl active:scale-[0.98] flex justify-center items-center gap-3 group"
                  >
                    <span>Créer le Voyage</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ===== PROCESSING STATES: Luna Orb ===== */}
            {(workflowState === 'ANALYSING' || workflowState === 'DISTRIBUTING' || workflowState === 'AGENTS_WORKING' || workflowState === 'VALIDATION' || workflowState === 'GENERATING_PROPOSALS') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative cursor-pointer rounded-full bg-luna-cream/95 shadow-luxury p-2 flex items-center justify-center flex-col w-56 h-56 border border-luna-warm-gray/30 backdrop-blur-xl"
              >
                <div className="absolute inset-0 rounded-full border border-luna-accent/20"></div>
                <div className="absolute inset-2 rounded-full border border-luna-accent/10"></div>

                {workflowState === 'ANALYSING' && <div className="absolute inset-0 rounded-full border-[3px] border-t-luna-accent border-r-transparent border-b-luna-accent-dark border-l-transparent animate-spin opacity-60"></div>}
                {workflowState === 'GENERATING_PROPOSALS' && <div className="absolute inset-0 rounded-full border-[3px] border-t-emerald-500 border-r-transparent border-b-emerald-300 border-l-transparent animate-[spin_0.5s_linear_infinite] opacity-80"></div>}

                <div className={`mb-3 bg-luna-charcoal/5 p-5 rounded-full text-luna-accent ${workflowState === 'DISTRIBUTING' || workflowState === 'GENERATING_PROPOSALS' ? 'animate-pulse' : ''}`}>
                  <Compass className="w-14 h-14 drop-shadow-sm" strokeWidth={1.2} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-luna-charcoal tracking-tight">Luna</h3>
                <p className="text-[9px] text-luna-accent-dark font-semibold uppercase tracking-[0.2em] mt-2 text-center bg-luna-accent/10 border border-luna-accent/20 px-4 py-1.5 rounded-full">
                  {workflowState === 'ANALYSING' && 'Analyse en cours'}
                  {workflowState === 'DISTRIBUTING' && 'Distribution'}
                  {workflowState === 'AGENTS_WORKING' && 'Recherche active'}
                  {workflowState === 'VALIDATION' && 'Validation requise'}
                  {workflowState === 'GENERATING_PROPOSALS' && 'Création des devis'}
                </p>
              </motion.div>
            )}

            {/* ===== PROPOSALS READY ===== */}
            {workflowState === 'PROPOSALS_READY' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card w-[540px] p-10 shadow-luxury border-2 border-white"
              >
                <div className="flex items-center gap-3 mb-8 justify-center">
                  <div className="bg-emerald-50 p-3 rounded-full">
                    <CheckCircle2 size={28} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-luna-charcoal">4 Propositions</h2>
                    <p className="text-luna-text-muted text-xs font-medium">Validées par vos agents spécialistes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-luna-cream p-5 rounded-2xl border border-luna-warm-gray/20 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold text-luna-charcoal text-sm">Premium Luxe</h4>
                    <p className="text-xs text-luna-text-muted mt-1">Air France + One&Only</p>
                    <span className="text-luna-accent-dark font-bold text-xl mt-2 block font-serif">12 400 €</span>
                  </div>
                  <div className="bg-luna-cream p-5 rounded-2xl border border-luna-warm-gray/20 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold text-luna-charcoal text-sm">Value Plus</h4>
                    <p className="text-xs text-luna-text-muted mt-1">Emirates + Lux* Grand Gaube</p>
                    <span className="text-luna-accent-dark font-bold text-xl mt-2 block font-serif">9 800 €</span>
                  </div>
                  <div className="bg-luna-cream p-5 rounded-2xl border border-luna-warm-gray/20 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold text-luna-charcoal text-sm">Aventure</h4>
                    <p className="text-xs text-luna-text-muted mt-1">Hôtel Boutique + Excursions</p>
                    <span className="text-luna-accent-dark font-bold text-xl mt-2 block font-serif">10 100 €</span>
                  </div>
                  <div className="bg-luna-cream p-5 rounded-2xl border border-luna-warm-gray/20 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold text-luna-charcoal text-sm">Express</h4>
                    <p className="text-xs text-luna-text-muted mt-1">Départ demain matin</p>
                    <span className="text-luna-accent-dark font-bold text-xl mt-2 block font-serif">14 200 €</span>
                  </div>
                </div>
                <button onClick={() => setWorkflowState('IDLE')} className="w-full py-4 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-[0.15em] uppercase rounded-xl shadow-luxury transition-all flex justify-center items-center gap-2">
                  Exporter vers CRM <Send size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Distributed Sub-Agents */}
        <AnimatePresence>
          {(workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY') && (
            <>
              <WorkflowNode
                id="agent-transport" title="TRANSPORT" subtitle="Vols & Routings" icon={<Plane size={18} />} position={{ x: '50%', y: '15%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-transport')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-transport')}
              />
              <WorkflowNode
                id="agent-accommodation" title="HÉBERGEMENT" subtitle="Hôtels & Resorts" icon={<Hotel size={18} />} position={{ x: '15%', y: '45%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-accommodation')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-accommodation')}
              />
              <WorkflowNode
                id="agent-customer" title="PROFIL CLIENT" subtitle="CRM Analyse" icon={<Users size={18} />} position={{ x: '85%', y: '45%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-customer')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-customer')}
              />
              <WorkflowNode
                id="agent-itinerary" title="ITINÉRAIRE" subtitle="Activités & Planning" icon={<CalendarRange size={18} />} position={{ x: '30%', y: '80%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-itinerary')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-itinerary')}
              />
            </>
          )}
        </AnimatePresence>

      </div>

      {/* Agent Validation Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luna-charcoal/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="glass-card p-8 max-w-lg w-full shadow-luxury"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-luna-cream text-luna-accent-dark rounded-2xl border border-luna-warm-gray/20">{agentsData[selectedAgent].icon}</div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-luna-charcoal">{agentsData[selectedAgent].title}</h2>
                  <p className="text-luna-text-muted text-xs uppercase tracking-wider font-medium">Résultats de recherche</p>
                </div>
              </div>
              <div className="bg-luna-cream p-6 rounded-2xl border border-luna-warm-gray/20 mb-6">
                <p className="text-luna-charcoal font-normal leading-relaxed text-sm">
                  {agentsData[selectedAgent].data}
                </p>
              </div>

              <div className="mb-8">
                <h4 className="input-label mb-3">Sources & Détails</h4>
                <div className="flex flex-col gap-2">
                  {agentsData[selectedAgent].links?.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-luna-cream hover:bg-luna-accent/5 border border-luna-warm-gray/20 text-luna-charcoal transition-colors group"
                    >
                      <span className="font-medium text-sm">{link.name}</span>
                      <ArrowRight size={14} className="text-luna-text-muted group-hover:text-luna-accent group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedAgent(null)} className="flex-1 py-3.5 bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium text-sm rounded-xl transition-all">Plus tard</button>
                <button onClick={handleValidateAgent} className="flex-[2] py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-wider uppercase rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg">
                  Valider <CheckCircle2 size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// SVG Animation helper
function AnimatedPath({ d, state }: { d: string, state: WorkflowState }) {
  let animationClass = "opacity-0";

  if (state === 'DISTRIBUTING' || state === 'AGENTS_WORKING' || state === 'VALIDATION' || state === 'GENERATING_PROPOSALS') {
    animationClass = "opacity-30 stroke-luna-warm-gray";

    if (state === 'DISTRIBUTING') {
      animationClass = "opacity-60 stroke-luna-accent animate-[dash_2s_ease-out_forwards] drop-shadow-[0_0_8px_rgba(184,149,106,0.6)]";
    } else if (state === 'GENERATING_PROPOSALS') {
      animationClass = "opacity-60 stroke-emerald-500 animate-[dashReverse_2s_ease-out_forwards] drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]";
    } else if (state === 'VALIDATION') {
      animationClass = "opacity-25 stroke-luna-accent drop-shadow-[0_0_6px_rgba(184,149,106,0.3)]";
    }
  }

  return (
    <>
      <style>{`
        @keyframes dash {
          0% { stroke-dasharray: 200; stroke-dashoffset: 200; }
          100% { stroke-dasharray: 200; stroke-dashoffset: 0; }
        }
        @keyframes dashReverse {
          0% { stroke-dasharray: 200; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 200; stroke-dashoffset: 200; }
        }
      `}</style>
      <path d={d} strokeWidth="2.5" fill="none" className={`transition-all duration-1000 ${animationClass}`} strokeLinecap="round" />
    </>
  );
}

// Workflow Node with premium styling
function WorkflowNode({ id, title, subtitle, icon, position, state, isValidated, onClick }: any) {
  let mode = 'WORKING';
  if (state === 'VALIDATION' && !isValidated) mode = 'READY_TO_VALIDATE';
  if (isValidated) mode = 'VALIDATED';

  let borderClass = "border-luna-accent/30 shadow-md";
  let bgClass = "bg-luna-cream/95 backdrop-blur-xl hover:bg-white transition-all";
  let textClass = "text-luna-charcoal";
  let statusText = "Recherche en cours...";
  let statusColor = "text-luna-accent-dark bg-luna-accent/10 border border-luna-accent/20";
  let iconBg = "bg-luna-charcoal/5 text-luna-text-muted";

  if (mode === 'READY_TO_VALIDATE') {
    borderClass = "border-luna-accent/50 shadow-lg hover:shadow-xl";
    bgClass = "bg-white/95 backdrop-blur-xl cursor-pointer hover:scale-105 ring-1 ring-luna-accent/20";
    statusText = "Résultats prêts";
    statusColor = "text-luna-accent-dark bg-luna-accent/15 border border-luna-accent/25";
    iconBg = "bg-luna-accent/15 text-luna-accent-dark";
  } else if (mode === 'VALIDATED') {
    borderClass = "border-emerald-400/40 shadow-md";
    bgClass = "bg-white/95 backdrop-blur-xl relative overflow-hidden";
    textClass = "text-luna-charcoal";
    statusText = "Validé";
    statusColor = "text-emerald-600 bg-emerald-50 border border-emerald-200";
    iconBg = "bg-emerald-500 text-white shadow-sm";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`absolute z-20 pointer-events-auto transition-all ${mode === 'WORKING' && state !== 'DISTRIBUTING' ? 'animate-pulse' : ''}`}
      style={{ top: position.y, left: position.x, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`rounded-2xl p-4 flex items-center gap-3.5 border ${borderClass} ${bgClass} w-56`}>
        {mode === 'VALIDATED' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none rounded-2xl" />}

        <div className={`p-2.5 rounded-xl flex-shrink-0 relative z-10 transition-colors duration-500 ${iconBg}`}>
          {mode === 'VALIDATED' ? <CheckCircle2 size={20} /> : icon}
        </div>
        <div className="flex flex-col pr-2 relative z-10">
          <h3 className={`font-semibold text-[11px] uppercase tracking-wider ${textClass}`}>{title}</h3>
          <p className={`text-[9px] font-semibold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full w-max ${statusColor}`}>{statusText}</p>
        </div>

        {mode === 'READY_TO_VALIDATE' && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luna-accent opacity-50"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-luna-accent text-white font-bold text-[10px] justify-center items-center shadow-sm">!</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
