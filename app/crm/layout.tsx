'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { NotificationBell } from '@/src/components/crm/NotificationBell';
import { GlobalSearch } from '@/src/components/crm/GlobalSearch';
import { HelpChatbot } from '@/src/components/crm/HelpChatbot';
import { ProductTour } from '@/src/components/crm/ProductTour';
import { CRMPageGuard } from '@/src/components/crm/CRMPageGuard';
import { VoiceAgentPanel } from '@/src/components/crm/VoiceAgentPanel';
import { AIHub } from '@/src/components/crm/AIHub';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { ReactNode } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CRMLayout({ children }: { children: ReactNode }) {
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const pathname = usePathname() || '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userProfile, loading } = useAuth();
    const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

    // Hard stop: Monum must use the dedicated Paris Renov Tracker CRM, not the shared CRM shell.
    useEffect(() => {
        const queryVertical = searchParams?.get('vertical');
        const isMonumContext =
            pathname.startsWith('/crm/monum')
            || (pathname === '/crm' && queryVertical === 'monum');

        if (!isMonumContext) return;
        window.location.replace(`${monumAppUrl}/app`);
    }, [pathname, searchParams, monumAppUrl]);

    useEffect(() => {
        if (loading) return;
        if (userProfile?.accessScope === 'pro_travel') {
            router.replace('/pro/travel');
        }
    }, [loading, userProfile?.accessScope, router]);

    const handleOpenVoice = useCallback(() => {
        setChatOpen(false); // close chat if open
        setVoiceOpen(true);
    }, []);

    const handleOpenChat = useCallback(() => {
        setVoiceOpen(false); // close voice if open
        setChatOpen(true);
    }, []);

    const [bgConfig, setBgConfig] = useState<{type: string, url?: string, color?: string} | null>(null);

    useEffect(() => {
        fetchWithAuth('/api/hub/config')
            .then(res => res.json())
            .then(data => {
                if (data?.global?.crmBgType) {
                    setBgConfig({
                        type: data.global.crmBgType,
                        url: data.global.crmBgUrl,
                        color: data.global.crmBgColor || '#ffffff'
                    });
                }
            }).catch(() => {});
    }, []);

    if (userProfile?.accessScope === 'pro_travel') {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
            </div>
        );
    }

    return (
        <div className="crm-root flex h-screen overflow-hidden font-sans font-normal text-sm transition-all duration-300"
             style={{ backgroundColor: (!bgConfig || bgConfig.type === 'color') ? (bgConfig?.color || '#ffffff') : '#ffffff' }}>
            
            {bgConfig?.type === 'image' && bgConfig.url && (
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${bgConfig.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            {bgConfig?.type === 'video' && bgConfig.url && (
                <video src={bgConfig.url} autoPlay loop muted playsInline className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none" />
            )}
            
            <div className="relative z-10 flex w-full h-full">
                <CRMSidebar />
                <main className={`flex-1 overflow-y-auto relative transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${bgConfig?.type && bgConfig.type !== 'color' ? 'bg-white/80 backdrop-blur-2xl' : 'bg-transparent'}`}>
                    <div className="crm-shell-content px-4 pb-5 md:px-8 md:pb-8 pt-[112px] md:pt-[120px] w-full min-h-full relative z-10">
                        <div className="crm-page-frame w-full mx-auto">
                            <CRMPageGuard>
                                {children}
                            </CRMPageGuard>
                        </div>
                    </div>
                </main>
            </div>

            <div className="relative z-20">
                <GlobalSearch />
                <NotificationBell />

                {/* ═══ UNIFIED AI HUB — single button, 3 options ═══ */}
                <AIHub onOpenVoice={handleOpenVoice} onOpenChat={handleOpenChat} />
                <VoiceAgentPanel externalOpen={voiceOpen} onExternalClose={() => setVoiceOpen(false)} />
                <HelpChatbot externalOpen={chatOpen} onExternalClose={() => setChatOpen(false)} />

                <ProductTour />
            </div>
        </div>
    );
}
