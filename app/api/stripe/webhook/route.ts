import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
            const planId = session.metadata?.planId || 'unknown';
            const planName = session.metadata?.planName || 'Unknown';

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
