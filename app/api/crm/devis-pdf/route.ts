import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import { trackAPIUsage } from '@/src/lib/apiUsageTracker';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';
import { requireSubscription } from '@/src/lib/checkSubscription';
import { rateLimitResponse, getRateLimitKey } from '@/src/lib/rateLimit';
import { formatPrice } from '@/src/lib/currency';

/**
 * POST /api/crm/devis-pdf
 * Generate a premium Luna-branded devis PDF from trip data.
 * Body: { destination, clientName, startDate, endDate, pax, nights,
 *         agentName, segments[], totalAmount, refNumber }
 * Returns: PDF blob
 */

// ═══ Luna Brand Colors ═══
const C = {
    charcoal: '#2E2E2E',
    primary: '#bcdeea',
    primaryDark: '#5a8fa3',
    bg: '#F8FAFC',
    border: '#E5E7EB',
    muted: '#6B7280',
    white: '#FFFFFF',
};

interface Segment {
    type: string;
    title: string;
    description?: string;
}

interface DevisData {
    destination: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    clientAddress?: string;
    startDate: string;
    endDate: string;
    pax: string;
    nights: number;
    agentName: string;
    segments: Segment[];
    totalAmount: number;
    refNumber: string;
    currency?: string;
}

function drawLine(doc: jsPDF, y: number, x1: number, x2: number, color = C.border) {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const auth = await verifyAuth(req);
        if (auth instanceof Response) return auth;
        const paywall = await requireSubscription(auth, 'crm');
        if (paywall) return paywall;
        const tenantId = auth.tenantId;

        // Rate limit
        const rlRes = rateLimitResponse(getRateLimitKey(req), 'default');
        if (rlRes) return rlRes;

        const data: DevisData = await req.json();
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = 210;
        const m = 25;
        const cw = pw - 2 * m;

        // ═══════════════════════════════════════
        // PAGE 1: COVER — Charcoal + destination
        // ═══════════════════════════════════════
        doc.setFillColor(C.charcoal);
        doc.rect(0, 0, 210, 297, 'F');

        // Accent line at top
        doc.setFillColor(C.primary);
        doc.rect(0, 0, 210, 3, 'F');

        // "LUNA" text as logo
        doc.setFontSize(28);
        doc.setTextColor(C.white);
        doc.setFont('helvetica', 'bold');
        doc.text('LUNA', pw / 2, 55, { align: 'center' });

        // Thin line
        doc.setDrawColor(C.primary);
        doc.setLineWidth(0.5);
        doc.line(pw / 2 - 25, 62, pw / 2 + 25, 62);

        // Tagline
        doc.setFontSize(7);
        doc.setTextColor('#ffffff99');
        doc.text('PROPOSITION DE VOYAGE SUR MESURE', pw / 2, 70, { align: 'center' });

        // Destination
        const displayDest = (data.destination || 'Voyage').toUpperCase();
        doc.text(displayDest, pw / 2, 135, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor('#ffffffcc');
        doc.setFont('helvetica', 'normal');
        const subtitle = `${data.nights} nuits  ·  ${data.pax || '2 voyageurs'}`;
        doc.text(subtitle, pw / 2, 150, { align: 'center' });

        // ─── Total badge (Luna blue) ───
        const bw = 70, bh = 28;
        const bx = (pw - bw) / 2;
        const by = 170;
        doc.setFillColor(C.primaryDark);
        doc.roundedRect(bx, by, bw, bh, 6, 6, 'F');
        doc.setDrawColor(C.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(bx, by, bw, bh, 6, 6, 'S');

        doc.setFontSize(7);
        doc.setTextColor('#ffffffaa');
        doc.text('TOTAL TTC', pw / 2, by + 9, { align: 'center' });

        doc.setFontSize(18);
        doc.setTextColor(C.white);
        doc.setFont('helvetica', 'bold');
        doc.text(formatPrice(data.totalAmount, data.currency || 'EUR'), pw / 2, by + 22, { align: 'center' });

        // Client
        doc.setFontSize(10);
        doc.setTextColor('#ffffffcc');
        doc.setFont('helvetica', 'normal');
        doc.text(`Prepare pour ${data.clientName}`, pw / 2, 215, { align: 'center' });

        // Info badges
        const badges = [
            { label: 'REF.', value: data.refNumber },
            { label: 'DATES', value: data.startDate && data.endDate ? `${data.startDate.slice(8, 10)}/${data.startDate.slice(5, 7)} — ${data.endDate.slice(8, 10)}/${data.endDate.slice(5, 7)}` : '' },
            { label: 'DUREE', value: `${data.nights} nuits` },
            { label: 'AGENT', value: data.agentName || 'Luna' },
        ];
        const ibw = 35;
        const totalIbw = badges.length * ibw + (badges.length - 1) * 4;
        let ibx = (pw - totalIbw) / 2;
        const iby = 235;

        badges.forEach(badge => {
            doc.setFillColor('#ffffff');
            doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
            doc.roundedRect(ibx, iby, ibw, 18, 4, 4, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));

            doc.setFontSize(5);
            doc.setTextColor('#ffffff88');
            doc.text(badge.label, ibx + ibw / 2, iby + 6, { align: 'center' });

            doc.setFontSize(7);
            doc.setTextColor(C.white);
            doc.setFont('helvetica', 'bold');
            doc.text(badge.value, ibx + ibw / 2, iby + 13, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            ibx += ibw + 4;
        });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor('#ffffff44');
        doc.text('Luna Conciergerie  ·  Travel beautifully.', pw / 2, 275, { align: 'center' });

        // ═══════════════════════════════════════
        // PAGE 2: CONTENT — prestations + total
        // ═══════════════════════════════════════
        doc.addPage();

        // Header bar
        doc.setFillColor(C.charcoal);
        doc.rect(0, 0, 210, 22, 'F');
        doc.setFillColor(C.primary);
        doc.rect(0, 22, 210, 1.5, 'F');

        doc.setFontSize(12);
        doc.setTextColor(C.white);
        doc.setFont('helvetica', 'bold');
        doc.text('LUNA', m, 14);
        doc.setFont('helvetica', 'normal');

        doc.setFontSize(7);
        doc.setTextColor('#ffffff66');
        doc.text(`DEVIS N° ${data.refNumber}`, pw - m, 10, { align: 'right' });
        doc.text(new Date().toLocaleDateString('fr-FR'), pw - m, 16, { align: 'right' });

        let y = 32;

        // Client + Voyage info
        doc.setFontSize(7);
        doc.setTextColor(C.primaryDark);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT', m, y);
        doc.text('VOYAGE', pw / 2 + 10, y);
        doc.setFont('helvetica', 'normal');
        y += 6;

        doc.setFontSize(10);
        doc.setTextColor(C.charcoal);
        doc.setFont('helvetica', 'bold');
        doc.text(data.clientName, m, y);
        doc.text(`${data.destination}`, pw / 2 + 10, y);
        doc.setFont('helvetica', 'normal');
        y += 5;

        doc.setFontSize(8);
        doc.setTextColor(C.muted);
        if (data.clientAddress) doc.text(data.clientAddress, m, y);
        const dateRange = data.startDate && data.endDate
            ? `${data.startDate.slice(8, 10)}/${data.startDate.slice(5, 7)} — ${data.endDate.slice(8, 10)}/${data.endDate.slice(5, 7)}/${data.endDate.slice(0, 4)} (${data.nights} nuits)`
            : `${data.nights} nuits`;
        doc.text(dateRange, pw / 2 + 10, y);
        y += 5;

        if (data.clientEmail) doc.text(data.clientEmail, m, y);
        doc.text(data.pax || '2 voyageurs', pw / 2 + 10, y);
        y += 5;
        if (data.clientPhone) doc.text(data.clientPhone, m, y);
        y += 8;

        drawLine(doc, y, m, pw - m);
        y += 10;

        // ─── Prestations (NO PRICES — just list) ───
        doc.setFontSize(7);
        doc.setTextColor(C.primaryDark);
        doc.setFont('helvetica', 'bold');
        doc.text('PRESTATIONS INCLUSES', m, y);
        doc.setFont('helvetica', 'normal');
        y += 8;

        const typeLabels: Record<string, string> = {
            HOTEL: '🏨',
            FLIGHT: '✈️',
            ACTIVITY: '🏄',
            TRANSFER: '🚗',
        };

        // Group segments by type
        const grouped: Record<string, Segment[]> = {};
        data.segments.forEach(s => {
            const cat = s.type || 'ACTIVITY';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(s);
        });

        const typeOrder = ['FLIGHT', 'HOTEL', 'TRANSFER', 'ACTIVITY'];
        const typeNames: Record<string, string> = {
            FLIGHT: 'Transport',
            HOTEL: 'Hebergement',
            TRANSFER: 'Transferts',
            ACTIVITY: 'Activites & Experiences',
        };

        for (const type of typeOrder) {
            const segs = grouped[type];
            if (!segs || segs.length === 0) continue;

            if (y > 255) {
                doc.addPage();
                y = 25;
            }

            // Category header
            doc.setFillColor(C.bg);
            doc.roundedRect(m, y - 1, cw, 8, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(C.charcoal);
            doc.setFont('helvetica', 'bold');
            doc.text(`${typeLabels[type] || '📌'}  ${typeNames[type] || type}`, m + 4, y + 4);
            doc.setFont('helvetica', 'normal');
            y += 12;

            segs.forEach(seg => {
                if (y > 265) {
                    doc.addPage();
                    y = 25;
                }

                doc.setFontSize(9);
                doc.setTextColor(C.charcoal);
                doc.setFont('helvetica', 'bold');
                doc.text(seg.title, m + 4, y);
                doc.setFont('helvetica', 'normal');

                if (seg.description) {
                    y += 4;
                    doc.setFontSize(7.5);
                    doc.setTextColor(C.muted);
                    const lines = doc.splitTextToSize(seg.description, cw - 10);
                    doc.text(lines.slice(0, 2), m + 4, y);
                    y += lines.slice(0, 2).length * 3.5;
                }

                y += 6;
                drawLine(doc, y, m + 4, pw - m - 4, '#f0f0f0');
                y += 5;
            });

            y += 4;
        }

        // ─── TOTAL (Luna blue box) ───
        y += 5;
        if (y > 240) {
            doc.addPage();
            y = 30;
        }

        drawLine(doc, y, m, pw - m);
        y += 10;

        // Total box
        doc.setFillColor(C.primaryDark);
        doc.roundedRect(m, y, cw, 22, 5, 5, 'F');

        doc.setFontSize(11);
        doc.setTextColor(C.white);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL TTC', m + 10, y + 14);

        doc.setFontSize(20);
        doc.text(formatPrice(data.totalAmount, data.currency || 'EUR'), pw - m - 10, y + 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        y += 32;

        // ─── CONDITIONS ───
        if (y > 250) {
            doc.addPage();
            y = 25;
        }

        doc.setFontSize(7);
        doc.setTextColor(C.primaryDark);
        doc.setFont('helvetica', 'bold');
        doc.text('CONDITIONS', m, y);
        doc.setFont('helvetica', 'normal');
        y += 6;

        const conditions = [
            "Acompte de 30% a la reservation, solde 30 jours avant le depart.",
            "Annulation gratuite jusqu'a 45 jours avant le depart.",
            "Assurance voyage rapatriement et annulation incluse.",
            "Devis valable 15 jours. Prix en euros, TVA incluse.",
        ];

        doc.setFontSize(7.5);
        doc.setTextColor(C.muted);
        conditions.forEach(c => {
            doc.text(`  •  ${c}`, m, y);
            y += 4.5;
        });

        y += 10;

        // ─── SIGNATURE ───
        if (y > 240) {
            doc.addPage();
            y = 25;
        }

        drawLine(doc, y, m, pw - m);
        y += 8;

        doc.setFontSize(9);
        doc.setTextColor(C.charcoal);
        doc.setFont('helvetica', 'bold');
        doc.text('Luna Conciergerie', m, y);
        doc.text('Le Client', pw / 2 + 20, y);
        doc.setFont('helvetica', 'normal');
        y += 5;

        doc.setFontSize(7);
        doc.setTextColor(C.muted);
        doc.text('Date et signature :', m, y);
        doc.text('Bon pour accord, date et signature :', pw / 2 + 20, y);

        y += 22;
        drawLine(doc, y, m, m + 60, C.muted);
        drawLine(doc, y, pw / 2 + 20, pw / 2 + 80, C.muted);

        // Footer on all pages
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            if (i > 1) {
                doc.setFontSize(6.5);
                doc.setTextColor(C.muted);
                doc.text('Luna Conciergerie  ·  www.luna-conciergerie.com  ·  contact@luna-conciergerie.com', pw / 2, 290, { align: 'center' });
                doc.text(`${i - 1}`, pw - m, 290, { align: 'right' });
            }
        }

        // Track devis PDF generation
        if (tenantId) trackAPIUsage(tenantId, 'devisPdf');

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const safeDest = (data.destination || 'Voyage').replace(/\s+/g, '_');
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Devis_${safeDest}_${data.refNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error('[Devis PDF]', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
