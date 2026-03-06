'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — Animated capsule/pill shapes as background.
 * Supports 'blue' (default) and 'orange' color schemes with smooth CSS transition.
 */

interface Shape {
    id: string;
    col: number;
    type: 'top' | 'bottom' | 'circle';
    heightVh?: number;
    sizeVw?: number;
    yPosVh?: number;
    colorIdx: 0 | 1; // 0 = lighter, 1 = darker
    opacity: number;
    dur: number;
    del: number;
    dist: number;
}

const PALETTES = {
    blue: { light: '#e4eff7', dark: '#c6e0f2', bg: '#f9fafb' },
    orange: { light: '#fde8d0', dark: '#f9c98c', bg: '#fefaf6' },
    cream: { light: '#f0f0f0', dark: '#e8e8e8', bg: '#F7F8FA' },
};

const W = 16.8;

function rDur() { return 5 + Math.random() * 7; }
function rDel() { return Math.random() * -7; }
function rDist() { return 40 + Math.random() * 66; }
function rOpac() { return 0.4 + Math.random() * 0.5; }

function createGrid(): Shape[] {
    const s: Shape[] = [];
    const add = (def: Omit<Shape, 'id' | 'dur' | 'del' | 'dist' | 'opacity'>) => {
        s.push({ ...def, id: `s-${s.length}`, opacity: rOpac(), dur: rDur(), del: rDel(), dist: rDist() });
    };

    add({ col: 0, type: 'top', heightVh: 82, colorIdx: 1 });
    add({ col: 0, type: 'bottom', heightVh: 45, colorIdx: 0 });
    add({ col: 1, type: 'top', heightVh: 88, colorIdx: 0 });
    add({ col: 1, type: 'bottom', heightVh: 40, colorIdx: 1 });
    add({ col: 2, type: 'top', heightVh: 52, colorIdx: 1 });
    add({ col: 2, type: 'bottom', heightVh: 88, colorIdx: 0 });
    add({ col: 3, type: 'circle', sizeVw: W, yPosVh: 3, colorIdx: 0 });
    add({ col: 3, type: 'bottom', heightVh: 35, colorIdx: 1 });
    add({ col: 4, type: 'top', heightVh: 52, colorIdx: 1 });
    add({ col: 4, type: 'bottom', heightVh: 88, colorIdx: 0 });
    add({ col: 5, type: 'top', heightVh: 88, colorIdx: 0 });
    add({ col: 5, type: 'bottom', heightVh: 40, colorIdx: 1 });
    add({ col: 6, type: 'top', heightVh: 55, colorIdx: 1 });
    add({ col: 6, type: 'bottom', heightVh: 85, colorIdx: 0 });

    return s;
}

interface CapsuleBackgroundProps {
    colorScheme?: 'blue' | 'orange' | 'cream';
}

export function CapsuleBackground({ colorScheme = 'blue' }: CapsuleBackgroundProps) {
    const shapes = useMemo(() => createGrid(), []);
    const palette = PALETTES[colorScheme];

    return (
        <>
            <style jsx global>{`
                @keyframes cf {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(var(--d, 15px)); }
                }
            `}</style>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: palette.bg, transition: 'background-color 1.5s ease-in-out' }}
                />

                {shapes.map(s => {
                    const left = (100 / 6) * s.col;
                    const color = s.colorIdx === 0 ? palette.light : palette.dark;

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
                                    backgroundColor: color,
                                    opacity: s.opacity,
                                    transform: 'translateX(-50%)',
                                    animation: `cf ${s.dur}s ease-in-out ${s.del}s infinite`,
                                    willChange: 'transform',
                                    transition: 'background-color 1.5s ease-in-out',
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
                                backgroundColor: color,
                                opacity: s.opacity,
                                transform: 'translateX(-50%)',
                                animation: `cf ${s.dur}s ease-in-out ${s.del}s infinite`,
                                willChange: 'transform',
                                transition: 'background-color 1.5s ease-in-out',
                                ['--d' as string]: `${isTop ? s.dist : -s.dist}px`,
                            }}
                        />
                    );
                })}

                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/40 to-transparent" />
            </div>
        </>
    );
}
