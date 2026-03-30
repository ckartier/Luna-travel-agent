'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Users, Calendar, Sparkles,
  DollarSign, Loader2, ArrowUpRight, ArrowDownRight, Briefcase, Activity,
  PieChart as PieIcon, CreditCard, ShoppingBag, Truck, type LucideIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import {
  getLeads, getTrips, getContacts, getActivities,
  getInvoices, getSuppliers,
  CRMLead, CRMTrip, CRMInvoice, CRMSupplier
} from '@/src/lib/firebase/crm';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { T } from '@/src/components/T';
import { computePrestationScoresFromTrips } from '@/src/lib/analytics/prestationScores';

const CHART_COLORS = ['#10b981', '#1f2937', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316'];

interface AIInsight {
  type: 'positive' | 'warning' | 'opportunity';
  title: string;
  detail: string;
}

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toMonthIndex(value: unknown): number | null {
  const date = value instanceof Date ? value : new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth();
  return month >= 0 && month <= 11 ? month : null;
}

function StatCard({ icon: Icon, label, value, sub, delay, up = true, trend = '' }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; delay: number;
  up?: boolean; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#bcdeea]/30 transition-all group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-emerald-50/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />

      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl bg-gray-50/80 text-luna-charcoal group-hover:bg-[#4a7f93] group-hover:text-white transition-all shadow-sm">
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${up ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
            {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-4xl font-light text-[#2E2E2E] tracking-tight">{value}</h3>
        {sub && <p className="text-xs text-gray-400 font-sans tracking-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { tenantId } = useAuth();
  const { vertical } = useVertical();
  const isLegal = vertical.id === 'legal';
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [trips, setTrips] = useState<CRMTrip[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const loadData = async () => {
      setLoading(true);
      const currentVertical = isLegal ? 'legal' : 'travel';
      try {
        const [allL, allT, allInvs, c, a, sups] = await Promise.all([
          getLeads(tenantId),
          getTrips(tenantId),
          getInvoices(tenantId),
          getContacts(tenantId),
          getActivities(tenantId),
          getSuppliers(tenantId)
        ]);
        setLeads(allL.filter(l => (l.vertical || 'travel') === currentVertical));
        setTrips(allT.filter(t => (t.vertical || 'travel') === currentVertical));
        setInvoices(allInvs.filter(i => (i.vertical || 'travel') === currentVertical));
        setContactCount(c.length);
        setActivityCount(a.length);
        setSuppliers(sups);
      } catch (e) {
        console.error('Analytics load error:', e);
      }
      setLoading(false);
    };
    loadData();
  }, [tenantId, isLegal]);

  // ── ADVANCED COMPUTED METRICS ──
  const dashboardData = useMemo(() => {
    // 1. Financial Overview (Cross-referenced with Quotes/Invoices)
    let grossRevenue = 0;
    let totalCost = 0;
    let totalUnpaid = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'CANCELLED') {
        const totalAmount = toSafeNumber(inv.totalAmount);
        const amountPaid = toSafeNumber(inv.amountPaid);
        grossRevenue += totalAmount;
        totalUnpaid += Math.max(0, totalAmount - amountPaid);
      }
    });

    // Calculate Cost from Trips/Quotes linkage
    trips.forEach(trip => {
      if (trip.status !== 'CANCELLED') {
        totalCost += toSafeNumber(trip.cost);
      }
    });

    const netProfit = grossRevenue - totalCost;
    const avgMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    // 2. Monthly Trend (Historical Comparison)
    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = MONTHS.map(m => ({ name: m, revenue: 0, cost: 0, profit: 0 }));

    invoices.forEach(inv => {
      if (inv.status === 'PAID' || inv.status === 'SENT') {
        const monthIdx = toMonthIndex(inv.issueDate);
        if (monthIdx === null) return;
        monthlyData[monthIdx].revenue += toSafeNumber(inv.totalAmount);
      }
    });

    trips.forEach(trip => {
      const monthIdx = toMonthIndex(trip.startDate);
      if (monthIdx === null) return;
      monthlyData[monthIdx].cost += toSafeNumber(trip.cost);
    });

    monthlyData.forEach(d => { d.profit = d.revenue - d.cost; });

    // 3. Category Distribution (Suppliers / Inventory)
    const catMap: Record<string, number> = {};
    suppliers.forEach(s => {
      const category = String(s.category || 'OTHER');
      catMap[category] = (catMap[category] || 0) + 1;
    });

    // 4. Performance Conversion
    const wonLeads = leads.filter(l => l.status === 'WON').length;
    const lostLeads = leads.filter(l => l.status === 'LOST').length;
    const ongoingLeads = leads.length - wonLeads - lostLeads;
    const convRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

    const leadsPie = [
      { name: 'Gagné', value: wonLeads, fill: '#10b981' },
      { name: 'Perdu', value: lostLeads, fill: '#f43f5e' },
      { name: 'En cours', value: ongoingLeads, fill: '#f59e0b' }
    ].filter(d => d.value > 0);

    const financePie = [
      { name: 'Marge', value: netProfit > 0 ? netProfit : 0, fill: '#0ea5e9' },
      { name: 'Dépenses', value: totalCost > 0 ? totalCost : (grossRevenue > 0 ? grossRevenue : 0), fill: '#8b5cf6' }
    ].filter(d => d.value > 0);

    const prestationScores = computePrestationScoresFromTrips(
      trips.map((trip) => {
        const raw = trip as unknown as Record<string, unknown>;
        return {
          amount: trip.amount,
          totalClientPrice: trip.totalClientPrice,
          commissionAmount: trip.commissionAmount,
          selectedItems: raw.selectedItems,
        };
      })
    );

    return {
      grossRevenue,
      totalCost,
      netProfit,
      avgMargin,
      totalUnpaid,
      monthlyData,
      suppliersByCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })),
      conversionRate: convRate,
      wonLeads,
      totalLeads: leads.length,
      leadsPie,
      financePie,
      prestationScores,
      topPrestationScore: prestationScores[0]?.score || 0,
      totalPrestationSales: prestationScores.reduce((sum, item) => sum + item.salesCount, 0),
    };
  }, [leads, trips, invoices, suppliers]);

  const fetchAiInsights = async () => {
    setAiLoading(true);
    try {
      const res = await fetchWithAuth('/api/crm/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analytics',
          data: {
            revenue: dashboardData.grossRevenue,
            profit: dashboardData.netProfit,
            margin: dashboardData.avgMargin,
            unpaid: dashboardData.totalUnpaid,
            conversionRate: dashboardData.conversionRate,
            wonLeads: dashboardData.wonLeads,
            totalLeads: dashboardData.totalLeads,
            contacts: contactCount,
          },
        }),
      });
      const data = await res.json();
      if (data.insights) setAiInsights(data.insights);
    } catch (e) {
      console.error('AI insights error:', e);
    }
    setAiLoading(false);
  };

  if (loading && leads.length === 0) {
    return (
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
        <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
        <style jsx>{`
                    @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(-20%); } 100% { transform: translateX(0%); } }
                    .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
                `}</style>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Analytics</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">Analyse croisée des flux financiers, prestataires et conversion CRM.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100 flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase text-gray-400">
              <div className="flex items-center gap-2"><DollarSign size={14} className="text-emerald-500" /> SYNC FIREBASE</div>
              <div className="w-[1px] h-4 bg-gray-100" />
              <div className="text-emerald-600">Actualisé à l&apos;instant</div>
            </div>
          </div>
        </div>

        {/* ── KPI GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            label="Volume d&apos;Affaires"
            value={`${dashboardData.grossRevenue.toLocaleString('fr-FR')} €`}
            sub="Chiffre d'affaires brut émis"
            delay={0}
            trend="12.5%"
          />
          <StatCard
            icon={TrendingUp}
            label="Marge Nette (ROI)"
            value={`${dashboardData.netProfit.toLocaleString('fr-FR')} €`}
            sub={`Soit ${dashboardData.avgMargin}% de marge moyenne`}
            delay={0.1}
            trend={`${dashboardData.avgMargin}%`}
          />
          <StatCard
            icon={CreditCard}
            label="Encours à Recevoir"
            value={`${dashboardData.totalUnpaid.toLocaleString('fr-FR')} €`}
            sub="Factures envoyées non payées"
            delay={0.2}
            up={false}
            trend="Relances à prévoir"
          />
          <StatCard
            icon={Activity}
            label="Taux de Conversion"
            value={`${dashboardData.conversionRate}%`}
            sub={`${dashboardData.wonLeads} success sur ${dashboardData.totalLeads} leads`}
            delay={0.3}
            trend="Sain"
          />
        </div>

        <div className="rounded-3xl border border-[#bcdeea]/30 bg-[#f4fafc] px-5 py-4 flex flex-wrap items-center gap-5">
          <p className="text-xs font-semibold text-[#2c667b] uppercase tracking-[0.12em]">Score prestations</p>
          <p className="text-sm text-gray-600">
            Top score: <strong className="text-[#2c667b]">{dashboardData.topPrestationScore}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Ventes prestations: <strong className="text-[#2c667b]">{dashboardData.totalPrestationSales}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Prestations scorées: <strong className="text-[#2c667b]">{dashboardData.prestationScores.length}</strong>
          </p>
        </div>

        {/* ── MAIN CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Historical Performance Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40">Profitabilité Mensuelle (A/V)</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 uppercase"><div className="w-2 h-2 rounded-full bg-rose-400" /> Coût (Achat)</div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.monthlyData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="cost" name="Coût" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Double Donut Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[24px] border border-gray-100 p-8 relative overflow-hidden flex flex-col shadow-sm"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-400 rotate-12"><PieIcon size={120} /></div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-luna-charcoal/40 mb-1 flex items-center gap-2">
              <PieIcon size={14} /> Global 360°
            </h3>
            <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest">Leads & Finances Actuelles</p>

            <div className="flex-1 min-h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', background: '#ffffff', color: '#1f2937', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#1f2937' }}
                    formatter={(value: unknown, name: unknown) => {
                      const safeName = String(name || '');
                      const safeValue = toSafeNumber(value);
                      if (safeName === 'Marge' || safeName === 'Dépenses') return [`${safeValue.toLocaleString('fr-FR')} €`, safeName];
                      return [safeValue, safeName];
                    }}
                  />

                  {/* Inner Donut: Leads */}
                  <Pie
                    data={dashboardData.leadsPie.length > 0 ? dashboardData.leadsPie : [{ name: 'Aucun', value: 1, fill: '#f3f4f6' }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={40}
                    stroke="#ffffff"
                    strokeWidth={3}
                    paddingAngle={5}
                    animationBegin={200}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {(dashboardData.leadsPie.length > 0 ? dashboardData.leadsPie : [{ name: 'Aucun', value: 1, fill: '#f3f4f6' }]).map((entry, index) => (
                      <Cell key={`cell-in-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>

                  {/* Outer Donut: Finances */}
                  <Pie
                    data={dashboardData.financePie.length > 0 ? dashboardData.financePie : [{ name: 'Aucune', value: 1, fill: '#f3f4f6' }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    stroke="#ffffff"
                    strokeWidth={3}
                    paddingAngle={5}
                    animationBegin={600}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {(dashboardData.financePie.length > 0 ? dashboardData.financePie : [{ name: 'Aucune', value: 1, fill: '#f3f4f6' }]).map((entry, index) => (
                      <Cell key={`cell-out-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">Total</span>
                <span className="text-sm font-bold text-luna-charcoal">{dashboardData.grossRevenue > 0 ? `${(dashboardData.grossRevenue / 1000).toFixed(1)}k€` : '0€'}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 relative z-10 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
              <div className="space-y-3">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-200 pb-2">Leads (Qté)</p>
                {dashboardData.leadsPie.map((d, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-luna-charcoal transition-colors">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold bg-white border border-gray-100 px-1.5 py-0.5 rounded-md text-gray-700">{d.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-200 pb-2">Ventes (€)</p>
                {dashboardData.financePie.map((d, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-luna-charcoal transition-colors">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#10b981]">{toSafeNumber(d.value).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── BOTTOM ROW: Deep Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Top Suppliers / Prestations Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-[24px] border border-gray-100 p-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40">Dernières Opérations Financières</h3>
              <Activity size={20} className="text-emerald-500" />
            </div>

            <div className="space-y-6">
              {invoices.slice(0, 5).map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-[#bcdeea]/15/50 transition-all border border-transparent hover:border-[#bcdeea]/30 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Truck size={18} className="text-gray-400 group-hover:text-[#5a8fa3]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-luna-charcoal uppercase tracking-tighter">{inv.clientName}</p>
                      <p className="text-[10px] text-gray-400 font-sans">{inv.invoiceNumber} · {inv.issueDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{inv.totalAmount.toLocaleString('fr-FR')} €</p>
                    <p className={`text-[9px] font-bold uppercase ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{inv.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Lead Pipeline Analytics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-[24px] border border-gray-100 p-10"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40 mb-10">Qualité du Pipeline Leads</h3>

            <div className="space-y-12">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-bold text-luna-charcoal tracking-tight">Conversion de Proposition</p>
                    <p className="text-xs text-gray-400 font-sans">Leads gagnés vs Leads totaux</p>
                  </div>
                  <p className="text-3xl font-normal text-emerald-500 tracking-tighter leading-none">{dashboardData.conversionRate}%</p>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardData.conversionRate}%` }}
                    transition={{ duration: 1, delay: 1 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Performances Clients</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#5a8fa3]"><Users size={24} /></div>
                    <div>
                      <p className="text-xl font-bold text-luna-charcoal">{contactCount}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-sans">Fiches Actives</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Engagement Agents</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500"><Calendar size={24} /></div>
                    <div>
                      <p className="text-xl font-bold text-luna-charcoal">{activityCount}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-sans">Actions Sync</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50 italic text-[11px] text-gray-400 font-sans leading-relaxed">
                <Sparkles size={14} className="inline mr-2 text-emerald-400" />
                Votre taux d&apos;encaissement est à son maximum. Concentrez vos efforts sur la qualification des destinations à forte marge.
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── TOP SUPPLIERS & FORECAST ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Top Prestations Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-400" /> Top Prestations (Gain + Ventes)
              </h3>
              <span className="text-[9px] font-bold text-gray-300 px-2 py-1 bg-gray-50 rounded-full">Score /100</span>
            </div>

            <div className="space-y-3">
              {(() => {
                const topPrestations = dashboardData.prestationScores.slice(0, 6);
                const maxScore = topPrestations[0]?.score || 1;

                if (topPrestations.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-300 text-sm">
                      Aucune donnée — ajoutez des trips avec prestations sélectionnées
                    </div>
                  );
                }

                return topPrestations.map((item, i) => (
                  <div key={item.key} className="flex items-center gap-3 group">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#2E2E2E] truncate">{item.name}</span>
                        <span className="text-xs font-bold text-[#2E2E2E] shrink-0 ml-2">{item.score}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-1">
                        {item.salesCount} vente(s) · gain {item.gainVente.toLocaleString('fr-FR')} €
                      </p>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.score / maxScore) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.9 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>

          {/* Revenue Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Prévision 3 mois
              </h3>
              <span className="text-[9px] font-bold text-emerald-500 px-2 py-1 bg-emerald-50 rounded-full">Projection</span>
            </div>

            {(() => {
              const currentMonth = new Date().getMonth();
              const monthsWithRevenue = dashboardData.monthlyData.filter(d => d.revenue > 0);
              const avgMonthlyRevenue = monthsWithRevenue.length > 0
                ? monthsWithRevenue.reduce((s, d) => s + d.revenue, 0) / monthsWithRevenue.length
                : 0;
              const avgMonthlyCost = monthsWithRevenue.length > 0
                ? monthsWithRevenue.reduce((s, d) => s + d.cost, 0) / monthsWithRevenue.length
                : 0;
              const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

              const forecastData = [0, 1, 2].map(offset => {
                const mi = (currentMonth + 1 + offset) % 12;
                const growthFactor = 1 + (offset * 0.05); // 5% growth per month
                return {
                  month: MONTHS[mi],
                  revenue: Math.round(avgMonthlyRevenue * growthFactor),
                  profit: Math.round((avgMonthlyRevenue - avgMonthlyCost) * growthFactor),
                };
              });

              if (avgMonthlyRevenue === 0) {
                return (
                  <div className="text-center py-12 text-gray-300 text-sm">
                    Pas assez de données pour une prévision — facturez au moins 1 mois
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {forecastData.map((f, i) => (
                      <div key={i} className="bg-gray-50/80 rounded-2xl p-4 text-center border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">{f.month}</p>
                        <p className="text-lg font-bold text-[#2E2E2E] tracking-tight">{f.revenue.toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-emerald-500 font-bold mt-1">+{f.profit.toLocaleString('fr-FR')} €</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-2xl p-5 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[#2E2E2E]">Prévision trimestrielle</p>
                        <p className="text-[11px] text-gray-500">
                          Revenue estimée : <strong>{forecastData.reduce((s, f) => s + f.revenue, 0).toLocaleString('fr-FR')} €</strong> · 
                          Profit estimé : <strong className="text-emerald-600">{forecastData.reduce((s, f) => s + f.profit, 0).toLocaleString('fr-FR')} €</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-300 italic">
                    * Basé sur la moyenne mensuelle avec un taux de croissance de 5%/mois
                  </p>
                </div>
              );
            })()}
          </motion.div>

          {/* Supplier Categories Distribution */}
          {dashboardData.suppliersByCategory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm lg:col-span-2"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40 mb-6 flex items-center gap-2">
                <ShoppingBag size={16} className="text-purple-400" /> Répartition Prestataires par Catégorie
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardData.suppliersByCategory.slice().sort((a, b) => b.value - a.value).map((cat, i) => (
                  <div key={cat.name} className="bg-gray-50/80 rounded-2xl p-4 text-center border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}15` }}>
                      <span className="text-lg">{
                        cat.name === 'HOTEL' ? '🏨' : cat.name === 'FLIGHT' ? '✈️' : cat.name === 'ACTIVITY' ? '🎯' :
                        cat.name === 'TRANSFER' ? '🚗' : cat.name === 'RESTAURANT' ? '🍽' : '📌'
                      }</span>
                    </div>
                    <p className="text-xs font-bold text-[#2E2E2E]">{cat.name}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{cat.value}</p>
                    <p className="text-[9px] text-gray-400">prestataire{cat.value > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Gemini AI Insights Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-[24px] border border-gray-700 p-8 shadow-xl lg:col-span-3 text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" /> Insights IA — Gemini
              </h3>
              <button
                onClick={fetchAiInsights}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white/80 transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? 'Analyse...' : aiInsights.length > 0 ? 'Relancer' : 'Analyser'}
              </button>
            </div>
            {aiInsights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiInsights.map((insight, i) => {
                  const colors = {
                    positive: 'border-emerald-500/30 bg-emerald-500/10',
                    warning: 'border-amber-500/30 bg-amber-500/10',
                    opportunity: 'border-sky-500/30 bg-sky-500/10',
                  };
                  const icons = {
                    positive: '✅',
                    warning: '⚠️',
                    opportunity: '💡',
                  };
                  return (
                    <div key={i} className={`rounded-2xl border p-5 ${colors[insight.type] || colors.opportunity}`}>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <span>{icons[insight.type] || '💡'}</span> {insight.title}
                      </p>
                      <p className="text-xs text-white/60 leading-relaxed">{insight.detail}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/30 text-center py-6">
                Cliquez sur « Analyser » pour obtenir des insights IA personnalisés basés sur vos KPIs.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
