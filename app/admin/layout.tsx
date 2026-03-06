'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LunaLogo } from '@/app/components/LunaLogo';
import {
    LayoutDashboard, Users, CreditCard, Shield, ArrowLeft, Settings, BarChart3
} from 'lucide-react';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard },
    { href: '/admin/maintenance', label: 'Maintenance', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'Admin')) {
            router.replace('/');
        }
    }, [user, userProfile, loading, router]);

    if (loading || !user || userProfile?.role !== 'Admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f14]">
                <div className="w-8 h-8 border-3 border-white/10 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f14] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#16161e] border-r border-white/5 flex flex-col shrink-0">
                <div className="p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <LunaLogo size={36} />
                        <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold">Admin Panel</p>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {NAV.map(n => {
                        const active = pathname === n.href;
                        return (
                            <Link key={n.href} href={n.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-violet-500/15 text-violet-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }`}>
                                <n.icon size={18} />
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-white/5">
                    <Link href="/"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors rounded-xl hover:bg-white/5">
                        <ArrowLeft size={16} /> Retour à l'app
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
