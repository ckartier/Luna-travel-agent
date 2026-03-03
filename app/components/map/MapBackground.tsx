'use client';

import { Plane, X, Navigation, Clock, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AirportInfo { code: string; city: string; lat: number; lng: number; }

interface PlaneData {
    id: string | number; lat: number; lng: number; rotate: number; label: string;
    callsign?: string; origin_country?: string; altitude?: number; velocity?: number;
    airline?: string; airlineLogo?: string; flightNumber?: string; color?: string;
    departure?: AirportInfo | null; arrival?: AirportInfo | null;
    scheduledDeparture?: string; scheduledArrival?: string;
    stops?: number; stopCity?: string | null;
}

function generateArc(start: [number, number], end: [number, number], n = 50): [number, number][] {
    const pts: [number, number][] = [];
    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const curve = dist * 0.12;
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t + Math.sin(t * Math.PI) * curve
        ]);
    }
    return pts;
}

function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '--:--'; }
}

export function MapBackground() {
    const [mounted, setMounted] = useState(false);
    const [planes, setPlanes] = useState<PlaneData[]>([]);
    const [selectedPlane, setSelectedPlane] = useState<PlaneData | null>(null);
    const [isLive, setIsLive] = useState(false);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        setMounted(true);
        fetch('/api/flights').then(r => r.json()).then(d => {
            if (d?.flights) { setPlanes(d.flights); setIsLive(d.live || false); }
        }).catch(() => { });
    }, []);

    const handlePlaneClick = (plane: PlaneData, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedPlane(plane);
    };

    // Route arcs GeoJSON — each with its own color
    const routeGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: planes.filter(p => p.departure && p.arrival).map(p => ({
            type: 'Feature' as const,
            properties: { id: p.id, selected: selectedPlane?.id === p.id, color: p.color || '#64748b' },
            geometry: { type: 'LineString' as const, coordinates: generateArc([p.departure!.lng, p.departure!.lat], [p.arrival!.lng, p.arrival!.lat]) },
        })),
    };

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#f0ebe4] z-0 overflow-hidden">
            {mapboxToken ? (
                <div className="absolute inset-0">
                    <Map
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{ longitude: 20, latitude: 20, zoom: 1.5, pitch: 0 }}
                        projection={{ name: 'mercator' }}
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        interactive={true}
                        attributionControl={false}
                        onClick={() => selectedPlane && setSelectedPlane(null)}
                    >
                        <Source id="flight-routes" type="geojson" data={routeGeoJSON}>
                            <Layer id="routes-bg" type="line" paint={{
                                'line-color': ['get', 'color'],
                                'line-width': ['case', ['get', 'selected'], 2.5, 0.8],
                                'line-opacity': ['case', ['get', 'selected'], 0.7, 0.2],
                            }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
                            <Layer id="routes-dash" type="line" paint={{
                                'line-color': ['get', 'color'],
                                'line-width': ['case', ['get', 'selected'], 2, 1],
                                'line-opacity': ['case', ['get', 'selected'], 0.8, 0.35],
                                'line-dasharray': [3, 6],
                            }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
                        </Source>

                        {planes.map(plane => (
                            <Marker key={plane.id} longitude={plane.lng} latitude={plane.lat} anchor="center">
                                <div className="cursor-pointer group relative" onClick={e => handlePlaneClick(plane, e)}>
                                    <motion.div
                                        animate={{ y: [0, -1.5, 0] }}
                                        transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, ease: "easeInOut" }}
                                        className="flex flex-col items-center"
                                    >
                                        {selectedPlane?.id === plane.id && (
                                            <motion.div className="absolute w-8 h-8 border-2 rounded-full -top-0.5 -left-0.5" style={{ borderColor: plane.color || '#38bdf8' }}
                                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                                        )}
                                        <Plane
                                            className="w-3.5 h-3.5 relative z-10 drop-shadow transition-colors duration-200"
                                            style={{ transform: `rotate(${plane.rotate}deg)`, color: plane.color || '#64748b' }}
                                            fill="currentColor" strokeWidth={0}
                                        />
                                        <div className="mt-1 px-1 py-px text-[6px] font-bold uppercase tracking-wider rounded border whitespace-nowrap transition-all"
                                            style={{
                                                backgroundColor: selectedPlane?.id === plane.id ? (plane.color || '#38bdf8') : 'rgba(255,255,255,0.9)',
                                                color: selectedPlane?.id === plane.id ? '#fff' : (plane.color || '#64748b'),
                                                borderColor: selectedPlane?.id === plane.id ? (plane.color || '#38bdf8') : 'rgba(200,200,200,0.3)',
                                            }}>
                                            {plane.flightNumber || plane.label}
                                        </div>
                                    </motion.div>
                                </div>
                            </Marker>
                        ))}
                    </Map>
                    {isLive && (
                        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-luna-warm-gray/20 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-semibold text-luna-charcoal uppercase tracking-wider">Live</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0ebe4] to-[#e8e2da]" />
            )}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[120px] opacity-40 pointer-events-none" />

            {/* Flight Info Modal */}
            <AnimatePresence>
                {selectedPlane && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/15 shadow-luxury w-[380px] overflow-hidden">
                            <div className="px-5 py-3 border-b border-luna-warm-gray/10 flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${selectedPlane.color}10, transparent)` }}>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">{selectedPlane.airlineLogo || '✈️'}</span>
                                    <div>
                                        <h3 className="font-semibold text-luna-charcoal text-sm">{selectedPlane.airline || selectedPlane.callsign}</h3>
                                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: selectedPlane.color || '#3b82f6' }}>Vol {selectedPlane.flightNumber}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPlane(null)} className="p-1 text-luna-text-muted hover:text-luna-charcoal rounded-lg transition-colors"><X size={14} /></button>
                            </div>
                            <div className="px-5 py-3 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-center flex-1">
                                        <p className="text-xl font-bold text-luna-charcoal">{selectedPlane.departure?.code || '---'}</p>
                                        <p className="text-[9px] text-luna-text-muted font-medium">{selectedPlane.departure?.city}</p>
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: selectedPlane.color }}>{selectedPlane.scheduledDeparture ? formatTime(selectedPlane.scheduledDeparture) : '--:--'}</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center gap-0.5">
                                        <div className="flex items-center gap-1 w-full justify-center">
                                            <div className="h-px flex-1 rounded-full" style={{ backgroundColor: selectedPlane.color || '#3b82f6' }} />
                                            <Plane size={12} className="rotate-90" style={{ color: selectedPlane.color }} fill="currentColor" strokeWidth={0} />
                                            <div className="h-px flex-1 rounded-full" style={{ backgroundColor: selectedPlane.color || '#3b82f6' }} />
                                        </div>
                                        {selectedPlane.stops ? (
                                            <p className="text-[8px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-px rounded-full border border-amber-100">{selectedPlane.stops} escale{selectedPlane.stopCity ? ` · ${selectedPlane.stopCity}` : ''}</p>
                                        ) : (
                                            <p className="text-[8px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-px rounded-full border border-emerald-100">Direct</p>
                                        )}
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-xl font-bold text-luna-charcoal">{selectedPlane.arrival?.code || '---'}</p>
                                        <p className="text-[9px] text-luna-text-muted font-medium">{selectedPlane.arrival?.city}</p>
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: selectedPlane.color }}>{selectedPlane.scheduledArrival ? formatTime(selectedPlane.scheduledArrival) : '--:--'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { icon: Gauge, label: 'Vitesse', value: selectedPlane.velocity ? `${Math.round(selectedPlane.velocity * 3.6)} km/h` : '—', col: '#0ea5e9' },
                                        { icon: Navigation, label: 'Altitude', value: selectedPlane.altitude ? `${Math.round(selectedPlane.altitude)}m` : '—', col: '#22c55e' },
                                        { icon: Clock, label: 'Cap', value: `${Math.round(selectedPlane.rotate || 0)}°`, col: '#f59e0b' },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-luna-cream/40 rounded-lg p-2 text-center border border-luna-warm-gray/10">
                                            <s.icon size={11} className="mx-auto mb-0.5" style={{ color: s.col }} />
                                            <p className="text-[8px] text-luna-text-muted">{s.label}</p>
                                            <p className="font-bold text-luna-charcoal text-[10px]">{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
