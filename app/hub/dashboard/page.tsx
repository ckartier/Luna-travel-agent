'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell, Search, Undo2, Monitor, Tablet, Smartphone, User, RefreshCw, Loader2
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useHubVoice } from '@/src/hooks/useHubVoice';
import BuilderView, { type HubConfig } from '@/src/components/hub/BuilderView';
import AdminView from '@/src/components/hub/AdminView';
import VoiceView from '@/src/components/hub/VoiceView';

const GREEN = '#19c37d';
const CYAN = '#16b8c8';
const LIME = '#e3f24f';
const AMBER = '#ffd15c';

type View = 'builder' | 'admin' | 'voice';
type Device = 'desktop' | 'tablet' | 'mobile';

interface HealthData {
    overall: { status: string; score: number; totalBugs: number; openBugs: number; criticalBugs: number };
    travel: { status: string; leads: number; contacts: number; activeTrips: number; totalTrips: number; revenue: number };
    legal: { status: string; leads: number; contacts: number; activeDossiers: number; totalDossiers: number; revenue: number };
    bugReports: any[];
    timestamp: string;
}

export default function HubDashboardPage() {
    const [view, setView] = useState<View>('admin');
    const [device, setDevice] = useState<Device>('desktop');

    // Health data
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    // Analysis
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Bugs
    const [bugFilter, setBugFilter] = useState<'all' | 'critical' | 'open'>('all');

    // Config (Builder)
    const [config, setConfig] = useState<HubConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const configRef = useRef<HubConfig | null>(null);

    // Voice
    const voice = useHubVoice();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Keep configRef in sync
    useEffect(() => { configRef.current = config; }, [config]);

    // Auto-scroll transcript
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [voice.transcript]);

    // Fetch health data
    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try { const res = await fetch('/api/hub/health'); setHealth(await res.json()); } catch { setHealth(null); }
        setLoading(false);
    }, []);

    // Fetch hub config
    const fetchConfig = useCallback(async () => {
        setConfigLoading(true);
        try {
            const res = await fetchWithAuth('/api/hub/config');
            const data = await res.json();
            setConfig(data);
        } catch { console.error('Failed to load hub config'); }
        setConfigLoading(false);
    }, []);

    useEffect(() => { fetchHealth(); fetchConfig(); }, [fetchHealth, fetchConfig]);

    // Run AI analysis
    const runAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await fetchWithAuth('/api/hub/analysis', { method: 'POST' });
            const d = await res.json();
            setAnalysis(d.analysis || 'Analyse indisponible.');
        } catch { setAnalysis('Erreur lors de l\'analyse.'); }
        setAnalyzing(false);
    };

    // Save hub config (manual)
    const saveConfig = useCallback(async () => {
        const cfg = configRef.current;
        if (!cfg) return;
        setSaving(true); setSaved(false);
        try {
            await fetchWithAuth('/api/hub/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfg),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) { console.error('Save error:', e); }
        setSaving(false);
    }, []);

    // Auto-save (debounced 3s) on config change
    useEffect(() => {
        if (!config || configLoading) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => { saveConfig(); }, 3000);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [config, configLoading, saveConfig]);

    // Filter bugs
    const filteredBugs = health?.bugReports?.filter((b: any) => {
        if (bugFilter === 'critical') return b.severity === 'critical';
        if (bugFilter === 'open') return b.status === 'open';
        return true;
    }) || [];

    const devices: { id: Device; icon: any }[] = [
        { id: 'desktop', icon: Monitor }, { id: 'tablet', icon: Tablet }, { id: 'mobile', icon: Smartphone },
    ];

    return (
        <div className="mx-auto max-w-[1480px] space-y-5">
            <style>{`
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(18px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes pulseGlow { 0%, 100% { box-shadow: 0 14px 32px rgba(60,80,70,0.10); } 50% { box-shadow: 0 22px 40px rgba(25,195,125,0.16); } }
                @keyframes softFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                @keyframes blinkDot { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
            `}</style>

            {/* ═══ HEADER ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-white/50 bg-white/18 px-6 py-5 shadow-[0_12px_28px_rgba(60,80,70,0.12)] backdrop-blur-xl animate-[fadeUp_.7s_cubic-bezier(0.22,1,0.36,1)]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-white/24 p-1 ring-1 ring-white/60">
                        <button onClick={() => setView('builder')}
                            className="rounded-full px-3 py-1.5 text-[11px] font-mono transition-all"
                            style={{ backgroundColor: view === 'builder' ? GREEN : 'transparent', color: view === 'builder' ? 'white' : '#5f6672' }}>
                            Builder
                        </button>
                        <button onClick={() => setView('admin')}
                            className="rounded-full px-3 py-1.5 text-[11px] font-mono transition-all"
                            style={{ backgroundColor: view === 'admin' ? CYAN : 'transparent', color: view === 'admin' ? 'white' : '#5f6672' }}>
                            Admin
                        </button>
                        <button onClick={() => setView('voice')}
                            className="rounded-full px-3 py-1.5 text-[11px] font-mono transition-all"
                            style={{ backgroundColor: view === 'voice' ? LIME : 'transparent', color: view === 'voice' ? '#3f4a35' : '#5f6672' }}>
                            AI Voice
                        </button>
                    </div>

                    <div className="hidden items-center gap-4 md:flex">
                        <div className="h-4 w-36 rounded-full bg-white/55" />
                        <div className="h-4 w-14 rounded-full bg-white/40" />
                        <div className="h-4 w-24 rounded-full bg-white/34" />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-600">
                    <button onClick={() => { fetchHealth(); fetchConfig(); }} className="p-1 hover:text-zinc-900 transition">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <Search className="h-5 w-5" />
                    <Bell className="h-4 w-4" />
                    <Undo2 className="h-4 w-4" />
                    <div className="mx-1 h-5 w-px bg-white/50" />

                    {view === 'builder' && (
                        <div className="flex items-center gap-1 rounded-full bg-white/24 p-1 ring-1 ring-white/60">
                            {devices.map(({ id, icon: Icon }) => (
                                <button key={id} onClick={() => setDevice(id)} className="rounded-full px-2.5 py-1.5 transition-all"
                                    style={{ backgroundColor: device === id ? GREEN : 'transparent', color: device === id ? 'white' : '#5f6672' }}>
                                    <Icon className="h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    )}

                    <button onClick={runAnalysis} disabled={analyzing}
                        className="rounded-[14px] px-4 py-2 text-[12px] font-mono text-zinc-900 transition-all disabled:opacity-50"
                        style={{ backgroundColor: AMBER }}>
                        {analyzing ? 'Analyse…' : 'Analyse IA'}
                    </button>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: CYAN }}>
                        <User className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* ═══ VIEW CONTENT ═══ */}
            {view === 'builder' && (
                configLoading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <Loader2 size={28} className="animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <BuilderView config={config} setConfig={setConfig} saveConfig={saveConfig} saving={saving} saved={saved} />
                )
            )}
            {view === 'admin' && (
                <AdminView health={health} loading={loading} analysis={analysis} setAnalysis={setAnalysis}
                    bugFilter={bugFilter} setBugFilter={setBugFilter} filteredBugs={filteredBugs}
                    runAnalysis={runAnalysis} analyzing={analyzing} refreshHealth={fetchHealth} />
            )}
            {view === 'voice' && <VoiceView voice={voice} scrollRef={scrollRef} />}
        </div>
    );
}
