'use client';

import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { NotificationBell } from '@/src/components/crm/NotificationBell';
import { ReactNode, useState, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Listen for fullscreen changes (e.g. user presses Esc)
    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    return (
        <div className={`flex h-screen bg-white overflow-hidden font-sans font-normal text-sm transition-all duration-300 ${isFullscreen ? 'pt-0' : 'pt-[50px] md:pt-[60px]'}`}>
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="p-4 md:p-5 w-full relative z-10">
                    {children}
                </div>
            </main>
            {/* Global notification bell — visible on ALL CRM pages */}
            <NotificationBell />

            {/* Fullscreen toggle button */}
            <button
                onClick={toggleFullscreen}
                className={`fixed z-[60] transition-all duration-300 group ${isFullscreen
                    ? 'top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white shadow-lg'
                    : 'bottom-4 right-4 bg-luna-charcoal/80 hover:bg-luna-charcoal text-white shadow-lg'
                    } backdrop-blur-xl px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs font-medium`}
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
                {isFullscreen ? (
                    <>
                        <Minimize2 size={16} />
                        <span className="hidden group-hover:inline">Quitter</span>
                    </>
                ) : (
                    <>
                        <Maximize2 size={16} />
                        <span className="hidden group-hover:inline">Plein écran</span>
                    </>
                )}
            </button>
        </div>
    );
}
