'use client';

import { useMemo } from 'react';

interface CapsuleConfig {
    id: number;
    widthVw: number;
    height: number;
    leftPct: number;
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
    const slotVw = 100 / count;

    for (let i = 0; i < count; i++) {
        capsules.push({
            id: i,
            widthVw: slotVw + 6,                           // much wider than slot → heavy overlap
            height: 500 + Math.random() * 500,             // 500–1000px (overshoots viewport)
            leftPct: slotVw * i + slotVw / 2,
            opacity: 0.06 + Math.random() * 0.08,
            duration: 6 + Math.random() * 8,
            delay: Math.random() * -12,
            distance: 20 + Math.random() * 40,
            hue: 205 + Math.random() * 15,
            saturation: 55 + Math.random() * 35,
            lightness: 80 + Math.random() * 10,
        });
    }
    return capsules;
}

const COUNT = 10;

export function CapsuleBackground() {
    const capsules = useMemo(() => generateCapsules(COUNT), []);

    return (
        <>
            <style jsx global>{`
                @keyframes capsule-float {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50% { transform: translate(-50%, -50%) translateY(var(--d, 30px)); }
                }
            `}</style>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-gradient-to-b from-[#f0f7ff] via-[#f8fbff] to-[#eef4fc]" />

                {capsules.map(c => (
                    <div
                        key={c.id}
                        style={{
                            position: 'absolute',
                            left: `${c.leftPct}%`,
                            top: '50%',
                            width: `${c.widthVw}vw`,
                            height: `${c.height}px`,
                            borderRadius: `${c.widthVw * 5}px`,
                            backgroundColor: `hsl(${c.hue}, ${c.saturation}%, ${c.lightness}%)`,
                            opacity: c.opacity,
                            transform: 'translate(-50%, -50%)',
                            animation: `capsule-float ${c.duration}s ease-in-out ${c.delay}s infinite`,
                            willChange: 'transform',
                            ['--d' as string]: `${c.distance}px`,
                        }}
                    />
                ))}

                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/60 to-transparent" />
            </div>
        </>
    );
}
