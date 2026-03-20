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


// ═══════════════════════════════════════════════════════════════════════
//  LEGAL EMAIL TEMPLATE SYSTEM — Navy + Gold accents, Serif headings
// ═══════════════════════════════════════════════════════════════════════

interface LegalEmailConfig {
    firmName?: string;
    logoUrl?: string;
    accentColor?: string;
}

const LEGAL_DEFAULTS: Required<LegalEmailConfig> = {
    firmName: 'Votre Cabinet',
    logoUrl: '/luna-logo-noir.png',
    accentColor: '#A07850',
};

function legalWrapper(cfg: LegalEmailConfig, content: string): string {
    const c = { ...LEGAL_DEFAULTS, ...cfg };
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:40px 20px;">
<tr><td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

    <!-- Logo Header -->
    <tr>
        <td style="padding:32px 48px 20px 48px;border-bottom:2px solid #1e293b;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <img src="${c.logoUrl}" alt="${c.firmName}" width="120" height="36" style="display:block;height:36px;width:auto;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                        <span style="font-size:9px;color:#64748b;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Cabinet d'Avocats</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    ${content}

    <!-- Footer -->
    <tr>
        <td style="padding:28px 48px;border-top:2px solid #1e293b;text-align:center;background-color:#F8FAFC;">
            <img src="${c.logoUrl}" alt="${c.firmName}" width="60" height="18" style="display:inline-block;height:16px;width:auto;opacity:0.25;margin-bottom:10px;" />
            <p style="margin:0 0 4px 0;font-size:11px;color:#1e293b;font-weight:500;">${c.firmName}</p>
            <p style="margin:0;font-size:9px;color:rgba(100,116,139,0.6);letter-spacing:1.5px;">
                © ${year} · Ce message est confidentiel et destiné exclusivement à son destinataire.
            </p>
        </td>
    </tr>

</table>

</td></tr>
</table>

</body>
</html>`;
}

function legalButton(text: string, url: string, color: string = '#1e293b'): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
        <td style="background-color:${color};border-radius:10px;padding:13px 32px;">
            <a href="${url}" target="_blank" style="color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;display:inline-block;">${text}</a>
        </td>
    </tr>
</table>`;
}

// ─────────────────────────────────────────────────
// LEGAL 1. DOSSIER NOTIFICATION — Ouverture / Mise à jour
// ─────────────────────────────────────────────────
export interface LegalDossierEmailData extends LegalEmailConfig {
    clientName: string;
    caseNumber: string;
    title: string;
    type: string;
    status: string;
    jurisdiction?: string;
    opposingParty?: string;
    nextStep?: string;
    dossierUrl?: string;
}

export function generateLegalDossierEmail(data: LegalDossierEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || LEGAL_DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #1e293b, ${accent}, #1e293b);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#EFF6FF;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#1e40af;letter-spacing:2px;text-transform:uppercase;font-weight:700;">⚖️ Dossier N° ${data.caseNumber}</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#1e293b;letter-spacing:-0.5px;line-height:1.3;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.7;">
                Nous vous informons de la mise à jour de votre dossier <strong style="color:#1e293b;">${data.title}</strong>.
            </p>
        </td>
    </tr>

    <!-- Dossier Summary -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Récapitulatif du dossier</td></tr>
                <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Type</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.type}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Statut</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.status}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ${data.jurisdiction ? `
                <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Juridiction</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.jurisdiction}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ` : ''}
                ${data.opposingParty ? `
                <tr>
                    <td style="padding:8px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Partie adverse</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.opposingParty}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ` : ''}
            </table>
        </td>
    </tr>

    ${data.nextStep ? `
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:12px;border:1px solid #FDE68A;padding:16px 24px;">
                <tr>
                    <td>
                        <p style="margin:0 0 4px 0;font-size:9px;color:#92400e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">📌 Prochaine étape</p>
                        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">${data.nextStep}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    ` : ''}

    ${data.dossierUrl ? `
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${legalButton('Consulter Mon Dossier', data.dossierUrl)}
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;text-align:center;">
                N'hésitez pas à nous contacter pour toute question relative à votre dossier.
            </p>
        </td>
    </tr>`;

    return legalWrapper(data, content);
}

