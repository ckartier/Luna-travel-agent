import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notifySupplierBooking } from '@/src/lib/whatsapp/api';

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

        // ─── open_record (shared) ───
        if (tool === 'open_record') {
            const query = (args.query || '').toLowerCase();
            const limit = 20;
            const [contactsSnap, leadsSnap, tripsSnap, quotesSnap, invoicesSnap] = await Promise.all([
                base.collection('contacts').limit(limit).get(),
                base.collection('leads').limit(limit).get(),
                base.collection(vertical === 'legal' ? 'dossiers' : 'trips').limit(limit).get(),
                base.collection('quotes').limit(limit).get(),
                base.collection('invoices').limit(limit).get(),
            ]);

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
            const [contactsSnap, leadsSnap, tripsSnap] = await Promise.all([
                base.collection('contacts').limit(30).get(),
                base.collection('leads').limit(20).get(),
                base.collection(vertical === 'legal' ? 'dossiers' : 'trips').limit(20).get(),
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
            const results = [...contacts, ...leads, ...items];
            return NextResponse.json({
                results,
                summary: results.length > 0
                    ? results.join(' | ')
                    : `Aucun résultat pour "${args.query}".`,
            });
        }

        // ──────────────────────────────────────────
        //  TRAVEL TOOLS
        // ──────────────────────────────────────────
        if (vertical === 'travel') {

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

                const items = [{
                    description: `Voyage ${args.destination || 'Sur mesure'}${args.notes ? ' — ' + args.notes : ''}`,
                    quantity: 1,
                    netCost: budget > 0 ? Math.round(budget * 0.7) : 0,
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

            // ─── READ: search_catalog ───
            if (tool === 'search_catalog') {
                const query = (args.query || '').toLowerCase();
                const region = (args.region || '').toLowerCase();
                const maxPrice = args.maxPrice ? parseFloat(args.maxPrice) : null;
                
                const snap = await base.collection('catalog').get();
                const results = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter((item: any) => {
                        const text = `${item.name || ''} ${item.description || ''} ${item.category || ''} ${item.region || ''} ${item.tags?.join(' ') || ''}`.toLowerCase();
                        const matchQuery = text.includes(query);
                        const matchRegion = !region || (item.region || '').toLowerCase().includes(region) || text.includes(region);
                        const matchPrice = !maxPrice || (item.sellPrice || item.price || 0) <= maxPrice;
                        return matchQuery && matchRegion && matchPrice;
                    })
                    .slice(0, 5)
                    .map((item: any) => ({
                        id: item.id,
                        name: item.name || 'Prestation',
                        description: (item.description || '').substring(0, 100),
                        region: item.region || '',
                        category: item.category || '',
                        buyPrice: item.buyPrice || item.costPrice || 0,
                        sellPrice: item.sellPrice || item.price || 0,
                    }));
                
                return NextResponse.json({ catalog: results });
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
