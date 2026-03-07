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
import { createLead, createContact, createTrip, createTripDay, CRMTripSegment } from '@/src/lib/firebase/crm';
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

  useEffect(() => {
    setMounted(true);
    // ── Restore last saved results from localStorage ──
    try {
      const saved = localStorage.getItem('luna_last_results');
      if (saved && workflowState === 'IDLE') {
        const session = JSON.parse(saved);
        if (session.results) {
          setAgentResults(session.results);
          setValidatedAgents(['transport', 'accommodation', 'client', 'itinerary']);
          setActiveAgents(['transport', 'accommodation', 'client', 'itinerary']);
          setWorkflowState('PROPOSALS_READY');
          // Restore form context
          if (session.destination) setDestinations([{ id: '1', city: session.destination }]);
          if (session.departureCity) setDepartureCity(session.departureCity);
          if (session.departureDate) setDepartureDate(session.departureDate);
          if (session.returnDate) setReturnDate(session.returnDate);
          if (session.budget) setBudget(session.budget);
          if (session.pax) setPax(session.pax);
          if (session.vibe) setVibe(session.vibe);
          if (session.mustHaves) setMustHaves(session.mustHaves);
        }
      }
    } catch { /* silent */ }
  }, []);

  // Auto-fill from CRM (URL params like ?dest=Bangkok&pax=2&budget=5000)
  const searchParams = useSearchParams();
  useEffect(() => {
    const autoStart = searchParams.get('autoStart');
    const dest = searchParams.get('dest');

    // If autoStart from pipeline, allow overriding even PROPOSALS_READY
    if (autoStart === 'true' && dest) {
      const destList = dest.split('|').map(d => d.trim()).filter(Boolean);
      setDestinations(destList.map((d, i) => ({ id: String(i + 1), city: d })));
      if (searchParams.get('from')) setDepartureCity(searchParams.get('from')!);
      if (searchParams.get('dep')) setDepartureDate(searchParams.get('dep')!);
      if (searchParams.get('ret')) setReturnDate(searchParams.get('ret')!);
      if (searchParams.get('budget')) setBudget(searchParams.get('budget')!);
      if (searchParams.get('pax')) setPax(searchParams.get('pax')!);
      if (searchParams.get('vibe')) setVibe(searchParams.get('vibe')!);
      if (searchParams.get('notes')) setMustHaves(searchParams.get('notes')!);
      setTimeout(() => {
        setValidatedAgents([]);
        setActiveAgents([]);
        setAgentResults(null);
        setWorkflowState('ANALYSING');
      }, 500);
      return;
    }

    // Don't override if already running or showing results
    if (workflowState !== 'IDLE') return;

    // Pre-fill form fields from URL params
    if (dest) {
      const destList = dest.split('|').map(d => d.trim()).filter(Boolean);
      setDestinations(destList.map((d, i) => ({ id: String(i + 1), city: d })));
    }
    if (searchParams.get('from')) setDepartureCity(searchParams.get('from')!);
    if (searchParams.get('dep')) setDepartureDate(searchParams.get('dep')!);
    if (searchParams.get('ret')) setReturnDate(searchParams.get('ret')!);
    if (searchParams.get('budget')) setBudget(searchParams.get('budget')!);
    if (searchParams.get('pax')) setPax(searchParams.get('pax')!);
    if (searchParams.get('vibe')) setVibe(searchParams.get('vibe')!);
    if (searchParams.get('notes')) setMustHaves(searchParams.get('notes')!);
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

      // ── Persist results to localStorage (always saved) ──
      try {
        const savedSession = {
          timestamp: new Date().toISOString(),
          destination: destinations.filter(d => d.city.trim()).map(d => d.city).join(', '),
          departureCity,
          departureDate,
          returnDate,
          budget, pax, vibe, mustHaves,
          results: data,
        };
        localStorage.setItem('luna_last_results', JSON.stringify(savedSession));

        // Also persist to search history for analytics
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
    // Clear saved results
    try { localStorage.removeItem('luna_last_results'); } catch { /* silent */ }
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
      const destString = destinations.filter(d => d.city.trim()).map(d => d.city).join(', ');

      const leadId = await createLead(tenantId!, {
        clientName,
        clientId: contactId,
        destination: destString,
        dates: `${departureDate || 'TBD'} - ${returnDate || 'TBD'}`,
        budget: budget || 'Non communiqué',
        pax: pax || 'Non précisé',
        days: agentResults?.itinerary?.days?.length || 7,
        vibe: vibe || 'Non spécifié',
        flexibility: flexibility || 'Non spécifiée',
        mustHaves: mustHaves || 'Aucun',
        links: links.length > 0 ? links : undefined,
        agentResults: agentResults ? {
          transport: agentResults.transport || null,
          accommodation: agentResults.accommodation || null,
          itinerary: agentResults.itinerary || null,
          client: agentResults.client || null,
        } : undefined,
        status: 'PROPOSAL_READY',
      });

      // Generate a ready-to-use DRAFT CRMTrip to act as "fiche complète modifiable"
      let tripId: string | undefined;
      try {
        const startDateVal = departureDate || new Date().toISOString().split('T')[0];
        const endDateVal = returnDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        tripId = await createTrip(tenantId!, {
          title: `Voyage ${destString}`,
          destination: destString,
          clientName,
          clientId: contactId,
          startDate: startDateVal,
          endDate: endDateVal,
          status: 'DRAFT',
          paymentStatus: 'UNPAID',
          amount: 0,
          notes: `Devis IA. Budget visé: ${budget}. Pax: ${pax}. Vibe: ${vibe}.`,
          color: '#38bdf8', // LUNA Blue
        });

        // Add Days based on agent results
        if (agentResults?.itinerary?.days && tripId) {
          await Promise.all(agentResults.itinerary.days.map((d: any, i: number) => {
            const dateObj = new Date(startDateVal);
            dateObj.setDate(dateObj.getDate() + i);
            const dayDateStr = dateObj.toISOString().split('T')[0];

            const segments: CRMTripSegment[] = [];
            if (d.morning) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Matin', timeSlot: 'Morning', description: d.morning, bookingUrl: d.morningUrl || '' });
            }
            if (d.afternoon) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Après-midi', timeSlot: 'Afternoon', description: d.afternoon, bookingUrl: d.afternoonUrl || '' });
            }
            if (d.evening) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Soir', timeSlot: 'Evening', description: d.evening, bookingUrl: d.eveningUrl || '' });
            }

            return createTripDay(tenantId!, tripId!, {
              date: dayDateStr,
              dayIndex: i,
              title: d.title || `Jour ${i + 1}`,
              segments
            });
          }));
        }
      } catch (err) {
        console.error('Erreur creation Trip IA:', err);
      }

      // Redirect to the Trip Itinerary page directly to show interactive "fiche complete"
      if (tripId) {
        router.push(`/crm/trips/${tripId}/itinerary`);
      } else {
        router.push('/crm/pipeline');
      }

    } catch (error: any) {
      console.error('Erreur CRM:', error);
      alert(`Erreur CRM: ${error?.message || 'Connexion Firebase échouée. Vérifiez votre réseau.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  const isProcessing = workflowState !== 'IDLE';

  return (
    <div ref={containerRef} className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Background — Capsule anim: blue idle, cream during processing */}
      <div className="absolute inset-0 z-0">
        <CapsuleBackground colorScheme={isProcessing ? 'cream' : 'blue'} />
      </div>

      {/* ═══ HUB LINK — top-left, same position on both agents ═══ */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/80 transition-all group shadow-sm"
      >
        <X size={16} className="text-luna-charcoal group-hover:rotate-90 transition-transform" strokeWidth={1.5} />
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-luna-charcoal">Mission Hub</span>
      </Link>

      {/* Weather Widgets (real API) */}
      <div className="absolute top-16 right-3 md:top-20 md:right-5 z-40 w-[220px] md:w-[260px] hidden md:block">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WeatherWidget destinations={(() => {
            const cities = new Set<string>();
            // Helper: extract clean city name (before comma, skip route/road names)
            const addCity = (raw: string) => {
              if (!raw || raw.length < 2) return;
              const city = raw.split(',')[0].trim();
              // Skip non-city names (routes, airports, etc.)
              if (/route|aéroport|départ|arrivée|transfert|excursion/i.test(city)) return;
              if (city.length >= 2) cities.add(city);
            };
            // From departure
            addCity(departureCity);
            // From form destinations
            destinations.filter(d => d.city.trim()).forEach(d => addCity(d.city));
            // From agent results — itinerary days (city names only)
            if (agentResults?.itinerary?.days) {
              agentResults.itinerary.days.forEach((day: any) => {
                if (day.city) addCity(day.city);
                if (day.destination) addCity(day.destination);
                if (day.location) addCity(day.location);
              });
            }
            // From agent results — accommodation cities
            if (agentResults?.accommodation?.hotels) {
              agentResults.accommodation.hotels.forEach((h: any) => {
                if (h.city) addCity(h.city);
                if (h.destination) addCity(h.destination);
              });
            }
            // From agent results — transport departure/arrival cities
            if (agentResults?.transport?.flights) {
              agentResults.transport.flights.forEach((f: any) => {
                if (f.arrivalCity) addCity(f.arrivalCity);
                if (f.departureCity) addCity(f.departureCity);
              });
            }
            return Array.from(cities);
          })()} />
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
            @keyframes glowPulse {
              0%, 100% { box-shadow: 0 0 20px 4px rgba(47,128,237,0.15), 0 0 60px 10px rgba(47,128,237,0.05); }
              50% { box-shadow: 0 0 40px 8px rgba(47,128,237,0.3), 0 0 80px 20px rgba(47,128,237,0.1); }
            }
            @keyframes glowPulseGreen {
              0%, 100% { box-shadow: 0 0 20px 4px rgba(16,185,129,0.15), 0 0 60px 10px rgba(16,185,129,0.05); }
              50% { box-shadow: 0 0 40px 8px rgba(16,185,129,0.3), 0 0 80px 20px rgba(16,185,129,0.1); }
            }
            @keyframes superGlow {
              0%, 100% {
                box-shadow:
                  0 0 40px 10px rgba(47,128,237,0.25),
                  0 0 80px 25px rgba(47,128,237,0.12),
                  0 0 140px 50px rgba(99,102,241,0.06),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
              50% {
                box-shadow:
                  0 0 60px 20px rgba(47,128,237,0.4),
                  0 0 120px 45px rgba(47,128,237,0.18),
                  0 0 180px 70px rgba(99,102,241,0.1),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
            }
            @keyframes scanBeam {
              0% { top: 15%; opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { top: 85%; opacity: 0; }
            }
            @keyframes orbitalRing {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
              50% { opacity: 1; transform: scale(1) rotate(180deg); }
            }
            @keyframes successBurst {
              0% { transform: scale(0); opacity: 1; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            .agent-active-glow { animation: glowPulse 2s ease-in-out infinite; }
            .agent-validated-glow { animation: glowPulseGreen 2s ease-in-out infinite; }
            .super-agent-glow { animation: superGlow 3s ease-in-out infinite; }
            @keyframes successPulse {
              0%, 100% {
                box-shadow:
                  0 0 40px 12px rgba(47,128,237,0.25),
                  0 0 80px 30px rgba(47,128,237,0.12),
                  0 0 150px 50px rgba(99,102,241,0.06),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
              50% {
                box-shadow:
                  0 0 70px 25px rgba(47,128,237,0.4),
                  0 0 130px 50px rgba(47,128,237,0.18),
                  0 0 200px 80px rgba(99,102,241,0.1),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
            }
            @keyframes successRing {
              0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.6; }
              50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.2; }
              100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.6; }
            }
            @keyframes successBorderPulse {
              0%, 100% { border-color: rgba(47,128,237,0.2); }
              50% { border-color: rgba(47,128,237,0.5); }
            }
            .super-agent-success {
              animation: successPulse 2.5s ease-in-out infinite, successBorderPulse 2.5s ease-in-out infinite;
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
                style={{ animation: 'superFloat 12s cubic-bezier(0.22,1,0.36,1) infinite' }}
              >
                {/* Avatar circle — sits ABOVE the card, overflowing */}
                <div className="flex justify-center relative z-10">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-[5px] border-white shadow-[0_10px_40px_rgba(0,0,0,0.18)] mb-[-60px] md:mb-[-65px]">
                    {userPhotoURL ? (
                      <img src={userPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-luna-charcoal to-gray-600 flex items-center justify-center text-white text-3xl md:text-4xl font-normal">
                        {(userDisplayName || 'U').split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══ CAPSULE WHITE CARD — exact Super Agent design ═══ */}
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
                  {/* Pin dot at the top edge — same as Super Agent */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[45%] w-6 h-6 rounded-full bg-[#f0f9ff] border-4 border-white shadow-sm z-10" />
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
                                  <span className="text-[12px] text-luna-text-muted ml-auto">{s.country}</span>
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
                        <button type="button" onClick={addDestination} className="text-luna-accent hover:text-luna-accent-dark transition-colors flex items-center gap-1 text-[12px] font-normal uppercase tracking-wider">
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
                              <span className="text-[12px] font-normal text-luna-accent w-5 text-center">{idx + 1}</span>
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
                                        <span className="text-[12px] text-luna-text-muted ml-auto">{s.country}</span>
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
                            <span className="flex items-center text-[12px] font-normal text-luna-charcoal">
                              <Plane size={10} className="mr-0.5" />{departureCity}
                            </span>
                          )}
                          {destinations.filter(d => d.city.trim()).map((d, i) => (
                            <span key={d.id} className="flex items-center text-[12px] font-normal text-luna-accent-dark">
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
                            className={`px-3 py-1.5 rounded-full text-[12px] font-normal tracking-wide border transition-all ${flexibility === opt
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
                  <button
                    type="submit"
                    form="voyage-form"
                    className="w-[85%] -mt-7 text-sm tracking-[0.15em] uppercase group py-4 rounded-3xl font-medium text-luna-charcoal transition-all hover:-translate-y-1 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.04)',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span>Créer le Voyage</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ═══ PROCESSING: HORIZONTAL NODE ROW — PULL/CAPSULES DESIGN ═══ */}
            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center relative z-20 w-full py-10 px-4 md:px-0"
              >
                {/* Scaling container to keep the horizontal pills intact on smaller screens */}
                <div className="flex items-center justify-center -space-x-5 md:-space-x-8 lg:-space-x-12 scale-[0.35] min-[400px]:scale-[0.45] min-[500px]:scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
                  {/* We render all 5 nodes in order: Transport, Accommodation, SuperAgent, Itinerary, Client */}
                  {(['transport', 'accommodation', 'super', 'itinerary', 'client'] as const).map((nodeKey, i) => {
                    const isSuper = nodeKey === 'super';
                    const isInner = i === 1 || i === 3;
                    const isOuter = i === 0 || i === 4;

                    const zIndex = isSuper ? 50 : isInner ? 40 : 30;
                    const floatDur = isSuper ? 12 : 8 + Math.random() * 6;

                    // Proportions — super agent 30% bigger for impact
                    const styleObj = isSuper ? {
                      width: '416px', height: '700px', borderRadius: '208px', icon: 44, title: '26px', sub: '15px'
                    } : isInner ? {
                      width: '250px', height: '420px', borderRadius: '125px', icon: 32, title: '18px', sub: '13px'
                    } : {
                      width: '190px', height: '340px', borderRadius: '95px', icon: 24, title: '15px', sub: '11px'
                    };

                    if (isSuper) {
                      return (
                        <motion.div
                          key="super-agent"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className="relative"
                          style={{ animation: 'superFloat 12s cubic-bezier(0.22,1,0.36,1) infinite', zIndex }}
                        >
                          <div
                            className={`relative flex flex-col items-center justify-center text-center bg-white ${workflowState === 'PROPOSALS_READY' ? 'super-agent-success' : 'super-agent-glow'}`}
                            style={{
                              width: styleObj.width,
                              height: styleObj.height,
                              borderRadius: styleObj.borderRadius,
                              border: workflowState === 'PROPOSALS_READY' ? '2px solid rgba(47,128,237,0.3)' : '1px solid rgba(47,128,237,0.1)',
                              padding: '50px 24px',
                              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            }}
                          >
                            {/* Pulsing rings — only in success state */}
                            {workflowState === 'PROPOSALS_READY' && (
                              <>
                                <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{
                                  width: '108%', height: '108%',
                                  borderRadius: styleObj.borderRadius,
                                  border: '2px solid rgba(47,128,237,0.15)',
                                  animation: 'successRing 3s ease-in-out infinite',
                                }} />
                                <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{
                                  width: '116%', height: '116%',
                                  borderRadius: styleObj.borderRadius,
                                  border: '1px solid rgba(47,128,237,0.08)',
                                  animation: 'successRing 3s ease-in-out 0.5s infinite',
                                }} />
                              </>
                            )}

                            {/* Orbital ring — only during processing */}
                            {workflowState !== 'PROPOSALS_READY' && (
                              <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{
                                width: '110%', height: '110%',
                                borderRadius: '50%',
                                border: '1px dashed rgba(47,128,237,0.15)',
                                animation: 'orbitalRing 20s linear infinite',
                              }} />
                            )}

                            {/* Scanning beam */}
                            {workflowState !== 'VALIDATION' && workflowState !== 'GENERATING_PROPOSALS' && workflowState !== 'PROPOSALS_READY' && (
                              <div className="absolute left-[10%] right-[10%] h-[2px] pointer-events-none" style={{
                                background: 'linear-gradient(90deg, transparent, rgba(47,128,237,0.5), transparent)',
                                animation: 'scanBeam 2.5s ease-in-out infinite',
                                borderRadius: '1px',
                              }} />
                            )}

                            {/* Pin dot at the top edge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[45%] w-6 h-6 rounded-full bg-[#f0f9ff] border-4 border-white shadow-sm z-10" />

                            {workflowState === 'PROPOSALS_READY' ? (
                              <>
                                {/* ═══ RESULTS INLINE — Super Agent shows final results ═══ */}
                                <div className="flex items-center justify-center mb-4 pt-4">
                                  <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="bg-emerald-50 p-3 rounded-full border-2 border-emerald-200"
                                  >
                                    <CheckCircle2 size={32} className="text-emerald-600" />
                                  </motion.div>
                                </div>

                                <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em' }}>
                                  Voyage Prêt
                                </h3>
                                <p style={{ fontSize: '13px', fontWeight: 500, color: '#667085', marginTop: '4px' }}>
                                  4 agents validés
                                </p>

                                {/* Route summary */}
                                <div className="flex items-center justify-center gap-1 mt-4 flex-wrap px-4">
                                  {destinations.filter(d => d.city.trim()).map((d, i) => (
                                    <span key={d.id} className="flex items-center text-xs font-medium text-luna-charcoal">
                                      {i > 0 && <ArrowRight size={10} className="mx-1 text-sky-500" />}
                                      <MapPin size={10} className="mr-0.5 text-sky-500" />{d.city.split(',')[0]}
                                    </span>
                                  ))}
                                </div>

                                {/* Mini result cards */}
                                <div className="grid grid-cols-2 gap-2 mt-6 px-4 w-full">
                                  {[
                                    { icon: '✈️', label: 'Vol', value: agentResults?.transport?.flights?.[0]?.airline || 'Vol trouvé', sub: agentResults?.transport?.flights?.[0]?.price || '' },
                                    { icon: '🏨', label: 'Hôtel', value: agentResults?.accommodation?.hotels?.[0]?.name?.substring(0, 15) || 'Hôtel trouvé', sub: agentResults?.accommodation?.hotels?.[0]?.pricePerNight || '' },
                                    { icon: '📅', label: 'Planning', value: `${agentResults?.itinerary?.days?.length || '?'} jours`, sub: 'Optimisé' },
                                    { icon: '👤', label: 'Profil', value: agentResults?.client?.profile?.segment || 'Analysé', sub: 'IA' },
                                  ].map((item, idx) => (
                                    <motion.div key={idx}
                                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.2 + idx * 0.1 }}
                                      className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center"
                                    >
                                      <span className="text-lg">{item.icon}</span>
                                      <p className="text-[11px] font-semibold text-gray-800 mt-1 truncate">{item.value}</p>
                                      <p className="text-[10px] text-gray-400">{item.sub}</p>
                                    </motion.div>
                                  ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 mt-6 px-6 w-full">
                                  <button onClick={handleExportToCRM} disabled={isExporting}
                                    className="w-full py-3 bg-luna-charcoal hover:bg-[#1a1a1a] text-white font-medium text-sm tracking-wider uppercase rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-70">
                                    {isExporting ? 'Exportation...' : 'Exporter vers CRM'} <Send size={14} />
                                  </button>
                                  <button onClick={resetWorkflow}
                                    className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium text-xs rounded-2xl transition-all">
                                    Nouveau Voyage
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* ═══ PROCESSING STATE — Normal Super Agent ═══ */}
                                <div className="flex items-center justify-center mb-6 pt-4">
                                  <img src="/luna-logo-blue.svg" alt="LUNA" className="h-16 w-auto object-contain" />
                                </div>

                                <h3 style={{ fontSize: styleObj.title, fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                  Super Agent
                                </h3>
                                <p style={{ fontSize: styleObj.sub, fontWeight: 500, color: '#667085', marginTop: '6px' }}>
                                  Orchestration IA
                                </p>

                                <div className="flex items-center gap-2 mt-10 bg-sky-50/70 px-4 py-2 rounded-full border border-sky-100/50">
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 bg-sky-500" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                                  </span>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#0B1220' }}>
                                    {workflowState === 'ANALYSING' && 'Analyse en cours…'}
                                    {workflowState === 'DISTRIBUTING' && 'Distribution en cours…'}
                                    {workflowState === 'AGENTS_WORKING' && 'Recherche parallèle…'}
                                    {workflowState === 'VALIDATION' && `${validatedAgents.length}/4 agents validés`}
                                    {workflowState === 'GENERATING_PROPOSALS' && 'Finalisation du devis…'}
                                  </span>
                                </div>

                                {/* Magic Progress bar */}
                                <div style={{ width: '60%', height: '4px', background: '#F2F4F7', borderRadius: '2px', marginTop: '24px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: workflowState === 'VALIDATION' ? '100%' : workflowState === 'AGENTS_WORKING' ? '60%' : '30%',
                                    height: '100%', borderRadius: '2px', background: '#2F80ED',
                                    transition: 'width 1s ease',
                                  }} />
                                </div>

                                <div className="flex items-center gap-2 mt-6">
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#2F80ED', background: 'rgba(47,128,237,0.08)', padding: '4px 12px', borderRadius: '14px' }}>
                                    4 Agents
                                  </span>
                                </div>
                              </>
                            )}
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
                    const isReady = workflowState === 'PROPOSALS_READY' || workflowState === 'GENERATING_PROPOSALS';

                    return (
                      <motion.div
                        key={agentKey}
                        initial={{ opacity: 0, scale: 0.6, y: 20 }}
                        animate={{
                          opacity: isReady ? 0 : isActive ? 1 : 0.4,
                          scale: isReady ? 0.5 : isActive ? 1 : 0.95,
                          y: 0,
                        }}
                        transition={isReady
                          ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                          : { delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                        }
                        className={`relative ${canValidate ? 'cursor-pointer' : ''} ${isReady ? 'pointer-events-none' : ''}`}
                        onClick={() => canValidate && setSelectedAgent(agentKey)}
                        style={{ animation: isActive && !isValidated && !isReady ? `agentFloat ${floatDur}s cubic-bezier(0.22,1,0.36,1) infinite` : undefined, zIndex }}
                      >
                        <div
                          className={`relative flex flex-col items-center justify-center text-center transition-all duration-300 bg-white ${isActive && !isValidated ? 'agent-active-glow' : ''} ${isValidated ? 'agent-validated-glow' : ''}`}
                          style={{
                            width: styleObj.width,
                            height: styleObj.height,
                            borderRadius: styleObj.borderRadius,
                            border: isValidated ? '1px solid rgba(16,185,129,0.3)' : isActive ? '1px solid rgba(47,128,237,0.15)' : '1px solid rgba(0,0,0,0.03)',
                            boxShadow: isValidated
                              ? '0 0 0 4px rgba(16,185,129,0.05), 0 20px 40px -10px rgba(16,185,129,0.1)'
                              : '0 20px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
                            padding: isInner ? '40px 16px' : '30px 12px',
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            transform: canValidate ? 'scale(1.02)' : 'scale(1)',
                          }}
                        >
                          {/* Pin dot at the top edge */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[45%] w-5 h-5 rounded-full bg-[#f8fafc] border-[3px] border-white shadow-sm z-10" />

                          {/* Status badge */}
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 h-6">
                            {isValidated ? (
                              <div className="relative">
                                {/* Shockwave ring */}
                                <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border-2 border-emerald-400 agent-shockwave" />
                                {/* Bouncing check */}
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="rounded-full bg-emerald-50 text-emerald-500 p-0.5 shadow-sm check-bounce">
                                  <CheckCircle2 size={isInner ? 18 : 14} />
                                </motion.div>
                              </div>
                            ) : canValidate ? (
                              <div className="w-3 h-3 rounded-full animate-pulse bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] mt-1" />
                            ) : isActive ? (
                              <Loader2 size={14} className="animate-spin text-slate-400 mt-1" />
                            ) : null}
                          </div>

                          {/* Icon */}
                          <div className="flex items-center justify-center flex-shrink-0 mb-4 mt-12">
                            <Icon size={styleObj.icon} strokeWidth={1.5} style={{ color: isValidated ? '#10b981' : '#2F80ED' }} />
                          </div>

                          <h3 style={{ fontSize: styleObj.title, fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                            {meta.title}
                          </h3>
                          <p style={{ fontSize: styleObj.sub, fontWeight: 500, color: '#667085', marginTop: '4px' }}>
                            {meta.subtitle}
                          </p>

                          {!isOuter && (
                            <p style={{ fontSize: '13px', color: '#667085', opacity: 0.7, marginTop: '16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', padding: '0 8px' }}>
                              {meta.desc}
                            </p>
                          )}

                          {/* Progress animation — shimmer bar when active */}
                          <div className="mt-auto mb-4 w-full flex justify-center">
                            {isActive && !isValidated && (
                              <div style={{ width: '50%', height: '3px', background: '#F2F4F7', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                  width: '40%', height: '100%', borderRadius: '2px',
                                  background: 'linear-gradient(90deg, rgba(47,128,237,0.3), rgba(47,128,237,0.7), rgba(47,128,237,0.3))',
                                  animation: 'shimmerProgress 1.5s ease-in-out infinite',
                                }} />
                              </div>
                            )}
                            {isValidated && (
                              <div style={{ width: '50%', height: '3px', background: '#ECFDF5', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '2px', background: '#10b981' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
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

                      {/* ── Accommodation: Hotels (grouped by destination) ── */}
                      {selectedAgent === 'accommodation' && data?.hotels?.length > 0 && (() => {
                        // Group hotels by destination
                        const grouped: Record<string, any[]> = {};
                        data.hotels.forEach((h: any) => {
                          const dest = h.destination || 'Non précisé';
                          if (!grouped[dest]) grouped[dest] = [];
                          grouped[dest].push(h);
                        });
                        const destKeys = Object.keys(grouped);
                        const isMulti = destKeys.length > 1;

                        return (
                          <div style={{ marginBottom: '28px' }}>
                            {destKeys.map((destName, di) => (
                              <div key={destName} style={{ marginBottom: di < destKeys.length - 1 ? '32px' : '0' }}>
                                {/* Destination Header (only shown if multi-destination) */}
                                {isMulti && (
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 18px', borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${['#EFF6FF', '#F0FDF4', '#FEF3C7', '#FDF2F8'][di % 4]}, white)`,
                                    border: `1px solid ${['#BFDBFE', '#BBF7D0', '#FDE68A', '#FBCFE8'][di % 4]}`,
                                    marginBottom: '14px',
                                  }}>
                                    <MapPin size={16} style={{ color: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'][di % 4] }} />
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0B1220' }}>
                                      {destName}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#667085', marginLeft: 'auto' }}>
                                      {grouped[destName].length} hôtel{grouped[destName].length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                                {!isMulti && (
                                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                                    🏨 Hôtels sélectionnés ({data.hotels.length})
                                  </h4>
                                )}
                                <div className="space-y-3">
                                  {grouped[destName].map((h: any, i: number) => (
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
                            ))}
                          </div>
                        );
                      })()}

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
                                  <div className="flex-1 min-w-0">
                                    <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1220' }}>{d.title}</h5>
                                    {d.destination && (
                                      <span style={{
                                        fontSize: '11px', fontWeight: 600, color: '#3B82F6',
                                        background: '#EFF6FF', padding: '2px 10px', borderRadius: '20px',
                                        display: 'inline-block', marginTop: '4px',
                                        border: '1px solid #BFDBFE'
                                      }}>
                                        📍 {d.destination}
                                      </span>
                                    )}
                                  </div>
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
        <LunaLogo size={44} />
      </div>

      {/* Footer copyright */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 text-center py-3">
        <p className="text-[12px] text-gray-400 tracking-wider">© 2026 Luna — Concierge Voyage</p>
      </footer>
    </div>
  );
}
