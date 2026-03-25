export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { requirePermission } from '@/src/lib/rbac';

/**
 * POST /api/crm/batch
 * 
 * Bulk operations on CRM data.
 * Body: { action: 'delete' | 'update' | 'tag', collection: string, ids: string[], data?: any }
 * 
 * Requires Manager+ role for delete, Agent+ for update/tag.
 */
export async function POST(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const paywall = await requireSubscription(auth, 'crm');
    if (paywall) return paywall;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    const body = await req.json();
    const { action, collection, ids, data } = body;

    if (!action || !collection || !ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
            { error: 'Required: action (delete|update|tag), collection, ids[]' },
            { status: 400 }
        );
    }

    // Max 100 items per batch
    if (ids.length > 100) {
        return NextResponse.json({ error: 'Maximum 100 items par batch' }, { status: 400 });
    }

    // Allowed collections
    const ALLOWED = ['contacts', 'trips', 'suppliers', 'quotes', 'invoices', 'leads', 'catalog'];
    if (!ALLOWED.includes(collection)) {
        return NextResponse.json(
            { error: `Collection '${collection}' non autorisée. Autorisées: ${ALLOWED.join(', ')}` },
            { status: 400 }
        );
    }

    // RBAC check
    if (action === 'delete') {
        const key = `${collection === 'quotes' || collection === 'invoices' ? collection : 'contacts'}.delete` as any;
        const denied = requirePermission(auth as any, key);
        if (denied) return denied;
    }

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const batch = adminDb.batch();
        let processed = 0;

        for (const id of ids) {
            const docRef = tenantRef.collection(collection).doc(id);

            switch (action) {
                case 'delete':
                    batch.delete(docRef);
                    processed++;
                    break;

                case 'update':
                    if (!data || typeof data !== 'object') {
                        return NextResponse.json({ error: 'data object required for update' }, { status: 400 });
                    }
                    batch.update(docRef, { ...data, updatedAt: new Date() });
                    processed++;
                    break;

                case 'tag':
                    if (!data?.tags || !Array.isArray(data.tags)) {
                        return NextResponse.json({ error: 'data.tags[] required for tag action' }, { status: 400 });
                    }
                    batch.update(docRef, {
                        tags: FieldValue.arrayUnion(...data.tags),
                        updatedAt: new Date(),
                    });
                    processed++;
                    break;

                default:
                    return NextResponse.json({ error: `Action '${action}' non supportée` }, { status: 400 });
            }
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            action,
            collection,
            processed,
            message: `${processed} document(s) ${action === 'delete' ? 'supprimé(s)' : action === 'update' ? 'mis à jour' : 'tagué(s)'}`,
        });
    } catch (error: any) {
        console.error('[Batch] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
