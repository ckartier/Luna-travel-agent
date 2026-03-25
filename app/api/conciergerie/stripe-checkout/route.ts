export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/src/lib/firebase/admin';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any });
}

function getBaseUrl(request: Request): string {
    const origin = request.headers.get('origin');
    if (origin) return origin;
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cart, total, user } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const baseUrl = getBaseUrl(request);
        const stripe = getStripe();

        // Build line items from cart
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item: any) => {
            const price = typeof item.clientPrice === 'number' ? item.clientPrice : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0');
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                        description: item.location ? `${item.location} — ${item.type}` : item.type,
                        images: item.images?.slice(0, 1) || [],
                    },
                    unit_amount: price * 100, // Stripe uses cents
                },
                quantity: 1,
            };
        }).filter((li: any) => li.price_data.unit_amount > 0);

        // Fall back to a single line item if cart items don't have numeric prices
        if (line_items.length === 0) {
            line_items.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Conciergerie — Voyage Sur Mesure',
                        description: cart.map((i: any) => i.name).join(', '),
                    },
                    unit_amount: (total || 1000) * 100,
                },
                quantity: 1,
            });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user?.email || undefined,
            line_items,
            success_url: `${baseUrl}/client?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/client?payment=cancelled`,
            metadata: {
                source: 'luna_conciergerie_b2c',
                clientName: user?.displayName || 'Client B2C',
                clientEmail: user?.email || '',
                cartSummary: cart.map((i: any) => i.name).join(', ').slice(0, 500),
            },
        });

        // Also create the lead in the CRM
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (!tenantsSnap.empty) {
            const tenantId = tenantsSnap.docs[0].id;
            const destinations = cart.map((i: any) => i.location || i.name).filter((v: any, i: any, a: any) => a.indexOf(v) === i).join(', ');

            await adminDb.collection('tenants').doc(tenantId).collection('leads').doc().set({
                clientName: user?.displayName || user?.email || 'Client B2C',
                destination: destinations || 'Divers',
                dates: 'À définir',
                budget: `${total} EUR`,
                pax: 'À définir',
                status: 'NEW',
                source: 'Stripe Checkout B2C',
                cartItems: cart,
                stripeSessionId: session.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe B2C checkout error:', error);
        return NextResponse.json({ error: error.message || 'Erreur Stripe' }, { status: 500 });
    }
}
