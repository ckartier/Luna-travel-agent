'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, FileText, Loader2, ShieldCheck, BellRing, Bell, X, LogOut, UserCircle2, SlidersHorizontal, FilterX, BadgeEuro, Percent, ChevronDown, Sparkles, Languages } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { LOCALE_LABELS, type LunaLocale } from '@/src/lib/i18n/translations';
import { detectProAuthLocale, PRO_AUTH_LOCALE_STORAGE_KEY } from '@/src/lib/i18n/proAuth';
import { PRO_DASHBOARD_COPY } from '@/src/lib/i18n/proDashboard';

type CatalogItem = {
    id: string;
    type: string;
    name: string;
    location: string;
    description: string;
    clientPrice: number;
    currency: string;
    images?: string[];
    video?: string;
};

type RequestedSlot = {
    date: string;
    startTime: string;
    endTime: string;
    note: string;
};

function emptyRequestedSlot(): RequestedSlot {
    return {
        date: '',
        startTime: '',
        endTime: '',
        note: '',
    };
}

type CreatedWorkflow = {
    trip: {
        id: string;
        status: string;
        totalClientPrice: number;
        commissionRate: number;
        commissionAmount: number;
        supplierEstimatedCost: number;
    };
    invoice: {
        id: string;
        invoiceNumber: string;
        status: string;
        totalAmount: number;
    };
    reminder: {
        id: string;
        dueDate: string;
    };
};

type TripListItem = {
    id: string;
    title: string;
    clientName: string;
    clientEmail?: string;
    destination: string;
    startDate: string;
    planningAlertDate: string;
    status: string;
    source?: string;
    totalClientPrice: number;
    commissionAmount: number;
    commissionRate: number;
    lunaTripValidated: boolean;
    lunaReservationValidated: boolean;
    proWorkflowState?: string;
    proWorkflowMessage?: string;
    proWorkflowSlots?: Array<{
        itemId?: string;
        description?: string;
        type?: string;
        location?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        availability?: string;
        note?: string;
    }>;
    proLunaAlertSeen?: boolean;
    proLunaAlertAt?: string;
    invoiceId: string;
};

const LOCALE_NUMBER_FORMAT: Record<LunaLocale, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    da: 'da-DK',
    nl: 'nl-NL',
    es: 'es-ES',
};

