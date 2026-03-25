export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notifySupplierBooking } from '@/src/lib/whatsapp/api';

/**
 * Mock / Demo Checkout — Simulates a successful payment and creates:
 * 1. A Lead in the Pipeline (status=WON, paymentStatus=PAID)
 * 2. SupplierBookings or Trips depending on cart item types
 * Used when Stripe is unavailable or for demonstration purposes.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cart, total, user } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const tenantsSnap = await adminDb.collection('tenants').limit(1).get();
        if (tenantsSnap.empty) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
        }

        const tenantId = tenantsSnap.docs[0].id;
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        const clientName = user?.displayName || user?.email || 'Client B2C';
        const now = new Date();
        const defaultDate = now.toISOString().split('T')[0];

        // Build destination string
        const destinations = cart
            .map((i: any) => i.location || i.name)
            .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
            .join(', ');

        // ── 1. CREATE LEAD (goes to Pipeline) ──
        const leadRef = tenantRef.collection('leads').doc();
        await leadRef.set({
            clientName: clientName,
            destination: destinations || 'Divers',
            dates: 'À définir',
            budget: `${total || 0} EUR`,
            pax: 'À définir',
            status: 'WON',
            paymentStatus: 'PAID',
            source: 'Espace Client B2C',
            cartItems: cart,
            paidAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // ── 2. CREATE BOOKINGS / TRIPS depending on item type ──
        const catalogTypes = ['hotel', 'activity', 'restaurant', 'transfer', 'experience', 'dining', 'gastronomy', 'other'];

        for (const item of cart) {
            const itemType = (item.type || '').toLowerCase();
            const isCatalogPrestation = catalogTypes.includes(itemType);
            const price = typeof item.clientPrice === 'number'
                ? item.clientPrice
                : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0');

            if (isCatalogPrestation) {
                // ── SUPPLIER BOOKING (visible in Planning > Prestations) ──
                const bookingRef = tenantRef.collection('supplier_bookings').doc();
                await bookingRef.set({
                    supplierId: '',
                    prestationId: item.id || '',
                    prestationName: item.name || 'Prestation B2C',
                    clientId: '',
                    clientName: clientName,
                    date: defaultDate,
                    status: 'CONFIRMED',
                    prestationType: itemType === 'gastronomy' ? 'RESTAURANT' : itemType.toUpperCase(),
                    rate: price,
                    notes: `Réservé via Espace Client — Paiement confirmé`,
                    numberOfGuests: 2,
                    createdAt: now,
                });

                // ── FIND AVAILABLE SUPPLIER & NOTIFY VIA WHATSAPP ──
                const typeMap: Record<string, string[]> = {
                    'hotel': ['HOTEL'],
                    'restaurant': ['RESTAURANT', 'GASTRONOMIE'],
                    'gastronomy': ['RESTAURANT', 'GASTRONOMIE'],
                    'activity': ['ACTIVITE', 'EXCURSION'],
                    'experience': ['ACTIVITE', 'EXPERIENCE'],
                    'transfer': ['CHAUFFEUR', 'TRANSFERT', 'TRANSPORT'],
                    'other': [],
                };
                const matchCategories = typeMap[itemType] || [];
                if (matchCategories.length > 0) {
                    try {
                        // 1. Get all suppliers matching this category
                        const suppliersSnap = await tenantRef.collection('suppliers')
                            .where('category', 'in', matchCategories)
                            .get();

                        // 2. Get all existing bookings for this date (to check availability)
                        const existingBookingsSnap = await tenantRef.collection('supplier_bookings')
                            .where('date', '==', defaultDate)
                            .where('status', 'in', ['CONFIRMED', 'PROPOSED'])
                            .get();

                        // Build a set of supplier IDs already booked on this date
                        const busySupplierIds = new Set<string>();
                        existingBookingsSnap.docs.forEach(doc => {
                            const b = doc.data();
                            if (b.supplierId) busySupplierIds.add(b.supplierId);
                        });

                        // 3. Find first AVAILABLE supplier with a phone number
                        let assigned = false;
                        for (const supplierDoc of suppliersSnap.docs) {
                            const supplier = supplierDoc.data();

                            // Skip if already booked on this date
                            if (busySupplierIds.has(supplierDoc.id)) {
                                console.log(`[Checkout] ⏭️ ${supplier.name} already booked on ${defaultDate} — skipping`);
                                continue;
                            }

                            if (supplier.phone) {
                                // Assign this available supplier
                                await bookingRef.update({ supplierId: supplierDoc.id });

                                // Send WhatsApp notification
                                const result = await notifySupplierBooking({
                                    supplierName: supplier.contactName || supplier.name,
                                    supplierPhone: supplier.phone,
                                    prestationName: item.name || 'Prestation',
                                    clientName: clientName,
                                    date: defaultDate,
                                    numberOfGuests: 2,
                                    notes: item.description || undefined,
                                });
                                console.log(`[Checkout] ✅ Assigned ${supplier.name} (available) — WhatsApp: ${result.success ? 'sent' : result.error}`);
                                assigned = true;
                                break;
                            }
                        }

                        if (!assigned) {
                            console.warn(`[Checkout] ⚠️ No available supplier for "${item.name}" on ${defaultDate} — booking needs manual assignment`);
                            await bookingRef.update({
                                notes: `Réservé via Espace Client — Paiement confirmé\n⚠️ AUCUN PRESTATAIRE DISPONIBLE — Assignation manuelle requise`,
                            });
                        }
                    } catch (waErr) {
                        console.warn('[Checkout] Supplier assignment/WhatsApp failed:', waErr);
                    }
                }
            } else {
                // ── TRIP (visible in Planning > Voyages) ──
                const tripRef = tenantRef.collection('trips').doc();
                await tripRef.set({
                    title: item.name || 'Voyage B2C',
                    destination: item.location || 'À définir',
                    clientName: clientName,
                    clientId: '',
                    startDate: defaultDate,
                    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    amount: price,
                    notes: `Réservé via Espace Client — Paiement confirmé\n${item.description || ''}`.trim(),
                    color: '#b9dae9',
                    createdAt: now,
                    updatedAt: now,
                });

                // Link trip to lead
                await leadRef.update({ tripId: tripRef.id });
            }
        }

        // ── 3. AUTO-CREATE INVOICE ──
        const invoiceRef = tenantRef.collection('invoices').doc();
        await invoiceRef.set({
            invoiceNumber: `INV-B2C-${Date.now().toString(36).toUpperCase()}`,
            clientName: clientName,
            clientId: '',
            items: cart.map((item: any) => ({
                description: item.name,
                quantity: 1,
                unitPrice: typeof item.clientPrice === 'number' ? item.clientPrice : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0'),
                total: typeof item.clientPrice === 'number' ? item.clientPrice : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0'),
                taxRate: 0,
            })),
            subtotal: total || 0,
            taxTotal: 0,
            totalAmount: total || 0,
            currency: 'EUR',
            issueDate: defaultDate,
            dueDate: defaultDate,
            amountPaid: total || 0,
            status: 'PAID',
            notes: `Auto-générée — Paiement Espace Client B2C`,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // ── 4. SEND INVOICE BY EMAIL TO CLIENT ──
        const clientEmail = user?.email;
        if (clientEmail) {
            try {
                const { sendEmail } = await import('@/src/lib/gmail/api');
                const invoiceNumber = `INV-B2C-${Date.now().toString(36).toUpperCase()}`;
                const itemsHtml = cart.map((item: any) => {
                    const price = typeof item.clientPrice === 'number'
                        ? item.clientPrice
                        : parseInt(String(item.clientPrice).replace(/[^\d]/g, '') || '0');
                    return `<tr style="border-bottom:1px solid #f0f0f0">
                        <td style="padding:12px 16px;font-size:14px;color:#2E2E2E">${item.name || 'Prestation'}</td>
                        <td style="padding:12px 16px;font-size:14px;color:#2E2E2E;text-align:center">1</td>
                        <td style="padding:12px 16px;font-size:14px;color:#2E2E2E;text-align:right;font-weight:600">${price.toLocaleString('fr-FR')} €</td>
                    </tr>`;
                }).join('');

                const invoiceHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1ed;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<!-- Outer wrapper -->
<div style="max-width:640px;margin:0 auto;padding:40px 20px">

    <!-- Logo header -->
    <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-block;padding:16px 40px">
            <h1 style="margin:0;font-size:32px;font-weight:200;color:#2E2E2E;letter-spacing:8px">LUNA</h1>
            <p style="margin:4px 0 0;font-size:10px;color:#b9dae9;letter-spacing:4px;text-transform:uppercase;font-weight:600">Conciergerie de Voyage</p>
        </div>
    </div>

    <!-- Main card -->
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.06)">
        
        <!-- Elegant header strip -->
        <div style="background:linear-gradient(135deg, #2E2E2E 0%, #3a3a3a 50%, #2E2E2E 100%);padding:48px 40px;text-align:center;position:relative">
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg, rgba(185,218,233,0.08) 0%, transparent 100%)"></div>
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;border:2px solid rgba(185,218,233,0.3);margin-bottom:16px;line-height:56px;text-align:center">
                <span style="font-size:24px;color:#b9dae9">✓</span>
            </div>
            <h2 style="margin:0;color:white;font-size:26px;font-weight:300;letter-spacing:1px">Confirmation de réservation</h2>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:500">Facture ${invoiceNumber}</p>
        </div>

        <!-- Body content -->
        <div style="padding:40px">
            <!-- Date badge -->
            <div style="text-align:center;margin-bottom:32px">
                <span style="display:inline-block;background:#f4f1ed;color:#2E2E2E;padding:8px 20px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:1px">${new Date(defaultDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <!-- Greeting -->
            <p style="color:#2E2E2E;font-size:16px;line-height:1.7;margin:0 0 8px;font-weight:400">
                Bonjour <strong style="font-weight:600">${clientName}</strong>,
            </p>
            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 32px">
                Merci pour votre confiance. Votre paiement a bien été enregistré et votre réservation est confirmée. Voici le récapitulatif de vos prestations :
            </p>

            <!-- Prestations list -->
            <div style="border-radius:12px;overflow:hidden;border:1px solid #f0ece7;margin-bottom:32px">
                <div style="background:#faf8f5;padding:14px 20px;border-bottom:1px solid #f0ece7">
                    <table style="width:100%;border-collapse:collapse">
                        <tr>
                            <td style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;font-weight:700">Prestation</td>
                            <td style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;font-weight:700;text-align:center;width:50px">Qté</td>
                            <td style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;font-weight:700;text-align:right;width:90px">Tarif</td>
                        </tr>
                    </table>
                </div>
                ${cart.map((item: any) => {
                    const price = typeof item.clientPrice === 'number'
                        ? item.clientPrice
                        : parseInt(String(item.clientPrice).replace(/[^\\d]/g, '') || '0');
                    return `<div style="padding:16px 20px;border-bottom:1px solid #f0ece7;background:white">
                        <table style="width:100%;border-collapse:collapse">
                            <tr>
                                <td style="vertical-align:top">
                                    <p style="margin:0;font-size:15px;color:#2E2E2E;font-weight:600">${item.name || 'Prestation'}</p>
                                    ${item.location ? `<p style="margin:4px 0 0;font-size:12px;color:#b9dae9;font-weight:500">📍 ${item.location}</p>` : ''}
                                    ${item.description ? `<p style="margin:6px 0 0;font-size:12px;color:#999;line-height:1.5">${(item.description || '').substring(0, 120)}${(item.description || '').length > 120 ? '...' : ''}</p>` : ''}
                                </td>
                                <td style="vertical-align:top;text-align:center;width:50px;font-size:14px;color:#666;padding-top:2px">1</td>
                                <td style="vertical-align:top;text-align:right;width:90px;font-size:15px;color:#2E2E2E;font-weight:700;padding-top:2px">${price.toLocaleString('fr-FR')} €</td>
                            </tr>
                        </table>
                    </div>`;
                }).join('')}
                <!-- Total -->
                <div style="padding:20px;background:#2E2E2E">
                    <table style="width:100%;border-collapse:collapse">
                        <tr>
                            <td style="font-size:13px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:2px;font-weight:700">Total payé</td>
                            <td style="text-align:right;font-size:24px;color:white;font-weight:300;letter-spacing:1px">${(total || 0).toLocaleString('fr-FR')} €</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Info box -->
            <div style="background:#f4f8fa;border-radius:12px;padding:20px 24px;margin-bottom:32px;border-left:3px solid #b9dae9">
                <p style="margin:0;font-size:13px;color:#2E2E2E;line-height:1.6">
                    <strong style="font-weight:600">Prochaine étape :</strong> Votre concierge dédié vous contactera sous 24h pour finaliser les détails et personnaliser votre expérience.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align:center;margin:40px 0 16px">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://luna-conciergerie.com'}/client" 
                   style="display:inline-block;background:#2E2E2E;color:white;text-decoration:none;padding:16px 48px;font-size:12px;letter-spacing:3px;text-transform:uppercase;border-radius:8px;font-weight:600;box-shadow:0 4px 16px rgba(46,46,46,0.2)">
                    Accéder à mon espace
                </a>
            </div>
            <p style="text-align:center;margin:0;font-size:11px;color:#ccc;font-style:italic">
                Retrouvez vos réservations, documents et contacts
            </p>
        </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:32px 20px">
        <div style="margin-bottom:16px">
            <span style="font-size:18px;font-weight:200;color:#2E2E2E;letter-spacing:4px">LUNA</span>
        </div>
        <p style="margin:0 0 12px;font-size:11px;color:#999;line-height:1.6">
            L'art de voyager. Magnifiquement.
        </p>
        <div style="margin:16px 0">
            <a href="mailto:lunacconciergerie@gmail.com" style="color:#b9dae9;font-size:12px;text-decoration:none;font-weight:500">lunacconciergerie@gmail.com</a>
        </div>
        <p style="margin:16px 0 0;font-size:10px;color:#ccc;line-height:1.5">
            © ${new Date().getFullYear()} Conciergerie de Voyage. Tous droits réservés.<br>
            Cet email a été envoyé automatiquement suite à votre réservation.
        </p>
    </div>

</div>
</body>
</html>`;

                await sendEmail({
                    to: clientEmail,
                    subject: `Luna — Facture ${invoiceNumber} confirmée (${(total || 0).toLocaleString('fr-FR')} €)`,
                    bodyText: `Bonjour ${clientName}, votre paiement de ${total} € a été confirmé. Facture ${invoiceNumber}. Merci pour votre confiance.`,
                    bodyHtml: invoiceHtml,
                });
                console.log(`[Checkout] 📧 Invoice email sent to ${clientEmail}`);
            } catch (emailErr: any) {
                console.error('[Checkout] ⚠️ Invoice email failed:', emailErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            leadId: leadRef.id,
            message: 'Achat enregistré dans le CRM : Lead + Prestations/Voyages + Facture + Email',
        });
    } catch (error: any) {
        console.error('Mock checkout error:', error);
        return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
    }
}
