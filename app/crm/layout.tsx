import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-luna-bg overflow-hidden font-sans">
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="p-8 max-w-7xl mx-auto relative z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
