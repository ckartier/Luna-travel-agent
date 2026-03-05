'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Power, Clock, MessageSquare, Check, AlertTriangle, Globe, Plane, Wifi, WifiOff } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

// ═══ ANIMATED FLIGHT ROUTES (same as app) ═══
const FLIGHT_ROUTES = [
    { from: { x: 30, y: 28 }, to: { x: 72, y: 35 }, color: '#3b82f6', label: 'AF1234' },
    { from: { x: 75, y: 32 }, to: { x: 22, y: 45 }, color: '#8b5cf6', label: 'AA100' },
    { from: { x: 50, y: 20 }, to: { x: 85, y: 55 }, color: '#f59e0b', label: 'SQ308' },
    { from: { x: 15, y: 60 }, to: { x: 55, y: 25 }, color: '#22c55e', label: 'LA800' },
    { from: { x: 80, y: 25 }, to: { x: 88, y: 65 }, color: '#dc2626', label: 'QF1' },
    { from: { x: 60, y: 30 }, to: { x: 40, y: 50 }, color: '#06b6d4', label: 'ET700' },
    { from: { x: 45, y: 40 }, to: { x: 90, y: 35 }, color: '#ec4899', label: 'EK001' },
    { from: { x: 25, y: 35 }, to: { x: 60, y: 55 }, color: '#6366f1', label: 'BA2049' },
];

function generateArcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dist = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const cpX = midX;
    const cpY = midY - dist * 0.2;
    return `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
}

export default function AdminMaintenancePage() {
    const [enabled, setEnabled] = useState(false);
    const [message, setMessage] = useState('Luna est en maintenance programmée. Nous revenons très bientôt.');
    const [plannedEnd, setPlannedEnd] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        fetchWithAuth('/api/admin/maintenance').then(r => r.json()).then(data => {
            setEnabled(!!data.enabled);
            if (data.message) setMessage(data.message);
            if (data.plannedEnd) setPlannedEnd(data.plannedEnd);
            setLoading(false);
        });
    }, []);

    const save = async () => {
        setSaving(true);
        await fetchWithAuth('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, message, plannedEnd }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-white/10 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
            {/* ═══ ANIMATED WORLD MAP BACKGROUND (same as app) ═══ */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
                {/* Glow orbs */}
                <div className="absolute top-10 right-20 w-96 h-96 bg-sky-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-violet-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[50%] w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />

                {/* SVG animated flight routes */}
                {mounted && (
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <filter id="maintGlow"><feGaussianBlur stdDeviation="0.3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        {FLIGHT_ROUTES.map((route, i) => {
                            const path = generateArcPath(route.from, route.to);
                            const pathId = `maint-${i}`;
                            return (
                                <g key={i}>
                                    {/* Static arc trail */}
                                    <path d={path} fill="none" stroke={route.color} strokeWidth="0.1" strokeOpacity="0.12" strokeLinecap="round" />
                                    {/* Animated dash */}
                                    <path d={path} fill="none" stroke={route.color} strokeWidth="0.18" strokeLinecap="round" filter="url(#maintGlow)"
                                        strokeDasharray="6 94" style={{ animation: `maintArc ${4 + i * 0.5}s linear infinite`, animationDelay: `${i * 0.6}s` }} strokeOpacity="0.3" />
                                    {/* Origin pulsing dot */}
                                    <circle cx={route.from.x} cy={route.from.y} r="0.25" fill={route.color} opacity="0.2">
                                        <animate attributeName="r" values="0.15;0.4;0.15" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                    </circle>
                                    {/* Destination dot */}
                                    <circle cx={route.to.x} cy={route.to.y} r="0.15" fill={route.color} opacity="0.15" />
                                    {/* Hidden motion path */}
                                    <path id={pathId} d={path} fill="none" stroke="none" />
                                    {/* Glowing moving dot (plane) */}
                                    <circle r="0.5" fill={route.color} opacity="0.6" filter="url(#maintGlow)">
                                        <animateMotion dur={`${7 + i * 0.8}s`} repeatCount="indefinite">
                                            <mpath href={`#${pathId}`} />
                                        </animateMotion>
                                    </circle>
                                    {/* White core of moving dot */}
                                    <circle r="0.2" fill="#fff" opacity="0.8">
                                        <animateMotion dur={`${7 + i * 0.8}s`} repeatCount="indefinite">
                                            <mpath href={`#${pathId}`} />
                                        </animateMotion>
                                    </circle>
                                </g>
                            );
                        })}
                    </svg>
                )}
                <style jsx>{`@keyframes maintArc { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }`}</style>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="relative z-10 max-w-5xl mx-auto p-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                            <Shield size={24} className="text-violet-400" />
                            Mode Maintenance
                        </h1>
                        <p className="text-white/40 text-sm font-light mt-1">Contrôlez l'accès à la plateforme Luna Travel</p>
                    </div>
                    <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
                        {saved ? <><Check size={16} /> Sauvegardé !</> : saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* ═══ LEFT — Controls (2 cols) ═══ */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Status toggle card */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${enabled
                                        ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20'
                                        : 'bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/20'
                                        }`}>
                                        {enabled ? <WifiOff size={20} className="text-red-400" /> : <Wifi size={20} className="text-emerald-400" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">Maintenance</p>
                                        <p className="text-[11px] text-white/30 mt-0.5">
                                            {enabled ? 'Plateforme hors ligne' : 'Plateforme en ligne'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setEnabled(!enabled)}
                                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${enabled ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10'}`}>
                                    <motion.div layout className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg ${enabled ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {/* Status indicator */}
                            <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all ${enabled
                                ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                                {enabled ? 'Maintenance active' : 'Système opérationnel'}
                            </div>
                        </motion.div>

                        {/* Message card */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-6 shadow-lg">
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold mb-3">
                                <MessageSquare size={12} /> Message affiché
                            </label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 resize-none transition-colors" />
                        </motion.div>

                        {/* Planned end card */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-6 shadow-lg">
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold mb-3">
                                <Clock size={12} /> Retour prévu
                            </label>
                            <input type="datetime-local" value={plannedEnd} onChange={e => setPlannedEnd(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/30 transition-colors" />
                        </motion.div>
                    </div>

                    {/* ═══ RIGHT — Live Preview (3 cols) ═══ */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-3 backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl overflow-hidden shadow-lg">

                        {/* Preview header */}
                        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                            </div>
                            <span className="text-[10px] text-white/20 font-mono">luna-travel.web.app</span>
                        </div>

                        {/* Preview body with map */}
                        <div className="relative h-[420px] bg-gradient-to-br from-[#0a0a14] via-[#0d0d1a] to-[#0f0f18] flex items-center justify-center overflow-hidden">
                            {/* Background map in preview */}
                            {mounted && (
                                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
                                    <defs>
                                        <filter id="prevGlow"><feGaussianBlur stdDeviation="0.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                    </defs>
                                    {FLIGHT_ROUTES.map((route, i) => {
                                        const path = generateArcPath(route.from, route.to);
                                        const pid = `prev-${i}`;
                                        return (
                                            <g key={i}>
                                                <path d={path} fill="none" stroke={route.color} strokeWidth="0.08" strokeOpacity="0.15" />
                                                <path d={path} fill="none" stroke={route.color} strokeWidth="0.15" filter="url(#prevGlow)"
                                                    strokeDasharray="4 96" style={{ animation: `maintArc ${5 + i * 0.6}s linear infinite`, animationDelay: `${i * 0.8}s` }} strokeOpacity="0.4" />
                                                <circle cx={route.from.x} cy={route.from.y} r="0.3" fill={route.color} opacity="0.25">
                                                    <animate attributeName="r" values="0.2;0.5;0.2" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
                                                    <animate attributeName="opacity" values="0.15;0.3;0.15" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
                                                </circle>
                                                <circle cx={route.to.x} cy={route.to.y} r="0.2" fill={route.color} opacity="0.15" />
                                                <path id={pid} d={path} fill="none" stroke="none" />
                                                <circle r="0.6" fill={route.color} opacity="0.7" filter="url(#prevGlow)">
                                                    <animateMotion dur={`${8 + i}s`} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
                                                </circle>
                                                <circle r="0.22" fill="#fff" opacity="0.9">
                                                    <animateMotion dur={`${8 + i}s`} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
                                                </circle>
                                            </g>
                                        );
                                    })}
                                </svg>
                            )}

                            {/* Overlay content */}
                            <div className="relative z-10 text-center px-8">
                                <AnimatePresence mode="wait">
                                    {enabled ? (
                                        <motion.div key="maint" initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                                            {/* Animated warning icon */}
                                            <div className="relative w-20 h-20 mx-auto mb-5">
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-red-500/10 rounded-3xl animate-pulse" />
                                                <div className="relative w-full h-full rounded-3xl border border-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                                                    <AlertTriangle size={32} className="text-amber-400" />
                                                </div>
                                            </div>
                                            <h2 className="text-2xl font-serif font-bold text-white mb-3 tracking-tight">Maintenance en cours</h2>
                                            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed font-light">{message}</p>
                                            {plannedEnd && (
                                                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-500/10 border border-violet-500/15">
                                                    <Clock size={13} className="text-violet-400" />
                                                    <span className="text-[12px] text-violet-300 font-medium">
                                                        Retour prévu : {new Date(plannedEnd).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div key="online" initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                                            <div className="relative w-20 h-20 mx-auto mb-5">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-sky-500/10 rounded-3xl" />
                                                <div className="relative w-full h-full rounded-3xl border border-emerald-500/15 flex items-center justify-center backdrop-blur-sm">
                                                    <Globe size={32} className="text-emerald-400" />
                                                </div>
                                            </div>
                                            <h2 className="text-2xl font-serif font-bold text-white mb-3 tracking-tight">Plateforme en ligne</h2>
                                            <p className="text-white/40 text-sm font-light">Tous les systèmes sont opérationnels</p>
                                            <div className="mt-5 flex items-center justify-center gap-4">
                                                {[
                                                    { label: 'API', color: 'emerald' },
                                                    { label: 'Auth', color: 'sky' },
                                                    { label: 'DB', color: 'violet' },
                                                ].map(s => (
                                                    <div key={s.label} className={`flex items-center gap-1.5 text-[11px] font-medium text-${s.color}-400`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-${s.color}-400`} />
                                                        {s.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
