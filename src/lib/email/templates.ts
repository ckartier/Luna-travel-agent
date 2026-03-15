/**
 * Branded Email Templates
 * 
 * Premium HTML email templates for auto-replies and confirmations.
 * Uses inline styles for maximum email client compatibility.
 */

interface AcknowledgmentData {
    clientName: string;
    destination?: string;
    replySubject?: string;
    agencyName?: string;
    logoUrl?: string;
}

/**
 * Generate a premium branded acknowledgment email.
 * Sent automatically whenever a client email/request is received.
 */
export function generateAcknowledgmentEmail(data: AcknowledgmentData): string {
    const {
        clientName,
        destination,
        replySubject,
        agencyName = 'Votre Conciergerie',
        logoUrl = '/luna-logo-noir.png',
    } = data;

    const firstName = clientName.split(' ')[0] || clientName;
    const currentYear = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de réception — ${agencyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5;padding:40px 20px;">
<tr><td align="center">

<!-- Main Card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

    <!-- Header with logo -->
    <tr>
        <td style="padding:40px 48px 24px 48px;border-bottom:1px solid #F0EBE4;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <img src="${logoUrl}" alt="${agencyName}" width="140" height="40" style="display:block;height:40px;width:auto;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                        <span style="font-size:10px;color:#8B7355;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Conciergerie Voyage</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- Confirmation badge -->
    <tr>
        <td style="padding:36px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="background-color:#F5F3F0;border:1px solid rgba(226,200,169,0.2);border-radius:40px;padding:8px 20px;">
                        <span style="font-size:10px;color:#2E2E2E;letter-spacing:2px;text-transform:uppercase;font-weight:700;">✓ Demande bien reçue</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- Main content -->
    <tr>
        <td style="padding:28px 48px 0 48px;">
            <h1 style="margin:0 0 24px 0;font-size:28px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 20px 0;font-size:15px;color:#4A4A4A;line-height:1.7;">
                Nous avons bien reçu votre ${destination ? `demande pour <strong style="color:#2E2E2E;">${destination}</strong>` : 'message'} et nous vous en remercions.
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;color:#4A4A4A;line-height:1.7;">
                Votre concierge dédié prend en charge votre dossier et reviendra vers vous dans les <strong style="color:#2E2E2E;">prochaines heures</strong> avec une première proposition personnalisée.
            </p>
        </td>
    </tr>

    <!-- Info box -->
    <tr>
        <td style="padding:8px 48px 0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3F0;border-radius:12px;border:1px solid rgba(226,200,169,0.15);">
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 4px 0;font-size:10px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Ce que nous faisons maintenant</p>
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                            <tr>
                                <td style="padding:6px 12px 6px 0;vertical-align:top;">
                                    <span style="font-size:14px;">🔍</span>
                                </td>
                                <td style="padding:6px 0;font-size:13px;color:#2E2E2E;line-height:1.5;">
                                    Analyse de vos préférences et contraintes
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:6px 12px 6px 0;vertical-align:top;">
                                    <span style="font-size:14px;">✈️</span>
                                </td>
                                <td style="padding:6px 0;font-size:13px;color:#2E2E2E;line-height:1.5;">
                                    Recherche des meilleures options (vols, hébergement, activités)
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:6px 12px 6px 0;vertical-align:top;">
                                    <span style="font-size:14px;">📋</span>
                                </td>
                                <td style="padding:6px 0;font-size:13px;color:#2E2E2E;line-height:1.5;">
                                    Préparation d'une proposition sur mesure
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    ${destination ? `
    <!-- Destination highlight -->
    <tr>
        <td style="padding:20px 48px 0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2E2E2E;border-radius:12px;overflow:hidden;">
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Votre destination</p>
                        <p style="margin:0;font-size:22px;color:#FFFFFF;font-weight:300;letter-spacing:-0.3px;">${destination}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    ` : ''}

    <!-- CTA & reassurance -->
    <tr>
        <td style="padding:28px 48px 0 48px;">
            <p style="margin:0 0 16px 0;font-size:13px;color:#8B7355;line-height:1.7;">
                En attendant, n'hésitez pas à nous répondre directement si vous avez des précisions à ajouter. Chaque détail compte pour créer votre voyage idéal.
            </p>
        </td>
    </tr>

    <!-- Signature -->
    <tr>
        <td style="padding:8px 48px 36px 48px;border-bottom:1px solid #F0EBE4;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#2E2E2E;font-weight:500;">L'équipe ${agencyName}</p>
            <p style="margin:0;font-size:12px;color:#8B7355;">Votre Concierge Voyage Sur Mesure</p>
        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="text-align:center;">
                        <img src="${logoUrl}" alt="${agencyName}" width="80" height="22" style="display:inline-block;height:18px;width:auto;opacity:0.3;" />
                        <p style="margin:10px 0 0 0;font-size:10px;color:#8B7355;letter-spacing:1.5px;opacity:0.5;">
                            © ${currentYear} ${agencyName} · Tous droits réservés
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

</table>
<!-- /Main Card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}

/**
 * Generate a shorter "quick reply" email for simple email acknowledgments
 * (not from the contact form, but from regular inbox emails)
 */
export function generateQuickAcknowledgmentEmail(data: {
    clientName: string;
    originalSubject: string;
    agencyName?: string;
    logoUrl?: string;
}): string {
    const {
        clientName,
        originalSubject,
        agencyName = 'Votre Conciergerie',
        logoUrl = '/luna-logo-noir.png',
    } = data;

    const firstName = clientName.split(' ')[0] || clientName;
    const currentYear = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5;padding:40px 20px;">
<tr><td align="center">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

    <!-- Header -->
    <tr>
        <td style="padding:32px 40px 20px 40px;border-bottom:1px solid #F0EBE4;">
            <img src="${logoUrl}" alt="${agencyName}" width="120" height="36" style="display:block;height:32px;width:auto;" />
        </td>
    </tr>

    <!-- Content -->
    <tr>
        <td style="padding:28px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                    <td style="background-color:#F5F3F0;border-radius:30px;padding:6px 16px;">
                        <span style="font-size:9px;color:#2E2E2E;letter-spacing:2px;text-transform:uppercase;font-weight:700;">✓ Reçu</span>
                    </td>
                </tr>
            </table>
            <p style="margin:0 0 16px 0;font-size:15px;color:#2E2E2E;line-height:1.7;">
                Bonjour ${firstName},
            </p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Nous avons bien reçu votre message <em style="color:#8B7355;">"${originalSubject}"</em>. Votre concierge le prend en charge et reviendra vers vous <strong>très rapidement</strong>.
            </p>
            <p style="margin:0;font-size:13px;color:#8B7355;line-height:1.6;">
                Cordialement,<br/>
                <strong style="color:#2E2E2E;">L'équipe ${agencyName}</strong>
            </p>
        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:16px 40px 24px 40px;border-top:1px solid #F0EBE4;text-align:center;">
            <p style="margin:0;font-size:10px;color:rgba(139,115,85,0.4);letter-spacing:1.5px;">
                © ${currentYear} ${agencyName}
            </p>
        </td>
    </tr>

</table>

</td></tr>
</table>

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════
// LUNA EMAIL TEMPLATE SYSTEM — Light Theme, White + Luna Blue accents
// ═══════════════════════════════════════════════════════════════════════

interface LunaEmailConfig {
    agencyName?: string;
    logoUrl?: string;
    accentColor?: string;
}

const DEFAULTS: Required<LunaEmailConfig> = {
    agencyName: 'Votre Conciergerie',
    logoUrl: '/luna-logo-noir.png',
    accentColor: '#E2C8A9',
};

function lunaWrapper(cfg: LunaEmailConfig, content: string): string {
    const c = { ...DEFAULTS, ...cfg };
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F5F3F0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3F0;padding:40px 20px;">
<tr><td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">

    <!-- Logo Header -->
    <tr>
        <td style="padding:36px 48px 24px 48px;text-align:center;border-bottom:1px solid #F0EBE4;">
            <img src="${c.logoUrl}" alt="${c.agencyName}" width="120" height="36" style="display:inline-block;height:36px;width:auto;" />
        </td>
    </tr>

    ${content}

    <!-- Footer -->
    <tr>
        <td style="padding:28px 48px;border-top:1px solid #F0EBE4;text-align:center;background-color:#FAFAFA;">
            <img src="${c.logoUrl}" alt="${c.agencyName}" width="60" height="18" style="display:inline-block;height:16px;width:auto;opacity:0.25;margin-bottom:10px;" />
            <p style="margin:0 0 4px 0;font-size:11px;color:#2E2E2E;font-weight:500;">${c.agencyName}</p>
            <p style="margin:0;font-size:9px;color:rgba(139,115,85,0.5);letter-spacing:1.5px;">
                © ${year} · Conciergerie Voyage Sur Mesure
            </p>
        </td>
    </tr>

</table>

</td></tr>
</table>

</body>
</html>`;
}

function lunaButton(text: string, url: string, color: string = '#2E2E2E'): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:${color};border-radius:12px;padding:14px 36px;">
            <a href="${url}" target="_blank" style="color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;display:inline-block;">${text}</a>
        </td>
    </tr>
</table>`;
}

// ─────────────────────────────────────────────────
// 1. QUOTE EMAIL — Devis
// ─────────────────────────────────────────────────
export interface QuoteEmailData extends LunaEmailConfig {
    clientName: string;
    quoteNumber: string;
    destination?: string;
    totalAmount: number;
    currency?: string;
    validUntil?: string;
    quoteUrl: string; // Link to online quote / PDF
    items?: { description: string; total: number }[];
}

export function generateQuoteEmail(data: QuoteEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const currency = data.currency || 'EUR';

    const itemsHtml = (data.items || []).map(it => `
        <tr>
            <td style="padding:10px 0;font-size:13px;color:#2E2E2E;border-bottom:1px solid #F5F3F0;">${it.description}</td>
            <td style="padding:10px 0;font-size:13px;color:#2E2E2E;text-align:right;font-weight:600;border-bottom:1px solid #F5F3F0;">${it.total.toLocaleString('fr-FR')} €</td>
        </tr>
    `).join('');

    const content = `
    <!-- Hero Accent -->
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${data.accentColor || DEFAULTS.accentColor}, #e8d5c0, ${data.accentColor || DEFAULTS.accentColor});"></td>
    </tr>

    <!-- Content -->
    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#F5F3F0;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#2E2E2E;letter-spacing:2px;text-transform:uppercase;font-weight:700;">📋 Proposition N° ${data.quoteNumber}</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 20px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Votre proposition de voyage${data.destination ? ` pour <strong style="color:#2E2E2E;">${data.destination}</strong>` : ''} est prête. Nous avons sélectionné les meilleures options pour créer une expérience sur mesure.
            </p>
        </td>
    </tr>

    ${data.items && data.items.length > 0 ? `
    <!-- Items Summary -->
    <tr>
        <td style="padding:0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;margin-bottom:20px;">
                <tr>
                    <td style="padding:0 0 12px 0;font-size:9px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;" colspan="2">Détail des prestations</td>
                </tr>
                ${itemsHtml}
                <tr>
                    <td style="padding:14px 0 0 0;font-size:14px;color:#2E2E2E;font-weight:600;">Total</td>
                    <td style="padding:14px 0 0 0;font-size:18px;color:#2E2E2E;text-align:right;font-weight:700;">${data.totalAmount.toLocaleString('fr-FR')} €</td>
                </tr>
            </table>
        </td>
    </tr>
    ` : `
    <!-- Total Highlight -->
    <tr>
        <td style="padding:0 48px 20px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2E2E2E;border-radius:14px;">
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Budget total estimé</p>
                        <p style="margin:0;font-size:28px;color:#FFFFFF;font-weight:300;">${data.totalAmount.toLocaleString('fr-FR')} €</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    `}

    ${data.validUntil ? `
    <tr>
        <td style="padding:0 48px 8px 48px;">
            <p style="margin:0;font-size:11px;color:#8B7355;text-align:center;">⏳ Ce devis est valable jusqu'au <strong>${data.validUntil}</strong></p>
        </td>
    </tr>
    ` : ''}

    <!-- CTA -->
    <tr>
        <td style="padding:20px 48px 40px 48px;text-align:center;">
            ${lunaButton('Consulter Ma Proposition', data.quoteUrl)}
        </td>
    </tr>

    <!-- Reassurance -->
    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                N'hésitez pas à répondre à cet email pour toute question. Votre concierge dédié est à votre écoute.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 2. INVOICE EMAIL — Facture
// ─────────────────────────────────────────────────
export interface InvoiceEmailData extends LunaEmailConfig {
    clientName: string;
    invoiceNumber: string;
    totalAmount: number;
    amountPaid?: number;
    dueDate?: string;
    invoiceUrl: string;
    items?: { description: string; total: number }[];
}

export function generateInvoiceEmail(data: InvoiceEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const remaining = data.totalAmount - (data.amountPaid || 0);

    const itemsHtml = (data.items || []).map(it => `
        <tr>
            <td style="padding:8px 0;font-size:13px;color:#2E2E2E;border-bottom:1px solid #F5F3F0;">${it.description}</td>
            <td style="padding:8px 0;font-size:13px;color:#2E2E2E;text-align:right;font-weight:600;border-bottom:1px solid #F5F3F0;">${it.total.toLocaleString('fr-FR')} €</td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #059669, ${data.accentColor || DEFAULTS.accentColor}, #059669);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#ecfdf5;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#059669;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🧾 Facture N° ${data.invoiceNumber}</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 20px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Votre facture est disponible. Vous trouverez ci-dessous le récapitulatif de vos prestations.
            </p>
        </td>
    </tr>

    ${data.items && data.items.length > 0 ? `
    <tr>
        <td style="padding:0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;margin-bottom:20px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;" colspan="2">Détail</td></tr>
                ${itemsHtml}
                <tr>
                    <td style="padding:14px 0 0 0;font-size:14px;color:#2E2E2E;font-weight:600;">Total TTC</td>
                    <td style="padding:14px 0 0 0;font-size:18px;color:#2E2E2E;text-align:right;font-weight:700;">${data.totalAmount.toLocaleString('fr-FR')} €</td>
                </tr>
                ${(data.amountPaid || 0) > 0 ? `
                <tr>
                    <td style="padding:6px 0 0 0;font-size:13px;color:#059669;">Déjà réglé</td>
                    <td style="padding:6px 0 0 0;font-size:13px;color:#059669;text-align:right;font-weight:600;">-${(data.amountPaid || 0).toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                    <td style="padding:6px 0 0 0;font-size:15px;color:#2E2E2E;font-weight:700;">Reste à payer</td>
                    <td style="padding:6px 0 0 0;font-size:18px;color:#2E2E2E;text-align:right;font-weight:700;">${remaining.toLocaleString('fr-FR')} €</td>
                </tr>
                ` : ''}
            </table>
        </td>
    </tr>
    ` : ''}

    ${data.dueDate ? `
    <tr>
        <td style="padding:0 48px 8px 48px;">
            <p style="margin:0;font-size:11px;color:#8B7355;text-align:center;">📅 Échéance : <strong>${data.dueDate}</strong></p>
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:20px 48px 40px 48px;text-align:center;">
            ${lunaButton('Voir Ma Facture', data.invoiceUrl, '#059669')}
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                Si vous avez déjà effectué le règlement, vous pouvez ignorer ce message.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 3. ROADMAP EMAIL — Carnet de Voyage
// ─────────────────────────────────────────────────
export interface RoadmapEmailData extends LunaEmailConfig {
    clientName: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    tripShareUrl: string;
    heroImageUrl?: string;
    dayHighlights?: { day: number; title: string }[];
}

export function generateRoadmapEmail(data: RoadmapEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const highlightsHtml = (data.dayHighlights || []).slice(0, 5).map(h => `
        <tr>
            <td style="padding:10px 0;border-bottom:1px solid #F5F3F0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="40" style="vertical-align:top;">
                            <div style="width:30px;height:30px;border-radius:50%;background-color:${accent};text-align:center;line-height:30px;font-size:12px;font-weight:700;color:#2E2E2E;">${h.day}</div>
                        </td>
                        <td style="padding-left:12px;font-size:14px;color:#2E2E2E;font-weight:500;vertical-align:middle;">${h.title}</td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${accent}, #e8d5c0, ${accent});"></td>
    </tr>

    ${data.heroImageUrl ? `
    <tr>
        <td style="padding:0;">
            <img src="${data.heroImageUrl}" alt="${data.destination}" width="600" style="display:block;width:100%;height:200px;object-fit:cover;" />
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#FFF5EB;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#C4956A;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🗺 Carnet de Voyage</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;">
                ${firstName}, votre voyage est prêt !
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Retrouvez ci-dessous votre itinéraire complet pour <strong style="color:#2E2E2E;">${data.destination}</strong>. Chaque jour a été pensé pour vous offrir une expérience unique.
            </p>
        </td>
    </tr>

    <!-- Trip Summary -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="33%" style="text-align:center;padding:16px 8px;background-color:#FAFAF8;border-radius:12px 0 0 12px;border:1px solid #F0EBE4;border-right:none;">
                        <p style="margin:0 0 4px 0;font-size:8px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Destination</p>
                        <p style="margin:0;font-size:14px;color:#2E2E2E;font-weight:600;">${data.destination}</p>
                    </td>
                    <td width="33%" style="text-align:center;padding:16px 8px;background-color:#FAFAF8;border:1px solid #F0EBE4;border-right:none;">
                        <p style="margin:0 0 4px 0;font-size:8px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Dates</p>
                        <p style="margin:0;font-size:14px;color:#2E2E2E;font-weight:600;">${data.startDate} — ${data.endDate}</p>
                    </td>
                    <td width="33%" style="text-align:center;padding:16px 8px;background-color:#FAFAF8;border-radius:0 12px 12px 0;border:1px solid #F0EBE4;">
                        <p style="margin:0 0 4px 0;font-size:8px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Durée</p>
                        <p style="margin:0;font-size:14px;color:#2E2E2E;font-weight:600;">${data.totalDays} jours</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    ${highlightsHtml ? `
    <!-- Day Highlights -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Aperçu de votre itinéraire</td></tr>
                ${highlightsHtml}
            </table>
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Voir Mon Carnet de Voyage', data.tripShareUrl, '#C4956A')}
            <p style="margin:12px 0 0 0;font-size:11px;color:#9CA3AF;">Accédez à votre itinéraire interactif jour par jour</p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 4. PRE-DEPARTURE EMAIL — Avant le Départ
// ─────────────────────────────────────────────────
export interface PreDepartureEmailData extends LunaEmailConfig {
    clientName: string;
    destination: string;
    departureDate: string;
    daysUntilDeparture: number;
    tripShareUrl: string;
    checklist?: string[];
    tips?: string[];
    emergencyPhone?: string;
}

export function generatePreDepartureEmail(data: PreDepartureEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const checklistHtml = (data.checklist || [
        'Passeport / Carte d\'identité valide',
        'Billets d\'avion imprimés ou dans l\'app',
        'Confirmations d\'hôtels',
        'Assurance voyage',
        'Devises locales / carte bancaire internationale',
    ]).map(item => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #F5F3F0;">
                <span style="font-size:13px;color:#2E2E2E;">☐ ${item}</span>
            </td>
        </tr>
    `).join('');

    const tipsHtml = (data.tips || []).slice(0, 4).map(tip => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #FEF3C7;">
                <span style="font-size:12px;color:#92400e;">📌 ${tip}</span>
            </td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #f59e0b, ${accent}, #f59e0b);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <!-- Countdown Badge -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                    <td align="center">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#2E2E2E;border-radius:14px;overflow:hidden;">
                            <tr>
                                <td style="padding:20px 32px;text-align:center;">
                                    <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;font-weight:700;">Départ dans</p>
                                    <p style="margin:0;font-size:36px;color:#FFFFFF;font-weight:300;letter-spacing:-1px;">${data.daysUntilDeparture} jour${data.daysUntilDeparture > 1 ? 's' : ''}</p>
                                    <p style="margin:6px 0 0 0;font-size:12px;color:${accent};font-weight:500;">${data.destination} · ${data.departureDate}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;">
                ${firstName}, prêt${firstName.endsWith('e') ? 'e' : ''} pour le départ ?
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Votre voyage à <strong style="color:#2E2E2E;">${data.destination}</strong> approche ! Voici tout ce qu'il faut savoir pour partir l'esprit tranquille.
            </p>
        </td>
    </tr>

    <!-- Checklist -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">✅ Checklist avant le départ</td></tr>
                ${checklistHtml}
            </table>
        </td>
    </tr>

    ${tipsHtml ? `
    <!-- Tips -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:14px;border:1px solid #FDE68A;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#92400e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">💡 Conseils pratiques</td></tr>
                ${tipsHtml}
            </table>
        </td>
    </tr>
    ` : ''}

    ${data.emergencyPhone ? `
    <!-- Emergency -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF2F2;border-radius:14px;border:1px solid #FECACA;padding:16px 24px;">
                <tr>
                    <td>
                        <p style="margin:0 0 4px 0;font-size:9px;color:#DC2626;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🆘 Urgence sur place</p>
                        <p style="margin:0;font-size:14px;color:#2E2E2E;font-weight:500;">Appelez-nous : <strong>${data.emergencyPhone}</strong></p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    ` : ''}

    <!-- CTA -->
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Accéder à Mon Voyage', data.tripShareUrl, '#f59e0b')}
            <p style="margin:12px 0 0 0;font-size:11px;color:#9CA3AF;">Retrouvez toutes vos confirmations et votre itinéraire</p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 5. MASTER EMAIL — Combine all 4 links
// ─────────────────────────────────────────────────
export interface MasterEmailData extends LunaEmailConfig {
    clientName: string;
    destination?: string;
    heroImageUrl?: string;
    quoteUrl?: string;
    invoiceUrl?: string;
    roadmapUrl?: string;
    preDepartureUrl?: string;
}

export function generateMasterEmail(data: MasterEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const cards = [
        { label: 'Votre Devis', desc: 'Consultez votre offre personnalisée', icon: '📋', url: data.quoteUrl, color: '#2E2E2E' },
        { label: 'Votre Facture', desc: 'Récapitulatif de paiement', icon: '🧾', url: data.invoiceUrl, color: '#059669' },
        { label: 'Carnet de Voyage', desc: 'Votre itinéraire jour par jour', icon: '🗺', url: data.roadmapUrl, color: '#C4956A' },
        { label: 'Avant le Départ', desc: 'Conseils et documents essentiels', icon: '✈️', url: data.preDepartureUrl, color: '#f59e0b' },
    ].filter(c => c.url);

    const cardsHtml = cards.map((card, i) => {
        const isLeft = i % 2 === 0;
        const tdStyle = `width:50%;padding:${isLeft ? '6px 6px 6px 0' : '6px 0 6px 6px'};`;
        return `<td style="${tdStyle}">
            <a href="${card.url}" target="_blank" style="text-decoration:none;display:block;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;">
                    <tr>
                        <td style="padding:24px 20px;text-align:center;">
                            <div style="font-size:28px;margin-bottom:10px;">${card.icon}</div>
                            <p style="margin:0 0 4px 0;font-size:14px;color:#2E2E2E;font-weight:600;">${card.label}</p>
                            <p style="margin:0 0 10px 0;font-size:11px;color:#9CA3AF;line-height:1.4;">${card.desc}</p>
                            <span style="font-size:9px;color:${card.color};letter-spacing:2px;text-transform:uppercase;font-weight:700;">Voir →</span>
                        </td>
                    </tr>
                </table>
            </a>
        </td>`;
    });

    // Group cards in pairs of 2
    let cardsGrid = '';
    for (let i = 0; i < cardsHtml.length; i += 2) {
        cardsGrid += `<tr>${cardsHtml[i]}${cardsHtml[i + 1] || '<td></td>'}</tr>`;
    }

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${accent}, #e8d5c0, ${accent});"></td>
    </tr>

    ${data.heroImageUrl ? `
    <tr>
        <td style="padding:0;">
            <img src="${data.heroImageUrl}" alt="${data.destination || 'Voyage'}" width="600" style="display:block;width:100%;height:220px;object-fit:cover;" />
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 28px 0;font-size:15px;color:#4A4A4A;line-height:1.7;">
                ${data.destination ? `Retrouvez tous les documents de votre voyage à <strong style="color:#2E2E2E;">${data.destination}</strong> ci-dessous.` : 'Retrouvez tous les documents de votre voyage ci-dessous.'}
            </p>
        </td>
    </tr>

    <!-- Cards Grid 2x2 -->
    <tr>
        <td style="padding:0 48px 32px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${cardsGrid}
            </table>
        </td>
    </tr>

    <!-- Reassurance -->
    <tr>
        <td style="padding:0 48px 36px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                Votre concierge est disponible pour répondre à toutes vos questions. Répondez simplement à cet email.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 7. PORTAL EMAIL — "Votre espace est prêt"
// ─────────────────────────────────────────────────
export interface PortalEmailData extends LunaEmailConfig {
    clientName: string;
    destination?: string;
    portalUrl: string;
    agentName?: string;
}

export function generatePortalEmail(data: PortalEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const features = [
        { icon: '🗺', label: 'Votre itinéraire jour par jour' },
        { icon: '📋', label: 'Votre devis détaillé' },
        { icon: '💳', label: 'Suivi de vos paiements' },
        { icon: '💬', label: 'Messages de votre concierge' },
    ];

    const featuresHtml = features.map(f => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #F5F3F0;">
                <span style="font-size:14px;margin-right:8px;">${f.icon}</span>
                <span style="font-size:13px;color:#2E2E2E;">${f.label}</span>
            </td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #5a8fa3, ${accent}, #5a8fa3);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#EEF7FA;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#5a8fa3;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🌐 Espace Client</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                ${firstName}, votre espace voyage est prêt !
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                ${data.agentName ? `<strong style="color:#2E2E2E;">${data.agentName}</strong> a` : 'Votre concierge a'} préparé un espace dédié ${data.destination ? `pour votre voyage à <strong style="color:#2E2E2E;">${data.destination}</strong>` : 'pour votre voyage'}. Retrouvez-y toutes les informations en un seul endroit.
            </p>
        </td>
    </tr>

    <!-- Features -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#5a8fa3;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Dans votre espace</td></tr>
                ${featuresHtml}
            </table>
        </td>
    </tr>

    <!-- CTA -->
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Accéder à Mon Espace', data.portalUrl, '#5a8fa3')}
            <p style="margin:12px 0 0 0;font-size:11px;color:#9CA3AF;">Accès sécurisé · Pas de compte requis</p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                Conservez ce lien pour y accéder à tout moment. Vous pouvez aussi répondre directement à cet email.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 8. PAYMENT REMINDER EMAIL
// ─────────────────────────────────────────────────
export interface PaymentReminderEmailData extends LunaEmailConfig {
    clientName: string;
    invoiceNumber: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: string;
    daysOverdue?: number;
    invoiceUrl: string;
}

export function generatePaymentReminderEmail(data: PaymentReminderEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const remaining = data.totalAmount - data.amountPaid;
    const isOverdue = (data.daysOverdue || 0) > 0;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${isOverdue ? '#f59e0b' : '#059669'}, #e8d5c0, ${isOverdue ? '#f59e0b' : '#059669'});"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:${isOverdue ? '#FFFBEB' : '#ecfdf5'};border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:${isOverdue ? '#92400e' : '#059669'};letter-spacing:2px;text-transform:uppercase;font-weight:700;">
                            ${isOverdue ? '⚠️ Rappel de paiement' : '📅 Échéance proche'}
                        </span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                ${isOverdue
                    ? `Votre facture <strong style="color:#2E2E2E;">${data.invoiceNumber}</strong> est arrivée à échéance le <strong>${data.dueDate}</strong>. Un solde de <strong style="color:#2E2E2E;">${remaining.toLocaleString('fr-FR')} €</strong> reste à régler.`
                    : `Un rappel amical : votre facture <strong style="color:#2E2E2E;">${data.invoiceNumber}</strong> arrive à échéance le <strong>${data.dueDate}</strong>.`
                }
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2E2E2E;border-radius:14px;">
                <tr>
                    <td style="padding:24px 28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Reste à payer</p>
                                    <p style="margin:0;font-size:28px;color:#FFFFFF;font-weight:300;">${remaining.toLocaleString('fr-FR')} €</p>
                                </td>
                                <td style="text-align:right;">
                                    <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Échéance</p>
                                    <p style="margin:0;font-size:16px;color:${isOverdue ? '#f59e0b' : '#FFFFFF'};font-weight:500;">${data.dueDate}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Voir Ma Facture', data.invoiceUrl, isOverdue ? '#f59e0b' : '#059669')}
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                Si vous avez déjà effectué le règlement, vous pouvez ignorer ce message. Pour toute question, répondez à cet email.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

