'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LunaLogo } from '../components/LunaLogo';
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, Scale, FileSearch, Briefcase, Building2, HardHat, CalendarDays, Languages } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { sendPasswordReset, setRememberMe } from '@/src/lib/firebase/auth';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';
import { WorldMapSVG } from '@/src/components/WorldMapSVG';
import { LOCALE_LABELS, type LunaLocale } from '@/src/lib/i18n/translations';
import { detectProAuthLocale, PRO_AUTH_COPY, PRO_AUTH_LOCALE_STORAGE_KEY } from '@/src/lib/i18n/proAuth';

/* ── Rotating 3D Globe (Mapbox) ── */
function RotatingGlobe() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || mapRef.current) return;
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        const initTimer = setTimeout(async () => {
            const mapboxgl = (await import('mapbox-gl')).default;
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
    const [rememberMe, setRememberMeState] = useState(true);
    const [resetSent, setResetSent] = useState(false);
    const [proLocale, setProLocale] = useState<LunaLocale>('fr');
    const router = useRouter();
    const { user, userProfile, login, loginWithGoogle, refreshProfile, loading: authLoading } = useAuth();

    // Detect active vertical from URL
    const searchParams = useSearchParams();
    const vertical = searchParams?.get('vertical') || 'travel';
    const mode = searchParams?.get('mode') || '';
    const isLegal = vertical === 'legal';
    const isMonum = vertical === 'monum';
    const isProMode = mode === 'pro';
    const proCopy = PRO_AUTH_COPY[proLocale];
    const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

    // Monum uses its own dedicated Paris Renov Tracker auth/CRM app.
    useEffect(() => {
        if (isMonum) {
            window.location.replace(`${monumAppUrl}/login`);
        }
    }, [isMonum, monumAppUrl]);

    useEffect(() => {
        if (!isProMode) return;
        const resolved = detectProAuthLocale(searchParams?.get('lang'));
        setProLocale(resolved);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, resolved);
        }
    }, [isProMode, searchParams]);

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
            if (userProfile?.accessScope === 'pro_travel' || isProMode) {
                router.replace('/pro/travel');
                return;
            }
            const destination =
                isLegal
                    ? '/crm/legal'
                    : isMonum
                        ? '/crm/monum'
                        : '/crm/travel';
            router.replace(destination);
        }
    }, [user, userProfile?.accessScope, authLoading, router, isJoining, isLegal, isMonum, isProMode]);

    const handleProLocaleChange = (locale: LunaLocale) => {
        setProLocale(locale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, locale);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const result = await login(email, password);
        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }
        // Let the global auth listener update context first; the existing
        // "already logged in" effect will perform the redirect reliably.
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        const result = await loginWithGoogle();
        if (result.error) { setError(result.error); setIsLoading(false); }
    };

    if (isMonum) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    return (
        <div className={isProMode ? 'relative min-h-screen overflow-hidden bg-[#f3f6f8]' : 'min-h-screen flex bg-white'}>
            {isProMode && (
                <div className="absolute inset-0 z-0">
                    <WorldMapSVG className="h-full w-full" />
                </div>
            )}

            {/* ═══ Left: Visual Panel (Vertical-aware) ═══ */}
            {!isProMode && (
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
                                <span className="italic text-[#EDE0D4]">Agent.</span>
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
                                            <feature.icon size={14} className="text-[#EDE0D4]" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[12px] text-white/70">{feature.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                ) : isMonum ? (
                    /* ── Monum: Construction branding ── */
                    <>
                        <div className="absolute inset-0 bg-[#F8FAFC]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(202,138,4,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(15,23,42,0.14),transparent_40%)]" />

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 px-16 text-center max-w-[520px]"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-white/40 flex items-center justify-center shadow-lg">
                                    <Building2 size={30} className="text-[#facc15]" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h1 className="text-[36px] md:text-[42px] text-[#0f172a] font-light leading-[1.1] tracking-tight mb-4">
                                Paris Renov<br />
                                <span className="italic text-[#ca8a04]">Tracker.</span>
                            </h1>
                            <p className="text-[#475569] text-[14px] font-light leading-relaxed mb-10 max-w-sm mx-auto">
                                Ancien Datarnivore, renommé Monum. Suivi de chantiers, budgets et coordination artisans.
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: HardHat, text: 'Pilotage multi-chantiers en temps réel' },
                                    { icon: CalendarDays, text: 'Planning Gantt et alertes de retard' },
                                    { icon: Building2, text: 'CRM rénovation orienté opérationnel' },
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + i * 0.15 }}
                                        className="flex items-center gap-3 text-left"
                                    >
                                        <div className="w-8 h-8 rounded-[10px] bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0">
                                            <feature.icon size={14} className="text-[#0f172a]" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[12px] text-[#334155]">{feature.text}</span>
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
            )}

            {/* ═══ Right: Login form ═══ */}
            <div className={isProMode ? 'relative z-10 flex min-h-screen w-full items-center justify-center p-6 md:p-8' : 'flex-1 flex items-center justify-center p-8 relative z-10'}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className={isProMode ? 'w-full max-w-[430px] rounded-3xl border border-gray-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:p-8' : 'w-full max-w-[360px]'}
                >
                    {isProMode && (
                        <div className="mb-5 rounded-2xl border border-[#5a8fa3]/25 bg-[#f4f9fb] p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c667b] inline-flex items-center gap-1.5">
                                <Languages size={12} /> {proCopy.languageSelectorLabel}
                            </p>
                            <div className="mt-2 grid grid-cols-5 gap-1.5">
                                {Object.entries(LOCALE_LABELS).map(([code, meta]) => {
                                    const locale = code as LunaLocale;
                                    const active = locale === proLocale;
                                    return (
                                        <button
                                            key={locale}
                                            type="button"
                                            onClick={() => handleProLocaleChange(locale)}
                                            className={`rounded-lg border px-1.5 py-2 text-center transition-colors ${active ? 'border-[#5a8fa3] bg-white text-[#2c667b]' : 'border-transparent bg-white/70 text-gray-500 hover:border-[#5a8fa3]/35'}`}
                                        >
                                            <p className="text-[11px]">{meta.flag}</p>
                                            <p className="text-[9px] font-semibold uppercase tracking-wider">{locale}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Logo — conditional */}
                    <div className={`flex items-center gap-2 ${isProMode ? 'mb-8 justify-center' : 'mb-10'}`}>
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
                        ) : isMonum ? (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center">
                                    <Building2 size={20} className="text-[#facc15]" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-[16px] font-light text-[#0f172a] tracking-tight leading-tight">Paris Renov <span className="italic text-[#ca8a04]">Tracker</span></p>
                                    <p className="text-[9px] text-[#9CA3AF] uppercase tracking-[0.15em] font-medium">Ancien Datarnivore</p>
                                </div>
                            </div>
                        ) : (
                            <Link href="/" className="cursor-pointer">
                                <LunaLogo size={36} className="brightness-0" />
                            </Link>
                        )}
                    </div>

                    <h2 className="text-[24px] text-luna-charcoal tracking-tight mb-1">{isProMode ? proCopy.loginTitle : 'Connexion'}</h2>
                    <p className="text-luna-text-muted text-[13px] mb-7">
                        {isProMode
                            ? proCopy.loginSubtitle
                            : isLegal
                            ? 'Accédez à votre espace Cabinet Juridique'
                            : isMonum
                                ? 'Accédez à votre espace Paris Renov Tracker'
                                : 'Accédez à votre espace concierge voyage'}
                    </p>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-3 rounded-[12px] bg-red-50 border border-red-200 flex items-center gap-2.5">
                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-[13px]">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="text-label-sharp block mb-2">{isProMode ? proCopy.emailLabel : 'Email'}</label>
                            <input type="email" placeholder={isProMode ? proCopy.emailPlaceholder : isLegal ? 'avocat@cabinet.fr' : isMonum ? 'contact@monum.fr' : 'votre@email.com'}
                                className="input-underline w-full"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-label-sharp block mb-2">{isProMode ? proCopy.passwordLabel : 'Mot de passe'}</label>
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
                                <span className="text-[12px] text-luna-text-muted">{isProMode ? proCopy.rememberMe : 'Se souvenir de moi'}</span>
                            </label>
                            <button type="button" className="text-[12px] text-luna-primary-hover hover:text-luna-charcoal transition-colors cursor-pointer"
                                onClick={async () => {
                                    if (!email) { setError(isProMode ? proCopy.forgotPasswordNeedEmail : 'Entrez votre email pour réinitialiser le mot de passe.'); return; }
                                    const result = await sendPasswordReset(email);
                                    if (result.error) { setError(result.error); }
                                    else { setResetSent(true); setError(null); }
                                }}>
                                {isProMode ? proCopy.forgotPassword : 'Mot de passe oublié ?'}
                            </button>
                        </div>

                        {resetSent && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                <p className="text-emerald-700 text-[13px]">{isProMode ? proCopy.resetSent : 'Un lien de réinitialisation a été envoyé à'} {email}</p>
                            </motion.div>
                        )}

                        <button type="submit" disabled={isLoading || isJoining}
                            className={`w-full py-3 text-[13px] uppercase tracking-[0.1em] rounded-[12px] flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer mt-2 transition-colors ${isLegal ? 'bg-[#A07850] hover:bg-[#8B6740] text-white shadow-lg' : isMonum ? 'bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-lg' : 'btn-primary'}`}>
                            {isLoading || isJoining ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    {isJoining ? 'Validation...' : isProMode ? proCopy.connecting : 'Connexion...'}
                                </span>
                            ) : (
                                <>{isProMode ? proCopy.loginButton : 'Connexion'} <ArrowRight size={14} /></>
                            )}
                        </button>
                    </form>

                    {/* Separator */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-label-sharp">{isProMode ? proCopy.orContinueWith : 'ou continuer avec'}</span>
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
                    {!isProMode && (isLegal ? (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-label-sharp mb-3 text-center">Nos offres Cabinet</p>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Starter', price: '49€', desc: '1 avocat' },
                                    { name: 'Cabinet', price: '149€', desc: 'Jusqu\'à 5' },
                                    { name: 'Enterprise', price: 'Sur devis', desc: 'Illimité' },
                                ].map(p => (
                                    <div key={p.name}
                                        className="flex-1 text-center p-2 rounded-[10px] border border-gray-100 hover:border-[#A07850]/40 transition-colors cursor-pointer">
                                        <p className="text-[11px] text-luna-charcoal font-medium">{p.name}</p>
                                        <p className="text-[11px] text-[#A07850] font-semibold">{p.price}</p>
                                        <p className="text-[9px] text-[#9CA3AF]">{p.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isMonum ? (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-label-sharp mb-3 text-center">Nos formules Chantier</p>
                            <div className="flex gap-2">
                                {[
                                    { name: 'Artisan', price: '49€' },
                                    { name: 'Studio', price: '99€' },
                                    { name: 'Promotion', price: '199€' },
                                ].map(p => (
                                    <Link key={p.name} href="/landing-monum"
                                        className="flex-1 text-center p-2 rounded-[10px] border border-gray-100 hover:border-[#0f172a]/40 transition-colors cursor-pointer">
                                        <p className="text-[11px] text-luna-charcoal">{p.name}</p>
                                        <p className="text-[11px] text-luna-text-muted">{p.price}<span className="text-[10px]">/mois</span></p>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/landing-monum" className="block text-center text-[11px] text-[#0f172a] hover:text-[#334155] mt-3 transition-colors cursor-pointer">
                                Voir les détails Monum →
                            </Link>
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
                    ))}

                    <p className="text-center text-[13px] text-[#2E2E2E]/40 mt-5">
                        {isLegal
                            ? <><span>Pas encore de compte ? </span><span className="text-[#A07850] font-medium cursor-pointer">Demander une démo →</span></>
                            : isMonum
                                ? <>Pas encore de compte ? <Link href="/signup/monum" className="text-[#0f172a] hover:text-[#334155] transition-colors font-medium">Essai gratuit 14 jours →</Link></>
                                : isProMode
                                    ? <>{proCopy.noMember} <Link href={`/signup/pro?lang=${proLocale}`} className="text-[#5a8fa3] hover:text-[#2E2E2E] transition-colors font-medium">{proCopy.signupCta}</Link></>
                                    : <>Pas encore de compte ? <Link href="/signup/travel" className="text-[#5a8fa3] hover:text-[#2E2E2E] transition-colors font-medium">Essai gratuit 14 jours →</Link></>
                        }
                    </p>

                    <p className="text-center text-[11px] text-luna-text-muted mt-4">
                        {isProMode
                            ? <>{proCopy.termsPrefix} <Link href="/cgv" className="text-luna-primary-hover hover:underline cursor-pointer">{proCopy.termsLink}</Link></>
                            : <>En vous inscrivant, vous acceptez nos <Link href="/cgv" className="text-luna-primary-hover hover:underline cursor-pointer">{isLegal ? 'Conditions Générales d\'Utilisation' : 'Conditions Générales de Vente'}</Link></>
                        }
                    </p>

                    <p className="text-center text-[10px] text-gray-300 mt-5">© 2026 {isLegal ? 'Le Droit Agent — IA Juridique' : isMonum ? 'Paris Renov Tracker — Ancien Datarnivore' : 'Luna — Concierge Voyage'}</p>
                </motion.div>
            </div>
        </div>
    );
}
