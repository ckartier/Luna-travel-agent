'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase/client';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { formatPrice, formatPriceCompact } from '@/src/lib/currency';
import {
    ArrowLeft, TrendingUp, TrendingDown, DollarSign,
    Plane, Hotel, MapPin, Users, Utensils, Car,
    PieChart, BarChart3, AlertTriangle, CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════
   TRIP BUDGET — Margin Simulation & Analysis
   Per-trip cost breakdown with margin calculation
   ═══════════════════════════════════════ */

const TYPE_ICONS: Record<string, { icon: any; label: string; color: string }> = {
    FLIGHT:     { icon: Plane,    label: 'Vol',        color: '#2F80ED' },
    HOTEL:      { icon: Hotel,    label: 'Hôtel',      color: '#27AE60' },
    ACTIVITY:   { icon: MapPin,   label: 'Activité',   color: '#F2994A' },
    TRANSFER:   { icon: Car,      label: 'Transfert',  color: '#9B51E0' },
    RESTAURANT: { icon: Utensils, label: 'Restaurant', color: '#EB5757' },
    GUIDE:      { icon: Users,    label: 'Guide',      color: '#56CCF2' },
};

interface BookingRow {
    id: string;
    type: string;
    supplier: string;
    supplierPrice: number;
    clientPrice: number;
    margin: number;
    marginPct: number;
}

export default function TripBudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tripId } = use(params);
    const { userProfile } = useAuth();
    const tenantId = userProfile?.tenantId;

    const [trip, setTrip] = useState<any>(null);
    const [bookings, setBookings] = useState<BookingRow[]>([]);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const currency = trip?.currency || 'EUR';

    useEffect(() => {
        if (!tenantId) return;
        const load = async () => {
            try {
                const tenantRef = doc(db, 'tenants', tenantId);

                // Get trip
                const tripSnap = await getDoc(doc(tenantRef, 'trips', tripId));
                if (tripSnap.exists()) setTrip({ id: tripSnap.id, ...tripSnap.data() });

                // Get bookings
                const bookingsSnap = await getDocs(collection(tenantRef, 'trips', tripId, 'bookings'));
                const rows: BookingRow[] = bookingsSnap.docs.map(d => {
                    const data = d.data();
                    const supplierPrice = data.supplierPrice || data.price || 0;
                    const clientPrice = data.clientPrice || data.price || supplierPrice;
                    const margin = clientPrice - supplierPrice;
                    const marginPct = supplierPrice > 0 ? (margin / supplierPrice * 100) : 0;
                    return {
                        id: d.id,
                        type: data.type || 'ACTIVITY',
                        supplier: data.supplier || data.destination || 'Sans nom',
                        supplierPrice,
                        clientPrice,
                        margin,
                        marginPct,
                    };
                });
                setBookings(rows);

                // Try to get linked quote
                const quotesSnap = await getDocs(query(collection(tenantRef, 'quotes'), orderBy('createdAt', 'desc')));
                const clientName = tripSnap.data()?.clientName;
                const linkedQuote = quotesSnap.docs.find(q => q.data().clientName === clientName);
                if (linkedQuote) setQuote({ id: linkedQuote.id, ...linkedQuote.data() });
            } catch (e) {
                console.error('Budget load error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [tenantId, tripId]);

    // Calculations
    const stats = useMemo(() => {
        const totalSupplierCost = bookings.reduce((s, b) => s + b.supplierPrice, 0);
        const totalClientPrice = bookings.reduce((s, b) => s + b.clientPrice, 0);
        const totalMargin = totalClientPrice - totalSupplierCost;
        const avgMarginPct = totalSupplierCost > 0 ? (totalMargin / totalSupplierCost * 100) : 0;
        const quoteAmount = quote?.totalAmount || totalClientPrice;

        // Breakdown by type
        const byType: Record<string, { cost: number; count: number }> = {};
        bookings.forEach(b => {
            if (!byType[b.type]) byType[b.type] = { cost: 0, count: 0 };
            byType[b.type].cost += b.supplierPrice;
            byType[b.type].count++;
        });

        return { totalSupplierCost, totalClientPrice, totalMargin, avgMarginPct, quoteAmount, byType };
    }, [bookings, quote]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-gray-400 text-sm">Chargement du budget...</div>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Back + Title */}
            <div className="flex items-center gap-4">
                <Link href={`/crm/trips/${tripId}`} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <ArrowLeft size={18} className="text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-light text-[#2E2E2E] tracking-tight">
                        Budget — {trip?.destination || trip?.title || 'Voyage'}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">{trip?.clientName} · {bookings.length} prestation{bookings.length > 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Coût fournisseurs" value={formatPriceCompact(stats.totalSupplierCost, currency)} icon={<DollarSign size={16} />} color="#6B7280" />
                <KPICard label="Prix client" value={formatPriceCompact(stats.totalClientPrice, currency)} icon={<BarChart3 size={16} />} color="#2F80ED" />
                <KPICard label="Marge brute" value={formatPriceCompact(stats.totalMargin, currency)}
                    icon={stats.totalMargin >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    color={stats.totalMargin >= 0 ? '#27AE60' : '#EB5757'}
                    badge={`${stats.avgMarginPct.toFixed(1)}%`} />
                <KPICard label="Montant devis" value={formatPriceCompact(stats.quoteAmount, currency)} icon={<PieChart size={16} />} color="#F2994A"
                    badge={quote ? quote.status : 'Pas de devis'} />
            </motion.div>

            {/* Cost Breakdown by Type */}
            {Object.keys(stats.byType).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl border border-gray-100 p-6">
                    <h2 className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Répartition des coûts</h2>
                    <div className="space-y-3">
                        {Object.entries(stats.byType).sort((a, b) => b[1].cost - a[1].cost).map(([type, data]) => {
                            const pct = stats.totalSupplierCost > 0 ? (data.cost / stats.totalSupplierCost * 100) : 0;
                            const typeInfo = TYPE_ICONS[type] || TYPE_ICONS.ACTIVITY;
                            const Icon = typeInfo.icon;
                            return (
                                <div key={type} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${typeInfo.color}15` }}>
                                        <Icon size={14} style={{ color: typeInfo.color }} />
                                    </div>
                                    <span className="text-xs font-medium text-[#2E2E2E] w-20">{typeInfo.label}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full" style={{ backgroundColor: typeInfo.color }} />
                                    </div>
                                    <span className="text-xs font-bold text-[#2E2E2E] w-20 text-right">{formatPriceCompact(data.cost, currency)}</span>
                                    <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Detailed Booking Table */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                    <h2 className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Détail par prestation</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-[9px] font-bold text-gray-300 uppercase tracking-wider border-b border-gray-50">
                                <th className="px-6 py-3 text-left">Prestataire</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-right">Coût fournisseur</th>
                                <th className="px-4 py-3 text-right">Prix client</th>
                                <th className="px-4 py-3 text-right">Marge</th>
                                <th className="px-4 py-3 text-right">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b, i) => {
                                const typeInfo = TYPE_ICONS[b.type] || TYPE_ICONS.ACTIVITY;
                                const Icon = typeInfo.icon;
                                return (
                                    <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="font-medium text-[#2E2E2E]">{b.supplier}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Icon size={12} style={{ color: typeInfo.color }} />
                                                <span className="text-gray-500">{typeInfo.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{formatPriceCompact(b.supplierPrice, currency)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-[#2E2E2E]">{formatPriceCompact(b.clientPrice, currency)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={b.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                                {b.margin >= 0 ? '+' : ''}{formatPriceCompact(b.margin, currency)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                b.marginPct >= 20 ? 'bg-emerald-50 text-emerald-600'
                                                    : b.marginPct >= 10 ? 'bg-amber-50 text-amber-600'
                                                    : b.marginPct > 0 ? 'bg-orange-50 text-orange-600'
                                                    : 'bg-red-50 text-red-500'
                                            }`}>
                                                {b.marginPct.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50/80 font-bold">
                                <td className="px-6 py-3 text-[#2E2E2E]" colSpan={2}>TOTAL</td>
                                <td className="px-4 py-3 text-right text-gray-600">{formatPriceCompact(stats.totalSupplierCost, currency)}</td>
                                <td className="px-4 py-3 text-right text-[#2E2E2E]">{formatPriceCompact(stats.totalClientPrice, currency)}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={stats.totalMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                        {stats.totalMargin >= 0 ? '+' : ''}{formatPriceCompact(stats.totalMargin, currency)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${stats.avgMarginPct >= 15 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {stats.avgMarginPct.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </motion.div>

            {/* Margin Health Indicator */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`rounded-2xl p-5 flex items-center gap-4 ${
                    stats.avgMarginPct >= 20 ? 'bg-emerald-50 border border-emerald-200'
                        : stats.avgMarginPct >= 10 ? 'bg-amber-50 border border-amber-200'
                        : 'bg-red-50 border border-red-200'
                }`}>
                {stats.avgMarginPct >= 20 ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    : <AlertTriangle size={20} className={stats.avgMarginPct >= 10 ? 'text-amber-600 shrink-0' : 'text-red-500 shrink-0'} />}
                <div>
                    <p className="text-sm font-medium text-[#2E2E2E]">
                        {stats.avgMarginPct >= 20 ? 'Marges saines'
                            : stats.avgMarginPct >= 10 ? 'Marges acceptables — possibilité d\'optimiser'
                            : 'Marges faibles — attention à la rentabilité'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        Marge moyenne : {stats.avgMarginPct.toFixed(1)}% · Objectif recommandé : ≥ 20%
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ── KPI Card Component ──
function KPICard({ label, value, icon, color, badge }: {
    label: string; value: string; icon: React.ReactNode; color: string; badge?: string;
}) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
            </div>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{value}</p>
            {badge && (
                <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full mt-2 inline-block">{badge}</span>
            )}
        </div>
    );
}
