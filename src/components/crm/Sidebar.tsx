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
    FileSignature,
    Mail,
    Sparkles,
    Star,
    ChevronDown,
} from 'lucide-react';
import { LunaLogo } from '@/app/components/LunaLogo';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTranslation } from '@/src/hooks/useTranslation';

import { useAccess } from '@/src/hooks/useAccess';
import type { PlanAccess } from '@/src/hooks/useAccess';

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface NavLink {
    name: string;
    href: string;
    icon: any;
    feature?: keyof PlanAccess; // If set, link is gated by plan
}

interface NavSection {
    label: string;
    collapsible: boolean;
    links: NavLink[];
}

export function CRMSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, userProfile, isSuperAdmin, role } = useAuth();
    const { canAccess } = useAccess();
    const { t } = useTranslation();

    const photoURL = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const email = userProfile?.email || user?.email || '';

    const [universe, setUniverse] = useState<'CLIENT' | 'PRESTATAIRE'>('CLIENT');

    const allSections: NavSection[] = [
        {
            label: '',
            collapsible: false,
            links: [
                { name: t('crm.dashboard'), href: '/crm', icon: LayoutDashboard, feature: 'dashboard' as any },
                { name: t('nav.inbox'), href: '/crm/mails', icon: Mail, feature: 'mails' as any },
                { name: t('crm.pipeline'), href: '/crm/pipeline', icon: Trello, feature: 'pipeline' as any },
                { name: t('crm.planning'), href: universe === 'CLIENT' ? '/crm/planning' : '/crm/planning/suppliers', icon: Calendar, feature: 'planning' as any },
                { name: t('crm.contacts'), href: '/crm/contacts', icon: Users, feature: 'contacts' as any },
            ].filter(link => {
                if (universe === 'PRESTATAIRE') {
                    return [t('crm.dashboard'), t('crm.planning')].includes(link.name);
                }
                return true;
            }),
        },
        {
            label: universe === 'CLIENT' ? t('nav.section.operations_voyage') : t('nav.section.operations_presta'),
            collapsible: true,
            links: universe === 'CLIENT' ? [
                { name: t('nav.bookings'), href: '/crm/bookings', icon: Plane, feature: 'bookings' as any },
                { name: t('nav.voyage_assistant'), href: '/crm/voyage-agent', icon: Sparkles, feature: 'ai' as any },
            ] : [
                { name: t('nav.catalog'), href: '/crm/catalog', icon: Hotel, feature: 'catalog' as any },
                { name: t('nav.suppliers'), href: '/crm/suppliers', icon: UsersRound, feature: 'suppliers' as any },
                { name: t('nav.prestation_assistant'), href: '/crm/prestations-agent', icon: Bot, feature: 'ai' as any },
            ],
        },
        {
            label: t('nav.section.finance'),
            collapsible: true,
            links: universe === 'CLIENT' ? [
                { name: t('nav.quotes'), href: '/crm/quotes', icon: FileSignature, feature: 'quotes' as any },
                { name: t('nav.invoices'), href: '/crm/invoices', icon: FileText, feature: 'invoices' as any },
            ] : [
                { name: t('nav.supplier_invoices'), href: '/crm/invoices', icon: FileText, feature: 'invoices' as any },
                { name: t('nav.payments'), href: '/crm/payments', icon: CreditCard, feature: 'payments' as any },
            ],
        },
        {
            label: t('nav.section.management'),
            collapsible: true,
            links: [
                { name: t('nav.team'), href: '/crm/team', icon: UsersRound, feature: 'team' as any },
                { name: t('nav.analytics'), href: '/crm/analytics', icon: BarChart3, feature: 'analytics' as any },
                { name: t('nav.integrations'), href: '/crm/integrations', icon: Plane, feature: 'integrations' as any },
            ],
        },
    ];

    // Filter sections: only show links the user can access
    const sections = allSections.map(section => ({
        ...section,
        links: section.links.filter(link => !link.feature || canAccess(link.feature)),
    })).filter(section => section.links.length > 0);

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
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-normal border-[3px] border-white">
                            {getInitials(displayName)}
                        </div>
                    )}
                    <div className="text-center min-w-0 w-full">
                        <p className="text-base font-normal text-luna-charcoal truncate leading-tight">{displayName}</p>
                        <p className="text-xs text-luna-text-muted truncate leading-tight mt-0.5">{email}</p>
                        {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                👑 Super Admin
                            </span>
                        ) : (
                            <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                {role}
                            </span>
                        )}
                    </div>
                </Link>

                {/* Universe Switcher */}
                <div className={`mx-3 mb-6 p-1.5 rounded-2xl flex gap-1 transition-colors duration-500 ${universe === 'PRESTATAIRE' ? 'bg-orange-100/60' : 'bg-gray-100/50'}`}>
                    <button
                        onClick={() => setUniverse('CLIENT')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-normal uppercase tracking-wider transition-all ${universe === 'CLIENT'
                            ? 'bg-white text-luna-charcoal shadow-sm border border-gray-100'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {t('nav.universe.client')}
                    </button>
                    <button
                        onClick={() => setUniverse('PRESTATAIRE')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-normal uppercase tracking-wider transition-all ${universe === 'PRESTATAIRE'
                            ? 'bg-white text-orange-600 shadow-sm border border-orange-200'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {t('nav.universe.prestataire')}
                    </button>
                </div>

                {/* Mission Hub CTA */}
                <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary btn-lg mx-3 mb-6 text-sm tracking-[0.1em] uppercase group"
                >
                    <Sparkles size={16} className="opacity-70" />
                    <span>{t('nav.mission_hub')}</span>
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
                                        <span className="text-[12px] font-normal text-gray-400 tracking-[0.12em] uppercase">
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
                                                    ? 'bg-luna-charcoal text-white font-normal shadow-[0_4px_14px_rgba(0,0,0,0.1)]'
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
                        ? 'bg-luna-charcoal text-white font-normal shadow-[0_4px_14px_rgba(0,0,0,0.1)]'
                        : 'text-gray-500 hover:bg-white/60 hover:text-luna-charcoal font-normal'
                        }`}>
                    <Settings size={16} strokeWidth={1.5} />
                    {t('crm.settings')}
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
                        className={`w-64 h-full backdrop-blur-2xl border-r flex flex-col justify-between py-5 shadow-xl transition-colors duration-700 ${universe === 'PRESTATAIRE' ? 'bg-[#fffaf5]/95 border-orange-100' : 'bg-white/95 border-luna-warm-gray/10'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className={`hidden md:flex w-64 h-[calc(100%-16px)] my-2 ml-2 backdrop-blur-2xl border rounded-2xl flex-col justify-between py-6 z-50 shadow-sm overflow-hidden transition-all duration-700 ${universe === 'PRESTATAIRE' ? 'bg-[#fffaf5]/90 border-orange-100/60' : 'bg-white/70 border-luna-warm-gray/10'}`}>
                {sidebarContent}
            </div>
        </>
    );
}
