import Image from 'next/image';

export function LunaLogo({ className = '', size = 40 }: { className?: string; size?: number }) {
    const height = size;
    const width = Math.round(size * 3.25);

    return (
        <div className={`flex items-center ${className}`}>
            <Image
                src="/luna-logo-new.png"
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
