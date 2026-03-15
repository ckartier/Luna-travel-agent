'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Search, Plus, Phone, Check, CheckCheck, Clock, Smile, MessageCircle, Mail, Smartphone, User } from 'lucide-react';
import { CRMMessage, CRMContact, getAllMessages, createMessage, markMessageRead, getContacts } from '@/src/lib/firebase/crm';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/utils/fetchWithAuth';

interface Conversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastDate: Date;
  unread: number;
  channel: string;
  messages: CRMMessage[];
}

function formatTime(d: Date | any): string {
  const date = d instanceof Date ? d : d?.toDate?.() || new Date();
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date | any): string {
  const date = d instanceof Date ? d : d?.toDate?.() || new Date();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) return formatTime(date);
  if (diff < 172800000) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getChannelColor(ch: string) {
  switch (ch) {
    case 'WHATSAPP': return { bg: 'bg-green-50', text: 'text-green-600', icon: <MessageCircle size={11} />, label: 'WhatsApp', border: 'border-green-100' };
    case 'EMAIL': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Mail size={11} />, label: 'Email', border: 'border-blue-100' };
    case 'SMS': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Smartphone size={11} />, label: 'SMS', border: 'border-orange-100' };
    default: return { bg: 'bg-violet-50', text: 'text-violet-600', icon: <MessageSquare size={11} />, label: 'Chat', border: 'border-violet-100' };
  }
}

