'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ScrollText, Search, BookOpen, Scale, Gavel, ExternalLink,
    Plus, X, Loader2, ChevronRight, Tag, Calendar, Star, StarOff,
    Globe, FileText, Copy, CheckCircle2, Filter
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useAuth } from '@/src/contexts/AuthContext';

/* ─── Types ─── */
interface JurisprudenceEntry {
    id: string;
    title: string;
    court: string;
    date: string;
    number?: string;
    domain: string;
    summary: string;
    url?: string;
    starred: boolean;
    tags: string[];
    addedAt: string;
}

interface LegifranceResult {
    title: string;
    id: string;
    num: string;
    content: string;
    date?: string;
    jurisdiction?: string;
    number?: string;
    summary?: string;
    solution?: string;
    etat?: string;
}

const DOMAINS = [
    { id: 'all', label: 'Tous' },
    { id: 'civil', label: 'Droit Civil' },
    { id: 'penal', label: 'Droit Pénal' },
    { id: 'commercial', label: 'Droit Commercial' },
    { id: 'travail', label: 'Droit du Travail' },
    { id: 'administratif', label: 'Droit Administratif' },
    { id: 'constitutionnel', label: 'Droit Constitutionnel' },
    { id: 'europeen', label: 'Droit Européen' },
];

const COURTS = [
    'Cour de Cassation', 'Conseil d\'État', 'Cour d\'Appel', 'Tribunal Judiciaire',
    'Conseil Constitutionnel', 'Cour de Justice UE', 'Cour EDH',
];

const DOMAIN_COLORS: Record<string, string> = {
    civil: 'bg-blue-50 text-blue-700 border-blue-200',
    penal: 'bg-red-50 text-red-700 border-red-200',
    commercial: 'bg-amber-50 text-amber-700 border-amber-200',
    travail: 'bg-green-50 text-green-700 border-green-200',
    administratif: 'bg-purple-50 text-purple-700 border-purple-200',
    constitutionnel: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    europeen: 'bg-teal-50 text-teal-700 border-teal-200',
};

const CODES = [
    { id: 'civil', label: 'Code Civil' },
    { id: 'penal', label: 'Code Pénal' },
    { id: 'travail', label: 'Code du Travail' },
    { id: 'commerce', label: 'Code de Commerce' },
    { id: 'consommation', label: 'Code de la Consommation' },
    { id: 'environnement', label: 'Code de l\'Environnement' },
    { id: 'propriete_intellectuelle', label: 'Propriété Intellectuelle' },
];

