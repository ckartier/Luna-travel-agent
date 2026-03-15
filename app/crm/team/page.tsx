'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Search, Clock, CheckCircle2, Users, Loader2, MoreVertical, X, Trash2, UserCog } from 'lucide-react';
import { CRMUser, updateUserProfile } from '@/src/lib/firebase/crm';
import { updateTenantMemberRole, removeTenantMember } from '@/src/lib/firebase/tenant';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T } from '@/src/components/T';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamPage() {
  const { user, tenantId } = useAuth();
  const [members, setMembers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { if (tenantId) loadTeam(); }, [tenantId]);

  const loadTeam = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/crm/team');
      const data = await res.json();
      if (data.members) {
        setMembers(data.members as CRMUser[]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleUpdateRole = async (targetUid: string, currentRole: string) => {
    if (!tenantId || targetUid === user?.uid) return;
    const newRole = currentRole === 'Admin' ? 'agent' : 'admin';
    setUpdatingId(targetUid);
    try {
      await updateTenantMemberRole(tenantId, targetUid, newRole);
      // Also update the user doc profile for consistency if possible
      await updateUserProfile(targetUid, { role: newRole === 'admin' ? 'Admin' : 'Agent' });
      await loadTeam();
    } catch (e) {
      console.error(e);
      alert("Erreur lors du changement de rôle");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveMember = async (targetUid: string) => {
    if (!tenantId || targetUid === user?.uid) return;
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;
    setUpdatingId(targetUid);
    try {
      await removeTenantMember(tenantId, targetUid);
      // We don't delete the user doc, just the tenant membership
      await loadTeam();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !inviteEmail || !inviteName) return;
    setLoading(true);
    try {
      // Use server-side API (Admin SDK) to send invitation + add member
      const res = await fetchWithAuth('/api/crm/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "L'API a retourné une erreur");
      }

      const data = await res.json();

      const sentTo = inviteEmail;
      setInviteEmail('');
      setInviteName('');
      setIsInviteOpen(false);

      if (data.status === 'sent') {
        alert(`Invitation envoyée avec succès à ${sentTo} !`);
      } else {
        alert(`Membre ajouté mais l'email n'a pas pu être envoyé à ${sentTo}`);
      }

      await loadTeam();
    } catch (e: any) {
      console.error(e);
      alert(`Erreur : ${e.message || "Impossible d'envoyer l'invitation"}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-[#bcdeea]/15 text-[#5a8fa3] border-purple-200';
      case 'SuperAdmin': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-sky-50 text-sky-600 border-sky-200';
    }
  };

  const filtered = members.filter(m => m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && members.length === 0) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-8  pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight"><T>CRM Pro Équipe</T></h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">Gestion centralisée des accès et collaborateurs de l'agence.</p>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="bg-luna-charcoal text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-[#1a1a1a] transition-all shadow-xl shadow-luna-charcoal/5 active:scale-95"
          >
            <UserPlus size={18} />
            <span className="text-sm font-medium tracking-wide">Inviter un Expert</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-100"><Users size={26} /></div>
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Équipe</p>
              <p className="text-4xl font-light text-[#2E2E2E] tracking-tight">{members.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-100"><Shield size={26} /></div>
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Admins</p>
              <p className="text-4xl font-light text-[#2E2E2E] tracking-tight">{members.filter(m => m.role === 'Admin' || m.role === 'SuperAdmin').length}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircle2 size={26} /></div>
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Actifs</p>
              <p className="text-4xl font-light text-[#2E2E2E] tracking-tight">{members.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Rechercher par nom ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-base shadow-[0_4px_30px_rgba(0,0,0,0.03)] bg-white/50 backdrop-blur-sm" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map(member => (
            <motion.div
              layout
              key={member.uid}
              className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              {updatingId === member.uid && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[32px]">
                  <Loader2 className="animate-spin text-luna-charcoal" size={24} />
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-luna-cream/20 rounded-2xl flex items-center justify-center text-luna-charcoal font-medium text-xl border border-luna-cream/40">
                        {member.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
                      </div>
                    )}
                    {member.uid === user?.uid && <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-normal text-luna-charcoal tracking-tight leading-tight">{member.displayName}</h3>
                    <p className="text-sm text-[#6B7280] mt-1 font-medium">{member.email}</p>
                  </div>
                </div>

                {member.uid !== user?.uid && member.role !== 'SuperAdmin' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleUpdateRole(member.uid, member.role)}
                      title="Changer le rôle"
                      className="p-2 hover:bg-sky-50 text-sky-500 rounded-xl transition-colors"
                    >
                      <UserCog size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.uid)}
                      title="Supprimer"
                      className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${getRoleStyle(member.role)} flex items-center gap-2`}>
                  <Shield size={12} /> {member.role}
                </span>
                {member.agency ? (
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">{member.agency}</span>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] text-[#5a8fa3] font-semibold uppercase tracking-widest">
                    <Clock size={12} /> Actif
                  </div>
                )}
              </div>

              {member.bio && (
                <p className="text-sm text-gray-500 mt-6 pt-6 border-t border-gray-50 line-clamp-2 italic leading-relaxed">
                  "{member.bio}"
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {isInviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-luna-charcoal/60 backdrop-blur-xl"
                onClick={() => setIsInviteOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
              >
                {/* Luna Header */}
                <div className="p-10 pb-6 bg-luna-charcoal text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-light tracking-tight">Inviter un Expert</h2>
                      <p className="text-[#b9dae9] text-xs mt-1 font-medium">L'agent recevra ses accès Luna par email</p>
                    </div>
                    <button onClick={() => setIsInviteOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="p-10 pt-8">
                <form onSubmit={handleInvite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      placeholder="ex: Jean Dupont"
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Professionnel</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="jean@votre-agence.com"
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Rôle Initial</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as any)}
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:border-luna-charcoal focus:ring-1 focus:ring-luna-charcoal text-base bg-white appearance-none cursor-pointer"
                    >
                      <option value="agent">Agent (Accès CRM standard)</option>
                      <option value="admin">Administrateur (Gestion équipe & finances)</option>
                      <option value="viewer">Observateur (Lecture seule)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-luna-charcoal text-white py-5 rounded-3xl font-medium tracking-widest uppercase text-xs hover:bg-[#1a1a1a] transition-all shadow-xl shadow-luna-charcoal/10 active:scale-[0.98]"
                    >
                      Envoyer l'invitation
                    </button>
                  </div>
                </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
