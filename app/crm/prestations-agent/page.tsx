'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /crm/prestations-agent → Redirects to the full-screen Prestations Agent
 */
export default function CRMPrestationsAgentRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/prestations-agent');
    }, [router]);
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>;
}
