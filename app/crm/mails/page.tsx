'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Search, RefreshCw, AlertCircle, CalendarClock, Sparkles, Plane, Hotel, Users, CalendarRange, ArrowRight, CheckCircle2, Loader2, X, PlusCircle, ExternalLink, Reply, Send, Archive, Trash2, CornerUpLeft, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, createActivity, createContact, findContactByEmail } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';
import { T, useAutoTranslate } from '@/src/components/T';

export default function MailsPage() {
  const { tenantId } = useAuth();
  const at = useAutoTranslate();
  const [emails, setEmails] = useState<any[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailContentLoading, setEmailContentLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [addingToPipeline, setAddingToPipeline] = useState(false);
  const [addedToPipeline, setAddedToPipeline] = useState(false);
  const [sendingAck, setSendingAck] = useState(false);
  const [ackSent, setAckSent] = useState<string | null>(null); // stores the email id for which ack was sent
  const analysisCache = useRef<Record<string, any>>({});
  const [folder, setFolder] = useState<'inbox' | 'archive' | 'trash'>('inbox');


  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/gmail/list?folder=${folder}&filter=site`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err.message || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      fetchEmails(); 
      setSelectedEmail(null);
  }, [folder]);

  const handleArchive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic UI update
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);

    try {
      await fetchWithAuth('/api/gmail/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', messageId: id })
      });
    } catch (err) {
      console.error('Failed to archive email', err);
      // Optional: fetchEmails() to revert state on failure
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic UI update
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);

    try {
      await fetchWithAuth('/api/gmail/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trash', messageId: id })
      });
    } catch (err) {
      console.error('Failed to trash email', err);
    }
  };

  const handleReplyMailto = () => {
    if (!selectedEmail) return;
    const sender = selectedEmail.sender.match(/<(.+)>/)?.[1] || selectedEmail.sender;
    const subject = selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
    window.open(`mailto:${sender}?subject=${encodeURIComponent(subject)}`, '_blank');
  };

  const handleSelectEmail = async (email: any) => {
    setSelectedEmail(email);
    // Restore cached analysis instantly if available
    const cached = analysisCache.current[email.id];
    setAnalysis(cached || null);
    setDispatched(false);
    setAddedToPipeline(false);
    // Don't reset ackSent per email — keep it to remember which emails got an ACK
    if (!email.bodyText) {
      setEmailContentLoading(true);
      try {
        const res = await fetchWithAuth(`/api/gmail/list?action=get&messageId=${email.id}`);
        const data = await res.json();
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, ...data } : e));
        setSelectedEmail({ ...email, ...data });
      } catch (err) {
        console.error("Failed to fetch full email body", err);
      } finally {
        setEmailContentLoading(false);
      }
    }
  };

  const handleAnalyzeEmail = async () => {
    if (!selectedEmail) return;
    // Return cached analysis if available
    if (analysisCache.current[selectedEmail.id]) {
      setAnalysis(analysisCache.current[selectedEmail.id]);
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetchWithAuth('/api/email-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailBody: selectedEmail.bodyText || selectedEmail.snippet || '',
          emailSubject: selectedEmail.subject,
          emailSender: selectedEmail.sender,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
      // Cache the result
      if (data.analysis && selectedEmail.id) {
        analysisCache.current[selectedEmail.id] = data.analysis;
      }
    } catch (err) {
      console.error("Failed to analyze email", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDispatchToAgents = async () => {
    if (!analysis) return;
    setDispatching(true);
    try {
      const ext = analysis.extracted || {};
      const destinations = (ext.destinations || ['Paris']);
      const senderEmail = selectedEmail?.sender?.match(/<(.+)>/)?.[1] || selectedEmail?.sender || '';
      const clientName = ext.clientName || selectedEmail?.sender?.replace(/<.*>/, '').trim() || 'Client';

      // Find or create contact
      let contactId = '';
      try {
        const existing = await findContactByEmail(tenantId!, senderEmail);
        if (existing?.id) {
          contactId = existing.id;
        } else if (senderEmail) {
          const names = clientName.split(' ');
          contactId = await createContact(tenantId!, {
            firstName: names[0] || clientName,
            lastName: names.slice(1).join(' ') || '',
            email: senderEmail.toLowerCase().trim(),
            vipLevel: 'Standard',
            preferences: destinations,
          });
        }
      } catch (e) { console.error('Contact save failed:', e); }

      // Build rich mustHaves: email subject + AI summary + requirements
      const emailSubject = selectedEmail?.subject || '';
      const aiSummary = analysis.summary || '';
      const rawMustHaves = ext.mustHaves || '';
      const mustHavesParts = [
        emailSubject ? `Objet: ${emailSubject}` : '',
        aiSummary ? `Analyse IA: ${aiSummary}` : '',
        rawMustHaves ? `Exigences: ${rawMustHaves}` : '',
      ].filter(Boolean);

      // Add to pipeline with contact link
      let leadId = '';
      try {
        leadId = await createLead(tenantId!, {
          clientName,
          clientId: contactId,
          destination: destinations.join(', '),
          dates: `${ext.departureDate || ''} → ${ext.returnDate || ''}`.trim() || 'À définir',
          budget: ext.budget || 'À définir',
          pax: ext.pax || '1',
          vibe: ext.vibe || '',
          mustHaves: mustHavesParts.join(' — ') || emailSubject || 'Demande depuis le site',
          source: 'Email site',
          status: 'ANALYSING',
        });
      } catch (e) { console.error('Pipeline save failed:', e); }

      // Auto-create follow-up activity
      try {
        await createActivity(tenantId!, {
          title: `Suivi email — ${clientName} (${destinations.join(', ')})`,
          time: 'Aujourd\'hui',
          type: 'email',
          status: 'PENDING',
          color: 'blue',
          iconName: 'Mail',
          contactId,
          contactName: clientName,
          leadId,
        });
      } catch (e) { console.error('Activity save failed:', e); }

      setDispatched(true);
      setTimeout(() => {
        // Navigate to Agent IA page with extracted data as query params
        const params = new URLSearchParams({
          agent: 'voyage',
          dest: destinations[0] || 'Paris',
          from: 'Paris',
          dep: ext.departureDate || '',
          ret: ext.returnDate || '',
          budget: ext.budget || '',
          pax: ext.pax || '2',
          vibe: ext.vibe || '',
          notes: ext.mustHaves || '',
          clientName,
          clientEmail: senderEmail,
        });
        router.push(`/crm/agent-ia?${params.toString()}`);
      }, 1000);
    } catch (err) {
      console.error("Failed to dispatch", err);
    } finally {
      setDispatching(false);
    }
  };

  const handleAddToPipeline = async () => {
    if (!analysis) return;
    setAddingToPipeline(true);
    try {
      const ext = analysis.extracted || {};
      const senderEmail = selectedEmail?.sender?.match(/<(.+)>/)?.[1] || selectedEmail?.sender || '';
      const clientName = ext.clientName || selectedEmail?.sender?.replace(/<.*>/, '').trim() || 'Client';
      const destinations = ext.destinations || ['Non définie'];

      // Find or create contact
      let contactId = '';
      try {
        const existing = await findContactByEmail(tenantId!, senderEmail);
        if (existing?.id) {
          contactId = existing.id;
        } else if (senderEmail) {
          const names = clientName.split(' ');
          contactId = await createContact(tenantId!, {
            firstName: names[0] || clientName,
            lastName: names.slice(1).join(' ') || '',
            email: senderEmail.toLowerCase().trim(),
            vipLevel: 'Standard',
            preferences: destinations,
          });
        }
      } catch (e) { console.error('Contact save failed:', e); }

      // Build rich mustHaves: email subject + AI summary + requirements
      const emailSubject = selectedEmail?.subject || '';
      const aiSummary = analysis.summary || '';
      const rawMustHaves = ext.mustHaves || '';
      const mustHavesParts = [
        emailSubject ? `Objet: ${emailSubject}` : '',
        aiSummary ? `Analyse IA: ${aiSummary}` : '',
        rawMustHaves ? `Exigences: ${rawMustHaves}` : '',
      ].filter(Boolean);

      // Create lead linked to contact
      const leadId = await createLead(tenantId!, {
        clientName,
        clientId: contactId,
        destination: destinations.join(', '),
        dates: `${ext.departureDate || ''} → ${ext.returnDate || ''}`.trim() || 'À définir',
        budget: ext.budget || 'À définir',
        pax: ext.pax || '1',
        vibe: ext.vibe || '',
        mustHaves: mustHavesParts.join(' — ') || emailSubject || 'Demande depuis le site',
        source: 'Email site',
        status: 'NEW',
      });

      // Auto-create follow-up activity
      try {
        await createActivity(tenantId!, {
          title: `Nouvelle demande — ${clientName} (${destinations.join(', ')})`,
          time: 'Aujourd\'hui',
          type: 'email',
          status: 'PENDING',
          color: 'amber',
          iconName: 'Mail',
          contactId,
          contactName: clientName,
          leadId,
        });
      } catch (e) { console.error('Activity save failed:', e); }

      setAddedToPipeline(true);
    } catch (err) {
      console.error('Failed to add to pipeline', err);
    } finally {
      setAddingToPipeline(false);
    }
  };

  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-50 text-red-600 border-red-100',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const agentIcons = [
    { icon: Plane, name: 'Transport', color: 'text-sky-500' },
    { icon: Hotel, name: 'Hébergement', color: 'text-amber-500' },
    { icon: Users, name: 'Profil Client', color: 'text-purple-500' },
    { icon: CalendarRange, name: 'Itinéraire', color: 'text-emerald-500' },
  ];

  const handleSendAcknowledgment = async () => {
    if (!selectedEmail) return;
    setSendingAck(true);
    try {
      const senderEmail = selectedEmail.sender?.match(/<(.+)>/)?.[1] || selectedEmail.sender || '';
      const senderName = selectedEmail.sender?.replace(/<.*>/, '').trim() || 'Client';
      if (!senderEmail || !senderEmail.includes('@')) {
        alert('Email de l\'expéditeur introuvable');
        return;
      }

      // Dynamically import template to keep it server-side friendly
      const { generateQuickAcknowledgmentEmail } = await import('@/src/lib/email/templates');

      // Fetch custom logo + business name for branded email
      let customLogoUrl: string | undefined;
      let agencyName: string | undefined;
      try {
        const cfgRes = await fetch('/api/crm/site-config');
        const cfgData = await cfgRes.json();
        if (cfgData?.global?.logo) customLogoUrl = cfgData.global.logo;
        if (cfgData?.business?.name) agencyName = cfgData.business.name;
      } catch { /* fallback */ }

      const htmlBody = generateQuickAcknowledgmentEmail({
        clientName: senderName,
        originalSubject: selectedEmail.subject || 'votre message',
        ...(customLogoUrl && { logoUrl: customLogoUrl }),
        ...(agencyName && { agencyName }),
      });

      const res = await fetchWithAuth('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: senderEmail,
          subject: `Re: ${selectedEmail.subject} — Bien reçu ✓`,
          message: `Bonjour ${senderName.split(' ')[0]}, nous avons bien reçu votre message "${selectedEmail.subject}" et nous le prenons en charge. Nous reviendrons vers vous très rapidement. — Votre Conciergerie`,
          bodyHtml: htmlBody,
          clientName: senderName,
        }),
      });

      if (res.ok) {
        setAckSent(selectedEmail.id);
      } else {
        const errData = await res.json();
        alert(`Erreur: ${errData.error || 'Échec de l\'envoi'}`);
      }
    } catch (err) {
      console.error('Erreur envoi accusé de réception:', err);
      alert('Erreur lors de l\'envoi');
    } finally {
      setSendingAck(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full h-[calc(100vh-250px)] min-h-[700px] flex flex-col space-y-6 pb-8">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-[42px] font-light text-[#2E2E2E] tracking-tight mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <T>Boîte de Réception</T> <span className="bg-[#b9dae9]/20 text-[#2E2E2E] text-sm py-1 px-3.5 rounded-full font-sans font-medium align-middle ml-2">{emails.length}</span>
            </h1>
            <p className="text-[15px] text-[#6B7280] font-light tracking-wide">Analysez et dispatchez automatiquement avec Luna AI.</p>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center bg-white p-1.5 rounded-[16px] border border-gray-200 shadow-sm gap-1 mr-4">
                  <button onClick={() => setFolder('inbox')} className={`px-4 py-2 rounded-[12px] text-[11px] font-bold uppercase tracking-widest transition-all ${folder === 'inbox' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Principale</button>
                  <button onClick={() => setFolder('archive')} className={`px-4 py-2 rounded-[12px] text-[11px] font-bold uppercase tracking-widest transition-all ${folder === 'archive' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Archives</button>
                  <button onClick={() => setFolder('trash')} className={`px-4 py-2 rounded-[12px] text-[11px] font-bold uppercase tracking-widest transition-all ${folder === 'trash' ? 'bg-[#2E2E2E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Corbeille</button>
              </div>

              <button onClick={fetchEmails} disabled={loading}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-[#2E2E2E] font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 text-[13px] uppercase tracking-widest">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> <T>Actualiser</T>
              </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden flex min-h-0">
        {/* Email List */}
        <div className={`w-full lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Rechercher..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#b9dae9] focus:ring-1 focus:ring-[#b9dae9] transition-all placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto override-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3">
                <RefreshCw className="animate-spin" size={24} />
                <p className="text-xs">Synchronisation…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                <AlertCircle size={28} className="text-amber-500" />
                {error.includes('invalid_grant') || error.includes('Token') || error.includes('token') ? (
                  <>
                    <p className="text-sm font-medium text-[#2E2E2E]">Session Gmail expirée</p>
                    <p className="text-xs text-gray-500 max-w-xs">Le token d'accès Gmail a expiré. Veuillez vous reconnecter pour synchroniser vos emails.</p>
                    <a
                      href="/api/gmail/auth"
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#b9dae9] text-[#2E2E2E] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#a5cadc] transition-all shadow-sm"
                    >
                      <RefreshCw size={14} /> Reconnecter Gmail
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-red-500">{error}</p>
                    <button onClick={fetchEmails} className="mt-1 text-xs text-[#b9dae9] hover:text-[#5a8fa3] underline">Réessayer</button>
                  </>
                )}
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3">
                <Mail size={36} className="opacity-20" />
                <p className="font-normal text-sm text-luna-charcoal">Aucune demande.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {emails.map(email => (
                  <div key={email.id} className={`group relative w-full text-left p-5 hover:bg-[#b9dae9]/5 transition-colors cursor-pointer ${selectedEmail?.id === email.id ? 'bg-[#b9dae9]/10 border-l-4 border-l-[#b9dae9]' : 'border-l-4 border-l-transparent'}`} onClick={() => handleSelectEmail(email)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-[#2E2E2E] truncate pr-3 text-sm">{email.sender.replace(/<.*>/, '')}</span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap uppercase tracking-wider font-medium">
                        {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h4 className={`text-[13px] mb-1.5 truncate ${selectedEmail?.id === email.id ? 'font-medium text-[#2E2E2E]' : 'font-normal text-[#2E2E2E]'}`}>{email.subject}</h4>
                    <p className="text-[13px] text-gray-500 font-light truncate">{email.snippet?.replace(/&#39;/g, "'")}</p>
                    {/* Hover Actions */}
                    <div className="absolute top-4 right-4 bg-white shadow-md border border-gray-100 rounded-lg p-1 hidden group-hover:flex items-center gap-1">
                        <button onClick={(e) => handleArchive(email.id, e)} className="p-1.5 text-gray-400 hover:text-[#2E2E2E] transition-colors rounded-md hover:bg-gray-50" title="Archiver">
                            <Archive size={14} />
                        </button>
                        <button onClick={(e) => handleDelete(email.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50" title="Supprimer">
                            <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Viewer + AI Analysis */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
          {selectedEmail ? (
            <div className="flex-1 overflow-y-auto flex flex-col h-full">
              <div className="p-6 md:p-8 border-b border-gray-100">
                {/* Mobile back button */}
                <button onClick={() => setSelectedEmail(null)} className="lg:hidden text-xs text-[#b9dae9] uppercase tracking-widest font-bold mb-5 flex items-center gap-2 hover:text-[#2E2E2E] transition-colors"><CornerUpLeft size={14}/> Retour</button>
                
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl md:text-3xl font-light text-[#2E2E2E] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button onClick={handleReplyMailto} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[#2E2E2E] hover:text-[#2E2E2E] transition-all bg-white shadow-sm" title="Répondre">
                            <CornerUpLeft size={16} />
                        </button>
                        <button onClick={() => handleArchive(selectedEmail.id)} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[#2E2E2E] hover:text-[#2E2E2E] transition-all bg-white shadow-sm" title="Archiver">
                            <Archive size={16} />
                        </button>
                        <button onClick={() => handleDelete(selectedEmail.id)} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all bg-white shadow-sm" title="Supprimer">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 font-semibold text-lg border border-gray-200 shadow-sm">
                      {selectedEmail.sender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#2E2E2E] text-[15px]">{selectedEmail.sender}</p>
                      <p className="text-[13px] text-gray-400 font-light flex items-center gap-1.5 mt-0.5">
                        <CalendarClock size={12} />
                        {new Date(selectedEmail.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Accusé de réception button */}
                    {ackSent === selectedEmail.id ? (
                      <div className="bg-emerald-50 text-emerald-600 font-medium px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-wider flex items-center gap-2 border border-emerald-200">
                        <CheckCircle2 size={15} /> Accusé envoyé
                      </div>
                    ) : (
                      <button onClick={handleSendAcknowledgment} disabled={sendingAck}
                        className="bg-white hover:bg-gray-50 border border-gray-200 text-[#2E2E2E] font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-60">
                        {sendingAck ? <Loader2 size={15} className="animate-spin" /> : <Reply size={15} />}
                        {sendingAck ? 'Envoi…' : 'Accusé'}
                      </button>
                    )}
                    <button onClick={handleAnalyzeEmail} disabled={analyzing}
                      className="bg-[#b9dae9] hover:bg-[#a5cadc] text-[#2E2E2E] font-bold px-5 py-2.5 rounded-xl shadow-[0_4px_15px_-4px_rgba(185,218,233,0.5)] transition-all text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-60">
                      {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {analyzing ? 'Analyse…' : at('IA Expert')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex">
                {/* Email body */}
                <div className="flex-1 p-6 border-r border-luna-warm-gray/10">
                  {emailContentLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-3 bg-luna-cream rounded w-3/4" />
                      <div className="h-3 bg-luna-cream rounded w-1/2" />
                      <div className="h-3 bg-luna-cream rounded w-5/6" />
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-luna-charcoal leading-relaxed whitespace-pre-wrap text-sm">
                      {selectedEmail.bodyText || "Contenu non disponible."}
                    </div>
                  )}
                </div>

                {/* AI Analysis Panel */}
                <AnimatePresence>
                  {/* Analyzing skeleton */}
                  {analyzing && !analysis && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                      className="bg-gradient-to-b from-[#b9dae9]/5 to-white border-l border-gray-100 overflow-hidden flex-shrink-0">
                      <div className="p-5 h-full space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles size={14} className="text-[#a5cadc] animate-pulse" />
                          <span className="text-sm font-medium text-[#2E2E2E]">Analyse en cours…</span>
                        </div>
                        {/* Skeleton blocks */}
                        <div className="animate-pulse space-y-4">
                          <div className="bg-[#b9dae9]/10 rounded-xl p-4 border border-[#b9dae9]/20">
                            <div className="h-2.5 bg-[#b9dae9]/20 rounded w-3/4 mb-2" />
                            <div className="h-2.5 bg-[#b9dae9]/15 rounded w-1/2 mb-2" />
                            <div className="h-2.5 bg-[#b9dae9]/10 rounded w-5/6" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-100 rounded w-1/3" />
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="flex justify-between bg-gray-50/50 rounded-lg p-3 border border-gray-100">
                                <div className="h-2 bg-gray-200/60 rounded w-16" />
                                <div className="h-2 bg-gray-200/40 rounded w-24" />
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-gray-100 rounded w-2/5" />
                            <div className="grid grid-cols-2 gap-2">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 h-8" />
                              ))}
                            </div>
                          </div>
                          <div className="h-10 bg-[#b9dae9]/20 rounded-lg" />
                        </div>
                        {/* Animated progress bar */}
                        <div className="mt-4">
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#b9dae9] to-[#a5cadc] rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 8, ease: 'linear' }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {analysis && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                      className="bg-gradient-to-b from-[#b9dae9]/5 to-white border-l border-gray-100 overflow-hidden flex-shrink-0">
                      <div className="p-5 h-full overflow-y-auto override-scrollbar">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[#a5cadc]" />
                            <h3 className="font-medium text-sm text-[#2E2E2E]">Analyse Luna AI</h3>
                          </div>
                          <span className={`text-[12px] uppercase font-normal tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[analysis.priority] || priorityColors.MEDIUM}`}>
                            {analysis.priority || 'MEDIUM'}
                          </span>
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                          <p className="text-[13px] text-gray-500 font-light leading-relaxed">{analysis.summary}</p>
                        </div>

                        {/* Extracted data */}
                        {analysis.extracted && (
                          <div className="space-y-2.5 mb-4">
                            <h4 className="text-xs uppercase tracking-wider font-normal text-luna-text-muted">Données extraites</h4>
                            {[
                              { label: 'Client', value: analysis.extracted.clientName },
                              { label: 'Destinations', value: analysis.extracted.destinations?.join(', ') },
                              { label: 'Dates', value: `${analysis.extracted.departureDate || '—'} → ${analysis.extracted.returnDate || '—'}` },
                              { label: 'Voyageurs', value: analysis.extracted.pax },
                              { label: 'Budget', value: analysis.extracted.budget },
                              { label: 'Ambiance', value: analysis.extracted.vibe },
                              { label: 'Exigences', value: analysis.extracted.mustHaves },
                              { label: 'Spécial', value: analysis.extracted.specialRequests },
                            ].filter(item => item.value).map((item, i) => (
                              <div key={i} className="flex justify-between items-start bg-gray-50/50 rounded-lg p-3 border border-gray-100 mb-1.5">
                                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{item.label}</span>
                                <span className="text-[12px] font-medium text-[#2E2E2E] text-right max-w-[160px]">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Agent Dispatch */}
                        <div className="mb-4">
                          <h4 className="text-xs uppercase tracking-wider font-normal text-luna-text-muted mb-2">Agents à dispatcher</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {agentIcons.map((agent, i) => (
                              <div key={i} className={`bg-white rounded-lg p-2.5 border border-luna-warm-gray/10 flex items-center gap-2 ${dispatched ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                                <agent.icon size={14} className={dispatched ? 'text-emerald-500' : agent.color} />
                                <span className="text-[12px] font-normal text-luna-charcoal">{agent.name}</span>
                                {dispatched && <CheckCircle2 size={10} className="text-emerald-500 ml-auto" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch button */}
                        {!dispatched ? (
                          <button onClick={handleDispatchToAgents} disabled={dispatching}
                            className="w-full py-2.5 btn-primary font-normal text-xs tracking-wider uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {dispatching ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                            {dispatching ? 'Dispatch…' : 'Dispatcher aux 4 Agents'}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 font-normal text-xs tracking-wider uppercase rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} /> Dispatché aux agents
                          </div>
                        )}

                        {/* Add to Pipeline button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {!addedToPipeline ? (
                            <button onClick={handleAddToPipeline} disabled={addingToPipeline}
                              className="w-full py-3 bg-white hover:bg-gray-50 text-[#2E2E2E] font-medium text-[11px] tracking-[0.2em] uppercase rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                              {addingToPipeline ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                              {addingToPipeline ? 'Ajout…' : 'Ajouter au CRM'}
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="w-full py-3 bg-emerald-50 text-emerald-600 font-medium text-[11px] tracking-wider uppercase rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                                <CheckCircle2 size={15} /> Ajouté au Pipeline
                              </div>
                              <Link href="/crm/pipeline" className="w-full py-2 text-[#b9dae9] hover:text-[#a5cadc] font-medium text-[12px] rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                                <ExternalLink size={13} /> Voir le Pipeline
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-luna-text-muted p-6 text-center space-y-3 bg-luna-cream/10">
              <Mail size={48} className="opacity-15 mb-2" />
              <p className="font-serif font-normal text-lg text-luna-charcoal"><T>Sélectionnez un email</T></p>
              <p className="text-luna-text-muted max-w-xs text-xs">Sélectionnez une demande pour l'analyser avec Luna AI.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
