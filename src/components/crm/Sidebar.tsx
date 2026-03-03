'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Trello,
    CalendarDays,
    MessageSquare,
    Settings,
    ArrowLeft,
    Menu,
    X
} from 'lucide-react';
import { LunaLogo } from '@/app/components/LunaLogo';

export function CRMSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const links = [
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Boîte de Réception', href: '/crm/mails', icon: MessageSquare },
        { name: 'Pipeline', href: '/crm/pipeline', icon: Trello },
        { name: 'Contacts', href: '/crm/contacts', icon: Users },
        { name: 'Activités', href: '/crm/activities', icon: CalendarDays },
    ];

    const sidebarContent = (
        <>
            <div>
                {/* Logo */}
                <div className="px-5 mb-8 flex items-center gap-2.5">
                    <LunaLogo size={24} />
                    <div>
                        <h1 className="font-serif text-base font-semibold text-luna-charcoal tracking-tight leading-none">Luna</h1>
                        <span className="text-[8px] font-semibold text-luna-text-muted uppercase tracking-[0.15em]">CRM</span>
                    </div>
                    {/* Close button on mobile */}
                    <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-luna-text-muted hover:text-luna-charcoal p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5 px-3">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm');

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[13px] ${isActive
                                    ? 'bg-luna-charcoal text-white font-medium shadow-sm'
                                    : 'text-luna-text-muted hover:bg-luna-cream hover:text-luna-charcoal font-light'
                                    }`}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="px-3 flex flex-col gap-0.5">
                <Link href="/crm/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-luna-text-muted hover:bg-luna-cream hover:text-luna-charcoal transition-all text-[13px] font-light">
                    <Settings size={15} strokeWidth={1.5} />
                    Paramètres
                </Link>
                <Link href="/"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sky-600 hover:bg-sky-50 transition-all text-[13px] font-medium mt-1">
                    <ArrowLeft size={15} strokeWidth={1.5} />
                    Orchestrateur
                </Link>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-[68px] left-3 z-50 bg-white/90 backdrop-blur-xl p-2 rounded-xl border border-luna-warm-gray/20 shadow-sm"
            >
                <Menu size={18} className="text-luna-charcoal" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-luna-charcoal/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                    <div
                        className="w-64 h-full bg-white/95 backdrop-blur-2xl border-r border-luna-warm-gray/10 flex flex-col justify-between py-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden md:flex w-56 h-[calc(100%-16px)] my-2 ml-2 bg-white/70 backdrop-blur-2xl border border-luna-warm-gray/10 rounded-2xl flex-col justify-between py-5 z-50 shadow-sm overflow-hidden">
                {sidebarContent}
            </div>
        </>
    );
}
