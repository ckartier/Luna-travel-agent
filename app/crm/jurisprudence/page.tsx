'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ScrollText, Search, BookOpen, Scale, Gavel, ExternalLink,
    Plus, X, Loader2, ChevronRight, ChevronDown, Tag, Calendar, Star, StarOff,
    Globe, FileText, Copy, CheckCircle2, Filter
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';

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

const NOTES_ENTITY_TYPE = 'jurisprudence';
const NOTES_ENTITY_ID = 'library';

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
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newEntry, setNewEntry] = useState<Partial<JurisprudenceEntry>>({
        title: '', court: 'Cour de Cassation', date: '', number: '',
        domain: 'civil', summary: '', url: '', tags: [], starred: false,
    });

    // Load from Firestore
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchWithAuth(`/api/crm/notes?entityType=${NOTES_ENTITY_TYPE}&entityId=${NOTES_ENTITY_ID}`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped: JurisprudenceEntry[] = (data.notes || []).map((note: any) => {
                        let parsed: any = {};
                        if (typeof note.content === 'string') {
                            try {
                                parsed = JSON.parse(note.content);
                            } catch {
                                parsed = {};
                            }
                        }

                        const src = Object.keys(parsed).length > 0 ? parsed : note;
                        return {
                            id: src.id || note.id,
                            title: src.title || '',
                            court: src.court || 'Cour de Cassation',
                            date: src.date || '',
                            number: src.number || '',
                            domain: src.domain || 'civil',
                            summary: src.summary || '',
                            url: src.url || '',
                            starred: !!src.starred,
                            tags: Array.isArray(src.tags) ? src.tags : [],
                            addedAt: src.addedAt || note.createdAt || new Date().toISOString(),
                        };
                    });
                    setEntries(mapped);
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

    // Fetch latest jurisprudence decisions on first load
    useEffect(() => {
        const fetchDefault = async () => {
            if (aiResult) return;
            setLegiTab('jurisprudence');
            setAiLoading(true);
            try {
                const res = await fetchWithAuth('/api/crm/legifrance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'search_jurisprudence', query: '*', pageSize: 8 }),
                });
                const data = await res.json();
                if (data.results) {
                    setLegiResults(data.results);
                    setAiResult(`${data.totalCount || data.results.length} décision(s) récente(s)`);
                }
            } catch {
                // Ignore silent fail for default fetch
            }
            setAiLoading(false);
        };
        fetchDefault();
    }, []);

    const filtered = entries.filter(e => {
        const matchSearch = `${e.title} ${e.court} ${e.summary} ${e.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
        const matchDomain = domain === 'all' || e.domain === domain;
        return matchSearch && matchDomain;
    }).sort((a, b) => +b.starred - +a.starred);

    const addEntry = async () => {
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

        try {
            const res = await fetchWithAuth('/api/crm/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType: NOTES_ENTITY_TYPE,
                    entityId: NOTES_ENTITY_ID,
                    content: JSON.stringify(entry),
                    isPinned: entry.starred,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(prev => [{ ...entry, id: data.id || entry.id }, ...prev]);
            }
        } catch (e) {
            console.error(e);
        }

        setShowAdd(false);
        setNewEntry({ title: '', court: 'Cour de Cassation', date: '', number: '', domain: 'civil', summary: '', url: '', tags: [], starred: false });
    };

    const toggleStar = async (id: string) => {
        const updated = entries.map(e => e.id === id ? { ...e, starred: !e.starred } : e);
        setEntries(updated);
        const target = updated.find(e => e.id === id);
        if (selected?.id === id && target) setSelected(target);

        if (!target) return;
        try {
            await fetchWithAuth(`/api/crm/notes?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: JSON.stringify(target),
                    isPinned: target.starred,
                }),
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteEntry = async (id: string) => {
        const previous = entries;
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        if (selected?.id === id) setSelected(null);

        try {
            await fetchWithAuth(`/api/crm/notes?id=${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error(e);
            setEntries(previous);
        }
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

                {/* ═══ HEADER — Premium Legal ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ boxShadow: ['0 0 0 0px rgba(160,120,80,0)', '0 0 20px 4px rgba(160,120,80,0.15)', '0 0 0 0px rgba(160,120,80,0)'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A07850] to-[#C4A57B] flex items-center justify-center shadow-lg"
                            >
                                <ScrollText size={22} className="text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Jurisprudence</T></h1>
                                <p className="text-sm text-[#6B7280] font-medium mt-0.5">
                                    Base de décisions • <span className="text-[#A07850] font-semibold">{entries.length} arrêts enregistrés</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <motion.button onClick={() => setShowAdd(true)}
                        whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg bg-gradient-to-r from-[#A07850] to-[#8B6540] hover:shadow-xl">
                        <Plus size={16} /> Ajouter un arrêt
                    </motion.button>
                </motion.div>

                {/* ═══ LÉGIFRANCE SEARCH — Glassmorphic ═══ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                    className="relative overflow-hidden rounded-3xl border border-[#A07850]/15 p-7 backdrop-blur-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(160,120,80,0.04) 0%, rgba(255,255,255,0.9) 50%, rgba(196,165,123,0.06) 100%)' }}>
                    {/* Decorative glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#A07850]/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#C4A57B]/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <motion.div
                                animate={{ rotate: [0, 5, 0, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A07850] to-[#8B6540] flex items-center justify-center shadow-md"
                            >
                                <Scale size={18} className="text-white" />
                            </motion.div>
                            <div>
                                <h2 className="text-base font-semibold text-[#2E2E2E] tracking-tight"><T>Recherche Légifrance</T></h2>
                                <p className="text-xs text-gray-400"><T>Articles de loi et jurisprudence officielle — API DILA/PISTE</T></p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 mb-4">
                            {(['articles', 'jurisprudence'] as const).map(tab => (
                                <motion.button key={tab} onClick={() => setLegiTab(tab)}
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${legiTab === tab
                                        ? 'bg-gradient-to-r from-[#A07850] to-[#8B6540] text-white shadow-md'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                                    {tab === 'articles' ? 'Articles de loi' : 'Jurisprudence'}
                                </motion.button>
                            ))}
                            {legiTab === 'articles' && (
                                <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)}
                                    className="ml-auto px-4 py-2 rounded-xl border border-[#A07850]/15 text-xs bg-white/80 backdrop-blur-sm focus:border-[#A07850]/40 outline-none transition-all">
                                    {CODES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <motion.div
                                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#A07850]/20 to-[#C4A57B]/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-md -z-10"
                                />
                                <Gavel className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A07850]/40 group-focus-within:text-[#A07850] transition-colors" size={16} />
                                <input
                                    value={aiSearch}
                                    onChange={e => setAiSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLegifranceSearch()}
                                    placeholder={legiTab === 'articles' ? 'Ex: responsabilité, article 1240, vice caché...' : 'Ex: responsabilité médicale, préjudice corporel...'}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#A07850]/15 bg-white/80 backdrop-blur-sm focus:bg-white focus:border-[#A07850]/40 focus:shadow-lg focus:shadow-[#A07850]/5 outline-none text-sm transition-all duration-300"
                                />
                            </div>
                            <motion.button onClick={handleLegifranceSearch} disabled={!aiSearch.trim() || aiLoading}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                className="px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg bg-gradient-to-r from-[#A07850] to-[#8B6540] hover:shadow-xl">
                                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                Rechercher
                            </motion.button>
                        </div>
                    </div>

                    {/* ═══ RESULTS ═══ */}
                    <AnimatePresence>
                        {aiResult && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                className="relative z-10 mt-6 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-[#A07850]/10 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-bold text-[#A07850] uppercase tracking-widest flex items-center gap-2">
                                        <Scale size={12} /> Résultats Légifrance
                                    </p>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{aiResult}</span>
                                </div>
                                {legiResults.length > 0 && (
                                    <div className="space-y-3">
                                        {legiResults.map((r, i) => {
                                            const cardId = r.id || String(i);
                                            const isExpanded = expandedId === cardId;
                                            const rawText = (r.content || r.summary || '').replace(/<[^>]*>/g, '');
                                            return (
                                            <motion.div
                                                key={cardId}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                                onClick={() => setExpandedId(isExpanded ? null : cardId)}
                                                className={`group p-5 rounded-2xl border bg-white hover:shadow-md transition-all duration-300 cursor-pointer ${isExpanded ? 'border-[#A07850]/30 shadow-md' : 'border-gray-100 hover:border-[#A07850]/25'}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isExpanded ? 'bg-[#A07850]/15' : 'bg-[#A07850]/8 group-hover:bg-[#A07850]/15'}`}>
                                                        {legiTab === 'articles' ? <BookOpen size={16} className="text-[#A07850]" /> : <Gavel size={16} className="text-[#A07850]" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold leading-snug transition-colors ${isExpanded ? 'text-[#A07850]' : 'text-[#2E2E2E] group-hover:text-[#A07850]'}`}>{r.title}</p>
                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                            {r.num && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#A07850]/8 text-[#A07850] font-bold">Art. {r.num}</span>}
                                                            {r.number && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-mono">n° {r.number}</span>}
                                                            {r.date && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={9} />{r.jurisdiction ? `${r.jurisdiction} — ` : ''}{r.date}</span>}
                                                            {r.etat && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold uppercase tracking-wider">{r.etat}</span>}
                                                        </div>
                                                        {/* Collapsed: truncated preview */}
                                                        {!isExpanded && (
                                                            <p className="text-xs text-gray-500 mt-2.5 leading-relaxed line-clamp-2">{rawText.substring(0, 200)}{rawText.length > 200 ? '...' : ''}</p>
                                                        )}
                                                        {/* Expanded: full content */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-4 p-4 bg-[#A07850]/5 rounded-xl border border-[#A07850]/10">
                                                                        <p className="text-[10px] font-bold text-[#A07850] uppercase tracking-widest mb-2"><T>Texte intégral</T></p>
                                                                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{rawText || 'Aucun contenu disponible.'}</p>
                                                                    </div>
                                                                    {r.solution && (
                                                                        <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2">
                                                                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1"><T>Solution</T></p>
                                                                                <p className="text-xs text-emerald-700 font-medium">{r.solution}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(rawText); }}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#A07850] hover:border-[#A07850]/30 transition-all"
                                                                        >
                                                                            <Copy size={11} /> {copied ? 'Copié !' : 'Copier'}
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                        {!isExpanded && r.solution && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                                <p className="text-xs text-emerald-600 font-medium">Solution : {r.solution}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronDown size={16} className={`shrink-0 mt-1 transition-all duration-300 ${isExpanded ? 'text-[#A07850] rotate-180' : 'text-gray-300 group-hover:text-[#A07850]'}`} />
                                                </div>
                                            </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ═══ FILTERS + SEARCH — Premium ═══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative flex-1 max-w-sm group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#A07850] transition-colors" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher dans votre base..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/70 backdrop-blur-sm focus:bg-white focus:shadow-lg focus:shadow-[#A07850]/5 focus:border-[#A07850]/25 transition-all duration-300 outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-1 shadow-sm overflow-x-auto no-scrollbar">
                        {DOMAINS.map(d => (
                            <motion.button key={d.id} onClick={() => setDomain(d.id)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${domain === d.id ? 'text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                style={domain === d.id ? { background: 'linear-gradient(135deg, #A07850, #8B6540)' } : {}}>
                                {d.label}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* ═══ STARRED ENTRIES ═══ */}
                {filtered.some(e => e.starred) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Star size={12} fill="currentColor" /> Arrêts favoris
                        </p>
                        <div className="space-y-2">
                            {filtered.filter(e => e.starred).map((entry, i) => (
                                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <EntryCard entry={entry} selected={selected} onSelect={setSelected} onStar={toggleStar} onDelete={deleteEntry} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ═══ ALL ENTRIES ═══ */}
                {filtered.filter(e => !e.starred).length > 0 && (
                    <div>
                        {filtered.some(e => e.starred) && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3"><T>Toute la base</T></p>
                        )}
                        <div className="space-y-2">
                            {filtered.filter(e => !e.starred).map((entry, i) => (
                                <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
                                    <EntryCard entry={entry} selected={selected} onSelect={setSelected} onStar={toggleStar} onDelete={deleteEntry} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ EMPTY STATE ═══ */}
                {filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                            <ScrollText size={48} className="mx-auto text-[#A07850]/15 mb-4" />
                        </motion.div>
                        <p className="text-lg font-light text-gray-400"><T>Aucun arrêt trouvé</T></p>
                        <p className="text-sm text-gray-300 mt-1"><T>Utilisez la recherche Légifrance ou ajoutez vos propres décisions.</T></p>
                    </motion.div>
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
                        <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#A07850]/5 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                    <p className="text-base font-semibold text-[#2E2E2E] leading-tight">{selected.title}</p>
                                    <p className="text-xs text-[#A07850] mt-1">{selected.court}</p>
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
                                            <span key={i} className="text-[9px] px-2.5 py-1 rounded-xl bg-[#A07850]/10 text-[#A07850] font-semibold uppercase tracking-widest">
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
                                    style={{ backgroundColor: '#A07850' }}>
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
                            <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-[#A07850] to-[#C4A57B] text-white rounded-t-3xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-light"><T>Ajouter un arrêt</T></h2>
                                        <p className="text-[#c4a57b] text-xs mt-1"><T>Enrichissez votre base jurisprudentielle</T></p>
                                    </div>
                                    <button onClick={() => setShowAdd(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X size={18} /></button>
                                </div>
                            </div>
                            <div className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Intitulé de la décision *</label>
                                    <input value={newEntry.title || ''} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Ex: Cass. civ. 1ère — Obligation d'information médicale"
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#A07850]/30 outline-none text-sm transition-all" />
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
                                        style={{ backgroundColor: '#A07850' }}>
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
                ${isSelected ? 'ring-2 ring-[#A07850]/30 border-[#A07850]/20' : 'border-gray-50'}`}
            onClick={() => onSelect(entry)}>
            <div className="w-10 h-10 rounded-2xl bg-[#A07850]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Scale size={18} className="text-[#A07850]" />
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
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-xl bg-[#A07850]/8 text-[#A07850] font-semibold">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <ChevronRight size={16} className={`text-gray-300 mt-1 transition-transform ${isSelected ? 'rotate-90 text-[#A07850]' : ''}`} />
        </motion.div>
    );
}
