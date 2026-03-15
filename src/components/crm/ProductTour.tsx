'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { CallBackProps, Step, Styles } from 'react-joyride';
import { useAuth } from '@/src/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';

// Dynamic import to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

/* ═══════════════════════════════════════════
   LUNA PRODUCT TOUR — First Login Experience
   Shows at first login, dismissable, tracks state in Firestore
   ═══════════════════════════════════════════ */

const LUNA_TOUR_STEPS: Step[] = [
    {
        target: 'body',
        content: '🌍 Bienvenue sur Luna CRM ! Ce tour rapide va vous guider à travers les fonctionnalités clés. Cliquez "Suivant" pour commencer.',
        title: 'Bienvenue sur Luna !',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[href="/crm"]',
        content: 'Votre Dashboard affiche en temps réel vos revenus, opportunités, clients VIP et missions actives.',
        title: '📊 Dashboard',
        placement: 'right',
    },
    {
        target: '[href="/crm/mails"]',
        content: 'La Boîte de réception synchronise Gmail. L\'IA analyse chaque email et en extrait les données de voyage.',
        title: '📧 Boîte de Réception',
        placement: 'right',
    },
    {
        target: '[href="/crm/pipeline"]',
        content: 'Le Pipeline en Kanban visualise vos leads : de la première demande jusqu\'à la conversion. Glissez-déposez pour changer le statut.',
        title: '📋 Pipeline CRM',
        placement: 'right',
    },
    {
        target: '[href="/crm/planning"]',
        content: 'Le Planning affiche tous vos voyages sur un calendrier interactif. Glissez les voyages pour changer les dates.',
        title: '📅 Planning',
        placement: 'right',
    },
    {
        target: '[href="/crm/contacts"]',
        content: 'Gérez vos clients avec profil VIP, historique de voyages, et segmentation par tags.',
        title: '👥 Contacts',
        placement: 'right',
    },
    {
        target: '[href="/crm/agent-ia"]',
        content: 'L\'Agent IA génère des itinéraires complets, propose des prestations adaptées et optimise vos voyages en un clic.',
        title: '🤖 Agent IA',
        placement: 'right',
    },
    {
        target: '[href="/crm/quotes"]',
        content: 'Créez des devis premium avec marge calculée automatiquement. Partagez par email ou lien public avec votre branding.',
        title: '📝 Devis & Finance',
        placement: 'right',
    },
    {
        target: '[href="/crm/settings"]',
        content: 'Configurez votre agence, gérez votre équipe, et personnalisez votre espace Luna.',
        title: '⚙️ Paramètres',
        placement: 'right',
    },
    {
        target: 'body',
        content: '🚀 Vous êtes prêt ! Explorez Luna CRM et créez votre premier voyage. Besoin d\'aide ? Le chatbot Luna est toujours disponible en bas à droite.',
        title: 'C\'est parti !',
        placement: 'center',
    },
];

const JOYRIDE_STYLES: Partial<Styles> = {
    options: {
        arrowColor: '#ffffff',
        backgroundColor: '#ffffff',
        overlayColor: 'rgba(46, 46, 46, 0.4)',
        primaryColor: '#5a8fa3',
        textColor: '#2E2E2E',
        zIndex: 10000,
    },
    buttonNext: {
        backgroundColor: '#2E2E2E',
        color: '#ffffff',
        fontSize: '12px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        borderRadius: '10px',
        padding: '10px 24px',
        fontWeight: 600,
    },
    buttonBack: {
        color: '#9CA3AF',
        fontSize: '12px',
    },
    buttonSkip: {
        color: '#9CA3AF',
        fontSize: '11px',
    },
    tooltip: {
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    },
    tooltipTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#2E2E2E',
        marginBottom: '8px',
    },
    tooltipContent: {
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#6B7280',
    },
    spotlight: {
        borderRadius: '12px',
    },
};

export function ProductTour() {
    const [run, setRun] = useState(false);
    const [tourChecked, setTourChecked] = useState(false);
    const { user } = useAuth();

    // Check if user has completed the tour
    useEffect(() => {
        if (!user) return;
        const checkTour = async () => {
            try {
                const tourDoc = await getDoc(doc(db, 'users', user.uid));
                const data = tourDoc.data();
                if (data && !data.tourCompleted) {
                    // Wait a bit for the sidebar to render before starting the tour
                    setTimeout(() => setRun(true), 1500);
                }
            } catch {
                // If we can't check, don't show the tour
            }
            setTourChecked(true);
        };
        checkTour();
    }, [user]);

    const handleCallback = async (data: CallBackProps) => {
        const { status } = data;
        if (status === 'finished' || status === 'skipped') {
            setRun(false);
            // Mark tour as completed
            if (user) {
                try {
                    await setDoc(doc(db, 'users', user.uid), { tourCompleted: true }, { merge: true });
                } catch {
                    // Non-critical
                }
            }
        }
    };

    if (!tourChecked || !user) return null;

    return (
        <Joyride
            steps={LUNA_TOUR_STEPS}
            run={run}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            callback={handleCallback}
            styles={JOYRIDE_STYLES}
            locale={{
                back: 'Retour',
                close: 'Fermer',
                last: 'Terminer',
                next: 'Suivant',
                skip: 'Passer le tour',
            }}
        />
    );
}
