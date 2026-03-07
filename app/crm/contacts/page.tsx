'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Star, Phone, Mail, RefreshCcw, X, Plus, ChevronRight, Plane, Calendar, Target, Clock, ExternalLink, Download, FileSpreadsheet, ArrowUpDown, Sparkles } from 'lucide-react';
import { getContacts, createContact, getLeadsForContact, getTripsForContact, getActivitiesForContact, CRMContact, CRMLead, CRMTrip, CRMActivity } from '@/src/lib/firebase/crm';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';
import { T } from '@/src/components/T';

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
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'vip'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [contactLeads, setContactLeads] = useState<CRMLead[]>([]);
  const [contactTrips, setContactTrips] = useState<CRMTrip[]>([]);
  const [contactActivities, setContactActivities] = useState<CRMActivity[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    communicationPreference: 'EMAIL' as CRMContact['communicationPreference'],
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
        communicationPreference: newContact.communicationPreference,
        vipLevel: newContact.vipLevel,
        preferences: newContact.preferences.split(',').map(p => p.trim()).filter(Boolean),
      });
      setIsModalOpen(false);
      setNewContact({ firstName: '', lastName: '', email: '', phone: '', communicationPreference: 'EMAIL', vipLevel: 'Standard', preferences: '' });
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
  }).sort((a, b) => {
    if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sortBy === 'vip') {
      const vipOrder: Record<string, number> = { Elite: 0, VIP: 1, Premium: 2, Standard: 3 };
      return (vipOrder[a.vipLevel] ?? 4) - (vipOrder[b.vipLevel] ?? 4);
    }
    if (sortBy === 'date') {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toMillis?.() || 0;
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toMillis?.() || 0;
      return bDate - aDate;
    }
    return 0;
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
            <h1 className="text-2xl font-normal text-luna-charcoal tracking-tight"><T>Contacts</T></h1>
            <p className="text-luna-text-muted font-normal text-sm mt-1 hidden sm:block">{contacts.length} client{contacts.length > 1 ? 's' : ''} enregistré{contacts.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luna-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-8 pr-4 py-2 bg-white/80 border border-luna-warm-gray/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 w-40 md:w-56" />
            </div>
            <div className="flex items-center gap-1 bg-white/80 border border-luna-warm-gray/15 rounded-xl px-1 py-0.5">
              <button onClick={() => setSortBy('name')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'name' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:text-gray-700'}`}>Nom</button>
              <button onClick={() => setSortBy('date')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'date' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:text-gray-700'}`}>Récent</button>
              <button onClick={() => setSortBy('vip')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'vip' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:text-gray-700'}`}>VIP</button>
            </div>
            <button onClick={exportContactsCSV} title="Exporter contacts CSV" className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-normal px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Download size={14} /> <span className="hidden md:inline">CSV</span>
            </button>
            <button onClick={exportAllDataCSV} title="Exporter toutes les données" className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-normal px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <FileSpreadsheet size={14} /> <span className="hidden md:inline">Tout</span>
            </button>
            <button onClick={loadContacts} className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-normal px-3 py-2 rounded-xl shadow-sm transition-all">
              <RefreshCcw size={16} className={loading ? "animate-spin text-luna-accent" : "text-luna-text-muted"} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2">
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
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-normal shrink-0">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/crm/clients/${contact.id}`} onClick={e => e.stopPropagation()} className="font-normal text-sm text-luna-charcoal truncate block hover:text-sky-600 hover:underline transition-colors">{contact.firstName} {contact.lastName}</Link>
                <p className="text-xs text-luna-text-muted truncate">{contact.email}</p>
              </div>
              <span className={`text-[12px] px-2 py-0.5 rounded-full font-normal ${VIP_COLORS[contact.vipLevel]}`}>{contact.vipLevel}</span>
              <ChevronRight size={16} className="text-luna-text-muted shrink-0" />
            </motion.div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-luna-text-muted"><T>Aucun contact trouvé</T></div>
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
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-normal">
                    {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                  </div>
                  <div>
                    <Link href={`/crm/clients/${selectedContact.id}`} className="font-serif text-lg font-normal text-luna-charcoal hover:text-sky-600 hover:underline transition-colors">{selectedContact.firstName} {selectedContact.lastName}</Link>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full font-normal ${VIP_COLORS[selectedContact.vipLevel]}`}>{selectedContact.vipLevel}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedContact(null)} className="p-1.5 rounded-lg hover:bg-luna-cream transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-4 text-xs text-luna-text-muted">
                <span className="flex items-center gap-1"><Mail size={12} />{selectedContact.email}</span>
                {selectedContact.phone && <span className="flex items-center gap-1"><Phone size={12} />{selectedContact.phone}</span>}
                {selectedContact.communicationPreference && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded-md">
                    {selectedContact.communicationPreference === 'WHATSAPP' ? (
                      <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5" /> WhatsApp</>
                    ) : (
                      <><Mail size={10} className="mr-0.5" /> Email</>
                    )}
                  </span>
                )}
              </div>
              {selectedContact.preferences.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {selectedContact.preferences.map((p, i) => (
                    <span key={i} className="text-[12px] bg-luna-cream px-2 py-0.5 rounded-full text-luna-text-muted font-normal">{p}</span>
                  ))}
                </div>
              )}
              {selectedContact.profileAnalysis && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
                  <h4 className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Sparkles size={10} /> Analyse Prédictive Luna
                  </h4>
                  <p className="text-[11px] text-indigo-900 leading-relaxed font-normal">{selectedContact.profileAnalysis}</p>
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
                  {/* ═══ AI AGENT RESULTS — from leads ═══ */}
                  {contactLeads.filter(l => l.agentResults).length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-[0.15em] font-semibold text-sky-600 mb-2 flex items-center gap-1.5">
                        <Star size={12} /> Résultats IA Agents
                      </h4>
                      {contactLeads.filter(l => l.agentResults).map(lead => (
                        <div key={lead.id} className="mb-3 p-3 rounded-xl bg-sky-50/50 border border-sky-100/50 space-y-3">
                          <p className="text-xs font-semibold text-luna-charcoal">{lead.destination} — {lead.dates}</p>

                          {/* Transport / Flights */}
                          {lead.agentResults?.transport?.flights && lead.agentResults.transport.flights.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">✈️ Vols proposés</p>
                              {lead.agentResults.transport.flights.slice(0, 3).map((f: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-sky-100/30 last:border-0">
                                  <span className="text-luna-charcoal font-medium">{f.airline || 'Vol'} — {f.route || f.departure + ' → ' + f.arrival}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sky-600 font-semibold">{f.price || ''}</span>
                                    {f.url && <a href={f.url} target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-600"><ExternalLink size={10} /></a>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Accommodation / Hotels */}
                          {lead.agentResults?.accommodation?.hotels && lead.agentResults.accommodation.hotels.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">🏨 Hébergements</p>
                              {lead.agentResults.accommodation.hotels.slice(0, 3).map((h: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-sky-100/30 last:border-0">
                                  <span className="text-luna-charcoal font-medium">{h.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-600 font-semibold">{h.pricePerNight || h.price || ''}</span>
                                    {h.stars && <span className="text-amber-400 text-[10px]">{'★'.repeat(h.stars)}</span>}
                                    {h.url && <a href={h.url} target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-600"><ExternalLink size={10} /></a>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Itinerary Summary */}
                          {lead.agentResults?.itinerary?.days && lead.agentResults.itinerary.days.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">🗓 Itinéraire ({lead.agentResults.itinerary.days.length} jours)</p>
                              {lead.agentResults.itinerary.days.slice(0, 4).map((d: any, i: number) => (
                                <div key={i} className="text-xs py-1 border-b border-sky-100/30 last:border-0">
                                  <span className="text-luna-charcoal font-medium">J{d.day || i + 1}: </span>
                                  <span className="text-gray-500">{d.title || d.morning?.slice(0, 60) || '—'}</span>
                                </div>
                              ))}
                              {lead.agentResults.itinerary.days.length > 4 && (
                                <p className="text-[10px] text-gray-400 mt-1">+ {lead.agentResults.itinerary.days.length - 4} jours de plus...</p>
                              )}
                            </div>
                          )}

                          {/* Client Profile Insights */}
                          {lead.agentResults?.client && (
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">👤 Profil Client IA</p>
                              <p className="text-xs text-gray-500">{typeof lead.agentResults.client === 'string' ? lead.agentResults.client : JSON.stringify(lead.agentResults.client).slice(0, 200)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leads */}
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted mb-2 flex items-center gap-1.5">
                      <Target size={12} /> Pipeline ({contactLeads.length})
                    </h4>
                    {contactLeads.length === 0 ? (
                      <p className="text-xs text-luna-text-muted/60 italic">Aucun lead</p>
                    ) : contactLeads.map(lead => (
                      <Link href="/crm/pipeline" key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <Target size={14} className="text-luna-accent shrink-0 group-hover:text-sky-500 transition-colors" />
                          <div className="min-w-0">
                            <p className="text-sm font-normal text-luna-charcoal truncate">{lead.destination}</p>
                            <p className="text-[12px] text-luna-text-muted">{lead.budget} • {lead.status}</p>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>

                  {/* Trips */}
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted mb-2 flex items-center gap-1.5">
                      <Plane size={12} /> Voyages ({contactTrips.length})
                    </h4>
                    {contactTrips.length === 0 ? (
                      <p className="text-xs text-luna-text-muted/60 italic">Aucun voyage</p>
                    ) : contactTrips.map(trip => (
                      <Link href={`/crm/trips/${trip.id}/itinerary`} key={trip.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: trip.color }} />
                          <div className="min-w-0">
                            <p className="text-sm font-normal text-luna-charcoal truncate">{trip.title}</p>
                            <p className="text-[12px] text-luna-text-muted">{trip.startDate} → {trip.endDate} • {trip.amount}€</p>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>

                  {/* Activities */}
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.15em] font-normal text-luna-text-muted mb-2 flex items-center gap-1.5">
                      <Calendar size={12} /> Activités ({contactActivities.length})
                    </h4>
                    {contactActivities.length === 0 ? (
                      <p className="text-xs text-luna-text-muted/60 italic">Aucune activité</p>
                    ) : contactActivities.map(act => (
                      <Link href="/crm/activities" key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-luna-cream/30 border border-luna-warm-gray/10 mb-1.5 hover:bg-sky-50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <Clock size={14} className={act.status === 'DONE' ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
                          <div className="min-w-0">
                            <p className={`text-sm font-normal truncate ${act.status === 'DONE' ? 'text-gray-400 line-through' : 'text-luna-charcoal'}`}>{act.title}</p>
                            <p className="text-[12px] text-luna-text-muted">{act.time} • {act.status}</p>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-luna-text-muted/40 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>

                  {/* Full profile link */}
                  {selectedContact?.id && (
                    <Link href={`/crm/clients/${selectedContact.id}`}
                      className="block w-full text-center py-3 mt-2 bg-luna-charcoal hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all">
                      Voir la fiche complète 360° →
                    </Link>
                  )}
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
              <h2 className="font-serif text-xl font-normal text-luna-charcoal"><T>Nouveau Contact</T></h2>
              <button onClick={() => setIsModalOpen(false)} className="text-luna-text-muted hover:text-luna-charcoal p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider"><T>Prénom</T></label>
                  <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newContact.firstName} onChange={e => setNewContact({ ...newContact, firstName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider"><T>Nom</T></label>
                  <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newContact.lastName} onChange={e => setNewContact({ ...newContact, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">Email</label>
                <input type="email" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                  value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider"><T>Téléphone</T></label>
                  <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">Niveau VIP</label>
                  <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900 bg-white"
                    value={newContact.vipLevel} onChange={e => setNewContact({ ...newContact, vipLevel: e.target.value as CRMContact['vipLevel'] })}>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">Préférence de communication</label>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setNewContact({ ...newContact, communicationPreference: 'EMAIL' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm transition-all ${newContact.communicationPreference === 'EMAIL' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                    <Mail size={14} /> Email
                  </button>
                  <button type="button" onClick={() => setNewContact({ ...newContact, communicationPreference: 'WHATSAPP' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm transition-all ${newContact.communicationPreference === 'WHATSAPP' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> WhatsApp
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">Préférences (séparées par des virgules)</label>
                <input type="text" placeholder="Ex: Plage, Luxe, Asie..." className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                  value={newContact.preferences} onChange={e => setNewContact({ ...newContact, preferences: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-luna-charcoal font-normal hover:bg-luna-cream transition-colors"><T>Annuler</T></button>
                <button type="submit" className="bg-luna-charcoal hover:bg-gray-800 text-white font-normal px-5 py-2.5 rounded-xl transition-all"><T>Créer</T></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