export default function JurisprudencePage() {
    const { } = useAuth();
    const [entries, setEntries] = useState<JurisprudenceEntry[]>([]);
    const [search, setSearch] = useState('');
    const [domain, setDomain] = useState('all');
    const [selected, setSelected] = useState<JurisprudenceEntry | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [aiSearch, setAiSearch] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [legiResults, setLegiResults] = useState<LegifranceResult[]>([]);
    const [legiTab, setLegiTab] = useState<'articles' | 'jurisprudence'>('articles');
    const [selectedCode, setSelectedCode] = useState('civil');
    const [newEntry, setNewEntry] = useState<Partial<JurisprudenceEntry>>({
        title: '', court: 'Cour de Cassation', date: '', number: '',
        domain: 'civil', summary: '', url: '', tags: [], starred: false,
    });

    // Load from Firestore
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchWithAuth('/api/crm/notes?collection=jurisprudence');
                if (res.ok) {
                    const data = await res.json();
                    if (data.notes?.length) setEntries(data.notes);
                }
            } catch { /* fallback: empty */ }
        };
        load();
    }, []);

    // ESC key to close panels
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setSelected(null); setShowAdd(false); }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const filtered = entries.filter(e => {
        const matchSearch = `${e.title} ${e.court} ${e.summary} ${e.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
        const matchDomain = domain === 'all' || e.domain === domain;
        return matchSearch && matchDomain;
    }).sort((a, b) => +b.starred - +a.starred);

    const addEntry = () => {
        const entry: JurisprudenceEntry = {
            id: Date.now().toString(),
            title: newEntry.title || '',
            court: newEntry.court || 'Cour de Cassation',
            date: newEntry.date || '',
            number: newEntry.number,
            domain: newEntry.domain || 'civil',
            summary: newEntry.summary || '',
            url: newEntry.url,
            starred: false,
            tags: newEntry.tags || [],
            addedAt: new Date().toISOString(),
        };
        const updated = [entry, ...entries];
        setEntries(updated);
        // Save to Firestore
        fetchWithAuth('/api/crm/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection: 'jurisprudence', note: entry }),
        }).catch(console.error);
        setShowAdd(false);
        setNewEntry({ title: '', court: 'Cour de Cassation', date: '', number: '', domain: 'civil', summary: '', url: '', tags: [], starred: false });
    };

    const toggleStar = (id: string) => {
        const updated = entries.map(e => e.id === id ? { ...e, starred: !e.starred } : e);
        setEntries(updated);
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, starred: !prev.starred } : null);
    };

    const deleteEntry = (id: string) => {
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        if (selected?.id === id) setSelected(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleLegifranceSearch = async () => {
        if (!aiSearch.trim()) return;
        setAiLoading(true);
        setAiResult('');
        setLegiResults([]);
        try {
            const action = legiTab === 'articles' ? 'search_articles' : 'search_jurisprudence';
            const body: any = { action, query: aiSearch, pageSize: 8 };
            if (legiTab === 'articles') body.codeId = selectedCode;
            
            const res = await fetchWithAuth('/api/crm/legifrance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) {
                setAiResult(`Erreur Légifrance : ${data.error}`);
            } else {
                setLegiResults(data.results || []);
                setAiResult(data.results?.length ? `${data.totalCount || data.results.length} résultat(s) trouvé(s)` : 'Aucun résultat.');
            }
        } catch {
            setAiResult('Erreur de connexion à Légifrance.');
        }
        setAiLoading(false);
    };

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#5a3e91]/10 flex items-center justify-center">
                                <ScrollText size={20} className="text-[#5a3e91]" />
                            </div>
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Jurisprudence</h1>
                        </div>
                        <p className="text-sm text-[#6B7280] font-medium">
                            Base de décisions • <span className="text-[#5a3e91]">{entries.length} arrêts enregistrés</span>
                        </p>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
                        style={{ backgroundColor: '#5a3e91' }}>
                        <Plus size={16} /> Ajouter un arrêt
                    </button>
                </motion.div>

                {/* AI Jurisprudence Search */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-br from-[#5a3e91]/5 via-white to-[#5a3e91]/3 rounded-3xl border border-[#5a3e91]/15 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-[#5a3e91] flex items-center justify-center">
                            <Scale size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-[#2E2E2E]">Recherche Légifrance</h2>
                            <p className="text-xs text-gray-400">Articles de loi et jurisprudence officielle — API DILA/PISTE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <button onClick={() => setLegiTab('articles')} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${legiTab === 'articles' ? 'bg-[#5a3e91] text-white' : 'text-gray-400 hover:text-gray-600'}`}>Articles de loi</button>
                        <button onClick={() => setLegiTab('jurisprudence')} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${legiTab === 'jurisprudence' ? 'bg-[#5a3e91] text-white' : 'text-gray-400 hover:text-gray-600'}`}>Jurisprudence</button>
                        {legiTab === 'articles' && (
                            <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)} className="ml-auto px-3 py-1.5 rounded-xl border border-gray-100 text-xs bg-white">
                                {CODES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Gavel className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a3e91]/40" size={16} />
                            <input
                                value={aiSearch}
                                onChange={e => setAiSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLegifranceSearch()}
                                placeholder={legiTab === 'articles' ? 'Ex: responsabilité, article 1240, vice caché...' : 'Ex: responsabilité médicale, préjudice corporel...'}
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#5a3e91]/20 bg-white focus:border-[#5a3e91]/50 focus:ring-2 focus:ring-[#5a3e91]/10 outline-none text-sm transition-all"
                            />
                        </div>
                        <button onClick={handleLegifranceSearch} disabled={!aiSearch.trim() || aiLoading}
                            className="px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
                            style={{ backgroundColor: '#5a3e91' }}>
                            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Rechercher
                        </button>
                    </div>

                    <AnimatePresence>
                        {aiResult && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-5 bg-white rounded-2xl border border-[#5a3e91]/15 relative">
                                <p className="text-xs font-bold text-[#5a3e91] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Scale size={12} /> Résultats Légifrance
                                </p>
                                <p className="text-sm text-gray-500 mb-3">{aiResult}</p>
                                {legiResults.length > 0 && (
                                    <div className="space-y-3">
                                        {legiResults.map((r, i) => (
                                            <div key={r.id || i} className="p-4 rounded-xl border border-gray-100 hover:border-[#5a3e91]/20 transition-all">
                                                <p className="text-sm font-semibold text-[#2E2E2E]">{r.title}</p>
                                                {r.num && <p className="text-xs text-[#5a3e91] mt-0.5">Article {r.num}</p>}
                                                {r.date && <p className="text-[10px] text-gray-400 mt-0.5">{r.jurisdiction ? `${r.jurisdiction} — ` : ''}{r.date}</p>}
                                                <p className="text-xs text-gray-600 mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: (r.content || r.summary || '').replace(/<[^>]*>/g, '').substring(0, 300) + '...' }} />
                                                {r.solution && <p className="text-xs text-emerald-600 mt-1 font-medium">Solution: {r.solution}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filters + Search */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher dans votre base..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/60 focus:bg-white focus:shadow-xl transition-all outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm overflow-x-auto no-scrollbar">
                        {DOMAINS.map(d => (
                            <button key={d.id} onClick={() => setDomain(d.id)}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${domain === d.id ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                style={domain === d.id ? { backgroundColor: '#5a3e91' } : {}}>
                                {d.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Starred first */}
                {filtered.some(e => e.starred) && (
                    <div>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Star size={12} fill="currentColor" /> Arrêts favoris
                        </p>
                        <div className="space-y-2">
                            {filtered.filter(e => e.starred).map(entry => (
                                <EntryCard key={entry.id} entry={entry} selected={selected} onSelect={setSelected} onStar={toggleStar} onDelete={deleteEntry} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All entries */}
                {filtered.filter(e => !e.starred).length > 0 && (
                    <div>
                        {filtered.some(e => e.starred) && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Toute la base</p>
                        )}
                        <div className="space-y-2">
                            {filtered.filter(e => !e.starred).map(entry => (
                                <EntryCard key={entry.id} entry={entry} selected={selected} onSelect={setSelected} onStar={toggleStar} onDelete={deleteEntry} />
                            ))}
                        </div>
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <ScrollText size={40} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-gray-400">Aucun arrêt trouvé</p>
                        <p className="text-sm text-gray-300 mt-1">Utilisez la recherche IA ou ajoutez vos propres décisions.</p>
                    </div>
                )}
            </div>

            {/* Detail panel + overlay */}
            <AnimatePresence>
                {selected && (
                    <>
                    {/* Click-outside overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
                        onClick={() => setSelected(null)}
                    />
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col overflow-y-auto">
                        <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#5a3e91]/5 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <p className="text-base font-semibold text-[#2E2E2E] leading-tight">{selected.title}</p>
                                    <p className="text-xs text-[#5a3e91] mt-1">{selected.court}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border ${DOMAIN_COLORS[selected.domain] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {selected.domain}
                                </span>
                                {selected.number && (
                                    <span className="text-[9px] px-2.5 py-1 rounded-full font-mono text-gray-500 bg-gray-50 border border-gray-200">
                                        n° {selected.number}
                                    </span>
                                )}
                                {selected.date && (
                                    <span className="text-[9px] px-2.5 py-1 rounded-full text-gray-500 bg-gray-50 border border-gray-200 flex items-center gap-1">
                                        <Calendar size={9} />
                                        {new Date(selected.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-8 flex-1 space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <BookOpen size={12} /> Solution juridique
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">{selected.summary}</p>
                            </div>
                            {selected.tags.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Tag size={12} /> Tags
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.tags.map((tag, i) => (
                                            <span key={i} className="text-[9px] px-2.5 py-1 rounded-xl bg-[#5a3e91]/10 text-[#5a3e91] font-semibold uppercase tracking-widest">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-50 space-y-3">
                            {selected.url && (
                                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white"
                                    style={{ backgroundColor: '#5a3e91' }}>
                                    <Globe size={14} /> Voir la décision officielle
                                </a>
                            )}
                            <div className="flex gap-2">
                                <button onClick={() => copyToClipboard(selected.summary)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50">
                                    <Copy size={14} /> Copier
                                </button>
                                <button onClick={() => toggleStar(selected.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${selected.starred ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    {selected.starred ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                                    {selected.starred ? 'Favori' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Entry Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setShowAdd(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#5a3e91] to-[#7a5fb1] text-white rounded-t-3xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-light">Ajouter un arrêt</h2>
                                        <p className="text-[#c4b5e8] text-xs mt-1">Enrichissez votre base jurisprudentielle</p>
                                    </div>
                                    <button onClick={() => setShowAdd(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X size={18} /></button>
                                </div>
                            </div>
                            <div className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Intitulé de la décision *</label>
                                    <input value={newEntry.title || ''} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Ex: Cass. civ. 1ère — Obligation d'information médicale"
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#5a3e91]/30 outline-none text-sm transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Juridiction</label>
                                        <select value={newEntry.court || ''} onChange={e => setNewEntry(p => ({ ...p, court: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm">
                                            {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Domaine</label>
                                        <select value={newEntry.domain || 'civil'} onChange={e => setNewEntry(p => ({ ...p, domain: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm">
                                            {DOMAINS.filter(d => d.id !== 'all').map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Date de la décision</label>
                                        <input type="date" value={newEntry.date || ''} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">N° de pourvoi / décision</label>
                                        <input value={newEntry.number || ''} onChange={e => setNewEntry(p => ({ ...p, number: e.target.value }))}
                                            placeholder="Ex: 22-18.234"
                                            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Résumé / Solution juridique *</label>
                                    <textarea value={newEntry.summary || ''} onChange={e => setNewEntry(p => ({ ...p, summary: e.target.value }))}
                                        rows={4} placeholder="Décrivez la solution juridique retenue par la décision..."
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm resize-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">URL (Légifrance, etc.)</label>
                                    <input value={newEntry.url || ''} onChange={e => setNewEntry(p => ({ ...p, url: e.target.value }))}
                                        placeholder="https://www.legifrance.gouv.fr/..."
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Tags (séparés par virgules)</label>
                                    <input
                                        value={(newEntry.tags || []).join(', ')}
                                        onChange={e => setNewEntry(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                                        placeholder="responsabilité, contrat, préjudice..."
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white outline-none text-sm" />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">
                                        Annuler
                                    </button>
                                    <button onClick={addEntry} disabled={!newEntry.title || !newEntry.summary}
                                        className="flex-[2] py-3 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50"
                                        style={{ backgroundColor: '#5a3e91' }}>
                                        Enregistrer l'arrêt
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

/* ─── Entry Card Sub-component ─── */
function EntryCard({ entry, selected, onSelect, onStar, onDelete }: {
    entry: JurisprudenceEntry;
    selected: JurisprudenceEntry | null;
    onSelect: (e: JurisprudenceEntry) => void;
    onStar: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const isSelected = selected?.id === entry.id;
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 p-5 rounded-2xl border bg-white cursor-pointer transition-all hover:shadow-md
                ${isSelected ? 'ring-2 ring-[#5a3e91]/30 border-[#5a3e91]/20' : 'border-gray-50'}`}
            onClick={() => onSelect(entry)}>
            <div className="w-10 h-10 rounded-2xl bg-[#5a3e91]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Scale size={18} className="text-[#5a3e91]" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2E2E2E] truncate">{entry.title}</p>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={e => { e.stopPropagation(); onStar(entry.id); }}
                            className={`p-1.5 rounded-xl transition-all ${entry.starred ? 'text-amber-500' : 'text-gray-200 hover:text-amber-400'}`}>
                            <Star size={14} fill={entry.starred ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{entry.court}{entry.date ? ` — ${new Date(entry.date).toLocaleDateString('fr-FR')}` : ''}</p>
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{entry.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${DOMAIN_COLORS[entry.domain] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {entry.domain}
                    </span>
                    {entry.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-xl bg-[#5a3e91]/8 text-[#5a3e91] font-semibold">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <ChevronRight size={16} className={`text-gray-300 mt-1 transition-transform ${isSelected ? 'rotate-90 text-[#5a3e91]' : ''}`} />
        </motion.div>
    );
}
