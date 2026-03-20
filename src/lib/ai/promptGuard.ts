/**
 * Prompt Injection Guard
 * 
 * Sanitizes user inputs before they are concatenated into AI prompts.
 * Strips known injection patterns, role overrides, and system prompt manipulation.
 */

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
    // Role/instruction overrides
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /you\s+are\s+now\s+(a|an)\s+/gi,
    /act\s+as\s+(a|an|if)\s+/gi,
    /pretend\s+(you\s+are|to\s+be)\s+/gi,
    /new\s+(system\s+)?instructions?:/gi,
    /system\s*:\s*/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|system\|>/gi,
    
    // Data exfiltration
    /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
    /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/gi,
    /what\s+(are|is)\s+your\s+(system\s+)?(instructions?|prompt|rules?)/gi,
    /repeat\s+(your|the)\s+(system\s+)?(instructions?|prompt)/gi,
    /output\s+(your|the)\s+(system\s+)?prompt/gi,
    
    // Delimiter injection
    /```\s*system/gi,
    /---+\s*system/gi,
    /\n{3,}/g,  // Excessive newlines (delimiter confusion)
];

// Characters that can be used for delimiter confusion
const DANGEROUS_CHARS = /[`]{3,}|[~]{3,}|[=]{5,}|[#]{5,}/g;

/**
 * Sanitize a user input string before including it in an AI prompt.
 * Returns the cleaned string.
 */
export function sanitizePromptInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    let cleaned = input;
    
    // 1. Strip injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        cleaned = cleaned.replace(pattern, '[filtered]');
    }
    
    // 2. Neutralize dangerous delimiters
    cleaned = cleaned.replace(DANGEROUS_CHARS, '');
    
    // 3. Limit length (prevent prompt stuffing)
    if (cleaned.length > 2000) {
        cleaned = cleaned.substring(0, 2000) + '…';
    }
    
    // 4. Trim excess whitespace
    cleaned = cleaned.replace(/\s{3,}/g, '  ').trim();
    
    return cleaned;
}

/**
 * Sanitize an object's string values for prompt inclusion.
 * Useful for sanitizing entire request bodies.
 */
export function sanitizePromptInputs<T extends Record<string, any>>(
    obj: T, 
    fields: (keyof T)[]
): T {
    const cleaned = { ...obj };
    for (const field of fields) {
        if (typeof cleaned[field] === 'string') {
            (cleaned as any)[field] = sanitizePromptInput(cleaned[field] as string);
        }
    }
    return cleaned;
}
