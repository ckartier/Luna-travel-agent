'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Power, Clock, MessageSquare, Check, AlertTriangle, Globe } from 'lucide-react';

// World map SVG paths (simplified continents)
const CONTINENTS = [
    // North America
    'M 55 115 L 75 105 L 95 100 L 115 90 L 135 85 L 150 80 L 155 95 L 165 105 L 175 120 L 180 135 L 170 145 L 155 150 L 140 148 L 130 152 L 120 158 L 108 160 L 100 155 L 90 152 L 80 148 L 70 140 L 60 130 Z',
    // South America
    'M 140 175 L 155 170 L 165 178 L 170 195 L 175 215 L 172 235 L 168 255 L 160 270 L 150 278 L 142 272 L 138 258 L 135 240 L 132 220 L 130 200 L 135 185 Z',
    // Europe
    'M 245 80 L 260 75 L 275 80 L 285 85 L 290 95 L 288 105 L 280 110 L 270 112 L 260 110 L 250 105 L 245 95 Z',
    // Africa
    'M 250 120 L 265 115 L 280 118 L 295 125 L 300 140 L 305 160 L 302 180 L 295 200 L 285 215 L 275 220 L 265 215 L 255 200 L 248 180 L 245 160 L 242 140 Z',
    // Asia
    'M 290 70 L 310 60 L 340 55 L 370 58 L 395 65 L 410 75 L 415 90 L 410 105 L 400 115 L 385 120 L 365 118 L 345 115 L 320 110 L 300 105 L 290 95 Z',
    // Oceania
    'M 380 185 L 400 180 L 420 185 L 430 195 L 425 210 L 415 218 L 400 220 L 385 215 L 378 200 Z',
];

// Animated flight routes
const ROUTES = [
    { from: { x: 100, y: 130 }, to: { x: 265, y: 95 }, color: '#8b5cf6' },
    { from: { x: 265, y: 95 }, to: { x: 350, y: 85 }, color: '#3b82f6' },
    { from: { x: 350, y: 85 }, to: { x: 400, y: 195 }, color: '#06b6d4' },
    { from: { x: 155, y: 145 }, to: { x: 275, y: 165 }, color: '#f59e0b' },
    { from: { x: 265, y: 95 }, to: { x: 100, y: 130 }, color: '#ec4899' },
    { from: { x: 350, y: 85 }, to: { x: 155, y: 220 }, color: '#22c55e' },
];

function generateArc(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dist = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    return `M ${from.x} ${from.y} Q ${midX} ${midY - dist * 0.25} ${to.x} ${to.y}`;
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
        fetch('/api/admin/maintenance').then(r => r.json()).then(data => {
            setEnabled(!!data.enabled);
            setMessage(data.message || 'Luna est en maintenance programmée. Nous revenons très bientôt.');
            setPlannedEnd(data.plannedEnd || '');
            setLoading(false);
        });
    }, []);

    const save = async () => {
        setSaving(true);
        await fetch('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, message, plannedEnd }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Shield size={24} className="text-violet-400" />
                        Mode Maintenance
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Activez le mode maintenance pour bloquer l'accès à la plateforme</p>
                </div>
                <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                    {saved ? <><Check size={16} /> Sauvegardé</> : saving ? '...' : 'Sauvegarder'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-5">
                    {/* Toggle */}
                    <div className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${enabled ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                                    <Power size={22} className={enabled ? 'text-red-400' : 'text-emerald-400'} />
                                </div>
                                <div>
                                    <p className="font-semibold">Statut de la maintenance</p>
                                    <p className="text-sm text-white/40 mt-0.5">
                                        {enabled ? 'La plateforme est actuellement hors ligne' : 'La plateforme est en ligne'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setEnabled(!enabled)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-red-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${enabled ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold mb-3">
                            <MessageSquare size={12} /> Message de maintenance
                        </label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                            className="w-full bg-[#0f0f14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none" />
                    </div>

                    {/* Planned end */}
                    <div className="bg-[#1a1a24] rounded-2xl border border-white/5 p-6">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/40 font-bold mb-3">
                            <Clock size={12} /> Fin prévue
                        </label>
                        <input type="datetime-local" value={plannedEnd} onChange={e => setPlannedEnd(e.target.value)}
                            className="w-full bg-[#0f0f14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                    </div>
                </div>

                {/* Live preview with world map */}
                <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">
                        Aperçu en direct
                    </div>
                    <div className="relative h-[420px] bg-gradient-to-br from-[#0a0a12] to-[#12121c] flex items-center justify-center overflow-hidden">
                        {/* Animated world map */}
                        {mounted && (
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.06" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
                                    </linearGradient>
                                    <filter id="glow2">
                                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>

                                {/* Grid */}
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <line key={`h${i}`} x1="0" y1={i * 25} x2="480" y2={i * 25} stroke="white" strokeOpacity="0.03" strokeWidth="0.5" />
                                ))}
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="300" stroke="white" strokeOpacity="0.03" strokeWidth="0.5" />
                                ))}

                                {/* Continents */}
                                {CONTINENTS.map((path, i) => (
                                    <path key={i} d={path} fill="url(#mapGrad)" stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
                                ))}

                                {/* Flight routes */}
                                {ROUTES.map((route, i) => (
                                    <g key={i}>
                                        <path d={generateArc(route.from, route.to)} fill="none" stroke={route.color} strokeWidth="0.8" strokeOpacity="0.15" />
                                        <path d={generateArc(route.from, route.to)} fill="none" stroke={route.color} strokeWidth="1.2"
                                            strokeDasharray="6 14" strokeLinecap="round" filter="url(#glow2)"
                                            style={{ animation: `arcFlow ${3 + i * 0.8}s linear infinite` }} />
                                        {/* Origin dot */}
                                        <circle cx={route.from.x} cy={route.from.y} r="2" fill={route.color} fillOpacity="0.6" />
                                        {/* Destination dot */}
                                        <circle cx={route.to.x} cy={route.to.y} r="1.5" fill={route.color} fillOpacity="0.4" />
                                    </g>
                                ))}

                                {/* Animated pulse dots on cities */}
                                {[{ x: 100, y: 130 }, { x: 265, y: 95 }, { x: 350, y: 85 }, { x: 400, y: 195 }, { x: 275, y: 165 }].map((c, i) => (
                                    <circle key={i} cx={c.x} cy={c.y} r="4" fill="none" stroke="#8b5cf6" strokeWidth="0.5"
                                        style={{ animation: `airportPulse ${2 + i * 0.5}s ease-out infinite`, transformOrigin: `${c.x}px ${c.y}px` }} />
                                ))}
                            </svg>
                        )}

                        {/* Maintenance overlay content */}
                        <div className="relative z-10 text-center px-8">
                            {enabled ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/20 flex items-center justify-center">
                                        <AlertTriangle size={28} className="text-amber-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Maintenance en cours</h2>
                                    <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">{message}</p>
                                    {plannedEnd && (
                                        <p className="mt-3 text-[11px] text-violet-400 font-medium">
                                            Retour prévu : {new Date(plannedEnd).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/20 flex items-center justify-center">
                                        <Globe size={28} className="text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Plateforme en ligne</h2>
                                    <p className="text-white/40 text-sm">Tout fonctionne normalement</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
