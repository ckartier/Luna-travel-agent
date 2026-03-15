'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Star, Phone, Mail, Globe, MapPin, Edit3, Trash2, X, Heart,
    Filter, CreditCard, ShieldCheck, UserCheck, MessageCircle, ChevronRight, Activity,
    Briefcase, Languages, Check, Wallet, Sparkles, Users, Loader2,
    Hotel, UtensilsCrossed, Compass, Landmark, Car, Package, type LucideIcon
} from 'lucide-react';
import {
    CRMSupplier, SupplierCategory, getSuppliers, createSupplier,
    deleteSupplier, updateSupplier
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/src/components/ConfirmModal';

const CATEGORIES: { value: SupplierCategory; label: string; icon: LucideIcon; color: string; bgColor: string }[] = [
    { value: 'HÉBERGEMENT', label: 'Hébergement', icon: Hotel, color: 'text-[#2E2E2E]', bgColor: '#E3E2F3' },
    { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed, color: 'text-[#2E2E2E]', bgColor: '#F2D9D3' },
    { value: 'ACTIVITÉ', label: 'Activité', icon: Compass, color: 'text-[#2E2E2E]', bgColor: '#D3E8E3' },
    { value: 'CULTURE', label: 'Culture', icon: Landmark, color: 'text-[#2E2E2E]', bgColor: '#E3E2F3' },
    { value: 'TRANSPORT', label: 'Transport', icon: Car, color: 'text-[#2E2E2E]', bgColor: '#E6D2BD' },
    { value: 'GUIDE', label: 'Guide', icon: UserCheck, color: 'text-[#2E2E2E]', bgColor: '#bcdeea' },
    { value: 'AUTRE', label: 'Autre', icon: Package, color: 'text-[#2E2E2E]', bgColor: '#F3F4F6' },
];

const CLASSIC_LANGUAGES = [
    { code: 'FR', label: 'Français' },
    { code: 'EN', label: 'Anglais' },
    { code: 'ES', label: 'Espagnol' },
    { code: 'IT', label: 'Italien' },
    { code: 'DE', label: 'Allemand' },
    { code: 'ID', label: 'Indonésien' },
    { code: 'ZH', label: 'Chinois' },
    { code: 'JA', label: 'Japonais' },
];

const getCategoryMeta = (cat: SupplierCategory) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[6];

export default function SuppliersPage() {
    const { tenantId } = useAuth();
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<SupplierCategory | 'ALL' | 'LUNA_FRIENDS'>('ALL');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '', category: 'GUIDE' as SupplierCategory, country: '', city: '',
        phone: '', email: '', website: '', contactName: '', notes: '', commission: 0,
        professionalLicense: '', bankDetails: '',
        languages: [] as string[],
        isGuide: false,
        isChauffeur: false,
        hasLicense: false
    });
    const [batchScraping, setBatchScraping] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const data = await getSuppliers(tenantId);
            setSuppliers(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !tenantId) return;
        try {
            await createSupplier(tenantId, {
                ...form,
                tags: [],
                isFavorite: false,
                isLunaFriend: true, // All manually created = Luna Friends
                createdAt: new Date(),
                updatedAt: new Date()
            } as any);
            setShowModal(false);
            setForm({
                name: '', category: 'GUIDE', country: '', city: '', phone: '',
                email: '', website: '', contactName: '', notes: '', commission: 0,
                professionalLicense: '', bankDetails: '',
                languages: [],
                isGuide: false,
                isChauffeur: false,
                hasLicense: false
            });
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!tenantId) return;
        setDeleteTarget(id);
    };

    const handleConfirmDelete = async () => {
        if (!tenantId || !deleteTarget) return;
        try {
            await deleteSupplier(tenantId, deleteTarget);
            loadData();
        } catch (err) {
            console.error('Delete supplier error:', err);
        }
        setDeleteTarget(null);
    };

    const handleCancelDelete = () => {
        setDeleteTarget(null);
    };

    const toggleFavorite = async (s: CRMSupplier, e: React.MouseEvent) => {
        e.stopPropagation();
        await updateSupplier(tenantId!, s.id!, { isFavorite: !s.isFavorite });
        loadData();
    };

    const toggleLanguage = (code: string) => {
        setForm(prev => ({
            ...prev,
            languages: prev.languages.includes(code)
                ? prev.languages.filter(l => l !== code)
                : [...prev.languages, code]
        }));
    };

    const filtered = suppliers.filter(s => {
        const matchesCat = filterCat === 'ALL'
            || (filterCat === 'LUNA_FRIENDS' ? s.isLunaFriend : s.category === filterCat);
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.country || '').toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Batch scrape all suppliers missing photoURL
    const handleBatchScrape = async () => {
        if (batchScraping || !tenantId) return;
        const targets = suppliers.filter(s => !s.photoURL && s.website);
        if (targets.length === 0) return;
        setBatchScraping(true);
        setBatchProgress({ done: 0, total: targets.length });
        for (let i = 0; i < targets.length; i++) {
            try {
                const res = await fetch('/api/crm/scrape-supplier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: targets[i].website }),
                });
                const data = await res.json();
                if (data.image) {
                    await updateSupplier(tenantId, targets[i].id!, { photoURL: data.image });
                }
            } catch (err) { console.error('Batch scrape error:', err); }
            setBatchProgress({ done: i + 1, total: targets.length });
        }
        setBatchScraping(false);
        loadData();
    };

    // Stats
    const lunaFriendsCount = suppliers.filter(s => s.isLunaFriend).length;

    if (loading && suppliers.length === 0) return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
            <style jsx>{`
                    @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(-20%); } 100% { transform: translateX(0%); } }
                    .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
                `}</style>
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
                {/* Header Area */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
                >
                    <div className="space-y-1">
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Prestataires</T></h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Gérez vos guides, véhicules et services avec Luna Sync.</T> <span className="text-[#5a8fa3] font-medium">{lunaFriendsCount} Luna Friends</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Batch scrape button */}
                        {suppliers.filter(s => !s.photoURL && s.website).length > 0 && (
                            <button
                                onClick={handleBatchScrape}
                                disabled={batchScraping}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[12px] font-medium tracking-wide transition-all border border-[#bcdeea]/40 bg-[#bcdeea]/10 text-[#5a8fa3] hover:bg-[#bcdeea]/25 disabled:opacity-50"
                            >
                                {batchScraping ? (
                                    <><Loader2 size={16} className="animate-spin" /> {batchProgress.done}/{batchProgress.total}</>
                                ) : (
                                    <><Globe size={16} /> Scraper Images ({suppliers.filter(s => !s.photoURL && s.website).length})</>
                                )}
                            </button>
                        )}
                        <button onClick={() => setShowModal(true)} className="btn-expert btn-expert-primary gap-3 shadow-luxury">
                            <Plus size={20} /> <span className="uppercase tracking-widest"><T>Nouveau Prestataire</T></span>
                        </button>
                    </div>
                </motion.div>

                {/* Toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col lg:flex-row gap-4"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, ville, pays..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 rounded-[28px] border border-gray-100 bg-white/60 backdrop-blur-sm focus:bg-white focus:shadow-2xl focus:shadow-gray-100 transition-all outline-none text-sm font-normal font-sans"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                        <button onClick={() => setFilterCat('ALL')} className={`px-6 py-3.5 rounded-[12px] text-[12px] font-medium tracking-wide transition-all border whitespace-nowrap ${filterCat === 'ALL' ? 'bg-[#2E2E2E] text-white border-[#2E2E2E] scale-[1.02]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#bcdeea]'}`}>Tous</button>

                        {/* ★ LUNA FRIENDS - special filter */}
                        <button onClick={() => setFilterCat('LUNA_FRIENDS')} className={`flex items-center gap-2 px-6 py-3.5 rounded-[12px] text-[12px] font-medium tracking-wide transition-all border whitespace-nowrap ${filterCat === 'LUNA_FRIENDS' ? 'text-white border-[#D3E8E3] scale-[1.02]' : 'bg-[#D3E8E3]/20 text-[#2E2E2E] border-[#D3E8E3] hover:bg-[#D3E8E3]/40'}`} style={filterCat === 'LUNA_FRIENDS' ? { backgroundColor: '#D3E8E3' } : {}}>
                            <Sparkles size={14} /> Luna Friends
                            {lunaFriendsCount > 0 && <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${filterCat === 'LUNA_FRIENDS' ? 'bg-white/30 text-[#2E2E2E]' : 'text-[#2E2E2E]'}`}>{lunaFriendsCount}</span>}
                        </button>

                        {/* Category filters */}
                        {CATEGORIES.map(c => {
                            const Icon = c.icon;
                            return (
                                <button key={c.value} onClick={() => setFilterCat(c.value)} className={`flex items-center gap-2 px-5 py-3.5 rounded-[12px] text-[12px] font-medium tracking-wide transition-all border whitespace-nowrap ${filterCat === c.value ? 'text-[#2E2E2E] border-transparent scale-[1.02]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#bcdeea]'}`} style={filterCat === c.value ? { backgroundColor: c.bgColor } : {}}>
                                    <Icon size={16} strokeWidth={1.5} /> {c.label}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filtered.map((s, i) => (
                            <SupplierCard key={s.id} supplier={s} onDelete={handleDelete} onToggleFav={toggleFavorite} index={i} />
                        ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <Users size={48} className="mx-auto text-gray-200 mb-4" />
                            <h4 className="text-lg font-normal text-gray-400 uppercase tracking-tighter mb-2">
                                {filterCat === 'LUNA_FRIENDS' ? 'Aucun Luna Friend trouvé' : 'Aucun prestataire trouvé'}
                            </h4>
                            <p className="text-sm text-[#6B7280] mt-1 font-medium">
                                {filterCat === 'LUNA_FRIENDS'
                                    ? 'Créez votre premier prestataire manuellement pour le voir ici.'
                                    : 'Essayez avec un autre filtre ou ajoutez un nouveau prestataire.'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Modal: Create Supplier */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[24px] w-full max-w-2xl relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
                            >
                                {/* Luna Header */}
                                <div className="p-10 md:p-12 pb-6 bg-luna-charcoal text-white">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-3xl font-light leading-tight tracking-tight"><T>Nouveau Prestataire</T></h2>
                                                <span className="px-4 py-1.5 bg-[#bcdeea]/20 text-[#5a8fa3] rounded-2xl text-[9px] font-semibold uppercase tracking-widest border border-[#bcdeea]/30 flex items-center gap-1.5">
                                                    <Sparkles size={10} /> Luna Friend
                                                </span>
                                            </div>
                                            <p className="text-[#b9dae9] text-xs mt-1 font-medium">Enregistrement légal et compétences linguistiques</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                                    </div>
                                </div>
                                <div className="p-10 md:p-14 pt-8">
                                    <form onSubmit={handleAdd} className="space-y-10">
                                        {/* Category Toggles */}
                                        <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                                            {CATEGORIES.map(c => {
                                                const Icon = c.icon;
                                                return (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, category: c.value })}
                                                        className={`flex flex-col items-center justify-center p-5 rounded-[16px] border-2 transition-all gap-2.5 ${form.category === c.value ? 'border-[#2E2E2E] text-[#2E2E2E]' : 'border-transparent text-[#6B7280] hover:border-[#E5E7EB]'}`}
                                                        style={{ backgroundColor: form.category === c.value ? c.bgColor : '#F9FAFB' }}
                                                    >
                                                        <Icon size={24} strokeWidth={1.5} />
                                                        <span className="text-[9px] font-medium uppercase tracking-wider leading-none">{c.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Core Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nom / Raison Sociale</label>
                                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-[#bcdeea] focus:bg-white transition-all font-sans" placeholder="Nom complet..." required />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Ville</label>
                                                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Pays</label>
                                                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" />
                                            </div>
                                        </div>

                                        {/* Languages Selection */}
                                        <div className="p-8 bg-[#bcdeea]/10 rounded-[24px] border border-[#bcdeea]/15">
                                            <div className="flex items-center gap-2 mb-6">
                                                <Languages size={18} className="text-[#5a8fa3]" />
                                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#2E2E2E]/60">Langues Maîtrisées</h3>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {CLASSIC_LANGUAGES.map(lang => (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => toggleLanguage(lang.code)}
                                                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${form.languages.includes(lang.code) ? 'bg-[#5a8fa3] text-white border-[#5a8fa3]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#bcdeea]/40'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${form.languages.includes(lang.code) ? 'bg-white text-[#5a8fa3] border-white' : 'border-gray-200'}`}>
                                                            {form.languages.includes(lang.code) && <Check size={12} />}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{lang.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Roles & Status */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <button type="button" onClick={() => setForm({ ...form, isGuide: !form.isGuide })} className={`p-4 rounded-[20px] border flex flex-col items-center gap-2 transition-all ${form.isGuide ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50/50 border-transparent text-gray-400'}`}>
                                                <UserCheck size={20} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest"><T>Guide Certifié</T></span>
                                            </button>
                                            <button type="button" onClick={() => setForm({ ...form, isChauffeur: !form.isChauffeur })} className={`p-4 rounded-[20px] border flex flex-col items-center gap-2 transition-all ${form.isChauffeur ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-gray-50/50 border-transparent text-gray-400'}`}>
                                                <Briefcase size={20} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Chauffeur</span>
                                            </button>
                                            <button type="button" onClick={() => setForm({ ...form, hasLicense: !form.hasLicense })} className={`p-4 rounded-[20px] border flex flex-col items-center gap-2 transition-all ${form.hasLicense ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50/50 border-transparent text-gray-400'}`}>
                                                <ShieldCheck size={20} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Licence Pro OK</span>
                                            </button>
                                        </div>

                                        {/* Financial & Legal */}
                                        <div className="p-8 bg-[#bcdeea]/10 rounded-[24px] border border-[#bcdeea]/15 space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Wallet size={18} className="text-[#5a8fa3]" />
                                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#2E2E2E]/60">Informations Financières</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-[#5a8fa3]/60 uppercase tracking-widest block mb-2">Commission (%)</label>
                                                    <input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: +e.target.value })} className="w-full px-6 py-4 bg-white border-[#bcdeea]/20 rounded-2xl text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-[#5a8fa3]/60 uppercase tracking-widest block mb-2">RIB / IBAN</label>
                                                    <input value={form.bankDetails} onChange={e => setForm({ ...form, bankDetails: e.target.value })} className="w-full px-6 py-4 bg-white border-[#bcdeea]/20 rounded-2xl text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" placeholder="Virement Luna..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contacts */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Téléphone (WhatsApp)</label>
                                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" placeholder="+..." />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                                                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#bcdeea] font-sans" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes Internes</label>
                                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 h-28 font-sans" placeholder="Détails, retours d'expérience..." />
                                            </div>
                                        </div>

                                        <div className="pt-6 flex gap-6">
                                            <button type="button" onClick={() => setShowModal(false)} className="btn-expert btn-expert-glass flex-1 !py-6">Annuler</button>
                                            <button type="submit" className="btn-expert btn-expert-primary flex-[2] !py-6"><T>Nouveau Prestataire</T></button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal: Confirm Delete */}
                <ConfirmModal
                    open={!!deleteTarget}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    title="Supprimer le prestataire ?"
                    message="\u00cates-vous s\u00fbr de vouloir supprimer ce prestataire ? Cette action est irr\u00e9versible."
                    confirmLabel="Supprimer"
                    cancelLabel="Annuler"
                />
            </div>
        </div>
    );
}