// ─────────────────────────────────────────────────
// LEGAL 2. HEARING EMAIL — Convocation / Rappel audience
// ─────────────────────────────────────────────────
export interface LegalHearingEmailData extends LegalEmailConfig {
    clientName: string;
    caseNumber: string;
    dossierTitle: string;
    hearingDate: string;
    hearingTime?: string;
    tribunal: string;
    hearingType: string;
    address?: string;
    notes?: string;
}

export function generateLegalHearingEmail(data: LegalHearingEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || LEGAL_DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #d97706, ${accent}, #d97706);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#FFFBEB;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#92400e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🏛 Convocation — Audience</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#1e293b;letter-spacing:-0.5px;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.7;">
                Nous vous informons qu'une audience est fixée pour votre dossier <strong style="color:#1e293b;">${data.dossierTitle}</strong> (N° ${data.caseNumber}).
            </p>
        </td>
    </tr>

    <!-- Hearing Details Card -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;">
                <tr>
                    <td style="padding:28px 32px;text-align:center;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;font-weight:700;">Date de l'audience</p>
                        <p style="margin:0 0 8px 0;font-size:28px;color:#FFFFFF;font-weight:300;letter-spacing:-1px;">${data.hearingDate}</p>
                        ${data.hearingTime ? `<p style="margin:0;font-size:16px;color:${accent};font-weight:500;">${data.hearingTime}</p>` : ''}
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;padding:20px 24px;">
                <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Type</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.hearingType}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Tribunal</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:600;">${data.tribunal}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ${data.address ? `
                <tr>
                    <td style="padding:8px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size:12px;color:#64748b;width:120px;">Adresse</td>
                                <td style="font-size:13px;color:#1e293b;font-weight:500;">${data.address}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                ` : ''}
            </table>
        </td>
    </tr>

    ${data.notes ? `
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFF6FF;border-radius:12px;border:1px solid #BFDBFE;padding:16px 24px;">
                <tr>
                    <td>
                        <p style="margin:0 0 4px 0;font-size:9px;color:#1e40af;letter-spacing:2px;text-transform:uppercase;font-weight:700;">📋 Notes importantes</p>
                        <p style="margin:0;font-size:13px;color:#1e3a5f;line-height:1.6;">${data.notes}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;text-align:center;">
                Votre présence est requise. En cas d'impossibilité, veuillez nous contacter au plus vite pour que nous puissions prendre les dispositions nécessaires.
            </p>
        </td>
    </tr>`;

    return legalWrapper(data, content);
}

// ─────────────────────────────────────────────────
// LEGAL 3. FEE INVOICE — Facture d'honoraires
// ─────────────────────────────────────────────────
export interface LegalFeeInvoiceEmailData extends LegalEmailConfig {
    clientName: string;
    invoiceNumber: string;
    caseNumber: string;
    dossierTitle: string;
    totalAmount: number;
    amountPaid?: number;
    dueDate?: string;
    invoiceUrl: string;
    items?: { description: string; hours?: number; rate?: number; total: number }[];
    feeType?: string;
}

export function generateLegalFeeInvoiceEmail(data: LegalFeeInvoiceEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const remaining = data.totalAmount - (data.amountPaid || 0);

    const itemsHtml = (data.items || []).map(it => `
        <tr>
            <td style="padding:8px 0;font-size:13px;color:#1e293b;border-bottom:1px solid #F1F5F9;">${it.description}</td>
            ${it.hours ? `<td style="padding:8px 8px;font-size:12px;color:#64748b;text-align:center;border-bottom:1px solid #F1F5F9;">${it.hours}h</td>` : ''}
            <td style="padding:8px 0;font-size:13px;color:#1e293b;text-align:right;font-weight:600;border-bottom:1px solid #F1F5F9;">${it.total.toLocaleString('fr-FR')} €</td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #059669, ${data.accentColor || LEGAL_DEFAULTS.accentColor}, #059669);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#ecfdf5;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#059669;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🧾 Note d'Honoraires N° ${data.invoiceNumber}</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#1e293b;letter-spacing:-0.5px;">
                Bonjour ${firstName},
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.7;">
                Veuillez trouver ci-joint votre note d'honoraires relative au dossier <strong style="color:#1e293b;">${data.dossierTitle}</strong> (N° ${data.caseNumber}).
                ${data.feeType ? `<br/><span style="font-size:12px;color:#64748b;">Type : ${data.feeType}</span>` : ''}
            </p>
        </td>
    </tr>

    ${data.items && data.items.length > 0 ? `
    <tr>
        <td style="padding:0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;padding:20px 24px;margin-bottom:20px;">
                <tr><td ${data.items[0]?.hours ? 'colspan="3"' : 'colspan="2"'} style="padding:0 0 12px 0;font-size:9px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Détail des honoraires</td></tr>
                ${itemsHtml}
                <tr>
                    <td style="padding:14px 0 0 0;font-size:14px;color:#1e293b;font-weight:600;">Total HT</td>
                    ${data.items[0]?.hours ? '<td></td>' : ''}
                    <td style="padding:14px 0 0 0;font-size:18px;color:#1e293b;text-align:right;font-weight:700;">${data.totalAmount.toLocaleString('fr-FR')} €</td>
                </tr>
                ${(data.amountPaid || 0) > 0 ? `
                <tr>
                    <td style="padding:6px 0 0 0;font-size:13px;color:#059669;">Déjà réglé</td>
                    ${data.items[0]?.hours ? '<td></td>' : ''}
                    <td style="padding:6px 0 0 0;font-size:13px;color:#059669;text-align:right;font-weight:600;">-${(data.amountPaid || 0).toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                    <td style="padding:6px 0 0 0;font-size:15px;color:#1e293b;font-weight:700;">Reste à payer</td>
                    ${data.items[0]?.hours ? '<td></td>' : ''}
                    <td style="padding:6px 0 0 0;font-size:18px;color:#1e293b;text-align:right;font-weight:700;">${remaining.toLocaleString('fr-FR')} €</td>
                </tr>
                ` : ''}
            </table>
        </td>
    </tr>
    ` : `
    <tr>
        <td style="padding:0 48px 20px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:14px;">
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Montant des honoraires</p>
                        <p style="margin:0;font-size:28px;color:#FFFFFF;font-weight:300;">${data.totalAmount.toLocaleString('fr-FR')} €</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    `}

    ${data.dueDate ? `
    <tr>
        <td style="padding:0 48px 8px 48px;">
            <p style="margin:0;font-size:11px;color:#64748b;text-align:center;">📅 Échéance : <strong>${data.dueDate}</strong></p>
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:20px 48px 40px 48px;text-align:center;">
            ${legalButton('Voir Ma Note d\'Honoraires', data.invoiceUrl, '#059669')}
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;text-align:center;">
                Si vous avez déjà effectué le règlement, vous pouvez ignorer ce message. Pour toute question, n'hésitez pas à nous contacter.
            </p>
        </td>
    </tr>`;

    return legalWrapper(data, content);
}

// ─────────────────────────────────────────────────
// LEGAL 4. MISE EN DEMEURE — Formal demand letter
// ─────────────────────────────────────────────────
export interface LegalMiseEnDemeureEmailData extends LegalEmailConfig {
    clientName: string;
    recipientName: string;
    caseNumber: string;
    dossierTitle: string;
    amount?: number;
    obligation: string;
    deadline: string;
    consequences?: string;
}

export function generateLegalMiseEnDemeureEmail(data: LegalMiseEnDemeureEmailData): string {
    const accent = data.accentColor || LEGAL_DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #dc2626, ${accent}, #dc2626);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#FEF2F2;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#dc2626;letter-spacing:2px;text-transform:uppercase;font-weight:700;">📧 Mise en Demeure</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:400;color:#1e293b;letter-spacing:-0.3px;line-height:1.3;">
                LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION
            </h1>
            <p style="margin:0 0 24px 0;font-size:12px;color:#64748b;">Dossier N° ${data.caseNumber} — ${data.dossierTitle}</p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <p style="margin:0 0 16px 0;font-size:14px;color:#1e293b;line-height:1.7;">
                Madame, Monsieur <strong>${data.recipientName}</strong>,
            </p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.8;">
                Agissant en qualité de conseil de <strong style="color:#1e293b;">${data.clientName}</strong>, je vous mets en demeure par la présente de bien vouloir <strong style="color:#1e293b;">${data.obligation}</strong>.
            </p>
            ${data.amount ? `
            <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.8;">
                Le montant réclamé s'élève à <strong style="color:#1e293b;">${data.amount.toLocaleString('fr-FR')} €</strong>, somme qui demeure impayée à ce jour.
            </p>
            ` : ''}
        </td>
    </tr>

    <!-- Deadline Card -->
    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#dc2626;border-radius:14px;">
                <tr>
                    <td style="padding:24px 28px;text-align:center;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;font-weight:700;">Délai imparti</p>
                        <p style="margin:0;font-size:24px;color:#FFFFFF;font-weight:300;">${data.deadline}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.8;">
                ${data.consequences || 'À défaut de réponse de votre part dans le délai imparti, mon client se réserve le droit d\'engager toute procédure judiciaire qu\'il jugera utile pour faire valoir ses droits, et ce sans nouvel avis de ma part.'}
            </p>
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.8;">
                Je vous prie de croire, Madame, Monsieur, en l'expression de mes salutations distinguées.
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;padding:16px 24px;">
                <tr>
                    <td>
                        <p style="margin:0 0 2px 0;font-size:12px;color:#1e293b;font-weight:600;">${data.firmName || LEGAL_DEFAULTS.firmName}</p>
                        <p style="margin:0;font-size:11px;color:#64748b;">Avocat au Barreau</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>`;

    return legalWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 6. WELCOME EMAIL — Bienvenue nouveau client
// ─────────────────────────────────────────────────
export interface WelcomeEmailData extends LunaEmailConfig {
    clientName: string;
    portalUrl?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${accent}, #bcdeea, ${accent});"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#E0F2FE;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#0284c7;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🎉 Bienvenue</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                Bienvenue ${firstName} !
            </h1>
            <p style="margin:0 0 20px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Nous sommes ravis de vous accueillir au sein de notre conciergerie. Votre espace personnel est désormais prêt — vous y retrouverez vos voyages, devis et documents en un clin d'œil.
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;border-radius:14px;border:1px solid #F0EBE4;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#8B7355;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Ce que vous pouvez faire</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #F5F3F0;font-size:13px;color:#2E2E2E;">✈️ Demander un voyage sur mesure</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #F5F3F0;font-size:13px;color:#2E2E2E;">📋 Consulter vos devis et factures</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #F5F3F0;font-size:13px;color:#2E2E2E;">🗺 Accéder à votre carnet de voyage interactif</td></tr>
                <tr><td style="padding:8px 0;font-size:13px;color:#2E2E2E;">💬 Contacter votre concierge dédié à tout moment</td></tr>
            </table>
        </td>
    </tr>

    ${data.portalUrl ? `
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Accéder à Mon Espace', data.portalUrl, '#0284c7')}
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                N'hésitez pas à répondre directement à cet email pour toute question. Votre concierge est à votre écoute.
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 7. POST-TRIP THANK YOU — Merci après voyage
// ─────────────────────────────────────────────────
export interface PostTripEmailData extends LunaEmailConfig {
    clientName: string;
    destination: string;
    tripDates?: string;
    nextTripUrl?: string;
}

export function generatePostTripEmail(data: PostTripEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, ${accent}, #C4956A, ${accent});"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;text-align:center;">
            <p style="margin:0 0 16px 0;font-size:48px;">🌍</p>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                Bon retour, ${firstName} !
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Nous espérons que votre séjour à <strong style="color:#2E2E2E;">${data.destination}</strong>${data.tripDates ? ` (${data.tripDates})` : ''} a été à la hauteur de vos attentes. Chaque voyage est unique et le vôtre nous tenait particulièrement à cœur.
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#2E2E2E;border-radius:14px;">
                <tr>
                    <td style="padding:24px 28px;text-align:center;">
                        <p style="margin:0 0 4px 0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Votre prochain voyage vous attend</p>
                        <p style="margin:0;font-size:16px;color:#FFFFFF;font-weight:300;">Profitez de <strong style="color:${accent};">-10%</strong> sur votre prochaine réservation</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    ${data.nextTripUrl ? `
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Préparer Mon Prochain Voyage', data.nextTripUrl, '#C4956A')}
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                Merci de votre confiance. À très bientôt pour de nouvelles aventures !
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 8. REVIEW REQUEST — Demande d'avis
// ─────────────────────────────────────────────────
export interface ReviewRequestEmailData extends LunaEmailConfig {
    clientName: string;
    destination: string;
    reviewUrl?: string;
}

export function generateReviewRequestEmail(data: ReviewRequestEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #f59e0b, ${accent}, #f59e0b);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;text-align:center;">
            <p style="margin:0 0 16px 0;font-size:48px;">⭐</p>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                ${firstName}, votre avis compte !
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Votre retour sur votre voyage à <strong style="color:#2E2E2E;">${data.destination}</strong> nous aide à offrir une expérience toujours plus personnalisée. Cela ne prend que 2 minutes.
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border-radius:14px;border:1px solid #FDE68A;padding:20px 24px;">
                <tr><td style="padding:0 0 12px 0;font-size:9px;color:#92400e;letter-spacing:2px;text-transform:uppercase;font-weight:700;">💬 Quelques questions rapides</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#2E2E2E;">Comment s'est passée l'organisation ?</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#2E2E2E;">Les hébergements étaient-ils à la hauteur ?</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#2E2E2E;">Recommanderiez-vous notre conciergerie ?</td></tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Laisser Mon Avis', data.reviewUrl || '#', '#f59e0b')}
            <p style="margin:12px 0 0 0;font-size:11px;color:#9CA3AF;">Ou répondez simplement à cet email avec vos impressions</p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 9. BIRTHDAY / ANNIVERSARY — Fidélisation
// ─────────────────────────────────────────────────
export interface BirthdayEmailData extends LunaEmailConfig {
    clientName: string;
    occasionType?: 'birthday' | 'anniversary';
    offerUrl?: string;
}

export function generateBirthdayEmail(data: BirthdayEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;
    const isBirthday = data.occasionType !== 'anniversary';

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #ec4899, ${accent}, #8b5cf6);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;text-align:center;">
            <p style="margin:0 0 16px 0;font-size:56px;">${isBirthday ? '🎂' : '🎉'}</p>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                ${isBirthday ? `Joyeux anniversaire, ${firstName} !` : `Merci pour votre fidélité, ${firstName} !`}
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                ${isBirthday
                    ? 'Toute notre équipe vous souhaite une merveilleuse journée. Pour fêter cela, nous avons préparé une attention spéciale rien que pour vous.'
                    : 'Cela fait déjà un an que vous nous faites confiance. Pour célébrer cette belle aventure ensemble, nous avons une surprise pour vous.'
                }
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #fdf2f8, #faf5ff);border-radius:14px;border:1px solid #f3e8ff;">
                <tr>
                    <td style="padding:28px;text-align:center;">
                        <p style="margin:0 0 8px 0;font-size:9px;color:#a855f7;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🎁 Offre exclusive</p>
                        <p style="margin:0;font-size:22px;color:#2E2E2E;font-weight:300;">
                            <strong style="color:#ec4899;">-15%</strong> sur votre prochain voyage
                        </p>
                        <p style="margin:8px 0 0 0;font-size:11px;color:#9CA3AF;">Valable 30 jours · Code : LUNA${isBirthday ? 'BDAY' : 'ANNIV'}</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    ${data.offerUrl ? `
    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Profiter de Mon Offre', data.offerUrl, '#ec4899')}
        </td>
    </tr>
    ` : ''}

    <tr>
        <td style="padding:0 48px 32px 48px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;text-align:center;">
                ${isBirthday ? 'Encore une fois, joyeux anniversaire ! 🥂' : 'Merci de faire partie de la famille Luna ! 💙'}
            </p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}

// ─────────────────────────────────────────────────
// 10. NEWSLETTER / INSPIRATION — Destinations
// ─────────────────────────────────────────────────
export interface NewsletterEmailData extends LunaEmailConfig {
    clientName: string;
    season?: string;
    destinations?: { name: string; imageUrl: string; tagline: string; priceFrom?: number }[];
}

export function generateNewsletterEmail(data: NewsletterEmailData): string {
    const firstName = data.clientName.split(' ')[0] || data.clientName;
    const accent = data.accentColor || DEFAULTS.accentColor;
    const season = data.season || 'Printemps';

    const defaultDestinations = [
        { name: 'Bali, Indonésie', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=300&fit=crop', tagline: 'Temples, rizières & villa privée', priceFrom: 2800 },
        { name: 'Santorin, Grèce', imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=300&fit=crop', tagline: 'Couchers de soleil & gastronomie', priceFrom: 3200 },
        { name: 'Marrakech, Maroc', imageUrl: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&h=300&fit=crop', tagline: 'Riads de charme & souks', priceFrom: 1800 },
    ];

    const dests = data.destinations || defaultDestinations;

    const destCards = dests.slice(0, 3).map(d => `
        <tr>
            <td style="padding:0 0 16px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;border:1px solid #F0EBE4;">
                    <tr>
                        <td style="padding:0;">
                            <img src="${d.imageUrl}" alt="${d.name}" width="504" style="display:block;width:100%;height:160px;object-fit:cover;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 20px;">
                            <p style="margin:0 0 4px 0;font-size:16px;color:#2E2E2E;font-weight:600;">${d.name}</p>
                            <p style="margin:0 0 8px 0;font-size:12px;color:#8B7355;">${d.tagline}</p>
                            ${d.priceFrom ? `<p style="margin:0;font-size:13px;color:#2E2E2E;">À partir de <strong>${d.priceFrom.toLocaleString('fr-FR')} €</strong> /pers.</p>` : ''}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    const content = `
    <tr>
        <td style="padding:0;height:4px;background:linear-gradient(90deg, #06b6d4, ${accent}, #8b5cf6);"></td>
    </tr>

    <tr>
        <td style="padding:40px 48px 0 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                    <td style="background-color:#ECFEFF;border-radius:30px;padding:6px 18px;">
                        <span style="font-size:9px;color:#0891b2;letter-spacing:2px;text-transform:uppercase;font-weight:700;">🌸 Inspiration ${season}</span>
                    </td>
                </tr>
            </table>
            <h1 style="margin:0 0 20px 0;font-size:26px;font-weight:300;color:#2E2E2E;letter-spacing:-0.5px;line-height:1.3;">
                ${firstName}, envie d'évasion ?
            </h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Découvrez nos destinations coup de cœur de la saison, sélectionnées par nos concierges pour des expériences inoubliables.
            </p>
        </td>
    </tr>

    <tr>
        <td style="padding:0 48px 24px 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${destCards}
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:8px 48px 40px 48px;text-align:center;">
            ${lunaButton('Voir Toutes les Destinations', '#', '#0891b2')}
            <p style="margin:12px 0 0 0;font-size:11px;color:#9CA3AF;">Ou répondez à cet email pour nous parler de votre prochaine envie</p>
        </td>
    </tr>`;

    return lunaWrapper(data, content);
}
