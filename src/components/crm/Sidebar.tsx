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
    MessageSquare
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

                {/* Navigation */}
                <nav className="flex flex-col gap-2 px-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/crm');

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${isActive
                                    ? 'bg-blue-600 shadow-md shadow-blue-500/20 text-white'
                                    : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                                    }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="px-4 flex flex-col gap-2">
                <Link
                    href="/crm/settings"
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 hover:bg-white hover:text-gray-800 transition-all font-bold"
                >
                    <Settings size={20} />
                    Paramètres
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all font-bold mt-2"
                >
                    <LogOut size={20} />
                    Orchestrateur
                </Link>
            </div>
        </div>
    );
}
