import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any });
}

const PLANS: Record<string, { priceId: string; name: string }> = {
    starter: { priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter', name: 'Starter' },
    pro: { priceId: process.env.STRIPE_PRICE_PRO || 'price_pro', name: 'Pro' },
    enterprise: { priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise', name: 'Enterprise' },
};

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
        const { planId, email, successUrl, cancelUrl } = body;

        const plan = PLANS[planId];
        if (!plan) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        const baseUrl = getBaseUrl(request);

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email || undefined,
            line_items: [{
                price: plan.priceId,
                quantity: 1,
            }],
            success_url: successUrl || `${baseUrl}/login?success=true&plan=${planId}`,
            cancel_url: cancelUrl || `${baseUrl}/pricing?cancelled=true`,
            metadata: { planId, planName: plan.name },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: error.message || 'Erreur Stripe' }, { status: 500 });
    }
}

