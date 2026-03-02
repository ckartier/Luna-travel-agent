'use client';

import { Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PlaneData {
    id: string | number;
    lat: number;
    lng: number;
    rotate: number;
    label: string;
}

export function MapBackground() {
    const [mounted, setMounted] = useState(false);
    const [planes, setPlanes] = useState<PlaneData[]>([]);

    // Optional: User can set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        setMounted(true);
        // Fetch real or fallback flights from our API
        fetch('/api/flights')
            .then(res => res.json())
            .then(data => {
                if (data && data.flights) {
                    setPlanes(data.flights);
                }
            })
            .catch(err => console.error("Error fetching flights on client:", err));
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#e2e8f0] -z-10 overflow-hidden pointer-events-none">

            {mapboxToken ? (
                <div className="absolute inset-0"> {/* Removed opacity and mix-blend-multiply to keep planes visible */}
                    <Map
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{
                            longitude: 10,
                            latitude: 40,
                            zoom: 2,
                            pitch: 0 // Flat view requested by user
                        }}
                        projection={{ name: 'mercator' }} // Forces 2D flat map instead of 3D globe
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        interactive={false}
                    >
                        {planes.map((plane) => (
                            <Marker key={plane.id} longitude={plane.lng} latitude={plane.lat} anchor="center">
                                <div className="flex flex-col items-center gap-1">
                                    <motion.div
                                        animate={{
                                            y: [0, -4, 0],
                                            scale: [1, 1.05, 1]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 3 + Math.random() * 2,
                                            ease: "easeInOut"
                                        }}
                                        className="relative flex justify-center items-center"
                                    >
                                        {/* Trajectory tail line behind plane */}
                                        <div
                                            className="absolute h-[60px] w-[2px] bg-gradient-to-t from-transparent to-blue-400/60 blur-[1px]"
                                            style={{
                                                transformOrigin: 'top center',
                                                transform: `rotate(${plane.rotate + 180}deg) translateY(10px)`
                                            }}
                                        />

                                        {/* Airplane glow */}
                                        <div className="absolute w-8 h-8 bg-blue-400/30 rounded-full blur-md"></div>

                                        <Plane
                                            className="w-5 h-5 text-blue-500 relative z-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                            style={{ transform: `rotate(${plane.rotate}deg)` }}
                                            fill="currentColor"
                                        />
                                    </motion.div>
                                    <div className="glass-pill mt-6 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold text-gray-700 bg-white/70 backdrop-blur-md border border-white/50">
                                        {plane.label}
                                    </div>
                                </div>
                            </Marker>
                        ))}
                    </Map>
                </div>
            ) : (
                <>
                    {/* Fallback pattern if no mapbox token is provided */}
                    <div
                        className="absolute inset-0 opacity-40 bg-no-repeat bg-center bg-contain"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1000 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 100 Q 150 50, 200 100 T 300 100 T 400 150 T 500 100 T 600 200 T 800 100 T 900 300' fill='none' stroke='%23cbd5e1' stroke-width='40' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M50 200 Q 100 150, 150 200 T 250 200 T 350 250 T 450 200' fill='none' stroke='%23cbd5e1' stroke-width='60' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M650 300 Q 700 250, 750 300 T 850 300' fill='none' stroke='%23cbd5e1' stroke-width='80' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M250 400 Q 300 350, 350 400' fill='none' stroke='%23cbd5e1' stroke-width='50' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                        }}
                    />
                    {planes.map((plane, index) => {
                        // Mock generic % placement for the SVG fallback since we rely on lat/lng for the real map
                        const top = `${30 + index * 10}%`;
                        const left = `${20 + index * 15}%`;
                        return (
                            <div key={plane.id} className="absolute flex flex-col items-center gap-1" style={{ top, left }}>
                                <motion.div animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4 + Math.random() * 2, ease: "easeInOut" }}>
                                    <Plane className="w-5 h-5 text-blue-500 drop-shadow-md" style={{ transform: `rotate(${plane.rotate}deg)` }} fill="currentColor" />
                                </motion.div>
                                <div className="glass-pill px-2 py-0.5 text-[9px] font-bold text-gray-700 bg-white/70">
                                    {plane.label}
                                </div>
                            </div>
                        )
                    })}
                </>
            )}

            {/* Center glowing orb behind the super agent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-300 rounded-full blur-[100px] opacity-40 mix-blend-multiply pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[120px] opacity-50 pointer-events-none" />
        </div>
    );
}
