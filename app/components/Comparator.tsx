'use client';

import { useState } from 'react';
import { X, MapPin, Plane, Hotel, Sun, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface DestinationData {
    city: string;
    transport?: { flights?: any[] };
    accommodation?: { hotels?: any[] };
    itinerary?: { days?: any[] };
}

interface Props {
    destinations: DestinationData[];
    onClose: () => void;
}

const COLORS = ['#0ea5e9', '#6366f1', '#22c55e', '#8b5cf6'];

function getStats(dest: DestinationData) {
    const flights = dest.transport?.flights || [];
    const hotels = dest.accommodation?.hotels || [];
    const days = dest.itinerary?.days || [];

    const prices = flights.map((f: any) => {
        const match = f.price?.match(/[\d\s]+/);
        return match ? parseInt(match[0].replace(/\s/g, '')) : 0;
    }).filter((p: number) => p > 0);

    const hotelPrices = hotels.map((h: any) => {
        const match = h.pricePerNight?.match(/[\d\s]+/);
        return match ? parseInt(match[0].replace(/\s/g, '')) : 0;
    }).filter((p: number) => p > 0);

    return {
        cheapestFlight: prices.length ? Math.min(...prices) : 0,
        avgFlight: prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0,
        flightOptions: flights.length,
        cheapestHotel: hotelPrices.length ? Math.min(...hotelPrices) : 0,
        avgHotel: hotelPrices.length ? Math.round(hotelPrices.reduce((a: number, b: number) => a + b, 0) / hotelPrices.length) : 0,
        hotelOptions: hotels.length,
        avgStars: hotels.length ? Math.round(hotels.reduce((a: number, h: any) => a + (h.stars || 0), 0) / hotels.length * 10) / 10 : 0,
        days: days.length,
        directFlights: flights.filter((f: any) => f.stops === '0' || f.stops === 0).length,
    };
}

export function Comparator({ destinations, onClose }: Props) {
    if (destinations.length < 2) return null;

    const stats = destinations.map(d => ({ city: d.city, ...getStats(d) }));

    // Normalize for radar chart (0-100 scale, inverted for prices = lower is better)
    const maxFlight = Math.max(...stats.map(s => s.avgFlight || 1));
    const maxHotel = Math.max(...stats.map(s => s.avgHotel || 1));
    const maxOpts = Math.max(...stats.map(s => s.flightOptions || 1));
    const maxDays = Math.max(...stats.map(s => s.days || 1));

    const radarData = [
        { metric: 'Prix vol', ...Object.fromEntries(stats.map(s => [s.city, Math.round(100 - (s.avgFlight / maxFlight) * 100) || 50])) },
        { metric: 'Prix hôtel', ...Object.fromEntries(stats.map(s => [s.city, Math.round(100 - (s.avgHotel / maxHotel) * 100) || 50])) },
        { metric: 'Choix vols', ...Object.fromEntries(stats.map(s => [s.city, Math.round((s.flightOptions / maxOpts) * 100)])) },
        { metric: 'Étoiles hôtel', ...Object.fromEntries(stats.map(s => [s.city, Math.round((s.avgStars / 5) * 100)])) },
        { metric: 'Jours', ...Object.fromEntries(stats.map(s => [s.city, Math.round((s.days / maxDays) * 100)])) },
        { metric: 'Vols directs', ...Object.fromEntries(stats.map(s => [s.city, s.directFlights > 0 ? 80 : 20])) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luna-charcoal/30 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                className="bg-white/98 backdrop-blur-2xl rounded-3xl border border-luna-warm-gray/10 w-full max-w-4xl shadow-[0_32px_80px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-luna-warm-gray/10 flex justify-between items-center bg-gradient-to-r from-sky-50/50 via-white to-sky-50/30 flex-shrink-0">
                    <div>
                        <h2 className="font-serif text-xl font-normal text-luna-charcoal">Comparateur</h2>
                        <p className="text-[12px] text-luna-text-muted uppercase tracking-widest font-normal mt-0.5">{destinations.length} destinations</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-luna-text-muted hover:text-luna-charcoal rounded-xl hover:bg-luna-cream transition-colors"><X size={18} /></button>
                </div>

                <div className="overflow-y-auto p-8 flex-1 space-y-8">
                    {/* Side-by-side cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map((s, i) => (
                            <motion.div
                                key={s.city}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl border border-luna-warm-gray/10 p-5 shadow-sm relative overflow-hidden"
                            >
                                {/* Top color accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: COLORS[i % COLORS.length] }} />

                                <h3 className="font-serif text-lg font-normal text-luna-charcoal mt-1 mb-3 flex items-center gap-2">
                                    <MapPin size={16} style={{ color: COLORS[i % COLORS.length] }} />
                                    {s.city}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Plane size={11} /> Vol le moins cher</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{s.cheapestFlight ? `${s.cheapestFlight.toLocaleString()} €` : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Plane size={11} /> Options de vol</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{s.flightOptions}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Plane size={11} /> Vols directs</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{s.directFlights}</span>
                                    </div>
                                    <div className="h-px bg-luna-warm-gray/10" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Hotel size={11} /> Hôtel dès</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{s.cheapestHotel ? `${s.cheapestHotel.toLocaleString()} €/nuit` : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Star size={11} /> Moy. étoiles</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{'★'.repeat(Math.round(s.avgStars))} {s.avgStars}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider flex items-center gap-1.5"><Sun size={11} /> Jours planifiés</span>
                                        <span className="font-normal text-luna-charcoal text-sm">{s.days} jours</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Radar chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-luna-warm-gray/10 p-6 shadow-sm">
                        <h3 className="text-[12px] font-normal text-luna-text-muted uppercase tracking-wider mb-4">Comparaison visuelle</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="#e5e5e5" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#999' }} />
                                    {stats.map((s, i) => (
                                        <Radar
                                            key={s.city}
                                            name={s.city}
                                            dataKey={s.city}
                                            stroke={COLORS[i % COLORS.length]}
                                            fill={COLORS[i % COLORS.length]}
                                            fillOpacity={0.15}
                                            strokeWidth={2}
                                        />
                                    ))}
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
