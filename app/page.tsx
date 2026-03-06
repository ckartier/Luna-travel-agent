'use client';


import { CapsuleBackground } from '@/app/components/CapsuleBackground';
import { WeatherWidget } from '@/src/components/widgets/WeatherWidget';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Plane,
  Hotel,
  CalendarRange,
  Users,
  CheckCircle2,
  ArrowRight,
  Send,
  MapPin,
  Plus,
  X,
  Loader2,
  Sparkles,
  Radio
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, createContact } from '@/src/lib/firebase/crm';
import { LunaLogo } from '@/app/components/LunaLogo';
import { PdfExport } from '@/app/components/PdfExport';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'DISTRIBUTING' | 'AGENTS_WORKING' | 'VALIDATION' | 'GENERATING_PROPOSALS' | 'PROPOSALS_READY';

const agentMeta = {
  transport: { title: 'Transport', subtitle: 'Vols & Routings', desc: 'Recherche des meilleurs vols directs et avec escales, analyse tarifaire multi-compagnies', icon: Radio, angle: -90, color: '#fb923c', gradient: 'from-orange-400 to-orange-300', pastelBg: 'bg-orange-50', pastelText: 'text-black', pastelBorder: 'border-orange-100', pastelRing: 'ring-orange-200' },
  accommodation: { title: 'Hébergement', subtitle: 'Hôtels & Resorts', desc: 'Sélection premium des établissements, vérification disponibilités et tarifs négociés', icon: Hotel, angle: 180, color: '#fb923c', gradient: 'from-orange-400 to-orange-300', pastelBg: 'bg-orange-50', pastelText: 'text-black', pastelBorder: 'border-orange-100', pastelRing: 'ring-orange-200' },
  client: { title: 'Profil Client', subtitle: 'CRM Analyse', desc: 'Analyse du profil voyageur, préférences historiques et recommandations personnalisées', icon: Users, angle: 0, color: '#fb923c', gradient: 'from-orange-400 to-orange-300', pastelBg: 'bg-orange-50', pastelText: 'text-black', pastelBorder: 'border-orange-100', pastelRing: 'ring-orange-200' },
  itinerary: { title: 'Itinéraire', subtitle: 'Planning Jour/Jour', desc: 'Construction de l\'itinéraire optimisé, activités et transferts coordonnés', icon: CalendarRange, angle: 90, color: '#fb923c', gradient: 'from-orange-400 to-orange-300', pastelBg: 'bg-orange-50', pastelText: 'text-black', pastelBorder: 'border-orange-100', pastelRing: 'ring-orange-200' },
};

type AgentKey = keyof typeof agentMeta;

interface Destination {
  id: string;
  city: string;
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luna-bg" />}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
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
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const { user, userProfile, tenantId } = useAuth();
  const userPhotoURL = userProfile?.photoURL || user?.photoURL || null;
  const userDisplayName = userProfile?.displayName || user?.displayName || '';

