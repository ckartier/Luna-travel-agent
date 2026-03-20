'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * Auth guard for Hub dashboard pages.
 * Requires authenticated user with Admin or SuperAdmin role.
 * Redirects to /login if unauthenticated.
 */
export function HubGuard({ children }: { children: ReactNode }) {
    const { user, userProfile, loading, role } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen font-mono">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={28} className="animate-spin text-[#19c37d]" />
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Vérification…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        router.replace('/login');
        return null;
    }

    // Allow Admin, SuperAdmin, and Manager roles
    const allowedRoles = ['Admin', 'SuperAdmin', 'Manager'];
    if (!allowedRoles.includes(role)) {
        return (
            <div className="flex items-center justify-center min-h-screen font-mono">
                <div className="max-w-md rounded-[24px] border border-white/50 bg-white/18 backdrop-blur-xl p-8 text-center">
                    <ShieldAlert size={32} className="mx-auto text-red-400 mb-4" />
                    <h2 className="text-lg font-semibold text-zinc-700 mb-2">Accès restreint</h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        Le Hub de Contrôle est réservé aux administrateurs.
                        Votre rôle actuel : <span className="font-bold">{role}</span>
                    </p>
                    <button onClick={() => router.push('/crm')}
                        className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider"
                        style={{ background: '#19c37d' }}>
                        Retour au CRM
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
