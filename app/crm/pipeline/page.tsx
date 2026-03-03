'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, MessageSquare, Clock, Globe, RefreshCcw, X } from 'lucide-react';
import { getLeads, createLead, CRMLead } from '@/src/lib/firebase/crm';

const STAGES = ['NOUVEAU', 'IA EN COURS', 'DEVIS ENVOYÉ', 'GAGNÉ'] as const;

// Helper to map DB status to UI columns
const mapStatusToStage = (status: string) => {
    switch (status) {
        case 'NEW': return 'NOUVEAU';
        case 'ANALYSING': return 'IA EN COURS';
        case 'PROPOSAL_READY': return 'DEVIS ENVOYÉ';
        case 'WON': return 'GAGNÉ';
        default: return 'NOUVEAU';
    }
};

export default function CRMPipeline() {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDeal, setNewDeal] = useState({
        clientName: '',
        destination: '',
        dates: '',
        budget: '',
        pax: '',
    });

    const handleAddDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLead({
                clientName: newDeal.clientName,
                destination: newDeal.destination,
                dates: newDeal.dates,
                budget: newDeal.budget,
                pax: newDeal.pax,
                status: 'NEW'
            });
            setIsModalOpen(false);
            setNewDeal({ clientName: '', destination: '', dates: '', budget: '', pax: '' });
            loadLeads();
        } catch (error) {
            console.error("Failed to add deal:", error);
        }
    };

    const loadLeads = async () => {
        setLoading(true);
        try {
            const leads = await getLeads();
            const formattedDeals = leads.map(l => ({
                id: l.id,
                client: l.clientName || 'Client Inconnu', // Assuming we add clientName or link to contact
                destination: l.destination || 'Non définie',
                budget: l.budget || 'À définir',
                days: l.days || 7,
                stage: mapStatusToStage(l.status),
                links: l.links || []
            }));
            setDeals(formattedDeals);
        } catch (error) {
            console.error("Failed to load leads from Firestore:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    return (
        <div className="h-full flex flex-col relative">
            <div className="absolute inset-0 bg-gradient-to-br from-luna-bg to-luna-cream/30 pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 md:mb-8 relative z-10 gap-3">
                <div>
                    <h1 className="font-serif text-xl md:text-3xl font-semibold text-luna-charcoal tracking-tight">Pipeline des Ventes</h1>
                    <p className="text-luna-text-muted font-normal text-sm mt-1 hidden sm:block">Gérez vos demandes et devis en cours.</p>
                </div>
                <div className="flex gap-2 md:gap-3">
                    <button onClick={loadLeads} className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
                        <RefreshCcw size={16} className={loading ? "animate-spin text-luna-accent" : "text-luna-text-muted"} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-4 py-2 md:px-6 md:py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm">
                        <Plus size={16} /> <span className="hidden sm:inline">Ajouter Manuel</span><span className="sm:hidden">Ajouter</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 relative z-10">
                {STAGES.map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);

                    let columnColor = "bg-luna-cream/50 border-luna-warm-gray/20";
                    if (stage === 'NOUVEAU') columnColor = "bg-luna-accent/5 border-luna-accent/15";
                    if (stage === 'IA EN COURS') columnColor = "bg-purple-50/50 border-purple-100/40";
                    if (stage === 'DEVIS ENVOYÉ') columnColor = "bg-amber-50/50 border-amber-100/40";
                    if (stage === 'GAGNÉ') columnColor = "bg-emerald-50/50 border-emerald-100/40";

                    return (
                        <div key={stage} className={`flex-1 min-w-[240px] md:min-w-[300px] rounded-3xl p-3 md:p-4 border flex flex-col backdrop-blur-sm shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-colors ${columnColor}`}>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="font-semibold text-luna-charcoal text-sm tracking-wider uppercase">{stage} <span className="text-luna-text-muted font-normal ml-2">({stageDeals.length})</span></h3>
                                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                            </div>

                            <div className="flex flex-col gap-3 overflow-y-auto flex-1 h-[calc(100vh-320px)] md:h-[calc(100vh-280px)] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {stageDeals.length === 0 && !loading && (
                                    <div className="text-center p-4 border border-dashed border-luna-warm-gray/40 rounded-xl text-luna-text-muted text-sm font-medium mt-2">
                                        Aucun deal
                                    </div>
                                )}

                                {stageDeals.map((deal) => (
                                    <motion.div
                                        key={deal.id}
                                        layoutId={deal.id}
                                        className="bg-white p-5 rounded-2xl shadow-sm border border-luna-warm-gray/20 cursor-grab hover:shadow-md hover:border-luna-accent/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-luna-accent/10 text-luna-accent-dark text-[10px] font-semibold uppercase px-2 py-1 rounded-md">{deal.destination}</span>
                                            <span className="text-gray-400 text-xs font-semibold flex items-center gap-1"><Clock size={12} /> {deal.days}j</span>
                                        </div>
                                        <h4 className="font-semibold text-luna-charcoal mb-1">{deal.client}</h4>
                                        <p className="text-emerald-600 font-bold mb-4">{deal.budget}</p>

                                        {deal.links && deal.links.length > 0 && (
                                            <div className="mb-4 pt-3 border-t border-gray-50">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Résultats Web IA</p>
                                                {deal.links.map((link: any, idx: number) => (
                                                    <a key={idx} href={link.url} className="text-xs flex items-center gap-1 text-luna-accent-dark font-semibold hover:underline bg-luna-accent/10 px-2 py-1 flex-wrap rounded-md">
                                                        <Globe size={12} /> {link.title}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white"></div>
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white"></div>
                                            </div>
                                            <button className="text-luna-text-muted hover:text-luna-accent-dark group-hover:bg-luna-accent/10 p-1.5 rounded-lg transition-colors">
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Ajout Deal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-luna-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-luxury overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-luna-warm-gray/20 bg-luna-cream">
                            <h2 className="font-serif text-xl font-semibold text-luna-charcoal">Nouvelle Demande</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-2"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddDeal} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client (Nom complet)</label>
                                <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newDeal.clientName} onChange={e => setNewDeal({ ...newDeal, clientName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</label>
                                <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newDeal.destination} onChange={e => setNewDeal({ ...newDeal, destination: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dates Estimées</label>
                                    <input type="text" placeholder="Ex: Été 2025" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newDeal.dates} onChange={e => setNewDeal({ ...newDeal, dates: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Budget Global</label>
                                    <input type="text" placeholder="Ex: 15 000 €" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newDeal.budget} onChange={e => setNewDeal({ ...newDeal, budget: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Passagers (Pax)</label>
                                <input type="text" placeholder="Ex: 2 Adultes, 1 Enfant" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900" value={newDeal.pax} onChange={e => setNewDeal({ ...newDeal, pax: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-luna-charcoal font-medium hover:bg-luna-cream transition-colors">Annuler</button>
                                <button type="submit" className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all">Créer le Deal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
