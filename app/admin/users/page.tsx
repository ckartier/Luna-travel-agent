'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Check, Users as UsersIcon } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

interface UserRecord {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    role: string;
    agency?: string;
    createdAt?: any;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadUsers = () => {
        fetchWithAuth('/api/admin/users').then(r => r.json()).then(data => {
            setUsers(data.users || []);
            setLoading(false);
        });
    };

    useEffect(() => { loadUsers(); }, []);

    const changeRole = async (uid: string, role: string) => {
        setUpdating(uid);
        await fetchWithAuth('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, role }),
        });
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
        setUpdating(null);
        setSuccess(uid);
        setTimeout(() => setSuccess(null), 2000);
    };

    const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-normal">Gestion des utilisateurs</h1>
                    <p className="text-white/40 text-sm mt-1">{users.length} utilisateur(s) enregistré(s)</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..."
                    className="w-full pl-11 pr-4 py-3 bg-[#1a1a24] border border-white/5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
            </div>

            {/* Users table */}
            <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-[12px] text-white/30 uppercase tracking-[0.15em] font-normal">
                    <span>Avatar</span>
                    <span>Nom</span>
                    <span>Email</span>
                    <span>Rôle</span>
                    <span>Actions</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin mx-auto" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-white/20 text-sm">Aucun utilisateur trouvé</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map((u, i) => (
                            <motion.div key={u.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors">
                                {u.photoURL ? (
                                    <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-xs font-normal">
                                        {(u.displayName || 'U')[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-normal">{u.displayName}</p>
                                    {u.agency && <p className="text-[12px] text-white/20">{u.agency}</p>}
                                </div>
                                <p className="text-sm text-white/50">{u.email}</p>
                                <span className={`text-[12px] font-normal px-2.5 py-1 rounded-full uppercase tracking-wider ${u.role === 'Admin' ? 'bg-violet-500/20 text-violet-400' :
                                    u.role === 'Manager' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-sky-500/20 text-sky-400'
                                    }`}>{u.role || 'Agent'}</span>
                                <div className="flex gap-1.5">
                                    {['Agent', 'Manager', 'Admin'].map(role => (
                                        <button key={role} disabled={u.role === role || updating === u.uid}
                                            onClick={() => changeRole(u.uid, role)}
                                            className={`text-[12px] px-2.5 py-1 rounded-lg font-normal transition-all ${u.role === role ? 'bg-white/10 text-white/30 cursor-default' :
                                                'bg-white/5 text-white/50 hover:bg-violet-500/20 hover:text-violet-400'
                                                }`}>
                                            {success === u.uid && u.role === role ? <Check size={10} /> : role}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
