'use client';

import { useState, useEffect } from 'react';

interface SiteConfigGlobal {
  logo: string;
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
}

interface SiteConfigBusiness {
  name: string;
  email: string;
  phone: string;
}

interface SiteConfig {
  global: SiteConfigGlobal;
  business: SiteConfigBusiness;
  template: string;
}

const DEFAULT_LOGO = '/luna-logo-blue.svg';
const DEFAULT_SITE_NAME = 'Luna';

// Simple in-memory cache to avoid refetching on every component mount
let cachedConfig: SiteConfig | null = null;
let fetchPromise: Promise<SiteConfig> | null = null;

async function fetchSiteConfig(): Promise<SiteConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/crm/site-config')
    .then(res => res.json())
    .then(data => {
      cachedConfig = data;
      return data;
    })
    .catch(() => {
      return {
        global: { logo: DEFAULT_LOGO, siteName: DEFAULT_SITE_NAME } as SiteConfigGlobal,
        business: { name: 'Luna Conciergerie' } as SiteConfigBusiness,
        template: 'elegance',
      } as SiteConfig;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/**
 * Hook to get the site logo from Firebase site_config.
 * Returns the logo URL (defaults to /luna-logo-blue.svg).
 * Uses in-memory cache so multiple components don't re-fetch.
 */
export function useLogo(): string {
  const [logo, setLogo] = useState(DEFAULT_LOGO);

  useEffect(() => {
    fetchSiteConfig().then(cfg => {
      if (cfg?.global?.logo) setLogo(cfg.global.logo);
    });
  }, []);

  return logo;
}

/**
 * Hook to get the full site config from Firebase.
 */
export function useSiteConfig(): SiteConfig | null {
  const [config, setConfig] = useState<SiteConfig | null>(cachedConfig);

  useEffect(() => {
    fetchSiteConfig().then(cfg => setConfig(cfg));
  }, []);

  return config;
}

/**
 * Invalidate the cached site config (call after saving changes in editor).
 */
export function invalidateSiteConfigCache() {
  cachedConfig = null;
}
