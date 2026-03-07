'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /crm/voyage-agent → Redirects to the full-screen Voyage Agent
 */
export default function CRMVoyageAgentRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/voyage-agent');
    }, [router]);
    return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" /></div>;
}
