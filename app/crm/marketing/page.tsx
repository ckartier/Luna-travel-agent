'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Megaphone, Send, BarChart3 } from 'lucide-react';
import { CRMCampaign, getCampaigns, createCampaign } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MarketingPage() {
  const { tenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<CRMCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', channel: 'EMAIL' as CRMCampaign['channel'], subject: '', content: '', targetAudience: 'ALL' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setCampaigns(await getCampaigns(tenantId!)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCamp.name) return;
    await createCampaign(tenantId!, {
      name: newCamp.name,
      channel: newCamp.channel,
      targetAudience: [newCamp.targetAudience],
      subject: newCamp.subject,
      content: newCamp.content,
      status: 'DRAFT',
      sentCount: 0, openCount: 0, clickCount: 0,
    });
    setShowModal(false);
    setNewCamp({ name: '', channel: 'EMAIL', subject: '', content: '', targetAudience: 'ALL' });
    loadData();
  };

  const getStatusStyle = (s: string) => { switch (s) { case 'SENT': return 'bg-emerald-50 text-emerald-600 border-emerald-200'; case 'SCHEDULED': return 'bg-sky-50 text-sky-600 border-sky-200'; case 'DRAFT': return 'bg-gray-100 text-gray-500 border-gray-200'; default: return 'bg-gray-100 text-gray-500 border-gray-200'; } };
  const formatDate = (d: any) => { try { const date = d instanceof Date ? d : d?.toDate?.() || new Date(d); return format(date, 'dd MMM yyyy', { locale: fr }); } catch { return '-'; } };

  const filtered = campaigns.filter(c => filter === 'ALL' || c.status === filter);
  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalOpens = campaigns.reduce((s, c) => s + c.openCount, 0);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-normal text-luna-charcoal mb-1">Marketing & Campagnes</h1>
          <p className="text-sm text-luna-text-muted">{campaigns.length} campagnes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ">
          <Plus size={16} /> Nouvelle Campagne
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-full flex items-center justify-center text-violet-500 border border-violet-100"><Send size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Envoyés</p><p className="text-2xl font-normal text-luna-charcoal">{totalSent.toLocaleString('fr-FR')}</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100"><BarChart3 size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Taux d'ouverture</p><p className="text-2xl font-normal text-sky-600">{totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0}%</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-fuchsia-50 rounded-full flex items-center justify-center text-fuchsia-500 border border-fuchsia-100"><Megaphone size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400">Campagnes</p><p className="text-2xl font-normal text-luna-charcoal">{campaigns.length}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'DRAFT', 'SCHEDULED', 'SENT'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-normal transition-colors ${filter === f ? 'bg-luna-charcoal text-white' : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm'}`}>
            {f === 'ALL' ? 'Tout' : f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Megaphone size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune campagne. Créez votre première.</p></div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden ">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr className="text-left text-xs font-normal tracking-wide text-gray-400">
                <th className="px-4 py-3">Campagne</th><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Envoyés</th>
                <th className="px-4 py-3">Ouvertures</th><th className="px-4 py-3">Clics</th><th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-normal text-luna-charcoal">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.channel === 'EMAIL' ? '📧 Email' : '📱 SMS'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.sentCount}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.openCount} <span className="text-gray-400">({c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 100) : 0}%)</span></td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.clickCount}</td>
                  <td className="px-4 py-3"><span className={`text-[12px] font-normal uppercase px-2 py-1 rounded border ${getStatusStyle(c.status)}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-white/50" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-normal text-luna-charcoal mb-4">Nouvelle Campagne</h2>
            <input value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} placeholder="Nom de la campagne"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" autoFocus />
            <select value={newCamp.channel} onChange={e => setNewCamp(p => ({ ...p, channel: e.target.value as any }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3">
              <option value="EMAIL">Email</option><option value="SMS">SMS</option>
            </select>
            <input value={newCamp.subject} onChange={e => setNewCamp(p => ({ ...p, subject: e.target.value }))} placeholder="Sujet (email)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-3" />
            <textarea value={newCamp.content} onChange={e => setNewCamp(p => ({ ...p, content: e.target.value }))} placeholder="Contenu du message"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none mb-4 min-h-[100px] resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all outline-none font-normal text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-3 rounded-xl bg-luna-charcoal hover:bg-gray-800 text-white text-sm font-normal  transition-all">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
