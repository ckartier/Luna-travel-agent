'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLogo } from '@/src/hooks/useSiteConfig';

// ── Segment icons ──
const SEGMENT_ICONS: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
    FLIGHT: { emoji: '✈️', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
    HOTEL: { emoji: '🏨', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
    ACTIVITY: { emoji: '🎯', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
    TRANSFER: { emoji: '🚗', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
    TRAIN: { emoji: '🚆', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
    RESTAURANT: { emoji: '🍽', color: 'text-[#2E2E2E]', bg: 'bg-[#F5F3F0]', border: 'border-[#E2C8A9]/30' },
};

const TIME_LABELS: Record<string, string> = {
    Morning: '🌅 Matin',
    Afternoon: '☀️ Après-midi',
    Evening: '🌙 Soirée',
    Night: '🌃 Nuit',
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
    CONFIRMED: { label: 'Confirmé', color: 'text-[#2E2E2E] bg-[#F5F3F0] border-[#E2C8A9]/30' },
    PENDING: { label: 'En attente', color: 'text-[#8B7355] bg-[#FAF6F1] border-[#E2C8A9]/30' },
    TICKETED: { label: 'Billets émis', color: 'text-[#2E2E2E] bg-[#F5F3F0] border-[#E2C8A9]/30' },
    CANCELLED: { label: 'Annulé', color: 'text-[#8B7355] bg-white border-[#E2C8A9]/20' },
};

export default function SharedTripPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedDay, setExpandedDay] = useState<number | null>(0);
    const logo = useLogo();

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const res = await fetch(`/api/trip/${shareId}`);
                if (!res.ok) throw new Error('Voyage introuvable');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [shareId]);

    // Compute active scheduled message (the next upcoming one, or the latest past one)
    const activeMessage = useMemo(() => {
        if (!data?.scheduledMessages?.length) return null;
        const now = new Date();
        const msgs = data.scheduledMessages as any[];
        // Find first message whose date is in the past or today (most recent relevant one)
        const pastOrToday = msgs.filter((m: any) => new Date(m.scheduledDate) <= now);
        if (pastOrToday.length > 0) return pastOrToday[pastOrToday.length - 1]; // latest
        return null;
    }, [data]);

    // Days until departure countdown
    const daysUntilDeparture = useMemo(() => {
        if (!data?.trip?.startDate) return null;
        const start = parseISO(data.trip.startDate);
        const diff = differenceInDays(start, new Date());
        return diff >= 0 ? diff : null;
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border border-[#E2C8A9]/30 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-[#E2C8A9]/50 animate-pulse" />
                    </div>
                    <p className="text-[#2E2E2E] text-xs tracking-[0.3em] uppercase font-medium">Chargement…</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#F5F3F0] flex items-center justify-center text-3xl">🔒</div>
                    <h1 className="text-2xl font-light text-[#2E2E2E] mb-3">Voyage introuvable</h1>
                    <p className="text-[#8B7355] text-sm">Ce lien de partage n'existe pas ou a expiré.</p>
                </div>
            </div>
        );
    }

    const { trip, days, bookings } = data;
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    const totalDays = days.length || 0;

    return (
        <div className="min-h-screen bg-white">
            {/* ═══ HEADER — White, Luna logo black, clean ═══ */}
            <header className="border-b border-[#E2C8A9]/20">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                    <img
                        src={logo}
                        alt="Luna"
                        className="object-contain brightness-0"
                        style={{ height: '40px', width: 'auto' }}
                    />
                    <span className="text-[10px] text-[#8B7355] uppercase tracking-[0.25em] font-medium">Conciergerie Voyage</span>
                </div>
            </header>

            {/* ═══ HERO — White background, black text ═══ */}
            <section className="max-w-4xl mx-auto px-6 pt-12 pb-10">
                {/* Top badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 bg-[#F5F3F0] text-[#2E2E2E] text-[10px] tracking-[0.25em] uppercase font-bold px-4 py-2 rounded-full mb-8 border border-[#E2C8A9]/20"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E2E2E]" />
                    Votre voyage sur mesure
                </motion.div>

                {/* Destination */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl sm:text-7xl font-extralight tracking-tight text-[#2E2E2E] mb-3 max-w-2xl"
                >
                    {trip.destination}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[#8B7355] text-lg font-light mb-10 max-w-xl"
                >
                    {trip.title}
                </motion.p>

                {/* Info row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-3"
                >
                    {startDate && (
                        <div className="bg-[#F5F3F0] border border-[#E2C8A9]/15 rounded-xl px-4 py-3 flex items-center gap-3">
                            <span className="text-lg">📅</span>
                            <div>
                                <p className="text-[9px] text-[#8B7355] uppercase tracking-widest font-bold">Dates</p>
                                <p className="text-sm font-medium text-[#2E2E2E]">
                                    {format(startDate, "d MMM", { locale: fr })}
                                    {endDate && ` — ${format(endDate, "d MMM yyyy", { locale: fr })}`}
                                </p>
                            </div>
                        </div>
                    )}
                    {totalDays > 0 && (
                        <div className="bg-[#F5F3F0] border border-[#E2C8A9]/15 rounded-xl px-4 py-3 flex items-center gap-3">
                            <span className="text-lg">🗓</span>
                            <div>
                                <p className="text-[9px] text-[#8B7355] uppercase tracking-widest font-bold">Durée</p>
                                <p className="text-sm font-medium text-[#2E2E2E]">{totalDays} jours</p>
                            </div>
                        </div>
                    )}
                    {trip.travelers && (
                        <div className="bg-[#F5F3F0] border border-[#E2C8A9]/15 rounded-xl px-4 py-3 flex items-center gap-3">
                            <span className="text-lg">👥</span>
                            <div>
                                <p className="text-[9px] text-[#8B7355] uppercase tracking-widest font-bold">Voyageurs</p>
                                <p className="text-sm font-medium text-[#2E2E2E]">{trip.travelers} personne{trip.travelers > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    )}
                    {daysUntilDeparture !== null && daysUntilDeparture > 0 && (
                        <div className="bg-[#2E2E2E] text-white border border-[#2E2E2E] rounded-xl px-5 py-3 flex items-center gap-3">
                            <span className="text-lg">🛫</span>
                            <div>
                                <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold">Départ dans</p>
                                <p className="text-sm font-bold">{daysUntilDeparture} jour{daysUntilDeparture > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    )}
                    {daysUntilDeparture === 0 && (
                        <div className="bg-[#2E2E2E] text-white border border-[#2E2E2E] rounded-xl px-5 py-3 flex items-center gap-3 animate-pulse">
                            <span className="text-lg">✨</span>
                            <div>
                                <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold">C'est le jour J</p>
                                <p className="text-sm font-bold">Bon voyage !</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* ═══ CONTENT ═══ */}
            <main className="max-w-4xl mx-auto px-6 pb-16">

                {/* ── Active scheduled message (from concierge) ── */}
                {activeMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#F5F3F0] border border-[#E2C8A9]/20 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E2C8A9]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-[#2E2E2E] flex items-center justify-center">
                                    <span className="text-white text-xs">💬</span>
                                </div>
                                <div>
                                    <p className="text-[9px] text-[#8B7355] uppercase tracking-[0.2em] font-bold">
                                        Message de votre concierge
                                    </p>
                                    <p className="text-[10px] text-[#8B7355]/60">
                                        {activeMessage.title}
                                        {activeMessage.scheduledDate && ` · ${format(new Date(activeMessage.scheduledDate), "d MMMM yyyy", { locale: fr })}`}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[#2E2E2E] text-base leading-relaxed whitespace-pre-line">
                                {activeMessage.message}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Welcome Message ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white border border-[#E2C8A9]/15 rounded-2xl p-6 sm:p-8 mb-10"
                >
                    <p className="text-[10px] text-[#8B7355] uppercase tracking-[0.3em] font-bold mb-3">Votre concierge</p>
                    <p className="text-[#2E2E2E] text-sm leading-relaxed">
                        Bonjour <strong>{trip.clientName}</strong>, voici l'itinéraire détaillé de votre voyage à <strong>{trip.destination}</strong>.
                        Chaque journée a été pensée sur mesure pour créer une expérience inoubliable.
                    </p>
                </motion.div>

                {/* ── All scheduled messages timeline ── */}
                {data.scheduledMessages && data.scheduledMessages.length > 1 && (
                    <section className="mb-10">
                        <h2 className="text-[10px] text-[#8B7355] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-3">
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                            Fil de communication
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                        </h2>
                        <div className="space-y-3">
                            {(data.scheduledMessages as any[]).map((msg: any, i: number) => {
                                const isActive = activeMessage?.id === msg.id;
                                const isPast = new Date(msg.scheduledDate) <= new Date();
                                const isFuture = !isPast;
                                return (
                                    <motion.div
                                        key={msg.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isActive
                                            ? 'bg-[#F5F3F0] border-[#E2C8A9]/30'
                                            : isFuture
                                                ? 'bg-white border-dashed border-[#E2C8A9]/20 opacity-50'
                                                : 'bg-white border-[#E2C8A9]/10 opacity-70'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isActive ? 'bg-[#2E2E2E] text-white' : isFuture ? 'bg-[#E2C8A9]/10 text-[#8B7355]' : 'bg-[#F5F3F0] text-[#8B7355]'
                                            }`}>
                                            {isPast ? '✓' : isFuture ? '🔒' : '→'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-[#2E2E2E]">{msg.title}</span>
                                                <span className="text-[9px] text-[#8B7355]">
                                                    {format(new Date(msg.scheduledDate), "d MMM yyyy", { locale: fr })}
                                                </span>
                                            </div>
                                            {isPast && (
                                                <p className="text-xs text-[#8B7355] leading-relaxed line-clamp-2">{msg.message}</p>
                                            )}
                                            {isFuture && (
                                                <p className="text-[10px] text-[#8B7355]/50 italic">Message programmé — visible le jour venu</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Day by day timeline ── */}
                {days.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-[10px] text-[#8B7355] uppercase tracking-[0.3em] font-bold mb-8 flex items-center gap-3">
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                            Itinéraire jour par jour
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                        </h2>

                        <div className="space-y-3">
                            {days.map((day: any, idx: number) => {
                                const isExpanded = expandedDay === idx;
                                const dayDate = day.date ? new Date(day.date) : null;

                                return (
                                    <motion.div
                                        key={day.id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.04 * idx }}
                                        className="group"
                                    >
                                        {/* Day Header */}
                                        <button
                                            onClick={() => setExpandedDay(isExpanded ? null : idx)}
                                            className="w-full bg-white rounded-xl p-5 border border-[#E2C8A9]/15 hover:border-[#E2C8A9]/40 transition-all duration-300 text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-[#F5F3F0] border border-[#E2C8A9]/15 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[8px] text-[#8B7355] uppercase tracking-wider font-bold">Jour</span>
                                                    <span className="text-lg font-light text-[#2E2E2E]">{day.dayIndex || idx + 1}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-[#2E2E2E] text-sm sm:text-base truncate">
                                                        {day.title || `Jour ${idx + 1}`}
                                                    </h3>
                                                    {dayDate && (
                                                        <p className="text-[11px] text-[#8B7355] mt-0.5">
                                                            {format(dayDate, "EEEE d MMMM yyyy", { locale: fr })}
                                                        </p>
                                                    )}
                                                    {day.location && (
                                                        <p className="text-[10px] text-[#8B7355]/60 mt-0.5">📍 {day.location}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(day.segments || []).length > 0 && (
                                                        <span className="text-[9px] text-[#8B7355] bg-[#F5F3F0] px-2 py-1 rounded font-medium border border-[#E2C8A9]/10">
                                                            {day.segments.length} étape{day.segments.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    <svg
                                                        className={`w-4 h-4 text-[#8B7355]/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expanded segments */}
                                        <AnimatePresence>
                                            {isExpanded && (day.segments || []).length > 0 && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-6 border-l border-[#E2C8A9]/20 space-y-0 mt-1.5 mb-2">
                                                        {day.segments.map((seg: any, segIdx: number) => {
                                                            const icon = SEGMENT_ICONS[seg.type] || SEGMENT_ICONS.ACTIVITY;
                                                            return (
                                                                <div key={seg.id || segIdx} className="relative pl-7 py-2.5">
                                                                    <div className="absolute left-[-4px] top-4 w-2 h-2 rounded-full bg-[#E2C8A9]/40 border border-white" />

                                                                    <div className="bg-white rounded-lg p-3.5 border border-[#E2C8A9]/10">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className={`w-8 h-8 rounded-lg ${icon.bg} flex items-center justify-center shrink-0 text-sm border ${icon.border}`}>
                                                                                {icon.emoji}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                                    <h4 className="font-medium text-xs text-[#2E2E2E]">{seg.title}</h4>
                                                                                    {seg.timeSlot && (
                                                                                        <span className="text-[8px] text-[#8B7355] bg-[#F5F3F0] px-1.5 py-0.5 rounded font-medium">
                                                                                            {TIME_LABELS[seg.timeSlot] || seg.timeSlot}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {seg.description && (
                                                                                    <p className="text-[11px] text-[#8B7355] leading-relaxed">{seg.description}</p>
                                                                                )}
                                                                                {seg.location && (
                                                                                    <p className="text-[9px] text-[#8B7355]/50 mt-0.5">📍 {seg.location}</p>
                                                                                )}
                                                                                {(seg.startTime || seg.endTime) && (
                                                                                    <p className="text-[9px] text-[#8B7355] mt-0.5 font-medium">
                                                                                        🕐 {seg.startTime}{seg.endTime ? ` — ${seg.endTime}` : ''}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Bookings ── */}
                {bookings && bookings.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-[10px] text-[#8B7355] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-3">
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                            Vos réservations
                            <span className="h-px bg-[#E2C8A9]/30 flex-1" />
                        </h2>

                        <div className="grid gap-2">
                            {bookings.map((b: any, i: number) => {
                                const icon = SEGMENT_ICONS[b.type] || SEGMENT_ICONS.ACTIVITY;
                                const statusCfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.PENDING;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.04 * i }}
                                        className="bg-white rounded-lg p-3.5 border border-[#E2C8A9]/15 flex items-center gap-3"
                                    >
                                        <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center text-base shrink-0 border ${icon.border}`}>
                                            {icon.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-xs text-[#2E2E2E] truncate">{b.supplier || b.destination}</p>
                                            <p className="text-[9px] text-[#8B7355] mt-0.5">
                                                {b.checkIn}{b.checkOut ? ` → ${b.checkOut}` : ''}
                                            </p>
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Empty state ── */}
                {days.length === 0 && (!bookings || bookings.length === 0) && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-[#F5F3F0] flex items-center justify-center text-2xl border border-[#E2C8A9]/15">🗺</div>
                        <h2 className="text-lg font-light text-[#2E2E2E] mb-2">Itinéraire en préparation</h2>
                        <p className="text-xs text-[#8B7355]">Votre concierge prépare les détails de votre voyage. Revenez bientôt !</p>
                    </div>
                )}
            </main>

            {/* ═══ FOOTER — Minimal, black on white ═══ */}
            <footer className="border-t border-[#E2C8A9]/15 py-10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <img
                        src={logo}
                        alt="Luna"
                        className="object-contain brightness-0 mx-auto mb-4"
                        style={{ height: '28px', width: 'auto' }}
                    />
                    <p className="text-[#8B7355] text-[10px] tracking-[0.3em] uppercase font-medium">Votre Concierge Voyage Sur Mesure</p>
                    <p className="text-[#8B7355]/40 text-[9px] mt-2 tracking-wider">© {new Date().getFullYear()} Votre Conciergerie</p>
                </div>
            </footer>
        </div>
    );
}
