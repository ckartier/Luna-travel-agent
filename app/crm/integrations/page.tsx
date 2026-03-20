'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Zap, ToggleLeft, ToggleRight, Plane, Hotel, CreditCard, BarChart3, MessageCircle, CalendarDays, Smartphone, Navigation, Brain, BookOpen, Mail, MapPin, Image, Globe2, Sparkles, TrendingUp, AlertTriangle, Activity, Database, Cpu, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T, useAutoTranslate } from '@/src/components/T';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  connected: boolean;
  configUrl?: string;
}

interface APIUsage {
  name: string;
  icon: LucideIcon;
  used: number;
  limit: number;
  unit: string;
  color: string;
  cost: string;
  status: 'ok' | 'warning' | 'critical';
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'amadeus', name: 'Amadeus', description: 'GDS mondial pour vols, hôtels et locations de voitures en temps réel.', category: 'GDS', icon: Plane, connected: false, configUrl: 'https://developers.amadeus.com/' },
  { id: 'booking', name: 'Booking.com', description: 'Recherche et réservation d\'hôtels via l\'API Booking.com.', category: 'Hébergement', icon: Hotel, connected: true },
  { id: 'stripe', name: 'Stripe', description: 'Paiements par carte bancaire sécurisés depuis la facturation.', category: 'Paiement', icon: CreditCard, connected: false, configUrl: 'https://dashboard.stripe.com/' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Synchronisation automatique factures et comptabilité.', category: 'Comptabilité', icon: BarChart3, connected: false },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Envoi de devis et messages clients via WhatsApp.', category: 'Communication', icon: MessageCircle, connected: false },
  { id: 'google_calendar', name: 'Google Calendar', description: 'Synchronisation du planning CRM avec votre agenda Google.', category: 'Productivité', icon: CalendarDays, connected: true },
  { id: 'twilio', name: 'Twilio', description: 'Notifications SMS automatiques aux clients.', category: 'Communication', icon: Smartphone, connected: false },
  { id: 'aviationstack', name: 'AviationStack', description: 'Suivi de vols en temps réel pour la carte interactive.', category: 'Données', icon: Navigation, connected: true },
  { id: 'gemini', name: 'Google Gemini', description: 'IA avancée pour l\'analyse client, itinéraires et recommandations.', category: 'Intelligence Artificielle', icon: Brain, connected: true },
  { id: 'notebooklm', name: 'NotebookLM', description: 'Recherche augmentée par IA — analyse de documents, guides de voyage et sources fiables pour enrichir les recommandations.', category: 'Intelligence Artificielle', icon: BookOpen, connected: false, configUrl: 'https://notebooklm.google.com/' },
  { id: 'gmail', name: 'Gmail API', description: 'Réception et envoi d\'emails directement depuis la boîte de réception CRM.', category: 'Communication', icon: Mail, connected: true },
  { id: 'mapbox', name: 'Mapbox', description: 'Géocodage et autocomplétion des destinations de voyage.', category: 'Données', icon: MapPin, connected: true },
  { id: 'revolut', name: 'Revolut Business', description: 'Synchronisation bancaire — comptes, transactions et rapprochement automatique.', category: 'Banque', icon: CreditCard, connected: false, configUrl: '/crm/banking' },
];

