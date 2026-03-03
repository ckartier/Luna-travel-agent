export function LunaLogo({ className = '', size = 40, variant = 'dark' }: { className?: string; size?: number; variant?: 'dark' | 'light' }) {
    const moonColor = variant === 'dark' ? '#2c2c2c' : '#e2e8f0';
    const accentColor = '#b8956a';

    return (
        <div className={`flex items-center gap-0 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Crescent moon */}
                <path
                    d="M 55 10
             A 40 40 0 1 0 55 90
             A 30 30 0 1 1 55 10 Z"
                    fill={moonColor}
                />

                {/* Two lines from center going upper-right */}
                <line x1="52" y1="48" x2="78" y2="22" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="56" y1="52" x2="82" y2="26" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />

                {/* Cross (star) at the tip */}
                <line x1="80" y1="14" x2="80" y2="34" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="70" y1="24" x2="90" y2="24" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />

                {/* Small glow dot at cross center */}
                <circle cx="80" cy="24" r="2" fill={accentColor} />
            </svg>
        </div>
    );
}
