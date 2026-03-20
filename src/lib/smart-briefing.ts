import { adminDb } from '@/src/lib/firebase/admin';

/**
 * Smart CRM Briefing Engine
 * 
 * Analyzes ALL CRM data and generates proactive insights, alerts, and suggestions.
 * This is what makes Luna unique — she doesn't wait for commands, she THINKS.
 */

export interface BriefingAlert {
    type: 'urgent' | 'warning' | 'info' | 'opportunity';
    icon: string;
    message: string;
    actionSuggestion?: string;  // What the user should say to fix it
}

export interface SmartBriefing {
    greeting: string;
    isOnboarding?: boolean;
    onboardingSteps?: string[];
    alerts: BriefingAlert[];
    stats: {
        tripsToday: number;
        tasksDue: number;
        unpaidInvoices: number;
        newLeads: number;
        supplierPending: number;
    };
}

export async function generateSmartBriefing(
    tenantId: string,
    firstName: string
): Promise<SmartBriefing> {
    const base = adminDb.collection('tenants').doc(tenantId);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    // Parallel fetch ALL relevant data
    const [
        tripsSnap, tasksSnap, invoicesSnap, leadsSnap, 
        bookingsSnap, quotesSnap, paymentsSnap, contactsSnap, catalogSnap
    ] = await Promise.all([
        base.collection('trips').get(),
        base.collection('tasks').get(),
        base.collection('invoices').get(),
        base.collection('leads').get(),
        base.collection('supplierBookings').get(),
        base.collection('quotes').get(),
        base.collection('payments').get(),
        base.collection('contacts').get(),
        base.collection('catalog').get(),
    ]);

    const alerts: BriefingAlert[] = [];

    // ═══════════════════════════════════════════
    //  NEW SUBSCRIBER ONBOARDING DETECTION
    // ═══════════════════════════════════════════
    const totalDocs = contactsSnap.size + tripsSnap.size + quotesSnap.size + invoicesSnap.size;
    const isNewCRM = totalDocs === 0;
    
    if (isNewCRM) {
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
        
        // Build onboarding steps based on what's missing
        const steps: string[] = [];
        if (contactsSnap.empty) steps.push('Créez votre premier client — dites "crée un client" suivi du nom.');
        if (catalogSnap.empty) steps.push('Ajoutez vos prestations dans le catalogue — allez dans "catalogue".');
        if (tripsSnap.empty && contactsSnap.size > 0) steps.push('Créez votre premier voyage — dites "crée un voyage pour [client]".');
        
        const welcomeMsg = steps.length > 0 
            ? `${timeGreeting} ${firstName}, bienvenue sur Luna ! Pour commencer : ${steps[0]}` 
            : `${timeGreeting} ${firstName}, bienvenue ! Je suis Luna, votre assistante IA. Commencez par créer votre premier client.`;
        
        return {
            greeting: welcomeMsg,
            isOnboarding: true,
            onboardingSteps: steps,
            alerts: [{
                type: 'info' as const,
                icon: '🚀',
                message: 'CRM vierge — mode onboarding activé.',
                actionSuggestion: 'Dites "crée un client Jean Dupont" pour commencer.',
            }],
            stats: {
                tripsToday: 0,
                tasksDue: 0,
                unpaidInvoices: 0,
                newLeads: 0,
                supplierPending: 0,
            },
        };
    }

    // ═══════════════════════════════════════════
    //  PARTIAL ONBOARDING — CRM started but incomplete
    // ═══════════════════════════════════════════
    if (contactsSnap.size > 0 && contactsSnap.size <= 3 && tripsSnap.empty) {
        alerts.push({
            type: 'info',
            icon: '💡',
            message: `Vous avez ${contactsSnap.size} client(s). Créez votre premier voyage pour commencer !`,
            actionSuggestion: 'Dis "crée un voyage pour [nom du client]".',
        });
    }
    if (contactsSnap.size > 0 && catalogSnap.empty) {
        alerts.push({
            type: 'info',
            icon: '📦',
            message: 'Votre catalogue est vide. Ajoutez vos prestations pour les proposer plus facilement.',
            actionSuggestion: 'Dis "va au catalogue" pour ajouter vos offres.',
        });
    }

    // ─── 1. Trips starting soon WITHOUT confirmed bookings ───
    const upcomingTrips = tripsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(t => t.startDate >= today && t.startDate <= threeDaysOut);

    for (const trip of upcomingTrips) {
        const tripBookings = bookingsSnap.docs
            .map(d => d.data())
            .filter((b: any) => b.tripId === trip.id || (b.clientName || '').toLowerCase() === (trip.clientName || '').toLowerCase());
        
        const unconfirmed = tripBookings.filter((b: any) => b.status === 'PENDING');
        
        if (trip.startDate === today) {
            alerts.push({
                type: 'urgent',
                icon: '🚨',
                message: `Le voyage de ${trip.clientName} pour ${trip.destination} commence AUJOURD'HUI !`,
                actionSuggestion: `Dis "planning du jour" pour voir les détails.`,
            });
            if (unconfirmed.length > 0) {
                alerts.push({
                    type: 'urgent',
                    icon: '⚠️',
                    message: `${unconfirmed.length} prestation(s) non confirmée(s) pour ${trip.clientName} — voyage en cours !`,
                    actionSuggestion: `Dis "réservations prestataires" pour les gérer.`,
                });
            }
        } else if (trip.startDate === tomorrow) {
            alerts.push({
                type: 'warning',
                icon: '📅',
                message: `Voyage de ${trip.clientName} (${trip.destination}) demain.${unconfirmed.length ? ` ${unconfirmed.length} prestation(s) à confirmer.` : ''}`,
                actionSuggestion: unconfirmed.length ? `Dis "réservations prestataires" pour confirmer.` : undefined,
            });
        }
    }

    // ─── 2. Overdue invoices ───
    const overdueInvoices = invoicesSnap.docs
        .map(d => d.data())
        .filter((i: any) => i.status === 'SENT' && i.dueDate && i.dueDate < today);
    
    if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
        alerts.push({
            type: 'warning',
            icon: '💸',
            message: `${overdueInvoices.length} facture(s) en retard pour un total de ${totalOverdue}€.`,
            actionSuggestion: `Dis "factures impayées" pour voir les détails.`,
        });
    }

    // ─── 3. Tasks due today ───
    const tasksDueToday = tasksSnap.docs
        .map(d => d.data())
        .filter((t: any) => t.dueDate === today && t.status !== 'DONE');
    
    if (tasksDueToday.length > 0) {
        const urgent = tasksDueToday.filter((t: any) => t.priority === 'urgent' || t.priority === 'high');
        if (urgent.length > 0) {
            alerts.push({
                type: 'urgent',
                icon: '🔴',
                message: `${urgent.length} tâche(s) urgente(s) aujourd'hui : ${urgent.map((t: any) => t.title).join(', ')}.`,
                actionSuggestion: `Dis "mes tâches" pour les voir.`,
            });
        } else {
            alerts.push({
                type: 'info',
                icon: '✅',
                message: `${tasksDueToday.length} tâche(s) à faire aujourd'hui.`,
            });
        }
    }

    // ─── 4. New leads not contacted ───
    const newLeads = leadsSnap.docs
        .map(d => d.data())
        .filter((l: any) => l.status === 'NEW');
    
    if (newLeads.length > 0) {
        alerts.push({
            type: 'opportunity',
            icon: '🌟',
            message: `${newLeads.length} nouveau(x) lead(s) à contacter : ${newLeads.slice(0, 2).map((l: any) => l.clientName).join(', ')}${newLeads.length > 2 ? '...' : ''}.`,
            actionSuggestion: `Dis "va au pipeline" pour les traiter.`,
        });
    }

    // ─── 5. Quotes pending for too long ───
    const staleQuotes = quotesSnap.docs
        .map(d => d.data())
        .filter((q: any) => {
            if (q.status !== 'SENT') return false;
            const sentAt = q.updatedAt?.toDate?.() || q.createdAt?.toDate?.();
            if (!sentAt) return false;
            return (Date.now() - sentAt.getTime()) > 7 * 86400000; // 7 days
        });
    
    if (staleQuotes.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '⏳',
            message: `${staleQuotes.length} devis envoyé(s) sans réponse depuis 7+ jours.`,
            actionSuggestion: `Dis "cherche devis" pour faire le suivi.`,
        });
    }

    // ─── 6. Supplier bookings pending confirmation ───
    const pendingBookings = bookingsSnap.docs
        .map(d => d.data())
        .filter((b: any) => b.status === 'PENDING' && b.date >= today);
    
    // ─── Stats ───
    const unpaidInvoices = invoicesSnap.docs.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status)).length;

    // ─── Build greeting ───
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    
    let greeting: string;
    if (alerts.length === 0) {
        greeting = `${timeGreeting} ${firstName} ! Tout est en ordre. Comment puis-je vous aider ?`;
    } else {
        const urgentCount = alerts.filter(a => a.type === 'urgent').length;
        const topAlert = alerts[0];
        if (urgentCount > 0) {
            greeting = `${timeGreeting} ${firstName}. Attention, ${urgentCount} alerte(s) urgente(s). ${topAlert.message}`;
        } else {
            greeting = `${timeGreeting} ${firstName}. ${topAlert.message} Comment puis-je vous aider ?`;
        }
    }

    return {
        greeting,
        alerts,
        stats: {
            tripsToday: upcomingTrips.filter(t => t.startDate === today).length,
            tasksDue: tasksDueToday.length,
            unpaidInvoices,
            newLeads: newLeads.length,
            supplierPending: pendingBookings.length,
        },
    };
}
