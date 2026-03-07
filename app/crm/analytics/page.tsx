'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, MapPin, Plane, Hotel, Users, Calendar, Sparkles,
  DollarSign, Loader2, ArrowUpRight, ArrowDownRight, Briefcase, Activity,
  PieChart as PieIcon, CreditCard, ShoppingBag, Truck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getLeads, getTrips, getContacts, getActivities,
  getInvoices, getQuotes, getSuppliers,
  CRMLead, CRMTrip, CRMInvoice, CRMQuote, CRMSupplier
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';

const CHART_COLORS = ['#10b981', '#1f2937', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316'];

function StatCard({ icon: Icon, label, value, sub, color, delay, up = true, trend = '' }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; delay: number;
  up?: boolean; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white/80 backdrop-blur-2xl rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-emerald-50/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />

      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl bg-gray-50/80 text-luna-charcoal group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
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
        <h3 className="text-3xl font-normal text-luna-charcoal tracking-tighter leading-none mb-2">{value}</h3>
        {sub && <p className="text-xs text-gray-400 font-sans tracking-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { tenantId } = useAuth();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [trips, setTrips] = useState<CRMTrip[]>([]);
  const [invoices, setInvoices] = useState<CRMInvoice[]>([]);
  const [quotes, setQuotes] = useState<CRMQuote[]>([]);
  const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [l, t, invs, qts, c, a, sups] = await Promise.all([
          getLeads(tenantId),
          getTrips(tenantId),
          getInvoices(tenantId),
          getQuotes(tenantId),
          getContacts(tenantId),
          getActivities(tenantId),
          getSuppliers(tenantId)
        ]);
        setLeads(l);
        setTrips(t);
        setInvoices(invs);
        setQuotes(qts);
        setContactCount(c.length);
        setActivityCount(a.length);
        setSuppliers(sups);
      } catch (e) {
        console.error('Analytics load error:', e);
      }
      setLoading(false);
    };
    loadData();
  }, [tenantId]);

  // ── ADVANCED COMPUTED METRICS ──
  const dashboardData = useMemo(() => {
    // 1. Financial Overview (Cross-referenced with Quotes/Invoices)
    let grossRevenue = 0;
    let totalCost = 0;
    let totalUnpaid = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'CANCELLED') {
        grossRevenue += inv.totalAmount;
        totalUnpaid += (inv.totalAmount - inv.amountPaid);
      }
    });

    // Calculate Cost from Trips/Quotes linkage
    trips.forEach(trip => {
      if (trip.status !== 'CANCELLED') {
        totalCost += (trip.cost || 0);
      }
    });

    const netProfit = grossRevenue - totalCost;
    const avgMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    // 2. Monthly Trend (Historical Comparison)
    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = MONTHS.map(m => ({ name: m, revenue: 0, cost: 0, profit: 0 }));

    invoices.forEach(inv => {
      if (inv.status === 'PAID' || inv.status === 'SENT') {
        const monthIdx = new Date(inv.issueDate).getMonth();
        monthlyData[monthIdx].revenue += inv.totalAmount;
      }
    });

    trips.forEach(trip => {
      const date = new Date(trip.startDate);
      if (!isNaN(date.getTime())) {
        const monthIdx = date.getMonth();
        monthlyData[monthIdx].cost += (trip.cost || 0);
      }
    });

    monthlyData.forEach(d => { d.profit = d.revenue - d.cost; });

    // 3. Category Distribution (Suppliers / Inventory)
    const catMap: Record<string, number> = {};
    suppliers.forEach(s => {
      catMap[s.category] = (catMap[s.category] || 0) + 1;
    });

    // 4. Performance Conversion
    const wonLeads = leads.filter(l => l.status === 'WON').length;
    const convRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

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
      totalLeads: leads.length
    };
  }, [leads, trips, invoices, quotes, suppliers]);

  const isEmpty = leads.length === 0 && trips.length === 0;

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
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-10 animate-in fade-in duration-500 pb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-normal text-luna-charcoal tracking-tight"><T>Analytics</T></h1>
          <p className="text-sm text-gray-400 font-sans tracking-tight">Analyse croisée des flux financiers, prestataires et conversion CRM.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-100 flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            <div className="flex items-center gap-2"><DollarSign size={14} className="text-emerald-500" /> SYNC FIREBASE</div>
            <div className="w-[1px] h-4 bg-gray-100" />
            <div className="text-emerald-600">Actualisé à l'instant</div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Volume d'Affaires"
          value={`${dashboardData.grossRevenue.toLocaleString('fr-FR')} €`}
          sub="Chiffre d'affaires brut émis"
          color="#10b981"
          delay={0}
          trend="12.5%"
        />
        <StatCard
          icon={TrendingUp}
          label="Marge Nette (ROI)"
          value={`${dashboardData.netProfit.toLocaleString('fr-FR')} €`}
          sub={`Soit ${dashboardData.avgMargin}% de marge moyenne`}
          color="#10b981"
          delay={0.1}
          trend={`${dashboardData.avgMargin}%`}
        />
        <StatCard
          icon={CreditCard}
          label="Encours à Recevoir"
          value={`${dashboardData.totalUnpaid.toLocaleString('fr-FR')} €`}
          sub="Factures envoyées non payées"
          color="#f59e0b"
          delay={0.2}
          up={false}
          trend="Relances à prévoir"
        />
        <StatCard
          icon={Activity}
          label="Taux de Conversion"
          value={`${dashboardData.conversionRate}%`}
          sub={`${dashboardData.wonLeads} success sur ${dashboardData.totalLeads} leads`}
          color="#6366f1"
          delay={0.3}
          trend="Sain"
        />
      </div>

      {/* ── MAIN CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Historical Performance Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40">Profitabilité Mensuelle (A/V)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 uppercase"><div className="w-2 h-2 rounded-full bg-rose-400" /> Coût (Achat)</div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="cost" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={0} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-luna-charcoal rounded-[40px] p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-400 rotate-12"><ShoppingBag size={120} /></div>

          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-10">Répartition Prestataires</h3>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.suppliersByCategory}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  cornerRadius={12}
                >
                  {dashboardData.suppliersByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', background: '#1f2937', color: '#fff', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-4">
            {dashboardData.suppliersByCategory.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{cat.name}</span>
                </div>
                <span className="text-xs font-bold">{cat.value}</span>
              </div>
            ))}
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
          className="bg-white rounded-[40px] border border-gray-100 p-10"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-luna-charcoal/40">Dernières Opérations Financières</h3>
            <Activity size={20} className="text-emerald-500" />
          </div>

          <div className="space-y-6">
            {invoices.slice(0, 5).map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-emerald-50/50 transition-all border border-transparent hover:border-emerald-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Truck size={18} className="text-gray-400 group-hover:text-emerald-500" />
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
          className="bg-white rounded-[40px] border border-gray-100 p-10"
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
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500"><Users size={24} /></div>
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
              Votre taux d'encaissement est à son maximum. Concentrez vos efforts sur la qualification des destinations à forte marge.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
