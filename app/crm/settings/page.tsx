'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { updateUserProfile } from '@/src/lib/firebase/crm';
import { useSubscription } from '@/src/hooks/useSubscription';
import { storage } from '@/src/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, CheckCircle2, Mail, Phone, Building2, FileText,
    Shield, LogOut, Globe, Briefcase, Clock, MapPin, Sparkles, CreditCard, Camera
} from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

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

    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropScale, setCropScale] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    const cropImgRef = useRef<HTMLImageElement>(null);
    const [dragging, setDragging] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Step 1: User selects file → show crop modal
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgLoaded(false);
        const reader = new FileReader();
        reader.onload = () => {
            setCropSrc(reader.result as string);
            setCropScale(1);
            setCropOffset({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // reset so same file can be re-selected
    };

    // Draw crop preview
    useEffect(() => {
        if (!cropSrc || !cropCanvasRef.current || !imgLoaded) return;
        const canvas = cropCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = cropImgRef.current;
        if (!img) return;

        const size = 256;
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        // Draw circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Calculate scaled image dimensions
        const scale = cropScale;
        const imgW = img.naturalWidth * scale;
        const imgH = img.naturalHeight * scale;
        const drawX = (size - imgW) / 2 + cropOffset.x;
        const drawY = (size - imgH) / 2 + cropOffset.y;

        ctx.drawImage(img, drawX, drawY, imgW, imgH);
        ctx.restore();

        // Draw circle border
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [cropSrc, cropScale, cropOffset, imgLoaded]);

    const handleCropMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        dragStart.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y };
    };
    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        setCropOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const handleCropMouseUp = () => setDragging(false);

    // Step 2: User confirms crop → upload cropped image
    const handleCropConfirm = async () => {
        if (!cropCanvasRef.current || !user) return;
        setUploadingPhoto(true);

        try {
            const blob = await new Promise<Blob>((resolve, reject) => {
                if (!cropCanvasRef.current) return reject(new Error("Canvas ref is null"));
                cropCanvasRef.current.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error("Blob creation failed"));
                }, 'image/jpeg', 0.9);
            });

            // Make sure the modal closes right after we safely have the blob
            setCropSrc(null);

            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL, updatedAt: new Date() });
            await refreshProfile();
        } catch (err) {
            console.error('Photo upload error:', err);
            setCropSrc(null);
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

    const photoURL = userProfile?.photoURL || user?.photoURL;
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
            <div className="relative z-10 py-4 md:py-8">
                {/* Page header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-10">
                    <h1 className="font-serif text-3xl md:text-4xl font-semibold text-luna-charcoal tracking-tight">Mon Profil</h1>
                    <p className="text-luna-text-muted text-base font-light mt-2">Gérez votre identité et vos paramètres de compte</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ═══ LEFT COLUMN — Identity Card ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm overflow-hidden">
                            {/* Dark header — photo as fullbleed cover */}
                            <div className="relative h-44 overflow-hidden">
                                {photoURL ? (
                                    <img src={photoURL} alt={displayName} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f1420] via-[#1a1f30] to-[#0f1420]" />
                                )}
                                {/* Overlay gradient for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                                {/* Subtle map grid */}
                                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                                {/* Camera button to change photo */}
                                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                                    className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/50 transition-all group">
                                    {uploadingPhoto ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Camera size={15} className="text-white/70 group-hover:text-white transition-colors" />
                                    )}
                                </button>

                                {/* Name & email at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 z-10">
                                    <h2 className="text-white text-xl font-semibold tracking-tight drop-shadow-lg">{displayName}</h2>
                                    <p className="text-white/50 text-sm mt-0.5 drop-shadow">{email}</p>
                                </div>
                            </div>

                            {/* Badge & stats */}
                            <div className="px-6 -mt-5 relative z-10">
                                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text} rounded-full border ${roleStyle.border} shadow-sm`}>
                                    <Shield size={11} />
                                    {role}
                                </div>
                            </div>

                            <div className="px-6 py-6 space-y-3">
                                {/* Quick stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-luna-cream/60 rounded-xl px-4 py-3 border border-luna-warm-gray/8">
                                        <div className="flex items-center gap-1.5 text-luna-text-muted mb-1">
                                            <Clock size={12} />
                                            <span className="text-[10px] uppercase tracking-wider font-semibold">Membre</span>
                                        </div>
                                        <p className="text-sm font-semibold text-luna-charcoal">{memberSince}</p>
                                    </div>
                                    <div className="bg-luna-cream/60 rounded-xl px-4 py-3 border border-luna-warm-gray/8">
                                        <div className="flex items-center gap-1.5 text-luna-text-muted mb-1">
                                            <Sparkles size={12} />
                                            <span className="text-[10px] uppercase tracking-wider font-semibold">Statut</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                                            <p className="text-sm font-semibold text-emerald-600">Actif</p>
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
                                    <div className="flex items-center gap-2 mb-3">
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

                                    {/* ── Plan Switcher (dev/test) ── */}
                                    <div className="mt-3 pt-3 border-t border-violet-100/50">
                                        <p className="text-[9px] uppercase tracking-wider text-violet-400 font-medium mb-2">Changer de plan</p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {[
                                                { id: 'starter', name: 'Starter', color: 'from-sky-500 to-blue-600' },
                                                { id: 'pro', name: 'Pro', color: 'from-violet-500 to-purple-600' },
                                                { id: 'enterprise', name: 'Enterprise', color: 'from-amber-500 to-orange-600' },
                                            ].map(plan => {
                                                const isCurrent = subscription?.planId === plan.id;
                                                return (
                                                    <button
                                                        key={plan.id}
                                                        disabled={isCurrent}
                                                        onClick={async () => {
                                                            if (!user?.email) return;
                                                            try {
                                                                await setDoc(doc(db, 'subscriptions', user.email), {
                                                                    email: user.email,
                                                                    planId: plan.id,
                                                                    planName: plan.name,
                                                                    status: 'active',
                                                                    activatedAt: serverTimestamp(),
                                                                    updatedAt: serverTimestamp(),
                                                                }, { merge: true });
                                                            } catch (e) { console.error('Plan switch error:', e); }
                                                        }}
                                                        className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all ${isCurrent
                                                            ? `bg-gradient-to-r ${plan.color} text-white shadow-sm`
                                                            : 'bg-white/80 text-gray-500 hover:bg-white hover:shadow-sm border border-gray-100'
                                                            }`}
                                                    >
                                                        {plan.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {subscription?.planId && (
                                            <button
                                                onClick={async () => {
                                                    if (!user?.email) return;
                                                    try {
                                                        await setDoc(doc(db, 'subscriptions', user.email), {
                                                            status: 'cancelled',
                                                            updatedAt: serverTimestamp(),
                                                        }, { merge: true });
                                                    } catch (e) { console.error(e); }
                                                }}
                                                className="mt-2 w-full py-1.5 text-[10px] text-red-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all font-medium"
                                            >
                                                Désactiver l'abonnement
                                            </button>
                                        )}
                                    </div>

                                    {subscription?.stripeCustomerId && (
                                        <button
                                            disabled={portalLoading}
                                            onClick={async () => {
                                                setPortalLoading(true);
                                                try {
                                                    const res = await fetchWithAuth('/api/stripe/portal', {
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
                                                <>Gérer via Stripe</>
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
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-luna-charcoal/5 flex items-center justify-center">
                                    <Globe size={16} className="text-luna-charcoal" />
                                </div>
                                <h3 className="text-base font-semibold text-luna-charcoal tracking-tight">Informations du compte</h3>
                                <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-luna-text-muted/50 bg-luna-cream px-2.5 py-1 rounded-full">Lecture seule</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                        <Mail size={11} /> Adresse email
                                    </label>
                                    <div className="py-3 px-4 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-sm text-luna-charcoal/60 select-all">
                                        {email}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                        <Shield size={11} /> Rôle
                                    </label>
                                    <div className="py-3 px-4 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-sm text-luna-charcoal/60 flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${role === 'Admin' ? 'bg-violet-500' : role === 'Manager' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                                        {role}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                        <MapPin size={11} /> Identifiant Firebase
                                    </label>
                                    <div className="py-3 px-4 bg-luna-cream/40 rounded-xl border border-luna-warm-gray/8 text-xs text-luna-charcoal/40 font-mono select-all">
                                        {user?.uid || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/12 shadow-sm p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                                    <Briefcase size={16} className="text-sky-600" />
                                </div>
                                <h3 className="text-base font-semibold text-luna-charcoal tracking-tight">Profil professionnel</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                        <Phone size={11} /> Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+33 6 00 00 00 00"
                                        className="w-full py-3 px-4 bg-white rounded-xl border border-luna-warm-gray/15 text-sm text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                        <Building2 size={11} /> Agence
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nom de votre agence"
                                        className="w-full py-3 px-4 bg-white rounded-xl border border-luna-warm-gray/15 text-sm text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all"
                                        value={agency}
                                        onChange={e => setAgency(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-luna-text-muted flex items-center gap-1.5 mb-2">
                                    <FileText size={11} /> Bio / Spécialités
                                </label>
                                <textarea
                                    placeholder="Ex : Spécialiste circuits premium Asie du Sud-Est, expert voyages sur-mesure haut de gamme..."
                                    className="w-full py-3 px-4 bg-white rounded-xl border border-luna-warm-gray/15 text-sm text-luna-charcoal placeholder:text-luna-text-muted/40 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50 transition-all resize-none h-32 leading-relaxed"
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
                                className="w-full py-4 btn-primary font-semibold text-[13px] tracking-[0.12em] uppercase rounded-xl shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-60"
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

            {/* ═══ CROP MODAL ═══ */}
            {cropSrc && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-base font-bold text-luna-charcoal mb-4 text-center">Recadrer votre photo</h3>
                        {/* Hidden image for canvas drawing */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img ref={cropImgRef} src={cropSrc} alt="crop" className="hidden" onLoad={() => {
                            setImgLoaded(true);
                            // Auto-calculate scale to fit image
                            const img = cropImgRef.current;
                            if (img) {
                                const fitScale = 256 / Math.min(img.naturalWidth, img.naturalHeight);
                                setCropScale(fitScale);
                            }
                        }} />
                        <div className="flex justify-center mb-4">
                            <canvas
                                ref={cropCanvasRef}
                                width={256}
                                height={256}
                                className="rounded-full cursor-move border-4 border-gray-100 shadow-lg"
                                style={{ width: 200, height: 200 }}
                                onMouseDown={handleCropMouseDown}
                                onMouseMove={handleCropMouseMove}
                                onMouseUp={handleCropMouseUp}
                                onMouseLeave={handleCropMouseUp}
                            />
                        </div>
                        <div className="flex items-center gap-3 mb-5 px-2">
                            <span className="text-xs text-gray-400">-</span>
                            <input
                                type="range"
                                min="0.2"
                                max="3"
                                step="0.05"
                                value={cropScale}
                                onChange={e => setCropScale(parseFloat(e.target.value))}
                                className="flex-1 accent-luna-charcoal"
                            />
                            <span className="text-xs text-gray-400">+</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setCropSrc(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                            <button onClick={handleCropConfirm} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-luna-charcoal to-gray-800 text-white text-sm font-medium shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all transition-colors">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