// ── Supplier Card Component ──
function SupplierCard({ supplier: s, onDelete, onToggleFav, index = 0 }: { supplier: CRMSupplier; onDelete: (id: string, e: React.MouseEvent) => void; onToggleFav: (s: CRMSupplier, e: React.MouseEvent) => void; index?: number }) {
    const cat = getCategoryMeta(s.category);
    const { tenantId } = useAuth();
    const [scraping, setScraping] = useState(false);
    const [localPhoto, setLocalPhoto] = useState(s.photoURL || '');

    const handleScrapeImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!s.website || !tenantId || scraping) return;
        setScraping(true);
        try {
            const res = await fetch('/api/crm/scrape-supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: s.website }),
            });
            const data = await res.json();
            if (data.image) {
                await updateSupplier(tenantId, s.id!, { photoURL: data.image });
                setLocalPhoto(data.image);
            }
        } catch (err) { console.error(err); }
        setScraping(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-[24px] border border-gray-100 hover:border-[#bcdeea]/40 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)' }}
            whileHover={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.02)', y: -2 }}
        >
            {/* ── Cover image or category icon ── */}
            {localPhoto ? (
                <div className="relative w-full h-40 overflow-hidden">
                    <img src={localPhoto} alt={s.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {/* Category badge over image */}
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm bg-white/80 text-[#2E2E2E]">
                        {cat.label}
                    </div>
                </div>
            ) : (
                <div className="p-8 pb-0">
                    <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-6 transition-transform group-hover:scale-105 group-hover:-translate-y-0.5 duration-500" style={{ backgroundColor: cat.bgColor }}>
                        {(() => { const Icon = cat.icon; return <Icon size={28} strokeWidth={1.5} className="text-[#2E2E2E]" />; })()}
                    </div>
                </div>
            )}

            {/* Hover actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                {s.website && (
                    <button onClick={handleScrapeImage} disabled={scraping}
                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm hover:text-[#5a8fa3] transition-colors disabled:opacity-50"
                        title="Récupérer l'image du site">
                        {scraping ? <Loader2 size={16} className="animate-spin text-[#5a8fa3]" /> : <Globe size={16} className="text-gray-400" />}
                    </button>
                )}
                <button onClick={(e) => onToggleFav(s, e)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm hover:text-rose-500 transition-colors">
                    <Heart size={16} className={s.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-300'} />
                </button>
                <button onClick={(e) => onDelete(s.id!, e)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className={`space-y-6 ${localPhoto ? 'p-8 pt-5' : 'px-8 pb-8'}`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {!localPhoto && (
                            <span className={`text-[8px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-50 ${cat.color} border border-gray-100`}>
                                {cat.label}
                            </span>
                        )}
                        {s.isLunaFriend && <span className="text-[8px] font-semibold text-[#5a8fa3] bg-[#bcdeea]/15 px-3 py-1 rounded-full border border-[#bcdeea]/25 uppercase tracking-widest flex items-center gap-1"><Sparkles size={8} /> Luna Friend</span>}
                        {s.isGuide && <span className="text-[8px] font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest">Guide</span>}
                        {s.hasLicense && <span className="flex items-center gap-1 text-[8px] font-semibold text-[#5a8fa3] bg-[#bcdeea]/10 px-3 py-1 rounded-full border border-[#bcdeea]/20 uppercase tracking-widest"><ShieldCheck size={10} /> Pro</span>}
                    </div>
                    <h3 className="text-2xl font-normal text-luna-charcoal tracking-tighter uppercase leading-none group-hover:text-[#5a8fa3] transition-colors duration-300">{s.name}</h3>
                    <p className="text-xs text-gray-400 font-sans flex items-center gap-1.5 mt-2">
                        <MapPin size={14} className="text-gray-300" /> {s.city}, {s.country}
                    </p>
                </div>

                {s.languages && s.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {s.languages.map(l => (
                            <span key={l} className="text-[8px] font-semibold text-[#5a8fa3] bg-[#bcdeea]/10 px-2 py-0.5 rounded-lg border border-[#bcdeea]/20 uppercase tracking-widest">{l}</span>
                        ))}
                    </div>
                )}

                <div className="pt-4 flex gap-2">
                    {s.phone ? (
                        <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="btn-expert btn-expert-glass !bg-emerald-50 !text-emerald-700 hover:!bg-emerald-500 hover:!text-white flex-1 gap-2 !py-4">
                            <MessageCircle size={16} /> <span className="text-[10px]">WhatsApp</span>
                        </a>
                    ) : (
                        <div className="btn-expert btn-expert-glass !bg-gray-100 !text-gray-400 flex-1 gap-2 cursor-not-allowed !py-4 opacity-50">
                            <Phone size={16} /> <span className="text-[10px]">No Tel</span>
                        </div>
                    )}
                    {s.email ? (
                        <a href={`mailto:${s.email}`} className="btn-expert btn-expert-glass !bg-[#bcdeea]/15 !text-[#2E2E2E] hover:!bg-[#bcdeea] hover:!text-[#2E2E2E] flex-1 gap-2 !py-4">
                            <Mail size={16} /> <span className="text-[10px]">Gmail</span>
                        </a>
                    ) : (
                        <div className="btn-expert btn-expert-glass !bg-gray-100 !text-gray-400 flex-1 gap-2 cursor-not-allowed !py-4 opacity-50">
                            <Mail size={16} /> <span className="text-[10px]">No Mail</span>
                        </div>
                    )}
                    <Link href={`/crm/catalog?supplierId=${s.id}`} className="p-4 bg-[#2E2E2E] text-white rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2">
                        <Briefcase size={16} />
                    </Link>
                </div>

                <div className="pt-2">
                    <Link href={`/crm/suppliers/${s.id}`} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[16px] hover:bg-white hover:shadow-lg transition-all duration-300 text-gray-400 hover:text-[#5a8fa3] group/btn border border-transparent hover:border-[#bcdeea]/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                                <Activity size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ouvrir la fiche</span>
                        </div>
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

