'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Users, Plane, FileText, CreditCard, Key, TrendingUp,
    Loader2, ChevronDown, ChevronRight, Plus, Copy, Check, Trash2,
    Globe, Activity, BarChart3, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface TenantData {
    id: string;
    name: string;
    domain?: string;
    plan?: string;
    createdAt?: string;
    stats: {
        contacts: number;
        trips: number;
        quotes: number;
        invoices: number;
        revenue: number;
    };
    apiKeys: { key: string; name: string; createdAt: string }[];
}

export default function TenantsPage() {
    const { tenantId } = useAuth();
    const [tenants, setTenants] = useState<TenantData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [generatingKey, setGeneratingKey] = useState<string | null>(null);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tenants');
            if (res.ok) {
                const data = await res.json();
                setTenants(data.tenants || []);
            }
        } catch (e) {
            console.error('Failed to load tenants:', e);
        }
        setLoading(false);
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleGenerateKey = async (tId: string) => {
        setGeneratingKey(tId);
        try {
            const res = await fetch('/api/admin/tenants/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tId, name: `Key ${new Date().toLocaleDateString('fr-FR')}` }),
            });
            if (res.ok) {
                await loadTenants();
            }
        } catch (e) {
            console.error('Failed to generate key:', e);
        }
        setGeneratingKey(null);
    };

    // Cross-tenant aggregations
    const totals = tenants.reduce((acc, t) => ({
        contacts: acc.contacts + t.stats.contacts,
        trips: acc.trips + t.stats.trips,
        quotes: acc.quotes + t.stats.quotes,
        invoices: acc.invoices + t.stats.invoices,
        revenue: acc.revenue + t.stats.revenue,
    }), { contacts: 0, trips: 0, quotes: 0, invoices: 0, revenue: 0 });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-gray-300" size={24} />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-light text-[#2E2E2E] tracking-tight">Tenants</h1>
                    <p className="text-sm text-gray-400 mt-1">{tenants.length} agence{tenants.length > 1 ? 's' : ''} enregistrée{tenants.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={loadTenants} className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#2E2E2E] bg-gray-50 px-3 py-2 rounded-xl transition-colors cursor-pointer">
                    <RefreshCw size={14} /> Actualiser
                </button>
            </div>

            {/* Cross-tenant KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Contacts', value: totals.contacts, icon: Users, color: '#2F80ED' },
                    { label: 'Voyages', value: totals.trips, icon: Plane, color: '#27AE60' },
                    { label: 'Devis', value: totals.quotes, icon: FileText, color: '#F2994A' },
                    { label: 'Factures', value: totals.invoices, icon: CreditCard, color: '#9B51E0' },
                    { label: 'Revenue', value: `${totals.revenue.toLocaleString('fr-FR')} €`, icon: TrendingUp, color: '#219653' },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${kpi.color}12` }}>
                            <kpi.icon size={14} style={{ color: kpi.color }} />
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <p className="text-xl font-bold text-[#2E2E2E] tracking-tight">{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tenants List */}
            <div className="space-y-3">
                {tenants.map((tenant, ti) => (
                    <motion.div key={tenant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + ti * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        <button
                            onClick={() => setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#2E2E2E] flex items-center justify-center text-white text-xs font-bold">
                                    {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-[#2E2E2E]">{tenant.name || tenant.id}</h3>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        {tenant.domain && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Globe size={10} /> {tenant.domain}</span>}
                                        <span className="text-[10px] text-gray-300">{tenant.plan || 'Free'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-4 text-[10px] text-gray-400">
                                    <span><Users size={10} className="inline mr-1" />{tenant.stats.contacts}</span>
                                    <span><Plane size={10} className="inline mr-1" />{tenant.stats.trips}</span>
                                    <span><FileText size={10} className="inline mr-1" />{tenant.stats.quotes}</span>
                                    <span className="font-bold text-emerald-500">{tenant.stats.revenue.toLocaleString('fr-FR')} €</span>
                                </div>
                                {expandedTenant === tenant.id ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
                            </div>
                        </button>

                        {expandedTenant === tenant.id && (
                            <div className="border-t border-gray-50 px-6 py-4 space-y-4">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { label: 'Contacts', value: tenant.stats.contacts },
                                        { label: 'Voyages', value: tenant.stats.trips },
                                        { label: 'Devis', value: tenant.stats.quotes },
                                        { label: 'Factures', value: tenant.stats.invoices },
                                        { label: 'Revenue', value: `${tenant.stats.revenue.toLocaleString('fr-FR')} €` },
                                    ].map(s => (
                                        <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                                            <p className="text-sm font-bold text-[#2E2E2E]">{s.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* API Keys Management */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Key size={12} /> Clés API
                                        </p>
                                        <button
                                            onClick={() => handleGenerateKey(tenant.id)}
                                            disabled={generatingKey === tenant.id}
                                            className="text-xs text-[#2E2E2E] bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {generatingKey === tenant.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                                            Générer
                                        </button>
                                    </div>

                                    {tenant.apiKeys.length === 0 ? (
                                        <p className="text-xs text-gray-300 italic">Aucune clé API</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {tenant.apiKeys.map(ak => (
                                                <div key={ak.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-[10px] font-mono text-gray-500">{ak.key.substring(0, 12)}...{ak.key.slice(-4)}</code>
                                                        <span className="text-[9px] text-gray-300">{ak.name}</span>
                                                    </div>
                                                    <button onClick={() => handleCopyKey(ak.key)} className="cursor-pointer p-1">
                                                        {copiedKey === ak.key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-300 hover:text-gray-500" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}

                {tenants.length === 0 && (
                    <div className="text-center py-16">
                        <Building2 size={32} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400">Aucune agence enregistrée</p>
                    </div>
                )}
            </div>
        </div>
    );
}
