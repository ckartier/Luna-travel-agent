'use client';

import { Plane, X, Navigation, Clock, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PlaneData {
    id: string | number;
    lat: number;
    lng: number;
    rotate: number;
    label: string;
    callsign?: string;
    origin_country?: string;
    altitude?: number;
    velocity?: number;
}

interface MapBackgroundProps {
    onPlaneSelect?: (plane: PlaneData | null) => void;
}

export function MapBackground({ onPlaneSelect }: MapBackgroundProps) {
    const [mounted, setMounted] = useState(false);
    const [planes, setPlanes] = useState<PlaneData[]>([]);
    const [selectedPlane, setSelectedPlane] = useState<PlaneData | null>(null);
    const [isLive, setIsLive] = useState(false);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        setMounted(true);
        fetch('/api/flights')
            .then(res => res.json())
            .then(data => {
                if (data?.flights) {
                    setPlanes(data.flights);
                    setIsLive(data.live || false);
                }
            })
            .catch(err => console.error("Error fetching flights:", err));
    }, []);

    const handlePlaneClick = (plane: PlaneData, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedPlane(plane);
        onPlaneSelect?.(plane);
    };

    const handleCloseModal = () => {
        setSelectedPlane(null);
        onPlaneSelect?.(null);
    };

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#f0ebe4] -z-10 overflow-hidden">

            {mapboxToken ? (
                <div className="absolute inset-0">
                    <Map
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{
                            longitude: 10,
                            latitude: 35,
                            zoom: 2.2,
                            pitch: 0,
                        }}
                        projection={{ name: 'mercator' }}
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        interactive={true}
                        attributionControl={false}
                        onClick={() => selectedPlane && handleCloseModal()}
                    >
                        {planes.map((plane) => (
                            <Marker key={plane.id} longitude={plane.lng} latitude={plane.lat} anchor="center">
                                <div
                                    className="cursor-pointer group relative"
                                    onClick={(e) => handlePlaneClick(plane, e)}
                                >
                                    <motion.div
                                        animate={{
                                            y: [0, -3, 0],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 3 + Math.random() * 2,
                                            ease: "easeInOut"
                                        }}
                                        className="relative flex flex-col items-center"
                                    >
                                        {/* Trajectory tail */}
                                        <div
                                            className="absolute h-[40px] w-[1.5px] bg-gradient-to-t from-transparent to-sky-400/40"
                                            style={{
                                                transformOrigin: 'top center',
                                                transform: `rotate(${plane.rotate + 180}deg) translateY(8px)`
                                            }}
                                        />

                                        {/* Plane glow on hover */}
                                        <div className="absolute w-6 h-6 bg-sky-400/0 group-hover:bg-sky-400/20 rounded-full blur-md transition-all duration-300" />

                                        {/* Selection ring */}
                                        {selectedPlane?.id === plane.id && (
                                            <motion.div
                                                className="absolute w-8 h-8 border-2 border-sky-400 rounded-full"
                                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            />
                                        )}

                                        <Plane
                                            className={`w-4 h-4 relative z-10 drop-shadow-sm transition-colors duration-200 ${selectedPlane?.id === plane.id
                                                    ? 'text-sky-500'
                                                    : 'text-luna-charcoal/60 group-hover:text-sky-500'
                                                }`}
                                            style={{ transform: `rotate(${plane.rotate}deg)` }}
                                            fill="currentColor"
                                            strokeWidth={0}
                                        />

                                        {/* Label */}
                                        <div className={`mt-5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-md border whitespace-nowrap transition-all ${selectedPlane?.id === plane.id
                                                ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                                                : 'bg-white/80 text-luna-charcoal/70 border-luna-warm-gray/30 backdrop-blur-sm group-hover:border-sky-300 group-hover:text-sky-600'
                                            }`}>
                                            {plane.label}
                                        </div>
                                    </motion.div>
                                </div>
                            </Marker>
                        ))}
                    </Map>

                    {/* Live indicator */}
                    {isLive && (
                        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-luna-warm-gray/20 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-luna-charcoal uppercase tracking-wider">Live Tracking</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0ebe4] to-[#e8e2da]" />
            )}

            {/* Center ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-50 pointer-events-none" />

            {/* ═══ FLIGHT INFO MODAL ═══ */}
            <AnimatePresence>
                {selectedPlane && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-luna-warm-gray/20 shadow-luxury p-5 w-[340px]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                                        <Plane className="w-5 h-5 text-sky-500" fill="currentColor" strokeWidth={0} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-luna-charcoal text-lg leading-tight">{selectedPlane.callsign || selectedPlane.label}</h3>
                                        <p className="text-[10px] text-luna-text-muted font-medium uppercase tracking-wider mt-0.5">
                                            {selectedPlane.origin_country || 'Vol international'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleCloseModal} className="p-1.5 text-luna-text-muted hover:text-luna-charcoal hover:bg-luna-cream rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-luna-cream/60 rounded-xl p-3 text-center">
                                    <Navigation size={14} className="mx-auto text-sky-500 mb-1.5" />
                                    <p className="text-xs text-luna-text-muted font-medium">Cap</p>
                                    <p className="font-bold text-luna-charcoal text-sm">{Math.round(selectedPlane.rotate || 0)}°</p>
                                </div>
                                <div className="bg-luna-cream/60 rounded-xl p-3 text-center">
                                    <Gauge size={14} className="mx-auto text-emerald-500 mb-1.5" />
                                    <p className="text-xs text-luna-text-muted font-medium">Vitesse</p>
                                    <p className="font-bold text-luna-charcoal text-sm">{selectedPlane.velocity ? `${Math.round(selectedPlane.velocity * 3.6)} km/h` : '—'}</p>
                                </div>
                                <div className="bg-luna-cream/60 rounded-xl p-3 text-center">
                                    <Clock size={14} className="mx-auto text-amber-500 mb-1.5" />
                                    <p className="text-xs text-luna-text-muted font-medium">Position</p>
                                    <p className="font-bold text-luna-charcoal text-[10px]">{selectedPlane.lat.toFixed(1)}°, {selectedPlane.lng.toFixed(1)}°</p>
                                </div>
                            </div>

                            <button className="mt-4 w-full py-2.5 bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm">
                                Suivre ce vol
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
