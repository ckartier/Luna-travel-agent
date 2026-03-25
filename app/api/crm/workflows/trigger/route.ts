export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '@/src/lib/gmail/api';

/**
 * POST /api/crm/workflows/trigger
 * Intercepts CRM events (e.g. pipeline stage changes) to trigger automated workflows like emails.
 * Note: WhatsApp is strictly reserved for suppliers. Clients only receive Emails.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, tenantId, payload } = body;

        if (!tenantId || !event || !payload) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const base = adminDb.collection('tenants').doc(tenantId);

        // ══════════════════════════════════════════
        // 1. EVENT: LEAD STAGE CHANGED
        // ══════════════════════════════════════════
        if (event === 'lead_stage_changed') {
            const { leadId, newStage, oldStage } = payload;
            
            // Fetch lead and associated contact details
            const leadDoc = await base.collection('leads').doc(leadId).get();
            if (!leadDoc.exists) {
                return NextResponse.json({ success: false, error: 'Lead not found' });
            }
            
            const lead = leadDoc.data() as any;
            if (!lead.clientId) {
                return NextResponse.json({ success: true, message: 'No client associated with this lead, no email sent.' });
            }

            const clientDoc = await base.collection('contacts').doc(lead.clientId).get();
            if (!clientDoc.exists) {
                return NextResponse.json({ success: true, message: 'Client not found.' });
            }

            const client = clientDoc.data() as any;
            if (!client.email) {
                return NextResponse.json({ success: true, message: 'Client has no email.' });
            }

            const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim();

            // A) "Proposal" Stage -> Automated Email
            if (newStage === 'proposal' && oldStage !== 'proposal') {
                const subject = `Proposition pour votre projet de voyage : ${lead.name || lead.destination || 'Sur mesure'}`;
                const bodyText = `Bonjour ${clientName},\n\nNous avons le plaisir de vous informer que la proposition pour votre projet "${lead.name || lead.destination}" est désormais en cours de finalisation.\n\nVous la recevrez très prochainement. N'hésitez pas à nous contacter si vous avez des questions entre temps.\n\nCordialement,\nVotre Conciergerie.`;
                
                await sendEmail({
                    to: client.email,
                    subject,
                    bodyText
                });

                // Log into CRM messages
                await base.collection('messages').add({
                    clientId: clientDoc.id,
                    clientName,
                    channel: 'EMAIL',
                    direction: 'OUTBOUND',
                    recipientType: 'CLIENT',
                    content: `**${subject}**\n\n${bodyText}`,
                    isRead: true,
                    source: 'automated-workflow',
                    createdAt: FieldValue.serverTimestamp(),
                });

                return NextResponse.json({ success: true, action: 'Email sent for proposal stage' });
            }

            // B) "Won" Stage -> Automated Email
            if (newStage === 'won' && oldStage !== 'won') {
                const subject = `Confirmation de votre voyage : ${lead.name || lead.destination || 'Sur mesure'}`;
                const bodyText = `Bonjour ${clientName},\n\nMerci pour votre confiance ! Nous confirmons la prise en charge de votre projet "${lead.name || lead.destination}".\n\nNous commençons dès à présent les réservations et vous tiendrons informé de chaque étape.\n\nCordialement,\nVotre Conciergerie.`;
                
                await sendEmail({
                    to: client.email,
                    subject,
                    bodyText
                });

                // Log into CRM messages
                await base.collection('messages').add({
                    clientId: clientDoc.id,
                    clientName,
                    channel: 'EMAIL',
                    direction: 'OUTBOUND',
                    recipientType: 'CLIENT',
                    content: `**${subject}**\n\n${bodyText}`,
                    isRead: true,
                    source: 'automated-workflow',
                    createdAt: FieldValue.serverTimestamp(),
                });

                return NextResponse.json({ success: true, action: 'Email sent for won stage' });
            }

            return NextResponse.json({ success: true, message: `No workflow rule configured for transition ${oldStage} -> ${newStage}` });
        }

        return NextResponse.json({ success: false, error: 'Event not recognized' });
    } catch (error: any) {
        console.error('[Workflows API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
