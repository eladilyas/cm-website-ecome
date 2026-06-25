# Production roadmap

This document tracks the multi-week workstreams from the production
brief that haven't fully landed yet. Each one is scoped enough to be
picked up by a dedicated session.

## 1. Security hardening — STATUS

**Shipped:**
- ✅ Auth gating via Better-Auth + middleware + server guards (`requireAdmin`/`requireSuperAdmin`/`requireRole`) + policy layer in `src/server/policy/`.
- ✅ Rate limiting on `/api/orders`, `/api/financing`, `/api/orders/[ref]/proof` via `src/server/rate-limit.ts` (sliding window, per-IP, multi-instance swap point documented).
- ✅ Input validation length + array caps on order/financing creation (slug ≤80, name ≤160, qty ≤9999, unitPrice ≤1M, items ≤100, money ≤10M).
- ✅ Per-request nonce-based CSP via `src/middleware.ts` (no more `unsafe-inline` on script-src; `strict-dynamic` keeps transitively-loaded scripts working).
- ✅ Production HTTP headers in `next.config.ts`: X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy locking sensors+payment+geo, HSTS 1y+includeSubDomains+preload, X-DNS-Prefetch-Control off.
- ✅ Audit-event coverage across privileged actions (user toggle, product status/disable, category toggle, payment-method save, order/financing transitions) via `src/server/audit/log.ts`.

**Still outstanding:**
- **CSRF on POST handlers** — Server Actions inherit Next 16's `Origin` check. API routes (`/api/orders`, `/api/financing`, `/api/orders/[ref]/proof`) rely on the Better-Auth session cookie being SameSite=Lax. Adding an explicit Origin/Referer check at the top of each handler would belt-and-braces the same-site policy.
- **Secret rotation** — R2 access key, Resend key, Better-Auth secret, Neon URLs that were pasted in chat. Rotate before public launch.
- **`scripts/drop-source-url.sql`** — still pending production run.
- **Audit log retention/redaction policy** — `AuditEvent` rows accrue. Decide on a retention window (90 days? 1 year?) and what to redact when GDPR delete requests come in.

## 2. Odoo bi-directional sync — DESIGN

The brief asked for a spec before implementation. Here it is.

### Authentication

Use Odoo's `xmlrpc/2` API with an **API key** stored in
`ODOO_API_KEY` env var (per-environment). Database/user pair stored in
`ODOO_DB` + `ODOO_USER`. Authenticate once per request via the common
endpoint, then call object methods on the model endpoint.

### Endpoints (4 sync flows)

| Flow | Direction | Trigger |
|---|---|---|
| Products | Odoo → Website | Cron every 15 min + on-demand admin button |
| Stock | Odoo → Website | Cron every 5 min |
| Orders | Website → Odoo | Real-time on order `paymentReceivedAt` |
| Leads | Website → Odoo | Real-time on lead creation |

### JSON contracts

```ts
// Product (Odoo → Website, upsert by external_id)
type OdooProduct = {
  externalId: string;       // Odoo product.product id
  sku: string;
  name: string;
  description: string;      // HTML allowed
  category: string;         // matches our CatalogCategory slug
  priceMinor: number;       // MAD centimes, HT
  available: boolean;
  defaultImage?: string;    // URL or Base64
};

// Stock (Odoo → Website, per-SKU update)
type OdooStockUpdate = {
  sku: string;
  onHand: number;
  available: number;        // on-hand minus reservations
  asOf: string;             // ISO timestamp
};

// Order (Website → Odoo)
type WebsiteOrder = {
  ref: string;              // our ORD-... code, becomes Odoo external_id
  status: "paid";           // only paid orders push
  customer: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    ice?: string;
  };
  shipping: {
    street: string; city: string; postalCode: string; country: "MA";
  };
  items: Array<{ sku: string; qty: number; unitPriceMinor: number }>;
  totals: {
    subtotalMinor: number; vatMinor: number; grandTotalMinor: number;
  };
  paidAt: string;           // ISO
  paymentMethod: "cmi" | "wafasalaf" | "wire-transfer";
};

// Lead (Website → Odoo, becomes Odoo CRM lead)
type WebsiteLead = {
  source: "unpaid-order" | "financing-request" | "free-trial";
  ref: string;              // ORD- or FIN- or TRIAL-
  contact: { fullName, email, phone, company, ice? };
  capturedAt: string;       // ISO
  notes: string;            // human summary
};
```

### Sync strategy

