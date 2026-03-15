'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface PdfExportProps {
    results: {
        transport?: { summary?: string; flights?: any[] };
        accommodation?: { summary?: string; hotels?: any[] };
        itinerary?: { summary?: string; days?: any[]; tips?: string[] };
        client?: { summary?: string; profile?: any; recommendations?: any[] };
    };
    destination: string;
    departureDate?: string;
    returnDate?: string;
}

export function PdfExport({ results, destination, departureDate, returnDate }: PdfExportProps) {
    const [loading, setLoading] = useState(false);

    async function generatePdf() {
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210, H = 297;
            const margin = 20;
            const contentW = W - margin * 2;
            let y = 0;

            const colors = {
                charcoal: [44, 44, 44] as [number, number, number],
                muted: [120, 120, 120] as [number, number, number],
                accent: [14, 165, 233] as [number, number, number],
                cream: [245, 241, 235] as [number, number, number],
                white: [255, 255, 255] as [number, number, number],
                emerald: [16, 185, 129] as [number, number, number],
                amber: [245, 158, 11] as [number, number, number],
            };

            function addPage() { doc.addPage(); y = margin; }
            function checkPage(need: number) { if (y + need > H - margin) addPage(); }

            function drawLine(y1: number, c: [number, number, number] = colors.cream) {
                doc.setDrawColor(...c);
                doc.setLineWidth(0.3);
                doc.line(margin, y1, W - margin, y1);
            }

            function sectionTitle(text: string, icon: string = '●') {
                checkPage(18);
                y += 6;
                doc.setFontSize(7);
                doc.setTextColor(...colors.accent);
                doc.text(icon, margin, y);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.charcoal);
                doc.text(text.toUpperCase(), margin + 5, y);
                y += 2;
                drawLine(y, colors.accent);
                y += 6;
            }

            function bodyText(text: string, maxW: number = contentW, bold: boolean = false) {
                doc.setFontSize(9);
                doc.setFont('helvetica', bold ? 'bold' : 'normal');
                doc.setTextColor(...colors.charcoal);
                const lines = doc.splitTextToSize(text, maxW);
                checkPage(lines.length * 4.5 + 2);
                doc.text(lines, margin, y);
                y += lines.length * 4.5;
            }

            function mutedText(text: string, maxW: number = contentW) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...colors.muted);
                const lines = doc.splitTextToSize(text, maxW);
                checkPage(lines.length * 4 + 2);
                doc.text(lines, margin, y);
                y += lines.length * 4;
            }

            // ═══════════════════════════════════════════════════
            // COVER PAGE
            // ═══════════════════════════════════════════════════
            doc.setFillColor(245, 241, 235);
            doc.rect(0, 0, W, H, 'F');

            // Decorative top accent bar
            doc.setFillColor(...colors.accent);
            doc.rect(0, 0, W, 3, 'F');

            // Center content
            const covY = H * 0.32;

            // Luna branding
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.muted);
            doc.text('LUNA · CONCIERGE VOYAGE PREMIUM', W / 2, covY - 20, { align: 'center' });

            // Decorative line
            doc.setDrawColor(...colors.accent);
            doc.setLineWidth(0.5);
            doc.line(W / 2 - 30, covY - 12, W / 2 + 30, covY - 12);

            // Destination name
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.charcoal);
            doc.text(destination.toUpperCase(), W / 2, covY + 5, { align: 'center' });

            // Subtitle
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.muted);
            doc.text('Carnet de Voyage', W / 2, covY + 16, { align: 'center' });

            // Dates
            if (departureDate || returnDate) {
                doc.setFontSize(10);
                doc.setTextColor(...colors.accent);
                const dateStr = [departureDate, returnDate].filter(Boolean).join(' → ');
                doc.text(dateStr, W / 2, covY + 28, { align: 'center' });
            }

            // Decorative line bottom
            doc.line(W / 2 - 30, covY + 36, W / 2 + 30, covY + 36);

            // Footer
            doc.setFontSize(7);
            doc.setTextColor(...colors.muted);
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, H - 20, { align: 'center' });
            doc.text('luna-travel.com', W / 2, H - 15, { align: 'center' });

            // ═══════════════════════════════════════════════════
            // FLIGHTS PAGE
            // ═══════════════════════════════════════════════════
            if (results.transport?.flights?.length) {
                addPage();
                doc.setFillColor(...colors.white);
                doc.rect(0, 0, W, H, 'F');

                sectionTitle('Options de Vol', '✈');

                if (results.transport.summary) {
                    mutedText(results.transport.summary);
                    y += 4;
                }

                for (const f of results.transport.flights) {
                    checkPage(22);
                    // Card background
                    doc.setFillColor(250, 248, 245);
                    doc.roundedRect(margin, y - 1, contentW, 18, 2, 2, 'F');

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.charcoal);
                    doc.text(`${f.airline} — ${f.class}`, margin + 3, y + 4);

                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.accent);
                    doc.text(f.price || '', W - margin - 3, y + 4, { align: 'right' });

                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...colors.muted);
                    doc.text(`${f.route} · ${f.duration} · ${f.stops} escale(s)`, margin + 3, y + 10);

                    if (f.domain) {
                        doc.setTextColor(...colors.accent);
                        doc.text(`Réserver sur ${f.domain}`, margin + 3, y + 14.5);
                    }

                    y += 21;
                }
            }

            // ═══════════════════════════════════════════════════
            // HOTELS PAGE
            // ═══════════════════════════════════════════════════
            if (results.accommodation?.hotels?.length) {
                addPage();
                doc.setFillColor(...colors.white);
                doc.rect(0, 0, W, H, 'F');

                sectionTitle('Hôtels Sélectionnés', '★');

                if (results.accommodation.summary) {
                    mutedText(results.accommodation.summary);
                    y += 4;
                }

                for (const h of results.accommodation.hotels) {
                    const cardH = h.recommendation ? 24 : 18;
                    checkPage(cardH + 3);

                    doc.setFillColor(250, 248, 245);
                    doc.roundedRect(margin, y - 1, contentW, cardH, 2, 2, 'F');

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.charcoal);
                    doc.text(h.name, margin + 3, y + 4);

                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.amber);
                    doc.text(`${h.pricePerNight}/nuit`, W - margin - 3, y + 4, { align: 'right' });

                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...colors.muted);
                    doc.text(`${'★'.repeat(h.stars || 5)} · ${(h.highlights || []).join(', ')}`, margin + 3, y + 10);

                    if (h.recommendation) {
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(100, 100, 100);
                        const recLines = doc.splitTextToSize(h.recommendation, contentW - 6);
                        doc.text(recLines, margin + 3, y + 15);
                    }

                    if (h.domain) {
                        doc.setTextColor(...colors.accent);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`Réserver sur ${h.domain}`, margin + 3, y + cardH - 2.5);
                    }

                    y += cardH + 3;
                }
            }

            // ═══════════════════════════════════════════════════
            // ITINERARY PAGE
            // ═══════════════════════════════════════════════════
            if (results.itinerary?.days?.length) {
                addPage();
                doc.setFillColor(...colors.white);
                doc.rect(0, 0, W, H, 'F');

                sectionTitle('Itinéraire Jour par Jour', '📅');

                if (results.itinerary.summary) {
                    mutedText(results.itinerary.summary);
                    y += 4;
                }

                for (const d of results.itinerary.days) {
                    checkPage(30);

                    // Day badge
                    doc.setFillColor(...colors.accent);
                    doc.roundedRect(margin, y - 1, 12, 6, 1.5, 1.5, 'F');
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.white);
                    doc.text(`J${d.day}`, margin + 6, y + 3, { align: 'center' });

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.charcoal);
                    doc.text(d.title || `Jour ${d.day}`, margin + 15, y + 3);
                    y += 8;

                    const activities = [
                        { icon: '🌅', text: d.morning },
                        { icon: '🌤', text: d.afternoon },
                        { icon: '🌙', text: d.evening },
                    ];

                    for (const a of activities) {
                        if (!a.text) continue;
                        checkPage(8);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...colors.charcoal);
                        const lines = doc.splitTextToSize(`${a.icon}  ${a.text}`, contentW - 5);
                        doc.text(lines, margin + 3, y);
                        y += lines.length * 4;
                    }

                    if (d.highlight) {
                        checkPage(6);
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(...colors.emerald);
                        doc.text(d.highlight, margin + 3, y + 1);
                        y += 5;
                    }

                    y += 3;
                    drawLine(y);
                    y += 4;
                }

                // Tips
                if (results.itinerary.tips?.length) {
                    checkPage(20);
                    y += 4;
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.charcoal);
                    doc.text('CONSEILS PRATIQUES', margin, y);
                    y += 5;
                    for (const tip of results.itinerary.tips) {
                        checkPage(6);
                        doc.setFontSize(7.5);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...colors.muted);
                        doc.text(`• ${tip}`, margin + 2, y);
                        y += 4.5;
                    }
                }
            }

            // ═══════════════════════════════════════════════════
            // CLIENT RECOMMENDATIONS
            // ═══════════════════════════════════════════════════
            if (results.client?.recommendations?.length) {
                addPage();
                doc.setFillColor(...colors.white);
                doc.rect(0, 0, W, H, 'F');

                sectionTitle('Recommandations Personnalisées', '💎');

                if (results.client.summary) {
                    mutedText(results.client.summary);
                    y += 4;
                }

                for (const r of results.client.recommendations) {
                    const text = typeof r === 'string' ? r : r?.text || '';
                    if (!text) continue;
                    checkPage(10);

                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...colors.charcoal);
                    doc.text(`✓  ${text}`, margin + 2, y);
                    y += 5;
                }
            }

            // ═══════════════════════════════════════════════════
            // BACK COVER
            // ═══════════════════════════════════════════════════
            addPage();
            doc.setFillColor(245, 241, 235);
            doc.rect(0, 0, W, H, 'F');

            doc.setFillColor(...colors.accent);
            doc.rect(0, H - 3, W, 3, 'F');

            const endY = H * 0.42;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.muted);
            doc.text('LUNA · CONCIERGE VOYAGE PREMIUM', W / 2, endY - 8, { align: 'center' });

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.charcoal);
            doc.text('Bon Voyage !', W / 2, endY + 5, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.muted);
            doc.text(`${destination} vous attend.`, W / 2, endY + 14, { align: 'center' });

            doc.setDrawColor(...colors.accent);
            doc.setLineWidth(0.5);
            doc.line(W / 2 - 20, endY + 22, W / 2 + 20, endY + 22);

            doc.setFontSize(7);
            doc.text('Document généré par Votre Conciergerie', W / 2, endY + 30, { align: 'center' });
            doc.text('luna-travel.com', W / 2, endY + 35, { align: 'center' });

            // Save
            const filename = `Luna_${destination.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('PDF generation error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={generatePdf}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-luna-charcoal to-luna-charcoal/90 text-white font-normal text-[12px] uppercase tracking-wider rounded-xl hover:from-luna-charcoal/90 hover:to-luna-charcoal/80 transition-all shadow-lg disabled:opacity-50"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {loading ? 'Génération...' : 'Exporter PDF'}
        </button>
    );
}
