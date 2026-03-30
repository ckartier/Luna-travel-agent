'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Luna Travel CRM — Entry point
 * Clears any legal vertical override and redirects to the travel CRM.
 */
export default function LunaCRMEntry() {
    const router = useRouter();
    useEffect(() => {
        // Clear any legal override from sessionStorage/localStorage
        sessionStorage.removeItem('luna-vertical-override');
        localStorage.removeItem('luna-vertical');
        router.replace('/crm/travel');
    }, [router]);
    return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#b9dae9] rounded-full animate-spin" />
        </div>
    );
}
