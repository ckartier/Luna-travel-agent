'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Loader2, Plane, Map, Users, Calendar,
    DollarSign, ArrowUpRight, Star, Eye, MoreVertical
} from 'lucide-react';
import { CRMTrip, getTrips, createTrip, deleteTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/src/components/ConfirmModal';
import { CRMSkeleton } from '@/app/components/CRMSkeleton';
import { CRMEmptyState } from '@/app/components/CRMEmptyState';
import { T, useAutoTranslate } from '@/src/components/T';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-gray-50 text-gray-600 border-gray-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Brouillon',
    IN_PROGRESS: 'En cours',
    CONFIRMED: 'Confirmé',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
};

export default function TripsPage() {
    const router = useRouter();
    const { tenantId } = useAuth();
    const at = useAutoTranslate();
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const loadTrips = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const data = await getTrips(tenantId);
            setTrips(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { loadTrips(); }, [loadTrips]);

    const confirmDelete = async () => {
        if (!tenantId || !deleteTarget) return;
        try {
            await deleteTrip(tenantId, deleteTarget);
            loadTrips();
        } catch (e) { console.error(e); }
        setDeleteTarget(null);
    };

    const filtered = trips.filter(t => {
        const matchSearch = `${t.title} ${t.destination} ${t.clientName}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalRevenue = trips.reduce((s, t) => s + (t.amount || 0), 0);
    const formatDate = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; } };

    if (loading) return <CRMSkeleton variant="list" rows={6} />;

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-20">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#bcdeea]/50 flex items-center justify-center">
                                <Plane size={20} className="text-[#5a8fa3]" />
                            </div>
                            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Voyages</h1>
                        </div>
                        <p className="text-sm text-[#6B7280] font-medium">
                            {trips.length} voyages — <span className="text-emerald-600">{totalRevenue.toLocaleString('fr-FR')} € total</span>
                        </p>
                    </div>
                    <button onClick={() => router.push('/crm/pipeline')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all bg-[#2E2E2E] hover:bg-black">
                        <Plus size={16} /> Nouveau Voyage
                    </button>
                </motion.div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Chercher par titre, destination, client..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white/60 focus:bg-white focus:shadow-xl transition-all outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm overflow-x-auto no-scrollbar">
                        {['ALL', 'DRAFT', 'IN_PROGRESS', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === s ? 'bg-[#2E2E2E] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                {s === 'ALL' ? 'Tous' : STATUS_LABELS[s] || s}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Trips Grid */}
                {filtered.length === 0 ? (
                    <CRMEmptyState
                        icon={Plane}
                        title="Aucun voyage trouvé"
                        description="Créez un voyage depuis le Pipeline pour le voir apparaître ici."
                        actionLabel="Nouveau Voyage"
                        actionHref="/crm/pipeline"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map((trip, i) => (
                                <motion.div key={trip.id}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => router.push(`/crm/trips/${trip.id}`)}
                                    className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">

                                    {/* Status + Destination */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_STYLES[trip.status] || STATUS_STYLES.DRAFT}`}>
                                            {STATUS_LABELS[trip.status] || trip.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Map size={12} />
                                            <span>{trip.destination}</span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-semibold text-[#2E2E2E] mb-2 group-hover:text-[#5a8fa3] transition-colors truncate">
                                        {trip.title}
                                    </h3>

                                    {/* Client */}
                                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                                        <Users size={12} /> {trip.clientName}
                                    </p>

                                    {/* Details */}
                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{trip.startDate ? formatDate(trip.startDate) : '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={12} />
                                            <span>{trip.travelers || 2} pax</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                                            <DollarSign size={12} />
                                            <span>{(trip.amount || 0).toLocaleString('fr-FR')} €</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="mt-4 flex justify-end">
                                        <ArrowUpRight size={16} className="text-gray-200 group-hover:text-[#5a8fa3] transition-colors" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <ConfirmModal
                open={!!deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Supprimer le voyage"
                message="Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible."
            />
        </div>
    );
}
