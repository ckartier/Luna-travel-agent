import { TravelLeadExtraction } from '../openai/extraction';

export interface AgentAction {
    agentRole: 'TRANSPORT' | 'ACCOMMODATION' | 'ACTIVITIES' | 'BUDGET' | 'CUSTOMER';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    actionDetails: string;
    result?: any;
}

export interface OrchestrationResult {
    leadData: TravelLeadExtraction;
    actionsTriggered: AgentAction[];
    suggestedReply?: string;
}

/**
 * Super Agent LUNA Orchestrator
 * This is the brain of the CRM. It takes structured data (like a new email lead)
 * and decides which sub-agents to wake up and what tasks to assign them.
 */
export async function orchestrateLead(leadData: TravelLeadExtraction): Promise<OrchestrationResult> {
    console.log('[LUNA ORCHESTRATOR] Analyzing new lead data...', leadData);

    const actions: AgentAction[] = [];

    // Logic to determine which agents to trigger based on the parsed email intent
    if (leadData.intent === 'NEW_REQUEST') {

        // 1. Wake up Customer Agent to create the profile
        actions.push({
            agentRole: 'CUSTOMER',
            status: 'PENDING',
            actionDetails: `Create or update CRM profile for lead requesting trip to ${leadData.destination || 'Unknown'}`
        });

        // 2. Wake up Transport Agent if dates and destination are somewhat known
        if (leadData.destination && leadData.travelDates?.start) {
            actions.push({
                agentRole: 'TRANSPORT',
                status: 'PENDING',
                actionDetails: `Search initial flight routes to ${leadData.destination} around ${leadData.travelDates.start}`
            });
        }

        // 3. Wake up Accommodation Agent if budget and pax are known
        if (leadData.pax && leadData.pax.adults && leadData.pax.adults > 0) {
            actions.push({
                agentRole: 'ACCOMMODATION',
                status: 'PENDING',
                actionDetails: `Search hotels in ${leadData.destination}. Specs: ${leadData.specialRequests}. Budget Context: ${leadData.budget?.amount} ${leadData.budget?.currency}`
            });
        }

        // 4. Budget Agent does an initial feasibility check
        if (leadData.budget?.amount) {
            actions.push({
                agentRole: 'BUDGET',
                status: 'PENDING',
                actionDetails: `Analyze feasibility of ${leadData.budget.amount} ${leadData.budget.currency} for ${leadData.pax?.adults || 1} adults to ${leadData.destination}`
            });
        }
    }

    // Generate a very premium draft reply using the AI context
    const suggestedReply = `Bonjour,\n\nMerci d'avoir contacté notre agence. Mon assistant IA, Luna, a bien analysé votre demande pour ${leadData.destination || 'votre prochain voyage'} (${leadData.summary}).\n\nNos experts (Vols, Hôtels) sont déjà en train d'explorer les meilleures options correspondant à vos critères de confort et votre budget. Nous reviendrons vers vous d'ici 24h avec une première proposition étincelante.\n\nCordialement,\n\nL'équipe`;

    console.log(`[LUNA ORCHESTRATOR] Orchestration complete. Triggering ${actions.length} agents.`);

    return {
        leadData,
        actionsTriggered: actions,
        suggestedReply
    };
}
