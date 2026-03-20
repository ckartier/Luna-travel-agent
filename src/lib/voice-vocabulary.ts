/**
 * Voice Vocabulary Engine
 * 
 * Pre-loads CRM data (client names, destinations, catalog items, suppliers)
 * and uses fuzzy matching to auto-correct speech recognition output.
 * 
 * 100% client-side, 0 API cost.
 */

export interface VoiceVocabulary {
    clientNames: string[];
    destinations: string[];
    prestations: string[];
    suppliers: string[];
    allTerms: string[];           // Combined for quick lookup
    corrections: Map<string, string>; // User-learned corrections
}

/**
 * Fetch CRM vocabulary — cached per session.
 */
export async function fetchVocabulary(idToken: string): Promise<VoiceVocabulary> {
    try {
        const res = await fetch('/api/crm/voice-vocabulary', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) return emptyVocabulary();
        const data = await res.json();
        // Map doesn't survive JSON serialization — re-create it
        data.corrections = new Map(Object.entries(data.corrections || {}));
        return data;
    } catch {
        return emptyVocabulary();
    }
}

function emptyVocabulary(): VoiceVocabulary {
    return { clientNames: [], destinations: [], prestations: [], suppliers: [], allTerms: [], corrections: new Map() };
}

/**
 * Levenshtein distance for fuzzy matching.
 */
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[m][n];
}

/**
 * Normalize for comparison (lowercase, remove accents, trim)
 */
function normalize(s: string): string {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim();
}

/**
 * Find the closest match from vocabulary for a given term.
 * Returns the corrected term if a close match is found, otherwise the original.
 */
export function findClosestMatch(term: string, vocabulary: string[], maxDistance = 2): string | null {
    const normalized = normalize(term);
    if (normalized.length < 3) return null;

    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    for (const candidate of vocabulary) {
        const nCandidate = normalize(candidate);
        
        // Exact match
        if (normalized === nCandidate) return candidate;
        
        // Substring match (e.g., "Marc" found in "Marc Dupont")
        if (nCandidate.includes(normalized) || normalized.includes(nCandidate)) return candidate;
        
        // Levenshtein distance
        const dist = levenshtein(normalized, nCandidate);
        if (dist <= maxDistance && dist < bestDistance) {
            bestDistance = dist;
            bestMatch = candidate;
        }
    }

    return bestMatch;
}

/**
 * Auto-correct a full transcription using CRM vocabulary.
 * Replaces misrecognized names/terms with the closest CRM match.
 */
export function correctTranscription(text: string, vocab: VoiceVocabulary): { corrected: string; corrections: Array<{ original: string; corrected: string }> } {
    const corrections: Array<{ original: string; corrected: string }> = [];
    let corrected = text;

    // Split into words and try multi-word combinations (for names like "Marc Dupont")
    const words = text.split(/\s+/);
    
    // Try 2-word and 3-word combinations first (for full names)
    for (let len = 3; len >= 1; len--) {
        for (let i = 0; i <= words.length - len; i++) {
            const phrase = words.slice(i, i + len).join(' ');
            if (phrase.length < 3) continue;

            // Check learned corrections first
            const learned = vocab.corrections.get(normalize(phrase));
            if (learned) {
                corrected = corrected.replace(phrase, learned);
                corrections.push({ original: phrase, corrected: learned });
                continue;
            }

            // Try matching against vocabulary
            const match = findClosestMatch(phrase, vocab.allTerms, len > 1 ? 3 : 2);
            if (match && normalize(match) !== normalize(phrase)) {
                corrected = corrected.replace(phrase, match);
                corrections.push({ original: phrase, corrected: match });
            }
        }
    }

    return { corrected, corrections };
}

/**
 * Analyze speech recognition confidence and decide action.
 */
export function analyzeConfidence(confidence: number): {
    action: 'accept' | 'warn' | 'retry';
    message?: string;
} {
    if (confidence >= 0.85) {
        return { action: 'accept' };
    } else if (confidence >= 0.6) {
        return { action: 'warn', message: 'Reconnaissance incertaine — vérification en cours.' };
    } else {
        return { action: 'retry', message: 'Je n\'ai pas bien compris. Pouvez-vous répéter ?' };
    }
}
