'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Menu, X, ExternalLink, Plane, Scale, Globe, LogOut,
} from 'lucide-react';
import { HubGuard } from '@/src/components/hub/HubGuard';
import { useAuth } from '@/src/contexts/AuthContext';

const ACCENT = '#19c37d';

export default function HubDashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname() || '/';
    const [mobileOpen, setMobileOpen] = useState(false);
    const { userProfile, logout } = useAuth();

    const links = [
        { name: 'Hub Dashboard', href: '/hub/dashboard', icon: LayoutDashboard },
    ];

    const externalLinks = [
        { name: 'Hub Site', href: '/hub/site', icon: Globe, color: '#19c37d' },
        { name: 'CRM Travel', href: '/crm', icon: Plane, color: '#5a8fa3' },
        { name: 'CRM Legal', href: '/crm/avocat?vertical=legal', icon: Scale, color: '#A07850' },
        { name: 'Site Admin', href: '/site-admin', icon: Globe, color: '#6B7280' },
    ];

    const sidebarContent = (
        <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-end px-3 mb-2 md:hidden">
                    <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-zinc-700 p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Logo */}
                <div className="pt-6 pb-6 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ background: ACCENT }}>
                        <LayoutDashboard size={18} />
                    </div>
                    <span className="text-[12px] font-mono font-semibold uppercase text-zinc-600 tracking-[0.25em]">
                        HUB CONTROL
                    </span>
                </div>

                {/* Status */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">Systems Online</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 px-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-mono text-[11px] uppercase tracking-wider ${isActive
                                    ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/30'
                                }`}
                                style={isActive ? { background: ACCENT } : undefined}>
                                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}

                    <div className="h-px bg-white/30 my-3" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400 px-3 mb-1">CRMs</span>

                    {externalLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.href} href={link.href} target="_blank" onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-zinc-500 hover:text-zinc-700 hover:bg-white/30 font-mono text-[11px] uppercase tracking-wider group">
                                <Icon size={16} strokeWidth={1.5} className="shrink-0" style={{ color: link.color }} />
                                <span className="flex-1">{link.name}</span>
                                <ExternalLink size={11} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User info */}
            <div className="px-4 py-4 space-y-3">
                {userProfile && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/15">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: ACCENT }}>
                            {(userProfile.displayName || userProfile.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-mono font-bold text-zinc-700 truncate">
                                {userProfile.displayName || userProfile.email}
                            </div>
                            <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                                {userProfile.role || 'Admin'}
                            </div>
                        </div>
                        <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/20 transition text-zinc-400 hover:text-zinc-600">
                            <LogOut size={13} />
                        </button>
                    </div>
                )}
                <div className="px-3 py-2 text-[9px] text-zinc-400 font-mono text-center uppercase tracking-wider">
                    Datarnivore Hub v1.0
                </div>
            </div>
        </>
    );

    return (
        <HubGuard>
            <div className="relative min-h-screen font-mono text-zinc-700 bg-[#edf2ec]">
                <div className="relative z-10 flex min-h-screen">
                    <button onClick={() => setMobileOpen(true)}
                        className="md:hidden fixed top-4 left-3 z-50 rounded-xl border border-white/40 bg-white/40 backdrop-blur-xl p-2">
                        <Menu size={18} className="text-zinc-700" />
                    </button>

                    {mobileOpen && (
                        <div className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                            <div className="w-60 h-full rounded-r-[20px] border-r border-white/40 bg-white/30 backdrop-blur-xl flex flex-col justify-between py-5"
                                onClick={(e) => e.stopPropagation()}>
                                {sidebarContent}
                            </div>
                        </div>
                    )}

                    <div className="hidden md:flex w-[240px] shrink-0 p-4">
                        <div className="w-full rounded-[20px] border border-white/40 bg-white/20 backdrop-blur-xl flex flex-col justify-between py-6 overflow-y-auto no-scrollbar">
                            {sidebarContent}
                        </div>
                    </div>

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
                        {children}
                    </main>
                </div>
            </div>
        </HubGuard>
    );
}
