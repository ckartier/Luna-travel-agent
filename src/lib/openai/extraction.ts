import OpenAI from 'openai';

// Define the interface for the structured data we want to extract
export interface TravelLeadExtraction {
    intent: 'NEW_REQUEST' | 'UPDATE' | 'QUESTION' | 'OTHER';
    destination?: string;
    travelDates?: {
        start?: string;
        end?: string;
        flexible?: boolean;
    };
    budget?: {
        amount?: number;
        currency?: string;
    };
    pax?: {
        adults?: number;
        children?: number;
        infants?: number;
    };
    specialRequests?: string;
    summary: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function extractTravelLeadFromEmail(emailBody: string): Promise<TravelLeadExtraction> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    "role": "system",
                    "content": `You are the Luna B2B Travel Coordinator AI.
Your task is to parse an incoming email from a client to a travel agency and extract structured lead data.
Respond ONLY with a raw JSON object string (do not wrap in markdown or backticks) matching this exact schema:
{
  "intent": "NEW_REQUEST" | "UPDATE" | "QUESTION" | "OTHER",
  "destination": "string (optional)",
  "travelDates": {
    "start": "YYYY-MM-DD (optional)",
    "end": "YYYY-MM-DD (optional)",
    "flexible": boolean
  },
  "budget": {
    "amount": number (optional),
    "currency": "EUR" | "USD" | etc (optional)
  },
  "pax": {
    "adults": number (optional),
    "children": number (optional),
    "infants": number (optional)
  },
  "specialRequests": "string (optional)",
  "summary": "A 1-sentence summary of what the client wants"
}

If a field is not mentioned in the email, omit it or leave it null.`
                },
                {
                    "role": "user",
                    "content": `Please extract the travel lead data from the following email:\n\n${emailBody}`
                }
            ],
            temperature: 0.1, // Low temperature for consistent JSON extraction
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;

        if (!content) {
            throw new Error("OpenAI returned an empty response.");
        }

        const parsedJson = JSON.parse(content) as TravelLeadExtraction;
        return parsedJson;

    } catch (error) {
        console.error("Error extracting travel lead data with OpenAI:", error);
        throw error;
    }
}
