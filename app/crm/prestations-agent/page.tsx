'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /crm/prestations-agent → Redirects to /crm/agent-ia (Prestations tab)
 */
export default function CRMPrestationsAgentRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/crm/agent-ia?agent=prestations');
    }, [router]);
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" /></div>;
}
