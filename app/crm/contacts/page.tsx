'use client';

import { Users, Search, Star, MessageSquare, Phone, Mail, MoreHorizontal } from 'lucide-react';

const mockContacts = [
    { id: '1', name: 'Laurent Clément', company: 'TechCorp SA', email: 'laurent@example.com', vip: 'Elite', lastTrip: 'Maldives (2025)' },
    { id: '2', name: 'Sophie Robert', company: 'DesignStudio', email: 'sophie@example.com', vip: 'Premium', lastTrip: 'New York (2025)' },
    { id: '3', name: 'Alain Dupont', company: 'Dupont Group', email: 'alain.d@example.com', vip: 'Standard', lastTrip: 'Londres (2024)' },
    { id: '4', name: 'Marie Martin', company: 'Global Logistics', email: 'marie.m@example.com', vip: 'VIP', lastTrip: 'Kyoto (2025)' },
];

export default function CRMContacts() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Base Clients & Contacts</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos voyageurs VIP et leurs préférences personnalisées.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                    + Ajouter Contact
                </button>
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
                        {mockContacts.map((contact) => (
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
        </div>
    );
}
