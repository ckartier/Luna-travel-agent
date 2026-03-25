export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';

/* ═══════════════════════════════════════════════════
   PROACTIVE ALERTS — Zero Gemini Cost
   Scans CRM data and returns prioritized alerts
   ═══════════════════════════════════════════════════ */

interface Alert {
    type: string;
    emoji: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    count: number;
    action?: string;
}

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        
        const tenantId = (auth as any).tenantId || (auth as any).uid;
        const base = adminDb.collection('tenants').doc(tenantId);
        
        const now = Date.now();
        const today = new Date().toISOString().substring(0, 10);
        const alerts: Alert[] = [];

        // ── Parallel fetch all collections (single read, no Gemini) ──
        const [tasksSnap, invoicesSnap, contactsSnap, quotesSnap, tripsSnap, leadsSnap] = await Promise.all([
            base.collection('tasks').get(),
            base.collection('invoices').get(),
            base.collection('contacts').limit(200).get(),
            base.collection('quotes').get(),
            base.collection('trips').get(),
            base.collection('leads').get(),
        ]);

        // ─── 1. OVERDUE TASKS ───
        const overdueTasks = tasksSnap.docs.filter((d: any) => {
            const due = d.data().dueDate;
            return due && due < today && d.data().status !== 'DONE';
        });
        if (overdueTasks.length > 0) {
            const critical = overdueTasks.filter((d: any) => {
                const days = Math.round((now - new Date(d.data().dueDate).getTime()) / 86400000);
                return days > 7;
            });
            alerts.push({
                type: 'overdue_tasks',
                emoji: '⏰',
                priority: critical.length > 0 ? 'critical' : 'high',
                message: `${overdueTasks.length} tâche(s) en retard${critical.length > 0 ? ` dont ${critical.length} depuis +7 jours` : ''}`,
                count: overdueTasks.length,
                action: 'Dis "mes tâches" pour les voir',
            });
        }

        // ─── 2. UNPAID INVOICES ───
        const unpaidInvoices = invoicesSnap.docs.filter((d: any) => 
            !['PAID', 'CANCELLED'].includes(d.data().status || '')
        );
        if (unpaidInvoices.length > 0) {
            const totalUnpaid = unpaidInvoices.reduce((s: number, d: any) => s + (d.data().totalAmount || 0), 0);
            alerts.push({
                type: 'unpaid_invoices',
                emoji: '💳',
                priority: totalUnpaid > 5000 ? 'critical' : 'high',
                message: `${unpaidInvoices.length} facture(s) impayée(s) pour ${totalUnpaid}€`,
                count: unpaidInvoices.length,
                action: 'Dis "factures impayées"',
            });
        }

        // ─── 3. STALE QUOTES (sent > 7 days, no response) ───
        const staleQuotes = quotesSnap.docs.filter((d: any) => {
            if (d.data().status !== 'SENT') return false;
            const sentDate = d.data().sentDate || d.data().createdAt?.toDate?.()?.toISOString()?.substring(0, 10) || '';
            if (!sentDate) return false;
            return Math.round((now - new Date(sentDate).getTime()) / 86400000) > 7;
        });
        if (staleQuotes.length > 0) {
            const totalValue = staleQuotes.reduce((s: number, d: any) => s + (d.data().totalAmount || 0), 0);
            alerts.push({
                type: 'stale_quotes',
                emoji: '📋',
                priority: 'high',
                message: `${staleQuotes.length} devis sans réponse (${totalValue}€ en jeu)`,
                count: staleQuotes.length,
                action: 'Dis "coaching pipeline" pour agir',
            });
        }

        // ─── 4. INACTIVE CLIENTS (no activity > 60 days) ───
        const inactiveClients: string[] = [];
        for (const doc of contactsSnap.docs) {
            const c = doc.data();
            const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
            if (!name) continue;
            
            const createdAt = c.createdAt?.toDate?.()?.getTime() || 0;
            const updatedAt = c.updatedAt?.toDate?.()?.getTime() || createdAt;
            const lastActivity = Math.max(createdAt, updatedAt);
            
            if (lastActivity > 0 && (now - lastActivity) > 60 * 86400000) {
                inactiveClients.push(name);
            }
        }
        if (inactiveClients.length > 0) {
            alerts.push({
                type: 'inactive_clients',
                emoji: '😴',
                priority: 'medium',
                message: `${inactiveClients.length} client(s) inactif(s) depuis +60j${inactiveClients.length <= 3 ? ': ' + inactiveClients.join(', ') : ''}`,
                count: inactiveClients.length,
                action: 'Dis "qui va churner" pour analyser',
            });
        }

        // ─── 5. UPCOMING TRIPS (next 7 days) ───
        const weekFromNow = new Date(now + 7 * 86400000).toISOString().substring(0, 10);
        const upcomingTrips = tripsSnap.docs.filter((d: any) => {
            const start = d.data().startDate;
            return start && start >= today && start <= weekFromNow;
        });
        if (upcomingTrips.length > 0) {
            const tripNames = upcomingTrips.slice(0, 3).map((d: any) => 
                `${d.data().clientName || '?'} → ${d.data().destination || '?'} (${d.data().startDate})`
            ).join(', ');
            alerts.push({
                type: 'upcoming_trips',
                emoji: '✈️',
                priority: 'medium',
                message: `${upcomingTrips.length} voyage(s) dans les 7 prochains jours: ${tripNames}`,
                count: upcomingTrips.length,
                action: 'Dis "voyages à venir" pour les voir',
            });
        }

        // ─── 6. NEW LEADS TODAY ───
        const todayLeads = leadsSnap.docs.filter((d: any) => {
            const created = d.data().createdAt?.toDate?.();
            return created && (now - created.getTime()) < 86400000;
        });
        if (todayLeads.length > 0) {
            alerts.push({
                type: 'new_leads',
                emoji: '🆕',
                priority: 'medium',
                message: `${todayLeads.length} nouveau(x) lead(s) aujourd'hui`,
                count: todayLeads.length,
                action: 'Dis "pipeline" pour les voir',
            });
        }

        // ─── 7. TODAY'S TASKS ───
        const todayTasks = tasksSnap.docs.filter((d: any) => 
            d.data().dueDate === today && d.data().status !== 'DONE'
        );
        if (todayTasks.length > 0) {
            alerts.push({
                type: 'today_tasks',
                emoji: '📋',
                priority: 'high',
                message: `${todayTasks.length} tâche(s) prévue(s) aujourd'hui`,
                count: todayTasks.length,
                action: 'Dis "mes tâches du jour"',
            });
        }

        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        // Build summary for voice greeting
        const critical = alerts.filter(a => a.priority === 'critical');
        const high = alerts.filter(a => a.priority === 'high');
        
        let voiceSummary = '';
        if (alerts.length === 0) {
            voiceSummary = 'Tout est en ordre. Aucune alerte.';
        } else {
            const parts: string[] = [];
            if (critical.length > 0) parts.push(`🚨 ${critical.length} alerte(s) critique(s)`);
            if (high.length > 0) parts.push(`⚠️ ${high.length} alerte(s) importante(s)`);
            parts.push(`${alerts.length} notification(s) au total`);
            voiceSummary = parts.join('. ') + '. ' + alerts.slice(0, 3).map(a => `${a.emoji} ${a.message}`).join('. ') + '.';
        }

        return NextResponse.json({
            success: true,
            alerts,
            totalAlerts: alerts.length,
            criticalCount: critical.length,
            highCount: high.length,
            voiceSummary,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
    }
}
