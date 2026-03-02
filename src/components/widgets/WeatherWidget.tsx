'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Cloud, ThermometerSun, ChevronDown, ChevronUp, Wind, Droplets } from 'lucide-react';

interface WeatherDay {
    date: string;
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy';
}

// Mock 10-day forecast data
const MOCK_FORECAST: WeatherDay[] = Array.from({ length: 10 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const conditions: ('Sunny' | 'Cloudy' | 'Rainy')[] = ['Sunny', 'Sunny', 'Cloudy', 'Rainy', 'Sunny'];
    return {
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        temp: Math.floor(Math.random() * (32 - 20 + 1)) + 20, // Temp between 20°C and 32°C
        condition: conditions[Math.floor(Math.random() * conditions.length)]
    };
});

interface WeatherWidgetProps {
    destination: string;
}

export function WeatherWidget({ destination }: WeatherWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!destination) return null;

    const today = MOCK_FORECAST[0];

    const getIcon = (condition: string, className = "w-5 h-5") => {
        switch (condition) {
            case 'Sunny': return <Sun className={`${className} text-amber-500`} />;
            case 'Cloudy': return <Cloud className={`${className} text-blue-400`} />;
            case 'Rainy': return <CloudRain className={`${className} text-blue-600`} />;
            default: return <Sun className={`${className} text-amber-500`} />;
        }
    };

    return (
        <div className="w-full relative z-40 my-4">
            {/* Premium Glassmorphism Container */}
            <motion.div
                layout
                className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden"
            >
                {/* Header (Always visible) */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-2.5 rounded-xl border border-blue-200/50">
                            {getIcon(today.condition, "w-6 h-6")}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 capitalize text-lg">{destination}</h3>
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider bg-gray-100/80 px-2 py-0.5 rounded-full">Aujourd'hui</span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mt-0.5 flex items-center gap-3">
                                <span className="flex items-center gap-1 text-gray-700 font-bold"><ThermometerSun size={14} className="text-amber-500" /> {today.temp}°C</span>
                                <span className="flex items-center gap-1"><Droplets size={12} className="text-blue-400" /> 45%</span>
                                <span className="flex items-center gap-1"><Wind size={12} className="text-slate-400" /> 12 km/h</span>
                            </p>
                        </div>
                    </div>

                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {/* 10-day Forecast (Collapsible) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="border-t border-gray-100/50"
                        >
                            <div className="p-4 bg-gradient-to-b from-transparent to-blue-50/20">
                                <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                                    Prévisions sur 10 jours <span className="h-px bg-blue-100 flex-1"></span>
                                </h4>

                                {/* Scrollable forecast container */}
                                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    {MOCK_FORECAST.map((day, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col items-center justify-between p-3 rounded-2xl min-w-[72px] flex-shrink-0 border transition-all hover:-translate-y-1 hover:shadow-md ${idx === 0 ? 'bg-blue-500 border-blue-600 shadow-blue-500/20 text-white' : 'bg-white/80 border-gray-100 hover:border-blue-200'}`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase mb-2 ${idx === 0 ? 'text-blue-100' : 'text-gray-500'}`}>{day.date.split(' ')[0]}</span>
                                            {getIcon(day.condition, idx === 0 ? "w-6 h-6 text-white" : "w-6 h-6")}
                                            <span className={`text-base font-black mt-2 ${idx === 0 ? 'text-white' : 'text-gray-800'}`}>{day.temp}°</span>
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
