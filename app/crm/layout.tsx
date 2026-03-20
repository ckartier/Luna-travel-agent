'use client';

import { useState, useCallback, useEffect } from 'react';
import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { NotificationBell } from '@/src/components/crm/NotificationBell';
import { GlobalSearch } from '@/src/components/crm/GlobalSearch';
import { HelpChatbot } from '@/src/components/crm/HelpChatbot';
import { ProductTour } from '@/src/components/crm/ProductTour';
import { CRMPageGuard } from '@/src/components/crm/CRMPageGuard';
import { VoiceAgentPanel } from '@/src/components/crm/VoiceAgentPanel';
import { AIHub } from '@/src/components/crm/AIHub';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

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
        fetch('/api/hub/config').then(res => res.json()).then(data => {
            if (data?.global?.crmBgType) {
                setBgConfig({
                    type: data.global.crmBgType,
                    url: data.global.crmBgUrl,
                    color: data.global.crmBgColor || '#ffffff'
                });
            }
        }).catch(() => {});
    }, []);

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
                    <div className="px-4 pb-4 md:px-8 md:pb-8 pt-[135px] w-full h-full relative z-10">
                        <CRMPageGuard>
                            {children}
                        </CRMPageGuard>
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

