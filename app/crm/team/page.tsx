'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Search, Clock, CheckCircle2, Users, Loader2, MoreVertical } from 'lucide-react';
import { CRMUser, getUser } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';

export default function TeamPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<CRMUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { loadTeam(); }, []);

    const loadTeam = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            const users = snapshot.docs.map(d => ({ ...d.data(), uid: d.id } as CRMUser));
            setMembers(users);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const getRoleStyle = (role: string) => {
        switch (role) { case 'Admin': return 'bg-purple-50 text-purple-600 border-purple-200'; case 'Manager': return 'bg-sky-50 text-sky-600 border-sky-200'; default: return 'bg-gray-100 text-gray-500 border-gray-200'; }
    };

    const filtered = members.filter(m => m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-light text-luna-charcoal mb-1">Gestion d'Équipe</h1>
                    <p className="text-sm text-luna-text-muted">{members.length} membre(s) dans votre agence.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100"><Users size={22} /></div>
                    <div>
                        <p className="text-xs font-medium tracking-wide text-gray-400">Membres Totaux</p>
                        <p className="text-2xl font-serif font-light text-luna-charcoal">{members.length}</p>
                    </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 bg-purple-50 rounded-full flex items-center justify-center text-purple-500 border border-purple-100"><Shield size={22} /></div>
                    <div>
                        <p className="text-xs font-medium tracking-wide text-gray-400">Admins</p>
                        <p className="text-2xl font-semibold text-lua-charcoal">{members.filter(m => m.role === 'Admin').length}</p>
                    </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircle2 size={22} /></div>
                    <div>
                        <p className="text-xs font-medium tracking-wide text-gray-400">Agents</p>
                        <p className="text-2xl font-serif font-light text-luna-charcoal">{members.filter(m => m.role === 'Agent').length}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Chercher un agent..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-sm shadow-[0_2px_20px_rgba(0,0,0,0.04)]" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(member => (
                    <div key={member.uid} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="relative">
                                {member.photoURL ? (
                                    <img src={member.photoURL} alt={member.displayName} className="w-12 h-12 rounded-full object-cover shadow-[0_2px_20px_rgba(0,0,0,0.04)]" />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-tr from-sky-400 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                                        {member.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
                                    </div>
                                )}
                                {member.uid === user?.uid && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-luna-charcoal leading-tight">{member.displayName}</h3>
                                <p className="text-xs text-gray-500 font-medium">{member.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getRoleStyle(member.role)}`}>
                                <Shield size={10} className="inline mr-1" />{member.role}
                            </span>
                            {member.agency && <span className="text-[10px] font-medium text-gray-400">{member.agency}</span>}
                        </div>

                        {member.bio && (
                            <p className="text-xs text-gray-500 pt-3 border-t border-gray-100 line-clamp-2">{member.bio}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
