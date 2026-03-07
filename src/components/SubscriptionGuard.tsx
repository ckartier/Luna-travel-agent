'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { CreditCard, X } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/pricing', '/cgv', '/landing', '/admin'];

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { isActive, loading: subLoading } = useSubscription();
    const pathname = usePathname();
    const [dismissed, setDismissed] = useState(false);

    // Always render children — guard is non-blocking (shows banner only)
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    const isSuperAdmin = userProfile?.role === 'SuperAdmin';
    const isAdmin = userProfile?.role === 'Admin';
    const showBanner = !authLoading && !subLoading && user && !isActive && !isPublic && !dismissed && !isAdmin && !isSuperAdmin;

    return (
        <>
            {showBanner && (
                <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg">
                    <CreditCard size={16} />
                    <span className="text-sm font-normal">
                        Aucun abonnement actif —
                    </span>
                    <Link href="/pricing" className="text-sm font-normal underline underline-offset-2 hover:text-white/90">
                        Choisir un plan
                    </Link>
                    <button onClick={() => setDismissed(true)} className="ml-2 p-1 hover:bg-white/20 rounded transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}
            {children}
        </>
    );
}
