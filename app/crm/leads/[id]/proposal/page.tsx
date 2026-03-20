"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  Plane,
  Hotel,
  Map,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  Star,
  Globe,
  Eye,
  Mail,
  Lightbulb,
  Sparkles,
  Check,
  Percent,
  Plus,
  Minus,
  MessageCircle,
  Phone,
  Smartphone,
  AlertCircle,
  Save,
  MapPin,
  Car,
  UtensilsCrossed,
  FileDown,
} from "lucide-react";
import {
  CRMLead,
  getLeads,
  CRMContact,
  getContacts,
  createQuote,
  updateLeadStatus,
  updateContact,
  updateLead,
} from "@/src/lib/firebase/crm";
import { useAuth } from "@/src/contexts/AuthContext";
import { fetchWithAuth } from "@/src/lib/utils/fetchWithAuth";

// -- Luna SVG logo for email (dark on white) --
const LUNA_SVG_INLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="320 340 910 280" width="180" height="56" style="display:block;margin:0 auto;">
  <g fill="#1e293b" fill-rule="evenodd" clip-rule="evenodd">
    <path d="M 518 356 L 517 523 L 520 540 L 530 562 L 547 581 L 560 590 L 589 601 L 608 603 L 629 601 L 650 595 L 665 587 L 679 576 L 691 561 L 699 545 L 703 529 L 704 357 L 702 355 L 697 357 L 697 524 L 692 545 L 680 565 L 654 586 L 630 594 L 605 596 L 585 593 L 558 581 L 538 562 L 528 543 L 524 528 L 524 358 L 521 355 Z"/>
    <path d="M 334 355 L 332 357 L 332 549 L 335 562 L 343 577 L 358 591 L 382 600 L 502 600 L 502 594 L 381 593 L 361 585 L 347 571 L 342 562 L 338 546 L 338 357 Z"/>
    <path d="M 767 361 L 757 373 L 753 387 L 753 598 L 760 598 L 761 419 L 868 574 L 883 591 L 910 603 L 927 602 L 941 595 L 953 578 L 956 558 L 959 358 L 952 358 L 948 563 L 921 529 L 821 370 L 808 358 L 796 354 L 782 354 Z M 773 365 L 782 361 L 788 360 L 797 361 L 806 365 L 815 373 L 831 401 L 917 535 L 925 546 L 940 561 L 944 570 L 944 577 L 942 583 L 935 591 L 924 596 L 905 595 L 890 588 L 881 580 L 783 441 L 763 410 L 760 398 L 761 382 L 765 373 Z"/>
    <path d="M 1091 355 L 1085 358 L 1075 368 L 1071 375 L 997 568 L 996 575 L 998 586 L 1004 595 L 1015 602 L 1036 604 L 1057 596 L 1067 586 L 1074 573 L 1087 581 L 1099 584 L 1121 582 L 1136 574 L 1144 588 L 1149 593 L 1163 601 L 1176 604 L 1201 602 L 1210 597 L 1214 592 L 1217 584 L 1216 574 L 1141 377 L 1136 368 L 1127 359 L 1120 355 L 1108 352 Z M 1098 499 L 1113 499 L 1114 500 L 1117 500 L 1118 501 L 1120 501 L 1121 502 L 1122 502 L 1123 503 L 1130 506 L 1141 517 L 1141 518 L 1145 525 L 1145 527 L 1146 528 L 1146 532 L 1147 533 L 1147 543 L 1146 544 L 1146 547 L 1145 548 L 1145 550 L 1144 551 L 1144 553 L 1143 554 L 1142 557 L 1140 559 L 1140 560 L 1129 571 L 1128 571 L 1121 575 L 1118 575 L 1117 576 L 1115 576 L 1114 577 L 1108 577 L 1107 578 L 1105 578 L 1104 577 L 1097 577 L 1096 576 L 1093 576 L 1092 575 L 1090 575 L 1089 574 L 1087 574 L 1086 573 L 1083 572 L 1081 570 L 1080 570 L 1072 562 L 1072 561 L 1070 559 L 1070 558 L 1066 551 L 1066 548 L 1065 547 L 1065 540 L 1064 539 L 1064 537 L 1065 536 L 1065 529 L 1066 528 L 1067 523 L 1068 522 L 1070 517 L 1078 508 L 1079 508 L 1084 504 L 1085 504 L 1088 502 L 1093 501 L 1094 500 L 1097 500 Z M 1093 361 L 1101 359 L 1117 361 L 1124 365 L 1134 377 L 1210 576 L 1210 585 L 1201 595 L 1189 598 L 1174 597 L 1158 591 L 1149 584 L 1142 568 L 1153 546 L 1153 529 L 1150 520 L 1137 503 L 1125 496 L 1108 492 L 1088 495 L 1075 502 L 1064 514 L 1058 529 L 1058 546 L 1068 568 L 1064 579 L 1056 588 L 1044 595 L 1027 598 L 1015 595 L 1005 586 L 1003 580 L 1004 568 L 1075 383 L 1083 369 Z"/>
  </g>
