'use client';

import { useState } from 'react';
import {
    Bug, CheckCircle2, Sparkles, Loader2, Plane, Scale, Plus, X,
    AlertCircle, AlertTriangle, Info
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

const GREEN = '#19c37d';
const CYAN = '#16b8c8';
const LIME = '#e3f24f';
const AMBER = '#ffd15c';

const SEVERITY_CFG: Record<string, { label: string; color: string }> = {
    critical: { label: 'Critique', color: '#ef4444' },
    normal: { label: 'Normal', color: '#f59e0b' },
    low: { label: 'Mineur', color: '#3b82f6' },
};

interface HealthData {
    overall: { status: string; score: number; totalBugs: number; openBugs: number; criticalBugs: number };
    travel: { status: string; leads: number; contacts: number; activeTrips: number; totalTrips: number; revenue: number };
    legal: { status: string; leads: number; contacts: number; activeDossiers: number; totalDossiers: number; revenue: number };
    bugReports: any[];
    timestamp: string;
}

export default function AdminView({ health, loading, analysis, setAnalysis, bugFilter, setBugFilter, filteredBugs, runAnalysis, analyzing, refreshHealth }: {
    health: HealthData | null; loading: boolean; analysis: string | null; setAnalysis: (a: string | null) => void;
    bugFilter: string; setBugFilter: (f: any) => void; filteredBugs: any[];
    runAnalysis: () => void; analyzing: boolean; refreshHealth: () => void;
}) {
    const [showBugForm, setShowBugForm] = useState(false);
    const [bugForm, setBugForm] = useState({ title: '', description: '', severity: 'normal', page: '' });
    const [submittingBug, setSubmittingBug] = useState(false);

    const submitBug = async () => {
        if (!bugForm.title.trim()) return;
        setSubmittingBug(true);
        try {
            await fetchWithAuth('/api/crm/bug-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...bugForm, source: 'hub' }),
            });
            setBugForm({ title: '', description: '', severity: 'normal', page: '' });
            setShowBugForm(false);
            refreshHealth();
        } catch (e) { console.error('Bug submit error:', e); }
        setSubmittingBug(false);
    };

    const resolveBug = async (bugId: string) => {
        try {
            await fetchWithAuth(`/api/crm/bug-report`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bugId, status: 'resolved' }),
            });
            refreshHealth();
        } catch (e) { console.error('Resolve error:', e); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 size={28} className="animate-spin text-zinc-400" />
            </div>
        );
    }

    const overallStatus = health?.overall?.status || 'healthy';
    const statusColor = overallStatus === 'healthy' ? GREEN : overallStatus === 'degraded' ? AMBER : '#ef4444';

    return (
        <div className="space-y-4 animate-[fadeUp_.8s_cubic-bezier(0.22,1,0.36,1)]">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard title="Score Santé" value={`${health?.overall?.score ?? '—'}/10`} accent={statusColor} hint={overallStatus === 'healthy' ? 'Stable' : 'Attention'} />
                <KpiCard title="Bugs Ouverts" value={String(health?.overall?.openBugs || 0)} accent={CYAN} hint={`${health?.overall?.criticalBugs || 0} critiques`} />
                <KpiCard title="CA Travel" value={`€${((health?.travel?.revenue || 0) / 1000).toFixed(0)}k`} accent={GREEN} hint={`${health?.travel?.leads || 0} leads`} />
                <KpiCard title="CA Legal" value={`€${((health?.legal?.revenue || 0) / 1000).toFixed(0)}k`} accent={AMBER} hint={`${health?.legal?.leads || 0} leads`} />
            </div>

            {/* CRM Status + Analysis */}
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <GlassCard title="CRM Status" action="Live">
                    <div className="grid gap-3 md:grid-cols-2">
                        <CrmStatusCard name="CRM Travel" subtitle="Luna Conciergerie" icon={Plane} color="#5a8fa3"
                            stats={[
                                { label: 'Leads', value: health?.travel?.leads || 0 },
                                { label: 'Voyages Actifs', value: health?.travel?.activeTrips || 0 },
                                { label: 'Contacts', value: health?.travel?.contacts || 0 },
                            ]} status={health?.travel?.status || 'healthy'} />
                        <CrmStatusCard name="CRM Legal" subtitle="Le Droit Agent" icon={Scale} color="#A07850"
                            stats={[
                                { label: 'Leads', value: health?.legal?.leads || 0 },
                                { label: 'Dossiers Actifs', value: health?.legal?.activeDossiers || 0 },
                                { label: 'Total', value: health?.legal?.totalDossiers || 0 },
                            ]} status={health?.legal?.status || 'healthy'} />
                    </div>
                </GlassCard>
                <GlassCard title="Analyse Gemini IA" action={analyzing ? 'En cours…' : 'Prêt'}>
                    {analysis ? (
                        <div className="rounded-[14px] bg-white/20 p-4 text-[12px] font-mono text-zinc-600 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {analysis}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Sparkles size={24} className="mx-auto text-zinc-300 mb-2" />
                            <p className="text-[11px] text-zinc-400 font-mono">Cliquez &quot;Analyse IA&quot; pour un diagnostic.</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Bug Reports */}
            <div className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Bug size={16} className="text-zinc-500" />
                        <h3 className="text-[14px] font-semibold text-zinc-800 font-mono">Bug Reports</h3>
                        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/30 px-2 py-0.5 rounded-full">{health?.bugReports?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {([['all', 'Tous'], ['open', 'Ouverts'], ['critical', 'Critiques']] as const).map(([key, label]) => (
                                <button key={key} onClick={() => setBugFilter(key)}
                                    className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all"
                                    style={{ backgroundColor: bugFilter === key ? GREEN : 'transparent', color: bugFilter === key ? 'white' : '#9ca3af' }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowBugForm(!showBugForm)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-white uppercase"
                            style={{ backgroundColor: showBugForm ? '#ef4444' : GREEN }}>
                            {showBugForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            {showBugForm ? 'Annuler' : 'Signaler'}
                        </button>
                    </div>
                </div>

                {/* Bug form */}
                {showBugForm && (
                    <div className="mb-4 rounded-[16px] border border-white/40 bg-white/25 p-4 space-y-3">
                        <input value={bugForm.title} onChange={e => setBugForm({ ...bugForm, title: e.target.value })}
                            placeholder="Titre du bug" className="w-full rounded-[10px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] font-mono outline-none" />
                        <textarea value={bugForm.description} onChange={e => setBugForm({ ...bugForm, description: e.target.value })}
                            placeholder="Description détaillée" rows={3}
                            className="w-full rounded-[10px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] font-mono outline-none resize-none" />
                        <div className="flex gap-3">
                            <select value={bugForm.severity} onChange={e => setBugForm({ ...bugForm, severity: e.target.value })}
                                className="rounded-[10px] border border-white/40 bg-white/30 px-3 py-2 text-[11px] font-mono outline-none">
                                <option value="low">Mineur</option>
                                <option value="normal">Normal</option>
                                <option value="critical">Critique</option>
                            </select>
                            <input value={bugForm.page} onChange={e => setBugForm({ ...bugForm, page: e.target.value })}
                                placeholder="Page affectée" className="flex-1 rounded-[10px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] font-mono outline-none" />
                            <button onClick={submitBug} disabled={submittingBug || !bugForm.title.trim()}
                                className="px-4 py-2 rounded-[10px] text-[11px] font-mono font-bold text-white disabled:opacity-40" style={{ backgroundColor: GREEN }}>
                                {submittingBug ? 'Envoi…' : 'Envoyer'}
                            </button>
                        </div>
                    </div>
                )}

                {filteredBugs.length === 0 ? (
                    <div className="text-center py-10">
                        <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: GREEN }} />
                        <p className="text-sm font-mono font-bold text-zinc-600">Aucun bug 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-[20px] border border-white/40 divide-y divide-white/35">
                        {filteredBugs.map((bug: any) => {
                            const sev = SEVERITY_CFG[bug.severity] || SEVERITY_CFG.normal;
                            return (
                                <div key={bug.id} className="flex items-center justify-between px-4 py-4 bg-white/10 hover:bg-white/20 transition">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold" style={{ background: sev.color + '22', color: sev.color }}>{sev.label}</span>
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
                                                style={{ background: bug.status === 'open' ? GREEN + '22' : '#94a3b822', color: bug.status === 'open' ? GREEN : '#94a3b8' }}>
                                                {bug.status === 'open' ? 'Ouvert' : 'Résolu'}
                                            </span>
                                        </div>
                                        <div className="text-[12px] font-mono font-bold text-zinc-700 truncate">{bug.title}</div>
                                        <div className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{bug.description}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        {bug.status === 'open' && (
                                            <button onClick={() => resolveBug(bug.id)}
                                                className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-white uppercase" style={{ backgroundColor: GREEN }}>
                                                Résoudre
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Sub-components ── */
function KpiCard({ title, value, accent, hint }: { title: string; value: string; accent: string; hint: string }) {
    return (
        <div className="rounded-[24px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
            <div className="text-[11px] tracking-[0.12em] text-zinc-500 font-mono">{title}</div>
            <div className="mt-3 text-[28px] font-semibold tracking-tight text-zinc-800 font-mono">{value}</div>
            <div className="mt-4 flex items-center justify-between">
                <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accent }} />
                <span className="text-[11px] text-zinc-500 font-mono">{hint}</span>
            </div>
        </div>
    );
}

function GlassCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
    return (
        <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-zinc-800 font-mono">{title}</h3>
                <span className="text-[11px] text-zinc-500 font-mono">{action}</span>
            </div>
            {children}
        </section>
    );
}

function CrmStatusCard({ name, subtitle, icon: Icon, color, stats, status }: any) {
    const statusColor = status === 'healthy' ? GREEN : status === 'degraded' ? AMBER : '#ef4444';
    return (
        <div className="rounded-[20px] border border-white/40 bg-white/15 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ background: color + '22' }}>
                        <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                        <div className="text-[12px] font-mono font-bold text-zinc-700">{name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{subtitle}</div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: statusColor + '22' }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                    <span className="text-[9px] font-mono font-bold" style={{ color: statusColor }}>{status === 'healthy' ? 'Online' : 'Dégradé'}</span>
                </div>
            </div>
            <div className="space-y-2">
                {stats.map((s: any) => (
                    <div key={s.label} className="flex items-center justify-between rounded-[10px] bg-white/20 px-3 py-2">
                        <span className="text-[10px] text-zinc-500 font-mono">{s.label}</span>
                        <span className="text-[12px] font-mono font-bold text-zinc-700">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
