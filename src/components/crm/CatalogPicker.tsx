'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Hotel, Plane, MapPin, Car, UtensilsCrossed, DollarSign, Check, Sparkles } from 'lucide-react';
import { CRMCatalogItem, getCatalogItems } from '@/src/lib/firebase/crm';

interface CatalogPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: CRMCatalogItem) => void;
    tenantId: string;
    filterType?: string; // Pre-filter by segment type
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Hotel; color: string }> = {
    HOTEL: { label: 'Hôtel', icon: Hotel, color: 'text-indigo-500 bg-indigo-50' },
    FLIGHT: { label: 'Vol', icon: Plane, color: 'text-sky-500 bg-sky-50' },
    ACTIVITY: { label: 'Activité', icon: MapPin, color: 'text-emerald-500 bg-emerald-50' },
    TRANSFER: { label: 'Transfert', icon: Car, color: 'text-amber-500 bg-amber-50' },
    OTHER: { label: 'Autre', icon: UtensilsCrossed, color: 'text-rose-500 bg-rose-50' },
};

export default function CatalogPicker({ isOpen, onClose, onSelect, tenantId, filterType }: CatalogPickerProps) {
    const [items, setItems] = useState<CRMCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(filterType || 'ALL');

    useEffect(() => {
        if (isOpen && tenantId) {
            loadCatalog();
        }
    }, [isOpen, tenantId]);

    useEffect(() => {
        if (filterType) setTypeFilter(filterType);
    }, [filterType]);

    const loadCatalog = async () => {
        setLoading(true);
        try {
            const data = await getCatalogItems(tenantId);
            setItems(data);
        } catch (e) {
            console.error('[CatalogPicker] Error loading catalog:', e);
        }
        setLoading(false);
    };

    const filtered = useMemo(() => {
        return items.filter(item => {
            // Type filter
            if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
            // Search filter
            if (search) {
                const q = search.toLowerCase();
                return (
                    item.name.toLowerCase().includes(q) ||
                    item.location?.toLowerCase().includes(q) ||
                    item.description?.toLowerCase().includes(q) ||
                    item.supplier?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [items, typeFilter, search]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xl"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    className="bg-white rounded-[40px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-gray-100 shrink-0">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-light tracking-tight text-[#2E2E2E]">Catalogue Prestations</h2>
                                <p className="text-xs text-gray-400 mt-1">Sélectionnez une prestation à lier à ce segment</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 group focus-within:border-gray-300 transition-all">
                            <Search size={16} className="text-gray-400 group-focus-within:text-gray-600" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher par nom, lieu, prestataire..."
                                className="bg-transparent border-none text-sm w-full focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                                autoFocus
                            />
                        </div>

                        {/* Type Filters */}
                        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setTypeFilter('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${typeFilter === 'ALL' ? 'bg-[#2E2E2E] text-white border-[#2E2E2E]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                Tous
                            </button>
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setTypeFilter(key)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-1.5 ${typeFilter === key ? 'bg-[#2E2E2E] text-white border-[#2E2E2E]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <Icon size={12} /> {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-pulse text-gray-400 text-sm">Chargement du catalogue...</div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Sparkles size={32} className="mb-3 opacity-30" />
                                <p className="text-sm font-medium">Aucune prestation trouvée</p>
                                <p className="text-xs mt-1">Essayez avec d'autres critères</p>
                            </div>
                        ) : (
                            filtered.map(item => {
                                const conf = TYPE_CONFIG[item.type] || TYPE_CONFIG.OTHER;
                                const Icon = conf.icon;
                                const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-[#bcdeea] hover:shadow-md transition-all bg-white group flex items-start gap-4"
                                    >
                                        {/* Type Icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conf.color}`}>
                                            <Icon size={18} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-[#2E2E2E] truncate">{item.name}</p>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">{conf.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.location}</p>
                                            {item.description && (
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-gray-400">Net: {item.netCost.toLocaleString('fr-FR')}€</p>
                                            <p className="text-sm font-bold text-[#2E2E2E]">{clientPrice.toLocaleString('fr-FR')}€</p>
                                            <p className="text-[9px] text-emerald-600 font-medium">+{item.recommendedMarkup}%</p>
                                        </div>

                                        {/* Select indicator */}
                                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#bcdeea]/30 flex items-center justify-center shrink-0 transition-colors self-center">
                                            <Check size={14} className="text-gray-300 group-hover:text-[#2E2E2E]" />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 shrink-0">
                        <p className="text-[10px] text-gray-400 text-center">
                            {filtered.length} prestation{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''} — Les prix client sont calculés avec la marge recommandée
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
