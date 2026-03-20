/**
 * In-memory rate limiter for API routes.
 * 
 * ⚠️ PRODUCTION WARNING: This uses a process-local Map(). In multi-instance
 * deployments (Vercel, Cloud Run, etc.), each instance has its own counter.
 * Effective rate limiting requires a shared store (Redis, Upstash, etc.).
 * 
 * TODO: Replace with @upstash/ratelimit for serverless-compatible rate limiting:
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(30, "60 s") });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const PRESETS: Record<string, RateLimitConfig> = {
  ai:       { limit: 30,  windowSeconds: 60 },   // 30 req/min for AI routes
  email:    { limit: 10,  windowSeconds: 60 },   // 10 emails/min
  whatsapp: { limit: 10,  windowSeconds: 60 },   // 10 messages/min
  scrape:   { limit: 15,  windowSeconds: 60 },   // 15 scrapes/min
  default:  { limit: 60,  windowSeconds: 60 },   // 60 req/min general
  cron:     { limit: 5,   windowSeconds: 60 },   // 5 cron calls/min
  upload:   { limit: 20,  windowSeconds: 60 },   // 20 uploads/min
};

export function getPreset(name: string): RateLimitConfig {
  return PRESETS[name] || PRESETS.default;
}

/**
 * Check rate limit for a given key (IP, userId, etc.)
 * Returns { allowed, remaining, resetIn } 
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = PRESETS.default,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.limit - 1, resetIn: config.windowSeconds };
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Helper: apply rate limiting to a Next.js API route.
 * Returns a 429 Response if rate-limited, or null if allowed.
 */
export function rateLimitResponse(
  key: string,
  preset: string = 'default',
): Response | null {
  const config = getPreset(preset);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.resetIn,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.resetIn),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetIn),
        },
      },
    );
  }

  return null;
}

/**
 * Get a rate-limit key from a Request (uses IP + pathname).
 */
export function getRateLimitKey(req: Request): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const url = new URL(req.url);
  return `${ip}:${url.pathname}`;
}
