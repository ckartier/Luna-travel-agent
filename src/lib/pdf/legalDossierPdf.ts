import jsPDF from 'jspdf';

/**
 * Generate a professional legal dossier PDF report
 * — Features: Cover page, parties, hearings timeline, deadlines, fees summary
 */

export interface LegalDossierPDFData {
    caseNumber: string;
    title: string;
    type: string;
    status: string;
    priority?: string;
    jurisdiction?: string;
    chamber?: string;
    clientName?: string;
    opposingParty?: string;
    firmName?: string;
    description?: string;
    hearings?: { date: string; type: string; notes?: string }[];
    deadlines?: { date: string; label: string; done?: boolean }[];
    fees?: number;
    feesPaid?: number;
    createdAt?: string;
}

// Color palette — Legal navy
const C = {
    navy: '#1e293b',
    navyLight: '#334155',
    gold: '#A07850',
    goldLight: '#C4A06A',
    white: '#FFFFFF',
    bg: '#F8FAFC',
    gray: '#94a3b8',
    grayLight: '#e2e8f0',
    green: '#059669',
    red: '#dc2626',
    amber: '#d97706',
};

function drawLine(doc: jsPDF, y: number, x1: number, x2: number, color = C.grayLight) {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

function addPage(doc: jsPDF): number {
    doc.addPage();
    drawLine(doc, 15, 25, 185, C.gold);
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('CABINET D\'AVOCATS · CONFIDENTIEL', 25, 12);
    doc.text('Rapport de Dossier', 185, 12, { align: 'right' });
    return 25;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > 270) return addPage(doc);
    return y;
}

const STATUS_LABELS: Record<string, string> = {
    OUVERT: 'Ouvert', EN_COURS: 'En cours', EN_ATTENTE: 'En attente',
    AUDIENCE_PREVUE: 'Audience prévue', CLOTURE: 'Clôturé',
    GAGNE: 'Gagné', PERDU: 'Perdu', TRANSACTION: 'Transaction',
};

const TYPE_LABELS: Record<string, string> = {
    civil: 'Droit Civil', penal: 'Droit Pénal', commercial: 'Droit Commercial',
    travail: 'Droit du Travail', famille: 'Droit de la Famille',
    immobilier: 'Droit Immobilier', administratif: 'Droit Administratif',
    propriete_intellectuelle: 'Propriété Intellectuelle', fiscal: 'Droit Fiscal',
};

