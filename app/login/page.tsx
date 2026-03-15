'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LunaLogo } from '../components/LunaLogo';
import { ArrowRight, Globe, Shield, Sparkles, AlertCircle, Loader2, CheckCircle2, Scale, FileSearch, Briefcase } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { sendPasswordReset, setRememberMe } from '@/src/lib/firebase/auth';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';

/* ── Rotating 3D Globe (Mapbox) ── */
function RotatingGlobe() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || mapRef.current) return;
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        const initTimer = setTimeout(() => {
            mapboxgl.accessToken = token;
            const map = new mapboxgl.Map({
                container: node,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [20, 30],
                zoom: 2,
                projection: 'globe',
                attributionControl: false,
                interactive: false,
            });

            map.on('style.load', () => {
                map.setFog({
                    color: 'rgb(255,255,255)',
                    'high-color': 'rgb(255,255,255)',
                    'horizon-blend': 0.02,
                    'space-color': 'rgb(255,255,255)' as any,
                    'star-intensity': 0,
                });
                node.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-group')
                    .forEach(el => (el as HTMLElement).style.display = 'none');
            });

            // Continuous slow rotation
            let t = 0;
            const spin = () => {
                t += 0.003;
                map.setCenter([20 + t * 8, 30 + Math.sin(t) * 5]);
                animRef.current = requestAnimationFrame(spin);
            };
            map.on('load', () => {
                animRef.current = requestAnimationFrame(spin);
            });
            mapRef.current = map;
        }, 200);

        return () => {
            clearTimeout(initTimer);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [rememberMe, setRememberMeState] = useState(true);
    const [resetSent, setResetSent] = useState(false);
    const router = useRouter();
    const { user, login, loginWithGoogle, refreshProfile, loading: authLoading } = useAuth();

    // Detect legal vertical from URL
    const searchParams = useSearchParams();
    const isLegal = searchParams.get('vertical') === 'legal';

    useEffect(() => { setMounted(true); }, []);

    // Invitation handling
    useEffect(() => {
        const handleInvite = async () => {
            const params = new URLSearchParams(window.location.search);
            const inviteTenantId = params.get('inviteTenant');
            const role = params.get('role') || 'agent';

            if (user && inviteTenantId && user.email) {
                setIsJoining(true);
                const { joinTenant } = await import('@/src/lib/firebase/crm');
                try {
                    await joinTenant(user.uid, inviteTenantId, role, user.email, user.displayName || 'Invité');
                    await refreshProfile();
                    router.replace('/crm/settings');
                } catch (err) {
                    console.error('Failed to join tenant:', err);
                    setError('Impossible de rejoindre l\'équipe. Erreur: ' + (err instanceof Error ? err.message : String(err)));
                    setIsJoining(false);
                }
            }
        };

        if (user && !authLoading) {
            handleInvite();
        }
    }, [user, authLoading, router, refreshProfile]);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading && !window.location.search.includes('inviteTenant') && !isJoining) {
            router.replace('/welcome');
        }
    }, [user, authLoading, router, isJoining]);

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
        <div className="min-h-screen flex bg-white">

            {/* ═══ Left: Visual Panel (Vertical-aware) ═══ */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
                {isLegal ? (
                    /* ── Legal: Palais de Justice photo ── */
                    <>
                        <Image
                            src="/legal-login-bg.jpg"
                            alt="Palais de Justice"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 px-16 text-center max-w-[520px]"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                    <Scale size={32} className="text-white" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h1 className="text-[36px] md:text-[42px] text-white font-light leading-[1.1] tracking-tight mb-4">
                                Le Droit<br />
                                <span className="italic text-[#bcdeea]">Agent.</span>
                            </h1>
                            <p className="text-white/60 text-[14px] font-light leading-relaxed mb-10 max-w-sm mx-auto">
                                L&apos;intelligence artificielle au service du droit. Analysez, recherchez, gagnez.
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: Scale, text: 'Analyse de dossiers assistée par IA' },
                                    { icon: FileSearch, text: 'Recherche jurisprudence intelligente' },
                                    { icon: Briefcase, text: 'CRM juridique intégré & complet' },
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + i * 0.15 }}
                                        className="flex items-center gap-3 text-left"
                                    >
                                        <div className="w-8 h-8 rounded-[10px] bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                                            <feature.icon size={14} className="text-[#bcdeea]" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[12px] text-white/70">{feature.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                ) : (
                    /* ── Travel: Rotating 3D Globe only ── */
                    <RotatingGlobe />
                )}
            </div>

            {/* ═══ Right: Login form ═══ */}
            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-full max-w-[360px]"
                >
                    {/* Logo — conditional */}
                    <div className="flex items-center gap-2 mb-10">
                        {isLegal ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2E2E2E] flex items-center justify-center">
                                    <Scale size={20} className="text-white" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-[16px] font-light text-[#2E2E2E] tracking-tight leading-tight">Le Droit <span className="italic text-[#5a8fa3]">Agent</span></p>
                                    <p className="text-[9px] text-[#9CA3AF] uppercase tracking-[0.15em] font-medium">IA Juridique</p>
                                </div>
                            </div>
                        ) : (
                            <Link href="/" className="cursor-pointer">
                                <LunaLogo size={36} className="brightness-0" />
                            </Link>
                        )}
                    </div>

                    <h2 className="text-[24px] text-luna-charcoal tracking-tight mb-1">Connexion</h2>
                    <p className="text-luna-text-muted text-[13px] mb-7">{isLegal ? 'Accédez à votre espace Cabinet Juridique' : 'Accédez à votre espace concierge voyage'}</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-3 rounded-[12px] bg-red-50 border border-red-200 flex items-center gap-2.5">
                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-[13px]">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="text-label-sharp block mb-2">Email</label>
                            <input type="email" placeholder={isLegal ? 'avocat@cabinet.fr' : 'votre@email.com'}
                                className="input-underline w-full"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-label-sharp block mb-2">Mot de passe</label>
                            <input type="password" placeholder="••••••••"
                                className="input-underline w-full font-mono"
                                value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <div className="flex justify-between items-center mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-luna-primary"
                                    checked={rememberMe}
                                    onChange={(e) => {
                                        setRememberMeState(e.target.checked);
                                        setRememberMe(e.target.checked);
                                    }} />
                                <span className="text-[12px] text-luna-text-muted">Se souvenir de moi</span>
                            </label>
                            <button type="button" className="text-[12px] text-luna-primary-hover hover:text-luna-charcoal transition-colors cursor-pointer"
                                onClick={async () => {
                                    if (!email) { setError('Entrez votre email pour réinitialiser le mot de passe.'); return; }
                                    const result = await sendPasswordReset(email);
                                    if (result.error) { setError(result.error); }
                                    else { setResetSent(true); setError(null); }
                                }}>
                                Mot de passe oublié ?
                            </button>
                        </div>

                        {resetSent && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                <p className="text-emerald-700 text-[13px]">Un lien de réinitialisation a été envoyé à {email}</p>
                            </motion.div>
                        )}

                        <button type="submit" disabled={isLoading || isJoining}
                            className="w-full py-3 btn-primary text-[13px] uppercase tracking-[0.1em] rounded-[12px] flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer mt-2">
                            {isLoading || isJoining ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    {isJoining ? 'Validation...' : 'Connexion...'}
                                </span>
                            ) : (
                                <>Connexion <ArrowRight size={14} /></>
                            )}
                        </button>
                    </form>

                    {/* Separator */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-label-sharp">ou continuer avec</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Google */}
                    <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
                        className="w-full py-3 px-4 bg-white hover:bg-luna-warm-gray border border-gray-100 text-luna-charcoal text-[13px] rounded-[12px] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    {/* Pricing or Legal plans — conditional */}
                    {isLegal ? (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-label-sharp mb-3 text-center">Nos offres Cabinet</p>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Starter', price: '49€', desc: '1 avocat' },
                                    { name: 'Cabinet', price: '149€', desc: 'Jusqu\'à 5' },
                                    { name: 'Enterprise', price: 'Sur devis', desc: 'Illimité' },
                                ].map(p => (
                                    <div key={p.name}
                                        className="flex-1 text-center p-2 rounded-[10px] border border-gray-100 hover:border-[#5a8fa3]/40 transition-colors cursor-pointer">
                                        <p className="text-[11px] text-luna-charcoal font-medium">{p.name}</p>
                                        <p className="text-[11px] text-[#5a8fa3] font-semibold">{p.price}</p>
                                        <p className="text-[9px] text-[#9CA3AF]">{p.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-label-sharp mb-3 text-center">Nos formules B2B</p>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Site Builder', price: '29€' },
                                    { name: 'CRM Pro', price: '79€' },
                                    { name: 'All-in-One', price: '99€' },
                                ].map(p => (
                                    <Link key={p.name} href="/pricing"
                                        className="flex-1 text-center p-2 rounded-[10px] border border-gray-100 hover:border-luna-primary/40 transition-colors cursor-pointer">
                                        <p className="text-[11px] text-luna-charcoal">{p.name}</p>
                                        <p className="text-[11px] text-luna-text-muted">{p.price}<span className="text-[10px]">/mois</span></p>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/pricing" className="block text-center text-[11px] text-luna-primary-hover hover:text-luna-charcoal mt-3 transition-colors cursor-pointer">
                                Voir tous les détails →
                            </Link>
                        </div>
                    )}

                    <p className="text-center text-[13px] text-[#2E2E2E]/40 mt-5">
                        {isLegal
                            ? <>Pas encore de compte ? <span className="text-[#5a8fa3] font-medium cursor-pointer">Demander une démo →</span></>
                            : <>Pas encore de compte ? <Link href="/signup" className="text-[#5a8fa3] hover:text-[#2E2E2E] transition-colors font-medium">Essai gratuit 14 jours →</Link></>
                        }
                    </p>

                    <p className="text-center text-[11px] text-luna-text-muted mt-4">
                        En vous inscrivant, vous acceptez nos <Link href="/cgv" className="text-luna-primary-hover hover:underline cursor-pointer">{isLegal ? 'Conditions Générales d\'Utilisation' : 'Conditions Générales de Vente'}</Link>
                    </p>

                    <p className="text-center text-[10px] text-gray-300 mt-5">© 2026 {isLegal ? 'Le Droit Agent — IA Juridique' : 'Luna — Concierge Voyage'}</p>
                </motion.div>
            </div>
        </div>
    );
}
