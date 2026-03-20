import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notifySupplierBooking } from '@/src/lib/whatsapp/api';
import { CRM_REGISTRY, matchesQuery, getDisplayValue } from '@/src/lib/crm-registry';

/**
 * POST /api/crm/voice-data
 * Fetches or writes CRM data for the Voice Agent based on tool name + vertical.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    const tenantId = (auth as any).tenantId || (auth as any).uid;

    try {
        const { tool, args = {}, vertical = 'travel' } = await request.json();
        const base = adminDb.collection('tenants').doc(tenantId);

        // ══════════════════════════════════════════
        //  SHARED TOOLS (both verticals)
        // ══════════════════════════════════════════

        // ─── create_task (shared) ───
        if (tool === 'create_task') {
            const docRef = await base.collection('tasks').add({
                title: args.title,
                dueDate: args.dueDate || null,
                priority: args.priority || 'medium',
                status: 'pending',
                source: 'voice-agent',
                createdAt: FieldValue.serverTimestamp(),
            });
            return NextResponse.json({
                success: true,
                message: `Tâche "${args.title}" créée${args.dueDate ? ' pour le ' + args.dueDate : ''}.`,
                action: {
                    type: 'task',
                    label: args.title,
                    id: docRef.id,
                    previewUrl: '/crm/planning',
                },
            });
        }

        // ─── schedule_meeting (shared) ───
        if (tool === 'schedule_meeting') {
            const docRef = await base.collection('tasks').add({
                title: args.title,
                dueDate: args.date || null,
                time: args.time || null,
                priority: 'medium',
                status: 'pending',
                type: 'meeting',
                clientName: args.clientName || '',
                source: 'voice-agent',
                createdAt: FieldValue.serverTimestamp(),
            });
            return NextResponse.json({
                success: true,
                message: `Le rendez-vous "${args.title}" a été planifié${args.date ? ' pour le ' + args.date : ''}${args.time ? ' à ' + args.time : ''}.`,
                action: {
                    type: 'task',
                    label: `Point visio/tel: ${args.title}`,
                    id: docRef.id,
                    previewUrl: '/crm/planning',
                },
            });
        }

        // ─── Audit Trail: log voice actions to Firestore ───
        if (tool === '_audit_log') {
            try {
                await base.collection('voiceAudit').add({
                    ...args,
                    userId: auth.uid,
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                // ─── GAMIFICATION: Auto-XP award on every tool call ───
                const toolName = args.tool || '';
                if (toolName && toolName !== '_audit_log') {
                    const XP_TABLE: Record<string, number> = {
                        create_client: 10, create_quote: 15, create_trip: 20, create_client_and_quote: 25,
                        create_task: 5, create_invoice: 15, create_lead: 10, create_email_draft: 10,
                        update_client: 5, update_lead_stage: 5, update_quote_status: 10,
                        mark_invoice_paid: 15, complete_task: 10, add_note_to_client: 5, add_note: 5,
                        add_prestation_to_trip: 10, assign_supplier: 15, record_payment: 15,
                        send_whatsapp: 10, send_email: 10,
                        close_deal: 50, prepare_trip: 30, generate_proposal: 40, follow_up_client: 20,
                        batch_notify: 25, morning_report: 15, compare_revenue: 10, top_clients: 10,
                        revenue_forecast: 15, kpi_dashboard: 10, profit_analysis: 15, narrate_dashboard: 20,
                        segment_clients: 15, seasonality: 10, client_value: 10, data_quality: 10,
                        detect_duplicates: 10, smart_reminder: 10, draft_email: 15, dictate_note: 5,
                        auto_tag: 20, track_expense: 5, set_workflow_rule: 20, bulk_update: 25,
                        navigate_to: 2, open_record: 2, search_crm: 3, search_catalog: 3,
                        suggest_prestation: 5, voice_history: 2, set_goal: 10, check_goal: 3,
                        get_upcoming_trips: 3, get_client_info: 3, get_today_pipeline: 3,
                        get_recent_emails: 3, get_quote_details: 3, get_reservations: 3,
                        get_payments_summary: 3, get_tasks: 3, get_unpaid_invoices: 3,
                        get_suppliers: 3, get_planning: 5, get_monthly_revenue: 5,
                        get_supplier_bookings: 3, get_collections: 3, get_activities: 3,
                    };
                    
                    const xpGain = XP_TABLE[toolName] || 1;
                    const today = new Date().toISOString().substring(0, 10);
                    
                    const gamRef = base.collection('userGamification').doc('profile');
                    const gamDoc = await gamRef.get();
                    const gam = gamDoc.exists ? gamDoc.data() as any : {
                        totalXp: 0, totalActions: 0, streak: 0, lastActionDate: '',
                        badges: [], dealsClosed: 0, clientsCreated: 0, emailsSent: 0,
                        whatsappSent: 0, tripsCreated: 0, invoicesPaid: 0,
                        megaActions: 0, analyticsUsed: 0, daysActive: 0,
                    };
                    
                    // Streak logic
                    const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
                    let newStreak = gam.streak || 0;
                    if (gam.lastActionDate === yesterday) newStreak++;
                    else if (gam.lastActionDate !== today) newStreak = 1;
                    // If same day, keep streak unchanged
                    
                    // Category counters
                    const megaTools = ['close_deal', 'prepare_trip', 'generate_proposal', 'batch_notify', 'bulk_update'];
                    const analyticsTools = ['morning_report', 'compare_revenue', 'top_clients', 'revenue_forecast', 'kpi_dashboard', 'profit_analysis', 'narrate_dashboard', 'segment_clients', 'seasonality', 'client_value', 'data_quality', 'detect_duplicates'];
                    
                    const updates: any = {
                        totalXp: (gam.totalXp || 0) + xpGain,
                        totalActions: (gam.totalActions || 0) + 1,
                        streak: newStreak,
                        lastActionDate: today,
                    };
                    
                    if (toolName === 'close_deal') updates.dealsClosed = (gam.dealsClosed || 0) + 1;
                    if (['create_client', 'create_client_and_quote'].includes(toolName)) updates.clientsCreated = (gam.clientsCreated || 0) + 1;
                    if (['send_email', 'draft_email', 'create_email_draft'].includes(toolName)) updates.emailsSent = (gam.emailsSent || 0) + 1;
                    if (toolName === 'send_whatsapp') updates.whatsappSent = (gam.whatsappSent || 0) + 1;
                    if (toolName === 'create_trip') updates.tripsCreated = (gam.tripsCreated || 0) + 1;
                    if (toolName === 'mark_invoice_paid') updates.invoicesPaid = (gam.invoicesPaid || 0) + 1;
                    if (megaTools.includes(toolName)) updates.megaActions = (gam.megaActions || 0) + 1;
                    if (analyticsTools.includes(toolName)) updates.analyticsUsed = (gam.analyticsUsed || 0) + 1;
                    
                    // Check new badge unlocks
                    const stats = { ...gam, ...updates };
                    const BADGES = [
                        { id: 'first_action', cond: (s: any) => s.totalActions >= 1 },
                        { id: 'ten_actions', cond: (s: any) => s.totalActions >= 10 },
                        { id: 'hundred_actions', cond: (s: any) => s.totalActions >= 100 },
                        { id: 'streak_3', cond: (s: any) => s.streak >= 3 },
                        { id: 'streak_7', cond: (s: any) => s.streak >= 7 },
                        { id: 'streak_30', cond: (s: any) => s.streak >= 30 },
                        { id: 'first_deal', cond: (s: any) => s.dealsClosed >= 1 },
                        { id: 'ten_deals', cond: (s: any) => s.dealsClosed >= 10 },
                        { id: 'communicator', cond: (s: any) => s.emailsSent >= 10 },
                        { id: 'power_user', cond: (s: any) => s.megaActions >= 5 },
                        { id: 'analyst', cond: (s: any) => s.analyticsUsed >= 10 },
                        { id: 'xp_500', cond: (s: any) => s.totalXp >= 500 },
                        { id: 'xp_2000', cond: (s: any) => s.totalXp >= 2000 },
                        { id: 'builder', cond: (s: any) => s.clientsCreated >= 10 },
                    ];
                    
                    const existingBadges = gam.badges || [];
                    const newBadges = BADGES.filter(b => !existingBadges.includes(b.id) && b.cond(stats));
                    if (newBadges.length > 0) {
                        updates.badges = [...existingBadges, ...newBadges.map(b => b.id)];
                    }
                    
                    if (gamDoc.exists) {
                        await gamRef.update(updates);
                    } else {
                        await gamRef.set({ ...gam, ...updates });
                    }
                }
            } catch { /* silent — audit should never break flow */ }
            return NextResponse.json({ success: true });
        }

        // ─── open_record (shared) ───
        if (tool === 'open_record') {
            const query = (args.query || '').toLowerCase();
            const limit = 20;
            const [contactsSnap, leadsSnap, tripsSnap, quotesSnap, invoicesSnap, catalogSnap, suppliersSnap] = await Promise.all([
                base.collection('contacts').limit(limit).get(),
                base.collection('leads').limit(limit).get(),
                base.collection(vertical === 'legal' ? 'dossiers' : 'trips').limit(limit).get(),
                base.collection('quotes').limit(limit).get(),
                base.collection('invoices').limit(limit).get(),
                base.collection('catalog').limit(limit).get(),
                base.collection('suppliers').limit(limit).get(),
            ]);

            // Search catalog first (prestations)
            const catMatch = catalogSnap.docs.find(d => {
                const c = d.data();
                return `${c.name || ''} ${c.description || ''} ${c.type || ''} ${c.location || ''}`.toLowerCase().includes(query);
            });
            if (catMatch) {
                return NextResponse.json({
                    success: true,
                    message: `Prestation "${catMatch.data().name}" trouvée. Ouverture...`,
                    action: { type: 'catalog', label: catMatch.data().name || 'Prestation', id: catMatch.id, previewUrl: `/crm/catalog/${catMatch.id}` }
                });
            }

            // Search suppliers
            const suppMatch = suppliersSnap.docs.find(d => {
                const s = d.data();
                return `${s.name || ''} ${s.type || ''} ${s.speciality || ''}`.toLowerCase().includes(query);
            });
            if (suppMatch) {
                return NextResponse.json({
                    success: true,
                    message: `Prestataire "${suppMatch.data().name}" trouvé. Ouverture...`,
                    action: { type: 'supplier', label: suppMatch.data().name || 'Prestataire', id: suppMatch.id, previewUrl: `/crm/suppliers?id=${suppMatch.id}` }
                });
            }

            const tMatch = tripsSnap.docs.find(d => {
                const t = d.data();
                return `${t.title || t.reference || t.destination || ''} ${t.clientName || t.client?.name || ''}`.toLowerCase().includes(query);
            });
            if (tMatch) {
                return NextResponse.json({
                    success: true,
                    message: vertical === 'legal' ? `Dossier trouvé. Ouverture en cours.` : `Voyage trouvé. Ouverture en cours.`,
                    action: { 
                        type: vertical === 'legal' ? 'dossier' : 'trip', 
                        label: tMatch.data().title || tMatch.data().destination || tMatch.data().reference || 'Trouvé', 
                        id: tMatch.id, 
                        previewUrl: vertical === 'legal' ? `/crm/dossiers?id=${tMatch.id}` : `/crm/trips?id=${tMatch.id}` 
                    }
                });
            }

            const cMatch = contactsSnap.docs.find(d => {
                const c = d.data();
                return `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''}`.toLowerCase().includes(query);
            });
            if (cMatch) {
                return NextResponse.json({
                    success: true,
                    message: "Fiche client trouvée. Ouverture...",
                    action: { type: 'client', label: `${cMatch.data().firstName || ''} ${cMatch.data().lastName || ''}`, id: cMatch.id, previewUrl: `/crm/clients/${cMatch.id}` }
                });
            }

            const qMatch = quotesSnap.docs.find(d => {
                const q = d.data();
                return `${q.quoteNumber || ''} ${q.clientName || ''} ${q.destination || ''}`.toLowerCase().includes(query);
            });
            if (qMatch) {
                return NextResponse.json({
                    success: true,
                    message: `Devis trouvé.`,
                    action: { type: 'quote', label: `${qMatch.data().quoteNumber || 'Devis'}`, id: qMatch.id, previewUrl: `/crm/quotes?id=${qMatch.id}` }
                });
            }

            const iMatch = invoicesSnap.docs.find(d => {
                const i = d.data();
                return `${i.invoiceNumber || ''} ${i.clientName || ''}`.toLowerCase().includes(query);
            });
            if (iMatch) {
                return NextResponse.json({
                    success: true,
                    message: `Facture trouvée.`,
                    action: { type: 'invoice', label: `${iMatch.data().invoiceNumber || 'Facture'}`, id: iMatch.id, previewUrl: `/crm/invoices?id=${iMatch.id}` }
                });
            }

            const lMatch = leadsSnap.docs.find(d => {
                const l = d.data();
                return `${l.clientName || ''} ${l.name || ''}`.toLowerCase().includes(query);
            });
            if (lMatch) {
                return NextResponse.json({
                    success: true,
                    message: "Lead trouvé.",
                    action: { type: 'lead', label: `${lMatch.data().clientName || lMatch.data().name}`, id: lMatch.id, previewUrl: `/crm/pipeline` }
                });
            }

            return NextResponse.json({ success: false, message: `Impossible de trouver un enregistrement correspondant à "${args.query}".` });
        }

        // ─── search_crm (shared) ───
        if (tool === 'search_crm') {
            const query = (args.query || '').toLowerCase();
            const [contactsSnap, leadsSnap, tripsSnap, catalogSnap, suppliersSnap, quotesSnap, invoicesSnap] = await Promise.all([
                base.collection('contacts').limit(30).get(),
                base.collection('leads').limit(20).get(),
                base.collection(vertical === 'legal' ? 'dossiers' : 'trips').limit(20).get(),
                base.collection('catalog').limit(20).get(),
                base.collection('suppliers').limit(20).get(),
                base.collection('quotes').limit(20).get(),
                base.collection('invoices').limit(20).get(),
            ]);
            const contacts = contactsSnap.docs
                .map(d => ({ ...d.data(), _type: 'contact' } as any))
                .filter((c: any) => `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((c: any) => `👤 ${c.firstName} ${c.lastName}${c.email ? ' (' + c.email + ')' : ''}`);
            const leads = leadsSnap.docs
                .map(d => ({ ...d.data(), _type: 'lead' } as any))
                .filter((l: any) => `${l.clientName || ''} ${l.name || ''} ${l.destination || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((l: any) => `📊 ${l.clientName || l.name} (${l.stage || 'lead'})`);
            const items = tripsSnap.docs
                .map(d => ({ ...d.data(), id: d.id } as any))
                .filter((t: any) => `${t.title || t.destination || ''} ${t.clientName || t.client?.name || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((t: any) => vertical === 'legal'
                    ? `📁 ${t.title || t.reference} — ${t.clientName || t.client?.name || ''}`
                    : `✈️ ${t.destination || ''} — ${t.clientName || ''}`);
            const catalogItems = catalogSnap.docs
                .map(d => ({ ...d.data(), id: d.id } as any))
                .filter((c: any) => `${c.name || ''} ${c.description || ''} ${c.type || ''} ${c.location || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((c: any) => `🏷️ ${c.name} (${c.type || ''}) — ${c.netCost || 0}€`);
            const suppliers = suppliersSnap.docs
                .map(d => ({ ...d.data() } as any))
                .filter((s: any) => `${s.name || ''} ${s.type || ''} ${s.speciality || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((s: any) => `🏢 ${s.name} (${s.type || s.speciality || ''})`);
            const quotes = quotesSnap.docs
                .map(d => ({ ...d.data() } as any))
                .filter((q: any) => `${q.quoteNumber || ''} ${q.clientName || ''} ${q.destination || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((q: any) => `📋 ${q.quoteNumber} — ${q.clientName} (${q.status})`);
            const invoices = invoicesSnap.docs
                .map(d => ({ ...d.data() } as any))
                .filter((i: any) => `${i.invoiceNumber || ''} ${i.clientName || ''}`.toLowerCase().includes(query))
                .slice(0, 3)
                .map((i: any) => `💳 ${i.invoiceNumber} — ${i.clientName} (${i.status})`);
            const results = [...contacts, ...leads, ...items, ...catalogItems, ...suppliers, ...quotes, ...invoices];
            return NextResponse.json({
                results,
                summary: results.length > 0
                    ? results.join(' | ')
                    : `Aucun résultat pour "${args.query}".`,
            });
        }

        // ─── get_tasks (shared) ───
        if (tool === 'get_tasks') {
            const snap = await base.collection('tasks')
                .orderBy('dueDate', 'asc')
                .limit(8)
                .get();
            const tasks = snap.docs
                .map(d => { const t = d.data(); return { id: d.id, title: t.title || 'Tâche', dueDate: t.dueDate || null, priority: t.priority || 'medium', status: t.status || 'pending' }; })
                .filter(t => ['pending', 'in_progress', 'todo'].includes(t.status));
            return NextResponse.json({ tasks, summary: tasks.length > 0 ? tasks.map(t => `${t.title}${t.dueDate ? ' (' + t.dueDate + ')' : ''}`).join(' | ') : 'Aucune tâche en cours.' });
        }

        // ──────────────────────────────────────────
        //  TRAVEL TOOLS
        // ──────────────────────────────────────────
        if (vertical === 'travel') {

            // ─── READ: get_reservations ───
            if (tool === 'get_reservations') {
                const snap = await base.collection('supplierBookings')
                    .orderBy('date', 'asc')
                    .limit(8)
                    .get();
                const bookings = snap.docs
                    .map(d => { const b = d.data(); return { id: d.id, prestationName: b.prestationName || 'Prestation', clientName: b.clientName || '', date: b.date || '', status: b.status || 'PROPOSED', supplierName: b.supplierName || '' }; })
                    .filter(b => ['PROPOSED', 'CONFIRMED', 'PENDING'].includes(b.status));
                return NextResponse.json({ bookings, summary: bookings.length > 0 ? bookings.map(b => `${b.prestationName} — ${b.clientName || 'N/A'} (${b.date})`).join(' | ') : 'Aucune réservation active.' });
            }

            // ─── READ: get_payments_summary ───
            if (tool === 'get_payments_summary') {
                const now = new Date();
                const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const invoicesSnap = await base.collection('invoices').limit(50).get();
                const monthInvoices = invoicesSnap.docs
                    .map(d => d.data())
                    .filter((inv: any) => (inv.issueDate || '') >= firstOfMonth);
                const totalBilled = monthInvoices.reduce((s: number, i: any) => s + (i.totalAmount || i.amount || 0), 0);
                const totalPaid = monthInvoices.reduce((s: number, i: any) => s + (i.amountPaid || 0), 0);
                const unpaid = monthInvoices.filter((i: any) => ['unpaid', 'overdue', 'pending', 'DRAFT'].includes(i.status || '')).length;
                return NextResponse.json({
                    summary: `Ce mois : ${totalBilled}€ facturés, ${totalPaid}€ encaissés, ${unpaid} impayée(s).`,
                    totalBilled, totalPaid, unpaidCount: unpaid,
                });
            }

            // ─── READ: get_upcoming_trips ───
            if (tool === 'get_upcoming_trips') {
                const snap = await base.collection('trips')
                    .orderBy('startDate', 'asc')
                    .limit(5)
                    .get();
                const trips = snap.docs
                    .map(d => { const t = d.data(); return { id: d.id, destination: t.destination || 'N/A', clientName: t.clientName || t.client?.name || 'Client inconnu', startDate: t.startDate || null, endDate: t.endDate || null, status: t.status || 'draft', budget: t.budget || null }; })
                    .filter(t => ['confirmed', 'pending', 'draft', 'active'].includes(t.status));
                return NextResponse.json({ trips });
            }

            // ─── READ: get_client_info ───
            if (tool === 'get_client_info') {
                const query = (args.query || '').toLowerCase();
                const snap = await base.collection('contacts').limit(50).get();
                const clients = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((c: any) =>
                        `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(query) ||
                        (c.email || '').toLowerCase().includes(query)
                    )
                    .slice(0, 3)
                    .map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), email: c.email, phone: c.phone, vipLevel: c.vipLevel || 'standard' }));
                return NextResponse.json({ clients });
            }

            // ─── READ: get_today_pipeline ───
            if (tool === 'get_today_pipeline') {
                const snap = await base.collection('leads')
                    .orderBy('updatedAt', 'desc')
                    .limit(5)
                    .get();
                const leads = snap.docs.map(d => { const l = d.data(); return { id: d.id, clientName: l.clientName || l.name || 'Prospect', stage: l.stage || 'lead', destination: l.destination || null, value: l.budget || l.value || null }; });
                return NextResponse.json({ leads });
            }

            // ─── READ: get_recent_emails ───
            if (tool === 'get_recent_emails') {
                const snap = await base.collection('emails')
                    .orderBy('receivedAt', 'desc')
                    .limit(5)
                    .get();
                const emails = snap.docs.map(d => { const e = d.data(); return { id: d.id, from: e.from || e.senderName || 'Inconnu', subject: e.subject || '(Sans objet)', snippet: (e.body || e.snippet || e.bodyText || '').substring(0, 120) }; });
                return NextResponse.json({ emails });
            }

            // ─── READ: get_quote_details ───
            if (tool === 'get_quote_details') {
                const query = (args.query || '').toLowerCase();
                const snap = await base.collection('quotes').limit(30).get();
                const quotes = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((q: any) =>
                        (q.clientName || '').toLowerCase().includes(query) ||
                        (q.id || '').toLowerCase().includes(query)
                    )
                    .slice(0, 3)
                    .map((q: any) => ({ id: q.id, clientName: q.clientName || 'Client', destination: q.destination || '', budget: q.budget || q.total || null, status: q.status || 'draft' }));
                return NextResponse.json({ quotes });
            }

            // ─── WRITE: create_quote ───
            if (tool === 'create_quote') {
                const budget = args.budget ? parseFloat(args.budget) : 0;
                const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
                const now = new Date();
                const validUntil = new Date(now.getTime() + 30 * 24 * 3600000);

                // Try to find the client by name to get their ID
                let clientId = '';
                if (args.clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes((args.clientName || '').toLowerCase());
                    });
                    if (match) clientId = match.id;
                }

                const netCostVal = budget > 0 ? Math.round(budget * 0.7) : 0;
                const items = [{
                    description: `Voyage ${args.destination || 'Sur mesure'}${args.startDate ? ' du ' + args.startDate : ''}${args.endDate ? ' au ' + args.endDate : ''}${args.notes ? ' — ' + args.notes : ''}`,
                    quantity: 1,
                    netCost: netCostVal,
                    unitPrice: budget,
                    total: budget,
                    taxRate: 20,
                }];

                const subtotal = budget;
                const taxTotal = Math.round(subtotal * 0.2);
                const totalAmount = subtotal + taxTotal;

                const docRef = await base.collection('quotes').add({
                    quoteNumber,
                    clientId,
                    clientName: args.clientName || 'Client',
                    destination: args.destination || '',
                    tripId: '',
                    issueDate: now.toISOString().split('T')[0],
                    validUntil: validUntil.toISOString().split('T')[0],
                    items,
                    subtotal,
                    taxTotal,
                    totalAmount,
                    currency: 'EUR',
                    startDate: args.startDate || null,
                    endDate: args.endDate || null,
                    notes: args.notes || '',
                    status: 'DRAFT',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Devis ${quoteNumber} créé pour ${args.clientName || 'Client'} — ${args.destination}${budget > 0 ? ', ' + totalAmount + '€ TTC' : ''}. Visible dans Devis.`,
                    action: {
                        type: 'quote',
                        label: `Devis ${args.clientName || 'Client'} — ${args.destination}`,
                        id: docRef.id,
                        previewUrl: `/crm/quotes`,
                    },
                });
            }

            // ─── WRITE: create_client_and_quote (combo) ───
            if (tool === 'create_client_and_quote') {
                const firstName = args.firstName || '';
                const lastName = args.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();

                // 1. Check if client already exists
                let clientId = '';
                const contactSnap = await base.collection('contacts').limit(50).get();
                const existingClient = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(fullName.toLowerCase());
                });

                let clientMessage = '';
                if (existingClient) {
                    clientId = existingClient.id;
                    clientMessage = `Client ${fullName} existant (trouvé).`;
                } else {
                    // Create the client
                    const clientRef = await base.collection('contacts').add({
                        firstName,
                        lastName,
                        email: (args.email || '').toLowerCase().trim(),
                        phone: args.phone || '',
                        vipLevel: 'Standard',
                        preferences: [],
                        communicationPreference: 'EMAIL',
                        notes: args.notes || '',
                        source: 'voice-agent',
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    clientId = clientRef.id;
                    clientMessage = `Fiche client ${fullName} créée.`;
                }

                // 2. Create the quote
                const budget = args.budget ? parseFloat(args.budget) : 0;
                const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
                const now = new Date();
                const validUntil = new Date(now.getTime() + 30 * 24 * 3600000);

                const pax = args.numberOfGuests || 1;
                const destination = args.destination || 'Sur mesure';

                const items = [{
                    description: `Voyage ${destination}${args.startDate ? ' du ' + args.startDate : ''}${args.endDate ? ' au ' + args.endDate : ''} — ${pax} personne(s)${args.notes ? ' — ' + args.notes : ''}`,
                    quantity: 1,
                    netCost: budget > 0 ? Math.round(budget * 0.7) : 0,
                    unitPrice: budget,
                    total: budget,
                    taxRate: 20,
                }];

                const subtotal = budget;
                const taxTotal = Math.round(subtotal * 0.2);
                const totalAmount = subtotal + taxTotal;

                const quoteRef = await base.collection('quotes').add({
                    quoteNumber,
                    clientId,
                    clientName: fullName,
                    destination,
                    tripId: '',
                    issueDate: now.toISOString().split('T')[0],
                    validUntil: validUntil.toISOString().split('T')[0],
                    items,
                    subtotal,
                    taxTotal,
                    totalAmount,
                    currency: 'EUR',
                    startDate: args.startDate || null,
                    endDate: args.endDate || null,
                    numberOfGuests: pax,
                    notes: args.notes || '',
                    status: 'DRAFT',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                const quoteMessage = `Devis ${quoteNumber} créé pour ${destination}${args.startDate ? ' du ' + args.startDate + (args.endDate ? ' au ' + args.endDate : '') : ''}, ${pax} personne(s)${totalAmount > 0 ? ', ' + totalAmount + '€ TTC' : ''}.`;

                return NextResponse.json({
                    success: true,
                    message: `${clientMessage} ${quoteMessage}`,
                    action: {
                        type: 'quote',
                        label: `${fullName} — ${destination}`,
                        id: quoteRef.id,
                        previewUrl: `/crm/quotes`,
                    },
                });
            }

            // ─── WRITE: create_trip ───
            if (tool === 'create_trip') {
                // Find client by name
                let clientId = '';
                const clientName = args.clientName || '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName.toLowerCase());
                    });
                    if (match) clientId = match.id;
                }

                const tripBudget = args.budget ? parseFloat(args.budget) : 0;
                const tripRef = await base.collection('trips').add({
                    title: `Voyage ${args.destination || 'Sur mesure'}`,
                    destination: args.destination || '',
                    clientId,
                    clientName: clientName,
                    startDate: args.startDate || '',
                    endDate: args.endDate || '',
                    travelers: args.numberOfGuests || 1,
                    status: 'DRAFT',
                    paymentStatus: 'UNPAID',
                    budget: tripBudget,
                    amount: tripBudget,
                    cost: 0,
                    margin: tripBudget,
                    currency: 'EUR',
                    color: '#bcdeea',
                    notes: args.notes || '',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });

                return NextResponse.json({
                    success: true,
                    message: `Voyage ${args.destination} créé pour ${clientName}, du ${args.startDate} au ${args.endDate}${args.numberOfGuests ? ', ' + args.numberOfGuests + ' personne(s)' : ''}. Visible dans Voyages.`,
                    action: {
                        type: 'trip',
                        label: `${clientName} — ${args.destination}`,
                        id: tripRef.id,
                        previewUrl: `/crm/trips?id=${tripRef.id}`,
                    },
                });
            }

            // ─── WRITE: create_email_draft ───
            if (tool === 'create_email_draft') {
                // Find client by name to get clientId
                let clientId = '';
                let clientFullName = args.toName || 'Destinataire';
                if (args.toName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes((args.toName || '').toLowerCase());
                    });
                    if (match) {
                        clientId = match.id;
                        const c = match.data();
                        clientFullName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
                    }
                }

                const docRef = await base.collection('messages').add({
                    clientId,
                    clientName: clientFullName,
                    channel: 'EMAIL',
                    direction: 'OUTBOUND',
                    recipientType: 'CLIENT',
                    content: `**${args.subject}**\n\n${args.body}`,
                    isRead: true,
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Brouillon d'email créé pour ${clientFullName} : "${args.subject}". Visible dans la Boîte de Réception.`,
                    action: {
                        type: 'email',
                        label: `Email → ${clientFullName} : "${args.subject}"`,
                        id: docRef.id,
                        previewUrl: `/crm/mails`,
                    },
                });
            }

            // ─── WRITE: create_client ───
            if (tool === 'create_client') {
                const docRef = await base.collection('contacts').add({
                    firstName: args.firstName || '',
                    lastName: args.lastName || '',
                    email: (args.email || '').toLowerCase().trim(),
                    phone: args.phone || '',
                    vipLevel: 'Standard',
                    preferences: [],
                    communicationPreference: 'EMAIL',
                    notes: args.notes || '',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                const fullName = `${args.firstName || ''} ${args.lastName || ''}`.trim();
                return NextResponse.json({
                    success: true,
                    message: `Fiche client créée pour ${fullName}${args.email ? ' (' + args.email + ')' : ''}. Visible dans Clients.`,
                    action: {
                        type: 'client',
                        label: fullName,
                        id: docRef.id,
                        previewUrl: `/crm/clients/${docRef.id}`,
                    },
                });
            }

            // ─── WRITE: update_client ───
            if (tool === 'update_client') {
                const query = (args.clientName || '').toLowerCase();
                const snap = await base.collection('contacts').limit(50).get();
                const match = snap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(query);
                });
                if (!match) return NextResponse.json({ success: false, message: `Client "${args.clientName}" introuvable.` });

                const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
                if (args.email) updates.email = args.email.toLowerCase().trim();
                if (args.phone) updates.phone = args.phone;
                if (args.notes) updates.notes = args.notes;
                if (args.vipLevel) updates.vipLevel = args.vipLevel;

                await base.collection('contacts').doc(match.id).update(updates);
                const fields = Object.keys(updates).filter(k => k !== 'updatedAt').join(', ');
                return NextResponse.json({
                    success: true,
                    message: `Client ${args.clientName} mis à jour (${fields}).`,
                    action: { type: 'client', label: `${args.clientName} — mis à jour`, id: match.id, previewUrl: `/crm/clients/${match.id}` },
                });
            }

            // ─── WRITE: delete_lead ───
            if (tool === 'delete_lead') {
                const query = (args.clientName || '').toLowerCase();
                const snap = await base.collection('leads').limit(30).get();
                const match = snap.docs.find(d => {
                    const l = d.data();
                    return `${l.clientName || ''} ${l.name || ''}`.toLowerCase().includes(query);
                });
                if (!match) return NextResponse.json({ success: false, message: `Lead "${args.clientName}" introuvable dans le pipeline.` });

                const leadData = match.data();
                await base.collection('leads').doc(match.id).delete();
                return NextResponse.json({
                    success: true,
                    message: `Lead "${leadData.clientName || leadData.name}" supprimé du pipeline.`,
                    action: { type: 'lead', label: `Lead supprimé — ${leadData.clientName || leadData.name}`, id: match.id, previewUrl: `/crm/pipeline` },
                });
            }

            // ─── WRITE: send_email ───
            if (tool === 'send_email') {
                const query = (args.recipientName || '').toLowerCase();
                const snap = await base.collection('contacts').limit(50).get();
                const match = snap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(query);
                });
                if (!match) return NextResponse.json({ success: false, message: `Contact "${args.recipientName}" introuvable.` });

                const contact = match.data();
                if (!contact.email) return NextResponse.json({ success: false, message: `${args.recipientName} n'a pas d'adresse email.` });

                // Send via internal Gmail API
                try {
                    const emailRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gmail/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('Authorization') || '' },
                        body: JSON.stringify({
                            to: contact.email,
                            subject: args.subject || `Message de votre conciergerie`,
                            message: args.body,
                            clientId: match.id,
                            clientName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                            recipientType: 'CLIENT',
                        }),
                    });
                    if (!emailRes.ok) throw new Error('Gmail API error');
                } catch (e) {
                    return NextResponse.json({ success: false, message: `Erreur d'envoi email. Vérifiez la configuration Gmail.` });
                }

                return NextResponse.json({
                    success: true,
                    message: `Email envoyé à ${contact.firstName} ${contact.lastName} (${contact.email}).`,
                    action: { type: 'email', label: `Email → ${contact.firstName} ${contact.lastName}`, id: match.id, previewUrl: `/crm/mails` },
                });
            }

            // ─── WRITE: create_invoice ───
            if (tool === 'create_invoice') {
                const amount = args.amount ? parseFloat(args.amount) : 0;
                const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
                const now = new Date();
                const dueDate = args.dueDate || new Date(now.getTime() + 30 * 24 * 3600000).toISOString().split('T')[0];

                // Find client by name
                let clientId = '';
                if (args.clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes((args.clientName || '').toLowerCase());
                    });
                    if (match) clientId = match.id;
                }

                const items = [{
                    description: args.description || 'Prestation',
                    quantity: 1,
                    unitPrice: amount,
                    total: amount,
                    taxRate: 20,
                }];

                const subtotal = amount;
                const taxTotal = Math.round(subtotal * 0.2);
                const totalAmount = subtotal + taxTotal;

                const docRef = await base.collection('invoices').add({
                    invoiceNumber,
                    type: 'CLIENT',
                    tripId: '',
                    clientId,
                    clientName: args.clientName || 'Client',
                    issueDate: now.toISOString().split('T')[0],
                    dueDate,
                    items,
                    subtotal,
                    taxTotal,
                    totalAmount,
                    amountPaid: 0,
                    currency: 'EUR',
                    status: 'DRAFT',
                    notes: args.description || '',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Facture ${invoiceNumber} de ${totalAmount}€ TTC créée pour ${args.clientName}. Visible dans Factures.`,
                    action: {
                        type: 'invoice',
                        label: `Facture ${args.clientName} — ${totalAmount}€`,
                        id: docRef.id,
                        previewUrl: `/crm/invoices`,
                    },
                });
            }

            // ─── WRITE: add_note_to_client ───
            if (tool === 'add_note_to_client') {
                const query = (args.clientName || '').toLowerCase();
                const snap = await base.collection('contacts').limit(30).get();
                const match = snap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(query);
                });
                if (match) {
                    const notesRef = base.collection('contacts').doc(match.id).collection('notes');
                    const noteRef = await notesRef.add({
                        content: args.note,
                        source: 'voice-agent',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    return NextResponse.json({
                        success: true,
                        message: `Note ajoutée sur la fiche de ${args.clientName}.`,
                        action: {
                            type: 'note',
                            label: `Note — ${args.clientName}`,
                            id: noteRef.id,
                            previewUrl: `/crm/clients/${match.id}`,
                        },
                    });
                }
                return NextResponse.json({ success: false, message: `Client "${args.clientName}" introuvable.` });
            }

            // ─── WRITE: update_lead_stage ───
            if (tool === 'update_lead_stage') {
                const query = (args.clientName || '').toLowerCase();
                const snap = await base.collection('leads').limit(30).get();
                const match = snap.docs.find(d => {
                    const l = d.data();
                    return (l.clientName || l.name || '').toLowerCase().includes(query);
                });
                if (match) {
                    await base.collection('leads').doc(match.id).update({
                        stage: args.stage,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    const stageLabels: Record<string, string> = { lead: 'Lead', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu' };
                    return NextResponse.json({
                        success: true,
                        message: `Lead ${args.clientName} mis à jour : stade "${stageLabels[args.stage] || args.stage}".`,
                        action: {
                            type: 'lead',
                            label: `${args.clientName} → ${stageLabels[args.stage] || args.stage}`,
                            id: match.id,
                            previewUrl: `/crm/pipeline`,
                        },
                    });
                }
                return NextResponse.json({ success: false, message: `Lead "${args.clientName}" introuvable dans le pipeline.` });
            }

            // ─── WRITE: assign_supplier ───
            if (tool === 'assign_supplier') {
                // 1. Find the supplier by name
                const supplierQuery = (args.supplierName || '').toLowerCase();
                const supplierSnap = await base.collection('suppliers').limit(50).get();
                const supplierMatch = supplierSnap.docs.find(d => {
                    const s = d.data();
                    return (s.name || '').toLowerCase().includes(supplierQuery)
                        || (s.contactName || '').toLowerCase().includes(supplierQuery);
                });

                if (!supplierMatch) {
                    return NextResponse.json({
                        success: false,
                        message: `Prestataire "${args.supplierName}" introuvable. Vérifiez le nom dans la section Prestataires.`,
                    });
                }

                const supplier = supplierMatch.data();
                const supplierId = supplierMatch.id;
                const supplierName = supplier.name || args.supplierName;
                const supplierPhone = supplier.phone || '';

                // 2. Find client if specified
                let clientId = '';
                let clientName = args.clientName || '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const clientMatch = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName.toLowerCase());
                    });
                    if (clientMatch) {
                        clientId = clientMatch.id;
                        const c = clientMatch.data();
                        clientName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
                    }
                }

                // 3. Create the supplier booking
                const bookingData = {
                    supplierId,
                    prestationId: '',
                    prestationName: args.prestationName || 'Prestation',
                    clientId,
                    clientName,
                    date: args.date || new Date().toISOString().split('T')[0],
                    startTime: args.startTime || null,
                    status: 'PROPOSED' as const,
                    prestationType: 'TRANSFER' as const,
                    rate: 0,
                    pickupLocation: args.pickupLocation || null,
                    numberOfGuests: args.numberOfGuests || null,
                    notes: args.notes || '',
                    createdAt: FieldValue.serverTimestamp(),
                };

                const bookingRef = await base.collection('supplierBookings').add(bookingData);

                // 4. Send WhatsApp notification to supplier
                let whatsappStatus = 'non envoyé';
                if (supplierPhone) {
                    try {
                        const waResult = await notifySupplierBooking({
                            supplierName,
                            supplierPhone,
                            prestationName: args.prestationName || 'Prestation',
                            clientName: clientName || 'Client',
                            date: args.date || new Date().toISOString().split('T')[0],
                            numberOfGuests: args.numberOfGuests,
                            pickupLocation: args.pickupLocation,
                            notes: args.notes,
                        });
                        whatsappStatus = waResult.success ? '✅ envoyé' : `❌ ${waResult.error}`;
                    } catch (waErr: any) {
                        whatsappStatus = `❌ ${waErr.message}`;
                    }
                } else {
                    whatsappStatus = '⚠️ pas de numéro de téléphone';
                }

                return NextResponse.json({
                    success: true,
                    message: `${supplierName} assigné à "${args.prestationName}" le ${args.date}${clientName ? ' pour ' + clientName : ''}. WhatsApp : ${whatsappStatus}.`,
                    action: {
                        type: 'supplier-booking',
                        label: `${supplierName} → ${args.prestationName}`,
                        id: bookingRef.id,
                        previewUrl: `/crm/planning`,
                    },
                });
            }

            // ─── P1: send_whatsapp ───
            if (tool === 'send_whatsapp') {
                const recipientName = args.recipientName || '';
                const message = args.message || '';
                const recipientType = args.recipientType || 'CLIENT';
                
                // Find phone number from contacts or suppliers
                let phone = '';
                let foundName = recipientName;
                
                if (recipientType === 'SUPPLIER') {
                    const suppSnap = await base.collection('suppliers').limit(50).get();
                    const match = suppSnap.docs.find(d => {
                        const s = d.data();
                        return (s.name || '').toLowerCase().includes(recipientName.toLowerCase());
                    });
                    if (match) {
                        phone = match.data().phone || match.data().whatsapp || '';
                        foundName = match.data().name || recipientName;
                    }
                } else {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(recipientName.toLowerCase());
                    });
                    if (match) {
                        phone = match.data().phone || '';
                        foundName = `${match.data().firstName} ${match.data().lastName}`.trim();
                    }
                }
                
                if (!phone) {
                    return NextResponse.json({ success: false, message: `Aucun numéro de téléphone trouvé pour ${recipientName}.` });
                }
                
                // Call WhatsApp send API internally
                const waRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/whatsapp/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('Authorization') || '' },
                    body: JSON.stringify({ to: phone, message, clientName: foundName, recipientType }),
                });
                
                const waOk = waRes.ok;
                return NextResponse.json({
                    success: waOk,
                    message: waOk ? `Message WhatsApp envoyé à ${foundName}.` : `Erreur d'envoi WhatsApp à ${foundName}.`,
                });
            }

            // ─── P1: mark_invoice_paid ───
            if (tool === 'mark_invoice_paid') {
                const clientName = (args.clientName || '').toLowerCase();
                const invoiceNumber = args.invoiceNumber || '';
                
                const invSnap = await base.collection('invoices').get();
                const match = invSnap.docs.find(d => {
                    const inv = d.data();
                    if (invoiceNumber && inv.invoiceNumber === invoiceNumber) return true;
                    return (inv.clientName || '').toLowerCase().includes(clientName) && inv.status !== 'PAID';
                });
                
                if (!match) {
                    return NextResponse.json({ success: false, message: `Aucune facture impayée trouvée pour ${args.clientName}.` });
                }
                
                const inv = match.data();
                await base.collection('invoices').doc(match.id).update({
                    status: 'PAID',
                    paidAt: FieldValue.serverTimestamp(),
                    amountPaid: inv.totalAmount || 0,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                // Create payment record
                await base.collection('payments').add({
                    invoiceId: match.id,
                    clientId: inv.clientId || '',
                    amount: inv.totalAmount || 0,
                    currency: inv.currency || 'EUR',
                    method: 'BANK_TRANSFER',
                    paymentDate: new Date().toISOString().split('T')[0],
                    status: 'COMPLETED',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `Facture ${inv.invoiceNumber || match.id} de ${inv.clientName} marquée payée (${inv.totalAmount}€).`,
                });
            }

            // ─── P1: get_suppliers ───
            if (tool === 'get_suppliers') {
                const query = (args.query || '').toLowerCase();
                const snap = await base.collection('suppliers').get();
                const suppliers = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((s: any) => {
                        if (!query) return true;
                        return `${s.name || ''} ${s.type || ''} ${s.speciality || ''}`.toLowerCase().includes(query);
                    })
                    .slice(0, 10)
                    .map((s: any) => ({
                        name: s.name || 'Sans nom',
                        type: s.type || '',
                        phone: s.phone || s.whatsapp || '',
                        email: s.email || '',
                        speciality: s.speciality || '',
                    }));
                
                if (!suppliers.length) {
                    return NextResponse.json({ success: true, message: 'Aucun prestataire trouvé.' });
                }
                const list = suppliers.map((s: any) => `${s.name} (${s.type || s.speciality}) — ${s.phone || s.email || 'pas de contact'}`).join(', ');
                return NextResponse.json({ success: true, message: `${suppliers.length} prestataire(s) : ${list}` });
            }

            // ─── P1: get_planning ───
            if (tool === 'get_planning') {
                const targetDate = args.date || new Date().toISOString().split('T')[0];
                
                // Get trips active on this date
                const tripsSnap = await base.collection('trips').get();
                const activeTrips = tripsSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((t: any) => t.startDate <= targetDate && t.endDate >= targetDate)
                    .slice(0, 5);
                
                // Get supplier bookings on this date
                const bookingsSnap = await base.collection('supplierBookings').get();
                const dayBookings = bookingsSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((b: any) => b.date === targetDate)
                    .slice(0, 10);
                
                const parts: string[] = [];
                if (activeTrips.length) {
                    parts.push(`${activeTrips.length} voyage(s) en cours : ${activeTrips.map((t: any) => `${t.clientName} — ${t.destination}`).join(', ')}`);
                }
                if (dayBookings.length) {
                    parts.push(`${dayBookings.length} prestation(s) : ${dayBookings.map((b: any) => `${b.prestationName || 'Prestation'} à ${b.startTime || '?'} (${b.status})`).join(', ')}`);
                }
                
                return NextResponse.json({
                    success: true,
                    message: parts.length ? `Planning du ${targetDate} : ${parts.join('. ')}` : `Rien de prévu le ${targetDate}.`,
                });
            }

            // ─── P1: complete_task ───
            if (tool === 'complete_task') {
                const taskTitle = (args.taskTitle || '').toLowerCase();
                const taskSnap = await base.collection('tasks').get();
                const match = taskSnap.docs.find(d => {
                    const t = d.data();
                    return (t.title || '').toLowerCase().includes(taskTitle) && t.status !== 'DONE';
                });
                
                if (!match) {
                    return NextResponse.json({ success: false, message: `Aucune tâche trouvée contenant "${args.taskTitle}".` });
                }
                
                await base.collection('tasks').doc(match.id).update({
                    status: 'DONE',
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `Tâche "${match.data().title}" marquée terminée ✓`,
                });
            }

            // ─── P2: add_prestation_to_trip ───
            if (tool === 'add_prestation_to_trip') {
                const clientName = (args.clientName || '').toLowerCase();
                const prestationName = (args.prestationName || '').toLowerCase();
                
                // Find the trip
                const tripsSnap = await base.collection('trips').get();
                const tripMatch = tripsSnap.docs.find(d => {
                    const t = d.data();
                    return `${t.clientName || ''} ${t.destination || ''}`.toLowerCase().includes(clientName);
                });
                if (!tripMatch) {
                    return NextResponse.json({ success: false, message: `Aucun voyage trouvé pour "${args.clientName}".` });
                }
                
                // Find the catalog item
                const catSnap = await base.collection('catalog').get();
                const catMatch = catSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.name || ''} ${c.description || ''}`.toLowerCase().includes(prestationName);
                });
                if (!catMatch) {
                    return NextResponse.json({ success: false, message: `Prestation "${args.prestationName}" non trouvée dans le catalogue.` });
                }
                
                const catData = catMatch.data();
                const segmentDate = args.date || tripMatch.data().startDate || new Date().toISOString().split('T')[0];
                
                // Add as a segment to the trip's day
                const daysColl = base.collection('trips').doc(tripMatch.id).collection('days');
                const daysSnap = await daysColl.where('date', '==', segmentDate).get();
                
                const newSegment = {
                    id: `seg-${Date.now()}`,
                    type: catData.type || 'ACTIVITY',
                    title: catData.name || args.prestationName,
                    timeSlot: args.startTime ? 'Morning' : 'Morning',
                    startTime: args.startTime || '10:00',
                    location: catData.location || '',
                    description: catData.description || '',
                    catalogItemId: catMatch.id,
                    netCost: catData.netCost || 0,
                    clientPrice: Math.round((catData.netCost || 0) * (1 + (catData.recommendedMarkup || 30) / 100)),
                    markupPercent: catData.recommendedMarkup || 30,
                    bookingStatus: 'PROPOSED',
                };
                
                if (daysSnap.empty) {
                    // Create the day
                    await daysColl.add({
                        date: segmentDate,
                        dayIndex: 0,
                        title: `Jour ${segmentDate}`,
                        segments: [newSegment],
                    });
                } else {
                    // Add to existing day
                    const dayDoc = daysSnap.docs[0];
                    const existingSegments = dayDoc.data().segments || [];
                    await daysColl.doc(dayDoc.id).update({
                        segments: [...existingSegments, newSegment],
                    });
                }
                
                return NextResponse.json({
                    success: true,
                    message: `"${catData.name}" ajouté au voyage de ${tripMatch.data().clientName} le ${segmentDate} (${newSegment.clientPrice}€).`,
                    action: { type: 'trip', label: tripMatch.data().clientName, id: tripMatch.id, previewUrl: `/crm/trips/${tripMatch.id}` },
                });
            }

            // ─── P2: create_lead ───
            if (tool === 'create_lead') {
                // Check if client exists first
                let clientId = '';
                const clientName = args.clientName || '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName.toLowerCase());
                    });
                    if (match) clientId = match.id;
                }
                
                const leadRef = await base.collection('leads').add({
                    clientId,
                    clientName,
                    destination: args.destination || '',
                    dates: args.dates || 'À définir',
                    budget: args.budget || 'À définir',
                    pax: args.pax || '1',
                    status: 'NEW',
                    source: 'Voice Agent',
                    score: 40,
                    notes: args.notes || '',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `Lead créé : ${clientName} → ${args.destination}${args.budget ? ', budget ' + args.budget : ''}.`,
                    action: { type: 'lead', label: clientName, id: leadRef.id, previewUrl: `/crm/pipeline` },
                });
            }

            // ─── P2: get_monthly_revenue ───
            if (tool === 'get_monthly_revenue') {
                const now = new Date();
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                const nextMonth = now.getMonth() === 11 
                    ? `${now.getFullYear() + 1}-01-01` 
                    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;
                
                const [quotesSnap, invoicesSnap, paymentsSnap] = await Promise.all([
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                ]);
                
                const monthQuotes = quotesSnap.docs.filter(d => {
                    const q = d.data();
                    return q.issueDate >= monthStart && q.issueDate < nextMonth;
                });
                const monthInvoices = invoicesSnap.docs.filter(d => {
                    const i = d.data();
                    return i.issueDate >= monthStart && i.issueDate < nextMonth;
                });
                const monthPayments = paymentsSnap.docs.filter(d => {
                    const p = d.data();
                    return p.paymentDate >= monthStart && p.paymentDate < nextMonth && p.status === 'COMPLETED';
                });
                
                const quotesTotal = monthQuotes.reduce((sum, d) => sum + (d.data().totalAmount || 0), 0);
                const invoicesTotal = monthInvoices.reduce((sum, d) => sum + (d.data().totalAmount || 0), 0);
                const paidTotal = monthPayments.reduce((sum, d) => sum + (d.data().amount || 0), 0);
                const unpaidInvoices = monthInvoices.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status)).length;
                
                return NextResponse.json({
                    success: true,
                    message: `Mois en cours : ${monthQuotes.length} devis (${quotesTotal}€), ${monthInvoices.length} factures (${invoicesTotal}€), ${paidTotal}€ encaissés. ${unpaidInvoices} facture(s) impayée(s).`,
                });
            }

            // ─── P2: get_supplier_bookings ───
            if (tool === 'get_supplier_bookings') {
                const targetDate = args.date || '';
                const supplierName = (args.supplierName || '').toLowerCase();
                
                const snap = await base.collection('supplierBookings').get();
                const bookings = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((b: any) => {
                        if (targetDate && b.date !== targetDate) return false;
                        if (supplierName) {
                            const sName = (b.supplierName || b.prestationName || '').toLowerCase();
                            if (!sName.includes(supplierName)) return false;
                        }
                        return true;
                    })
                    .slice(0, 10);
                
                if (!bookings.length) {
                    return NextResponse.json({ success: true, message: `Aucune réservation prestataire${targetDate ? ' le ' + targetDate : ''}${supplierName ? ' pour ' + args.supplierName : ''}.` });
                }
                
                const list = bookings.map((b: any) => 
                    `${b.prestationName || 'Prestation'} le ${b.date} à ${b.startTime || '?'} — ${b.clientName || ''} (${b.status})`
                ).join('. ');
                
                return NextResponse.json({ success: true, message: `${bookings.length} réservation(s) : ${list}` });
            }

            // ─── P3: update_client ───
            if (tool === 'update_client') {
                const clientName = (args.clientName || '').toLowerCase();
                const contactSnap = await base.collection('contacts').limit(50).get();
                const match = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!match) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
                const changes: string[] = [];
                if (args.email) { updates.email = args.email; changes.push(`email → ${args.email}`); }
                if (args.phone) { updates.phone = args.phone; changes.push(`tél → ${args.phone}`); }
                if (args.vipLevel) { updates.vipLevel = args.vipLevel; changes.push(`VIP → ${args.vipLevel}`); }
                
                if (changes.length === 0) {
                    return NextResponse.json({ success: false, message: 'Aucune modification spécifiée.' });
                }
                
                await base.collection('contacts').doc(match.id).update(updates);
                const fullName = `${match.data().firstName} ${match.data().lastName}`.trim();
                
                return NextResponse.json({
                    success: true,
                    message: `${fullName} mis à jour : ${changes.join(', ')}.`,
                    action: { type: 'client', label: fullName, id: match.id, previewUrl: `/crm/clients/${match.id}` },
                });
            }

            // ─── P3: update_quote_status ───
            if (tool === 'update_quote_status') {
                const clientName = (args.clientName || '').toLowerCase();
                const newStatus = args.status || 'SENT';
                
                const quotesSnap = await base.collection('quotes').get();
                const match = quotesSnap.docs.find(d => {
                    const q = d.data();
                    return (q.clientName || '').toLowerCase().includes(clientName);
                });
                
                if (!match) {
                    return NextResponse.json({ success: false, message: `Aucun devis trouvé pour "${args.clientName}".` });
                }
                
                await base.collection('quotes').doc(match.id).update({
                    status: newStatus,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `Devis ${match.data().quoteNumber} de ${match.data().clientName} → statut ${newStatus}.`,
                });
            }

            // ─── P3: get_collections ───
            if (tool === 'get_collections') {
                const snap = await base.collection('collections').get();
                if (snap.empty) {
                    return NextResponse.json({ success: true, message: 'Aucune collection trouvée.' });
                }
                const collections = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .slice(0, 10)
                    .map((c: any) => `${c.name || c.title || 'Collection'} (${c.items?.length || 0} items)`);
                
                return NextResponse.json({ success: true, message: `${collections.length} collection(s) : ${collections.join(', ')}.` });
            }

            // ─── FINAL: send_email ───
            if (tool === 'send_email') {
                const recipientName = (args.recipientName || '').toLowerCase();
                const subject = args.subject || '';
                const body = args.body || '';
                
                // Find email address from contacts
                const contactSnap = await base.collection('contacts').limit(50).get();
                const match = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(recipientName);
                });
                
                let recipientEmail = '';
                let fullName = args.recipientName;
                if (match) {
                    recipientEmail = match.data().email || '';
                    fullName = `${match.data().firstName} ${match.data().lastName}`.trim();
                }
                
                if (!recipientEmail) {
                    return NextResponse.json({ success: false, message: `Aucun email trouvé pour "${args.recipientName}".` });
                }
                
                // Create email draft via Gmail API
                const gmailRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gmail/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('Authorization') || '' },
                    body: JSON.stringify({ 
                        to: recipientEmail, 
                        subject, 
                        body,
                        isDraft: true 
                    }),
                });
                
                return NextResponse.json({
                    success: true,
                    message: gmailRes.ok 
                        ? `Brouillon email créé pour ${fullName} (${recipientEmail}) : "${subject}".`
                        : `Email préparé pour ${fullName} (${recipientEmail}). Vérifiez dans Gmail.`,
                    action: { type: 'email', label: `Email: ${subject}`, id: '', previewUrl: '/crm/mails' },
                });
            }

            // ─── FINAL: record_payment ───
            if (tool === 'record_payment') {
                const clientName = (args.clientName || '').toLowerCase();
                const amount = parseFloat(args.amount) || 0;
                const method = args.method || 'BANK_TRANSFER';
                
                // Find client
                let clientId = '';
                const contactSnap = await base.collection('contacts').limit(50).get();
                const match = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                if (match) clientId = match.id;
                
                // Find matching invoice  
                let invoiceId = '';
                const invSnap = await base.collection('invoices').get();
                const invMatch = invSnap.docs.find(d => {
                    const i = d.data();
                    return (i.clientName || '').toLowerCase().includes(clientName) && i.status !== 'PAID';
                });
                if (invMatch) invoiceId = invMatch.id;
                
                const payRef = await base.collection('payments').add({
                    clientId,
                    clientName: args.clientName,
                    invoiceId,
                    amount,
                    currency: 'EUR',
                    method,
                    paymentDate: new Date().toISOString().split('T')[0],
                    status: 'COMPLETED',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                // Also mark invoice paid if found
                if (invMatch) {
                    await base.collection('invoices').doc(invMatch.id).update({
                        status: 'PAID',
                        paidAt: FieldValue.serverTimestamp(),
                        amountPaid: amount,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                
                return NextResponse.json({
                    success: true,
                    message: `Paiement de ${amount}€ enregistré pour ${args.clientName} (${method}).${invMatch ? ' Facture marquée payée.' : ''}`,
                    action: { type: 'payment', label: `${amount}€`, id: payRef.id, previewUrl: '/crm/payments' },
                });
            }

            // ─── FINAL: get_activities ───
            if (tool === 'get_activities') {
                const snap = await base.collection('activities')
                    .orderBy('createdAt', 'desc')
                    .limit(8)
                    .get();
                
                if (snap.empty) {
                    return NextResponse.json({ success: true, message: 'Aucune activité récente.' });
                }
                
                const activities = snap.docs.map(d => {
                    const a = d.data();
                    return `${a.type || 'action'}: ${a.description || a.title || 'activité'} (${a.userName || ''})`;
                }).join('. ');
                
                return NextResponse.json({ success: true, message: `Activités récentes : ${activities}` });
            }

            // ═══════════════════════════════════════════
            //  MEGA-ACTIONS — Multi-step workflow chains
            // ═══════════════════════════════════════════

            // ─── MEGA: prepare_trip ───
            // One voice command → full trip preparation analysis + auto task creation
            if (tool === 'prepare_trip') {
                const clientName = (args.clientName || '').toLowerCase();
                
                // Find the trip
                const tripsSnap = await base.collection('trips').get();
                const tripMatch = tripsSnap.docs.find(d => {
                    const t = d.data();
                    return `${t.clientName || ''} ${t.destination || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!tripMatch) {
                    return NextResponse.json({ success: false, message: `Aucun voyage trouvé pour "${args.clientName}".` });
                }
                
                const trip = { id: tripMatch.id, ...tripMatch.data() } as any;
                const issues: string[] = [];
                const tasksCreated: string[] = [];
                
                // 1. Check supplier bookings
                const bookingsSnap = await base.collection('supplierBookings').get();
                const tripBookings = bookingsSnap.docs
                    .map(d => d.data())
                    .filter((b: any) => b.tripId === trip.id || (b.clientName || '').toLowerCase().includes(clientName));
                
                const unconfirmed = tripBookings.filter((b: any) => b.status === 'PENDING');
                if (unconfirmed.length > 0) {
                    issues.push(`${unconfirmed.length} prestation(s) non confirmée(s)`);
                    await base.collection('tasks').add({
                        title: `Confirmer ${unconfirmed.length} réservation(s) pour ${trip.clientName}`,
                        tripId: trip.id,
                        priority: 'high',
                        status: 'TODO',
                        dueDate: trip.startDate || new Date().toISOString().split('T')[0],
                        source: 'voice-agent-prepare',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    tasksCreated.push('Confirmer réservations');
                }
                
                // 2. Check if invoice exists
                const invoicesSnap = await base.collection('invoices').get();
                const hasInvoice = invoicesSnap.docs.some(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                if (!hasInvoice && trip.budget) {
                    issues.push('Aucune facture créée');
                    await base.collection('tasks').add({
                        title: `Créer facture pour ${trip.clientName} (${trip.destination})`,
                        tripId: trip.id,
                        priority: 'medium',
                        status: 'TODO',
                        dueDate: trip.startDate || new Date().toISOString().split('T')[0],
                        source: 'voice-agent-prepare',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    tasksCreated.push('Créer facture');
                }
                
                // 3. Check if itinerary has days
                const daysSnap = await base.collection('trips').doc(trip.id).collection('days').get();
                if (daysSnap.empty) {
                    issues.push('Aucun itinéraire');
                    await base.collection('tasks').add({
                        title: `Créer itinéraire pour ${trip.clientName} (${trip.destination})`,
                        tripId: trip.id,
                        priority: 'high',
                        status: 'TODO',
                        dueDate: new Date().toISOString().split('T')[0],
                        source: 'voice-agent-prepare',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    tasksCreated.push('Créer itinéraire');
                }
                
                // 4. Always create a "final check" task
                await base.collection('tasks').add({
                    title: `Vérification finale voyage ${trip.clientName} — ${trip.destination}`,
                    tripId: trip.id,
                    priority: 'high',
                    status: 'TODO',
                    dueDate: trip.startDate || new Date().toISOString().split('T')[0],
                    source: 'voice-agent-prepare',
                    createdAt: FieldValue.serverTimestamp(),
                });
                tasksCreated.push('Vérification finale');
                
                // 5. Check payment status
                const paymentsSnap = await base.collection('payments').get();
                const paidAmount = paymentsSnap.docs
                    .filter(d => (d.data().clientName || '').toLowerCase().includes(clientName))
                    .reduce((s, d) => s + (d.data().amount || 0), 0);
                
                const budget = trip.budget || trip.amount || 0;
                const paymentStatus = paidAmount >= budget ? '✅ Paiement complet' : paidAmount > 0 ? `⚠️ Acompte ${paidAmount}€/${budget}€` : '❌ Aucun paiement';
                
                const readyMessage = issues.length === 0 
                    ? `Voyage de ${trip.clientName} (${trip.destination}) prêt ! ${paymentStatus}. ${tasksCreated.length} tâche(s) de vérification créée(s).`
                    : `Voyage de ${trip.clientName} (${trip.destination}) — ${issues.length} point(s) à régler : ${issues.join(', ')}. ${paymentStatus}. ${tasksCreated.length} tâche(s) créée(s) automatiquement : ${tasksCreated.join(', ')}.`;
                
                return NextResponse.json({
                    success: true,
                    message: readyMessage,
                    action: { type: 'trip', label: trip.clientName, id: trip.id, previewUrl: `/crm/trips/${trip.id}` },
                });
            }

            // ─── MEGA: morning_report ───
            // Full CRM health check with proactive alerts
            if (tool === 'morning_report') {
                const { generateSmartBriefing } = await import('@/src/lib/smart-briefing');
                const briefing = await generateSmartBriefing(tenantId, 'Laurent');
                
                const parts: string[] = [];
                
                // Stats
                const s = briefing.stats;
                parts.push(`📊 Résumé : ${s.tripsToday} voyage(s) aujourd'hui, ${s.tasksDue} tâche(s) à faire, ${s.unpaidInvoices} facture(s) impayée(s), ${s.newLeads} nouveau(x) lead(s), ${s.supplierPending} réservation(s) en attente.`);
                
                // All alerts
                for (const alert of briefing.alerts) {
                    parts.push(`${alert.icon} ${alert.message}`);
                }
                
                if (briefing.alerts.length === 0) {
                    parts.push('✅ Tout est en ordre, aucune alerte.');
                }
                
                return NextResponse.json({
                    success: true,
                    message: parts.join(' '),
                });
            }

            // ─── MEGA: close_deal ───
            // One command: find lead/quote → create trip → create invoice → confirm
            if (tool === 'close_deal') {
                const clientName = (args.clientName || '').toLowerCase();
                const destination = args.destination || '';
                const amount = parseFloat(args.amount) || 0;
                
                // Find client
                const contactSnap = await base.collection('contacts').limit(50).get();
                const clientMatch = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                const fullClientName = clientMatch 
                    ? `${clientMatch.data().firstName} ${clientMatch.data().lastName}`.trim()
                    : args.clientName;
                
                // Find existing quote
                const quotesSnap = await base.collection('quotes').get();
                const quoteMatch = quotesSnap.docs.find(d => 
                    (d.data().clientName || '').toLowerCase().includes(clientName) && d.data().status !== 'REJECTED'
                );
                
                // Mark quote as ACCEPTED if found
                if (quoteMatch) {
                    await base.collection('quotes').doc(quoteMatch.id).update({
                        status: 'ACCEPTED',
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                }
                
                const finalAmount = amount || quoteMatch?.data()?.totalAmount || 0;
                const finalDestination = destination || quoteMatch?.data()?.destination || 'À définir';
                
                // Create trip
                const today = new Date().toISOString().split('T')[0];
                const tripRef = await base.collection('trips').add({
                    clientId: clientMatch?.id || '',
                    clientName: fullClientName,
                    destination: finalDestination,
                    startDate: today,
                    endDate: today,
                    status: 'CONFIRMED',
                    budget: finalAmount,
                    source: 'voice-agent-close-deal',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                // Create invoice
                let invoiceMsg = '';
                if (finalAmount > 0) {
                    await base.collection('invoices').add({
                        clientId: clientMatch?.id || '',
                        clientName: fullClientName,
                        tripId: tripRef.id,
                        totalAmount: finalAmount,
                        status: 'DRAFT',
                        createdAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    invoiceMsg = ` Facture de ${finalAmount}€ créée.`;
                }
                
                // Create confirmation task
                await base.collection('tasks').add({
                    title: `Confirmer deal: ${fullClientName} — ${finalDestination}`,
                    tripId: tripRef.id,
                    priority: 'high',
                    status: 'TODO',
                    dueDate: today,
                    source: 'voice-agent-close-deal',
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                // Mark lead as WON
                const leadsSnap = await base.collection('leads').get();
                const leadMatch = leadsSnap.docs.find(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                if (leadMatch) {
                    await base.collection('leads').doc(leadMatch.id).update({ status: 'WON', updatedAt: FieldValue.serverTimestamp() });
                }
                
                return NextResponse.json({
                    success: true,
                    message: `Deal clos pour ${fullClientName} (${finalDestination}) ! Voyage créé.${invoiceMsg}${quoteMatch ? ' Devis marqué accepté.' : ''}${leadMatch ? ' Lead marqué gagné.' : ''} Tâche de confirmation ajoutée.`,
                    action: { type: 'trip', label: fullClientName, id: tripRef.id, previewUrl: `/crm/trips/${tripRef.id}` },
                });
            }

            // ─── MEGA: follow_up_client ───
            // Analyzes a client's full activity and suggests intelligent follow-ups
            if (tool === 'follow_up_client') {
                const clientName = (args.clientName || '').toLowerCase();
                
                // Find client
                const contactSnap = await base.collection('contacts').limit(50).get();
                const clientMatch = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!clientMatch) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const client = { id: clientMatch.id, ...clientMatch.data() } as any;
                const fullName = `${client.firstName} ${client.lastName}`.trim();
                const insights: string[] = [];
                const suggestions: string[] = [];
                
                // Fetch all client-related data
                const [tripsSnap, quotesSnap, invoicesSnap, paymentsSnap, bookingsSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                // Trips analysis
                const clientTrips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                if (clientTrips.length === 0) {
                    insights.push('Aucun voyage');
                    suggestions.push('Créer un premier voyage');
                } else {
                    insights.push(`${clientTrips.length} voyage(s)`);
                    const lastTrip = clientTrips[clientTrips.length - 1].data();
                    if (lastTrip.status === 'COMPLETED') suggestions.push('Proposer un nouveau voyage');
                }
                
                // Quotes analysis
                const clientQuotes = quotesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const pendingQuotes = clientQuotes.filter(d => d.data().status === 'SENT');
                if (pendingQuotes.length > 0) {
                    insights.push(`${pendingQuotes.length} devis en attente`);
                    suggestions.push('Relancer pour les devis');
                }
                
                // Invoices analysis
                const clientInvoices = invoicesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const unpaidInvoices = clientInvoices.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status));
                if (unpaidInvoices.length > 0) {
                    const totalUnpaid = unpaidInvoices.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                    insights.push(`${totalUnpaid}€ impayé(s)`);
                    suggestions.push('Envoyer rappel de paiement');
                }
                
                // Payments analysis
                const clientPayments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const totalPaid = clientPayments.reduce((s, d) => s + (d.data().amount || 0), 0);
                if (totalPaid > 0) insights.push(`${totalPaid}€ payé au total`);
                
                // VIP level
                if (client.vipLevel) insights.push(`Niveau: ${client.vipLevel}`);
                
                // Build response
                const report = `Analyse ${fullName}: ${insights.join(', ')}. Suggestions: ${suggestions.length > 0 ? suggestions.join(', ') : 'Client à jour, aucune action nécessaire'}.`;
                
                return NextResponse.json({
                    success: true,
                    message: report,
                    action: { type: 'contact', label: fullName, id: clientMatch.id, previewUrl: `/crm/clients/${clientMatch.id}` },
                });
            }

            // ─── ANALYTICS: compare_revenue ───
            if (tool === 'compare_revenue') {
                const MONTH_NAMES: Record<string, string> = { janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06', juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12' };
                
                const parseMonth = (raw: string): string => {
                    const lower = raw.toLowerCase().trim();
                    if (/\d{4}-\d{2}/.test(lower)) return lower;
                    const year = new Date().getFullYear();
                    for (const [name, num] of Object.entries(MONTH_NAMES)) {
                        if (lower.includes(name)) return `${year}-${num}`;
                    }
                    return `${year}-${lower.padStart(2, '0')}`;
                };
                
                const m1 = parseMonth(args.month1 || '');
                const m2 = args.month2 ? parseMonth(args.month2) : (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 1);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                })();
                
                const invoicesSnap = await base.collection('invoices').get();
                
                const revenueFor = (month: string) => invoicesSnap.docs
                    .filter(d => {
                        const inv = d.data();
                        const created = inv.createdAt?.toDate?.()?.toISOString?.()?.substring(0, 7) || '';
                        return created === month;
                    })
                    .reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                
                const rev1 = revenueFor(m1);
                const rev2 = revenueFor(m2);
                const diff = rev1 - rev2;
                const pct = rev2 > 0 ? Math.round((diff / rev2) * 100) : 0;
                
                return NextResponse.json({
                    success: true,
                    message: `CA ${m1}: ${rev1}€. CA ${m2}: ${rev2}€. ${diff >= 0 ? '📈' : '📉'} ${diff >= 0 ? '+' : ''}${diff}€ (${pct >= 0 ? '+' : ''}${pct}%).`,
                });
            }

            // ─── ANALYTICS: top_clients ───
            if (tool === 'top_clients') {
                const limit = parseInt(args.limit) || 5;
                const paymentsSnap = await base.collection('payments').get();
                
                const clientTotals = new Map<string, number>();
                paymentsSnap.docs.forEach(d => {
                    const name = d.data().clientName || 'Inconnu';
                    clientTotals.set(name, (clientTotals.get(name) || 0) + (d.data().amount || 0));
                });
                
                if (clientTotals.size === 0) {
                    const invoicesSnap = await base.collection('invoices').get();
                    invoicesSnap.docs.forEach(d => {
                        const name = d.data().clientName || 'Inconnu';
                        clientTotals.set(name, (clientTotals.get(name) || 0) + (d.data().totalAmount || 0));
                    });
                }
                
                const sorted = [...clientTotals.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, limit);
                
                if (sorted.length === 0) {
                    return NextResponse.json({ success: true, message: 'Aucun client avec des paiements.' });
                }
                
                const ranking = sorted.map(([name, total], i) => `${i + 1}. ${name}: ${total}€`).join('. ');
                return NextResponse.json({
                    success: true,
                    message: `🏆 Top ${sorted.length} clients: ${ranking}.`,
                });
            }

            // ─── WRITE: add_note ───
            if (tool === 'add_note') {
                const clientName = (args.clientName || '').toLowerCase();
                const note = args.note || '';
                
                const contactSnap = await base.collection('contacts').limit(50).get();
                const match = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!match) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const existing = match.data().notes || '';
                const timestamp = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                const newNotes = existing ? `${existing}\n[${timestamp}] 🎙️ ${note}` : `[${timestamp}] 🎙️ ${note}`;
                
                await base.collection('contacts').doc(match.id).update({
                    notes: newNotes,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                const fullName = `${match.data().firstName} ${match.data().lastName}`.trim();
                return NextResponse.json({
                    success: true,
                    message: `Note ajoutée à ${fullName}: "${note}".`,
                    action: { type: 'contact', label: fullName, id: match.id, previewUrl: `/crm/clients/${match.id}` },
                });
            }

            // ─── SMART: suggest_prestation ───
            if (tool === 'suggest_prestation') {
                const destination = (args.destination || '').toLowerCase();
                const budget = parseFloat(args.budget) || Infinity;
                
                const catalogSnap = await base.collection('catalog').get();
                let matches = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                
                if (destination) {
                    matches = matches.filter((p: any) =>
                        (p.location || '').toLowerCase().includes(destination) ||
                        (p.name || '').toLowerCase().includes(destination) ||
                        (p.description || '').toLowerCase().includes(destination)
                    );
                }
                
                if (budget < Infinity) {
                    matches = matches.filter((p: any) => (p.sellPrice || p.netCost || 0) <= budget);
                }
                
                matches.sort((a: any, b: any) => (b.sellPrice || 0) - (a.sellPrice || 0));
                const top = matches.slice(0, 5);
                
                if (top.length === 0) {
                    return NextResponse.json({ success: true, message: `Aucune prestation trouvée${destination ? ` pour "${destination}"` : ''}.` });
                }
                
                const list = top.map((p: any) => `${p.name} (${p.sellPrice || p.netCost || '?'}€)`).join(', ');
                return NextResponse.json({
                    success: true,
                    message: `💎 ${top.length} suggestion(s)${destination ? ` pour ${destination}` : ''}: ${list}.`,
                });
            }

            // ─── BATCH: batch_notify ───
            if (tool === 'batch_notify') {
                const message = args.message || 'Rappel: votre voyage approche !';
                const today = new Date().toISOString().split('T')[0];
                const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
                
                const tripsSnap = await base.collection('trips').get();
                const upcomingTrips = tripsSnap.docs
                    .map(d => d.data())
                    .filter((t: any) => t.startDate >= today && t.startDate <= nextWeek && t.status !== 'CANCELLED');
                
                if (upcomingTrips.length === 0) {
                    return NextResponse.json({ success: true, message: 'Aucun voyage cette semaine — personne à notifier.' });
                }
                
                const notified: string[] = [];
                for (const trip of upcomingTrips) {
                    const cName = (trip as any).clientName || 'Client';
                    if (notified.includes(cName)) continue;
                    
                    await base.collection('tasks').add({
                        title: `Envoyer notification à ${cName}: ${message}`,
                        priority: 'medium',
                        status: 'TODO',
                        dueDate: today,
                        source: 'voice-agent-batch',
                        relatedClient: cName,
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    notified.push(cName);
                }
                
                return NextResponse.json({
                    success: true,
                    message: `📢 ${notified.length} notification(s) créée(s) pour: ${notified.join(', ')}. Message: "${message}".`,
                    action: { type: 'navigate', label: 'Tâches', id: '', previewUrl: '/crm/tasks' },
                });
            }

            // ─── ADVANCED: revenue_forecast ───
            if (tool === 'revenue_forecast') {
                const monthsToForecast = parseInt(args.months) || 3;
                const invoicesSnap = await base.collection('invoices').get();
                
                // Compute monthly revenue for last 6 months
                const now = new Date();
                const monthlyRevenue: { month: string; total: number }[] = [];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const total = invoicesSnap.docs
                        .filter(doc => {
                            const created = doc.data().createdAt?.toDate?.()?.toISOString?.()?.substring(0, 7) || '';
                            return created === key;
                        })
                        .reduce((s, doc) => s + (doc.data().totalAmount || 0), 0);
                    monthlyRevenue.push({ month: key, total });
                }
                
                // Calculate trend (simple linear regression on last 6 months)
                const values = monthlyRevenue.map(m => m.total);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const nonZeroValues = values.filter(v => v > 0);
                const avgNonZero = nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;
                
                // Growth rate from first half vs second half
                const firstHalf = values.slice(0, 3).reduce((a, b) => a + b, 0);
                const secondHalf = values.slice(3).reduce((a, b) => a + b, 0);
                const growthRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
                
                // Forecast
                const forecasts: string[] = [];
                for (let i = 1; i <= monthsToForecast; i++) {
                    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const key = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
                    const predicted = Math.round(avgNonZero * (1 + growthRate * (i / 6)));
                    forecasts.push(`${key}: ~${predicted}€`);
                }
                
                // Pipeline value (pending quotes)
                const quotesSnap = await base.collection('quotes').get();
                const pipelineValue = quotesSnap.docs
                    .filter(d => ['DRAFT', 'SENT'].includes(d.data().status))
                    .reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                
                const history = monthlyRevenue.map(m => `${m.month}: ${m.total}€`).join(', ');
                
                return NextResponse.json({
                    success: true,
                    message: `📈 Historique 6 mois: ${history}. Moyenne: ${Math.round(avg)}€/mois. Prévisions: ${forecasts.join(', ')}. Pipeline en cours: ${pipelineValue}€ de devis en attente.`,
                });
            }

            // ─── ADVANCED: detect_duplicates ───
            if (tool === 'detect_duplicates') {
                const contactsSnap = await base.collection('contacts').limit(200).get();
                const contacts = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                
                const duplicates: string[] = [];
                const seen = new Set<string>();
                
                for (let i = 0; i < contacts.length; i++) {
                    for (let j = i + 1; j < contacts.length; j++) {
                        const a = contacts[i];
                        const b = contacts[j];
                        const pairKey = `${a.id}-${b.id}`;
                        if (seen.has(pairKey)) continue;
                        
                        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase().trim();
                        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase().trim();
                        
                        // Check duplicates: same name, same email, or same phone
                        const sameEmail = a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
                        const samePhone = a.phone && b.phone && a.phone.replace(/\s/g, '') === b.phone.replace(/\s/g, '');
                        const sameName = nameA && nameB && nameA === nameB;
                        const similarName = nameA && nameB && (nameA.includes(nameB) || nameB.includes(nameA)) && nameA.length > 3;
                        
                        if (sameEmail || samePhone || sameName || similarName) {
                            const reason = sameEmail ? 'même email' : samePhone ? 'même téléphone' : 'nom similaire';
                            const displayA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
                            const displayB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
                            duplicates.push(`${displayA} ↔ ${displayB} (${reason})`);
                            seen.add(pairKey);
                        }
                    }
                }
                
                if (duplicates.length === 0) {
                    return NextResponse.json({ success: true, message: `✅ Aucun doublon détecté parmi ${contacts.length} contacts.` });
                }
                
                return NextResponse.json({
                    success: true,
                    message: `⚠️ ${duplicates.length} doublon(s) potentiel(s): ${duplicates.slice(0, 5).join('. ')}${duplicates.length > 5 ? ` (+${duplicates.length - 5} autres)` : ''}.`,
                    action: { type: 'navigate', label: 'Contacts', id: '', previewUrl: '/crm/clients' },
                });
            }

            // ─── ADVANCED: generate_proposal ───
            if (tool === 'generate_proposal') {
                const clientName = (args.clientName || '').toLowerCase();
                const destination = args.destination || 'À définir';
                const budget = parseFloat(args.budget) || 0;
                const guests = parseInt(args.numberOfGuests) || 2;
                
                // Find client
                const contactSnap = await base.collection('contacts').limit(50).get();
                const clientMatch = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                const fullClientName = clientMatch
                    ? `${clientMatch.data().firstName} ${clientMatch.data().lastName}`.trim()
                    : args.clientName;
                
                // Find matching prestations from catalog
                const catalogSnap = await base.collection('catalog').get();
                const matching = catalogSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter(p =>
                        (p.location || '').toLowerCase().includes(destination.toLowerCase()) ||
                        (p.name || '').toLowerCase().includes(destination.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(destination.toLowerCase())
                    )
                    .slice(0, 5);
                
                const estimatedTotal = matching.reduce((s, p) => s + (p.sellPrice || p.netCost || 0), 0);
                
                // Create trip
                const today = new Date().toISOString().split('T')[0];
                const tripRef = await base.collection('trips').add({
                    clientId: clientMatch?.id || '',
                    clientName: fullClientName,
                    destination,
                    startDate: today,
                    endDate: today,
                    travelers: guests,
                    status: 'DRAFT',
                    budget: budget || estimatedTotal,
                    source: 'voice-agent-proposal',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                // Create quote
                const quoteRef = await base.collection('quotes').add({
                    clientId: clientMatch?.id || '',
                    clientName: fullClientName,
                    destination,
                    tripId: tripRef.id,
                    totalAmount: budget || estimatedTotal,
                    numberOfGuests: guests,
                    status: 'DRAFT',
                    prestations: matching.map(p => ({ name: p.name, price: p.sellPrice || p.netCost || 0 })),
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                // Create task to finalize
                await base.collection('tasks').add({
                    title: `Finaliser proposition ${fullClientName} — ${destination}`,
                    tripId: tripRef.id,
                    priority: 'high',
                    status: 'TODO',
                    dueDate: today,
                    source: 'voice-agent-proposal',
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                const prestaList = matching.length > 0
                    ? `Prestations suggérées: ${matching.map(p => `${p.name} (${p.sellPrice || p.netCost}€)`).join(', ')}.`
                    : 'Aucune prestation trouvée pour cette destination dans le catalogue.';
                
                return NextResponse.json({
                    success: true,
                    message: `Proposition créée pour ${fullClientName} — ${destination} (${guests} personnes). ${prestaList} Total estimé: ${budget || estimatedTotal}€. Voyage + devis créés en brouillon.`,
                    action: { type: 'trip', label: fullClientName, id: tripRef.id, previewUrl: `/crm/trips/${tripRef.id}` },
                });
            }

            // ─── AI: draft_email ───
            if (tool === 'draft_email') {
                const clientName = (args.clientName || '').toLowerCase();
                const purpose = args.purpose || 'suivi';
                const customContent = args.customContent || '';
                
                // Fetch full client context
                const contactSnap = await base.collection('contacts').limit(50).get();
                const clientMatch = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!clientMatch) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const client = clientMatch.data() as any;
                const fullName = `${client.firstName} ${client.lastName}`.trim();
                
                // Gather CRM context
                const [tripsSnap, quotesSnap, invoicesSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                ]);
                
                const clientTrips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientQuotes = quotesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientInvoices = invoicesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const unpaidInvoices = clientInvoices.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status));
                
                // Build context for email
                const lastTrip = clientTrips.length > 0 ? clientTrips[clientTrips.length - 1].data() : null;
                const pendingQuotes = clientQuotes.filter(d => d.data().status === 'SENT');
                
                // Purpose-specific templates
                const templates: Record<string, { subject: string; body: string }> = {
                    relance: {
                        subject: `Relance — ${pendingQuotes.length > 0 ? `Votre devis ${(lastTrip as any)?.destination || ''}` : 'Votre projet de voyage'}`,
                        body: `Bonjour ${client.firstName},\n\nJe me permets de revenir vers vous concernant ${pendingQuotes.length > 0 ? `le devis que nous vous avons envoyé pour ${(lastTrip as any)?.destination || 'votre voyage'}` : 'votre projet de voyage'}.\n\n${customContent || 'N\'hésitez pas à me faire part de vos questions ou ajustements souhaités.'}\n\nCordialement,\nLuna Conciergerie`,
                    },
                    confirmation: {
                        subject: `Confirmation — Voyage ${(lastTrip as any)?.destination || ''}`,
                        body: `Bonjour ${client.firstName},\n\nJe vous confirme la réservation de votre voyage${(lastTrip as any)?.destination ? ` à ${(lastTrip as any).destination}` : ''}.\n\n${customContent || 'Tous les détails vous seront envoyés prochainement.'}\n\nCordialement,\nLuna Conciergerie`,
                    },
                    remerciement: {
                        subject: `Merci ${client.firstName} !`,
                        body: `Bonjour ${client.firstName},\n\nJe tenais à vous remercier pour votre confiance${clientTrips.length > 1 ? ` et votre fidélité (${clientTrips.length} voyages ensemble !)` : ''}.\n\n${customContent || 'Au plaisir de préparer votre prochaine escapade.'}\n\nChaleureusement,\nLuna Conciergerie`,
                    },
                    proposition: {
                        subject: `Proposition de voyage personnalisée`,
                        body: `Bonjour ${client.firstName},\n\nSuite à notre échange, je vous propose une sélection de voyages qui pourraient vous correspondre.\n\n${customContent || 'Je reste disponible pour en discuter.'}\n\nCordialement,\nLuna Conciergerie`,
                    },
                    suivi: {
                        subject: `Suivi — ${(lastTrip as any)?.destination || 'Votre voyage'}`,
                        body: `Bonjour ${client.firstName},\n\nJe reviens vers vous pour faire le point sur ${(lastTrip as any)?.destination ? `votre voyage à ${(lastTrip as any).destination}` : 'votre projet'}.\n\n${unpaidInvoices.length > 0 ? `Je note qu'une facture est en attente de règlement.` : ''}\n${customContent || ''}\n\nCordialement,\nLuna Conciergerie`,
                    },
                };
                
                const template = templates[purpose] || templates.suivi;
                
                // Save as draft activity
                await base.collection('activities').add({
                    type: 'email_draft',
                    description: `Brouillon email (${purpose}): ${template.subject}`,
                    details: { to: client.email, subject: template.subject, body: template.body },
                    clientId: clientMatch.id,
                    clientName: fullName,
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `Email "${purpose}" rédigé pour ${fullName}. Objet: "${template.subject}". ${client.email ? `Destinataire: ${client.email}` : '⚠️ Pas d\'email enregistré'}. Brouillon sauvegardé dans les activités.`,
                    action: { type: 'contact', label: fullName, id: clientMatch.id, previewUrl: `/crm/clients/${clientMatch.id}` },
                });
            }

            // ─── DEEP ANALYTICS: client_value ───
            if (tool === 'client_value') {
                const clientName = (args.clientName || '').toLowerCase();
                
                const contactSnap = await base.collection('contacts').limit(50).get();
                const clientMatch = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!clientMatch) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const client = clientMatch.data() as any;
                const fullName = `${client.firstName} ${client.lastName}`.trim();
                
                const [paymentsSnap, tripsSnap, quotesSnap, invoicesSnap] = await Promise.all([
                    base.collection('payments').get(),
                    base.collection('trips').get(),
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                ]);
                
                const clientPayments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientTrips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientQuotes = quotesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientInvoices = invoicesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                
                const totalPaid = clientPayments.reduce((s, d) => s + (d.data().amount || 0), 0);
                const totalInvoiced = clientInvoices.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                const unpaidTotal = clientInvoices.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status)).reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                
                // CLV tier
                let tier = '🌟 Standard';
                if (totalPaid >= 50000) tier = '💎 Diamant';
                else if (totalPaid >= 20000) tier = '🥇 Gold';
                else if (totalPaid >= 5000) tier = '🥈 Silver';
                
                // Calculate first interaction date
                const dates = [
                    ...clientTrips.map(d => d.data().createdAt?.toDate?.()),
                    ...clientPayments.map(d => d.data().createdAt?.toDate?.()),
                ].filter(Boolean);
                const firstDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
                const months = firstDate ? Math.max(1, Math.round((Date.now() - firstDate.getTime()) / (30 * 86400000))) : 1;
                const monthlyAvg = Math.round(totalPaid / months);
                
                return NextResponse.json({
                    success: true,
                    message: `${tier} — ${fullName}: ${totalPaid}€ payé, ${totalInvoiced}€ facturé, ${unpaidTotal}€ impayé. ${clientTrips.length} voyage(s), ${clientQuotes.length} devis. Client depuis ${months} mois (~${monthlyAvg}€/mois). VIP: ${client.vipLevel || 'Standard'}.`,
                    action: { type: 'contact', label: fullName, id: clientMatch.id, previewUrl: `/crm/clients/${clientMatch.id}` },
                });
            }

            // ─── DEEP ANALYTICS: seasonality ───
            if (tool === 'seasonality') {
                const targetDest = (args.destination || '').toLowerCase();
                const tripsSnap = await base.collection('trips').get();
                
                const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                
                if (targetDest) {
                    // Analyze specific destination seasonality
                    const monthCounts = new Array(12).fill(0);
                    tripsSnap.docs.forEach(d => {
                        const trip = d.data();
                        if ((trip.destination || '').toLowerCase().includes(targetDest)) {
                            const date = trip.startDate || trip.createdAt?.toDate?.()?.toISOString?.()?.substring(0, 10) || '';
                            const month = parseInt(date.substring(5, 7)) - 1;
                            if (month >= 0 && month < 12) monthCounts[month]++;
                        }
                    });
                    
                    const totalTrips = monthCounts.reduce((a, b) => a + b, 0);
                    if (totalTrips === 0) {
                        return NextResponse.json({ success: true, message: `Aucun voyage trouvé pour "${args.destination}".` });
                    }
                    
                    const peakMonth = monthCounts.indexOf(Math.max(...monthCounts));
                    const distribution = monthCounts.map((c, i) => c > 0 ? `${MONTH_LABELS[i]}: ${c}` : null).filter(Boolean).join(', ');
                    
                    return NextResponse.json({
                        success: true,
                        message: `📅 ${args.destination}: ${totalTrips} voyage(s). Pic: ${MONTH_LABELS[peakMonth]}. Distribution: ${distribution}.`,
                    });
                } else {
                    // Global destination popularity
                    const destCounts = new Map<string, number>();
                    const monthCounts = new Array(12).fill(0);
                    
                    tripsSnap.docs.forEach(d => {
                        const trip = d.data();
                        const dest = trip.destination || '';
                        if (dest) destCounts.set(dest, (destCounts.get(dest) || 0) + 1);
                        const date = trip.startDate || '';
                        const month = parseInt(date.substring(5, 7)) - 1;
                        if (month >= 0 && month < 12) monthCounts[month]++;
                    });
                    
                    const topDests = [...destCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
                    const peakMonth = monthCounts.indexOf(Math.max(...monthCounts));
                    const lowMonth = monthCounts.indexOf(Math.min(...monthCounts.filter(c => c > 0)));
                    
                    return NextResponse.json({
                        success: true,
                        message: `🌍 ${tripsSnap.size} voyages analysés. Top destinations: ${topDests.map(([d, c]) => `${d} (${c})`).join(', ')}. Pic de saison: ${MONTH_LABELS[peakMonth]}. Basse saison: ${MONTH_LABELS[lowMonth]}.`,
                    });
                }
            }

            // ─── DICTATION: dictate_note ───
            if (tool === 'dictate_note') {
                const text = args.text || '';
                const clientName = (args.clientName || '').toLowerCase();
                const category = args.category || 'note';
                
                // Find client if specified
                let clientId = '';
                let fullClientName = '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                    });
                    if (match) {
                        clientId = match.id;
                        fullClientName = `${match.data().firstName} ${match.data().lastName}`.trim();
                        
                        // Also add to client's notes field
                        const existing = match.data().notes || '';
                        const timestamp = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        const newNotes = existing
                            ? `${existing}\n[${timestamp}] 🎙️ [${category}] ${text}`
                            : `[${timestamp}] 🎙️ [${category}] ${text}`;
                        await base.collection('contacts').doc(match.id).update({
                            notes: newNotes,
                            updatedAt: FieldValue.serverTimestamp(),
                        });
                    }
                }
                
                // Save as activity
                await base.collection('activities').add({
                    type: 'voice_dictation',
                    category,
                    description: `🎙️ [${category}] ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
                    fullText: text,
                    clientId: clientId || null,
                    clientName: fullClientName || null,
                    source: 'voice-dictation',
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                return NextResponse.json({
                    success: true,
                    message: `📝 ${category} sauvegardé (${text.length} caractères)${fullClientName ? ` — lié à ${fullClientName}` : ''}. Catégorie: ${category}.`,
                    action: clientId ? { type: 'contact', label: fullClientName, id: clientId, previewUrl: `/crm/clients/${clientId}` } : undefined,
                });
            }

            // ─── BI: kpi_dashboard ───
            if (tool === 'kpi_dashboard') {
                const [leadsSnap, tripsSnap, quotesSnap, invoicesSnap, paymentsSnap, tasksSnap] = await Promise.all([
                    base.collection('leads').get(),
                    base.collection('trips').get(),
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                    base.collection('tasks').get(),
                ]);
                
                // Conversion rate (leads → won)
                const totalLeads = leadsSnap.size;
                const wonLeads = leadsSnap.docs.filter(d => d.data().status === 'WON').length;
                const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
                
                // Average deal size
                const paidInvoices = invoicesSnap.docs.filter(d => d.data().status === 'PAID');
                const totalRevenue = paidInvoices.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                const avgDeal = paidInvoices.length > 0 ? Math.round(totalRevenue / paidInvoices.length) : 0;
                
                // Pipeline value
                const pipelineValue = quotesSnap.docs
                    .filter(d => ['DRAFT', 'SENT'].includes(d.data().status))
                    .reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                
                // Payment collection rate
                const totalInvoiced = invoicesSnap.docs.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                const totalPaid = paymentsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
                
                // Task completion
                const doneTasks = tasksSnap.docs.filter(d => d.data().status === 'DONE').length;
                const taskRate = tasksSnap.size > 0 ? Math.round((doneTasks / tasksSnap.size) * 100) : 0;
                
                return NextResponse.json({
                    success: true,
                    message: `📊 KPIs: Conversion leads: ${conversionRate}% (${wonLeads}/${totalLeads}). Deal moyen: ${avgDeal}€. Pipeline: ${pipelineValue}€. Taux d'encaissement: ${collectionRate}%. Tâches terminées: ${taskRate}% (${doneTasks}/${tasksSnap.size}). ${tripsSnap.size} voyage(s) total.`,
                });
            }

            // ─── BI: set_goal ───
            if (tool === 'set_goal') {
                const goalType = args.type || 'revenue';
                const target = parseFloat(args.target) || 0;
                const period = args.period || 'month';
                
                await base.collection('goals').doc('current').set({
                    type: goalType,
                    target,
                    period,
                    setAt: FieldValue.serverTimestamp(),
                    source: 'voice-agent',
                }, { merge: true });
                
                const periodLabel = period === 'quarter' ? 'ce trimestre' : period === 'year' ? 'cette année' : 'ce mois';
                const typeLabel = goalType === 'deals' ? 'deals' : goalType === 'clients' ? 'nouveaux clients' : '€ de CA';
                
                return NextResponse.json({
                    success: true,
                    message: `🎯 Objectif défini: ${target} ${typeLabel} ${periodLabel}. Dis "vérifie l'objectif" pour suivre ta progression.`,
                });
            }

            // ─── BI: check_goal ───
            if (tool === 'check_goal') {
                const goalDoc = await base.collection('goals').doc('current').get();
                
                if (!goalDoc.exists) {
                    return NextResponse.json({ success: true, message: 'Aucun objectif défini. Dis "objectif 50000 euros ce mois" pour en créer un.' });
                }
                
                const goal = goalDoc.data() as any;
                const { type: goalType, target, period } = goal;
                
                // Calculate progress
                const now = new Date();
                let startDate: Date;
                let endDate: Date;
                
                if (period === 'quarter') {
                    const q = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), q * 3, 1);
                    endDate = new Date(now.getFullYear(), (q + 1) * 3, 0);
                } else if (period === 'year') {
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                } else {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                }
                
                let current = 0;
                if (goalType === 'revenue') {
                    const paymentsSnap = await base.collection('payments').get();
                    current = paymentsSnap.docs
                        .filter(d => {
                            const date = d.data().createdAt?.toDate?.();
                            return date && date >= startDate && date <= endDate;
                        })
                        .reduce((s, d) => s + (d.data().amount || 0), 0);
                } else if (goalType === 'deals') {
                    const tripsSnap = await base.collection('trips').get();
                    current = tripsSnap.docs.filter(d => {
                        const date = d.data().createdAt?.toDate?.();
                        return date && date >= startDate && date <= endDate;
                    }).length;
                } else if (goalType === 'clients') {
                    const contactsSnap = await base.collection('contacts').get();
                    current = contactsSnap.docs.filter(d => {
                        const date = d.data().createdAt?.toDate?.();
                        return date && date >= startDate && date <= endDate;
                    }).length;
                }
                
                const progress = target > 0 ? Math.round((current / target) * 100) : 0;
                const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
                const bar = '█'.repeat(Math.min(10, Math.floor(progress / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(progress / 10)));
                const typeLabel = goalType === 'deals' ? 'deals' : goalType === 'clients' ? 'clients' : '€';
                
                return NextResponse.json({
                    success: true,
                    message: `🎯 Objectif: ${target} ${typeLabel}. Progression: ${bar} ${progress}% (${current}/${target}). ${daysLeft} jours restants. ${progress >= 100 ? '🎉 Objectif atteint !' : progress >= 75 ? '💪 En bonne voie !' : progress >= 50 ? '⚡ Continuez !' : '🚀 Il faut accélérer !'}`,
                });
            }

            // ─── BI: data_quality ───
            if (tool === 'data_quality') {
                const [contactsSnap, tripsSnap, invoicesSnap] = await Promise.all([
                    base.collection('contacts').limit(200).get(),
                    base.collection('trips').get(),
                    base.collection('invoices').get(),
                ]);
                
                const issues: string[] = [];
                let totalChecks = 0;
                let passedChecks = 0;
                
                // Contacts quality
                const contacts = contactsSnap.docs.map(d => d.data());
                const noEmail = contacts.filter(c => !c.email);
                const noPhone = contacts.filter(c => !c.phone);
                const noLastName = contacts.filter(c => !c.lastName);
                
                totalChecks += contacts.length * 3;
                passedChecks += (contacts.length - noEmail.length) + (contacts.length - noPhone.length) + (contacts.length - noLastName.length);
                
                if (noEmail.length > 0) issues.push(`${noEmail.length} contact(s) sans email`);
                if (noPhone.length > 0) issues.push(`${noPhone.length} contact(s) sans téléphone`);
                if (noLastName.length > 0) issues.push(`${noLastName.length} contact(s) sans nom`);
                
                // Trips quality
                const trips = tripsSnap.docs.map(d => d.data());
                const noDate = trips.filter(t => !t.startDate);
                const noDest = trips.filter(t => !t.destination);
                
                totalChecks += trips.length * 2;
                passedChecks += (trips.length - noDate.length) + (trips.length - noDest.length);
                
                if (noDate.length > 0) issues.push(`${noDate.length} voyage(s) sans date`);
                if (noDest.length > 0) issues.push(`${noDest.length} voyage(s) sans destination`);
                
                // Invoices quality
                const invoices = invoicesSnap.docs.map(d => d.data());
                const noAmount = invoices.filter(i => !i.totalAmount && i.totalAmount !== 0);
                
                totalChecks += invoices.length;
                passedChecks += invoices.length - noAmount.length;
                
                if (noAmount.length > 0) issues.push(`${noAmount.length} facture(s) sans montant`);
                
                const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
                const emoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
                
                return NextResponse.json({
                    success: true,
                    message: `${emoji} Score qualité CRM: ${score}%. ${contacts.length} contacts, ${trips.length} voyages, ${invoices.length} factures analysés. ${issues.length > 0 ? `Problèmes: ${issues.join(', ')}.` : '✅ Toutes les données sont complètes !'}`,
                });
            }

            // ─── BI: segment_clients ───
            if (tool === 'segment_clients') {
                const [contactsSnap, paymentsSnap, tripsSnap] = await Promise.all([
                    base.collection('contacts').limit(200).get(),
                    base.collection('payments').get(),
                    base.collection('trips').get(),
                ]);
                
                const now = Date.now();
                const clientScores: Array<{ name: string; r: number; f: number; m: number; segment: string }> = [];
                
                for (const doc of contactsSnap.docs) {
                    const c = doc.data();
                    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
                    if (!name) continue;
                    const nameLower = name.toLowerCase();
                    
                    // Recency — days since last payment
                    const payments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower));
                    const lastPaymentDate = payments.reduce((latest, d) => {
                        const date = d.data().createdAt?.toDate?.();
                        return date && (!latest || date > latest) ? date : latest;
                    }, null as Date | null);
                    const daysSinceLast = lastPaymentDate ? Math.round((now - lastPaymentDate.getTime()) / 86400000) : 999;
                    
                    // Frequency — number of trips
                    const trips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower));
                    const freq = trips.length;
                    
                    // Monetary — total paid
                    const totalPaid = payments.reduce((s, d) => s + (d.data().amount || 0), 0);
                    
                    // Score 1-5 for each
                    const rScore = daysSinceLast <= 30 ? 5 : daysSinceLast <= 90 ? 4 : daysSinceLast <= 180 ? 3 : daysSinceLast <= 365 ? 2 : 1;
                    const fScore = freq >= 5 ? 5 : freq >= 3 ? 4 : freq >= 2 ? 3 : freq >= 1 ? 2 : 1;
                    const mScore = totalPaid >= 20000 ? 5 : totalPaid >= 10000 ? 4 : totalPaid >= 5000 ? 3 : totalPaid >= 1000 ? 2 : 1;
                    
                    // Segment
                    const avg = (rScore + fScore + mScore) / 3;
                    let segment = '🌱 À développer';
                    if (avg >= 4.5) segment = '🏆 Champion';
                    else if (avg >= 3.5) segment = '💛 Fidèle';
                    else if (rScore <= 2 && mScore >= 3) segment = '⚠️ À risque';
                    else if (rScore <= 2) segment = '💤 Dormant';
                    
                    clientScores.push({ name, r: rScore, f: fScore, m: mScore, segment });
                }
                
                // Group by segment
                const segments = new Map<string, number>();
                clientScores.forEach(c => segments.set(c.segment, (segments.get(c.segment) || 0) + 1));
                
                const overview = [...segments.entries()].map(([seg, count]) => `${seg}: ${count}`).join('. ');
                const champions = clientScores.filter(c => c.segment === '🏆 Champion').map(c => c.name);
                const atRisk = clientScores.filter(c => c.segment === '⚠️ À risque').map(c => c.name);
                
                return NextResponse.json({
                    success: true,
                    message: `📊 Segmentation RFM de ${clientScores.length} clients. ${overview}. ${champions.length > 0 ? `Champions: ${champions.slice(0, 3).join(', ')}.` : ''} ${atRisk.length > 0 ? `⚠️ À risque: ${atRisk.slice(0, 3).join(', ')}.` : ''}`,
                });
            }

            // ─── SMART: smart_reminder ───
            if (tool === 'smart_reminder') {
                const text = args.text || '';
                const when = (args.when || '').toLowerCase();
                const clientName = (args.clientName || '').toLowerCase();
                
                // Natural language date parsing
                const now = new Date();
                let dueDate = new Date(now);
                
                if (when.includes('demain')) {
                    dueDate.setDate(now.getDate() + 1);
                } else if (when.includes('après-demain') || when.includes('après demain')) {
                    dueDate.setDate(now.getDate() + 2);
                } else if (when.match(/dans (\d+) jour/)) {
                    const days = parseInt(when.match(/dans (\d+) jour/)![1]);
                    dueDate.setDate(now.getDate() + days);
                } else if (when.match(/dans (\d+) semaine/)) {
                    const weeks = parseInt(when.match(/dans (\d+) semaine/)![1]);
                    dueDate.setDate(now.getDate() + weeks * 7);
                } else if (when.includes('semaine prochaine') || when.includes('la semaine prochaine')) {
                    dueDate.setDate(now.getDate() + 7);
                } else if (when.includes('mois prochain') || when.includes('le mois prochain')) {
                    dueDate.setMonth(now.getMonth() + 1);
                } else if (when.includes('lundi')) {
                    dueDate.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7 || 7));
                } else if (when.includes('mardi')) {
                    dueDate.setDate(now.getDate() + ((2 - now.getDay() + 7) % 7 || 7));
                } else if (when.includes('mercredi')) {
                    dueDate.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
                } else if (when.includes('jeudi')) {
                    dueDate.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 7));
                } else if (when.includes('vendredi')) {
                    dueDate.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
                } else {
                    // Default: tomorrow
                    dueDate.setDate(now.getDate() + 1);
                }
                
                const dueDateStr = dueDate.toISOString().substring(0, 10);
                
                // Look up client if specified
                let clientId = '';
                let fullClientName = '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                    });
                    if (match) {
                        clientId = match.id;
                        fullClientName = `${match.data().firstName} ${match.data().lastName}`.trim();
                    }
                }
                
                // Create task as reminder
                const taskRef = await base.collection('tasks').add({
                    title: `🔔 ${text}`,
                    description: `Rappel vocal${fullClientName ? ` — ${fullClientName}` : ''}`,
                    dueDate: dueDateStr,
                    priority: 'HIGH',
                    status: 'TODO',
                    source: 'voice-reminder',
                    clientId: clientId || null,
                    clientName: fullClientName || null,
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                const readableDate = dueDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                
                return NextResponse.json({
                    success: true,
                    message: `🔔 Rappel créé pour ${readableDate}: "${text}"${fullClientName ? ` (lié à ${fullClientName})` : ''}. ID: ${taskRef.id.substring(0, 6)}.`,
                    action: { type: 'task', label: text, id: taskRef.id, previewUrl: '/crm/tasks' },
                });
            }

            // ─── SMART: voice_history ───
            if (tool === 'voice_history') {
                const limit = parseInt(args.limit) || 10;
                
                try {
                    const auditSnap = await base.collection('voiceAudit')
                        .orderBy('timestamp', 'desc')
                        .limit(limit)
                        .get();
                    
                    if (auditSnap.empty) {
                        return NextResponse.json({ success: true, message: 'Aucune commande vocale enregistrée.' });
                    }
                    
                    const entries = auditSnap.docs.map(d => {
                        const a = d.data();
                        const date = a.timestamp?.toDate?.();
                        const ago = date ? Math.round((Date.now() - date.getTime()) / 60000) : 0;
                        const agoStr = ago < 60 ? `il y a ${ago}min` : ago < 1440 ? `il y a ${Math.round(ago / 60)}h` : `il y a ${Math.round(ago / 1440)}j`;
                        return `${a.tool || '?'}: ${(a.result || '').substring(0, 50)} (${agoStr})`;
                    });
                    
                    return NextResponse.json({
                        success: true,
                        message: `📜 ${auditSnap.size} dernières commandes: ${entries.join(' | ')}.`,
                    });
                } catch {
                    return NextResponse.json({ success: true, message: 'Historique vocal non disponible (index Firestore requis pour tri par timestamp).' });
                }
            }

            // ─── SMART: auto_tag ───
            if (tool === 'auto_tag') {
                const [contactsSnap, paymentsSnap, tripsSnap, invoicesSnap] = await Promise.all([
                    base.collection('contacts').limit(200).get(),
                    base.collection('payments').get(),
                    base.collection('trips').get(),
                    base.collection('invoices').get(),
                ]);
                
                let tagged = 0;
                const now = Date.now();
                const batch = base.firestore ? null : null; // We'll do individual updates for safety
                
                for (const doc of contactsSnap.docs) {
                    const c = doc.data();
                    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().trim();
                    if (!name) continue;
                    
                    const tags: string[] = [];
                    
                    // VIP — high spender
                    const payments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(name));
                    const totalPaid = payments.reduce((s, d) => s + (d.data().amount || 0), 0);
                    if (totalPaid >= 10000) tags.push('🏆 VIP');
                    
                    // Recurring — 3+ trips
                    const trips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(name));
                    if (trips.length >= 3) tags.push('🔄 Récurrent');
                    if (trips.length >= 5) tags.push('✈️ Gros voyageur');
                    
                    // Unpaid invoices
                    const unpaid = invoicesSnap.docs.filter(d => 
                        (d.data().clientName || '').toLowerCase().includes(name) &&
                        !['PAID', 'CANCELLED'].includes(d.data().status)
                    );
                    if (unpaid.length > 0) tags.push('⚠️ Impayé');
                    
                    // New client — created < 30 days ago
                    const createdAt = c.createdAt?.toDate?.();
                    if (createdAt && (now - createdAt.getTime()) < 30 * 86400000) tags.push('🆕 Nouveau');
                    
                    if (tags.length > 0) {
                        await base.collection('contacts').doc(doc.id).update({
                            autoTags: tags,
                            updatedAt: FieldValue.serverTimestamp(),
                        });
                        tagged++;
                    }
                }
                
                return NextResponse.json({
                    success: true,
                    message: `🏷️ ${tagged} client(s) tagué(s) automatiquement sur ${contactsSnap.size} analysés. Tags: VIP, Récurrent, Gros voyageur, Impayé, Nouveau.`,
                });
            }

            // ─── SMART: track_expense ───
            if (tool === 'track_expense') {
                const description = args.description || '';
                const amount = parseFloat(args.amount) || 0;
                const category = args.category || 'autre';
                const clientName = (args.clientName || '').toLowerCase();
                
                // Link to client if specified
                let clientId = '';
                let fullClientName = '';
                if (clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                    });
                    if (match) {
                        clientId = match.id;
                        fullClientName = `${match.data().firstName} ${match.data().lastName}`.trim();
                    }
                }
                
                await base.collection('expenses').add({
                    description,
                    amount,
                    category,
                    clientId: clientId || null,
                    clientName: fullClientName || null,
                    source: 'voice-agent',
                    date: new Date().toISOString().substring(0, 10),
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                // Get monthly total
                const expensesSnap = await base.collection('expenses').get();
                const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
                const monthlyTotal = expensesSnap.docs
                    .filter(d => (d.data().date || '').startsWith(thisMonth))
                    .reduce((s, d) => s + (d.data().amount || 0), 0);
                
                return NextResponse.json({
                    success: true,
                    message: `💰 Dépense enregistrée: ${description} — ${amount}€ (${category})${fullClientName ? ` lié à ${fullClientName}` : ''}. Total dépenses du mois: ${monthlyTotal}€.`,
                });
            }

            // ─── WORKFLOW: set_workflow_rule ───
            if (tool === 'set_workflow_rule') {
                const trigger = args.trigger || '';
                const action = args.action || '';
                const description = args.description || `Quand ${trigger} → ${action}`;
                
                const validTriggers = ['quote_accepted', 'invoice_paid', 'trip_created', 'lead_created', 'task_completed'];
                const validActions = ['create_trip', 'send_email', 'create_task', 'update_lead', 'send_whatsapp'];
                
                if (!validTriggers.includes(trigger)) {
                    return NextResponse.json({ success: false, message: `Trigger invalide. Valides: ${validTriggers.join(', ')}` });
                }
                if (!validActions.includes(action)) {
                    return NextResponse.json({ success: false, message: `Action invalide. Valides: ${validActions.join(', ')}` });
                }
                
                const ruleRef = await base.collection('workflowRules').add({
                    trigger,
                    action,
                    description,
                    enabled: true,
                    createdAt: FieldValue.serverTimestamp(),
                    source: 'voice-agent',
                });
                
                // Count existing rules
                const rulesSnap = await base.collection('workflowRules').get();
                const enabledRules = rulesSnap.docs.filter(d => d.data().enabled).length;
                
                const triggerLabels: Record<string, string> = {
                    quote_accepted: 'Devis accepté', invoice_paid: 'Facture payée',
                    trip_created: 'Voyage créé', lead_created: 'Lead créé', task_completed: 'Tâche terminée',
                };
                const actionLabels: Record<string, string> = {
                    create_trip: 'Créer voyage', send_email: 'Envoyer email',
                    create_task: 'Créer tâche', update_lead: 'Mettre à jour lead', send_whatsapp: 'Envoyer WhatsApp',
                };
                
                return NextResponse.json({
                    success: true,
                    message: `⚙️ Règle créée: "${triggerLabels[trigger]}" → "${actionLabels[action]}". ${enabledRules} règle(s) active(s) au total. ID: ${ruleRef.id.substring(0, 6)}.`,
                });
            }

            // ─── ANALYTICS: profit_analysis ───
            if (tool === 'profit_analysis') {
                const clientName = (args.clientName || '').toLowerCase();
                
                const [invoicesSnap, paymentsSnap, expensesSnap] = await Promise.all([
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                    base.collection('expenses').get(),
                ]);
                
                if (clientName) {
                    // Per-client profitability
                    const clientInvoices = invoicesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                    const clientPayments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                    const clientExpenses = expensesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                    
                    const revenue = clientPayments.reduce((s, d) => s + (d.data().amount || 0), 0);
                    const expenses = clientExpenses.reduce((s, d) => s + (d.data().amount || 0), 0);
                    const invoiced = clientInvoices.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                    const margin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;
                    const profit = revenue - expenses;
                    
                    return NextResponse.json({
                        success: true,
                        message: `💰 Rentabilité "${args.clientName}": ${revenue}€ encaissé, ${expenses}€ dépensé = ${profit}€ profit (marge ${margin}%). ${invoiced}€ facturé total.`,
                    });
                } else {
                    // Global profitability
                    const totalRevenue = paymentsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                    const totalExpenses = expensesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                    const profit = totalRevenue - totalExpenses;
                    const margin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0;
                    
                    // Top profitable clients
                    const clientProfits = new Map<string, number>();
                    paymentsSnap.docs.forEach(d => {
                        const name = d.data().clientName || 'Inconnu';
                        clientProfits.set(name, (clientProfits.get(name) || 0) + (d.data().amount || 0));
                    });
                    expensesSnap.docs.forEach(d => {
                        const name = d.data().clientName || '';
                        if (name) clientProfits.set(name, (clientProfits.get(name) || 0) - (d.data().amount || 0));
                    });
                    
                    const sorted = [...clientProfits.entries()].sort((a, b) => b[1] - a[1]);
                    const top3 = sorted.slice(0, 3).map(([n, p]) => `${n}: ${p}€`).join(', ');
                    const bottom = sorted.filter(([, p]) => p < 0).map(([n, p]) => `${n}: ${p}€`).join(', ');
                    
                    return NextResponse.json({
                        success: true,
                        message: `📊 Rentabilité globale: ${totalRevenue}€ revenus − ${totalExpenses}€ dépenses = ${profit}€ profit (marge ${margin}%). Top clients: ${top3 || 'aucun'}. ${bottom ? `⚠️ Non-rentables: ${bottom}` : ''}`,
                    });
                }
            }

            // ─── BULK: bulk_update ───
            if (tool === 'bulk_update') {
                const collection = args.collection || 'leads';
                const filterStatus = (args.filterStatus || '').toUpperCase();
                const newStatus = (args.newStatus || '').toUpperCase();
                const olderThanDays = parseInt(args.olderThanDays) || 0;
                
                const validCollections = ['leads', 'tasks', 'invoices'];
                if (!validCollections.includes(collection)) {
                    return NextResponse.json({ success: false, message: `Collection invalide. Valides: ${validCollections.join(', ')}` });
                }
                
                const snap = await base.collection(collection).get();
                const now = Date.now();
                let updated = 0;
                
                for (const doc of snap.docs) {
                    const data = doc.data();
                    
                    // Filter by current status if specified
                    if (filterStatus && (data.status || '').toUpperCase() !== filterStatus) continue;
                    
                    // Filter by age if specified
                    if (olderThanDays > 0) {
                        const createdAt = data.createdAt?.toDate?.();
                        if (!createdAt || (now - createdAt.getTime()) < olderThanDays * 86400000) continue;
                    }
                    
                    await base.collection(collection).doc(doc.id).update({
                        status: newStatus,
                        updatedAt: FieldValue.serverTimestamp(),
                        updatedBy: 'voice-bulk-update',
                    });
                    updated++;
                }
                
                return NextResponse.json({
                    success: true,
                    message: `🔄 ${updated} ${collection} mis à jour → "${newStatus}"${filterStatus ? ` (ancien statut: "${filterStatus}")` : ''}${olderThanDays > 0 ? ` (> ${olderThanDays} jours)` : ''}.`,
                });
            }

            // ─── NARRATION: narrate_dashboard ───
            if (tool === 'narrate_dashboard') {
                const [contactsSnap, tripsSnap, quotesSnap, invoicesSnap, paymentsSnap, tasksSnap, leadsSnap, expensesSnap] = await Promise.all([
                    base.collection('contacts').get(),
                    base.collection('trips').get(),
                    base.collection('quotes').get(),
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                    base.collection('tasks').get(),
                    base.collection('leads').get(),
                    base.collection('expenses').get(),
                ]);
                
                const totalRevenue = paymentsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                const totalExpenses = expensesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                const profit = totalRevenue - totalExpenses;
                const pipelineValue = quotesSnap.docs
                    .filter(d => ['DRAFT', 'SENT'].includes(d.data().status))
                    .reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                const unpaidInvoices = invoicesSnap.docs.filter(d => !['PAID', 'CANCELLED'].includes(d.data().status));
                const unpaidTotal = unpaidInvoices.reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                const overdueTasks = tasksSnap.docs.filter(d => {
                    const due = d.data().dueDate;
                    return due && due < new Date().toISOString().substring(0, 10) && d.data().status !== 'DONE';
                });
                
                // This week's new items
                const weekAgo = new Date(Date.now() - 7 * 86400000);
                const newLeads = leadsSnap.docs.filter(d => {
                    const date = d.data().createdAt?.toDate?.();
                    return date && date >= weekAgo;
                }).length;
                const newTrips = tripsSnap.docs.filter(d => {
                    const date = d.data().createdAt?.toDate?.();
                    return date && date >= weekAgo;
                }).length;
                
                const narration = `Voici votre CRM. Vous avez ${contactsSnap.size} clients et ${tripsSnap.size} voyages. ` +
                    `Cette semaine: ${newLeads} nouveaux leads, ${newTrips} nouveaux voyages. ` +
                    `Votre pipeline contient ${pipelineValue}€ de devis en attente (${quotesSnap.docs.filter(d => d.data().status === 'SENT').length} envoyés). ` +
                    `Revenus: ${totalRevenue}€, dépenses: ${totalExpenses}€, profit: ${profit}€. ` +
                    `${unpaidInvoices.length > 0 ? `⚠️ ${unpaidInvoices.length} facture(s) impayée(s) pour ${unpaidTotal}€. ` : ''}` +
                    `${overdueTasks.length > 0 ? `⚠️ ${overdueTasks.length} tâche(s) en retard. ` : ''}` +
                    `${leadsSnap.docs.filter(d => d.data().status === 'WON').length} deals gagnés sur ${leadsSnap.size} leads total.`;
                
                return NextResponse.json({
                    success: true,
                    message: narration,
                });
            }

            // ─── GAMIFICATION: Auto-XP on every tool call ───
            // (This runs AFTER every tool handler above returns)
            // We add XP tracking at the gamification_status and daily_challenge handlers,
            // and the actual XP award happens in the voice-data POST response handler.

            // ─── GAMIFICATION: gamification_status ───
            if (tool === 'gamification_status') {
                const gamDoc = await base.collection('userGamification').doc('profile').get();
                const gam = gamDoc.exists ? gamDoc.data() as any : { totalXp: 0, totalActions: 0, streak: 0, badges: [], lastActionDate: '' };
                
                // Calculate level
                const LEVELS = [
                    { level: 1, name: '🥉 Bronze', minXp: 0 },
                    { level: 2, name: '🥈 Argent', minXp: 100 },
                    { level: 3, name: '🥇 Or', minXp: 300 },
                    { level: 4, name: '💎 Platine', minXp: 600 },
                    { level: 5, name: '⭐ Diamant', minXp: 1000 },
                    { level: 6, name: '👑 Légende', minXp: 2000 },
                    { level: 7, name: '🔥 Titan', minXp: 5000 },
                    { level: 8, name: '🌟 Mythique', minXp: 10000 },
                ];
                
                let currentLevel = LEVELS[0];
                for (const l of LEVELS) {
                    if (gam.totalXp >= l.minXp) currentLevel = l;
                    else break;
                }
                const nextLevel = LEVELS[currentLevel.level] || null;
                const progress = nextLevel
                    ? Math.round(((gam.totalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100)
                    : 100;
                const bar = '█'.repeat(Math.min(10, Math.floor(progress / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(progress / 10)));
                
                // Daily challenge
                const today = new Date().toISOString().substring(0, 10);
                const challengePool = [
                    '🎯 Ferme 1 deal', '📋 Crée 3 tâches', '📧 Envoie 5 emails',
                    '📊 3 analyses', '💰 2 devis', '☀️ Routine matinale',
                    '🔄 Suivi de 2 clients', '🏷️ Auto-tag', '💎 Analyse profits', '🎙️ Narration CRM',
                ];
                const hash = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const dayChallenge = challengePool[hash % challengePool.length];
                
                const badges = (gam.badges || []) as string[];
                
                return NextResponse.json({
                    success: true,
                    message: `🎮 PROFIL\n${currentLevel.name} — Niveau ${currentLevel.level}\n${bar} ${progress}% → ${nextLevel ? nextLevel.name : 'MAX'}\n📊 ${gam.totalXp} XP total | ${gam.totalActions} actions\n🔥 Streak: ${gam.streak} jour(s)\n🏅 ${badges.length} badge(s) débloqué(s)${badges.length > 0 ? ': ' + badges.slice(-5).join(', ') : ''}\n📋 Défi du jour: ${dayChallenge}`,
                });
            }

            // ─── GAMIFICATION: daily_challenge ───
            if (tool === 'daily_challenge') {
                const today = new Date().toISOString().substring(0, 10);
                const challenges = [
                    { title: '🎯 Closer du jour', desc: 'Ferme 1 deal', tool: 'close_deal', target: 1, xp: 50 },
                    { title: '📋 Organisateur', desc: 'Crée 3 tâches', tool: 'create_task', target: 3, xp: 30 },
                    { title: '📧 Messager', desc: 'Envoie 5 emails', tool: 'send_email', target: 5, xp: 40 },
                    { title: '📊 Data Scientist', desc: '3 analyses', tool: 'analytics', target: 3, xp: 35 },
                    { title: '💰 Vendeur', desc: 'Crée 2 devis', tool: 'create_quote', target: 2, xp: 30 },
                    { title: '☀️ Routine matinale', desc: 'Rapport du matin', tool: 'morning_report', target: 1, xp: 25 },
                    { title: '🔄 Relanceur', desc: 'Suivi de 2 clients', tool: 'follow_up_client', target: 2, xp: 40 },
                    { title: '🏷️ Classifieur', desc: 'Auto-tag clients', tool: 'auto_tag', target: 1, xp: 20 },
                    { title: '💎 CFO du jour', desc: 'Analyse profits', tool: 'profit_analysis', target: 1, xp: 20 },
                    { title: '🎙️ Narrateur', desc: 'Narration CRM', tool: 'narrate_dashboard', target: 1, xp: 15 },
                ];
                
                const hash = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const challenge = challenges[hash % challenges.length];
                
                // Check progress from voiceAudit today
                try {
                    const todayStart = new Date(today + 'T00:00:00Z');
                    const auditSnap = await base.collection('voiceAudit')
                        .where('timestamp', '>=', todayStart)
                        .get();
                    
                    const todayActions = auditSnap.docs
                        .filter(d => {
                            const t = d.data().tool;
                            if (challenge.tool === 'analytics') {
                                return ['morning_report', 'compare_revenue', 'top_clients', 'revenue_forecast', 'kpi_dashboard', 'profit_analysis', 'narrate_dashboard', 'segment_clients'].includes(t);
                            }
                            return t === challenge.tool;
                        }).length;
                    
                    const done = todayActions >= challenge.target;
                    const progressBar = '█'.repeat(Math.min(challenge.target, todayActions)) + '░'.repeat(Math.max(0, challenge.target - todayActions));
                    
                    return NextResponse.json({
                        success: true,
                        message: `📋 DÉFI DU JOUR: ${challenge.title}\n${challenge.desc}\n${progressBar} ${todayActions}/${challenge.target} ${done ? '✅ COMPLÉTÉ ! +' + challenge.xp + ' XP bonus !' : ''}\nRécompense: +${challenge.xp} XP`,
                    });
                } catch {
                    return NextResponse.json({
                        success: true,
                        message: `📋 DÉFI DU JOUR: ${challenge.title} — ${challenge.desc}. Récompense: +${challenge.xp} XP.`,
                    });
                }
            }

            // ─── PREDICTIVE: predict_churn ───
            if (tool === 'predict_churn') {
                const [contactsSnap, tripsSnap, paymentsSnap, activitiesSnap] = await Promise.all([
                    base.collection('contacts').limit(200).get(),
                    base.collection('trips').get(),
                    base.collection('payments').get(),
                    base.collection('activities').get(),
                ]);
                
                const now = Date.now();
                const risks: { name: string; score: number; reasons: string[] }[] = [];
                
                for (const doc of contactsSnap.docs) {
                    const c = doc.data();
                    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim();
                    if (!name) continue;
                    const nameLower = name.toLowerCase();
                    
                    let score = 0;
                    const reasons: string[] = [];
                    
                    // Last trip age
                    const clientTrips = tripsSnap.docs
                        .filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower))
                        .map(d => d.data().createdAt?.toDate?.()?.getTime() || 0)
                        .sort((a, b) => b - a);
                    
                    if (clientTrips.length === 0) {
                        score += 20; reasons.push('Aucun voyage');
                    } else {
                        const daysSinceTrip = Math.round((now - clientTrips[0]) / 86400000);
                        if (daysSinceTrip > 180) { score += 40; reasons.push(`${daysSinceTrip}j sans voyage`); }
                        else if (daysSinceTrip > 90) { score += 30; reasons.push(`${daysSinceTrip}j sans voyage`); }
                        else if (daysSinceTrip > 45) { score += 15; reasons.push(`${daysSinceTrip}j sans voyage`); }
                    }
                    
                    // Last payment age
                    const clientPayments = paymentsSnap.docs
                        .filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower))
                        .map(d => d.data().date || d.data().createdAt?.toDate?.()?.toISOString() || '')
                        .sort().reverse();
                    
                    if (clientPayments.length === 0) {
                        score += 15; reasons.push('Aucun paiement');
                    } else {
                        const lastPay = new Date(clientPayments[0]).getTime();
                        const daysSincePay = Math.round((now - lastPay) / 86400000);
                        if (daysSincePay > 60) { score += 25; reasons.push(`${daysSincePay}j sans paiement`); }
                    }
                    
                    // Low total spending
                    const totalSpent = paymentsSnap.docs
                        .filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower))
                        .reduce((s, d) => s + (d.data().amount || 0), 0);
                    if (totalSpent < 500 && totalSpent > 0) { score += 10; reasons.push(`${totalSpent}€ seulement`); }
                    
                    // No interactions
                    const activities = activitiesSnap.docs
                        .filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower));
                    if (activities.length === 0) { score += 15; reasons.push('Aucune interaction'); }
                    
                    if (score >= 25) {
                        risks.push({ name, score: Math.min(100, score), reasons });
                    }
                }
                
                risks.sort((a, b) => b.score - a.score);
                const top5 = risks.slice(0, 5);
                
                if (top5.length === 0) {
                    return NextResponse.json({ success: true, message: '✅ Aucun risque de churn détecté. Tous les clients sont actifs.' });
                }
                
                const report = top5.map((r, i) => 
                    `${i + 1}. ⚠️ ${r.name} — Risque ${r.score}% (${r.reasons.join(', ')})`
                ).join('. ');
                
                return NextResponse.json({
                    success: true,
                    message: `🔮 ${risks.length} client(s) à risque de churn: ${report}. Dis "fais le suivi de [client]" pour agir.`,
                });
            }

            // ─── PREDICTIVE: pipeline_coach ───
            if (tool === 'pipeline_coach') {
                const dealName = (args.dealName || '').toLowerCase();
                const leadsSnap = await base.collection('leads').get();
                
                const activeLeads = leadsSnap.docs
                    .filter(d => {
                        const status = (d.data().status || '').toUpperCase();
                        if (['WON', 'LOST'].includes(status)) return false;
                        if (dealName) return (d.data().clientName || '').toLowerCase().includes(dealName);
                        return true;
                    });
                
                if (activeLeads.length === 0) {
                    return NextResponse.json({ success: true, message: 'Aucun deal actif dans le pipeline.' });
                }
                
                const now = Date.now();
                const coaching = activeLeads.slice(0, 8).map(d => {
                    const data = d.data();
                    const stage = (data.status || 'lead').toLowerCase();
                    const name = data.clientName || 'Inconnu';
                    const createdAt = data.createdAt?.toDate?.();
                    const daysInStage = createdAt ? Math.round((now - createdAt.getTime()) / 86400000) : 0;
                    
                    let action = '';
                    let emoji = '';
                    let urgency = '';
                    
                    switch (stage) {
                        case 'lead':
                            action = 'Qualifie le lead — demande budget et dates';
                            emoji = '🎯';
                            break;
                        case 'qualified':
                            action = 'Prépare un devis personnalisé';
                            emoji = '📝';
                            break;
                        case 'proposal':
                            action = 'Relance le client — vérifie s\'il a vu le devis';
                            emoji = '📞';
                            break;
                        case 'negotiation':
                            action = 'Close le deal — propose un avantage exclusif';
                            emoji = '🤝';
                            break;
                        default:
                            action = 'Contacte le client pour avancer';
                            emoji = '📌';
                    }
                    
                    if (daysInStage > 14) urgency = ' ⏰ STALE';
                    else if (daysInStage > 7) urgency = ' ⚡ À relancer';
                    
                    return `${emoji} ${name} (${stage}${urgency}): ${action}`;
                });
                
                return NextResponse.json({
                    success: true,
                    message: `🏋️ Coaching pipeline — ${activeLeads.length} deal(s) actif(s): ${coaching.join(' | ')}`,
                });
            }

            // ─── PREDICTIVE: smart_schedule ───
            if (tool === 'smart_schedule') {
                const clientName = (args.clientName || '');
                const requestedDate = args.date || new Date().toISOString().substring(0, 10);
                const duration = (args.duration || 'journée').toLowerCase();
                
                // Get existing bookings for the week
                const weekStart = new Date(requestedDate);
                const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
                const weekStartStr = weekStart.toISOString().substring(0, 10);
                const weekEndStr = weekEnd.toISOString().substring(0, 10);
                
                const [tripsSnap, tasksSnap, bookingsSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('tasks').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                // Find busy dates
                const busyDates = new Set<string>();
                
                tripsSnap.docs.forEach(d => {
                    const t = d.data();
                    if (t.startDate && t.endDate) {
                        const start = new Date(t.startDate);
                        const end = new Date(t.endDate);
                        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                            busyDates.add(dt.toISOString().substring(0, 10));
                        }
                    }
                });
                
                tasksSnap.docs.forEach(d => {
                    const t = d.data();
                    if (t.dueDate && t.status !== 'DONE') {
                        busyDates.add(t.dueDate);
                    }
                });
                
                bookingsSnap.docs.forEach(d => {
                    const b = d.data();
                    if (b.date) busyDates.add(b.date);
                });
                
                // Find free slots in the next 7 days
                const freeSlots: string[] = [];
                const busySlots: string[] = [];
                
                for (let i = 0; i < 7; i++) {
                    const dt = new Date(weekStart.getTime() + i * 86400000);
                    const dtStr = dt.toISOString().substring(0, 10);
                    const dayName = dt.toLocaleDateString('fr-FR', { weekday: 'long' });
                    
                    // Skip weekends
                    if (dt.getDay() === 0 || dt.getDay() === 6) continue;
                    
                    if (busyDates.has(dtStr)) {
                        busySlots.push(dayName);
                    } else {
                        freeSlots.push(`${dayName} ${dt.getDate()}/${dt.getMonth() + 1}`);
                    }
                }
                
                return NextResponse.json({
                    success: true,
                    message: `📅 Créneaux libres pour ${clientName} (semaine du ${weekStartStr}): ${freeSlots.length > 0 ? freeSlots.join(', ') : 'Aucun créneau libre'}. ${busySlots.length > 0 ? `Occupé: ${busySlots.join(', ')}.` : ''}`,
                });
            }

            // ─── MACROS: save_macro ───
            if (tool === 'save_macro') {
                const macroName = (args.name || '').trim();
                const commands = (args.commands || '').trim();
                
                if (!macroName || !commands) {
                    return NextResponse.json({ success: false, message: 'Nom et commandes requis pour créer une macro.' });
                }
                
                // Parse commands — separated by "puis", ";", or ","
                const commandList = commands.split(/puis|;|,/).map((c: string) => c.trim()).filter((c: string) => c.length > 2);
                
                await base.collection('voiceMacros').doc(macroName.toLowerCase().replace(/\s+/g, '_')).set({
                    name: macroName,
                    commands: commandList,
                    createdAt: FieldValue.serverTimestamp(),
                    source: 'voice-agent',
                });
                
                return NextResponse.json({
                    success: true,
                    message: `🎬 Macro "${macroName}" sauvegardée avec ${commandList.length} commande(s): ${commandList.map((c: string, i: number) => `${i + 1}. ${c}`).join(' → ')}. Dis "lance la macro ${macroName}" pour l'exécuter.`,
                });
            }

            // ─── MACROS: run_macro ───
            if (tool === 'run_macro') {
                const macroName = (args.name || '').toLowerCase().replace(/\s+/g, '_');
                
                const macroDoc = await base.collection('voiceMacros').doc(macroName).get();
                if (!macroDoc.exists) {
                    // List available macros
                    const allMacros = await base.collection('voiceMacros').get();
                    const names = allMacros.docs.map(d => d.data().name).join(', ');
                    return NextResponse.json({ success: false, message: `Macro "${args.name}" non trouvée. Macros disponibles: ${names || 'aucune'}.` });
                }
                
                const macro = macroDoc.data() as any;
                const commands = macro.commands || [];
                
                return NextResponse.json({
                    success: true,
                    message: `🎬 Macro "${macro.name}" — ${commands.length} commande(s) à exécuter: ${commands.map((c: string, i: number) => `${i + 1}. ${c}`).join(' → ')}. Exécution séquentielle recommandée.`,
                });
            }

            // ─── INTELLIGENCE: cross_sell ───
            if (tool === 'cross_sell') {
                const clientName = (args.clientName || '').toLowerCase();
                
                const [tripsSnap, catalogSnap, bookingsSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('catalog').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                // What has the client already booked?
                const clientTrips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                const clientBookings = bookingsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName));
                
                const bookedPrestations = new Set<string>();
                const destinations = new Set<string>();
                
                clientTrips.forEach(d => {
                    const t = d.data();
                    if (t.destination) destinations.add(t.destination.toLowerCase());
                    (t.prestations || []).forEach((p: any) => bookedPrestations.add((p.name || '').toLowerCase()));
                });
                clientBookings.forEach(d => {
                    bookedPrestations.add((d.data().prestationName || '').toLowerCase());
                });
                
                // Find catalog items NOT yet booked, prioritize by destination match
                const suggestions = catalogSnap.docs
                    .filter(d => !bookedPrestations.has((d.data().name || '').toLowerCase()))
                    .map(d => {
                        const c = d.data();
                        const destMatch = destinations.has((c.location || c.region || '').toLowerCase());
                        return {
                            name: c.name,
                            price: c.sellPrice || c.price || 0,
                            type: c.type || c.category || '',
                            location: c.location || c.region || '',
                            priority: destMatch ? 2 : 1,
                        };
                    })
                    .sort((a, b) => b.priority - a.priority)
                    .slice(0, 5);
                
                if (suggestions.length === 0) {
                    return NextResponse.json({ success: true, message: `Le client a déjà tout essayé ! Aucune suggestion.` });
                }
                
                const list = suggestions.map((s, i) => `${i + 1}. ${s.name} (${s.type}) — ${s.price}€${s.priority === 2 ? ' ⭐ même destination' : ''}`).join('. ');
                
                return NextResponse.json({
                    success: true,
                    message: `🛒 Cross-sell pour "${args.clientName}": ${list}. Dis "ajoute [prestation] au voyage" pour l'ajouter.`,
                });
            }

            // ─── INTELLIGENCE: client_health ───
            if (tool === 'client_health') {
                const clientName = (args.clientName || '').toLowerCase();
                
                const [contactsSnap, tripsSnap, paymentsSnap, activitiesSnap, invoicesSnap] = await Promise.all([
                    base.collection('contacts').limit(100).get(),
                    base.collection('trips').get(),
                    base.collection('payments').get(),
                    base.collection('activities').get(),
                    base.collection('invoices').get(),
                ]);
                
                const contact = contactsSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!contact) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const now = Date.now();
                const name = `${contact.data().firstName} ${contact.data().lastName}`.trim();
                const nameLower = name.toLowerCase();
                
                // Trip frequency score (0-25)
                const trips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower));
                const tripScore = Math.min(25, trips.length * 5);
                
                // Payment regularity (0-25)
                const payments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower));
                const totalPaid = payments.reduce((s, d) => s + (d.data().amount || 0), 0);
                const unpaid = invoicesSnap.docs.filter(d => 
                    (d.data().clientName || '').toLowerCase().includes(nameLower) && 
                    !['PAID', 'CANCELLED'].includes(d.data().status)
                ).length;
                const payScore = Math.min(25, Math.max(0, 25 - unpaid * 10));
                
                // Spending level (0-25)
                const spendScore = totalPaid >= 10000 ? 25 : totalPaid >= 5000 ? 20 : totalPaid >= 2000 ? 15 : totalPaid >= 500 ? 10 : 5;
                
                // Interaction recency (0-25)
                const activities = activitiesSnap.docs
                    .filter(d => (d.data().clientName || '').toLowerCase().includes(nameLower))
                    .map(d => d.data().createdAt?.toDate?.()?.getTime() || 0)
                    .sort((a, b) => b - a);
                const lastInteraction = activities[0] || 0;
                const daysSinceInteraction = lastInteraction ? Math.round((now - lastInteraction) / 86400000) : 999;
                const interactionScore = daysSinceInteraction < 7 ? 25 : daysSinceInteraction < 30 ? 20 : daysSinceInteraction < 90 ? 10 : 0;
                
                const totalScore = tripScore + payScore + spendScore + interactionScore;
                const grade = totalScore >= 80 ? 'A 🟢' : totalScore >= 60 ? 'B 🟡' : totalScore >= 40 ? 'C 🟠' : totalScore >= 20 ? 'D 🔴' : 'F ⛔';
                
                return NextResponse.json({
                    success: true,
                    message: `❤️ Santé ${name}: ${totalScore}/100 (${grade})\n📊 Voyages: ${tripScore}/25 (${trips.length} trips) | Paiements: ${payScore}/25 (${unpaid} impayé) | Dépenses: ${spendScore}/25 (${totalPaid}€) | Interactions: ${interactionScore}/25 (${daysSinceInteraction}j)`,
                });
            }

            // ─── INTELLIGENCE: compare_clients ───
            if (tool === 'compare_clients') {
                const c1Name = (args.client1 || '').toLowerCase();
                const c2Name = (args.client2 || '').toLowerCase();
                
                const [tripsSnap, paymentsSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('payments').get(),
                ]);
                
                const getStats = (name: string) => {
                    const trips = tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(name));
                    const payments = paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(name));
                    const totalPaid = payments.reduce((s, d) => s + (d.data().amount || 0), 0);
                    const destinations = [...new Set(trips.map(d => d.data().destination).filter(Boolean))];
                    return { trips: trips.length, totalPaid, destinations };
                };
                
                const s1 = getStats(c1Name);
                const s2 = getStats(c2Name);
                
                return NextResponse.json({
                    success: true,
                    message: `📊 Comparaison:\n${args.client1}: ${s1.trips} voyages, ${s1.totalPaid}€ payé, destinations: ${s1.destinations.join(', ') || 'aucune'}\n${args.client2}: ${s2.trips} voyages, ${s2.totalPaid}€ payé, destinations: ${s2.destinations.join(', ') || 'aucune'}\n🏆 ${s1.totalPaid >= s2.totalPaid ? args.client1 : args.client2} est le plus rentable (+${Math.abs(s1.totalPaid - s2.totalPaid)}€).`,
                });
            }

            // ─── INTELLIGENCE: apply_template ───
            if (tool === 'apply_template') {
                const keyword = (args.templateKeyword || '').toLowerCase();
                const clientName = (args.clientName || '').toLowerCase();
                
                // Find matching catalog items
                const catalogSnap = await base.collection('catalog').get();
                const matches = catalogSnap.docs.filter(d => {
                    const c = d.data();
                    return `${c.name || ''} ${c.description || ''} ${c.type || ''} ${c.location || ''} ${c.region || ''}`.toLowerCase().includes(keyword);
                }).slice(0, 5);
                
                if (matches.length === 0) {
                    return NextResponse.json({ success: false, message: `Aucune prestation trouvée pour "${args.templateKeyword}".` });
                }
                
                // Find client
                const contactsSnap = await base.collection('contacts').limit(50).get();
                const contact = contactsSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                const fullClientName = contact ? `${contact.data().firstName} ${contact.data().lastName}`.trim() : args.clientName;
                
                // Create quote with template prestations
                const totalAmount = matches.reduce((s, d) => s + (d.data().sellPrice || d.data().price || 0), 0);
                
                const quoteRef = await base.collection('quotes').add({
                    clientName: fullClientName,
                    clientId: contact?.id || null,
                    destination: matches[0].data().location || matches[0].data().region || keyword,
                    status: 'DRAFT',
                    totalAmount,
                    prestations: matches.map(d => ({
                        name: d.data().name,
                        price: d.data().sellPrice || d.data().price || 0,
                        type: d.data().type || d.data().category || '',
                    })),
                    source: 'voice-template',
                    templateKeyword: args.templateKeyword,
                    createdAt: FieldValue.serverTimestamp(),
                });
                
                const list = matches.map(d => `${d.data().name} (${d.data().sellPrice || d.data().price || 0}€)`).join(', ');
                
                return NextResponse.json({
                    success: true,
                    message: `📋 Template "${args.templateKeyword}" appliqué pour ${fullClientName}: ${list}. Total: ${totalAmount}€. Devis DRAFT créé. ID: ${quoteRef.id.substring(0, 6)}.`,
                    action: { type: 'quote', label: `Devis ${fullClientName}`, id: quoteRef.id, previewUrl: `/crm/quotes/${quoteRef.id}` },
                });
            }

            // ─── OPERATIONS: commission_tracker ───
            if (tool === 'commission_tracker') {
                const period = (args.period || 'ce-mois').toLowerCase();
                
                const [invoicesSnap, paymentsSnap, bookingsSnap] = await Promise.all([
                    base.collection('invoices').get(),
                    base.collection('payments').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                const now = new Date();
                const thisMonth = now.toISOString().substring(0, 7);
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);
                const thisYear = now.getFullYear().toString();
                
                // Filter by period
                const filterDate = (dateStr: string): boolean => {
                    if (!dateStr) return false;
                    switch (period) {
                        case 'ce-mois': return dateStr.startsWith(thisMonth);
                        case 'mois-dernier': return dateStr.startsWith(lastMonth);
                        case 'cette-année': case 'cette-annee': return dateStr.startsWith(thisYear);
                        default: return true;
                    }
                };
                
                // Revenue = paid invoices
                const revenue = invoicesSnap.docs
                    .filter(d => d.data().status === 'PAID' && filterDate(d.data().paidDate || d.data().createdAt?.toDate?.()?.toISOString()?.substring(0, 10) || ''))
                    .reduce((s, d) => s + (d.data().totalAmount || 0), 0);
                
                // Supplier costs = bookings
                const costs = bookingsSnap.docs
                    .filter(d => filterDate(d.data().date || d.data().createdAt?.toDate?.()?.toISOString()?.substring(0, 10) || ''))
                    .reduce((s, d) => s + (d.data().costPrice || d.data().amount || 0), 0);
                
                // Commission = revenue - supplier costs
                const commission = revenue - costs;
                const commissionRate = revenue > 0 ? Math.round((commission / revenue) * 100) : 0;
                
                // Per-client breakdown (top 3)
                const clientRevenue = new Map<string, number>();
                invoicesSnap.docs
                    .filter(d => d.data().status === 'PAID' && filterDate(d.data().paidDate || ''))
                    .forEach(d => {
                        const name = d.data().clientName || 'Inconnu';
                        clientRevenue.set(name, (clientRevenue.get(name) || 0) + (d.data().totalAmount || 0));
                    });
                const topClients = [...clientRevenue.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
                
                const periodLabel = period === 'ce-mois' ? 'ce mois' : period === 'mois-dernier' ? 'le mois dernier' : period === 'cette-année' ? 'cette année' : 'au total';
                
                return NextResponse.json({
                    success: true,
                    message: `💰 Commissions ${periodLabel}: ${revenue}€ revenus − ${costs}€ coûts prestataires = ${commission}€ commission (${commissionRate}%). ${topClients.length > 0 ? `Top clients: ${topClients.map(([n, v]) => `${n} (${v}€)`).join(', ')}.` : ''}`,
                });
            }

            // ─── OPERATIONS: supplier_score ───
            if (tool === 'supplier_score') {
                const supplierName = (args.supplierName || '').toLowerCase();
                
                const [suppliersSnap, bookingsSnap] = await Promise.all([
                    base.collection('suppliers').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                if (supplierName) {
                    // Single supplier analysis
                    const supplier = suppliersSnap.docs.find(d => (d.data().name || '').toLowerCase().includes(supplierName));
                    if (!supplier) {
                        return NextResponse.json({ success: false, message: `Prestataire "${args.supplierName}" non trouvé.` });
                    }
                    
                    const sName = supplier.data().name || '';
                    const bookings = bookingsSnap.docs.filter(d => (d.data().supplierName || '').toLowerCase().includes(supplierName));
                    const totalBookings = bookings.length;
                    const totalRevenue = bookings.reduce((s, d) => s + (d.data().amount || 0), 0);
                    
                    return NextResponse.json({
                        success: true,
                        message: `📊 ${sName}: ${totalBookings} réservation(s), ${totalRevenue}€ de CA. Catégorie: ${supplier.data().category || 'N/A'}. Contact: ${supplier.data().phone || supplier.data().email || 'N/A'}.`,
                    });
                } else {
                    // Global supplier ranking
                    const supplierStats = new Map<string, { bookings: number; revenue: number }>();
                    
                    bookingsSnap.docs.forEach(d => {
                        const name = d.data().supplierName || 'Inconnu';
                        const s = supplierStats.get(name) || { bookings: 0, revenue: 0 };
                        s.bookings++;
                        s.revenue += (d.data().amount || 0);
                        supplierStats.set(name, s);
                    });
                    
                    const ranked = [...supplierStats.entries()]
                        .sort((a, b) => b[1].bookings - a[1].bookings)
                        .slice(0, 5)
                        .map(([name, s], i) => `${i + 1}. ${name}: ${s.bookings} résa, ${s.revenue}€`);
                    
                    return NextResponse.json({
                        success: true,
                        message: `🏆 Top prestataires: ${ranked.join(' | ')}. ${suppliersSnap.size} prestataires au total.`,
                    });
                }
            }

            // ─── OPERATIONS: detect_anomalies ───
            if (tool === 'detect_anomalies') {
                const [paymentsSnap, invoicesSnap, contactsSnap, tasksSnap, quotesSnap] = await Promise.all([
                    base.collection('payments').get(),
                    base.collection('invoices').get(),
                    base.collection('contacts').limit(200).get(),
                    base.collection('tasks').get(),
                    base.collection('quotes').get(),
                ]);
                
                const anomalies: string[] = [];
                
                // 1. Duplicate payments (same client + amount + date)
                const paySignatures = new Map<string, number>();
                paymentsSnap.docs.forEach(d => {
                    const p = d.data();
                    const sig = `${(p.clientName || '').toLowerCase()}_${p.amount}_${p.date || ''}`;
                    paySignatures.set(sig, (paySignatures.get(sig) || 0) + 1);
                });
                const dupes = [...paySignatures.entries()].filter(([, c]) => c > 1);
                if (dupes.length > 0) anomalies.push(`⚠️ ${dupes.length} doublon(s) de paiement`);
                
                // 2. Orphan invoices (no matching contact)
                const contactNames = new Set(contactsSnap.docs.map(d => `${d.data().firstName || ''} ${d.data().lastName || ''}`.toLowerCase().trim()));
                const orphans = invoicesSnap.docs.filter(d => {
                    const name = (d.data().clientName || '').toLowerCase().trim();
                    return name && !contactNames.has(name);
                });
                if (orphans.length > 0) anomalies.push(`👻 ${orphans.length} facture(s) sans contact correspondant`);
                
                // 3. Very overdue tasks (>30 days)
                const today = new Date().toISOString().substring(0, 10);
                const veryOverdue = tasksSnap.docs.filter(d => {
                    const due = d.data().dueDate;
                    return due && due < today && d.data().status !== 'DONE';
                });
                const superOld = veryOverdue.filter(d => {
                    const daysOver = Math.round((Date.now() - new Date(d.data().dueDate).getTime()) / 86400000);
                    return daysOver > 30;
                });
                if (superOld.length > 0) anomalies.push(`⏰ ${superOld.length} tâche(s) en retard de +30 jours`);
                
                // 4. Quotes with no follow-up (SENT > 14 days)
                const staleQuotes = quotesSnap.docs.filter(d => {
                    if (d.data().status !== 'SENT') return false;
                    const sent = d.data().sentDate || d.data().createdAt?.toDate?.()?.toISOString()?.substring(0, 10) || '';
                    if (!sent) return false;
                    return Math.round((Date.now() - new Date(sent).getTime()) / 86400000) > 14;
                });
                if (staleQuotes.length > 0) anomalies.push(`📋 ${staleQuotes.length} devis envoyé(s) sans réponse depuis +14j`);
                
                // 5. Extreme payment amounts (>2x average)
                const amounts = paymentsSnap.docs.map(d => d.data().amount || 0).filter(a => a > 0);
                if (amounts.length > 0) {
                    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
                    const extreme = paymentsSnap.docs.filter(d => (d.data().amount || 0) > avg * 3);
                    if (extreme.length > 0) anomalies.push(`💰 ${extreme.length} paiement(s) anormalement élevé(s) (>3× la moyenne de ${Math.round(avg)}€)`);
                }
                
                if (anomalies.length === 0) {
                    return NextResponse.json({ success: true, message: '✅ Aucune anomalie détectée. Le CRM est propre !' });
                }
                
                return NextResponse.json({
                    success: true,
                    message: `🔍 ${anomalies.length} anomalie(s) détectée(s): ${anomalies.join('. ')}.`,
                });
            }

            // ─── OPERATIONS: auto_followup ───
            if (tool === 'auto_followup') {
                const clientName = (args.clientName || '').toLowerCase();
                const weeks = parseInt(args.weeks) || 3;
                const channel = (args.channel || 'mixte').toLowerCase();
                
                // Find client
                const contactSnap = await base.collection('contacts').limit(50).get();
                const contact = contactSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                const fullName = contact ? `${contact.data().firstName} ${contact.data().lastName}`.trim() : args.clientName;
                
                // Generate follow-up sequence
                const sequence: { week: number; type: string; title: string; dueDate: string }[] = [];
                const now = new Date();
                
                for (let w = 1; w <= Math.min(weeks, 8); w++) {
                    const dueDate = new Date(now.getTime() + w * 7 * 86400000);
                    const dueDateStr = dueDate.toISOString().substring(0, 10);
                    
                    let type = '';
                    let title = '';
                    
                    if (channel === 'email') {
                        type = 'email';
                        title = w === 1 ? `📧 Prise de contact` : w === weeks ? `📧 Relance finale` : `📧 Suivi semaine ${w}`;
                    } else if (channel === 'whatsapp') {
                        type = 'whatsapp';
                        title = w === 1 ? `💬 Premier message WhatsApp` : w === weeks ? `💬 Relance finale WhatsApp` : `💬 Suivi WhatsApp semaine ${w}`;
                    } else {
                        // Mixte: alternate
                        if (w === 1) { type = 'email'; title = `📧 Email de prise de contact`; }
                        else if (w === 2) { type = 'whatsapp'; title = `💬 WhatsApp de suivi`; }
                        else if (w === 3) { type = 'call'; title = `📞 Appel de relance`; }
                        else if (w % 2 === 0) { type = 'whatsapp'; title = `💬 WhatsApp semaine ${w}`; }
                        else { type = 'email'; title = `📧 Email semaine ${w}`; }
                    }
                    
                    sequence.push({ week: w, type, title, dueDate: dueDateStr });
                    
                    // Create task for each touchpoint
                    await base.collection('tasks').add({
                        title: `${title} — ${fullName}`,
                        description: `Séquence de relance automatique (${channel}) — semaine ${w}/${weeks}`,
                        dueDate: dueDateStr,
                        priority: w <= 2 ? 'HIGH' : 'MEDIUM',
                        status: 'TODO',
                        source: 'voice-auto-followup',
                        clientId: contact?.id || null,
                        clientName: fullName,
                        followupType: type,
                        followupWeek: w,
                        followupTotal: weeks,
                        createdAt: FieldValue.serverTimestamp(),
                    });
                }
                
                // Save sequence metadata
                await base.collection('followupSequences').add({
                    clientName: fullName,
                    clientId: contact?.id || null,
                    channel,
                    weeks,
                    sequence,
                    createdAt: FieldValue.serverTimestamp(),
                    source: 'voice-agent',
                });
                
                const plan = sequence.map(s => `S${s.week}: ${s.title} (${s.dueDate})`).join(' → ');
                
                return NextResponse.json({
                    success: true,
                    message: `🔄 Séquence de relance créée pour ${fullName} sur ${weeks} semaines (${channel}): ${plan}. ${sequence.length} tâche(s) planifiées.`,
                });
            }

            // ─── DEEP: client_timeline ───
            if (tool === 'client_timeline') {
                const clientName = (args.clientName || '').toLowerCase();
                
                const [tripsSnap, paymentsSnap, quotesSnap, activitiesSnap, tasksSnap] = await Promise.all([
                    base.collection('trips').get(),
                    base.collection('payments').get(),
                    base.collection('quotes').get(),
                    base.collection('activities').get(),
                    base.collection('tasks').get(),
                ]);
                
                const events: { date: number; dateStr: string; label: string }[] = [];
                
                // Trips
                tripsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName)).forEach(d => {
                    const t = d.data();
                    const date = t.createdAt?.toDate?.()?.getTime() || new Date(t.startDate || '').getTime() || 0;
                    events.push({ date, dateStr: new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), label: `✈️ Voyage ${t.destination || ''}` });
                });
                
                // Payments
                paymentsSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName)).forEach(d => {
                    const p = d.data();
                    const date = new Date(p.date || p.createdAt?.toDate?.() || '').getTime();
                    events.push({ date, dateStr: new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), label: `💰 Paiement ${p.amount || 0}€` });
                });
                
                // Quotes
                quotesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName)).forEach(d => {
                    const q = d.data();
                    const date = q.createdAt?.toDate?.()?.getTime() || 0;
                    events.push({ date, dateStr: new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), label: `📝 Devis ${q.totalAmount || 0}€ (${q.status || ''})` });
                });
                
                // Activities
                activitiesSnap.docs.filter(d => (d.data().clientName || '').toLowerCase().includes(clientName)).forEach(d => {
                    const a = d.data();
                    const date = a.createdAt?.toDate?.()?.getTime() || 0;
                    events.push({ date, dateStr: new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), label: `📧 ${a.type || 'Interaction'}: ${(a.description || a.title || '').substring(0, 30)}` });
                });
                
                events.sort((a, b) => a.date - b.date);
                
                if (events.length === 0) {
                    return NextResponse.json({ success: true, message: `Aucun historique trouvé pour "${args.clientName}".` });
                }
                
                const timeline = events.map(e => `${e.dateStr}: ${e.label}`).join(' → ');
                
                return NextResponse.json({
                    success: true,
                    message: `📖 Histoire de ${args.clientName} (${events.length} événements): ${timeline}.`,
                });
            }

            // ─── DEEP: conversion_funnel ───
            if (tool === 'conversion_funnel') {
                const leadsSnap = await base.collection('leads').get();
                
                const stages: Record<string, number> = {
                    LEAD: 0, QUALIFIED: 0, PROPOSAL: 0, NEGOTIATION: 0, WON: 0, LOST: 0,
                };
                
                leadsSnap.docs.forEach(d => {
                    const status = (d.data().status || 'LEAD').toUpperCase();
                    // Count current stage AND all stages before it (they passed through)
                    const stageOrder = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'];
                    const idx = stageOrder.indexOf(status);
                    if (idx >= 0) {
                        for (let i = 0; i <= idx; i++) stages[stageOrder[i]]++;
                    }
                    if (status === 'LOST') stages.LOST++;
                });
                
                const total = leadsSnap.size;
                const convRate = (from: number, to: number) => from > 0 ? Math.round((to / from) * 100) : 0;
                
                const funnel = [
                    `🔝 Leads: ${stages.LEAD} (100%)`,
                    `🎯 Qualifiés: ${stages.QUALIFIED} (${convRate(stages.LEAD, stages.QUALIFIED)}%)`,
                    `📝 Proposition: ${stages.PROPOSAL} (${convRate(stages.LEAD, stages.PROPOSAL)}%)`,
                    `🤝 Négociation: ${stages.NEGOTIATION} (${convRate(stages.LEAD, stages.NEGOTIATION)}%)`,
                    `🏆 Gagnés: ${stages.WON} (${convRate(stages.LEAD, stages.WON)}%)`,
                ].join(' → ');
                
                return NextResponse.json({
                    success: true,
                    message: `📊 Entonnoir de conversion (${total} leads): ${funnel}. ❌ Perdus: ${stages.LOST}. Taux final: ${convRate(stages.LEAD, stages.WON)}%.`,
                });
            }

            // ─── DEEP: revenue_attribution ───
            if (tool === 'revenue_attribution') {
                const [paymentsSnap, tripsSnap, leadsSnap, bookingsSnap] = await Promise.all([
                    base.collection('payments').get(),
                    base.collection('trips').get(),
                    base.collection('leads').get(),
                    base.collection('supplierBookings').get(),
                ]);
                
                // By destination
                const byDest = new Map<string, number>();
                tripsSnap.docs.forEach(d => {
                    const dest = d.data().destination || 'Inconnu';
                    const clientName = (d.data().clientName || '').toLowerCase();
                    const rev = paymentsSnap.docs
                        .filter(p => (p.data().clientName || '').toLowerCase().includes(clientName))
                        .reduce((s, p) => s + (p.data().amount || 0), 0);
                    byDest.set(dest, (byDest.get(dest) || 0) + rev);
                });
                const topDest = [...byDest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
                
                // By lead source
                const bySource = new Map<string, number>();
                leadsSnap.docs.filter(d => d.data().status === 'WON').forEach(d => {
                    const source = d.data().source || d.data().origin || 'Direct';
                    const clientName = (d.data().clientName || '').toLowerCase();
                    const rev = paymentsSnap.docs
                        .filter(p => (p.data().clientName || '').toLowerCase().includes(clientName))
                        .reduce((s, p) => s + (p.data().amount || 0), 0);
                    bySource.set(source, (bySource.get(source) || 0) + rev);
                });
                const topSource = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
                
                // By supplier
                const bySupplier = new Map<string, number>();
                bookingsSnap.docs.forEach(d => {
                    const name = d.data().supplierName || 'Inconnu';
                    bySupplier.set(name, (bySupplier.get(name) || 0) + (d.data().amount || 0));
                });
                const topSupplier = [...bySupplier.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
                
                const totalRevenue = paymentsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
                
                return NextResponse.json({
                    success: true,
                    message: `📊 Attribution revenus (${totalRevenue}€ total):\n🌍 Par destination: ${topDest.map(([d, v]) => `${d} ${v}€`).join(', ') || 'N/A'}\n📢 Par source: ${topSource.map(([s, v]) => `${s} ${v}€`).join(', ') || 'N/A'}\n🏢 Par prestataire: ${topSupplier.map(([s, v]) => `${s} ${v}€`).join(', ') || 'N/A'}`,
                });
            }

            // ─── DEEP: set_preference ───
            if (tool === 'set_preference') {
                const clientName = (args.clientName || '').toLowerCase();
                const preference = args.preference || '';
                
                const contactsSnap = await base.collection('contacts').limit(100).get();
                const contact = contactsSnap.docs.find(d => {
                    const c = d.data();
                    return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(clientName);
                });
                
                if (!contact) {
                    return NextResponse.json({ success: false, message: `Client "${args.clientName}" non trouvé.` });
                }
                
                const existing = contact.data().preferences || [];
                const prefs = [...existing, preference];
                
                await base.collection('contacts').doc(contact.id).update({
                    preferences: prefs,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                
                const fullName = `${contact.data().firstName} ${contact.data().lastName}`.trim();
                
                return NextResponse.json({
                    success: true,
                    message: `⭐ Préférence ajoutée pour ${fullName}: "${preference}". ${prefs.length} préférence(s) enregistrée(s): ${prefs.join(', ')}.`,
                });
            }

            // ─── READ: search_catalog ───
            if (tool === 'search_catalog') {
                const query = (args.query || '').toLowerCase();
                const region = (args.region || '').toLowerCase();
                const maxPrice = args.maxPrice ? parseFloat(args.maxPrice) : null;
                
                const snap = await base.collection('catalog').get();
                const results = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((item: any) => {
                        const text = `${item.name || ''} ${item.description || ''} ${item.type || ''} ${item.location || ''} ${item.supplier || ''} ${item.remarks || ''}`.toLowerCase();
                        const matchQuery = text.includes(query);
                        const matchRegion = !region || (item.location || '').toLowerCase().includes(region) || text.includes(region);
                        const sellPrice = item.netCost ? Math.round(item.netCost * (1 + (item.recommendedMarkup || 10) / 100)) : 0;
                        const matchPrice = !maxPrice || sellPrice <= maxPrice;
                        return matchQuery && matchRegion && matchPrice;
                    })
                    .slice(0, 5)
                    .map((item: any) => {
                        const sellPrice = item.netCost ? Math.round(item.netCost * (1 + (item.recommendedMarkup || 10) / 100)) : 0;
                        return {
                            id: item.id,
                            name: item.name || 'Prestation',
                            description: (item.description || '').substring(0, 120),
                            region: item.location || '',
                            type: item.type || '',
                            duration: item.duration || '',
                            capacity: item.capacity || '',
                            buyPrice: item.netCost || 0,
                            sellPrice,
                        };
                    });
                
                return NextResponse.json({ catalog: results });
            }

            // ─── READ: get_unpaid_invoices (Travel) ───
            if (tool === 'get_unpaid_invoices') {
                const snap = await base.collection('invoices')
                    .limit(30)
                    .get();
                const unpaid = snap.docs
                    .map(d => { const inv = d.data(); return { id: d.id, clientName: inv.clientName || 'N/A', amount: inv.totalAmount || inv.amount || 0, status: inv.status || '', dueDate: inv.dueDate || '' }; })
                    .filter(i => ['unpaid', 'overdue', 'pending', 'DRAFT'].includes(i.status));
                const total = unpaid.reduce((s, i) => s + i.amount, 0);
                return NextResponse.json({ invoices: unpaid, total, summary: unpaid.length > 0 ? `${unpaid.length} facture(s) impayée(s) — total ${total}€` : 'Aucune facture impayée.' });
            }
        }

        // ──────────────────────────────────────────
        //  LEGAL TOOLS
        // ──────────────────────────────────────────
        if (vertical === 'legal') {

            // ─── READ: get_dossiers ───
            if (tool === 'get_dossiers') {
                const snap = await base.collection('dossiers').orderBy('updatedAt', 'desc').limit(5).get();
                const dossiers = snap.docs
                    .map(d => { const dos = d.data(); return { id: d.id, title: dos.title || dos.reference || 'Dossier sans titre', client: dos.clientName || dos.client?.name || 'Client', type: dos.type || null, status: dos.status || 'active', nextDeadline: dos.nextDeadline || dos.deadline || null }; })
                    .filter(d => ['active', 'pending', 'open', 'urgent'].includes(d.status));
                return NextResponse.json({ dossiers });
            }

            // ─── READ: get_upcoming_deadlines ───
            if (tool === 'get_upcoming_deadlines') {
                const snap = await base.collection('tasks').orderBy('dueDate', 'asc').limit(8).get();
                const now = new Date();
                const in30 = new Date(now.getTime() + 30 * 86400000);
                const deadlines = snap.docs
                    .map(d => { const t = d.data(); return { id: d.id, title: t.title || 'Échéance', dueDate: t.dueDate || null, dossier: t.dossierTitle || t.dossier || null, priority: t.priority || 'medium' }; })
                    .filter(d => { if (!d.dueDate) return false; const dd = new Date(d.dueDate); return dd >= now && dd <= in30; });
                return NextResponse.json({ deadlines });
            }

            // ─── READ: get_unpaid_invoices ───
            if (tool === 'get_unpaid_invoices') {
                const snap = await base.collection('invoices').orderBy('dueDate', 'asc').limit(5).get();
                const invoices = snap.docs
                    .map(d => { const inv = d.data(); return { id: d.id, client: inv.clientName || 'Client', amount: inv.amount || inv.total || 0, dueDate: inv.dueDate || null, status: inv.status || 'unpaid', dossier: inv.dossierTitle || null }; })
                    .filter(inv => ['unpaid', 'overdue', 'pending'].includes(inv.status));
                const total = invoices.reduce((s, i) => s + i.amount, 0);
                return NextResponse.json({ invoices, total });
            }

            // ─── READ: get_recent_emails (legal) ───
            if (tool === 'get_recent_emails') {
                const snap = await base.collection('emails').orderBy('receivedAt', 'desc').limit(5).get();
                const emails = snap.docs.map(d => { const e = d.data(); return { id: d.id, from: e.from || e.senderName || 'Inconnu', subject: e.subject || '(Sans objet)', snippet: (e.body || e.snippet || '').substring(0, 150) }; });
                return NextResponse.json({ emails });
            }

            // ─── READ: get_client_info (legal) ───
            if (tool === 'get_client_info') {
                const query = (args.query || '').toLowerCase();
                const snap = await base.collection('contacts').limit(50).get();
                const clients = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((c: any) => `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(query) || (c.email || '').toLowerCase().includes(query))
                    .slice(0, 3)
                    .map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), email: c.email, phone: c.phone }));
                return NextResponse.json({ clients });
            }

            // ─── WRITE: create_email_draft (legal) ───
            if (tool === 'create_email_draft') {
                let clientId = '';
                let clientFullName = args.toName || 'Destinataire';
                if (args.toName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes((args.toName || '').toLowerCase());
                    });
                    if (match) {
                        clientId = match.id;
                        const c = match.data();
                        clientFullName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
                    }
                }

                const docRef = await base.collection('messages').add({
                    clientId,
                    clientName: clientFullName,
                    channel: 'EMAIL',
                    direction: 'OUTBOUND',
                    recipientType: 'CLIENT',
                    content: `**${args.subject}**\n\n${args.body}`,
                    isRead: true,
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Brouillon créé pour ${clientFullName} : "${args.subject}". Visible dans la Boîte mail.`,
                    action: { type: 'email', label: `Email → ${clientFullName}`, id: docRef.id, previewUrl: `/crm/mails` },
                });
            }

            // ─── WRITE: create_invoice (legal) ───
            if (tool === 'create_invoice') {
                const amount = args.amount ? parseFloat(args.amount) : 0;
                const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
                const now = new Date();
                const dueDate = args.dueDate || new Date(now.getTime() + 30 * 24 * 3600000).toISOString().split('T')[0];

                let clientId = '';
                if (args.clientName) {
                    const contactSnap = await base.collection('contacts').limit(50).get();
                    const match = contactSnap.docs.find(d => {
                        const c = d.data();
                        return `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes((args.clientName || '').toLowerCase());
                    });
                    if (match) clientId = match.id;
                }

                const items = [{
                    description: args.description || 'Honoraires',
                    quantity: 1,
                    unitPrice: amount,
                    total: amount,
                    taxRate: 20,
                }];

                const subtotal = amount;
                const taxTotal = Math.round(subtotal * 0.2);
                const totalAmount = subtotal + taxTotal;

                const docRef = await base.collection('invoices').add({
                    invoiceNumber,
                    type: 'CLIENT',
                    tripId: '',
                    clientId,
                    clientName: args.clientName || 'Client',
                    issueDate: now.toISOString().split('T')[0],
                    dueDate,
                    items,
                    subtotal,
                    taxTotal,
                    totalAmount,
                    amountPaid: 0,
                    currency: 'EUR',
                    status: 'DRAFT',
                    notes: args.description || '',
                    dossierName: args.dossierName || null,
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Facture d'honoraires ${invoiceNumber} de ${totalAmount}€ TTC créée pour ${args.clientName}. Visible dans Factures.`,
                    action: { type: 'invoice', label: `Facture ${args.clientName} — ${totalAmount}€`, id: docRef.id, previewUrl: `/crm/invoices` },
                });
            }

            // ─── WRITE: add_note_to_dossier ───
            if (tool === 'add_note_to_dossier') {
                const query = (args.dossierName || '').toLowerCase();
                const snap = await base.collection('dossiers').limit(30).get();
                const match = snap.docs.find(d => (d.data().title || d.data().reference || '').toLowerCase().includes(query));
                if (match) {
                    const noteRef = await base.collection('dossiers').doc(match.id).collection('notes').add({
                        content: args.note,
                        source: 'voice-agent',
                        createdAt: FieldValue.serverTimestamp(),
                    });
                    return NextResponse.json({
                        success: true,
                        message: `Note ajoutée sur le dossier "${args.dossierName}".`,
                        action: { type: 'note', label: `Note — ${args.dossierName}`, id: noteRef.id, previewUrl: `/crm/dossiers/${match.id}` },
                    });
                }
                return NextResponse.json({ success: false, message: `Dossier "${args.dossierName}" introuvable.` });
            }

            // ─── WRITE: update_dossier_status ───
            if (tool === 'update_dossier_status') {
                const query = (args.dossierName || '').toLowerCase();
                const snap = await base.collection('dossiers').limit(30).get();
                const match = snap.docs.find(d => (d.data().title || d.data().reference || '').toLowerCase().includes(query));
                if (match) {
                    await base.collection('dossiers').doc(match.id).update({
                        status: args.status,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                    const statusLabels: Record<string, string> = { active: 'Actif', pending: 'En attente', closed: 'Clôturé', archived: 'Archivé', urgent: 'Urgent' };
                    return NextResponse.json({
                        success: true,
                        message: `Dossier "${args.dossierName}" mis à jour : statut "${statusLabels[args.status] || args.status}".`,
                        action: { type: 'dossier', label: `${args.dossierName} → ${statusLabels[args.status] || args.status}`, id: match.id, previewUrl: `/crm/dossiers/${match.id}` },
                    });
                }
                return NextResponse.json({ success: false, message: `Dossier "${args.dossierName}" introuvable.` });
            }

            // ─── WRITE: create_reminder (legal) ───
            if (tool === 'create_reminder') {
                const docRef = await base.collection('tasks').add({
                    title: args.title,
                    dossierName: args.dossierName || null,
                    dueDate: args.dueDate,
                    priority: args.priority || 'high',
                    type: 'deadline',
                    status: 'pending',
                    source: 'voice-agent',
                    createdAt: FieldValue.serverTimestamp(),
                });
                return NextResponse.json({
                    success: true,
                    message: `Échéance "${args.title}" créée pour le ${new Date(args.dueDate).toLocaleDateString('fr-FR')}${args.dossierName ? ' — dossier ' + args.dossierName : ''}.`,
                    action: { type: 'reminder', label: args.title, id: docRef.id, previewUrl: `/crm/planning` },
                });
            }
        }

        return NextResponse.json({ error: `Tool "${tool}" not found for vertical "${vertical}"` }, { status: 404 });

    } catch (error: any) {
        console.error('[voice-data]', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Erreur serveur', empty: true }, { status: 200 });
    }
}
