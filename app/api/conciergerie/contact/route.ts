import { NextResponse } from 'next/server';
import { sendEmail } from '@/src/lib/gmail/api';
import { generateAcknowledgmentEmail } from '@/src/lib/email/templates';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Honeypot anti-spam: if hidden field is filled, silently discard (bot detected)
        if (data._hp_website) {
            return NextResponse.json({ success: true }); // Fake success to not alert bots
        }

        // Resolve tenant
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        const tenantId = tenantsSnap.empty ? null : tenantsSnap.docs[0].id;

        // Fetch custom logo + business name from site-config (correct path)
        let customLogoUrl: string | undefined;
        let agencyName: string | undefined;
        try {
            if (tenantId) {
                const configSnap = await adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').get();
                const configData = configSnap.data();
                if (configData?.global?.logo) customLogoUrl = configData.global.logo;
                if (configData?.business?.name) agencyName = configData.business.name;
            }
        } catch { /* fallback to default */ }

        // Structure du message optimisée pour l'analyse par l'Agent IA (Gemini) dans la boîte de réception
        const bodyText = `
NOUVELLE DEMANDE DE VOYAGE SUR-MESURE

--- DEBUT DONNEES IA ---
Nom: ${data.lastName}
Prénom: ${data.firstName}
Email: ${data.email}
Téléphone: ${data.phone || 'Non renseigné'}
Destination: ${data.destination}
Dates: ${data.dates}
Budget total: ${data.budget}
Nombre de voyageurs: ${data.pax}
Vibe / Style: ${data.vibe}
Demandes spéciales: ${data.notes || 'Aucune'}
--- FIN DONNEES IA ---

Ce message a été généré automatiquement depuis le formulaire de contact du site. 
L'agent Email IA devrait le traiter et l'ajouter automatiquement au CRM.
    `.trim();

        // 1. Envoi de l'email à la boîte Luna (pour traitement CRM)
        await sendEmail({
            to: 'ckartier@gmail.com',
            subject: `[Luna B2C] Nouvelle Demande - ${data.firstName} ${data.lastName} - ${data.destination}`,
            bodyText: bodyText,
        });

        // 2. Auto-create CRM lead in Firestore
        if (tenantId) {
            try {
                await adminDb.collection('tenants').doc(tenantId).collection('leads').add({
                    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Contact Site Web',
                    email: data.email || '',
                    phone: data.phone || '',
                    destination: data.destination || '',
                    dates: data.dates || '',
                    budget: data.budget || '',
                    pax: data.pax || '2',
                    notes: data.notes || '',
                    vibe: data.vibe || '',
                    status: 'NEW',
                    source: 'WEBSITE',
                    stage: 'lead',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            } catch (leadErr) {
                console.error('[Contact] Erreur création lead CRM:', leadErr);
            }
        }

        // 3. Envoi automatique de l'accusé de réception au client
        if (data.email) {
            try {
                const ackHtml = generateAcknowledgmentEmail({
                    clientName: `${data.firstName} ${data.lastName}`,
                    destination: data.destination || undefined,
                    ...(customLogoUrl && { logoUrl: customLogoUrl }),
                    ...(agencyName && { agencyName }),
                });
                await sendEmail({
                    to: data.email,
                    subject: `Votre demande a bien été reçue — Votre Conciergerie ✨`,
                    bodyText: `Bonjour ${data.firstName}, nous avons bien reçu votre demande${data.destination ? ` pour ${data.destination}` : ''}. Votre concierge reviendra vers vous dans les prochaines heures.`,
                    bodyHtml: ackHtml,
                });
            } catch (ackErr) {
                // Ne pas bloquer la réponse si l'accusé de réception échoue
                console.error('[Contact] Erreur envoi accusé de réception:', ackErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erreur lors de l\'envoi de la demande:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

