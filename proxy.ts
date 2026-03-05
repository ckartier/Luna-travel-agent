import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Proxy — lightweight security headers & route hygiene.
 *
 * Auth enforcement is handled by:
 *   - Client-side: AuthGuard component (checks Firebase Auth state)
 *   - Server-side: apiAuth.ts (verifyIdToken on every API route)
 *
 * This proxy only adds security headers. It does NOT block page navigation
 * because Firebase Auth uses IndexedDB (not cookies), so we can't check
 * auth state at the Edge layer.
 */

export function proxy(request: NextRequest) {
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
