'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LunaLogo } from '../components/LunaLogo';
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, Sparkles, Shield, Zap, Scale, FileSearch, Briefcase, Languages } from 'lucide-react';
import Image from 'next/image';
import { signUpWithEmail, loginWithGoogle as firebaseLoginWithGoogle } from '@/src/lib/firebase/auth';
import { createTenant } from '@/src/lib/firebase/tenant';
import { getOrCreateUser } from '@/src/lib/firebase/crm';
import { WorldMapSVG } from '@/src/components/WorldMapSVG';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { LOCALE_LABELS, type LunaLocale } from '@/src/lib/i18n/translations';
import { detectProAuthLocale, PRO_AUTH_COPY, PRO_AUTH_LOCALE_STORAGE_KEY } from '@/src/lib/i18n/proAuth';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'form' | 'creating'>('form');
    const [proLocale, setProLocale] = useState<LunaLocale>('fr');
    const router = useRouter();
    const searchParams = useSearchParams();
    const vertical = searchParams?.get('vertical') || 'travel';
    const mode = searchParams?.get('mode') || '';
    const isLegal = vertical === 'legal';
    const isProMode = mode === 'pro';
    const proCopy = PRO_AUTH_COPY[proLocale];

    useEffect(() => {
        if (!isProMode) return;
        const resolved = detectProAuthLocale(searchParams?.get('lang'));
        setProLocale(resolved);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, resolved);
        }
    }, [isProMode, searchParams]);

    const handleProLocaleChange = (locale: LunaLocale) => {
        setProLocale(locale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, locale);
        }
    };

    const provisionProAccount = async (uid: string, tenantId: string, displayName: string, userEmail: string) => {
        await setDoc(doc(db, 'users', uid), {
            accessScope: 'pro_travel',
            role: 'Agent',
            updatedAt: new Date(),
        }, { merge: true });

        if (!userEmail) return;

        const suppliersRef = collection(db, 'tenants', tenantId, 'suppliers');
        const existingSnap = await getDocs(query(suppliersRef, where('email', '==', userEmail)));
        const alreadyExistsInTravel = existingSnap.docs.some((snap) => {
            const data = snap.data() as { vertical?: string };
            return !data.vertical || data.vertical === 'travel';
        });

        if (alreadyExistsInTravel) return;

        await addDoc(suppliersRef, {
            name: displayName || userEmail.split('@')[0] || 'Prestataire',
            contactName: displayName || '',
            category: 'AUTRE',
            country: 'France',
            city: 'Paris',
            email: userEmail,
            phone: '',
            notes: 'Compte pro créé via inscription.',
            commission: 0,
            tags: ['pro-account'],
            isFavorite: false,
            isLunaFriend: false,
            vertical: 'travel',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setStep('creating');

        try {
            // 1. Create Firebase Auth account
            const result = await signUpWithEmail(email, password, name);
            if (result.error || !result.user) {
                setError(result.error || 'Erreur inconnue');
                setStep('form');
                setIsLoading(false);
                return;
            }

            const user = result.user;

            // 2. Create user profile in Firestore
            const userProfile = await getOrCreateUser({
                uid: user.uid,
                displayName: name,
                email: user.email,
                photoURL: user.photoURL,
            });
            const tenantId = userProfile.tenantId || user.uid;

            // 3. Create tenant
            await createTenant(user.uid, email, name, agencyName || undefined);

            if (isProMode) {
                await provisionProAccount(
                    user.uid,
                    tenantId,
                    name || user.displayName || userProfile.displayName || 'Prestataire',
                    email || user.email || userProfile.email || '',
                );
            }

            // 4. Create free trial subscription (14 days)
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            await setDoc(doc(db, 'subscriptions', email), {
                email,
                planId: 'all_in_one',
                planName: 'All-in-One (Essai)',
                status: 'trialing',
                activatedAt: new Date(),
                trialEndsAt: trialEnd,
                updatedAt: new Date(),
            });

            // 5. Seed demo data
            try {
                const token = await user.getIdToken();
                await fetch('/api/signup/seed-demo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ tenantId: user.uid }),
                });
            } catch {
                // Non-blocking — demo data is nice-to-have
            }

            // 6. Redirect to the right CRM vertical
            const destination =
                isProMode
                    ? '/pro/travel'
                    : vertical === 'legal'
                    ? '/crm/legal'
                    : vertical === 'monum'
                        ? '/crm/monum'
                        : '/crm/travel';
            router.push(destination);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création du compte');
            setStep('form');
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await firebaseLoginWithGoogle();
            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.user && isProMode) {
                const googleName = result.user.displayName || 'Prestataire';
                const googleEmail = result.user.email || '';
                const userProfile = await getOrCreateUser({
                    uid: result.user.uid,
                    displayName: googleName,
                    email: googleEmail,
                    photoURL: result.user.photoURL,
                });
                const tenantId = userProfile.tenantId || result.user.uid;
                await createTenant(result.user.uid, googleEmail, googleName);
                await provisionProAccount(result.user.uid, tenantId, googleName, googleEmail);
                router.push('/pro/travel');
                return;
            }

            if (result.user) {
                const destination =
                    vertical === 'legal'
                        ? '/crm/legal'
                        : vertical === 'monum'
                            ? '/crm/monum'
                            : '/crm/travel';
                router.push(destination);
                return;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur pendant l’inscription Google';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={isProMode ? 'relative min-h-screen overflow-hidden bg-[#f3f6f8]' : 'min-h-screen flex bg-white'}>
            {isProMode && (
                <div className="absolute inset-0 z-0">
                    <WorldMapSVG className="h-full w-full" />
                </div>
            )}

            {/* ═══ Left: Branding ═══ */}
            {!isProMode && (
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
                {isLegal ? (
                    <>
                        <Image src="/legal-login-bg.jpg" alt="Palais de Justice" fill className="object-cover" priority />
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
                                Essai gratuit<br />
                                <span className="italic text-[#bcdeea]">14 jours.</span>
                            </h1>
                            <p className="text-white/60 text-[14px] font-light leading-relaxed mb-10 max-w-sm mx-auto">
                                Accès complet au CRM juridique. Sans engagement, sans carte bancaire.
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: Scale, text: 'Analyse de dossiers assistée par IA' },
                                    { icon: FileSearch, text: 'Recherche jurisprudence intelligente' },
                                    { icon: Briefcase, text: 'CRM juridique intégré & complet' },
                                ].map((feature, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.15 }} className="flex items-center gap-3 text-left">
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
                    <>
                        <div className="absolute inset-0 bg-white">
                            <WorldMapSVG className="w-full h-full" />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative z-10 px-16 text-center max-w-[520px]"
                        >
                            <div className="flex justify-center mb-8">
                                <LunaLogo size={48} className="brightness-0" />
                            </div>
                            <h1 className="text-[36px] md:text-[42px] text-[#2E2E2E] font-light leading-[1.1] tracking-tight mb-4">
                                Essai gratuit<br />
                                <span className="italic text-[#5a8fa3]">14 jours.</span>
                            </h1>
                            <p className="text-[#2E2E2E]/40 text-[14px] font-light leading-relaxed mb-10 max-w-sm mx-auto">
                                Accès complet à toutes les fonctionnalités. Sans engagement, sans carte bancaire.
                            </p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: Sparkles, text: 'CRM complet + Pipeline + Facturation' },
                                    { icon: Zap, text: 'Agents IA + Chat + Emails analysés' },
                                    { icon: Shield, text: 'Site vitrine + 4 templates premium' },
                                ].map((feature, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.15 }} className="flex items-center gap-3 text-left">
                                        <div className="w-8 h-8 rounded-[10px] bg-[#f5f5f5] border border-gray-100 flex items-center justify-center shrink-0">
                                            <feature.icon size={14} className="text-[#5a8fa3]" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[12px] text-[#2E2E2E]/60">{feature.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
            )}

            {/* ═══ Right: Signup form ═══ */}
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
                        ) : (
                            <Link href="/" className="cursor-pointer">
                                <LunaLogo size={36} />
                            </Link>
                        )}
                    </div>

                    {step === 'creating' ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-[#5a8fa3]/10 flex items-center justify-center mb-6">
                                <Loader2 size={28} className="text-[#5a8fa3] animate-spin" />
                            </div>
                            <h2 className="text-[20px] text-[#2E2E2E] tracking-tight mb-2">{isProMode ? proCopy.creatingSpace : 'Création de votre espace…'}</h2>
                            <div className="flex flex-col gap-2 mt-4">
                                {[
                                    isProMode ? proCopy.creatingStep1 : 'Compte créé ✓',
                                    isProMode ? proCopy.creatingStep2 : 'Espace concierge…',
                                    isProMode ? proCopy.creatingStep3 : 'Données de démo…',
                                ].map((s, i) => (
                                    <motion.p key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 1.2 }}
                                        className="text-[12px] text-[#2E2E2E]/40 flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                        {s}
                                    </motion.p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-[24px] text-[#2E2E2E] tracking-tight mb-1">{isProMode ? proCopy.signupTitle : 'Créer un compte'}</h2>
                            <p className="text-[#2E2E2E]/40 text-[13px] mb-7">
                                {isProMode
                                    ? proCopy.signupSubtitle
                                    : isLegal
                                        ? 'Essai gratuit 14 jours — CRM Juridique complet'
                                        : 'Essai gratuit 14 jours — Tout inclus'}
                            </p>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 p-3 rounded-[12px] bg-red-50 border border-red-200 flex items-center gap-2.5">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <p className="text-red-600 text-[13px]">{error}</p>
                                </motion.div>
                            )}

                            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-label-sharp block mb-2">{isProMode ? proCopy.nameLabel : 'Votre nom'}</label>
                                    <input type="text" placeholder="Jean Dupont"
                                        className="input-underline w-full"
                                        value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-label-sharp block mb-2">{isProMode ? proCopy.agencyLabel : isLegal ? 'Nom du cabinet' : 'Nom de l\'agence'} <span className="text-[#2E2E2E]/25">{isProMode ? proCopy.optional : '(optionnel)'}</span></label>
                                    <input type="text" placeholder={isProMode ? proCopy.agencyPlaceholder : isLegal ? 'Cabinet Dupont & Associés' : 'Luna Conciergerie'}
                                        className="input-underline w-full"
                                        value={agencyName} onChange={e => setAgencyName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-label-sharp block mb-2">{isProMode ? proCopy.emailLabel : 'Email'}</label>
                                    <input type="email" placeholder={isProMode ? proCopy.emailPlaceholder : isLegal ? 'avocat@cabinet.fr' : 'votre@email.com'}
                                        className="input-underline w-full"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-label-sharp block mb-2">{isProMode ? proCopy.passwordLabel : 'Mot de passe'}</label>
                                    <input type="password" placeholder="••••••••"
                                        className="input-underline w-full font-mono"
                                        value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                                    <p className="text-[10px] text-[#2E2E2E]/25 mt-1">{isProMode ? proCopy.minPassword : 'Minimum 6 caractères'}</p>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full py-3 btn-primary text-[13px] uppercase tracking-[0.1em] rounded-[12px] flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer mt-2">
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            {isProMode ? proCopy.creatingButton : 'Création…'}
                                        </span>
                                    ) : (
                                        <>{isProMode ? proCopy.createProAccess : 'Commencer l&apos;essai gratuit'} <ArrowRight size={14} /></>
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
                            <button type="button" onClick={handleGoogleSignup} disabled={isLoading}
                                className="w-full py-3 px-4 bg-white hover:bg-[#F8F8F6] border border-gray-100 text-[#2E2E2E] text-[13px] rounded-[12px] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer">
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>

                            <p className="text-center text-[13px] text-[#2E2E2E]/40 mt-6">
                                {isProMode ? `${proCopy.alreadyMember} ` : 'Déjà un compte ? '}
                                <Link href={isProMode ? `/login/pro?lang=${proLocale}` : isLegal ? '/login/legal' : '/login/travel'} className="text-[#5a8fa3] hover:text-[#2E2E2E] transition-colors font-medium">{isProMode ? proCopy.loginCta : 'Se connecter'}</Link>
                            </p>

                            <p className="text-center text-[11px] text-[#2E2E2E]/25 mt-4">
                                {isProMode
                                    ? <>{proCopy.signupTermsPrefix} <Link href="/cgv" className="text-[#5a8fa3]/60 hover:underline">{proCopy.signupTermsLink}</Link></>
                                    : <>En créant un compte, vous acceptez nos <Link href="/cgv" className="text-[#5a8fa3]/60 hover:underline">CGV</Link></>
                                }
                            </p>
                        </>
                    )}

                    <p className="text-center text-[10px] text-gray-300 mt-5">© 2026 {isLegal ? 'Le Droit Agent — IA Juridique' : 'Luna — Concierge Voyage'}</p>
                </motion.div>
            </div>
        </div>
    );
}
