'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Cloud, ThermometerSun, ChevronDown, ChevronUp, Wind, Droplets, Snowflake } from 'lucide-react';

interface WeatherDay {
    date: string;
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy';
    humidity: number;
    wind: number;
}

// Mock weather profiles per destination (seeded by city name)
const CITY_PROFILES: Record<string, { baseTemp: number; conditions: ('Sunny' | 'Cloudy' | 'Rainy' | 'Snowy')[]; humidity: number; wind: number }> = {
    'paris': { baseTemp: 14, conditions: ['Cloudy', 'Rainy', 'Cloudy', 'Sunny', 'Cloudy'], humidity: 65, wind: 18 },
    'île maurice': { baseTemp: 28, conditions: ['Sunny', 'Sunny', 'Sunny', 'Cloudy', 'Sunny'], humidity: 72, wind: 14 },
    'maurice': { baseTemp: 28, conditions: ['Sunny', 'Sunny', 'Sunny', 'Cloudy', 'Sunny'], humidity: 72, wind: 14 },
    'bali': { baseTemp: 30, conditions: ['Sunny', 'Sunny', 'Rainy', 'Sunny', 'Cloudy'], humidity: 78, wind: 10 },
    'maldives': { baseTemp: 29, conditions: ['Sunny', 'Sunny', 'Sunny', 'Sunny', 'Cloudy'], humidity: 80, wind: 12 },
    'dubai': { baseTemp: 35, conditions: ['Sunny', 'Sunny', 'Sunny', 'Sunny', 'Sunny'], humidity: 30, wind: 8 },
    'new york': { baseTemp: 10, conditions: ['Cloudy', 'Sunny', 'Rainy', 'Cloudy', 'Snowy'], humidity: 55, wind: 22 },
    'tokyo': { baseTemp: 18, conditions: ['Sunny', 'Cloudy', 'Rainy', 'Sunny', 'Cloudy'], humidity: 60, wind: 15 },
    'rome': { baseTemp: 22, conditions: ['Sunny', 'Sunny', 'Cloudy', 'Sunny', 'Sunny'], humidity: 50, wind: 12 },
    'santorini': { baseTemp: 26, conditions: ['Sunny', 'Sunny', 'Sunny', 'Cloudy', 'Sunny'], humidity: 45, wind: 20 },
    'marrakech': { baseTemp: 28, conditions: ['Sunny', 'Sunny', 'Sunny', 'Sunny', 'Cloudy'], humidity: 25, wind: 10 },
    'barcelone': { baseTemp: 22, conditions: ['Sunny', 'Sunny', 'Cloudy', 'Sunny', 'Sunny'], humidity: 55, wind: 14 },
    'bangkok': { baseTemp: 33, conditions: ['Sunny', 'Rainy', 'Sunny', 'Cloudy', 'Rainy'], humidity: 85, wind: 8 },
    'seychelles': { baseTemp: 29, conditions: ['Sunny', 'Sunny', 'Sunny', 'Cloudy', 'Sunny'], humidity: 75, wind: 11 },
    'zanzibar': { baseTemp: 30, conditions: ['Sunny', 'Sunny', 'Cloudy', 'Sunny', 'Sunny'], humidity: 70, wind: 13 },
    'phuket': { baseTemp: 31, conditions: ['Sunny', 'Sunny', 'Rainy', 'Sunny', 'Cloudy'], humidity: 76, wind: 9 },
    'lisbonne': { baseTemp: 20, conditions: ['Sunny', 'Cloudy', 'Sunny', 'Sunny', 'Cloudy'], humidity: 58, wind: 16 },
    'mykonos': { baseTemp: 25, conditions: ['Sunny', 'Sunny', 'Sunny', 'Sunny', 'Cloudy'], humidity: 42, wind: 24 },
};

const DEFAULT_PROFILE = { baseTemp: 24, conditions: ['Sunny', 'Cloudy', 'Sunny', 'Rainy', 'Sunny'] as ('Sunny' | 'Cloudy' | 'Rainy' | 'Snowy')[], humidity: 55, wind: 14 };

