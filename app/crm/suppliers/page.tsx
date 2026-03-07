'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Star, Phone, Mail, Globe, MapPin, Edit3, Trash2, X, Heart,
    Filter, CreditCard, ShieldCheck, UserCheck, MessageCircle, ChevronRight, Activity,
    Briefcase, Languages, Check, Wallet, Sparkles, Users
} from 'lucide-react';
import {
    CRMSupplier, SupplierCategory, getSuppliers, createSupplier,
    deleteSupplier, updateSupplier
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { value: SupplierCategory; label: string; emoji: string; color: string; gradient: string }[] = [
    { value: 'HÉBERGEMENT', label: 'Hébergement', emoji: '🏨', color: 'text-indigo-600', gradient: 'from-indigo-500 to-slate-500' },
    { value: 'RESTAURANT', label: 'Restaurant', emoji: '🍽️', color: 'text-rose-600', gradient: 'from-rose-500 to-pink-500' },
    { value: 'ACTIVITÉ', label: 'Activité', emoji: '🎯', color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
    { value: 'CULTURE', label: 'Culture', emoji: '🏛️', color: 'text-purple-600', gradient: 'from-purple-500 to-violet-500' },
    { value: 'TRANSPORT', label: 'Transport', emoji: '🚗', color: 'text-emerald-600', gradient: 'from-emerald-500 to-cyan-500' },
    { value: 'GUIDE', label: 'Guide', emoji: '🧭', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
    { value: 'AUTRE', label: 'Autre', emoji: '📦', color: 'text-gray-600', gradient: 'from-gray-500 to-slate-500' },
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
        if (!confirm('Supprimer ce prestataire ?')) return;
        await deleteSupplier(tenantId!, id);
        loadData();
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
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-normal text-luna-charcoal tracking-tight uppercase"><T>Prestataires</T></h1>
                    <p className="text-sm text-gray-400 font-sans tracking-tight">Gérez vos guides, véhicules et services avec Luna Sync. <span className="text-emerald-500 font-bold">{lunaFriendsCount} Luna Friends</span></p>
                </div>
                <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-luna-charcoal text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center gap-2">
                    <Plus size={18} /> Nouveau Prestataire
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
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
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button onClick={() => setFilterCat('ALL')} className={`px-6 py-4 rounded-3xl text-[9px] font-bold tracking-widest transition-all border whitespace-nowrap ${filterCat === 'ALL' ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>TOUS</button>

                    {/* ★ LUNA FRIENDS - special filter */}
                    <button onClick={() => setFilterCat('LUNA_FRIENDS')} className={`flex items-center gap-2 px-6 py-4 rounded-3xl text-[9px] font-bold tracking-widest transition-all border whitespace-nowrap ${filterCat === 'LUNA_FRIENDS' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-xl shadow-emerald-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50'}`}>
                        <Sparkles size={12} /> LUNA FRIENDS
                        {lunaFriendsCount > 0 && <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${filterCat === 'LUNA_FRIENDS' ? 'bg-white/20 text-white' : 'bg-emerald-200/60 text-emerald-700'}`}>{lunaFriendsCount}</span>}
                    </button>

                    {/* Category filters */}
                    {CATEGORIES.map(c => (
                        <button key={c.value} onClick={() => setFilterCat(c.value)} className={`flex items-center gap-2 px-6 py-4 rounded-3xl text-[9px] font-bold tracking-widest transition-all border whitespace-nowrap ${filterCat === c.value ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                            {c.emoji} {c.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filtered.map(s => (
                        <SupplierCard key={s.id} supplier={s} onDelete={handleDelete} onToggleFav={toggleFavorite} />
                    ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                    <div className="col-span-full py-24 text-center">
                        <Users size={48} className="mx-auto text-gray-200 mb-4" />
                        <h4 className="text-lg font-normal text-gray-400 uppercase tracking-tighter mb-2">
                            {filterCat === 'LUNA_FRIENDS' ? 'Aucun Luna Friend trouvé' : 'Aucun prestataire trouvé'}
                        </h4>
                        <p className="text-sm text-gray-400 font-sans">
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[48px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="p-10 md:p-14">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-normal leading-tight tracking-tighter uppercase">Fiche Prestataire</h2>
                                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                                <Sparkles size={10} /> Luna Friend
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enregistrement légal et compétences linguistiques.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-4 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"><X size={24} /></button>
                                </div>

                                <form onSubmit={handleAdd} className="space-y-10">
                                    {/* Category Toggles */}
                                    <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                                        {CATEGORIES.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, category: c.value })}
                                                className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all gap-2 ${form.category === c.value ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-2xl shadow-gray-200' : 'bg-gray-50/50 text-gray-400 border-gray-50 hover:bg-white hover:border-emerald-100'}`}
                                            >
                                                <span className="text-2xl">{c.emoji}</span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest leading-none">{c.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Core Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nom / Raison Sociale</label>
                                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" placeholder="Nom complet..." required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Ville</label>
                                            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-emerald-200 font-sans" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Pays</label>
                                            <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm focus:ring-2 focus:ring-emerald-200 font-sans" />
                                        </div>
                                    </div>

                                    {/* Languages Selection */}
                                    <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-50">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Languages size={18} className="text-indigo-500" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-900/60">Langues Maîtrisées</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {CLASSIC_LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => toggleLanguage(lang.code)}
                                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${form.languages.includes(lang.code) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${form.languages.includes(lang.code) ? 'bg-white text-indigo-500 border-white' : 'border-gray-200'}`}>
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
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Guide Certifié</span>
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
                                    <div className="p-8 bg-emerald-50/30 rounded-[40px] border border-emerald-50/50 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet size={18} className="text-emerald-500" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/60">Informations Financières</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest block mb-2">Commission (%)</label>
                                                <input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: +e.target.value })} className="w-full px-6 py-4 bg-white border-emerald-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 font-sans" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest block mb-2">RIB / IBAN</label>
                                                <input value={form.bankDetails} onChange={e => setForm({ ...form, bankDetails: e.target.value })} className="w-full px-6 py-4 bg-white border-emerald-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 font-sans" placeholder="Virement Luna..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contacts */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Téléphone (WhatsApp)</label>
                                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 font-sans" placeholder="+..." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                                            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 font-sans" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes Internes</label>
                                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 h-28 font-sans" placeholder="Détails, retours d'expérience..." />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex gap-6">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-[28px] font-bold hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]">Annuler</button>
                                        <button type="submit" className="flex-[2] py-5 bg-luna-charcoal text-white rounded-[28px] font-bold shadow-2xl shadow-gray-200 hover:bg-black transition-all uppercase tracking-widest text-[10px]">Enregistrer le Prestataire</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Supplier Card Component ──
function SupplierCard({ supplier: s, onDelete, onToggleFav }: { supplier: CRMSupplier; onDelete: (id: string, e: React.MouseEvent) => void; onToggleFav: (s: CRMSupplier, e: React.MouseEvent) => void }) {
    const cat = getCategoryMeta(s.category);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[48px] p-8 border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-50/50 transition-all group cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-emerald-50/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />

            <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => onToggleFav(s, e)} className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:text-rose-500 transition-colors">
                    <Heart size={18} className={s.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-300'} />
                </button>
                <button onClick={(e) => onDelete(s.id!, e)} className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>

            <div className={`w-20 h-20 rounded-[32px] bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center text-4xl mb-8 shadow-xl shadow-gray-200 transition-transform group-hover:scale-105 duration-500`}>
                {cat.emoji}
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-50 ${cat.color} border border-gray-100`}>
                            {cat.label}
                        </span>
                        {s.isLunaFriend && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1"><Sparkles size={8} /> Luna Friend</span>}
                        {s.isGuide && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest">Guide</span>}
                        {s.hasLicense && <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest"><ShieldCheck size={10} /> Pro</span>}
                    </div>
                    <h3 className="text-2xl font-normal text-luna-charcoal tracking-tighter uppercase leading-none group-hover:text-emerald-600 transition-colors">{s.name}</h3>
                    <p className="text-xs text-gray-400 font-sans flex items-center gap-1.5 mt-2">
                        <MapPin size={14} className="text-gray-300" /> {s.city}, {s.country}
                    </p>
                </div>

                {s.languages && s.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {s.languages.map(l => (
                            <span key={l} className="text-[8px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100/50 uppercase tracking-widest">{l}</span>
                        ))}
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    {s.phone ? (
                        <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-[20px] text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                            <MessageCircle size={14} /> WhatsApp
                        </a>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-300 rounded-[20px] text-[9px] font-bold uppercase tracking-widest cursor-not-allowed">
                            <Phone size={14} /> Aucun Tel
                        </div>
                    )}
                    <Link href={`/crm/catalog?supplierId=${s.id}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-500 rounded-[20px] text-[9px] font-bold uppercase tracking-widest hover:bg-luna-charcoal hover:text-white transition-all shadow-sm">
                        <Briefcase size={14} /> Services
                    </Link>
                </div>

                <div className="pt-2">
                    <Link href={`/crm/suppliers/${s.id}`} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[24px] hover:bg-white hover:shadow-2xl hover:shadow-gray-200 transition-all text-gray-400 hover:text-emerald-600 group/btn border border-transparent hover:border-emerald-100">
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
