"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import ConfirmModal from '@/src/components/ConfirmModal';
import {
  Plus,
  MoreHorizontal,
  MessageSquare,
  Clock,
  Globe,
  RefreshCcw,
  X,
  CheckCircle2,
  Calendar,
  Plane,
  ChevronDown,
  ChevronLeft,
  Trash2,
  Users,
  MapPin,
  Bot,
  ShoppingBag,
  Hotel,
  FileText,
  Map,
  Palette,
  ClipboardList,
} from "lucide-react";
import {
  getLeads,
  createLead,
  updateLeadStatus,
  updateLead,
  deleteLead,
  createTrip,
  createActivity,
  createQuoteFromLead,
  createInvoice,
  CRMLead,
} from "@/src/lib/firebase/crm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import { T, useAutoTranslate } from "@/src/components/T";

const STAGES = ["NOUVEAU", "IA EN COURS", "DEVIS ENVOYÉ", "GAGNÉ"] as const;

const stageToStatus: Record<string, CRMLead["status"]> = {
  NOUVEAU: "NEW",
  "IA EN COURS": "ANALYSING",
  "DEVIS ENVOYÉ": "PROPOSAL_READY",
  GAGNÉ: "WON",
};

const mapStatusToStage = (status: string) => {
  switch (status) {
    case "NEW":
      return "NOUVEAU";
    case "ANALYSING":
      return "IA EN COURS";
    case "PROPOSAL_READY":
    case "PROPOSAL_SENT":
      return "DEVIS ENVOYÉ";
    case "WON":
      return "GAGNÉ";
    default:
      return "NOUVEAU";
  }
};

const formatBudget = (b: string | number | undefined) => {
  if (!b) return "À définir";
  const str = String(b);
  const num = parseInt(str.replace(/[^\d]/g, ""));
  if (isNaN(num) || num === 0) return str;
  const suffix = str.replace(/[\d\s.,]/g, "").trim();
  return `${num.toLocaleString("fr-FR")} ${suffix ? suffix : "EUR"}`;
};

