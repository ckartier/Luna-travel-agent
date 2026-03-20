'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Megaphone, Send, BarChart3, Mail, Smartphone, Sparkles } from 'lucide-react';
import { CRMCampaign, getCampaigns, createCampaign, getContacts } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal, { ModalActions, ModalCancelButton, ModalSubmitButton, ModalField, modalInputClass, modalSelectClass } from '@/src/components/ui/Modal';
import { T } from '@/src/components/T';

interface AISuggestion {
  name: string;
  channel: 'EMAIL' | 'SMS';
  subject: string;
  content: string;
  targetAudience: string;
}

export default function MarketingPage() {
  const { tenantId } = useAuth();
  const [campaigns, setCampaigns] = useState<CRMCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', channel: 'EMAIL' as CRMCampaign['channel'], subject: '', content: '', targetAudience: 'ALL' });
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, contacts] = await Promise.all([getCampaigns(tenantId!), getContacts(tenantId!)]);
      setCampaigns(camps);
      setContactCount(contacts.length);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const month = new Date().getMonth();
      const season = month >= 2 && month <= 4 ? 'printemps' : month >= 5 && month <= 7 ? 'été' : month >= 8 && month <= 10 ? 'automne' : 'hiver';
      const res = await fetch('/api/crm/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketing',
          data: {
            campaignCount: campaigns.length,
            openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
            contacts: contactCount,
            season,
          },
        }),
      });
      const data = await res.json();
      if (data.suggestions) setAiSuggestions(data.suggestions);
    } catch (e) { console.error('AI suggestions error:', e); }
    setAiLoading(false);
  };

  const createFromSuggestion = async (s: AISuggestion) => {
    await createCampaign(tenantId!, {
      name: s.name,
      channel: s.channel,
      targetAudience: [s.targetAudience],
      subject: s.subject,
      content: s.content,
      status: 'DRAFT',
      sentCount: 0, openCount: 0, clickCount: 0,
    });
    setAiSuggestions(prev => prev.filter(x => x.name !== s.name));
    loadData();
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
          <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>Marketing & Campagnes</T></h1>
          <p className="text-sm text-[#6B7280] mt-1 font-medium">{campaigns.length} campagnes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAiSuggestions} disabled={aiLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2 disabled:opacity-50">
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiLoading ? 'Analyse IA...' : 'Suggestions IA'}
          </button>
          <button onClick={() => setShowModal(true)} className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2 ">
            <Plus size={16} /> Nouvelle Campagne
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-violet-50 rounded-full flex items-center justify-center text-violet-500 border border-violet-100"><Send size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400"><T>Envoyés</T></p><p className="text-2xl font-normal text-luna-charcoal">{totalSent.toLocaleString('fr-FR')}</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 border border-sky-100"><BarChart3 size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400"><T>Taux de conversion</T></p><p className="text-2xl font-normal text-sky-600">{totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0}%</p></div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 bg-fuchsia-50 rounded-full flex items-center justify-center text-fuchsia-500 border border-fuchsia-100"><Megaphone size={22} /></div>
          <div><p className="text-xs font-normal tracking-wide text-gray-400"><T>Campagnes</T></p><p className="text-2xl font-normal text-luna-charcoal">{campaigns.length}</p></div>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
            <Sparkles size={14} /> Suggestions Gemini IA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {s.channel === 'EMAIL' ? <Mail size={14} className="text-purple-500" /> : <Smartphone size={14} className="text-purple-500" />}
                  <span className="text-xs font-bold text-purple-600">{s.channel}</span>
                </div>
                <p className="text-sm font-semibold text-[#2E2E2E] mb-1">{s.name}</p>
                {s.subject && <p className="text-xs text-gray-500 mb-2 italic">Objet: {s.subject}</p>}
                <p className="text-xs text-gray-600 leading-relaxed mb-3">{s.content}</p>
                <p className="text-[10px] text-gray-400 mb-3">Cible: {s.targetAudience}</p>
                <button onClick={() => createFromSuggestion(s)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all">
                  Créer cette campagne
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="text-center py-16 text-gray-400"><Megaphone size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm"><T>Aucune campagne. Créez votre première.</T></p></div>
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
                  <td className="px-4 py-3 text-gray-500"><span className="flex items-center gap-1.5">{c.channel === 'EMAIL' ? <><Mail size={13} /> Email</> : <><Smartphone size={13} /> SMS</>}</span></td>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Campagne" subtitle="Créez une campagne email ou SMS" size="sm">
        <ModalField label="Nom" className="mb-4">
          <input value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} placeholder="Black Friday, Rentrée..." className={modalInputClass} autoFocus />
        </ModalField>
        <ModalField label="Canal" className="mb-4">
          <select value={newCamp.channel} onChange={e => setNewCamp(p => ({ ...p, channel: e.target.value as any }))} className={modalSelectClass}>
            <option value="EMAIL">Email</option><option value="SMS">SMS</option>
          </select>
        </ModalField>
        <ModalField label="Sujet" className="mb-4">
          <input value={newCamp.subject} onChange={e => setNewCamp(p => ({ ...p, subject: e.target.value }))} placeholder="Objet de l'email" className={modalInputClass} />
        </ModalField>
        <ModalField label="Contenu">
          <textarea value={newCamp.content} onChange={e => setNewCamp(p => ({ ...p, content: e.target.value }))} placeholder="Votre message..." className={`${modalInputClass} min-h-[100px] resize-none`} />
        </ModalField>
        <ModalActions>
          <ModalCancelButton onClick={() => setShowModal(false)} />
          <ModalSubmitButton onClick={handleCreate}>Créer</ModalSubmitButton>
        </ModalActions>
      </Modal>
    </div>
  );
}
