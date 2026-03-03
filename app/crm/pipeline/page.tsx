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
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/30 pointer-events-none" />
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pipeline des Ventes</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos demandes et devis en cours (Glisser-Déposer visuel).</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadLeads} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
                        <RefreshCcw size={18} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                        <Plus size={18} /> Ajouter Manuel
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 relative z-10">
                {STAGES.map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);

                    let columnColor = "bg-slate-100/50 border-slate-200/60";
                    if (stage === 'NOUVEAU') columnColor = "bg-blue-50/50 border-blue-100/60";
                    if (stage === 'IA EN COURS') columnColor = "bg-purple-50/50 border-purple-100/60";
                    if (stage === 'DEVIS ENVOYÉ') columnColor = "bg-amber-50/50 border-amber-100/60";
                    if (stage === 'GAGNÉ') columnColor = "bg-emerald-50/50 border-emerald-100/60";

                    return (
                        <div key={stage} className={`flex-1 min-w-[300px] rounded-3xl p-4 border flex flex-col backdrop-blur-sm shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-colors ${columnColor}`}>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="font-bold text-gray-700 text-sm tracking-wider uppercase">{stage} <span className="text-gray-400 font-normal ml-2">({stageDeals.length})</span></h3>
                                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                            </div>

                            <div className="flex flex-col gap-3 overflow-y-auto flex-1 h-[calc(100vh-280px)] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {stageDeals.length === 0 && !loading && (
                                    <div className="text-center p-4 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm font-medium mt-2">
                                        Aucun deal
                                    </div>
                                )}

                                {stageDeals.map((deal) => (
                                    <motion.div
                                        key={deal.id}
                                        layoutId={deal.id}
                                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-grab hover:shadow-md hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">{deal.destination}</span>
                                            <span className="text-gray-400 text-xs font-semibold flex items-center gap-1"><Clock size={12} /> {deal.days}j</span>
                                        </div>
                                        <h4 className="font-black text-gray-900 mb-1">{deal.client}</h4>
                                        <p className="text-emerald-600 font-bold mb-4">{deal.budget}</p>

                                        {deal.links && deal.links.length > 0 && (
                                            <div className="mb-4 pt-3 border-t border-gray-50">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Résultats Web IA</p>
                                                {deal.links.map((link: any, idx: number) => (
                                                    <a key={idx} href={link.url} className="text-xs flex items-center gap-1 text-blue-600 font-semibold hover:underline bg-blue-50 px-2 py-1 flex-wrap rounded-md">
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
                                            <button className="text-gray-400 hover:text-blue-600 group-hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
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
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
                            <h2 className="text-xl font-bold text-gray-900">Nouvelle Demande</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddDeal} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client (Nom complet)</label>
                                <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newDeal.clientName} onChange={e => setNewDeal({ ...newDeal, clientName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</label>
                                <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newDeal.destination} onChange={e => setNewDeal({ ...newDeal, destination: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dates Estimées</label>
                                    <input type="text" placeholder="Ex: Été 2025" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newDeal.dates} onChange={e => setNewDeal({ ...newDeal, dates: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Budget Global</label>
                                    <input type="text" placeholder="Ex: 15 000 €" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newDeal.budget} onChange={e => setNewDeal({ ...newDeal, budget: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Passagers (Pax)</label>
                                <input type="text" placeholder="Ex: 2 Adultes, 1 Enfant" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newDeal.pax} onChange={e => setNewDeal({ ...newDeal, pax: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">Annuler</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all">Créer le Deal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
