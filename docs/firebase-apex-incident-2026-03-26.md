# Firebase apex incident - datarnivore.com (2026-03-26)

## Summary
- Canonical production domain is `www.datarnivore.com` (healthy).
- Apex domain `datarnivore.com` is still not validated by Firebase Hosting.
- Result: `https://datarnivore.com` returns `404` while `https://www.datarnivore.com` works.

## Current Firebase state (custom domains)
- `www.datarnivore.com`
  - `hostState`: `HOST_ACTIVE`
  - `ownershipState`: `OWNERSHIP_ACTIVE`
- `datarnivore.com`
  - `hostState`: `HOST_ACTIVE`
  - `ownershipState`: `OWNERSHIP_MISMATCH`
  - `requiredDnsUpdates.discovered` still shows legacy TXT: `hosting-site=luna-travel-agent`
  - `requiredDnsUpdates.desired` expects TXT: `hosting-site=datarnivore`
- Legacy typo domain pending cleanup lifecycle:
  - `datarinvore.com` (soft-deleted)

## DNS authoritative checks (Gandi nameservers)
Authoritative nameservers for `datarnivore.com`:
- `ns-105-b.gandi.net`
- `ns-40-c.gandi.net`
- `ns-134-a.gandi.net`

Authoritative answers observed:
- `A datarnivore.com = 199.36.158.100`
- `TXT datarnivore.com = "hosting-site=datarnivore"`
- `TXT datarnivore.com = "v=spf1 include:_mailcust.gandi.net ?all"`

No authoritative record observed for legacy value `hosting-site=luna-travel-agent`.

## HTTP behavior
- `curl -I https://www.datarnivore.com` -> `307` (expected app redirect to `/hub`)
- `curl -I https://datarnivore.web.app` -> `307` (expected app redirect to `/hub`)
- `curl -I https://datarnivore.com` -> `404` (problem)

## Mitigation applied
- Canonical redirection added in middleware for non-canonical hosts:
  - `datarnivore.com`
  - `datarnivore.web.app`
  - `datarnivore.firebaseapp.com`
  - Redirect target: `https://www.datarnivore.com` with `301`
- File changed:
  - `/Users/laurentclement/luna-travel-dev/middleware.ts`

## What we already tried against Hosting API
- Forced PATCH updates (`annotations`, `certPreference`) on custom domain resource.
- Attempted delete/undelete cycle of `datarnivore.com` custom domain.
- Observed stale ownership mismatch state persists with old discovered TXT.

## Support ask to Firebase
Please refresh/reconcile Hosting custom domain ownership for:
- Project: `datarnivore` (`693191594260`)
- Site: `datarnivore`
- Domain: `datarnivore.com`

Problem statement:
- Firebase Hosting custom domain validation remains in `OWNERSHIP_MISMATCH` and still reports discovered TXT `hosting-site=luna-travel-agent`, despite authoritative DNS now serving only `hosting-site=datarnivore` on all Gandi NS.

Expected result:
- `ownershipState` becomes `OWNERSHIP_ACTIVE`
- `https://datarnivore.com` serves the same Hosting site as `https://www.datarnivore.com`
