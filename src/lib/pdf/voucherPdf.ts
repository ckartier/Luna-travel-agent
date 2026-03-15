import jsPDF from 'jspdf';
import { formatPrice } from '@/src/lib/currency';

/**
 * Generate a branded supplier voucher PDF.
 * Used when a booking is confirmed — sent to the supplier.
 */

interface VoucherData {
    // Agency branding
    agencyName: string;
    agencyLogo?: string;
    agencyEmail?: string;
    agencyPhone?: string;

    // Booking info
    bookingRef: string;
    supplierName: string;
    supplierAddress?: string;
    supplierPhone?: string;
    supplierEmail?: string;
    type: string; // HOTEL, ACTIVITY, TRANSFER, RESTAURANT, etc.

    // Client info
    clientName: string;
    clientPhone?: string;
    pax: number;

    // Dates
    checkIn: string;
    checkOut?: string;
    time?: string;

    // Details
    roomType?: string;
    mealPlan?: string;
    notes?: string;
    specialRequests?: string;
    confirmationNumber?: string;

    // Financial
    supplierPrice?: number;
    currency?: string;
}

const C = {
    charcoal: '#2E2E2E',
    gold: '#E2C8A9',
    goldDark: '#8B7355',
    bg: '#FAF9F7',
    white: '#FFFFFF',
    gray: '#9CA3AF',
    grayLight: '#E5E7EB',
    blue: '#5a8fa3',
};

