'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — Wide animated vertical pill shapes filling the hero.
 *
 * - Pre-generates capsule configs at mount (no re-renders)
 * - Pure CSS @keyframes for GPU-accelerated translateY
 * - Each capsule: unique width, height, position, opacity, speed, delay
 * - Zero layout reflows — position: absolute + transform only
 */

interface CapsuleConfig {
    id: number;
    width: number;
    height: number;
    left: number;
    opacity: number;
    duration: number;
    delay: number;
    distance: number;
    hue: number;
    saturation: number;
    lightness: number;
}

function generateCapsules(count: number): CapsuleConfig[] {
    const capsules: CapsuleConfig[] = [];
    const step = 100 / count;

    for (let i = 0; i < count; i++) {
        const baseLeft = step * i + step * 0.5;
        capsules.push({
            id: i,
            width: 60 + Math.random() * 100,              // 60–160px wide
            height: 300 + Math.random() * 500,             // 300–800px tall (full viewport)
            left: baseLeft + (Math.random() - 0.5) * step * 0.4,
            opacity: 0.08 + Math.random() * 0.10,         // 0.08–0.18
            duration: 6 + Math.random() * 8,
            delay: Math.random() * -12,
            distance: 20 + Math.random() * 40,
            hue: 205 + Math.random() * 15,
            saturation: 55 + Math.random() * 35,
            lightness: 78 + Math.random() * 12,
        });
    }
    return capsules;
}

function Capsule({ config }: { config: CapsuleConfig }) {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${config.left}%`,
        top: '50%',
        width: `${config.width}px`,
        height: `${config.height}px`,
        borderRadius: `${config.width}px`,
        backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${config.lightness}%)`,
        opacity: config.opacity,
        transform: 'translate(-50%, -50%)',
        animation: `capsule-float ${config.duration}s ease-in-out ${config.delay}s infinite`,
        ['--capsule-distance' as string]: `${config.distance}px`,
        willChange: 'transform',
    };

    return <div style={style} />;
}

export function CapsuleBackground() {
    const capsules = useMemo(() => generateCapsules(14), []);

    return (
        <>
            <style jsx global>{`
                @keyframes capsule-float {
                    0%, 100% {
                        transform: translate(-50%, -50%) translateY(0);
                    }
                    50% {
                        transform: translate(-50%, -50%) translateY(var(--capsule-distance, 30px));
                    }
                }
            `}</style>

            <div
                className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                aria-hidden="true"
            >
                {/* Soft gradient base */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#f0f7ff] via-[#f8fbff] to-[#eef4fc]" />

                {/* Capsules layer */}
                {capsules.map(c => (
                    <Capsule key={c.id} config={c} />
                ))}

                {/* Top fade for content readability */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/50 to-transparent" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/60 to-transparent" />
            </div>
        </>
    );
}
