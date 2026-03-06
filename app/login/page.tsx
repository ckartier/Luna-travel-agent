'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LunaLogo } from '../components/LunaLogo';
import { ArrowRight, Globe, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Flight routes data
const FLIGHT_ROUTES = [
    { from: { x: 30, y: 28 }, to: { x: 72, y: 35 }, color: '#3b82f6', label: 'AF1234' },
    { from: { x: 75, y: 32 }, to: { x: 22, y: 45 }, color: '#8b5cf6', label: 'AA100' },
    { from: { x: 50, y: 20 }, to: { x: 85, y: 55 }, color: '#f59e0b', label: 'SQ308' },
    { from: { x: 15, y: 60 }, to: { x: 55, y: 25 }, color: '#22c55e', label: 'LA800' },
    { from: { x: 80, y: 25 }, to: { x: 88, y: 65 }, color: '#dc2626', label: 'QF1' },
    { from: { x: 60, y: 30 }, to: { x: 40, y: 50 }, color: '#06b6d4', label: 'ET700' },
];

function generateArcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dist = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    return `M ${from.x} ${from.y} Q ${midX} ${midY - dist * 0.2} ${to.x} ${to.y}`;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { user, login, loginWithGoogle } = useAuth();
    const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // Callback ref — Mapbox initializes as soon as the DOM node is mounted
    const mapContainerCallback = useCallback((node: HTMLDivElement | null) => {
        if (!node || mapInstanceRef.current) return;
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: node,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [20, 35],
            zoom: 2.5,
            projection: 'globe',
            attributionControl: false,
            interactive: false,
        });

        map.on('style.load', () => {
            map.setFog({
                color: 'rgb(232,228,220)',
                'high-color': 'rgb(210,215,225)',
                'horizon-blend': 0.04,
                'space-color': 'rgb(232,228,220)' as any,
                'star-intensity': 0,
            });
            // Hide controls
            const ctrls = node.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-group');
            ctrls.forEach(el => (el as HTMLElement).style.display = 'none');
        });

        let d = 0;
        const drift = () => {
            d += 0.001;
            if (!map.isMoving()) map.setCenter([20 + Math.sin(d) * 3, 35 + Math.cos(d * 0.7) * 1.5]);
            requestAnimationFrame(drift);
        };
        requestAnimationFrame(drift);
        mapInstanceRef.current = map;
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const result = await login(email, password);
        if (result.error) { setError(result.error); setIsLoading(false); }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        const result = await loginWithGoogle();
        if (result.error) { setError(result.error); setIsLoading(false); }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex">

            {/* Left: Map + Animated SVG */}
            <div className="hidden lg:flex w-1/2 bg-[#e8e4dc] relative flex-col justify-between p-12 overflow-hidden">

                {/* Mapbox Map Background */}
                <div ref={mapContainerCallback} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

                {/* Warm overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#e8e4dc] via-[#e8e4dc]/70 to-[#e8e4dc]/50 z-[1]" />

                {/* SVG flight route overlay — uses xMidYMid slice to keep circles round */}
                {mounted && (
                    <div className="absolute inset-0 pointer-events-none z-[2]">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
                            <defs>
                                <filter id="loginGlow">
                                    <feGaussianBlur stdDeviation="0.5" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>

                            {FLIGHT_ROUTES.map((route, i) => {
                                const path = generateArcPath(route.from, route.to);
                                const pathId = `lp-${i}`;
                                return (
                                    <g key={i}>
                                        {/* Static dim arc */}
                                        <path d={path} fill="none" stroke={route.color} strokeWidth="0.12" strokeOpacity="0.15" strokeLinecap="round" />
                                        {/* Animated pulse */}
                                        <path d={path} fill="none" stroke={route.color} strokeWidth="0.2" strokeLinecap="round"
                                            filter="url(#loginGlow)"
                                            strokeDasharray="6 94"
                                            style={{ animation: `lrp ${4 + i * 0.5}s linear infinite`, animationDelay: `${i * 0.6}s` }}
                                            strokeOpacity="0.6" />
                                        {/* Departure dot */}
                                        <circle cx={route.from.x} cy={route.from.y} r="0.5" fill={route.color} opacity="0.5">
                                            <animate attributeName="r" values="0.35;0.65;0.35" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                        </circle>
                                        {/* Arrival dot */}
                                        <circle cx={route.to.x} cy={route.to.y} r="0.35" fill={route.color} opacity="0.3" />
                                        {/* Flight label */}
                                        <text x={(route.from.x + route.to.x) / 2} y={(route.from.y + route.to.y) / 2 - 2}
                                            fill={route.color} fontSize="1.1" fontFamily="system-ui" fontWeight="600" textAnchor="middle" opacity="0.4">
                                            {route.label}
                                        </text>
                                        {/* Moving luminous dot — proper circle, not deformed */}
                                        <path id={pathId} d={path} fill="none" stroke="none" />
                                        <circle r="0.6" fill={route.color} opacity="0.8" filter="url(#loginGlow)">
                                            <animateMotion dur={`${6 + i * 0.8}s`} repeatCount="indefinite">
                                                <mpath href={`#${pathId}`} />
                                            </animateMotion>
                                        </circle>
                                        <circle r="0.25" fill="#fff" opacity="0.95">
                                            <animateMotion dur={`${6 + i * 0.8}s`} repeatCount="indefinite">
                                                <mpath href={`#${pathId}`} />
                                            </animateMotion>
                                        </circle>
                                    </g>
                                );
                            })}
                        </svg>
                        <style jsx>{`@keyframes lrp { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }`}</style>
                    </div>
                )}

                {/* Content overlay */}
                <div className="relative z-10 flex items-center gap-3">
                    <LunaLogo size={36} />
                </div>

                <div className="relative z-10 max-w-md">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="font-serif text-[3.2rem] font-bold text-[#1a1a2e] leading-[1.15] mb-6" style={{ textShadow: '0 2px 12px rgba(232,228,220,0.9)' }}>
                        Votre Concierge<br />Voyage <span className="text-sky-500">Intelligent</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-[#3a3a4a] text-lg leading-relaxed mb-10 font-medium" style={{ textShadow: '0 1px 6px rgba(232,228,220,0.8)' }}>
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
                                <div className="w-9 h-9 rounded-xl bg-white/90 border border-luna-warm-gray/15 flex items-center justify-center shadow-sm">
                                    <feature.icon size={16} className="text-sky-500" />
                                </div>
                                <span className="text-[#2a2a3a] text-[15px] font-medium" style={{ textShadow: '0 1px 4px rgba(232,228,220,0.8)' }}>{feature.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="relative z-10">
                    <p className="text-[#1a1a2e]/30 text-xs uppercase tracking-wider font-semibold">Luna Travel Platform v2.0</p>
                </div>
            </div>

            {/* Right: Login form */}
            <div className="flex-1 flex items-center justify-center bg-[#e8e4dc] p-8">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                    className="w-full max-w-sm">

                    <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
                        <LunaLogo size={30} />
                    </div>

                    <h2 className="font-serif text-3xl font-semibold text-luna-charcoal mb-2">Connexion</h2>
                    <p className="text-luna-text-muted text-sm mb-8">Accédez à votre espace concierge voyage</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5">
                            <AlertCircle size={16} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-sm">{error}</p>
                        </motion.div>
                    )}

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
                            className="w-full py-3.5 btn-primary font-medium text-sm tracking-wider uppercase rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60">
                            {isLoading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <>Connexion <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    {/* Separator */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-luna-warm-gray/20" />
                        <span className="text-[10px] uppercase tracking-[0.15em] text-luna-text-muted font-semibold">ou continuer avec</span>
                        <div className="flex-1 h-px bg-luna-warm-gray/20" />
                    </div>

                    {/* Google Sign-In */}
                    <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
                        className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-luna-warm-gray/20 text-luna-charcoal font-medium text-sm rounded-xl shadow-sm transition-all hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    {/* Pricing mini summary */}
                    <div className="mt-6 pt-5 border-t border-luna-warm-gray/15">
                        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted mb-3 text-center">Nos formules B2B</p>
                        <div className="flex gap-2">
                            {[
                                { name: 'Starter', price: '99€', color: 'border-sky-200 bg-sky-50/50' },
                                { name: 'Pro', price: '249€', color: 'border-violet-200 bg-violet-50/50' },
                                { name: 'Enterprise', price: '499€', color: 'border-amber-200 bg-amber-50/50' },
                            ].map(p => (
                                <Link key={p.name} href="/pricing"
                                    className={`flex-1 text-center p-2 rounded-xl border ${p.color} hover:shadow-sm transition-all cursor-pointer`}>
                                    <p className="text-[10px] font-bold text-luna-charcoal">{p.name}</p>
                                    <p className="text-xs font-semibold text-luna-text-muted">{p.price}<span className="text-[9px]">/mois</span></p>
                                </Link>
                            ))}
                        </div>
                        <Link href="/pricing" className="block text-center text-xs text-sky-500 hover:text-sky-600 font-medium mt-3 transition-colors">
                            Voir tous les détails →
                        </Link>
                    </div>

                    <p className="text-center text-[10px] text-luna-text-muted mt-4">
                        En vous inscrivant, vous acceptez nos <Link href="/cgv" className="text-sky-500 hover:underline">Conditions Générales de Vente</Link>
                    </p>

                    <p className="text-center text-[10px] text-gray-400 mt-6">© 2026 Luna — Concierge Voyage</p>
                </motion.div>
            </div>
        </div>
    );
}