export default function ProTravelPage() {
    const router = useRouter();
    const { user, userProfile, loading, logout } = useAuth();
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [trips, setTrips] = useState<TripListItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [requestedSlots, setRequestedSlots] = useState<Record<string, RequestedSlot>>({});
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [updatingWorkflowTripId, setUpdatingWorkflowTripId] = useState('');
    const [showCrmAlerts, setShowCrmAlerts] = useState(false);
    const [markingAlertTripId, setMarkingAlertTripId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [workflow, setWorkflow] = useState<CreatedWorkflow | null>(null);
    const [proLocale, setProLocale] = useState<LunaLocale>('fr');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [priceBandFilter, setPriceBandFilter] = useState('all');
    const [onlyWithImage, setOnlyWithImage] = useState(false);
    const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'name_asc'>('recommended');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [openSections, setOpenSections] = useState({
        planning: true,
        prestations: false,
        trip: false,
        finance: false,
    });
    const [form, setForm] = useState({
        clientName: '',
        clientEmail: '',
        destination: '',
        startDate: '',
        endDate: '',
        travelers: 2,
        commissionRate: 12,
        notes: '',
    });

    const tenantId = userProfile?.tenantId || '';
    const planningRef = useRef<HTMLElement | null>(null);
    const prestationsRef = useRef<HTMLElement | null>(null);
    const tripRef = useRef<HTMLElement | null>(null);
    const financeRef = useRef<HTMLElement | null>(null);
    const crmAlertsRef = useRef<HTMLDivElement | null>(null);
    const copy = PRO_DASHBOARD_COPY[proLocale];
    const numberLocale = LOCALE_NUMBER_FORMAT[proLocale] || 'fr-FR';

    const formatAmount = (value: number) => Number(value || 0).toLocaleString(numberLocale);

    const handleLogout = async () => {
        await logout();
        router.replace(`/login/pro?lang=${proLocale}`);
    };

    useEffect(() => {
        const resolved = detectProAuthLocale(null);
        setProLocale(resolved);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, resolved);
        }
    }, []);

    const handleProLocaleChange = (locale: LunaLocale) => {
        setProLocale(locale);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PRO_AUTH_LOCALE_STORAGE_KEY, locale);
        }
    };

    useEffect(() => {
        let mounted = true;
        const loadCatalog = async () => {
            setCatalogLoading(true);
            try {
                const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
                const res = await fetch(`/api/conciergerie/catalog${query}`);
                const data = await res.json();
                if (!mounted) return;
                setCatalog(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
            } catch {
                if (!mounted) return;
                setCatalog([]);
            } finally {
                if (mounted) setCatalogLoading(false);
            }
        };
        loadCatalog();
        return () => {
            mounted = false;
        };
    }, [tenantId]);

    const loadTrips = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetchWithAuth('/api/pro/travel-workflow');
            const data = await res.json();
            if (res.ok) {
                setTrips(Array.isArray(data?.trips) ? data.trips : []);
            }
        } catch {
            setTrips([]);
        }
    }, [user]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            loadTrips();
        }, 15000);
        return () => clearInterval(interval);
    }, [loadTrips, user]);

    useEffect(() => {
        if (!showCrmAlerts) return;
        const handleOutside = (event: MouseEvent) => {
            if (crmAlertsRef.current && !crmAlertsRef.current.contains(event.target as Node)) {
                setShowCrmAlerts(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showCrmAlerts]);

    const selectedItems = useMemo(
        () => catalog.filter((item) => selectedIds.includes(item.id)),
        [catalog, selectedIds]
    );

    const catalogTypes = useMemo(
        () => Array.from(new Set(catalog.map((item) => (item.type || 'OTHER').toUpperCase()))).sort(),
        [catalog]
    );

    const catalogLocations = useMemo(
        () =>
            Array.from(
                new Set(
                    catalog
                        .map((item) => (item.location || '').trim())
                        .filter((value) => value.length > 0)
                )
            ).sort(),
        [catalog]
    );

    const getPriceBand = (price: number) => {
        if (price < 500) return 'lt_500';
        if (price < 1500) return '500_1499';
        if (price < 3000) return '1500_2999';
        return 'gte_3000';
    };

    const filteredCatalog = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const base = catalog.filter((item) => {
            const itemType = (item.type || 'OTHER').toUpperCase();
            const itemLocation = (item.location || '').trim();
            const itemPrice = Number(item.clientPrice || 0);
            const typeOk = typeFilter === 'all' || itemType === typeFilter;
            if (!typeOk) return false;
            if (locationFilter !== 'all' && itemLocation !== locationFilter) return false;
            if (onlyWithImage && !(Array.isArray(item.images) && item.images.length > 0)) return false;
            if (priceBandFilter !== 'all' && getPriceBand(itemPrice) !== priceBandFilter) return false;
            if (!q) return true;
            return (
                item.name?.toLowerCase().includes(q) ||
                item.location?.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                itemType.toLowerCase().includes(q)
            );
        });
        if (sortBy === 'price_asc') {
            return [...base].sort((a, b) => Number(a.clientPrice || 0) - Number(b.clientPrice || 0));
        }
        if (sortBy === 'price_desc') {
            return [...base].sort((a, b) => Number(b.clientPrice || 0) - Number(a.clientPrice || 0));
        }
        if (sortBy === 'name_asc') {
            return [...base].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));
        }
        return base;
    }, [catalog, searchTerm, typeFilter, locationFilter, onlyWithImage, priceBandFilter, sortBy]);

    const catalogWithImagesCount = useMemo(
        () => catalog.filter((item) => Array.isArray(item.images) && item.images.length > 0).length,
        [catalog]
    );

    const totalClientPrice = useMemo(
        () => selectedItems.reduce((sum, item) => sum + Number(item.clientPrice || 0), 0),
        [selectedItems]
    );

    const commissionAmount = useMemo(
        () => Number((totalClientPrice * (form.commissionRate / 100)).toFixed(2)),
        [form.commissionRate, totalClientPrice]
    );

    const supplierEstimatedCost = useMemo(
        () => Number((totalClientPrice - commissionAmount).toFixed(2)),
        [commissionAmount, totalClientPrice]
    );

    const planningSummary = useMemo(() => {
        const total = trips.length;
        const tripsValidated = trips.filter((t) => t.lunaTripValidated).length;
        const reservationsValidated = trips.filter((t) => t.lunaReservationValidated).length;
        return { total, tripsValidated, reservationsValidated };
    }, [trips]);

    const selectedTotal = useMemo(
        () => selectedItems.reduce((sum, item) => sum + Number(item.clientPrice || 0), 0),
        [selectedItems]
    );

    const latestTrip = useMemo(() => (trips.length > 0 ? trips[0] : null), [trips]);

    const validatedCrmAlerts = useMemo(
        () =>
            trips
                .filter((trip) =>
                    trip.proWorkflowState === 'LUNA_VALIDATED' ||
                    (trip.source === 'pro-workflow' &&
                        trip.status === 'CONFIRMED' &&
                        trip.lunaTripValidated &&
                        trip.lunaReservationValidated)
                )
                .sort((a, b) => String(b.proLunaAlertAt || '').localeCompare(String(a.proLunaAlertAt || ''))),
        [trips]
    );

    const unreadValidatedAlertsCount = useMemo(
        () => validatedCrmAlerts.filter((trip) => trip.proLunaAlertSeen === false).length,
        [validatedCrmAlerts]
    );

    const getWorkflowLabel = (state?: string) => {
        if (state === 'SENT_TO_PRO') return copy.workflowSent;
        if (state === 'PRO_CONFIRMED') return copy.workflowConfirmed;
        if (state === 'LUNA_VALIDATED') return copy.workflowFinal;
        if (state === 'PENDING_REVIEW') return copy.workflowPending;
        return copy.workflowInReview;
    };

    const getAvailabilityLabel = (value?: string) => {
        if (value === 'ALTERNATIVE') return copy.availabilityAlternative;
        if (value === 'UNAVAILABLE') return copy.availabilityUnavailable;
        return copy.availabilityAvailable;
    };

    const formatSlotLine = (slot: NonNullable<TripListItem['proWorkflowSlots']>[number]) => {
        const title = slot.description || copy.notAvailable;
        const date = slot.date || copy.dateToDefine;
        const time = slot.startTime || slot.endTime ? `${slot.startTime || '--:--'}-${slot.endTime || '--:--'}` : '--:--';
        const availability = getAvailabilityLabel(slot.availability);
        const note = slot.note ? ` · ${slot.note}` : '';
        return `${title}: ${date} ${time} (${availability})${note}`;
    };

    const toggleItem = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                setRequestedSlots((current) => {
                    const next = { ...current };
                    delete next[id];
                    return next;
                });
                return prev.filter((x) => x !== id);
            }
            setRequestedSlots((current) => ({ ...current, [id]: current[id] || emptyRequestedSlot() }));
            return [...prev, id];
        });
    };

    const setRequestedSlot = (itemId: string, patch: Partial<RequestedSlot>) => {
        setRequestedSlots((prev) => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || emptyRequestedSlot()),
                ...patch,
            },
        }));
    };

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const openAndFocusSection = (
        key: keyof typeof openSections,
        ref: { current: HTMLElement | HTMLDivElement | null }
    ) => {
        setOpenSections((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    };

    const createWorkflow = async () => {
        setError('');
        setSuccess('');
        if (!form.clientName.trim()) {
            setError(copy.errorRequiredClient);
            return;
        }
        if (!form.destination.trim()) {
            setError(copy.errorRequiredDestination);
            return;
        }
        if (selectedItems.length === 0) {
            setError(copy.errorRequiredItem);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetchWithAuth('/api/pro/travel-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    items: selectedItems.map((item) => {
                        const slot = requestedSlots[item.id] || emptyRequestedSlot();
                        return {
                            id: item.id,
                            name: item.name,
                            type: item.type,
                            location: item.location,
                            clientPrice: item.clientPrice,
                            currency: item.currency,
                            requestedDate: slot.date,
                            requestedStartTime: slot.startTime,
                            requestedEndTime: slot.endTime,
                            requestedNote: slot.note,
                        };
                    }),
                    currency: 'EUR',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || copy.errorCreateTrip);
                return;
            }
            setWorkflow(data);
            setSuccess(`${copy.successTripCreated} ${data?.trip?.id}. ${copy.successInvoice} ${data?.invoice?.invoiceNumber}.`);
            await loadTrips();
        } catch {
            setError(copy.errorNetworkCreate);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmWorkflow = async () => {
        if (!workflow?.trip?.id) return;
        setError('');
        setSuccess('');
        setConfirming(true);
        try {
            const res = await fetchWithAuth('/api/pro/travel-workflow', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: workflow.trip.id,
                    invoiceId: workflow.invoice?.id || '',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || copy.errorConfirm);
                return;
            }
            setWorkflow((prev) =>
                prev
                    ? {
                        ...prev,
                        trip: { ...prev.trip, status: data?.confirmation?.tripStatus || 'CONFIRMED' },
                        invoice: prev.invoice
                            ? { ...prev.invoice, status: data?.confirmation?.invoiceStatus || prev.invoice.status }
                            : prev.invoice,
                    }
                    : prev
            );
            setSuccess(copy.successConfirm);
            await loadTrips();
        } catch {
            setError(copy.errorNetworkConfirm);
        } finally {
            setConfirming(false);
        }
    };

    const acknowledgeToLuna = async (tripId: string) => {
        setError('');
        setSuccess('');
        setUpdatingWorkflowTripId(tripId);
        try {
            const res = await fetchWithAuth('/api/pro/travel-workflow', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'pro_acknowledge',
                    tripId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || copy.errorValidationUpdate);
                return;
            }
            setTrips((prev) =>
                prev.map((trip) =>
                    trip.id === tripId
                        ? {
                            ...trip,
                            proWorkflowState: data?.workflow?.proWorkflowState || 'PRO_CONFIRMED',
                        }
                        : trip
                )
            );
            setSuccess(copy.successSentToLuna);
        } catch {
            setError(copy.errorValidationUpdate);
        } finally {
            setUpdatingWorkflowTripId('');
        }
    };

    const markLunaAlertSeen = async (tripId: string) => {
        setMarkingAlertTripId(tripId);
        setError('');
        try {
            const res = await fetchWithAuth('/api/pro/travel-workflow', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark_luna_alert_seen',
                    tripId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || copy.errorAlertMarkRead);
                return;
            }
            setTrips((prev) =>
                prev.map((trip) =>
                    trip.id === tripId
                        ? {
                            ...trip,
                            proLunaAlertSeen: true,
                        }
                        : trip
                )
            );
        } catch {
            setError(copy.errorAlertMarkRead);
        } finally {
            setMarkingAlertTripId('');
        }
    };

    const markAllLunaAlertsSeen = async () => {
        const unreadIds = validatedCrmAlerts.filter((trip) => trip.proLunaAlertSeen === false).map((trip) => trip.id);
        if (unreadIds.length === 0) return;
        for (const tripId of unreadIds) {
            // sequential updates to keep state consistent and avoid burst failures
            await markLunaAlertSeen(tripId);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5a8fa3]" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-8">
                    <h1 className="text-2xl text-[#1f2937] mb-3">{copy.unauthTitle}</h1>
                    <p className="text-sm text-gray-600 mb-6">
                        {copy.unauthSubtitle}
                    </p>
                    <div className="flex gap-3">
                        <Link href={`/login/pro?lang=${proLocale}`} className="px-4 py-2 rounded-lg bg-[#1f2937] text-white text-sm">
                            {copy.login}
                        </Link>
                        <Link href={`/signup/pro?lang=${proLocale}`} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">
                            {copy.signup}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] px-4 md:px-10 py-8">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                <header className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#5a8fa3]">{copy.headerBadge}</p>
                            <h1 className="text-2xl md:text-3xl text-[#111827] mt-2">{copy.headerTitle}</h1>
                            <p className="text-sm text-gray-600 mt-2">
                                {copy.connected}: <strong>{user.email}</strong> {tenantId ? `· ${copy.tenant}: ${tenantId}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative" ref={crmAlertsRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowCrmAlerts((prev) => !prev)}
                                    className={`px-4 py-2 text-sm rounded-lg border inline-flex items-center gap-2 transition-colors ${
                                        unreadValidatedAlertsCount > 0
                                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                            : 'border-gray-300 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    {unreadValidatedAlertsCount > 0 ? <BellRing size={14} /> : <Bell size={14} />}
                                    {copy.crmAlertBell}
                                    {unreadValidatedAlertsCount > 0 ? (
                                        <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                                            {unreadValidatedAlertsCount}
                                        </span>
                                    ) : null}
                                </button>
                                {showCrmAlerts ? (
                                    <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-xl z-30 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#111827]">{copy.crmAlertTitle}</p>
                                                <p className="text-xs text-gray-500">
                                                    {unreadValidatedAlertsCount} {copy.crmAlertUnread}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {unreadValidatedAlertsCount > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={markAllLunaAlertsSeen}
                                                        className="text-xs text-[#2c667b] hover:underline"
                                                    >
                                                        {copy.crmAlertMarkAllRead}
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCrmAlerts(false)}
                                                    className="p-1 rounded-md hover:bg-gray-100"
                                                >
                                                    <X size={14} className="text-gray-500" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {validatedCrmAlerts.length === 0 ? (
                                                <p className="px-4 py-5 text-sm text-gray-500">{copy.crmAlertEmpty}</p>
                                            ) : (
                                                validatedCrmAlerts.map((trip) => (
                                                    <div key={`alert-${trip.id}`} className={`px-4 py-3 border-b border-gray-100 ${trip.proLunaAlertSeen === false ? 'bg-amber-50/50' : 'bg-white'}`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-[#111827]">{copy.crmAlertTripValidated}</p>
                                                                <p className="text-xs text-gray-600 mt-0.5">
                                                                    {trip.clientName} · {trip.destination}
                                                                </p>
                                                                <p className="text-[11px] text-gray-500 mt-1">
                                                                    {trip.proLunaAlertAt || copy.notAvailable}
                                                                </p>
                                                            </div>
                                                            {trip.proLunaAlertSeen === false ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => markLunaAlertSeen(trip.id)}
                                                                    disabled={markingAlertTripId === trip.id}
                                                                    className="px-2.5 py-1 rounded-full text-[11px] border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                                                >
                                                                    {markingAlertTripId === trip.id ? copy.crmAlertMarking : copy.crmAlertMarkRead}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <Link href={`/pro/profile?lang=${proLocale}`} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-2">
                                <UserCircle2 size={14} /> {copy.profile}
                            </Link>
                            <Link href={`/pro/profile?lang=${proLocale}#pricing`} className="px-4 py-2 text-sm rounded-lg border border-[#5a8fa3]/40 bg-[#5a8fa3]/5 text-[#2c667b] hover:bg-[#5a8fa3]/10 inline-flex items-center gap-2">
                                <BadgeEuro size={14} /> {copy.pricing}
                            </Link>
                            <button onClick={handleLogout} className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-2">
                                <LogOut size={14} /> {copy.logout}
                            </button>
                        </div>
                    </div>
                </header>

                <section className="bg-white border border-gray-200 rounded-2xl p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c667b] inline-flex items-center gap-1.5">
                        <Languages size={12} /> {copy.languageSelector}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(LOCALE_LABELS).map(([code, meta]) => {
                            const locale = code as LunaLocale;
                            const active = locale === proLocale;
                            return (
                                <button
                                    key={locale}
                                    type="button"
                                    onClick={() => handleProLocaleChange(locale)}
                                    className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${active ? 'border-[#5a8fa3] bg-[#f4f9fb] text-[#2c667b]' : 'border-gray-200 bg-white text-gray-500 hover:border-[#5a8fa3]/35'}`}
                                >
                                    <span className="text-[11px]">{meta.flag}</span>{' '}
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{locale}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <nav className="sticky top-4 z-20 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openAndFocusSection('planning', planningRef)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#5a8fa3]/40 hover:bg-[#5a8fa3]/5"
                        >
                            1. {copy.navPlanning}
                        </button>
                        <button
                            type="button"
                            onClick={() => openAndFocusSection('prestations', prestationsRef)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#5a8fa3]/40 hover:bg-[#5a8fa3]/5"
                        >
                            2. {copy.navPrestations}
                        </button>
                        <button
                            type="button"
                            onClick={() => openAndFocusSection('trip', tripRef)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#5a8fa3]/40 hover:bg-[#5a8fa3]/5"
                        >
                            3. {copy.navTrip}
                        </button>
                        <button
                            type="button"
                            onClick={() => openAndFocusSection('finance', financeRef)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#5a8fa3]/40 hover:bg-[#5a8fa3]/5"
                        >
                            4. {copy.navFinance}
                        </button>
                        <span className="ml-auto text-[11px] text-gray-500 inline-flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#5a8fa3]" /> {copy.navHint}
                        </span>
                    </div>
                </nav>

                <section ref={planningRef} className="bg-white border border-gray-200 rounded-2xl p-6 order-10">
                    <button
                        type="button"
                        onClick={() => toggleSection('planning')}
                        className="w-full flex items-center justify-between gap-3 text-left"
                    >
                        <div>
                            <h2 className="text-lg text-[#111827]">1. {copy.planningTitle}</h2>
                            <p className="text-xs text-gray-500 mt-1">{copy.planningCompact}</p>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform duration-300 ${openSections.planning ? 'rotate-180 text-[#5a8fa3]' : ''}`}
                        />
                    </button>

                    <div className={`grid transition-all duration-300 ease-out ${openSections.planning ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{copy.trips}: {planningSummary.total}</span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{copy.tripValidated}: {planningSummary.tripsValidated}</span>
                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">{copy.resaValidated}: {planningSummary.reservationsValidated}</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                        {copy.planningDescription}
                    </p>
                    {latestTrip && (
                        <div className="mb-5 rounded-xl border border-[#5a8fa3]/25 bg-[#5a8fa3]/5 p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#5a8fa3] font-semibold">{copy.validationQuick}</p>
                                    <p className="text-sm text-[#111827] mt-1">
                                        {latestTrip.clientName} · {latestTrip.destination} · {latestTrip.startDate || copy.dateToDefine}
                                    </p>
                                    <p className="text-xs text-[#2c667b] mt-1">
                                        {copy.workflowLabel}: <strong>{getWorkflowLabel(latestTrip.proWorkflowState)}</strong>
                                    </p>
                                    {latestTrip.proWorkflowMessage && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {copy.lunaMessageLabel}: {latestTrip.proWorkflowMessage}
                                        </p>
                                    )}
                                    {Array.isArray(latestTrip.proWorkflowSlots) && latestTrip.proWorkflowSlots.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-[11px] uppercase tracking-[0.1em] text-[#5a8fa3] font-semibold">
                                                {copy.proposedSlots}
                                            </p>
                                            <div className="mt-1 space-y-1">
                                                {latestTrip.proWorkflowSlots.slice(0, 3).map((slot, index) => (
                                                    <p key={`slot-${latestTrip.id}-${index}`} className="text-xs text-gray-600">
                                                        {formatSlotLine(slot)}
                                                    </p>
                                                ))}
                                                {latestTrip.proWorkflowSlots.length > 3 ? (
                                                    <p className="text-[11px] text-gray-500">+{latestTrip.proWorkflowSlots.length - 3}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {latestTrip.proWorkflowState === 'SENT_TO_PRO' && (
                                        <button
                                            disabled={updatingWorkflowTripId === latestTrip.id}
                                            onClick={() => acknowledgeToLuna(latestTrip.id)}
                                            className="px-3 py-1.5 rounded-full text-xs border border-[#5a8fa3] bg-white text-[#2c667b] hover:bg-[#f4f9fb] disabled:opacity-50"
                                        >
                                            {copy.confirmReturnToLuna}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {trips.length === 0 ? (
                        <p className="text-sm text-gray-500">{copy.noTripYet}</p>
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full min-w-[1180px] text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-200">
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.client}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.destination}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.departure}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.alert}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.status}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.tripLunaValid}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.resaLunaValid}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.workflowColumn}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.actionColumn}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.total}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.commission}</th>
                                        <th className="py-3 pr-4 font-medium text-gray-500">{copy.invoice}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.map((trip) => (
                                        <tr key={trip.id} className="border-b border-gray-100">
                                            <td className="py-3 pr-4">{trip.clientName}</td>
                                            <td className="py-3 pr-4">{trip.destination}</td>
                                            <td className="py-3 pr-4">{trip.startDate || '-'}</td>
                                            <td className="py-3 pr-4">{trip.planningAlertDate || '-'}</td>
                                            <td className="py-3 pr-4">{trip.status}</td>
                                            <td className="py-3 pr-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs border ${trip.lunaTripValidated ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {trip.lunaTripValidated ? copy.valid : copy.notValid}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs border ${trip.lunaReservationValidated ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {trip.lunaReservationValidated ? copy.validated : copy.notValidated}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-[#2c667b]">
                                                <p>{getWorkflowLabel(trip.proWorkflowState)}</p>
                                                {Array.isArray(trip.proWorkflowSlots) && trip.proWorkflowSlots.length > 0 ? (
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        {formatSlotLine(trip.proWorkflowSlots[0])}
                                                        {trip.proWorkflowSlots.length > 1 ? ` +${trip.proWorkflowSlots.length - 1}` : ''}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {trip.proWorkflowState === 'SENT_TO_PRO' ? (
                                                    <button
                                                        disabled={updatingWorkflowTripId === trip.id}
                                                        onClick={() => acknowledgeToLuna(trip.id)}
                                                        className="px-2.5 py-1 rounded-full text-xs border border-[#5a8fa3] bg-white text-[#2c667b] hover:bg-[#f4f9fb] disabled:opacity-50"
                                                    >
                                                        {copy.confirmAction}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4">{formatAmount(Number(trip.totalClientPrice || 0))} €</td>
                                            <td className="py-3 pr-4">
                                                {formatAmount(Number(trip.commissionAmount || 0))} € ({trip.commissionRate}%)
                                            </td>
                                            <td className="py-3 pr-4">
                                                {trip.invoiceId ? (
                                                    <a
                                                        href={`/api/client/invoice-pdf?id=${trip.invoiceId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#5a8fa3] hover:underline"
                                                    >
                                                        {copy.open}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                        </div>
                    </div>
                </section>

                <section ref={prestationsRef} className="bg-white border border-gray-200 rounded-2xl p-6 order-20">
                    <button
                        type="button"
                        onClick={() => toggleSection('prestations')}
                        className="w-full flex items-center justify-between gap-3 text-left"
                    >
                        <div>
                            <h2 className="text-lg text-[#111827]">2. {copy.prestationsTitle}</h2>
                            <p className="text-xs text-gray-500 mt-1">{copy.prestationsDescription}</p>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform duration-300 ${openSections.prestations ? 'rotate-180 text-[#5a8fa3]' : ''}`}
                        />
                    </button>

                    <div className={`grid transition-all duration-300 ease-out ${openSections.prestations ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-gray-500">{copy.prestationsDescription}</p>
                        <p className="text-sm text-gray-600">{selectedItems.length} {copy.selectedCount}</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] text-gray-500">{copy.catalogTotal}</p>
                            <p className="text-base font-semibold text-[#111827]">{catalog.length}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] text-gray-500">{copy.withImage}</p>
                            <p className="text-base font-semibold text-[#111827]">{catalogWithImagesCount}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] text-gray-500">{copy.displayed}</p>
                            <p className="text-base font-semibold text-[#111827]">{filteredCatalog.length}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-[11px] text-gray-500">{copy.selected}</p>
                            <p className="text-base font-semibold text-[#111827]">{selectedItems.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold inline-flex items-center gap-2">
                            <SlidersHorizontal size={13} /> {copy.advancedFilters}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                className="text-xs text-[#2c667b] hover:text-[#1f2937] inline-flex items-center gap-1.5 font-semibold"
                            >
                                <ChevronDown size={12} className={`transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                                {showAdvancedFilters ? copy.hideFilters : copy.showFilters}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setTypeFilter('all');
                                    setLocationFilter('all');
                                    setPriceBandFilter('all');
                                    setOnlyWithImage(false);
                                    setSortBy('recommended');
                                }}
                                className="text-xs text-gray-500 hover:text-[#1f2937] inline-flex items-center gap-1.5"
                            >
                                <FilterX size={12} /> {copy.reset}
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={copy.searchPlaceholder}
                            className="w-full md:w-[420px] px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                        />
                    </div>

                    <div className={`grid transition-all duration-300 ease-out ${showAdvancedFilters ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-2'}`}>
                        <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3] bg-white"
                        >
                            <option value="all">{copy.allTypes}</option>
                            {catalogTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3] bg-white"
                        >
                            <option value="all">{copy.allLocations}</option>
                            {catalogLocations.map((location) => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                        <select
                            value={priceBandFilter}
                            onChange={(e) => setPriceBandFilter(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3] bg-white"
                        >
                            <option value="all">{copy.allBudgets}</option>
                            <option value="lt_500">{copy.budgetLt500}</option>
                            <option value="500_1499">{copy.budget5001499}</option>
                            <option value="1500_2999">{copy.budget15002999}</option>
                            <option value="gte_3000">{copy.budgetGte3000}</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3] bg-white"
                        >
                            <option value="recommended">{copy.recommendedSort}</option>
                            <option value="price_asc">{copy.priceAsc}</option>
                            <option value="price_desc">{copy.priceDesc}</option>
                            <option value="name_asc">{copy.nameAsc}</option>
                        </select>
                        <label className="px-4 py-3 rounded-xl border border-gray-300 text-sm flex items-center gap-2 bg-white cursor-pointer">
                            <input
                                type="checkbox"
                                checked={onlyWithImage}
                                onChange={(e) => setOnlyWithImage(e.target.checked)}
                                className="h-4 w-4 accent-[#5a8fa3]"
                            />
                            {copy.onlyWithImage}
                        </label>
                    </div>
                        </div>
                    </div>
                    {catalogLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-[#5a8fa3]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredCatalog.map((item) => {
                                const selected = selectedIds.includes(item.id);
                                const coverImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`group relative text-left p-0 rounded-xl border overflow-hidden transition-[transform,box-shadow,border-color,background-color,ring-color] duration-300 ${selected ? 'border-[#2c667b] bg-[#5a8fa3]/10 shadow-[0_18px_40px_rgba(44,102,123,0.35)] ring-2 ring-[#5a8fa3]/45 ring-offset-2 ring-offset-white scale-[1.015]' : 'border-gray-200 hover:border-gray-300 bg-white hover:-translate-y-0.5 hover:shadow-sm'}`}
                                    >
                                        <div className="relative h-40 bg-gray-100">
                                            {coverImage ? (
                                                <img
                                                    src={coverImage}
                                                    alt={item.name}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                            <div className={`absolute inset-0 transition-opacity duration-300 ${selected ? 'opacity-100 bg-gradient-to-br from-[#5a8fa3]/25 via-transparent to-[#2c667b]/35' : 'opacity-0'}`} />
                                            <div className={`absolute left-0 right-0 top-0 flex justify-center transition-all duration-300 ${selected ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
                                                <span className="mt-2 rounded-full bg-[#0f172a]/85 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-white">
                                                    ✓ {copy.prestationsTitle.toUpperCase()} {copy.selectedTag.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="absolute left-3 top-3">
                                                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-gray-700">
                                                    {(item.type || 'OTHER').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className={`absolute right-3 top-3 rounded-full p-0.5 transition-all duration-300 ${selected ? 'bg-white scale-100 shadow-sm' : 'bg-white/20 scale-90'}`}>
                                                {selected ? <CheckCircle2 size={18} className="text-[#2c667b] shrink-0 animate-pulse" /> : <Circle size={18} className="text-white/90 shrink-0" />}
                                            </div>
                                            <div className={`absolute left-3 bottom-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#2c667b] shadow-sm transition-all duration-300 ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                                {copy.selectedTag}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-[#111827] mt-1">{item.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{item.location || copy.noLocation}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-3 line-clamp-3">
                                                {item.description || copy.noDescription}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-[#111827]">
                                                    {formatAmount(Number(item.clientPrice || 0))} {item.currency || 'EUR'}
                                                </p>
                                                <p className="text-[10px] text-gray-500">ID: {item.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {selectedItems.length > 0 && (
                        <div className="mt-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <p className="text-sm font-medium text-[#111827] mb-3">{copy.selectedDetail}</p>
                            <div className="space-y-3">
                                {selectedItems.map((item) => {
                                    const coverImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
                                    const slot = requestedSlots[item.id] || emptyRequestedSlot();
                                    return (
                                        <div key={`sel-${item.id}`} className="p-3 rounded-lg border border-gray-200 bg-white">
                                            <div className="flex gap-3">
                                                <div className="w-20 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                    {coverImage ? (
                                                        <img src={coverImage} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-[#111827] truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{(item.type || 'OTHER').toUpperCase()} · {item.location || copy.noLocation}</p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description || copy.noDescription}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-[#111827]">
                                                        {formatAmount(Number(item.clientPrice || 0))} {item.currency || 'EUR'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500 font-semibold mb-2">
                                                    {copy.requestedSlotTitle}
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                                    <label className="text-xs text-gray-600">
                                                        {copy.requestedDateLabel}
                                                        <input
                                                            type="date"
                                                            value={slot.date}
                                                            onChange={(e) => setRequestedSlot(item.id, { date: e.target.value })}
                                                            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                        />
                                                    </label>
                                                    <label className="text-xs text-gray-600">
                                                        {copy.requestedStartLabel}
                                                        <input
                                                            type="time"
                                                            value={slot.startTime}
                                                            onChange={(e) => setRequestedSlot(item.id, { startTime: e.target.value })}
                                                            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                        />
                                                    </label>
                                                    <label className="text-xs text-gray-600">
                                                        {copy.requestedEndLabel}
                                                        <input
                                                            type="time"
                                                            value={slot.endTime}
                                                            onChange={(e) => setRequestedSlot(item.id, { endTime: e.target.value })}
                                                            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                        />
                                                    </label>
                                                    <label className="text-xs text-gray-600">
                                                        {copy.requestedNoteLabel}
                                                        <input
                                                            value={slot.note}
                                                            onChange={(e) => setRequestedSlot(item.id, { note: e.target.value })}
                                                            placeholder={copy.requestedNotePlaceholder}
                                                            className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                        />
                                                    </label>
                                                </div>
                                                <p className="mt-2 text-[11px] text-gray-500">
                                                    {slot.date || copy.requestedNotSet} · {slot.startTime || '--:--'}-{slot.endTime || '--:--'}
                                                    {slot.note ? ` · ${slot.note}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                        </div>
                    </div>
                </section>

                <section ref={tripRef} className="bg-white border border-gray-200 rounded-2xl p-6 order-30">
                    <button
                        type="button"
                        onClick={() => toggleSection('trip')}
                        className="w-full flex items-center justify-between gap-3 text-left"
                    >
                        <div>
                            <h2 className="text-lg text-[#111827]">3. {copy.tripSectionTitle}</h2>
                            <p className="text-xs text-gray-500 mt-1">{copy.tripSectionDescription}</p>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform duration-300 ${openSections.trip ? 'rotate-180 text-[#5a8fa3]' : ''}`}
                        />
                    </button>

                    <div className={`grid transition-all duration-300 ease-out ${openSections.trip ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 border border-gray-200 rounded-2xl p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.clientLabel}</span>
                                            <input
                                                value={form.clientName}
                                                onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                                                placeholder={copy.clientPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.clientEmailLabel}</span>
                                            <input
                                                value={form.clientEmail}
                                                onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
                                                placeholder={copy.clientEmailPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.destinationLabel}</span>
                                            <input
                                                value={form.destination}
                                                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                                                placeholder={copy.destinationPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.travelersLabel}</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={form.travelers}
                                                onChange={(e) => setForm((p) => ({ ...p, travelers: Number(e.target.value || 1) }))}
                                                placeholder={copy.travelersPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.startDateLabel}</span>
                                            <input
                                                type="date"
                                                value={form.startDate}
                                                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.endDateLabel}</span>
                                            <input
                                                type="date"
                                                value={form.endDate}
                                                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.commissionRateLabel}</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={form.commissionRate}
                                                onChange={(e) => setForm((p) => ({ ...p, commissionRate: Number(e.target.value || 0) }))}
                                                placeholder={copy.commissionPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                            <span className="mt-1.5 block text-[11px] text-gray-500">{copy.commissionHint}</span>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-xs font-medium text-gray-600">{copy.notesLabel}</span>
                                            <input
                                                value={form.notes}
                                                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                                                placeholder={copy.notesPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#5a8fa3]"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <aside className="border border-gray-200 rounded-2xl p-6">
                                    <h3 className="text-lg text-[#111827] mb-5">{copy.routine}</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-sm">
                                            <ShieldCheck size={16} className="mt-0.5 text-[#5a8fa3]" />
                                            <span>{copy.step1}</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm">
                                            <BellRing size={16} className="mt-0.5 text-[#5a8fa3]" />
                                            <span>{copy.step2}</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm">
                                            <FileText size={16} className="mt-0.5 text-[#5a8fa3]" />
                                            <span>{copy.step3}</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm">
                                            <CheckCircle2 size={16} className="mt-0.5 text-[#5a8fa3]" />
                                            <span>{copy.step4}</span>
                                        </li>
                                    </ul>
                                    {workflow && (
                                        <div className="mt-5 text-xs text-gray-600 border border-gray-200 rounded-xl p-3 bg-gray-50">
                                            <p>{copy.tripShort}: <strong>{workflow.trip.id}</strong></p>
                                            <p>{copy.invoice}: <strong>{workflow.invoice.invoiceNumber}</strong></p>
                                            <p>{copy.alert}: <strong>{workflow.reminder.dueDate || copy.notAvailable}</strong></p>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={financeRef} className="bg-white border border-gray-200 rounded-2xl p-6 order-40">
                    <button
                        type="button"
                        onClick={() => toggleSection('finance')}
                        className="w-full flex items-center justify-between gap-3 text-left"
                    >
                        <div>
                            <h2 className="text-lg text-[#111827]">4. {copy.financeTitle}</h2>
                            <p className="text-xs text-gray-500 mt-1">{copy.financeDescription}</p>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform duration-300 ${openSections.finance ? 'rotate-180 text-[#5a8fa3]' : ''}`}
                        />
                    </button>

                    <div className={`grid transition-all duration-300 ease-out ${openSections.finance ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                        <div className="overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                                <p className="text-sm text-gray-600">{copy.planningFollowup}</p>
                                <Link href={`/pro/profile?lang=${proLocale}#pricing`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#5a8fa3]/30 text-[#2c667b] bg-[#5a8fa3]/5 text-sm hover:bg-[#5a8fa3]/10 w-fit">
                                    <Percent size={14} /> {copy.openPricing}
                                </Link>
                            </div>

                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                            {success && <p className="mb-4 text-sm text-emerald-600">{success}</p>}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-3">{copy.financialSummary}</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>{copy.totalClient}</span><strong>{formatAmount(totalClientPrice)} €</strong></div>
                                        <div className="flex justify-between"><span>{copy.commission} ({form.commissionRate}%)</span><strong>{formatAmount(commissionAmount)} €</strong></div>
                                        <div className="flex justify-between"><span>{copy.supplierCost}</span><strong>{formatAmount(supplierEstimatedCost)} €</strong></div>
                                        <div className="flex justify-between"><span>{copy.selectedItems}</span><strong>{selectedItems.length} {copy.itemUnit}</strong></div>
                                        <div className="flex justify-between"><span>{copy.selectedValue}</span><strong>{formatAmount(selectedTotal)} €</strong></div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-3">{copy.planningAlerts}</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>{copy.proposal}</span><span>{copy.immediate}</span></div>
                                        <div className="flex justify-between"><span>{copy.confirmationClient}</span><span>{copy.dayPlus2}</span></div>
                                        <div className="flex justify-between"><span>{copy.deposit}</span><span>{copy.dayPlus4}</span></div>
                                        <div className="flex justify-between"><span>{copy.departure}</span><span>{form.startDate || copy.toDefine}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={createWorkflow}
                                    disabled={submitting}
                                    className="px-5 py-3 rounded-xl bg-[#1f2937] text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {copy.createTripInvoice}
                                </button>
                                <button
                                    onClick={confirmWorkflow}
                                    disabled={!workflow?.trip?.id || confirming}
                                    className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {confirming && <Loader2 size={16} className="animate-spin" />}
                                    {copy.confirmTrip}
                                </button>
                                {workflow?.invoice?.id && (
                                    <a
                                        href={`/api/client/invoice-pdf?id=${workflow.invoice.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-3 rounded-xl bg-[#5a8fa3] text-white text-sm font-medium"
                                    >
                                        {copy.openInvoicePdf}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
