/**
 * Multi-Provider AI Abstraction Layer
 * 
 * Routes AI calls to the best free provider:
 * - "fast" → Groq (Llama 3.3 70B) — free, ultra-fast, good for chat/JSON
 * - "pro"  → Gemini Pro — for complex, long-context tasks (travel agents)
 * 
 * Automatic fallback: Groq → Gemini if Groq fails or is unavailable.
 */

let Groq: any;
try { Groq = require('groq-sdk'); } catch { Groq = null; }
import { GoogleGenAI } from '@google/genai';

// ── Provider clients ────────────────────────────────────────────────
const groqClient = (process.env.GROQ_API_KEY && Groq)
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ── Models ──────────────────────────────────────────────────────────
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_FLASH = 'gemini-2.5-flash';
const GEMINI_PRO = 'gemini-2.5-flash';

export type AIModel = 'fast' | 'pro';
export type AIProvider = 'groq' | 'gemini';

export interface AIOptions {
    /** 'fast' = Groq (free), 'pro' = Gemini Pro (complex tasks). Default: 'fast' */
    model?: AIModel;
    /** System prompt prepended to the request */
    systemPrompt?: string;
    /** Temperature (0-2). Default: 0.7 */
    temperature?: number;
    /** Max output tokens. Default: 4096 */
    maxTokens?: number;
    /** If true, attempts JSON parsing from the response */
    jsonMode?: boolean;
    /** Chat history for multi-turn conversations */
    history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AIResult {
    text: string;
    provider: AIProvider;
    model: string;
}

/**
 * Generate AI content through the best available provider.
 * 
 * @param prompt - The user prompt
 * @param options - Configuration options
 * @returns The AI response with provider metadata
 */
export async function generateAI(prompt: string, options: AIOptions = {}): Promise<AIResult> {
    const {
        model = 'fast',
        systemPrompt,
        temperature = 0.7,
        maxTokens = 4096,
        history,
    } = options;

    // Route: "pro" always goes to Gemini, "fast" tries Groq first
    if (model === 'pro') {
        return callGemini(prompt, { systemPrompt, temperature, maxTokens, history, geminiModel: GEMINI_PRO });
    }

    // Try Groq first (free), fallback to Gemini Flash
    if (groqClient) {
        try {
            return await callGroq(prompt, { systemPrompt, temperature, maxTokens, history });
        } catch (err: any) {
            console.warn(`[AI:groq] Failed (${err?.message || err}), falling back to Gemini Flash...`);
        }
    }

    // Fallback to Gemini Flash
    return callGemini(prompt, { systemPrompt, temperature, maxTokens, history, geminiModel: GEMINI_FLASH });
}

/**
 * Generate AI content and parse as JSON.
 * Convenience wrapper around generateAI with JSON extraction.
 */
export async function generateAIJSON(prompt: string, options: AIOptions = {}): Promise<{ data: any; provider: AIProvider; model: string }> {
    const result = await generateAI(prompt, { ...options, jsonMode: true });
    const text = result.text;

    // Extract JSON from response (handle markdown wrapping)
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim();
    }

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.warn(`[AI:${result.provider}] No JSON found in response, raw text:`, cleanText.substring(0, 300));
        return { data: { summary: cleanText }, provider: result.provider, model: result.model };
    }

    try {
        return { data: JSON.parse(jsonMatch[0]), provider: result.provider, model: result.model };
    } catch {
        console.warn(`[AI:${result.provider}] JSON parse failed, returning raw text`);
        return { data: { summary: cleanText }, provider: result.provider, model: result.model };
    }
}

// ── Internal: Call Groq ─────────────────────────────────────────────
async function callGroq(
    prompt: string,
    opts: { systemPrompt?: string; temperature: number; maxTokens: number; history?: { role: 'user' | 'assistant'; content: string }[] }
): Promise<AIResult> {
    if (!groqClient) throw new Error('Groq client not available');

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    if (opts.systemPrompt) {
        messages.push({ role: 'system', content: opts.systemPrompt });
    }

    if (opts.history) {
        for (const msg of opts.history) {
            messages.push({ role: msg.role, content: msg.content });
        }
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
    });

    const text = completion.choices[0]?.message?.content || '';
    console.log(`[AI:groq] ✅ Response (${text.length} chars) via ${GROQ_MODEL}`);

    return { text, provider: 'groq', model: GROQ_MODEL };
}

// ── Internal: Call Gemini ───────────────────────────────────────────
async function callGemini(
    prompt: string,
    opts: { systemPrompt?: string; temperature: number; maxTokens: number; history?: { role: 'user' | 'assistant'; content: string }[]; geminiModel: string }
): Promise<AIResult> {
    const contents: { role: string; parts: { text: string }[] }[] = [];

    if (opts.history) {
        for (const msg of opts.history) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const result = await geminiClient.models.generateContent({
        model: opts.geminiModel,
        contents,
        config: {
            ...(opts.systemPrompt ? { systemInstruction: opts.systemPrompt } : {}),
            maxOutputTokens: opts.maxTokens,
            temperature: opts.temperature,
        },
    });

    const text = result.text || '';
    console.log(`[AI:gemini] ✅ Response (${text.length} chars) via ${opts.geminiModel}`);

    return { text, provider: 'gemini', model: opts.geminiModel };
}

/**
 * Get the currently active provider name for logging/tracking.
 */
export function getActiveProvider(): AIProvider {
    return groqClient ? 'groq' : 'gemini';
}
