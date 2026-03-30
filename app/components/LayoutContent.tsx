'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { LunaLogo } from './LunaLogo';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import { LogOut, User, Settings, Shield } from 'lucide-react';

/** Routes where the header/nav should be hidden */
const HEADERLESS_ROUTES = ['/login', '/landing', '/pricing', '/cgv', '/admin', '/conciergerie', '/client', '/trip', '/demos', '/hub', '/welcome', '/pro', '/pdfcreator'];

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '/';
    const { user, userProfile, logout } = useAuth();
    const { vertical } = useVertical();
    const showHeader = !HEADERLESS_ROUTES.some(r => pathname.startsWith(r)) && !pathname.startsWith('/crm') && !pathname.startsWith('/site-admin') && !!user;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const crmHomeHref =
        vertical.id === 'legal'
            ? '/crm/legal'
            : vertical.id === 'monum'
                ? '/crm/monum'
                : '/crm/travel';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

    const photoURL = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'Utilisateur';
    const email = userProfile?.email || user?.email || '';

    return (
        <>
            {showHeader && (
                <header className="absolute top-3 left-3 right-3 md:top-5 md:left-5 md:right-5 z-50 pointer-events-none flex justify-between items-start">
                    <div className="glass-pill px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-3 md:gap-6 pointer-events-auto shadow-glass">
                        <Link href="/" className="flex items-center gap-1.5 md:gap-2">
                            <LunaLogo size={32} />
                        </Link>
                        <nav className="flex items-center gap-1.5">
                            <Link href="/" className={`${pathname === '/' ? 'bg-luna-charcoal/5 text-luna-charcoal' : 'text-luna-text-muted hover:text-luna-charcoal'} px-3 py-1 text-[11px] font-bold rounded-full transition-all uppercase tracking-widest`}>L&apos;Agence</Link>
                            <Link href="/voyage-agent" className={`${pathname === '/voyage-agent' ? 'bg-blue-500/10 text-blue-600' : 'text-luna-text-muted hover:text-luna-charcoal'} px-3 py-1 text-[11px] font-bold rounded-full transition-all uppercase tracking-widest`}>Voyages</Link>
                            <Link href={crmHomeHref} className={`${pathname.startsWith('/crm') ? 'bg-luna-charcoal text-white shadow-sm' : 'text-luna-text-muted hover:text-luna-charcoal'} px-3 py-1 text-[11px] font-bold rounded-full transition-all uppercase tracking-widest`}>CRM</Link>
                        </nav>

                        {/* Avatar inside the pill */}
                        <div ref={dropdownRef} className="relative ml-1">
                            <button onClick={() => setDropdownOpen(p => !p)} className="rounded-full transition-transform hover:scale-105 active:scale-95">
                                {photoURL ? (
                                    <img src={photoURL} alt={displayName} className="w-[40px] h-[40px] rounded-full object-cover border-[2px] border-white shadow-sm" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-normal border-[2px] border-white shadow-sm">
                                        {getInitials(displayName)}
                                    </div>
                                )}
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-60 bg-white/95 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/15 shadow-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-luna-warm-gray/10">
                                        <p className="text-sm font-normal text-luna-charcoal truncate">{displayName}</p>
                                        <p className="text-[12px] text-luna-text-muted truncate">{email}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link href="/crm/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-luna-charcoal hover:bg-luna-cream/80 transition-colors">
                                            <User size={14} strokeWidth={1.5} className="text-luna-text-muted" /> Mon Profil
                                        </Link>
                                        <Link href="/crm/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-luna-charcoal hover:bg-luna-cream/80 transition-colors">
                                            <Settings size={14} strokeWidth={1.5} className="text-luna-text-muted" /> Paramètres
                                        </Link>
                                        {userProfile?.role === 'Admin' && (
                                            <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-violet-600 hover:bg-violet-50 transition-colors">
                                                <Shield size={14} strokeWidth={1.5} /> Administration
                                            </Link>
                                        )}
                                    </div>
                                    <div className="border-t border-luna-warm-gray/10 py-1">
                                        <button onClick={() => { setDropdownOpen(false); logout(); }} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                                            <LogOut size={14} strokeWidth={1.5} /> Déconnexion
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}
            <main className="w-full h-full">
                {children}
            </main>
        </>
    );
}