</svg>`;

// Parse price string to number (e.g., "890 €" → 890, "À partir de 6 500 €/pers" → 6500)
function parsePrice(p: string | number | undefined): number {
  if (typeof p === "number") return p;
  if (!p) return 0;
  const cleaned = p.replace(/[^\d]/g, "");
  return parseInt(cleaned) || 0;
}
function formatPrice(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

export default function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leadId } = use(params);
  const { tenantId, user, userProfile } = useAuth();
  const router = useRouter();
  const [lead, setLead] = useState<CRMLead | null>(null);
  const [client, setClient] = useState<CRMContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [sendingChannel, setSendingChannel] = useState<"EMAIL" | "WHATSAPP">(
    "EMAIL",
  );
  const [showPreview, setShowPreview] = useState(false);

  // Quote Builder State
  const [selectedFlights, setSelectedFlights] = useState<Set<number>>(
    new Set(),
  );
  const [selectedHotels, setSelectedHotels] = useState<Set<number>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedRecos, setSelectedRecos] = useState<Set<number>>(new Set());
  const [selectedTransfers, setSelectedTransfers] = useState<Set<number>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<number>>(new Set());
  const [marginPercent, setMarginPercent] = useState(35); // Default 35% margin — agent searches at 65% of client budget
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({}); // key: "flight-0", "hotel-2", "transfer-1"
  const [hotelNights, setHotelNights] = useState<Record<number, number>>({}); // per-hotel night overrides

  // Global parameters for calculations
  const [globalNights, setGlobalNights] = useState<number>(7);
  const [globalPax, setGlobalPax] = useState<number>(2);

  // Get effective nights for a specific hotel
  // When multiple hotels are selected and no manual override exists, auto-split nights equally
  const getHotelNights = (hotelIndex: number): number => {
    if (hotelNights[hotelIndex] !== undefined) return hotelNights[hotelIndex];
    // Auto-split: if 2+ hotels selected, divide total nights equally
    const selectedCount = selectedHotels.size;
    if (selectedCount > 1) {
      return Math.ceil(globalNights / selectedCount);
    }
    return globalNights;
  };

  useEffect(() => {
    loadData();
  }, [leadId, tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const allLeads = await getLeads(tenantId);
      const foundLead = allLeads.find((l) => l.id === leadId);
      if (foundLead) {
        setLead(foundLead);
        if (foundLead.clientId) {
          const contacts = await getContacts(tenantId);
          const c = contacts.find((ct) => ct.id === foundLead.clientId);
          if (c) {
            setClient(c);
            setEmailTo(c.email || "");
            setWhatsappPhone(c.phone || "");
            if (c.communicationPreference === "WHATSAPP") {
              setSendingChannel("WHATSAPP");
            }
          }
        }
        // Restore saved quote draft if present, otherwise select all by default
        const r = foundLead.agentResults;
        const draft = (foundLead as any).quoteDraft;
        if (draft) {
          setSelectedFlights(new Set(draft.selectedFlights || []));
          setSelectedHotels(new Set(draft.selectedHotels || []));
          setSelectedDays(new Set(draft.selectedDays || []));
          setSelectedRecos(new Set(draft.selectedRecos || []));
          setSelectedTransfers(new Set(draft.selectedTransfers || []));
          setSelectedRestaurants(new Set(draft.selectedRestaurants || []));
          if (draft.nights !== undefined) setGlobalNights(draft.nights);
          if (draft.pax !== undefined) setGlobalPax(draft.pax);
        } else if (r) {
          const flightCount = r.transport?.flights?.length || 0;
          const hotelCount = r.accommodation?.hotels?.length || 0;
          const dayCount = r.itinerary?.days?.length || 0;
          const recoCount = r.client?.recommendations?.length || 0;
          const transferCount = r.transport?.transfers?.length || 0;
          const restCount = (r.dining?.restaurants || r.itinerary?.restaurants || []).length || 0;
          setSelectedFlights(
            new Set(Array.from({ length: flightCount }, (_, i) => i)),
          );
          setSelectedHotels(
            new Set(Array.from({ length: hotelCount }, (_, i) => i)),
          );
          setSelectedDays(
            new Set(Array.from({ length: dayCount }, (_, i) => i)),
          );
          setSelectedRecos(
            new Set(Array.from({ length: recoCount }, (_, i) => i)),
          );
          setSelectedTransfers(
            new Set(Array.from({ length: transferCount }, (_, i) => i)),
          );
          setSelectedRestaurants(
            new Set(Array.from({ length: restCount }, (_, i) => i)),
          );

          const extractedNights =
            foundLead.days || (dayCount ? Math.max(1, dayCount - 1) : 7);
          const extractedPax = foundLead.pax
            ? parseInt(String(foundLead.pax).replace(/[^\d]/g, "")) || 2
            : 2;
          setGlobalNights(extractedNights);
          setGlobalPax(extractedPax);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const agentName =
    userProfile?.displayName || user?.displayName || "Luna Concierge";

  // Reference number
  const refNumber = useMemo(() => {
    const hash = leadId
      .split("")
      .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const num = Math.abs(hash % 10000)
      .toString()
      .padStart(4, "0");
    return `LUNA-${new Date().getFullYear()}-${num}`;
  }, [leadId]);

  // Toggle helpers
  const toggleItem = (
    set: Set<number>,
    setter: (s: Set<number>) => void,
    idx: number,
  ) => {
    const next = new Set(set);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setter(next);
  };
  const selectAll = (count: number, setter: (s: Set<number>) => void) =>
    setter(new Set(Array.from({ length: count }, (_, i) => i)));
  const deselectAll = (setter: (s: Set<number>) => void) => setter(new Set());

  // Get client price (with margin)
  const getClientPrice = (key: string, basePrice: number): number => {
    if (customPrices[key] !== undefined) return customPrices[key];
    return Math.round(basePrice * (1 + marginPercent / 100));
  };

  const computeTotals = () => {
    if (!lead?.agentResults)
      return {
        flightTotal: 0,
        hotelTotal: 0,
        transferTotal: 0,
        restoTotal: 0,
        grandTotal: 0,
        nights: globalNights,
        pax: globalPax,
      };
    const r = lead.agentResults;
    const flights = r.transport?.flights || [];
    const hotels = r.accommodation?.hotels || [];
    const transfers = r.transport?.transfers || [];
    const restaurants = r.dining?.restaurants || r.itinerary?.restaurants || [];

    let flightTotal = 0;
    selectedFlights.forEach((i) => {
      if (flights[i]) {
        const base = parsePrice(flights[i].price);
        flightTotal += getClientPrice(`flight-${i}`, base) * globalPax;
      }
    });

    let hotelTotal = 0;
    selectedHotels.forEach((i) => {
      if (hotels[i]) {
        const base = parsePrice(hotels[i].pricePerNight || hotels[i].price);
        const clientDaily = getClientPrice(`hotel-${i}`, base);
        const nights = getHotelNights(i);
        hotelTotal += clientDaily * nights;
      }
    });

    let transferTotal = 0;
    selectedTransfers.forEach((i) => {
      if (transfers[i]) {
        const base = parsePrice(transfers[i].price);
        // Les transferts sont généralement par véhicule, mais on ajoute au global
        transferTotal += getClientPrice(`transfer-${i}`, base);
      }
    });

    let restoTotal = 0;
    selectedRestaurants.forEach((i) => {
      if (restaurants[i]) {
        const base = parsePrice(restaurants[i].price || restaurants[i].priceEstimate);
        // Restos généralement donnés par personne (budget estimé), donc on multiplie par pax et nuits si c'est global, ou par pax pour un seul repas
        restoTotal += getClientPrice(`resto-${i}`, base) * globalPax;
      }
    });

    return {
      flightTotal,
      hotelTotal,
      transferTotal,
      restoTotal,
      grandTotal: flightTotal + hotelTotal + transferTotal + restoTotal,
      nights: globalNights,
      pax: globalPax,
    };
  };

  const generateTextProposal = () => {
    if (!lead || !lead.agentResults) return "";
    const r = lead.agentResults;
    const flights = (r.transport?.flights || []).filter((_: any, i: number) =>
      selectedFlights.has(i),
    );
    const hotels = (r.accommodation?.hotels || []).filter((_: any, i: number) =>
      selectedHotels.has(i),
    );
    const days = (r.itinerary?.days || []).filter((_: any, i: number) =>
      selectedDays.has(i),
    );
    const totals = computeTotals();

    let text = `VOTRE PROPOSITION VOYAGE - ${lead.destination.toUpperCase()}\n`;
    text += `Référence: ${refNumber}\n\n`;
    text += `Bonjour ${lead.clientName || "cher voyageur"},\nVoici les pistes sélectionnées pour votre séjour à ${lead.destination} :\n\n`;

    if (flights.length > 0) {
      text += `VOLS pour ${totals.pax} ${totals.pax > 1 ? "personnes" : "personne"}\n`;
      flights.forEach((f: any, i: number) => {
        const idx = (lead.agentResults?.transport?.flights || []).indexOf(f);
        const clientPrice = getClientPrice(
          `flight-${idx}`,
          parsePrice(f.price),
        );
        const totalFlight = formatPrice(clientPrice * totals.pax);
        text += `• ${f.airline} (${f.route}) : ${totalFlight} au total (${clientPrice}€/pers) ${f.url ? `\n  Info: ${f.domain || "Lien"}` : ""}\n`;
      });
      text += `\n`;
    }

    if (hotels.length > 0) {
      text += `HÔTELS (${totals.nights} nuits)\n`;
      hotels.forEach((h: any) => {
        const idx = (lead.agentResults?.accommodation?.hotels || []).indexOf(h);
        const daily = getClientPrice(
          `hotel-${idx}`,
          parsePrice(h.pricePerNight || h.price),
        );
        const totalStay = daily * totals.nights;
        text += `• ${h.name} : ${formatPrice(totalStay)} total pour ${totals.nights}n (${daily}€/n)${h.url ? `\n  Voir: ${h.domain || "Lien"}` : ""}\n`;
      });
      text += `\n`;
    }

    const transfers = (r.transport?.transfers || []).filter((_: any, i: number) =>
      selectedTransfers.has(i),
    );
    if (transfers.length > 0) {
      text += `CHAUFFEURS / TRANSFERTS SUR PLACE\n`;
      transfers.forEach((t: any) => {
        const idx = (lead.agentResults?.transport?.transfers || []).indexOf(t);
        const price = getClientPrice(`transfer-${idx}`, parsePrice(t.price));
        const hasReturn = t.returnEnabled;
        text += `• Aller : ${t.from || t.outboundLocation || ""} → ${t.to || t.outboundDestination || ""}${t.outboundTime ? ` (${t.outboundTime})` : ""} : ${formatPrice(price)}\n`;
        if (hasReturn) {
          text += `• Retour : ${t.returnLocation || t.to || ""} → ${t.returnDestination || t.from || ""}${t.returnTime ? ` (${t.returnTime})` : ""}\n`;
        }
      });
      text += `\n`;
    }

    const restaurants = (r.dining?.restaurants || r.itinerary?.restaurants || []).filter((_: any, i: number) =>
      selectedRestaurants.has(i),
    );
    if (restaurants.length > 0) {
      text += `GASTRONOMIE & RESTAURANTS\n`;
      restaurants.forEach((resto: any) => {
        const idx = (lead.agentResults?.dining?.restaurants || lead.agentResults?.itinerary?.restaurants || []).indexOf(resto);
        const pp = getClientPrice(`resto-${idx}`, parsePrice(resto.price || resto.priceEstimate));
        const totalResto = pp * totals.pax;
        text += `• ${resto.name} ${resto.cuisine ? `(${resto.cuisine})` : ""} : ${formatPrice(totalResto)} total (${pp}€/pers)\n`;
      });
      text += `\n`;
    }

    if (days.length > 0) {
      text += `ACTIVITÉS\n`;
      days.slice(0, 3).forEach((d: any, i: number) => {
        text += `• J${i + 1}: ${d.title}\n`;
      });
      if (days.length > 3)
        text += `+ ${days.length - 3} autres jours sur mesure.\n`;
      text += `\n`;
    }

    text += `BUDGET : ${formatPrice(totals.grandTotal)}\n\n`;
    text += `Votre Conciergerie — Voyage Sur Mesure`;

    return text;
  };
  const generateHtmlEmail = () => {
    if (!lead || !lead.agentResults) return "";
    const r = lead.agentResults;
    const flights = (r.transport?.flights || []).filter((_: any, i: number) =>
      selectedFlights.has(i),
    );
    const hotels = (r.accommodation?.hotels || []).filter((_: any, i: number) =>
      selectedHotels.has(i),
    );
    const days = (r.itinerary?.days || []).filter((_: any, i: number) =>
      selectedDays.has(i),
    );
    const transfers = (r.transport?.transfers || []).filter((_: any, i: number) =>
      selectedTransfers.has(i),
    );
    const restaurants = (r.dining?.restaurants || r.itinerary?.restaurants || []).filter((_: any, i: number) =>
      selectedRestaurants.has(i),
    );
    const tips = r.itinerary?.tips || [];
    const recommendations = (r.client?.recommendations || []).filter(
      (_: any, i: number) => selectedRecos.has(i),
    );
    const totals = computeTotals();

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #f0f4f8; color: #1e293b; }
  .container { max-width: 680px; margin: 0 auto; background: white; overflow: hidden; border-radius: 0; }
  .logo-header { background: #ffffff; padding: 48px 40px 40px; text-align: center; }
  .header-meta { text-align: center; padding: 0 40px 28px; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
  .header-meta .date { color: #94a3b8; font-size: 13px; }
  .ref-badge { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; letter-spacing: 2px; padding: 5px 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin-left: 10px; }
  .greeting { padding: 36px 40px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; }
  .greeting h2 { font-size: 22px; color: #1e293b; margin: 0 0 14px; font-weight: 500; }
  .greeting p { font-size: 14px; color: #475569; line-height: 1.8; margin: 0; }
  .section { padding: 28px 40px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #94a3b8; margin: 0 0 18px; font-weight: 700; }
  .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
  .item-name { font-size: 14px; font-weight: 500; color: #1e293b; }
  .item-detail { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .day-block { border-left: 3px solid #10b981; padding: 14px 18px; margin-bottom: 14px; background: linear-gradient(90deg, #f0fdf4 0%, #fff 100%); border-radius: 0 10px 10px 0; }
  .day-num { font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
  .day-title { font-size: 15px; font-weight: 500; color: #1e293b; margin-bottom: 6px; }
  .day-desc { font-size: 13px; color: #4b5563; line-height: 1.7; }
  .day-desc strong { color: #1e293b; }
  .day-highlight { font-size: 12px; color: #059669; font-style: italic; margin-top: 6px; }
  .tip-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 8px; font-size: 13px; color: #92400e; line-height: 1.5; }
  .reco-item { padding: 10px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #475569; line-height: 1.5; }
  .reco-item:last-child { border-bottom: none; }
  .reco-type { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; margin-left: 8px; }
  .summary-box { background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; }
  .summary-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 13px; }
  .summary-row:last-child { border-bottom: none; }
  .summary-label { color: #94a3b8; }
  .summary-value { font-weight: 600; color: #1e293b; }
  .total-row { display: flex; justify-content: space-between; padding: 14px 0 0; margin-top: 8px; border-top: 2px solid #3b82f6; font-size: 16px; }
  .total-label { color: #1e293b; font-weight: 600; }
  .total-value { font-weight: 800; color: #3b82f6; font-size: 22px; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 0 40px; }
  .footer { background: #0f172a; padding: 32px 40px; text-align: center; }
  .footer p { font-size: 11px; color: #64748b; margin: 3px 0; }
  .footer .agent-name { font-size: 14px; font-weight: 500; color: white; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="container">
  <div class="logo-header">
    ${LUNA_SVG_INLINE.replace('width="180" height="56"', 'width="280" height="86"')}
  </div>
  <div class="header-meta">
    <span class="date">${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
    <span class="ref-badge">Réf. ${refNumber}</span>
  </div>
  <div class="greeting">
    <h2>Bonjour ${lead.clientName || "cher voyageur"},</h2>
    <p>Nous avons le plaisir de vous transmettre votre proposition de voyage sur mesure pour <strong>${lead.destination}</strong>.<br><br>
    Voici la feuille de route que nous avons élaborée pour vous. N'hésitez pas à nous contacter pour toute question en mentionnant votre référence <strong>${refNumber}</strong>.</p>
  </div>

  ${flights.length > 0
        ? `
  <div class="section">
    <div class="section-title">Transport (${flights.length} option${flights.length > 1 ? "s" : ""})</div>
    ${flights
          .map(
            (f: any) => `
    <div class="item">
      <div class="item-name">${f.airline || "Vol"} — ${f.route || ""}</div>
      <div class="item-detail">${f.class || ""} ${f.stops == 0 ? "· Vol direct" : f.stops ? `· ${f.stops} escale(s)` : ""} ${f.duration ? `· ${f.duration}` : ""}</div>
    </div>`,
          )
          .join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${hotels.length > 0
        ? `
  <div class="section">
    <div class="section-title">Hébergement (${hotels.length} option${hotels.length > 1 ? "s" : ""} · ${totals.nights} nuits)</div>
    ${hotels
          .map(
            (h: any) => `
    <div class="item">
      <div class="item-name">${h.name} ${h.stars ? "★".repeat(Math.min(h.stars, 5)) : ""}</div>
      <div class="item-detail">${h.destination || h.location || ""} ${h.highlights ? "· " + (h.highlights as string[]).slice(0, 3).join(", ") : ""}</div>
      ${h.recommendation ? `<div style="font-size:12px;color:#78350f;margin-top:6px;font-style:italic;">${h.recommendation}</div>` : ""}
    </div>`,
          )
          .join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${transfers.length > 0
        ? `
  <div class="section">
    <div class="section-title">Chauffeurs & Transferts (${transfers.length} service${transfers.length > 1 ? "s" : ""})</div>
    ${transfers
          .map((t: any) => `
    <div class="item">
      <div class="item-name">Aller : ${t.from || t.outboundLocation || "A"} → ${t.to || t.outboundDestination || "B"}${t.outboundTime ? ` · ${t.outboundTime}` : ""}</div>
      <div class="item-detail">${t.type || "Chauffeur privé"} ${t.duration ? `· Durée approx : ${t.duration}` : ""}</div>
      ${t.returnEnabled ? `<div class="item-name" style="margin-top:8px;">Retour : ${t.returnLocation || t.to || "B"} → ${t.returnDestination || t.from || "A"}${t.returnTime ? ` · ${t.returnTime}` : ""}</div>` : ""}
    </div>`)
          .join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${restaurants.length > 0
        ? `
  <div class="section">
    <div class="section-title">Gastronomie (${restaurants.length} table${restaurants.length > 1 ? "s" : ""})</div>
    ${restaurants
          .map((resto: any) => `
    <div class="item">
      <div class="item-name">${resto.name} ${resto.stars ? "★".repeat(Math.min(resto.stars, 3)) : ""}</div>
      <div class="item-detail">${resto.cuisine ? `Cuisine : ${resto.cuisine} · ` : ""}${resto.description || ""}</div>
    </div>`)
          .join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${days.length > 0
        ? `
  <div class="section">
    <div class="section-title">Votre itinéraire (${days.length} jours)</div>
    ${days
          .map(
            (d: any, i: number) => `
    <div class="day-block">
      <div class="day-num">Jour ${i + 1}</div>
      <div class="day-title">${d.title || `Journée ${i + 1}`}</div>
      <div class="day-desc">
        ${d.morning ? `<strong>Matin :</strong> ${d.morning}<br>` : ""}
        ${d.afternoon ? `<strong>Après-midi :</strong> ${d.afternoon}<br>` : ""}
        ${d.evening ? `<strong>Soirée :</strong> ${d.evening}` : ""}
      </div>
      ${d.highlight ? `<div class="day-highlight">${d.highlight}</div>` : ""}
    </div>`,
          )
          .join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${recommendations.length > 0
        ? `
  <div class="section">
    <div class="section-title">Expériences & culture</div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${recommendations
          .map(
            (rec: any) => `
      <div class="reco-item">${rec.text || rec}${rec.type ? ` <span class="reco-type">${rec.type}</span>` : ""}</div>
      `,
          )
          .join("")}
    </div>
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  ${tips.length > 0
        ? `
  <div class="section">
    <div class="section-title">Conseils pratiques</div>
    ${tips.map((tip: string) => `<div class="tip-box">• ${tip}</div>`).join("")}
  </div>
  <div class="divider"></div>
  `
        : ""
      }

  <div class="section">
    <div class="section-title">Récapitulatif</div>
    <div class="summary-box">
      <div class="summary-row"><span class="summary-label">Référence</span><span class="summary-value" style="color:#3b82f6;">${refNumber}</span></div>
      <div class="summary-row"><span class="summary-label">Destination</span><span class="summary-value">${lead.destination}</span></div>
      <div class="summary-row"><span class="summary-label">Dates</span><span class="summary-value">${lead.dates || "À confirmer"}</span></div>
      <div class="summary-row"><span class="summary-label">Voyageurs</span><span class="summary-value">${lead.pax || "À préciser"}</span></div>
      <div class="summary-row"><span class="summary-label">Durée</span><span class="summary-value">${days.length} jours / ${totals.nights} nuits</span></div>
      <div class="total-row">
        <span class="total-label">Budget total estimé</span>
        <span class="total-value">${formatPrice(totals.grandTotal)}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="agent-name">${agentName}</div>
    <p>Luna — Votre Concierge Voyage Sur Mesure</p>
    <p style="margin-top:12px;">Ce devis est valable 10 jours. Répondez à cet email pour toute question.</p>
    <p style="margin-top:12px;color:#475569;">© ${new Date().getFullYear()} Votre Conciergerie</p>
  </div>
</div>
</body>
</html>`;
  };

  const handleSendQuote = async () => {
    if (!lead) return;
    if (sendingChannel === "EMAIL" && !emailTo) return;
    if (sendingChannel === "WHATSAPP" && !whatsappPhone) return;

    setSending(true);
    try {
      const r = lead.agentResults;
      const selectedFlightsList = (r?.transport?.flights || []).filter(
        (_: any, i: number) => selectedFlights.has(i),
      );
      const selectedHotelsList = (r?.accommodation?.hotels || []).filter(
        (_: any, i: number) => selectedHotels.has(i),
      );
      const totals = computeTotals();

      // 1. Create Formal Quote in Firestore for Finance tracking
      const quoteItems: any[] = [];
      selectedFlightsList.forEach((f: any, i: number) => {
        const idx = (r?.transport?.flights || []).indexOf(f);
        const unitPrice = getClientPrice(`flight-${idx}`, parsePrice(f.price));
        quoteItems.push({
          description: `Vol: ${f.airline} (${f.route}) — ${totals.pax} pax`,
          quantity: totals.pax,
          unitPrice: unitPrice,
          total: unitPrice * totals.pax,
          taxRate: 0, // Flights usually 0% VAT international
        });
      });
      selectedHotelsList.forEach((h: any, i: number) => {
        const idx = (r?.accommodation?.hotels || []).indexOf(h);
        const unitPrice = getClientPrice(
          `hotel-${idx}`,
          parsePrice(h.pricePerNight || h.price),
        );
        quoteItems.push({
          description: `Hôtel: ${h.name} — ${totals.nights} nuits`,
          quantity: totals.nights,
          unitPrice: unitPrice,
          total: unitPrice * totals.nights,
          taxRate: 20,
        });
      });

      const selectedTransfersList = (r?.transport?.transfers || []).filter(
        (_: any, i: number) => selectedTransfers.has(i),
      );
      selectedTransfersList.forEach((t: any, i: number) => {
        const idx = (r?.transport?.transfers || []).indexOf(t);
        const unitPrice = getClientPrice(`transfer-${idx}`, parsePrice(t.price));
        quoteItems.push({
          description: `Transfert: ${t.type || 'Chauffeur'} (${t.from} → ${t.to})`,
          quantity: 1,
          unitPrice: unitPrice,
          total: unitPrice,
          taxRate: 20,
        });
      });

      const selectedRestaurantsList = (r?.dining?.restaurants || r?.itinerary?.restaurants || []).filter(
        (_: any, i: number) => selectedRestaurants.has(i),
      );
      selectedRestaurantsList.forEach((resto: any, i: number) => {
        const idx = (r?.dining?.restaurants || r?.itinerary?.restaurants || []).indexOf(resto);
        const unitPrice = getClientPrice(`resto-${idx}`, parsePrice(resto.price || resto.priceEstimate));
        quoteItems.push({
          description: `Repas: ${resto.name} — ${totals.pax} pax`,
          quantity: totals.pax,
          unitPrice: unitPrice,
          total: unitPrice * totals.pax,
          taxRate: 20,
        });
      });

      await createQuote(tenantId!, {
        quoteNumber: refNumber,
        tripId: "", // Can be linked later
        clientId: lead.clientId || "",
        clientName: lead.clientName || "Client",
        issueDate: new Date().toISOString().split("T")[0],
        validUntil: new Date(Date.now() + 15 * 86400000)
          .toISOString()
          .split("T")[0],
        items: quoteItems,
        subtotal: totals.grandTotal,
        taxTotal: 0, // Simplified. Usually computed per item.
        totalAmount: totals.grandTotal,
        currency: "EUR",
        status: "SENT",
        notes: `Généré par IA pour ${lead.destination}. Via ${sendingChannel}.`,
      });

      // 1.5 Save AI Analysis to Client Record (Analysis only, not sent to client)
      if (lead.clientId && r?.client?.summary) {
        await updateContact(tenantId!, lead.clientId, {
          profileAnalysis: r.client.summary,
        });
      }

      // 2. Update Lead Status
      await updateLeadStatus(tenantId!, lead.id!, "PROPOSAL_SENT" as any);

      // 3. Send via selected channel
      if (sendingChannel === "EMAIL") {
        const htmlContent = generateHtmlEmail();
        const res = await fetchWithAuth("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: emailTo,
            subject: `Votre Proposition de Voyage — ${lead.destination} | Réf. ${refNumber}`,
            message: `Proposition de voyage pour ${lead.destination}. Réf: ${refNumber}.`,
            bodyHtml: htmlContent,
            clientId: lead.clientId,
            clientName: lead.clientName,
          }),
        });
        const data = await res.json();
        if (data.status === 'sent') {
          setSent(true);
          setTimeout(() => setSent(false), 5000);
        } else {
          alert('Erreur Email: ' + (data.error || data.results?.map((r: any) => r.error).join(', ') || 'Gmail non connecté. Allez dans Paramètres > Intégrations pour connecter votre compte Gmail.'));
        }
      } else {
        // WhatsApp — split long messages into chunks (Meta API limit = 4096 chars)
        const fullText = generateTextProposal();
        const MAX_LEN = 4000;
        const chunks: string[] = [];
        if (fullText.length <= MAX_LEN) {
          chunks.push(fullText);
        } else {
          // Split by double newline to keep logical blocks together
          const blocks = fullText.split("\n\n");
          let current = "";
          for (const block of blocks) {
            if ((current + "\n\n" + block).length > MAX_LEN && current) {
              chunks.push(current.trim());
              current = block;
            } else {
              current = current ? current + "\n\n" + block : block;
            }
          }
          if (current) chunks.push(current.trim());
        }

        let allOk = true;
        for (const chunk of chunks) {
          const res = await fetchWithAuth("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: whatsappPhone,
              message: chunk,
              clientId: lead.clientId,
              clientName: lead.clientName,
            }),
          });
          const data = await res.json();
          if (data.status !== "sent" && data.status !== "saved_locally") {
            allOk = false;
            alert("Erreur WhatsApp: " + (data.error || JSON.stringify(data)));
            break;
          }
        }
        if (allOk) {
          setSent(true);
          setTimeout(() => setSent(false), 5000);
        }
      }
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // ═══ SAVE QUOTE DRAFT (persist selections to CRM lead) ═══
  const handleSaveQuote = async () => {
    if (!lead || !tenantId) return;
    setSaving(true);
    try {
      const totals = computeTotals();
      await updateLead(tenantId, lead.id!, {
        quoteDraft: {
          selectedFlights: Array.from(selectedFlights),
          selectedHotels: Array.from(selectedHotels),
          selectedDays: Array.from(selectedDays),
          selectedRecos: Array.from(selectedRecos),
          selectedTransfers: Array.from(selectedTransfers),
          selectedRestaurants: Array.from(selectedRestaurants),
          marginPercent,
          customPrices,
          sendingChannel,
          emailTo,
          whatsappPhone,
          totalAmount: totals.grandTotal,
          nights: totals.nights,
          pax: totals.pax,
          savedAt: new Date().toISOString(),
        },
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("Erreur sauvegarde: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <p className="text-gray-400 animate-pulse text-lg">
          Chargement du devis...
        </p>
      </div>
    );
  if (!lead)
    return (
      <div className="text-center mt-20">
        <h1 className="text-4xl font-light text-[#2E2E2E] tracking-tight">Devis introuvable</h1>
        <button
          onClick={() => router.back()}
          className="text-sky-500 hover:underline"
        >
          Retour
        </button>
      </div>
    );

  const r = lead.agentResults;
  const flights = r?.transport?.flights || [];
  const hotels = r?.accommodation?.hotels || [];
  const transfers = r?.transport?.transfers || [];
  const restaurants = r?.dining?.restaurants || r?.itinerary?.restaurants || [];
  const days = r?.itinerary?.days || [];
  const tips = r?.itinerary?.tips || [];
  const recommendations = r?.client?.recommendations || [];
  const totals = computeTotals();

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-20">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-6 md:p-8 mb-4 text-white relative overflow-hidden">
        <div className="absolute -top-10 -left-6 w-24 h-44 bg-white/[0.04] rounded-full rotate-12" />
        <div className="absolute -bottom-16 -right-4 w-32 h-56 bg-white/[0.03] rounded-full -rotate-12" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs uppercase tracking-[4px] text-white/40">
                Éditeur de Devis
              </p>
              <span className="text-[10px] uppercase tracking-widest text-white/70 bg-white/10 px-3 py-1 rounded-md border border-white/15">
                Réf. {refNumber}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/50">
                Créé le{" "}
                {new Date().toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-[28px] font-normal tracking-tight text-white/90 mb-1">
              {lead.destination}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">
              <span>{lead.clientName}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{lead.dates || "Dates à définir"}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{globalPax} pax</span>
            </p>
          </div>
          <div className="flex gap-2">
            {/* PDF Export — Luna Devis Premium */}
            <button
              onClick={async () => {
                const t = computeTotals();
                const rr = lead.agentResults;
                // Collect all selected segments (no prices!) 
                const segments: { type: string; title: string; description: string }[] = [];
                (rr?.transport?.flights || []).filter((_: any, i: number) => selectedFlights.has(i)).forEach((f: any) => {
                  segments.push({ type: 'FLIGHT', title: `${f.airline || 'Vol'} — ${f.route || ''}`, description: `${f.class || ''} ${f.duration ? `· ${f.duration}` : ''}`.trim() });
                });
                (rr?.accommodation?.hotels || []).filter((_: any, i: number) => selectedHotels.has(i)).forEach((h: any) => {
                  segments.push({ type: 'HOTEL', title: h.name || 'Hôtel', description: `${h.stars ? `${h.stars}★` : ''} ${h.highlights?.join(', ') || ''}`.trim() });
                });
                (rr?.transport?.transfers || []).filter((_: any, i: number) => selectedTransfers.has(i)).forEach((tr: any) => {
                  segments.push({ type: 'TRANSFER', title: `${tr.type || 'Transfert'} — ${tr.from || ''} → ${tr.to || ''}`, description: '' });
                });
                (rr?.dining?.restaurants || rr?.itinerary?.restaurants || []).filter((_: any, i: number) => selectedRestaurants.has(i)).forEach((re: any) => {
                  segments.push({ type: 'ACTIVITY', title: re.name || 'Restaurant', description: re.cuisine || '' });
                });

                try {
                  const res = await fetchWithAuth('/api/crm/devis-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      destination: lead.destination || 'Voyage',
                      clientName: lead.clientName || 'Client',
                      clientEmail: emailTo || '',
                      clientPhone: whatsappPhone || '',
                      clientAddress: '',
                      startDate: '',
                      endDate: '',
                      pax: `${t.pax} voyageur${t.pax > 1 ? 's' : ''}`,
                      nights: t.nights,
                      agentName: agentName || 'Luna Conciergerie',
                      segments,
                      totalAmount: t.grandTotal,
                      refNumber,
                    }),
                  });
                  if (!res.ok) throw new Error('PDF generation failed');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Devis_${(lead.destination || 'Voyage').replace(/\s+/g, '_')}_${refNumber}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('[PDF Luxe Error]', err);
                  alert('Erreur lors de la génération du PDF.');
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#E2C8A9] to-[#D4B896] hover:from-[#D4B896] hover:to-[#C5A886] text-white px-4 py-2 rounded-xl text-sm transition-all border border-[#E2C8A9]/30 font-medium shadow-sm"
            >
              <FileDown size={14} /> PDF Luxe
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm transition-all border border-white/10"
            >
              <Eye size={14} /> {showPreview ? "Masquer" : "Aperçu"}
            </button>
            <button
              onClick={handleSaveQuote}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all border font-medium ${saved ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-white/10 hover:bg-white/20 text-white border-white/10"}`}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}
              {saved ? "Sauvé ✓" : "Sauvegarder"}
            </button>
            {sent ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-xl text-sm border border-emerald-500/30">
                <CheckCircle2 size={14} /> Envoyé !
              </div>
            ) : (
              <button
                onClick={handleSendQuote}
                disabled={
                  sending ||
                  (sendingChannel === "EMAIL" ? !emailTo : !whatsappPhone)
                }
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50 font-medium"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Envoyer {sendingChannel === "EMAIL" ? "Email" : "WhatsApp"}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          <div
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${sendingChannel === "EMAIL" ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 opacity-60"}`}
            onClick={() => setSendingChannel("EMAIL")}
          >
            <Mail
              size={16}
              className={
                sendingChannel === "EMAIL" ? "text-white" : "text-white/40"
              }
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-wider text-white/70">
                  Email Client
                </p>
                {client?.communicationPreference === "EMAIL" && (
                  <span className="text-[9px] bg-sky-500/80 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                    Préféré
                  </span>
                )}
              </div>
              <input
                value={emailTo}
                onChange={(e) => {
                  e.stopPropagation();
                  setEmailTo(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Email..."
                className="bg-transparent text-white text-sm outline-none w-full"
              />
            </div>
          </div>
          <div
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${sendingChannel === "WHATSAPP" ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/5 border-white/10 opacity-60"}`}
            onClick={() => setSendingChannel("WHATSAPP")}
          >
            <MessageCircle
              size={16}
              className={
                sendingChannel === "WHATSAPP"
                  ? "text-emerald-400"
                  : "text-white/40"
              }
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-wider text-white/70">
                  WhatsApp Client
                </p>
                {client?.communicationPreference === "WHATSAPP" && (
                  <span className="text-[9px] bg-emerald-500/80 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                    Préféré
                  </span>
                )}
              </div>
              <input
                value={whatsappPhone}
                onChange={(e) => {
                  e.stopPropagation();
                  setWhatsappPhone(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Numéro WhatsApp..."
                className="bg-transparent text-white text-sm outline-none w-full"
              />
            </div>
            {!whatsappPhone && (
              <span title="Numéro manquant">
                <AlertCircle size={14} className="text-amber-400" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Margin, Pax, Nights */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-4 mb-6 flex flex-col md:flex-row items-center gap-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {/* Pax */}
        <div className="flex items-center gap-3">
          <Users size={16} className="text-[#64748b]" />
          <span className="text-[13px] text-[#475569] font-medium">
            Voyageurs :
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGlobalPax(Math.max(1, globalPax - 1))}
              className="w-7 h-7 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-lg transition-colors"
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              value={globalPax}
              onChange={(e) =>
                setGlobalPax(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-10 text-center text-[13px] font-semibold text-[#0f172a] bg-transparent border-none focus:ring-0 p-0"
            />
            <button
              onClick={() => setGlobalPax(globalPax + 1)}
              className="w-7 h-7 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-lg transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Nights */}
        <div className="w-[1px] h-6 bg-[#e2e8f0] hidden md:block" />
        <div className="flex items-center gap-3">
          <Hotel size={16} className="text-[#64748b]" />
          <span className="text-[13px] text-[#475569] font-medium">
            Nuits sur place :
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGlobalNights(Math.max(1, globalNights - 1))}
              className="w-7 h-7 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-lg transition-colors"
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              value={globalNights}
              onChange={(e) =>
                setGlobalNights(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-10 text-center text-[13px] font-semibold text-[#0f172a] bg-transparent border-none focus:ring-0 p-0"
            />
            <button
              onClick={() => setGlobalNights(globalNights + 1)}
              className="w-7 h-7 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded-lg transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Margin */}
        <div className="w-[1px] h-6 bg-[#e2e8f0] hidden md:block" />
        <div className="flex items-center gap-3">
          <Percent size={16} className="text-[#64748b]" />
          <span className="text-[13px] text-[#475569] font-medium">
            Marge appliquée :
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMarginPercent(Math.max(0, marginPercent - 5))}
              className="w-7 h-7 flex items-center justify-center bg-[#f0f9ff] text-[#0ea5e9] hover:bg-[#e0f2fe] rounded-lg transition-colors"
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              value={marginPercent}
              onChange={(e) =>
                setMarginPercent(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-12 text-center text-[13px] font-semibold text-[#0ea5e9] bg-transparent border-none focus:ring-0 p-0"
            />
            <span className="text-[12px] text-[#94a3b8] -ml-2">%</span>
            <button
              onClick={() => setMarginPercent(marginPercent + 5)}
              className="w-7 h-7 flex items-center justify-center bg-[#f0f9ff] text-[#0ea5e9] hover:bg-[#e0f2fe] rounded-lg transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#94a3b8]">Sélection globale :</span>
          <span className="font-semibold text-[#334155] bg-[#f1f5f9] px-2 py-1 rounded-md">
            {selectedFlights.size} vols, {selectedHotels.size} hôtels,{" "}
            {selectedDays.size} jours
          </span>
        </div>
      </div>

      {showPreview && (
        <div className="mb-4 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              {sendingChannel === "EMAIL" ? (
                <Mail size={12} />
              ) : (
                <MessageCircle size={12} />
              )}
              Aperçu{" "}
              {sendingChannel === "EMAIL" ? "Email (HTML)" : "WhatsApp (Texte)"}
            </div>
            <span className="text-[10px] text-gray-400 italic">
              Seuls les éléments sélectionnés apparaissent
            </span>
          </div>
          <div className="p-6 overflow-y-auto max-h-[500px]">
            {sendingChannel === "EMAIL" ? (
              <div
                dangerouslySetInnerHTML={{ __html: generateHtmlEmail() }}
                className="border rounded shadow-sm scale-[0.9] origin-top"
              />
            ) : (
              <div className="bg-[#E7FFDB] p-4 rounded-xl shadow-sm text-sm text-gray-800 whitespace-pre-wrap font-sans max-w-sm mx-auto border border-black/5 relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-20">
                  <Check size={10} />
                  <Check size={10} className="-ml-1.5" />
                </div>
                {generateTextProposal()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content — 2 column on large */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Transport */}
          {flights.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#E8F4FD] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F4FD] flex items-center justify-center">
                    <Plane size={14} className="text-[#5a8fa3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Vols</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedFlights.size}/{flights.length} sélectionnés</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      selectAll(flights.length, setSelectedFlights)
                    }
                    className="text-[10px] text-[#5a8fa3] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedFlights)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  // Group flights by route/destination
                  const routeGroups: Record<string, number[]> = {};
                  flights.forEach((f: any, i: number) => {
                    const route = f.route || f.departure || "Non précisé";
                    // Extract destination pair (e.g., "Paris → Amsterdam")
                    const leg = route.includes("→")
                      ? route
                        .split("→")
                        .map((s: string) => s.trim())
                        .pop()!
                      : route;
                    if (!routeGroups[leg]) routeGroups[leg] = [];
                    routeGroups[leg].push(i);
                  });
                  const legKeys = Object.keys(routeGroups);
                  const isMultiLeg = legKeys.length > 1;

                  return legKeys.map((legName, li) => (
                    <div key={legName}>
                      {isMultiLeg && (
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${li > 0 ? "mt-4" : ""}`}
                          style={{
                            background: [
                              "#EFF6FF",
                              "#F0FDF4",
                              "#FEF3C7",
                              "#FDF2F8",
                            ][li % 4],
                            border: `1px solid ${["#BFDBFE", "#BBF7D0", "#FDE68A", "#FBCFE8"][li % 4]}`,
                          }}
                        >
                          <MapPin
                            size={12}
                            style={{
                              color: [
                                "#3B82F6",
                                "#10B981",
                                "#F59E0B",
                                "#EC4899",
                              ][li % 4],
                            }}
                          />
                          <span className="text-xs font-bold text-gray-800">
                            {legName}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {routeGroups[legName].length} vol
                            {routeGroups[legName].length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {routeGroups[legName].map((i) => {
                        const f = flights[i];
                        const selected = selectedFlights.has(i);
                        const basePrice = parsePrice(f.price);
                        const clientPrice = getClientPrice(
                          `flight-${i}`,
                          basePrice,
                        );
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selected ? "bg-[#E8F4FD]/50 border-[#5a8fa3]/25" : "bg-[#f8fafc]/50 border-[#e2e8f0] opacity-50"}`}
                            onClick={() =>
                              toggleItem(selectedFlights, setSelectedFlights, i)
                            }
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#5a8fa3] border-[#5a8fa3] text-white" : "border-[#cbd5e1]"}`}
                            >
                              {selected && <Check size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#0f172a] text-[13px]">
                                {f.airline} — {f.route}
                              </p>
                              <p className="text-[12px] text-[#64748b]">
                                {f.class || ""}{" "}
                                {f.duration ? `· ${f.duration}` : ""}
                              </p>
                            </div>
                            <div
                              className="text-right shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] text-[#94a3b8] line-through">
                                {f.price}
                              </p>
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  value={clientPrice}
                                  onChange={(e) =>
                                    setCustomPrices((p) => ({
                                      ...p,
                                      [`flight-${i}`]:
                                        parseInt(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-16 text-right text-[13px] font-semibold text-[#0ea5e9] bg-transparent border-b border-[#e2e8f0] focus:border-[#3b82f6] outline-none px-1 py-0.5 transition-colors"
                                />
                                <span className="text-[10px] text-[#64748b] ml-1">
                                  €/pers
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-[#0ea5e9] mt-0.5">
                                {formatPrice(clientPrice * globalPax)} total
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Hébergement */}
          {hotels.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#FDF6EC] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF6EC] flex items-center justify-center">
                    <Hotel size={14} className="text-[#C4935A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Hébergements</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedHotels.size}/{hotels.length} sélectionnés</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll(hotels.length, setSelectedHotels)}
                    className="text-[10px] text-[#C4935A] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedHotels)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  // Group hotels by destination for visual separation
                  const destGroups: Record<string, number[]> = {};
                  hotels.forEach((h: any, i: number) => {
                    const dest = h.destination || "Non précisé";
                    if (!destGroups[dest]) destGroups[dest] = [];
                    destGroups[dest].push(i);
                  });
                  const destKeys = Object.keys(destGroups);
                  const isMultiDest = destKeys.length > 1;

                  return destKeys.map((destName, di) => (
                    <div key={destName}>
                      {isMultiDest && (
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${di > 0 ? "mt-4" : ""}`}
                          style={{
                            background: [
                              "#EFF6FF",
                              "#F0FDF4",
                              "#FEF3C7",
                              "#FDF2F8",
                            ][di % 4],
                            border: `1px solid ${["#BFDBFE", "#BBF7D0", "#FDE68A", "#FBCFE8"][di % 4]}`,
                          }}
                        >
                          <MapPin
                            size={12}
                            style={{
                              color: [
                                "#3B82F6",
                                "#10B981",
                                "#F59E0B",
                                "#EC4899",
                              ][di % 4],
                            }}
                          />
                          <span className="text-xs font-bold text-gray-800">
                            {destName}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {destGroups[destName].length} hôtel
                            {destGroups[destName].length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {destGroups[destName].map((i) => {
                        const h = hotels[i];
                        const selected = selectedHotels.has(i);
                        const basePrice = parsePrice(
                          h.pricePerNight || h.price,
                        );
                        const clientPrice = getClientPrice(
                          `hotel-${i}`,
                          basePrice,
                        );
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selected ? "bg-[#FDF6EC]/50 border-[#C4935A]/25" : "bg-[#f8fafc]/50 border-[#e2e8f0] opacity-50"}`}
                            onClick={() =>
                              toggleItem(selectedHotels, setSelectedHotels, i)
                            }
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#C4935A] border-[#C4935A] text-white" : "border-[#cbd5e1]"}`}
                            >
                              {selected && <Check size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#0f172a] text-[13px]">
                                {h.name}{" "}
                                {h.stars && (
                                  <span className="text-[#f59e0b] text-[11px] ml-1">
                                    {"★".repeat(Math.min(h.stars, 5))}
                                  </span>
                                )}
                              </p>
                              <p className="text-[12px] text-[#64748b]">
                                {h.destination || ""}{" "}
                                {h.highlights
                                  ? "· " +
                                  (h.highlights as string[])
                                    .slice(0, 2)
                                    .join(", ")
                                  : ""}
                              </p>
                            </div>
                            <div
                              className="text-right shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] text-[#94a3b8] line-through">
                                {h.pricePerNight || h.price}
                              </p>
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  value={clientPrice}
                                  onChange={(e) =>
                                    setCustomPrices((p) => ({
                                      ...p,
                                      [`hotel-${i}`]:
                                        parseInt(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-16 text-right text-[13px] font-semibold text-[#2E2E2E] bg-transparent border-b border-[#e2e8f0] focus:border-[#b9dae9] outline-none px-1 py-0.5 transition-colors"
                                />
                                <span className="text-[10px] text-[#64748b] ml-1">
                                  €/n
                                </span>
                              </div>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setHotelNights(prev => ({ ...prev, [i]: Math.max(1, getHotelNights(i) - 1) })); }}
                                  className="w-5 h-5 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded text-[10px] transition-colors"
                                >−</button>
                                <span className="text-[11px] font-semibold text-[#C4935A] min-w-[20px] text-center">{getHotelNights(i)}n</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setHotelNights(prev => ({ ...prev, [i]: getHotelNights(i) + 1 })); }}
                                  className="w-5 h-5 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] rounded text-[10px] transition-colors"
                                >+</button>
                              </div>
                              <p className="text-[10px] font-bold text-[#C4935A] mt-0.5">
                                {formatPrice(clientPrice * getHotelNights(i))} total
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Transferts */}
          {transfers.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#F0EBF8] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F0EBF8] flex items-center justify-center">
                    <Car size={14} className="text-[#8B7BB3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Transferts</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedTransfers.size}/{transfers.length} sélectionnés</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll(transfers.length, setSelectedTransfers)}
                    className="text-[10px] text-[#8B7BB3] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedTransfers)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {transfers.map((t: any, i: number) => {
                  const selected = selectedTransfers.has(i);
                  const basePrice = parsePrice(t.price);
                  const clientPrice = getClientPrice(`transfer-${i}`, basePrice);
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selected ? "bg-[#F0EBF8]/50 border-[#8B7BB3]/25" : "bg-gray-50/50 border-gray-200 opacity-50"}`}
                      onClick={() => toggleItem(selectedTransfers, setSelectedTransfers, i)}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#8B7BB3] border-[#8B7BB3] text-white" : "border-gray-300"}`}>
                        {selected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-[13px]">{t.type || "Chauffeur privé"}</p>
                        <p className="text-[12px] text-gray-500">De {t.from || "?"} à {t.to || "?"} {t.duration ? `· ${t.duration}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[10px] text-gray-400 line-through">{t.price}</p>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={clientPrice}
                            onChange={(e) => setCustomPrices((p) => ({ ...p, [`transfer-${i}`]: parseInt(e.target.value) || 0 }))}
                            className="w-16 text-right text-[13px] font-semibold text-[#2E2E2E] bg-transparent border-b border-gray-200 focus:border-[#b9dae9] outline-none px-1 py-0.5 transition-colors"
                          />
                          <span className="text-[10px] text-gray-500 ml-1">€</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Restaurants */}
          {restaurants.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#FDF0EE] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FDF0EE] flex items-center justify-center">
                    <UtensilsCrossed size={14} className="text-[#C27B6E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Gastronomie</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedRestaurants.size}/{restaurants.length} sélectionnés</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll(restaurants.length, setSelectedRestaurants)}
                    className="text-[10px] text-[#C27B6E] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedRestaurants)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {restaurants.map((resto: any, i: number) => {
                  const selected = selectedRestaurants.has(i);
                  const basePrice = parsePrice(resto.price || resto.priceEstimate);
                  const clientPrice = getClientPrice(`resto-${i}`, basePrice);
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selected ? "bg-[#FDF0EE]/50 border-[#C27B6E]/25" : "bg-gray-50/50 border-gray-200 opacity-50"}`}
                      onClick={() => toggleItem(selectedRestaurants, setSelectedRestaurants, i)}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#C27B6E] border-[#C27B6E] text-white" : "border-gray-300"}`}>
                        {selected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-[13px]">
                          {resto.name} {resto.stars && <span className="text-amber-500 ml-1">{"★".repeat(Math.min(resto.stars, 3))}</span>}
                        </p>
                        <p className="text-[12px] text-gray-500">{resto.cuisine ? `Cuisine : ${resto.cuisine}` : resto.description || ""}</p>
                      </div>
                      <div className="text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={clientPrice}
                            onChange={(e) => setCustomPrices((p) => ({ ...p, [`resto-${i}`]: parseInt(e.target.value) || 0 }))}
                            className="w-16 text-right text-[13px] font-semibold text-[#2E2E2E] bg-transparent border-b border-gray-200 focus:border-[#b9dae9] outline-none px-1 py-0.5 transition-colors"
                          />
                          <span className="text-[10px] text-gray-500 ml-1">€/pers</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#C27B6E] mt-0.5">{formatPrice(clientPrice * globalPax)} total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itinéraire */}
          {days.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#EDF5F0] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EDF5F0] flex items-center justify-center">
                    <Map size={14} className="text-[#6B9E7C]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Itinéraire</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedDays.size}/{days.length} jours sélectionnés</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll(days.length, setSelectedDays)}
                    className="text-[10px] text-[#6B9E7C] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedDays)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {days.map((d: any, i: number) => {
                  const selected = selectedDays.has(i);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-2xl border-l-4 transition-all cursor-pointer ${selected ? "bg-[#EDF5F0]/50 border-[#6B9E7C]" : "bg-gray-50/40 border-gray-200 opacity-50"}`}
                      onClick={() =>
                        toggleItem(selectedDays, setSelectedDays, i)
                      }
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selected ? "bg-[#6B9E7C] border-[#6B9E7C] text-white" : "border-gray-300"}`}
                      >
                        {selected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#6B9E7C] uppercase tracking-wider">
                            Jour {i + 1}
                          </p>
                          {d.destination && (
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {d.destination}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800 text-sm">
                          {d.title}
                        </p>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {d.morning && <p>Matin : {d.morning}</p>}
                          {d.afternoon && <p>Après-midi : {d.afternoon}</p>}
                          {d.evening && <p>Soirée : {d.evening}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#F5EDF3] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F5EDF3] flex items-center justify-center">
                    <Star size={14} className="text-[#A87B9B]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2E2E] tracking-tight">Recommandations</h3>
                    <p className="text-[10px] text-[#9CA3AF]">{selectedRecos.size}/{recommendations.length} sélectionnées</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      selectAll(recommendations.length, setSelectedRecos)
                    }
                    className="text-[10px] text-[#A87B9B] hover:underline font-medium"
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => deselectAll(setSelectedRecos)}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec: any, i: number) => {
                  const selected = selectedRecos.has(i);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${selected ? "bg-[#F5EDF3]/50 border-[#A87B9B]/25" : "bg-gray-50/40 border-gray-100 opacity-50"}`}
                      onClick={() =>
                        toggleItem(selectedRecos, setSelectedRecos, i)
                      }
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selected ? "bg-[#A87B9B] border-[#A87B9B] text-white" : "border-gray-300"}`}
                      >
                        {selected && <Check size={12} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          {rec.text || rec}
                        </p>
                        {rec.type && (
                          <span className="text-[10px] text-[#A87B9B] uppercase font-semibold mt-0.5 inline-block">
                            {rec.type}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — Summary + Tips */}
        <div className="space-y-4">
          {/* Profil Client IA (internal only) */}
          {r?.client?.summary && (
            <div className="bg-[#b9dae9]/10 rounded-2xl p-4 border border-[#b9dae9]/20">
              <h3 className="text-[10px] font-semibold text-[#5a8fa3] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={12} /> Profil Client (interne)
              </h3>
              <p className="text-xs text-[#2E2E2E]/80 leading-relaxed">
                {r.client.summary}
              </p>
            </div>
          )}

          {/* Résumé financier */}
          <div className="bg-[#f8fafc] rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
            <h3 className="text-[11px] font-bold text-[#5a8fa3] uppercase tracking-[1px] mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-[#5a8fa3]" /> Résumé
              Financier
            </h3>
            <div className="space-y-3 text-[13px]">
              {totals.flightTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">
                    Vols ({selectedFlights.size})
                  </span>
                  <span className="font-semibold text-[#0f172a]">
                    {formatPrice(totals.flightTotal)}
                  </span>
                </div>
              )}
              {totals.hotelTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">
                    Hôtels ({selectedHotels.size})
                  </span>
                  <span className="font-semibold text-[#0f172a]">
                    {formatPrice(totals.hotelTotal)}
                  </span>
                </div>
              )}
              {totals.transferTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">
                    Transferts ({selectedTransfers.size})
                  </span>
                  <span className="font-semibold text-[#0f172a]">
                    {formatPrice(totals.transferTotal)}
                  </span>
                </div>
              )}
              {totals.restoTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b]">
                    Gastronomie ({selectedRestaurants.size})
                  </span>
                  <span className="font-semibold text-[#0f172a]">
                    {formatPrice(totals.restoTotal)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-[#e2e8f0] flex justify-between items-center">
                <span className="text-[#0f172a] font-medium">Total Client</span>
                <span className="font-bold text-[20px] text-[#5a8fa3]">
                  {formatPrice(totals.grandTotal)}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-[#94a3b8] pt-2">
                <span>
                  Basé sur {globalPax} voyageur{globalPax > 1 ? "s" : ""} •{" "}
                  {globalNights} nuits
                </span>
                <span>Marge appliquée : {marginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Infos devis */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
            <h3 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[1px] mb-4">
              Détails
            </h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Réf</span>
                <span className="font-medium text-[#0ea5e9]">{refNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Destination</span>
                <span className="font-medium text-[#0f172a]">
                  {lead.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Dates</span>
                <span className="font-medium text-[#0f172a]">
                  {lead.dates || "À confirmer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Budget</span>
                <span className="font-medium text-[#0f172a]">
                  {lead.budget || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="bg-[#b9dae9]/8 rounded-2xl p-4 border border-[#b9dae9]/15">
              <h3 className="text-[10px] font-semibold text-[#5a8fa3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lightbulb size={12} /> Conseils
              </h3>
              <div className="space-y-2">
                {tips.map((tip: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#2E2E2E]/70"
                  >
                    <span className="shrink-0 mt-0.5">•</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No results */}
      {!r && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-4">
          <p className="text-lg text-gray-400 mb-2">
            Aucun résultat d'agent IA pour ce devis
          </p>
          <p className="text-sm text-[#6B7280] mt-1 font-medium">
            Lancez les agents depuis la page d'accueil.
          </p>
        </div>
      )}
    </div>
  );
}
