import { NextRequest, NextResponse } from 'next/server';
import {
    generateQuoteEmail,
    generateInvoiceEmail,
    generateRoadmapEmail,
    generatePreDepartureEmail,
    generateMasterEmail,
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
    }

    // Add navigation bar on top for previewing all templates
    const nav = `
    <div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#2E2E2E;padding:12px 24px;display:flex;gap:12px;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.15);">
        <span style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-right:16px;">LUNA EMAILS</span>
        <a href="/api/crm/email-preview?template=master" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'master' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Master</a>
        <a href="/api/crm/email-preview?template=quote" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'quote' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Devis</a>
        <a href="/api/crm/email-preview?template=invoice" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'invoice' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Facture</a>
        <a href="/api/crm/email-preview?template=roadmap" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'roadmap' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Carnet</a>
        <a href="/api/crm/email-preview?template=departure" style="padding:6px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;letter-spacing:1px;${template === 'departure' ? 'background:#b9dae9;color:#2E2E2E;' : 'background:rgba(255,255,255,0.1);color:white;'}">Départ</a>
    </div>
    <div style="height:52px;"></div>`;

    return new NextResponse(nav + html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
