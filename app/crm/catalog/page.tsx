'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Loader2, Hotel, Plane, MapPin, Trash2, DollarSign, Star, Heart,
  UtensilsCrossed, Car, Camera, Upload, X, Image as ImageIcon, Globe, Filter,
  Sparkles, ExternalLink, UserCircle, UsersRound, ShieldCheck,
  FileText, ScrollText, Briefcase, Scale, BookOpen
} from 'lucide-react';
import SupplierPicker from '@/src/components/crm/SupplierPicker';
import {
  CRMCatalogItem, CRMSupplier, getCatalogItems, createCatalogItem,
  deleteCatalogItem, getSuppliers, createSupplier
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/src/components/ConfirmModal';
import { T, useAutoTranslate } from '@/src/components/T';

const TRAVEL_TYPES = [
  { value: 'HOTEL', label: 'Hôtel', icon: Hotel, color: 'text-[#5a8fa3] bg-[#bcdeea]/15', gradient: 'from-[#5a8fa3] to-[#4a7f93]' },
  { value: 'FLIGHT', label: 'Vol', icon: Plane, color: 'text-emerald-500 bg-emerald-50', gradient: 'from-emerald-500 to-cyan-500' },
  { value: 'ACTIVITY', label: 'Activité', icon: MapPin, color: 'text-emerald-500 bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'TRANSFER', label: 'Transfert', icon: Car, color: 'text-orange-500 bg-orange-50', gradient: 'from-orange-500 to-amber-500' },
  { value: 'OTHER', label: 'Autre', icon: UtensilsCrossed, color: 'text-rose-500 bg-rose-50', gradient: 'from-rose-500 to-pink-500' },
];

const LEGAL_TYPES = [
  { value: 'HOTEL', label: 'Contrat', icon: FileText, color: 'text-[#A07850] bg-[#EDE0D4]/30', gradient: 'from-[#A07850] to-[#8B6A47]' },
  { value: 'FLIGHT', label: 'Acte Juridique', icon: ScrollText, color: 'text-[#5a3e91] bg-[#5a3e91]/10', gradient: 'from-[#5a3e91] to-[#7a5fb1]' },
  { value: 'ACTIVITY', label: 'Mémoire', icon: BookOpen, color: 'text-blue-600 bg-blue-50', gradient: 'from-blue-600 to-indigo-600' },
  { value: 'TRANSFER', label: 'Pièce', icon: Briefcase, color: 'text-amber-600 bg-amber-50', gradient: 'from-amber-600 to-orange-600' },
  { value: 'OTHER', label: 'Autre', icon: Scale, color: 'text-gray-500 bg-gray-50', gradient: 'from-gray-500 to-gray-600' },
];

export default function PrestationsPage() {
  const router = useRouter();
  const { tenantId, loading: authLoading } = useAuth();
  const { vertical } = useVertical();
  const isLegal = vertical.id === 'legal';
  const TYPES = isLegal ? LEGAL_TYPES : TRAVEL_TYPES;
  const at = useAutoTranslate();
  const [items, setItems] = useState<(CRMCatalogItem & { favorite?: boolean })[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterSupplier, setFilterSupplier] = useState<string>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Firecrawl enrichment
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    type: 'HOTEL' as CRMCatalogItem['type'],
    name: '', supplier: '', supplierId: '', location: '', description: '',
    netCost: 0, recommendedMarkup: 30,
    concierge: '', phone: '', email: '', address: '', website: '',
    // Quick Add Supplier fields
    isGuide: false, isChauffeur: false, hasLicense: false, languages: 'FR, EN',
    // Transport pricing
    pricingMode: 'ONE_WAY' as 'ONE_WAY' | 'ROUND_TRIP' | 'HOURLY',
    oneWayPrice: 0, roundTripPrice: 0, hourlyPrice: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!tenantId) {
      setLoading(false);
      return;
    }
    void loadData(tenantId);
  }, [tenantId, authLoading]);

  const loadData = async (tid: string) => {
    setLoading(true);
    try {
      const [data, sups] = await Promise.all([
        getCatalogItems(tid),
        getSuppliers(tid)
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

    const catalogPayload: any = {
      ...newItem as any,
      supplier: finalSupplierName || 'Inconnu',
      supplierId: finalSupplierId,
      currency: 'EUR',
      images: photoURLs.length > 0 ? photoURLs : undefined,
    };
    
    // Only persist transport pricing fields for TRANSFER type
    if (newItem.type !== 'TRANSFER') {
      delete catalogPayload.pricingMode;
      delete catalogPayload.oneWayPrice;
      delete catalogPayload.roundTripPrice;
      delete catalogPayload.hourlyPrice;
    }

    try {
      // 🤖 GENERATE GEMINI EMBEDDING BEFORE SAVING 🤖
      const embedReq = await fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              text: `${newItem.name}\n${newItem.description}\n${newItem.location}\n${newItem.type}`,
              imageBase64s: photoURLs.slice(0, 3) // Send max 3 images to save bandwidth
          })
      });
      if (embedReq.ok) {
          const { embedding } = await embedReq.json();
          if (embedding) {
              catalogPayload.embedding = embedding;
          }
      } else {
          console.warn("Failed to generate embedding for new item");
      }
    } catch (e) {
      console.error("Embedding error:", e);
    }

    await createCatalogItem(tenantId, catalogPayload);
    setShowModal(false);
    setNewItem({
      type: 'HOTEL', name: '', supplier: '', supplierId: '', location: '', description: '',
      netCost: 0, recommendedMarkup: 30, concierge: '', phone: '', email: '', address: '', website: '',
      isGuide: false, isChauffeur: false, hasLicense: false, languages: 'FR, EN',
      pricingMode: 'ONE_WAY' as 'ONE_WAY' | 'ROUND_TRIP' | 'HOURLY', oneWayPrice: 0, roundTripPrice: 0, hourlyPrice: 0,
    });
    setPhotoURLs([]);
    if (tenantId) void loadData(tenantId);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenantId) return;
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!tenantId || !deleteTarget) return;
    try {
      await deleteCatalogItem(tenantId, deleteTarget);
      setItems(prev => prev.filter(i => i.id !== deleteTarget));
    } catch (err) {
      console.error('Delete catalog item error:', err);
    }
    setDeleteTarget(null);
  };

  const getTypeConfig = (t: string) => TYPES.find((tp: any) => tp.value === t) || TYPES[4];

  // Unique locations & suppliers for filter pills
  const uniqueLocations = [...new Set(items.map(i => i.location).filter(Boolean))].sort();
  const uniqueSuppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))].sort();

  const filtered = items.filter(i => {
    const matchType = filter === 'ALL' || i.type === filter;
    const matchLocation = filterLocation === 'ALL' || i.location === filterLocation;
    const matchSupplier = filterSupplier === 'ALL' || i.supplier === filterSupplier;
    const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase())
      || i.location.toLowerCase().includes(searchTerm.toLowerCase())
      || (i.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFav = !showFavoritesOnly || i.favorite;
    return matchType && matchLocation && matchSupplier && matchSearch && matchFav;
  });

  if (!authLoading && !tenantId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="max-w-md text-center rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl text-[#2E2E2E]">Compte non rattaché</h2>
          <p className="mt-2 text-sm text-[#64748b]">
            Impossible de charger les prestations: aucun `tenantId` trouvé pour ce compte.
          </p>
          <div className="mt-5">
            <Link href="/login/travel" className="inline-flex items-center rounded-xl bg-[#2E2E2E] px-4 py-2 text-sm text-white">
              Revenir à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) return (
    <div className="w-full h-full">
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
        <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
      </div>
      <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">
        {/* Skeleton Header */}
        <div className="space-y-3">
          <div className="h-10 w-72 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-4 w-96 bg-gray-50 rounded-xl animate-pulse" />
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-48 bg-gray-50 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                <div className="pt-3 border-t border-gray-50 flex justify-between">
                  <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(-20%); } 100% { transform: translateX(0%); } }
        .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">
        {/* Header Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
              {isLegal ? 'Base Documentaire' : <T>Catalogue Prestations</T>}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">
              {isLegal ? 'Gérez vos modèles de contrats, actes et documents juridiques.' : "Gérez vos offres, tarifs et marges agents en un clin d'œil."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all border ${showFavoritesOnly ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
              <Star size={14} className={showFavoritesOnly ? 'fill-white' : ''} /> FAVORIS
            </button>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-luna-charcoal text-white rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all flex items-center gap-2">
              <Plus size={18} /> {isLegal ? 'Nouveau Document' : <T>Nouvelle Offre</T>}
            </button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder={isLegal ? 'Rechercher un document, un contrat, un acte...' : 'Rechercher une prestation, un lieu, un prestataire...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-[20px] border border-gray-100 bg-white/60 focus:bg-white focus:shadow-xl focus:shadow-gray-100 transition-all outline-none text-sm font-normal"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setFilter('ALL')} className={`px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap ${filter === 'ALL' ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}><T>TOUT</T></button>
            {TYPES.map((t: any) => (
              <button key={t.value} onClick={() => setFilter(t.value)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border whitespace-nowrap ${filter === t.value ? 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>
                <t.icon size={14} /> {t.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Location & Supplier filters */}
          {(uniqueLocations.length > 1 || uniqueSuppliers.length > 1) && (
            <div className="flex flex-wrap items-center gap-3">
              {uniqueLocations.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-300 shrink-0" />
                  <select
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-[#bcdeea] focus:ring-1 focus:ring-[#bcdeea]/30 cursor-pointer appearance-none transition-all hover:border-gray-200"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    <option value="ALL">Toutes les villes</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              )}
              {uniqueSuppliers.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <UserCircle size={13} className="text-gray-300 shrink-0" />
                  <select
                    value={filterSupplier}
                    onChange={e => setFilterSupplier(e.target.value)}
                    className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-[#bcdeea] focus:ring-1 focus:ring-[#bcdeea]/30 cursor-pointer appearance-none transition-all hover:border-gray-200"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    <option value="ALL">Tous les prestataires</option>
                    {uniqueSuppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
                  </select>
                </div>
              )}
              {(filterLocation !== 'ALL' || filterSupplier !== 'ALL') && (
                <button
                  onClick={() => { setFilterLocation('ALL'); setFilterSupplier('ALL'); }}
                  className="text-[10px] font-bold text-[#5a8fa3] hover:text-[#4a7f93] transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => {
            const typeConf = getTypeConfig(item.type);
            const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[24px] overflow-hidden border border-gray-100 hover:border-[#bcdeea]/40 transition-all group cursor-pointer flex flex-col h-full"
                onClick={() => router.push(`/crm/catalog/${item.id}`)}
              >
                {/* Card Image */}
                <div className="h-48 relative overflow-hidden bg-gray-50">
                  {(item.images && item.images.length > 0) || item.imageUrl ? (
                    <img src={item.images?.[0] || item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                    <div className="flex items-center gap-2 text-[10px] text-[#5a8fa3] font-semibold uppercase tracking-tight">
                      <MapPin size={10} /> {item.location || 'Localisation ?'}
                    </div>
                    <h3 className="text-base font-bold text-luna-charcoal line-clamp-1 group-hover:text-[#5a8fa3] transition-colors uppercase tracking-tighter">{item.name}</h3>
                    <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Achat</p>
                      <p className="font-bold text-gray-600">{item.netCost} €</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold text-[#5a8fa3] uppercase tracking-widest">Prix Vente</p>
                      <p className="text-lg font-bold text-[#5a8fa3]">{clientPrice} €</p>
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
        </motion.div>

        {/* Modal: Creation */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-white rounded-[24px] w-full max-w-2xl relative z-10 shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                {/* Luna Header */}
                <div className="p-8 md:p-10 pb-5 bg-luna-charcoal text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-light tracking-tight">{isLegal ? 'Nouveau Document' : <T>Nouvelle Prestation</T>}</h2>
                      <p className="text-[#b9dae9] text-xs mt-1 font-medium">{isLegal ? 'Ajoutez un modèle de document à votre base' : "Ajoutez un service premium à votre collection d'agent"}</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                  </div>
                </div>
                <div className="p-8 md:p-10 pt-6">
                  <div className="space-y-8">
                    {/* 🔍 Firecrawl Enrichment */}
                    <div className="p-5 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-[28px] border border-sky-100">
                      <label className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block mb-2">🔍 Enrichir depuis le web</label>
                      <div className="flex gap-2">
                        <input
                          value={scrapeUrl}
                          onChange={e => setScrapeUrl(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white border border-sky-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all font-sans"
                          placeholder="Collez l'URL du site hôtel / prestation..."
                        />
                        <button
                          disabled={!scrapeUrl || scraping}
                          onClick={async () => {
                            setScraping(true);
                            setScrapeResult(null);
                            try {
                              const res = await fetch('/api/crm/scrape', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: scrapeUrl }),
                              });
                              const data = await res.json();
                              if (data.success && data.data) {
                                const d = data.data;
                                setNewItem(prev => ({
                                  ...prev,
                                  name: d.name || prev.name,
                                  description: d.description || prev.description,
                                  location: d.location || prev.location,
                                  website: d.website || prev.website || '',
                                }));
                                if (d.image && !photoURLs.includes(d.image)) {
                                  setPhotoURLs(prev => [...prev, d.image]);
                                }
                                setScrapeResult(`✅ ${d.name || 'Enrichi'} — ${d.amenities?.length || 0} amenities trouvées`);
                              } else {
                                setScrapeResult(`❌ ${data.error || 'Erreur de scraping'}`);
                              }
                            } catch (e: any) {
                              setScrapeResult(`❌ ${e.message}`);
                            }
                            setScraping(false);
                          }}
                          className="px-5 py-3 bg-sky-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-100 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
                        >
                          {scraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                          {scraping ? 'Scraping...' : 'Enrichir'}
                        </button>
                      </div>
                      {scrapeResult && <p className="text-xs mt-2 font-medium text-sky-700">{scrapeResult}</p>}
                    </div>

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
                        <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 hover:text-[#5a8fa3] hover:border-[#bcdeea] transition-all hover:bg-[#bcdeea]/10">
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
                        <SupplierPicker
                          suppliers={suppliers}
                          value={newItem.supplierId}
                          onChange={(id) => setNewItem({ ...newItem, supplierId: id })}
                          label="Prestataire (DMC/Guide)"
                          placeholder="Rechercher un prestataire..."
                          allowManual
                        />
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
                                className={`flex-1 py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newItem.hasLicense ? 'bg-[#5a8fa3] text-white border-[#5a8fa3] shadow-lg' : 'bg-white text-gray-300 border-gray-100'}`}
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
                    <div className="bg-luna-charcoal p-8 rounded-[24px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Finance &amp; Marges</h3>
                        <DollarSign size={20} className="text-emerald-400" />
                      </div>

                      {/* Transport Pricing Mode (only for TRANSFER) */}
                      {newItem.type === 'TRANSFER' && (
                        <div className="mb-6">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3">Mode de Tarification</label>
                          <div className="grid grid-cols-3 gap-2">
                            {([['ONE_WAY', 'Aller Simple'], ['ROUND_TRIP', 'Aller-Retour'], ['HOURLY', "À l'heure"]] as [string, string][]).map(([value, label]) => (
                              <button key={value} type="button" onClick={() => setNewItem({ ...newItem, pricingMode: value as any })}
                                className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                  newItem.pricingMode === value
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                                    : 'bg-white/10 text-white/60 border-white/10 hover:border-white/30'
                                }`}>{label}</button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {(newItem.pricingMode === 'ONE_WAY' || newItem.pricingMode === 'ROUND_TRIP') && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prix Aller (€)</label>
                                <input type="number" value={newItem.oneWayPrice || ''} onChange={e => setNewItem({ ...newItem, oneWayPrice: +e.target.value, netCost: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-400 font-sans" />
                              </div>
                            )}
                            {newItem.pricingMode === 'ROUND_TRIP' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prix A/R (€)</label>
                                <input type="number" value={newItem.roundTripPrice || ''} onChange={e => setNewItem({ ...newItem, roundTripPrice: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-400 font-sans" />
                              </div>
                            )}
                            {newItem.pricingMode === 'HOURLY' && (
                              <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tarif Horaire (€/h)</label>
                                <input type="number" value={newItem.hourlyPrice || ''} onChange={e => setNewItem({ ...newItem, hourlyPrice: +e.target.value, netCost: +e.target.value })} className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-400 font-sans" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{newItem.type === 'TRANSFER' ? 'Coût Net (base)' : 'Coût Net (€)'}</label>
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
                      <button onClick={handleCreate} disabled={!newItem.name} className="flex-[2] py-4 bg-[#5a8fa3] text-white rounded-2xl font-bold shadow-lg hover:bg-[#4a7f93] transition-all uppercase tracking-widest text-[10px]"><T>Publier au Catalogue</T></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmModal
          open={!!deleteTarget}
          title="Supprimer cette prestation ?"
          message="La prestation sera supprimée définitivement du catalogue."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
