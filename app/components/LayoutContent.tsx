'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { LunaLogo } from './LunaLogo';
import { useAuth } from '@/src/contexts/AuthContext';
import { LogOut, User, Settings, Shield } from 'lucide-react';

/** Routes where the header/nav should be hidden */
const HEADERLESS_ROUTES = ['/login', '/landing', '/pricing', '/cgv', '/admin'];

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, userProfile, logout } = useAuth();
    const showHeader = !HEADERLESS_ROUTES.includes(pathname) && !pathname.startsWith('/crm') && !!user;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                            <LunaLogo size={34} />
                        </Link>
                        <nav className="flex items-center gap-1">
                            <Link href="/" className="text-luna-charcoal px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-semibold rounded-full bg-luna-charcoal/5 uppercase tracking-wider">Voyages</Link>
                            <Link href="/crm" className="text-luna-text-muted hover:text-luna-charcoal px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-semibold rounded-full transition-colors uppercase tracking-wider">CRM</Link>
                        </nav>

                        {/* Avatar inside the pill */}
                        <div ref={dropdownRef} className="relative ml-1">
                            <button onClick={() => setDropdownOpen(p => !p)} className="rounded-full transition-transform hover:scale-105 active:scale-95">
                                {photoURL ? (
                                    <img src={photoURL} alt={displayName} className="w-[43px] h-[43px] rounded-full object-cover border-[3px] border-white shadow-md" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-[43px] h-[43px] rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold border-[3px] border-white shadow-md">
                                        {getInitials(displayName)}
                                    </div>
                                )}
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-60 bg-white/95 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/15 shadow-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-luna-warm-gray/10">
                                        <p className="text-sm font-semibold text-luna-charcoal truncate">{displayName}</p>
                                        <p className="text-[11px] text-luna-text-muted truncate">{email}</p>
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
