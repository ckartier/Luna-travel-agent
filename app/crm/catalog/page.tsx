'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Hotel, Plane, MapPin, Trash2, DollarSign } from 'lucide-react';
import { CRMCatalogItem, getCatalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CatalogPage() {
    const { tenantId } = useAuth();
    const [items, setItems] = useState<CRMCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ type: 'HOTEL' as CRMCatalogItem['type'], name: '', supplier: '', location: '', description: '', netCost: 0, recommendedMarkup: 30 });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { setItems(await getCatalogItems(tenantId!)); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newItem.name) return;
        await createCatalogItem(tenantId!, { ...newItem, currency: 'EUR' });
        setShowModal(false);
        setNewItem({ type: 'HOTEL', name: '', supplier: '', location: '', description: '', netCost: 0, recommendedMarkup: 30 });
        loadData();
    };

    const handleDelete = async (id: string) => {
        await deleteCatalogItem(tenantId!, id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const getTypeIcon = (t: string) => { switch (t) { case 'HOTEL': return <Hotel size={16} className="text-indigo-400" />; case 'FLIGHT': return <Plane size={16} className="text-sky-400" />; default: return <MapPin size={16} className="text-emerald-400" />; } };

    const filtered = items.filter(i => {
        const matchType = filter === 'ALL' || i.type === filter;
        const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-300" size={32} /></div>;

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-light text-luna-charcoal mb-1">Catalogue Produits</h1>
                    <p className="text-sm text-gray-400 font-light">{items.length} offres — Gérez vos hôtels, vols et activités.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={16} /> Ajouter un Produit
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input type="text" placeholder="Chercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-100 bg-white/60 text-sm focus:outline-none focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all" />
                </div>
                {['ALL', 'HOTEL', 'FLIGHT', 'ACTIVITY', 'TRANSFER', 'OTHER'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${filter === f ? 'bg-gradient-to-r from-luna-charcoal to-gray-800 text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)]' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
                        {f === 'ALL' ? 'Tout' : f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-300"><Hotel size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-light">Aucun produit. Ajoutez votre première offre.</p></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {getTypeIcon(item.type)}
                                    <span className="text-xs font-medium tracking-wide text-gray-400">{item.type}</span>
                                </div>
                                <button onClick={() => handleDelete(item.id!)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                            </div>
                            <h3 className="text-base font-medium text-luna-charcoal mb-1">{item.name}</h3>
                            <p className="text-xs text-gray-400 font-light mb-1">{item.supplier} — {item.location}</p>
                            <p className="text-xs text-gray-300 font-light mb-3 line-clamp-2">{item.description}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <span className="text-sm font-medium text-luna-charcoal">{item.netCost.toLocaleString('fr-FR')} €</span>
                                <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50/60 px-2 py-0.5 rounded-full">+{item.recommendedMarkup}% marge</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-white/50" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-serif font-light text-luna-charcoal mb-6">Nouveau Produit</h2>
                        <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as any }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none">
                            <option value="HOTEL">Hôtel</option><option value="FLIGHT">Vol</option><option value="ACTIVITY">Activité</option><option value="TRANSFER">Transfert</option><option value="OTHER">Autre</option>
                        </select>
                        <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Nom du produit"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" autoFocus />
                        <input value={newItem.supplier} onChange={e => setNewItem(p => ({ ...p, supplier: e.target.value }))} placeholder="Fournisseur"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        <input value={newItem.location} onChange={e => setNewItem(p => ({ ...p, location: e.target.value }))} placeholder="Localisation"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        <textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Description"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm mb-3 min-h-[80px] resize-none focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <input type="number" value={newItem.netCost || ''} onChange={e => setNewItem(p => ({ ...p, netCost: +e.target.value }))} placeholder="Coût net (€)"
                                className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                            <input type="number" value={newItem.recommendedMarkup} onChange={e => setNewItem(p => ({ ...p, recommendedMarkup: +e.target.value }))} placeholder="Marge %"
                                className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl btn-secondary text-sm">Annuler</button>
                            <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl btn-primary">Ajouter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
