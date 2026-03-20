'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAccess, FEATURE_MODULE, ROUTE_TO_FEATURE } from '@/src/hooks/useAccess';
import { UpgradeGate } from '@/src/components/UpgradeGate';

/**
 * Wrap any CRM page content with this component.
 * If the user doesn't have access, it shows the UpgradeGate instead.
 */
export function CRMPageGuard({ children, featureKey }: { children: ReactNode; featureKey?: string }) {
    const pathname = usePathname() || '/';
    const { canAccessFeature, getUpgradeSuggestion, canAccessRoute } = useAccess();

    // Determine feature key from prop or route
    const resolvedFeatureKey = featureKey || ROUTE_TO_FEATURE[pathname] || null;

    // If no feature key, allow access (unknown route)
    if (!resolvedFeatureKey) return <>{children}</>;

    // Check access
    const hasAccess = canAccessFeature(resolvedFeatureKey);

    if (hasAccess) return <>{children}</>;

    // Show upgrade gate
    const requiredModule = FEATURE_MODULE[resolvedFeatureKey];
    const suggestion = getUpgradeSuggestion(resolvedFeatureKey);

    if (!requiredModule || !suggestion) return <>{children}</>;

    // Feature names for display
    const featureNames: Record<string, { name: string; desc: string }> = {
        'dashboard': { name: 'Dashboard', desc: 'Vue d\'ensemble de votre activité' },
        'pipeline': { name: 'Pipeline de Vente', desc: 'Suivez vos opportunités commerciales' },
        'contacts': { name: 'Gestion des Contacts', desc: 'Base de données clients enrichie' },
        'planning': { name: 'Planning', desc: 'Planification des voyages et réservations' },
        'mails': { name: 'Boîte de Réception', desc: 'Emails centralisés et analyse IA' },
        'bookings': { name: 'Réservations', desc: 'Suivi des bookings et confirmations' },
        'catalog': { name: 'Catalogue', desc: 'Base de données prestataires et services' },
        'suppliers': { name: 'Prestataires', desc: 'Gestion de vos fournisseurs' },
        'quotes': { name: 'Devis', desc: 'Création et suivi de vos devis' },
        'invoices': { name: 'Factures', desc: 'Facturation et suivi des paiements' },
        'payments': { name: 'Paiements', desc: 'Suivi des encaissements Stripe' },
        'team': { name: 'Équipe', desc: 'Gestion des membres et rôles' },
        'analytics': { name: 'Analytics', desc: 'KPIs et rapports de performance' },
        'integrations': { name: 'Intégrations', desc: 'Connexions avec vos outils' },
        'website-editor': { name: 'Éditeur de Site', desc: 'Créez votre site vitrine professionnel' },
        'templates': { name: 'Templates', desc: 'Choisissez parmi 3 templates premium' },
        'marketing': { name: 'Marketing', desc: 'Campagnes et automation' },
    };

    const featureInfo = featureNames[resolvedFeatureKey] || { name: resolvedFeatureKey, desc: '' };

    return (
        <UpgradeGate
            featureName={featureInfo.name}
            featureDescription={featureInfo.desc}
            requiredModule={requiredModule}
            suggestedPlan={suggestion}
        />
    );
}
