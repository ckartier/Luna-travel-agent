'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — Precise replica of the reference 7-column grid layout.
 * Columns: 0%, 16.6%, 33.3%, 50%, 66.6%, 83.3%, 100%.
 * Width of shapes: slightly more than 16.66vw so they touch with zero gaps.
 */

interface Shape {
    id: string;
    col: number;    // 0 to 6
    type: 'top' | 'bottom' | 'circle';
    heightVh?: number; // for top/bottom
    sizeVw?: number;   // for circle
    yPosVh?: number;   // fixed pos for circle
    color: string;
    opacity: number;
    dur: number;
    del: number;
    dist: number;
}

const C1 = '#e4eff7'; // lighter blue
const C2 = '#c6e0f2'; // darker blue
const W = 16.8; // 16.666 + slight overlap

function rDur() { return 10 + Math.random() * 14; }  // 30% faster: 10 to 24 seconds
function rDel() { return Math.random() * -14; }
function rDist() { return 20 + Math.random() * 33; }  // 30% more distance
function rOpac() { return 0.4 + Math.random() * 0.5; }

function createGrid(): Shape[] {
    const s: Shape[] = [];
    const add = (def: Omit<Shape, 'id' | 'dur' | 'del' | 'dist' | 'opacity'>) => {
        s.push({ ...def, id: `s-${s.length}`, opacity: rOpac(), dur: rDur(), del: rDel(), dist: rDist() });
    };

    // Col 0 (left edge)
    add({ col: 0, type: 'top', heightVh: 82, color: C2 });
    add({ col: 0, type: 'bottom', heightVh: 45, color: C1 });

    // Col 1
    add({ col: 1, type: 'top', heightVh: 88, color: C1 });
    add({ col: 1, type: 'bottom', heightVh: 40, color: C2 });

    // Col 2
    add({ col: 2, type: 'top', heightVh: 52, color: C2 });
    add({ col: 2, type: 'bottom', heightVh: 88, color: C1 });

    // Col 3 (Center)
    add({ col: 3, type: 'circle', sizeVw: W, yPosVh: 3, color: C1 });
    add({ col: 3, type: 'bottom', heightVh: 35, color: C2 });

    // Col 4
    add({ col: 4, type: 'top', heightVh: 52, color: C2 });
    add({ col: 4, type: 'bottom', heightVh: 88, color: C1 });

    // Col 5
    add({ col: 5, type: 'top', heightVh: 88, color: C1 });
    add({ col: 5, type: 'bottom', heightVh: 40, color: C2 });

    // Col 6 (right edge)
    add({ col: 6, type: 'top', heightVh: 55, color: C2 });
    add({ col: 6, type: 'bottom', heightVh: 85, color: C1 });

    return s;
}

export function CapsuleBackground() {
    const shapes = useMemo(() => createGrid(), []);

    return (
        <>
            <style jsx global>{`
                @keyframes cf {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(var(--d, 15px)); }
                }
            `}</style>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[#f9fafb]" />

                {shapes.map(s => {
                    const left = (100 / 6) * s.col;

                    if (s.type === 'circle') {
                        return (
                            <div
                                key={s.id}
                                style={{
                                    position: 'absolute',
                                    left: `${left}%`,
                                    top: `${s.yPosVh}vh`,
                                    width: `${s.sizeVw}vw`,
                                    height: `${s.sizeVw}vw`,
                                    borderRadius: '50%',
                                    backgroundColor: s.color,
                                    opacity: s.opacity,
                                    transform: 'translateX(-50%)',
                                    animation: `cf ${s.dur}s ease-in-out ${s.del}s infinite`,
                                    willChange: 'transform',
                                    ['--d' as string]: `${s.dist}px`,
                                }}
                            />
                        );
                    }

                    const isTop = s.type === 'top';
                    return (
                        <div
                            key={s.id}
                            style={{
                                position: 'absolute',
                                left: `${left}%`,
                                [isTop ? 'top' : 'bottom']: '-20vh',
                                width: `${W}vw`,
                                height: `${s.heightVh}vh`,
                                borderRadius: '9999px',
                                backgroundColor: s.color,
                                opacity: s.opacity,
                                transform: 'translateX(-50%)',
                                animation: `cf ${s.dur}s ease-in-out ${s.del}s infinite`,
                                willChange: 'transform',
                                ['--d' as string]: `${isTop ? s.dist : -s.dist}px`,
                            }}
                        />
                    );
                })}

                {/* Optional faint content fade to ensure text readability if needed */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/40 to-transparent" />
            </div>
        </>
    );
}
