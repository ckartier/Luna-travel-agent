export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';

/**
 * GET /api/crm/quote-pdf?id=xxx
 * Generates a premium HTML travel proposal that can be printed/saved as PDF.
 * Includes: Hero, itinerary day-by-day, hotel/flight/activity details, financial recap.
 * Data sources (priority order): Trip days/segments → Agent results → Quote items.
 */
export async function GET(req: NextRequest) {
    // Rate limit (public route, no auth, but limit abuse)
    const rlRes = rateLimitResponse(getRateLimitKey(req), 'default');
    if (rlRes) return rlRes;

    const quoteId = req.nextUrl.searchParams.get('id');
    if (!quoteId) {
        return NextResponse.json({ error: 'Missing quote ID' }, { status: 400 });
    }

    const { adminDb } = await import('@/src/lib/firebase/admin');

    // Search across all tenants for this quote
    const tenantsSnap = await adminDb.collection('tenants').get();
    let quoteData: any = null;
    let tenantId = '';

    for (const tenantDoc of tenantsSnap.docs) {
        const qSnap = await adminDb.collection(`tenants/${tenantDoc.id}/quotes`).doc(quoteId).get();
        if (qSnap.exists) {
            quoteData = { id: qSnap.id, ...qSnap.data() };
            tenantId = tenantDoc.id;
            break;
        }
    }

    if (!quoteData) {
        return new NextResponse('Devis introuvable', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ═══ FETCH BUSINESS CONFIG ═══
    let bizName = 'Votre Conciergerie';
    let bizLogo = '';
    let bizTagline = 'Travel beautifully.';
    let bizEmail = '';
    let bizPhone = '';
    try {
        const configSnap = await adminDb.collection(`tenants/${tenantId}/config`).doc('site').get();
        const cfg = configSnap.data() || {};
        if (cfg.business?.name) bizName = cfg.business.name;
        else if (cfg.global?.siteName) bizName = cfg.global.siteName;
        if (cfg.global?.logo) bizLogo = cfg.global.logo;
        if (cfg.business?.tagline) bizTagline = cfg.business.tagline;
        if (cfg.business?.email) bizEmail = cfg.business.email;
        if (cfg.business?.phone) bizPhone = cfg.business.phone;
    } catch { /* fallback */ }

    // ═══ FETCH TRIP DATA (primary source) ═══
    let tripData: any = null;
    let tripDays: any[] = [];
    let tripImages: string[] = [];
    let tripDestination = '';

    if (quoteData.tripId) {
        try {
            const tripSnap = await adminDb.collection(`tenants/${tenantId}/trips`).doc(quoteData.tripId).get();
            if (tripSnap.exists) {
                tripData = tripSnap.data() || {};
                tripDestination = tripData.destination || tripData.title || '';
                if (tripData.coverImage) tripImages.push(tripData.coverImage);
                if (tripData.images && Array.isArray(tripData.images)) {
                    tripImages = [...tripImages, ...tripData.images.slice(0, 4)];
                }

                // Fetch trip days with segments
                const daysSnap = await adminDb.collection(`tenants/${tenantId}/trips/${quoteData.tripId}/days`).orderBy('dayIndex', 'asc').get();
                tripDays = daysSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
        } catch { /* ok */ }
    }

    // ═══ FETCH AGENT RESULTS (fallback) ═══
    let agentResults: any = null;
    if (quoteData.leadId) {
        try {
            const leadSnap = await adminDb.collection(`tenants/${tenantId}/leads`).doc(quoteData.leadId).get();
            if (leadSnap.exists) {
                const leadData = leadSnap.data() || {};
                agentResults = leadData.agentResults || null;
            }
        } catch { /* ok */ }
    }

    // ═══ BUILD DATA ═══
    const q = quoteData;
    const items = q.items || [];
    const issueDate = formatDateFR(q.issueDate || new Date().toISOString().split('T')[0]);
    const validUntil = q.validUntil ? formatDateFR(q.validUntil) : '';
    const destination = tripDestination || q.destination || '';
    const heroImage = tripImages[0] || '';

    // Organize segments by type for dedicated sections
    const allSegments = tripDays.flatMap((d: any) => (d.segments || []).map((s: any) => ({ ...s, dayTitle: d.title, dayDate: d.date, dayIndex: d.dayIndex })));
    const hotels = allSegments.filter((s: any) => s.type === 'HOTEL');
    const flights = allSegments.filter((s: any) => s.type === 'FLIGHT' || s.type === 'TRAIN');
    const activities = allSegments.filter((s: any) => s.type === 'ACTIVITY');
    const transfers = allSegments.filter((s: any) => s.type === 'TRANSFER');

    // Fallback to agent results if no trip segments
    const agentHotels = agentResults?.accommodation?.hotels || [];
    const agentFlights = agentResults?.transport?.flights || [];
    const agentDays = agentResults?.itinerary?.days || [];
    const agentTips = agentResults?.itinerary?.tips || agentResults?.client?.tips || [];

    const hasItinerary = tripDays.length > 0 || agentDays.length > 0;
    const hasHotels = hotels.length > 0 || agentHotels.length > 0;
    const hasFlights = flights.length > 0 || agentFlights.length > 0;
    const hasActivities = activities.length > 0;
    const hasTransfers = transfers.length > 0;

    // ═══ HTML GENERATION ═══
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposition — ${destination || q.quoteNumber} | ${bizName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #2E2E2E; background: #f4f1ed; -webkit-font-smoothing: antialiased; }
  
  .page { max-width: 800px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 100px rgba(0,0,0,0.1); }
  
  /* ─── Hero ─── */
  .hero {
    position: relative;
    background: linear-gradient(135deg, #1a1a2e 0%, #2E2E2E 50%, #1a1a2e 100%);
    color: white;
    padding: 56px 48px 48px;
    min-height: ${heroImage ? '380px' : '240px'};
    display: flex; flex-direction: column; justify-content: flex-end;
    overflow: hidden;
  }
  .hero-image {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; opacity: 0.32;
  }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(26,26,46,0.97) 0%, rgba(26,26,46,0.5) 50%, rgba(26,26,46,0.25) 100%);
  }
  .hero-content { position: relative; z-index: 2; }
  .hero-branding { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .hero-logo { font-size: 11px; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #b9dae9; }
  .hero-logo-img { height: 36px; object-fit: contain; }
  .hero-badge { background: rgba(185,218,233,0.1); border: 1px solid rgba(185,218,233,0.2); border-radius: 12px; padding: 10px 18px; text-align: right; }
  .hero-badge .label { font-size: 8px; color: rgba(255,255,255,0.35); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 3px; }
  .hero-badge .value { font-size: 15px; font-weight: 600; letter-spacing: 1px; }
  .hero h1 { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 12px; line-height: 1.15; }
  .hero-meta { font-size: 12px; color: rgba(255,255,255,0.45); display: flex; gap: 24px; flex-wrap: wrap; }
  .hero-meta span { display: flex; align-items: center; gap: 6px; }
  
  /* ─── Gallery ─── */
  .gallery { display: flex; gap: 0; overflow: hidden; height: 180px; }
  .gallery img { flex: 1; object-fit: cover; min-width: 0; }
  
  /* ─── Content ─── */
  .content { padding: 48px; }
  .section { margin-bottom: 48px; }
  .section-header { 
    display: flex; align-items: center; gap: 14px; 
    margin-bottom: 24px; padding-bottom: 16px; 
    border-bottom: 1px solid #f0ebe3; 
  }
  .section-icon { 
    width: 40px; height: 40px; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; 
    font-size: 18px; flex-shrink: 0; 
  }
  .section-title { 
    font-size: 10px; font-weight: 700; 
    letter-spacing: 4px; text-transform: uppercase; 
    color: #9CA3AF; 
  }
  .section-subtitle { font-size: 13px; color: #6B7280; font-weight: 400; margin-top: 2px; }
  
  /* ─── Voyage Summary ─── */
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 48px; }
  .summary-card {
    background: #fafaf8; border-radius: 16px; padding: 20px 16px;
    text-align: center; border: 1px solid #f0ebe3;
  }
  .summary-card .label { font-size: 8px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #9CA3AF; margin-bottom: 8px; }
  .summary-card .value { font-size: 15px; font-weight: 600; color: #2E2E2E; line-height: 1.3; }
  
  /* ─── Itinerary Timeline ─── */
  .timeline { position: relative; padding-left: 32px; }
  .timeline::before {
    content: ''; position: absolute; left: 11px; top: 8px; bottom: 8px;
    width: 2px; background: linear-gradient(to bottom, #b9dae9, #e8d5c0, #b9dae9);
    border-radius: 2px;
  }
  .day-block { position: relative; margin-bottom: 32px; }
  .day-block:last-child { margin-bottom: 0; }
  .day-dot {
    position: absolute; left: -32px; top: 4px;
    width: 22px; height: 22px; border-radius: 50%;
    background: white; border: 2.5px solid #b9dae9;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #2E2E2E; z-index: 1;
  }
  .day-header { margin-bottom: 12px; }
  .day-label { font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #b9dae9; }
  .day-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: #2E2E2E; margin-top: 2px; }
  .day-date { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
  .day-segments { display: flex; flex-direction: column; gap: 8px; }
  .segment {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 16px; background: #fafaf8;
    border-radius: 12px; border: 1px solid #f0ebe3;
    font-size: 13px; color: #2E2E2E;
  }
  .segment-icon { font-size: 14px; margin-top: 2px; flex-shrink: 0; }
  .segment-title { font-weight: 500; }
  .segment-desc { font-size: 11px; color: #9CA3AF; line-height: 1.5; margin-top: 2px; }
  .segment-price { margin-left: auto; font-weight: 600; color: #059669; white-space: nowrap; font-size: 13px; }
  
  /* ─── Agent Day Details ─── */
  .agent-slot { padding: 8px 14px; background: #fafaf8; border-radius: 10px; border: 1px solid #f0ebe3; margin-bottom: 6px; }
  .agent-slot-label { font-size: 10px; font-weight: 600; color: #b9dae9; margin-bottom: 2px; }
  .agent-slot-text { font-size: 12px; color: #4B5563; line-height: 1.6; }
  .agent-highlight { font-size: 11px; color: #059669; font-weight: 500; margin-top: 4px; }
  
  /* ─── Detail Cards ─── */
  .detail-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .detail-card {
    background: #fafaf8; border-radius: 16px; padding: 20px;
    border: 1px solid #f0ebe3; transition: all 0.2s;
  }
  .detail-card-full { grid-column: span 2; }
  .detail-card .card-type { font-size: 8px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #b9dae9; margin-bottom: 8px; }
  .detail-card .card-name { font-size: 15px; font-weight: 600; color: #2E2E2E; margin-bottom: 4px; }
  .detail-card .card-meta { font-size: 11px; color: #9CA3AF; line-height: 1.6; }
  .detail-card .card-highlights { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .detail-card .highlight-tag { font-size: 9px; padding: 4px 10px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; color: #6B7280; font-weight: 500; }
  .detail-card .card-price { font-size: 18px; font-weight: 600; color: #059669; margin-top: 10px; }
  .detail-card .card-price-sub { font-size: 10px; color: #9CA3AF; font-weight: 400; }
  
  /* ─── Financial Recap ─── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { font-size: 9px; font-weight: 700; color: #9CA3AF; letter-spacing: 2px; text-transform: uppercase; text-align: left; padding: 14px 16px; border-bottom: 2px solid #f0ebe3; }
  th:last-child { text-align: right; }
  td { padding: 16px; font-size: 13px; border-bottom: 1px solid #f8f8f6; vertical-align: middle; }
  td:last-child { text-align: right; font-weight: 600; white-space: nowrap; color: #2E2E2E; }
  .item-row:nth-child(even) { background: #fafaf8; }
  .item-name { font-weight: 600; color: #2E2E2E; }
  
  /* ─── Totals ─── */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { min-width: 320px; background: #fafaf8; border-radius: 20px; padding: 28px; border: 1px solid #f0ebe3; }
  .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #6B7280; }
  .total-row.grand {
    border-top: 2px solid #2E2E2E; padding-top: 18px; margin-top: 10px;
    font-size: 24px; font-weight: 700; color: #2E2E2E;
  }
  
  /* ─── Tips ─── */
  .tips-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tip-card {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 14px 16px; background: #fffbf0; border: 1px solid #fde68a;
    border-radius: 12px; font-size: 12px; color: #92400e; line-height: 1.5;
  }
  .tip-icon { flex-shrink: 0; margin-top: 1px; }
  
  /* ─── Validity ─── */
  .validity {
    background: linear-gradient(135deg, #b9dae9 0%, #a8cdd8 100%);
    border-radius: 18px; padding: 28px 36px;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 32px;
  }
  .validity p { font-size: 14px; color: #1a1a2e; font-weight: 500; }
  .validity .date { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  
  /* ─── Contact ─── */
  .contact-bar {
    display: flex; justify-content: center; gap: 32px;
    padding: 20px 48px; background: #fafaf8; border-top: 1px solid #f0ebe3;
    font-size: 12px; color: #9CA3AF;
  }
  .contact-bar span { display: flex; align-items: center; gap: 6px; }
  
  /* ─── Footer ─── */
  .footer {
    background: #2E2E2E; color: white;
    padding: 36px 48px; text-align: center;
  }
  .footer-brand { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 6px; }
  .footer-tagline { font-size: 12px; color: #b9dae9; font-style: italic; margin-bottom: 14px; }
  .footer-legal { font-size: 10px; color: rgba(255,255,255,0.25); line-height: 1.8; }
  
  .print-btn {
    display: block; text-align: center;
    margin: 28px auto 48px; padding: 18px 56px;
    background: #2E2E2E; color: white; border: none;
    border-radius: 14px; font-size: 12px; font-weight: 600;
    letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .print-btn:hover { background: #b9dae9; color: #2E2E2E; }
  
  @media print {
    body { background: white; padding: 0; }
    .page { box-shadow: none; border-radius: 0; margin: 0; max-width: none; }
    .print-btn { display: none !important; }
    .hero { min-height: ${heroImage ? '280px' : '180px'}; }
    .day-block { page-break-inside: avoid; }
    .detail-card { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- ═══ HERO ═══ -->
  <div class="hero">
    ${heroImage ? `<img class="hero-image" src="${heroImage}" alt="Destination" />` : ''}
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-branding">
        <div>
          ${bizLogo ? `<img class="hero-logo-img" src="${bizLogo}" alt="${esc(bizName)}" />` : `<div class="hero-logo">${esc(bizName)}</div>`}
        </div>
        <div class="hero-badge">
          <div class="label">Devis N°</div>
          <div class="value">${esc(q.quoteNumber || quoteId)}</div>
        </div>
      </div>
      <h1>${destination ? `${esc(destination)}` : 'Votre Voyage Sur Mesure'}</h1>
      <div class="hero-meta">
        <span>👤 ${esc(q.clientName || 'Client')}</span>
        <span>📅 Émis le ${issueDate}</span>
        ${validUntil ? `<span>⏳ Valide jusqu'au ${validUntil}</span>` : ''}
        ${tripData?.startDate ? `<span>🗓 ${formatDateFR(tripData.startDate)} — ${formatDateFR(tripData.endDate || tripData.startDate)}</span>` : ''}
        <span>💰 ${(q.totalAmount || 0).toLocaleString('fr-FR')} €</span>
      </div>
    </div>
  </div>

  ${tripImages.length > 1 ? `
  <!-- ═══ GALLERY ═══ -->
  <div class="gallery">
    ${tripImages.slice(1, 4).map((img: string) => `<img src="${img}" alt="Voyage" />`).join('')}
  </div>
  ` : ''}

  <!-- ═══ CONTENT ═══ -->
  <div class="content">

    <!-- ── Résumé du Voyage ── -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Destination</div>
        <div class="value">${esc(destination || 'Sur mesure')}</div>
      </div>
      <div class="summary-card">
        <div class="label">Voyageurs</div>
        <div class="value">${esc(tripData?.travelers?.toString() || q.pax || '2')} pers.</div>
      </div>
      <div class="summary-card">
        <div class="label">Durée</div>
        <div class="value">${tripDays.length > 0 ? `${tripDays.length} jours` : (agentDays.length > 0 ? `${agentDays.length} jours` : '—')}</div>
      </div>
      <div class="summary-card">
        <div class="label">Budget</div>
        <div class="value">${(q.totalAmount || 0).toLocaleString('fr-FR')} €</div>
      </div>
    </div>

    ${hasItinerary ? `
    <!-- ═══ ITINÉRAIRE JOUR PAR JOUR ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#eef7fb;">📍</div>
        <div>
          <div class="section-title">Votre Itinéraire</div>
          <div class="section-subtitle">${tripDays.length || agentDays.length} jours d'expériences sur mesure</div>
        </div>
      </div>
      <div class="timeline">
        ${tripDays.length > 0 ? 
          tripDays.map((day: any, i: number) => `
          <div class="day-block">
            <div class="day-dot">${i + 1}</div>
            <div class="day-header">
              <div class="day-label">Jour ${i + 1}</div>
              <div class="day-title">${esc(day.title || day.location || `Jour ${i + 1}`)}</div>
              ${day.date ? `<div class="day-date">${formatDateFR(day.date)}</div>` : ''}
            </div>
            ${(day.segments || []).length > 0 ? `
            <div class="day-segments">
              ${(day.segments || []).map((seg: any) => `
              <div class="segment">
                <span class="segment-icon">${getSegmentIcon(seg.type)}</span>
                <div style="flex:1;">
                  <div class="segment-title">${esc(seg.title || seg.type)}</div>
                  ${seg.description ? `<div class="segment-desc">${esc(seg.description)}</div>` : ''}
                  ${seg.location ? `<div class="segment-desc">📍 ${esc(seg.location)}</div>` : ''}
                  ${seg.startTime ? `<div class="segment-desc">🕐 ${esc(seg.startTime)}${seg.endTime ? ` — ${esc(seg.endTime)}` : ''}</div>` : ''}
                </div>
                ${(seg.clientPrice || seg.cost || seg.netCost) ? `<div class="segment-price">${(seg.clientPrice || seg.cost || seg.netCost || 0).toLocaleString('fr-FR')} €</div>` : ''}
              </div>
              `).join('')}
            </div>` : ''}
          </div>
        `).join('')
        : 
          agentDays.map((day: any, i: number) => `
          <div class="day-block">
            <div class="day-dot">${i + 1}</div>
            <div class="day-header">
              <div class="day-label">Jour ${i + 1}</div>
              <div class="day-title">${esc(day.title || `Jour ${i + 1}`)}</div>
            </div>
            <div class="day-segments">
              ${day.morning ? `
              <div class="agent-slot">
                <div class="agent-slot-label">🌅 Matin</div>
                <div class="agent-slot-text">${esc(day.morning)}</div>
              </div>` : ''}
              ${day.afternoon ? `
              <div class="agent-slot">
                <div class="agent-slot-label">☀️ Après-midi</div>
                <div class="agent-slot-text">${esc(day.afternoon)}</div>
              </div>` : ''}
              ${day.evening ? `
              <div class="agent-slot">
                <div class="agent-slot-label">🌙 Soirée</div>
                <div class="agent-slot-text">${esc(day.evening)}</div>
              </div>` : ''}
              ${day.highlight ? `<div class="agent-highlight">✨ ${esc(day.highlight)}</div>` : ''}
            </div>
          </div>
          `).join('')
        }
      </div>
    </div>
    ` : ''}

    ${hasHotels ? `
    <!-- ═══ HÉBERGEMENT ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#f0f7ff;">🏨</div>
        <div>
          <div class="section-title">Hébergement</div>
          <div class="section-subtitle">Sélectionné pour votre confort</div>
        </div>
      </div>
      <div class="detail-cards">
        ${hotels.length > 0 ?
          hotels.map((h: any) => `
          <div class="detail-card">
            <div class="card-type">Hôtel</div>
            <div class="card-name">${esc(h.title || h.name || 'Hébergement')}</div>
            ${h.location ? `<div class="card-meta">📍 ${esc(h.location)}</div>` : ''}
            ${h.description ? `<div class="card-meta">${esc(h.description)}</div>` : ''}
            ${h.clientPrice ? `<div class="card-price">${h.clientPrice.toLocaleString('fr-FR')} € <span class="card-price-sub">/ séjour</span></div>` : ''}
          </div>
          `).join('')
        :
          agentHotels.map((h: any) => `
          <div class="detail-card">
            <div class="card-type">Hôtel ${h.stars ? '⭐'.repeat(Math.min(h.stars, 5)) : ''}</div>
            <div class="card-name">${esc(h.name || 'Hébergement')}</div>
            ${h.highlights?.length ? `
            <div class="card-highlights">
              ${h.highlights.slice(0, 4).map((hl: string) => `<span class="highlight-tag">${esc(hl)}</span>`).join('')}
            </div>` : ''}
            ${h.pricePerNight ? `<div class="card-price">${h.totalStay ? h.totalStay.toLocaleString('fr-FR') : h.pricePerNight.toLocaleString('fr-FR')} € <span class="card-price-sub">${h.pricePerNight ? `(${h.pricePerNight}€/nuit)` : ''}</span></div>` : ''}
          </div>
          `).join('')
        }
      </div>
    </div>
    ` : ''}

    ${hasFlights ? `
    <!-- ═══ TRANSPORT ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#eef7fb;">✈️</div>
        <div>
          <div class="section-title">Transport</div>
          <div class="section-subtitle">Vols et transferts inclus</div>
        </div>
      </div>
      <div class="detail-cards">
        ${flights.length > 0 ?
          flights.map((f: any) => `
          <div class="detail-card detail-card-full">
            <div class="card-type">${f.type === 'TRAIN' ? 'Train' : 'Vol'}</div>
            <div class="card-name">${esc(f.title || 'Transport')}</div>
            ${f.outboundLocation ? `<div class="card-meta">🛫 ${esc(f.outboundLocation)} → ${esc(f.outboundDestination || '')}</div>` : ''}
            ${f.returnEnabled ? `<div class="card-meta">🛬 ${esc(f.returnLocation || '')} → ${esc(f.returnDestination || '')}</div>` : ''}
            ${f.description ? `<div class="card-meta">${esc(f.description)}</div>` : ''}
            ${f.clientPrice ? `<div class="card-price">${f.clientPrice.toLocaleString('fr-FR')} €</div>` : ''}
          </div>
          `).join('')
        :
          agentFlights.map((f: any) => `
          <div class="detail-card detail-card-full">
            <div class="card-type">Vol</div>
            <div class="card-name">${esc(f.airline || 'Compagnie')} — ${esc(f.route || '')}</div>
            ${f.price ? `<div class="card-price">${f.price.toLocaleString('fr-FR')} €</div>` : ''}
          </div>
          `).join('')
        }
      </div>
    </div>
    ` : ''}

    ${hasActivities ? `
    <!-- ═══ ACTIVITÉS ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#f0fdf4;">🎯</div>
        <div>
          <div class="section-title">Activités & Expériences</div>
          <div class="section-subtitle">${activities.length} expérience${activities.length > 1 ? 's' : ''} sélectionnée${activities.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="detail-cards">
        ${activities.map((a: any) => `
        <div class="detail-card">
          <div class="card-type">Expérience</div>
          <div class="card-name">${esc(a.title || 'Activité')}</div>
          ${a.location ? `<div class="card-meta">📍 ${esc(a.location)}</div>` : ''}
          ${a.description ? `<div class="card-meta">${esc(a.description)}</div>` : ''}
          ${a.clientPrice ? `<div class="card-price">${a.clientPrice.toLocaleString('fr-FR')} €</div>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${hasTransfers ? `
    <!-- ═══ TRANSFERTS ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#fef3c7;">🚗</div>
        <div>
          <div class="section-title">Transferts</div>
        </div>
      </div>
      <div class="detail-cards">
        ${transfers.map((t: any) => `
        <div class="detail-card detail-card-full">
          <div class="card-type">Transfert</div>
          <div class="card-name">${esc(t.title || 'Transfert')}</div>
          ${t.outboundLocation ? `<div class="card-meta">📍 ${esc(t.outboundLocation)} → ${esc(t.outboundDestination || '')}</div>` : ''}
          ${t.description ? `<div class="card-meta">${esc(t.description)}</div>` : ''}
          ${t.clientPrice ? `<div class="card-price">${t.clientPrice.toLocaleString('fr-FR')} €</div>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${agentTips.length > 0 ? `
    <!-- ═══ CONSEILS ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#fffbeb;">💡</div>
        <div>
          <div class="section-title">Conseils Pratiques</div>
          <div class="section-subtitle">Pour préparer votre voyage sereinement</div>
        </div>
      </div>
      <div class="tips-grid">
        ${agentTips.slice(0, 6).map((tip: string) => `
        <div class="tip-card">
          <span class="tip-icon">📌</span>
          <span>${esc(tip)}</span>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- ═══ RÉCAPITULATIF FINANCIER ═══ -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#f0fdf4;">💰</div>
        <div>
          <div class="section-title">Récapitulatif Financier</div>
          <div class="section-subtitle">Prix par personne tout compris</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:55%">Prestation</th>
            <th>Qté</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it: any) => `
          <tr class="item-row">
            <td><span class="item-name">${esc(it.description || 'Prestation')}</span></td>
            <td style="color:#9CA3AF">${it.quantity || 1}</td>
            <td>${(it.unitPrice || 0).toLocaleString('fr-FR')} €</td>
            <td>${(it.total || (it.unitPrice || 0) * (it.quantity || 1)).toLocaleString('fr-FR')} €</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span>Sous-total HT</span>
            <span>${(q.subtotal || 0).toLocaleString('fr-FR')} €</span>
          </div>
          ${q.taxTotal > 0 ? `
          <div class="total-row">
            <span>TVA</span>
            <span>${(q.taxTotal || 0).toLocaleString('fr-FR')} €</span>
          </div>
          ` : ''}
          <div class="total-row grand">
            <span>Total</span>
            <span>${(q.totalAmount || 0).toLocaleString('fr-FR')} €</span>
          </div>
        </div>
      </div>
    </div>

    ${validUntil ? `
    <!-- ═══ VALIDITY ═══ -->
    <div class="validity">
      <p>Ce devis est valable jusqu'au</p>
      <span class="date">${validUntil}</span>
    </div>
    ` : ''}
  </div>

  <!-- ═══ CONTACT ═══ -->
  ${(bizEmail || bizPhone) ? `
  <div class="contact-bar">
    ${bizEmail ? `<span>📧 ${esc(bizEmail)}</span>` : ''}
    ${bizPhone ? `<span>📞 ${esc(bizPhone)}</span>` : ''}
  </div>
  ` : ''}

  <!-- ═══ FOOTER ═══ -->
  <div class="footer">
    <div class="footer-brand">${esc(bizName)}</div>
    <div class="footer-tagline">${esc(bizTagline)}</div>
    <div class="footer-legal">
      Ce document fait office de proposition commerciale. Les prix sont indicatifs et peuvent être ajustés selon la disponibilité.<br>
      © ${new Date().getFullYear()} ${esc(bizName)} — Tous droits réservés.
    </div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">💾 Télécharger en PDF (Imprimer)</button>
</body>
</html>`;

    return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

function formatDateFR(d: string): string {
    try {
        const date = new Date(d);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return d;
    }
}

function getSegmentIcon(type: string): string {
    const icons: Record<string, string> = {
        FLIGHT: '✈️',
        TRAIN: '🚄',
        HOTEL: '🏨',
        ACTIVITY: '🎯',
        TRANSFER: '🚗',
    };
    return icons[type] || '📍';
}

function esc(s: string): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
