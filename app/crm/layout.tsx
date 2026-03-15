'use client';

import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { NotificationBell } from '@/src/components/crm/NotificationBell';
import { GlobalSearch } from '@/src/components/crm/GlobalSearch';
import { HelpChatbot } from '@/src/components/crm/HelpChatbot';
import { ProductTour } from '@/src/components/crm/ProductTour';
import { CRMPageGuard } from '@/src/components/crm/CRMPageGuard';
import { VoiceAgentPanel } from '@/src/components/crm/VoiceAgentPanel';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`crm-root flex h-screen bg-white overflow-hidden font-sans font-normal text-sm transition-all duration-300`}>
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
                <div className="px-4 pb-4 md:px-8 md:pb-8 pt-20 w-full h-full relative z-10">
                    <CRMPageGuard>
                        {children}
                    </CRMPageGuard>
                </div>
            </main>

            <GlobalSearch />
            <NotificationBell />
            <HelpChatbot />
            <VoiceAgentPanel />
            <ProductTour />
        </div>
    );
}
