import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any });

function getBaseUrl(request: Request): string {
    const origin = request.headers.get('origin');
    if (origin) return origin;
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
}

export async function POST(request: Request) {
    try {
        const { customerId, returnUrl } = await request.json();

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID requis' }, { status: 400 });
        }

        const baseUrl = getBaseUrl(request);

        const session = await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${baseUrl}/crm/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe portal error:', error);
        return NextResponse.json({ error: error.message || 'Erreur Stripe' }, { status: 500 });
    }
}
