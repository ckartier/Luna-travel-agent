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
  Bot,
  Radio,
  Navigation2,
  Building2,
  Compass,
  Fingerprint,
  Zap,
  ImageIcon,
  Sparkles,
  Heart,
  Wine,
  Briefcase,
  Mountain,
  TreePalm,
  Gem
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, createContact, createTrip, createTripDay, CRMTripSegment } from '@/src/lib/firebase/crm';
import { LunaLogo } from '@/app/components/LunaLogo';
import { PdfExport } from '@/app/components/PdfExport';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import 'mapbox-gl/dist/mapbox-gl.css';

type WorkflowState = 'IDLE' | 'ANALYSING' | 'DISTRIBUTING' | 'AGENTS_WORKING' | 'VALIDATION' | 'GENERATING_PROPOSALS' | 'PROPOSALS_READY';

const agentMeta = {
  transport: { title: 'Transport', subtitle: 'Vols & Routings', desc: 'Recherche des meilleurs vols directs et avec escales, analyse tarifaire multi-compagnies', icon: Navigation2, angle: -90, color: '#b9dae9', gradient: 'from-[#b9dae9] to-[#a5cadc]', pastelBg: 'bg-[#b9dae9]/10', pastelText: 'text-black', pastelBorder: 'border-[#b9dae9]/20', pastelRing: 'ring-[#b9dae9]/30' },
  accommodation: { title: 'Hébergement', subtitle: 'Hôtels & Resorts', desc: 'Sélection premium des établissements, vérification disponibilités et tarifs négociés', icon: Building2, angle: 180, color: '#b9dae9', gradient: 'from-[#b9dae9] to-[#a5cadc]', pastelBg: 'bg-[#b9dae9]/10', pastelText: 'text-black', pastelBorder: 'border-[#b9dae9]/20', pastelRing: 'ring-[#b9dae9]/30' },
  client: { title: 'Profil Client', subtitle: 'CRM Analyse', desc: 'Analyse du profil voyageur, préférences historiques et recommandations personnalisées', icon: Fingerprint, angle: 0, color: '#b9dae9', gradient: 'from-[#b9dae9] to-[#a5cadc]', pastelBg: 'bg-[#b9dae9]/10', pastelText: 'text-black', pastelBorder: 'border-[#b9dae9]/20', pastelRing: 'ring-[#b9dae9]/30' },
  itinerary: { title: 'Itinéraire', subtitle: 'Planning Jour/Jour', desc: 'Construction de l\'itinéraire optimisé, activités et transferts coordonnés', icon: Compass, angle: 90, color: '#b9dae9', gradient: 'from-[#b9dae9] to-[#a5cadc]', pastelBg: 'bg-[#b9dae9]/10', pastelText: 'text-black', pastelBorder: 'border-[#b9dae9]/20', pastelRing: 'ring-[#b9dae9]/30' },
};

type AgentKey = keyof typeof agentMeta;

interface Destination {
  id: string;
  city: string;
}

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

export default function DashboardPageWrapper({ initialParams }: { initialParams?: Record<string, string> | null }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luna-bg" />}>
      <DashboardPage initialParams={initialParams} />
    </Suspense>
  );
}

