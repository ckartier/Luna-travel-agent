import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans font-light pt-[50px] md:pt-[60px]">
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="p-3 pl-12 md:p-6 md:pl-6 max-w-7xl mx-auto relative z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
