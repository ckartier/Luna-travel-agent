'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Plane, FileText, CreditCard, Truck, X, ArrowRight, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import {
    getContacts, getTrips, getQuotes, getInvoices, getSuppliers,
} from '@/src/lib/firebase/crm';

interface SearchResult {
    type: 'contact' | 'trip' | 'quote' | 'invoice' | 'supplier';
    id: string;
    title: string;
    subtitle: string;
    href: string;
}

const TYPE_CONFIG = {
    contact: { icon: Users, color: '#2F80ED', label: 'Contact' },
    trip: { icon: Plane, color: '#27AE60', label: 'Voyage' },
    quote: { icon: FileText, color: '#F2994A', label: 'Devis' },
    invoice: { icon: CreditCard, color: '#9B51E0', label: 'Facture' },
    supplier: { icon: Truck, color: '#EB5757', label: 'Prestataire' },
};

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [allData, setAllData] = useState<SearchResult[]>([]);
    const [loaded, setLoaded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { tenantId } = useAuth();

    // Cmd+K handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            if (!loaded && tenantId) loadAllData();
        }
    }, [open]);

    const loadAllData = async () => {
        if (!tenantId) return;
        try {
            const [contacts, trips, quotes, invoices, suppliers] = await Promise.all([
                getContacts(tenantId),
                getTrips(tenantId),
                getQuotes(tenantId),
                getInvoices(tenantId),
                getSuppliers(tenantId),
            ]);

            const all: SearchResult[] = [
                ...contacts.map(c => ({
                    type: 'contact' as const,
                    id: c.id!,
                    title: `${c.firstName} ${c.lastName}`.trim(),
                    subtitle: c.email || c.phone || '',
                    href: `/crm/contacts`,
                })),
                ...trips.map(t => ({
                    type: 'trip' as const,
                    id: t.id!,
                    title: t.title || t.destination,
                    subtitle: `${t.clientName} · ${t.destination}`,
                    href: `/crm/trips/${t.id}`,
                })),
                ...quotes.map(q => ({
                    type: 'quote' as const,
                    id: q.id!,
                    title: q.quoteNumber || 'Devis',
                    subtitle: `${q.clientName} · ${q.totalAmount?.toLocaleString('fr-FR') || 0} €`,
                    href: `/crm/quotes`,
                })),
                ...invoices.map(i => ({
                    type: 'invoice' as const,
                    id: i.id!,
                    title: i.invoiceNumber || 'Facture',
                    subtitle: `${i.clientName} · ${i.totalAmount?.toLocaleString('fr-FR') || 0} €`,
                    href: `/crm/invoices`,
                })),
                ...suppliers.map(s => ({
                    type: 'supplier' as const,
                    id: s.id!,
                    title: s.name,
                    subtitle: `${s.category} · ${s.city || s.country || ''}`,
                    href: `/crm/suppliers/${s.id}`,
                })),
            ];

            setAllData(all);
            setLoaded(true);
        } catch (e) {
            console.error('[GlobalSearch] Load error:', e);
        }
    };

    // Filter results
    useEffect(() => {
        if (!query.trim()) {
            setResults(allData.slice(0, 8));
            return;
        }
        const q = query.toLowerCase();
        const filtered = allData.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.subtitle.toLowerCase().includes(q)
        ).slice(0, 10);
        setResults(filtered);
        setSelectedIndex(0);
    }, [query, allData]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            setOpen(false);
            setQuery('');
        }
    };

    const handleSelect = (result: SearchResult) => {
        router.push(result.href);
        setOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Trigger hint (small button in header area) */}
            <button
                onClick={() => setOpen(true)}
                className="fixed top-[68px] right-14 md:top-6 md:right-14 z-[140] flex items-center gap-1.5 text-[10px] text-gray-400 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-xl px-3 py-2 hover:border-gray-200 hover:text-gray-500 transition-all cursor-pointer shadow-sm"
            >
                <Search size={12} />
                <span className="hidden md:inline">Rechercher</span>
                <span className="flex items-center gap-0.5 ml-1 bg-gray-100 rounded px-1 py-0.5 text-[9px] font-mono font-bold text-gray-400">
                    <Command size={8} />K
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[300]"
                            onClick={() => { setOpen(false); setQuery(''); }}
                        />

                        {/* Search Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[560px] max-w-[90vw] z-[301] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <Search size={18} className="text-gray-300 shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Rechercher contacts, voyages, devis, factures..."
                                    className="flex-1 text-sm text-[#2E2E2E] placeholder-gray-300 outline-none bg-transparent"
                                />
                                <button onClick={() => { setOpen(false); setQuery(''); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                                    <X size={14} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {results.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Search size={20} className="mx-auto text-gray-200 mb-2" />
                                        <p className="text-xs text-gray-400">{query ? 'Aucun résultat' : 'Tapez pour rechercher'}</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {results.map((result, i) => {
                                            const cfg = TYPE_CONFIG[result.type];
                                            const Icon = cfg.icon;
                                            return (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleSelect(result)}
                                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors cursor-pointer ${
                                                        i === selectedIndex ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}12` }}>
                                                        <Icon size={14} style={{ color: cfg.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[#2E2E2E] truncate">{result.title}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{result.subtitle}</p>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-wider shrink-0">{cfg.label}</span>
                                                    {i === selectedIndex && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-300">
                                <div className="flex items-center gap-3">
                                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[8px] font-mono">↑↓</kbd> Naviguer</span>
                                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[8px] font-mono">↵</kbd> Ouvrir</span>
                                    <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[8px] font-mono">Esc</kbd> Fermer</span>
                                </div>
                                <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
