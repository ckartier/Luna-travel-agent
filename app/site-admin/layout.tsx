'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Globe, Layout, Palette, Settings, BarChart3, Menu, X,
    Sparkles, Crown, Users, Trello, Calendar, Mail, Map, Package,
} from 'lucide-react';
import { LunaLogo } from '@/app/components/LunaLogo';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAccess } from '@/src/hooks/useAccess';

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface NavLink {
    name: string;
    href: string;
    icon: any;
    featureKey?: string;
}

interface NavSection {
    label: string;
    links: NavLink[];
}

export default function SiteAdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, userProfile, role } = useAuth();
    const { canAccessFeature } = useAccess();

    const photoURL = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';

    const sections: NavSection[] = [
        {
            label: '',
            links: [
                { name: 'Dashboard', href: '/site-admin', icon: Layout, featureKey: 'website-editor' },
                { name: 'Éditeur de Site', href: '/site-admin/editor', icon: Globe, featureKey: 'website-editor' },
                { name: 'Templates', href: '/site-admin/templates', icon: Palette, featureKey: 'templates' },
                { name: 'Collections', href: '/site-admin/collections', icon: Map, featureKey: 'website-editor' },
                { name: 'Prestations', href: '/site-admin/prestations', icon: Package, featureKey: 'website-editor' },
                { name: 'Analytics', href: '/site-admin/analytics', icon: BarChart3, featureKey: 'site-analytics' },
                { name: 'Tenants', href: '/site-admin/tenants', icon: Crown },
            ],
        },
        {
            label: 'CRM',
            links: [
                { name: 'Dashboard', href: '/crm', icon: Trello, featureKey: 'dashboard' },
                { name: 'Pipeline', href: '/crm/pipeline', icon: Trello, featureKey: 'pipeline' },
                { name: 'Clients', href: '/crm/contacts', icon: Users, featureKey: 'contacts' },
                { name: 'Planning', href: '/crm/planning', icon: Calendar, featureKey: 'planning' },
                { name: 'Emails', href: '/crm/mails', icon: Mail, featureKey: 'mails' },
            ],
        },
    ];

    const sidebarContent = (
        <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-end px-3 mb-2 md:hidden">
                    <button onClick={() => setMobileOpen(false)} className="text-[#9CA3AF] hover:text-[#2E2E2E] p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="pt-6 pb-8 flex justify-center">
                    <LunaLogo size={20} className="brightness-0" />
                </div>

                <Link href="/site-admin" onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center text-center mx-4 mb-8 group">
                    <div className="relative mb-2">
                        {photoURL ? (
                            <img src={photoURL} alt={displayName} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform duration-300 shadow-sm" />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-[#F5F3F0] text-[#2E2E2E] flex items-center justify-center text-lg font-medium shadow-sm">
                                {getInitials(displayName)}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                    <p className="text-sm font-medium text-[#2E2E2E] truncate w-full">{displayName}</p>
                    <p className="text-[9px] text-[#B89B7A] uppercase tracking-widest mt-0.5">{role}</p>
                </Link>

                <nav className="flex flex-col gap-4 px-4">
                    {sections.map((section, sIdx) => {
                        const hasLabel = !!section.label;
                        return (
                            <div key={sIdx}>
                                {hasLabel && (
                                    <div className="flex items-center justify-between w-full px-3 py-1.5 mb-1">
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#C4B199]">
                                            {section.label}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {section.links.map((link) => {
                                        const Icon = link.icon;
                                        const isActive = pathname === link.href;
                                        const isLocked = link.featureKey ? !canAccessFeature(link.featureKey) : false;

                                        return (
                                            <Link key={link.href}
                                                href={isLocked ? '#' : link.href}
                                                onClick={(e) => { if (isLocked) e.preventDefault(); setMobileOpen(false); }}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group border ${isActive
                                                    ? 'bg-[#bcdeea]/25 text-[#2E2E2E] font-medium shadow-sm border-[#bcdeea]/30'
                                                    : isLocked
                                                        ? 'text-[#C4B199] hover:text-[#B89B7A] hover:bg-amber-50/30 font-normal border-transparent cursor-not-allowed'
                                                        : 'text-[#6B7280] hover:text-[#2E2E2E] hover:bg-black/[0.03] font-normal border-transparent'
                                                    }`}
                                            >
                                                <Icon size={17} strokeWidth={isActive ? 2 : 1.5}
                                                    className={`shrink-0 transition-colors ${isActive
                                                        ? 'text-[#2E2E2E]'
                                                        : isLocked ? 'text-[#D4C5A9]' : 'text-[#9CA3AF] group-hover:text-[#2E2E2E]'
                                                        }`} />
                                                <span className="uppercase tracking-[0.12em] text-[11px] flex-1">{link.name}</span>
                                                {isLocked && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-100/80 to-orange-100/80 border border-amber-200/50">
                                                        <Crown size={9} className="text-amber-600" />
                                                        <span className="text-[8px] font-bold text-amber-700 uppercase tracking-wider">Pro</span>
                                                    </div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className="px-4 flex flex-col gap-1">
                <Link href="/site-admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-[0.12em] text-[#9CA3AF] hover:bg-black/[0.03] hover:text-[#2E2E2E] font-normal border border-transparent">
                    <Settings size={16} strokeWidth={1.5} />
                    Paramètres
                </Link>
            </div>
        </>
    );

    return (
        <div className="crm-root flex h-screen bg-white overflow-hidden font-sans font-normal text-sm transition-all duration-300">
            <button onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-3 z-50 bg-white p-2 rounded-xl shadow-md">
                <Menu size={18} className="text-[#2E2E2E]" />
            </button>

            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-[#2E2E2E]/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                    <div className="w-64 h-full bg-white border-r border-[#F0EBE3] flex flex-col justify-between py-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}>
                        {sidebarContent}
                    </div>
                </div>
            )}

            <div className="hidden md:flex w-[260px] h-[calc(100%-16px)] my-2 ml-2 rounded-[20px] flex-col justify-between py-8 z-50 overflow-y-auto no-scrollbar transition-all duration-500 bg-transparent">
                {sidebarContent}
            </div>

            <main className="flex-1 overflow-y-auto relative">
                <div className="p-4 md:p-8 pt-20 md:pt-[200px] w-full h-full relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
