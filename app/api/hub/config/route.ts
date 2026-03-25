import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

export const dynamic = 'force-dynamic';

// ── Default Hub Config ──
const DEFAULT_HUB_CONFIG = {
    global: {
        siteName: 'Datarnivore Hub',
        logo: '/Logo ours agence.png',
        primaryColor: '#19c37d',
        secondaryColor: '#16b8c8',
        accentColor: '#e3f24f',
        amberColor: '#ffd15c',
        textColor: '#3f3f46',
        bgColor: '#edf2ec',
        fontHeading: 'Inter',
        fontBody: 'Inter',
    },
    blocks: [
        {
            id: 'hero',
            type: 'hero',
            order: 0,
            visible: true,
            title: 'Hub de Contrôle',
            subtitle: 'Datarnivore',
            description: 'Supervisez vos CRM, analysez les bugs et pilotez vos produits depuis un seul dashboard.',
            imageUrl: '',
            videoUrl: '',
        },
        {
            id: 'gallery',
            type: 'gallery',
            order: 1,
            visible: true,
            title: 'Gallery',
            images: [],
        },
        {
            id: 'content',
            type: 'content',
            order: 2,
            visible: true,
            title: 'Nos Produits',
            text: 'Luna Travel — CRM de voyage haut de gamme.\nLawyer Suite — CRM pour cabinets d\'avocats.\nMonum — CRM de suivi chantiers et budgets.',
        },
        {
            id: 'feature',
            type: 'feature',
            order: 3,
            visible: true,
            title: 'Fonctionnalités',
            items: [
                { title: 'Monitoring Santé', description: 'Score de santé temps réel pour chaque CRM.' },
                { title: 'Bug Tracking', description: 'Agrégation et analyse automatique des bugs.' },
                { title: 'IA Gemini', description: 'Analyse IA avec propositions d\'action.' },
                { title: 'Voice Agent', description: 'Assistant vocal connecté à Gemini Live.' },
            ],
        },
        {
            id: 'media',
            type: 'media',
            order: 4,
            visible: false,
            title: 'Média',
            videoUrl: '',
            imageUrl: '',
        },
        {
            id: 'cta',
            type: 'cta',
            order: 5,
            visible: true,
            title: 'Prêt à démarrer ?',
            buttonText: 'Accéder au Dashboard',
            buttonUrl: '/hub/dashboard',
        },
        {
            id: 'cards',
            type: 'cards',
            order: 6,
            visible: false,
            title: 'Cards',
            items: [],
        },
        {
            id: 'form',
            type: 'form',
            order: 7,
            visible: true,
            title: 'Contact',
            subtitle: 'Une question ? Envoyez-nous un message.',
            fields: ['name', 'email', 'message'],
        },
    ],
    nav: {
        menuItems: [
            { label: 'Dashboard', href: '/hub/dashboard' },
            { label: 'CRM Travel', href: '/crm/luna' },
            { label: 'CRM Legal', href: '/crm/avocat?vertical=legal' },
            { label: 'CRM Monum', href: '/crm/monum?vertical=monum' },
        ],
    },
    business: {
        name: 'Datarnivore',
        email: '',
        phone: '',
        description: 'Hub de contrôle SaaS multi-verticale',
    },
};

async function resolveTenantIdFromRequest(request: NextRequest): Promise<string | Response | null> {
    const authHeader = request.headers.get('Authorization');

    // Authenticated calls must use caller tenant.
    if (authHeader?.startsWith('Bearer ')) {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }
        return auth.tenantId;
    }

    // Public calls can pass tenantId explicitly.
    const tenantIdFromQuery = request.nextUrl.searchParams.get('tenantId');
    if (tenantIdFromQuery) return tenantIdFromQuery;

    // Backward-compatible fallback for single-tenant setups.
    const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
    if (tenantsSnap.empty) return null;
    return tenantsSnap.docs[0].id;
}

// ── GET: Read hub config ──
export async function GET(request: NextRequest) {
    try {
        const resolvedTenant = await resolveTenantIdFromRequest(request);
        if (resolvedTenant instanceof Response) return resolvedTenant;
        if (!resolvedTenant) {
            return NextResponse.json(DEFAULT_HUB_CONFIG);
        }
        const tenantId = resolvedTenant;
        const configRef = adminDb.collection('tenants').doc(tenantId).collection('hub_config').doc('main');

        let data: Record<string, any> = {};
        const configDoc = await configRef.get();

        if (configDoc.exists) {
            data = (configDoc.data() || {}) as Record<string, any>;
        } else {
            data = DEFAULT_HUB_CONFIG as Record<string, any>;
            await configRef.set({
                ...DEFAULT_HUB_CONFIG,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }

        const merged = {
            ...DEFAULT_HUB_CONFIG,
            ...data,
            global: { ...DEFAULT_HUB_CONFIG.global, ...(data.global || {}) },
            nav: { ...DEFAULT_HUB_CONFIG.nav, ...(data.nav || {}) },
            business: { ...DEFAULT_HUB_CONFIG.business, ...(data.business || {}) },
        };
        return NextResponse.json(merged);
    } catch (error: any) {
        console.error('[HubConfig] GET error:', error);
        return NextResponse.json(DEFAULT_HUB_CONFIG);
    }
}

// ── PUT: Update hub config ──
export async function PUT(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (auth instanceof Response) return auth;
        if (!auth.tenantId) {
            return NextResponse.json({ error: 'Tenant required' }, { status: 403 });
        }

        const body = await request.json();

        await adminDb.collection('tenants').doc(auth.tenantId).collection('hub_config').doc('main').set({
            ...body,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[HubConfig] PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
