'use client';

import { useMemo } from 'react';

/**
 * CapsuleBackground — pixel-perfect replica of reference image.
 *
 * Layout from reference:
 * - LEFT: 3 tall pills packed tight
 * - RIGHT: 3 tall pills packed tight
 * - TOP: 4 half-circles peeking down between the pill groups
 * - BOTTOM: 6 half-circles peeking up across the full width
 * - CENTER: clear for content
 * - All shapes opaque, soft light blue tones
 */

interface Shape {
    id: number;
    x: number;      // % left
    y: number;      // % top (can be negative for half-hidden shapes)
    w: number;      // vw
    h: number;      // vh (or vw for circles)
    rx: string;     // border-radius
    color: string;
    dur: number;    // animation duration
    del: number;    // animation delay
    dist: number;   // translateY distance
}

const B1 = 'hsl(208, 52%, 87%)';  // lightest
const B2 = 'hsl(208, 48%, 84%)';  // light
const B3 = 'hsl(210, 45%, 81%)';  // medium
const B4 = 'hsl(210, 42%, 79%)';  // slightly deeper

function r(min: number, max: number) { return min + Math.random() * (max - min); }

function createShapes(): Shape[] {
    let id = 0;
    const s: Omit<Shape, 'id'>[] = [

        // ════════════ LEFT GROUP — 3 tall pills ════════════
        // Pill 1: far-left edge
        { x: -1, y: 5, w: 8, h: 75, rx: '9999px', color: B3, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Pill 2: overlapping pill 1
        { x: 7, y: -2, w: 8, h: 65, rx: '9999px', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Pill 3
        { x: 14, y: 5, w: 7, h: 55, rx: '9999px', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Circle bottom-left
        { x: 2, y: 72, w: 13, h: 13, rx: '50%', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(10, 18) },
        // Circle bottom-left #2
        { x: 13, y: 70, w: 12, h: 12, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(10, 18) },

        // ════════════ TOP — 4 half-circles peeking from top edge ════════════
        { x: 26, y: -7, w: 14, h: 14, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 40, y: -8, w: 13, h: 13, rx: '50%', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 53, y: -7, w: 12, h: 12, rx: '50%', color: B3, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 66, y: -8, w: 14, h: 14, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },

        // ════════════ RIGHT GROUP — 3 tall pills ════════════
        // Pill right 1
        { x: 79, y: 5, w: 7, h: 55, rx: '9999px', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Pill right 2
        { x: 86, y: -2, w: 8, h: 70, rx: '9999px', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Pill right 3: far-right edge
        { x: 93, y: 5, w: 8, h: 75, rx: '9999px', color: B3, dur: r(7, 12), del: r(-8, 0), dist: r(10, 20) },
        // Circle bottom-right
        { x: 82, y: 70, w: 12, h: 12, rx: '50%', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(10, 18) },
        // Circle bottom-right #2
        { x: 92, y: 72, w: 11, h: 11, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(10, 18) },

        // ════════════ BOTTOM — 6 half-circles peeking from bottom ════════════
        { x: 3, y: 85, w: 14, h: 14, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 18, y: 83, w: 15, h: 15, rx: '50%', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 34, y: 85, w: 14, h: 14, rx: '50%', color: B3, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 50, y: 84, w: 14, h: 14, rx: '50%', color: B2, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 66, y: 85, w: 13, h: 13, rx: '50%', color: B1, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
        { x: 82, y: 84, w: 14, h: 14, rx: '50%', color: B3, dur: r(7, 12), del: r(-8, 0), dist: r(8, 15) },
    ];

    return s.map(shape => ({ ...shape, id: id++ }));
}

export function CapsuleBackground() {
    const shapes = useMemo(() => createShapes(), []);

    return (
        <>
            <style jsx global>{`
                @keyframes cf {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(var(--d, 15px)); }
                }
            `}</style>

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[#f5f2ed]" />

                {shapes.map(s => (
                    <div
                        key={s.id}
                        style={{
                            position: 'absolute',
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            width: `${s.w}vw`,
                            height: s.rx === '50%' ? `${s.h}vw` : `${s.h}vh`,
                            borderRadius: s.rx,
                            backgroundColor: s.color,
                            animation: `cf ${s.dur}s ease-in-out ${s.del}s infinite`,
                            willChange: 'transform',
                            ['--d' as string]: `${s.dist}px`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
