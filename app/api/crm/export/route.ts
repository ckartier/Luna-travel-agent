import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { requireRole } from '@/src/lib/rbac';

/**
 * GET /api/crm/export?type=contacts|trips|invoices|quotes&format=csv
 * 
 * Export CRM data as CSV. Requires Manager+ role.
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

    // Manager+ only
    const denied = requireRole(auth as any, 'Manager');
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'contacts';

    const tenantRef = adminDb.collection('tenants').doc(tenantId);

    try {
        let csvContent = '';
        let filename = '';

        switch (type) {
            case 'contacts': {
                const snap = await tenantRef.collection('contacts').orderBy('lastName').get();
                const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Société', 'VIP', 'Nationalité', 'Date création'];
                const rows = snap.docs.map(d => {
                    const c = d.data();
                    return [
                        c.firstName || '',
                        c.lastName || '',
                        c.email || '',
                        c.phone || '',
                        c.company || '',
                        c.vipLevel || 'Standard',
                        c.nationality || '',
                        c.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '',
                    ];
                });
                csvContent = buildCsv(headers, rows);
                filename = `contacts-export-${dateStr()}.csv`;
                break;
            }

            case 'trips': {
                const snap = await tenantRef.collection('trips').orderBy('createdAt', 'desc').get();
                const headers = ['Titre', 'Destination', 'Client', 'Début', 'Fin', 'Statut', 'Montant', 'Voyageurs'];
                const rows = snap.docs.map(d => {
                    const t = d.data();
                    return [
                        t.title || '',
                        t.destination || '',
                        t.clientName || '',
                        t.startDate || '',
                        t.endDate || '',
                        t.status || '',
                        String(t.amount || 0),
                        String(t.travelers || 0),
                    ];
                });
                csvContent = buildCsv(headers, rows);
                filename = `trips-export-${dateStr()}.csv`;
                break;
            }

            case 'invoices': {
                const snap = await tenantRef.collection('invoices').orderBy('createdAt', 'desc').get();
                const headers = ['N° Facture', 'Client', 'Date', 'Échéance', 'Montant HT', 'TVA', 'Total TTC', 'Statut', 'Devise'];
                const rows = snap.docs.map(d => {
                    const inv = d.data();
                    return [
                        inv.invoiceNumber || '',
                        inv.clientName || '',
                        inv.issueDate || '',
                        inv.dueDate || '',
                        String(inv.subtotal || 0),
                        String(inv.taxTotal || 0),
                        String(inv.totalAmount || 0),
                        inv.status || '',
                        inv.currency || 'EUR',
                    ];
                });
                csvContent = buildCsv(headers, rows);
                filename = `invoices-export-${dateStr()}.csv`;
                break;
            }

            case 'quotes': {
                const snap = await tenantRef.collection('quotes').orderBy('createdAt', 'desc').get();
                const headers = ['N° Devis', 'Client', 'Date', 'Validité', 'Montant HT', 'TVA', 'Total TTC', 'Statut', 'Devise'];
                const rows = snap.docs.map(d => {
                    const q = d.data();
                    return [
                        q.quoteNumber || '',
                        q.clientName || '',
                        q.issueDate || '',
                        q.validUntil || '',
                        String(q.subtotal || 0),
                        String(q.taxTotal || 0),
                        String(q.totalAmount || 0),
                        q.status || '',
                        q.currency || 'EUR',
                    ];
                });
                csvContent = buildCsv(headers, rows);
                filename = `quotes-export-${dateStr()}.csv`;
                break;
            }

            default:
                return NextResponse.json({ error: `Type '${type}' non supporté. Utilisez: contacts, trips, invoices, quotes` }, { status: 400 });
        }

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error('[Export] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}

function buildCsv(headers: string[], rows: string[][]): string {
    const escape = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };
    const lines = [
        '\uFEFF' + headers.map(escape).join(','), // BOM for Excel UTF-8
        ...rows.map(row => row.map(escape).join(',')),
    ];
    return lines.join('\n');
}

function dateStr() {
    return new Date().toISOString().split('T')[0];
}