// ═══ Circular Progress Component ═══
function CircularProgress({ percent, color, size = 56, strokeWidth = 4 }: { percent: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'consumption' | 'integrations' | 'enrichment'>('consumption');
  const { tenantId } = useAuth();
  const at = useAutoTranslate();

  // ═══ REAL API Usage Data from Firestore ═══
  const [apiUsage, setApiUsage] = useState<APIUsage[]>([]);
  const [totalCost, setTotalCost] = useState('0€');
  const [totalRequests, setTotalRequests] = useState(0);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageMonth, setUsageMonth] = useState('');

  const API_ICON_MAP: Record<string, LucideIcon> = {
    gemini: Brain, firecrawl: Globe2, whatsapp: MessageCircle,
    gmail: Mail, imageGen: Image, mapbox: MapPin, devisPdf: Database,
  };
  const API_COLOR_MAP: Record<string, string> = {
    gemini: '#4285F4', firecrawl: '#FF6B35', whatsapp: '#25D366',
    gmail: '#EA4335', imageGen: '#A855F7', mapbox: '#000000', devisPdf: '#5a8fa3',
  };

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const res = await fetchWithAuth('/api/crm/api-usage');
        if (res.ok) {
          const data = await res.json();
          const formatted: APIUsage[] = (data.apis || []).map((a: any) => ({
            name: a.name,
            icon: API_ICON_MAP[a.id] || Activity,
            used: a.used,
            limit: a.limit,
            unit: a.unit,
            color: API_COLOR_MAP[a.id] || '#6B7280',
            cost: a.cost,
            status: a.status,
          }));
          setApiUsage(formatted);
          setTotalCost(data.totalCost || '0€');
          setTotalRequests(data.totalRequests || 0);
          setUsageMonth(data.month || '');
        }
      } catch (err) {
        console.warn('Failed to load API usage:', err);
      } finally {
        setUsageLoading(false);
      }
    })();
  }, [tenantId]);

  // ═══ Enrichment Suggestions ═══
  const enrichments = [
    { name: 'PDF Generator', desc: 'Générez des devis, factures et carnets de voyage PDF premium avec la charte Luna.', icon: Database, category: 'Documents', difficulty: 'Facile', url: '/test-devis-luna.pdf' },
    { name: 'MCP Builder', desc: 'Créez des serveurs MCP pour connecter l\'Agent IA à des APIs externes (Amadeus, Stripe, etc.).', icon: Cpu, category: 'IA / API', difficulty: 'Avancé', url: 'https://modelcontextprotocol.io/' },
    { name: 'Viator API', desc: 'Catalogue mondial d\'activités et excursions à intégrer directement.', icon: Sparkles, category: 'Activités', difficulty: 'Moyen', url: 'https://partnerapi.viator.com/' },
    { name: 'OpenWeather', desc: 'Prévisions météo 7 jours pour chaque destination dans les itinéraires.', icon: Globe2, category: 'Données', difficulty: 'Facile', url: 'https://openweathermap.org/api' },
    { name: 'Unsplash API', desc: 'Photos haute qualité libres de droits pour enrichir les propositions.', icon: Image, category: 'Média', difficulty: 'Facile', url: 'https://unsplash.com/developers' },
    { name: 'Google Translate', desc: 'Traduction automatique des contenus pour clients internationaux.', icon: Globe2, category: 'i18n', difficulty: 'Facile', url: 'https://cloud.google.com/translate' },
    { name: 'Eleven Labs', desc: 'Synthèse vocale pour des présentations audio des itinéraires.', icon: Cpu, category: 'IA Audio', difficulty: 'Avancé', url: 'https://elevenlabs.io/docs' },
    { name: 'TripAdvisor', desc: 'Avis et notes des hôtels/restaurants pour valider les recommandations.', icon: TrendingUp, category: 'Avis', difficulty: 'Moyen', url: 'https://www.tripadvisor.com/developers' },
  ];

  // Load saved integration states from tenant settings
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        const snap = await getDoc(tenantRef);
        if (snap.exists()) {
          const data = snap.data();
          const savedStates = data?.settings?.integrations as Record<string, boolean> | undefined;
          if (savedStates) {
            setIntegrations(prev => prev.map(i => ({
              ...i,
              connected: savedStates[i.id] !== undefined ? savedStates[i.id] : i.connected,
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to load integration states:', err);
      }
    })();
  }, [tenantId]);

  const toggleIntegration = async (id: string) => {
    const integ = integrations.find(i => i.id === id);
    if (!integ) return;
    const newState = !integ.connected;
    setSaving(id);
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: newState } : i));
    if (tenantId) {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, { [`settings.integrations.${id}`]: newState, updatedAt: new Date() });
      } catch (err) {
        console.error('Failed to save integration state:', err);
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !newState } : i));
      }
    }
    setSaving(null);
  };

  const filteredIntegrations = integrations.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const connected = filteredIntegrations.filter(i => i.connected);
  const available = filteredIntegrations.filter(i => !i.connected);

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-20">
        {/* ═══ HEADER ═══ */}
        <div>
          <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Intégrations</T></h1>
          <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Connectez et gérez vos outils externes. Activez ou désactivez chaque service.</T></p>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 w-fit shadow-sm">
          {[
            { key: 'consumption', label: at('Consommation IA'), icon: Activity },
            { key: 'integrations', label: at('Intégrations'), icon: Zap },
            { key: 'enrichment', label: at('Enrichissement'), icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.key
                  ? 'bg-[#2E2E2E] text-white shadow-md'
                  : 'text-[#9CA3AF] hover:text-[#2E2E2E] hover:bg-gray-50'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: CONSOMMATION IA ═══ */}
        {activeTab === 'consumption' && (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2E2E2E] rounded-2xl p-6 text-white">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">{at('Coût mensuel estimé')}</p>
                <p className="text-3xl font-bold tracking-tight">{usageLoading ? '—' : totalCost}</p>
                <p className="text-xs text-white/50 mt-1">{usageMonth || at('Ce mois')}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{at('Requêtes totales')}</p>
                <p className="text-3xl font-bold text-[#2E2E2E] tracking-tight">{usageLoading ? '—' : totalRequests.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{at('Ce mois')}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{at('APIs actives')}</p>
                <p className="text-3xl font-bold text-[#2E2E2E] tracking-tight">{usageLoading ? '—' : apiUsage.filter(a => a.used > 0).length}</p>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={10} /> {at('Données réelles')}</p>
              </div>
            </div>

            {/* API Usage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiUsage.map(api => {
                const percent = Math.round((api.used / api.limit) * 100);
                const statusColor = api.status === 'critical' ? '#EF4444' : api.status === 'warning' ? '#F59E0B' : api.color;
                return (
                  <div key={api.name} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${api.color}12` }}>
                          <api.icon size={18} style={{ color: api.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#2E2E2E]">{api.name}</h3>
                          <p className="text-[10px] text-[#9CA3AF] font-medium">{api.cost}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <CircularProgress percent={percent} color={statusColor} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#2E2E2E]">{percent}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: statusColor }} />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#9CA3AF]">{api.used.toLocaleString('fr-FR')} {api.unit}</span>
                        <span className="text-[#9CA3AF]">{at('sur')} {api.limit.toLocaleString('fr-FR')}</span>
                      </div>
                      {api.status === 'warning' && (
                        <div className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                          <AlertTriangle size={10} className="text-amber-500" />
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">{at('Limite proche')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Usage Tips */}
            <div className="bg-gradient-to-r from-[#F8F6F3] to-[#F0F7FA] rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#bcdeea]/20 flex items-center justify-center shrink-0">
                <Database size={18} className="text-[#5a8fa3]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2E2E2E] mb-1">{at('Optimisation des coûts')}</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {at('Les requêtes Gemini représentent 37% de votre consommation. Activez le cache côté serveur pour réduire les appels répétitifs. WhatsApp Business facture 0.05€/message — consolidez les notifications.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: INTÉGRATIONS ═══ */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={at('Chercher une intégration...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-sm shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
              />
            </div>

            {connected.length > 0 && (
              <div>
                <h2 className="text-sm font-normal text-luna-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-emerald-500" /> {at('Actives')} ({connected.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connected.map(integ => (
                    <div key={integ.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm relative overflow-hidden group">
                      <button onClick={() => toggleIntegration(integ.id)} className="absolute top-4 right-4 transition-all hover:scale-110" title="Désactiver">
                        {saving === integ.id ? <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <ToggleRight size={28} className="text-emerald-500" />}
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                        <integ.icon size={20} strokeWidth={1.5} className="text-emerald-600" />
                      </div>
                      <h3 className="text-base font-normal text-luna-charcoal mb-1">{integ.name}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{integ.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-normal bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">{integ.category}</span>
                        {integ.configUrl && (
                          <a href={integ.configUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={10} /> Config
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {available.length > 0 && (
              <div>
                <h2 className="text-sm font-normal text-luna-charcoal uppercase tracking-wider mb-4">{at('Disponibles')} ({available.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {available.map(integ => (
                    <div key={integ.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                      <button onClick={() => toggleIntegration(integ.id)} className="absolute top-4 right-4 transition-all hover:scale-110" title="Activer">
                        {saving === integ.id ? <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> : <ToggleLeft size={28} className="text-gray-300 group-hover:text-gray-400" />}
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                        <integ.icon size={20} strokeWidth={1.5} className="text-gray-400" />
                      </div>
                      <h3 className="text-base font-normal text-luna-charcoal mb-1">{integ.name}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{integ.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">{integ.category}</span>
                        {integ.configUrl && (
                          <a href={integ.configUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={10} /> En savoir plus
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: ENRICHISSEMENT ═══ */}
        {activeTab === 'enrichment' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#2E2E2E] to-[#1a1a1a] rounded-2xl p-6 text-white">
              <h3 className="text-lg font-light tracking-tight mb-1">{at('APIs suggérées pour enrichir Luna')}</h3>
              <p className="text-xs text-white/50">{at('Découvrez de nouvelles intégrations pour améliorer l\'expérience client.')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichments.map(enr => (
                <div key={enr.name} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#bcdeea]/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#bcdeea]/10 border border-[#bcdeea]/20 flex items-center justify-center">
                      <enr.icon size={18} className="text-[#5a8fa3]" />
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      enr.difficulty === 'Facile' ? 'bg-emerald-50 text-emerald-600' :
                      enr.difficulty === 'Moyen' ? 'bg-amber-50 text-amber-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>{enr.difficulty}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#2E2E2E] mb-1">{enr.name}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{enr.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{enr.category}</span>
                    <a href={enr.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#5a8fa3] hover:text-[#4a7f93] flex items-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={10} /> {at('Explorer')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
