import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)' },
];

const defaultMonumAppUrl = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:4173'
  : 'https://monum.app';
const monumAppUrl = (process.env.NEXT_PUBLIC_MONUM_APP_URL || defaultMonumAppUrl).replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/hub',
        permanent: false,
      },
      // Canonical CRM entry points
      {
        source: '/crm/luna',
        destination: '/crm/travel',
        permanent: false,
      },
      {
        source: '/crm/avocat',
        destination: '/crm/legal',
        permanent: false,
      },
      // Legacy query-based CRM routes
      {
        source: '/crm',
        has: [{ type: 'query', key: 'vertical', value: 'travel' }],
        destination: '/crm/travel',
        permanent: false,
      },
      {
        source: '/crm',
        has: [{ type: 'query', key: 'vertical', value: 'legal' }],
        destination: '/crm/legal',
        permanent: false,
      },
      {
        source: '/crm',
        has: [{ type: 'query', key: 'vertical', value: 'monum' }],
        destination: `${monumAppUrl}/app`,
        permanent: false,
      },
      {
        source: '/crm/luna',
        has: [{ type: 'query', key: 'vertical', value: 'travel' }],
        destination: '/crm/travel',
        permanent: false,
      },
      {
        source: '/crm/avocat',
        has: [{ type: 'query', key: 'vertical', value: 'legal' }],
        destination: '/crm/legal',
        permanent: false,
      },
      {
        source: '/crm/monum',
        destination: `${monumAppUrl}/app`,
        permanent: false,
      },
      {
        source: '/login',
        has: [{ type: 'query', key: 'vertical', value: 'monum' }],
        destination: `${monumAppUrl}/login`,
        permanent: false,
      },
      {
        source: '/signup',
        has: [{ type: 'query', key: 'vertical', value: 'monum' }],
        destination: `${monumAppUrl}/signup`,
        permanent: false,
      },
      {
        source: '/login/monum',
        destination: `${monumAppUrl}/login`,
        permanent: false,
      },
      {
        source: '/signup/monum',
        destination: `${monumAppUrl}/signup`,
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // CORS for public API v1
        source: '/api/v1/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-API-Key, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // CORS for health check
        source: '/api/health',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },

  // Keep the SSR bundle self-contained for Firebase Hosting frameworks.
  // Externalizing firebase-admin has been crashing the deployed SSR runtime.
  serverExternalPackages: ['jspdf'],

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    middlewareClientMaxBodySize: '100mb',
  },
};

export default nextConfig;
