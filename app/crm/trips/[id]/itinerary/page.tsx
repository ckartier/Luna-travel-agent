'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CRMTripDay, CRMTripSegment, getTripDays, createTripDay, updateTripDay } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, Plus, Plane, Hotel, Map, Car, Clock, GripVertical, Trash2, Save, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// This is a simplified frontend mockup of an Itinerary Builder.
// In a full production app, you'd use @hello-pangea/dnd for real drag and drop.

export default function ItineraryBuilderPage({ params }: { params: { id: string } }) {
    const { tenantId } = useAuth();
    const router = useRouter();
    const [days, setDays] = useState<CRMTripDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadItinerary();
    }, [params.id]);

    const loadItinerary = async () => {
        setLoading(true);
        try {
            const fetchedDays = await getTripDays(tenantId!, params.id);
            if (fetchedDays.length === 0) {
                // Initialize with a blank Day 1 if empty
                const newDay: Omit<CRMTripDay, 'id'> = {
                    date: format(new Date(), 'yyyy-MM-dd'),
                    dayIndex: 1,
                    title: 'Arrivée & Installation',
                    segments: []
                };
                const id = await createTripDay(tenantId!, params.id, newDay);
                setDays([{ id, ...newDay }]);
            } else {
                setDays(fetchedDays);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addDay = async () => {
        try {
            const lastDay = days[days.length - 1];
            const nextDate = lastDay ? format(addDays(new Date(lastDay.date), 1), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            const newIndex = lastDay ? lastDay.dayIndex + 1 : 1;

            const newDay: Omit<CRMTripDay, 'id'> = {
                date: nextDate,
                dayIndex: newIndex,
                title: `Jour ${newIndex}`,
                segments: []
            };

            const id = await createTripDay(tenantId!, params.id, newDay);
            setDays([...days, { id, ...newDay }]);
        } catch (error) {
            console.error(error);
        }
    };

    const addSegment = async (dayId: string, type: 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER') => {
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const newSegment: CRMTripSegment = {
            id: Date.now().toString(),
            type,
            title: `Nouveau ${type}`,
            timeSlot: 'Morning',
            description: ''
        };

        const updatedDays = [...days];
        updatedDays[dayIndex].segments.push(newSegment);
        setDays(updatedDays);

        // Auto-save
        updateTripDay(tenantId!, params.id, dayId, { segments: updatedDays[dayIndex].segments });
    };

    const removeSegment = async (dayId: string, segmentId: string) => {
        const dayIndex = days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const updatedDays = [...days];
        updatedDays[dayIndex].segments = updatedDays[dayIndex].segments.filter(s => s.id !== segmentId);
        setDays(updatedDays);

        // Auto-save
        updateTripDay(tenantId!, params.id, dayId, { segments: updatedDays[dayIndex].segments });
    };

    const getSegmentIcon = (type: string) => {
        switch (type) {
            case 'FLIGHT': return <Plane size={18} className="text-sky-500" />;
            case 'HOTEL': return <Hotel size={18} className="text-indigo-500" />;
            case 'ACTIVITY': return <Map size={18} className="text-emerald-500" />;
            case 'TRANSFER': return <Car size={18} className="text-amber-500" />;
            default: return <Map size={18} className="text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="p-8"><p className="text-center text-gray-500 animate-pulse">Chargement de l'itinéraire...</p></div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen pb-32">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-black transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-luna-charcoal">Itinéraire Détaillé</h1>
                        <p className="text-sm text-gray-500">Planification jour par jour</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={addDay} className="bg-white border border-gray-200 text-luna-charcoal px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <CalendarIcon size={16} /> Ajouter un Jour
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-2">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {days.map((day) => (
                    <div key={day.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden group">
                        {/* Day Header */}
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white shadow-sm border border-gray-200 px-3 py-1.5 rounded-lg text-center">
                                    <span className="block text-xs font-medium tracking-wide text-gray-400">Jour</span>
                                    <span className="block text-lg font-semibold text-luna-charcoal">{day.dayIndex}</span>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={day.title || ''}
                                        onChange={(e) => {
                                            const newDays = [...days];
                                            const dx = newDays.findIndex(d => d.id === day.id);
                                            newDays[dx].title = e.target.value;
                                            setDays(newDays);
                                        }}
                                        className="font-bold text-lg text-luna-charcoal bg-transparent border-none p-0 focus:ring-0 w-64 placeholder-gray-300"
                                        placeholder="Titre de la journée"
                                    />
                                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => addSegment(day.id, 'FLIGHT')} className="p-1.5 bg-sky-50 text-sky-600 rounded-md hover:bg-sky-100 tooltip"><Plane size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'HOTEL')} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 tooltip"><Hotel size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'ACTIVITY')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 tooltip"><Map size={16} /></button>
                                <button onClick={() => addSegment(day.id, 'TRANSFER')} className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 tooltip"><Car size={16} /></button>
                            </div>
                        </div>

                        {/* Segments List */}
                        <div className="p-6">
                            {day.segments.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-sm text-gray-400 font-medium mb-3">Aucune étape planifiée pour ce jour.</p>
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => addSegment(day.id, 'ACTIVITY')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                                            <Plus size={14} /> Activité
                                        </button>
                                        <button onClick={() => addSegment(day.id, 'HOTEL')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                                            <Plus size={14} /> Hôtel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {day.segments.map((segment, idx) => (
                                        <div key={segment.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-white relative group/segment">
                                            <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                                <GripVertical size={18} />
                                            </div>

                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                                {getSegmentIcon(segment.type)}
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="col-span-12 md:col-span-4">
                                                    <input
                                                        type="text"
                                                        value={segment.title}
                                                        onChange={(e) => {
                                                            const newDays = [...days];
                                                            const dx = newDays.findIndex(d => d.id === day.id);
                                                            newDays[dx].segments[idx].title = e.target.value;
                                                            setDays(newDays);
                                                        }}
                                                        className="font-bold text-sm text-luna-charcoal w-full border-none p-0 focus:ring-0 mb-1"
                                                        placeholder="Titre de l'étape"
                                                    />
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-max">
                                                        <Clock size={12} />
                                                        <select
                                                            value={segment.timeSlot}
                                                            onChange={(e) => {
                                                                const newDays = [...days];
                                                                const dx = newDays.findIndex(d => d.id === day.id);
                                                                newDays[dx].segments[idx].timeSlot = e.target.value;
                                                                setDays(newDays);
                                                            }}
                                                            className="bg-transparent border-none p-0 text-xs font-medium focus:ring-0 text-gray-600"
                                                        >
                                                            <option value="Morning">Matin</option>
                                                            <option value="Afternoon">Après-midi</option>
                                                            <option value="Evening">Soirée</option>
                                                            <option value="Night">Nuit</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-span-12 md:col-span-8">
                                                    <textarea
                                                        value={segment.description || ''}
                                                        onChange={(e) => {
                                                            const newDays = [...days];
                                                            const dx = newDays.findIndex(d => d.id === day.id);
                                                            newDays[dx].segments[idx].description = e.target.value;
                                                            setDays(newDays);
                                                        }}
                                                        placeholder="Description de l'activité, lieu de rendez-vous, numéro de réservation..."
                                                        className="w-full text-sm text-gray-600 border border-transparent hover:border-gray-200 focus:border-gray-200 focus:bg-gray-50 rounded-lg p-2 resize-none h-16 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeSegment(day.id, segment.id)}
                                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover/segment:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button
                    onClick={addDay}
                    className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 font-bold rounded-2xl hover:border-luna-charcoal hover:text-luna-charcoal transition-colors hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Ajouter un Jour
                </button>
            </div>
        </div>
    );
}
