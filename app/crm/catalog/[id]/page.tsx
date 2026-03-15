'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, ArrowRight, Edit3, Save, X, Trash2, Heart, Star, Send, Copy, Check, Download,
    Hotel, Plane, MapPin, Car, UtensilsCrossed, Camera, DollarSign, Upload, Eye, Maximize2,
    Phone, Mail, Globe, User, ExternalLink, Share2, FileText, Sparkles, MessageCircle, Search, Loader2, Calendar, Clock, Plus, AlertCircle, ChevronRight, Filter
} from 'lucide-react';
import SupplierPicker from '@/src/components/crm/SupplierPicker';
import { SupplierCategory } from '@/src/lib/firebase/crm';
import {
    CRMCatalogItem, CRMContact, CRMSupplier, CRMSupplierBooking,
    getCatalogItems, updateCatalogItem, deleteCatalogItem, getContacts, getSuppliers,
    createSupplierBooking, getSupplierBookings, updateSupplierBooking
} from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useLogo } from '@/src/hooks/useSiteConfig';

const TYPES = [
    { value: 'HOTEL', label: 'Hôtel', icon: Hotel, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', gradient: 'from-indigo-500 to-violet-500' },
    { value: 'FLIGHT', label: 'Vol', icon: Plane, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-emerald-500 to-cyan-500' },
    { value: 'ACTIVITY', label: 'Activité', icon: MapPin, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', gradient: 'from-emerald-500 to-teal-500' },
    { value: 'TRANSFER', label: 'Transfert', icon: Car, color: 'bg-orange-50 text-orange-600 border-orange-200', gradient: 'from-orange-500 to-amber-500' },
    { value: 'OTHER', label: 'Autre', icon: UtensilsCrossed, color: 'bg-rose-50 text-rose-600 border-rose-200', gradient: 'from-rose-500 to-pink-500' },
] as const;

const SUPPLIER_CATS: { value: SupplierCategory | 'ALL' | 'LUNA_FRIENDS'; label: string; emoji: string }[] = [
    { value: 'ALL', label: 'Tous', emoji: '•' },
    { value: 'LUNA_FRIENDS', label: 'Luna Friends', emoji: 'L' },
    { value: 'HÉBERGEMENT', label: 'Hébergement', emoji: 'H' },
    { value: 'RESTAURANT', label: 'Restaurant', emoji: 'R' },
    { value: 'ACTIVITÉ', label: 'Activité', emoji: 'A' },
    { value: 'CULTURE', label: 'Culture', emoji: 'C' },
    { value: 'TRANSPORT', label: 'Transport', emoji: 'T' },
    { value: 'GUIDE', label: 'Guide', emoji: 'G' },
    { value: 'AUTRE', label: 'Autre', emoji: '•' },
];

const getTypeConfig = (t: string) => TYPES.find(tp => tp.value === t) || TYPES[4];

export default function PrestationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { tenantId } = useAuth();
    const router = useRouter();
    const logo = useLogo();

    // Core state
    const [item, setItem] = useState<CRMCatalogItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<CRMCatalogItem>>({});
    const [photoURLs, setPhotoURLs] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [aiImagePrompt, setAiImagePrompt] = useState('');
    const [generatingAiImage, setGeneratingAiImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Crop state
    const [cropImage, setCropImage] = useState<{ src: string; index: number } | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropAspect, setCropAspect] = useState(4 / 3);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Data lists
    const [suppliers, setSuppliers] = useState<CRMSupplier[]>([]);
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [bookings, setBookings] = useState<CRMSupplierBooking[]>([]);
    const [linkedSupplier, setLinkedSupplier] = useState<CRMSupplier | null>(null);

    // Modals & UI state
    const [showSendModal, setShowSendModal] = useState<{ channel: 'EMAIL' | 'WHATSAPP', target: 'CLIENT' | 'PRESTATAIRE' } | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const [searchContact, setSearchContact] = useState('');
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
    const [supplierFilterCat, setSupplierFilterCat] = useState<SupplierCategory | 'ALL' | 'LUNA_FRIENDS'>('ALL');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<CRMSupplier | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ status: 'success' | 'error', message: string } | null>(null);

    // AI Suggestion state
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [aiAlternatives, setAiAlternatives] = useState<string[]>([]);
    const [aiAltIndex, setAiAltIndex] = useState(0);
    const [aiField, setAiField] = useState<string>('description');

    const handleAISuggest = async (field: string = 'description') => {
        if (aiSuggesting) return;
        setAiField(field);
        setAiSuggesting(true);
        setAiSuggestion(null);
        setAiAlternatives([]);
        setAiAltIndex(0);
        try {
            const res = await fetchWithAuth('/api/ai/suggest-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'prestation',
                    field,
                    context: {
                        name: editData.name || item?.name || '',
                        type: editData.type || item?.type || 'OTHER',
                        location: editData.location || item?.location || '',
                        netCost: editData.netCost ?? item?.netCost ?? 0,
                    },
                }),
            });
            const data = await res.json();
            if (data.suggestion) {
                setAiSuggestion(data.suggestion);
                setAiAlternatives(data.alternatives || []);
            }
        } catch (e) {
            console.error('[AI Suggest] Error:', e);
        }
        setAiSuggesting(false);
    };

    const acceptAISuggestion = () => {
        if (!aiSuggestion) return;
        if (aiField === 'description') {
            setEditData({ ...editData, description: aiSuggestion });
        }
        setAiSuggestion(null);
        setAiAlternatives([]);
    };

    const cycleAIAlternative = () => {
        if (aiAlternatives.length === 0) return;
        const nextIdx = (aiAltIndex + 1) % (aiAlternatives.length + 1);
        setAiAltIndex(nextIdx);
        if (nextIdx === 0) {
            // Back to main suggestion - we need the original
            // handleAISuggest already stores it
        } else {
            setAiSuggestion(aiAlternatives[nextIdx - 1]);
        }
    };

    // New booking form
    const [newBooking, setNewBooking] = useState<Partial<CRMSupplierBooking>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '12:00',
        status: 'PROPOSED',
        rate: 0
    });

    useEffect(() => { if (tenantId) { loadItem(); loadSuppliers(); loadContacts(); } }, [tenantId, id]);

    const loadItem = async () => {
        setLoading(true);
        try {
            const all = await getCatalogItems(tenantId!);
            const found = all.find(i => i.id === id);
            if (found) {
                setItem(found);
                setEditData(found);
                setPhotoURLs(found.images || []);
                if (found.supplierId) {
                    const sup = await getSuppliers(tenantId!);
                    const linked = sup.find(s => s.id === found.supplierId);
                    if (linked) setLinkedSupplier(linked);

                    const booked = await getSupplierBookings(tenantId!, found.supplierId);
                    setBookings(booked.filter(b => b.prestationId === id));
                }
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadSuppliers = async () => {
        if (!tenantId) return;
        try { setSuppliers(await getSuppliers(tenantId)); } catch (e) { console.error(e); }
    };

    const loadContacts = async () => {
        if (!tenantId) return;
        try { setContacts(await getContacts(tenantId)); } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!item?.id || !tenantId) return;
        setSaving(true);
        try {
            // Only send clean, editable fields — strip Firestore system fields & undefined values
            const cleanData: Record<string, any> = {
                name: editData.name || item.name,
                description: editData.description || '',
                type: editData.type || item.type,
                location: editData.location || '',
                netCost: editData.netCost ?? item.netCost,
                recommendedMarkup: editData.recommendedMarkup ?? item.recommendedMarkup,
                currency: editData.currency || 'EUR',
            };
            // Photos: always use photoURLs state (gallery manages this)
            cleanData.images = photoURLs.length > 0 ? photoURLs : (item.images || []);
            // Legacy imageUrl: set to first photo if available
            if (photoURLs.length > 0) cleanData.imageUrl = photoURLs[0];
            // Supplier link (optional, can be empty string)
            if (editData.supplierId !== undefined) cleanData.supplierId = editData.supplierId || '';

            try {
                // 🤖 GENERATE GEMINI EMBEDDING ON UPDATE 🤖
                const embedReq = await fetch('/api/ai/embed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `${cleanData.name || ''}\n${cleanData.description || ''}\n${cleanData.location || ''}\n${cleanData.type || ''}`,
                        imageBase64s: (cleanData.images || []).slice(0, 3)
                    })
                });
                if (embedReq.ok) {
                    const { embedding } = await embedReq.json();
                    if (embedding) {
                        cleanData.embedding = embedding;
                    }
                } else {
                    console.warn("Failed to generate embedding for updated item");
                }
            } catch (e) {
                console.error("Embedding update error:", e);
            }

            await updateCatalogItem(tenantId, item.id, cleanData);
            setItem({ ...item, ...cleanData } as CRMCatalogItem);
            setEditing(false);
            if (cleanData.supplierId) {
                const sup = suppliers.find(s => s.id === cleanData.supplierId);
                if (sup) setLinkedSupplier(sup);
            }
        } catch (e: any) {
            console.error('[Save Error]', e);
            alert('Erreur de sauvegarde : ' + (e.message || 'Vérifiez la console'));
        }
        setSaving(false);
    };

    // ── CROP HELPERS ──
    const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = pixelCrop.width;
                canvas.height = pixelCrop.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No canvas context');
                ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
                resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            image.onerror = reject;
            image.src = imageSrc;
        });
    };

    const applyCrop = async () => {
        if (!cropImage || !croppedAreaPixels) return;
        try {
            const croppedUrl = await getCroppedImg(cropImage.src, croppedAreaPixels);
            const updated = [...photoURLs];
            updated[cropImage.index] = croppedUrl;
            setPhotoURLs(updated);
            setCropImage(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (e) {
            console.error('Crop error:', e);
        }
    };

    const handleCreateBooking = async (): Promise<CRMSupplierBooking | null> => {
        if (!tenantId || !item || !item.supplierId) {
            setBookingSuccess('Aucun prestataire lié');
            setTimeout(() => setBookingSuccess(null), 3000);
            return null;
        }
        setBookingLoading(true);
        try {
            const bookingData: any = {
                supplierId: item.supplierId,
                prestationId: item.id!,
                prestationName: item.name,
                date: newBooking.date!,
                startTime: newBooking.startTime || '09:00',
                endTime: newBooking.endTime || '12:00',
                status: (newBooking.status as any) || 'PROPOSED',
                rate: newBooking.rate || item.netCost,
                extraFees: 0,
            };
            // Only add optional fields if they have actual values (Firebase rejects undefined)
            if (newBooking.notes) bookingData.notes = newBooking.notes;
            if (newBooking.pickupLocation) bookingData.pickupLocation = newBooking.pickupLocation;
            if (newBooking.numberOfGuests) bookingData.numberOfGuests = newBooking.numberOfGuests;
            // Transport: Outbound / Return fields
            if (newBooking.outboundLocation) bookingData.outboundLocation = newBooking.outboundLocation;
            if (newBooking.outboundDestination) bookingData.outboundDestination = newBooking.outboundDestination;
            if (newBooking.outboundTime) bookingData.outboundTime = newBooking.outboundTime;
            if (newBooking.returnEnabled) {
                bookingData.returnEnabled = true;
                if (newBooking.returnLocation) bookingData.returnLocation = newBooking.returnLocation;
                if (newBooking.returnDestination) bookingData.returnDestination = newBooking.returnDestination;
                if (newBooking.returnTime) bookingData.returnTime = newBooking.returnTime;
            }
            if (item.pricingMode) bookingData.pricingMode = item.pricingMode;
            if (selectedContact?.id) {
                bookingData.clientId = selectedContact.id;
                bookingData.clientName = `${selectedContact.firstName} ${selectedContact.lastName}`;
            }

            const newId = await createSupplierBooking(tenantId, bookingData);
            console.log('[Booking] Created with ID:', newId);
            setBookingSuccess('Réservation créée !');

            // Try to reload bookings list — may fail if Firebase index missing (non-blocking)
            try {
                const booked = await getSupplierBookings(tenantId, item.supplierId);
                setBookings(booked.filter(b => b.prestationId === id));
            } catch (reloadErr) {
                console.warn('[Booking] Reload failed (missing index?), but booking was created:', reloadErr);
            }

            // Reset form
            setNewBooking({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '12:00', status: 'PROPOSED', rate: item.netCost });
            setSelectedContact(null);
            setTimeout(() => {
                setShowBookingModal(false);
                setBookingSuccess(null);
            }, 1500);
            // Return the created booking with ID
            return { ...bookingData, id: newId, createdAt: new Date() } as CRMSupplierBooking;
        } catch (e) {
            console.error('[Booking] Error:', e);
            setBookingSuccess('Erreur de création');
            setTimeout(() => setBookingSuccess(null), 3000);
            return null;
        } finally {
            setBookingLoading(false);
        }
    };

    const getFormattedMessage = (isRich = false, target: 'CLIENT' | 'PRESTATAIRE' = 'CLIENT') => {
        if (!item) return "";
        const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));

        // Get latest booking info for dates/times
        const latestBooking = bookings.length > 0 ? bookings[0] : null;
        const bookingDate = latestBooking?.date
            ? new Date(latestBooking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : null;
        const bookingTime = latestBooking?.startTime
            ? `${latestBooking.startTime}${latestBooking.endTime ? ' - ' + latestBooking.endTime : ''}`
            : null;
        const clientName = latestBooking?.clientName || '';

        if (target === 'PRESTATAIRE') {
            const dateBlock = bookingDate ? `\n*Date :* ${bookingDate}` : '';
            const timeBlock = bookingTime ? `\n*Horaire :* ${bookingTime}` : '';
            const clientBlock = clientName ? `\n*Client :* ${clientName}` : '';
            const dateBlockHtml = bookingDate ? `<br/><b>Date :</b> ${bookingDate}` : '';
            const timeBlockHtml = bookingTime ? `<br/><b>Horaire :</b> ${bookingTime}` : '';
            const clientBlockHtml = clientName ? `<br/><b>Client :</b> ${clientName}` : '';

            if (isRich) {
                return `<b>Bonjour ! On aurait besoin de vous</b><br/><br/><b>Service :</b> ${item.name}<br/><b>Lieu :</b> ${item.location}${dateBlockHtml}${timeBlockHtml}${clientBlockHtml}<br/><b>Détails :</b> ${item.description}<br/><br/><b>Tarif convenu :</b> ${item.netCost.toLocaleString('fr-FR')} €<br/><br/>Merci de nous confirmer votre disponibilité !<br/><i>Luna CRM - À très vite !</i>`;
            }
            return `Bonjour ! On aurait besoin de vous\n\n*Service :* ${item.name}\n*Lieu :* ${item.location}${dateBlock}${timeBlock}${clientBlock}\n*Détails :* ${item.description}\n\n*Tarif convenu :* ${item.netCost.toLocaleString('fr-FR')} €\n\nMerci de nous confirmer votre disponibilité !\n_Luna CRM - À très vite !_`;
        }

        // CLIENT message
        const dateBlockClient = bookingDate ? `\n*Date :* ${bookingDate}` : '';
        const timeBlockClient = bookingTime ? `\n*Horaire :* ${bookingTime}` : '';
        const dateBlockClientHtml = bookingDate ? `<br/><b>Date :</b> ${bookingDate}` : '';
        const timeBlockClientHtml = bookingTime ? `<br/><b>Horaire :</b> ${bookingTime}` : '';

        if (isRich) {
            return `<b>Une expérience rien que pour vous</b><br/><br/><b>${item.name}</b><br/><b>Lieu :</b> ${item.location}${dateBlockClientHtml}${timeBlockClientHtml}<br/>${item.description}<br/><br/><b>Tarif :</b> ${clientPrice.toLocaleString('fr-FR')} €<br/><br/><i>Proposé avec amour par Lune DMC</i>`;
        }
        return `*Une expérience rien que pour vous*\n\n*${item.name}*\n*Lieu :* ${item.location}${dateBlockClient}${timeBlockClient}\n${item.description}\n\n*Tarif :* ${clientPrice.toLocaleString('fr-FR')} €\n\n_Proposé avec amour par Lune DMC_`;
    };

    const handleSendToTarget = async () => {
        if (!item || !showSendModal || !tenantId) return;

        const { channel, target } = showSendModal;
        const recipient = target === 'CLIENT' ? selectedContact : selectedSupplier;
        if (!recipient) return;

        setIsSending(true);
        setSendResult(null);

        const endpoint = channel === 'EMAIL' ? '/api/gmail/send' : '/api/whatsapp/send';

        try {
            const dest = channel === 'EMAIL'
                ? (recipient as any).email
                : ((recipient as any).phone || '');

            if (!dest) throw new Error("Aucune destination (email ou téléphone) trouvée.");

            const payload: any = {
                to: dest,
                clientId: recipient.id,
                clientName: target === 'CLIENT'
                    ? `${(recipient as CRMContact).firstName} ${(recipient as CRMContact).lastName}`
                    : (recipient as CRMSupplier).name,
                message: getFormattedMessage(false, target).replace(/\*/g, ''),
                subject: target === 'CLIENT' ? `\u2728 Proposition : ${item.name}` : `\ud83d\udce9 Sync Prestation : ${item.name}`,
                bodyHtml: channel === 'EMAIL' ? getFormattedMessage(true, target) : undefined,
                recipientType: target === 'CLIENT' ? 'CLIENT' : 'SUPPLIER',
            };

            // For WhatsApp to suppliers: send interactive buttons
            if (channel === 'WHATSAPP' && target === 'PRESTATAIRE') {
                payload.interactiveButtons = true;
                payload.prestationName = item.name;
            }

            const res = await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.status !== 'failed') {
                setSendResult({ status: 'success', message: `Envoyé avec succès via ${channel}` });

                // Si c'est un prestataire et qu'on a un supplierId, on peut créer un "PROPOSED" booking
                if (target === 'PRESTATAIRE' && item.supplierId) {
                    // Optionnel: On pourrait créer un auto-booking ici
                }

                setTimeout(() => {
                    setShowSendModal(null);
                    setSendResult(null);
                    setSelectedContact(null);
                    setSelectedSupplier(null);
                }, 2000);
            } else {
                setSendResult({ status: 'error', message: data.error || 'Erreur lors de l’envoi' });
            }
        } catch (e: any) {
            setSendResult({ status: 'error', message: e.message || 'Erreur réseau' });
        }
        setIsSending(false);
    };

    const handleAskAvailability = async (booking: CRMSupplierBooking) => {
        if (!linkedSupplier || !tenantId) return;
        const channel = linkedSupplier.phone ? 'WHATSAPP' : 'EMAIL';
        const to = channel === 'WHATSAPP' ? linkedSupplier.phone : linkedSupplier.email;
        if (!to) return alert('Aucun contact (téléphone ou email) pour ce prestataire.');

        const message = `Bonjour ${linkedSupplier.contactName || linkedSupplier.name} !\n\n` +
            `On aurait besoin de vous pour une prestation\n\n` +
            `*${booking.prestationName}*\n` +
            `*Date :* ${format(new Date(booking.date), 'dd MMMM yyyy', { locale: fr })}\n` +
            `*Horaire :* ${booking.startTime || 'A préciser'} - ${booking.endTime || 'A préciser'}\n` +
            `*Prix :* ${booking.rate} €\n` +
            `${booking.clientName ? `*Client :* ${booking.clientName}\n` : ''}` +
            `${booking.pickupLocation ? `*Pick-up :* ${booking.pickupLocation}\n` : ''}` +
            `${booking.numberOfGuests ? `*Personnes :* ${booking.numberOfGuests}\n` : ''}` +
            `\nMerci de confirmer avec les boutons ci-dessous !\n` +
            `_Luna CRM - On compte sur vous !_`;

        const endpoint = channel === 'WHATSAPP' ? '/api/whatsapp/send' : '/api/gmail/send';
        try {
            await fetchWithAuth(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    message,
                    subject: `Demande de disponibilité : ${booking.prestationName}`,
                    clientName: linkedSupplier.name,
                    clientId: linkedSupplier.id,
                    recipientType: 'SUPPLIER',
                    interactiveButtons: channel === 'WHATSAPP',
                    bookingId: booking.id,
                    prestationName: booking.prestationName,
                })
            });
            alert(`Demande envoyée via ${channel} avec boutons de confirmation !`);
            await updateSupplierBooking(tenantId, booking.id!, { status: 'PROPOSED' });
            loadItem();
        } catch (e) { console.error(e); }
    };

    const fieldClass = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 font-normal";
    const labelClass = "text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1 block";

    if (loading) return (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
            <div className="h-full bg-luna-charcoal w-full origin-left animate-loading-bar" />
            <style jsx>{`
                    @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(-20%); } 100% { transform: translateX(0%); } }
                    .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
                `}</style>
        </div>
    );

    if (!item) return <div className="p-20 text-center text-gray-400">Prestation introuvable</div>;

    const typeConf = getTypeConfig(item.type);
    const clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
    const profit = clientPrice - item.netCost;
    const profitPercent = item.netCost > 0 ? Math.round((profit / item.netCost) * 100) : item.recommendedMarkup;

    return (
        <div className="w-full h-full">
            <div className="flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto w-full pb-20">

                {/* ── LEFT SIDEBAR: Fees & Financials ── */}
                <aside className="w-full md:w-[320px] shrink-0 space-y-6">
                    <button onClick={() => router.push('/crm/catalog')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-black mb-2 transition-all group font-sans uppercase tracking-widest font-semibold">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour
                    </button>

                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[32px] p-6 shadow-xl shadow-gray-100/50 sticky top-[80px]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                <DollarSign size={20} />
                            </div>
                            <h2 className="text-sm font-semibold text-luna-charcoal tracking-tight">Frais & Marges</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Coût Net (Achat)</p>
                                <p className="text-xl font-medium text-gray-800">{item.netCost.toLocaleString('fr-FR')} €</p>
                                <p className="text-[9px] text-gray-400 mt-1">Prix payé au prestataire</p>
                            </div>

                            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                                <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Prix Client (Vente)</p>
                                <p className="text-2xl font-bold text-emerald-700">{clientPrice.toLocaleString('fr-FR')} €</p>
                                <p className="text-[9px] text-emerald-600/70 mt-1">Marge appliquée : {item.recommendedMarkup}%</p>
                            </div>

                            <div className="p-5 bg-amber-50/30 border border-amber-100/50 rounded-2xl">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Bénéfice Net</p>
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">+{profitPercent}%</span>
                                </div>
                                <p className="text-2xl font-bold text-amber-600">{profit.toLocaleString('fr-FR')} €</p>
                            </div>

                            <div className="pt-4 space-y-2">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Envoi au Client</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setShowSendModal({ channel: 'WHATSAPP', target: 'CLIENT' })} className="py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 uppercase tracking-tight">
                                        <MessageCircle size={14} /> WhatsApp
                                    </button>
                                    <button onClick={() => setShowSendModal({ channel: 'EMAIL', target: 'CLIENT' })} className="py-3 bg-luna-charcoal text-white rounded-2xl text-[10px] font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-tight">
                                        <Mail size={14} /> Email
                                    </button>
                                </div>

                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-4 px-1">Sync Prestataire</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setShowSendModal({ channel: 'WHATSAPP', target: 'PRESTATAIRE' })} className="py-3 bg-white text-emerald-600 border border-emerald-100 rounded-2xl text-[10px] font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 uppercase tracking-tight">
                                        <MessageCircle size={14} /> WhatsApp
                                    </button>
                                    <button onClick={() => setShowSendModal({ channel: 'EMAIL', target: 'PRESTATAIRE' })} className="py-3 bg-white text-luna-charcoal border border-gray-100 rounded-2xl text-[10px] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 uppercase tracking-tight">
                                        <Mail size={14} /> Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="flex-1 space-y-6">

                    {/* Hero / Images */}
                    <div className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm relative group">
                        <div className={`h-[300px] bg-gradient-to-r ${typeConf.gradient} relative overflow-hidden`}>
                            {(item.images && item.images.length > 0) || item.imageUrl ? (
                                <img src={item.images?.[0] || item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <typeConf.icon size={80} className="text-white/20" />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

                            {/* Luna Logo with dark filter */}
                            <div className="absolute top-6 left-8 z-20">
                                <img src={logo} alt="Luna" className="h-8 opacity-30" />
                            </div>

                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/30 bg-white/20 backdrop-blur-md`}>
                                        {typeConf.label}
                                    </span>
                                    <span className="text-xs font-medium text-white/80 flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 uppercase tracking-tighter">
                                        <MapPin size={12} className="text-emerald-400" /> {item.location}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-light tracking-tight text-white">{item.name}</h1>
                            </div>

                            <div className="absolute top-6 right-6 flex gap-2">
                                <button onClick={() => setEditing(true)} className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white transition-all border border-white/20">
                                    <Edit3 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Details Column */}
                        <div className="md:col-span-2 space-y-6">
                            <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Description de l'offre</h3>
                                <p className="text-lg text-gray-700 leading-relaxed font-sans">{item.description}</p>

                                {item.images && item.images.length > 1 && (
                                    <div className="mt-8">
                                        <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Galerie Photos</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {item.images.slice(1).map((img, i) => (
                                                <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 group cursor-zoom-in">
                                                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* PLANNING / BOOKINGS */}
                            <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Planning Booking</h3>
                                        <p className="text-sm text-gray-500">Gérez les disponibilités de vos prestataires</p>
                                    </div>
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        disabled={!item.supplierId}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-luna-charcoal text-white rounded-2xl text-xs font-bold hover:bg-gray-800 transition-all disabled:opacity-30"
                                    >
                                        <Plus size={16} /> Nouvelle Réservation
                                    </button>
                                </div>

                                {!item.supplierId ? (
                                    <div className="p-10 rounded-3xl border-2 border-dashed border-gray-100 text-center bg-gray-50/30">
                                        <AlertCircle size={32} className="mx-auto text-amber-400 mb-3" />
                                        <p className="text-sm font-medium text-gray-800">Aucun prestataire lié</p>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto leading-relaxed">Liez ce service à un prestataire (Prestataires) pour activer le planning de réservation.</p>
                                        <button onClick={() => setShowSupplierModal(true)} className="mt-4 text-emerald-500 text-xs font-bold hover:underline">Lier maintenant</button>
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="p-10 rounded-3xl border border-gray-100 text-center bg-gray-50/10">
                                        <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-sm font-medium text-gray-400 italic">Aucune réservation planning pour le moment</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {bookings.map(booking => (
                                            <div key={booking.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all bg-white group shadow-sm hover:shadow-md ${booking.status === 'CONFIRMED' ? 'border-emerald-200 bg-emerald-50/30' :
                                                booking.status === 'CANCELLED' ? 'border-rose-200 bg-rose-50/30 opacity-60' :
                                                    'border-gray-100 hover:border-emerald-200'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                                        booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-500' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        <span className="text-[10px] leading-none uppercase">{format(new Date(booking.date), 'MMM', { locale: fr })}</span>
                                                        <span className="text-lg leading-none">{format(new Date(booking.date), 'dd')}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{booking.clientName || 'Réservation Groupe'}</p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {booking.startTime} - {booking.endTime}</span>
                                                            <span>•</span>
                                                            <span>{booking.rate} € TTC</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                                        booking.status === 'PROPOSED' ? 'bg-amber-100 text-amber-700' :
                                                            booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {booking.status === 'CONFIRMED' ? 'Confirmé' : booking.status === 'PROPOSED' ? 'En attente' : 'Annulé'}
                                                    </span>

                                                    {/* Accept / Reject buttons for PROPOSED bookings */}
                                                    {booking.status === 'PROPOSED' && (
                                                        <div className="flex items-center gap-1 ml-1">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!tenantId || !booking.id) return;
                                                                    await updateSupplierBooking(tenantId, booking.id, { status: 'CONFIRMED' });
                                                                    const booked = await getSupplierBookings(tenantId, item!.supplierId!).catch(() => []);
                                                                    setBookings(booked.filter(b => b.prestationId === id));
                                                                }}
                                                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                                                title="Accepter"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!tenantId || !booking.id) return;
                                                                    await updateSupplierBooking(tenantId, booking.id, { status: 'CANCELLED' });
                                                                    const booked = await getSupplierBookings(tenantId, item!.supplierId!).catch(() => []);
                                                                    setBookings(booked.filter(b => b.prestationId === id));
                                                                }}
                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                                                title="Refuser"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => handleAskAvailability(booking)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-all"
                                                        title="Relancer le prestataire"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* SIDELONG: Supplier Info */}
                        <div className="space-y-6">
                            <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Prestataire lié</h3>
                                    <button onClick={() => setShowSupplierModal(true)} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-all"><Edit3 size={14} /></button>
                                </div>

                                {linkedSupplier ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-luna-charcoal text-white flex items-center justify-center font-bold text-lg">
                                                {linkedSupplier.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{linkedSupplier.name}</p>
                                                <p className="text-[10px] text-gray-500 font-sans tracking-tight">{linkedSupplier.category}</p>
                                            </div>
                                            <Link href={`/crm/suppliers/${linkedSupplier.id}`} className="p-2 bg-gray-50 text-gray-400 hover:text-emerald-500 rounded-xl transition-all">
                                                <ChevronRight size={18} />
                                            </Link>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 space-y-3">
                                            {linkedSupplier.contactName && <p className="text-xs text-gray-600 flex items-center gap-2"><User size={14} className="text-gray-400" /> {linkedSupplier.contactName}</p>}
                                            {linkedSupplier.phone && <a href={`tel:${linkedSupplier.phone}`} className="text-xs text-gray-600 flex items-center gap-2 hover:text-emerald-500 transition-colors"><Phone size={14} className="text-emerald-500" /> {linkedSupplier.phone}</a>}
                                            {linkedSupplier.email && <a href={`mailto:${linkedSupplier.email}`} className="text-xs text-gray-600 flex items-center gap-2 hover:text-emerald-500 transition-colors"><Mail size={14} className="text-emerald-500" /> {linkedSupplier.email}</a>}
                                            {linkedSupplier.website && <a href={linkedSupplier.website} target="_blank" className="text-xs text-emerald-500 flex items-center gap-2 hover:underline"><Globe size={14} /> Site Web</a>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                        <User size={24} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-[10px] text-gray-400 uppercase font-bold px-4">Liez une fiche de prestataire à cette offre</p>
                                    </div>
                                )}
                            </section>


                        </div>
                    </div>
                </main>

                {/* ── MODALS ── */}

                {/* Modal: Universal Send Selection */}
                <AnimatePresence>
                    {showSendModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setShowSendModal(null)} />
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                className="bg-white rounded-[48px] w-full max-w-md relative z-10 shadow-2xl overflow-hidden border border-white/20"
                            >
                                <div className={`p-8 bg-gradient-to-br ${showSendModal.channel === 'EMAIL' ? 'from-emerald-500 to-indigo-600' : 'from-emerald-600 to-teal-700'} text-white`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-3xl font-normal leading-none tracking-tighter">Envoyer au {showSendModal.target === 'CLIENT' ? 'client' : 'prestataire'}</h2>
                                            <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-3 flex items-center gap-2">
                                                {showSendModal.channel === 'WHATSAPP' ? <MessageCircle size={12} /> : <Mail size={12} />} VIA {showSendModal.channel}
                                            </p>
                                        </div>
                                        <button onClick={() => setShowSendModal(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"><X size={20} /></button>
                                    </div>
                                    <div className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/10 group focus-within:bg-white/30 transition-all">
                                        <Search size={18} className="text-white/60 group-focus-within:text-white" />
                                        <input
                                            className="bg-transparent border-none text-white placeholder-white/50 focus:ring-0 text-sm font-normal w-full"
                                            placeholder={`Chercher un ${showSendModal.target === 'CLIENT' ? 'contact' : 'prestataire'}...`}
                                            value={searchContact}
                                            onChange={e => setSearchContact(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                        {showSendModal.target === 'CLIENT' ? (
                                            contacts.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchContact.toLowerCase())).map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setSelectedContact(c)}
                                                    className={`w-full p-4 rounded-3xl transition-all text-left flex items-center justify-between border ${selectedContact?.id === c.id ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-gray-50 border-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 uppercase text-xs">{c.firstName[0]}{c.lastName[0]}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-luna-charcoal tracking-tight">{c.firstName} {c.lastName}</p>
                                                            <p className="text-[11px] text-gray-400 font-sans">{showSendModal.channel === 'EMAIL' ? c.email : (c.phone || 'Pas de numéro')}</p>
                                                        </div>
                                                    </div>
                                                    {selectedContact?.id === c.id && (
                                                        <motion.div layoutId="check" className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                            <Check size={14} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            suppliers.filter(s => s.name.toLowerCase().includes(searchContact.toLowerCase())).map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setSelectedSupplier(s)}
                                                    className={`w-full p-4 rounded-3xl transition-all text-left flex items-center justify-between border ${selectedSupplier?.id === s.id ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-gray-50 border-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-2xl bg-luna-charcoal text-white flex items-center justify-center font-bold uppercase text-xs">{s.name[0]}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-luna-charcoal tracking-tight">{s.name}</p>
                                                            <p className="text-[11px] text-gray-400 font-sans lowercase">{showSendModal.channel === 'EMAIL' ? s.email : (s.phone || 'Pas de numéro')}</p>
                                                        </div>
                                                    </div>
                                                    {selectedSupplier?.id === s.id && (
                                                        <motion.div layoutId="check-sup" className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                            <Check size={14} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {sendResult && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`mt-6 p-5 rounded-[24px] flex items-start gap-4 ${sendResult.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${sendResult.status === 'success' ? 'bg-emerald-200/50' : 'bg-rose-200/50'}`}>
                                                {sendResult.status === 'success' ? <Check size={16} /> : <X size={16} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold uppercase tracking-widest mb-1">{sendResult.status === 'success' ? 'Succès' : 'Incident'}</p>
                                                <p className="text-sm font-normal opacity-90 leading-tight">
                                                    {sendResult.message.includes('Error validating access token')
                                                        ? "Votre clé d'accès WhatsApp a expiré. Veuillez mettre à jour le WHATSAPP_TOKEN dans vos paramètres d'intégration Meta."
                                                        : sendResult.message}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={handleSendToTarget}
                                        disabled={isSending || (showSendModal.target === 'CLIENT' ? !selectedContact : !selectedSupplier)}
                                        className={`w-full mt-8 py-5 rounded-[24px] font-bold text-white shadow-2xl transition-all flex items-center justify-center gap-3 transform active:scale-95 ${showSendModal.channel === 'EMAIL' ? 'bg-luna-charcoal shadow-gray-200' : 'bg-emerald-600 shadow-emerald-200'} disabled:opacity-20 disabled:grayscale`}
                                    >
                                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                        <span className="text-xs uppercase tracking-widest">
                                            {isSending ? 'Envoi en cours...' : 'Confirmer l’envoi'}
                                        </span>
                                    </button>
                                    {sendResult?.status === 'error' && (
                                        <p className="text-center mt-4 text-[10px] text-gray-400 font-sans">
                                            Besoin d'aide ? <Link href="/crm/integrations" className="text-emerald-500 hover:underline">Vérifier les connexions API</Link>
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal: Supplier Selection with Filters */}
                <AnimatePresence>
                    {showSupplierModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/50 backdrop-blur-xl" onClick={() => { setShowSupplierModal(false); setSupplierFilterCat('ALL'); setSupplierSearch(''); }} />
                            <motion.div
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                className="bg-white rounded-[48px] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-8 pb-0">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-normal leading-tight tracking-tighter uppercase">Lier un Prestataire</h2>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Filtrez vos Luna Friends par catégorie</p>
                                        </div>
                                        <button onClick={() => { setShowSupplierModal(false); setSupplierFilterCat('ALL'); setSupplierSearch(''); }} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={20} /></button>
                                    </div>

                                    {/* Search */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Rechercher un prestataire..."
                                            value={supplierSearch}
                                            onChange={e => setSupplierSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-sans"
                                        />
                                    </div>

                                    {/* Category Filters */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-4 no-scrollbar">
                                        {SUPPLIER_CATS.map(cat => {
                                            const isActive = supplierFilterCat === cat.value;
                                            const isLuna = cat.value === 'LUNA_FRIENDS';
                                            return (
                                                <button
                                                    key={cat.value}
                                                    onClick={() => setSupplierFilterCat(cat.value)}
                                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest border whitespace-nowrap transition-all ${isActive
                                                        ? isLuna
                                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-lg shadow-emerald-100'
                                                            : 'bg-luna-charcoal text-white border-luna-charcoal shadow-lg'
                                                        : isLuna
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300'
                                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <span>{cat.emoji}</span> {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* List */}
                                <div className="px-8 pb-8">
                                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(() => {
                                            const filteredSup = suppliers.filter(sup => {
                                                const matchesCat = supplierFilterCat === 'ALL'
                                                    || (supplierFilterCat === 'LUNA_FRIENDS' ? sup.isLunaFriend : sup.category === supplierFilterCat);
                                                const matchesSearch = sup.name.toLowerCase().includes(supplierSearch.toLowerCase())
                                                    || (sup.city || '').toLowerCase().includes(supplierSearch.toLowerCase());
                                                return matchesCat && matchesSearch;
                                            });

                                            if (filteredSup.length === 0) return (
                                                <div className="py-12 text-center">
                                                    <Filter size={28} className="mx-auto text-gray-200 mb-3" />
                                                    <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucun prestataire trouvé</p>
                                                    <p className="text-[10px] text-gray-300 mt-1">Essayez un autre filtre ou créez un nouveau prestataire</p>
                                                </div>
                                            );

                                            return filteredSup.map(sup => (
                                                <button
                                                    key={sup.id}
                                                    onClick={async () => {
                                                        if (!tenantId || !item.id) return;
                                                        await updateCatalogItem(tenantId, item.id, { supplierId: sup.id, supplier: sup.name });
                                                        loadItem();
                                                        setShowSupplierModal(false);
                                                        setSupplierFilterCat('ALL');
                                                        setSupplierSearch('');
                                                    }}
                                                    className="w-full p-4 rounded-[24px] border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left flex items-center gap-4 group"
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${sup.isLunaFriend
                                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-100'
                                                        : 'bg-luna-charcoal text-white'
                                                        }`}>
                                                        {sup.name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{sup.name}</p>
                                                            {sup.isLunaFriend && (
                                                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-0.5 shrink-0">
                                                                    <Sparkles size={8} /> Friend
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">{sup.category}</span>
                                                            {sup.city && <span className="text-[10px] text-gray-300">• {sup.city}</span>}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-200 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal: New Booking */}
                {showBookingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-luna-charcoal/40 backdrop-blur-md" onClick={() => setShowBookingModal(false)} />
                        <div className="bg-white rounded-[40px] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-normal">Nouvelle Réservation</h2>
                                        <p className="text-xs text-gray-500 font-sans">Enregistrer un créneau au planning de {linkedSupplier?.name}</p>
                                    </div>
                                    <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Date</label>
                                            <input type="date" value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} className={fieldClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Tarif (€)</label>
                                            <input type="number" value={newBooking.rate} onChange={e => setNewBooking({ ...newBooking, rate: +e.target.value })} className={fieldClass} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Horaire Début</label>
                                            <input type="time" value={newBooking.startTime} onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })} className={fieldClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Horaire Fin</label>
                                            <input type="time" value={newBooking.endTime} onChange={e => setNewBooking({ ...newBooking, endTime: e.target.value })} className={fieldClass} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Client (Optionnel)</label>
                                        <select
                                            className={fieldClass}
                                            onChange={e => {
                                                const c = contacts.find(v => v.id === e.target.value);
                                                setSelectedContact(c || null);
                                            }}
                                        >
                                            <option value="">Sélectionner un client</option>
                                            {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Lieu de pick-up</label>
                                            <input
                                                type="text"
                                                value={newBooking.pickupLocation || ''}
                                                onChange={e => setNewBooking({ ...newBooking, pickupLocation: e.target.value })}
                                                className={fieldClass}
                                                placeholder="Ex: Hall hôtel, Aéroport CDG..."
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Nombre de personnes</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={newBooking.numberOfGuests || ''}
                                                onChange={e => setNewBooking({ ...newBooking, numberOfGuests: +e.target.value || undefined })}
                                                className={fieldClass}
                                                placeholder="Ex: 2"
                                            />
                                        </div>
                                    </div>

                                    {/* ═══ TRANSPORT: Aller / Retour (only for TRANSFER items) ═══ */}
                                    {item?.type === 'TRANSFER' && (
                                        <div className="p-5 rounded-2xl border border-orange-200 bg-orange-50/30 space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Car size={16} className="text-orange-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Transport — Aller</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className={labelClass}>Départ</label>
                                                    <input type="text" value={newBooking.outboundLocation || ''} onChange={e => setNewBooking({ ...newBooking, outboundLocation: e.target.value })} className={fieldClass} placeholder="Hôtel Paris..." />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Destination</label>
                                                    <input type="text" value={newBooking.outboundDestination || ''} onChange={e => setNewBooking({ ...newBooking, outboundDestination: e.target.value })} className={fieldClass} placeholder="Reims..." />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Heure</label>
                                                    <input type="time" value={newBooking.outboundTime || ''} onChange={e => setNewBooking({ ...newBooking, outboundTime: e.target.value })} className={fieldClass} />
                                                </div>
                                            </div>

                                            {/* Round trip toggle */}
                                            <div className="flex items-center gap-3 pt-2 border-t border-orange-200/50">
                                                <button type="button" onClick={() => {
                                                    const enabled = !newBooking.returnEnabled;
                                                    setNewBooking({
                                                        ...newBooking,
                                                        returnEnabled: enabled,
                                                        // Auto-fill return with swapped outbound values
                                                        ...(enabled ? {
                                                            returnLocation: newBooking.outboundDestination || '',
                                                            returnDestination: newBooking.outboundLocation || '',
                                                        } : {
                                                            returnLocation: '', returnDestination: '', returnTime: '',
                                                        })
                                                    });
                                                }} className={`w-10 h-6 rounded-full transition-all relative ${newBooking.returnEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${newBooking.returnEnabled ? 'left-5' : 'left-1'}`} />
                                                </button>
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Aller-Retour</span>
                                            </div>

                                            {/* Return fields */}
                                            {newBooking.returnEnabled && (
                                                <div className="space-y-3 pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRight size={14} className="text-orange-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Retour</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className={labelClass}>Départ</label>
                                                            <input type="text" value={newBooking.returnLocation || ''} onChange={e => setNewBooking({ ...newBooking, returnLocation: e.target.value })} className={fieldClass} placeholder="Reims..." />
                                                        </div>
                                                        <div>
                                                            <label className={labelClass}>Destination</label>
                                                            <input type="text" value={newBooking.returnDestination || ''} onChange={e => setNewBooking({ ...newBooking, returnDestination: e.target.value })} className={fieldClass} placeholder="Hôtel Paris..." />
                                                        </div>
                                                        <div>
                                                            <label className={labelClass}>Heure</label>
                                                            <input type="time" value={newBooking.returnTime || ''} onChange={e => setNewBooking({ ...newBooking, returnTime: e.target.value })} className={fieldClass} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>Notes internes</label>
                                        <textarea value={newBooking.notes || ''} onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })} className={fieldClass + ' h-24'} placeholder="Détails du booking..." />
                                    </div>

                                    {bookingSuccess && (
                                        <div className={`p-4 rounded-2xl text-center font-bold text-sm ${bookingSuccess.includes('créée') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                            {bookingSuccess}
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={handleCreateBooking}
                                            disabled={bookingLoading}
                                            className="flex-1 py-4 bg-luna-charcoal text-white rounded-2xl font-bold hover:bg-gray-800 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {bookingLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                            Créer au planning
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const createdBooking = await handleCreateBooking();
                                                if (createdBooking && linkedSupplier) {
                                                    handleAskAvailability(createdBooking);
                                                }
                                            }}
                                            disabled={bookingLoading}
                                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {bookingLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            Créer & Envoyer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* ── MODAL: EDIT PRESTATION ── */}
                <AnimatePresence>
                    {editing && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl" onClick={() => setEditing(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                className="bg-white rounded-[40px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                {/* Header — Luna Style */}
                                <div className="p-8 pb-4 bg-luna-charcoal text-white shrink-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-light tracking-tight">Modifier la prestation</h2>
                                            <p className="text-[#b9dae9] text-xs mt-1 font-medium">{item.name}</p>
                                        </div>
                                        <button onClick={() => setEditing(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="p-8 space-y-5 overflow-y-auto flex-1">
                                    <div>
                                        <label className={labelClass}>Nom de la prestation</label>
                                        <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} className={fieldClass} />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className={labelClass + ' mb-0'}>Description</label>
                                            <button
                                                type="button"
                                                onClick={() => handleAISuggest('description')}
                                                disabled={aiSuggesting}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${aiSuggesting
                                                    ? 'bg-purple-50 text-purple-400 border-purple-100 cursor-wait'
                                                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 border-purple-100 hover:from-purple-100 hover:to-indigo-100 hover:shadow-md hover:shadow-purple-100/50'
                                                    }`}
                                            >
                                                {aiSuggesting ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Sparkles size={12} />
                                                )}
                                                {aiSuggesting ? 'Luna pense...' : 'Écrire avec l\'IA'}
                                            </button>
                                        </div>
                                        <textarea value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} className={fieldClass + ' h-28 resize-none'} placeholder="Décrivez cette prestation pour vos clients..." />

                                        {/* AI Suggestion Panel */}
                                        <AnimatePresence>
                                            {(aiSuggestion || aiSuggesting) && aiField === 'description' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                                    className="mt-3 overflow-hidden"
                                                >
                                                    <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/50 to-violet-50/80 rounded-2xl border border-purple-100/50 p-4 relative">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                                                <Sparkles size={10} className="text-white" />
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Suggestion Luna IA</span>
                                                            {aiAlternatives.length > 0 && (
                                                                <span className="text-[9px] text-purple-400 ml-auto">
                                                                    {aiAltIndex === 0 ? 'Principale' : `Alt. ${aiAltIndex}`} • {aiAlternatives.length + 1} options
                                                                </span>
                                                            )}
                                                        </div>

                                                        {aiSuggesting ? (
                                                            <div className="flex items-center gap-3 py-4">
                                                                <div className="flex gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                                </div>
                                                                <p className="text-xs text-purple-500 italic">Luna rédige votre texte...</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-gray-700 leading-relaxed font-sans mb-4 whitespace-pre-wrap">
                                                                    {aiSuggestion}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={acceptAISuggestion}
                                                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200/50"
                                                                    >
                                                                        <Check size={12} /> Utiliser
                                                                    </button>
                                                                    {aiAlternatives.length > 0 && (
                                                                        <button
                                                                            onClick={cycleAIAlternative}
                                                                            className="flex items-center gap-1.5 px-3 py-2 bg-white/80 text-purple-600 border border-purple-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                                                                        >
                                                                            <ArrowRight size={12} /> Autre
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleAISuggest('description')}
                                                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/80 text-purple-600 border border-purple-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                                                                    >
                                                                        <Sparkles size={12} /> Regénérer
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setAiSuggestion(null); setAiAlternatives([]); }}
                                                                        className="ml-auto p-1.5 text-purple-300 hover:text-purple-500 hover:bg-white/50 rounded-lg transition-all"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Type</label>
                                            <select value={editData.type || 'OTHER'} onChange={e => setEditData({ ...editData, type: e.target.value as any })} className={fieldClass}>
                                                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Localisation</label>
                                            <input type="text" value={editData.location || ''} onChange={e => setEditData({ ...editData, location: e.target.value })} className={fieldClass} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>Coût Net (€)</label>
                                            <input type="number" value={editData.netCost || 0} onChange={e => setEditData({ ...editData, netCost: +e.target.value })} className={fieldClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Marge (%)</label>
                                            <input type="number" value={editData.recommendedMarkup || 0} onChange={e => setEditData({ ...editData, recommendedMarkup: +e.target.value })} className={fieldClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Prix client</label>
                                            <div className="px-3 py-2.5 bg-[#b9dae9]/15 border border-[#b9dae9]/30 rounded-xl text-sm text-luna-charcoal font-semibold">
                                                {Math.round((editData.netCost || 0) * (1 + (editData.recommendedMarkup || 0) / 100)).toLocaleString('fr-FR')} €
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── PHOTOS SECTION ── */}
                                    <div>
                                        <label className={labelClass}>Photos</label>
                                        <div className="space-y-3">
                                            {/* Existing photos gallery */}
                                            {photoURLs.length > 0 && (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {photoURLs.map((url, idx) => (
                                                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-[4/3]">
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                                <button
                                                                    onClick={() => setPreviewImage(url)}
                                                                    className="p-2 bg-white/90 rounded-lg text-luna-charcoal hover:bg-white transition-all"
                                                                    title="Voir l'image"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setCropImage({ src: url, index: idx }); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                                                                    className="p-2 bg-[#b9dae9]/90 rounded-lg text-white hover:bg-[#b9dae9] transition-all"
                                                                    title="Recadrer"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => setPhotoURLs(photoURLs.filter((_, i) => i !== idx))}
                                                                    className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-600 transition-all"
                                                                    title="Supprimer"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                            {idx === 0 && (
                                                                <span className="absolute top-2 left-2 bg-luna-charcoal/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Cover</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload photo button */}
                                            <label className={`flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-[#b9dae9]/10 border border-dashed border-gray-200 hover:border-[#b9dae9]/50 rounded-xl cursor-pointer transition-all text-xs text-gray-500 hover:text-[#5a9bb5] font-medium ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                {uploading ? 'Upload en cours...' : 'Importer une photo'}
                                                <input
                                                    ref={photoInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const files = e.target.files;
                                                        if (!files) return;
                                                        setUploading(true);
                                                        for (const file of Array.from(files)) {
                                                            const fd = new FormData();
                                                            fd.append('file', file);
                                                            try {
                                                                const res = await fetchWithAuth('/api/crm/upload', { method: 'POST', body: fd });
                                                                if (res.ok) {
                                                                    const { url } = await res.json();
                                                                    setPhotoURLs(prev => [...prev, url]);
                                                                }
                                                            } catch (err) {
                                                                console.error('Upload error:', err);
                                                            }
                                                        }
                                                        setUploading(false);
                                                        if (e.target) e.target.value = '';
                                                    }}
                                                />
                                            </label>

                                            {/* URL input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Ou coller une URL d'image..."
                                                    className={fieldClass + ' flex-1'}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            const val = (e.target as HTMLInputElement).value.trim();
                                                            if (val) {
                                                                setPhotoURLs([...photoURLs, val]);
                                                                (e.target as HTMLInputElement).value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const inp = document.querySelector<HTMLInputElement>('[placeholder="Ou coller une URL d\'image..."]');
                                                        if (inp?.value.trim()) {
                                                            setPhotoURLs([...photoURLs, inp.value.trim()]);
                                                            inp.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-500 transition-all"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            {/* AI Image Generation */}
                                            <div className="bg-gradient-to-r from-violet-50/50 to-sky-50/50 rounded-xl p-4 border border-violet-100/50">
                                                <label className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                                                    <Sparkles size={12} /> Générer une image IA
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={aiImagePrompt}
                                                        onChange={e => setAiImagePrompt(e.target.value)}
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter' && aiImagePrompt.trim() && !generatingAiImage) {
                                                                setGeneratingAiImage(true);
                                                                try {
                                                                    const res = await fetchWithAuth('/api/ai/generate-image', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ prompt: aiImagePrompt }),
                                                                    });
                                                                    if (res.ok) {
                                                                        const { url } = await res.json();
                                                                        setPhotoURLs(prev => [...prev, url]);
                                                                        setAiImagePrompt('');
                                                                    } else {
                                                                        const err = await res.json();
                                                                        alert(err.error || 'Erreur de génération');
                                                                    }
                                                                } catch (err) { console.error(err); }
                                                                setGeneratingAiImage(false);
                                                            }
                                                        }}
                                                        placeholder="ex: Villa luxe piscine, coucher de soleil, Bali"
                                                        className="flex-1 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-xs text-[#2E2E2E] focus:border-violet-300 transition-all outline-none"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!aiImagePrompt.trim() || generatingAiImage) return;
                                                            setGeneratingAiImage(true);
                                                            try {
                                                                const res = await fetchWithAuth('/api/ai/generate-image', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ prompt: aiImagePrompt }),
                                                                });
                                                                if (res.ok) {
                                                                    const { url } = await res.json();
                                                                    setPhotoURLs(prev => [...prev, url]);
                                                                    setAiImagePrompt('');
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert(err.error || 'Erreur de génération');
                                                                }
                                                            } catch (err) { console.error(err); }
                                                            setGeneratingAiImage(false);
                                                        }}
                                                        disabled={generatingAiImage || !aiImagePrompt.trim()}
                                                        className="px-4 py-2.5 bg-violet-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-violet-600 transition-all disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                                                    >
                                                        {generatingAiImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        {generatingAiImage ? 'Génération...' : 'Générer'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <SupplierPicker
                                            suppliers={suppliers}
                                            value={editData.supplierId || ''}
                                            onChange={(id) => setEditData({ ...editData, supplierId: id || undefined })}
                                            label="Prestataire lié"
                                            placeholder="Rechercher un prestataire..."
                                        />
                                    </div>
                                </div>

                                {/* Actions — Luna Style */}
                                <div className="p-8 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
                                    <button onClick={() => setEditing(false)} className="flex-1 py-4 border border-gray-200 text-gray-500 rounded-2xl font-medium hover:bg-gray-50 transition-all text-sm">
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-4 bg-luna-charcoal text-white rounded-2xl font-bold hover:bg-black shadow-xl shadow-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!tenantId || !item?.id) return;
                                            if (!confirm('Supprimer cette prestation ?')) return;
                                            await deleteCatalogItem(tenantId, item.id);
                                            router.push('/crm/catalog');
                                        }}
                                        className="py-4 px-5 bg-red-50 text-red-500 rounded-2xl font-medium hover:bg-red-100 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <Trash2 size={16} /> Supprimer
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── LIGHTBOX: IMAGE PREVIEW ── */}
                <AnimatePresence>
                    {previewImage && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8" onClick={() => setPreviewImage(null)}>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/90 backdrop-blur-2xl" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative z-10 max-w-5xl max-h-[85vh] w-full"
                                onClick={e => e.stopPropagation()}
                            >
                                <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-3xl shadow-2xl" />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <a href={previewImage} download target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/10">
                                        <Download size={18} />
                                    </a>
                                    <button onClick={() => setPreviewImage(null)} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white transition-all border border-white/10">
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── MODAL: CROP IMAGE ── */}
                <AnimatePresence>
                    {cropImage && (
                        <div className="fixed inset-0 z-[200] flex flex-col">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-luna-charcoal/95" />

                            {/* Header */}
                            <div className="relative z-10 flex items-center justify-between px-8 py-5 bg-luna-charcoal border-b border-white/10">
                                <div>
                                    <h3 className="text-white text-lg font-light tracking-tight">Recadrer l'image</h3>
                                    <p className="text-[#b9dae9] text-xs font-medium mt-0.5">Déplacez et zoomez pour ajuster le cadrage</p>
                                </div>
                                <button onClick={() => setCropImage(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Crop area */}
                            <div className="relative flex-1 z-10">
                                <Cropper
                                    image={cropImage.src}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={cropAspect}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                                    style={{
                                        containerStyle: { background: '#1a1a1a' },
                                        cropAreaStyle: { border: '2px solid #b9dae9', borderRadius: '12px' },
                                    }}
                                />
                            </div>

                            {/* Controls */}
                            <div className="relative z-10 px-8 py-5 bg-luna-charcoal border-t border-white/10 flex items-center justify-between gap-6">
                                {/* Aspect ratio presets */}
                                <div className="flex gap-2">
                                    {[
                                        { label: '4:3', value: 4 / 3 },
                                        { label: '16:9', value: 16 / 9 },
                                        { label: '1:1', value: 1 },
                                    ].map(a => (
                                        <button
                                            key={a.label}
                                            onClick={() => setCropAspect(a.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${cropAspect === a.value ? 'bg-[#b9dae9] text-luna-charcoal' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                        >
                                            {a.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Zoom slider */}
                                <div className="flex items-center gap-3 flex-1 max-w-xs">
                                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Zoom</span>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        value={zoom}
                                        onChange={e => setZoom(Number(e.target.value))}
                                        className="flex-1 accent-[#b9dae9] h-1"
                                    />
                                    <span className="text-white/60 text-xs font-mono w-8 text-right">{zoom.toFixed(1)}×</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCropImage(null)}
                                        className="px-6 py-3 border border-white/20 text-white/70 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={applyCrop}
                                        className="px-8 py-3 bg-[#b9dae9] text-luna-charcoal rounded-2xl text-sm font-bold hover:bg-[#a0cee0] transition-all shadow-lg shadow-[#b9dae9]/20 flex items-center gap-2"
                                    >
                                        <Check size={16} /> Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
