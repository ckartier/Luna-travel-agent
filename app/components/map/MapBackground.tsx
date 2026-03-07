'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { LeafletMapHandle } from './LeafletMap';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

export const MapBackground = forwardRef<LeafletMapHandle>(function MapBackground(_props, ref) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ═══ STARFIELD + SHOOTING STARS ═══
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame: number;
        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // Generate stars
        const W = () => canvas.offsetWidth;
        const H = () => canvas.offsetHeight;
        const stars = Array.from({ length: 200 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.2 + 0.3,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleOffset: Math.random() * Math.PI * 2,
            brightness: Math.random() * 0.5 + 0.5,
        }));

        // Shooting stars
        const shootingStars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number }[] = [];
        let nextShoot = 120 + Math.random() * 200;

        let tick = 0;
        const loop = () => {
            tick++;
            const w = W(), h = H();
            ctx.clearRect(0, 0, w, h);

            // Draw stars
            for (const s of stars) {
                const alpha = s.brightness * (0.5 + 0.5 * Math.sin(tick * s.twinkleSpeed + s.twinkleOffset));
                ctx.beginPath();
                ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.fill();
            }

            // Spawn shooting star
            nextShoot--;
            if (nextShoot <= 0) {
                const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2;
                const speed = 4 + Math.random() * 4;
                shootingStars.push({
                    x: Math.random() * w * 0.8,
                    y: Math.random() * h * 0.3,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0,
                    maxLife: 40 + Math.random() * 30,
                    len: 60 + Math.random() * 80,
                });
                nextShoot = 180 + Math.random() * 400;
            }

            // Draw shooting stars
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const ss = shootingStars[i];
                ss.x += ss.vx;
                ss.y += ss.vy;
                ss.life++;

                const progress = ss.life / ss.maxLife;
                const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;

                const grad = ctx.createLinearGradient(
                    ss.x, ss.y,
                    ss.x - ss.vx * ss.len / 6, ss.y - ss.vy * ss.len / 6
                );
                grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
                grad.addColorStop(1, `rgba(255,255,255,0)`);

                ctx.beginPath();
                ctx.moveTo(ss.x, ss.y);
                ctx.lineTo(ss.x - ss.vx * ss.len / 6, ss.y - ss.vy * ss.len / 6);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Head glow
                ctx.beginPath();
                ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
                ctx.fill();

                if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
            }

            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0a1a] z-0">
            {/* Starfield canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-[0]" />

            {/* Map on top of stars */}
            <div className="absolute inset-0 z-[1]">
                <LeafletMap ref={ref} mapboxToken={mapboxToken || ''} />
            </div>

            {/* Subtle center glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[200px] opacity-10 pointer-events-none z-[2]" />

            {/* Status badge */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-4 left-4 z-[500]"
            >
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[12px] font-normal text-white uppercase tracking-wider">Luna</span>
                    <span className="h-3 w-px bg-white/20" />
                    <span className="text-[12px] text-white/60 font-normal">Concierge Voyage</span>
                </div>
            </motion.div>
        </div>
    );
});
