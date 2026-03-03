'use client';

import { MapBackground } from '@/app/components/map/MapBackground';
import { WeatherWidget } from '@/src/components/widgets/WeatherWidget';
import {
  Sparkles,
  Plane,
  Hotel,
  CalendarRange,
  Users,
  CheckCircle2,
  ArrowRight,
  Send,
  LayoutDashboard
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
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gray-500/50">
      <MapBackground />

      {/* Modern overlay for map visibility & readability */}
      <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[1px] pointer-events-none z-10" />

      {/* Compact Top Navigation Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20">
          <div className="text-white">
            <Plane size={16} className="-rotate-45" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">LUNA</span>
        </div>

        <Link
          href="/crm"
          className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 text-white font-medium hover:bg-white/20 transition-all group text-sm"
        >
          <LayoutDashboard size={16} />
          CRM
        </Link>
      </div>

      {/* Weather Widget Header Area (Toujours visible avec Paris par défaut si vide) */}
      <div className="absolute top-4 right-4 z-40 w-[300px]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <WeatherWidget destination={requestData.destination.trim() ? requestData.destination : 'Paris'} />
        </motion.div>
      </div>

      {/* Main Orchestration Node Canvas */}
      <div className="flex-1 relative w-full h-full">

        {/* SVG Connecting Lines Simulating N8N Flow */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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

          {/* Connection Anchors */}
          {(workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY') && (
            <>
              <circle cx="50%" cy="25%" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="25%" cy="45%" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="75%" cy="45%" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="30%" cy="70%" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>

        {/* Central LUNA Super Agent */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <AnimatePresence mode="wait">
            {workflowState === 'IDLE' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-900/80 backdrop-blur-2xl w-[420px] p-8 shadow-[0_0_80px_-15px_rgba(107,114,128,0.5)] rounded-3xl border border-white/10 relative overflow-hidden"
              >
                {/* Subtle animated background glow */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-gray-500/20 rounded-full blur-[50px] pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 justify-center text-blue-400 relative z-10">
                  <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Sparkles size={24} /></div>
                  <h2 className="text-2xl font-black text-white tracking-tight">LUNA Orchestrator</h2>
                </div>
                <p className="text-gray-400 text-sm text-center font-medium mb-8 relative z-10">Exprimez le désir de votre client. L'intelligence multi-agents s'occupe du reste.</p>

                <form onSubmit={handleStartAnalysis} className="flex flex-col gap-4 relative z-10">
                  <div className="space-y-4">
                    <input type="text" placeholder="Destination (ex: Île Maurice)" className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-white placeholder-gray-500 transition-all shadow-inner" value={requestData.destination} onChange={e => setRequestData({ ...requestData, destination: e.target.value })} required />

                    <div className="flex gap-3">
                      <div className="w-1/2 relative group">
                        <input type="date" className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-white transition-all shadow-inner appearance-none [color-scheme:dark]" value={requestData.dates} onChange={e => setRequestData({ ...requestData, dates: e.target.value })} />
                      </div>
                      <select className="w-1/2 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-gray-300 transition-all shadow-inner appearance-none cursor-pointer" value={requestData.flexibility} onChange={e => setRequestData({ ...requestData, flexibility: e.target.value })}>
                        <option className="bg-gray-800">Dates Exactes</option>
                        <option className="bg-gray-800">+/- 3 Jours</option>
                        <option className="bg-gray-800">Mois Flexible</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <input type="text" placeholder="Budget" className="w-1/2 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-white placeholder-gray-500 transition-all shadow-inner" value={requestData.budget} onChange={e => setRequestData({ ...requestData, budget: e.target.value })} />
                      <input type="text" placeholder="Passagers" className="w-1/2 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-white placeholder-gray-500 transition-all shadow-inner" value={requestData.pax} onChange={e => setRequestData({ ...requestData, pax: e.target.value })} />
                    </div>

                    <select className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-gray-300 transition-all shadow-inner appearance-none custom-select" value={requestData.vibe} onChange={e => setRequestData({ ...requestData, vibe: e.target.value })}>
                      <option value="" disabled className="bg-gray-800">Type de Vibe / Expérience</option>
                      <option className="bg-gray-800">Détente & Spa</option>
                      <option className="bg-gray-800">Aventure & Nature</option>
                      <option className="bg-gray-800">Culture & Histoire</option>
                      <option className="bg-gray-800">Lune de Miel</option>
                      <option className="bg-gray-800">Affaires / Bleisure</option>
                    </select>

                    <textarea
                      placeholder="Must-haves (ex: Vol direct uniquement, vue mer...)"
                      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:bg-white/10 font-bold text-white placeholder-gray-500 transition-all shadow-inner resize-none h-24"
                      value={requestData.mustHaves}
                      onChange={e => setRequestData({ ...requestData, mustHaves: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="mt-4 w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 hover:from-blue-500 hover:via-indigo-400 hover:to-purple-500 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_50px_rgba(79,70,229,0.8)] flex justify-center items-center gap-3">
                    Lancer l'Analyse IA <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {(workflowState === 'ANALYSING' || workflowState === 'DISTRIBUTING' || workflowState === 'AGENTS_WORKING' || workflowState === 'VALIDATION' || workflowState === 'GENERATING_PROPOSALS') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative cursor-pointer rounded-full bg-gray-900/90 shadow-[0_0_100px_rgba(59,130,246,0.5)] p-2 flex items-center justify-center flex-col w-56 h-56 border border-white/10 backdrop-blur-xl"
              >
                {/* Glowing ring borders */}
                <div className="absolute inset-0 rounded-full border border-blue-500/30"></div>
                <div className="absolute inset-2 rounded-full border border-indigo-500/20"></div>

                {workflowState === 'ANALYSING' && <div className="absolute inset-0 rounded-full border-[4px] border-t-blue-400 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin opacity-80 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>}
                {workflowState === 'GENERATING_PROPOSALS' && <div className="absolute inset-0 rounded-full border-[4px] border-t-emerald-400 border-r-transparent border-b-emerald-200 border-l-transparent animate-[spin_0.5s_linear_infinite] opacity-100 shadow-[0_0_30px_rgba(16,185,129,0.8)]"></div>}

                <div className={`mb-4 bg-blue-500/10 p-5 rounded-full text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] ${workflowState === 'DISTRIBUTING' || workflowState === 'GENERATING_PROPOSALS' ? 'animate-pulse' : ''}`}>
                  <Sparkles className="w-14 h-14 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" strokeWidth={1.5} />
                </div>
                <h3 className="font-black text-white tracking-widest text-2xl text-center leading-tight">LUNA</h3>
                <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest mt-2 text-center bg-blue-900/40 border border-blue-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  {workflowState === 'ANALYSING' && 'Analyse Initiale'}
                  {workflowState === 'DISTRIBUTING' && 'Dispatch n8n'}
                  {workflowState === 'AGENTS_WORKING' && 'Recherche Active'}
                  {workflowState === 'VALIDATION' && 'Attente Validation'}
                  {workflowState === 'GENERATING_PROPOSALS' && 'Création Devis'}
                </p>
              </motion.div>
            )}

            {workflowState === 'PROPOSALS_READY' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 backdrop-blur-xl w-[550px] p-8 shadow-[0_20px_80px_-15px_rgba(16,185,129,0.4)] rounded-3xl border-2 border-white"
              >
                <div className="flex items-center gap-3 mb-6 text-emerald-600 justify-center">
                  <div className="bg-emerald-100 p-3 rounded-full"><CheckCircle2 size={28} /></div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">4 Propositions Générées</h2>
                </div>
                <p className="text-gray-500 text-center font-medium mb-8">L'Orchestrateur Luna a consolidé les validations des agents en 4 devis complets et rédigé le brouillon CRM.</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-extrabold text-emerald-950">Option 1: Premium Luxe</h4>
                    <p className="text-xs text-emerald-700/80 font-bold mt-1">Air France + One&Only</p>
                    <span className="text-emerald-600 font-black text-xl mt-2 block">12 400 €</span>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-2xl cursor-pointer">
                    <h4 className="font-extrabold text-blue-950">Option 2: Value Plus</h4>
                    <p className="text-xs text-blue-700/80 font-bold mt-1">Emirates + Lux* Grand Gaube</p>
                    <span className="text-blue-600 font-black text-xl mt-2 block">9 800 €</span>
                  </div>
                  <div className="bg-purple-50/80 border border-purple-200 p-5 rounded-2xl cursor-pointer">
                    <h4 className="font-extrabold text-purple-950">Option 3: Aventure</h4>
                    <p className="text-xs text-purple-700/80 font-bold mt-1">Hôtel Boutique + Excursions</p>
                    <span className="text-purple-600 font-black text-xl mt-2 block">10 100 €</span>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl cursor-pointer">
                    <h4 className="font-extrabold text-amber-950">Option 4: Express</h4>
                    <p className="text-xs text-amber-700/80 font-bold mt-1">Départ demain matin</p>
                    <span className="text-amber-600 font-black text-xl mt-2 block">14 200 €</span>
                  </div>
                </div>
                <button onClick={() => setWorkflowState('IDLE')} className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black uppercase text-sm tracking-wider rounded-xl shadow-xl transition-transform hover:scale-105 active:scale-95 flex justify-center items-center gap-2">
                  Exporter vers CRM & Envoyer Devis <Send size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Distributed Sub-Agents (Hidden in IDLE and PROPOSALS_READY to focus UX) */}
        <AnimatePresence>
          {(workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY') && (
            <>
              {/* Top: Transport */}
              <WorkflowNode
                id="agent-transport" title="AGENT TRANSPORT" subtitle="Vols & Routings" icon={<Plane size={20} />} position={{ x: '50%', y: '15%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-transport')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-transport')}
              />

              {/* Left: Accommodation */}
              <WorkflowNode
                id="agent-accommodation" title="AGENT HOTELS" subtitle="Hébergements" icon={<Hotel size={20} />} position={{ x: '15%', y: '45%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-accommodation')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-accommodation')}
              />

              {/* Right: Customer */}
              <WorkflowNode
                id="agent-customer" title="AGENT PROFILING" subtitle="CRM Profiler" icon={<Users size={20} />} position={{ x: '85%', y: '45%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-customer')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-customer')}
              />

              {/* Bottom Left: Itinerary */}
              <WorkflowNode
                id="agent-itinerary" title="AGENT ITINÉRAIRE" subtitle="Activités & Agenda" icon={<CalendarRange size={20} />} position={{ x: '30%', y: '80%' }}
                state={workflowState} isValidated={validatedAgents.includes('agent-itinerary')} onClick={() => workflowState === 'VALIDATION' && setSelectedAgent('agent-itinerary')}
              />
            </>
          )}
        </AnimatePresence>

      </div>

      {/* Agent Validation Modal Overlay */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">{agentsData[selectedAgent].icon}</div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{agentsData[selectedAgent].title}</h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Résultats API & Scraping Web</p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6">
                <p className="text-gray-800 font-medium leading-relaxed text-sm">
                  {agentsData[selectedAgent].data}
                </p>
              </div>

              {/* Source Links */}
              <div className="mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Sources & Détails Web</h4>
                <div className="flex flex-col gap-2">
                  {agentsData[selectedAgent].links?.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 text-blue-700 transition-colors group"
                    >
                      <span className="font-semibold text-sm">{link.name}</span>
                      <ArrowRight size={16} className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setSelectedAgent(null)} className="flex-1 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all">Consulter plus tard</button>
                <button onClick={handleValidateAgent} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2">
                  Valider l'Agent pour Devis <CheckCircle2 size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper components for SVG animations
function AnimatedPath({ d, state }: { d: string, state: WorkflowState }) {
  let animationClass = "opacity-0"; // Hidden by default

  // Show lines during active connecting states
  if (state === 'DISTRIBUTING' || state === 'AGENTS_WORKING' || state === 'VALIDATION' || state === 'GENERATING_PROPOSALS') {
    animationClass = "opacity-40 stroke-gray-300";

    if (state === 'DISTRIBUTING') {
      animationClass = "opacity-80 stroke-blue-500 animate-[dash_2s_ease-out_forwards] drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]";
    } else if (state === 'GENERATING_PROPOSALS') {
      animationClass = "opacity-80 stroke-emerald-400 animate-[dashReverse_2s_ease-out_forwards] drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]";
    } else if (state === 'VALIDATION') {
      animationClass = "opacity-30 stroke-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";
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
      <path d={d} strokeWidth="3.5" fill="none" className={`transition-all duration-1000 ${animationClass}`} strokeLinecap="round" />
    </>
  );
}

function WorkflowNode({ id, title, subtitle, icon, position, state, isValidated, onClick }: any) {
  let mode = 'WORKING';
  if (state === 'VALIDATION' && !isValidated) mode = 'READY_TO_VALIDATE';
  if (isValidated) mode = 'VALIDATED';

  // Premium Dark UI for nodes
  let borderClass = "border-amber-500/40 shadow-[0_10px_30px_rgba(245,158,11,0.15)]";
  let bgClass = "bg-gray-900/85 backdrop-blur-xl hover:bg-gray-800 transition-all";
  let textClass = "text-white";
  let statusText = "En recherche web/API...";
  let statusColor = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
  let iconBg = "bg-white/5 text-gray-300 shadow-inner";

  if (mode === 'READY_TO_VALIDATE') {
    borderClass = "border-blue-500/60 shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_10px_60px_rgba(59,130,246,0.5)]";
    bgClass = "bg-gray-900/95 backdrop-blur-xl cursor-pointer hover:bg-gray-800 hover:scale-110 ring-2 ring-blue-500/20";
    statusText = "Résultats Prêts !";
    statusColor = "text-blue-300 bg-blue-500/20 border border-blue-500/30";
    iconBg = "bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
  } else if (mode === 'VALIDATED') {
    borderClass = "border-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.2)]";
    bgClass = "bg-gray-900/85 backdrop-blur-xl relative overflow-hidden";
    textClass = "text-emerald-50";
    statusText = "Validé pour Devis";
    statusColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
    iconBg = "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]";
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
      <div className={`rounded-[2rem] p-4 flex items-center gap-4 border ${borderClass} ${bgClass} w-64`}>
        {mode === 'VALIDATED' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />}

        <div className={`p-3 rounded-[1.2rem] flex-shrink-0 relative z-10 transition-colors duration-500 ${iconBg}`}>
          {mode === 'VALIDATED' ? <CheckCircle2 size={24} /> : icon}
        </div>
        <div className="flex flex-col pr-2 relative z-10">
          <h3 className={`font-black text-[11px] uppercase tracking-widest ${textClass}`}>{title}</h3>
          <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2.5 py-1 rounded-full w-max ${statusColor}`}>{statusText}</p>
        </div>

        {/* Notification Badge */}
        {mode === 'READY_TO_VALIDATE' && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-600 text-white font-bold text-xs justify-center items-center shadow-md">!</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
