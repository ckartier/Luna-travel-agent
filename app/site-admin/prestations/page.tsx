'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, Trash2, X, Hotel, Plane, MapPin, Car, UtensilsCrossed,
    Image as ImageIcon, Pencil, Package, Eye, Video, Loader2, Download
} from 'lucide-react';
import Link from 'next/link';
import {
    CRMCatalogItem, getCatalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

const TYPES = [
    { value: 'HOTEL', label: 'Hôtel', icon: Hotel, color: 'from-sky-500 to-blue-600' },
    { value: 'FLIGHT', label: 'Vol', icon: Plane, color: 'from-violet-500 to-purple-600' },
    { value: 'ACTIVITY', label: 'Activité', icon: MapPin, color: 'from-emerald-500 to-green-600' },
    { value: 'TRANSFER', label: 'Transfert', icon: Car, color: 'from-amber-500 to-orange-600' },
    { value: 'OTHER', label: 'Autre', icon: UtensilsCrossed, color: 'from-rose-500 to-pink-600' },
] as const;

export default function AdminPrestationsPage() {
    const { tenantId } = useAuth();
    const [items, setItems] = useState<CRMCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<CRMCatalogItem | null>(null);
    const [photoURLs, setPhotoURLs] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const emptyForm = {
        type: 'HOTEL' as CRMCatalogItem['type'],
        name: '', location: '', description: '',
        netCost: 0, recommendedMarkup: 30,
        supplier: '', supplierId: '',
        video: '',
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { if (tenantId) loadData(); }, [tenantId]);

    const loadData = async () => {
        setLoading(true);
        try { setItems(await getCatalogItems(tenantId!)); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('file', file);
            try {
                const res = await fetchWithAuth('/api/crm/upload', {
                    method: 'POST',
                    body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Erreur upload');
                setPhotoURLs(prev => [...prev, data.url]);
            } catch (err) {
                console.error('Upload error:', err);
                const reader = new FileReader();
                reader.onload = (ev) => { if (ev.target?.result) setPhotoURLs(prev => [...prev, ev.target!.result as string]); };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation taille (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            alert('La vidéo est trop volumineuse (max 100MB)');
            return;
        }

        setUploadingVideo(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetchWithAuth('/api/crm/upload', {
                method: 'POST',
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur upload');
            setFormData(prev => ({ ...prev, video: data.url }));
        } catch (error: any) {
            console.error('Erreur upload vidéo:', error);
            alert(`Erreur upload: ${error?.message || 'Erreur inconnue'}`);
        } finally {
            setUploadingVideo(false);
            if (videoRef.current) videoRef.current.value = '';
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData(emptyForm);
        setPhotoURLs([]);
        setShowModal(true);
    };

    const openEdit = (item: CRMCatalogItem) => {
        setEditingItem(item);
        setFormData({
            type: item.type,
            name: item.name,
            location: item.location,
            description: item.description,
            netCost: item.netCost,
            recommendedMarkup: item.recommendedMarkup,
            supplier: item.supplier || '',
            supplierId: item.supplierId || '',
            video: item.video || '',
        });
        setPhotoURLs(item.images || (item.imageUrl ? [item.imageUrl] : []));
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !tenantId) return;
        const payload: any = {
            ...formData,
            supplier: formData.supplier || 'Non défini',
            currency: 'EUR',
            images: photoURLs.length > 0 ? photoURLs : undefined,
            video: formData.video || undefined,
        };

        if (editingItem?.id) {
            await updateCatalogItem(tenantId, editingItem.id, payload);
        } else {
            await createCatalogItem(tenantId, payload);
        }
        setShowModal(false);
        setEditingItem(null);
        setFormData(emptyForm);
        setPhotoURLs([]);
        loadData();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Supprimer cette prestation ?')) return;
        await deleteCatalogItem(tenantId!, id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const getTypeConfig = (t: string) => TYPES.find(tp => tp.value === t) || TYPES[4];

    const filtered = items.filter(i => {
        const matchType = filter === 'ALL' || i.type === filter;
        const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading && items.length === 0) return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-[#2E2E2E] w-full origin-left animate-pulse" />
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1400px] mx-auto w-full space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center border border-gray-100">
                                <Package size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-light text-[#2E2E2E] tracking-tight">Prestations</h1>
                            </div>
                        </div>
                        <p className="text-sm text-[#9CA3AF] font-light mt-1">Gérez les services affichés sur votre site. Synchronisé avec le CRM en temps réel.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={tenantId ? `/conciergerie?tenantId=${encodeURIComponent(tenantId)}` : '/conciergerie'} target="_blank"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-300 transition-all shadow-sm">
                            <Eye size={14} /> Voir le site
                        </Link>
                        <button onClick={openCreate} className="px-5 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#1a1a1a] transition-all flex items-center gap-2 shadow-lg shadow-[#2E2E2E]/10">
                            <Plus size={14} /> Nouvelle Prestation
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                        <input type="text" placeholder="Rechercher une prestation, un lieu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-white focus:border-[#bcdeea] focus:shadow-sm transition-all outline-none text-sm text-[#2E2E2E] placeholder:text-[#C4C4C4]" />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button onClick={() => setFilter('ALL')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-[0.12em] transition-all border ${filter === 'ALL' ? 'bg-[#2E2E2E] text-white border-[#2E2E2E]' : 'bg-white text-[#9CA3AF] border-gray-100 hover:border-gray-200'}`}>TOUT</button>
                        {TYPES.map(t => (
                            <button key={t.value} onClick={() => setFilter(t.value)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-[0.12em] transition-all border whitespace-nowrap ${filter === t.value ? 'bg-[#2E2E2E] text-white border-[#2E2E2E]' : 'bg-white text-[#9CA3AF] border-gray-100 hover:border-gray-200'}`}>
                                <t.icon size={12} /> {t.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((item, i) => {
                        const typeConf = getTypeConfig(item.type);
                        const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
                        return (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                onClick={() => openEdit(item)}
                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#bcdeea]/50 hover:shadow-md transition-all group cursor-pointer flex flex-col h-full">
                                <div className="h-36 relative overflow-hidden bg-[#FAFAFA]">
                                    {(item.images && item.images.length > 0) || item.imageUrl ? (
                                        <img src={item.images?.[0] || item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${typeConf.color} opacity-10 flex items-center justify-center`}>
                                            <typeConf.icon size={32} className="text-[#D4D4D4]" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[#6B7280]">{typeConf.label}</span>
                                    </div>
                                    {item.video && (
                                        <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Video size={10} /> Vidéo
                                        </div>
                                    )}
                                    {/* Edit icon on hover */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
                                            <Pencil size={12} className="text-[#2E2E2E]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#bcdeea] font-semibold uppercase tracking-[0.1em] mb-1">
                                        <MapPin size={10} /> {item.location || '—'}
                                    </div>
                                    <h3 className="text-sm font-bold text-[#2E2E2E] line-clamp-1 group-hover:text-[#6B9DB5] transition-colors">{item.name}</h3>
                                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed mt-1 flex-1 font-light">{item.description}</p>

                                    <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em]">Prix Client</p>
                                            <p className="text-base font-light text-[#2E2E2E]">{clientPrice} €</p>
                                        </div>
                                        <button onClick={(e) => handleDelete(item.id!, e)} className="p-1.5 text-[#D4D4D4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Modal — Create / Edit */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
                            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                className="bg-white rounded-[40px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                                {/* Luna Header */}
                                <div className="p-8 pb-5 bg-luna-charcoal text-white shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-light tracking-tight">{editingItem ? 'Modifier la Prestation' : 'Nouvelle Prestation'}</h2>
                                            <p className="text-[#b9dae9] text-xs mt-1 font-medium">Synchronisé avec le CRM en temps réel</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                    </div>
                                </div>

                                <div className="p-8 space-y-5 overflow-y-auto flex-1 no-scrollbar">

                                    {/* Type */}
                                    <div className="grid grid-cols-5 gap-2">
                                        {TYPES.map(t => (
                                            <button key={t.value} onClick={() => setFormData({ ...formData, type: t.value as any })}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${formData.type === t.value ? 'bg-[#2E2E2E] text-white border-[#2E2E2E]' : 'bg-[#FAFAFA] text-[#9CA3AF] border-gray-100 hover:border-[#bcdeea]'}`}>
                                                <t.icon size={16} />
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Photos */}
                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Visuels</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {photoURLs.map((url, i) => (
                                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-100 relative group">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button onClick={() => setPhotoURLs(p => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-[#D4D4D4] hover:text-[#bcdeea] hover:border-[#bcdeea] transition-all">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                                    </div>

                                    {/* Video */}
                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Vidéo</label>
                                        <div className="flex gap-2">
                                            <input value={formData.video} onChange={e => setFormData({ ...formData, video: e.target.value })} className="flex-1 px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="URL vidéo ou uploader →" />
                                            <button onClick={() => videoRef.current?.click()} disabled={uploadingVideo}
                                                className="px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-200 transition-all flex items-center gap-1.5 shadow-sm">
                                                {uploadingVideo ? <Loader2 size={14} className="animate-spin" /> : <><Video size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Upload</span></>}
                                            </button>
                                        </div>
                                        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoUpload} />
                                        {formData.video && (
                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                                                <Video size={12} />
                                                <span className="truncate flex-1">{formData.video.split('/').pop()}</span>
                                                <a href={formData.video} download target="_blank" rel="noopener noreferrer" className="ml-auto text-emerald-600 hover:text-emerald-800 transition-colors" title="Télécharger">
                                                    <Download size={12} />
                                                </a>
                                                <button onClick={() => setFormData(prev => ({ ...prev, video: '' }))} className="text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Titre</label>
                                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="ex: Safari privé en Tanzanie" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Localisation</label>
                                            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="Arusha" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Prestataire</label>
                                            <input value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="Lodge Serengeti" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Description</label>
                                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none h-20 resize-none" placeholder="Décrivez l'expérience..." />
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div className="bg-[#2E2E2E] p-5 rounded-2xl text-white">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3">Tarification</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em] block mb-1">Coût Net (€)</label>
                                                <input type="number" value={formData.netCost || ''} onChange={e => setFormData({ ...formData, netCost: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-2.5 px-3 text-white text-base font-light focus:ring-1 focus:ring-[#bcdeea] outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em] block mb-1">Marge (%)</label>
                                                <input type="number" value={formData.recommendedMarkup} onChange={e => setFormData({ ...formData, recommendedMarkup: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-2.5 px-3 text-white text-base font-light focus:ring-1 focus:ring-[#bcdeea] outline-none" />
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                                            <p className="text-xs text-white/50 font-light">Prix client</p>
                                            <p className="text-xl font-light text-[#bcdeea]">{Math.round(formData.netCost * (1 + formData.recommendedMarkup / 100))} €</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Luna Footer */}
                                <div className="p-8 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-4 border border-gray-200 text-gray-500 rounded-2xl font-medium hover:bg-gray-50 transition-all text-sm">Annuler</button>
                                    <button onClick={handleSave} disabled={!formData.name} className="flex-[2] py-4 bg-luna-charcoal text-white rounded-2xl font-bold hover:bg-black shadow-xl shadow-gray-200 transition-all disabled:opacity-30 text-sm flex items-center justify-center gap-2">
                                        {editingItem ? 'Enregistrer' : 'Publier'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
