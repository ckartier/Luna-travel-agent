'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Cloud, ThermometerSun, ChevronDown, ChevronUp, Wind, Droplets, Snowflake, CloudSun, Loader2, ExternalLink } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

interface WeatherData {
    city: string;
    country: string;
    current: {
        temp: number;
        feelsLike: number;
        humidity: number;
        wind: number;
        condition: string;
        description: string;
        icon: string;
    };
    forecast: {
        date: string;
        temp: number;
        condition: string;
        humidity: number;
        wind: number;
        icon: string;
    }[];
}

interface WeatherWidgetProps {
    destinations: string[];
}

export function WeatherWidget({ destinations }: WeatherWidgetProps) {
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        const validDests = destinations.filter(d => d.trim().length >= 2);
        validDests.forEach(dest => {
            const key = dest.trim().toLowerCase();
            if (weatherData[key] || loading[key]) return;

            setLoading(prev => ({ ...prev, [key]: true }));
            fetchWithAuth(`/api/weather?city=${encodeURIComponent(dest.trim())}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setWeatherData(prev => ({ ...prev, [key]: data }));
                        // Save weather to Firebase for CRM
                        saveWeatherToFirebase(dest.trim(), data);
                    }
                })
                .catch(err => console.error('Weather fetch error:', err))
                .finally(() => setLoading(prev => ({ ...prev, [key]: false })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destinations.join(',')]);

    const saveWeatherToFirebase = async (city: string, data: WeatherData) => {
        try {
            await fetchWithAuth('/api/weather/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, weather: data }),
            });
        } catch (err) {
            console.error('Failed to save weather to Firebase:', err);
        }
    };

    const getWeatherIcon = (condition: string, size = "w-5 h-5") => {
        switch (condition) {
            case 'Clear': return <Sun className={`${size} text-amber-500`} />;
            case 'Clouds': return <Cloud className={`${size} text-slate-400`} />;
            case 'Rain': case 'Drizzle': return <CloudRain className={`${size} text-blue-500`} />;
            case 'Snow': return <Snowflake className={`${size} text-sky-300`} />;
            case 'Thunderstorm': return <CloudRain className={`${size} text-purple-500`} />;
            default: return <CloudSun className={`${size} text-amber-400`} />;
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    };

    const openWeatherSite = (cityName: string) => {
        window.open(`https://www.weather.com/weather/today/l/${encodeURIComponent(cityName)}`, '_blank', 'noopener');
    };

    const validDests = destinations.filter(d => d.trim().length >= 2);
    if (validDests.length === 0) return null;

    return (
        <div className="flex flex-col gap-2.5 w-full">
            {validDests.map(dest => {
                const key = dest.trim().toLowerCase();
                const data = weatherData[key];
                const isLoading = loading[key];
                const isExpanded = expanded === key;

                return (
                    <motion.div
                        key={key}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden"
                    >
                        <div
                            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/50 transition-colors"
                        >
                            <div
                                className="flex items-center gap-3 flex-1"
                                onClick={() => setExpanded(isExpanded ? null : key)}
                            >
                                <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 p-2 rounded-xl border border-sky-200/30">
                                    {isLoading ? <Loader2 className="w-5 h-5 text-sky-400 animate-spin" /> : data ? getWeatherIcon(data.current.condition, "w-5 h-5") : <Cloud className="w-5 h-5 text-slate-300" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-luna-charcoal capitalize text-sm leading-tight">{data?.city || dest}</h3>
                                    {data && (
                                        <p className="text-xs text-luna-text-muted mt-0.5 flex items-center gap-2.5">
                                            <span className="flex items-center gap-0.5 text-luna-charcoal font-bold"><ThermometerSun size={11} className="text-amber-500" /> {data.current.temp}°</span>
                                            <span className="flex items-center gap-0.5"><Droplets size={10} className="text-sky-400" /> {data.current.humidity}%</span>
                                            <span className="flex items-center gap-0.5"><Wind size={10} /> {data.current.wind} km/h</span>
                                        </p>
                                    )}
                                    {isLoading && <p className="text-[10px] text-luna-text-muted mt-0.5">Chargement...</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Clickable link to weather.com */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); openWeatherSite(data?.city || dest); }}
                                    className="p-1.5 text-luna-text-muted/40 hover:text-sky-500 rounded-full transition-colors"
                                    title="Voir sur Weather.com"
                                >
                                    <ExternalLink size={14} />
                                </button>
                                {data && (
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : key)}
                                        className="p-1.5 text-luna-text-muted/50 hover:text-luna-charcoal rounded-full transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && data?.forecast && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="border-t border-luna-warm-gray/15"
                                >
                                    <div className="p-3 pt-2.5">
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {data.forecast.map((day, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex flex-col items-center p-2 rounded-xl min-w-[54px] flex-shrink-0 border transition-all ${idx === 0 ? 'bg-luna-charcoal border-luna-charcoal text-white' : 'bg-white/80 border-luna-warm-gray/15'}`}
                                                >
                                                    <span className={`text-[9px] font-semibold uppercase mb-1 ${idx === 0 ? 'text-luna-cream/60' : 'text-luna-text-muted'}`}>{formatDate(day.date).split(' ')[0]}</span>
                                                    {getWeatherIcon(day.condition, idx === 0 ? "w-4 h-4 text-white" : "w-4 h-4")}
                                                    <span className={`text-sm font-bold mt-1 ${idx === 0 ? 'text-white' : 'text-luna-charcoal'}`}>{day.temp}°</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
