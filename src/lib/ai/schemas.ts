/**
 * AI Output Schema Validation
 * 
 * Zod schemas for validating AI-generated responses from the 4-agent orchestration.
 * Catches hallucinated/malformed responses before they reach the frontend.
 */

import { z } from 'zod';

// ─── Flight Schema ───
export const FlightSchema = z.object({
    airline: z.string().default('Unknown'),
    route: z.string().default(''),
    class: z.string().optional(),
    price: z.string().default('N/A'),
    duration: z.string().optional(),
    stops: z.union([z.string(), z.number()]).optional(),
    stopCity: z.string().nullable().optional(),
    url: z.string().url().optional().or(z.literal('')),
    domain: z.string().optional(),
});

export const TransportResponseSchema = z.object({
    summary: z.string().default('Aucun résultat transport.'),
    flights: z.array(FlightSchema).default([]),
    transfers: z.array(z.object({
        type: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        price: z.string().optional(),
        duration: z.string().optional(),
    })).optional().default([]),
});

// ─── Accommodation Schema ───
export const HotelSchema = z.object({
    name: z.string().default('Hôtel'),
    destination: z.string().optional(),
    stars: z.number().min(1).max(5).optional(),
    pricePerNight: z.string().optional(),
    price: z.string().optional(),
    highlights: z.array(z.string()).optional().default([]),
    recommendation: z.string().optional(),
    url: z.string().optional(),
    domain: z.string().optional(),
});

export const AccommodationResponseSchema = z.object({
    summary: z.string().default('Aucun résultat hébergement.'),
    hotels: z.array(HotelSchema).default([]),
});

// ─── Client Profile Schema ───
export const ClientResponseSchema = z.object({
    summary: z.string().default('Profil non disponible.'),
    profile: z.object({
        segment: z.string().optional(),
        preferences: z.array(z.string()).optional().default([]),
        specialNeeds: z.string().optional(),
        loyaltyTips: z.string().optional(),
    }).default({ preferences: [] }),
    recommendations: z.array(z.object({
        text: z.string(),
        type: z.string().optional(),
        url: z.string().nullable().optional(),
    })).optional().default([]),
});

// ─── Itinerary Schema ───
export const ItineraryDaySchema = z.object({
    day: z.number(),
    title: z.string().default(''),
    destination: z.string().optional(),
    morning: z.string().optional(),
    morningUrl: z.string().nullable().optional(),
    afternoon: z.string().optional(),
    afternoonUrl: z.string().nullable().optional(),
    evening: z.string().optional(),
    eveningUrl: z.string().nullable().optional(),
    highlight: z.string().optional(),
});

export const ItineraryResponseSchema = z.object({
    summary: z.string().default('Itinéraire non disponible.'),
    days: z.array(ItineraryDaySchema).default([]),
    tips: z.array(z.string()).optional().default([]),
    restaurants: z.array(z.object({
        name: z.string(),
        cuisine: z.string().optional(),
        price: z.string().optional(),
    })).optional().default([]),
});

// ─── Full Agent Response Schema ───
export const AgentResponseSchema = z.object({
    transport: TransportResponseSchema.default({ summary: '', flights: [], transfers: [] }),
    accommodation: AccommodationResponseSchema.default({ summary: '', hotels: [] }),
    client: ClientResponseSchema.default({ summary: '', profile: { preferences: [] }, recommendations: [] }),
    itinerary: ItineraryResponseSchema.default({ summary: '', days: [], tips: [], restaurants: [] }),
});

/**
 * Safely parse and validate an agent response.
 * Returns the validated data or a sanitized fallback with error info.
 */
export function validateAgentResponse(raw: any): {
    data: z.infer<typeof AgentResponseSchema>;
    errors: string[];
} {
    const errors: string[] = [];

    const safeParseSection = <T>(schema: z.ZodType<T>, value: any, label: string): T => {
        const result = schema.safeParse(value);
        if (result.success) return result.data;
        
        const errorMessages = result.error.issues.map(i => `${label}.${i.path.join('.')}: ${i.message}`);
        errors.push(...errorMessages);
        
        // Return the default value by parsing an empty object
        const fallback = schema.safeParse({});
        return fallback.success ? fallback.data : value;
    };

    return {
        data: {
            transport: safeParseSection(TransportResponseSchema, raw?.transport, 'transport'),
            accommodation: safeParseSection(AccommodationResponseSchema, raw?.accommodation, 'accommodation'),
            client: safeParseSection(ClientResponseSchema, raw?.client, 'client'),
            itinerary: safeParseSection(ItineraryResponseSchema, raw?.itinerary, 'itinerary'),
        },
        errors,
    };
}
