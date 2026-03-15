'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Le Droit Agent CRM — Entry point (SuperAdmin only)
 * Uses the new sessionStorage vertical override instead of localStorage.
 * Session is cleared on browser close — no cross-CRM leakage.
 */
export default function AvocatCRMEntry() {
    const router = useRouter();
    useEffect(() => {
        // New system: sessionStorage (temp, resets on browser close)
        sessionStorage.setItem('luna-vertical-override', 'legal');
        // Remove any stale localStorage entry
        localStorage.removeItem('luna-vertical');
        router.replace('/crm?vertical=legal');
    }, [router]);
    return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#5a8fa3] rounded-full animate-spin" />
        </div>
    );
}
