import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notifySupplierBooking } from '@/src/lib/whatsapp/api';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any });

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const email = session.customer_email;
            const source = session.metadata?.source;

            // ── B2C Conciergerie Payment ──
            if (source === 'luna_conciergerie_b2c') {
                try {
                    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
                    if (!tenantsSnap.empty) {
                        const tenantId = tenantsSnap.docs[0].id;
                        const tenantRef = adminDb.collection('tenants').doc(tenantId);

                        // Find lead by stripeSessionId
                        const leadsSnap = await tenantRef
                            .collection('leads')
                            .where('stripeSessionId', '==', session.id)
                            .limit(1)
                            .get();

                        let leadData: any = null;
                        if (!leadsSnap.empty) {
                            leadData = leadsSnap.docs[0].data();
                            await leadsSnap.docs[0].ref.update({
                                status: 'WON',
                                paymentStatus: 'PAID',
                                stripePaymentIntent: session.payment_intent,
                                paidAt: FieldValue.serverTimestamp(),
                                updatedAt: FieldValue.serverTimestamp(),
                            });
                        }

                        const cartItems = leadData?.cartItems || [];
                        const clientName = session.metadata?.clientName || leadData?.clientName || 'Client B2C';
                        const now = new Date();
                        const defaultDate = now.toISOString().split('T')[0];

                        // ── Separate cart items into "prestations" vs "voyages" ──
                        // Catalog items (hotel, activity, restaurant, transfer, experience) → SupplierBooking
                        // Collection Privée items (with dates like "12 – 20 Août 2026") → Trip

                        const catalogTypes = ['hotel', 'activity', 'restaurant', 'transfer', 'experience', 'dining', 'other'];

                        for (const item of cartItems) {
                            const itemType = (item.type || '').toLowerCase();
                            const isCatalogPrestation = catalogTypes.includes(itemType);

                            if (isCatalogPrestation) {
                                // ── CREATE SUPPLIER BOOKING (visible on Planning) ──
                                const price = typeof item.clientPrice === 'number'
                                    ? item.clientPrice
                                    : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0');

                                await tenantRef.collection('supplier_bookings').doc().set({
                                    supplierId: '',
                                    prestationId: item.id || '',
                                    prestationName: item.name || 'Prestation B2C',
                                    clientId: '',
                                    clientName: clientName,
                                    date: defaultDate,
                                    status: 'CONFIRMED',
                                    prestationType: itemType.toUpperCase(),
                                    rate: price,
                                    notes: `Réservé via Espace Client — Paiement Stripe confirmé`,
                                    numberOfGuests: 2,
                                    createdAt: now,
                                });

                                // ── Find AVAILABLE supplier & WhatsApp ──
                                try {
                                    const typeMap: Record<string, string[]> = {
                                        'hotel': ['HOTEL'], 'restaurant': ['RESTAURANT', 'GASTRONOMIE'],
                                        'activity': ['ACTIVITE', 'EXCURSION'], 'experience': ['ACTIVITE', 'EXPERIENCE'],
                                        'transfer': ['CHAUFFEUR', 'TRANSFERT', 'TRANSPORT'],
                                    };
                                    const cats = typeMap[itemType] || [];
                                    if (cats.length > 0) {
                                        const suppSnap = await tenantRef.collection('suppliers').where('category', 'in', cats).get();

                                        // Check who's already booked on this date
                                        const busySnap = await tenantRef.collection('supplier_bookings')
                                            .where('date', '==', defaultDate)
                                            .where('status', 'in', ['CONFIRMED', 'PROPOSED'])
                                            .get();
                                        const busyIds = new Set(busySnap.docs.map(d => d.data().supplierId).filter(Boolean));

                                        for (const sDoc of suppSnap.docs) {
                                            if (busyIds.has(sDoc.id)) continue; // Skip busy suppliers
                                            const s = sDoc.data();
                                            if (s.phone) {
                                                await notifySupplierBooking({
                                                    supplierName: s.contactName || s.name,
                                                    supplierPhone: s.phone,
                                                    prestationName: item.name || 'Prestation',
                                                    clientName,
                                                    date: defaultDate,
                                                    numberOfGuests: 2,
                                                });
                                                break;
                                            }
                                        }
                                    }
                                } catch (waErr) { console.warn('[Webhook] WhatsApp failed:', waErr); }
                            } else {
                                // ── CREATE TRIP (visible on CRM Voyages + Planning) ──
                                // Parse dates from item (e.g. "12 – 20 Août 2026")
                                let startDate = defaultDate;
                                let endDate = defaultDate;

                                // Try to extract dates from item description or dates field
                                if (item.date || item.dates) {
                                    const dateStr = item.date || item.dates;
                                    // Pattern: "DD – DD MonthName YYYY"
                                    const match = dateStr.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(\w+)\s+(\d{4})/);
                                    if (match) {
                                        const monthMap: Record<string, string> = {
                                            'jan': '01', 'fév': '02', 'feb': '02', 'mar': '03', 'avr': '04', 'apr': '04',
                                            'mai': '05', 'may': '05', 'jun': '06', 'jui': '07', 'jul': '07',
                                            'aoû': '08', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'déc': '12', 'dec': '12'
                                        };
                                        const monthStr = match[3].toLowerCase().slice(0, 3);
                                        const month = monthMap[monthStr] || '01';
                                        const year = match[4];
                                        startDate = `${year}-${month}-${match[1].padStart(2, '0')}`;
                                        endDate = `${year}-${month}-${match[2].padStart(2, '0')}`;
                                    }
                                }

                                const amount = typeof item.clientPrice === 'number'
                                    ? item.clientPrice
                                    : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0');

                                const tripRef = await tenantRef.collection('trips').doc();
                                await tripRef.set({
                                    title: item.name || 'Voyage B2C',
                                    destination: item.location || 'À définir',
                                    clientName: clientName,
                                    clientId: '',
                                    startDate: startDate,
                                    endDate: endDate,
                                    status: 'CONFIRMED',
                                    paymentStatus: 'PAID',
                                    amount: amount,
                                    notes: `Réservé via Espace Client — Paiement Stripe confirmé\n${item.description || ''}`.trim(),
                                    color: '#b9dae9',
                                    createdAt: now,
                                    updatedAt: now,
                                });

                                // Link trip back to the lead
                                if (!leadsSnap.empty) {
                                    await leadsSnap.docs[0].ref.update({
                                        tripId: tripRef.id,
                                        updatedAt: FieldValue.serverTimestamp(),
                                    });
                                }
                            }
                        }
                    }
                } catch (e) { console.error('[Webhook B2C] Error processing payment:', e); }
                break;
            }

            // ── Self-Hosted One-Time Purchase ──
            const planId = session.metadata?.planId || 'unknown';
            const planName = session.metadata?.planName || 'Unknown';

            if (planId.startsWith('self_hosted_')) {
                if (email) {
                    await adminDb.collection('purchases').doc().set({
                        email,
                        planId,
                        planName,
                        stripePaymentIntent: session.payment_intent,
                        stripeCustomerId: session.customer,
                        status: 'completed',
                        purchasedAt: FieldValue.serverTimestamp(),
                    });
                    console.log(`[Webhook] Self-hosted purchase recorded: ${planId} for ${email}`);
                }
                break;
            }

            // ── SaaS Subscription (existing logic) ──
            if (email) {
                await adminDb.collection('subscriptions').doc(email).set({
                    email,
                    planId,
                    planName,
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    status: 'active',
                    activatedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            const customer = sub.customer as string;

            try {
                const stripeCustomer = await getStripe().customers.retrieve(customer);
                if (!stripeCustomer.deleted && 'email' in stripeCustomer && stripeCustomer.email) {
                    await adminDb.collection('subscriptions').doc(stripeCustomer.email).set(
                        { status: 'cancelled', updatedAt: FieldValue.serverTimestamp() },
                        { merge: true }
                    );
                }
            } catch (e) { console.error(e); }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
