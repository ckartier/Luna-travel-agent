import { CRMSidebar } from '@/src/components/crm/Sidebar';
import { ReactNode } from 'react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <CRMSidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute inset-0 bg-[url('/bg-patterns.svg')] opacity-5 pointer-events-none" />
                <div className="p-8 max-w-7xl mx-auto relative z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