  // Autocomplete
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; country: string }[]>([]);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = (query: string, inputId: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); return; }
    setActiveInputId(inputId);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=place&limit=5&language=fr&access_token=${token}`
        );
        const data = await res.json();
        const results = (data.features || []).map((f: any) => ({
          id: f.id,
          name: f.text,
          country: f.context?.find((c: any) => c.id.startsWith('country'))?.text || f.place_name?.split(',').pop()?.trim() || '',
        }));
        setSuggestions(results);
      } catch { setSuggestions([]); }
    }, 250);
  };

  useEffect(() => { setMounted(true); }, []);

  // Auto-fill from CRM email dispatch (URL params)
  const searchParams = useSearchParams();
  useEffect(() => {
    const autoStart = searchParams.get('autoStart');
    if (autoStart === 'true' && workflowState === 'IDLE') {
      const dest = searchParams.get('dest');
      const from = searchParams.get('from');
      const dep = searchParams.get('dep');
      const ret = searchParams.get('ret');
      const b = searchParams.get('budget');
      const p = searchParams.get('pax');
      const v = searchParams.get('vibe');
      const n = searchParams.get('notes');

      if (dest) setDestinations([{ id: '1', city: dest }]);
      if (from) setDepartureCity(from);
      if (dep) setDepartureDate(dep);
      if (ret) setReturnDate(ret);
      if (b) setBudget(b);
      if (p) setPax(p);
      if (v) setVibe(v);
      if (n) setMustHaves(n);

      // Auto-start analysis after a short delay
      setTimeout(() => {
        setValidatedAgents([]);
        setActiveAgents([]);
        setAgentResults(null);
        setWorkflowState('ANALYSING');
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      const res = await fetchWithAuth('/api/agents', {
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

      // ── Persist search event to localStorage for analytics ──
      try {
        const history = JSON.parse(localStorage.getItem('luna_search_history') || '[]');
        history.push({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          destination: destinations[0]?.city || '',
          destinations: destinations.filter(d => d.city.trim()).map(d => d.city),
          budget, pax, vibe,
          flightsCount: data?.transport?.flights?.length || 0,
          hotelsCount: data?.accommodation?.hotels?.length || 0,
          daysCount: data?.itinerary?.days?.length || 0,
        });
        localStorage.setItem('luna_search_history', JSON.stringify(history.slice(-100)));
      } catch { /* silent */ }
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

  const handleExportToCRM = async () => {
    setIsExporting(true);
    try {
      // Gather links from agent results
      const links: { title: string; url: string }[] = [];
      if (agentResults?.transport?.flights) {
        agentResults.transport.flights.forEach((f: any) => {
          if (f.url) links.push({ title: `${f.airline} - ${f.route}`, url: f.url });
        });
      }
      if (agentResults?.accommodation?.hotels) {
        agentResults.accommodation.hotels.forEach((h: any) => {
          if (h.url) links.push({ title: `${h.name}`, url: h.url });
        });
      }

      // Create contact first
      const clientName = searchParams?.get('clientName') || 'Nouveau Client';
      const clientEmail = searchParams?.get('clientEmail') || '';
      let contactId: string | undefined;
      try {
        contactId = await createContact(tenantId!, {
          firstName: clientName.split(' ')[0] || 'Nouveau',
          lastName: clientName.split(' ').slice(1).join(' ') || 'Client',
          email: clientEmail || `client-${Date.now()}@luna.travel`,
          vipLevel: 'Premium',
          preferences: [vibe || 'Luxe', ...destinations.filter(d => d.city.trim()).map(d => d.city)],
        });
      } catch (e) {
        // Contact creation skipped
      }

      // Create lead linked to contact
      const leadId = await createLead(tenantId!, {
        clientName,
        clientId: contactId,
        destination: destinations.filter(d => d.city.trim()).map(d => d.city).join(', '),
        dates: `${departureDate || 'TBD'} - ${returnDate || 'TBD'}`,
        budget: budget || 'Non communiqué',
        pax: pax || 'Non précisé',
        days: agentResults?.itinerary?.days?.length || 7,
        vibe: vibe || 'Non spécifié',
        flexibility: flexibility || 'Non spécifiée',
        mustHaves: mustHaves || 'Aucun',
        links: links.length > 0 ? links : undefined,
        status: 'PROPOSAL_READY',
      });
      router.push('/crm/pipeline');
    } catch (error: any) {
      console.error('Erreur CRM:', error);
      alert(`Erreur CRM: ${error?.message || 'Connexion Firebase échouée. Vérifiez votre réseau.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  const isProcessing = workflowState !== 'IDLE' && workflowState !== 'PROPOSALS_READY';

  return (
    <div ref={containerRef} className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Background — Capsule anim: blue idle, cream during processing */}
      <div className="absolute inset-0 z-0">
        <CapsuleBackground colorScheme={isProcessing ? 'cream' : 'blue'} />
      </div>

      {/* Weather Widgets (real API) */}
      <div className="absolute top-16 right-3 md:top-20 md:right-5 z-40 w-[220px] md:w-[260px] hidden md:block">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WeatherWidget destinations={[
            ...(departureCity.trim() ? [departureCity.trim()] : []),
            ...destinations.filter(d => d.city.trim()).map(d => d.city.trim()),
          ].filter(Boolean)} />
        </motion.div>
      </div>



      {/* ═══ PROCESSING: HORIZONTAL AGENT LINE — Apple/OpenAI Style ═══ */}
      {isProcessing && (
        <>
          <style>{`
            @keyframes agentFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            @keyframes superFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
          `}</style>

          {/* Individual wire paths from each agent to Super Agent — 1px animated */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Wire segments: each agent connects to Super Agent (center) */}
            {[
              { id: 'w1', d: 'M 10 50 L 50 50' },
              { id: 'w2', d: 'M 27.5 50 L 50 50' },
              { id: 'w3', d: 'M 50 50 L 72.5 50' },
              { id: 'w4', d: 'M 50 50 L 90 50' },
            ].map((wire, i) => (
              <motion.path
                key={wire.id}
                d={wire.d}
                fill="none"
                stroke="rgba(47,128,237,0.35)"
                strokeWidth="0.15"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            {/* Animated traveling dots on each wire */}
            {[
              { id: 'td1', x1: 10, x2: 50, dur: '2.5s', delay: '0.8s' },
              { id: 'td2', x1: 27.5, x2: 50, dur: '1.8s', delay: '1.2s' },
              { id: 'td3', x1: 50, x2: 72.5, dur: '1.8s', delay: '1s' },
              { id: 'td4', x1: 50, x2: 90, dur: '2.5s', delay: '1.4s' },
            ].map(dot => (
              <circle key={dot.id} r="0.6" fill="rgba(47,128,237,0.6)">
                <animate attributeName="cx" values={`${dot.x1};${dot.x2};${dot.x1}`} dur={dot.dur} begin={dot.delay} repeatCount="indefinite" />
                <animate attributeName="cy" values="50;50" dur={dot.dur} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" dur={dot.dur} begin={dot.delay} repeatCount="indefinite" />
              </circle>
            ))}

            {/* Static nodes at each agent position */}
            {[10, 27.5, 50, 72.5, 90].map((x, i) => (
              <motion.circle
                key={`node-${i}`}
                cx={x} cy={50} r="0.8"
                fill="rgba(47,128,237,0.4)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
              />
            ))}
          </svg>
        </>
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
                exit={{ opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.2, ease: 'easeIn' } }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative w-[90vw] max-w-[480px]"
              >
                {/* Avatar circle — sits ABOVE the card, overflowing */}
                <div className="flex justify-center relative z-10">
                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[5px] border-white shadow-[0_10px_40px_rgba(0,0,0,0.18)] mb-[-70px] md:mb-[-85px]">
                    {userPhotoURL ? (
                      <img src={userPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-luna-charcoal to-gray-600 flex items-center justify-center text-white text-4xl md:text-5xl font-light">
                        {(userDisplayName || 'U').split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Glass card — below the avatar */}
                <div className="glass-card max-h-[75vh] overflow-y-auto p-6 pt-20 pb-10 md:p-10 md:pt-24 md:pb-12 shadow-luxury relative">
                  <div className="flex flex-col items-center mb-6">
                    <p className="text-gray-600 text-sm font-medium tracking-wide">Votre Concierge Voyage</p>
                  </div>

                  <form id="voyage-form" onSubmit={handleStartAnalysis} className="flex flex-col gap-5">

                    {/* ── DEPARTURE CITY ── */}
                    <div>
                      <label className="input-label">Départ de</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ville de départ (ex: Paris)"
                          className="input-underline pr-8"
                          value={departureCity}
                          onChange={e => { setDepartureCity(e.target.value); fetchSuggestions(e.target.value, 'departure'); }}
                          onFocus={() => { if (departureCity.length >= 2) fetchSuggestions(departureCity, 'departure'); }}
                          onBlur={() => setTimeout(() => { if (activeInputId === 'departure') { setSuggestions([]); setActiveInputId(null); } }, 200)}
                          autoComplete="off"
                        />
                        <Plane className="absolute right-0 top-3 w-4 h-4 text-luna-text-muted/40" strokeWidth={1.5} />
                        <AnimatePresence>
                          {activeInputId === 'departure' && suggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute left-0 right-0 top-full mt-1 bg-white/98 backdrop-blur-xl rounded-xl border border-luna-warm-gray/15 shadow-luxury z-50 overflow-hidden"
                            >
                              {suggestions.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-luna-cream/80 transition-colors"
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => { setDepartureCity(s.name); setSuggestions([]); setActiveInputId(null); }}
                                >
                                  <MapPin size={13} className="text-luna-accent flex-shrink-0" strokeWidth={1.5} />
                                  <span className="text-sm text-luna-charcoal font-normal">{s.name}</span>
                                  <span className="text-[10px] text-luna-text-muted ml-auto">{s.country}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder={idx === 0 ? 'Où souhaitez-vous voyager ?' : `Destination ${idx + 1}`}
                                className="input-underline w-full pr-8"
                                value={dest.city}
                                onChange={e => { updateDestination(dest.id, e.target.value); fetchSuggestions(e.target.value, dest.id); }}
                                onFocus={() => { if (dest.city.length >= 2) fetchSuggestions(dest.city, dest.id); }}
                                onBlur={() => setTimeout(() => { if (activeInputId === dest.id) { setSuggestions([]); setActiveInputId(null); } }, 200)}
                                required={idx === 0}
                                autoComplete="off"
                              />
                              {/* Autocomplete dropdown */}
                              <AnimatePresence>
                                {activeInputId === dest.id && suggestions.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute left-0 right-0 top-full mt-1 bg-white/98 backdrop-blur-xl rounded-xl border border-luna-warm-gray/15 shadow-luxury z-50 overflow-hidden"
                                  >
                                    {suggestions.map(s => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-luna-cream/80 transition-colors"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => { updateDestination(dest.id, s.name); setSuggestions([]); setActiveInputId(null); }}
                                      >
                                        <MapPin size={13} className="text-luna-accent flex-shrink-0" strokeWidth={1.5} />
                                        <span className="text-sm text-luna-charcoal font-normal">{s.name}</span>
                                        <span className="text-[10px] text-luna-text-muted ml-auto">{s.country}</span>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
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
                    <div className="flex gap-3 md:gap-6">
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
                      <div className="flex gap-1.5 md:gap-2 mt-1 flex-wrap">
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
                    <div className="flex gap-3 md:gap-6">
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

                    {/* CTA removed from inside card — placed below */}
                  </form>
                </div>

                {/* CTA button — overflows below the card like avatar overflows above */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex justify-center relative z-10"
                >
                  <button type="submit" form="voyage-form" className="w-[85%] -mt-7 text-sm tracking-[0.15em] uppercase group py-4 rounded-2xl font-semibold text-gray-900 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer inline-flex items-center justify-center gap-2" style={{ background: '#ffffff', border: '3px solid #c6e0f2', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    <span>Créer le Voyage</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ═══ PROCESSING: HORIZONTAL NODE ROW — Apple/OpenAI ═══ */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center gap-6 md:gap-8 relative z-20"
              >
                {/* We render all 5 nodes in order: Transport, Accommodation, SuperAgent, Itinerary, Client */}
                {(['transport', 'accommodation', 'super', 'itinerary', 'client'] as const).map((nodeKey, i) => {
                  const isSuper = nodeKey === 'super';

                  if (isSuper) {
                    // ── SUPER AGENT (hero) ──
                    return (
                      <motion.div
                        key="super-agent"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{ animation: 'superFloat 12s cubic-bezier(0.22,1,0.36,1) infinite' }}
                      >
                        <div
                          className="relative flex flex-col items-center justify-center text-center"
                          style={{
                            width: '200px',
                            minHeight: '240px',
                            borderRadius: '28px',
                            background: '#FFFFFF',
                            border: '1px solid rgba(47,128,237,0.20)',
                            boxShadow: '0 0 0 6px rgba(47,128,237,0.10), 0 10px 30px rgba(16,24,40,0.06)',
                            padding: '28px 20px',
                          }}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: '#F2F4F7' }}>
                            <Sparkles size={20} strokeWidth={1.75} style={{ color: '#2F80ED' }} />
                          </div>

                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            Super Agent
                          </h3>
                          <p style={{ fontSize: '12px', fontWeight: 500, color: '#667085', marginTop: '4px' }}>
                            Orchestration IA
                          </p>

                          <div className="flex items-center gap-2 mt-4">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#2F80ED' }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#2F80ED' }} />
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#0B1220' }}>
                              {workflowState === 'ANALYSING' && 'Analyse en cours…'}
                              {workflowState === 'DISTRIBUTING' && 'Distribution…'}
                              {workflowState === 'AGENTS_WORKING' && 'Recherche parallèle…'}
                              {workflowState === 'VALIDATION' && `${validatedAgents.length}/4 validés`}
                              {workflowState === 'GENERATING_PROPOSALS' && 'Finalisation…'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#2F80ED', background: 'rgba(47,128,237,0.08)', padding: '3px 10px', borderRadius: '12px' }}>
                              4 Agents
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#2F80ED', background: 'rgba(47,128,237,0.08)', padding: '3px 10px', borderRadius: '12px' }}>
                              {activeAgents.length} Actifs
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ── SATELLITE AGENT ──
                  const agentKey = nodeKey as AgentKey;
                  const meta = agentMeta[agentKey];
                  const Icon = meta.icon;
                  const isActive = activeAgents.includes(agentKey);
                  const isValidated = validatedAgents.includes(agentKey);
                  const canValidate = workflowState === 'VALIDATION' && !isValidated && agentResults;
                  const floatDur = 8 + Math.random() * 6; // 8-14s

                  return (
                    <motion.div
                      key={agentKey}
                      initial={{ opacity: 0, scale: 0.6, y: 20 }}
                      animate={{ opacity: isActive ? 1 : 0.3, scale: isActive ? 1 : 0.9, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`${canValidate ? 'cursor-pointer' : ''}`}
                      onClick={() => canValidate && setSelectedAgent(agentKey)}
                      style={{ animation: isActive && !isValidated ? `agentFloat ${floatDur}s cubic-bezier(0.22,1,0.36,1) infinite` : undefined }}
                    >
                      <div
                        className="relative flex flex-col items-center justify-center text-center transition-shadow duration-300"
                        style={{
                          width: '160px',
                          minHeight: '195px',
                          borderRadius: '28px',
                          background: '#FFFFFF',
                          border: isValidated ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,24,40,0.08)',
                          boxShadow: isValidated
                            ? '0 0 0 4px rgba(16,185,129,0.10), 0 10px 30px rgba(16,185,129,0.08)'
                            : '0 10px 30px rgba(16,24,40,0.06)',
                          padding: '22px 16px',
                        }}
                      >
                        {/* Status badge */}
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                          {isValidated ? (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              className="rounded-full p-0.5" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
                            >
                              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                            </motion.div>
                          ) : canValidate ? (
                            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
                          ) : isActive ? (
                            <Loader2 size={14} className="animate-spin" style={{ color: '#667085' }} />
                          ) : null}
                        </div>

                        {/* Icon badge */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-3"
                          style={{ background: '#F2F4F7' }}
                        >
                          <Icon size={18} strokeWidth={1.75} style={{ color: isValidated ? '#10b981' : '#2F80ED' }} />
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                          {meta.title}
                        </h3>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#667085', marginTop: '2px' }}>
                          {meta.subtitle}
                        </p>
                        <p style={{ fontSize: '12px', color: '#667085', opacity: 0.7, marginTop: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                          {meta.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ═══ PROPOSALS READY ═══ */}
            {workflowState === 'PROPOSALS_READY' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card w-[90vw] max-w-[540px] max-h-[85vh] overflow-y-auto p-6 md:p-10 shadow-luxury border-2 border-white"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
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
                  <button onClick={handleExportToCRM} disabled={isExporting} className="flex-[2] py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-sm tracking-wider uppercase rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-70">
                    {isExporting ? 'Exportation...' : 'Exporter vers CRM'} <Send size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ AGENT VALIDATION MODAL — PREMIUM ═══ */}
      <AnimatePresence>
        {selectedAgent && agentResults && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luna-charcoal/30 backdrop-blur-md"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white/98 backdrop-blur-2xl rounded-3xl border border-luna-warm-gray/10 max-w-2xl w-full shadow-[0_32px_80px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const meta = agentMeta[selectedAgent];
                const Icon = meta.icon;
                const data = agentResults[selectedAgent];
                const summary = data?.summary || 'Données disponibles';

                return (
                  <>
                    {/* Clean premium header */}
                    <div className="px-8 py-5 border-b border-luna-warm-gray/10 flex-shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: meta.color }}>
                          <Icon size={22} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-serif text-xl font-bold text-black">{meta.title}</h2>
                          <p className="text-gray-500 text-xs uppercase tracking-[0.15em] font-semibold mt-0.5">Résultats de recherche</p>
                        </div>
                        <button onClick={() => setSelectedAgent(null)} className="p-2 text-luna-text-muted/50 hover:text-luna-charcoal rounded-lg transition-colors">
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto p-8 flex-1">
                      <div className="bg-luna-cream/60 p-5 rounded-2xl border border-luna-warm-gray/10 mb-6">
                        <p className="text-black leading-relaxed text-base">{summary}</p>
                      </div>

                      {/* Transport: Flights */}
                      {selectedAgent === 'transport' && data?.flights?.length > 0 && (
                        <div className="space-y-2.5 mb-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-black uppercase tracking-wider">✈️ Vols ({data.flights.length})</h4>
                          </div>
                          {data.flights.map((f: any, i: number) => (
                            <a key={i} href={f.url || '#'} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center text-xs font-bold text-sky-600">{i + 1}</span>
                                  <span className="font-bold text-base text-black group-hover:text-sky-600 transition-colors">{f.airline} — {f.class}</span>
                                </div>
                                <span className="font-serif font-bold text-black text-base">{f.price}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 ml-9">{f.route} • {f.duration} • {f.stops} escale(s)</p>
                              <p className="text-xs text-sky-500 mt-1.5 ml-9 font-semibold group-hover:underline">Réserver sur {f.domain || 'Skyscanner'} →</p>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Transport: Trains */}
                      {selectedAgent === 'transport' && data?.trains?.length > 0 && (
                        <div className="space-y-2.5 mb-6">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wider">🚄 Trains ({data.trains.length})</h4>
                          {data.trains.map((t: any, i: number) => (
                            <a key={i} href={t.url || '#'} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600">🚄</span>
                                  <span className="font-bold text-base text-black group-hover:text-emerald-600 transition-colors">{t.operator} — {t.class}</span>
                                </div>
                                <span className="font-serif font-bold text-black text-base">{t.price}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 ml-9">{t.route} • {t.duration}{t.frequency ? ` • ${t.frequency}` : ''}</p>
                              <p className="text-xs text-emerald-500 mt-1.5 ml-9 font-semibold group-hover:underline">Réserver sur {t.domain || 'Trainline'} →</p>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Transport: Cars */}
                      {selectedAgent === 'transport' && data?.cars?.length > 0 && (
                        <div className="space-y-2.5 mb-6">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wider">🚗 Voiture ({data.cars.length})</h4>
                          {data.cars.map((c: any, i: number) => (
                            <a key={i} href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600">🚗</span>
                                  <span className="font-bold text-base text-black group-hover:text-amber-600 transition-colors">{c.mode}</span>
                                </div>
                                <span className="font-serif font-bold text-black text-base">{c.price}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 ml-9">{c.route} • {c.distance} • {c.duration}</p>
                              {c.details && <p className="text-xs text-gray-500 mt-1 ml-9 italic">{c.details}</p>}
                              <p className="text-xs text-amber-500 mt-1.5 ml-9 font-semibold group-hover:underline">Voir sur {c.domain || 'Google Maps'} →</p>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Accommodation: Hotels (show all, with clickable links) */}
                      {selectedAgent === 'accommodation' && data?.hotels?.length > 0 && (
                        <div className="space-y-2.5 mb-6">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wider">🏨 Hôtels sélectionnés ({data.hotels.length})</h4>
                          {data.hotels.map((h: any, i: number) => (
                            <a key={i} href={h.url || '#'} target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all group cursor-pointer">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">{i + 1}</span>
                                  <span className="font-bold text-base text-black group-hover:text-sky-600 transition-colors">{h.name}</span>
                                </div>
                                <span className="font-serif font-bold text-black text-base">{h.pricePerNight}/nuit</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 ml-9">{'★'.repeat(h.stars || 5)} • {h.highlights?.join(', ')}</p>
                              {h.recommendation && <p className="text-xs text-gray-500 mt-1 ml-9 italic leading-snug">{h.recommendation}</p>}
                              <p className="text-xs text-sky-500 mt-1.5 ml-9 font-semibold group-hover:underline">Réserver sur {h.domain || h.name} →</p>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Itinerary: Days with clickable links */}
                      {selectedAgent === 'itinerary' && data?.days?.length > 0 && (
                        <div className="space-y-2.5 mb-6">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wider">📅 Planning jour par jour ({data.days.length} jours)</h4>
                          {data.days.map((d: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200">
                              <h5 className="font-bold text-base text-black flex items-center gap-2">
                                <span className="w-7 h-7 rounded-md bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600">J{d.day}</span>
                                {d.title}
                              </h5>
                              <div className="text-sm text-gray-600 mt-2 ml-9 space-y-1.5">
                                <p className="flex items-start gap-1">
                                  <span>🌅</span>
                                  <span className="flex-1">{d.morning}
                                    {d.morningUrl && <a href={d.morningUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-sky-500 hover:text-sky-600 font-medium hover:underline">→ Voir</a>}
                                  </span>
                                </p>
                                <p className="flex items-start gap-1">
                                  <span>🌤️</span>
                                  <span className="flex-1">{d.afternoon}
                                    {d.afternoonUrl && <a href={d.afternoonUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-sky-500 hover:text-sky-600 font-medium hover:underline">→ Voir</a>}
                                  </span>
                                </p>
                                <p className="flex items-start gap-1">
                                  <span>🌙</span>
                                  <span className="flex-1">{d.evening}
                                    {d.eveningUrl && <a href={d.eveningUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-sky-500 hover:text-sky-600 font-medium hover:underline">→ Voir</a>}
                                  </span>
                                </p>
                              </div>
                              {d.highlight && <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 ml-8 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">{d.highlight}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Client: Recommendations with clickable links */}
                      {selectedAgent === 'client' && data?.recommendations?.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="text-sm font-bold text-black uppercase tracking-wider">💡 Recommandations ({data.recommendations.length})</h4>
                          {data.recommendations.map((r: any, i: number) => {
                            const text = typeof r === 'string' ? r : r?.text || r;
                            const url = typeof r === 'object' ? r?.url : null;
                            const type = typeof r === 'object' ? r?.type : null;
                            return (
                              <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 text-base text-black">
                                <div className="flex items-start gap-2.5">
                                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <span>{text}</span>
                                    {url && (
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1 text-xs text-sky-500 hover:text-sky-600 font-medium hover:underline">
                                        {type ? `Voir ${type}` : 'Voir le lien'} →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sticky bottom-0 bg-white/90 backdrop-blur-md pt-5 border-t border-luna-warm-gray/10 -mx-8 px-8 pb-1 flex-shrink-0">
                        <div className="flex gap-3">
                          <button onClick={() => setSelectedAgent(null)} className="flex-1 py-3 bg-white border border-luna-warm-gray/20 hover:bg-luna-cream text-luna-charcoal font-medium text-sm rounded-xl transition-all">Plus tard</button>
                          <button onClick={handleValidateAgent} className="flex-[2] py-3.5 text-white font-semibold text-sm tracking-wider uppercase rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg" style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)`, boxShadow: `0 8px 24px ${meta.color}30` }}>
                            Valider <CheckCircle2 size={16} />
                          </button>
                        </div>
                        {agentResults && (
                          <div className="flex justify-center">
                            <PdfExport
                              results={agentResults}
                              destination={destinations[0]?.city || ''}
                              departureDate={departureDate}
                              returnDate={returnDate}
                            />
                          </div>
                        )}
                      </div>
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
