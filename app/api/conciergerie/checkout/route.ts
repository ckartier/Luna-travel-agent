export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { sendEmail } from '@/src/lib/gmail/api';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cart, total, user } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 1. Get primary tenant
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No agency tenant found' }, { status: 404 });
        }
        const tenantId = tenantsSnap.docs[0].id;

        const timestamp = new Date();
        const clientName = user?.displayName || user?.email || 'Client Espace Personnel';

        // 2. Format a summary of destinations / activities requested
        const destinations = cart.map((i: any) => i.location || i.name).filter((v: any, i: any, a: any) => a.indexOf(v) === i).join(', ');

        // 3. Create a Lead in the CRM Pipeline directly
        const leadRef = adminDb.collection('tenants').doc(tenantId).collection('leads').doc();
        await leadRef.set({
            clientName: clientName,
            destination: destinations || 'Divers',
            dates: 'À définir (via Espace Client)',
            budget: `${total} EUR`,
            pax: 'À définir',
            status: 'NEW', // New lead in the 'NOUVEAU' column of the CRM
            source: 'Espace Client Checkout',
            cartItems: cart, // Store full cart for reference
            createdAt: timestamp,
            updatedAt: timestamp,
        });

        // 4. Also optionally notify by email to Luna Conciergerie so agent gets an alert!
        try {
            const bodyText = `
NOUVELLE DEMANDE / PAIEMENT DEPUIS L'ESPACE CLIENT MOCK:

Client: ${clientName}
Email: ${user?.email || 'Non renseigné'}
Montant total pré-validé : ${total} €

Éléments sélectionnés :
${cart.map((item: any) => `- ${item.name} (${item.location || ''}) - ${item.clientPrice}`).join('\n')}

Un nouveau Deal a été ajouté automatiquement dans le CRM (Pipeline - Colonne NOUVEAU).
            `.trim();

            await sendEmail({
                to: 'lunacconciergerie@gmail.com', // B2C incoming email
                subject: `[Espace Client] Nouvelle commande - ${clientName}`,
                bodyText: bodyText,
            });
        } catch (emailErr) {
            console.error('Failed sending checkout email notification', emailErr);
            // Non-blocking if email fails, as long as it's in CRM!
        }

        return NextResponse.json({ success: true, leadId: leadRef.id });
    } catch (error: any) {
        console.error('Error in checkout API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
