import { NextRequest } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAPIKey, apiSuccess, apiError, apiHeaders, parsePagination } from '@/src/lib/apiKeyAuth';

/**
 * GET /api/v1/trips — List trips
 * POST /api/v1/trips — Create trip
 */

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: apiHeaders() });
}

export async function GET(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    const { limit, offset } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const clientName = url.searchParams.get('clientName');

    try {
        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);
        let q = tenantRef.collection('trips').orderBy('createdAt', 'desc').limit(limit).offset(offset);

        const snap = await q.get();
        let trips = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title,
                destination: data.destination,
                clientName: data.clientName,
                startDate: data.startDate,
                endDate: data.endDate,
                travelers: data.travelers,
                status: data.status,
                budget: data.budget,
                currency: data.currency,
                createdAt: data.createdAt,
            };
        });

        if (status) trips = trips.filter(t => t.status === status);
        if (clientName) trips = trips.filter(t => t.clientName === clientName);

        return apiSuccess({ trips, total: trips.length, limit, offset });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const body = await req.json();
        const { title, destination, clientName, startDate, endDate, travelers, budget, currency, notes } = body;

        if (!destination) return apiError('destination is required');
        if (!clientName) return apiError('clientName is required');

        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);
        const docRef = await tenantRef.collection('trips').add({
            title: title || `Voyage ${destination}`,
            destination,
            clientName,
            startDate: startDate || '',
            endDate: endDate || '',
            travelers: travelers || 1,
            budget: budget || 0,
            currency: currency || 'EUR',
            notes: notes || '',
            status: 'DRAFT',
            source: 'api',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return apiSuccess({ id: docRef.id, destination, clientName }, 201);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
