'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — Animated vertical pill shapes for the hero section.
 *
 * Architecture:
 * - Pre-generates capsule configs at mount (no re-renders)
 * - Uses pure CSS @keyframes for GPU-accelerated translateY animation
 * - Each capsule gets unique: width, height, x-position, opacity, speed, delay, travel distance
 * - Zero layout reflows — everything is position: absolute + transform
 */

interface CapsuleConfig {
    id: number;
    width: number;       // px
    height: number;      // px
    left: number;        // percentage
    opacity: number;
    duration: number;    // seconds
    delay: number;       // seconds
    distance: number;    // px (translateY amplitude)
    hue: number;         // 200-220 range (light blue tones)
    saturation: number;  // %
    lightness: number;   // %
}

function generateCapsules(count: number): CapsuleConfig[] {
    const capsules: CapsuleConfig[] = [];
    // Distribute capsules evenly across the width with some randomness
    const step = 100 / (count + 1);

    for (let i = 0; i < count; i++) {
        const baseLeft = step * (i + 1);
        capsules.push({
            id: i,
            width: 20 + Math.random() * 40,           // 20–60px
            height: 80 + Math.random() * 220,          // 80–300px
            left: baseLeft + (Math.random() - 0.5) * step * 0.6, // jitter within slot
            opacity: 0.06 + Math.random() * 0.12,      // 0.06–0.18 (very subtle)
            duration: 6 + Math.random() * 8,            // 6–14s per cycle
            delay: Math.random() * -10,                 // stagger start
            distance: 15 + Math.random() * 35,          // 15–50px travel
            hue: 205 + Math.random() * 15,              // 205–220 (sky blue)
            saturation: 60 + Math.random() * 30,        // 60–90%
            lightness: 75 + Math.random() * 15,         // 75–90%
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
        borderRadius: `${config.width}px`,  // full pill = radius >= width
        backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${config.lightness}%)`,
        opacity: config.opacity,
        transform: 'translate(-50%, -50%)',
        animation: `capsule-float ${config.duration}s ease-in-out ${config.delay}s infinite`,
        // Custom property for the travel distance
        ['--capsule-distance' as string]: `${config.distance}px`,
        willChange: 'transform',
    };

    return <div style={style} />;
}

export function CapsuleBackground() {
    const capsules = useMemo(() => generateCapsules(18), []);

    return (
        <>
            {/* Inject the keyframe animation once */}
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
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/60 to-transparent" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/80 to-transparent" />
            </div>
        </>
    );
}
