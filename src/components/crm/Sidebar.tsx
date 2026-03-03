'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Trello,
    CalendarDays,
    Settings,
    Compass,
    MessageSquare,
    ArrowLeft
} from 'lucide-react';

export function CRMSidebar() {
    const pathname = usePathname();
    const links = [
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Boîte de Réception', href: '/crm/mails', icon: MessageSquare },
        { name: 'Pipeline', href: '/crm/pipeline', icon: Trello },
        { name: 'Contacts', href: '/crm/contacts', icon: Users },
        { name: 'Activités', href: '/crm/activities', icon: CalendarDays },
    ];

    return (
        <div className="w-64 h-full bg-luna-cream/80 backdrop-blur-xl border-r border-luna-warm-gray/20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between py-6 z-50">
            <div>
                {/* Logo Area */}
                <div className="px-8 mb-10 flex items-center gap-3">
                    <div className="bg-luna-charcoal text-luna-accent p-2.5 rounded-xl shadow-lg">
                        <Compass size={22} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="font-serif text-xl font-semibold text-luna-charcoal tracking-tight leading-none">Luna</h1>
                        <span className="text-[10px] font-semibold text-luna-text-muted uppercase tracking-[0.15em]">Travel CRM</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1.5 px-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm');

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive
                                    ? 'bg-luna-charcoal shadow-md text-luna-cream'
                                    : 'text-luna-text-muted hover:bg-white hover:text-luna-charcoal hover:shadow-sm'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="px-4 flex flex-col gap-1.5">
                <Link
                    href="/crm/settings"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-luna-text-muted hover:bg-white hover:text-luna-charcoal transition-all font-medium text-sm"
                >
                    <Settings size={18} strokeWidth={1.5} />
                    Paramètres
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-luna-accent-dark hover:bg-luna-accent/10 transition-all font-medium text-sm mt-1"
                >
                    <ArrowLeft size={18} strokeWidth={1.5} />
                    Orchestrateur
                </Link>
            </div>
        </div>
    );
}
