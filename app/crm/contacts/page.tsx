'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Star, Phone, Mail, RefreshCcw, X, Plus, ChevronRight, Plane, Calendar, Target, Clock, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
import { getContacts, createContact, getLeadsForContact, getTripsForContact, getActivitiesForContact, CRMContact, CRMLead, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';

const VIP_COLORS: Record<string, string> = {
    Standard: 'bg-gray-100 text-gray-600',
    Premium: 'bg-blue-50 text-blue-600',
    VIP: 'bg-amber-50 text-amber-700',
    Elite: 'bg-purple-50 text-purple-700',
};

export default function CRMContacts() {
    const { tenantId } = useAuth();
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
    const [contactLeads, setContactLeads] = useState<CRMLead[]>([]);
    const [contactTrips, setContactTrips] = useState<CRMTrip[]>([]);
    const [contactActivities, setContactActivities] = useState<CRMActivity[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newContact, setNewContact] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        vipLevel: 'Standard' as CRMContact['vipLevel'], preferences: ''
    });

    const loadContacts = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try { setContacts(await getContacts(tenantId)); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createContact(tenantId!, {
                firstName: newContact.firstName, lastName: newContact.lastName,
                email: newContact.email, phone: newContact.phone,
                vipLevel: newContact.vipLevel,
                preferences: newContact.preferences.split(',').map(p => p.trim()).filter(Boolean),
            });
            setIsModalOpen(false);
            setNewContact({ firstName: '', lastName: '', email: '', phone: '', vipLevel: 'Standard', preferences: '' });
            loadContacts();
        } catch (e) { console.error(e); }
    };

    const openContactDetail = async (contact: CRMContact) => {
        setSelectedContact(contact);
        setLoadingDetails(true);
        try {
            const [leads, trips, activities] = await Promise.all([
                getLeadsForContact(tenantId!, contact.id!),
                getTripsForContact(tenantId!, contact.id!),
                getActivitiesForContact(tenantId!, contact.id!),
            ]);
            setContactLeads(leads);
            setContactTrips(trips);
            setContactActivities(activities);
        } catch (e) { console.error(e); }
        finally { setLoadingDetails(false); }
    };

    const filtered = contacts.filter(c => {
        const q = search.toLowerCase();
        return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });

    const exportContactsCSV = () => {
        const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Niveau VIP', 'Préférences'];
        const rows = contacts.map(c => [
            c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel, (c.preferences || []).join('; ')
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_luna_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAllDataCSV = async () => {
        const allRows: string[][] = [];
        const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'VIP', 'Préférences', 'Leads', 'Voyages', 'Activités'];
        for (const c of contacts) {
            try {
                const [leads, trips, activities] = await Promise.all([
                    getLeadsForContact(tenantId!, c.id!),
                    getTripsForContact(tenantId!, c.id!),
                    getActivitiesForContact(tenantId!, c.id!),
                ]);
                allRows.push([
                    c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel,
                    (c.preferences || []).join('; '),
                    leads.map(l => `${l.destination} (${l.status})`).join(' | '),
                    trips.map(t => `${t.title} ${t.startDate}-${t.endDate} ${t.amount}€`).join(' | '),
                    activities.map(a => `${a.title} (${a.status})`).join(' | '),
                ]);
            } catch { allRows.push([c.firstName, c.lastName, c.email, c.phone || '', c.vipLevel, '', '', '', '']); }
        }
        const csv = [headers, ...allRows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_complet_luna_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full gap-0">
            {/* Main list */}
            <div className={`flex-1 flex flex-col ${selectedContact ? 'hidden md:flex' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 md:mb-6 gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-luna-charcoal tracking-tight">Contacts</h1>
                        <p className="text-luna-text-muted font-normal text-sm mt-1 hidden sm:block">{contacts.length} contact{contacts.length > 1 ? 's' : ''} enregistré{contacts.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luna-text-muted" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                                className="pl-8 pr-4 py-2 bg-white/80 border border-luna-warm-gray/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 w-40 md:w-56" />
                        </div>
                        <button onClick={exportContactsCSV} title="Exporter contacts CSV" className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-sm">
                            <Download size={14} /> <span className="hidden md:inline">CSV</span>
                        </button>
                        <button onClick={exportAllDataCSV} title="Exporter toutes les données" className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-sm">
                            <FileSpreadsheet size={14} /> <span className="hidden md:inline">Tout</span>
                        </button>
                        <button onClick={loadContacts} className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-medium px-3 py-2 rounded-xl shadow-sm transition-all">
                            <RefreshCcw size={16} className={loading ? "animate-spin text-luna-accent" : "text-luna-text-muted"} />
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm">
                            <Plus size={16} /> <span className="hidden sm:inline">Ajouter</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filtered.map(contact => (
                        <motion.div key={contact.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => openContactDetail(contact)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border bg-white/80 backdrop-blur-xl shadow-sm cursor-pointer transition-all hover:shadow-md
                                ${selectedContact?.id === contact.id ? 'ring-2 ring-sky-400/40 border-sky-200' : 'border-luna-warm-gray/10 hover:border-luna-accent/30'}`}>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold shrink-0">
                                {contact.firstName[0]}{contact.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-luna-charcoal truncate">{contact.firstName} {contact.lastName}</h4>
                                <p className="text-xs text-luna-text-muted truncate">{contact.email}</p>
                            </div>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${VIP_COLORS[contact.vipLevel]}`}>{contact.vipLevel}</span>
                            <ChevronRight size={16} className="text-luna-text-muted shrink-0" />
                        </motion.div>
                    ))}
                    {filtered.length === 0 && !loading && (
                        <div className="text-center py-12 text-luna-text-muted">Aucun contact trouvé</div>
                    )}
                </div>
            </div>

            {/* 360° Detail Panel */}
            <AnimatePresence>
                {selectedContact && (
                    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
                        className="w-full md:w-[400px] md:ml-4 bg-white/90 backdrop-blur-2xl rounded-2xl border border-luna-warm-gray/10 shadow-lg flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-luna-warm-gray/10 bg-gradient-to-b from-sky-50/30 to-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-semibold">
                                        {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-lg font-semibold text-luna-charcoal">{selectedContact.firstName} {selectedContact.lastName}</h3>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${VIP_COLORS[selectedContact.vipLevel]}`}>{selectedContact.vipLevel}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedContact(null)} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex gap-4 text-xs text-luna-text-muted">
                                <span className="flex items-center gap-1"><Mail size={12} />{selectedContact.email}</span>
                                {selectedContact.phone && <span className="flex items-center gap-1"><Phone size={12} />{selectedContact.phone}</span>}
                            </div>
                            {selectedContact.preferences.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {selectedContact.preferences.map((p, i) => (
                                        <span key={i} className="text-[11px] bg-luna-cream px-2 py-0.5 rounded-full text-luna-text-muted font-medium">{p}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Linked data */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {loadingDetails ? (
                                <div className="flex justify-center py-8">
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-luna-warm-gray/20 border-t-luna-charcoal rounded-full" />
                                </div>
                            ) : (
                                <>
                                    {/* Leads */}
                                    <div>
                                        <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-luna-text-muted mb-2 flex items-center gap-1.5">
                                            <Target size={12} /> Pipeline ({contactLeads.length})
                                        </h4>
                                        {contactLeads.length === 0 ? (
                                            <p className="text-xs text-luna-text-muted/60 italic">Aucun lead</p>
                                        ) : contactLeads.map(lead => (
                                            <Link href="/crm/pipeline" key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Target size={14} className="text-luna-accent shrink-0 group-hover:text-sky-500 transition-colors" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-luna-charcoal truncate">{lead.destination}</p>
                                                        <p className="text-[11px] text-luna-text-muted">{lead.budget} • {lead.status}</p>
                                                    </div>
                                                </div>
                                                <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Trips */}
                                    <div>
                                        <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-luna-text-muted mb-2 flex items-center gap-1.5">
                                            <Plane size={12} /> Voyages ({contactTrips.length})
                                        </h4>
                                        {contactTrips.length === 0 ? (
                                            <p className="text-xs text-luna-text-muted/60 italic">Aucun voyage</p>
                                        ) : contactTrips.map(trip => (
                                            <Link href="/crm/planning" key={trip.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: trip.color }} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-luna-charcoal truncate">{trip.title}</p>
                                                        <p className="text-[11px] text-luna-text-muted">{trip.startDate} → {trip.endDate} • {trip.amount}€</p>
                                                    </div>
                                                </div>
                                                <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Activities */}
                                    <div>
                                        <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-luna-text-muted mb-2 flex items-center gap-1.5">
                                            <Calendar size={12} /> Activités ({contactActivities.length})
                                        </h4>
                                        {contactActivities.length === 0 ? (
                                            <p className="text-xs text-luna-text-muted/60 italic">Aucune activité</p>
                                        ) : contactActivities.map(act => (
                                            <Link href="/crm/activities" key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Clock size={14} className={act.status === 'DONE' ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium truncate ${act.status === 'DONE' ? 'text-gray-400 line-through' : 'text-luna-charcoal'}`}>{act.title}</p>
                                                        <p className="text-[11px] text-luna-text-muted">{act.time} • {act.status}</p>
                                                    </div>
                                                </div>
                                                <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Contact Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-luna-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-luxury overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-luna-warm-gray/20 bg-luna-cream">
                            <h2 className="font-serif text-xl font-semibold text-luna-charcoal">Nouveau Contact</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-2"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prénom</label>
                                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900"
                                        value={newContact.firstName} onChange={e => setNewContact({ ...newContact, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</label>
                                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900"
                                        value={newContact.lastName} onChange={e => setNewContact({ ...newContact, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                                <input type="email" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900"
                                    value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900"
                                        value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Niveau VIP</label>
                                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900 bg-white"
                                        value={newContact.vipLevel} onChange={e => setNewContact({ ...newContact, vipLevel: e.target.value as CRMContact['vipLevel'] })}>
                                        <option value="Standard">Standard</option>
                                        <option value="Premium">Premium</option>
                                        <option value="VIP">VIP</option>
                                        <option value="Elite">Elite</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Préférences (séparées par des virgules)</label>
                                <input type="text" placeholder="Ex: Plage, Luxe, Asie..." className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-medium text-gray-900"
                                    value={newContact.preferences} onChange={e => setNewContact({ ...newContact, preferences: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-luna-charcoal font-medium hover:bg-luna-cream transition-colors">Annuler</button>
                                <button type="submit" className="bg-luna-charcoal hover:bg-[#1a1a1a] text-luna-cream font-medium px-6 py-2.5 rounded-xl shadow-lg transition-all">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
