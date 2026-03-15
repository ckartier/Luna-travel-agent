import jsPDF from 'jspdf';
import { formatPrice } from '@/src/lib/currency';

/**
 * Generate a luxury travel proposal PDF
 * — Features: Cover page, itinerary, pricing, branding
 */

interface PDFProposalData {
    destination: string;
    clientName: string;
    refNumber: string;
    dates: string;
    pax: string;
    nights: number;
    agentName: string;
    flights: { airline: string; route: string; price: number }[];
    hotels: { name: string; stars?: number; pricePerNight: number; totalStay: number; highlights?: string[] }[];
    transfers: { type: string; from: string; to: string; price: number }[];
    restaurants: { name: string; cuisine?: string; price: number }[];
    days: { title: string; morning?: string; afternoon?: string; evening?: string; highlight?: string }[];
    tips: string[];
    grandTotal: number;
    currency?: string;
}

// Color palette
const COLORS = {
    dark: '#1a1a2e',
    charcoal: '#2E2E2E',
    gold: '#E2C8A9',
    goldDark: '#8B7355',
    light: '#FAF9F7',
    white: '#FFFFFF',
    gray: '#94a3b8',
    grayLight: '#e2e8f0',
    emerald: '#059669',
    sky: '#0284c7',
};

function drawLine(doc: jsPDF, y: number, x1: number, x2: number, color = COLORS.grayLight) {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

function addPage(doc: jsPDF): number {
    doc.addPage();
    // Subtle header line on subsequent pages
    drawLine(doc, 15, 25, 185, COLORS.gold);
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray);
    doc.text('VOTRE CONCIERGERIE', 25, 12);
    doc.text('Travel beautifully.', 185, 12, { align: 'right' });
    return 25;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > 270) {
        return addPage(doc);
    }
    return y;
}

