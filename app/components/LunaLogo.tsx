import Image from 'next/image';

export function LunaLogo({ className = '', size = 40 }: { className?: string; size?: number; variant?: 'dark' | 'light' }) {
    // Maintain aspect ratio: logo is wider than tall (~3:1)
    const height = size;
    const width = Math.round(size * 3);

    return (
        <div className={`flex items-center ${className}`}>
            <Image
                src="/luna-logo.png"
                alt="Luna"
                width={width}
                height={height}
                className="object-contain"
                style={{ height: `${height}px`, width: 'auto' }}
                priority
            />
        </div>
    );
}
