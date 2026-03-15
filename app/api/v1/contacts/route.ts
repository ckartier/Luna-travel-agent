import { NextRequest } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAPIKey, apiSuccess, apiError, apiHeaders, parsePagination } from '@/src/lib/apiKeyAuth';

/**
 * GET /api/v1/contacts — List contacts
 * POST /api/v1/contacts — Create contact
 */

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: apiHeaders() });
}

export async function GET(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    const { limit, offset } = parsePagination(req);
    const url = new URL(req.url);
    const tag = url.searchParams.get('tag');
    const type = url.searchParams.get('type'); // B2B | B2C

    try {
        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);
        let q = tenantRef.collection('contacts').orderBy('createdAt', 'desc').limit(limit).offset(offset);

        const snap = await q.get();
        let contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Client-side filtering (Firestore limitations)
        if (tag) contacts = contacts.filter((c: any) => c.tags?.includes(tag));
        if (type) contacts = contacts.filter((c: any) => c.type === type);

        return apiSuccess({ contacts, total: contacts.length, limit, offset });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyAPIKey(req);
    if (auth instanceof Response) return auth;

    try {
        const body = await req.json();
        const { name, email, phone, type, tags, company, notes, address } = body;

        if (!name) return apiError('name is required');

        const tenantRef = adminDb.collection('tenants').doc(auth.tenantId);
        const docRef = await tenantRef.collection('contacts').add({
            name,
            email: email || '',
            phone: phone || '',
            type: type || 'B2C',
            tags: tags || [],
            company: company || '',
            notes: notes || '',
            address: address || '',
            source: 'api',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return apiSuccess({ id: docRef.id, name }, 201);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
