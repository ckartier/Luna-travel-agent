'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, Trash2, X, GripVertical, MapPin, Calendar, Video, Image as ImageIcon, ArrowRight, Eye,
    Sparkles, Loader2, Upload, Download
} from 'lucide-react';
import Link from 'next/link';
import {
    CRMCollection, getCollections, createCollection, updateCollection, deleteCollection
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

export default function AdminCollectionsPage() {
    const { tenantId } = useAuth();
    const [items, setItems] = useState<CRMCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<CRMCollection | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatingAi, setGeneratingAi] = useState(false);

    const emptyItem = { name: '', date: '', location: '', description: '', images: [] as string[], video: '', order: 0 };
    const [formData, setFormData] = useState(emptyItem);

    useEffect(() => { if (tenantId) loadData(); }, [tenantId]);

    const loadData = async () => {
        setLoading(true);
        try { setItems(await getCollections(tenantId!)); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setUploading(true);
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
                setFormData(prev => ({ ...prev, images: [...prev.images, data.url] }));
            } catch (err) {
                console.error('Upload error:', err);
            }
        }
        setUploading(false);
        if (e.target) e.target.value = '';
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validation taille (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            alert('La vidéo est trop volumineuse (max 100MB)');
            return;
        }

        setUploading(true);
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
        } catch (err: any) {
            console.error('Video upload error:', err);
            alert(`Erreur upload: ${err?.message || err}`);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setGeneratingAi(true);
        try {
            const res = await fetchWithAuth('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            if (res.ok) {
                const { url } = await res.json();
                setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
                setAiPrompt('');
            } else {
                const err = await res.json();
                alert(err.error || 'Erreur de génération');
            }
        } catch (err) {
            console.error('AI generation error:', err);
        }
        setGeneratingAi(false);
    };

    const handleSave = async () => {
        if (!formData.name || !tenantId) return;
        setSaving(true);
        try {
            if (editingItem?.id) {
                await updateCollection(tenantId, editingItem.id, formData);
            } else {
                await createCollection(tenantId, { ...formData, order: items.length });
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData(emptyItem);
            await loadData();
        } catch (err) {
            console.error('Save error:', err);
            alert('Erreur lors de la sauvegarde');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (pendingDeleteId !== id) { setPendingDeleteId(id); setTimeout(() => setPendingDeleteId(null), 3000); return; }
        await deleteCollection(tenantId!, id);
        setItems(prev => prev.filter(i => i.id !== id));
        setPendingDeleteId(null);
    };

    const openEdit = (item: CRMCollection) => {
        setEditingItem(item);
        setFormData({ name: item.name, date: item.date, location: item.location, description: item.description, images: item.images || [], video: item.video || '', order: item.order });
        setShowModal(true);
    };

    const openCreate = () => { setEditingItem(null); setFormData(emptyItem); setShowModal(true); };

    const handleReorder = async (newOrder: CRMCollection[]) => {
        setItems(newOrder);
        for (let i = 0; i < newOrder.length; i++) {
            if (newOrder[i].id && newOrder[i].order !== i) await updateCollection(tenantId!, newOrder[i].id!, { order: i });
        }
    };

    const filtered = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.location.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading && items.length === 0) return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-[#2E2E2E] w-full origin-left animate-pulse" />
        </div>
    );

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 flex items-center justify-center border border-gray-100">
                                <MapPin size={18} className="text-sky-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Collections</h1>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#bcdeea]/20 text-[#2E2E2E]/60 px-2.5 py-1 rounded-full">{items.length} voyages</span>
                        </div>
                        <p className="text-sm text-[#9CA3AF] font-light mt-1">Voyages exclusifs affichés sur votre site vitrine. Glissez pour réordonner.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={tenantId ? `/conciergerie?tenantId=${encodeURIComponent(tenantId)}` : '/conciergerie'} target="_blank"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-300 transition-all shadow-sm">
                            <Eye size={14} /> Voir le site
                        </Link>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C4C4C4]" size={14} />
                            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:border-[#bcdeea] focus:shadow-sm transition-all outline-none text-xs text-[#2E2E2E] placeholder:text-[#D4D4D4] w-48" />
                        </div>
                        <button onClick={openCreate} className="px-5 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#1a1a1a] transition-all flex items-center gap-2 shadow-lg shadow-[#2E2E2E]/10">
                            <Plus size={14} /> Nouvelle Collection
                        </button>
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-gradient-to-b from-white to-[#FAFAFA] rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#bcdeea]/10 flex items-center justify-center">
                            <MapPin size={28} className="text-[#bcdeea]" />
                        </div>
                        <p className="text-[#2E2E2E] text-lg font-light">Aucune collection</p>
                        <p className="text-[#9CA3AF] text-xs mt-1 mb-6">Créez votre premier voyage exclusif</p>
                        <button onClick={openCreate} className="px-6 py-2.5 bg-[#2E2E2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-black transition-all shadow-sm">
                            <Plus size={14} className="inline mr-1.5" /> Créer
                        </button>
                    </div>
                ) : (
                    <Reorder.Group axis="y" values={filtered} onReorder={handleReorder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((item, i) => (
                            <Reorder.Item key={item.id} value={item}>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="bg-white rounded-2xl border border-gray-100 hover:border-[#bcdeea]/40 hover:shadow-xl transition-all overflow-hidden cursor-grab active:cursor-grabbing group relative"
                                >
                                    {/* Image */}
                                    <div className="aspect-[16/10] relative overflow-hidden">
                                        {item.images?.[0] ? (
                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#bcdeea]/20 to-[#F0F7FA] flex items-center justify-center">
                                                <ImageIcon size={32} className="text-[#D4D4D4]" />
                                            </div>
                                        )}
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                        {/* Video badge */}
                                        {item.video && (
                                            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Video size={10} /> Vidéo
                                            </div>
                                        )}

                                        {/* Drag handle */}
                                        <div className="absolute top-3 left-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <GripVertical size={14} />
                                        </div>

                                        {/* Bottom info on image */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h3 className="text-white text-lg font-medium tracking-tight leading-tight mb-1 drop-shadow-lg">{item.name}</h3>
                                            <div className="flex items-center gap-3 text-[10px] text-white/80 uppercase tracking-[0.1em] font-medium">
                                                <span className="flex items-center gap-1"><MapPin size={10} /> {item.location}</span>
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {item.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4">
                                        <p className="text-xs text-[#9CA3AF] line-clamp-2 font-light leading-relaxed min-h-[2.5rem]">{item.description || 'Aucune description'}</p>
                                        {/* Photo count */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                            <span className="text-[9px] text-[#C4C4C4] uppercase tracking-widest font-bold">
                                                {item.images?.length || 0} photo{(item.images?.length || 0) > 1 ? 's' : ''}
                                            </span>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(item)}
                                                    className="px-3 py-1.5 bg-[#bcdeea]/15 hover:bg-[#bcdeea]/30 text-[#2E2E2E] rounded-lg text-[9px] font-bold uppercase tracking-[0.1em] transition-all">
                                                    Éditer
                                                </button>
                                                <button onClick={() => handleDelete(item.id!)}
                                                    className={`p-1.5 rounded-lg transition-all ${pendingDeleteId === item.id ? 'bg-red-500 text-white' : 'text-[#D4D4D4] hover:text-red-500 hover:bg-red-50'}`}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Modal */}
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
                                        <h2 className="text-2xl font-light tracking-tight">{editingItem ? 'Modifier la Collection' : 'Nouvelle Collection'}</h2>
                                        <p className="text-[#b9dae9] text-xs mt-1 font-medium">Visible sur votre site vitrine</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-5 overflow-y-auto flex-1 no-scrollbar">
                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Nom du Voyage</label>
                                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="ex: Safari Tanzanie VIP" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Dates</label>
                                            <input value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="12 – 20 Août 2026" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Destination</label>
                                            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="Tanzanie" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Description</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none h-24 resize-none" placeholder="Description du voyage..." />
                                    </div>

                                    {/* Images */}
                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Images</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {formData.images.map((url, i) => (
                                                <div key={i} className="aspect-video rounded-lg overflow-hidden border border-gray-100 relative group">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={8} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                                className="aspect-video rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-[#D4D4D4] hover:text-[#bcdeea] hover:border-[#bcdeea] transition-all gap-1">
                                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={14} /><span className="text-[8px] font-bold uppercase tracking-wider">Photo</span></>}
                                            </button>
                                        </div>
                                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                                    </div>

                                    {/* AI Image Generation */}
                                    <div className="bg-gradient-to-r from-violet-50/50 to-sky-50/50 rounded-xl p-4 border border-violet-100/50">
                                        <label className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                                            <Sparkles size={12} /> Générer une image IA
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                value={aiPrompt}
                                                onChange={e => setAiPrompt(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                                                placeholder="ex: Plage tropicale au coucher du soleil, Bali"
                                                className="flex-1 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-xs text-[#2E2E2E] focus:border-violet-300 transition-all outline-none"
                                            />
                                            <button
                                                onClick={handleAiGenerate}
                                                disabled={generatingAi || !aiPrompt.trim()}
                                                className="px-4 py-2.5 bg-violet-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-violet-600 transition-all disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                {generatingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                {generatingAi ? 'Génération...' : 'Générer'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Video */}
                                    <div>
                                        <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] block mb-1.5">Vidéo</label>
                                        <div className="flex gap-2">
                                            <input value={formData.video} onChange={e => setFormData({ ...formData, video: e.target.value })} className="flex-1 px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-sm text-[#2E2E2E] focus:border-[#bcdeea] focus:bg-white transition-all outline-none" placeholder="URL vidéo ou uploader →" />
                                            <button onClick={() => videoRef.current?.click()} disabled={uploading}
                                                className="px-4 py-3 bg-[#FAFAFA] border border-gray-100 rounded-xl text-[#9CA3AF] hover:text-[#2E2E2E] hover:border-gray-200 transition-all flex items-center gap-1.5">
                                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Video size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Upload</span></>}
                                            </button>
                                        </div>
                                        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoUpload} />
                                        {formData.video && (
                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
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
                            </div>

                            {/* Luna Footer */}
                            <div className="p-8 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-4 border border-gray-200 text-gray-500 rounded-2xl font-medium hover:bg-gray-50 transition-all text-sm">Annuler</button>
                                <button onClick={handleSave} disabled={!formData.name || saving} className="flex-[2] py-4 bg-luna-charcoal text-white rounded-2xl font-bold hover:bg-black shadow-xl shadow-gray-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2 text-sm">
                                    {saving ? <><Loader2 size={14} className="animate-spin" /> Sauvegarde...</> : (editingItem ? 'Enregistrer' : 'Créer')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