function generateForecast(destination: string): WeatherDay[] {
    const key = destination.toLowerCase().trim();
    const profile = CITY_PROFILES[key] || DEFAULT_PROFILE;

    return Array.from({ length: 10 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Slight variation per day
        const tempVariation = Math.round(Math.sin(i * 1.3 + key.length) * 3);
        const conditionIdx = (i + key.length) % profile.conditions.length;

        return {
            date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
            temp: profile.baseTemp + tempVariation,
            condition: profile.conditions[conditionIdx],
            humidity: profile.humidity + Math.round(Math.sin(i * 2) * 8),
            wind: profile.wind + Math.round(Math.cos(i) * 4),
        };
    });
}

interface WeatherWidgetProps {
    destination: string;
}

export function WeatherWidget({ destination }: WeatherWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const forecast = useMemo(() => generateForecast(destination), [destination]);

    if (!destination) return null;

    const today = forecast[0];

    const getIcon = (condition: string, className = "w-5 h-5") => {
        switch (condition) {
            case 'Sunny': return <Sun className={`${className} text-amber-500`} />;
            case 'Cloudy': return <Cloud className={`${className} text-blue-400`} />;
            case 'Rainy': return <CloudRain className={`${className} text-blue-600`} />;
            case 'Snowy': return <Snowflake className={`${className} text-sky-300`} />;
            default: return <Sun className={`${className} text-amber-500`} />;
        }
    };

    return (
        <div className="w-full relative z-40 my-4">
            <motion.div
                layout
                key={destination}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden"
            >
                {/* Header */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 p-2.5 rounded-xl border border-sky-200/50">
                            {getIcon(today.condition, "w-6 h-6")}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-luna-charcoal capitalize text-lg">{destination}</h3>
                                <span className="text-luna-text-muted text-[10px] font-semibold uppercase tracking-wider bg-luna-cream px-2 py-0.5 rounded-full">Aujourd'hui</span>
                            </div>
                            <p className="text-sm font-medium text-luna-text-muted mt-0.5 flex items-center gap-3">
                                <span className="flex items-center gap-1 text-luna-charcoal font-bold"><ThermometerSun size={14} className="text-amber-500" /> {today.temp}°C</span>
                                <span className="flex items-center gap-1"><Droplets size={12} className="text-sky-400" /> {today.humidity}%</span>
                                <span className="flex items-center gap-1"><Wind size={12} className="text-luna-text-muted" /> {today.wind} km/h</span>
                            </p>
                        </div>
                    </div>

                    <button className="p-2 text-luna-text-muted hover:text-luna-accent-dark hover:bg-luna-accent/10 rounded-full transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {/* 10-day Forecast */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="border-t border-luna-warm-gray/20"
                        >
                            <div className="p-4 bg-gradient-to-b from-transparent to-sky-50/20">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-luna-accent-dark mb-4 flex items-center gap-2">
                                    Prévisions sur 10 jours <span className="h-px bg-luna-warm-gray/20 flex-1"></span>
                                </h4>

                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-luna-warm-gray scrollbar-track-transparent">
                                    {forecast.map((day, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col items-center justify-between p-3 rounded-2xl min-w-[72px] flex-shrink-0 border transition-all hover:-translate-y-1 hover:shadow-md ${idx === 0 ? 'bg-luna-charcoal border-luna-charcoal shadow-lg text-white' : 'bg-white/80 border-luna-warm-gray/20 hover:border-luna-accent/30'}`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase mb-2 ${idx === 0 ? 'text-luna-cream/70' : 'text-luna-text-muted'}`}>{day.date.split(' ')[0]}</span>
                                            {getIcon(day.condition, idx === 0 ? "w-6 h-6 text-white" : "w-6 h-6")}
                                            <span className={`text-base font-bold mt-2 ${idx === 0 ? 'text-white' : 'text-luna-charcoal'}`}>{day.temp}°</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
