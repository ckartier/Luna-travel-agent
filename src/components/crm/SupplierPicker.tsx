'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, User, MapPin, Phone, Star } from 'lucide-react';
import { CRMSupplier } from '@/src/lib/firebase/crm';
import { motion, AnimatePresence } from 'framer-motion';

interface SupplierPickerProps {
    suppliers: CRMSupplier[];
    value: string; // supplierId
    onChange: (supplierId: string, supplier?: CRMSupplier) => void;
    placeholder?: string;
    label?: string;
    allowManual?: boolean;
    className?: string;
}

export default function SupplierPicker({
    suppliers,
    value,
    onChange,
    placeholder = 'Rechercher un prestataire...',
    label,
    allowManual = false,
    className = '',
}: SupplierPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = suppliers.find(s => s.id === value);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const filtered = suppliers.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            (s.city || '').toLowerCase().includes(q) ||
            (s.country || '').toLowerCase().includes(q) ||
            (s.category || '').toLowerCase().includes(q) ||
            (s.phone || '').includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.languages || []).some(l => l.toLowerCase().includes(q))
        );
    });

    // Group by category
    const categories = [...new Set(filtered.map(s => s.category || 'AUTRE'))];

    const getCategoryEmoji = (cat: string) => {
        switch (cat) {
            case 'HOTEL': return '🏨';
            case 'TRANSPORT': return '🚗';
            case 'GUIDE': return '🧭';
            case 'CULTURE': return '🏛️';
            case 'RESTAURANT': return '🍽️';
            case 'ACTIVITE': return '🎯';
            default: return '📦';
        }
    };

    return (
        <div ref={ref} className={`relative ${className}`}>
            {label && (
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    {label}
                </label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm transition-all hover:border-[#b9dae9] hover:bg-white ${open ? 'border-[#b9dae9] bg-white shadow-lg shadow-[#b9dae9]/10' : ''}`}
            >
                {selected ? (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#bcdeea]/20 flex items-center justify-center text-[11px] font-bold text-[#2E2E2E] shrink-0">
                            {selected.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left min-w-0">
                            <p className="font-semibold text-[#2E2E2E] truncate text-sm">{selected.name}</p>
                            {(selected.city || selected.category) && (
                                <p className="text-[10px] text-gray-400 truncate">
                                    {selected.city}{selected.city && selected.category ? ' · ' : ''}{selected.category}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">{placeholder}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200 overflow-hidden"
                        style={{ maxHeight: '320px' }}
                    >
                        {/* Search bar */}
                        <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Filtrer par nom, ville, catégorie..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-none outline-none placeholder:text-gray-300 focus:bg-white focus:ring-1 focus:ring-[#b9dae9] transition-all"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md">
                                        <X size={12} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-2 px-1">
                                {filtered.length} prestataire{filtered.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Results */}
                        <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                            {allowManual && (
                                <button
                                    type="button"
                                    onClick={() => { onChange(''); setOpen(false); }}
                                    className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-50 flex items-center gap-2"
                                >
                                    <User size={14} className="text-gray-300" />
                                    Saisir manuellement...
                                </button>
                            )}

                            {filtered.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-400">Aucun prestataire trouvé</p>
                                    <p className="text-[10px] text-gray-300 mt-1">Essayez un autre terme de recherche</p>
                                </div>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat}>
                                        {categories.length > 1 && (
                                            <div className="px-4 py-2 bg-gray-50/80 sticky top-0">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {getCategoryEmoji(cat)} {cat}
                                                </span>
                                            </div>
                                        )}
                                        {filtered.filter(s => (s.category || 'AUTRE') === cat).map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => { onChange(s.id!, s); setOpen(false); setSearch(''); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#bcdeea]/10 transition-all ${value === s.id ? 'bg-[#bcdeea]/15 border-l-2 border-[#b9dae9]' : ''}`}
                                            >
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${value === s.id ? 'bg-[#2E2E2E] text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {s.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${value === s.id ? 'text-[#2E2E2E]' : 'text-gray-700'}`}>
                                                        {s.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                        {s.city && <span className="flex items-center gap-0.5"><MapPin size={9} /> {s.city}</span>}
                                                        {s.phone && <span className="flex items-center gap-0.5"><Phone size={9} /> {s.phone.slice(0, 12)}</span>}
                                                        {s.isLunaFriend && <span className="text-amber-500 flex items-center gap-0.5"><Star size={9} className="fill-amber-500" /> Luna Friend</span>}
                                                    </div>
                                                </div>
                                                {(s.languages || []).length > 0 && (
                                                    <div className="flex gap-1 shrink-0">
                                                        {s.languages!.slice(0, 2).map(l => (
                                                            <span key={l} className="text-[8px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase">{l}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
