import { NextRequest, NextResponse } from 'next/server';
import {
    generateQuoteEmail,
    generateInvoiceEmail,
    generateRoadmapEmail,
    generatePreDepartureEmail,
    generateMasterEmail,
    generateWelcomeEmail,
    generatePostTripEmail,
    generateReviewRequestEmail,
    generateBirthdayEmail,
    generateNewsletterEmail,
    generateLegalDossierEmail,
    generateLegalHearingEmail,
    generateLegalFeeInvoiceEmail,
    generateLegalMiseEnDemeureEmail,
} from '@/src/lib/email/templates';
import { adminDb } from '@/src/lib/firebase/admin';
import { verifyAuth } from '@/src/lib/firebase/apiAuth';

/**
 * GET /api/crm/email-preview?template=quote|invoice|roadmap|departure|master
 * Preview Luna email templates with sample data.
 */
export async function GET(req: NextRequest) {
    // Auth check
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const template = req.nextUrl.searchParams.get('template') || 'master';
    const embed = req.nextUrl.searchParams.get('embed') === 'true';
    const origin = req.nextUrl.origin || 'http://localhost:3000';

    // Fetch branding from site_config (logo + agency name)
    let logoUrl = `${origin}/luna-logo-noir.png`;
    let agencyName = 'Luna Conciergerie';
    try {
        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (!tenantsSnap.empty) {
            const tenantId = tenantsSnap.docs[0].id;
            const configDoc = await adminDb.collection('tenants').doc(tenantId).collection('site_config').doc('main').get();
            const cfgData = configDoc.data();
            if (cfgData?.global?.logo) logoUrl = cfgData.global.logo.startsWith('http') ? cfgData.global.logo : `${origin}${cfgData.global.logo}`;
            if (cfgData?.business?.name) agencyName = cfgData.business.name;
            else if (cfgData?.global?.siteName) agencyName = cfgData.global.siteName;
        }
    } catch { /* fallback to defaults */ }

    const sampleConfig = {
        agencyName,
        logoUrl,
    };

    let html = '';

    switch (template) {
        case 'quote':
            html = generateQuoteEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                quoteNumber: 'QUO-376048',
                destination: 'Bali, Indonésie',
                totalAmount: 4850,
                validUntil: '25 mars 2026',
                quoteUrl: '#',
                items: [
                    { description: '✈️ Vols Premium Aller-Retour (2 pax)', total: 1800 },
                    { description: '🏨 Villa 5★ avec piscine privée (7 nuits)', total: 2100 },
                    { description: '🎯 Excursions & Activités (5 jours)', total: 650 },
                    { description: '🚗 Transferts privés', total: 300 },
                ],
            });
            break;

        case 'invoice':
            html = generateInvoiceEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                invoiceNumber: 'INV-2026-0042',
                totalAmount: 4850,
                amountPaid: 1500,
                dueDate: '15 mars 2026',
                invoiceUrl: '#',
                items: [
                    { description: 'Vols Premium Aller-Retour', total: 1800 },
                    { description: 'Villa 5★ Bali (7 nuits)', total: 2100 },
                    { description: 'Excursions & Activités', total: 650 },
                    { description: 'Transferts privés', total: 300 },
                ],
            });
            break;

        case 'roadmap':
            html = generateRoadmapEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                destination: 'Bali, Indonésie',
                startDate: '20 mars',
                endDate: '27 mars',
                totalDays: 7,
                tripShareUrl: '#',
                heroImageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=400&fit=crop',
                dayHighlights: [
                    { day: 1, title: 'Arrivée à Denpasar & Installation à la villa' },
                    { day: 2, title: 'Temples d\'Uluwatu & Dîner vue océan' },
                    { day: 3, title: 'Rizières de Tegallalang & Artisanat local' },
                    { day: 4, title: 'Journée détente spa & plongée' },
                    { day: 5, title: 'Mont Batur — Lever de soleil' },
                ],
            });
            break;

        case 'departure':
            html = generatePreDepartureEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                destination: 'Bali, Indonésie',
                departureDate: '20 mars 2026',
                daysUntilDeparture: 3,
                tripShareUrl: '#',
                tips: [
                    'Le décalage horaire est de +6h (heure de Paris)',
                    'Prévoyez des vêtements légers et un paréo pour les temples',
                    'L\'eau du robinet n\'est pas potable, privilégiez l\'eau en bouteille',
                    'Les pourboires sont appréciés (10-15%)',
                ],
                emergencyPhone: '+33 6 12 34 56 78',
            });
            break;

        case 'welcome':
            html = generateWelcomeEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                portalUrl: '#',
            });
            break;

        case 'post-trip':
            html = generatePostTripEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                destination: 'Bali, Indonésie',
                tripDates: '20 — 27 mars 2026',
                nextTripUrl: '#',
            });
            break;

        case 'review':
            html = generateReviewRequestEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                destination: 'Bali, Indonésie',
                reviewUrl: '#',
            });
            break;

        case 'birthday':
            html = generateBirthdayEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                occasionType: 'birthday',
                offerUrl: '#',
            });
            break;

        case 'newsletter':
            html = generateNewsletterEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                season: 'Printemps',
            });
            break;

        case 'master':
        default:
            html = generateMasterEmail({
                ...sampleConfig,
                clientName: 'Claire Cartier',
                destination: 'Bali, Indonésie',
                heroImageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=400&fit=crop',
                quoteUrl: '/api/crm/email-preview?template=quote',
                invoiceUrl: '/api/crm/email-preview?template=invoice',
                roadmapUrl: '/api/crm/email-preview?template=roadmap',
                preDepartureUrl: '/api/crm/email-preview?template=departure',
            });
            break;

        case 'legal-dossier':
            html = generateLegalDossierEmail({
                firmName: agencyName,
                logoUrl,
                clientName: 'Maître Dupont',
                caseNumber: 'DOS-2026-0042',
                title: 'Dupont c/ Société XYZ — Licenciement abusif',
                type: 'Droit du Travail',
                status: 'EN_COURS',
                jurisdiction: 'Conseil de Prud\'hommes de Paris',
                opposingParty: 'Société XYZ SARL',
                nextStep: 'Déposer les conclusions en réponse avant le 30 avril 2026.',
                dossierUrl: '#',
            });
            break;

        case 'legal-hearing':
            html = generateLegalHearingEmail({
                firmName: agencyName,
                logoUrl,
                clientName: 'Maître Dupont',
                caseNumber: 'DOS-2026-0042',
                dossierTitle: 'Dupont c/ Société XYZ',
                hearingDate: '15 avril 2026',
                hearingTime: '14h30',
                tribunal: 'Conseil de Prud\'hommes de Paris',
                hearingType: 'Audience de plaidoirie',
                address: '27 rue Louis Blanc, 75010 Paris',
                notes: 'Merci de vous munir de votre pièce d\'identité et des originaux de vos pièces.',
            });
            break;

        case 'legal-invoice':
            html = generateLegalFeeInvoiceEmail({
                firmName: agencyName,
                logoUrl,
                clientName: 'Maître Dupont',
                invoiceNumber: 'HON-2026-0018',
                caseNumber: 'DOS-2026-0042',
                dossierTitle: 'Dupont c/ Société XYZ',
                totalAmount: 3500,
                amountPaid: 1200,
                dueDate: '31 mars 2026',
                invoiceUrl: '#',
                feeType: 'Honoraires au temps passé',
                items: [
                    { description: 'Rédaction des conclusions', hours: 8, total: 2000 },
                    { description: 'Audience de mise en état', hours: 2, total: 500 },
                    { description: 'Correspondances et suivi', hours: 4, total: 1000 },
                ],
            });
            break;

        case 'legal-mise-en-demeure':
            html = generateLegalMiseEnDemeureEmail({
                firmName: agencyName,
                logoUrl,
                clientName: 'M. Jean Dupont',
                recipientName: 'M. Pierre Martin',
                caseNumber: 'DOS-2026-0042',
                dossierTitle: 'Dupont c/ Martin — Créance impayée',
                amount: 15000,
                obligation: 'procéder au règlement intégral de la somme de 15 000 € due au titre du contrat de prestation de services en date du 15 janvier 2025',
                deadline: '15 jours à compter de la réception',
            });
            break;
    }

    // Add navigation bar on top for previewing all templates (skip in embed mode)
    const nav = embed ? '' : `
    <div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#2E2E2E;padding:12px 24px;display:flex;gap:8px;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.15);flex-wrap:wrap;">
        <span style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-right:16px;">LUNA EMAILS</span>
        <a href="/api/crm/email-preview?template=master" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'master' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Master</a>
        <a href="/api/crm/email-preview?template=quote" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'quote' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Devis</a>
        <a href="/api/crm/email-preview?template=invoice" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'invoice' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Facture</a>
        <a href="/api/crm/email-preview?template=roadmap" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'roadmap' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Carnet</a>
        <a href="/api/crm/email-preview?template=departure" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'departure' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Départ</a>
        <span style="width:1px;height:20px;background:rgba(255,255,255,0.15);margin:0 8px;"></span>
        <span style="color:#A07850;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">LEGAL</span>
        <a href="/api/crm/email-preview?template=legal-dossier" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'legal-dossier' ? 'background:#A07850;color:white;' : 'background:rgba(255,255,255,0.1);color:white;'}">Dossier</a>
        <a href="/api/crm/email-preview?template=legal-hearing" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'legal-hearing' ? 'background:#A07850;color:white;' : 'background:rgba(255,255,255,0.1);color:white;'}">Audience</a>
        <a href="/api/crm/email-preview?template=legal-invoice" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'legal-invoice' ? 'background:#A07850;color:white;' : 'background:rgba(255,255,255,0.1);color:white;'}">Honoraires</a>
        <a href="/api/crm/email-preview?template=legal-mise-en-demeure" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'legal-mise-en-demeure' ? 'background:#A07850;color:white;' : 'background:rgba(255,255,255,0.1);color:white;'}">Mise en Demeure</a>
    </div>
    <div style="height:52px;"></div>`;

    return new NextResponse(nav + html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
