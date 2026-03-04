'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { updateUserProfile } from '@/src/lib/firebase/crm';
import { useSubscription } from '@/src/hooks/useSubscription';
import { storage } from '@/src/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, CheckCircle2, Mail, Phone, Building2, FileText,
    Shield, LogOut, Globe, Briefcase, Clock, MapPin, Sparkles, CreditCard, Camera
} from 'lucide-react';

// ═══ ANIMATED FLIGHT ROUTES ═══
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

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Agent': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    'Admin': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    'Manager': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
};

export default function SettingsPage() {
    const { user, userProfile, logout, refreshProfile } = useAuth();
    const { subscription, isActive, planName } = useSubscription();
    const [portalLoading, setPortalLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [agency, setAgency] = useState('');
    const [bio, setBio] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setMounted(true); }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingPhoto(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL, updatedAt: new Date() });
            await refreshProfile();
        } catch (err) {
            console.error('Photo upload error:', err);
        } finally {
            setUploadingPhoto(false);
        }
    };

    useEffect(() => {
        if (userProfile) {
            setPhone(userProfile.phone || '');
            setAgency(userProfile.agency || '');
            setBio(userProfile.bio || '');
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUserProfile(user.uid, { phone, agency, bio });
            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const photoURL = user?.photoURL || userProfile?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const email = userProfile?.email || user?.email || '';
    const role = userProfile?.role || 'Agent';
    const roleStyle = ROLE_COLORS[role] || ROLE_COLORS['Agent'];
    const memberSince = userProfile?.createdAt
        ? new Date(userProfile.createdAt instanceof Date ? userProfile.createdAt : (userProfile.createdAt as any).toDate?.() || userProfile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        : 'Mars 2026';

    return (
        <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
            {/* ═══ ANIMATED WORLD MAP BACKGROUND ═══ */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                <div className="absolute top-10 right-20 w-96 h-96 bg-sky-100/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-violet-100/15 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[50%] w-48 h-48 bg-amber-100/15 rounded-full blur-[80px]" />

                {mounted && (
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <filter id="settingsGlow"><feGaussianBlur stdDeviation="0.3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        {FLIGHT_ROUTES.map((route, i) => {
                            const path = generateArcPath(route.from, route.to);
                            const pathId = `sp-${i}`;
                            return (
                                <g key={i}>
                                    <path d={path} fill="none" stroke={route.color} strokeWidth="0.1" strokeOpacity="0.08" strokeLinecap="round" />
                                    <path d={path} fill="none" stroke={route.color} strokeWidth="0.18" strokeLinecap="round" filter="url(#settingsGlow)"
                                        strokeDasharray="6 94" style={{ animation: `sp ${4 + i * 0.5}s linear infinite`, animationDelay: `${i * 0.6}s` }} strokeOpacity="0.2" />
                                    <circle cx={route.from.x} cy={route.from.y} r="0.25" fill={route.color} opacity="0.15">
                                        <animate attributeName="r" values="0.15;0.35;0.15" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
                                    </circle>
                                    <circle cx={route.to.x} cy={route.to.y} r="0.15" fill={route.color} opacity="0.1" />
                                    <path id={pathId} d={path} fill="none" stroke="none" />
                                    <circle r="0.5" fill={route.color} opacity="0.5" filter="url(#settingsGlow)">
                                        <animateMotion dur={`${7 + i * 0.8}s`} repeatCount="indefinite">
                                            <mpath href={`#${pathId}`} />
                                        </animateMotion>
                                    </circle>
                                    <circle r="0.2" fill="#fff" opacity="0.7">
                                        <animateMotion dur={`${7 + i * 0.8}s`} repeatCount="indefinite">
                                            <mpath href={`#${pathId}`} />
                                        </animateMotion>
                                    </circle>
                                </g>
                            );
                        })}
                    </svg>
                )}
                <style jsx>{`@keyframes sp { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }`}</style>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="relative z-10 max-w-3xl mx-auto py-6 md:py-10 px-1">
                {/* Page header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
                    <h1 className="font-serif text-2xl md:text-3xl font-semibold text-luna-charcoal tracking-tight">Mon Profil</h1>
                    <p className="text-luna-text-muted text-sm font-light mt-1">Gérez votre identité et vos paramètres de compte</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ═══ LEFT COLUMN — Identity Card ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm overflow-hidden">
                            {/* Dark header with map pattern */}
                            <div className="relative bg-gradient-to-br from-[#0f1420] via-[#1a1f30] to-[#0f1420] px-5 pt-8 pb-12 text-center overflow-hidden">
                                {/* Subtle map grid */}
                                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                <div className="absolute top-4 right-6 w-16 h-16 bg-sky-400/10 rounded-full blur-[30px]" />
                                <div className="absolute bottom-2 left-8 w-12 h-12 bg-amber-400/10 rounded-full blur-[20px]" />

                                <div className="relative z-10">
                                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="relative group mx-auto block" disabled={uploadingPhoto}>
                                        {photoURL ? (
                                            <img src={photoURL} alt={displayName} className="w-24 h-24 rounded-full object-cover border-[3px] border-white/20 shadow-2xl" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold border-[3px] border-white/20 shadow-2xl">
                                                {getInitials(displayName)}
                                            </div>
                                        )}
                                        {uploadingPhoto ? (
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </button>
                                    <h2 className="text-white text-lg font-semibold mt-4 tracking-tight">{displayName}</h2>
                                    <p className="text-white/40 text-xs mt-0.5">{email}</p>
                                </div>
                            </div>

                            {/* Badge & stats */}
                            <div className="px-5 -mt-5 relative z-10">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text} rounded-full border ${roleStyle.border} shadow-sm`}>
                                    <Shield size={10} />
                                    {role}
                                </div>
                            </div>

                            <div className="px-5 py-5 space-y-3">
                                {/* Quick stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-luna-cream/60 rounded-xl px-3 py-2.5 border border-luna-warm-gray/8">
                                        <div className="flex items-center gap-1.5 text-luna-text-muted mb-0.5">
                                            <Clock size={10} />
                                            <span className="text-[9px] uppercase tracking-wider font-semibold">Membre</span>
                                        </div>
                                        <p className="text-[12px] font-semibold text-luna-charcoal">{memberSince}</p>
                                    </div>
                                    <div className="bg-luna-cream/60 rounded-xl px-3 py-2.5 border border-luna-warm-gray/8">
                                        <div className="flex items-center gap-1.5 text-luna-text-muted mb-0.5">
                                            <Sparkles size={10} />
                                            <span className="text-[9px] uppercase tracking-wider font-semibold">Statut</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                                            <p className="text-[12px] font-semibold text-emerald-600">Actif</p>
                                        </div>
                                    </div>
                                </div>

                                {agency && (
                                    <div className="flex items-center gap-2 text-luna-text-muted py-1">
                                        <Building2 size={13} strokeWidth={1.5} />
                                        <span className="text-[12px]">{agency}</span>
                                    </div>
                                )}
                                {phone && (
                                    <div className="flex items-center gap-2 text-luna-text-muted py-1">
                                        <Phone size={13} strokeWidth={1.5} />
                                        <span className="text-[12px]">{phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Subscription */}
                            <div className="px-5 pb-3">
                                <div className="bg-gradient-to-br from-violet-50/80 to-sky-50/80 rounded-xl p-4 border border-violet-100/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={14} className="text-violet-500" />
                                        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-violet-600">Abonnement</span>
                                    </div>
                                    {isActive ? (
                                        <>
                                            <p className="text-sm font-semibold text-luna-charcoal">{planName || 'Actif'}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] text-emerald-600 font-semibold">Actif</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs text-luna-text-muted">Aucun abonnement actif</p>
                                    )}
                                    {subscription?.stripeCustomerId && (
                                        <button
                                            disabled={portalLoading}
                                            onClick={async () => {
                                                setPortalLoading(true);
                                                try {
                                                    const res = await fetch('/api/stripe/portal', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) window.location.href = data.url;
                                                } catch (e) { console.error(e); }
                                                finally { setPortalLoading(false); }
                                            }}
                                            className="mt-3 w-full py-2 bg-white border border-violet-200 hover:bg-violet-50 text-violet-600 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            {portalLoading ? (
                                                <div className="w-3 h-3 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                                            ) : (
                                                <>Gérer mon abonnement</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Logout */}
                            <div className="px-5 pb-5">
                                <button
                                    onClick={logout}
                                    className="w-full py-2.5 bg-white border border-luna-warm-gray/15 hover:border-red-200 hover:bg-red-50/50 text-luna-text-muted hover:text-red-500 font-medium text-[12px] rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut size={13} />
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ RIGHT COLUMN — Edit Form ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="lg:col-span-2 space-y-5"
                    >
                        {/* Account Info (read-only) */}
                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm p-5 md:p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-luna-charcoal/5 flex items-center justify-center">
                                    <Globe size={14} className="text-luna-charcoal" />
                                </div>
                                <h3 className="text-sm font-semibold text-luna-charcoal tracking-tight">Informations du compte</h3>
                                <span className="ml-auto text-[9px] uppercase tracking-wider font-semibold text-luna-text-muted/50 bg-luna-cream px-2 py-0.5 rounded-full">Lecture seule</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                        <Mail size={9} /> Adresse email
                                    </label>
                                    <div className="py-2.5 px-3.5 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-[13px] text-luna-charcoal/60 select-all">
                                        {email}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                        <Shield size={9} /> Rôle
                                    </label>
                                    <div className="py-2.5 px-3.5 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-[13px] text-luna-charcoal/60 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${role === 'Admin' ? 'bg-violet-500' : role === 'Manager' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                                        {role}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                        <MapPin size={9} /> Identifiant Firebase
                                    </label>
                                    <div className="py-2.5 px-3.5 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-[11px] text-luna-charcoal/40 font-mono select-all">
                                        {user?.uid || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable fields */}
                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm p-5 md:p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <Briefcase size={14} className="text-sky-600" />
                                </div>
                                <h3 className="text-sm font-semibold text-luna-charcoal tracking-tight">Profil professionnel</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                        <Phone size={9} /> Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+33 6 00 00 00 00"
                                        className="w-full py-2.5 px-3.5 bg-white rounded-xl border border-luna-warm-gray/15 text-[13px] text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                        <Building2 size={9} /> Agence
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nom de votre agence"
                                        className="w-full py-2.5 px-3.5 bg-white rounded-xl border border-luna-warm-gray/15 text-[13px] text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all"
                                        value={agency}
                                        onChange={e => setAgency(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1 mb-1.5">
                                    <FileText size={9} /> Bio / Spécialités
                                </label>
                                <textarea
                                    placeholder="Ex : Spécialiste circuits premium Asie du Sud-Est, expert voyages sur-mesure haut de gamme..."
                                    className="w-full py-2.5 px-3.5 bg-white rounded-xl border border-luna-warm-gray/15 text-[13px] text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all resize-none h-28 leading-relaxed"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Save button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                        >
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-white font-medium text-[12px] tracking-[0.15em] uppercase rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-2.5 disabled:opacity-60"
                            >
                                <AnimatePresence mode="wait">
                                    {saving ? (
                                        <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        </motion.div>
                                    ) : saved ? (
                                        <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-emerald-300">
                                            <CheckCircle2 size={16} /> Profil sauvegardé
                                        </motion.span>
                                    ) : (
                                        <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2">
                                            <Save size={14} /> Sauvegarder les modifications
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