export function generateLegalDossierPDF(data: LegalDossierPDFData): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;

    // ═══ PAGE 1: COVER ═══
    doc.setFillColor(C.navy);
    doc.rect(0, 0, 210, 297, 'F');

    // Subtle pattern
    doc.setDrawColor('#ffffff');
    doc.setLineWidth(0.1);
    for (let i = 0; i < 210; i += 12) {
        doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
        doc.line(i, 0, i, 297);
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Top badge
    doc.setFontSize(8);
    doc.setTextColor(C.gold);
    doc.text('CONFIDENTIEL · DOSSIER JURIDIQUE', pageWidth / 2, 55, { align: 'center' });

    // Gold line
    doc.setDrawColor(C.gold);
    doc.setLineWidth(0.5);
    doc.line(60, 61, 150, 61);

    // Case number
    doc.setFontSize(14);
    doc.setTextColor(C.gray);
    doc.text(`N° ${data.caseNumber}`, pageWidth / 2, 80, { align: 'center' });

    // Title
    doc.setFontSize(28);
    doc.setTextColor(C.white);
    const titleLines = doc.splitTextToSize(data.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, 100, { align: 'center' });

    // Type badge
    const typeLabel = TYPE_LABELS[data.type] || data.type;
    doc.setFontSize(10);
    doc.setTextColor(C.goldLight);
    doc.text(typeLabel.toUpperCase(), pageWidth / 2, 120 + (titleLines.length - 1) * 10, { align: 'center' });

    // Info badges
    const badgeY = 155;
    const badges = [
        { label: 'Statut', value: STATUS_LABELS[data.status] || data.status },
        { label: 'Priorité', value: data.priority || 'Normale' },
        { label: 'Juridiction', value: data.jurisdiction || 'N/A' },
        { label: 'Chambre', value: data.chamber || 'N/A' },
    ];
    const badgeWidth = 35;
    const totalBadgeWidth = badges.length * badgeWidth + (badges.length - 1) * 5;
    let bx = (pageWidth - totalBadgeWidth) / 2;

    badges.forEach(badge => {
        doc.setFillColor('#ffffff');
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.roundedRect(bx, badgeY, badgeWidth, 22, 3, 3, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));

        doc.setFontSize(6);
        doc.setTextColor(C.gray);
        doc.text(badge.label.toUpperCase(), bx + badgeWidth / 2, badgeY + 7, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(C.white);
        const valLines = doc.splitTextToSize(badge.value, badgeWidth - 4);
        doc.text(valLines[0], bx + badgeWidth / 2, badgeY + 15, { align: 'center' });

        bx += badgeWidth + 5;
    });

    // Firm name
    doc.setFontSize(10);
    doc.setTextColor(C.gold);
    doc.text(data.firmName || 'Votre Cabinet', pageWidth / 2, 250, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('Cabinet d\'Avocats', pageWidth / 2, 257, { align: 'center' });
    doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 267, { align: 'center' });

    // ═══ PAGE 2: PARTIES & DESCRIPTION ═══
    let y = addPage(doc);

    // Parties
    doc.setFontSize(7);
    doc.setTextColor(C.gold);
    doc.text('⚖️  PARTIES EN PRÉSENCE', margin, y);
    y += 2;
    drawLine(doc, y, margin, margin + contentWidth, C.gold);
    y += 8;

    // Client card
    doc.setFillColor(C.bg);
    doc.roundedRect(margin, y, contentWidth / 2 - 4, 20, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(C.gray);
    doc.text('DEMANDEUR / CLIENT', margin + 5, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(C.navy);
    doc.text(data.clientName || 'N/A', margin + 5, y + 14);

    // Opposing party card
    const rightX = margin + contentWidth / 2 + 4;
    doc.setFillColor(C.bg);
    doc.roundedRect(rightX, y, contentWidth / 2 - 4, 20, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(C.gray);
    doc.text('PARTIE ADVERSE', rightX + 5, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(C.navy);
    doc.text(data.opposingParty || 'N/A', rightX + 5, y + 14);

    y += 30;

    // Description
    if (data.description) {
        doc.setFontSize(7);
        doc.setTextColor(C.gold);
        doc.text('📋  DESCRIPTION DU DOSSIER', margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, C.gold);
        y += 7;

        doc.setFillColor(C.bg);
        const descLines = doc.splitTextToSize(data.description, contentWidth - 16);
        const descHeight = Math.max(descLines.length * 5 + 10, 20);
        doc.roundedRect(margin, y, contentWidth, descHeight, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(C.navyLight);
        doc.text(descLines, margin + 8, y + 8);
        y += descHeight + 8;
    }

    // ═══ HEARINGS ═══
    if (data.hearings && data.hearings.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(C.gold);
        doc.text(`🏛  AUDIENCES (${data.hearings.length})`, margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, C.gold);
        y += 7;

        data.hearings.forEach((h, i) => {
            y = checkPageBreak(doc, y, 18);

            // Timeline dot
            doc.setFillColor(C.gold);
            doc.circle(margin + 3, y + 4, 2, 'F');
            if (i < data.hearings!.length - 1) {
                doc.setDrawColor(C.grayLight);
                doc.setLineWidth(0.5);
                doc.line(margin + 3, y + 7, margin + 3, y + 16);
            }

            doc.setFillColor(C.bg);
            doc.roundedRect(margin + 10, y, contentWidth - 10, 14, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(C.navy);
            doc.text(h.date, margin + 14, y + 5);

            doc.setFontSize(8);
            doc.setTextColor(C.navyLight);
            doc.text(h.type, margin + 55, y + 5);

            if (h.notes) {
                doc.setFontSize(7);
                doc.setTextColor(C.gray);
                doc.text(h.notes, margin + 14, y + 11, { maxWidth: contentWidth - 24 });
            }

            y += 18;
        });

        y += 5;
    }

    // ═══ DEADLINES ═══
    if (data.deadlines && data.deadlines.length > 0) {
        y = checkPageBreak(doc, y, 20);
        doc.setFontSize(7);
        doc.setTextColor(C.gold);
        doc.text(`📅  ÉCHÉANCES (${data.deadlines.length})`, margin, y);
        y += 2;
        drawLine(doc, y, margin, margin + contentWidth, C.gold);
        y += 7;

        data.deadlines.forEach(d => {
            y = checkPageBreak(doc, y, 14);
            doc.setFillColor(d.done ? '#ecfdf5' : '#fff7ed');
            doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');

            doc.setFontSize(8);
            doc.setTextColor(d.done ? C.green : C.amber);
            doc.text(d.done ? '✓' : '○', margin + 4, y + 6);

            doc.setTextColor(C.navy);
            doc.text(d.date, margin + 12, y + 6);

            doc.setTextColor(C.navyLight);
            doc.text(d.label, margin + 50, y + 6, { maxWidth: contentWidth - 55 });

            y += 14;
        });

        y += 5;
    }

    // ═══ FEES SUMMARY ═══
    y = checkPageBreak(doc, y, 50);
    doc.setFontSize(7);
    doc.setTextColor(C.gold);
    doc.text('💰  HONORAIRES', margin, y);
    y += 2;
    drawLine(doc, y, margin, margin + contentWidth, C.gold);
    y += 8;

    const totalFees = data.fees || 0;
    const paidFees = data.feesPaid || 0;
    const remainingFees = totalFees - paidFees;
    const paidPct = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;

    // Fees box
    doc.setFillColor(C.bg);
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
    doc.setDrawColor(C.grayLight);
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'S');

    // Total
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('TOTAL HONORAIRES', margin + 8, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(C.navy);
    doc.text(`${totalFees.toLocaleString('fr-FR')} €`, margin + contentWidth - 8, y + 8, { align: 'right' });

    drawLine(doc, y + 13, margin + 8, margin + contentWidth - 8, C.grayLight);

    // Paid
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('RÉGLÉ', margin + 8, y + 21);
    doc.setFontSize(11);
    doc.setTextColor(C.green);
    doc.text(`${paidFees.toLocaleString('fr-FR')} € (${paidPct}%)`, margin + contentWidth - 8, y + 21, { align: 'right' });

    // Remaining
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('RESTE À PAYER', margin + 8, y + 31);
    doc.setFontSize(13);
    doc.setTextColor(remainingFees > 0 ? C.red : C.green);
    doc.text(`${remainingFees.toLocaleString('fr-FR')} €`, margin + contentWidth - 8, y + 31, { align: 'right' });

    // Progress bar
    y += 44;
    doc.setFillColor(C.grayLight);
    doc.roundedRect(margin, y, contentWidth, 3, 1.5, 1.5, 'F');
    if (paidPct > 0) {
        doc.setFillColor(C.green);
        doc.roundedRect(margin, y, contentWidth * (paidPct / 100), 3, 1.5, 1.5, 'F');
    }

    // ═══ FOOTER ═══
    y += 20;
    y = checkPageBreak(doc, y, 30);
    drawLine(doc, y, margin, margin + contentWidth, C.grayLight);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(C.navy);
    doc.text(data.firmName || 'Votre Cabinet', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(C.gray);
    doc.text('Avocat au Barreau · Cabinet d\'Avocats', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Ce document est strictement confidentiel.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`© ${new Date().getFullYear()} ${data.firmName || 'Votre Cabinet'}`, pageWidth / 2, y, { align: 'center' });

    // Save
    doc.save(`Dossier_${data.caseNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`);
}
