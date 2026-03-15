import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/* ═══════════════════════════════════════════
   SECURE XLSX GENERATION — No shell execution
   Uses ExcelJS (pure Node.js) instead of execSync + Python
   ═══════════════════════════════════════════ */

// Luna brand colors
const LUNA_CHARCOAL = '2E2E2E';
const LUNA_BLUE = '5A8FA3';
const LUNA_LIGHT = 'F7F8FA';
const LUNA_MUTED = '9CA3AF';
const LUNA_WHITE = 'FFFFFF';
const LUNA_BORDER = 'E5E7EB';
const LUNA_GREEN = '16A34A';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const quoteId = req.nextUrl.searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID' }, { status: 400 });
    }

    // Use auth.tenantId instead of client-supplied tenantId (IDOR fix)
    const tenantId = auth.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant associated' }, { status: 403 });
    }

    const doc = await adminDb.collection('tenants').doc(tenantId).collection('quotes').doc(quoteId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const quoteData = { id: doc.id, ...doc.data() } as any;
    const items = quoteData.items || [];

    // ═══ Generate XLSX with ExcelJS ═══
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Luna Conciergerie';
    workbook.created = new Date();

    const ws = workbook.addWorksheet(`Devis ${quoteData.quoteNumber || ''}`, {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // Column widths
    ws.columns = [
      { width: 4 },   // A: #
      { width: 42 },  // B: Description
      { width: 10 },  // C: Qty
      { width: 16 },  // D: Net Cost
      { width: 16 },  // E: Unit Price
      { width: 18 },  // F: Total
    ];

    // ═══ HEADER ═══
    ws.mergeCells('B2:F2');
    const headerCell = ws.getCell('B2');
    headerCell.value = 'LUNA CONCIERGERIE';
    headerCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: LUNA_CHARCOAL } };

    ws.mergeCells('B3:F3');
    const taglineCell = ws.getCell('B3');
    taglineCell.value = 'Travel beautifully.';
    taglineCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: LUNA_MUTED } };

    // ═══ QUOTE INFO ═══
    const infoFont = { name: 'Arial', size: 10, color: { argb: LUNA_MUTED } } as Partial<ExcelJS.Font>;
    const valueFont = { name: 'Arial', size: 11, bold: true, color: { argb: LUNA_CHARCOAL } } as Partial<ExcelJS.Font>;

    ws.getCell('B5').value = 'Devis N°';
    ws.getCell('B5').font = infoFont;
    ws.getCell('C5').value = quoteData.quoteNumber || '';
    ws.getCell('C5').font = valueFont;
    ws.getCell('E5').value = 'Date :';
    ws.getCell('E5').font = infoFont;
    ws.getCell('E5').alignment = { horizontal: 'right' };
    ws.getCell('F5').value = quoteData.issueDate || '';
    ws.getCell('F5').font = { name: 'Arial', size: 10, color: { argb: LUNA_CHARCOAL } };

    ws.getCell('B6').value = 'Client';
    ws.getCell('B6').font = infoFont;
    ws.getCell('C6').value = quoteData.clientName || '';
    ws.getCell('C6').font = valueFont;
    ws.getCell('E6').value = 'Valide jusqu\'au :';
    ws.getCell('E6').font = infoFont;
    ws.getCell('E6').alignment = { horizontal: 'right' };
    ws.getCell('F6').value = quoteData.validUntil || '';
    ws.getCell('F6').font = { name: 'Arial', size: 10, color: { argb: LUNA_CHARCOAL } };

    // ═══ TABLE HEADER ═══
    const headerRow = 8;
    const headers = ['#', 'Désignation', 'Qté', 'Coût Net (€)', 'Prix Vente (€)', 'Total (€)'];
    const row8 = ws.getRow(headerRow);
    headers.forEach((h, i) => {
      const cell = row8.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: LUNA_WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LUNA_CHARCOAL } };
      cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: LUNA_BORDER } },
        bottom: { style: 'thin', color: { argb: LUNA_BORDER } },
        left: { style: 'thin', color: { argb: LUNA_BORDER } },
        right: { style: 'thin', color: { argb: LUNA_BORDER } },
      };
    });

    // ═══ TABLE BODY ═══
    const startRow = headerRow + 1;
    items.forEach((item: any, idx: number) => {
      const r = startRow + idx;
      const row = ws.getRow(r);
      const isOdd = idx % 2 === 0;
      const fill: ExcelJS.FillPattern = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isOdd ? LUNA_WHITE : LUNA_LIGHT },
      };
      const border: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: LUNA_BORDER } },
        bottom: { style: 'thin', color: { argb: LUNA_BORDER } },
        left: { style: 'thin', color: { argb: LUNA_BORDER } },
        right: { style: 'thin', color: { argb: LUNA_BORDER } },
      };
      const bodyFont = { name: 'Arial', size: 10, color: { argb: LUNA_CHARCOAL } } as Partial<ExcelJS.Font>;
      const moneyFont = { name: 'Arial', size: 10, bold: true, color: { argb: LUNA_CHARCOAL } } as Partial<ExcelJS.Font>;
      const mutedFont = { name: 'Arial', size: 10, color: { argb: LUNA_MUTED } } as Partial<ExcelJS.Font>;

      // # column
      const c1 = row.getCell(1);
      c1.value = idx + 1;
      c1.font = mutedFont;
      c1.alignment = { horizontal: 'center', vertical: 'middle' };
      c1.fill = fill;
      c1.border = border;

      // Description
      const c2 = row.getCell(2);
      c2.value = item.description || '';
      c2.font = bodyFont;
      c2.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      c2.fill = fill;
      c2.border = border;

      // Qty
      const qty = item.quantity || 1;
      const c3 = row.getCell(3);
      c3.value = qty;
      c3.font = bodyFont;
      c3.alignment = { horizontal: 'center', vertical: 'middle' };
      c3.fill = fill;
      c3.border = border;

      // Net cost
      const c4 = row.getCell(4);
      c4.value = item.netCost || 0;
      c4.font = mutedFont;
      c4.numFmt = '#,##0.00 €';
      c4.alignment = { horizontal: 'right', vertical: 'middle' };
      c4.fill = fill;
      c4.border = border;

      // Unit price
      const c5 = row.getCell(5);
      c5.value = item.unitPrice || 0;
      c5.font = moneyFont;
      c5.numFmt = '#,##0.00 €';
      c5.alignment = { horizontal: 'right', vertical: 'middle' };
      c5.fill = fill;
      c5.border = border;

      // Total = Qty × Unit Price (formula)
      const c6 = row.getCell(6);
      c6.value = { formula: `C${r}*E${r}` } as any;
      c6.font = moneyFont;
      c6.numFmt = '#,##0.00 €';
      c6.alignment = { horizontal: 'right', vertical: 'middle' };
      c6.fill = fill;
      c6.border = border;
    });

    const endRow = startRow + items.length - 1;

    // ═══ TOTALS ═══
    const gapRow = endRow + 2;
    const thinBorder: Partial<ExcelJS.Borders> = {
      bottom: { style: 'thin', color: { argb: LUNA_BORDER } },
    };

    // Subtotal
    ws.mergeCells(`B${gapRow}:E${gapRow}`);
    ws.getCell(`B${gapRow}`).value = 'Sous-total HT';
    ws.getCell(`B${gapRow}`).font = valueFont;
    ws.getCell(`B${gapRow}`).alignment = { horizontal: 'right' };
    const subCell = ws.getCell(`F${gapRow}`);
    subCell.value = { formula: `SUM(F${startRow}:F${endRow})` } as any;
    subCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: LUNA_CHARCOAL } };
    subCell.numFmt = '#,##0.00 €';
    subCell.alignment = { horizontal: 'right' };
    subCell.border = thinBorder;

    // Tax
    const taxRate = quoteData.taxRate || 20;
    const taxRow = gapRow + 1;
    ws.mergeCells(`B${taxRow}:E${taxRow}`);
    ws.getCell(`B${taxRow}`).value = `TVA (${taxRate}%)`;
    ws.getCell(`B${taxRow}`).font = infoFont;
    ws.getCell(`B${taxRow}`).alignment = { horizontal: 'right' };
    const taxCell = ws.getCell(`F${taxRow}`);
    taxCell.value = { formula: `F${gapRow}*${taxRate / 100}` } as any;
    taxCell.font = infoFont;
    taxCell.numFmt = '#,##0.00 €';
    taxCell.alignment = { horizontal: 'right' };
    taxCell.border = thinBorder;

    // Total TTC
    const totalRow = taxRow + 1;
    ws.mergeCells(`B${totalRow}:E${totalRow}`);
    const totalLabel = ws.getCell(`B${totalRow}`);
    totalLabel.value = 'TOTAL TTC';
    totalLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: LUNA_WHITE } };
    totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LUNA_BLUE } };
    totalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    // Fill merged area
    for (let col = 3; col <= 5; col++) {
      ws.getRow(totalRow).getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LUNA_BLUE } };
    }
    const totalCell = ws.getCell(`F${totalRow}`);
    totalCell.value = { formula: `F${gapRow}+F${taxRow}` } as any;
    totalCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: LUNA_WHITE } };
    totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LUNA_BLUE } };
    totalCell.numFmt = '#,##0.00 €';
    totalCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // ═══ MARGIN ANALYSIS ═══
    const marginRow = totalRow + 2;
    ws.getCell(`B${marginRow}`).value = '📊 Analyse Interne (non visible client)';
    ws.getCell(`B${marginRow}`).font = { name: 'Arial', size: 9, bold: true, color: { argb: LUNA_MUTED } };

    const m1 = marginRow + 1;
    ws.getCell(`B${m1}`).value = 'Coût net total';
    ws.getCell(`B${m1}`).font = infoFont;
    ws.getCell(`D${m1}`).value = { formula: `SUMPRODUCT(C${startRow}:C${endRow},D${startRow}:D${endRow})` } as any;
    ws.getCell(`D${m1}`).font = infoFont;
    ws.getCell(`D${m1}`).numFmt = '#,##0.00 €';

    const m2 = marginRow + 2;
    ws.getCell(`B${m2}`).value = 'Marge brute';
    ws.getCell(`B${m2}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: LUNA_GREEN } };
    ws.getCell(`D${m2}`).value = { formula: `F${gapRow}-D${m1}` } as any;
    ws.getCell(`D${m2}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: LUNA_GREEN } };
    ws.getCell(`D${m2}`).numFmt = '#,##0.00 €';

    const m3 = marginRow + 3;
    ws.getCell(`B${m3}`).value = 'Taux de marge';
    ws.getCell(`B${m3}`).font = infoFont;
    ws.getCell(`D${m3}`).value = { formula: `IF(F${gapRow}>0,D${m2}/F${gapRow},0)` } as any;
    ws.getCell(`D${m3}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: LUNA_GREEN } };
    ws.getCell(`D${m3}`).numFmt = '0.0%';

    // ═══ FOOTER ═══
    const footerRow = m3 + 3;
    ws.mergeCells(`B${footerRow}:F${footerRow}`);
    ws.getCell(`B${footerRow}`).value = 'Luna Conciergerie — www.luna-conciergerie.com — Travel beautifully.';
    ws.getCell(`B${footerRow}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: LUNA_MUTED } };
    ws.getCell(`B${footerRow}`).alignment = { horizontal: 'center' };

    // ═══ Write to buffer ═══
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `Devis_${quoteData.quoteNumber || quoteId}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('[Quotes XLSX] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