export function generateProposalPDF(data: PDFProposalData): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;

    // ═══ PAGE 1: COVER ═══
    // Dark background
    doc.setFillColor(COLORS.dark);
    doc.rect(0, 0, 210, 297, 'F');

    // Decorative top pattern
    doc.setDrawColor('#ffffff');
    doc.setLineWidth(0.1);
    for (let i = 0; i < 210; i += 8) {
        doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
        doc.circle(i, i / 2, 1, 'S');
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Luna branding
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gold);
    doc.text('VOTRE CONCIERGERIE', pageWidth / 2, 60, { align: 'center' });

    // Horizontal line
    doc.setDrawColor(COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(70, 66, 140, 66);

    // Destination title
    doc.setFontSize(36);
    doc.setTextColor(COLORS.white);
    doc.text(data.destination.toUpperCase(), pageWidth / 2, 100, { align: 'center' });

    // Subtitle
    doc.setFontSize(13);
    doc.setTextColor('#ffffff');
    doc.text('Votre Proposition de Voyage Sur Mesure', pageWidth / 2, 115, { align: 'center' });

    // Client info block
    doc.setFontSize(10);
    doc.setTextColor(COLORS.gold);
    doc.text(`Préparé pour ${data.clientName}`, pageWidth / 2, 140, { align: 'center' });

    // Info badges
    const badgeY = 165;
    const badges = [
        { label: 'Référence', value: data.refNumber },
        { label: 'Dates', value: data.dates || 'À confirmer' },
        { label: 'Voyageurs', value: data.pax || '2' },
        { label: 'Durée', value: `${data.nights} nuits` },
    ];
    const badgeWidth = 35;
    const totalBadgeWidth = badges.length * badgeWidth + (badges.length - 1) * 5;
    let bx = (pageWidth - totalBadgeWidth) / 2;

    badges.forEach(badge => {
        // Badge box
        doc.setFillColor('#ffffff');
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.roundedRect(bx, badgeY, badgeWidth, 22, 3, 3, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setFontSize(6);
        doc.setTextColor(COLORS.gray);
        doc.text(badge.label.toUpperCase(), bx + badgeWidth / 2, badgeY + 7, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(COLORS.white);
        doc.text(badge.value, bx + badgeWidth / 2, badgeY + 15, { align: 'center' });

        bx += badgeWidth + 5;
    });

    // Footer date
    doc.setFontSize(8);
    doc.setTextColor(COLORS.gray);
    doc.text(
        new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        pageWidth / 2, 260, { align: 'center' }
    );
    doc.text('© Votre Conciergerie — Travel beautifully.', pageWidth / 2, 267, { align: 'center' });

    // ═══ PAGE 2: TRANSPORT & HÉBERGEMENT ═══
    let y = addPage(doc);

    // Flights section
    if (data.flights.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text('✈️  TRANSPORT', margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 7;

        data.flights.forEach(f => {
            y = checkPageBreak(doc, y, 18);
            // Card background
            doc.setFillColor('#f8fafc');
            doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setTextColor(COLORS.charcoal);
            doc.text(`${f.airline} — ${f.route}`, margin + 5, y + 6);

            doc.setFontSize(9);
            doc.setTextColor(COLORS.emerald);
            doc.text(formatPrice(f.price, data.currency || 'EUR'), margin + contentWidth - 5, y + 6, { align: 'right' });

            y += 18;
        });

        y += 5;
    }

    // Hotels section
    if (data.hotels.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text(`🏨  HÉBERGEMENT (${data.nights} nuits)`, margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 7;

        data.hotels.forEach(h => {
            y = checkPageBreak(doc, y, 22);
            doc.setFillColor('#f8fafc');
            doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setTextColor(COLORS.charcoal);
            const stars = h.stars ? ' ⭐'.repeat(Math.min(h.stars, 5)) : '';
            doc.text(`${h.name}${stars}`, margin + 5, y + 6);

            if (h.highlights && h.highlights.length > 0) {
                doc.setFontSize(7);
                doc.setTextColor(COLORS.gray);
                doc.text(h.highlights.slice(0, 3).join(' · '), margin + 5, y + 12, { maxWidth: contentWidth - 50 });
            }

            doc.setFontSize(9);
            doc.setTextColor(COLORS.emerald);
            doc.text(formatPrice(h.totalStay, data.currency || 'EUR'), margin + contentWidth - 5, y + 6, { align: 'right' });
            doc.setFontSize(6);
            doc.setTextColor(COLORS.gray);
            doc.text(`${h.pricePerNight}€/nuit`, margin + contentWidth - 5, y + 12, { align: 'right' });

            y += 22;
        });

        y += 5;
    }

    // Transfers
    if (data.transfers.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text('🚗  TRANSFERTS', margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 7;

        data.transfers.forEach(t => {
            y = checkPageBreak(doc, y, 15);
            doc.setFillColor('#f8fafc');
            doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setTextColor(COLORS.charcoal);
            doc.text(`${t.type || 'Chauffeur'} — ${t.from} → ${t.to}`, margin + 5, y + 7);
            doc.setTextColor(COLORS.emerald);
            doc.text(formatPrice(t.price, data.currency || 'EUR'), margin + contentWidth - 5, y + 7, { align: 'right' });
            y += 16;
        });
        y += 5;
    }

    // Restaurants
    if (data.restaurants.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text('🍽  GASTRONOMIE', margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 7;

        data.restaurants.forEach(r => {
            y = checkPageBreak(doc, y, 15);
            doc.setFillColor('#f8fafc');
            doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setTextColor(COLORS.charcoal);
            doc.text(`${r.name}${r.cuisine ? ` (${r.cuisine})` : ''}`, margin + 5, y + 7);
            doc.setTextColor(COLORS.emerald);
            doc.text(formatPrice(r.price, data.currency || 'EUR'), margin + contentWidth - 5, y + 7, { align: 'right' });
            y += 16;
        });
        y += 5;
    }

    // ═══ PAGE 3: ITINÉRAIRE ═══
    if (data.days.length > 0) {
        y = addPage(doc);

        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text(`📍  VOTRE ITINÉRAIRE (${data.days.length} jours)`, margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 8;

        data.days.forEach((day, i) => {
            y = checkPageBreak(doc, y, 30);

            // Day accent bar
            doc.setFillColor(COLORS.emerald);
            doc.rect(margin, y, 2, 20, 'F');

            // Day number
            doc.setFontSize(7);
            doc.setTextColor(COLORS.emerald);
            doc.text(`JOUR ${i + 1}`, margin + 6, y + 4);

            // Day title
            doc.setFontSize(11);
            doc.setTextColor(COLORS.charcoal);
            doc.text(day.title || `Jour ${i + 1}`, margin + 6, y + 11);

            let dy = y + 16;
            if (day.morning) {
                doc.setFontSize(8);
                doc.setTextColor(COLORS.goldDark);
                doc.text('🌅 Matin :', margin + 6, dy);
                doc.setTextColor(COLORS.charcoal);
                const lines = doc.splitTextToSize(day.morning, contentWidth - 50);
                doc.text(lines, margin + 30, dy);
                dy += lines.length * 4 + 2;
            }
            if (day.afternoon) {
                dy = checkPageBreak(doc, dy, 10);
                doc.setFontSize(8);
                doc.setTextColor(COLORS.goldDark);
                doc.text('☀️ Après-midi :', margin + 6, dy);
                doc.setTextColor(COLORS.charcoal);
                const lines = doc.splitTextToSize(day.afternoon, contentWidth - 50);
                doc.text(lines, margin + 35, dy);
                dy += lines.length * 4 + 2;
            }
            if (day.evening) {
                dy = checkPageBreak(doc, dy, 10);
                doc.setFontSize(8);
                doc.setTextColor(COLORS.goldDark);
                doc.text('🌙 Soirée :', margin + 6, dy);
                doc.setTextColor(COLORS.charcoal);
                const lines = doc.splitTextToSize(day.evening, contentWidth - 50);
                doc.text(lines, margin + 30, dy);
                dy += lines.length * 4 + 2;
            }
            if (day.highlight) {
                dy = checkPageBreak(doc, dy, 8);
                doc.setFontSize(7);
                doc.setTextColor(COLORS.emerald);
                doc.text(`✨ ${day.highlight}`, margin + 6, dy);
                dy += 5;
            }
            y = dy + 6;
        });
    }

    // ═══ TIPS ═══
    if (data.tips.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.gold);
        doc.text('💡  CONSEILS PRATIQUES', margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
        y += 7;

        data.tips.forEach(tip => {
            y = checkPageBreak(doc, y, 12);
            doc.setFillColor('#fffbeb');
            doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
            doc.setFontSize(7);
            doc.setTextColor('#92400e');
            doc.text(`📌 ${tip}`, margin + 4, y + 6, { maxWidth: contentWidth - 8 });
            y += 14;
        });
    }

    // ═══ LAST PAGE: RÉCAPITULATIF ═══
    y = checkPageBreak(doc, y, 70);
    y += 5;

    doc.setFontSize(7);
    doc.setTextColor(COLORS.gold);
    doc.text('📋  RÉCAPITULATIF', margin, y);
    y += 2;
    drawLine(doc, y, margin, margin + contentWidth, COLORS.gold);
    y += 8;

    // Summary box
    doc.setFillColor('#f0f9ff');
    doc.roundedRect(margin, y, contentWidth, 56, 3, 3, 'F');
    doc.setDrawColor('#bfdbfe');
    doc.roundedRect(margin, y, contentWidth, 56, 3, 3, 'S');

    const summaryItems = [
        ['Référence', data.refNumber],
        ['Destination', data.destination],
        ['Dates', data.dates || 'À confirmer'],
        ['Voyageurs', data.pax || '2'],
        ['Durée', `${data.days.length} jours / ${data.nights} nuits`],
    ];

    let sy = y + 8;
    summaryItems.forEach(([label, value]) => {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.gray);
        doc.text(label, margin + 8, sy);
        doc.setTextColor(COLORS.charcoal);
        doc.text(value, margin + contentWidth - 8, sy, { align: 'right' });
        drawLine(doc, sy + 3, margin + 8, margin + contentWidth - 8, '#e2e8f0');
        sy += 8;
    });

    // Grand Total
    doc.setDrawColor('#3b82f6');
    doc.setLineWidth(1);
    doc.line(margin + 8, sy, margin + contentWidth - 8, sy);
    sy += 6;
    doc.setFontSize(10);
    doc.setTextColor(COLORS.charcoal);
    doc.text('Budget total estimé', margin + 8, sy);
    doc.setFontSize(16);
    doc.setTextColor('#3b82f6');
    doc.text(formatPrice(data.grandTotal, data.currency || 'EUR'), margin + contentWidth - 8, sy, { align: 'right' });

    // Footer
    y += 70;
    y = checkPageBreak(doc, y, 30);
    drawLine(doc, y, margin, margin + contentWidth, COLORS.grayLight);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.charcoal);
    doc.text(data.agentName, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray);
    doc.text('Votre Concierge Voyage Sur Mesure', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Ce devis est valable 10 jours.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`© ${new Date().getFullYear()} Votre Conciergerie`, pageWidth / 2, y, { align: 'center' });

    // Save
    doc.save(`Proposition_${data.destination.replace(/\s+/g, '_')}_${data.refNumber}.pdf`);
}
