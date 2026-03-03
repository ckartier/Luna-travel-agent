'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LunaLogo } from '../components/LunaLogo';
import { ArrowRight, Globe, Shield, Sparkles } from 'lucide-react';

// Animated flight routes for the background
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
    const curveOffset = dist * 0.2;
    const cpX = midX;
    const cpY = midY - curveOffset;
    return `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => { router.push('/'); }, 800);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex">

            {/* Left: Animated Map Background */}
            <div className="hidden lg:flex w-1/2 bg-[#0f1420] relative flex-col justify-between p-12 overflow-hidden">

                {/* Animated world map SVG background */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* Glowing dots for cities */}
                    {mounted && (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                {FLIGHT_ROUTES.map((route, i) => (
                                    <linearGradient key={`grad-${i}`} id={`routeGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={route.color} stopOpacity="0.1" />
                                        <stop offset="50%" stopColor={route.color} stopOpacity="0.8" />
                                        <stop offset="100%" stopColor={route.color} stopOpacity="0.1" />
                                    </linearGradient>
                                ))}
                                <filter id="loginGlow">
                                    <feGaussianBlur stdDeviation="0.3" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>

                            {/* Flight route arcs */}
                            {FLIGHT_ROUTES.map((route, i) => {
                                const path = generateArcPath(route.from, route.to);
                                return (
                                    <g key={i}>
                                        {/* Static dim line */}
                                        <path d={path} fill="none" stroke={route.color} strokeWidth="0.15" strokeOpacity="0.2" strokeLinecap="round" />
                                        {/* Animated flowing line */}
                                        <path d={path} fill="none" stroke={route.color} strokeWidth="0.25" strokeLinecap="round"
                                            filter="url(#loginGlow)"
                                            strokeDasharray="8 92"
                                            style={{ animation: `loginRoutePulse ${4 + i * 0.5}s linear infinite`, animationDelay: `${i * 0.6}s` }}
                                            strokeOpacity="0.7" />
                                        {/* Departure dot */}
                                        <circle cx={route.from.x} cy={route.from.y} r="0.4" fill={route.color} opacity="0.6">
                                            <animate attributeName="r" values="0.3;0.6;0.3" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                        </circle>
                                        {/* Arrival dot */}
                                        <circle cx={route.to.x} cy={route.to.y} r="0.3" fill={route.color} opacity="0.4" />
                                        {/* Flight label */}
                                        <text x={(route.from.x + route.to.x) / 2} y={(route.from.y + route.to.y) / 2 - 2}
                                            fill={route.color} fontSize="1.2" fontFamily="sans-serif" fontWeight="600" textAnchor="middle" opacity="0.5">
                                            {route.label}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Plane icons on routes */}
                            {FLIGHT_ROUTES.map((route, i) => {
                                const path = generateArcPath(route.from, route.to);
                                const pathId = `loginPath-${i}`;
                                return (
                                    <g key={`plane-${i}`}>
                                        <path id={pathId} d={path} fill="none" stroke="none" />
                                        <text fill={route.color} fontSize="1.8" opacity="0.7">
                                            <textPath href={`#${pathId}`} startOffset="0%">
                                                <animate attributeName="startOffset" from="0%" to="100%" dur={`${6 + i * 0.8}s`} repeatCount="indefinite" />
                                                ✈
                                            </textPath>
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    )}

                    {/* Soft glows */}
                    <div className="absolute top-20 right-20 w-60 h-60 bg-sky-500/5 rounded-full blur-[80px]" />
                    <div className="absolute bottom-40 left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px]" />
                    <div className="absolute top-60 left-40 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px]" />
                </div>

                {/* Animation CSS */}
                <style jsx>{`
                    @keyframes loginRoutePulse {
                        0% { stroke-dashoffset: 100; }
                        100% { stroke-dashoffset: 0; }
                    }
                `}</style>

                {/* Content overlay */}
                <div className="relative z-10 flex items-center gap-3">
                    <LunaLogo size={40} variant="light" />
                    <span className="font-serif text-3xl font-semibold text-white/90 tracking-tight">Luna</span>
                </div>

                <div className="relative z-10 max-w-md">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="font-serif text-5xl font-semibold text-white leading-tight mb-6">
                        Votre Concierge<br />Voyage <span className="text-sky-400">Intelligent</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-white/40 text-base leading-relaxed mb-10">
                        Orchestrez vos voyages sur-mesure grâce à nos agents IA spécialisés. Transport, hébergement, itinéraire — tout est automatisé.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="flex flex-col gap-4">
                        {[
                            { icon: Globe, text: 'Suivi des vols en temps réel mondial' },
                            { icon: Sparkles, text: '4 agents IA spécialisés travaillent simultanément' },
                            { icon: Shield, text: 'CRM intégré avec gestion complète des clients' },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <feature.icon size={14} className="text-sky-400" />
                                </div>
                                <span className="text-white/50 text-sm">{feature.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/15 text-xs uppercase tracking-wider">Luna Travel Platform v2.0</p>
                </div>
            </div>

            {/* Right: Login form */}
            <div className="flex-1 flex items-center justify-center bg-luna-bg p-8">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                    className="w-full max-w-sm">

                    <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
                        <LunaLogo size={36} />
                        <span className="font-serif text-2xl font-semibold text-luna-charcoal">Luna</span>
                    </div>

                    <h2 className="font-serif text-3xl font-semibold text-luna-charcoal mb-2">Connexion</h2>
                    <p className="text-luna-text-muted text-sm mb-8">Accédez à votre espace concierge voyage</p>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-2">Email</label>
                            <input type="email" placeholder="votre@email.com"
                                className="w-full py-3 px-4 bg-white rounded-xl border border-luna-warm-gray/20 text-luna-charcoal text-sm focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 transition-all"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted block mb-2">Mot de passe</label>
                            <input type="password" placeholder="••••••••"
                                className="w-full py-3 px-4 bg-white rounded-xl border border-luna-warm-gray/20 text-luna-charcoal text-sm focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 transition-all"
                                value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-luna-warm-gray/30 accent-sky-500" />
                                <span className="text-xs text-luna-text-muted">Se souvenir de moi</span>
                            </label>
                            <button type="button" className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors">
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-white font-medium text-sm tracking-wider uppercase rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60">
                            {isLoading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <>Connexion <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-luna-text-muted mt-8">
                        Pas encore de compte ? <button className="text-sky-500 hover:text-sky-600 font-semibold transition-colors">Demander un accès</button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
