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
  Radio,
  Navigation2,
  Building2,
  Compass,
  Fingerprint,
  Zap
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
  transport: { title: 'Transport', subtitle: 'Vols & Routings', desc: 'Recherche des meilleurs vols directs et avec escales, analyse tarifaire multi-compagnies', icon: Navigation2, angle: -90, color: '#38bdf8', gradient: 'from-sky-500 to-sky-400', pastelBg: 'bg-sky-50', pastelText: 'text-black', pastelBorder: 'border-sky-100', pastelRing: 'ring-sky-200' },
  accommodation: { title: 'Hébergement', subtitle: 'Hôtels & Resorts', desc: 'Sélection premium des établissements, vérification disponibilités et tarifs négociés', icon: Building2, angle: 180, color: '#38bdf8', gradient: 'from-sky-500 to-sky-400', pastelBg: 'bg-sky-50', pastelText: 'text-black', pastelBorder: 'border-sky-100', pastelRing: 'ring-sky-200' },
  client: { title: 'Profil Client', subtitle: 'CRM Analyse', desc: 'Analyse du profil voyageur, préférences historiques et recommandations personnalisées', icon: Fingerprint, angle: 0, color: '#38bdf8', gradient: 'from-sky-500 to-sky-400', pastelBg: 'bg-sky-50', pastelText: 'text-black', pastelBorder: 'border-sky-100', pastelRing: 'ring-sky-200' },
  itinerary: { title: 'Itinéraire', subtitle: 'Planning Jour/Jour', desc: 'Construction de l\'itinéraire optimisé, activités et transferts coordonnés', icon: Compass, angle: 90, color: '#38bdf8', gradient: 'from-sky-500 to-sky-400', pastelBg: 'bg-sky-50', pastelText: 'text-black', pastelBorder: 'border-sky-100', pastelRing: 'ring-sky-200' },
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
      if (agentResults?.itinerary?.days) {
        agentResults.itinerary.days.forEach((d: any) => {
          if (d.morningUrl) links.push({ title: `J${d.day} 🌅 ${d.morning?.slice(0, 50) || 'Matin'}`, url: d.morningUrl });
          if (d.afternoonUrl) links.push({ title: `J${d.day} 🌤️ ${d.afternoon?.slice(0, 50) || 'Après-midi'}`, url: d.afternoonUrl });
          if (d.eveningUrl) links.push({ title: `J${d.day} 🌙 ${d.evening?.slice(0, 50) || 'Soir'}`, url: d.eveningUrl });
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
            @keyframes shimmerProgress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
          `}</style>


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
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#0B1220', letterSpacing: '-0.01em', textAlign: 'center' }}>
                      Bonjour, on part où aujourd'hui{userDisplayName ? ` ${userDisplayName.split(' ')[0]}` : ''} ?
                    </p>
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
                className="flex items-center justify-center gap-4 md:gap-6 relative z-20"
              >
                {/* n8n bezier curves — appear only when ALL agents are loaded (VALIDATION+) */}
                {(workflowState === 'VALIDATION' || workflowState === 'GENERATING_PROPOSALS') && (
                  <svg
                    className="absolute pointer-events-none"
                    style={{ zIndex: 0, top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {[
                      { id: 'st', x1: 40, y1: 50, x2: 8, y2: 50, cy: -8, delay: 0 },
                      { id: 'sh', x1: 40, y1: 50, x2: 26, y2: 50, cy: 6, delay: 0.1 },
                      { id: 'si', x1: 60, y1: 50, x2: 74, y2: 50, cy: 6, delay: 0.1 },
                      { id: 'sp', x1: 60, y1: 50, x2: 92, y2: 50, cy: -8, delay: 0 },
                    ].map(w => {
                      const midX = (w.x1 + w.x2) / 2;
                      const d = `M ${w.x1} ${w.y1} C ${midX} ${w.y1 + w.cy}, ${midX} ${w.y2 + w.cy}, ${w.x2} ${w.y2}`;
                      return (
                        <motion.path
                          key={w.id}
                          d={d}
                          fill="none"
                          stroke="rgba(47,128,237,0.28)"
                          strokeWidth="0.25"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: w.delay, ease: [0.22, 1, 0.36, 1] }}
                          style={{ strokeWidth: '2px' }}
                        />
                      );
                    })}
                  </svg>
                )}
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
                        style={{ animation: 'superFloat 12s cubic-bezier(0.22,1,0.36,1) infinite', position: 'relative', zIndex: 1 }}
                      >
                        <div
                          className="relative flex flex-col items-center justify-center text-center"
                          style={{
                            width: '340px',
                            minHeight: '380px',
                            borderRadius: '32px',
                            background: '#FFFFFF',
                            border: '1px solid rgba(47,128,237,0.20)',
                            boxShadow: '0 0 0 6px rgba(47,128,237,0.10), 0 16px 48px rgba(16,24,40,0.08)',
                            padding: '36px 28px',
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          }}
                        >
                          <div className="flex items-center justify-center mb-5">
                            <Zap size={40} strokeWidth={1.5} style={{ color: '#2F80ED' }} />
                          </div>

                          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            Super Agent
                          </h3>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#667085', marginTop: '6px' }}>
                            Orchestration IA
                          </p>

                          <div className="flex items-center gap-2 mt-6">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#2F80ED' }} />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#2F80ED' }} />
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#0B1220' }}>
                              {workflowState === 'ANALYSING' && 'Analyse en cours…'}
                              {workflowState === 'DISTRIBUTING' && 'Distribution…'}
                              {workflowState === 'AGENTS_WORKING' && 'Recherche parallèle…'}
                              {workflowState === 'VALIDATION' && `${validatedAgents.length}/4 validés`}
                              {workflowState === 'GENERATING_PROPOSALS' && 'Finalisation…'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: '80%', height: '4px', background: '#F2F4F7', borderRadius: '2px', marginTop: '20px', overflow: 'hidden' }}>
                            <div style={{
                              width: workflowState === 'VALIDATION' ? '100%' : workflowState === 'AGENTS_WORKING' ? '60%' : '30%',
                              height: '100%', borderRadius: '2px', background: '#2F80ED',
                              transition: 'width 1s ease',
                            }} />
                          </div>

                          <div className="flex items-center gap-2 mt-5">
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', background: 'rgba(47,128,237,0.08)', padding: '4px 12px', borderRadius: '14px' }}>
                              4 Agents
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', background: 'rgba(47,128,237,0.08)', padding: '4px 12px', borderRadius: '14px' }}>
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
                      style={{ animation: isActive && !isValidated ? `agentFloat ${floatDur}s cubic-bezier(0.22,1,0.36,1) infinite` : undefined, position: 'relative', zIndex: 1 }}
                    >
                      <div
                        className="relative flex flex-col items-center justify-center text-center transition-shadow duration-300"
                        style={{
                          width: '280px',
                          minHeight: '300px',
                          borderRadius: '32px',
                          background: '#FFFFFF',
                          border: isValidated ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,24,40,0.08)',
                          boxShadow: isValidated
                            ? '0 0 0 4px rgba(16,185,129,0.10), 0 16px 48px rgba(16,185,129,0.08)'
                            : '0 16px 48px rgba(16,24,40,0.06)',
                          padding: '32px 24px',
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        }}
                      >
                        {/* Status badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          {isValidated ? (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              className="rounded-full p-0.5" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
                            >
                              <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                            </motion.div>
                          ) : canValidate ? (
                            <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
                          ) : isActive ? (
                            <Loader2 size={16} className="animate-spin" style={{ color: '#667085' }} />
                          ) : null}
                        </div>

                        {/* Icon — no background, bigger, minimal */}
                        <div className="flex items-center justify-center flex-shrink-0 mb-4">
                          <Icon size={36} strokeWidth={1.5} style={{ color: isValidated ? '#10b981' : '#2F80ED' }} />
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                          {meta.title}
                        </h3>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#667085', marginTop: '4px' }}>
                          {meta.subtitle}
                        </p>
                        <p style={{ fontSize: '14px', color: '#667085', opacity: 0.7, marginTop: '10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                          {meta.desc}
                        </p>

                        {/* Progress animation — shimmer bar when active */}
                        {isActive && !isValidated && (
                          <div style={{ width: '75%', height: '3px', background: '#F2F4F7', borderRadius: '2px', marginTop: '16px', overflow: 'hidden' }}>
                            <div style={{
                              width: '40%', height: '100%', borderRadius: '2px',
                              background: 'linear-gradient(90deg, rgba(47,128,237,0.3), rgba(47,128,237,0.7), rgba(47,128,237,0.3))',
                              animation: 'shimmerProgress 1.5s ease-in-out infinite',
                            }} />
                          </div>
                        )}
                        {isValidated && (
                          <div style={{ width: '75%', height: '3px', background: '#ECFDF5', borderRadius: '2px', marginTop: '16px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '2px', background: '#10b981' }} />
                          </div>
                        )}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(11,18,32,0.25)', backdropFilter: 'blur(12px)' }}
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl max-h-[88vh] flex flex-col"
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(16,24,40,0.08)',
                boxShadow: '0 24px 80px rgba(16,24,40,0.14), 0 8px 24px rgba(16,24,40,0.06)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const meta = agentMeta[selectedAgent];
                const Icon = meta.icon;
                const data = agentResults[selectedAgent];
                const summary = data?.summary || 'Données disponibles';

                return (
                  <>
                    {/* ── Header ── */}
                    <div className="flex-shrink-0" style={{ padding: '28px 36px 20px', borderBottom: '1px solid rgba(16,24,40,0.06)' }}>
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F2F4F7' }}
                        >
                          <Icon size={22} strokeWidth={1.75} style={{ color: '#2F80ED' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            {meta.title}
                          </h2>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#667085', marginTop: '2px' }}>
                            Résultats de recherche
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedAgent(null)}
                          className="flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ width: '36px', height: '36px', borderRadius: '10px', color: '#667085' }}
                        >
                          <X size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {/* ── Scrollable content ── */}
                    <div className="overflow-y-auto flex-1" style={{ padding: '24px 36px' }}>

                      {/* Summary */}
                      <div style={{ padding: '18px 22px', borderRadius: '16px', background: '#F7F8FA', border: '1px solid rgba(16,24,40,0.05)', marginBottom: '28px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 400, color: '#344054', lineHeight: 1.7 }}>{summary}</p>
                      </div>

                      {/* ── Transport: Flights ── */}
                      {selectedAgent === 'transport' && data?.flights?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            ✈️ Vols ({data.flights.length})
                          </h4>
                          <div className="space-y-3">
                            {data.flights.map((f: any, i: number) => (
                              <a key={i} href={f.url || '#'} target="_blank" rel="noopener noreferrer"
                                className="block group transition-all"
                                style={{ padding: '18px 22px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(47,128,237,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(47,128,237,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,24,40,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center flex-shrink-0"
                                      style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EBF5FF', fontSize: '13px', fontWeight: 700, color: '#2F80ED' }}>{i + 1}</span>
                                    <div>
                                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0B1220' }}>{f.airline} — {f.class}</span>
                                      <p style={{ fontSize: '13px', color: '#667085', marginTop: '3px' }}>{f.route} • {f.duration} • {f.stops} escale(s)</p>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0B1220' }}>{f.price}</span>
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '8px', marginLeft: '44px' }}>
                                  Réserver sur {f.domain || 'Skyscanner'} →
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Transport: Trains ── */}
                      {selectedAgent === 'transport' && data?.trains?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            🚄 Trains ({data.trains.length})
                          </h4>
                          <div className="space-y-3">
                            {data.trains.map((t: any, i: number) => (
                              <a key={i} href={t.url || '#'} target="_blank" rel="noopener noreferrer"
                                className="block transition-all"
                                style={{ padding: '18px 22px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,24,40,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center flex-shrink-0"
                                      style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ECFDF5', fontSize: '14px' }}>🚄</span>
                                    <div>
                                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0B1220' }}>{t.operator} — {t.class}</span>
                                      <p style={{ fontSize: '13px', color: '#667085', marginTop: '3px' }}>{t.route} • {t.duration}{t.frequency ? ` • ${t.frequency}` : ''}</p>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0B1220' }}>{t.price}</span>
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', marginTop: '8px', marginLeft: '44px' }}>
                                  Réserver sur {t.domain || 'Trainline'} →
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Transport: Cars ── */}
                      {selectedAgent === 'transport' && data?.cars?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            🚗 Voiture ({data.cars.length})
                          </h4>
                          <div className="space-y-3">
                            {data.cars.map((c: any, i: number) => (
                              <a key={i} href={c.url || '#'} target="_blank" rel="noopener noreferrer"
                                className="block transition-all"
                                style={{ padding: '18px 22px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(245,158,11,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,24,40,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center flex-shrink-0"
                                      style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFBEB', fontSize: '14px' }}>🚗</span>
                                    <div>
                                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0B1220' }}>{c.mode}</span>
                                      <p style={{ fontSize: '13px', color: '#667085', marginTop: '3px' }}>{c.route} • {c.distance} • {c.duration}</p>
                                      {c.details && <p style={{ fontSize: '12px', color: '#98A2B3', marginTop: '2px', fontStyle: 'italic' }}>{c.details}</p>}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0B1220' }}>{c.price}</span>
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B', marginTop: '8px', marginLeft: '44px' }}>
                                  Voir sur {c.domain || 'Google Maps'} →
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Accommodation: Hotels ── */}
                      {selectedAgent === 'accommodation' && data?.hotels?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            🏨 Hôtels sélectionnés ({data.hotels.length})
                          </h4>
                          <div className="space-y-3">
                            {data.hotels.map((h: any, i: number) => (
                              <a key={i} href={h.url || '#'} target="_blank" rel="noopener noreferrer"
                                className="block transition-all"
                                style={{ padding: '18px 22px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(47,128,237,0.3)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(47,128,237,0.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,24,40,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center flex-shrink-0"
                                      style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EEF4FF', fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>{i + 1}</span>
                                    <div>
                                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0B1220' }}>{h.name}</span>
                                      <p style={{ fontSize: '13px', color: '#667085', marginTop: '3px' }}>{'★'.repeat(h.stars || 5)} • {h.highlights?.join(', ')}</p>
                                      {h.recommendation && <p style={{ fontSize: '12px', color: '#98A2B3', marginTop: '3px', fontStyle: 'italic', lineHeight: 1.5 }}>{h.recommendation}</p>}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#0B1220', whiteSpace: 'nowrap' }}>{h.pricePerNight}/nuit</span>
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '8px', marginLeft: '44px' }}>
                                  Réserver sur {h.domain || h.name} →
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Itinerary: Days ── */}
                      {selectedAgent === 'itinerary' && data?.days?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            📅 Planning jour par jour ({data.days.length} jours)
                          </h4>
                          <div className="space-y-4">
                            {data.days.map((d: any, i: number) => (
                              <div key={i} style={{ padding: '22px 24px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}>
                                <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
                                  <span className="flex items-center justify-center flex-shrink-0"
                                    style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#FFF7ED', fontSize: '14px', fontWeight: 800, color: '#EA580C' }}>
                                    J{d.day}
                                  </span>
                                  <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1220' }}>{d.title}</h5>
                                </div>

                                <div className="space-y-4" style={{ marginLeft: '48px' }}>
                                  {/* Matin */}
                                  <div className="flex items-start gap-3">
                                    <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>🌅</span>
                                    <div className="flex-1">
                                      <p style={{ fontSize: '14px', color: '#344054', lineHeight: 1.65 }}>{d.morning}</p>
                                      {d.morningUrl && (
                                        <a href={d.morningUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '4px', display: 'inline-block' }}>→ Voir</a>
                                      )}
                                    </div>
                                  </div>
                                  {/* Après-midi */}
                                  <div className="flex items-start gap-3">
                                    <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>🌤️</span>
                                    <div className="flex-1">
                                      <p style={{ fontSize: '14px', color: '#344054', lineHeight: 1.65 }}>{d.afternoon}</p>
                                      {d.afternoonUrl && (
                                        <a href={d.afternoonUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '4px', display: 'inline-block' }}>→ Voir</a>
                                      )}
                                    </div>
                                  </div>
                                  {/* Soir */}
                                  <div className="flex items-start gap-3">
                                    <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>🌙</span>
                                    <div className="flex-1">
                                      <p style={{ fontSize: '14px', color: '#344054', lineHeight: 1.65 }}>{d.evening}</p>
                                      {d.eveningUrl && (
                                        <a href={d.eveningUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '4px', display: 'inline-block' }}>→ Voir</a>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {d.highlight && (
                                  <div style={{ marginTop: '14px', marginLeft: '48px' }}>
                                    <span style={{
                                      fontSize: '12px', fontWeight: 600, color: '#10b981',
                                      background: '#ECFDF5', padding: '5px 14px', borderRadius: '20px',
                                      display: 'inline-block', lineHeight: 1.3
                                    }}>
                                      ✨ {d.highlight}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Client: Recommendations ── */}
                      {selectedAgent === 'client' && data?.recommendations?.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            💡 Recommandations ({data.recommendations.length})
                          </h4>
                          <div className="space-y-3">
                            {data.recommendations.map((r: any, i: number) => {
                              const text = typeof r === 'string' ? r : r?.text || r;
                              const url = typeof r === 'object' ? r?.url : null;
                              const type = typeof r === 'object' ? r?.type : null;
                              return (
                                <div key={i} style={{ padding: '18px 22px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.08)' }}>
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                                    <div className="flex-1">
                                      <p style={{ fontSize: '14px', color: '#344054', lineHeight: 1.65 }}>{text}</p>
                                      {url && (
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', marginTop: '6px', display: 'inline-block' }}>
                                          {type ? `Voir ${type}` : 'Voir le lien'} →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Footer — sticky ── */}
                    <div className="flex-shrink-0" style={{
                      padding: '20px 36px',
                      borderTop: '1px solid rgba(16,24,40,0.06)',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '0 0 24px 24px',
                    }}>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedAgent(null)}
                          style={{
                            flex: 1, padding: '14px', borderRadius: '14px',
                            background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.12)',
                            fontSize: '14px', fontWeight: 600, color: '#344054',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F7F8FA'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}
                        >
                          Plus tard
                        </button>
                        <button
                          onClick={handleValidateAgent}
                          style={{
                            flex: 2, padding: '14px', borderRadius: '14px',
                            background: '#2F80ED', border: 'none',
                            fontSize: '14px', fontWeight: 700, color: '#FFFFFF',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(47,128,237,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(47,128,237,0.4)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(47,128,237,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                        >
                          Valider <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo bottom-left */}
      <div className="fixed bottom-6 left-6 z-30 opacity-60 hover:opacity-100 transition-opacity">
        <LunaLogo size={36} />
      </div>

      {/* Footer copyright */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 text-center py-3">
        <p className="text-[11px] text-gray-400 tracking-wider">© 2026 Luna — Concierge Voyage</p>
      </footer>
    </div>
  );
}
