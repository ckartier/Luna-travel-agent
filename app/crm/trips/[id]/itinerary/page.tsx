'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CRMTripDay, CRMTripSegment, CRMCatalogItem, CRMContact, ScheduledTripMessage, getTripDays, createTripDay, updateTripDay, shareTripPublic, refreshSharedTrip, addScheduledMessage, deleteScheduledMessage, getScheduledMessages, getTrip, updateTrip, getContacts } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, Plus, Plane, Hotel, Map, Car, Clock, GripVertical, Trash2, Save, Calendar as CalendarIcon, Share2, Link as LinkIcon, Check, Copy, MessageCircle, Mail, Smartphone, Send, Loader2, DollarSign, Package, Unlink, FileDown } from 'lucide-react';
import { format, addDays, subDays, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import CatalogPicker from '@/src/components/crm/CatalogPicker';
import { generateRoadmapEmail, generatePreDepartureEmail } from '@/src/lib/email/templates';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

// This is a simplified frontend mockup of an Itinerary Builder.
// In a full production app, you'd use @hello-pangea/dnd for real drag and drop.

export default function ItineraryBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tripId } = use(params);
    const { tenantId } = useAuth();
    const router = useRouter();
    const [days, setDays] = useState<CRMTripDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [tripData, setTripData] = useState<any>(null);
    const [scheduledMsgs, setScheduledMsgs] = useState<ScheduledTripMessage[]>([]);
    const [showMsgForm, setShowMsgForm] = useState(false);
    const [newMsg, setNewMsg] = useState({ title: '', message: '', scheduledDate: '', channel: 'WHATSAPP' as 'EMAIL' | 'WHATSAPP' | 'SMS', daysBeforeDeparture: 7 });

    // ═══ EMAIL SENDING state ═══
    const [sendingRoadmap, setSendingRoadmap] = useState(false);
    const [sendingDeparture, setSendingDeparture] = useState(false);
    const [emailSent, setEmailSent] = useState<string | null>(null);
    const [clientContact, setClientContact] = useState<CRMContact | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // ═══ FUSION: Catalog Picker state ═══
    const [showCatalogPicker, setShowCatalogPicker] = useState(false);
    const [catalogPickerTarget, setCatalogPickerTarget] = useState<{ dayId: string; segmentIdx: number; type?: string } | null>(null);
    const [pendingSegmentType, setPendingSegmentType] = useState<string | null>(null);

    useEffect(() => {
        loadItinerary();
        loadTripData();
    }, [tripId]);

    const loadTripData = async () => {
        if (!tenantId) return;
        try {
            const t = await getTrip(tenantId, tripId);
            setTripData(t);
            if (t?.shareId) {
                setShareUrl(`${window.location.origin}/trip/${t.shareId}`);
                const msgs = await getScheduledMessages(t.shareId);
                setScheduledMsgs(msgs);
            }
            // Resolve client email from contacts
            if (t?.clientId) {
                const contacts = await getContacts(tenantId);
                const match = contacts.find(c => c.id === t.clientId);
                if (match) setClientContact(match);
            } else if (t?.clientName) {
                const contacts = await getContacts(tenantId);
                const match = contacts.find(c => `${c.firstName} ${c.lastName}` === t.clientName);
                if (match) setClientContact(match);
            }
        } catch (err) { console.error(err); }
    };

    const loadItinerary = async () => {
        setLoading(true);
        try {
            const fetchedDays = await getTripDays(tenantId!, tripId);
            if (fetchedDays.length === 0) {
                // Initialize with a blank Day 1 if empty
                const newDay: Omit<CRMTripDay, 'id'> = {
                    date: format(new Date(), 'yyyy-MM-dd'),
                    dayIndex: 1,
                    title: 'Arrivée & Installation',
                    segments: []
                };
                const id = await createTripDay(tenantId!, tripId, newDay);
                setDays([{ id, ...newDay }]);
            } else {
                setDays(fetchedDays);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addDay = async () => {
        try {
            const lastDay = days[days.length - 1];
            const nextDate = lastDay ? format(addDays(new Date(lastDay.date), 1), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            const newIndex = lastDay ? lastDay.dayIndex + 1 : 1;

            const newDay: Omit<CRMTripDay, 'id'> = {
                date: nextDate,
                dayIndex: newIndex,
                title: `Jour ${newIndex}`,
                segments: []
            };

            const id = await createTripDay(tenantId!, tripId, newDay);
            setDays([...days, { id, ...newDay }]);
        } catch (error) {
            console.error(error);
        }
    };

    const addSegment = async (dayId: string, type: 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER', catalogItem?: CRMCatalogItem) => {
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const newSegment: CRMTripSegment = {
            id: Date.now().toString(),
            type,
            title: catalogItem?.name || `Nouveau ${type}`,
            timeSlot: 'Morning',
            description: catalogItem?.description || '',
            location: catalogItem?.location || '',
            // ═══ FUSION: link to catalog ═══
            catalogItemId: catalogItem?.id,
            supplierId: catalogItem?.supplierId,
            netCost: catalogItem?.netCost || 0,
            clientPrice: catalogItem ? Math.round(catalogItem.netCost * (1 + catalogItem.recommendedMarkup / 100)) : 0,
            markupPercent: catalogItem?.recommendedMarkup || 0,
            bookingStatus: 'NONE',
        };

        const updatedDays = [...days];
        updatedDays[dayIndex].segments.push(newSegment);
        setDays(updatedDays);

        // Auto-save
        await updateTripDay(tenantId!, tripId, dayId, { segments: updatedDays[dayIndex].segments });
        // Update trip totals
        await syncTripTotals(updatedDays);
    };

    // ═══ FUSION: Link existing segment to a catalog item ═══
    const linkSegmentToCatalog = (item: CRMCatalogItem) => {
        if (!catalogPickerTarget) return;
        const { dayId, segmentIdx } = catalogPickerTarget;
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const updatedDays = [...days];
        const seg = updatedDays[dayIndex].segments[segmentIdx];
        seg.title = item.name;
        seg.description = item.description || seg.description;
        seg.location = item.location || seg.location;
        seg.catalogItemId = item.id;
        seg.supplierId = item.supplierId;
        seg.netCost = item.netCost;
        seg.clientPrice = Math.round(item.netCost * (1 + item.recommendedMarkup / 100));
        seg.markupPercent = item.recommendedMarkup;
        setDays(updatedDays);

        // Auto-save
        updateTripDay(tenantId!, tripId, dayId, { segments: updatedDays[dayIndex].segments });
        syncTripTotals(updatedDays);
        setShowCatalogPicker(false);
        setCatalogPickerTarget(null);
    };

    // ═══ FUSION: Unlink segment from catalog ═══
    const unlinkSegment = async (dayId: string, segIdx: number) => {
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;
        const updatedDays = [...days];
        const seg = updatedDays[dayIndex].segments[segIdx];
        seg.catalogItemId = undefined;
        seg.supplierId = undefined;
        seg.netCost = 0;
        seg.clientPrice = 0;
        seg.markupPercent = 0;
        setDays(updatedDays);
        await updateTripDay(tenantId!, tripId, dayId, { segments: updatedDays[dayIndex].segments });
        await syncTripTotals(updatedDays);
    };

    // ═══ FUSION: Sync Trip financial totals from segments ═══
    const syncTripTotals = async (currentDays: CRMTripDay[]) => {
        const allSegments = currentDays.flatMap(d => d.segments);
        const totalAmount = allSegments.reduce((sum, s) => sum + (s.clientPrice || 0), 0);
        const totalCost = allSegments.reduce((sum, s) => sum + (s.netCost || 0), 0);
        const margin = totalAmount - totalCost;
        try {
            await updateTrip(tenantId!, tripId, { amount: totalAmount, cost: totalCost, margin });
        } catch (e) {
            console.error('[Fusion] Error syncing trip totals:', e);
        }
    };

    // ═══ FUSION: Trip totals computed from segments ═══
    const tripTotals = useMemo(() => {
        const allSegments = days.flatMap(d => d.segments);
        const totalCost = allSegments.reduce((sum, s) => sum + (s.netCost || 0), 0);
        const totalAmount = allSegments.reduce((sum, s) => sum + (s.clientPrice || 0), 0);
        const margin = totalAmount - totalCost;
        const linkedCount = allSegments.filter(s => s.catalogItemId).length;
        return { totalCost, totalAmount, margin, segmentCount: allSegments.length, linkedCount };
    }, [days]);

    const removeSegment = async (dayId: string, segmentId: string) => {
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const updatedDays = [...days];
        updatedDays[dayIndex].segments = updatedDays[dayIndex].segments.filter(s => s.id !== segmentId);
        setDays(updatedDays);

        // Auto-save
        updateTripDay(tenantId!, tripId, dayId, { segments: updatedDays[dayIndex].segments });
    };

    const getSegmentIcon = (type: string) => {
        switch (type) {
            case 'FLIGHT': return <Plane size={18} className="text-sky-500" />;
            case 'HOTEL': return <Hotel size={18} className="text-indigo-500" />;
            case 'ACTIVITY': return <Map size={18} className="text-emerald-500" />;
            case 'TRANSFER': return <Car size={18} className="text-amber-500" />;
            default: return <Map size={18} className="text-gray-500" />;
        }
    };

    // ═══ EMAIL: Send Carnet de Voyage ═══
    const handleSendRoadmap = async () => {
        if (!tripData || !shareUrl || !clientContact?.email) {
            alert(!clientContact?.email ? 'Aucun email trouvé pour ce client.' : 'Veuillez d\'abord partager le voyage.');
            return;
        }
        setSendingRoadmap(true);
        try {
            // Fetch business info
            let businessName = 'Votre Conciergerie';
            let businessLogo = '';
            try {
                const cfgRes = await fetch('/api/crm/site-config');
                const cfgData = await cfgRes.json();
                if (cfgData?.business?.name) businessName = cfgData.business.name;
                else if (cfgData?.global?.siteName) businessName = cfgData.global.siteName;
                if (cfgData?.global?.logo) businessLogo = cfgData.global.logo;
            } catch { /* fallback */ }

            const startDate = tripData.startDate ? format(parseISO(tripData.startDate), 'd MMMM', { locale: fr }) : '';
            const endDate = tripData.endDate ? format(parseISO(tripData.endDate), 'd MMMM', { locale: fr }) : '';

            const htmlBody = generateRoadmapEmail({
                clientName: tripData.clientName,
                destination: tripData.destination,
                startDate,
                endDate,
                totalDays: days.length,
                tripShareUrl: shareUrl,
                dayHighlights: days.map(d => ({ day: d.dayIndex, title: d.title || `Jour ${d.dayIndex}` })),
                agencyName: businessName,
                logoUrl: businessLogo || undefined,
            });

            await fetchWithAuth('/api/gmail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: clientContact.email,
                    subject: `🗺 Votre Carnet de Voyage — ${tripData.destination} | ${businessName}`,
                    message: `Bonjour ${clientContact.firstName}, retrouvez votre carnet de voyage pour ${tripData.destination} : ${shareUrl}`,
                    bodyHtml: htmlBody,
                    clientId: clientContact.id,
                    clientName: `${clientContact.firstName} ${clientContact.lastName}`,
                    recipientType: 'CLIENT',
                }),
            });

            setEmailSent('roadmap');
            setTimeout(() => setEmailSent(null), 4000);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'envoi du Carnet de Voyage.');
        } finally {
            setSendingRoadmap(false);
        }
    };

    // ═══ EMAIL: Send Avant le Départ ═══
    const handleSendPreDeparture = async () => {
        if (!tripData || !shareUrl || !clientContact?.email) {
            alert(!clientContact?.email ? 'Aucun email trouvé pour ce client.' : 'Veuillez d\'abord partager le voyage.');
            return;
        }
        setSendingDeparture(true);
        try {
            // Fetch business info
            let businessName = 'Votre Conciergerie';
            let businessLogo = '';
            try {
                const cfgRes = await fetch('/api/crm/site-config');
                const cfgData = await cfgRes.json();
                if (cfgData?.business?.name) businessName = cfgData.business.name;
                else if (cfgData?.global?.siteName) businessName = cfgData.global.siteName;
                if (cfgData?.global?.logo) businessLogo = cfgData.global.logo;
            } catch { /* fallback */ }

            const departureDate = tripData.startDate ? format(parseISO(tripData.startDate), 'd MMMM yyyy', { locale: fr }) : '';
            const daysUntil = tripData.startDate ? Math.max(0, differenceInDays(parseISO(tripData.startDate), new Date())) : 0;

            const htmlBody = generatePreDepartureEmail({
                clientName: tripData.clientName,
                destination: tripData.destination,
                departureDate,
                daysUntilDeparture: daysUntil,
                tripShareUrl: shareUrl,
                agencyName: businessName,
                logoUrl: businessLogo || undefined,
            });

            await fetchWithAuth('/api/gmail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: clientContact.email,
                    subject: `✈️ Avant le Départ — ${tripData.destination} | ${businessName}`,
                    message: `Bonjour ${clientContact.firstName}, votre voyage à ${tripData.destination} approche ! Retrouvez toutes les infos : ${shareUrl}`,
                    bodyHtml: htmlBody,
                    clientId: clientContact.id,
                    clientName: `${clientContact.firstName} ${clientContact.lastName}`,
                    recipientType: 'CLIENT',
                }),
            });

            setEmailSent('departure');
            setTimeout(() => setEmailSent(null), 4000);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de l\'envoi de l\'email Avant le Départ.');
        } finally {
            setSendingDeparture(false);
        }
    };

    // ═══ DOWNLOAD DEVIS PDF ═══
    const handleDownloadDevis = async () => {
        if (!tripData) return;
        setGeneratingPdf(true);
        try {
            const allSegments = days.flatMap(d => d.segments);
            const totalAmount = allSegments.reduce((sum, s) => sum + (s.clientPrice || 0), 0);
            const nights = tripData.startDate && tripData.endDate
                ? Math.max(1, Math.round((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / 86400000))
                : days.length;

            const body = {
                destination: tripData.destination || 'Voyage',
                clientName: tripData.clientName || clientContact ? `${clientContact?.firstName || ''} ${clientContact?.lastName || ''}`.trim() : 'Client',
                clientEmail: clientContact?.email || '',
                clientPhone: clientContact?.phone || '',
                clientAddress: '',
                startDate: tripData.startDate || '',
                endDate: tripData.endDate || '',
                pax: tripData.pax || '2 voyageurs',
                nights,
                agentName: 'Luna Conciergerie',
                segments: allSegments.map(s => ({ type: s.type, title: s.title, description: s.description || '' })),
                totalAmount,
                refNumber: `DEV-${new Date().getFullYear()}-${tripId.slice(0, 4).toUpperCase()}`,
            };

            const res = await fetch('/api/crm/devis-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('PDF generation failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Devis_${(tripData.destination || 'Voyage').replace(/\s+/g, '_')}_${body.refNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[Devis PDF Error]', err);
            alert('Erreur lors de la génération du devis PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return <div className="p-8"><p className="text-center text-gray-500 animate-pulse">Chargement de l'itinéraire...</p></div>;
    }

    return (
        <div className="min-h-screen pb-32">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Itinéraire Détaillé</h1>
                        <p className="text-sm text-[#6B7280] mt-1 font-medium">Planification jour par jour</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={async () => {
                        setSharing(true);
                        try {
                            const shareId = await shareTripPublic(tenantId!, tripId);
                            const url = `${window.location.origin}/trip/${shareId}`;
                            setShareUrl(url);
                            await navigator.clipboard.writeText(url);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 3000);
                        } catch (err) {
                            console.error(err);
                            alert('Erreur lors du partage');
                        } finally {
                            setSharing(false);
                        }
                    }} className="bg-gradient-to-r from-[#E2C8A9] to-[#D4B896] hover:from-[#D4B896] hover:to-[#C5A886] text-white px-4 py-2 rounded-xl text-sm font-normal transition-all flex items-center gap-2 shadow-sm">
                        {sharing ? (
                            <><Loader2 size={14} className="animate-spin" /> Partage...</>
                        ) : copied ? (
                            <><Check size={16} /> Lien copié !</>
                        ) : (
                            <><Share2 size={16} /> Partager au client</>
                        )}
                    </button>
                    {shareUrl && (
                        <button onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }} className="bg-white border border-gray-200 text-luna-charcoal px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center gap-2" title={shareUrl}>
                            <Copy size={14} /> <span className="text-xs text-gray-500 max-w-[200px] truncate">{shareUrl}</span>
                        </button>
                    )}
                    <button
                        onClick={handleDownloadDevis}
                        disabled={generatingPdf || days.flatMap(d => d.segments).length === 0}
                        className="bg-[#5a8fa3] hover:bg-[#4a7f93] text-white px-4 py-2 rounded-xl text-sm font-normal transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPdf ? (
                            <><Loader2 size={14} className="animate-spin" /> Génération...</>
                        ) : (
                            <><FileDown size={16} /> Télécharger Devis</>                        )}
                    </button>
                    <button onClick={addDay} className="bg-white border border-gray-200 text-luna-charcoal px-4 py-2 rounded-xl text-sm font-normal hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <CalendarIcon size={16} /> Ajouter un Jour
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-2">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {days.map((day) => (
                    <div key={day.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden group">
                        {/* Day Header */}
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white shadow-sm border border-gray-200 px-3 py-1.5 rounded-lg text-center">
                                    <span className="block text-xs font-normal tracking-wide text-gray-400">Jour</span>
                                    <span className="block text-lg font-normal text-luna-charcoal">{day.dayIndex}</span>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={day.title || ''}
                                        onChange={(e) => {
                                            const newDays = [...days];
                                            const dx = newDays.findIndex(d => d.id === day.id);
                                            newDays[dx].title = e.target.value;
                                            setDays(newDays);
                                        }}
                                        className="font-normal text-lg text-luna-charcoal bg-transparent border-none p-0 focus:ring-0 w-64 placeholder-gray-300"
                                        placeholder="Titre de la journée"
                                    />
                                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addSegment(day.id, 'FLIGHT')} className="p-1.5 bg-sky-50 text-sky-600 rounded-md hover:bg-sky-100 tooltip"><Plane size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'HOTEL')} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 tooltip"><Hotel size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'ACTIVITY')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 tooltip"><Map size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'TRANSFER')} className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 tooltip"><Car size={16} /></button>
                            </div>
                        </div>

                        {/* Segments List */}
                        <div className="p-6">
                            {day.segments.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune étape planifiée pour ce jour.</p>
                                    <div className="flex justify-center gap-3 mt-3">
                                        <button onClick={() => addSegment(day.id, 'ACTIVITY')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-normal text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                                            <Plus size={14} /> Activité
                                        </button>
                                        <button onClick={() => addSegment(day.id, 'HOTEL')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-normal text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                                            <Plus size={14} /> Hôtel
                                        </button>
                                        <button onClick={() => {
                                            setPendingSegmentType('ACTIVITY');
                                            setCatalogPickerTarget({ dayId: day.id, segmentIdx: -1 });
                                            setShowCatalogPicker(true);
                                        }} className="text-xs bg-[#bcdeea]/20 border border-[#bcdeea]/50 px-3 py-1.5 rounded-lg font-normal text-[#2E2E2E] hover:bg-[#bcdeea]/30 flex items-center gap-1.5">
                                            <Package size={14} /> Du catalogue
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {day.segments.map((segment, idx) => (
                                        <div key={segment.id} className="flex flex-wrap items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-white relative group/segment">
                                            <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                                <GripVertical size={18} />
                                            </div>

                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                                {getSegmentIcon(segment.type)}
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="col-span-12 md:col-span-4">
                                                    <input
                                                        type="text"
                                                        value={segment.title}
                                                        onChange={(e) => {
                                                            const newDays = [...days];
                                                            const dx = newDays.findIndex(d => d.id === day.id);
                                                            newDays[dx].segments[idx].title = e.target.value;
                                                            setDays(newDays);
                                                        }}
                                                        className="font-normal text-sm text-luna-charcoal w-full border-none p-0 focus:ring-0 mb-1"
                                                        placeholder="Titre de l'étape"
                                                    />
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-max">
                                                        <Clock size={12} />
                                                        <select
                                                            value={segment.timeSlot}
                                                            onChange={(e) => {
                                                                const newDays = [...days];
                                                                const dx = newDays.findIndex(d => d.id === day.id);
                                                                newDays[dx].segments[idx].timeSlot = e.target.value;
                                                                setDays(newDays);
                                                            }}
                                                            className="bg-transparent border-none p-0 text-xs font-normal focus:ring-0 text-gray-600"
                                                        >
                                                            <option value="Morning">Matin</option>
                                                            <option value="Afternoon">Après-midi</option>
                                                            <option value="Evening">Soirée</option>
                                                            <option value="Night">Nuit</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-span-12 md:col-span-8">
                                                    <textarea
                                                        value={segment.description || ''}
                                                        onChange={(e) => {
                                                            const newDays = [...days];
                                                            const dx = newDays.findIndex(d => d.id === day.id);
                                                            newDays[dx].segments[idx].description = e.target.value;
                                                            setDays(newDays);
                                                        }}
                                                        placeholder="Description de l'activité, lieu de rendez-vous, numéro de réservation..."
                                                        className="w-full text-sm text-gray-600 border border-transparent hover:border-gray-200 focus:border-gray-200 focus:bg-gray-50 rounded-lg p-2 resize-none h-16 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeSegment(day.id, segment.id)}
                                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover/segment:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            {/* ═══ FUSION: Financial row + catalog link ═══ */}
                                            <div className="w-full mt-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {segment.catalogItemId ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                                                <Package size={10} /> Lié au catalogue
                                                            </span>
                                                            <button
                                                                onClick={() => unlinkSegment(day.id, idx)}
                                                                className="text-[9px] text-gray-400 hover:text-red-400 flex items-center gap-0.5 transition-colors"
                                                            >
                                                                <Unlink size={10} /> Délier
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setCatalogPickerTarget({ dayId: day.id, segmentIdx: idx, type: segment.type });
                                                                setShowCatalogPicker(true);
                                                            }}
                                                            className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#2E2E2E] bg-gray-50 hover:bg-[#bcdeea]/20 px-2 py-0.5 rounded-full border border-gray-100 hover:border-[#bcdeea] flex items-center gap-1 transition-all"
                                                        >
                                                            <Package size={10} /> Lier au catalogue
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-[10px]">
                                                    {(segment.netCost || 0) > 0 && (
                                                        <>
                                                            <span className="text-gray-400">Net: <strong className="text-gray-600">{(segment.netCost || 0).toLocaleString('fr-FR')}€</strong></span>
                                                            <span className="text-[#2E2E2E] font-bold">Client: {(segment.clientPrice || 0).toLocaleString('fr-FR')}€</span>
                                                            <span className="text-emerald-600 font-medium">+{segment.markupPercent || 0}%</span>
                                                        </>
                                                    )}
                                                    {segment.bookingStatus && segment.bookingStatus !== 'NONE' && (
                                                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${segment.bookingStatus === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                            segment.bookingStatus === 'PROPOSED' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                                'bg-rose-50 text-rose-600 border border-rose-200'
                                                            }`}>
                                                            {segment.bookingStatus === 'CONFIRMED' ? 'Confirmé' : segment.bookingStatus === 'PROPOSED' ? 'En attente' : 'Annulé'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button
                    onClick={addDay}
                    className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 font-normal rounded-2xl hover:border-luna-charcoal hover:text-luna-charcoal transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Ajouter un Jour
                </button>

                {/* ═══ FUSION: Trip Financial Totals ═══ */}
                {tripTotals.segmentCount > 0 && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-6 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#bcdeea]/20 border border-[#bcdeea]/40 flex items-center justify-center">
                                    <DollarSign size={18} className="text-[#2E2E2E]" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Budget Voyage — {tripTotals.segmentCount} segment{tripTotals.segmentCount > 1 ? 's' : ''} ({tripTotals.linkedCount} lié{tripTotals.linkedCount > 1 ? 's' : ''} au catalogue)</p>
                                    <p className="text-2xl font-light text-[#2E2E2E] tracking-tight">{tripTotals.totalAmount.toLocaleString('fr-FR')} €</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Coût Net</p>
                                    <p className="text-sm font-medium text-gray-600">{tripTotals.totalCost.toLocaleString('fr-FR')} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Marge</p>
                                    <p className={`text-sm font-bold ${tripTotals.margin > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{tripTotals.margin.toLocaleString('fr-FR')} €</p>
                                </div>
                                {tripTotals.totalCost > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Taux</p>
                                        <p className="text-sm font-bold text-emerald-600">{Math.round(tripTotals.margin / tripTotals.totalCost * 100)}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ MESSAGES PLANIFIÉS ═══ */}
                {tripData?.shareId && (
                    <div className="mt-10 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageCircle size={18} className="text-[#E2C8A9]" />
                                <div>
                                    <h2 className="text-sm font-medium text-[#2E2E2E]">Messages Programmés</h2>
                                    <p className="text-[10px] text-gray-400">Envoyez des messages personnalisés au client avant son départ</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMsgForm(true)}
                                className="bg-[#2E2E2E] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[#1a1a1a] transition-colors"
                            >
                                <Plus size={14} /> Nouveau message
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Quick add buttons */}
                            {tripData?.startDate && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold w-full mb-1">Ajout rapide</p>
                                    {[{ label: 'J-30', days: 30, title: 'Un mois avant', msg: `Bonjour !\nVotre voyage à ${tripData.destination} approche. Pensez à vérifier votre passeport et vos vaccins.` },
                                    { label: 'J-14', days: 14, title: 'Deux semaines', msg: `Votre voyage se rapproche !\nN'oubliez pas de préparer vos documents de voyage et votre assurance.` },
                                    { label: 'J-7', days: 7, title: 'Une semaine', msg: `Plus qu'une semaine avant ${tripData.destination} !\nPensez à préparer vos valises et vérifier la météo.` },
                                    { label: 'J-3', days: 3, title: 'Bientôt le départ', msg: `Le grand jour approche !\nVérifiez vos billets, votre enregistrement en ligne et préparez vos dernières affaires.` },
                                    { label: 'J-1', days: 1, title: 'La veille', msg: `C'est demain !\nReposez-vous bien ce soir, votre aventure commence demain. Bon voyage !` },
                                    { label: 'Jour J', days: 0, title: 'Jour du départ', msg: `Le jour est arrivé !\nToute l'équipe Luna vous souhaite un merveilleux voyage.` }
                                    ].map(preset => {
                                        const targetDate = subDays(parseISO(tripData.startDate), preset.days);
                                        const isPast = targetDate < new Date();
                                        const alreadyExists = scheduledMsgs.some(m => m.daysBeforeDeparture === preset.days);
                                        return (
                                            <button
                                                key={preset.label}
                                                disabled={isPast || alreadyExists}
                                                onClick={async () => {
                                                    try {
                                                        await addScheduledMessage(tripData.shareId, {
                                                            scheduledDate: targetDate.toISOString().split('T')[0],
                                                            daysBeforeDeparture: preset.days,
                                                            title: preset.title,
                                                            message: preset.msg,
                                                            channel: 'WHATSAPP',
                                                        });
                                                        const msgs = await getScheduledMessages(tripData.shareId);
                                                        setScheduledMsgs(msgs);
                                                    } catch (err) { console.error(err); alert('Erreur'); }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${alreadyExists
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                                                    : isPast
                                                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                        : 'bg-white text-[#2E2E2E] border-gray-200 hover:border-[#E2C8A9] hover:bg-[#FAF6F1]'
                                                    }`}
                                            >
                                                {alreadyExists ? <Check size={12} /> : null}
                                                {preset.label}
                                                <span className="text-[9px] text-gray-400">{format(targetDate, 'd MMM', { locale: fr })}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Custom form */}
                            {showMsgForm && (
                                <div className="bg-gray-50/80 rounded-xl p-4 mb-5 border border-gray-100">
                                    <p className="text-xs font-medium text-[#2E2E2E] mb-3">Nouveau message personnalisé</p>
                                    <div className="grid grid-cols-12 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Titre (ex: Rappel passeport)"
                                            value={newMsg.title}
                                            onChange={e => setNewMsg({ ...newMsg, title: e.target.value })}
                                            className="col-span-4 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#E2C8A9] focus:ring-0"
                                        />
                                        <input
                                            type="date"
                                            value={newMsg.scheduledDate}
                                            onChange={e => setNewMsg({ ...newMsg, scheduledDate: e.target.value })}
                                            className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#E2C8A9] focus:ring-0"
                                        />
                                        <select
                                            value={newMsg.channel}
                                            onChange={e => setNewMsg({ ...newMsg, channel: e.target.value as any })}
                                            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#E2C8A9] focus:ring-0"
                                        >
                                            <option value="WHATSAPP">WhatsApp</option>
                                            <option value="EMAIL">Email</option>
                                            <option value="SMS">SMS</option>
                                        </select>
                                        <div className="col-span-3 flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (!newMsg.title || !newMsg.scheduledDate || !newMsg.message) return alert('Remplissez tous les champs');
                                                    try {
                                                        const departure = parseISO(tripData.startDate);
                                                        const target = parseISO(newMsg.scheduledDate);
                                                        const daysBefore = Math.max(0, Math.round((departure.getTime() - target.getTime()) / 86400000));
                                                        await addScheduledMessage(tripData.shareId, {
                                                            ...newMsg,
                                                            daysBeforeDeparture: daysBefore,
                                                        });
                                                        const msgs = await getScheduledMessages(tripData.shareId);
                                                        setScheduledMsgs(msgs);
                                                        setShowMsgForm(false);
                                                        setNewMsg({ title: '', message: '', scheduledDate: '', channel: 'WHATSAPP', daysBeforeDeparture: 7 });
                                                    } catch (err) { console.error(err); alert('Erreur'); }
                                                }}
                                                className="flex-1 bg-[#2E2E2E] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-[#1a1a1a] transition-colors"
                                            >
                                                <Send size={12} /> Ajouter
                                            </button>
                                            <button
                                                onClick={() => setShowMsgForm(false)}
                                                className="px-3 py-2 bg-white text-gray-500 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
                                            >✕</button>
                                        </div>
                                        <textarea
                                            placeholder="Votre message au client..."
                                            value={newMsg.message}
                                            onChange={e => setNewMsg({ ...newMsg, message: e.target.value })}
                                            rows={3}
                                            className="col-span-12 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-[#E2C8A9] focus:ring-0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Messages list */}
                            {scheduledMsgs.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageCircle size={24} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-xs text-gray-400">Aucun message programmé</p>
                                    <p className="text-[10px] text-gray-300 mt-1">Utilisez les boutons ci-dessus pour en ajouter</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {scheduledMsgs.map((msg, i) => {
                                        const isPast = new Date(msg.scheduledDate) <= new Date();
                                        return (
                                            <div key={msg.id || i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isPast ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-100'}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {msg.channel === 'WHATSAPP' ? <MessageCircle size={12} /> : msg.channel === 'EMAIL' ? <Mail size={12} /> : <Smartphone size={12} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-medium text-[#2E2E2E]">{msg.title}</span>
                                                        <span className="text-[9px] text-gray-400">
                                                            {format(new Date(msg.scheduledDate), 'd MMM yyyy', { locale: fr })}
                                                        </span>
                                                        {msg.daysBeforeDeparture > 0 && (
                                                            <span className="text-[8px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                J-{msg.daysBeforeDeparture}
                                                            </span>
                                                        )}
                                                        {isPast && <span className="text-[8px] text-emerald-500 font-bold">● Visible</span>}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 whitespace-pre-line">{msg.message}</p>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Supprimer ce message ?')) return;
                                                        await deleteScheduledMessage(tripData.shareId, msg.id!);
                                                        const msgs = await getScheduledMessages(tripData.shareId);
                                                        setScheduledMsgs(msgs);
                                                    }}
                                                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ EMAILS VOYAGE ═══ */}
                {tripData?.shareId && (
                    <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-[#C4956A]" />
                                <div>
                                    <h2 className="text-sm font-medium text-[#2E2E2E]">Emails Voyage</h2>
                                    <p className="text-[10px] text-gray-400">
                                        {clientContact?.email
                                            ? `Envoyer à ${clientContact.firstName} (${clientContact.email})`
                                            : 'Aucun email client trouvé — vérifiez le contact lié'}
                                    </p>
                                </div>
                            </div>
                            {emailSent && (
                                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                                    <Check size={12} /> Email envoyé !
                                </span>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Carnet de Voyage */}
                                <button
                                    onClick={handleSendRoadmap}
                                    disabled={sendingRoadmap || !clientContact?.email || !shareUrl}
                                    className={`group relative p-5 rounded-xl border-2 transition-all text-left ${
                                        emailSent === 'roadmap'
                                            ? 'border-emerald-200 bg-emerald-50/50'
                                            : 'border-gray-100 hover:border-[#E2C8A9] hover:bg-[#FAF6F1]/50'
                                    } ${(!clientContact?.email || !shareUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] flex items-center justify-center text-lg">
                                            🗺
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#2E2E2E]">Carnet de Voyage</p>
                                            <p className="text-[10px] text-gray-400">Itinéraire jour par jour</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                        Envoie l'itinéraire complet avec les {days.length} jour{days.length > 1 ? 's' : ''} planifié{days.length > 1 ? 's' : ''} et un lien vers le carnet interactif.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-[#C4956A]">
                                        {sendingRoadmap ? (
                                            <><Loader2 size={14} className="animate-spin" /> Envoi en cours...</>
                                        ) : emailSent === 'roadmap' ? (
                                            <><Check size={14} /> Envoyé !</>
                                        ) : (
                                            <><Send size={14} /> Envoyer par email</>
                                        )}
                                    </div>
                                </button>

                                {/* Avant le Départ */}
                                <button
                                    onClick={handleSendPreDeparture}
                                    disabled={sendingDeparture || !clientContact?.email || !shareUrl}
                                    className={`group relative p-5 rounded-xl border-2 transition-all text-left ${
                                        emailSent === 'departure'
                                            ? 'border-emerald-200 bg-emerald-50/50'
                                            : 'border-gray-100 hover:border-[#f59e0b] hover:bg-[#FFFBF0]/50'
                                    } ${(!clientContact?.email || !shareUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-lg">
                                            ✈️
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#2E2E2E]">Avant le Départ</p>
                                            <p className="text-[10px] text-gray-400">Checklist & conseils pratiques</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                        Envoie la checklist pré-départ, les conseils pratiques pour {tripData?.destination || 'la destination'} et le numéro d'urgence.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-[#f59e0b]">
                                        {sendingDeparture ? (
                                            <><Loader2 size={14} className="animate-spin" /> Envoi en cours...</>
                                        ) : emailSent === 'departure' ? (
                                            <><Check size={14} /> Envoyé !</>
                                        ) : (
                                            <><Send size={14} /> Envoyer par email</>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {!shareUrl && (
                                <p className="text-[10px] text-amber-500 mt-3 text-center">
                                    ⚠️ Vous devez d'abord partager le voyage au client pour activer l'envoi d'emails.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ FUSION: Catalog Picker Modal ═══ */}
            <CatalogPicker
                isOpen={showCatalogPicker}
                onClose={() => { setShowCatalogPicker(false); setCatalogPickerTarget(null); }}
                onSelect={(item) => {
                    if (catalogPickerTarget) {
                        if (catalogPickerTarget.segmentIdx === -1) {
                            const mappedType = (
                                item.type === 'HOTEL' ? 'HOTEL' :
                                    item.type === 'FLIGHT' ? 'FLIGHT' :
                                        item.type === 'TRANSFER' ? 'TRANSFER' : 'ACTIVITY'
                            ) as 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER';
                            addSegment(catalogPickerTarget.dayId, mappedType, item);
                            setShowCatalogPicker(false);
                            setCatalogPickerTarget(null);
                        } else {
                            linkSegmentToCatalog(item);
                        }
                    }
                }}
                tenantId={tenantId!}
                filterType={catalogPickerTarget?.type}
            />
        </div>
    );
}
