export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/search?q=xxx&type=all|contacts|trips|suppliers|quotes|invoices&limit=20
 * 
 * Advanced cross-entity search with type filtering.
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!q || q.length < 2) {
        return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const results: any[] = [];

        const shouldSearch = (t: string) => type === 'all' || type === t;

        // Contacts
        if (shouldSearch('contacts')) {
            const snap = await tenantRef.collection('contacts').get();
            snap.docs.forEach(d => {
                const c = d.data();
                const searchStr = `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.company}`.toLowerCase();
                if (searchStr.includes(q)) {
                    results.push({
                        type: 'contact',
                        id: d.id,
                        name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                        subtitle: c.email || c.phone || '',
                        href: `/crm/clients/${d.id}`,
                    });
                }
            });
        }

        // Trips
        if (shouldSearch('trips')) {
            const snap = await tenantRef.collection('trips').get();
            snap.docs.forEach(d => {
                const t = d.data();
                const searchStr = `${t.title} ${t.destination} ${t.clientName}`.toLowerCase();
                if (searchStr.includes(q)) {
                    results.push({
                        type: 'trip',
                        id: d.id,
                        name: t.title || t.destination || 'Sans titre',
                        subtitle: `${t.clientName || ''} · ${t.status || 'DRAFT'}`,
                        href: `/crm/trips/${d.id}`,
                    });
                }
            });
        }

        // Suppliers
        if (shouldSearch('suppliers')) {
            const snap = await tenantRef.collection('suppliers').get();
            snap.docs.forEach(d => {
                const s = d.data();
                const searchStr = `${s.name} ${s.city} ${s.country} ${s.category}`.toLowerCase();
                if (searchStr.includes(q)) {
                    results.push({
                        type: 'supplier',
                        id: d.id,
                        name: s.name || '',
                        subtitle: `${s.category || ''} · ${s.city || ''}, ${s.country || ''}`,
                        href: `/crm/suppliers/${d.id}`,
                    });
                }
            });
        }

        // Quotes
        if (shouldSearch('quotes')) {
            const snap = await tenantRef.collection('quotes').get();
            snap.docs.forEach(d => {
                const qd = d.data();
                const searchStr = `${qd.quoteNumber} ${qd.clientName}`.toLowerCase();
                if (searchStr.includes(q)) {
                    results.push({
                        type: 'quote',
                        id: d.id,
                        name: `Devis ${qd.quoteNumber || d.id.slice(0, 6)}`,
                        subtitle: `${qd.clientName || ''} · ${qd.totalAmount || 0}€`,
                        href: `/crm/devis`,
                    });
                }
            });
        }

        // Invoices
        if (shouldSearch('invoices')) {
            const snap = await tenantRef.collection('invoices').get();
            snap.docs.forEach(d => {
                const inv = d.data();
                const searchStr = `${inv.invoiceNumber} ${inv.clientName}`.toLowerCase();
                if (searchStr.includes(q)) {
                    results.push({
                        type: 'invoice',
                        id: d.id,
                        name: `Facture ${inv.invoiceNumber || d.id.slice(0, 6)}`,
                        subtitle: `${inv.clientName || ''} · ${inv.totalAmount || 0}€`,
                        href: `/crm/invoices`,
                    });
                }
            });
        }

        return NextResponse.json({
            results: results.slice(0, limit),
            total: results.length,
            query: q,
            type,
        });
    } catch (error: any) {
        console.error('[Search] Error:', error);
        return NextResponse.json({ results: [], total: 0 });
    }
}
