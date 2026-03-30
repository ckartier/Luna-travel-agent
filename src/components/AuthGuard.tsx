'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

import { useVertical } from '@/src/contexts/VerticalContext';

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = ['/login', '/signup', '/pricing', '/cgv', '/landing', '/landing-legal', '/landing-monum', '/trip', '/conciergerie', '/hub', '/demos', '/welcome'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading, isProTravelOnly } = useAuth();
    const router = useRouter();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const { vertical } = useVertical();
    const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
    const mode = (searchParams?.get('mode') || '').toLowerCase();

    const isPdfCreatorLoginRoute = pathname === '/pdfcreator/login';
    const isPublicRoute = pathname === '/' || isPdfCreatorLoginRoute || PUBLIC_ROUTES.some(r => pathname.startsWith(r));

    // Monum routes must bypass local auth guard and open the dedicated external app directly.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const queryVertical = new URLSearchParams(window.location.search).get('vertical');
        const isMonumRoute = pathname.startsWith('/crm/monum') || (pathname === '/crm' && queryVertical === 'monum');
        if (!isMonumRoute) return;
        window.location.replace(`${monumAppUrl}/app`);
    }, [pathname, monumAppUrl]);

    useEffect(() => {
        if (loading) return;

        if (!user && !isPublicRoute) {
            const monumQuery =
                typeof window !== 'undefined'
                && pathname === '/crm'
                && new URLSearchParams(window.location.search).get('vertical') === 'monum';
            const legalQuery =
                typeof window !== 'undefined'
                && pathname === '/crm'
                && new URLSearchParams(window.location.search).get('vertical') === 'legal';
            const isCrmRoot = pathname === '/crm';

            if (pathname.startsWith('/pdfcreator')) {
                router.replace('/pdfcreator/login');
            } else if (pathname.startsWith('/pro')) {
                router.replace('/login/pro');
            } else if (pathname.startsWith('/crm/legal') || pathname.startsWith('/crm/avocat') || legalQuery || (isCrmRoot && vertical.id === 'legal')) {
                router.replace('/login/legal');
            } else if (pathname.startsWith('/crm/monum') || monumQuery || (isCrmRoot && vertical.id === 'monum')) {
                window.location.replace(`${monumAppUrl}/login`);
            } else {
                router.replace('/login/travel');
            }
        }
    }, [user, loading, isPublicRoute, router, vertical.id, pathname, monumAppUrl]);

    // Pro-travel limited accounts can only access /pro routes.
    useEffect(() => {
        if (loading || !user || !isProTravelOnly) return;
        const isProAuthPage =
            pathname === '/login/pro' ||
            pathname === '/signup/pro' ||
            ((pathname === '/login' || pathname === '/signup') && mode === 'pro');
        const canStay =
            pathname.startsWith('/pro') ||
            isProAuthPage;

        if (!canStay) {
            router.replace('/pro/travel');
        }
    }, [loading, user, isProTravelOnly, pathname, router, mode]);

    if (loading && !isPublicRoute) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    if (!user && !isPublicRoute) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white px-6">
                <div className="text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
                    <p className="mt-4 text-sm text-[#64748b]">Redirection vers la connexion...</p>
                </div>
            </div>
        );
    }

    // During pro redirect guard evaluation, avoid flashing restricted screens.
    const isProAuthPage =
        pathname === '/login/pro' ||
        pathname === '/signup/pro' ||
        ((pathname === '/login' || pathname === '/signup') && mode === 'pro');
    if (user && userProfile?.accessScope === 'pro_travel' && !pathname.startsWith('/pro') && !isProAuthPage) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    return <>{children}</>;
}
