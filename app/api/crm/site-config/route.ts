import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export const dynamic = 'force-dynamic';

async function resolveTenantIdFromRequest(request: NextRequest): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    // Authenticated CRM calls must resolve to the caller tenant.
    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    // Public storefront calls can pass tenantId explicitly.
    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    // Backward-compatible fallback for single-tenant deployments.
    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
    if (tenantsSnap.empty) return null;
    return tenantsSnap.docs[0].id;
}

// ── Default site config (seed data) ──
const DEFAULT_SITE_CONFIG = {
    template: 'elegance',
    global: {
        siteName: 'Luna',
        logo: '/luna-logo-blue.svg',
        primaryColor: '#2E2E2E',
        secondaryColor: '#b9dae9',
        accentColor: '#E2C8A9',
        textColor: '#2E2E2E',
        bgColor: '#ffffff',
        ctaColor: '#2E2E2E',
        fontHeading: 'Playfair Display',
        fontBody: 'Inter',
        headingSize: 'lg',
        headingStyle: 'normal',
        headingWeight: 'light',
        letterSpacing: 'tight',
        heroVideoUrl: '/luna-conciergerie-travel.mp4',
        borderRadius: 'lg',
        spacing: 'normal',
        buttonStyle: 'solid',
    },
    nav: {
        menuItems: [
            { label: 'Destinations', href: '#destinations' },
            { label: 'Services', href: '#services' },
            { label: 'Contact', href: '#tailor-made' },
        ],
        ctaText: 'Espace Client',
    },
    business: {
        name: 'Luna Conciergerie',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        linkedin: '',
        website: '',
        description: 'Conciergerie de voyage sur-mesure',
    },
    blocks: [
        {
            id: 'hero',
            type: 'hero',
            order: 0,
            visible: true,
            title: 'Voyagez',
            subtitle: 'magnifiquement.',
            description: "Une conciergerie de voyage d'exception. L'art de concevoir les évasions les plus secrètes et exclusives aux quatre coins du monde.",
            videoUrl: '/luna-conciergerie-travel.mp4',
        },
        {
            id: 'collections',
            type: 'collections',
            order: 1,
            visible: true,
            title: 'Collections Privées',
            subtitle: 'Évasions exclusives, soigneusement composées.',
            items: [
                {
                    id: 'hollande',
                    name: 'Hollande / Norvège',
                    location: 'Europe du Nord',
                    description: 'Croisière fluviale exclusive à travers les canaux historiques et les fjords majestueux.',
                    images: [
                        '/images/Conciergerie/Hollande norveige/Hollande-Norveige-1.jpg',
                        '/images/Conciergerie/Hollande norveige/Hollande-Norveige-2.jpg',
                        '/images/Conciergerie/Hollande norveige/Hollande-Norveige-3.jpg',
                    ],
                    video: '/images/Conciergerie/Hollande norveige/Hollande Norveige.mp4',
                    price: 'Sur demande',
                },
                {
                    id: 'mykonos',
                    name: 'Mykonos',
                    location: 'Grèce',
                    description: 'Retraite idyllique entre plages secrètes et dîners étoilés.',
                    images: ['https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?q=80&w=1200'],
                    price: '15 400 €',
                },
                {
                    id: 'tanzanie',
                    name: 'Tanzanie',
                    location: 'Afrique de l\'Est',
                    description: 'Safari privé et lodges de luxe au cœur du Serengeti.',
                    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319806?q=80&w=1200'],
                    price: '22 800 €',
                },
            ],
        },
        {
            id: 'catalog',
            type: 'catalog',
            order: 2,
            visible: true,
            title: 'Prestations',
            subtitle: '& Services',
            description: 'Accédez à notre réseau international exclusif. Des villas cachées aux yachts privés, chaque expérience est certifiée par nos équipes.',
        },
        {
            id: 'history',
            type: 'history',
            order: 3,
            visible: true,
            title: 'Notre Histoire',
            text: "Luna est née d'une conviction simple : voyager devrait être un art. Fondée par une équipe de passionnés du voyage haut de gamme, notre conciergerie réinvente l'expérience du sur-mesure.",
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200',
        },
        {
            id: 'form',
            type: 'form',
            order: 4,
            visible: true,
            title: 'Création Sur-Mesure',
            subtitle: "Décrivez-nous votre rêve. Nos experts transformeront votre vision en un voyage d'exception, organisé dans les moindres détails.",
        },
    ],
    dividers: {
        divider1: { title: "L'Art de Recevoir.", image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000' },
        divider2: { title: "L'Excellence à la Française.", image: '/images/Conciergerie/paris-eiffel-sunset.png' },
    },
    footer: {
        copyright: '© 2026 Luna Conciergerie',
        description: '',
    },
};

// ── GET: Read site config ──
export async function GET(request: NextRequest) {
    try {
        const resolvedTenant = await resolveTenantIdFromRequest(request);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) {
            return NextResponse.json(DEFAULT_SITE_CONFIG);
        }
        const tenantId = resolvedTenant;

        const configDoc = await adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').get();

        if (!configDoc.exists) {
            // Seed default config
            await adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').set({
                ...DEFAULT_SITE_CONFIG,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            return NextResponse.json(DEFAULT_SITE_CONFIG);
        }

        // Merge defaults for any missing top-level keys (e.g. business added after initial config)
        const data = configDoc.data() || {};
        const merged = {
            ...DEFAULT_SITE_CONFIG,
            ...data,
            global: { ...DEFAULT_SITE_CONFIG.global, ...(data.global || {}) },
            nav: { ...DEFAULT_SITE_CONFIG.nav, ...(data.nav || {}) },
            business: { ...DEFAULT_SITE_CONFIG.business, ...(data.business || {}) },
            dividers: { ...DEFAULT_SITE_CONFIG.dividers, ...(data.dividers || {}) },
        };
        return NextResponse.json(merged);
    } catch (error: any) {
        console.error('Error fetching site config:', error);
        return NextResponse.json(DEFAULT_SITE_CONFIG);
    }
}

// ── PUT: Update site config ──
export async function PUT(request: NextRequest) {
    try {
        // Auth check
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }

        const body = await request.json();
        const tenantId = auth.tenantId;

        await adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').set({
            ...body,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving site config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
