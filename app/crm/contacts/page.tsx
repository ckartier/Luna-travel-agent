'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Star, MessageSquare, Phone, Mail, MoreHorizontal, RefreshCcw, X } from 'lucide-react';
import { getContacts, createContact, CRMContact } from '@/src/lib/firebase/crm';

export default function CRMContacts() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        vipLevel: 'Standard' as CRMContact['vipLevel'],
        preferences: ''
    });

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createContact({
                firstName: newContact.firstName,
                lastName: newContact.lastName,
                email: newContact.email,
                phone: newContact.phone,
                vipLevel: newContact.vipLevel,
                preferences: newContact.preferences ? newContact.preferences.split(',').map(p => p.trim()) : []
            });
            setIsModalOpen(false);
            setNewContact({ firstName: '', lastName: '', email: '', phone: '', vipLevel: 'Standard', preferences: '' });
            loadContacts();
        } catch (error) {
            console.error("Failed to add contact:", error);
        }
    };

    const loadContacts = async () => {
        setLoading(true);
        try {
            const data = await getContacts();
            const formatted = data.map(c => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`,
                company: 'Client Particulier', // Par défaut
                email: c.email,
                vip: c.vipLevel || 'Standard',
                lastTrip: c.preferences ? c.preferences.join(', ') : 'Aucun'
            }));
            setContacts(formatted);
        } catch (error) {
            console.error("Failed to load contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Base Clients & Contacts</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos voyageurs VIP et leurs préférences personnalisées.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadContacts} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
                        <RefreshCcw size={18} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                        + Ajouter Contact
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un client ou une entreprise..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                        />
                    </div>
                    <button className="text-gray-500 font-bold px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Filtres</button>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest">
                            <th className="p-4 pl-6">Client</th>
                            <th className="p-4">Statut VIP</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Dernier Voyage</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {contacts.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium border-dashed">
                                    Aucun contact enregistré.
                                </td>
                            </tr>
                        )}
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{contact.name}</p>
                                            <p className="text-xs text-gray-500 font-semibold">{contact.company}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${contact.vip === 'Elite' ? 'bg-purple-100 text-purple-700' :
                                        contact.vip === 'VIP' ? 'bg-amber-100 text-amber-700' :
                                            contact.vip === 'Premium' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {contact.vip === 'Elite' || contact.vip === 'VIP' ? <Star size={10} className="fill-current" /> : null}
                                        {contact.vip}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Mail size={12} className="text-gray-400" /> {contact.email}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-semibold text-gray-600">
                                    {contact.lastTrip}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Phone size={16} /></button>
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MessageSquare size={16} /></button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><MoreHorizontal size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Ajout Contact */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
                            <h2 className="text-xl font-bold text-gray-900">Nouveau Contact</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prénom</label>
                                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newContact.firstName} onChange={e => setNewContact({ ...newContact, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</label>
                                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newContact.lastName} onChange={e => setNewContact({ ...newContact, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                                <input type="email" required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                                    <input type="tel" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Statut VIP</label>
                                    <select className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 appearance-none bg-white" value={newContact.vipLevel} onChange={e => setNewContact({ ...newContact, vipLevel: e.target.value as CRMContact['vipLevel'] })}>
                                        <option>Standard</option>
                                        <option>Premium</option>
                                        <option>VIP</option>
                                        <option>Elite</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Préférences (Séparées par virgule)</label>
                                <input type="text" placeholder="Ex: Île Maurice, Spa, Vol Direct" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={newContact.preferences} onChange={e => setNewContact({ ...newContact, preferences: e.target.value })} />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">Annuler</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all">Enregistrer le Contact</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
