'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, Calendar, Map, CheckCircle2, Star, Hotel, Plane, FileText, Activity, Clock, ShieldCheck, Save, X, Edit3, Send, MessageCircle, Trash2 } from 'lucide-react';
import { CRMContact, getContacts, getTripsForContact, getLeadsForContact, updateContact, deleteContact, CRMTrip, CRMLead } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { T } from '@/src/components/T';

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = use(params);
    const { tenantId } = useAuth();
    const router = useRouter();
    const [client, setClient] = useState<CRMContact | null>(null);
    const [trips, setTrips] = useState<CRMTrip[]>([]);
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<CRMContact>>({});

    useEffect(() => {
        loadData();
    }, [clientId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allContacts = await getContacts(tenantId!);
            const found = allContacts.find(c => c.id === clientId);
            if (found) {
                setClient(found);
                setEditData(found);
                const fullName = `${found.firstName} ${found.lastName || ''}`.trim();
                const [tripsData, leadsData] = await Promise.all([
                    getTripsForContact(tenantId!, found.id!),
                    getLeadsForContact(tenantId!, found.id!, fullName)
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

    const handleSave = async () => {
        if (!client?.id || !tenantId) return;
        setSaving(true);
        try {
            await updateContact(tenantId, client.id, {
                firstName: editData.firstName || client.firstName,
                lastName: editData.lastName || client.lastName,
                email: editData.email || client.email,
                phone: editData.phone || '',
                company: editData.company || '',
                vipLevel: editData.vipLevel || client.vipLevel,
                dateOfBirth: editData.dateOfBirth || '',
                passportNumber: editData.passportNumber || '',
                passportExpiry: editData.passportExpiry || '',
                nationality: editData.nationality || '',
                dietary: editData.dietary || '',
                seatPreference: editData.seatPreference || '',
                roomPreference: editData.roomPreference || '',
                loyaltyTier: editData.loyaltyTier || 'Bronze',
                preferences: editData.preferences || client.preferences || [],
            });
            setClient({ ...client, ...editData } as CRMContact);
            setEditing(false);
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!client?.id || !tenantId) return;
        if (!confirm(`Supprimer définitivement ${client.firstName} ${client.lastName} et toutes les données associées ?`)) return;
        try {
            await deleteContact(tenantId, client.id);
            router.push('/crm/contacts');
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><p className="text-gray-400 animate-pulse">Chargement profil 360°...</p></div>;

    if (!client) return (
        <div className="text-center mt-20">
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Client introuvable</h1>
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

    const fieldClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-200 font-normal";
    const labelClass = "text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1 block";

    return (
        <div className="w-full">
            <button onClick={() => router.back()} className="text-sm text-[#6B7280] mt-1 font-medium">
                <ArrowLeft size={16} /> <T>Retour</T>
            </button>

            {/* Top Profile Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-purple-50/20 rounded-bl-full -z-10" />

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-3xl font-normal shrink-0 border-4 border-white">
                        {(editData.firstName || client.firstName)[0]}{(editData.lastName || client.lastName)[0]}
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                {editing ? (
                                    <div className="flex gap-3 items-center mb-2">
                                        <input value={editData.firstName || ''} onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                                            className={fieldClass + ' max-w-[160px]'} placeholder="Prénom" />
                                        <input value={editData.lastName || ''} onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                                            className={fieldClass + ' max-w-[200px]'} placeholder="Nom" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">{client.firstName} {client.lastName}</h1>
                                        {(client.vipLevel === 'VIP' || client.vipLevel === 'Elite') && (
                                            <span className="bg-luna-accent text-luna-charcoal px-2.5 py-1 rounded-md text-[12px] font-normal uppercase tracking-widest shadow-sm">{client.vipLevel}</span>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-normal uppercase tracking-wide border shadow-sm ${getTierColor(client.loyaltyTier)}`}>
                                            {client.loyaltyTier || 'Standard'}
                                        </span>
                                    </div>
                                )}
                                <p className="text-gray-400 font-normal text-sm">{client.company ? `${client.company} • ` : ''}Client depuis {client.createdAt instanceof Date ? format(client.createdAt, 'yyyy') : format(client.createdAt?.toDate(), 'yyyy')}</p>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                {editing ? (
                                    <>
                                        <button onClick={handleSave} disabled={saving}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                                            <Save size={16} /> {saving ? 'Enregistrement...' : 'Sauvegarder'}
                                        </button>
                                        <button onClick={() => { setEditing(false); setEditData(client); }}
                                            className="px-4 py-2 bg-white/80 text-gray-500 font-normal rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                                            <X size={16} /> Annuler
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {client.email && (
                                            <Link href={`/crm/mails?compose=${encodeURIComponent(client.email)}&name=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                                                className="px-4 py-2 bg-sky-50 text-sky-600 font-normal rounded-xl border border-sky-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <Mail size={16} /> Email
                                            </Link>
                                        )}
                                        {client.phone && (
                                            <a href={`https://wa.me/${client.phone.replace(/[\s\-\(\)]/g, '')}`} target="_blank" rel="noopener noreferrer"
                                                className="px-4 py-2 bg-green-50 text-green-600 font-normal rounded-xl border border-green-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                                <MessageCircle size={16} /> WhatsApp
                                            </a>
                                        )}
                                        <button onClick={() => setEditing(true)}
                                            className="px-4 py-2 bg-white/80 text-gray-500 font-normal rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                            <Edit3 size={16} /> Éditer
                                        </button>
                                        <button onClick={handleDelete}
                                            className="px-4 py-2 bg-white/80 text-red-400 hover:text-red-600 hover:bg-red-50 font-normal rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                            title="Supprimer ce client">
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="px-4 py-2 bg-luna-charcoal hover:bg-gray-800 text-white font-normal rounded-xl transition-all">
                                            Nouveau Devis
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Contact Info + Edit Fields */}
                        {editing ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                                <div className="space-y-3">
                                    <div><label className={labelClass}>Email</label>
                                        <input value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })}
                                            className={fieldClass} placeholder="email@exemple.com" /></div>
                                    <div><label className={labelClass}>Téléphone</label>
                                        <input value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                            className={fieldClass} placeholder="+33 6 12 34 56 78" /></div>
                                    <div><label className={labelClass}>Entreprise</label>
                                        <input value={editData.company || ''} onChange={e => setEditData({ ...editData, company: e.target.value })}
                                            className={fieldClass} placeholder="Société du client" /></div>
                                </div>
                                <div className="space-y-3">
                                    <div><label className={labelClass}>Date de naissance</label>
                                        <input type="date" value={editData.dateOfBirth || ''} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })}
                                            className={fieldClass} /></div>
                                    <div><label className={labelClass}>Nationalité</label>
                                        <input value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })}
                                            className={fieldClass} placeholder="Française" /></div>
                                    <div><label className={labelClass}>N° Passeport</label>
                                        <input value={editData.passportNumber || ''} onChange={e => setEditData({ ...editData, passportNumber: e.target.value })}
                                            className={fieldClass} placeholder="12AB34567" /></div>
                                    <div><label className={labelClass}>Expiration Passeport</label>
                                        <input type="date" value={editData.passportExpiry || ''} onChange={e => setEditData({ ...editData, passportExpiry: e.target.value })}
                                            className={fieldClass} /></div>
                                </div>
                                <div className="space-y-3">
                                    <div><label className={labelClass}>Niveau VIP</label>
                                        <select value={editData.vipLevel || 'Standard'} onChange={e => setEditData({ ...editData, vipLevel: e.target.value as CRMContact['vipLevel'] })}
                                            className={fieldClass}>
                                            <option value="Standard">Standard</option>
                                            <option value="Premium">Premium</option>
                                            <option value="VIP">VIP</option>
                                            <option value="Elite">Elite</option>
                                        </select></div>
                                    <div><label className={labelClass}>Fidélité</label>
                                        <select value={editData.loyaltyTier || 'Bronze'} onChange={e => setEditData({ ...editData, loyaltyTier: e.target.value as any })}
                                            className={fieldClass}>
                                            <option value="Bronze">Bronze</option>
                                            <option value="Silver">Silver</option>
                                            <option value="Gold">Gold</option>
                                            <option value="Platinum">Platinum</option>
                                        </select></div>
                                    <div><label className={labelClass}>Dietary / Allergies</label>
                                        <input value={editData.dietary || ''} onChange={e => setEditData({ ...editData, dietary: e.target.value })}
                                            className={fieldClass} placeholder="Végétarien, sans gluten..." /></div>
                                    <div><label className={labelClass}>Préf. siège (vol)</label>
                                        <select value={editData.seatPreference || ''} onChange={e => setEditData({ ...editData, seatPreference: e.target.value })}
                                            className={fieldClass}>
                                            <option value="">Indifférent</option>
                                            <option value="Hublot">Hublot</option>
                                            <option value="Couloir">Couloir</option>
                                            <option value="Milieu">Milieu</option>
                                        </select></div>
                                    <div><label className={labelClass}>Préf. chambre</label>
                                        <select value={editData.roomPreference || ''} onChange={e => setEditData({ ...editData, roomPreference: e.target.value })}
                                            className={fieldClass}>
                                            <option value="">Indifférent</option>
                                            <option value="Lit double">Lit double</option>
                                            <option value="Lits jumeaux">Lits jumeaux</option>
                                            <option value="Suite">Suite</option>
                                            <option value="Vue mer">Vue mer</option>
                                        </select></div>
                                    <div><label className={labelClass}>Tags / Préférences (virgules)</label>
                                        <input value={(editData.preferences || []).join(', ')}
                                            onChange={e => setEditData({ ...editData, preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            className={fieldClass} placeholder="Luxe, Plage, Culture..." /></div>
                                </div>
                            </div>
                        ) : (
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
                                    <p className="text-xs font-normal tracking-wide text-green-600 mb-1">Lifetime Value (LTV)</p>
                                    <p className="text-2xl font-normal text-emerald-600">{LTV.toLocaleString('fr-FR')} €</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Preferences */}
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <h3 className="font-medium text-luna-charcoal mb-5 flex items-center gap-2 text-base">
                            <Star size={18} className="text-amber-500" />
                            <T>Préférences Strictes</T>
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Régime / Allergies</p>
                                <p className="text-sm text-gray-800">{client.dietary || 'Aucune restriction'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Vols</p>
                                <p className="text-sm text-gray-800">{client.seatPreference || 'Hublot / Couloir indifférent'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Hôtellerie</p>
                                <p className="text-sm text-gray-800">{client.roomPreference || 'Pas de préférence lit'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1.5">Nationalité</p>
                                <p className="text-sm text-gray-800">{client.nationality || 'Non renseignée'}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">Tags & Catégories</p>
                            <div className="flex flex-wrap gap-2">
                                {client.preferences && client.preferences.length > 0 ? (
                                    client.preferences.map((p, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-700 text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-lg">
                                            {p}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-[#6B7280] mt-1 font-medium"><T>Aucun tag</T></span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: History & Pipeline */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

                    {/* ═══ RÉSULTATS IA — prominent section ═══ */}
                    {leads.filter(l => l.agentResults).length > 0 && (
                        <div className="bg-gradient-to-br from-sky-50/50 to-indigo-50/30 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-sky-100/60">
                            <h3 className="font-medium text-sky-800 mb-5 flex items-center gap-2 text-base">
                                <Star size={18} className="text-sky-500" />
                                Résultats des Agents IA ({leads.filter(l => l.agentResults).length} recherche(s))
                            </h3>
                            <div className="space-y-5">
                                {leads.filter(l => l.agentResults).map(lead => (
                                    <div key={lead.id} className="bg-white/90 rounded-xl p-5 md:p-6 border border-sky-100/50 select-text">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-medium text-luna-charcoal text-lg">{lead.destination}</p>
                                                <p className="text-sm text-gray-500 mt-0.5">{lead.dates} • Budget: {lead.budget} • {lead.pax}</p>
                                            </div>
                                            <Link href={`/crm/leads/${lead.id}/proposal`}
                                                className="text-xs font-medium uppercase tracking-wider text-white bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg border border-sky-400 transition-colors flex items-center gap-1.5 shrink-0">
                                                <Send size={12} />
                                                {lead.status === 'PROPOSAL_READY' ? 'Envoyer Devis' : lead.status === 'WON' ? 'Gagné' : 'Voir Devis'}
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Transport */}
                                            {lead.agentResults?.transport && (
                                                <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100/60">
                                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                        <Plane size={14} /> Transport
                                                    </p>
                                                    {lead.agentResults.transport.flights?.slice(0, 4).map((f: any, i: number) => (
                                                        <div key={i} className="text-sm text-gray-700 mb-2 flex justify-between items-start gap-2">
                                                            <span className="select-text">
                                                                {f.airline || 'Vol'} {f.route || f.departure || ''}
                                                                {f.stops !== undefined && <span className="text-gray-400 text-xs ml-1">({f.stops === 0 ? 'Direct' : `${f.stops} esc.`})</span>}
                                                            </span>
                                                            <span className="text-blue-600 font-semibold shrink-0 text-sm">{f.price || ''}</span>
                                                        </div>
                                                    ))}
                                                    {lead.agentResults.transport.flights?.length > 4 && (
                                                        <p className="text-xs text-blue-400 mt-2">+{lead.agentResults.transport.flights.length - 4} autres vols</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Hébergement */}
                                            {lead.agentResults?.accommodation && (
                                                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100/60">
                                                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                        <Hotel size={14} /> Hébergement
                                                    </p>
                                                    {lead.agentResults.accommodation.hotels?.slice(0, 4).map((h: any, i: number) => (
                                                        <div key={i} className="text-sm text-gray-700 mb-2 flex justify-between items-start gap-2">
                                                            <span className="select-text">{h.name} {h.stars && `${'★'.repeat(Math.min(h.stars, 5))}`}</span>
                                                            <span className="text-amber-600 font-semibold shrink-0 text-sm">{h.pricePerNight || h.price || ''}</span>
                                                        </div>
                                                    ))}
                                                    {lead.agentResults.accommodation.hotels?.length > 4 && (
                                                        <p className="text-xs text-amber-400 mt-2">+{lead.agentResults.accommodation.hotels.length - 4} autres hôtels</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Itinéraire */}
                                            {lead.agentResults?.itinerary && (
                                                <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100/60">
                                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                        <Map size={14} /> Itinéraire
                                                    </p>
                                                    {lead.agentResults.itinerary.days?.slice(0, 5).map((d: any, i: number) => (
                                                        <div key={i} className="text-sm text-gray-700 mb-1.5 select-text">
                                                            <span className="font-semibold text-emerald-700">J{i + 1}</span> — {d.title || d.morning?.substring(0, 50) || `Jour ${i + 1}`}
                                                        </div>
                                                    ))}
                                                    {lead.agentResults.itinerary.days?.length > 5 && (
                                                        <p className="text-xs text-emerald-400 mt-2">+{lead.agentResults.itinerary.days.length - 5} jours</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Client insights */}
                                        {lead.agentResults?.client && (
                                            <div className="mt-4 pt-4 border-t border-sky-100/50 select-text">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profil Client IA</p>
                                                <p className="text-sm text-gray-600 leading-relaxed">{lead.agentResults.client.summary || lead.agentResults.client.profileType || 'Profil standard'}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pipeline / Active Leads */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-normal text-luna-charcoal flex items-center gap-2 tracking-wide text-sm uppercase">
                                <Activity size={16} className="text-sky-500" />
                                Opportunités en cours ({leads.filter(l => l.status !== 'WON' && l.status !== 'LOST').length})
                            </h3>
                            <Link href="/crm/pipeline" className="text-xs text-sky-500 hover:underline font-normal">Voir le Pipeline</Link>
                        </div>

                        <div className="space-y-3">
                            {leads.length === 0 ? (
                                <p className="text-sm text-[#6B7280] mt-1 font-medium"><T>Aucune opportunité active.</T></p>
                            ) : leads.map(lead => (
                                <Link href="/crm/pipeline" key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-sky-50 transition-colors border border-gray-100 rounded-xl group">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                                            <Map size={18} />
                                        </div>
                                        <div>
                                            <p className="font-normal text-sm text-luna-charcoal">{lead.destination}</p>
                                            <p className="text-xs text-gray-500">{lead.dates || 'Dates à définir'} • Budget: {lead.budget}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[12px] font-normal uppercase tracking-widest text-sky-700 bg-sky-100/50 px-2 py-1 border border-sky-200 rounded-md">
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
                            <h3 className="font-normal text-luna-charcoal flex items-center gap-2 tracking-wide text-sm uppercase">
                                <Calendar size={16} className="text-emerald-500" />
                                Historique des Voyages ({trips.length})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {trips.length === 0 ? (
                                <p className="text-sm text-[#6B7280] mt-1 font-medium">Le client n'a pas encore validé de voyage.</p>
                            ) : trips.map(trip => (
                                <Link href={`/crm/trips/${trip.id}/itinerary`} key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 rounded-xl">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-1.5 h-10 rounded-full bg-emerald-400 shrink-0" />
                                        <div>
                                            <p className="font-normal text-sm text-luna-charcoal">{trip.title}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(trip.startDate), 'MMMM yyyy', { locale: fr })} • {trip.amount}€</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[12px] font-normal text-gray-500 uppercase tracking-widest">
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
