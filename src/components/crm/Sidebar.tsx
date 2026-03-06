'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Trello,
    CalendarDays,
    Calendar,
    MessageSquare,
    BarChart3,
    Settings,
    Menu,
    X,
    Plane,
    Hotel,
    FileText,
    CreditCard,
    ShieldCheck,
    Megaphone,
    ListChecks,
    UsersRound,
    Bot,
    Mail,
    Sparkles,
    ChevronDown,
} from 'lucide-react';
import { LunaLogo } from '@/app/components/LunaLogo';
import { useAuth } from '@/src/contexts/AuthContext';

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface NavSection {
    label: string;
    collapsible: boolean;
    links: { name: string; href: string; icon: any }[];
}

export function CRMSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, userProfile } = useAuth();

    const photoURL = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const email = userProfile?.email || user?.email || '';

    const sections: NavSection[] = [
        {
            label: '',
            collapsible: false,
            links: [
                { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
                { name: 'Boîte de Réception', href: '/crm/mails', icon: Mail },
                { name: 'Pipeline', href: '/crm/pipeline', icon: Trello },
                { name: 'Planning', href: '/crm/planning', icon: Calendar },
                { name: 'Contacts', href: '/crm/contacts', icon: Users },
                { name: 'Activités', href: '/crm/activities', icon: CalendarDays },
            ],
        },
        {
            label: 'Opérations',
            collapsible: true,
            links: [
                { name: 'Réservations', href: '/crm/bookings', icon: Plane },
                { name: 'Catalogue', href: '/crm/catalog', icon: Hotel },
            ],
        },
        {
            label: 'Finance',
            collapsible: true,
            links: [
                { name: 'Factures', href: '/crm/invoices', icon: FileText },
                { name: 'Paiements', href: '/crm/payments', icon: CreditCard },
            ],
        },
        {
            label: 'Communication',
            collapsible: true,
            links: [
                { name: 'Messages', href: '/crm/messages', icon: MessageSquare },
                { name: 'Documents', href: '/crm/documents', icon: ShieldCheck },
                { name: 'Marketing', href: '/crm/marketing', icon: Megaphone },
            ],
        },
        {
            label: 'Gestion',
            collapsible: true,
            links: [
                { name: 'Tâches', href: '/crm/tasks', icon: ListChecks },
                { name: 'Équipe', href: '/crm/team', icon: UsersRound },
                { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
                { name: 'Assistant IA', href: '/crm/ai', icon: Bot },
                { name: 'Intégrations', href: '/crm/integrations', icon: Plane },
            ],
        },
    ];

    // Auto-open sections that contain the active link
    const getInitialOpenSections = () => {
        const open: Record<string, boolean> = {};
        sections.forEach(section => {
            if (!section.collapsible) return;
            const hasActive = section.links.some(link =>
                pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm')
            );
            open[section.label] = hasActive;
        });
        return open;
    };

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(getInitialOpenSections);

    // Update open sections when pathname changes
    useEffect(() => {
        sections.forEach(section => {
            if (!section.collapsible) return;
            const hasActive = section.links.some(link =>
                pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm')
            );
            if (hasActive) {
                setOpenSections(prev => ({ ...prev, [section.label]: true }));
            }
        });
    }, [pathname]);

    const toggleSection = (label: string) => {
        setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const sidebarContent = (
        <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Mobile close button */}
                <div className="flex justify-end px-3 mb-2 md:hidden">
                    <button onClick={() => setMobileOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* User avatar — circle */}
                <Link
                    href="/crm/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center gap-2 mx-3 px-3 py-5 mb-3 rounded-xl hover:bg-white/40 transition-all group"
                >
                    {photoURL ? (
                        <img src={photoURL} alt={displayName} className="w-14 h-14 rounded-full object-cover border-[3px] border-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-shadow" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-semibold border-[3px] border-white">
                            {getInitials(displayName)}
                        </div>
                    )}
                    <div className="text-center min-w-0 w-full">
                        <p className="text-base font-medium text-luna-charcoal truncate leading-tight">{displayName}</p>
                        <p className="text-xs text-luna-text-muted truncate leading-tight mt-0.5">{email}</p>
                    </div>
                </Link>

                {/* Voyages CTA */}
                <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary btn-lg mx-3 mb-4 text-sm tracking-[0.1em] uppercase group"
                >
                    <Sparkles size={16} className="opacity-70" />
                    <span>Voyages</span>
                </Link>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5 px-3">
                    {sections.map((section, sIdx) => {
                        const isOpen = !section.collapsible || openSections[section.label];

                        return (
                            <div key={sIdx}>
                                {section.label && (
                                    <button
                                        onClick={() => section.collapsible && toggleSection(section.label)}
                                        className={`w-full flex items-center justify-between px-3 pt-5 pb-2 group ${section.collapsible ? 'cursor-pointer' : ''}`}
                                    >
                                        <span className="text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase">
                                            {section.label}
                                        </span>
                                        {section.collapsible && (
                                            <ChevronDown
                                                size={14}
                                                className={`text-gray-300 group-hover:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                                            />
                                        )}
                                    </button>
                                )}
                                <div
                                    className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    {section.links.map((link) => {
                                        const Icon = link.icon;
                                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm');

                                        return (
                                            <Link
                                                key={link.name}
                                                href={link.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${isActive
                                                    ? 'bg-luna-charcoal text-white font-medium shadow-[0_4px_14px_rgba(0,0,0,0.1)]'
                                                    : 'text-gray-500 hover:bg-white/60 hover:text-luna-charcoal font-normal'
                                                    }`}
                                            >
                                                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                                                {link.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className="px-3 flex flex-col gap-1">
                <Link href="/crm/settings"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${pathname === '/crm/settings'
                        ? 'bg-luna-charcoal text-white font-medium shadow-[0_4px_14px_rgba(0,0,0,0.1)]'
                        : 'text-gray-500 hover:bg-white/60 hover:text-luna-charcoal font-normal'
                        }`}>
                    <Settings size={16} strokeWidth={1.5} />
                    Paramètres
                </Link>
                {/* Luna logo — footer branding */}
                <div className="flex justify-center pt-4 pb-2 opacity-40">
                    <LunaLogo size={16} />
                </div>
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
            <div className="hidden md:flex w-64 h-[calc(100%-16px)] my-2 ml-2 bg-white/70 backdrop-blur-2xl border border-luna-warm-gray/10 rounded-2xl flex-col justify-between py-6 z-50 shadow-sm overflow-hidden">
                {sidebarContent}
            </div>
        </>
    );
}
