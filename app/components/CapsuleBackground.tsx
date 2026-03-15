'use client';

import { useMemo, useEffect } from 'react';

/**
 * CapsuleBackground — Animated capsule/pill shapes as background.
 * Uses seeded deterministic values so the layout is identical across pages,
 * eliminating the visual "jump" when navigating between pages.
 */

interface Shape {
    id: string;
    col: number;
    type: 'top' | 'bottom' | 'circle';
    heightVh?: number;
    sizeVw?: number;
    yPosVh?: number;
    colorIdx: 0 | 1;
    opacity: number;
    dur: number;
    del: number;
    dist: number;
}

const PALETTES = {
    blue: { light: '#e4eff7', dark: '#c6e0f2', bg: '#f9fafb' },
    cream: { light: '#f0f0f0', dark: '#e8e8e8', bg: '#F7F8FA' },
    orange: { light: '#F2D9D3', dark: '#E6D2BD', bg: '#fffaf5' },
} as const;

type ColorScheme = keyof typeof PALETTES;

const DEFAULT_PALETTE = PALETTES.blue;

const W = 16.8;

// ═══ Seeded pseudo-random — deterministic across all pages ═══
// Same seed = same values = no visual jump on navigation
const SEED_VALUES = [
    0.72, 0.38, 0.91, 0.15, 0.56, 0.83, 0.29, 0.67, 0.44, 0.78,
    0.12, 0.95, 0.33, 0.61, 0.87, 0.21, 0.53, 0.76, 0.42, 0.69,
    0.18, 0.89, 0.35, 0.64, 0.47, 0.71, 0.26, 0.58,
];
let seedIdx = 0;
function seeded() {
    const v = SEED_VALUES[seedIdx % SEED_VALUES.length];
    seedIdx++;
    return v;
}

function createGrid(): Shape[] {
    seedIdx = 0; // Reset seed for deterministic output
    const s: Shape[] = [];
    const add = (def: Omit<Shape, 'id' | 'dur' | 'del' | 'dist' | 'opacity'>) => {
        const opacity = 0.4 + seeded() * 0.5;
        const dur = 5 + seeded() * 7;
        const del = seeded() * -7;
        const dist = 40 + seeded() * 66;
        s.push({ ...def, id: `s-${s.length}`, opacity, dur, del, dist });
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

// Inject the keyframe once globally via a <style> tag
const KEYFRAME_ID = 'capsule-bg-keyframes';

function ensureKeyframes() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAME_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAME_ID;
    style.textContent = `
        @keyframes capsule-float {
            0%, 100% { transform: translateY(0) translateX(-50%); }
            50% { transform: translateY(var(--capsule-dist, 15px)) translateX(-50%); }
        }
    `;
    document.head.appendChild(style);
}

interface CapsuleBackgroundProps {
    colorScheme?: ColorScheme;
}

export function CapsuleBackground({ colorScheme }: CapsuleBackgroundProps) {
    const shapes = useMemo(() => createGrid(), []);

    useEffect(() => {
        ensureKeyframes();
    }, []);

    // Ultra-safe palette resolution
    const palette = (colorScheme && PALETTES[colorScheme]) ? PALETTES[colorScheme] : DEFAULT_PALETTE;

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}
            aria-hidden="true"
        >
            {/* Background color layer */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: palette.bg,
                    transition: 'background-color 1.2s ease-in-out',
                }}
            />

            {/* Shapes */}
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
                                animation: `capsule-float ${s.dur}s ease-in-out ${s.del}s infinite`,
                                willChange: 'transform',
                                transition: 'background-color 1.2s ease-in-out',
                                // @ts-ignore
                                '--capsule-dist': `${s.dist}px`,
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
                            ...(isTop ? { top: '-20vh' } : { bottom: '-20vh' }),
                            width: `${W}vw`,
                            height: `${s.heightVh}vh`,
                            borderRadius: '9999px',
                            backgroundColor: color,
                            opacity: s.opacity,
                            transform: 'translateX(-50%)',
                            animation: `capsule-float ${s.dur}s ease-in-out ${s.del}s infinite`,
                            willChange: 'transform',
                            transition: 'background-color 1.2s ease-in-out',
                            // @ts-ignore
                            '--capsule-dist': `${isTop ? s.dist : -s.dist}px`,
                        }}
                    />
                );
            })}

            {/* Gradient overlays */}
            <div style={{ position: 'absolute', inset: '0', top: 0, height: '6rem', background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
            <div style={{ position: 'absolute', inset: '0', bottom: 0, top: 'auto', height: '8rem', background: 'linear-gradient(to top, rgba(255,255,255,0.4), transparent)' }} />
        </div>
    );
}
