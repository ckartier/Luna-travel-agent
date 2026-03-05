'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Check } from 'lucide-react';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPlan, setNewPlan] = useState('pro');
    const [adding, setAdding] = useState(false);

    const loadSubs = () => {
        fetchWithAuth('/api/admin/subscriptions').then(r => r.json()).then(data => {
            setSubscriptions(data.subscriptions || []);
            setLoading(false);
        });
    };

    useEffect(() => { loadSubs(); }, []);

    const addSubscription = async () => {
        if (!newEmail) return;
        setAdding(true);
        const planNames: Record<string, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
        await fetchWithAuth('/api/admin/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newEmail, planId: newPlan, planName: planNames[newPlan], status: 'active' }),
        });
        setNewEmail('');
        setShowAdd(false);
        setAdding(false);
        loadSubs();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des abonnements</h1>
                    <p className="text-white/40 text-sm mt-1">{subscriptions.length} abonnement(s)</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    <Plus size={16} /> Ajouter manuellement
                </button>
            </div>

            {/* Add subscription form */}
            {showAdd && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a24] rounded-2xl border border-violet-500/20 p-5 mb-6">
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold block mb-2">Email</label>
                            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@email.com"
                                className="w-full px-4 py-2.5 bg-[#0f0f14] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
                        </div>
                        <div className="w-48">
                            <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold block mb-2">Plan</label>
                            <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0f0f14] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50">
                                <option value="starter">Starter (99€)</option>
                                <option value="pro">Pro (249€)</option>
                                <option value="enterprise">Enterprise (499€)</option>
                            </select>
                        </div>
                        <button onClick={addSubscription} disabled={adding || !newEmail}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                            {adding ? '...' : 'Activer'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Subscriptions list */}
            <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">
                    <span>Email</span>
                    <span>Plan</span>
                    <span>Statut</span>
                    <span>Activé le</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin mx-auto" /></div>
                ) : subscriptions.length === 0 ? (
                    <div className="p-8 text-center text-white/20 text-sm">Aucun abonnement</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {subscriptions.map((s: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                                <p className="text-sm font-medium">{s.email || s.id}</p>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${s.planId === 'enterprise' ? 'bg-amber-500/20 text-amber-400' :
                                    s.planId === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                                        'bg-sky-500/20 text-sky-400'
                                    }`}>{s.planName || s.planId}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}>{s.status}</span>
                                <p className="text-[11px] text-white/30">
                                    {s.activatedAt?._seconds ? new Date(s.activatedAt._seconds * 1000).toLocaleDateString('fr-FR') :
                                        s.activatedAt ? new Date(s.activatedAt).toLocaleDateString('fr-FR') : '-'}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
