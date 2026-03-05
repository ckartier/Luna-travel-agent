'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, MessageSquare, Clock, Globe, RefreshCcw, X, CheckCircle2, Calendar, Plane } from 'lucide-react';
import { getLeads, createLead, updateLeadStatus, createTrip, createActivity, CRMLead } from '@/src/lib/firebase/crm';
import { useRouter } from 'next/navigation';

const STAGES = ['NOUVEAU', 'IA EN COURS', 'DEVIS ENVOYÉ', 'GAGNÉ'] as const;

const stageToStatus: Record<string, CRMLead['status']> = {
    'NOUVEAU': 'NEW',
    'IA EN COURS': 'ANALYSING',
    'DEVIS ENVOYÉ': 'PROPOSAL_READY',
    'GAGNÉ': 'WON',
};

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
    const router = useRouter();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [wonModal, setWonModal] = useState<{ deal: any } | null>(null);
    const [newDeal, setNewDeal] = useState({ clientName: '', destination: '', dates: '', budget: '', pax: '' });

    const handleAddDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLead({
                clientName: newDeal.clientName, destination: newDeal.destination,
                dates: newDeal.dates, budget: newDeal.budget, pax: newDeal.pax, status: 'NEW',
            });
            setIsModalOpen(false);
            setNewDeal({ clientName: '', destination: '', dates: '', budget: '', pax: '' });
            loadLeads();
        } catch (error) { console.error("Failed to add deal:", error); }
    };

    const loadLeads = async () => {
        setLoading(true);
        try {
            const leads = await getLeads();
            setDeals(leads.map(l => ({
                id: l.id, client: l.clientName || 'Client Inconnu',
                destination: l.destination || 'Non définie', budget: l.budget || 'À définir',
                days: l.days || 7, stage: mapStatusToStage(l.status),
                status: l.status, links: l.links || [], dates: l.dates, pax: l.pax,
                clientId: l.clientId,
            })));
        } catch (error) { console.error("Failed to load leads:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadLeads(); }, []);

    // Move deal to a stage
    const moveToStage = async (dealId: string, targetStage: string) => {
        const deal = deals.find(d => d.id === dealId);
        if (!deal || deal.stage === targetStage) return;

        const newStatus = stageToStatus[targetStage];
        if (!newStatus) return;

        await updateLeadStatus(dealId, newStatus);

        // If moving to GAGNÉ → open trip creation modal
        if (targetStage === 'GAGNÉ') {
            setWonModal({ deal });
        }

        loadLeads();
    };

    // Auto-create trip + activity when deal is won
    const handleCreateTrip = async () => {
        if (!wonModal) return;
        const d = wonModal.deal;
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        try {
            const tripId = await createTrip({
                title: `${d.destination} — ${d.client}`,
                destination: d.destination,
                clientName: d.client,
                clientId: d.clientId || '',
                startDate: today,
                endDate: nextWeek,
                status: 'CONFIRMED',
                paymentStatus: 'UNPAID',
                amount: parseInt(d.budget?.replace(/[^\d]/g, '') || '0') || 0,
                notes: `Depuis pipeline. Pax: ${d.pax || 'N/A'}. Dates: ${d.dates || 'À définir'}`,
                color: '#22c55e',
            });

            // Auto-create follow-up activity
            await createActivity({
                title: `Organiser le voyage ${d.destination} pour ${d.client}`,
                time: 'Cette semaine',
                type: 'meeting',
                status: 'PENDING',
                color: 'emerald',
                iconName: 'Calendar',
                contactId: d.clientId || '',
                contactName: d.client,
                leadId: d.id,
                tripId: tripId,
            });

            setWonModal(null);
            router.push('/crm/planning');
        } catch (err) { console.error(err); }
    };

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
                        <div key={stage}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('dealId'); if (id) moveToStage(id, stage); }}
                            className={`flex-1 min-w-[240px] md:min-w-[300px] rounded-3xl p-3 md:p-4 border flex flex-col backdrop-blur-sm shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-colors ${columnColor}`}>
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
                                    <motion.div key={deal.id} layoutId={deal.id}
                                        draggable
                                        onDragStart={e => (e as any).dataTransfer.setData('dealId', deal.id)}
                                        className="bg-white p-5 rounded-2xl shadow-sm border border-luna-warm-gray/20 cursor-grab hover:shadow-md hover:border-luna-accent/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-luna-accent/10 text-luna-accent-dark text-[10px] font-semibold uppercase px-2 py-1 rounded-md">{deal.destination}</span>
                                            <span className="text-gray-400 text-xs font-semibold flex items-center gap-1"><Clock size={12} /> {deal.days}j</span>
                                        </div>
                                        <h4 className="font-semibold text-luna-charcoal mb-1">{deal.client}</h4>
                                        <p className="text-emerald-600 font-bold mb-3">{deal.budget}</p>

                                        {deal.links && deal.links.length > 0 && (
                                            <div className="mb-3 pt-3 border-t border-gray-50">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Résultats Web IA</p>
                                                {deal.links.map((link: any, idx: number) => (
                                                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-luna-accent-dark font-semibold hover:underline bg-luna-accent/10 px-2 py-1 flex-wrap rounded-md">
                                                        <Globe size={12} /> {link.title}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stage move buttons */}
                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex gap-1">
                                                {STAGES.filter(s => s !== deal.stage).map(s => (
                                                    <button key={s} onClick={() => moveToStage(deal.id, s)}
                                                        className={`text-[9px] px-2 py-1 rounded-md font-semibold transition-all border
                                                            ${s === 'GAGNÉ' ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' :
                                                                s === 'DEVIS ENVOYÉ' ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' :
                                                                    'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                                        {s === 'GAGNÉ' ? '✓ Gagné' : s === 'DEVIS ENVOYÉ' ? 'Devis' : s === 'IA EN COURS' ? 'IA' : 'Nouveau'}
                                                    </button>
                                                ))}
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

            {/* Modal Won → Create Trip */}
            <AnimatePresence>
                {wonModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-luna-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setWonModal(null)}>
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-md shadow-luxury overflow-hidden border border-emerald-200"
                            onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 border-b border-emerald-200 text-center">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h2 className="font-serif text-xl font-semibold text-emerald-800">Deal Gagné ! 🎉</h2>
                                <p className="text-emerald-600 text-sm mt-1">{wonModal.deal.destination} — {wonModal.deal.client}</p>
                            </div>
                            <div className="p-6">
                                <p className="text-luna-text-muted text-sm mb-5">
                                    Voulez-vous créer automatiquement un <strong>voyage dans le Planning</strong> et une <strong>tâche de suivi</strong> ?
                                </p>
                                <div className="bg-emerald-50/50 rounded-xl p-4 mb-5 border border-emerald-100 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <Plane size={14} /> <span>Trip : <strong>{wonModal.deal.destination} — {wonModal.deal.client}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <Calendar size={14} /> <span>Tâche : <strong>Organiser le voyage</strong></span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setWonModal(null)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-luna-charcoal font-medium hover:bg-luna-cream transition-colors border border-luna-warm-gray/20">
                                        Non merci
                                    </button>
                                    <button onClick={handleCreateTrip}
                                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 size={16} /> Créer tout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