function DashboardPage({ initialParams }: { initialParams?: Record<string, string> | null }) {
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
    // Skip restore if we have fresh initialParams from CRM pipeline
    if (initialParams && Object.keys(initialParams).length > 0) return;
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

  // ── Pre-fill from initialParams (from CRM pipeline / Agent Voyage button) ──
  const initialParamsApplied = useRef(false);
  useEffect(() => {
    if (initialParams && !initialParamsApplied.current) {
      initialParamsApplied.current = true;
      // Always reset state when coming from pipeline with fresh params
      setWorkflowState('IDLE');
      setAgentResults(null);
      setValidatedAgents([]);
      setActiveAgents([]);
      const dest = initialParams.dest;
      if (dest) {
        const destList = dest.split('|').map(d => d.trim()).filter(Boolean);
        setDestinations(destList.map((d, i) => ({ id: String(i + 1), city: d })));
      }
      if (initialParams.from) setDepartureCity(initialParams.from);
      if (initialParams.dep) setDepartureDate(initialParams.dep);
      if (initialParams.ret) setReturnDate(initialParams.ret);
      if (initialParams.budget) setBudget(initialParams.budget);
      if (initialParams.pax) setPax(initialParams.pax);
      if (initialParams.vibe) setVibe(initialParams.vibe);
      if (initialParams.notes) setMustHaves(initialParams.notes);
      if (initialParams.autoStart === 'true' && dest) {
        setTimeout(() => {
          setValidatedAgents([]);
          setActiveAgents([]);
          setAgentResults(null);
          setWorkflowState('ANALYSING');
        }, 500);
      }
    }
  }, [initialParams]);

  // Auto-fill from CRM (URL params like ?dest=Bangkok&pax=2&budget=5000)
  const searchParams = useSearchParams();
  useEffect(() => {
    // Skip URL-based pre-fill if initialParams were provided
    if (initialParams) return;
    
    const autoStart = searchParams?.get('autoStart');
    const dest = searchParams?.get('dest');

    // If autoStart from pipeline, allow overriding even PROPOSALS_READY
    if (autoStart === 'true' && dest) {
      const destList = dest.split('|').map(d => d.trim()).filter(Boolean);
      setDestinations(destList.map((d, i) => ({ id: String(i + 1), city: d })));
      if (searchParams?.get('from')) setDepartureCity(searchParams?.get('from')!);
      if (searchParams?.get('dep')) setDepartureDate(searchParams?.get('dep')!);
      if (searchParams?.get('ret')) setReturnDate(searchParams?.get('ret')!);
      if (searchParams?.get('budget')) setBudget(searchParams?.get('budget')!);
      if (searchParams?.get('pax')) setPax(searchParams?.get('pax')!);
      if (searchParams?.get('vibe')) setVibe(searchParams?.get('vibe')!);
      if (searchParams?.get('notes')) setMustHaves(searchParams?.get('notes')!);
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
    if (searchParams?.get('from')) setDepartureCity(searchParams?.get('from')!);
    if (searchParams?.get('dep')) setDepartureDate(searchParams?.get('dep')!);
    if (searchParams?.get('ret')) setReturnDate(searchParams?.get('ret')!);
    if (searchParams?.get('budget')) setBudget(searchParams?.get('budget')!);
    if (searchParams?.get('pax')) setPax(searchParams?.get('pax')!);
    if (searchParams?.get('vibe')) setVibe(searchParams?.get('vibe')!);
    if (searchParams?.get('notes')) setMustHaves(searchParams?.get('notes')!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialParams]);

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
          // Send reduced budget to AI so it finds cheaper options → agent applies 35% markup
          budget: (() => {
            const raw = parseInt((budget || '').replace(/[^\d]/g, '')) || 0;
            if (raw > 0) return String(Math.round(raw * 0.65)) + ' €';
            return budget; // If no numeric budget, send as-is
          })(),
          pax,
          vibe,
          mustHaves,
          inspirationImages // Send base64 images down to the agent backend!
        }),
      });
      const data = await res.json();
      setAgentResults(data);

      // Auto-validate all agents and proceed directly to results
      const allAgents: AgentKey[] = ['transport', 'accommodation', 'client', 'itinerary'];
      setValidatedAgents(allAgents);
      setWorkflowState('GENERATING_PROPOSALS');

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
      // Even on error, auto-validate and show whatever we have
      setValidatedAgents(['transport', 'accommodation', 'client', 'itinerary']);
      setWorkflowState('PROPOSALS_READY');
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
    setInspirationImages([]);
    // Clear saved results
    try { localStorage.removeItem('luna_last_results'); } catch { /* silent */ }
  };

  const handleExportToCRM = async () => {
    if (!tenantId) {
      alert('Erreur : vous devez être connecté pour exporter vers le CRM. Vérifiez votre session.');
      return;
    }
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
          color: '#b9dae9', // LUNA Blue
        });

        // Add Days based on agent results
        if (agentResults?.itinerary?.days && tripId) {
          await Promise.all(agentResults.itinerary.days.map((d: any, i: number) => {
            const dateObj = new Date(startDateVal);
            dateObj.setDate(dateObj.getDate() + i);
            const dayDateStr = dateObj.toISOString().split('T')[0];

            const rawBudget = parseInt((budget || '').replace(/[^\d]/g, '')) || 0;
            const dailyBudget = d.daysCount ? rawBudget / d.daysCount : rawBudget / agentResults.itinerary.days.length;
            const activityBudget = Math.round(dailyBudget * 0.3) || 150; // Assume 30% of daily budget goes to activities
            const margin = 0.35;
            const netPrice = Math.round(activityBudget * (1 - margin));

            const segments: CRMTripSegment[] = [];
            if (d.morning) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Matin', timeSlot: 'Morning', description: d.morning, bookingUrl: d.morningUrl || '', clientPrice: activityBudget, netCost: netPrice, markupPercent: Math.round(margin * 100), bookingStatus: 'PROPOSED' });
            }
            if (d.afternoon) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Après-midi', timeSlot: 'Afternoon', description: d.afternoon, bookingUrl: d.afternoonUrl || '', clientPrice: activityBudget, netCost: netPrice, markupPercent: Math.round(margin * 100), bookingStatus: 'PROPOSED' });
            }
            if (d.evening) {
              segments.push({ id: crypto.randomUUID(), type: 'ACTIVITY', title: 'Soir', timeSlot: 'Evening', description: d.evening, bookingUrl: d.eveningUrl || '', clientPrice: activityBudget, netCost: netPrice, markupPercent: Math.round(margin * 100), bookingStatus: 'PROPOSED' });
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
    <div ref={containerRef} className="relative w-full flex flex-col">
      {/* Clean background — no animated capsules/globe */}

      {/* ═══ HUB LINK — top-left, same position on both agents ═══ */}


      {/* Weather Widgets (real API) */}
      <div className="weather-sidebar absolute top-16 right-3 md:top-20 md:right-5 z-40 w-[220px] md:w-[260px] hidden md:block">
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
            /* ── STRONGER HALO — much more visible ── */
            @keyframes glowPulse {
              0%, 100% {
                box-shadow:
                  0 0 30px 10px rgba(47,128,237,0.25),
                  0 0 70px 20px rgba(47,128,237,0.12),
                  0 0 120px 40px rgba(47,128,237,0.05);
              }
              50% {
                box-shadow:
                  0 0 50px 18px rgba(47,128,237,0.45),
                  0 0 100px 35px rgba(47,128,237,0.2),
                  0 0 160px 60px rgba(47,128,237,0.08);
              }
            }
            @keyframes glowPulseGreen {
              0%, 100% {
                box-shadow:
                  0 0 30px 10px rgba(16,185,129,0.25),
                  0 0 70px 20px rgba(16,185,129,0.12),
                  0 0 120px 40px rgba(16,185,129,0.05);
              }
              50% {
                box-shadow:
                  0 0 50px 18px rgba(16,185,129,0.45),
                  0 0 100px 35px rgba(16,185,129,0.2),
                  0 0 160px 60px rgba(16,185,129,0.08);
              }
            }
            /* ── SUPER AGENT — massive halo ── */
            @keyframes superGlow {
              0%, 100% {
                box-shadow:
                  0 0 50px 15px rgba(47,128,237,0.3),
                  0 0 100px 35px rgba(47,128,237,0.15),
                  0 0 180px 60px rgba(99,102,241,0.08),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
              50% {
                box-shadow:
                  0 0 80px 30px rgba(47,128,237,0.5),
                  0 0 150px 55px rgba(47,128,237,0.25),
                  0 0 250px 90px rgba(99,102,241,0.12),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
            }
            /* ── ORBIT — faster ring ── */
            @keyframes orbitalRing {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            /* ── ORBIT PARTICLES — 3 dots circling ── */
            @keyframes orbitParticle1 {
              from { transform: rotate(0deg) translateX(55%) rotate(0deg); }
              to { transform: rotate(360deg) translateX(55%) rotate(-360deg); }
            }
            @keyframes orbitParticle2 {
              from { transform: rotate(120deg) translateX(55%) rotate(-120deg); }
              to { transform: rotate(480deg) translateX(55%) rotate(-480deg); }
            }
            @keyframes orbitParticle3 {
              from { transform: rotate(240deg) translateX(55%) rotate(-240deg); }
              to { transform: rotate(600deg) translateX(55%) rotate(-600deg); }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
              50% { opacity: 1; transform: scale(1) rotate(180deg); }
            }
            /* ── COMPLETION CELEBRATION ── */
            @keyframes celebrationBurst {
              0% { transform: scale(0.5); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.8; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes celebrationBorder {
              0% { border-color: rgba(16,185,129,0.2); }
              25% { border-color: rgba(47,128,237,0.4); }
              50% { border-color: rgba(168,85,247,0.4); }
              75% { border-color: rgba(16,185,129,0.4); }
              100% { border-color: rgba(47,128,237,0.2); }
            }
            @keyframes celebrationGlow {
              0%, 100% {
                box-shadow:
                  0 0 50px 15px rgba(16,185,129,0.3),
                  0 0 100px 40px rgba(47,128,237,0.15),
                  0 0 180px 70px rgba(168,85,247,0.08),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
              33% {
                box-shadow:
                  0 0 70px 25px rgba(47,128,237,0.4),
                  0 0 140px 55px rgba(168,85,247,0.2),
                  0 0 220px 85px rgba(16,185,129,0.1),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
              66% {
                box-shadow:
                  0 0 70px 25px rgba(168,85,247,0.35),
                  0 0 140px 55px rgba(16,185,129,0.2),
                  0 0 220px 85px rgba(47,128,237,0.1),
                  0 20px 50px -10px rgba(0,0,0,0.06);
              }
            }
            @keyframes successRing {
              0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.6; }
              50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.2; }
            }
            @keyframes confettiFloat {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-80px) rotate(720deg); opacity: 0; }
            }

            /* ── FASTER pulsation — 1.2s cycle ── */
            .agent-active-glow { animation: glowPulse 1.2s ease-in-out infinite; }
            .agent-validated-glow { animation: glowPulseGreen 1.2s ease-in-out infinite; }
            .super-agent-glow { animation: superGlow 1.5s ease-in-out infinite; }

            /* ── Celebration state for completion ── */
            .super-agent-success {
              animation: celebrationGlow 3s ease-in-out infinite, celebrationBorder 4s linear infinite;
            }
          `}</style>


        </>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 relative w-full flex flex-col" data-agent-wrapper>
        <div className="w-full relative z-30 pointer-events-auto flex-1 flex flex-col" data-agent-content>
          <AnimatePresence mode="wait">

            {/* ═══ IDLE: LUXURY CONCIERGE FORM ═══ */}
            {workflowState === 'IDLE' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full pb-6" data-agent-form
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[22px] font-medium text-[#2E2E2E] tracking-tight"
                        >
                            Que recherchez-vous ?
                        </motion.h1>
                        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#9CA3AF] mt-1">Expert Voyages IA</p>
                    </div>
                </div>

                <form id="voyage-form" onSubmit={handleStartAnalysis} className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">

                        {/* ═══ LEFT COLUMN — Destination & Inspiration ═══ */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-5"
                        >
                            {/* Section Label */}
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#b9dae9]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2E2E2E]/30">Destination & Envies</span>
                            </div>

                            {/* ── Big Destination Search ── */}
                            <div className="space-y-2">
                                <div className="relative">
                                    {destinations.map((d, i) => (
                                      <div key={d.id} className="relative group mb-2">
                                        <textarea
                                          autoFocus={i === 0}
                                          placeholder={i === 0 ? "Ex: villa avec vue mer pour 6 personnes à Ibiza\navec chef privé et bateau pour 3 jours" : "Ajouter une destination..."}
                                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none placeholder:text-gray-300 pr-12 text-gray-700 resize-none h-24 shadow-sm hover:shadow-md"
                                          value={d.city}
                                          onChange={e => updateDestination(d.id, e.target.value)}
                                          rows={2}
                                        />
                                        <div className="absolute right-4 top-4 flex items-center gap-2">
                                          {destinations.length > 1 && (
                                            <button type="button" onClick={() => removeDestination(d.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                              <X size={14} />
                                            </button>
                                          )}
                                          <MapPin className="text-gray-300" size={16} />
                                        </div>
                                      </div>
                                    ))}
                                </div>
                                {destinations.length < 4 && (
                                  <button type="button" onClick={addDestination} className="text-[10px] uppercase tracking-widest font-bold text-[#b9dae9] hover:text-[#5a8fa3] flex items-center gap-1.5 transition-colors ml-1 group">
                                      <Plus size={12} className="group-hover:rotate-90 transition-transform" /> Ajouter une destination
                                  </button>
                                )}
                            </div>

                            {/* ── Ambiance pills — SVG Icons ── */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E] mb-2.5 block">Style de voyage</span>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                      { id: "Détente & Bien-être", Icon: TreePalm },
                                      { id: "Aventure & Découverte", Icon: Mountain },
                                      { id: "Culture & Patrimoine", Icon: Gem },
                                      { id: "Tour gastronomique", Icon: Wine },
                                      { id: "Lune de Miel", Icon: Heart },
                                      { id: "Voyage d'Affaires", Icon: Briefcase },
                                    ].map((v, i) => (
                                      <motion.button
                                        key={v.id}
                                        type="button"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        onClick={() => setVibe(vibe === v.id ? '' : v.id)}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] transition-all border cursor-pointer ${vibe === v.id
                                          ? 'bg-[#2E2E2E] text-white border-[#2E2E2E] font-medium shadow-md scale-[1.03]'
                                          : 'bg-white text-[#2E2E2E]/60 border-gray-200 hover:border-[#5a8fa3]/30 hover:text-[#2E2E2E]/80 hover:shadow-sm'
                                        }`}
                                      >
                                        <v.Icon size={14} className={vibe === v.id ? 'text-white/80' : 'text-[#9CA3AF]'} />
                                        {v.id}
                                      </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Notes & Images (moved here for narrative flow) ── */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E] flex justify-between items-center">
                                    Notes particulières
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="text-gray-400 hover:text-[#5a8fa3] transition-colors flex items-center gap-1 normal-case tracking-normal"
                                    >
                                        <ImageIcon size={12} />
                                        <span className="text-[10px]">Photo d'inspiration ({inspirationImages.length}/3)</span>
                                    </button>
                                </label>
                                <textarea
                                    placeholder="Vol direct, vue mer, transferts privés..."
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none placeholder:text-gray-300 resize-none h-16 text-gray-700 shadow-sm"
                                    value={mustHaves}
                                    onChange={e => setMustHaves(e.target.value)}
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
                                    <div className="flex gap-2 mt-2">
                                        {inspirationImages.map((src, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                                                <img src={src} alt="Inspiration" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setInspirationImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* ═══ RIGHT COLUMN — Parameters ═══ */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-5"
                        >
                            {/* Section Label */}
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#5a8fa3]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2E2E2E]/30">Paramètres du voyage</span>
                            </div>

                            {/* Params container with subtle card */}
                            <div className="bg-[#FAFBFC] rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">

                                {/* Departure + Budget row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Départ de</label>
                                        <input
                                            type="text"
                                            placeholder="Paris"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none placeholder:text-gray-300 text-gray-700 shadow-sm"
                                            value={departureCity}
                                            onChange={e => setDepartureCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Budget</label>
                                        <input
                                            type="text"
                                            placeholder="10 000 €"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none placeholder:text-gray-300 text-gray-700 shadow-sm"
                                            value={budget}
                                            onChange={e => setBudget(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Dates row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Date départ</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none [color-scheme:light] text-gray-700 shadow-sm"
                                            value={departureDate}
                                            onChange={e => setDepartureDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Date retour</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none [color-scheme:light] text-gray-700 shadow-sm"
                                            value={returnDate}
                                            onChange={e => setReturnDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Pax + Flexibility row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Voyageurs</label>
                                        <input
                                            type="text"
                                            placeholder="2 adultes"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal focus:border-[#5a8fa3] focus:ring-2 focus:ring-[#b9dae9]/20 transition-all outline-none placeholder:text-gray-300 text-gray-700 shadow-sm"
                                            value={pax}
                                            onChange={e => setPax(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2E2E2E]">Flexibilité</label>
                                        <div className="flex gap-1">
                                            {['Exact', '+/- 3j', 'Mois'].map(opt => (
                                              <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFlexibility(opt === 'Exact' ? 'Dates Exactes' : opt === '+/- 3j' ? '+/- 3 Jours' : 'Mois Flexible')}
                                                className={`flex-1 px-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                  (opt === 'Exact' && flexibility === 'Dates Exactes') ||
                                                  (opt === '+/- 3j' && flexibility === '+/- 3 Jours') ||
                                                  (opt === 'Mois' && flexibility === 'Mois Flexible')
                                                    ? 'bg-[#2E2E2E] text-white shadow-sm'
                                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                                                }`}
                                              >
                                                {opt}
                                              </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── CTA — premium gradient ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="pt-2"
                            >
                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl text-[12px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#5a8fa3] to-[#3d7a91] text-white hover:shadow-[0_16px_50px_-8px_rgba(90,143,163,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative group overflow-hidden cursor-pointer shadow-lg shadow-[#5a8fa3]/20"
                                >
                                    <Sparkles size={16} className="relative z-10" />
                                    <span className="relative z-10">Lancer l'expert</span>
                                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                    />
                                </button>
                            </motion.div>
                        </motion.div>

                    </div>
                </form>
              </motion.div>
            )}


            {/* ═══ PROCESSING: 5 RECTANGULAR AGENT CARDS ═══ */}
            {
              isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-20 w-full py-6 px-2"
                >
                  {/* ── Super Agent Header Card ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                    className="mb-5"
                  >
                    <div className={`relative bg-white rounded-3xl border overflow-hidden transition-all duration-500 ${
                      workflowState === 'PROPOSALS_READY' 
                        ? 'border-emerald-200 shadow-[0_8px_40px_-8px_rgba(16,185,129,0.15)]' 
                        : 'border-[#b9dae9]/30 shadow-[0_8px_40px_-8px_rgba(185,218,233,0.2)]'
                    }`}>
                      <div className="flex items-center gap-5 px-7 py-5">
                        {/* Logo */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                          workflowState === 'PROPOSALS_READY'
                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100'
                            : 'bg-gradient-to-br from-[#b9dae9]/20 to-[#a5cadc]/30'
                        }`}>
                          {workflowState === 'PROPOSALS_READY' ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                              <CheckCircle2 size={32} className="text-emerald-500" />
                            </motion.div>
                          ) : (
                            <LunaLogo size={40} />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-[20px] font-bold text-[#0B1220] tracking-tight">
                            {workflowState === 'PROPOSALS_READY' ? 'Voyage Prêt' : 'Super Agent'}
                          </h2>
                          <p className="text-[12px] text-[#667085] font-medium mt-0.5">
                            {workflowState === 'PROPOSALS_READY' ? 'Curation IA Validée' : 'Orchestration 2026'}
                          </p>
                          {/* Route summary */}
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {destinations.filter(d => d.city.trim()).map((d, i) => (
                              <span key={d.id} className="flex items-center text-[11px] font-medium text-[#0B1220]/60">
                                {i > 0 && <ArrowRight size={9} className="mx-1 text-[#b9dae9]" />}
                                <MapPin size={9} className="mr-0.5 text-[#b9dae9]" />{d.city.split(',')[0]}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Status / Progress */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {workflowState !== 'PROPOSALS_READY' && (
                            <>
                              <div className="flex items-center gap-2 bg-[#b9dae9]/10 px-3.5 py-1.5 rounded-full border border-[#b9dae9]/20">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 bg-[#b9dae9]" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b9dae9]" />
                                </span>
                                <span className="text-[11px] font-semibold text-[#0B1220]">
                                  {workflowState === 'ANALYSING' && 'Analyse…'}
                                  {workflowState === 'DISTRIBUTING' && 'Distribution…'}
                                  {workflowState === 'AGENTS_WORKING' && 'Recherche…'}
                                  {workflowState === 'VALIDATION' && `${validatedAgents.length}/4`}
                                  {workflowState === 'GENERATING_PROPOSALS' && 'Finalisation…'}
                                </span>
                              </div>
                              {/* Mini progress bar */}
                              <div className="w-24 h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-[#b9dae9]"
                                  animate={{
                                    width: workflowState === 'VALIDATION' ? '100%' : workflowState === 'AGENTS_WORKING' ? '60%' : workflowState === 'GENERATING_PROPOSALS' ? '90%' : '30%'
                                  }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                />
                              </div>
                            </>
                          )}
                          {workflowState === 'PROPOSALS_READY' && (
                            <div className="flex gap-2">
                              <button onClick={handleExportToCRM} disabled={isExporting}
                                className="px-5 py-2.5 bg-[#0B1220] hover:bg-[#1a2535] text-white font-semibold text-[11px] tracking-wider uppercase rounded-2xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-70">
                                {isExporting ? 'Export…' : 'Exporter CRM'} <Send size={13} />
                              </button>
                              <button onClick={resetWorkflow}
                                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold text-[11px] rounded-2xl transition-all">
                                Nouveau
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* ── 4 Agent Cards Grid ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['transport', 'accommodation', 'itinerary', 'client'] as AgentKey[]).map((agentKey, idx) => {
                      const meta = agentMeta[agentKey];
                      const Icon = meta.icon;
                      const isActive = activeAgents.includes(agentKey);
                      const isValidated = validatedAgents.includes(agentKey);
                      const isReady = workflowState === 'PROPOSALS_READY' || workflowState === 'GENERATING_PROPOSALS';
                      const canInspect = isReady && agentResults;

                      // Mini result preview data
                      const resultPreview = agentResults ? {
                        transport: { value: agentResults?.transport?.flights?.[0]?.airline || 'Vol trouvé', sub: agentResults?.transport?.flights?.[0]?.price || '', emoji: '✈️' },
                        accommodation: { value: agentResults?.accommodation?.hotels?.[0]?.name?.substring(0, 20) || 'Hôtel trouvé', sub: agentResults?.accommodation?.hotels?.[0]?.pricePerNight || '', emoji: '🏨' },
                        itinerary: { value: `${agentResults?.itinerary?.days?.length || '?'} jours`, sub: 'Planning optimisé', emoji: '📅' },
                        client: { value: agentResults?.client?.profile?.segment || 'Analysé', sub: 'Profil IA', emoji: '👤' },
                      }[agentKey] : null;

                      return (
                        <motion.div
                          key={agentKey}
                          initial={{ opacity: 0, y: 25, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
                          whileHover={canInspect ? { y: -4, scale: 1.02 } : {}}
                          onClick={() => canInspect && setSelectedAgent(agentKey)}
                          className={`relative group ${canInspect ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`relative bg-white rounded-3xl border p-5 flex flex-col min-h-[200px] transition-all duration-300 ${
                            isValidated
                              ? 'border-emerald-200 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.12)]'
                              : isActive
                                ? 'border-[#b9dae9]/40 shadow-[0_8px_30px_-8px_rgba(185,218,233,0.2)]'
                                : 'border-gray-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)]'
                          } ${canInspect ? 'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] hover:border-[#b9dae9]/50' : ''}`}>

                            {/* Top Row: Icon + Status */}
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                isValidated
                                  ? 'bg-emerald-50'
                                  : isActive
                                    ? 'bg-[#b9dae9]/15'
                                    : 'bg-gray-50'
                              }`}>
                                <Icon size={22} strokeWidth={1.5} className={`transition-colors duration-500 ${
                                  isValidated ? 'text-emerald-500' : isActive ? 'text-[#5a8fa3]' : 'text-gray-300'
                                }`} />
                              </div>

                              <div className="h-6 flex items-center">
                                {isValidated ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200"
                                  >
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Prêt</span>
                                  </motion.div>
                                ) : isActive ? (
                                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#b9dae9]/10 border border-[#b9dae9]/20">
                                    <Loader2 size={10} className="animate-spin text-[#5a8fa3]" />
                                    <span className="text-[9px] font-bold text-[#5a8fa3] uppercase tracking-wider">En cours</span>
                                  </div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                                )}
                              </div>
                            </div>

                            {/* Title + Subtitle */}
                            <h3 className={`text-[15px] font-bold tracking-tight transition-colors duration-300 ${
                              isActive || isValidated ? 'text-[#0B1220]' : 'text-gray-400'
                            }`}>{meta.title}</h3>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 transition-colors duration-300 ${
                              isActive || isValidated ? 'text-[#667085]' : 'text-gray-300'
                            }`}>{meta.subtitle}</p>

                            {/* Description */}
                            <p className={`text-[11px] leading-relaxed mt-2 transition-colors duration-300 line-clamp-2 ${
                              isActive || isValidated ? 'text-[#667085]/80' : 'text-gray-300'
                            }`}>{meta.desc}</p>

                            {/* Result Preview (animated stagger) */}
                            <div className="mt-auto pt-3">
                              <AnimatePresence>
                                {isValidated && resultPreview && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.15 + idx * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
                                    className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{resultPreview.emoji}</span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-semibold text-[#0B1220] truncate">{resultPreview.value}</p>
                                        <p className="text-[10px] text-gray-400">{resultPreview.sub}</p>
                                      </div>
                                      {canInspect && (
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-[#5a8fa3] transition-colors shrink-0" />
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Progress bar when active */}
                              {isActive && !isValidated && (
                                <div className="w-full h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{
                                    width: '40%',
                                    background: 'linear-gradient(90deg, rgba(90,143,163,0.3), rgba(90,143,163,0.7), rgba(90,143,163,0.3))',
                                    animation: 'shimmerProgress 1.5s ease-in-out infinite',
                                  }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )
            }

          </AnimatePresence >
        </div >
      </div >

      {/* ═══ AGENT VALIDATION MODAL — PREMIUM ═══ */}
      <AnimatePresence>
        {
          selectedAgent && agentResults && (
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
          )
        }
      </AnimatePresence >


    </div >
  );
}
