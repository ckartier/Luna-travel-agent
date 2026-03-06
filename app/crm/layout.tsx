import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans font-normal text-sm pt-[50px] md:pt-[60px]">
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="p-4 md:p-5 w-full relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
