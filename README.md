# Luna Travel SaaS

> CRM multi-tenant pour conciergeries voyage sur-mesure — [luna-conciergerie.com](https://luna-conciergerie.com)

## 🏗 Architecture

```
app/
├── api/
│   ├── v1/            Public API (contacts, trips, quotes, invoices, webhooks)
│   ├── crm/           Internal CRM APIs (37 endpoints)
│   ├── health/        Health check monitoring
│   └── cron/          Scheduled jobs
├── crm/               Dashboard, clients, suppliers, planning, invoices, devis...
├── site-admin/        Admin tenants, templates, site config
├── api-docs/          Interactive API documentation
└── pricing/           Plans & tarification
src/
├── lib/
│   ├── firebase/      Admin SDK, auth, CRM functions
│   ├── rbac.ts        Role-Based Access Control (18 permissions)
│   ├── validation.ts  Data validation (5 entity types)
│   ├── duplicateDetection.ts  Fuzzy matching contacts/suppliers
│   ├── analytics.ts   Event tracking (22 events)
│   ├── logger.ts      Structured JSON logging
│   ├── rateLimit.ts   API rate limiting
│   ├── activityLogger.ts  Activity audit trail
│   └── email/templates.ts  8 branded email templates
├── hooks/             useTranslation, useTenant, useAccess
└── components/        CRM UI components, design system
```

## 🚀 Setup

```bash
cp .env.example .env.local    # Fill Firebase + Stripe keys
npm install --legacy-peer-deps
npm run dev                    # http://localhost:3000
```

## 📡 Public API v1

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/contacts` | Manage contacts |
| GET/POST | `/api/v1/trips` | Manage trips |
| GET/POST | `/api/v1/quotes` | Manage quotes |
| GET/POST | `/api/v1/invoices` | Manage invoices |
| GET/POST/DELETE | `/api/v1/webhooks` | Manage webhooks |

Auth: `X-API-Key: lk_xxx` header.

## 📊 Internal CRM APIs (37 endpoints)

### Dashboard & Analytics
| Endpoint | Description |
|---|---|
| `GET /api/crm/dashboard` | All-in-one KPIs, activity, reminders, alerts |
| `GET /api/crm/report` | Monthly/quarterly/yearly report with trends |
| `GET /api/crm/forecast` | Revenue forecast (confirmed + pipeline) |
| `GET /api/crm/compare` | Period vs period comparison |
| `GET /api/crm/usage-stats` | Feature adoption metrics |
| `GET /api/crm/api-usage` | API key usage stats |

### Data Management
| Endpoint | Description |
|---|---|
| `GET /api/crm/export` | CSV export (contacts, trips, invoices, quotes) |
| `POST /api/crm/batch` | Bulk delete/update/tag (max 100) |
| `POST /api/crm/import-contacts` | CSV import (max 500, dedupe) |
| `POST /api/crm/clone-trip` | Deep copy (trip + days + bookings) |
| `POST /api/crm/merge-contacts` | Merge duplicates + update references |
| `GET /api/crm/duplicates` | Detect potential duplicates |

### Search & Filtering
| Endpoint | Description |
|---|---|
| `GET /api/crm/search` | Cross-entity search with type filter |
| `GET /api/crm/segments` | 6 dynamic contact segments |

### Suppliers
| Endpoint | Description |
|---|---|
| `GET /api/crm/supplier-score` | Performance scoring (0-100, 4 tiers) |
| `GET /api/crm/supplier-availability` | Date availability check |

### Client Experience
| Endpoint | Description |
|---|---|
| `GET/POST /api/crm/feedback` | NPS satisfaction surveys |
| `GET /api/crm/client-timeline` | Full chronological history |
| `GET/POST/DELETE /api/crm/reminders` | Scheduled reminders with priority |
| `GET /api/crm/calendar` | Unified calendar (trips, reminders, due dates) |
| `GET/POST/DELETE /api/crm/notes` | Notes attached to any entity |

### Financial
| Endpoint | Description |
|---|---|
| `GET /api/crm/profitability` | Trip margin analysis |

### Team & Config
| Endpoint | Description |
|---|---|
| `GET/POST/DELETE /api/crm/team` | Team management (Admin+ invite/remove) |
| `GET/PUT /api/crm/tenant-settings` | Agency configuration |
| `GET/PUT /api/crm/notification-prefs` | User notification preferences |
| `GET/POST/PUT/DELETE /api/crm/email-templates` | Custom email templates |
| `GET /api/crm/onboarding` | Setup checklist (7 steps) |
| `GET /api/crm/documents` | Uploaded files by entity |

### Monitoring
| Endpoint | Description |
|---|---|
| `GET /api/crm/audit-log` | Filterable activity log |
| `GET /api/crm/activity-feed` | Recent actions feed |
| `GET /api/health` | App + DB health check |

## 🛡 Security

- **Auth**: Firebase Auth + API keys (`lk_xxx`)
- **RBAC**: 4 roles × 18 permissions
- **Firestore Rules**: Deployed, role-based, tenant-isolated
- **CORS**: Public API only, configurable origins
- **Headers**: HSTS, X-Frame-Options, nosniff, Referrer-Policy
- **Webhooks**: HMAC-SHA256 signed payloads
- **Rate Limiting**: Per IP, configurable per endpoint
- **Validation**: Server-side, 5 entity types, French error messages

## 🧪 Testing

```bash
npm test              # 55+ Vitest unit tests
npm run test:watch    # Watch mode
```

Covered modules: `validation.ts`, `rbac.ts`, `logger.ts`, `analytics.ts`

## 📜 Scripts

```bash
TENANT_ID=xxx npx ts-node scripts/seed.ts      # Seed demo data
npx ts-node scripts/backup.ts                   # Backup all tenants
API_KEY=lk_xxx npx ts-node scripts/test-api.ts  # E2E API tests
```

## 🔄 CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
1. Install → Test → Build → Deploy Firestore rules (on main)

## 📋 Features

| Feature | Status |
|---|---|
| Multi-tenant CRM | ✅ |
| Pipeline Kanban | ✅ |
| PDF Quotes & Invoices | ✅ |
| Client Portal | ✅ |
| Site Builder (4 templates) | ✅ |
| Email Templates (8 types) | ✅ |
| Webhooks (9 events) | ✅ |
| ⌘K Global Search | ✅ |
| PWA | ✅ |
| Stripe Payments | ✅ |
| AI Trip Suggestions | ✅ |
| Supplier Scoring | ✅ |
| Revenue Forecasting | ✅ |
| NPS Feedback | ✅ |
| Contact Segmentation | ✅ |
