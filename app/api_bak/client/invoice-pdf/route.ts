import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/client/invoice-pdf?id=xxx
 * Generates an HTML invoice that can be printed/saved as PDF by the browser.
 * This is a simple approach that works everywhere without external PDF libraries.
 */
export async function GET(req: NextRequest) {
    const invoiceId = req.nextUrl.searchParams.get('id');
    if (!invoiceId) {
        return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    // Fetch invoice data from Firestore
    const { adminDb } = await import('@/src/lib/firebase/admin');

    // Search across all tenants for this invoice (client-facing, no tenant context)
    const tenantsSnap = await adminDb.collection('tenants').get();
    let invoiceData: any = null;

    for (const tenantDoc of tenantsSnap.docs) {
        const invSnap = await adminDb.collection(`tenants/${tenantDoc.id}/invoices`).doc(invoiceId).get();
        if (invSnap.exists) {
            invoiceData = { id: invSnap.id, ...invSnap.data() };
            break;
        }
    }

    if (!invoiceData) {
        return new NextResponse('Facture introuvable', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    const inv = invoiceData;
    const issueDate = inv.issueDate || new Date().toISOString().split('T')[0];
    const dueDate = inv.dueDate || '';
    const items = inv.items || [];

    // Generate a clean HTML invoice
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Facture ${inv.invoiceNumber || invoiceId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #2E2E2E; background: #f4f1ed; padding: 40px 20px; -webkit-font-smoothing: antialiased; }
  .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 60px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #2E2E2E 0%, #3a3a3a 100%); color: white; padding: 48px 48px 40px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 28px; font-weight: 200; letter-spacing: 6px; }
  .logo-sub { font-size: 9px; color: #b9dae9; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; margin-top: 4px; }
  .invoice-badge { background: rgba(185,218,233,0.15); border: 1px solid rgba(185,218,233,0.3); border-radius: 8px; padding: 8px 16px; text-align: right; }
  .invoice-badge .number { font-size: 13px; font-weight: 600; letter-spacing: 1px; }
  .invoice-badge .label { font-size: 9px; color: rgba(255,255,255,0.4); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }
  .header h2 { font-size: 28px; font-weight: 300; letter-spacing: 1px; margin-bottom: 4px; }
  .header .date { font-size: 12px; color: rgba(255,255,255,0.5); }
  .content { padding: 48px; }
  .section-label { font-size: 9px; font-weight: 700; color: #999; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
  .client-info { display: flex; gap: 40px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #f0f0f0; }
  .client-info div p { font-size: 13px; color: #666; line-height: 1.8; }
  .client-info div p strong { color: #2E2E2E; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { font-size: 9px; font-weight: 700; color: #999; letter-spacing: 2px; text-transform: uppercase; text-align: left; padding: 12px 16px; border-bottom: 2px solid #f0f0f0; }
  th:last-child { text-align: right; }
  td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f8f8f8; vertical-align: top; }
  td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }
  .item-name { font-weight: 600; color: #2E2E2E; margin-bottom: 2px; }
  .item-desc { font-size: 12px; color: #999; line-height: 1.5; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-box { min-width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
  .total-row.final { border-top: 2px solid #2E2E2E; padding-top: 16px; margin-top: 8px; font-size: 20px; font-weight: 600; color: #2E2E2E; }
  .footer { background: #f9f9f9; padding: 32px 48px; text-align: center; border-top: 1px solid #f0f0f0; }
  .footer p { font-size: 11px; color: #999; line-height: 1.8; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .status-PAID { background: #ecfdf5; color: #059669; }
  .status-SENT { background: #fffbeb; color: #d97706; }
  .status-DRAFT { background: #f3f4f6; color: #6b7280; }
  .status-OVERDUE { background: #fef2f2; color: #dc2626; }
  .print-btn { display: block; text-align: center; margin: 24px auto 0; padding: 14px 40px; background: #2E2E2E; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; }
  .print-btn:hover { background: #b9dae9; color: #2E2E2E; }
  @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; border-radius: 0; } .print-btn { display: none !important; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="header-top">
      <div>
        <div class="logo">LUNA</div>
        <div class="logo-sub">Conciergerie de Voyage</div>
      </div>
      <div class="invoice-badge">
        <div class="label">Facture N°</div>
        <div class="number">${inv.invoiceNumber || invoiceId}</div>
      </div>
    </div>
    <h2>${inv.clientName || 'Client'}</h2>
    <div class="date">Émise le ${formatDateFR(issueDate)}${dueDate ? ` · Échéance le ${formatDateFR(dueDate)}` : ''} · <span class="status-badge status-${inv.status || 'DRAFT'}">${inv.status || 'DRAFT'}</span></div>
  </div>
  <div class="content">
    <div class="client-info">
      <div>
        <p class="section-label">Client</p>
        <p><strong>${inv.clientName || 'Client'}</strong></p>
        ${inv.clientEmail ? `<p>${inv.clientEmail}</p>` : ''}
        ${inv.clientPhone ? `<p>${inv.clientPhone}</p>` : ''}
      </div>
      <div>
        <p class="section-label">Émetteur</p>
        <p><strong>Votre Conciergerie</strong></p>
        <p>Voyage sur mesure</p>
      </div>
    </div>

    <p class="section-label">Détail des prestations</p>
    <table>
      <thead>
        <tr>
          <th style="width:50%">Prestation</th>
          <th>Qté</th>
          <th>Prix unitaire</th>
          <th>TVA</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it: any) => `
        <tr>
          <td>
            <div class="item-name">${it.description || 'Prestation'}</div>
            ${it.location ? `<div class="item-desc">📍 ${it.location}</div>` : ''}
            ${it.dates ? `<div class="item-desc">📅 ${it.dates}</div>` : ''}
          </td>
          <td>${it.quantity || 1}</td>
          <td>${(it.unitPrice || it.total || 0).toLocaleString('fr-FR')} €</td>
          <td>${it.taxRate || 0}%</td>
          <td>${(it.total || 0).toLocaleString('fr-FR')} €</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span>Sous-total HT</span>
          <span>${(inv.subtotal || 0).toLocaleString('fr-FR')} €</span>
        </div>
        <div class="total-row">
          <span>TVA</span>
          <span>${(inv.taxTotal || 0).toLocaleString('fr-FR')} €</span>
        </div>
        ${inv.amountPaid > 0 ? `
        <div class="total-row">
          <span>Déjà réglé</span>
          <span style="color: #059669">-${inv.amountPaid.toLocaleString('fr-FR')} €</span>
        </div>` : ''}
        <div class="total-row final">
          <span>${inv.amountPaid > 0 ? 'Reste à payer' : 'Total TTC'}</span>
          <span>${((inv.totalAmount || 0) - (inv.amountPaid || 0)).toLocaleString('fr-FR')} €</span>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Luna — Conciergerie de Voyage Premium · © ${new Date().getFullYear()}</p>
    <p>Cette facture a été générée automatiquement. Pour toute question, contactez votre concierge dédié.</p>
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
