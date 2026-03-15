import { NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import Stripe from 'stripe';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any });
}

// ═══ PLAN DEFINITIONS ═══
// Maps plan IDs to Stripe price IDs + payment mode
type PlanDef = { priceId: string; name: string; mode: 'subscription' | 'payment' };

const PLANS: Record<string, PlanDef> = {
    // ── SaaS subscription plans ──
    site_builder: { priceId: process.env.STRIPE_PRICE_SITE_BUILDER || 'price_site_builder', name: 'Site Builder', mode: 'subscription' },
    crm: { priceId: process.env.STRIPE_PRICE_CRM || 'price_crm', name: 'CRM Pro', mode: 'subscription' },
    all_in_one: { priceId: process.env.STRIPE_PRICE_ALL_IN_ONE || 'price_all_in_one', name: 'All-in-One', mode: 'subscription' },
    enterprise: { priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise', name: 'Enterprise', mode: 'subscription' },

    // ── Self-hosted one-time purchase plans ──
    self_hosted_code: { priceId: process.env.STRIPE_PRICE_SELF_HOSTED_CODE || 'price_self_hosted_code', name: 'Code Source', mode: 'payment' },
    self_hosted_install: { priceId: process.env.STRIPE_PRICE_SELF_HOSTED_INSTALL || 'price_self_hosted_install', name: 'Code + Installation', mode: 'payment' },
    self_hosted_formation: { priceId: process.env.STRIPE_PRICE_SELF_HOSTED_FORMATION || 'price_self_hosted_formation', name: 'Code + Install + Formation', mode: 'payment' },

    // ── Legacy plan IDs (backward compat) ──
    starter: { priceId: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_CRM || 'price_starter', name: 'Starter', mode: 'subscription' },
    pro: { priceId: process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_ALL_IN_ONE || 'price_pro', name: 'Pro', mode: 'subscription' },
};

function getBaseUrl(request: Request): string {
    const origin = request.headers.get('origin');
    if (origin) return origin;
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
}

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth instanceof Response) return auth;
    try {
        const body = await request.json();
        const { planId, email, successUrl, cancelUrl } = body;

        const plan = PLANS[planId];
        if (!plan) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        const baseUrl = getBaseUrl(request);
        const isSelfHosted = planId.startsWith('self_hosted_');

        // Determine redirect after payment based on plan type
        const defaultSuccessUrl = isSelfHosted
            ? `${baseUrl}/pricing/success?plan=${planId}`
            : planId === 'site_builder'
                ? `${baseUrl}/site-admin?success=true&plan=${planId}`
                : `${baseUrl}/crm?success=true&plan=${planId}`;

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: plan.mode,
            customer_email: email || undefined,
            line_items: [{
                price: plan.priceId,
                quantity: 1,
            }],
            success_url: successUrl || defaultSuccessUrl,
            cancel_url: cancelUrl || `${baseUrl}/pricing?cancelled=true`,
            metadata: { planId, planName: plan.name },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: error.message || 'Erreur Stripe' }, { status: 500 });
    }
}
