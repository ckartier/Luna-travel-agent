'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVertical } from '@/src/contexts/VerticalContext';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Post-Login Transition Page
 * Shows a rotating 3D Mapbox globe with greeting → auto-redirects to /crm after 3s.
 */
export default function TransitionPage() {
    const router = useRouter();
    const { user, userProfile, loading } = useAuth();
    const { vertical } = useVertical();
    const [phase, setPhase] = useState<'enter' | 'exit'>('enter');
    const mapRef = useRef<any>(null);

    const userName = (userProfile?.displayName || user?.displayName || '').split(' ')[0];

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    // Auto-redirect to the correct CRM dashboard after animation
    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            setPhase('exit');
            setTimeout(() => {
                const target =
                    vertical.id === 'legal'
                        ? '/crm/avocat?vertical=legal'
                        : vertical.id === 'monum'
                            ? '/crm/monum?vertical=monum'
                            : '/crm/luna?vertical=travel';
                router.push(target);
            }, 800);
        }, 2500);
        return () => clearTimeout(timer);
    }, [user, router, vertical.id]);

    // Mapbox rotating globe
    const mapContainerCallback = useCallback((node: HTMLDivElement | null) => {
        if (!node || mapRef.current) return;
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        (async () => {
        const mapboxgl = (await import('mapbox-gl')).default;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: node,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [2.35, 48.85], // Start at Paris
            zoom: 2,
            projection: 'globe',
            attributionControl: false,
            interactive: false,
        });

        map.on('style.load', () => {
            map.setFog({
                color: 'rgb(255,255,255)',
                'high-color': 'rgb(230,238,245)',
                'horizon-blend': 0.06,
                'space-color': 'rgb(255,255,255)' as any,
                'star-intensity': 0,
            });
            // Hide controls
            node.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-group')
                .forEach(el => (el as HTMLElement).style.display = 'none');
        });

        // Slow rotation
        let t = 0;
        const spin = () => {
            t += 0.003;
            if (!map.isMoving()) {
                map.setCenter([2.35 + Math.sin(t) * 60, 48.85 + Math.cos(t * 0.5) * 15]);
            }
            requestAnimationFrame(spin);
        };
        requestAnimationFrame(spin);
        mapRef.current = map;
        })();
    }, []);

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-white overflow-hidden">
            {/* Rotating Globe — full screen background */}
            <div ref={mapContainerCallback} className="absolute inset-0 z-0" />

            {/* Slight overlay for text readability */}
            <div className="absolute inset-0 z-10 bg-white/40" />

            {/* Centered content */}
            <AnimatePresence mode="wait">
                {phase === 'enter' && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 1.05, filter: 'blur(12px)' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                    >
                        {/* Greeting */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="text-4xl md:text-6xl font-extralight text-[#2E2E2E] tracking-tight mb-3"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            Bonjour{userName ? `, ${userName}` : ''}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="text-[#2E2E2E]/35 text-sm font-light tracking-wide"
                        >
                            Préparation de votre bureau...
                        </motion.p>

                        {/* Loading dots */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex gap-1.5 mt-8"
                        >
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-[#5a8fa3]"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
