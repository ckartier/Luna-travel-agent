'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — Matches reference: opaque light-blue pills + circles
 * arranged as a frame (dense on edges, open center for content).
 */

type ShapeType = 'pill' | 'circle';

interface ShapeConfig {
    id: number;
    type: ShapeType;
    width: number;          // vw
    height: number;         // vh or vw for circles
    x: number;              // % from left
    y: number;              // % from top
    color: string;
    duration: number;
    delay: number;
    distance: number;
}

// Hand-placed shapes mimicking the reference frame layout
function generateShapes(): ShapeConfig[] {
    const blues = [
        'hsl(207, 60%, 85%)',   // lightest
        'hsl(207, 55%, 82%)',
        'hsl(210, 50%, 80%)',   // medium
        'hsl(210, 55%, 78%)',
        'hsl(212, 45%, 83%)',   // soft
    ];

    const pick = () => blues[Math.floor(Math.random() * blues.length)];
    const rDur = () => 6 + Math.random() * 8;
    const rDel = () => Math.random() * -10;
    const rDist = () => 12 + Math.random() * 25;

    const shapes: Omit<ShapeConfig, 'id'>[] = [
        // ═══ LEFT EDGE — dense column of pills + circles ═══
        { type: 'pill', width: 7, height: 55, x: 3, y: 30, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'pill', width: 7, height: 50, x: 11, y: 25, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 10, height: 10, x: 7, y: 80, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 9, height: 9, x: 15, y: 78, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'pill', width: 6, height: 45, x: 18, y: 10, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },

        // ═══ TOP CENTER — circles peeking from top ═══
        { type: 'circle', width: 11, height: 11, x: 30, y: -2, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 10, height: 10, x: 42, y: -3, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 9, height: 9, x: 55, y: -2, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 10, height: 10, x: 68, y: -3, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },

        // ═══ RIGHT EDGE — dense column of pills + circles ═══
        { type: 'pill', width: 7, height: 55, x: 88, y: 25, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'pill', width: 7, height: 48, x: 96, y: 30, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'pill', width: 6, height: 40, x: 82, y: 15, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 10, height: 10, x: 85, y: 78, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 9, height: 9, x: 93, y: 75, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },

        // ═══ BOTTOM — circles peeking from bottom ═══
        { type: 'circle', width: 11, height: 11, x: 8, y: 92, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 12, height: 12, x: 25, y: 90, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 11, height: 11, x: 42, y: 92, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 12, height: 12, x: 60, y: 90, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 11, height: 11, x: 78, y: 92, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
        { type: 'circle', width: 10, height: 10, x: 92, y: 93, color: pick(), duration: rDur(), delay: rDel(), distance: rDist() },
    ];

    return shapes.map((s, i) => ({ ...s, id: i }));
}

export function CapsuleBackground() {
    const shapes = useMemo(() => generateShapes(), []);

    return (
        <>
            <style jsx global>{`
                @keyframes capsule-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(var(--d, 15px)); }
                }
            `}</style>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {/* Warm white/cream base like the reference */}
                <div className="absolute inset-0 bg-[#f5f3ef]" />

                {shapes.map(s => {
                    const isCircle = s.type === 'circle';
                    const w = `${s.width}vw`;
                    const h = isCircle ? `${s.height}vw` : `${s.height}vh`;

                    return (
                        <div
                            key={s.id}
                            style={{
                                position: 'absolute',
                                left: `${s.x}%`,
                                top: `${s.y}%`,
                                width: w,
                                height: h,
                                borderRadius: isCircle ? '50%' : '9999px',
                                backgroundColor: s.color,
                                animation: `capsule-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
                                willChange: 'transform',
                                ['--d' as string]: `${s.distance}px`,
                            }}
                        />
                    );
                })}
            </div>
        </>
    );
}
