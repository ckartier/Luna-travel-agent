'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Trello,
    Calendar,
    BarChart3,
    Settings,
    Menu,
    X,
    Plane,
    Hotel,
    FileText,
    CreditCard,
    UsersRound,
    FileSignature,
    Mail,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    Wrench,
    Lock,
    Crown,
    Map,
    Palette,
} from 'lucide-react';

import { useAuth } from '@/src/contexts/AuthContext';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useVertical } from '@/src/contexts/VerticalContext';
import { getIcon } from '@/src/lib/utils/iconMap';

import { useAccess, FEATURE_MODULE } from '@/src/hooks/useAccess';
import type { PlanAccess } from '@/src/hooks/useAccess';
import { BugReportButton } from './BugReportButton';


function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface NavLink {
    name: string;
    href: string;
    icon: any;
    feature?: keyof PlanAccess;
    featureKey?: string; // Module-based feature key
}

interface NavSection {
    label: string;
    collapsible: boolean;
    links: NavLink[];
}

// ═══ NAVIGATION SECTIONS — Resolved from vertical config ═══

interface CRMSidebarProps {
}

export function CRMSidebar({}: CRMSidebarProps) {
    const pathname = usePathname() || '/';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user, userProfile, isSuperAdmin, role } = useAuth();
    const { canAccess, canAccessFeature, hasModule, plan } = useAccess();
    const { t } = useTranslation();
    const { vertical, vt, switchVertical } = useVertical();
    const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

    const [customLogo, setCustomLogo] = useState<string | null>(null);

    // ═══ DETECT CRM MODE ═══
    const isLegal = vertical?.id === 'legal';

    // Fetch custom logo from site-config (travel only)
    useEffect(() => {
        if (isLegal) return;
        fetch('/api/crm/site-config')
            .then(r => r.json())
            .then(data => { if (data?.global?.logo) setCustomLogo(data.global.logo); })
            .catch(() => {});
    }, [isLegal]);

    const toggleSection = (idx: number) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const photoURL = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const email = userProfile?.email || user?.email || '';

    // ═══ NAVIGATION — Generic based on vertical config ═══
    const allSections: NavSection[] = vertical.sidebar.map(section => ({
        label: typeof section.label === 'string' ? section.label : vt(section.label),
        collapsible: section.collapsible,
        links: section.links.map(link => ({
            name: vt(link.name),
            href: link.href,
            icon: getIcon(link.icon),
            featureKey: link.featureKey,
        })),
    }));
    const accent = vertical.accentColor || '#5a8fa3';
    const accentLight = vertical.accentColorLight || '#bcdeea';

    const sidebarContent = (
        <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Mobile close button */}
                <div className="flex justify-end px-3 mb-2 md:hidden">
                    <button onClick={() => setMobileOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Logo — Custom or Vertical Branding */}
                <div className="pt-6 pb-8 flex justify-center text-center">
                    {customLogo ? (
                        <img src={customLogo} alt="Logo" className="h-5 w-auto object-contain brightness-0" onError={() => setCustomLogo(null)} />
                    ) : (
                        <span className="text-[15px] font-semibold uppercase text-[#2E2E2E]" style={{ letterSpacing: '0.2em' }}>
                            {vertical.branding.appName}
                        </span>
                    )}
                </div>

                {/* User Info Capsule */}
                <Link
                    href="/crm/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center text-center mx-4 mb-8 group"
                >
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

                {/* ═══ AGENT IA ═══ */}
                <div className="px-4 mb-6 flex justify-center">
                    <Link
                        href="/crm/agent-ia"
                        onClick={() => setMobileOpen(false)}
                        className="group relative flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all duration-300 border shadow-sm hover:shadow-lg"
                        style={pathname === '/crm/agent-ia' ? {
                            backgroundColor: `${accentLight}33`,
                            borderColor: accentLight,
                            boxShadow: `0 4px 20px ${accent}22`,
                        } : {
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            borderColor: '#E5E7EB',
                        }}
                    >
                        {/* Super Agent icon */}
                        <div className="relative w-11 h-11 shrink-0 rounded-full flex items-center justify-center sidebar-agent-pulse">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={pathname === '/crm/agent-ia' ? accent : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <rect x="3" y="6" width="18" height="14" rx="3" />
                                <rect x="8" y="11" width="2.5" height="3" rx="0.5" />
                                <rect x="13.5" y="11" width="2.5" height="3" rx="0.5" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-start">
                            <span
                                className="uppercase tracking-[0.15em] text-[13px] font-semibold transition-colors"
                                style={{ color: pathname === '/crm/agent-ia' ? accent : '#2E2E2E' }}
                            >{vt(vertical.aiAgent.name)}</span>
                            <span
                                className="text-[9px] tracking-wider transition-colors"
                                style={{ color: pathname === '/crm/agent-ia' ? `${accent}99` : '#6B728099' }}
                            >{vt(vertical.aiAgent.subtitle)}</span>
                        </div>
                    </Link>
                </div>

                <style>{`
                    .sidebar-agent-pulse {
                        animation: sidebarHalo 3s ease-in-out infinite;
                    }
                    @keyframes sidebarHalo {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow:
                                0 0 10px 3px ${accentLight}55,
                                0 0 25px 8px ${accent}15;
                        }
                        50% {
                            transform: scale(1.06);
                            box-shadow:
                                0 0 18px 6px ${accentLight}88,
                                0 0 40px 14px ${accent}25;
                        }
                    }
                    .sidebar-item-active {
                        animation: sidebarActiveIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
                    }
                    @keyframes sidebarActiveIn {
                        0% { opacity: 0.6; transform: scale(0.97); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Navigation Blocks */}
                <nav className="flex flex-col gap-3 px-4">
                    {allSections.map((section, sIdx) => {
                        const isCollapsed = collapsedSections.has(sIdx);
                        const hasLabel = !!section.label;
                        return (
                            <div key={sIdx}>
                                {hasLabel ? (
                                    <button
                                        onClick={() => toggleSection(sIdx)}
                                        className="flex items-center justify-between w-full px-3 py-1.5 mb-1 cursor-pointer group"
                                    >
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#C4B199] group-hover:text-[#B89B7A] transition-colors">
                                            {section.label}
                                        </span>
                                        <ChevronDown
                                            size={12}
                                            className={`text-[#C4B199] transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                        />
                                    </button>
                                ) : null}
                                <div
                                    className="overflow-hidden transition-all duration-300 ease-in-out"
                                    style={{
                                        maxHeight: isCollapsed ? '0px' : `${section.links.length * 48}px`,
                                        opacity: isCollapsed ? 0 : 1,
                                    }}
                                >
                                    <div className="space-y-0.5">
                                        {section.links.map((link) => {
                                            const Icon = link.icon;
                                            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm');
                                            const isLocked = link.featureKey ? !canAccessFeature(link.featureKey) : false;

                                            return (
                                                <Link
                                                    key={link.name}
                                                    href={link.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group border ${
                                                        isActive
                                                            ? 'font-medium shadow-sm sidebar-item-active'
                                                            : isLocked
                                                                ? 'text-[#C4B199] hover:text-[#B89B7A] hover:bg-amber-50/30 font-normal border-transparent'
                                                                : 'text-[#6B7280] hover:text-[#2E2E2E] hover:bg-black/[0.03] font-normal border-transparent'
                                                    }`}
                                                    style={isActive ? {
                                                        backgroundColor: accentLight,
                                                        borderColor: `${accent}55`,
                                                        color: '#2E2E2E',
                                                    } : undefined}
                                                >
                                                    <Icon
                                                        size={17}
                                                        strokeWidth={isActive ? 2 : 1.5}
                                                        className={`shrink-0 transition-colors ${isActive
                                                            ? 'text-[#2E2E2E]'
                                                            : isLocked
                                                                ? 'text-[#D4C5A9] group-hover:text-[#B89B7A]'
                                                                : 'text-[#9CA3AF] group-hover:text-[#2E2E2E]'
                                                            }`}
                                                    />
                                                    <span className="sidebar-text uppercase tracking-[0.12em] text-[11px] flex-1">{link.name}</span>
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
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div className="px-4 flex flex-col gap-1">
                <Link href="/crm/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-[0.12em] border"
                    style={pathname === '/crm/settings' ? {
                        backgroundColor: `${accentLight}CC`,
                        color: '#2E2E2E',
                        fontWeight: 500,
                        borderColor: `${accent}44`,
                    } : {
                        color: '#9CA3AF',
                        borderColor: 'transparent',
                    }}
                >
                    <Settings size={16} strokeWidth={1.5} />
                    {t('crm.settings')}
                </Link>

            </div>
        </>
    );


    return (
        <>

            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-[68px] left-3 z-50 bg-white p-2 rounded-xl shadow-md"
            >
                <Menu size={18} className="text-[#2E2E2E]" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-[#2E2E2E]/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                    <div
                        className="w-64 h-full bg-white border-r border-[#F0EBE3] flex flex-col justify-between py-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden md:block relative" style={{ width: collapsed ? '0px' : '260px', transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                <div
                    className={`h-[calc(100%-16px)] my-2 ml-2 rounded-[20px] flex flex-col justify-between py-8 z-50 overflow-y-auto no-scrollbar bg-transparent transition-all duration-[350ms] ease-in-out ${
                        collapsed ? 'opacity-0 -translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'
                    }`}
                    style={{ width: '260px' }}
                >
                    {sidebarContent}
                </div>

                {/* ═══ TOGGLE TAB — languette ═══ */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="absolute top-[65%] -translate-y-1/2 z-[60] flex items-center justify-center transition-all duration-300 group"
                    style={{
                        right: collapsed ? '-16px' : '-14px',
                        width: '28px',
                        height: '56px',
                    }}
                    title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
                >
                    <div className="w-full h-full rounded-r-xl bg-white/90 backdrop-blur-sm border border-l-0 border-gray-200/60 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                        {collapsed ? (
                            <ChevronRight size={14} className="text-gray-400 group-hover:text-luna-charcoal transition-colors" />
                        ) : (
                            <ChevronLeft size={14} className="text-gray-400 group-hover:text-luna-charcoal transition-colors" />
                        )}
                    </div>
                </button>
            </div>
        </>
    );
}
