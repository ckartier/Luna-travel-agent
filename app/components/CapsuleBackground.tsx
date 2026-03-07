'use client';

import { useMemo, useEffect } from 'react';

/**
 * CapsuleBackground — Animated capsule/pill shapes as background.
 * Bulletproof version: no styled-jsx, pure inline styles.
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
    orange: { light: '#fff7ed', dark: '#ffedd5', bg: '#fffaf5' },
} as const;

type ColorScheme = keyof typeof PALETTES;

const DEFAULT_PALETTE = PALETTES.blue;

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
                    transition: 'background-color 1.5s ease-in-out',
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
                                transition: 'background-color 1.5s ease-in-out',
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
                            transition: 'background-color 1.5s ease-in-out',
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
