import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/crm/onboarding
 * 
 * Returns onboarding checklist status for the authenticated tenant.
 * Checks which setup steps have been completed.
 */
export async function GET(req: NextRequest) {
    const rl = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rl) return rl;

    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const tenantId = auth.tenantId;
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 403 });

    try {
        const tenantRef = adminDb.collection('tenants').doc(tenantId);

        // Parallel checks
        const [
            contactsSnap,
            tripsSnap,
            suppliersSnap,
            quotesSnap,
            invoicesSnap,
            siteConfigSnap,
            settingsSnap,
        ] = await Promise.all([
            tenantRef.collection('contacts').limit(1).get(),
            tenantRef.collection('trips').limit(1).get(),
            tenantRef.collection('suppliers').limit(1).get(),
            tenantRef.collection('quotes').limit(1).get(),
            tenantRef.collection('invoices').limit(1).get(),
            tenantRef.collection('site_config').doc('main').get(),
            tenantRef.collection('settings').doc('siteConfig').get(),
        ]);

        const hasBranding = settingsSnap.exists && !!settingsSnap.data()?.global?.agencyName;

        const steps = [
            {
                id: 'profile',
                label: 'Configurer votre profil agence',
                description: 'Nom, logo, couleurs de votre conciergerie',
                completed: hasBranding,
                href: '/crm/settings',
                icon: '🏢',
            },
            {
                id: 'contact',
                label: 'Ajouter votre premier client',
                description: 'Créez un contact avec email et téléphone',
                completed: !contactsSnap.empty,
                href: '/crm/clients',
                icon: '👤',
            },
            {
                id: 'supplier',
                label: 'Ajouter un prestataire',
                description: 'Hôtels, transports, activités...',
                completed: !suppliersSnap.empty,
                href: '/crm/suppliers',
                icon: '🤝',
            },
            {
                id: 'trip',
                label: 'Créer votre premier voyage',
                description: 'Planifiez un itinéraire sur-mesure',
                completed: !tripsSnap.empty,
                href: '/crm/planning',
                icon: '✈️',
            },
            {
                id: 'quote',
                label: 'Envoyer un devis',
                description: 'Générez et partagez un devis client',
                completed: !quotesSnap.empty,
                href: '/crm/devis',
                icon: '📄',
            },
            {
                id: 'invoice',
                label: 'Créer une facture',
                description: 'Facturation et suivi des paiements',
                completed: !invoicesSnap.empty,
                href: '/crm/invoices',
                icon: '💳',
            },
            {
                id: 'site',
                label: 'Publier votre site vitrine',
                description: 'Personnalisez votre page conciergerie',
                completed: siteConfigSnap.exists,
                href: '/site-admin',
                icon: '🌐',
            },
        ];

        const completedCount = steps.filter(s => s.completed).length;
        const progress = Math.round((completedCount / steps.length) * 100);

        return NextResponse.json({
            steps,
            progress,
            completedCount,
            totalSteps: steps.length,
            isComplete: progress === 100,
        });
    } catch (error: any) {
        console.error('[Onboarding] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
