'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Trello,
    CalendarDays,
    Settings,
    LogOut,
    Plane,
    MessageSquare,
    Search
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
        <div className="w-64 h-full bg-white/60 backdrop-blur-xl border-r border-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between py-6 z-50">
            <div>
                {/* Logo Area */}
                <div className="px-8 mb-10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30">
                        <Plane size={24} className="-rotate-45" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-gray-900 tracking-tight leading-none">LUNA</h1>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Travel CRM</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 mb-6">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Recherche globale..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/80 rounded-xl text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white shadow-sm transition-all"
                        />
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
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive
                                    ? 'bg-blue-600 shadow-md shadow-blue-500/20 text-white'
                                    : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="px-4 flex flex-col gap-1.5">
                <Link
                    href="/crm/settings"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-white hover:text-gray-800 transition-all font-bold text-sm"
                >
                    <Settings size={18} />
                    Paramètres
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all font-bold text-sm mt-1"
                >
                    <LogOut size={18} />
                    Orchestrateur
                </Link>
            </div>
        </div>
    );
}