export default function MessagesInboxPage() {
  const { user, tenantId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waFirstMsg, setWaFirstMsg] = useState('Bonjour ! Comment puis-je vous aider ?');
  const [waTab, setWaTab] = useState<'contact' | 'whatsapp'>('whatsapp');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedConv, conversations]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [msgs, cts] = await Promise.all([getAllMessages(tenantId!), getContacts(tenantId!)]);
      setContacts(cts);

      const grouped: Record<string, CRMMessage[]> = {};
      msgs.forEach(m => {
        if (!grouped[m.clientId]) grouped[m.clientId] = [];
        grouped[m.clientId].push(m);
      });

      const convs: Conversation[] = Object.entries(grouped).map(([clientId, messages]) => {
        const sorted = messages.sort((a, b) => {
          const da = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any).toDate();
          const db2 = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any).toDate();
          return db2.getTime() - da.getTime();
        });
        return {
          clientId,
          clientName: sorted[0].clientName,
          lastMessage: sorted[0].content,
          lastDate: sorted[0].createdAt instanceof Date ? sorted[0].createdAt : (sorted[0].createdAt as any).toDate(),
          unread: sorted.filter(m => !m.isRead && m.direction === 'INBOUND').length,
          channel: sorted[0].channel,
          messages: sorted.reverse(),
        };
      }).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

      setConversations(convs);
      if (convs.length > 0 && !selectedConv) setSelectedConv(convs[0].clientId);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!inputMsg.trim() || !selectedConv || sending) return;
    setSending(true);
    const conv = conversations.find(c => c.clientId === selectedConv);
    const contact = contacts.find(c => c.id === selectedConv);
    const channel = conv?.channel || 'CHAT';

    // Fallbacks if sending to a direct number
    const toPhone = contact?.phone || selectedConv;
    const toEmail = contact?.email;

    if (channel === 'WHATSAPP') {
      try {
        const res = await fetchWithAuth('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: toPhone,
            message: inputMsg.trim(),
            clientName: conv?.clientName || 'Client',
            clientId: selectedConv,
          }),
        });
        if (!res.ok) console.error('WhatsApp send error:', (await res.json()).error);
      } catch (err) { console.error('WhatsApp send failed:', err); }
    } else if (channel === 'EMAIL' && toEmail) {
      try {
        const res = await fetchWithAuth('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toEmail, message: inputMsg.trim(), clientId: selectedConv, clientName: conv?.clientName || 'Client' }),
        });
        if (!res.ok) console.error('Email send error:', (await res.json()).error);
      } catch (err) { console.error('Email send failed:', err); }
    } else {
      await createMessage(tenantId!, {
        clientId: selectedConv,
        clientName: conv?.clientName || 'Client',
        channel: channel as any,
        direction: 'OUTBOUND',
        content: inputMsg.trim(),
        senderId: user?.uid || '',
        isRead: true,
      });
    }
    setInputMsg('');
    await loadData();
    setSending(false);
  };

  const handleNewConversation = async (contact: CRMContact) => {
    const channel = contact.email ? 'EMAIL' : contact.phone ? 'WHATSAPP' : 'CHAT';

    // Automatically send a welcome email if we go the email route
    if (channel === 'EMAIL') {
      await fetchWithAuth('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.email, message: 'Bonjour ! Comment puis-je vous aider ?', clientId: contact.id, clientName: contact.firstName }),
      });
    } else if (channel === 'WHATSAPP' && contact.phone) {
      await fetchWithAuth('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.phone, message: 'Bonjour ! Comment puis-je vous aider ?', clientName: contact.firstName }),
      });
    } else {
      await createMessage(tenantId!, {
        clientId: contact.id!,
        clientName: `${contact.firstName} ${contact.lastName}`,
        channel,
        direction: 'OUTBOUND',
        content: 'Bonjour ! Comment puis-je vous aider ?',
        senderId: user?.uid || '',
        isRead: true,
      });
    }

    setShowNewMsg(false);
    await loadData();
    setSelectedConv(contact.id!);
  };

  const handleNewWhatsApp = async () => {
    const phone = waPhone.replace(/[\s\-\+\(\)]/g, '');
    if (!phone || !waFirstMsg.trim()) return;
    setSending(true);
    try {
      await fetchWithAuth('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message: waFirstMsg.trim(), clientName: phone }),
      });
    } catch (err) { console.error('WhatsApp send failed:', err); }
    setShowNewMsg(false);
    setWaPhone('');
    await loadData();
    setSelectedConv(phone);
    setSending(false);
  };

  const selectedConvData = conversations.find(c => c.clientId === selectedConv);
  const filteredConvs = conversations.filter(c => c.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-luna-charcoal/30" size={28} />
        <span className="text-xs text-gray-400 font-normal">Chargement des messages...</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-white">
      {/* ─── Conversation List ─── */}
      <div className="w-[360px] border-r border-gray-100 flex flex-col bg-white">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-normal text-luna-charcoal tracking-tight">Messages</h2>
              <p className="text-[12px] text-gray-400 font-normal mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowNewMsg(true)}
              className="w-9 h-9 bg-luna-charcoal text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucune conversation</p>
              <p className="text-[12px] text-gray-300 mt-1">Cliquez + pour démarrer</p>
            </div>
          ) : filteredConvs.map(conv => {
            const ch = getChannelColor(conv.channel);
            const isActive = selectedConv === conv.clientId;
            return (
              <button
                key={conv.clientId}
                onClick={() => setSelectedConv(conv.clientId)}
                className={`w-full px-5 py-3.5 text-left transition-all border-l-[3px] ${isActive
                  ? 'bg-gray-50/80 border-l-luna-charcoal'
                  : 'border-l-transparent hover:bg-gray-50/50'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-normal shrink-0 ${conv.channel === 'WHATSAPP'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                    }`}>
                    {conv.clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] truncate ${isActive ? 'font-normal text-luna-charcoal' : 'font-normal text-gray-700'}`}>
                        {conv.clientName}
                      </span>
                      <span className="text-[12px] text-gray-400 shrink-0">{formatDate(conv.lastDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[12px] text-gray-400 truncate flex-1">{conv.lastMessage}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[12px] px-1.5 py-0.5 rounded-full font-normal ${ch.bg} ${ch.text}`}>
                          {ch.icon}
                        </span>
                        {conv.unread > 0 && (
                          <span className="min-w-[18px] h-[18px] bg-green-500 text-white rounded-full text-[12px] font-normal flex items-center justify-center px-1">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className="flex-1 flex flex-col">
        {selectedConvData ? (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-normal ${selectedConvData.channel === 'WHATSAPP'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-500'
                  }`}>
                  {selectedConvData.clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[15px] font-normal text-luna-charcoal leading-tight">{selectedConvData.clientName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(() => {
                      const ch = getChannelColor(selectedConvData.channel);
                      return (
                        <span className={`text-[12px] px-2 py-0.5 rounded-full font-normal ${ch.bg} ${ch.text} ${ch.border} border`}>
                          {ch.icon} {ch.label}
                        </span>
                      );
                    })()}
                    <span className="text-[12px] text-gray-300">•</span>
                    <span className="text-[12px] text-gray-400">{selectedConvData.messages.length} message{selectedConvData.messages.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              {selectedConvData.channel === 'WHATSAPP' && (
                <a href={`https://wa.me/${selectedConvData.clientId}`} target="_blank" rel="noopener"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-normal text-green-600 bg-green-50 hover:bg-green-100 transition-colors border border-green-100">
                  <Phone size={12} />
                  Ouvrir WhatsApp
                </a>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6"
              style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f1f3 100%)' }}>
              <div className="max-w-3xl mx-auto space-y-3">
                {selectedConvData.messages.map((msg, idx) => {
                  const isOutbound = msg.direction === 'OUTBOUND';
                  const time = formatTime(msg.createdAt);
                  const prevMsg = idx > 0 ? selectedConvData.messages[idx - 1] : null;
                  const showDate = !prevMsg || formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt);

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[12px] text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100 font-normal">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[65%] group relative ${isOutbound ? 'order-1' : 'order-0'}`}>
                          <div className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${isOutbound
                            ? 'bg-luna-charcoal text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                            }`}>
                            {msg.content}
                            <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[12px] ${isOutbound ? 'text-white/50' : 'text-gray-300'}`}>{time}</span>
                              {isOutbound && (
                                <CheckCheck size={11} className="text-white/40" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                    placeholder="Écrire un message..."
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white transition-all"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-400 transition-colors">
                    <Smile size={18} />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputMsg.trim() || sending}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${inputMsg.trim()
                    ? 'bg-luna-charcoal text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-300'
                    }`}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f1f3 100%)' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-normal text-gray-400">Sélectionnez une conversation</p>
              <p className="text-[12px] text-gray-300 mt-1">Ou créez-en une nouvelle avec le bouton +</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── New Conversation Modal ─── */}
      {showNewMsg && (
        <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={() => setShowNewMsg(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Luna Header */}
            <div className="p-7 pb-4 bg-luna-charcoal text-white">
              <h2 className="text-xl font-light tracking-tight">Nouvelle Conversation</h2>
              <p className="text-[#b9dae9] text-xs mt-1 font-medium">Choisissez un canal pour démarrer</p>
            </div>
            <div className="p-7 pt-5">

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-50 rounded-xl p-1 ">
              <button
                onClick={() => setWaTab('whatsapp')}
                className={`flex-1 py-2.5 text-[12px] font-normal rounded-lg transition-all ${waTab === 'whatsapp' ? 'bg-white shadow-sm text-green-600 border border-gray-100' : 'text-gray-400 hover:text-gray-500'
                  }`}
              >
                <MessageCircle size={12} /> WhatsApp
              </button>
              <button
                onClick={() => setWaTab('contact')}
                className={`flex-1 py-2.5 text-[12px] font-normal rounded-lg transition-all ${waTab === 'contact' ? 'bg-white shadow-sm text-luna-charcoal border border-gray-100' : 'text-gray-400 hover:text-gray-500'
                  }`}
              >
                <User size={12} /> Contact CRM
              </button>
            </div>

            {waTab === 'whatsapp' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] uppercase tracking-wider font-normal text-gray-400 mb-1.5 block">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="33637930698"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-green-300 focus:bg-white transition-all"
                  />
                  <p className="text-[12px] text-gray-300 mt-1.5">Indicatif pays + numéro (sans +, espaces ou tirets)</p>
                </div>
                <div>
                  <label className="text-[12px] uppercase tracking-wider font-normal text-gray-400 mb-1.5 block">Premier message</label>
                  <textarea
                    value={waFirstMsg}
                    onChange={e => setWaFirstMsg(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-green-300 focus:bg-white transition-all resize-none h-24"
                  />
                </div>
                <button
                  onClick={handleNewWhatsApp}
                  disabled={!waPhone.trim() || sending}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-normal text-sm rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                  Envoyer via WhatsApp
                </button>
              </div>
            ) : (
              contacts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6B7280] mt-1 font-medium">Aucun contact trouvé</p>
                  <p className="text-[12px] text-gray-300 mt-1">Ajoutez d&apos;abord un contact dans le CRM</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {contacts.map(ct => (
                    <button
                      key={ct.id}
                      onClick={() => handleNewConversation(ct)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all text-left"
                    >
                      <div className="w-9 h-9 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-normal text-[12px]">
                        {ct.firstName[0]}{ct.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-normal text-luna-charcoal truncate">{ct.firstName} {ct.lastName}</p>
                        <p className="text-[12px] text-gray-400 truncate">{ct.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
