'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Loader2, Hotel, Plane, MapPin, Trash2, DollarSign, Star, Heart,
  UtensilsCrossed, Car, Camera, Upload, X, Image as ImageIcon, Globe, Filter,
  Sparkles, ExternalLink, UserCircle, UsersRound, ShieldCheck
} from 'lucide-react';
import {
  CRMCatalogItem, CRMSupplier, getCatalogItems, createCatalogItem,
  deleteCatalogItem, getSuppliers, createSupplier
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { T, useAutoTranslate } from '@/src/components/T';

const TYPES = [
  { value: 'HOTEL', label: 'Hôtel', icon: Hotel, color: 'text-indigo-500 bg-indigo-50', gradient: 'from-indigo-500 to-violet-500' },
  { value: 'FLIGHT', label: 'Vol', icon: Plane, color: 'text-emerald-500 bg-emerald-50', gradient: 'from-emerald-500 to-cyan-500' },
  { value: 'ACTIVITY', label: 'Activité', icon: MapPin, color: 'text-emerald-500 bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'TRANSFER', label: 'Transfert', icon: Car, color: 'text-orange-500 bg-orange-50', gradient: 'from-orange-500 to-amber-500' },
  { value: 'OTHER', label: 'Autre', icon: UtensilsCrossed, color: 'text-rose-500 bg-rose-50', gradient: 'from-rose-500 to-pink-500' },
] as const;

export default function PrestationsPage() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const at = useAutoTranslate();
  const [items, setItems] = useState<(CRMCatalogItem & { favorite?: boolean })[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({
    type: 'HOTEL' as CRMCatalogItem['type'],
    name: '', supplier: '', supplierId: '', location: '', description: '',
    netCost: 0, recommendedMarkup: 30,
    concierge: '', phone: '', email: '', address: '', website: '',
    // Quick Add Supplier fields
    isGuide: false, isChauffeur: false, hasLicense: false, languages: 'FR, EN'
  });

  useEffect(() => { if (tenantId) loadData(); }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, sups] = await Promise.all([
        getCatalogItems(tenantId!),
        getSuppliers(tenantId!)
      ]);
      const favs: string[] = JSON.parse(localStorage.getItem('luna-prestations-favs') || '[]');
      setItems(data.map(d => ({ ...d, favorite: favs.includes(d.id!) })));
      setSuppliers(sups);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => prev.map(i => i.id === id ? { ...i, favorite: !i.favorite } : i));
    const favs: string[] = JSON.parse(localStorage.getItem('luna-prestations-favs') || '[]');
    const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem('luna-prestations-favs', JSON.stringify(next));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setPhotoURLs(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreate = async () => {
    if (!newItem.name || !tenantId) return;

    let finalSupplierId = newItem.supplierId;
    let finalSupplierName = newItem.supplier;

    if (!finalSupplierId && newItem.supplier) {
      // Create new supplier on the fly
      const sid = await createSupplier(tenantId, {
        name: newItem.supplier,
        category: 'AUTRE',
        country: '',
        city: newItem.location,
        phone: newItem.phone,
        email: newItem.email,
        website: newItem.website,
        isGuide: newItem.isGuide,
        isChauffeur: newItem.isChauffeur,
        hasLicense: newItem.hasLicense,
        isLunaFriend: true, // Created manually = Luna Friend
        languages: newItem.languages.split(',').map(s => s.trim()).filter(Boolean),
        tags: [],
        isFavorite: false
      });
      finalSupplierId = sid;
      finalSupplierName = newItem.supplier;
    } else if (finalSupplierId) {
      finalSupplierName = suppliers.find(s => s.id === finalSupplierId)?.name || newItem.supplier;
    }

    await createCatalogItem(tenantId, {
      ...newItem as any,
      supplier: finalSupplierName || 'Inconnu',
      supplierId: finalSupplierId,
      currency: 'EUR',
      images: photoURLs.length > 0 ? photoURLs : undefined,
    });
    setShowModal(false);
    setNewItem({
      type: 'HOTEL', name: '', supplier: '', supplierId: '', location: '', description: '',
      netCost: 0, recommendedMarkup: 30, concierge: '', phone: '', email: '', address: '', website: '',
      isGuide: false, isChauffeur: false, hasLicense: false, languages: 'FR, EN'
    });
    setPhotoURLs([]);
    if (tenantId) loadData();
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
    const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase())
      || i.location.toLowerCase().includes(searchTerm.toLowerCase())
      || (i.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFav = !showFavoritesOnly || i.favorite;
    return matchType && matchSearch && matchFav;
  });

  if (loading && items.length === 0) return (
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
          <h1 className="text-3xl font-normal text-luna-charcoal tracking-tight"><T>Catalogue Prestations</T></h1>
          <p className="text-sm text-gray-400 font-sans">Gérez vos offres, tarifs et marges agents en un clin d'œil.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all border ${showFavoritesOnly ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
            <Star size={14} className={showFavoritesOnly ? 'fill-white' : ''} /> FAVORIS
          </button>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-luna-charcoal text-white rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all flex items-center gap-2">
            <Plus size={18} /> <T>Nouvelle Offre</T>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            placeholder="Rechercher une prestation, un lieu, un prestataire..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-[20px] border border-gray-100 bg-white/60 focus:bg-white focus:shadow-xl focus:shadow-gray-100 transition-all outline-none text-sm font-normal"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setFilter('ALL')} className={`px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap ${filter === 'ALL' ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}><T>TOUT</T></button>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap ${filter === t.value ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
              <t.icon size={14} /> {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(item => {
          const typeConf = getTypeConfig(item.type);
          const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-50 transition-all group cursor-pointer flex flex-col h-full"
              onClick={() => router.push(`/crm/catalog/${item.id}`)}
            >
              {/* Card Image */}
              <div className="h-48 relative overflow-hidden bg-gray-50">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${typeConf.gradient} opacity-20 flex items-center justify-center`}>
                    <typeConf.icon size={48} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 border border-gray-100">
                    {typeConf.label}
                  </span>
                </div>
                <button onClick={(e) => toggleFavorite(item.id!, e)} className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                  <Heart size={18} className={item.favorite ? 'fill-red-500 text-red-500' : 'text-gray-300'} />
                </button>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col space-y-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                    <MapPin size={10} /> {item.location || 'Localisation ?'}
                  </div>
                  <h3 className="text-base font-bold text-luna-charcoal line-clamp-1 group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">{item.name}</h3>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Achat</p>
                    <p className="font-bold text-gray-600">{item.netCost} €</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Prix Vente</p>
                    <p className="text-lg font-bold text-emerald-600">{clientPrice} €</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">{item.supplier?.[0] || 'S'}</div>
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px] font-sans">{item.supplier}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id!, e)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal: Creation */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-normal leading-tight tracking-tight"><T>Nouvelle Prestation</T></h2>
                    <p className="text-xs text-gray-500 font-sans tracking-tight">Ajoutez un service premium à votre collection d'agent.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"><X size={24} /></button>
                </div>

                <div className="space-y-8">
                  {/* Type Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setNewItem({ ...newItem, type: t.value as any })}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${newItem.type === t.value ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg shadow-gray-200' : 'bg-gray-50/50 text-gray-400 border-gray-100 hover:bg-white hover:border-emerald-200'}`}
                      >
                        <t.icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Photo Grid */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visuels de l'offre</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {photoURLs.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100 relative group animate-in zoom-in-50 duration-200">
                          <img src={url} className="w-full h-full object-cover" />
                          <button onClick={() => setPhotoURLs(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        </div>
                      ))}
                      <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:border-emerald-500 transition-all hover:bg-emerald-50">
                        <Plus size={24} />
                      </button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  {/* Main Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Titre de l'expérience</label>
                      <input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" placeholder="ex: Safari privé en Tanzanie" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Localisation</label>
                      <input value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" placeholder="ex: Arusha" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Prestataire (DMC/Guide)</label>
                      <select
                        value={newItem.supplierId}
                        onChange={e => setNewItem({ ...newItem, supplierId: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans"
                      >
                        <option value="">Saisir manuellement...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    {!newItem.supplierId && (
                      <div className="md:col-span-2 space-y-4 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nom du Nouveau Prestataire</label>
                            <input value={newItem.supplier} onChange={e => setNewItem({ ...newItem, supplier: e.target.value })} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 transition-all font-sans" placeholder="ex: Laurent Guide Expert" />
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, isGuide: !newItem.isGuide })}
                              className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.isGuide ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                              <UsersRound size={14} /> Guide
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, isChauffeur: !newItem.isChauffeur })}
                              className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.isChauffeur ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                              <Car size={14} /> Chauffeur
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, hasLicense: !newItem.hasLicense })}
                              className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.hasLicense ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white text-gray-300 border-gray-100'}`}
                            >
                              <ShieldCheck size={14} /> Permis/Licence PRO
                            </button>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Langues parlées (séparées par des virgules)</label>
                            <input value={newItem.languages} onChange={e => setNewItem({ ...newItem, languages: e.target.value })} className="w-full px-5 py-4 bg-white border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 transition-all font-sans" placeholder="ex: FR, EN, ES" />
                          </div>
                          <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tél Contact</label>
                              <input value={newItem.phone} onChange={e => setNewItem({ ...newItem, phone: e.target.value })} className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-200" placeholder="+..." />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Contact</label>
                              <input value={newItem.email} onChange={e => setNewItem({ ...newItem, email: e.target.value })} className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-200" placeholder="..." />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Description Commerciale</label>
                      <textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all h-28 font-sans" placeholder="Détaillez l'offre pour le client..." />
                    </div>
                  </div>

                  {/* Costs Sidebar-like section */}
                  <div className="bg-luna-charcoal p-8 rounded-[32px] text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Finance & Marges</h3>
                      <DollarSign size={20} className="text-emerald-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Coût Net (€)</label>
                        <input type="number" value={newItem.netCost || ''} onChange={e => setNewItem({ ...newItem, netCost: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-400 font-sans" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Marge Agent (%)</label>
                        <input type="number" value={newItem.recommendedMarkup} onChange={e => setNewItem({ ...newItem, recommendedMarkup: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-400 font-sans" />
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                      <p className="text-sm font-light text-white/80 tracking-tight">Prix de vente suggéré au client</p>
                      <p className="text-3xl font-normal text-emerald-400">{Math.round(newItem.netCost * (1 + newItem.recommendedMarkup / 100))} €</p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"><T>Fermer</T></button>
                    <button onClick={handleCreate} disabled={!newItem.name} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all uppercase tracking-widest text-[10px]"><T>Publier au Catalogue</T></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
