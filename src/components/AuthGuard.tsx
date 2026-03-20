'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LunaLogo } from '@/app/components/LunaLogo';

import { useVertical } from '@/src/contexts/VerticalContext';

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = ['/login', '/pricing', '/cgv', '/landing', '/landing-legal', '/trip', '/conciergerie', '/hub', '/demos', '/welcome'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname() || '/';
    const { vertical } = useVertical();

    const isPublicRoute = pathname === '/' || PUBLIC_ROUTES.some(r => pathname.startsWith(r));

    useEffect(() => {
        if (loading) return;

        if (!user && !isPublicRoute) {
            const isLegal = vertical.id === 'legal' || pathname.startsWith('/crm/avocat');
            router.replace(isLegal ? '/landing-legal' : '/landing');
        }
    }, [user, loading, isPublicRoute, router, vertical.id, pathname]);

    // Routes with their own custom loading screen — skip the auth loader
    const hasOwnLoader = pathname === '/' || pathname === '/hub';

    // Show elegant loading screen while checking auth (skip for routes with custom loaders)
    if (loading && !hasOwnLoader) {
        return (
            <div className="fixed inset-0 bg-luna-bg flex items-center justify-center z-[9999]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <LunaLogo size={48} />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-luna-warm-gray/20 border-t-sky-500 rounded-full"
                    />
                    <p className="text-[12px] uppercase tracking-[0.2em] text-luna-text-muted font-normal">
                        Chargement...
                    </p>
                </motion.div>
            </div>
        );
    }

    // If not authenticated and not on a public route, render nothing (redirect will happen)
    if (!user && !isPublicRoute) {
        return null;
    }

    return <>{children}</>;
}
