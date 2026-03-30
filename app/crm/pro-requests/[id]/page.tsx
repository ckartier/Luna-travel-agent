'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, Loader2, Mail, Save, Send } from 'lucide-react';
import { CRMTrip, completeProWorkflowRemindersByTrip, getTrip, updateTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { useTranslation } from '@/src/hooks/useTranslation';
import { PRO_REQUEST_COPY } from '@/src/lib/i18n/proRequest';
import { db } from '@/src/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

type EditableTrip = {
    title: string;
    destination: string;
    clientName: string;
    clientEmail: string;
    startDate: string;
    endDate: string;
    amount: number;
    commissionRate: number;
    notes: string;
};

type SelectedPrestation = {
    id: string;
    description: string;
    type: string;
    location: string;
    quantity: number;
    unitPrice: number;
    total: number;
    currency: string;
};

type PrestationSlotForm = {
    date: string;
    startTime: string;
    endTime: string;
    availability: 'AVAILABLE' | 'ALTERNATIVE' | 'UNAVAILABLE';
    note: string;
};

function emptyPrestationSlot(): PrestationSlotForm {
    return {
        date: '',
        startTime: '',
        endTime: '',
        availability: 'AVAILABLE',
        note: '',
    };
}

function mergeSlots(primary: PrestationSlotForm, fallback: PrestationSlotForm): PrestationSlotForm {
    return {
        date: primary.date || fallback.date,
        startTime: primary.startTime || fallback.startTime,
        endTime: primary.endTime || fallback.endTime,
        availability: primary.availability || fallback.availability || 'AVAILABLE',
        note: primary.note || fallback.note,
    };
}

function toIsoDateWithOffset(daysFromToday: number): string {
    const now = new Date();
    now.setDate(now.getDate() + daysFromToday);
    return now.toISOString().split('T')[0];
}

function addMinutesToTime(startTime: string, minutes: number): string {
    if (!/^\d{2}:\d{2}$/.test(startTime)) return '';
    const [h, m] = startTime.split(':').map((part) => Number(part));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
    const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
}

function isInvalidTimeRange(startTime: string, endTime: string): boolean {
    if (!startTime || !endTime) return false;
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return false;
    return endTime <= startTime;
}

function normalizeSelectedPrestations(
    items: unknown[],
    descriptionFallback: string,
    typeFallback: string
): SelectedPrestation[] {
    return items
        .map((item, index) => {
            const source = (item || {}) as Record<string, unknown>;
            const unitPrice = normalizeNumber(source.unitPrice);
            const quantity = Math.max(1, normalizeNumber(source.quantity) || 1);
            const total = normalizeNumber(source.total) || Number((unitPrice * quantity).toFixed(2));
            return {
                id: String(source.id || `item-${index + 1}`),
                description: String(source.description || source.name || descriptionFallback),
                type: String(source.type || typeFallback),
                location: String(source.location || ''),
                quantity,
                unitPrice,
                total,
                currency: String(source.currency || 'EUR'),
            };
        })
        .filter((item) => item.description.trim().length > 0);
}

const emptyForm: EditableTrip = {
    title: '',
    destination: '',
    clientName: '',
    clientEmail: '',
    startDate: '',
    endDate: '',
    amount: 0,
    commissionRate: 12,
    notes: '',
};

function normalizeNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function workflowClasses(state?: string): string {
    if (state === 'SENT_TO_PRO') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (state === 'PRO_CONFIRMED') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (state === 'LUNA_VALIDATED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
}

export default function ProRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tripId } = use(params);
    const { tenantId, user, loading } = useAuth();
    const { locale } = useTranslation();
    const copy = PRO_REQUEST_COPY[locale];
    const [trip, setTrip] = useState<CRMTrip | null>(null);
    const [form, setForm] = useState<EditableTrip>(emptyForm);
    const [requestMessage, setRequestMessage] = useState('');
    const [isLoadingTrip, setIsLoadingTrip] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [selectedPrestations, setSelectedPrestations] = useState<SelectedPrestation[]>([]);
    const [prestationSlots, setPrestationSlots] = useState<Record<string, PrestationSlotForm>>({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const totalClientPrice = useMemo(() => {
        return normalizeNumber(trip?.totalClientPrice) || normalizeNumber(form.amount);
    }, [trip?.totalClientPrice, form.amount]);

    const commissionAmount = useMemo(() => {
        return Number((totalClientPrice * (normalizeNumber(form.commissionRate) / 100)).toFixed(2));
    }, [form.commissionRate, totalClientPrice]);

    const selectedPrestationsTotal = useMemo(() => {
        return selectedPrestations.reduce((sum, item) => sum + normalizeNumber(item.total), 0);
    }, [selectedPrestations]);

    const setSlotForItem = (itemId: string, patch: Partial<PrestationSlotForm>) => {
        setPrestationSlots((prev) => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || emptyPrestationSlot()),
                ...patch,
            },
        }));
    };

    const applyQuickDate = (itemId: string, dayOffset: number) => {
        setSlotForItem(itemId, { date: toIsoDateWithOffset(dayOffset) });
    };

    const applyQuickDuration = (itemId: string, minutes: number) => {
        const slot = prestationSlots[itemId] || emptyPrestationSlot();
        const startTime = slot.startTime || '09:00';
        const endTime = addMinutesToTime(startTime, minutes);
        setSlotForItem(itemId, { startTime, endTime });
    };

    const availabilityLabel = (value?: string): string => {
        if (value === 'ALTERNATIVE') return copy.availabilityAlternative;
        if (value === 'UNAVAILABLE') return copy.availabilityUnavailable;
        return copy.availabilityAvailable;
    };

    const buildProWorkflowSlots = (updatedAtIso: string) =>
        selectedPrestations.map((item) => {
            const slot = prestationSlots[item.id] || emptyPrestationSlot();
            return {
                itemId: item.id,
                description: item.description,
                type: item.type,
                location: item.location,
                date: slot.date || '',
                startTime: slot.startTime || '',
                endTime: slot.endTime || '',
                availability: slot.availability || 'AVAILABLE',
                note: slot.note.trim(),
                updatedAt: updatedAtIso,
                updatedBy: user?.uid || '',
            };
        });

    const buildSlotEmailLines = () => {
        const slots = buildProWorkflowSlots(new Date().toISOString());
        return slots
            .filter(
                (slot) =>
                    Boolean(slot.date) ||
                    Boolean(slot.startTime) ||
                    Boolean(slot.endTime) ||
                    Boolean(slot.note) ||
                    slot.availability !== 'AVAILABLE'
            )
            .map((slot) => {
                const datePart = slot.date || copy.dateUnknown;
                const timePart =
                    slot.startTime || slot.endTime
                        ? `${slot.startTime || '--:--'}-${slot.endTime || '--:--'}`
                        : '--:--';
                const availabilityPart = availabilityLabel(slot.availability);
                const notePart = slot.note ? ` · ${slot.note}` : '';
                return `- ${slot.description}: ${datePart} ${timePart} (${availabilityPart})${notePart}`;
            });
    };

    useEffect(() => {
        if (!tenantId || !tripId) return;
        let active = true;

        const load = async () => {
            setIsLoadingTrip(true);
            setError('');
            try {
                const data = await getTrip(tenantId, tripId);
                if (!active) return;
                if (!data) {
                    setTrip(null);
                    setSelectedPrestations([]);
                    setPrestationSlots({});
                    setError(copy.requestNotFound);
                    return;
                }
                setTrip(data);
                setForm({
                    title: String(data.title || ''),
                    destination: String(data.destination || ''),
                    clientName: String(data.clientName || ''),
                    clientEmail: String(data.clientEmail || ''),
                    startDate: String(data.startDate || ''),
                    endDate: String(data.endDate || ''),
                    amount: normalizeNumber(data.totalClientPrice ?? data.amount),
                    commissionRate: normalizeNumber(data.commissionRate ?? 12),
                    notes: String(data.notes || ''),
                });
                setRequestMessage(String(data.proWorkflowMessage || ''));

                const dataRecord = data as unknown as Record<string, unknown>;
                const rawTripItems = Array.isArray(dataRecord.selectedItems)
                    ? (dataRecord.selectedItems as unknown[])
                    : [];
                const existingSlotsRaw = Array.isArray(dataRecord.proWorkflowSlots)
                    ? (dataRecord.proWorkflowSlots as unknown[])
                    : [];
                const existingSlotsMap: Record<string, PrestationSlotForm> = {};
                for (const raw of existingSlotsRaw) {
                    const slot = (raw || {}) as Record<string, unknown>;
                    const itemId = String(slot.itemId || '').trim();
                    if (!itemId) continue;
                    existingSlotsMap[itemId] = {
                        date: String(slot.date || ''),
                        startTime: String(slot.startTime || ''),
                        endTime: String(slot.endTime || ''),
                        availability: (String(slot.availability || 'AVAILABLE') as PrestationSlotForm['availability']) || 'AVAILABLE',
                        note: String(slot.note || ''),
                    };
                }
                const requestedSlotsMap: Record<string, PrestationSlotForm> = {};
                for (const raw of rawTripItems) {
                    const item = (raw || {}) as Record<string, unknown>;
                    const itemId = String(item.id || '').trim();
                    if (!itemId) continue;
                    requestedSlotsMap[itemId] = {
                        date: String(item.requestedDate || ''),
                        startTime: String(item.requestedStartTime || ''),
                        endTime: String(item.requestedEndTime || ''),
                        availability: 'AVAILABLE',
                        note: String(item.requestedNote || ''),
                    };
                }

                let normalizedItems: SelectedPrestation[] = [];
                if (rawTripItems.length > 0) {
                    normalizedItems = normalizeSelectedPrestations(rawTripItems, copy.prestationFallback, copy.prestationTypeFallback);
                } else {
                    const invoiceId = String(dataRecord.invoiceId || '').trim();
                    if (invoiceId) {
                        const invoiceSnap = await getDoc(doc(db, 'tenants', tenantId, 'invoices', invoiceId));
                        const invoiceData = invoiceSnap.exists() ? (invoiceSnap.data() as Record<string, unknown>) : null;
                        const rawInvoiceItems = Array.isArray(invoiceData?.items) ? (invoiceData?.items as unknown[]) : [];
                        normalizedItems = normalizeSelectedPrestations(rawInvoiceItems, copy.prestationFallback, copy.prestationTypeFallback);
                    }
                }

                setSelectedPrestations(normalizedItems);

                const nextSlots: Record<string, PrestationSlotForm> = {};
                for (const item of normalizedItems) {
                    const requestedSlot = requestedSlotsMap[item.id] || emptyPrestationSlot();
                    const existingSlot = existingSlotsMap[item.id] || emptyPrestationSlot();
                    nextSlots[item.id] = mergeSlots(existingSlot, requestedSlot);
                }
                setPrestationSlots(nextSlots);
            } catch (loadError) {
                console.error(loadError);
                if (!active) return;
                setError(copy.loadError);
            } finally {
                if (active) setIsLoadingTrip(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [tenantId, tripId, copy.requestNotFound, copy.loadError, copy.prestationFallback, copy.prestationTypeFallback]);

    const workflowLabel = (state?: string): string => {
        if (state === 'SENT_TO_PRO') return copy.workflowSent;
        if (state === 'PRO_CONFIRMED') return copy.workflowConfirmed;
        if (state === 'LUNA_VALIDATED') return copy.workflowValidated;
        if (state === 'PENDING_REVIEW') return copy.workflowPending;
        return copy.workflowInReview;
    };

    const refreshTrip = async () => {
        if (!tenantId || !tripId) return;
        const fresh = await getTrip(tenantId, tripId);
        if (fresh) setTrip(fresh);
    };

    const buildPatch = (state?: string): Partial<CRMTrip> => {
        const nowIso = new Date().toISOString();
        return {
            title: form.title.trim(),
            destination: form.destination.trim(),
            clientName: form.clientName.trim(),
            clientEmail: form.clientEmail.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            notes: form.notes.trim(),
            amount: normalizeNumber(form.amount),
            totalClientPrice: normalizeNumber(form.amount),
            commissionRate: normalizeNumber(form.commissionRate),
            commissionAmount,
            supplierEstimatedCost: Number((normalizeNumber(form.amount) - commissionAmount).toFixed(2)),
            proWorkflowMessage: requestMessage.trim(),
            proWorkflowSlots: buildProWorkflowSlots(nowIso),
            proWorkflowUpdatedAt: nowIso,
            proWorkflowUpdatedBy: user?.uid || '',
            ...(state ? { proWorkflowState: state } : {}),
        };
    };

    const saveChanges = async () => {
        if (!tenantId || !tripId) return;
        if (!form.title.trim() || !form.destination.trim() || !form.clientName.trim()) {
            setError(copy.requiredFieldsError);
            return;
        }
        setError('');
        setSuccess('');
        setIsSaving(true);
        try {
            await updateTrip(tenantId, tripId, buildPatch());
            await refreshTrip();
            setSuccess(copy.saveSuccess);
        } catch (saveError) {
            console.error(saveError);
            setError(copy.saveError);
        } finally {
            setIsSaving(false);
        }
    };

    const sendBackToProvider = async () => {
        if (!tenantId || !tripId) return;
        if (!form.clientEmail.trim()) {
            setError(copy.missingEmailError);
            return;
        }
        setError('');
        setSuccess('');
        setIsSending(true);
        try {
            await updateTrip(tenantId, tripId, {
                ...buildPatch('SENT_TO_PRO'),
                status: 'PROPOSAL',
                lunaTripValidated: false,
                lunaReservationValidated: false,
            });

            const emailText = [
                `${copy.emailGreeting} ${form.clientName},`,
                '',
                copy.emailReviewed,
                copy.emailValidate,
                '',
                `${copy.emailTrip}: ${form.title}`,
                `${copy.emailDestination}: ${form.destination}`,
                `${copy.emailDates}: ${form.startDate || copy.dateUnknown} -> ${form.endDate || copy.dateUnknown}`,
                `${copy.emailAmount}: ${normalizeNumber(form.amount).toLocaleString('fr-FR')} EUR`,
                '',
                requestMessage.trim() ? `${copy.emailMessagePrefix}: ${requestMessage.trim()}` : '',
                ...(() => {
                    const slotLines = buildSlotEmailLines();
                    if (slotLines.length === 0) return [];
                    return ['', `${copy.emailAvailabilityTitle}:`, ...slotLines];
                })(),
                '',
                `${copy.emailLink}: /pro/travel`,
            ]
                .filter(Boolean)
                .join('\n');

            await fetchWithAuth('/api/gmail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: form.clientEmail.trim(),
                    subject: `${copy.emailSubjectPrefix} - ${form.title}`,
                    message: emailText,
                    recipientType: 'SUPPLIER',
                    clientName: form.clientName.trim(),
                    clientId: tripId,
                }),
            });

            await completeProWorkflowRemindersByTrip(tenantId, tripId);
            await refreshTrip();
            setSuccess(copy.sendSuccess);
        } catch (sendError) {
            console.error(sendError);
            setError(copy.sendError);
        } finally {
            setIsSending(false);
        }
    };

    const validateFinal = async () => {
        if (!tenantId || !tripId) return;
        setError('');
        setSuccess('');
        setIsValidating(true);
        try {
            const validatedAtIso = new Date().toISOString();
            await updateTrip(tenantId, tripId, {
                ...buildPatch('LUNA_VALIDATED'),
                status: 'CONFIRMED',
                lunaTripValidated: true,
                lunaReservationValidated: true,
                proWorkflowValidatedAt: validatedAtIso,
                proLunaAlertSeen: false,
                proLunaAlertAt: validatedAtIso,
            });

            let emailSent = false;
            if (form.clientEmail.trim()) {
                try {
                    const validationEmailText = [
                        `${copy.emailGreeting} ${form.clientName},`,
                        '',
                        copy.emailValidatedIntro,
                        `${copy.emailValidatedStatus}: CONFIRMED`,
                        '',
                        `${copy.emailTrip}: ${form.title}`,
                        `${copy.emailDestination}: ${form.destination}`,
                        `${copy.emailDates}: ${form.startDate || copy.dateUnknown} -> ${form.endDate || copy.dateUnknown}`,
                        `${copy.emailAmount}: ${normalizeNumber(form.amount).toLocaleString('fr-FR')} EUR`,
                        '',
                        `${copy.emailLink}: /pro/travel`,
                    ].join('\n');

                    const emailRes = await fetchWithAuth('/api/gmail/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: form.clientEmail.trim(),
                            subject: `${copy.emailValidatedSubjectPrefix} - ${form.title}`,
                            message: validationEmailText,
                            recipientType: 'SUPPLIER',
                            clientName: form.clientName.trim(),
                            clientId: tripId,
                        }),
                    });
                    emailSent = emailRes.ok;
                    if (emailSent) {
                        await updateTrip(tenantId, tripId, {
                            proWorkflowValidationEmailSentAt: new Date().toISOString(),
                        });
                    }
                } catch (emailError) {
                    console.error(emailError);
                }
            }

            try {
                await completeProWorkflowRemindersByTrip(tenantId, tripId);
            } catch (reminderError) {
                // Non-blocking: the final validation has already been persisted.
                console.error(reminderError);
            }
            try {
                await refreshTrip();
            } catch (refreshError) {
                // Non-blocking: keep success state if refresh fails.
                console.error(refreshError);
            }
            setSuccess(form.clientEmail.trim() && emailSent ? copy.validateSuccessWithEmail : copy.validateSuccess);
        } catch (validateError) {
            console.error(validateError);
            setError(copy.validateError);
        } finally {
            setIsValidating(false);
        }
    };

    if (loading || isLoadingTrip) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5a8fa3]" />
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="p-6">
                <p className="text-sm text-gray-600">{copy.sessionInvalid}</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto w-full p-4 md:p-6">
            <div className="mb-5">
                <Link href="/crm/planning" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#2E2E2E]">
                    <ArrowLeft size={16} /> {copy.backPlanning}
                </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#5a8fa3] font-semibold">{copy.pageBadge}</p>
                        <h1 className="text-2xl text-[#111827] mt-1">{form.title || copy.pageFallbackTitle}</h1>
                        <p className="text-sm text-gray-500 mt-1">{copy.idLabel}: {tripId}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs border ${workflowClasses(trip?.proWorkflowState)}`}>
                        {workflowLabel(trip?.proWorkflowState)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <label className="text-sm text-gray-600">
                        {copy.labelTitle}
                        <input
                            value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelDestination}
                        <input
                            value={form.destination}
                            onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelClient}
                        <input
                            value={form.clientName}
                            onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelEmail}
                        <input
                            value={form.clientEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, clientEmail: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelStartDate}
                        <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelEndDate}
                        <input
                            type="date"
                            value={form.endDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelAmount}
                        <input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm((prev) => ({ ...prev, amount: normalizeNumber(e.target.value) }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                    <label className="text-sm text-gray-600">
                        {copy.labelCommissionRate}
                        <input
                            type="number"
                            value={form.commissionRate}
                            onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: normalizeNumber(e.target.value) }))}
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                        />
                    </label>
                </div>

                <label className="block text-sm text-gray-600 mt-4">
                    {copy.labelProviderMessage}
                    <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        rows={3}
                        placeholder={copy.providerMessagePlaceholder}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm resize-y"
                    />
                </label>

                <label className="block text-sm text-gray-600 mt-4">
                    {copy.labelInternalNotes}
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 text-sm resize-y"
                    />
                </label>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm font-medium text-[#111827]">{copy.labelSelectedPrestations}</p>
                        <p className="text-xs text-gray-500">
                            {selectedPrestations.length} {copy.prestationCountLabel} · {selectedPrestationsTotal.toLocaleString('fr-FR')} €
                        </p>
                    </div>
                    {selectedPrestations.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">{copy.noSelectedPrestations}</p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {selectedPrestations.map((item) => {
                                const slot = prestationSlots[item.id] || emptyPrestationSlot();
                                const invalidTimeRange = isInvalidTimeRange(slot.startTime, slot.endTime);

                                return (
                                <div key={item.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-[#111827]">{item.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {copy.labelType}: {item.type} {item.location ? `· ${copy.labelLocation}: ${item.location}` : ''}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-[#111827]">
                                            {item.total.toLocaleString('fr-FR')} {item.currency}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        {copy.labelQuantity}: {item.quantity} · {copy.labelUnitPrice}: {item.unitPrice.toLocaleString('fr-FR')} {item.currency}
                                    </p>

                                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-600 mb-2">
                                            {copy.prestationAvailabilityTitle}
                                        </p>
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                                <CalendarDays size={12} /> {copy.slotQuickDateLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDate(item.id, 0)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotToday}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDate(item.id, 1)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotTomorrow}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDate(item.id, 2)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotPlus2Days}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                                            <label className="text-xs text-gray-600">
                                                {copy.slotDateLabel}
                                                <input
                                                    type="date"
                                                    value={slot.date}
                                                    onChange={(e) => setSlotForItem(item.id, { date: e.target.value })}
                                                    className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                />
                                            </label>
                                            <label className="text-xs text-gray-600">
                                                {copy.slotStartLabel}
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => setSlotForItem(item.id, { startTime: e.target.value })}
                                                    className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                />
                                            </label>
                                            <label className="text-xs text-gray-600">
                                                {copy.slotEndLabel}
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => setSlotForItem(item.id, { endTime: e.target.value })}
                                                    className={`mt-1 w-full px-2.5 py-2 rounded-lg border text-xs ${invalidTimeRange ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                                />
                                            </label>
                                            <label className="text-xs text-gray-600">
                                                {copy.availabilityLabel}
                                                <select
                                                    value={slot.availability}
                                                    onChange={(e) => setSlotForItem(item.id, { availability: e.target.value as PrestationSlotForm['availability'] })}
                                                    className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                                                >
                                                    <option value="AVAILABLE">{copy.availabilityAvailable}</option>
                                                    <option value="ALTERNATIVE">{copy.availabilityAlternative}</option>
                                                    <option value="UNAVAILABLE">{copy.availabilityUnavailable}</option>
                                                </select>
                                            </label>
                                            <label className="text-xs text-gray-600 lg:col-span-1">
                                                {copy.slotNoteLabel}
                                                <input
                                                    value={slot.note}
                                                    onChange={(e) => setSlotForItem(item.id, { note: e.target.value })}
                                                    placeholder={copy.slotNotePlaceholder}
                                                    className="mt-1 w-full px-2.5 py-2 rounded-lg border border-gray-300 text-xs"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                                <Clock3 size={12} /> {copy.slotQuickDurationLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDuration(item.id, 30)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotDuration30}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDuration(item.id, 60)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotDuration60}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDuration(item.id, 120)}
                                                className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                                            >
                                                {copy.slotDuration120}
                                            </button>
                                        </div>

                                        {invalidTimeRange ? (
                                            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-red-600">
                                                <AlertTriangle size={12} />
                                                {copy.slotInvalidRange}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            );})}
                        </div>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">{copy.labelTotalClient}</p>
                        <p className="font-semibold text-[#111827] mt-0.5">{totalClientPrice.toLocaleString('fr-FR')} €</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">{copy.labelCommission}</p>
                        <p className="font-semibold text-[#111827] mt-0.5">{commissionAmount.toLocaleString('fr-FR')} €</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-gray-500">{copy.labelLunaStatus}</p>
                        <p className="font-semibold text-[#111827] mt-0.5">
                            {trip?.lunaTripValidated ? copy.tripOk : copy.tripTodo} · {trip?.lunaReservationValidated ? copy.bookingOk : copy.bookingTodo}
                        </p>
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        onClick={saveChanges}
                        disabled={isSaving || isSending || isValidating}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-[#2E2E2E] hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        <Save size={15} /> {isSaving ? copy.btnSaving : copy.btnSave}
                    </button>
                    <button
                        onClick={sendBackToProvider}
                        disabled={isSaving || isSending || isValidating}
                        className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        <Send size={15} /> {isSending ? copy.btnSending : copy.btnSendBack}
                    </button>
                    <button
                        onClick={validateFinal}
                        disabled={isSaving || isSending || isValidating}
                        className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        <CheckCircle2 size={15} /> {isValidating ? copy.btnValidating : copy.btnValidateFinal}
                    </button>
                    {form.clientEmail.trim() && (
                        <a
                            href={`mailto:${encodeURIComponent(form.clientEmail.trim())}`}
                            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-[#2E2E2E] hover:bg-gray-50 inline-flex items-center gap-2"
                        >
                            <Mail size={15} /> {copy.btnDirectEmail}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
