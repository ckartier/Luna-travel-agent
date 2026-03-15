'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /crm/voyage-agent → Redirects to /crm/agent-ia (Voyage tab)
 */
export default function CRMVoyageAgentRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/crm/agent-ia?agent=voyage');
    }, [router]);
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" /></div>;
}
