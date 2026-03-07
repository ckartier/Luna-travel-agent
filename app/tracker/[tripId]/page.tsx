'use client';

import { Plane, MapPin, CalendarDays, Clock, CheckCircle2, Hotel, Car, Compass } from 'lucide-react';

// This is a client-facing, read-only page. No authentication required.
// The trip data would be fetched by tripId from Firestore.

const MOCK_TRIP = {
    title: 'Japon — Sakura Season',
    client: 'Jean Dupont',
    destination: 'Tokyo → Kyoto → Osaka',
    startDate: '15 Avril 2026',
    endDate: '25 Avril 2026',
    status: 'CONFIRMED',
    agencyName: 'Luna Travel',
    days: [
        {
            date: '15 Avril', title: 'Jour 1 — Arrivée à Tokyo', segments: [
                { type: 'FLIGHT', title: 'Vol AF1042 CDG → NRT', time: '10:30 - 06:45+1', icon: <Plane size={16} /> },
                { type: 'TRANSFER', title: 'Transfert Narita → Shinjuku', time: '08:00', icon: <Car size={16} /> },
                { type: 'HOTEL', title: 'Park Hyatt Tokyo', time: 'Check-in 15:00', icon: <Hotel size={16} /> },
            ]
        },
        {
            date: '16 Avril', title: 'Jour 2 — Découverte de Tokyo', segments: [
                { type: 'ACTIVITY', title: 'Visite du temple Senso-ji', time: '09:00 - 12:00', icon: <Compass size={16} /> },
                { type: 'ACTIVITY', title: 'Parc Ueno & Akihabara', time: '14:00 - 18:00', icon: <MapPin size={16} /> },
            ]
        },
        {
            date: '17 Avril', title: 'Jour 3 — Mont Fuji', segments: [
                { type: 'ACTIVITY', title: 'Excursion Mont Fuji & Hakone', time: 'Journée complète', icon: <Compass size={16} /> },
            ]
        },
    ]
};

export default function TravelTrackerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-3xl mx-auto p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-tr from-sky-400 to-violet-500 rounded-xl flex items-center justify-center text-white font-normal text-sm shadow-sm">
                            L
                        </div>
                        <span className="text-sm font-normal text-gray-500">{MOCK_TRIP.agencyName}</span>
                    </div>

                    <h1 className="text-3xl font-black text-luna-charcoal mb-2">{MOCK_TRIP.title}</h1>
                    <p className="text-gray-500 font-normal text-sm mb-4">{MOCK_TRIP.destination}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600 font-normal bg-gray-100 px-3 py-1.5 rounded-lg">
                            <CalendarDays size={14} /> {MOCK_TRIP.startDate} → {MOCK_TRIP.endDate}
                        </span>
                        <span className="flex items-center gap-1.5 font-normal bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 size={14} /> Confirmé
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {MOCK_TRIP.days.map((day, dIdx) => (
                    <div key={dIdx} className="relative">
                        {/* Vertical line connector */}
                        {dIdx < MOCK_TRIP.days.length - 1 && (
                            <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gray-200" />
                        )}

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-luna-charcoal text-white rounded-full flex items-center justify-center text-sm font-normal shrink-0 shadow-sm z-10">
                                {dIdx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3 mb-3">
                                    <h2 className="text-lg font-normal text-luna-charcoal">{day.title}</h2>
                                    <span className="text-xs text-gray-400 font-normal">{day.date}</span>
                                </div>

                                <div className="space-y-2">
                                    {day.segments.map((seg, sIdx) => (
                                        <div key={sIdx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${seg.type === 'FLIGHT' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                    seg.type === 'HOTEL' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        seg.type === 'TRANSFER' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {seg.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-normal text-luna-charcoal">{seg.title}</p>
                                                <p className="text-xs text-gray-400 font-normal flex items-center gap-1"><Clock size={10} /> {seg.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center py-8 text-xs text-gray-400 font-normal border-t border-gray-100">
                Propulsé par <span className="font-normal text-luna-charcoal">Luna Travel</span> — Votre agence de confiance.
            </div>
        </div>
    );
}
