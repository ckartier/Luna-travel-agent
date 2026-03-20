'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Star, Phone, Mail, Globe, MapPin, Edit3, Save, X, Plus,
    Trash2, Calendar, DollarSign, Users, FileText, Heart, ExternalLink,
    ShieldCheck, Languages, Briefcase, CreditCard, Clock, Activity,
    CalendarDays, TrendingUp, Wallet, Check, AlertCircle, Info, CheckCircle2, Car,
    Camera, ImageIcon
} from 'lucide-react';
import {
    CRMSupplier, CRMPrestation, SupplierCategory, CRMSupplierBooking,
    getSupplierById, updateSupplier, deleteSupplier,
    getPrestationsForSupplier, createPrestation, updatePrestation, deletePrestation,
    getSupplierBookings, createSupplierBooking, updateSupplierBooking
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { storage } from '@/src/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/src/components/ConfirmModal';
import { T } from '@/src/components/T';

const CATEGORIES: { value: SupplierCategory; label: string; emoji: string; color: string; class: string }[] = [
    { value: 'HÉBERGEMENT', label: 'Hébergement', emoji: 'H', color: 'text-indigo-600', class: 'planning-card-hotel shadow-indigo-100/50' },
    { value: 'RESTAURANT', label: 'Restaurant', emoji: 'R', color: 'text-rose-600', class: 'planning-card-dining shadow-rose-100/50' },
    { value: 'ACTIVITÉ', label: 'Activité', emoji: 'A', color: 'text-emerald-600', class: 'planning-card-activity shadow-emerald-100/50' },
    { value: 'CULTURE', label: 'Culture', emoji: 'C', color: 'text-purple-600', class: 'bg-purple-50 text-purple-600 border-purple-100' },
    { value: 'TRANSPORT', label: 'Transport', emoji: 'T', color: 'text-amber-600', class: 'planning-card-transfer shadow-amber-100/50' },
    { value: 'GUIDE', label: 'Guide', emoji: 'G', color: 'text-amber-600', class: 'planning-card-transfer shadow-amber-100/50' },
    { value: 'AUTRE', label: 'Autre', emoji: '•', color: 'text-gray-600', class: 'bg-gray-50 text-gray-600 border-gray-100' },
];

const CLASSIC_LANGUAGES = [
    { code: 'FR', label: 'Français' },
    { code: 'EN', label: 'Anglais' },
    { code: 'ES', label: 'Espagnol' },
    { code: 'IT', label: 'Italien' },
    { code: 'DE', label: 'Allemand' },
    { code: 'ID', label: 'Indonésien' },
    { code: 'ZH', label: 'Chinois' },
    { code: 'JA', label: 'Japonais' },
];

const getCategoryMeta = (cat: SupplierCategory) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[6];

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: supplierId } = use(params);
    const { tenantId } = useAuth();
    const router = useRouter();

    const [supplier, setSupplier] = useState<CRMSupplier | null>(null);
    const [prestations, setPrestations] = useState<CRMPrestation[]>([]);
    const [bookings, setBookings] = useState<CRMSupplierBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'PLANNING' | 'FINANCIAL' | 'HISTORY'>('PROFILE');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<CRMSupplier>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        prestationName: '', date: new Date().toISOString().split('T')[0],
        rate: 0, clientName: '', status: 'CONFIRMED' as CRMSupplierBooking['status'],
        extraFees: 0, notes: ''
    });

    const [sendResult, setSendResult] = useState<{ status: 'success' | 'error', message: string } | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null);

    // Photo crop state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropScale, setCropScale] = useState(1);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);
    const cropImgRef = useRef<HTMLImageElement>(null);
    const [dragging, setDragging] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => { if (tenantId) loadData(); }, [supplierId, tenantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, p, b] = await Promise.all([
                getSupplierById(tenantId!, supplierId),
                getPrestationsForSupplier(tenantId!, supplierId),
                getSupplierBookings(tenantId!, supplierId)
            ]);
            if (s) {
                setSupplier(s);
                setEditData(s);
            }
            setPrestations(p);
            setBookings(b);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSendMission = async (booking: CRMSupplierBooking, channel: 'WHATSAPP' | 'EMAIL') => {
        if (!tenantId || !supplier) return;
        setSendingId(`${booking.id}-${channel}`);
        setSendResult(null);

        const dest = channel === 'EMAIL' ? supplier.email : supplier.phone;
        if (!dest) {
            setSendResult({ status: 'error', message: `Le prestataire n'a pas de ${channel === 'EMAIL' ? 'email' : 'numéro de téléphone'} renseigné.` });
            setSendingId(null);
            return;
        }

        const message = `*Mission Luna CRM*\n\n` +
            `*Service :* ${booking.prestationName}\n` +
            `*Date :* ${format(new Date(booking.date), 'dd MMMM yyyy', { locale: fr })}\n` +
            `*Rémunération :* ${booking.rate + (booking.extraFees || 0)} €\n` +
            `*Client :* ${booking.clientName || 'N/A'}\n\n` +
            `_Merci de confirmer votre disponibilité._`;

        try {
            const endpoint = channel === 'EMAIL' ? '/api/gmail/send' : '/api/whatsapp/send';
            const res = await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: dest,
                    message: message.replace(/\*/g, ''),
                    subject: `Nouvelle Mission : ${booking.prestationName}`,
                    clientName: supplier.name
                })
            });

            const data = await res.json();
            if (res.ok && data.status !== 'failed') {
                setSendResult({ status: 'success', message: `Mission envoyée avec succès via ${channel}` });
                if (booking.status === 'PROPOSED') {
                    await updateSupplierBooking(tenantId, booking.id!, { status: 'CONFIRMED' });
                }
            } else {
                setSendResult({ status: 'error', message: data.error || 'Erreur lors de l’envoi' });
            }
        } catch (e: any) {
            setSendResult({ status: 'error', message: e.message || 'Erreur réseau' });
        }
        setSendingId(null);
        setTimeout(() => setSendResult(null), 5000);
    };

    const handleSave = async () => {
        if (!supplier?.id) return;
        setSaving(true);
        try {
            await updateSupplier(tenantId!, supplier.id, editData);
            setSupplier({ ...supplier, ...editData } as CRMSupplier);
            setEditing(false);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!tenantId || !supplier?.id) return;
        setDeleting(true);
        try {
            await deleteSupplier(tenantId, supplier.id);
            router.push('/crm/suppliers');
        } catch (err) {
            console.error('Delete supplier error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Photo crop handlers
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
        e.target.value = '';
    };

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
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        const scale = cropScale;
        const imgW = img.naturalWidth * scale;
        const imgH = img.naturalHeight * scale;
        const drawX = (size - imgW) / 2 + cropOffset.x;
        const drawY = (size - imgH) / 2 + cropOffset.y;
        ctx.drawImage(img, drawX, drawY, imgW, imgH);
        ctx.restore();
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

    const handleCropConfirm = async () => {
        if (!cropCanvasRef.current || !tenantId || !supplier?.id) return;
        setUploadingPhoto(true);
        try {
            const blob = await new Promise<Blob>((resolve, reject) => {
                cropCanvasRef.current!.toBlob((b) => {
                    if (b) resolve(b); else reject(new Error('Blob fail'));
                }, 'image/jpeg', 0.9);
            });
            setCropSrc(null);
            const storageRef = ref(storage, `suppliers/${tenantId}/${supplier.id}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            await updateSupplier(tenantId, supplier.id, { photoURL: downloadURL });
            setSupplier({ ...supplier, photoURL: downloadURL });
        } catch (err) {
            console.error('Photo upload error:', err);
            setCropSrc(null);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleAddBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingForm.prestationName || !tenantId) return;
        setSaving(true);
        try {
            const bookingId = await createSupplierBooking(tenantId, {
                ...bookingForm,
                supplierId: supplierId,
                prestationId: 'manual'
            });

            // ── AUTO-SEND WHATSAPP TO SUPPLIER ──
            if (supplier?.phone) {
                try {
                    const dateStr = format(new Date(bookingForm.date), 'dd MMMM yyyy', { locale: fr });
                    await fetchWithAuth('/api/whatsapp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: supplier.phone,
                            message: `😊 Bonjour ${supplier.contactName || supplier.name} !\n\nNouvelle mission pour vous 🌟\n\n🎨 *${bookingForm.prestationName}*\n📅 *Date :* ${dateStr}\n💰 *Rémunération :* ${bookingForm.rate + (bookingForm.extraFees || 0)} €\n${bookingForm.clientName ? `👤 *Client :* ${bookingForm.clientName}\n` : ''}\n🙏 Merci de confirmer avec les boutons ci-dessous !\n_✨ Luna CRM - On compte sur vous !_`,
                            recipientType: 'SUPPLIER',
                            clientName: supplier.name,
                            clientId: supplier.id,
                            interactiveButtons: true,
                            bookingId,
                            prestationName: bookingForm.prestationName,
                        })
                    });
                    console.log('[Booking] WhatsApp sent to supplier:', supplier.name);
                } catch (waErr) {
                    console.error('[Booking] WhatsApp auto-send failed:', waErr);
                }
            }

            setShowBookingModal(false);
            setBookingForm({ prestationName: '', date: new Date().toISOString().split('T')[0], rate: 0, clientName: '', status: 'CONFIRMED', extraFees: 0, notes: '' });
            loadData();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const toggleEditLanguage = (code: string) => {
        const current = editData.languages || [];
        const updated = current.includes(code) ? current.filter(l => l !== code) : [...current, code];
        setEditData({ ...editData, languages: updated });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
            <Activity className="animate-spin text-emerald-500" size={40} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Luna Intelligence Syncing...</p>
        </div>
    );

    if (!supplier) return <div className="p-20 text-center text-gray-400"><T>Prestataire introuvable</T></div>;

    const cat = getCategoryMeta(supplier.category);

    // Financial calculations
    const totalToPayToSupplier = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'TERMINATED').reduce((a, b) => a + b.rate + (b.extraFees || 0), 0);
    const totalToReceiveFromClient = prestations.reduce((a, p) => a + (p.clientPrice || 0), 0);
    const netMargin = totalToReceiveFromClient - totalToPayToSupplier;

    return (
        <div className="w-full h-full">
            <div className="max-w-[1600px] mx-auto w-full pb-20">
                {/* ── TOP NAV & ACTIONS ── */}
                <div className="flex justify-between items-center mb-8 px-4 sm:px-0">
                    <button onClick={() => router.push('/crm/suppliers')} className="flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium text-[#5a8fa3] bg-[#bcdeea]/15 border border-[#bcdeea]/30 rounded-xl hover:bg-[#bcdeea]/25 hover:border-[#bcdeea]/50 transition-all group">
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Prestataires
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setEditing(!editing)} className={`px-6 py-3 rounded-2xl border transition-all flex items-center gap-2 transform active:scale-95 ${editing ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-100 text-gray-400 hover:text-luna-charcoal shadow-sm hover:shadow-xl'}`}>
                            {editing ? <X size={18} /> : <Edit3 size={18} />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{editing ? 'Fermer' : 'Modifier'}</span>
                        </button>
                        {!editing && (
                            <button onClick={() => setShowDeleteModal(true)} className="p-3 bg-white border border-gray-100 text-rose-300 hover:text-rose-500 rounded-2xl shadow-sm hover:border-rose-100 transition-all active:scale-95">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MAIN HEADER CARD ── */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 md:p-14 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] mb-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#bcdeea]/10 to-[#bcdeea]/5 rounded-bl-full -z-10" />

                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Visual Identity with Photo Upload */}
                        <div className="relative group mx-auto lg:mx-0">
                            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
                            <div className="w-40 h-40 rounded-[50px] bg-gradient-to-br from-[#bcdeea]/20 to-white border border-[#bcdeea]/30 flex items-center justify-center text-6xl shadow-md overflow-hidden relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {supplier.photoURL ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={supplier.photoURL} alt={supplier.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[#5a8fa3]">{cat.emoji}</span>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    {uploadingPhoto ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Camera size={28} className="text-white drop-shadow-lg" />
                                    )}
                                </div>
                            </div>
                            {supplier.isFavorite && (
                                <div className="absolute -top-3 -right-3 w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                            )}
                            <div className="mt-6 flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <Star key={n} size={14} className={n <= (supplier.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                                    {editing ? (
                                        <input
                                            value={editData.name || ''}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="text-4xl md:text-5xl font-normal text-luna-charcoal tracking-tighter uppercase bg-gray-50 border-none rounded-2xl px-4 py-2 w-full max-w-xl focus:ring-2 focus:ring-emerald-200"
                                            placeholder="Nom du prestataire"
                                        />
                                    ) : (
                                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">{supplier.name}</h1>
                                    )}

                                    {editing ? (
                                        <select
                                            value={editData.category || 'GUIDE'}
                                            onChange={e => setEditData({ ...editData, category: e.target.value as SupplierCategory })}
                                            className="px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gray-200 bg-white outline-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-colors ${cat.class}`}>
                                            {cat.label}
                                        </span>
                                    )}
                                </div>

                                {editing ? (
                                    <div className="flex gap-4">
                                        <input
                                            value={editData.city || ''}
                                            onChange={e => setEditData({ ...editData, city: e.target.value })}
                                            className="px-4 py-2 bg-gray-50 rounded-xl text-sm w-40"
                                            placeholder="Ville"
                                        />
                                        <input
                                            value={editData.country || ''}
                                            onChange={e => setEditData({ ...editData, country: e.target.value })}
                                            className="px-4 py-2 bg-gray-50 rounded-xl text-sm w-40"
                                            placeholder="Pays"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#6B7280] mt-1 font-medium">
                                        <MapPin size={16} className="text-[#5a8fa3]" /> {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4">
                                {editing ? (
                                    <>
                                         <button type="button" onClick={() => setEditData({ ...editData, isGuide: !editData.isGuide })} className={`px-5 py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider border transition-all ${editData.isGuide ? 'bg-[#bcdeea]/20 border-[#bcdeea] text-[#5a8fa3]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>Guide Agent</button>
                                        <button type="button" onClick={() => setEditData({ ...editData, isChauffeur: !editData.isChauffeur })} className={`px-5 py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider border transition-all ${editData.isChauffeur ? 'bg-[#bcdeea]/20 border-[#bcdeea] text-[#5a8fa3]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>Chauffeur Pro</button>
                                        <button type="button" onClick={() => setEditData({ ...editData, hasLicense: !editData.hasLicense })} className={`px-5 py-2 rounded-xl text-[11px] font-medium uppercase tracking-wider border transition-all ${editData.hasLicense ? 'bg-[#bcdeea]/20 border-[#bcdeea] text-[#5a8fa3]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>Licence OK</button>
                                    </>
                                ) : (
                                    <>
                                        {supplier.isGuide && <span className="px-5 py-2 bg-[#bcdeea]/15 text-[#5a8fa3] border border-[#bcdeea]/40 rounded-xl text-[11px] font-medium uppercase tracking-wider flex items-center gap-2"><Briefcase size={12} /> Guide Agent</span>}
                                        {supplier.isChauffeur && <span className="px-5 py-2 bg-[#bcdeea]/15 text-[#5a8fa3] border border-[#bcdeea]/40 rounded-xl text-[11px] font-medium uppercase tracking-wider flex items-center gap-2"><Car size={12} /> Chauffeur Pro</span>}
                                        {supplier.hasLicense && <span className="px-5 py-2 bg-[#bcdeea]/15 text-[#5a8fa3] border border-[#bcdeea]/40 rounded-xl text-[11px] font-medium uppercase tracking-wider flex items-center gap-2"><ShieldCheck size={12} /> Licence OK</span>}
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-lg mx-auto lg:mx-0">
                                {editing ? (
                                    <>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                            <input
                                                value={editData.email || ''}
                                                onChange={e => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm"
                                                placeholder="Email"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                            <input
                                                value={editData.phone || ''}
                                                onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm"
                                                placeholder="WhatsApp"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {supplier.email && <a href={`mailto:${supplier.email}`} className="flex items-center gap-3 px-6 py-4 bg-[#F8FAFC] rounded-xl text-sm text-[#6B7280] font-sans border border-[#E5E7EB] hover:bg-white hover:text-[#5a8fa3] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"><Mail size={16} className="text-[#5a8fa3]" /> {supplier.email}</a>}
                                        {supplier.phone && <a href={`tel:${supplier.phone}`} className="flex items-center gap-3 px-6 py-4 bg-[#F8FAFC] rounded-xl text-sm text-[#6B7280] font-sans border border-[#E5E7EB] hover:bg-white hover:text-[#5a8fa3] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"><Phone size={16} className="text-[#5a8fa3]" /> {supplier.phone}</a>}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financial Quick Summary */}
                        <div className="w-full lg:w-auto flex flex-col gap-4">
                            <div className="p-8 bg-luna-charcoal text-white rounded-2xl text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-[#bcdeea] mb-2">À Payer (Prestations)</p>
                                <p className="text-4xl font-normal tracking-tight">{totalToPayToSupplier.toLocaleString('fr-FR')} €</p>
                                <div className="mt-4 w-full h-[1px] bg-white/10" />
                                <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mt-4 mb-2">Marge Nette Associée</p>
                                <p className="text-2xl font-normal tracking-tight text-[#bcdeea]">+{netMargin.toLocaleString('fr-FR')} €</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TABS NAVIGATION ── */}
                <div className="flex gap-3 mb-10 overflow-x-auto pb-6 px-4 no-scrollbar">
                    {[
                        { id: 'PROFILE', label: 'Profil & Langues', icon: Users },
                        { id: 'PLANNING', label: 'Planning & Frais', icon: CalendarDays },
                        { id: 'FINANCIAL', label: 'Compte & Paye', icon: Wallet },
                        { id: 'HISTORY', label: 'Services Catalogue', icon: Briefcase },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-8 py-4 rounded-xl text-[11px] font-medium uppercase tracking-wider flex items-center gap-3 transition-all border whitespace-nowrap active:scale-[0.98] ${activeTab === tab.id ? 'bg-[#bcdeea]/20 text-[#2E2E2E] border-[#bcdeea]/40 shadow-sm' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#bcdeea] hover:text-[#2E2E2E]'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB CONTENT ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'PROFILE' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
                            {/* Profile Info */}
                            <div className="lg:col-span-2 bg-white rounded-[50px] border border-gray-50 p-10 md:p-14 space-y-12 shadow-sm">
                                <section>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-50 pb-4 flex items-center gap-2"><Languages size={14} /> Langues & Compétences</h3>

                                    {editing ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {CLASSIC_LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => toggleEditLanguage(lang.code)}
                                                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${editData.languages?.includes(lang.code) ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${editData.languages?.includes(lang.code) ? 'bg-white text-emerald-500 border-white' : 'border-gray-200 group-hover:border-emerald-300'}`}>
                                                        {editData.languages?.includes(lang.code) && <Check size={14} />}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{lang.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {supplier.languages?.map(l => (
                                                <div key={l} className="px-6 py-4 bg-indigo-50/50 text-indigo-600 rounded-3xl border border-indigo-100 flex items-center gap-3 text-sm font-bold">
                                                    <Check size={16} className="text-indigo-400" />
                                                    {CLASSIC_LANGUAGES.find(cl => cl.code === l)?.label || l}
                                                </div>
                                            )) || <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune langue enregistrée.</p>}
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-50 pb-4 flex items-center gap-2"><ShieldCheck size={14} /> Validation & Légal</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Licence Professionnelle</p>
                                            {editing ? (
                                                <input
                                                    value={editData.professionalLicense || ''}
                                                    onChange={e => setEditData({ ...editData, professionalLicense: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white rounded-xl text-sm"
                                                    placeholder="N° Licence..."
                                                />
                                            ) : (
                                                <p className="text-sm font-bold text-luna-charcoal uppercase">{supplier.professionalLicense || "Non renseigné"}</p>
                                            )}
                                        </div>
                                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Commission Entendu (%)</p>
                                            {editing ? (
                                                <input
                                                    type="number"
                                                    value={editData.commission || 0}
                                                    onChange={e => setEditData({ ...editData, commission: +e.target.value })}
                                                    className="w-full px-4 py-2 bg-white rounded-xl text-sm"
                                                />
                                            ) : (
                                                <p className="text-sm font-bold text-luna-charcoal uppercase">{supplier.commission || 0} % par mission</p>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Bio & Internal Notes */}
                            <div className="bg-luna-charcoal rounded-[50px] p-12 text-white relative flex flex-col justify-between shadow-2xl overflow-hidden min-h-[400px]">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 text-white"><FileText size={150} /></div>
                                <div className="space-y-8 relative z-10">
                                    <section>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-4 flex items-center gap-2"><Info size={14} /> Intelligence Interne</p>
                                        {editing ? (
                                            <textarea
                                                value={editData.notes || ''}
                                                onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:ring-2 focus:ring-emerald-400 outline-none min-h-[150px] mt-4"
                                                placeholder="Notes internes, détails tactiques..."
                                            />
                                        ) : (
                                            <p className="text-xl font-normal leading-relaxed text-white/80 italic mt-4">
                                                {supplier.notes || "Aucune note interne renseignée pour ce prestataire."}
                                            </p>
                                        )}
                                    </section>
                                    {editing ? (
                                        <div className="pt-6">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">Tags (séparés par une virgule)</label>
                                            <input
                                                value={(editData.tags || []).join(', ')}
                                                onChange={e => setEditData({ ...editData, tags: e.target.value.split(',').map(t => t.trim()) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                                                placeholder="Expert, Francophone, Luxe..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="pt-10 flex flex-wrap gap-2 relative z-10">
                                            {supplier.tags?.map((t, i) => (
                                                <span key={i} className="px-5 py-2 bg-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-white/5">{t}</span>
                                            ))}
                                            {!supplier.tags?.length && <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Aucun Tag associé</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'PLANNING' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 px-4 sm:px-0">
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm gap-6">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-lg font-normal text-luna-charcoal uppercase tracking-tighter">Agenda des Prestations</h3>
                                    <p className="text-xs text-gray-400 font-sans mt-1">Gérez le planning et les frais additionnels en temps réel.</p>
                                </div>
                                <button onClick={() => setShowBookingModal(true)} className="px-8 py-4 bg-emerald-500 text-white rounded-[24px] text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2 transform active:scale-95">
                                    <Plus size={16} /> Nouvelle Mission
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {bookings.map((b, i) => (
                                    <div key={i} className="bg-white p-10 rounded-[50px] border border-gray-50 hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-50/50 transition-all flex flex-col lg:flex-row justify-between items-center gap-10 group relative">
                                        <div className="flex items-center gap-8 text-center lg:text-left">
                                            <div className="w-20 h-20 rounded-[32px] bg-gray-50/80 group-hover:bg-emerald-50 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 transition-colors duration-500">
                                                <CalendarDays size={32} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-emerald-500 uppercase mb-2 tracking-widest">{format(new Date(b.date), 'EEEE dd MMMM yyyy', { locale: fr })}</p>
                                                <h4 className="text-2xl font-normal text-luna-charcoal uppercase tracking-tight leading-none mb-2">{b.prestationName}</h4>
                                                <div className="flex items-center gap-3 justify-center lg:justify-start">
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-sans bg-gray-50 px-3 py-1 rounded-full"><Users size={12} /> {b.clientName || 'Libre'}</span>
                                                    {b.extraFees ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest"><AlertCircle size={10} /> Frais: +{b.extraFees} €</span> : null}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12 w-full lg:w-auto justify-center lg:justify-end">
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                                                <span className={`px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${b.status === 'CONFIRMED' || b.status === 'TERMINATED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {b.status === 'CONFIRMED' ? 'Confirmé' : b.status === 'TERMINATED' ? 'Terminé' : 'Option'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rémunération Pro</p>
                                                <p className="text-2xl font-bold text-luna-charcoal leading-none">{(b.rate + (b.extraFees || 0)).toLocaleString('fr-FR')} €</p>
                                                <p className="text-[9px] text-gray-300 uppercase mt-1">Base: {b.rate}€ / Frais: {b.extraFees || 0}€</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSendMission(b, 'WHATSAPP')}
                                                    disabled={!!sendingId}
                                                    className="w-10 h-10 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all"
                                                    title="Envoyer via WhatsApp"
                                                >
                                                    {sendingId === `${b.id}-WHATSAPP` ? <Activity size={16} className="animate-spin" /> : <Phone size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleSendMission(b, 'EMAIL')}
                                                    disabled={!!sendingId}
                                                    className="w-10 h-10 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-all"
                                                    title="Envoyer via Email"
                                                >
                                                    {sendingId === `${b.id}-EMAIL` ? <Activity size={16} className="animate-spin" /> : <Mail size={16} />}
                                                </button>
                                                <button className="hidden lg:flex w-10 h-10 rounded-xl border border-gray-100 items-center justify-center text-gray-200 hover:text-[#5a8fa3] transition-all">
                                                    <ArrowLeft size={20} className="rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {bookings.length === 0 && (
                                    <div className="py-24 text-center bg-gray-50/50 rounded-[60px] border border-dashed border-gray-100">
                                        <CalendarDays size={64} className="mx-auto text-gray-200 mb-6" />
                                        <h4 className="text-lg font-normal text-gray-400 uppercase mb-2">Planning Vierge</h4>
                                        <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune mission n'a été planifiée pour {supplier.name}.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'FINANCIAL' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 px-4 sm:px-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Detailed Balance Card */}
                                <div className="bg-luna-charcoal rounded-[60px] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute bottom-0 left-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:scale-[2]"><TrendingUp size={150} /></div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-12 border-b border-white/5 pb-6">Solde des Engagements</h3>

                                    <div className="space-y-12 relative z-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest flex items-center gap-2"><CreditCard size={14} /> Total Dû au Prestataire</p>
                                            <p className="text-7xl font-normal tracking-tighter leading-none">{totalToPayToSupplier.toLocaleString('fr-FR')} €</p>
                                            <p className="text-xs text-white/40 font-sans pt-4 leading-relaxed">Incluant les tarifs de base contractuels ({bookings.reduce((a, b) => a + b.rate, 0)}€) et les frais exceptionnels ({bookings.reduce((a, b) => a + (b.extraFees || 0), 0)}€).</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2">CA Généré (Vente)</p>
                                                <p className="text-2xl font-normal text-white">{totalToReceiveFromClient.toLocaleString('fr-FR')} €</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-widest mb-2">Marge Brute</p>
                                                <p className="text-2xl font-normal text-emerald-400">{netMargin.toLocaleString('fr-FR')} €</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details & Paye */}
                                <div className="bg-white rounded-[60px] border border-gray-50 p-12 md:p-16 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-12 border-b border-gray-50 pb-6 flex items-center gap-2"><Wallet size={14} /> Règlement & Trésorerie</h3>
                                        <div className="space-y-10">
                                            <div className="p-10 bg-gray-50/50 rounded-[40px] border border-gray-100 group hover:border-emerald-200 transition-all">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">IBAN / SWIFT de destination</p>
                                                <p className="text-lg font-mono text-luna-charcoal leading-relaxed break-all">
                                                    {supplier.bankDetails ? supplier.bankDetails.match(/.{1,4}/g)?.join(' ') : "Aucun RIB enregistré."}
                                                </p>
                                                {editing && (
                                                    <div className="mt-6">
                                                        <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block mb-2">Modifier les coordonnées</label>
                                                        <input value={editData.bankDetails || ''} onChange={e => setEditData({ ...editData, bankDetails: e.target.value })} className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-mono" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 mt-10">
                                        <div className="flex-1 p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50 text-center">
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Devise</p>
                                            <p className="text-3xl font-normal text-emerald-600">{supplier.currency || 'EUR'}</p>
                                        </div>
                                        <div className="flex-1 p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50 text-center">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Relances</p>
                                            <p className="text-3xl font-normal text-indigo-600">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Données Croisées Section */}
                            <div className="bg-white rounded-[60px] border border-gray-50 p-12 md:p-16 shadow-sm">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-12 border-b border-gray-50 pb-6 flex items-center gap-2"><Activity size={14} /> Indicateurs de Performance (Données Croisées)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Taux de Marge Moyen</p>
                                        <p className="text-4xl font-light text-[#2E2E2E] tracking-tight">{totalToReceiveFromClient > 0 ? ((netMargin / totalToReceiveFromClient) * 100).toFixed(1) : 0}%</p>
                                        <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (netMargin / (totalToReceiveFromClient || 1)) * 100)}%` }} />
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Index de Fiabilité</p>
                                        <p className="text-3xl font-normal text-indigo-600">A+</p>
                                        <p className="text-[9px] text-gray-300 font-bold uppercase mt-2 tracking-tighter">Calculé sur {bookings.length} missions</p>
                                    </div>
                                    <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Coût Moyen / Mission</p>
                                        <p className="text-4xl font-light text-[#2E2E2E] tracking-tight">{bookings.length > 0 ? (totalToPayToSupplier / bookings.length).toFixed(0) : 0} €</p>
                                    </div>
                                    <div className="p-8 bg-emerald-50 text-emerald-700 rounded-[32px] border border-emerald-100 flex flex-col justify-center items-center text-center">
                                        <CheckCircle2 size={32} className="mb-4 text-emerald-500" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Statut Financier</p>
                                        <p className="text-xs font-bold uppercase mt-1">Excellent Rentabilité</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'HISTORY' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-4 sm:px-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {prestations.map((p, i) => (
                                    <div key={i} className="bg-white p-10 rounded-[50px] border border-gray-50 hover:border-emerald-100 hover:shadow-2xl transition-all group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-300 group-hover:text-emerald-500 transition-colors scale-150 rotate-12"><Briefcase size={60} /></div>
                                        <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center text-gray-300 mb-8 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors duration-500">
                                            <Activity size={28} />
                                        </div>
                                        <h4 className="text-xl font-normal text-luna-charcoal uppercase leading-tight mb-8 group-hover:text-emerald-600 transition-colors">{p.description || p.name}</h4>
                                        <div className="flex justify-between items-end border-t border-gray-50 pt-8 mt-auto">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prix de Vente Client</p>
                                                <p className="text-2xl font-bold text-luna-charcoal">{(p.clientPrice || 0).toLocaleString('fr-FR')} €</p>
                                            </div>
                                            <button className="p-4 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all transform active:scale-95">
                                                <ExternalLink size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {prestations.length === 0 && (
                                    <div className="lg:col-span-3 py-24 text-center bg-gray-50/50 rounded-[60px] border border-dashed border-gray-100">
                                        <Briefcase size={64} className="mx-auto text-gray-200 mb-6" />
                                        <h4 className="text-lg font-normal text-gray-400 uppercase mb-2">Catalogue Vide</h4>
                                        <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune prestation de votre catalogue n'est liée à ce fournisseur.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── MODAL: NEW MISSION with Extra Fees ── */}
                <AnimatePresence>
                    {showBookingModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/40 backdrop-blur-md" onClick={() => setShowBookingModal(false)} />
                            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className="bg-white rounded-[60px] w-full max-w-xl relative z-10 shadow-2xl p-12 md:p-16 overflow-hidden">
                                <h2 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Affectation Mission</T></h2>
                                <form onSubmit={handleAddBooking} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type de Service / Mission</label>
                                        <input value={bookingForm.prestationName} onChange={e => setBookingForm({ ...bookingForm, prestationName: e.target.value })} className="w-full px-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" placeholder="Ex: Accompagnateur Local Francophone" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</label>
                                            <input type="date" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} className="w-full px-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tarif Base (€)</label>
                                            <input type="number" value={bookingForm.rate} onChange={e => setBookingForm({ ...bookingForm, rate: +e.target.value })} className="w-full px-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Frais en plus (€)</label>
                                            <input type="number" value={bookingForm.extraFees} onChange={e => setBookingForm({ ...bookingForm, extraFees: +e.target.value })} className="w-full px-6 py-5 bg-amber-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all font-sans" placeholder="Parking, pourboires..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</label>
                                            <input value={bookingForm.clientName} onChange={e => setBookingForm({ ...bookingForm, clientName: e.target.value })} className="w-full px-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans" placeholder="Nom..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes de mission</label>
                                        <textarea value={bookingForm.notes} onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })} className="w-full px-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-emerald-200 h-28 font-sans" placeholder="Précisions pour le prestataire..." />
                                    </div>
                                    <div className="pt-8 flex gap-6">
                                        <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-[28px] font-bold uppercase tracking-widest text-[10px]"><T>Annuler</T></button>
                                        <button type="submit" className="flex-[2] py-5 bg-luna-charcoal text-white rounded-[28px] font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-black transition-all">Valider la Mission</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── SAVE ACTION OVERLAY ── */}
                <AnimatePresence>
                    {editing && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] w-full max-w-2xl px-4"
                        >
                            <div className="bg-luna-charcoal text-white rounded-[40px] p-6 md:p-8 shadow-2xl flex items-center justify-between gap-10 border border-white/10 backdrop-blur-3xl">
                                <div className="hidden sm:block">
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Luna Executive Sync</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Synchronisation prête</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <button onClick={() => { setEditing(false); setEditData(supplier); }} className="btn-expert btn-expert-glass !py-3 !px-6 border-white/10 text-white hover:bg-white/10">Abandonner</button>
                                    <button onClick={handleSave} disabled={saving} className="btn-expert btn-expert-orange !py-3 !px-8 shadow-2xl overflow-hidden">
                                        {saving ? 'Transmission...' : 'Enregistrer la Fiche'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Notifications */}
                <AnimatePresence>
                    {sendResult && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="fixed top-10 right-10 z-[200] w-full max-w-sm"
                        >
                            <div className={`p-6 rounded-[32px] shadow-2xl backdrop-blur-xl border ${sendResult.status === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                        {sendResult.status === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold uppercase tracking-widest mb-1">{sendResult.status === 'success' ? 'Synchronisation stable' : 'Erreur API'}</p>
                                        <p className="text-sm font-normal opacity-90 leading-tight">
                                            {sendResult.message.includes('Error validating access token')
                                                ? "Token WhatsApp expiré. Veuillez le renouveler dans la console Meta Cloud API."
                                                : sendResult.message}
                                        </p>
                                    </div>
                                    <button onClick={() => setSendResult(null)} className="text-white/50 hover:text-white"><X size={18} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ConfirmModal
                    open={showDeleteModal}
                    title="Supprimer ce prestataire ?"
                    message={`${supplier.name} sera supprimé définitivement ainsi que toutes ses données associées.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    loading={deleting}
                />

                {/* ── CROP MODAL ── */}
                {cropSrc && (
                    <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[20px] w-full max-w-sm shadow-[0_8px_30px_rgba(0,0,0,0.07)] overflow-hidden">
                            <div className="p-6 pb-4 bg-luna-charcoal text-white text-center">
                                <h3 className="text-base font-light tracking-tight">Recadrer la photo</h3>
                                <p className="text-[#bcdeea] text-xs mt-1 font-medium">Ajustez le cadrage avec la souris</p>
                            </div>
                            <div className="p-6">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img ref={cropImgRef} src={cropSrc} alt="crop" className="hidden" onLoad={() => {
                                    setImgLoaded(true);
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
                                        className="rounded-full cursor-move border-4 border-[#E5E7EB] shadow-md"
                                        style={{ width: 200, height: 200 }}
                                        onMouseDown={handleCropMouseDown}
                                        onMouseMove={handleCropMouseMove}
                                        onMouseUp={handleCropMouseUp}
                                        onMouseLeave={handleCropMouseUp}
                                    />
                                </div>
                                <div className="flex items-center gap-3 mb-5 px-2">
                                    <span className="text-xs text-[#6B7280]">-</span>
                                    <input type="range" min="0.2" max="3" step="0.05" value={cropScale} onChange={e => setCropScale(parseFloat(e.target.value))} className="flex-1 accent-luna-charcoal" />
                                    <span className="text-xs text-[#6B7280]">+</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setCropSrc(null)} className="flex-1 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-sm font-normal text-[#6B7280] hover:bg-gray-100 transition-all">Annuler</button>
                                    <button onClick={handleCropConfirm} className="flex-1 px-4 py-3 rounded-xl bg-luna-charcoal hover:bg-gray-800 text-white text-sm font-normal transition-all"><T>Enregistrer</T></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
