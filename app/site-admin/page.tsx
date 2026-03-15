'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SiteAdminRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/crm'); }, [router]);
    return null;
}
