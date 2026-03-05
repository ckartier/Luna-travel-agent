import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware — lightweight route protection layer.
 *
 * This does NOT verify Firebase tokens (Edge Runtime doesn't support
 * firebase-admin). Instead it checks for the presence of a session
 * cookie / auth indicator and redirects unauthenticated users.
 *
 * Full token verification happens in API route handlers via apiAuth.ts.
 */

const PUBLIC_PATHS = ['/login', '/landing', '/pricing', '/cgv', '/api/stripe/webhook', '/api/whatsapp/webhook', '/api/gmail/webhook', '/api/gmail/callback'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths, static files, and Next.js internals
    if (
        PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(ico|svg|png|jpg|webp|woff2?|css|js)$/)
    ) {
        return NextResponse.next();
    }

    // API routes: let apiAuth.ts handle full token verification
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // For page routes: check for Firebase auth cookie/token indicator
    // Firebase client SDK stores auth state in IndexedDB, not cookies,
    // so we add a lightweight cookie from the client on login
    const authCookie = request.cookies.get('__session') || request.cookies.get('firebase-auth');
    if (!authCookie && !pathname.startsWith('/tracker')) {
        const loginUrl = new URL('/landing', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
