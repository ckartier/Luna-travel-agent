import { adminDb } from '@/src/lib/firebase/admin';

/**
 * Activity Logger
 * 
 * Records all CRM actions for audit trail and activity feed.
 * Stores in: tenants/{tenantId}/activity_log
 */

export type ActivityAction =
    | 'contact.created' | 'contact.updated' | 'contact.deleted'
    | 'trip.created' | 'trip.updated' | 'trip.deleted'
    | 'quote.created' | 'quote.sent' | 'quote.accepted' | 'quote.rejected'
    | 'invoice.created' | 'invoice.sent' | 'invoice.paid'
    | 'booking.created' | 'booking.confirmed' | 'booking.cancelled'
    | 'portal.shared' | 'portal.viewed'
    | 'email.sent' | 'voucher.generated'
    | 'api_key.created' | 'webhook.registered';

export interface ActivityEntry {
    action: ActivityAction;
    entityType: string;
    entityId: string;
    entityName: string;
    userId?: string;
    userName?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

/**
 * Log an activity event
 */
export async function logActivity(
    tenantId: string,
    action: ActivityAction,
    entity: { type: string; id: string; name: string },
    user?: { id: string; name: string },
    metadata?: Record<string, any>
): Promise<void> {
    try {
        await adminDb
            .collection('tenants').doc(tenantId)
            .collection('activity_log')
            .add({
                action,
                entityType: entity.type,
                entityId: entity.id,
                entityName: entity.name,
                userId: user?.id || 'system',
                userName: user?.name || 'Système',
                metadata: metadata || {},
                timestamp: new Date(),
            });
    } catch (error) {
        console.error('[ActivityLogger] Error:', error);
    }
}

/**
 * Get recent activity for a tenant
 */
export async function getRecentActivity(tenantId: string, limit: number = 20): Promise<ActivityEntry[]> {
    try {
        const snap = await adminDb
            .collection('tenants').doc(tenantId)
            .collection('activity_log')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snap.docs.map(doc => {
            const d = doc.data();
            return {
                action: d.action,
                entityType: d.entityType,
                entityId: d.entityId,
                entityName: d.entityName,
                userId: d.userId,
                userName: d.userName,
                metadata: d.metadata || {},
                timestamp: d.timestamp?.toDate?.() || new Date(d.timestamp),
            };
        });
    } catch (error) {
        console.error('[ActivityLogger] Fetch error:', error);
        return [];
    }
}

/**
 * Format activity for display
 */
export function formatActivity(entry: ActivityEntry): { icon: string; text: string; color: string } {
    const map: Record<string, { icon: string; text: string; color: string }> = {
        'contact.created': { icon: '👤', text: `a créé le contact ${entry.entityName}`, color: '#2F80ED' },
        'contact.updated': { icon: '✏️', text: `a modifié ${entry.entityName}`, color: '#6B7280' },
        'contact.deleted': { icon: '🗑', text: `a supprimé ${entry.entityName}`, color: '#EF4444' },
        'trip.created': { icon: '✈️', text: `a créé le voyage ${entry.entityName}`, color: '#27AE60' },
        'trip.updated': { icon: '✏️', text: `a modifié le voyage ${entry.entityName}`, color: '#6B7280' },
        'trip.deleted': { icon: '🗑', text: `a supprimé le voyage ${entry.entityName}`, color: '#EF4444' },
        'quote.created': { icon: '📋', text: `a créé le devis ${entry.entityName}`, color: '#F2994A' },
        'quote.sent': { icon: '📤', text: `a envoyé le devis ${entry.entityName}`, color: '#2F80ED' },
        'quote.accepted': { icon: '✅', text: `Devis ${entry.entityName} accepté`, color: '#27AE60' },
        'quote.rejected': { icon: '❌', text: `Devis ${entry.entityName} refusé`, color: '#EF4444' },
        'invoice.created': { icon: '🧾', text: `a créé la facture ${entry.entityName}`, color: '#9B51E0' },
        'invoice.sent': { icon: '📤', text: `a envoyé la facture ${entry.entityName}`, color: '#2F80ED' },
        'invoice.paid': { icon: '💰', text: `Facture ${entry.entityName} payée`, color: '#27AE60' },
        'booking.created': { icon: '📅', text: `a créé la réservation ${entry.entityName}`, color: '#F2994A' },
        'booking.confirmed': { icon: '✅', text: `Réservation ${entry.entityName} confirmée`, color: '#27AE60' },
        'booking.cancelled': { icon: '❌', text: `Réservation ${entry.entityName} annulée`, color: '#EF4444' },
        'portal.shared': { icon: '🌐', text: `a partagé le portail pour ${entry.entityName}`, color: '#5a8fa3' },
        'portal.viewed': { icon: '👁', text: `Client a consulté le portail ${entry.entityName}`, color: '#6B7280' },
        'email.sent': { icon: '📧', text: `Email envoyé à ${entry.entityName}`, color: '#2F80ED' },
        'voucher.generated': { icon: '📄', text: `Voucher généré pour ${entry.entityName}`, color: '#F2994A' },
        'api_key.created': { icon: '🔑', text: `Clé API créée`, color: '#9B51E0' },
        'webhook.registered': { icon: '🔗', text: `Webhook enregistré`, color: '#EB5757' },
    };

    return map[entry.action] || { icon: '📌', text: `${entry.action} — ${entry.entityName}`, color: '#6B7280' };
}
