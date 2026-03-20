'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { generatePreDepartureEmail } from '@/src/lib/email/templates';

/**
 * GET /api/cron/pre-departure
 * 
 * Automated cron job: sends "Avant le Départ" emails to clients
 * whose trips depart in exactly 3 days.
 * 
 * Trigger via Vercel Cron or external scheduler daily at 09:00.
 */
export async function GET(req: NextRequest) {
    // Optional cron secret check
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const target = new Date(now);
    target.setDate(target.getDate() + 3);
    const targetDate = target.toISOString().split('T')[0]; // YYYY-MM-DD

    let sent = 0;
    const errors: string[] = [];

    try {
        // Iterate all tenants
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            const base = adminDb.collection('tenants').doc(tenantId);

            // Fetch business config for branding
            let agencyName = 'Votre Conciergerie';
            let logoUrl = '';
            try {
                const cfgDoc = await base.collection('site_config').doc('main').get();
                const cfg = cfgDoc.data();
                if (cfg?.business?.name) agencyName = cfg.business.name;
                else if (cfg?.global?.siteName) agencyName = cfg.global.siteName;
                if (cfg?.global?.logo) logoUrl = cfg.global.logo;
            } catch { /* defaults */ }

            // Find trips departing in 3 days
            const tripsSnap = await base.collection('trips')
                .where('startDate', '==', targetDate)
                .get();

            for (const tripDoc of tripsSnap.docs) {
                const trip = tripDoc.data();
                if (!trip.clientId && !trip.clientEmail) continue;

                // Get client email
                let clientEmail = trip.clientEmail || '';
                let clientName = trip.clientName || 'Cher voyageur';

                if (trip.clientId && !clientEmail) {
                    try {
                        const contactDoc = await base.collection('contacts').doc(trip.clientId).get();
                        const contact = contactDoc.data();
                        if (contact?.email) clientEmail = contact.email;
                        if (contact?.firstName) clientName = `${contact.firstName} ${contact.lastName || ''}`.trim();
                    } catch { /* skip */ }
                }

                if (!clientEmail) continue;

                // Generate the pre-departure email
                const destination = trip.destination || trip.title || 'votre destination';
                const departureDate = trip.startDate || targetDate;

                // Try to get itinerary tips
                let tips: string[] = [];
                try {
                    const itinerarySnap = await base.collection('trips').doc(tripDoc.id).collection('itinerary').limit(1).get();
                    if (!itinerarySnap.empty) {
                        const dayData = itinerarySnap.docs[0].data();
                        if (dayData.tips) tips = dayData.tips;
                    }
                } catch { /* no tips */ }

                const htmlBody = generatePreDepartureEmail({
                    agencyName,
                    logoUrl: logoUrl || undefined,
                    clientName,
                    destination,
                    departureDate,
                    daysUntilDeparture: 3,
                    tripShareUrl: trip.shareUrl || '#',
                    tips: tips.length > 0 ? tips : undefined,
                    emergencyPhone: trip.emergencyPhone || undefined,
                });

                // Send via internal Gmail API
                try {
                    const origin = req.nextUrl.origin || 'http://localhost:3000';
                    const sendRes = await fetch(`${origin}/api/gmail/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: clientEmail,
                            subject: `✈️ J-3 avant ${destination} — Préparez votre départ !`,
                            bodyHtml: htmlBody,
                            message: `Bonjour ${clientName.split(' ')[0]}, votre voyage à ${destination} approche ! Consultez votre checklist de départ.`,
                            clientName,
                            recipientType: 'CLIENT',
                            _cronBypass: true, // skip auth for internal cron
                        }),
                    });

                    if (sendRes.ok) {
                        sent++;
                    } else {
                        errors.push(`Failed to send to ${clientEmail}: ${sendRes.status}`);
                    }
                } catch (e: any) {
                    errors.push(`Error sending to ${clientEmail}: ${e.message}`);
                }
            }
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        sent,
        targetDate,
        errors: errors.length > 0 ? errors : undefined,
        message: sent > 0
            ? `${sent} email(s) "Avant le Départ" envoyé(s) pour les départs du ${targetDate}.`
            : `Aucun voyage prévu le ${targetDate}.`,
    });
}
