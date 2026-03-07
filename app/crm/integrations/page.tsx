'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, Check, Zap, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  connected: boolean;
  configUrl?: string;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'amadeus', name: 'Amadeus', description: 'GDS mondial pour vols, hôtels et locations de voitures en temps réel.', category: 'GDS', logo: '✈️', connected: false, configUrl: 'https://developers.amadeus.com/' },
  { id: 'booking', name: 'Booking.com', description: 'Recherche et réservation d\'hôtels via l\'API Booking.com.', category: 'Hébergement', logo: '🏨', connected: true },
  { id: 'stripe', name: 'Stripe', description: 'Paiements par carte bancaire sécurisés depuis la facturation.', category: 'Paiement', logo: '💳', connected: false, configUrl: 'https://dashboard.stripe.com/' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Synchronisation automatique factures et comptabilité.', category: 'Comptabilité', logo: '📊', connected: false },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Envoi de devis et messages clients via WhatsApp.', category: 'Communication', logo: '💬', connected: false },
  { id: 'google_calendar', name: 'Google Calendar', description: 'Synchronisation du planning CRM avec votre agenda Google.', category: 'Productivité', logo: '📅', connected: true },
  { id: 'twilio', name: 'Twilio', description: 'Notifications SMS automatiques aux clients.', category: 'Communication', logo: '📱', connected: false },
  { id: 'aviationstack', name: 'AviationStack', description: 'Suivi de vols en temps réel pour la carte interactive.', category: 'Données', logo: '🛩️', connected: true },
  { id: 'gemini', name: 'Google Gemini', description: 'IA avancée pour l\'analyse client, itinéraires et recommandations.', category: 'Intelligence Artificielle', logo: '🧠', connected: true },
  { id: 'notebooklm', name: 'NotebookLM', description: 'Recherche augmentée par IA — analyse de documents, guides de voyage et sources fiables pour enrichir les recommandations.', category: 'Intelligence Artificielle', logo: '📓', connected: false, configUrl: 'https://notebooklm.google.com/' },
  { id: 'gmail', name: 'Gmail API', description: 'Réception et envoi d\'emails directement depuis la boîte de réception CRM.', category: 'Communication', logo: '📧', connected: true },
  { id: 'mapbox', name: 'Mapbox', description: 'Géocodage et autocomplétion des destinations de voyage.', category: 'Données', logo: '🗺️', connected: true },
];

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS);
  const [saving, setSaving] = useState<string | null>(null);
  const { tenantId } = useAuth();

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

    // Update local state immediately
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: newState } : i));

    // Persist to Firestore
    if (tenantId) {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, {
          [`settings.integrations.${id}`]: newState,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error('Failed to save integration state:', err);
        // Revert on error
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
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-normal text-luna-charcoal mb-1"><T>Intégrations</T></h1>
          <p className="text-sm text-luna-text-muted">Connectez et gérez vos outils externes. Activez ou désactivez chaque service.</p>
        </div>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Chercher une intégration (Amadeus, NotebookLM, etc.)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-sm shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
        />
      </div>

      {/* Connected / Active */}
      {connected.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-normal text-luna-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={14} className="text-emerald-500" /> Actives ({connected.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connected.map(integ => (
              <div key={integ.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm relative overflow-hidden group">
                {/* Toggle switch */}
                <button
                  onClick={() => toggleIntegration(integ.id)}
                  className="absolute top-4 right-4 transition-all hover:scale-110"
                  title={integ.connected ? 'Désactiver' : 'Activer'}
                >
                  {saving === integ.id ? (
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ToggleRight size={28} className="text-emerald-500" />
                  )}
                </button>

                <div className="text-3xl mb-3">{integ.logo}</div>
                <h3 className="text-base font-normal text-luna-charcoal mb-1">{integ.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{integ.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-normal bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">{integ.category}</span>
                  {integ.configUrl && (
                    <a href={integ.configUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={10} /> Config
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available / Inactive */}
      {available.length > 0 && (
        <div>
          <h2 className="text-sm font-normal text-luna-charcoal uppercase tracking-wider mb-4">Disponibles ({available.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map(integ => (
              <div key={integ.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                {/* Toggle switch */}
                <button
                  onClick={() => toggleIntegration(integ.id)}
                  className="absolute top-4 right-4 transition-all hover:scale-110"
                  title="Activer"
                >
                  {saving === integ.id ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-300 group-hover:text-gray-400" />
                  )}
                </button>

                <div className="text-3xl mb-3 opacity-60">{integ.logo}</div>
                <h3 className="text-base font-normal text-luna-charcoal mb-1">{integ.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{integ.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">{integ.category}</span>
                  {integ.configUrl && (
                    <a href={integ.configUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
}
