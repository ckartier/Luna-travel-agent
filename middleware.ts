import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware — Centralized security layer
 * - Auth protection for CRM/API routes (defence-in-depth, routes still verify auth internally)
 * - CRON secret validation  
 * - Basic bot detection
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();

  // Canonical host: keep production traffic on www until apex ownership is stable in Firebase.
  const shouldCanonicalRedirect =
    (host === 'datarnivore.com' || host === 'datarnivore.web.app' || host === 'datarnivore.firebaseapp.com') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/.well-known/');
  if (shouldCanonicalRedirect) {
    const target = request.nextUrl.clone();
    target.host = 'www.datarnivore.com';
    target.protocol = 'https';
    return NextResponse.redirect(target, 301);
  }

  // ─── CRON routes: require CRON_SECRET header ───
  if (pathname.startsWith('/api/cron/')) {
    const cronSecret = process.env.CRON_SECRET;
    const provided = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
    if (cronSecret && provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ─── Public routes: skip auth checks ───
  const publicPaths = [
    '/api/conciergerie/',
    '/api/quote/',
    '/api/trip/',
    '/api/stripe/webhook',
    '/api/gmail/webhook',
    '/api/gmail/callback',
    '/api/gmail/auth',
    '/api/whatsapp/webhook',
    '/api/daily-quote',
    '/api/weather',
    '/api/client/',
    '/api/client-booking',
    '/api/booking',
    '/api/bookings/',
  ];

  // site-config GET is public (read-only branding, no user-private data)
  if (pathname === '/api/crm/site-config' && request.method === 'GET') {
    return NextResponse.next();
  }
  // Upload route: skip middleware to avoid 10MB body size limit (route has its own verifyAuth)
  if (pathname === '/api/crm/upload') {
    return NextResponse.next();
  }
  
  const isPublicApi = publicPaths.some(p => pathname.startsWith(p));
  if (isPublicApi) {
    return NextResponse.next();
  }

  // ─── Protected API routes: verify Firebase auth cookie/token ───
  if (pathname.startsWith('/api/crm/') || pathname.startsWith('/api/ai/') || 
      pathname.startsWith('/api/gmail/') || pathname.startsWith('/api/admin/') ||
      pathname.startsWith('/api/agents/') || pathname.startsWith('/api/catalog/')) {
    
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('firebase-auth-token')?.value;
    
    if (!authHeader && !cookieToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  }

  // ─── CRM pages: redirect to login if no session ───
  if (pathname.startsWith('/crm') || pathname.startsWith('/site-admin')) {
    const session = request.cookies.get('firebase-auth-token')?.value;
    if (!session) {
      // Don't block — let client-side AuthGuard handle redirect
      // This is defence-in-depth only
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to app routes (exclude static assets/files) so host canonicalization works.
    '/((?!_next|.*\\..*).*)',
    // Exclude /api/crm/upload from middleware to avoid 10MB body truncation
    '/api/((?!crm/upload).*)',
  ],
};
