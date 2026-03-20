'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Map, Users, Plane, Calendar as CalendarIcon, ArrowLeft, Plus, DollarSign, Hotel, Check, FileText, Send, BarChart3, Link2 } from 'lucide-react';
import { CRMTrip, getTrips, CRMBooking, getBookingsForTrip } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import Link from 'next/link';
import { T } from '@/src/components/T';

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tripId } = use(params);
    const { tenantId } = useAuth();
    const router = useRouter();
    const [trip, setTrip] = useState<CRMTrip | null>(null);
    const [bookings, setBookings] = useState<CRMBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadTripData();
    }, [tripId]);

    const loadTripData = async () => {
        setLoading(true);
        try {
            const allTrips = await getTrips(tenantId!);
            const foundTrip = allTrips.find(t => t.id === tripId);
            if (foundTrip) {
                setTrip(foundTrip);
                const bks = await getBookingsForTrip(tenantId!, tripId);
                setBookings(bks);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSharePortal = async () => {
        // Generate portal URL — uses the trip's shareId if it exists, otherwise uses tripId
        const shareToken = (trip as any)?.shareId || tripId;
        const portalUrl = `${window.location.origin}/portal/${shareToken}`;
        try {
            await navigator.clipboard.writeText(portalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // fallback
            prompt('Lien du portail client :', portalUrl);
        }
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center min-h-[60vh]"><p className="text-gray-400 font-normal">Chargement du voyage...</p></div>;
    }

    if (!trip) {
        return (
            <div className="text-center mt-20">
                <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Voyage introuvable</T></h1>
                <button onClick={() => router.back()} className="text-sky-500 hover:underline"><T>Retour</T></button>
            </div>
        );
    }

    const totalCost = bookings.reduce((sum, b) => sum + b.supplierCost, 0);
    const totalPrice = bookings.reduce((sum, b) => sum + b.clientPrice, 0);
    const margin = totalPrice - totalCost;
    const marginPercent = totalPrice > 0 ? Math.round((margin / totalPrice) * 100) : 0;

    return (
        <div className="min-h-screen">
            <button onClick={() => router.back()} className="text-sm text-[#6B7280] mt-1 font-medium">
                <ArrowLeft size={16} /> <T>Retour</T>
            </button>

            {/* Header section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-50 to-blue-50/20 rounded-bl-full -z-10" />

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-luna-charcoal text-white text-[12px] font-normal uppercase tracking-widest px-3 py-1 rounded-full">
                                {trip.status}
                            </span>
                            <span className="text-sm font-normal text-gray-400 flex items-center gap-1.5 border border-gray-200 px-3 py-1 rounded-full">
                                <Map size={14} /> {trip.destination}
                            </span>
                        </div>
                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">{trip.title}</h1>

                        <div className="flex items-center gap-6 text-sm text-gray-600 font-normal">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg  ">
                                <CalendarIcon size={16} className="text-gray-400" />
                                {trip.startDate} — {trip.endDate}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg  ">
                                <Users size={16} className="text-gray-400" />
                                {trip.travelers || 2} <T>Voyageurs</T>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg  ">
                                <DollarSign size={16} className="text-gray-400" />
                                Budget: {trip.amount}€
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href={`/crm/trips/${trip.id}/itinerary`} className="px-5 py-2.5 bg-luna-cyan text-luna-charcoal font-normal text-sm rounded-xl hover:bg-[#68e2e0] transition-colors shadow-sm flex items-center gap-2 justify-center">
                            <Map size={18} /> Construire l&apos;Itinéraire
                        </Link>
                        <button onClick={handleSharePortal} className="px-5 py-2.5 bg-[#2E2E2E] text-white font-normal text-sm rounded-xl hover:bg-black transition-colors shadow-sm flex items-center gap-2 justify-center cursor-pointer">
                            {copied ? <><Check size={16} /> Lien copié !</> : <><Send size={16} /> Envoyer au Client</>}
                        </button>
                        <Link href={`/crm/trips/${trip.id}/budget`} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-normal text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 justify-center">
                            <BarChart3 size={18} /> Budget &amp; Marges
                        </Link>
                        <Link href="/crm/bookings" className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-normal text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 justify-center">
                            <FileText size={18} /> Voir Réservations
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Overview */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="font-normal text-luna-charcoal mb-5 flex items-center gap-2 tracking-wide text-sm uppercase">
                            <DollarSign size={16} className="text-emerald-500" />
                            Marge & Coûts
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-normal">Prix Vente Client</span>
                                <span className="font-normal text-luna-charcoal">{totalPrice} €</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-normal">Coûts Fournisseurs</span>
                                <span className="font-normal text-rose-500">-{totalCost} €</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-normal text-gray-800 uppercase tracking-widest">Marge Nette</span>
                                <div className="text-right">
                                    <span className="text-lg font-normal text-emerald-600">{margin} €</span>
                                    <span className="block text-[12px] font-normal text-emerald-600/60 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">{marginPercent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="font-normal text-luna-charcoal mb-5 flex items-center gap-2 tracking-wide text-sm uppercase">
                            <Users size={16} className="text-blue-500" />
                            Client
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-xl  ">
                            <p className="font-normal text-luna-charcoal mb-1">{trip.clientName}</p>
                            <Link href={`/crm/contacts`} className="text-xs text-sky-500 hover:underline font-normal">Voir le profil complet</Link>
                        </div>
                    </div>
                </div>

                {/* Linked Bookings summary */}
                <div className="lg:col-span-2">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-normal text-luna-charcoal flex items-center gap-2 tracking-wide text-sm uppercase">
                                <Hotel size={16} className="text-amber-500" />
                                Réservations Liées ({bookings.length})
                            </h3>
                            <button className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg font-normal text-gray-600 transition-colors flex items-center gap-1.5">
                                <Plus size={14} /> Ajouter
                            </button>
                        </div>

                        {bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4  ">
                                    <Plane className="text-gray-300" size={24} />
                                </div>
                                <p className="font-normal text-luna-charcoal mb-1"><T>Aucune réservation attachée</T></p>
                                <p className="text-xs text-gray-400 max-w-sm">Ajoutez des réservations de vols ou d'hôtels depuis le module Bookings pour calculer automatiquement vos marges.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-500">
                                                {b.type === 'FLIGHT' ? <Plane size={18} /> : b.type === 'HOTEL' ? <Hotel size={18} /> : <Map size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-normal text-sm text-luna-charcoal mb-0.5">{b.destination}</p>
                                                <p className="text-xs text-gray-500">{b.supplier} • Ref: {b.confirmationNumber}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-normal text-sm text-luna-charcoal">{b.clientPrice} €</p>
                                            <p className="text-[12px] font-normal text-emerald-500 border border-emerald-100 bg-emerald-50 rounded px-1.5 py-0.5 mt-1 animate-pulse">
                                                {b.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
