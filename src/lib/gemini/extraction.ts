import { GoogleGenAI } from '@google/genai';

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function extractTravelLeadFromEmail(emailBody: string): Promise<TravelLeadExtraction> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are the Luna B2B Travel Coordinator AI.
Your task is to parse an incoming email from a client to a travel agency and extract structured lead data.
Respond ONLY with a raw JSON object (no markdown, no backticks) matching this exact schema:
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

If a field is not mentioned in the email, omit it or leave it null.

Email to analyze:

${emailBody}`,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Gemini returned no valid JSON.');
        }

        return JSON.parse(jsonMatch[0]) as TravelLeadExtraction;

    } catch (error) {
        console.error("Error extracting travel lead data with Gemini:", error);
        throw error;
    }
}
