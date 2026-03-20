/* ═══════════════════════════════════════════════════
   GEMINI LIVE ECONOMY MODE
   Streaming + cost optimization layer
   ═══════════════════════════════════════════════════ */

// ─── Response Cache — Avoid re-asking the same questions ───
interface CacheEntry {
    response: string;
    timestamp: number;
    toolResult?: string;
}

const RESPONSE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60_000; // 5 minutes
const MAX_CACHE_SIZE = 50;

function getCacheKey(userText: string): string {
    // Normalize: lowercase, remove punctuation, trim
    return userText.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').trim().replace(/\s+/g, ' ');
}

export function getCachedResponse(userText: string): string | null {
    const key = getCacheKey(userText);
    const entry = RESPONSE_CACHE.get(key);
    if (!entry) return null;
    
    // Expired?
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        RESPONSE_CACHE.delete(key);
        return null;
    }
    
    return entry.response;
}

export function cacheResponse(userText: string, response: string, toolResult?: string): void {
    // Don't cache very short or very long responses
    if (response.length < 10 || response.length > 2000) return;
    
    // Don't cache write operations (create, update, delete)
    const writeOps = ['crée', 'ajoute', 'met à jour', 'supprime', 'envoie', 'marque', 'ferme'];
    const lower = userText.toLowerCase();
    if (writeOps.some(op => lower.includes(op))) return;
    
    // Evict oldest if full
    if (RESPONSE_CACHE.size >= MAX_CACHE_SIZE) {
        const oldest = [...RESPONSE_CACHE.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) RESPONSE_CACHE.delete(oldest[0]);
    }
    
    RESPONSE_CACHE.set(getCacheKey(userText), {
        response,
        timestamp: Date.now(),
        toolResult,
    });
}

export function clearResponseCache(): void {
    RESPONSE_CACHE.clear();
}

// ─── Token Budget — Track Gemini API usage per session ───
interface SessionBudget {
    tokensUsed: number;
    apiCalls: number;
    toolCalls: number;
    sessionStart: number;
    maxTokens: number;      // Budget limit
    maxApiCalls: number;    // Max API calls per session
    warningThreshold: number; // % at which to warn
}

let sessionBudget: SessionBudget = {
    tokensUsed: 0,
    apiCalls: 0,
    toolCalls: 0,
    sessionStart: Date.now(),
    maxTokens: 200_000,    // ~200K tokens per session (generous economy)
    maxApiCalls: 500,      // Max 500 Gemini calls per session
    warningThreshold: 0.8, // Warn at 80%
};

export function initSessionBudget(maxTokens = 200_000, maxApiCalls = 500): void {
    sessionBudget = {
        tokensUsed: 0,
        apiCalls: 0,
        toolCalls: 0,
        sessionStart: Date.now(),
        maxTokens,
        maxApiCalls,
        warningThreshold: 0.8,
    };
}

export function trackTokenUsage(inputTokens: number, outputTokens: number): void {
    sessionBudget.tokensUsed += inputTokens + outputTokens;
    sessionBudget.apiCalls++;
}

export function trackToolCall(): void {
    sessionBudget.toolCalls++;
}

export function getBudgetStatus(): {
    tokensUsed: number;
    tokensRemaining: number;
    apiCalls: number;
    percentage: number;
    isWarning: boolean;
    isExhausted: boolean;
    sessionDuration: number;
} {
    const percentage = sessionBudget.tokensUsed / sessionBudget.maxTokens;
    const sessionDuration = Math.round((Date.now() - sessionBudget.sessionStart) / 60_000);
    
    return {
        tokensUsed: sessionBudget.tokensUsed,
        tokensRemaining: Math.max(0, sessionBudget.maxTokens - sessionBudget.tokensUsed),
        apiCalls: sessionBudget.apiCalls,
        percentage: Math.round(percentage * 100),
        isWarning: percentage >= sessionBudget.warningThreshold,
        isExhausted: percentage >= 1 || sessionBudget.apiCalls >= sessionBudget.maxApiCalls,
        sessionDuration,
    };
}

// ─── Economy Prompt — Always return full prompt (tool routing is essential) ───
export function getEconomySystemPrompt(fullPrompt: string): string {
    // NEVER strip the prompt — tool routing lines are critical for Gemini to work
    return fullPrompt;
}

// ─── Smart Response Shortening — Shorter responses when budget is low ───
export function getMaxResponseTokens(): number {
    const budget = getBudgetStatus();
    
    if (budget.percentage < 50) return 300;  // Full responses
    if (budget.percentage < 70) return 200;  // Medium responses
    if (budget.percentage < 90) return 100;  // Short responses
    return 50;                                // Ultra-short responses
}

// ─── Streaming Text Accumulator — For incremental display ───
export class StreamAccumulator {
    private chunks: string[] = [];
    private onChunk: (text: string, isDone: boolean) => void;
    
    constructor(onChunk: (text: string, isDone: boolean) => void) {
        this.onChunk = onChunk;
    }
    
    addChunk(text: string): void {
        this.chunks.push(text);
        this.onChunk(this.chunks.join(''), false);
    }
    
    finish(): string {
        const full = this.chunks.join('');
        this.onChunk(full, true);
        return full;
    }
    
    getText(): string {
        return this.chunks.join('');
    }
}

// ─── Auto-disconnect Timer with Progressive Warnings ───
export class EconomyTimer {
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private warningId: ReturnType<typeof setTimeout> | null = null;
    private readonly idleMs: number;
    private readonly warningMs: number;
    private onWarning: () => void;
    private onDisconnect: () => void;
    
    constructor(
        idleMs: number = 45_000,     // 45s idle → disconnect (was 60s)
        warningMs: number = 30_000,  // 30s → warning
        onWarning: () => void = () => {},
        onDisconnect: () => void = () => {},
    ) {
        this.idleMs = idleMs;
        this.warningMs = warningMs;
        this.onWarning = onWarning;
        this.onDisconnect = onDisconnect;
    }
    
    reset(): void {
        this.clear();
        this.warningId = setTimeout(() => {
            this.onWarning();
        }, this.warningMs);
        this.timeoutId = setTimeout(() => {
            this.onDisconnect();
        }, this.idleMs);
    }
    
    clear(): void {
        if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
        if (this.warningId) { clearTimeout(this.warningId); this.warningId = null; }
    }
}

// ─── Request Deduplication — Prevent duplicate API calls ───
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>
): Promise<T> {
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key) as Promise<T>;
    }
    
    const promise = requestFn().finally(() => {
        pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, promise);
    return promise;
}

// ─── Session Stats for Economy Dashboard ───
export function getSessionStats(): {
    summary: string;
    emoji: string;
    details: string;
} {
    const budget = getBudgetStatus();
    const cacheHits = RESPONSE_CACHE.size;
    
    let emoji = '🟢';
    if (budget.percentage > 80) emoji = '🔴';
    else if (budget.percentage > 50) emoji = '🟡';
    
    return {
        emoji,
        summary: `${emoji} ${budget.percentage}% du budget utilisé (${budget.apiCalls} appels, ${budget.sessionDuration}min)`,
        details: `Tokens: ${budget.tokensUsed}/${sessionBudget.maxTokens} | Appels: ${budget.apiCalls}/${sessionBudget.maxApiCalls} | Cache: ${cacheHits} entrée(s) | Outils: ${sessionBudget.toolCalls}`,
    };
}
