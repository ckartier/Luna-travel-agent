'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, Calendar, Map, CheckCircle2, Star, Hotel, Plane, FileText, Activity, Clock, ShieldCheck } from 'lucide-react';
import { CRMContact, getContacts, getTripsForContact, getLeadsForContact, CRMTrip, CRMLead } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default function ClientProfilePage({ params }: { params: { id: string } }) {
    const { tenantId } = useAuth();
    const router = useRouter();
    const [client, setClient] = useState<CRMContact | null>(null);
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allContacts = await getContacts(tenantId!);
            const found = allContacts.find(c => c.id === params.id);
            if (found) {
                setClient(found);
                const [tripsData, leadsData] = await Promise.all([
                    getTripsForContact(tenantId!, found.id!),
                    getLeadsForContact(tenantId!, found.id!)
                ]);
                setTrips(tripsData);
                setLeads(leadsData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><p className="text-gray-400 animate-pulse">Chargement profil 360°...</p></div>;

    if (!client) return (
        <div className="p-8 max-w-7xl mx-auto text-center mt-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Client introuvable</h1>
            <button onClick={() => router.back()} className="text-sky-500 hover:underline">Retour</button>
        </div>
    );

    const LTV = client.lifetimeValue || trips.reduce((acc, t) => acc + t.amount, 0);

    const getTierColor = (tier?: string) => {
        switch (tier) {
            case 'Platinum': return 'bg-gray-800 text-white border-gray-900';
            case 'Gold': return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'Silver': return 'bg-gray-100 text-gray-600 border-gray-300';
            case 'Bronze': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-white text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-black mb-6 transition-colors">
                <ArrowLeft size={16} /> Retour
            </button>

            {/* Top Profile Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-6 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-purple-50/20 rounded-bl-full -z-10" />

                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-luna-charcoal to-gray-600 flex items-center justify-center text-white text-3xl font-light shrink-0 shadow-lg border-4 border-white">
                    {client.firstName[0]}{client.lastName[0]}
                </div>

                <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-serif font-light text-luna-charcoal tracking-tight">{client.firstName} {client.lastName}</h1>
                                {client.vipLevel === 'VIP' || client.vipLevel === 'Elite' ? (
                                    <span className="bg-luna-accent text-luna-charcoal px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                                        {client.vipLevel}
                                    </span>
                                ) : null}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border shadow-sm ${getTierColor(client.loyaltyTier)}`}>
                                    {client.loyaltyTier || 'Standard'}
                                </span>
                            </div>
                            <p className="text-gray-400 font-light text-sm">{client.company ? `${client.company} • ` : ''}Client depuis {client.createdAt instanceof Date ? format(client.createdAt, 'yyyy') : format(client.createdAt?.toDate(), 'yyyy')}</p>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <button className="px-4 py-2 bg-white/80 text-gray-500 font-medium rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                <FileText size={16} /> Éditer
                            </button>
                            <button className="px-4 py-2 bg-gradient-to-r from-luna-charcoal to-gray-800 text-white font-medium rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all">
                                Nouveau Devis
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail size={16} className="text-gray-400" />
                                <a href={`mailto:${client.email}`} className="hover:text-blue-500 transition-colors">{client.email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Phone size={16} className="text-gray-400" />
                                <a href={`tel:${client.phone}`} className="hover:text-blue-500 transition-colors">{client.phone || 'Non renseigné'}</a>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Calendar size={16} className="text-gray-400" />
                                <span>{client.dateOfBirth ? format(new Date(client.dateOfBirth), 'dd MMM yyyy') : 'Anniversaire inconnu'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <ShieldCheck size={16} className={client.passportNumber ? "text-emerald-500" : "text-gray-400"} />
                                <span>{client.passportNumber ? `Passeport: •••••${client.passportNumber.slice(-4)}` : 'Passeport manquant'}</span>
                            </div>
                        </div>

                        <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                            <p className="text-xs font-medium tracking-wide text-green-600 mb-1">Lifetime Value (LTV)</p>
                            <p className="text-2xl font-serif font-light text-emerald-600">{LTV.toLocaleString('fr-FR')} €</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Preferences */}
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="font-medium text-luna-charcoal mb-4 flex items-center gap-2 tracking-wide text-sm">
                            <Star size={16} className="text-amber-500" />
                            Préférences Strictes
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">Dietary / Allergies</p>
                                <p className="text-sm font-medium text-gray-800">{client.dietary || 'Aucune restriction'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">Vols</p>
                                <p className="text-sm font-medium text-gray-800">{client.seatPreference || 'Hublot / Couloir indifférent'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-400 mb-1">Hôtellerie</p>
                                <p className="text-sm font-medium text-gray-800">{client.roomPreference || 'Pas de préférence lit'}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50">
                            <p className="text-xs font-medium tracking-wide text-gray-400 mb-3">Tags & Catégories</p>
                            <div className="flex flex-wrap gap-2">
                                {client.preferences && client.preferences.length > 0 ? (
                                    client.preferences.map((p, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                                            {p}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Aucun tag</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Pipeline */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

                    {/* Pipeline / Active Leads */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-luna-charcoal flex items-center gap-2 tracking-wide text-sm uppercase">
                                <Activity size={16} className="text-sky-500" />
                                Opportunités en cours ({leads.filter(l => l.status !== 'WON' && l.status !== 'LOST').length})
                            </h3>
                            <Link href="/crm/pipeline" className="text-xs text-sky-500 hover:underline font-medium">Voir le Pipeline</Link>
                        </div>

                        <div className="space-y-3">
                            {leads.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-4">Aucune opportunité active.</p>
                            ) : leads.map(lead => (
                                <Link href="/crm/pipeline" key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-sky-50 transition-colors border border-gray-100 rounded-xl group">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                            <Map size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-luna-charcoal">{lead.destination}</p>
                                            <p className="text-xs text-gray-500">{lead.flexibility} • Budget: {lead.budget}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-100/50 px-2 py-1 border border-sky-200 rounded-md">
                                            {lead.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Trips History */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-luna-charcoal flex items-center gap-2 tracking-wide text-sm uppercase">
                                <Calendar size={16} className="text-emerald-500" />
                                Historique des Voyages ({trips.length})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {trips.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-4">Le client n'a pas encore validé de voyage.</p>
                            ) : trips.map(trip => (
                                <Link href={`/crm/trips/${trip.id}`} key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-xl">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-1.5 h-10 rounded-full bg-emerald-400 shrink-0" />
                                        <div>
                                            <p className="font-bold text-sm text-luna-charcoal">{trip.title}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(trip.startDate), 'MMMM yyyy', { locale: fr })} • {trip.amount}€</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {trip.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