const formatCreatedAt = (ts: any): string => {
  if (!ts) return '';
  let date: Date;
  if (ts?.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    date = new Date(ts);
  }
  if (isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} à ${time}`;
};

export default function CRMPipeline() {
  const router = useRouter();
  const { tenantId } = useAuth();
  const at = useAutoTranslate();
  const [deals, setDeals] = useState<any[]>([]);
  const [editDeal, setEditDeal] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wonModal, setWonModal] = useState<{ deal: any } | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});
  const [newDeal, setNewDeal] = useState({
    clientName: "",
    destination: "",
    dates: "",
    budget: "",
    pax: "",
  });

  // Determine if a deal is a prestation request vs a voyage request
  const isDealPrestation = (deal: any): boolean => {
    if (deal.cartItems && deal.cartItems.length > 0) return true;
    if (deal.source && (deal.source.includes('Prestation') || deal.source.includes('prestation'))) return true;
    return false;
  };

  // Build the correct agent URL based on deal type — routes through /crm/agent-ia
  const getAgentUrl = (deal: any): string => {
    if (isDealPrestation(deal)) {
      return `/crm/agent-ia?agent=prestations&clientName=${encodeURIComponent(deal.clientName || '')}&clientId=${encodeURIComponent(deal.clientId || '')}`;
    }
    return `/crm/agent-ia?agent=voyage&dest=${encodeURIComponent(deal.destination)}&pax=${encodeURIComponent(deal.pax || '2')}&budget=${encodeURIComponent(deal.budget)}&vibe=${encodeURIComponent(deal.vibe || '')}&notes=${encodeURIComponent(deal.mustHaves || '')}&clientName=${encodeURIComponent(deal.clientName || '')}&clientId=${encodeURIComponent(deal.clientId || '')}`;
  };

  const toggleColumn = (stage: string) => {
    setCollapsedCols(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead(tenantId!, {
        clientName: newDeal.clientName,
        destination: newDeal.destination,
        dates: newDeal.dates,
        budget: newDeal.budget,
        pax: newDeal.pax,
        status: "NEW",
      });
      setIsModalOpen(false);
      setNewDeal({
        clientName: "",
        destination: "",
        dates: "",
        budget: "",
        pax: "",
      });
      loadLeads();
    } catch (error) {
      console.error("Failed to add deal:", error);
    }
  };

  const loadLeads = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const leads = await getLeads(tenantId);
      setDeals(
        leads.map((l) => ({
          id: l.id,
          client: l.clientName || "Client Inconnu",
          destination: l.destination || "Non définie",
          budget: l.budget || "À définir",
          days: l.days || 7,
          stage: mapStatusToStage(l.status),
          status: l.status,
          links: l.links || [],
          dates: l.dates,
          pax: l.pax,
          clientId: l.clientId,
          clientName: l.clientName,
          tripId: l.tripId,
          agentResults: l.agentResults,
          vibe: l.vibe,
          mustHaves: l.mustHaves,
          createdAt: l.createdAt,
          source: l.source,
          cartItems: l.cartItems,
        })),
      );
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [tenantId]);

  // Move deal to a stage
  const moveToStage = async (dealId: string, targetStage: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    const newStatus = stageToStatus[targetStage];
    if (!newStatus) return;

    await updateLeadStatus(tenantId!, dealId, newStatus);

    // If moving to DEVIS ENVOYÉ → auto-create quote from lead
    if (targetStage === "DEVIS ENVOYÉ") {
      try {
        const leadData = { ...deal, id: dealId, status: newStatus } as CRMLead;
        await createQuoteFromLead(tenantId!, leadData);
      } catch (err) {
        console.error("Quote creation error:", err);
      }
    }

    // If moving to GAGNÉ → open trip creation modal + auto-generate invoice
    if (targetStage === "GAGNÉ") {
      setWonModal({ deal });
      // Auto-generate invoice from deal budget
      try {
        const budgetNum = parseInt(String(deal.budget).replace(/[^\d]/g, '') || '0');
        if (budgetNum > 0) {
          await createInvoice(tenantId!, {
            invoiceNumber: `INV-B2C-${Date.now().toString(36).toUpperCase()}`,
            tripId: deal.tripId || '',
            clientId: deal.clientId || '',
            clientName: deal.client || deal.clientName || 'Client',
            items: (deal.cartItems || []).map((item: any) => ({
              description: item.name || deal.destination,
              quantity: 1,
              unitPrice: typeof item.clientPrice === 'number' ? item.clientPrice : budgetNum,
              total: typeof item.clientPrice === 'number' ? item.clientPrice : budgetNum,
              taxRate: 0,
            })),
            totalAmount: budgetNum,
            subtotal: budgetNum,
            taxTotal: 0,
            currency: 'EUR',
            issueDate: new Date().toISOString().split('T')[0],
            amountPaid: deal.paymentStatus === 'PAID' ? budgetNum : 0,
            status: deal.paymentStatus === 'PAID' ? 'PAID' : 'SENT',
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            notes: `Auto-générée depuis le pipeline (${deal.destination})`,
          });
        }
      } catch (err) {
        console.error('Auto-invoice error:', err);
      }
    }

    loadLeads();
  };

  const handleDeleteDeal = async (dealId: string, dealName: string) => {
    setDeleteTarget({id: dealId, name: dealName});
  };

  const confirmDeleteDeal = async () => {
    if (!tenantId || !deleteTarget) return;
    try {
      await deleteLead(tenantId, deleteTarget.id);
      loadLeads();
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  // Auto-create trip + activity when deal is won
  const handleCreateTrip = async () => {
    if (!wonModal) return;
    const d = wonModal.deal;
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 14 * 86400000)
      .toISOString()
      .split("T")[0];

    try {
      const tripId = await createTrip(tenantId!, {
        title: `${d.destination} — ${d.client}`,
        destination: d.destination,
        clientName: d.client,
        clientId: d.clientId || "",
        startDate: today,
        endDate: nextWeek,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        amount: parseInt(d.budget?.replace(/[^\d]/g, "") || "0") || 0,
        notes: `Depuis pipeline. Pax: ${d.pax || "N/A"}. Dates: ${d.dates || "À définir"}`,
        color: "#22c55e",
      });

      // Save tripId back to lead
      await updateLead(tenantId!, d.id, { tripId: tripId });

      // Auto-create follow-up activity
      await createActivity(tenantId!, {
        title: `Organiser le voyage ${d.destination} pour ${d.client}`,
        time: "Cette semaine",
        type: "meeting",
        status: "PENDING",
        color: "emerald",
        iconName: "Calendar",
        contactId: d.clientId || "",
        contactName: d.client,
        leadId: d.id,
        tripId: tripId,
      });

      setWonModal(null);
      router.push("/crm/planning");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col relative space-y-8  pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">
              <T>Pipeline</T>
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium hidden sm:block">
              <T>Gérez vos leads du premier contact au closing.</T>
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={loadLeads}
              className="bg-white border border-luna-warm-gray/30 hover:bg-luna-cream text-luna-charcoal font-normal px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <RefreshCcw
                size={16}
                className={
                  loading
                    ? "animate-spin text-luna-accent"
                    : "text-luna-text-muted"
                }
              />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-luna-charcoal hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-normal transition-all flex items-center gap-2"
            >
              <Plus size={16} />{" "}
              <span className="hidden sm:inline">
                <T>Ajouter</T>
              </span>
              <span className="sm:hidden">
                <T>Ajouter</T>
              </span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 relative z-10">
          {STAGES.map((stage) => {
            const stageDeals = deals
              .filter((d) => d.stage === stage)
              .sort((a, b) => {
                const dateA = a.createdAt?.seconds
                  ? a.createdAt.seconds
                  : a.createdAt
                    ? new Date(a.createdAt).getTime() / 1000
                    : 0;
                const dateB = b.createdAt?.seconds
                  ? b.createdAt.seconds
                  : b.createdAt
                    ? new Date(b.createdAt).getTime() / 1000
                    : 0;
                return dateB - dateA;
              });

            let columnBg = "bg-[#F8F9FA]";
            let headerBadge = "bg-gray-200 text-gray-700";
            let columnBorder = "border-transparent";

            if (stage === "NOUVEAU") {
              columnBg = "bg-[#F5F8FF]";
              headerBadge = "bg-blue-100 text-blue-700";
              columnBorder = "border-blue-100/50";
            }
            if (stage === "IA EN COURS") {
              columnBg = "bg-[#FDF8F5]";
              headerBadge = "bg-orange-100 text-orange-700";
              columnBorder = "border-orange-100/50";
            }
            if (stage === "DEVIS ENVOYÉ") {
              columnBg = "bg-[#F9F5F9]";
              headerBadge = "bg-purple-100 text-purple-700";
              columnBorder = "border-purple-100/50";
            }
            if (stage === "GAGNÉ") {
              columnBg = "bg-[#F4FBF7]";
              headerBadge = "bg-emerald-100 text-emerald-700";
              columnBorder = "border-emerald-100/50";
            }

            const isCollapsed = collapsedCols[stage] || false;

            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("dealId");
                  if (id) moveToStage(id, stage);
                }}
                className={`rounded-[24px] border flex flex-col transition-all duration-300 ${columnBg} ${columnBorder} ${isCollapsed
                  ? 'min-w-[56px] max-w-[56px] p-2 cursor-pointer'
                  : 'flex-1 min-w-[260px] md:min-w-[320px] p-3 md:p-4'
                  }`}
                onClick={isCollapsed ? () => toggleColumn(stage) : undefined}
              >
                {/* Column Header */}
                <div className={`flex items-center mb-5 px-2 ${isCollapsed ? 'flex-col gap-3' : 'justify-between'
                  }`}>
                  {isCollapsed ? (
                    /* Collapsed: vertical label */
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleColumn(stage); }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Développer"
                      >
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${headerBadge}`}>
                        {stageDeals.length}
                      </span>
                      <span className="[writing-mode:vertical-lr] text-[11px] font-bold text-[#2E2E2E] tracking-wider rotate-180">
                        {at(stage)}
                      </span>
                    </>
                  ) : (
                    /* Expanded header */
                    <>
                      <h3 className="font-bold text-[#2E2E2E] text-sm tracking-wide flex items-center gap-2">
                        {at(stage)}
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${headerBadge}`}
                        >
                          {stageDeals.length}
                        </span>
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleColumn(stage)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
                          title="Réduire"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Column content — hidden when collapsed */}
                {!isCollapsed && <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {stageDeals.length === 0 && !loading && (
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-[20px] text-gray-400 text-sm font-medium mt-2">
                      <T>Aucun deal dans cette étape</T>
                    </div>
                  )}

                  {stageDeals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      layoutId={deal.id}
                      draggable
                      onDragStart={(e) =>
                        (e as any).dataTransfer.setData("dealId", deal.id)
                      }
                      className="bg-white p-5 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 cursor-grab hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#bcdeea]/50 transition-all duration-300 group"
                    >
                      {/* ── Header: Destination + Badges ── */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-[#bcdeea]/30 text-[#2E2E2E] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                            {deal.destination}
                          </span>
                          {deal.source && (deal.source.includes('Espace Client') || deal.source.includes('Stripe')) && (
                            <span className="bg-[#bcdeea]/20 text-[#5a8fa3] text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#bcdeea]/25">
                              B2C
                            </span>
                          )}
                          {/* Type badge: Voyage or Prestation */}
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isDealPrestation(deal)
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                            : 'bg-sky-50 text-sky-600 border border-sky-200/50'
                            }`}>
                            <span className="flex items-center gap-1">{isDealPrestation(deal) ? <><Palette size={11} /> Prestation</> : <><Plane size={11} /> <T>Nouveau Voyage</T></>}</span>
                          </span>
                        </div>
                      </div>

                      {/* ── Date & heure de la demande ── */}
                      {deal.createdAt && (
                        <p className="text-[10px] text-gray-400 font-medium mb-2 flex items-center gap-1">
                          <Calendar size={10} className="text-gray-300" />
                          Reçu le {formatCreatedAt(deal.createdAt)}
                        </p>
                      )}

                      {/* ── Client Name ── */}
                      {deal.clientId ? (
                        <Link
                          href={`/crm/clients/${deal.clientId}`}
                          className="font-bold text-[#2E2E2E] hover:text-[#5a8fa3] mb-1 block text-[15px] leading-tight transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deal.client}
                        </Link>
                      ) : (
                        <h4 className="font-bold text-[#2E2E2E] mb-1 text-[15px] leading-tight">
                          {deal.client}
                        </h4>
                      )}
                      <p className="text-[#5a8fa3] font-semibold text-sm mb-1">
                        {formatBudget(deal.budget)}
                      </p>

                      {/* ── Quick Info Row (always visible) ── */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {deal.dates && (
                          <span className="text-[10px] font-medium bg-gray-50 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                            <Calendar size={10} className="text-gray-400" />
                            {deal.dates}
                          </span>
                        )}
                        {deal.pax && (
                          <span className="text-[10px] font-bold bg-[#E2C8A9]/20 text-[#8B6E4E] px-2 py-1 rounded-md flex items-center gap-1">
                            <Users size={10} />
                            {deal.pax}
                          </span>
                        )}
                        {deal.vibe && (
                          <span className="text-[10px] font-semibold bg-[#bcdeea]/15 text-[#5a8fa3] px-2 py-1 rounded-md border border-[#bcdeea]/20">
                            {deal.vibe}
                          </span>
                        )}
                      </div>

                      {/* Sujet / Message bref */}
                      {deal.mustHaves && (
                        <p className="text-[11px] text-gray-500 mb-3 leading-snug line-clamp-3 italic">
                          « {deal.mustHaves} »
                        </p>
                      )}

                      <details className="mt-2 mb-4 group cursor-pointer">
                        <summary className="list-none flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-100 pt-3 pb-1 hover:text-[#2E2E2E] transition-colors">
                          Voir la demande
                          <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="pt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Message Exact Demandé */}
                          {deal.mustHaves && (
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><MessageSquare size={10} /> Message Reçu</p>
                              <p className="text-xs text-gray-600 bg-[#F5F3F0]/50 border border-[#F0EBE3] p-2.5 rounded-lg italic leading-relaxed">"{deal.mustHaves}"</p>
                            </div>
                          )}

                          {/* Dates de voyage */}
                          {deal.dates && (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg w-fit border border-gray-100">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="font-medium">{deal.dates}</span>
                            </div>
                          )}

                          {/* Pax & Vibe */}
                          {(deal.pax || deal.vibe) && (
                            <div className="flex flex-wrap gap-1.5">
                              {deal.pax && (
                                <span className="text-[10px] font-bold bg-[#E2C8A9]/20 text-[#8B6E4E] px-2 py-1 rounded-md">
                                  {deal.pax}
                                </span>
                              )}
                              {deal.vibe && (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md">
                                  {deal.vibe}
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── Panier Espace Client ── */}
                          {deal.cartItems && deal.cartItems.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                Panier Demandé
                                <span className="h-px bg-gray-100 flex-1"></span>
                              </p>
                              <div className="space-y-2">
                                {deal.cartItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                    {item.images?.[0] && (
                                      <img src={item.images[0]} alt={item.name} className="w-10 h-10 rounded shadow-sm object-cover" />
                                    )}
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                      <span className="text-[11px] font-bold text-luna-charcoal truncate">{item.name}</span>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9px] text-gray-400 truncate tracking-wider uppercase">{item.location || 'Sur mesure'}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── Résultats IA (Devis) ── */}
                          {deal.agentResults && (
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                Résultats IA{" "}
                                <span className="h-px bg-gray-100 flex-1"></span>
                              </p>
                              <div className="space-y-1 mb-3">
                                {deal.agentResults.transport?.flights?.length > 0 && (
                                  <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-sky-50 rounded-md">
                                      <Plane size={11} className="text-sky-500" />
                                    </span>
                                    {deal.agentResults.transport.flights.length}{" "}
                                    vol(s) trouvé(s)
                                  </p>
                                )}
                                {deal.agentResults.accommodation?.hotels?.length >
                                  0 && (
                                    <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                      <span className="w-5 h-5 flex items-center justify-center bg-orange-50 rounded-md">
                                        <Hotel size={12} />
                                      </span>{" "}
                                      {deal.agentResults.accommodation.hotels.length}{" "}
                                      hôtel(s)
                                    </p>
                                  )}
                                {deal.agentResults.itinerary?.days?.length > 0 && (
                                  <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded-md">
                                      <Calendar size={12} />
                                    </span>{" "}
                                    {deal.agentResults.itinerary.days.length} jours
                                    d'itinéraire
                                  </p>
                                )}
                              </div>
                              <Link
                                href={`/crm/leads/${deal.id}/proposal`}
                                className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#bcdeea]/15 hover:bg-[#bcdeea]/30 text-[#2E2E2E] border border-[#bcdeea]/30 text-xs rounded-xl transition-all font-semibold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ClipboardList size={13} className="inline mr-1" /> Voir le Devis Complet
                              </Link>
                            </div>
                          )}

                          {/* ── Liens Web IA ── */}
                          {deal.links && deal.links.length > 0
                            ? (() => {
                              const linkId = `links-${deal.id}`;
                              // Group links by category — activities start with "J" + digit (J1, J2...)
                              const isActivity = (t: string) => /^J\d+\s/.test(t);
                              const flights = deal.links.filter(
                                (l: any) =>
                                  l.title.includes(" - ") && !isActivity(l.title),
                              );
                              const hotels = deal.links.filter(
                                (l: any) =>
                                  !l.title.includes(" - ") && !isActivity(l.title),
                              );
                              const activities = deal.links.filter((l: any) =>
                                isActivity(l.title),
                              );
                              const groups = [
                                { label: "Vols", items: flights },
                                { label: "Hôtels", items: hotels },
                                { label: "Activités", items: activities },
                              ].filter((g) => g.items.length > 0);

                              return (
                                <div className="pt-2 border-t border-gray-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const el = document.getElementById(linkId);
                                      if (el) el.classList.toggle("hidden");
                                      (
                                        e.currentTarget.querySelector(
                                          ".chevron-links",
                                        ) as HTMLElement
                                      )?.classList.toggle("rotate-0");
                                    }}
                                    className="flex items-center justify-between w-full text-left mb-1"
                                  >
                                    <p className="text-[12px] text-gray-400 font-normal uppercase flex items-center gap-2">
                                      Résultats Web IA
                                      <span className="text-[12px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-normal normal-case">
                                        {deal.links.length}
                                      </span>
                                    </p>
                                    <ChevronDown
                                      size={12}
                                      className="chevron-links text-gray-300 -rotate-90 transition-transform duration-200"
                                    />
                                  </button>
                                  <div
                                    id={linkId}
                                    className="hidden space-y-3 mt-1"
                                  >
                                    {groups.map((group, gIdx) => (
                                      <div key={gIdx}>
                                        <p className="text-[12px] font-normal text-gray-400 mb-1">
                                          {group.label}{" "}
                                          <span className="text-gray-300">
                                            ({group.items.length})
                                          </span>
                                        </p>
                                        <div className="space-y-1">
                                          {group.items.map(
                                            (link: any, idx: number) => (
                                              <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs flex items-center gap-1 text-luna-accent-dark font-normal hover:underline bg-luna-accent/10 px-2 py-1 flex-wrap rounded-md"
                                              >
                                                <Globe size={12} /> {link.title}
                                              </a>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()
                            : null}
                        </div>
                      </details>

                      {/* Quick access links */}
                      <div className="mb-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 mt-auto">
                        {/* Agent button — routes to correct agent based on deal type */}
                        <Link
                          href={getAgentUrl(deal)}
                          className={`flex-1 py-2 text-center border text-[11px] rounded-xl transition-colors font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${isDealPrestation(deal)
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300'
                            : 'bg-gray-50 hover:bg-sky-50 text-sky-600 border-gray-100 hover:border-sky-200'
                            }`}
                        >
                          {isDealPrestation(deal) ? (
                            <><ShoppingBag size={12} /> {deal.agentResults ? 'Relancer' : 'Agent Presta'}</>
                          ) : (
                            <><Bot size={12} /> {deal.agentResults ? 'Relancer' : 'Agent Voyage'}</>
                          )}
                        </Link>
                        {/* Link to trip if won */}
                        {deal.tripId && (
                          <Link
                            href={`/crm/trips/${deal.tripId}/itinerary`}
                            className="flex-1 py-2 text-center bg-[#bcdeea]/20 hover:bg-[#bcdeea]/40 text-[#2E2E2E] border border-[#bcdeea]/30 text-[11px] rounded-xl transition-all font-bold uppercase tracking-wider"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Map size={13} className="inline mr-1" /> Voyage
                          </Link>
                        )}
                      </div>

                      {/* Stage move buttons */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {STAGES.filter((s) => s !== deal.stage).map((s) => (
                            <button
                              key={s}
                              onClick={() => moveToStage(deal.id, s)}
                              className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all border whitespace-nowrap
                              ${s === "GAGNÉ"
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                  : s === "DEVIS ENVOYÉ"
                                    ? "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100"
                                    : s === "IA EN COURS"
                                      ? "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100"
                                      : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                                }`}
                            >
                              {s === "GAGNÉ"
                                ? "✓ Gagné"
                                : s === "DEVIS ENVOYÉ"
                                  ? "Devis"
                                  : s === "IA EN COURS"
                                    ? "IA"
                                    : "Nouveau"}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 pl-2">
                          <button
                            draggable={false}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteDeal(deal.id, deal.client || deal.destination);
                            }}
                            className="text-gray-300 hover:text-red-500 p-2 rounded-xl transition-colors hover:bg-red-50"
                            title="Supprimer ce deal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>}
              </div>
            );
          })}
        </div>

        {/* Modal Ajout Deal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Luna Header */}
              <div className="p-8 pb-5 bg-luna-charcoal text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-light tracking-tight">
                      <T>Nouveau Lead</T>
                    </h2>
                    <p className="text-[#b9dae9] text-xs mt-1 font-medium">Pipeline commerciale Luna</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleAddDeal} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Client (Nom complet)
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newDeal.clientName}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, clientName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Destination
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newDeal.destination}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, destination: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                      Dates Estimées
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Été 2025"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                      value={newDeal.dates}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, dates: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                      Budget Global
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 15 000 €"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                      value={newDeal.budget}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, budget: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Nombre Passagers (Pax)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2 Adultes, 1 Enfant"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-luna-accent/30 font-normal text-gray-900"
                    value={newDeal.pax}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, pax: e.target.value })
                    }
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-luna-charcoal font-normal hover:bg-luna-cream transition-colors"
                  >
                    <T>Annuler</T>
                  </button>
                  <button
                    type="submit"
                    className="bg-luna-charcoal hover:bg-gray-800 text-white font-normal px-5 py-2.5 rounded-xl transition-all"
                  >
                    Créer le Deal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Won → Create Trip */}
        <AnimatePresence>
          {wonModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-luna-charcoal/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
              onClick={() => setWonModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-[24px] w-full max-w-md shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden border border-[#bcdeea]/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#bcdeea]/15 p-6 border-b border-[#bcdeea]/25 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#5a8fa3] text-white flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <h2 className="font-serif text-xl font-normal text-[#2E2E2E]">
                    Deal {at("GAGNÉ")} !
                  </h2>
                  <p className="text-[#5a8fa3] text-sm mt-1">
                    {wonModal.deal.destination} — {wonModal.deal.client}
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-luna-text-muted text-sm mb-5">
                    Voulez-vous créer automatiquement un{" "}
                    <strong>voyage dans le Planning</strong> et une{" "}
                    <strong>tâche de suivi</strong> ?
                  </p>
                  <div className="bg-[#bcdeea]/10 rounded-xl p-4 mb-5 border border-[#bcdeea]/20 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#2E2E2E]">
                      <Plane size={14} />{" "}
                      <span>
                        Trip :{" "}
                        <strong>
                          {wonModal.deal.destination} — {wonModal.deal.client}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2E2E2E]">
                      <Calendar size={14} />{" "}
                      <span>
                        Tâche : <strong>Organiser le voyage</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWonModal(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-luna-charcoal font-normal hover:bg-luna-cream transition-colors border border-luna-warm-gray/20"
                    >
                      Non merci
                    </button>
                    <button
                      onClick={handleCreateTrip}
                      className="flex-1 px-4 py-2.5 bg-[#5a8fa3] hover:bg-[#4a7f93] text-white font-normal rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Créer tout
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
