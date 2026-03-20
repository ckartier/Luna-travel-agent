'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, GitMerge, CheckCircle2, AlertTriangle, Eye, ArrowRight, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T } from '@/src/components/T';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface DuplicatePair {
    contact1: any;
    contact2: any;
    score: number;
    reason: string;
}

export default function DuplicatesPage() {
    const { tenantId } = useAuth();
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState<string | null>(null);
    const [merged, setMerged] = useState<Set<string>>(new Set());
    const [ignored, setIgnored] = useState<Set<string>>(new Set());
    const [type, setType] = useState<'contacts' | 'suppliers'>('contacts');

    useEffect(() => { loadDuplicates(); }, [type]);

    const loadDuplicates = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`/api/crm/duplicates?type=${type}`);
            const data = await res.json();
            setDuplicates(data.duplicates || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleMerge = async (pair: DuplicatePair) => {
        const pairKey = `${pair.contact1.id}-${pair.contact2.id}`;
        setMerging(pairKey);
        try {
            const res = await fetchWithAuth('/api/crm/merge-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryId: pair.contact1.id,
                    secondaryId: pair.contact2.id,
                }),
            });
            if (res.ok) {
                setMerged(prev => new Set(prev).add(pairKey));
            }
        } catch (e) { console.error(e); }
        setMerging(null);
    };

    const handleIgnore = (pair: DuplicatePair) => {
        const pairKey = `${pair.contact1.id}-${pair.contact2.id}`;
        setIgnored(prev => new Set(prev).add(pairKey));
    };

    const activeDuplicates = duplicates.filter(d => {
        const key = `${d.contact1.id}-${d.contact2.id}`;
        return !merged.has(key) && !ignored.has(key);
    });

    const getName = (c: any) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Sans nom';
    const getScoreColor = (score: number) => score >= 80 ? 'text-red-500 bg-red-50 border-red-200' : score >= 50 ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-gray-500 bg-gray-50 border-gray-200';

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
                            <T>Déduplication</T>
                        </h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium">
                            Détectez et fusionnez les doublons dans vos {type === 'contacts' ? 'contacts' : 'fournisseurs'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
                            <button onClick={() => setType('contacts')}
                                className={`px-4 py-2 rounded-lg text-xs font-normal transition-all ${type === 'contacts' ? 'bg-luna-charcoal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                <Users size={14} className="inline mr-1.5" /> Contacts
                            </button>
                            <button onClick={() => setType('suppliers')}
                                className={`px-4 py-2 rounded-lg text-xs font-normal transition-all ${type === 'suppliers' ? 'bg-luna-charcoal text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                                Fournisseurs
                            </button>
                        </div>
                        <button onClick={loadDuplicates}
                            className="bg-white border border-gray-200 text-gray-500 hover:text-luna-charcoal px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
                            <RefreshCw size={14} /> Scanner
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-100">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-normal tracking-wide text-gray-400">Doublons détectés</p>
                            <p className="text-2xl font-normal text-luna-charcoal">{activeDuplicates.length}</p>
                        </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
                            <GitMerge size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-normal tracking-wide text-gray-400">Fusionnés</p>
                            <p className="text-2xl font-normal text-emerald-600">{merged.size}</p>
                        </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
                            <Eye size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-normal tracking-wide text-gray-400">Ignorés</p>
                            <p className="text-2xl font-normal text-gray-400">{ignored.size}</p>
                        </div>
                    </div>
                </div>

                {/* Duplicate pairs */}
                {activeDuplicates.length === 0 ? (
                    <div className="text-center py-16">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-300" />
                        <p className="text-lg font-light text-[#2E2E2E]">Aucun doublon détecté</p>
                        <p className="text-sm text-gray-400 mt-1">Votre base de {type} est propre ✨</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {activeDuplicates.map((pair, i) => {
                                const pairKey = `${pair.contact1.id}-${pair.contact2.id}`;
                                const isMerging = merging === pairKey;
                                return (
                                    <motion.div
                                        key={pairKey}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100, height: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                    >
                                        <div className="p-6">
                                            {/* Score badge */}
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getScoreColor(pair.score)}`}>
                                                        {pair.score}% similaire
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">{pair.reason}</span>
                                                </div>
                                            </div>

                                            {/* Two contact cards side by side */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                                {[pair.contact1, pair.contact2].map((c, idx) => (
                                                    <div key={c.id} className={`p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-[#bcdeea]/5 border-[#bcdeea]/20' : 'bg-gray-50 border-gray-100'}`}>
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-medium text-[#2E2E2E] border border-gray-200 shadow-sm">
                                                                {getName(c).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[14px] font-medium text-[#2E2E2E] truncate">{getName(c)}</p>
                                                                {idx === 0 && <span className="text-[9px] font-bold uppercase tracking-widest text-[#5a8fa3]">Principal</span>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {c.email && (
                                                                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-12">Email</span>
                                                                    {c.email}
                                                                </p>
                                                            )}
                                                            {c.phone && (
                                                                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-12">Tél</span>
                                                                    {c.phone}
                                                                </p>
                                                            )}
                                                            {c.company && (
                                                                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-12">Société</span>
                                                                    {c.company}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                                <button onClick={() => handleMerge(pair)} disabled={isMerging}
                                                    className="flex-1 py-3 bg-luna-charcoal hover:bg-black text-white rounded-xl text-[12px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                                    {isMerging ? <Loader2 size={14} className="animate-spin" /> : <GitMerge size={14} />}
                                                    {isMerging ? 'Fusion...' : 'Fusionner (garder le principal)'}
                                                </button>
                                                <button onClick={() => handleIgnore(pair)}
                                                    className="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-[12px] font-medium transition-all border border-gray-100">
                                                    Ignorer
                                                </button>
                                                <Link href={`/crm/clients/${pair.contact1.id}`}
                                                    className="px-4 py-3 text-gray-400 hover:text-[#5a8fa3] transition-colors">
                                                    <Eye size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
