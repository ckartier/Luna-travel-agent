'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, MessageSquare, Clock, Globe } from 'lucide-react';

interface Deal {
    id: string;
    client: string;
    destination: string;
    budget: string;
    days: number;
    stage: 'NOUVEAU' | 'IA EN COURS' | 'DEVIS ENVOYÉ' | 'GAGNÉ';
    links?: { title: string, url: string }[];
}

const mockDeals: Deal[] = [
    { id: '1', client: 'L. Clement', destination: 'Île Maurice', budget: '12 400 €', days: 2, stage: 'NOUVEAU' },
    { id: '2', client: 'S. Robert', destination: 'Japon', budget: '8 500 €', days: 5, stage: 'IA EN COURS' },
    { id: '3', client: 'A. Dupont', destination: 'Maldives', budget: '15 000 €', days: 1, stage: 'DEVIS ENVOYÉ', links: [{ title: 'Booking Soneva Fushi', url: '#' }] },
];

const STAGES = ['NOUVEAU', 'IA EN COURS', 'DEVIS ENVOYÉ', 'GAGNÉ'] as const;

export default function CRMPipeline() {
    const [deals, setDeals] = useState<Deal[]>(mockDeals);

    return (
        <div className="h-full flex flex-col relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/30 pointer-events-none" />
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pipeline des Ventes</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos demandes et devis en cours (Glisser-Déposer visuel).</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                    <Plus size={18} /> Ajouter Manuel
                </button>
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
                                                {deal.links.map((link, idx) => (
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
        </div>
    );
}
