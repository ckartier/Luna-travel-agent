export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuthWithTenant } from '@/src/lib/firebase/apiAuth';
import { ensureProTravelSupplier } from '@/src/lib/firebase/provisioning';

type WorkflowItem = {
    id?: string;
    name?: string;
    type?: string;
    location?: string;
    clientPrice?: number | string;
    currency?: string;
    requestedDate?: string;
    requestedStartTime?: string;
    requestedEndTime?: string;
    requestedNote?: string;
};

type TripDocument = {
    id: string;
    [key: string]: unknown;
};

function toNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const n = Number(value.replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

function toIsoDate(dateLike?: string): string {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function addDays(isoDate: string, days: number): string {
    const base = isoDate ? new Date(isoDate) : new Date();
    base.setDate(base.getDate() + days);
    return base.toISOString().split('T')[0];
}

function normalizeWorkflowSlots(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
        .map((slot) => {
            const data = (slot || {}) as Record<string, unknown>;
            return {
                itemId: String(data.itemId || ''),
                description: String(data.description || ''),
                type: String(data.type || ''),
                location: String(data.location || ''),
                date: String(data.date || ''),
                startTime: String(data.startTime || ''),
                endTime: String(data.endTime || ''),
                availability: String(data.availability || 'AVAILABLE'),
                note: String(data.note || ''),
            };
        })
        .filter((slot) => slot.itemId || slot.description);
}

export async function GET(request: Request) {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;
    if (auth.accessScope !== 'pro_travel') {
        return NextResponse.json({ error: 'Pro access required' }, { status: 403 });
    }

    try {
        const tenantId = auth.tenantId;
        await ensureProTravelSupplier({ uid: auth.uid, email: auth.email, tenantId });

        const tripsSnap = await adminDb
            .collection('tenants')
            .doc(tenantId)
            .collection('trips')
            .orderBy('createdAt', 'desc')
            .limit(40)
            .get();

        const trips = tripsSnap.docs
            .map((doc): TripDocument => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
            .filter((trip) => String(trip.createdByUid || '') === auth.uid)
            .slice(0, 20)
            .map((trip) => {
                const status = String(trip.status || 'DRAFT');
                const source = String(trip.source || '');
                const proWorkflowState = String(trip.proWorkflowState || 'PENDING_REVIEW');
                const lunaTripValidated = Boolean(trip.lunaTripValidated);
                const lunaReservationValidated = Boolean(trip.lunaReservationValidated);
                const isValidatedByLuna =
                    proWorkflowState === 'LUNA_VALIDATED' ||
                    (source === 'pro-workflow' &&
                        status === 'CONFIRMED' &&
                        lunaTripValidated &&
                        lunaReservationValidated);

                const explicitAlertSeen = typeof trip.proLunaAlertSeen === 'boolean' ? trip.proLunaAlertSeen : null;
                const proLunaAlertSeen =
                    explicitAlertSeen !== null ? explicitAlertSeen : isValidatedByLuna ? false : true;

                return {
                    id: trip.id,
                    title: String(trip.title || ''),
                    clientName: String(trip.clientName || ''),
                    clientEmail: String(trip.clientEmail || ''),
                    destination: String(trip.destination || ''),
                    startDate: String(trip.startDate || ''),
                    endDate: String(trip.endDate || ''),
                    status,
                    source,
                    totalClientPrice: toNumber(trip.totalClientPrice) || toNumber(trip.amount),
                    commissionAmount: toNumber(trip.commissionAmount),
                    commissionRate: toNumber(trip.commissionRate),
                    planningAlertDate: String(trip.planningAlertDate || ''),
                    lunaTripValidated,
                    lunaReservationValidated,
                    proWorkflowState,
                    proWorkflowMessage: String(trip.proWorkflowMessage || ''),
                    proWorkflowSlots: normalizeWorkflowSlots(trip.proWorkflowSlots),
                    proLunaAlertSeen,
                    proLunaAlertAt: String(trip.proLunaAlertAt || ''),
                    invoiceId: String(trip.invoiceId || ''),
                    createdAt: trip.createdAt ?? null,
                    updatedAt: trip.updatedAt ?? null,
                };
            });

        return NextResponse.json({ trips });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;
    if (auth.accessScope !== 'pro_travel') {
        return NextResponse.json({ error: 'Pro access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const clientName = String(body?.clientName || '').trim();
        const clientEmail = String(body?.clientEmail || '').trim();
        const destination = String(body?.destination || '').trim();
        const travelers = Math.max(1, Number(body?.travelers || 1));
        const notes = String(body?.notes || '').trim();
        const commissionRate = Math.max(0, Math.min(100, Number(body?.commissionRate ?? 12)));
        const startDate = toIsoDate(body?.startDate);
        const endDate = toIsoDate(body?.endDate);
        const currency = String(body?.currency || 'EUR');
        const rawItems = Array.isArray(body?.items) ? (body.items as WorkflowItem[]) : [];

        if (!clientName) return NextResponse.json({ error: 'clientName is required' }, { status: 400 });
        if (!destination) return NextResponse.json({ error: 'destination is required' }, { status: 400 });
        if (rawItems.length === 0) return NextResponse.json({ error: 'At least one prestation is required' }, { status: 400 });

        const items = rawItems.map((item) => {
            const unitPrice = toNumber(item.clientPrice);
            return {
                id: String(item.id || ''),
                description: String(item.name || 'Prestation'),
                type: String(item.type || 'OTHER'),
                location: String(item.location || ''),
                quantity: 1,
                unitPrice,
                total: unitPrice,
                taxRate: 0,
                currency: String(item.currency || currency || 'EUR'),
                requestedDate: toIsoDate(item.requestedDate),
                requestedStartTime: String(item.requestedStartTime || ''),
                requestedEndTime: String(item.requestedEndTime || ''),
                requestedNote: String(item.requestedNote || '').trim(),
            };
        });

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const commissionAmount = Number((subtotal * (commissionRate / 100)).toFixed(2));
        const supplierEstimatedCost = Number((subtotal - commissionAmount).toFixed(2));

        const tenantId = auth.tenantId;
        await ensureProTravelSupplier({ uid: auth.uid, email: auth.email, tenantId });
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const now = new Date();
        const issueDate = now.toISOString().split('T')[0];
        const dueDate = addDays(issueDate, 7);
        const planningAlertDate = startDate ? addDays(startDate, -7) : addDays(issueDate, 3);

        const invoiceCountSnap = await tenantRef.collection('invoices').count().get();
        const invoiceNumber = `FAC-PRO-${String(invoiceCountSnap.data().count + 1).padStart(4, '0')}`;

        const invoiceRef = tenantRef.collection('invoices').doc();
        await invoiceRef.set({
            invoiceNumber,
            clientName,
            clientEmail,
            items,
            subtotal,
            taxTotal: 0,
            totalAmount: subtotal,
            currency,
            status: 'DRAFT',
            issueDate,
            dueDate,
            source: 'pro-workflow',
            createdByUid: auth.uid,
            createdAt: now,
            updatedAt: now,
        });

        const tripRef = tenantRef.collection('trips').doc();
        await tripRef.set({
            title: `Trip ${destination}`,
            destination,
            clientName,
            clientEmail,
            travelers,
            startDate,
            endDate,
            notes,
            status: 'PROPOSAL',
            paymentStatus: 'PENDING',
            amount: subtotal,
            totalClientPrice: subtotal,
            commissionRate,
            commissionAmount,
            supplierEstimatedCost,
            currency,
            selectedItems: items,
            planning: [
                { key: 'proposal', label: 'Proposition envoyee', date: issueDate, status: 'done' },
                { key: 'confirm', label: 'Confirmation client', date: addDays(issueDate, 2), status: 'todo' },
                { key: 'deposit', label: 'Acompte', date: addDays(issueDate, 4), status: 'todo' },
                { key: 'departure', label: 'Depart', date: startDate || '', status: 'todo' },
            ],
            planningAlertDate,
            lunaTripValidated: false,
            lunaReservationValidated: false,
            proWorkflowState: 'PENDING_REVIEW',
            proWorkflowMessage: '',
            proWorkflowUpdatedAt: now.toISOString(),
            proWorkflowUpdatedBy: auth.uid,
            proLunaAlertSeen: true,
            proLunaAlertAt: '',
            invoiceId: invoiceRef.id,
            source: 'pro-workflow',
            createdByUid: auth.uid,
            createdAt: now,
            updatedAt: now,
        });

        const reminderRef = tenantRef.collection('reminders').doc();
        await reminderRef.set({
            title: `Verifier prestations - ${clientName}`,
            note: `Trip ${destination} (${travelers} voyageur${travelers > 1 ? 's' : ''})`,
            dueDate: planningAlertDate,
            priority: startDate && new Date(startDate).getTime() - now.getTime() < 7 * 24 * 3600 * 1000 ? 'high' : 'medium',
            completed: false,
            source: 'pro-workflow',
            tripId: tripRef.id,
            invoiceId: invoiceRef.id,
            createdBy: auth.uid,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            success: true,
            trip: {
                id: tripRef.id,
                status: 'PROPOSAL',
                totalClientPrice: subtotal,
                commissionRate,
                commissionAmount,
                supplierEstimatedCost,
            },
            invoice: {
                id: invoiceRef.id,
                invoiceNumber,
                status: 'DRAFT',
                totalAmount: subtotal,
            },
            reminder: {
                id: reminderRef.id,
                dueDate: planningAlertDate,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const auth = await verifyAuthWithTenant(request);
    if (auth instanceof Response) return auth;
    if (auth.accessScope !== 'pro_travel') {
        return NextResponse.json({ error: 'Pro access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const tripId = String(body?.tripId || '').trim();
        const invoiceId = String(body?.invoiceId || '').trim();
        const action = String(body?.action || '').trim();
        if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 });

        const tenantId = auth.tenantId;
        await ensureProTravelSupplier({ uid: auth.uid, email: auth.email, tenantId });
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const now = new Date();

        const tripRef = tenantRef.collection('trips').doc(tripId);

        if (action === 'set_validation') {
            return NextResponse.json(
                { error: 'Validation Luna must be done from CRM' },
                { status: 403 }
            );
        }

        if (action === 'pro_acknowledge') {
            await tripRef.set(
                {
                    proWorkflowState: 'PRO_CONFIRMED',
                    proWorkflowUpdatedAt: now.toISOString(),
                    proWorkflowUpdatedBy: auth.uid,
                    proWorkflowConfirmedAt: now.toISOString(),
                    proLunaAlertSeen: true,
                    updatedAt: now,
                },
                { merge: true }
            );

            const tripSnap = await tripRef.get();
            const tripData = (tripSnap.data() || {}) as Record<string, unknown>;
            await tenantRef.collection('reminders').add({
                title: `Validation prestataire reçue - ${String(tripData.clientName || 'Trip')}`,
                note: `Le prestataire a validé la demande pour ${String(tripData.destination || '')}.`,
                dueDate: now.toISOString().split('T')[0],
                priority: 'high',
                completed: false,
                source: 'pro-workflow',
                tripId,
                createdBy: auth.uid,
                createdAt: now,
                updatedAt: now,
            });

            const trip = tripData;
            return NextResponse.json({
                success: true,
                workflow: {
                    tripId,
                    proWorkflowState: String(trip.proWorkflowState || 'PRO_CONFIRMED'),
                    proWorkflowConfirmedAt: String(trip.proWorkflowConfirmedAt || ''),
                },
            });
        }

        if (action === 'mark_luna_alert_seen') {
            await tripRef.set(
                {
                    proLunaAlertSeen: true,
                    updatedAt: now,
                },
                { merge: true }
            );
            return NextResponse.json({
                success: true,
                alert: {
                    tripId,
                    seen: true,
                },
            });
        }

        await tripRef.set(
            {
                status: 'CONFIRMED',
                confirmationAt: now,
                updatedAt: now,
            },
            { merge: true }
        );

        if (invoiceId) {
            const invoiceRef = tenantRef.collection('invoices').doc(invoiceId);
            await invoiceRef.set(
                {
                    status: 'SENT',
                    sentAt: now.toISOString(),
                    updatedAt: now,
                },
                { merge: true }
            );
        }

        return NextResponse.json({
            success: true,
            confirmation: {
                tripId,
                tripStatus: 'CONFIRMED',
                invoiceId: invoiceId || null,
                invoiceStatus: invoiceId ? 'SENT' : null,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
