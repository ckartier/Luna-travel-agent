'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { LeafletMapHandle } from './LeafletMap';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

export const MapBackground = forwardRef<LeafletMapHandle>(function MapBackground(_props, ref) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#e8e4dc] z-0">
            <LeafletMap ref={ref} mapboxToken={mapboxToken || ''} />

            {/* Center soft glow — no pointer events */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[150px] opacity-30 pointer-events-none z-[1]" />

            {/* Status badge */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-4 left-4 z-[500]"
            >
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-luna-warm-gray/15 shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold text-luna-charcoal uppercase tracking-wider">Luna</span>
                    <span className="h-3 w-px bg-luna-warm-gray/30" />
                    <span className="text-[9px] text-luna-text-muted font-medium">Concierge Voyage</span>
                </div>
            </motion.div>
        </div>
    );
});
