'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Monum CRM — Entry point
 * Persists Monum vertical override, then redirects to shared CRM shell.
 */
export default function MonumCRMEntry() {
    const router = useRouter();

    useEffect(() => {
        sessionStorage.setItem('luna-vertical-override', 'monum');
        localStorage.setItem('luna-vertical', 'monum');
        router.replace('/crm?vertical=monum');
    }, [router]);

    return (
        <div className="flex min-h-screen flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5a8fa3]" />
        </div>
    );
}
