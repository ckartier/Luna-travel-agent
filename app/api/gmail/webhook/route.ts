export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getEmailContent } from '@/src/lib/gmail/api';
import { extractTravelLeadFromEmail } from '@/src/lib/gemini/extraction';

// This endpoint receives push notifications from Google Cloud Pub/Sub
// when a new email arrives in the connected Gmail inbox.
export async function POST(req: Request) {
    try {
        const pubSubMessage = await req.json();

        if (!pubSubMessage || !pubSubMessage.message || !pubSubMessage.message.data) {
            return NextResponse.json({ error: 'Invalid Pub/Sub message format' }, { status: 400 });
        }

        // The message data is base64 encoded by Pub/Sub
        const decodedMessage = Buffer.from(pubSubMessage.message.data, 'base64').toString('utf-8');
        const notification = JSON.parse(decodedMessage);

        // Usually, the notification simply tells us the historyId changed for an email address.
        // In a full implementation, you'd use gmail.users.history.list to find the specific new messageId.
        // For this demonstration/scaffolding, we'll assume the payload directly gives us a messageId
        // or we fetch the most recent UNREAD email.
        const emailAddress = notification.emailAddress;
        const historyId = notification.historyId;

        // Gmail notification received

        // --- MOCK LOGIC FOR DEMONSTRATION OF THE FULL FLOW ---

        // 1. In a real scenario, you'd fetch the exact new Message ID based on the historyId.
        // Here we simulate fetching the message body from the API.
        const messageId = "simulated_message_id_12345";

        // Processing email
        // const emailData = await getEmailContent(messageId); 
        // We comment the real call out since we don't naturally have the OAuth tokens injected yet.

        const simulatedEmailData = {
            sender: "client@example.com",
            subject: "Demande de devis pour Bali cet été",
            date: new Date().toISOString(),
            bodyText: "Bonjour,\n\nNous aimerions partir à Bali cet été entre le 15 Juillet et le 5 Août. Nous sommes 2 adultes et 1 enfant de 5 ans.\nNotre budget maximum est de 4500 EUR.\nEst-il possible d'avoir un hôtel proche de la plage avec une piscine ?\n\nMerci,\nJean",
        };

        // Processing email
        // 2. Pass the raw email body to our AI extractor
        // const extractedData = await extractTravelLeadFromEmail(emailData.bodyText);

        // Simulating the AI response for instantaneous local dev demonstration
        const simulateAI = {
            intent: "NEW_REQUEST",
            destination: "Bali, Indonesia",
            travelDates: { start: "2024-07-15", end: "2024-08-05", flexible: true },
            budget: { amount: 4500, currency: "EUR" },
            pax: { adults: 2, children: 1, infants: 0 },
            specialRequests: "Hôtel proche de la plage avec une piscine",
            summary: "Famille de 3 personnes cherchant des vacances à Bali cet été avec un budget de 4500 EUR dans un hôtel avec piscine près de la plage."
        };

        // Processing email

        // 3. Save to CRM (Supabase)
        // await supabase.from('leads').insert([...]);

        // 4. Trigger the Super Agent LUNA Orchestrator
        const { orchestrateLead } = await import('@/src/lib/agents/orchestrator');
        const orchestrationPlan = await orchestrateLead(simulateAI as any);

        // Orchestration complete

        return NextResponse.json({
            success: true,
            processingStatus: 'Lead created and orchestrated by LUNA',
            plan: orchestrationPlan
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: 'Internal Server Error processing webhook' }, { status: 500 });
    }
}
