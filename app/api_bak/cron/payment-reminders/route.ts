import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';

/**
 * GET /api/cron/payment-reminders
 * 
 * Runs daily — finds invoices approaching due date (J-7) or overdue (J+3, J+7).
 * Logs reminders to Firestore for the agent to review/send.
 * 
 * Protected by CRON_SECRET header for Vercel Cron.
 */
export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: any[] = [];

    try {
        const tenantsSnap = await adminDb.collection('tenants').get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            const invoicesSnap = await tenantDoc.ref.collection('invoices').get();

            for (const invDoc of invoicesSnap.docs) {
                const inv = invDoc.data();

                // Skip paid, cancelled, or draft invoices
                if (['PAID', 'CANCELLED', 'DRAFT'].includes(inv.status)) continue;

                const dueDate = new Date(inv.dueDate);
                if (isNaN(dueDate.getTime())) continue;

                const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const remaining = inv.totalAmount - (inv.amountPaid || 0);

                if (remaining <= 0) continue;

                let reminderType: string | null = null;

                if (diffDays === 7) reminderType = 'PRE_7_DAYS';
                else if (diffDays === 3) reminderType = 'PRE_3_DAYS';
                else if (diffDays === 0) reminderType = 'DUE_TODAY';
                else if (diffDays === -3) reminderType = 'OVERDUE_3_DAYS';
                else if (diffDays === -7) reminderType = 'OVERDUE_7_DAYS';

                if (reminderType) {
                    // Check if reminder already sent
                    const existingReminder = await tenantDoc.ref
                        .collection('reminders')
                        .where('invoiceId', '==', invDoc.id)
                        .where('type', '==', reminderType)
                        .limit(1)
                        .get();

                    if (existingReminder.empty) {
                        await tenantDoc.ref.collection('reminders').add({
                            invoiceId: invDoc.id,
                            invoiceNumber: inv.invoiceNumber,
                            clientName: inv.clientName,
                            clientEmail: inv.clientEmail || '',
                            totalAmount: inv.totalAmount,
                            amountPaid: inv.amountPaid || 0,
                            remaining,
                            dueDate: inv.dueDate,
                            daysUntilDue: diffDays,
                            type: reminderType,
                            status: 'PENDING', // Agent manually sends or auto-send if enabled
                            createdAt: now,
                        });

                        results.push({
                            tenant: tenantId,
                            invoice: inv.invoiceNumber,
                            type: reminderType,
                            remaining,
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            ok: true,
            remindersCreated: results.length,
            details: results,
            timestamp: now.toISOString(),
        });
    } catch (error: any) {
        console.error('[Cron Payment Reminders] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
