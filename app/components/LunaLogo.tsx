'use client';

import { useLogo } from '@/src/hooks/useSiteConfig';

/**
 * Luna Logo — fetches the logo from Firebase site_config.
 * Falls back to /luna-logo-blue.svg if not set.
 * "size" controls the height in pixels. Width auto-scales.
 */
export function LunaLogo({ className = '', size = 28 }: { className?: string; size?: number }) {
    const logo = useLogo();

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={logo}
            alt="Luna"
            className={`object-contain ${className}`}
            style={{ height: `${size}px`, width: 'auto' }}
        />
    );
}