- **Real-time push (orders, leads).** On the relevant event, enqueue
  a job in `IntegrationSyncLog` with `status="pending"` and let a
  worker (cron-fired) pick it up. Keep the write-to-Odoo OUT of the
  user-facing request to avoid coupling checkout latency to Odoo.
- **Scheduled pull (products, stock).** Cron job hits Odoo, upserts
  Postgres, bumps catalog cache via `revalidateTag("catalog")`.
- **Retry mechanism.** `IntegrationSyncLog` carries `attempts` and
  `nextAttemptAt`. Exponential backoff: 1 min, 5 min, 30 min, 2 h,
  give up at 6 attempts.
- **Conflict resolution.** Odoo is source of truth for product +
  stock data; website is source of truth for orders + leads. No
  bidirectional editing of the same field. Stock writes that arrive
  out of order (older `asOf` than the latest stored value) are
  dropped.

### Reliability

- `IntegrationSyncLog` already exists in the schema — extend it with
  `externalId`, `payload`, `responseSnippet` for debugging.
- Every successful sync writes an `AuditEvent` row.
- A `/admin/integrations/odoo` page surfaces the last 100 sync
  attempts, success/failure counts in the last 24h, and a manual
  "retry now" button per failed row.

### Estimated implementation

3 sessions: (1) wire auth + product pull, (2) wire stock pull + order
push, (3) wire lead push + ops dashboard.

## 3. Multilingual (FR / EN)

**Approach.** Use Next 16's native i18n routing with `[lang]` segment
under a route group `(localized)` — `/fr/shop`, `/en/shop`. Default
locale `fr-MA`, fallback `en`. Server components read `params.lang`;
client components read a `LocaleProvider` context.

**Phases:**

1. Move every marketing route under `/(localized)/[lang]/...`. Update
   `next.config.ts` redirects so root `/` → `/fr`.
2. Extract every user-facing string into `messages/{lang}/...json`
   bundles. Use `next-intl` or `react-aria/i18n` for ICU MessageFormat
   support (plurals, number formats).
3. Translate fr-MA bundles. en-MA = current English copy.
4. Add a language switcher (chip in header next to the cart).
5. Persist locale to a `lang` cookie so the homepage redirect honors
   the visitor's previous choice.

**Estimated implementation:** 2-3 sessions for full coverage (most of
the work is translation, not code).

## 4. Media optimization

**Currently.** All hardware images served via `next/image` with
`fill`/`sizes`. Next handles AVIF/WebP transcoding + responsive
breakpoints out of the box.

**Outstanding:**

- Tighten `sizes` props on every image — many are conservative and
  load too-large variants.
- Move hardware photos from `/public/hardware/` to R2 + a Next image
  loader, so the marketing site can scale without bundling images.
- Audit hero videos in `/public/header-video/` — the homepage `.mp4`
  is unoptimised. Re-encode at 1080p H.265 with reduced bitrate.
- Add `loading="lazy"` to all below-the-fold `<img>` tags (next/image
  already handles this).
- Set `Cache-Control: public, max-age=31536000, immutable` for hashed
  static assets via `next.config.ts` headers.

## 5. Mobile navigation upgrade

**Current state.** Header has a mobile menu (hamburger → full-screen
sheet). Admin shell has a hamburger drawer. Cart, account, and
checkout are touch-friendly. POS simulator is now lg+-only.

**Outstanding nice-to-haves:**

- Bottom tab bar on mobile storefront: Home / Shop / Cart / Account.
  Cart and Account already have icons in the header; promoting them
  to a thumb-reachable bottom strip would lift conversion on phones.
- Swipe-to-close on the mobile menu sheet (currently tap-X only).

## 6. Confirmation modal retrofit — coverage

`ConfirmDialog` is now wired into:
- /admin/users deactivation toggle
- /admin/payment-methods disable toggles

**Still to retrofit:**

- /admin/products status flip (active → disabled)
- /admin/categories deactivation
- /admin/users role removal
- Order status transitions in `/admin/orders/[ref]` (cancel, refund)
- Financing rejections in `/admin/financing/[ref]`

Pattern is straightforward: add `useState` for the confirming flag +
mount `<ConfirmDialog />` next to the destructive button.

## 7. SEO follow-ups

- Verify every page has a unique `<title>` + `<meta description>`.
  Most do; spot-check the localized routes when i18n lands.
- Build a dynamic Open-Graph image generator for product pages via
  Next's `opengraph-image.tsx` convention.
- Add structured-data JSON-LD for `Product` (per-detail page) and
  `Organization` (already in root).
- The sitemap.ts and robots.ts are already in place; once i18n lands,
  add `alternate` hreflang entries.