function drawLine(doc: jsPDF, y: number, x1: number, x2: number, color = C.grayLight) {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

export function generateVoucherPdf(data: VoucherData): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const m = 20; // margin
    let y = 0;

    // ═══ HEADER — Black bar with agency info ═══
    doc.setFillColor(C.charcoal);
    doc.rect(0, 0, pw, 45, 'F');

    // Gold accent line
    doc.setFillColor(C.gold);
    doc.rect(0, 45, pw, 1.5, 'F');

    // Agency name
    doc.setTextColor(C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(data.agencyName, m, 18);

    // Voucher label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor('#ffffff80');
    doc.text('BON DE CONFIRMATION / VOUCHER', m, 26);

    // Booking ref right-aligned
    doc.setTextColor(C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Réf: ${data.bookingRef}`, pw - m, 18, { align: 'right' });

    // Date generated
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#ffffff80');
    doc.text(`Émis le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pw - m, 26, { align: 'right' });

    if (data.confirmationNumber) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(C.gold);
        doc.text(`N° Confirmation: ${data.confirmationNumber}`, pw - m, 35, { align: 'right' });
    }

    y = 55;

    // ═══ SUPPLIER INFO ═══
    doc.setFillColor('#F8F7F5');
    doc.roundedRect(m, y, pw - 2 * m, 38, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C.goldDark);
    doc.text('PRESTATAIRE', m + 6, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(C.charcoal);
    doc.text(data.supplierName, m + 6, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C.gray);
    let infoY = y + 24;
    if (data.supplierAddress) {
        doc.text(data.supplierAddress, m + 6, infoY);
        infoY += 5;
    }
    if (data.supplierPhone) {
        doc.text(`Tél: ${data.supplierPhone}`, m + 6, infoY);
    }
    if (data.supplierEmail) {
        doc.text(data.supplierEmail, pw / 2, y + 24);
    }

    y += 46;

    // ═══ BOOKING DETAILS — Grid layout ═══
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C.goldDark);
    doc.text('DÉTAILS DE LA RÉSERVATION', m, y);
    y += 8;

    const colW = (pw - 2 * m) / 3;
    const fields = [
        { label: 'TYPE', value: data.type || '—' },
        { label: 'CHECK-IN', value: data.checkIn || '—' },
        { label: 'CHECK-OUT', value: data.checkOut || '—' },
        { label: 'HEURE', value: data.time || '—' },
        { label: 'CHAMBRE / FORMULE', value: data.roomType || data.mealPlan || '—' },
        { label: 'REPAS', value: data.mealPlan || '—' },
    ];

    fields.forEach((f, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const fx = m + col * colW;
        const fy = y + row * 18;

        // Background
        doc.setFillColor(C.white);
        doc.roundedRect(fx, fy, colW - 4, 14, 2, 2, 'F');
        doc.setDrawColor(C.grayLight);
        doc.roundedRect(fx, fy, colW - 4, 14, 2, 2, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(C.gray);
        doc.text(f.label, fx + 4, fy + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(C.charcoal);
        doc.text(f.value, fx + 4, fy + 11);
    });

    y += Math.ceil(fields.length / 3) * 18 + 8;

    // ═══ CLIENT INFO ═══
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C.goldDark);
    doc.text('CLIENT', m, y);
    y += 6;

    doc.setFillColor(C.white);
    doc.roundedRect(m, y, pw - 2 * m, 22, 3, 3, 'F');
    doc.setDrawColor(C.grayLight);
    doc.roundedRect(m, y, pw - 2 * m, 22, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(C.charcoal);
    doc.text(data.clientName, m + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C.gray);
    const clientDetails = [];
    if (data.pax) clientDetails.push(`${data.pax} voyageur${data.pax > 1 ? 's' : ''}`);
    if (data.clientPhone) clientDetails.push(`Tél: ${data.clientPhone}`);
    doc.text(clientDetails.join('  ·  '), m + 6, y + 17);

    y += 30;

    // ═══ SPECIAL REQUESTS ═══
    if (data.specialRequests || data.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(C.goldDark);
        doc.text('DEMANDES SPÉCIALES / NOTES', m, y);
        y += 6;

        doc.setFillColor('#FFF8F0');
        const noteText = data.specialRequests || data.notes || '';
        const lines = doc.splitTextToSize(noteText, pw - 2 * m - 12);
        const noteH = Math.max(lines.length * 5 + 8, 18);
        doc.roundedRect(m, y, pw - 2 * m, noteH, 3, 3, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(C.charcoal);
        doc.text(lines, m + 6, y + 8);

        y += noteH + 8;
    }

    // ═══ AMOUNT (if provided) ═══
    if (data.supplierPrice) {
        doc.setFillColor(C.charcoal);
        doc.roundedRect(m, y, pw - 2 * m, 20, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(C.gold);
        doc.text('MONTANT FOURNISSEUR', m + 6, y + 9);

        doc.setFontSize(14);
        doc.setTextColor(C.white);
        doc.text(formatPrice(data.supplierPrice, data.currency || 'EUR'), pw - m - 6, y + 13, { align: 'right' });

        y += 28;
    }

    // ═══ CONDITIONS ═══
    y += 5;
    drawLine(doc, y, m, pw - m, C.grayLight);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(C.gray);
    doc.text('CONDITIONS', m, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const conditions = [
        'Ce bon confirme la réservation aux conditions convenues entre l\'agence et le prestataire.',
        'Toute modification ou annulation doit être communiquée par écrit à l\'agence.',
        'Le client présentera ce voucher à son arrivée comme justificatif de réservation.',
    ];
    conditions.forEach(c => {
        doc.text(`• ${c}`, m, y);
        y += 4;
    });

    // ═══ FOOTER ═══
    const fh = 280;
    drawLine(doc, fh, m, pw - m, C.gold);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C.goldDark);
    doc.text(data.agencyName, m, fh + 5);
    if (data.agencyEmail) doc.text(data.agencyEmail, m, fh + 9);
    if (data.agencyPhone) doc.text(data.agencyPhone, pw - m, fh + 5, { align: 'right' });

    doc.setFontSize(6);
    doc.setTextColor(C.gray);
    doc.text('Document généré par Luna — Conciergerie Voyage', pw / 2, fh + 9, { align: 'center' });

    return doc;
}
