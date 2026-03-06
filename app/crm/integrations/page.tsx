'use client';

import { useState } from 'react';
import { Search, ExternalLink, Check, Zap, Plus } from 'lucide-react';

interface Integration {
    id: string;
    name: string;
    description: string;
    category: string;
    logo: string; // emoji placeholder
    connected: boolean;
}

const INTEGRATIONS: Integration[] = [
    { id: '1', name: 'Amadeus', description: 'Accédez au GDS mondial pour les vols, hôtels et locations de voitures.', category: 'GDS', logo: '✈️', connected: false },
    { id: '2', name: 'Booking.com', description: 'Recherchez et réservez des hôtels via l\'API Booking.com (RapidAPI).', category: 'Hébergement', logo: '🏨', connected: true },
    { id: '3', name: 'Stripe', description: 'Acceptez les paiements par carte depuis votre espace de facturation.', category: 'Paiement', logo: '💳', connected: false },
    { id: '4', name: 'QuickBooks', description: 'Synchronisez vos factures et paiements automatiquement.', category: 'Comptabilité', logo: '📊', connected: false },
    { id: '5', name: 'WhatsApp Business', description: 'Envoyez des messages clients depuis la boîte de messages intégrée.', category: 'Communication', logo: '💬', connected: false },
    { id: '6', name: 'Google Calendar', description: 'Synchronisez votre planning CRM avec votre calendrier Google.', category: 'Productivité', logo: '📅', connected: true },
    { id: '7', name: 'Twilio', description: 'Envoyez des notifications SMS à vos clients.', category: 'Communication', logo: '📱', connected: false },
    { id: '8', name: 'AviationStack', description: 'Suivi de vols en temps réel pour votre carte interactive.', category: 'Données', logo: '🛩️', connected: true },
];

export default function IntegrationsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIntegrations = INTEGRATIONS.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const connected = filteredIntegrations.filter(i => i.connected);
    const available = filteredIntegrations.filter(i => !i.connected);

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-luna-charcoal mb-1">Intégrations & Marketplace</h1>
                    <p className="text-sm text-luna-text-muted">Connectez vos outils externes pour automatiser votre agence.</p>
                </div>
            </div>

            <div className="relative mb-8 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Chercher une intégration (Amadeus, Stripe, etc.)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-sm shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
                />
            </div>

            {/* Connected */}
            {connected.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-sm font-bold text-luna-charcoal uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={14} className="text-emerald-500" /> Connectées ({connected.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {connected.map(integ => (
                            <div key={integ.id} className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-3 right-3">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <Check size={10} /> Active
                                    </span>
                                </div>
                                <div className="text-3xl mb-3">{integ.logo}</div>
                                <h3 className="text-base font-bold text-luna-charcoal mb-1">{integ.name}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">{integ.description}</p>
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">{integ.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available */}
            <div>
                <h2 className="text-sm font-bold text-luna-charcoal uppercase tracking-wider mb-4">Disponibles ({available.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {available.map(integ => (
                        <div key={integ.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="text-3xl mb-3">{integ.logo}</div>
                            <h3 className="text-base font-bold text-luna-charcoal mb-1">{integ.name}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed mb-4">{integ.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">{integ.category}</span>
                                <button className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={12} /> Connecter
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
