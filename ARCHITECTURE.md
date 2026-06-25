# Caisse Manager — Backend Architecture

> [!WARNING]
> **This document is aspirational, not current.** It describes a planned
> architecture (tRPC + Trigger.dev + Axiom + service registry under
> `src/services/impl/{demo,platform,odoo}/`) that did not ship as
> described. The shipped implementation uses REST under `/api/*`, direct
> Prisma access in `src/server/*`, and a different RBAC catalog.
>
> Use this file as **design history / future direction**. For the
> as-shipped reference:
> - Stack + rationale → [docs/DECISIONS.md](docs/DECISIONS.md)
> - Auth flows → [docs/AUTH.md](docs/AUTH.md)
> - RBAC → [docs/RBAC.md](docs/RBAC.md)
> - Catalog → [docs/CATALOG.md](docs/CATALOG.md)
> - Payments → [docs/PAYMENTS.md](docs/PAYMENTS.md)
> - i18n → [docs/I18N.md](docs/I18N.md)
> - Deployment → [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

**Version 2.0 — Foundation Design (post-validation)**

This is the canonical reference for the platform's backend architecture.
Read this before touching server-side code.

**What v2 adds over v1.** Four new bounded contexts (Notifications,
AI Assistant, Customer Success, Content), a detailed three-bucket Odoo
ownership matrix, all 10 open decisions closed, API strategy locked in
(hybrid tRPC + REST), and the admin + customer portal information
architecture fully spec'd.

The principle underlying every decision remains:

> **The architecture survives Odoo's arrival.** No commitment that would
> force a rewrite when product + inventory ownership shifts to Odoo.

---

## 1. Guiding principles

| # | Principle |
|---|---|
| 1 | **API-first.** Every domain ships a service contract. UI is one consumer; mobile, AI assistant, Odoo bridge, and the admin portal all consume the same contracts. |
| 2 | **Service interfaces, not direct database access.** UI imports contracts; implementations are swappable. |
| 3 | **Data ownership shifts over time** — and the architecture treats this as the default case. |
| 4 | **No business logic in UI components.** Components call services; services own validation, transitions, side effects. |
| 5 | **Status transitions are explicit and auditable.** Every state change goes through a typed transition function that emits an `AuditEvent`. |
| 6 | **Permissions are policies, not switches.** RBAC reads from a policy table; no `if (user.role === "admin")` scattered through the code. |
| 7 | **Server-rendering is the default for indexable content.** Client components are reserved for genuinely interactive surfaces. |
| 8 | **Migrations are forward-only.** Schema changes ship with explicit up scripts; rollback by forward-migrating to a fixing version. |
| 9 | **Mobile-equivalent by construction.** No service contract makes assumptions that would only work in a browser (no `window`, no DOM, no cookies-only auth). Sessions are token-addressable. |
| 10 | **Notifications fan out, they don't depend.** Domain code emits events; the Notifications service decides what channels fire. Orders don't call SendGrid. |

---

## 2. Bounded contexts — the full domain map

The platform is split into **12 bounded contexts**. Each owns its data,
its state machine, its API surface, and its audit trail.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              IDENTITY                                    │
│  Users · Sessions · Roles · Permissions                                  │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ├──► CATALOG          Products · Categories · Media · Pricing
       │
       ├──► INVENTORY        StockLevels · Movements · Reorder thresholds
       │
       ├──► COMMERCE         Cart · Orders · OrderItems · Payments
       │
       ├──► FINANCING        FinancingRequests · Documents · Decisions
       │
       ├──► CUSTOMER-SUCCESS Tickets · ConversationThreads · Health signals
       │
       ├──► NOTIFICATIONS    Channels · Templates · Deliveries · Preferences
       │
       ├──► AI-ASSISTANT     Conversations · Messages · ToolCalls · Usage
       │
       ├──► CONTENT          Pages · Industries · Solutions · SEO metadata
       │
       ├──► FULFILMENT       Shipments · Tracking · Delivery confirmations
       │
       ├──► PLATFORM         FileStorage · AuditLog · Settings · FeatureFlags
       │
       └──► INTEGRATIONS     OdooClient · WafasalafClient · CMI · webhooks
```

**Cross-context references use IDs only — no foreign keys cross context
boundaries.** This decouples deployments and lets a context migrate to a
separate service if scale demands.

---

## 3. Odoo ownership matrix — three buckets, zero ambiguity

This is the most consequential table in the document. Every domain falls
into exactly one of three buckets that determine how it's implemented.

### Bucket A — **Platform-owned forever**

These domains never migrate. Odoo has no equivalent or no reason to own
them. Platform DB stays the source of truth permanently.

| Domain | Why Platform-only |
|---|---|
| **Identity** (Users, Sessions, Roles, Permissions) | Login + RBAC is platform-specific. Odoo has its own users for its own UI — they're not the same as our customers. |
| **Customer Success** (Tickets, Conversations) | Support is a customer-facing surface owned by the platform. Odoo Helpdesk module is a separate product not under consideration. |
| **AI Assistant** (Conversations, Messages, ToolCalls, Usage) | Pure platform feature — Odoo has no equivalent. AI calls platform services. |
| **Content** (CMS, marketing pages, industries copy) | Marketing site. Odoo doesn't manage marketing content. |
| **Notifications** | Channel orchestration, template management, customer preferences — platform owns the customer relationship and is the only system positioned to decide when/how/where to notify. |
| **Files** (uploads, signed URLs, audit) | The compliance-critical artifact lives on platform-controlled object storage. Odoo may consume files via signed URLs but never owns them. |
| **AuditLog** | Platform-wide trail across ALL domains. Odoo has its own audit; doesn't replace ours. |
| **Settings, FeatureFlags** | Platform configuration; not part of business operations. |

### Bucket B — **Shared ownership** (dual-write or designated authority per field)

These domains are co-owned. The architecture must support reconciliation
and conflict resolution. **The platform is the system of engagement; Odoo
is the system of record for fulfilment-critical state.**

| Domain | Platform-authoritative fields | Odoo-authoritative fields | Sync direction |
|---|---|---|---|
| **Commerce / Orders** | `id`, `ref`, `customerId`, `contact`, `shipping`, `paymentMethod`, `notes`, lifecycle through `processing` | `confirmed`, `shipped`, `delivered` timestamps; warehouse allocations; fulfilment status | Platform pushes order to Odoo when status enters `sent-to-odoo`. Odoo pushes fulfilment updates back via webhook. |
| **Customers** (as Odoo Contacts) | `email`, `phone`, `address`, `companyName`, `companyIce` | Odoo internal contact id, accounting links | Platform creates customer on Odoo when first order ships. Odoo's contact id stored on `User.odooContactId`. |
| **Payments** | `method`, `status`, `customerProof` (wire-transfer screenshots) | Reconciliation status, accounting entry id | Platform → Odoo push; Odoo flips reconciliation status back |
| **Financing** | The application lifecycle (Draft → Approved → Active → Paid-off) is platform-owned because customer interacts with platform | Once approved + invoiced, Odoo records the invoice + payment schedule | Platform pushes approved financing as a deferred-payment order |

**Rule for Bucket B**: every field has exactly ONE writer. The contract
documents which side writes which field. Race conditions are eliminated
by ownership, not by locks.

### Bucket C — **Odoo-owned future** (read-through on platform after cutover)

These domains migrate to Odoo as soon as ERP integration ships. Platform
becomes a read consumer.

| Domain | Today | After Odoo cutover |
|---|---|---|
| **Products** (catalog metadata, media, descriptions) | Platform DB (writeable by admins) | Odoo writes; platform reads via `OdooProductService` |
| **Inventory** (stock levels, movements) | Platform DB | Odoo writes; platform reads (and shows live stock on `/shop`) |
| **Pricing** (list prices, costs, discounts) | Platform DB | Odoo writes; platform reads. Per-customer pricing eventually possible. |
| **Stock status** (in-stock / incoming / out-of-stock) | Static field on Product | Computed live from Odoo `qty_available` + incoming PO data |
| **Suppliers** | Not yet modeled | Odoo Vendors module |
| **Purchase Orders, Receiving, Transfers** | Not yet modeled | Odoo Purchase + Inventory modules |
| **Accounting** (invoices, payments, ledgers) | Not yet modeled | Odoo Accounting; never re-implemented on platform |

**Rule for Bucket C**: UI imports `ProductService`, `InventoryService`,
`PricingService` from the contracts. The implementation moves from
`impl/platform/` to `impl/odoo/`. UI does not change.

### What this means for code

```typescript
// ✅ Always — UI imports the contract.
import { useProductService } from "@/services";

// ❌ Never in UI code — direct catalog imports break the Odoo migration.
import { CATALOG } from "@/data/catalog";

// ❌ Never in UI code — direct ORM imports.
import { db } from "@/server/db";
```

---

## 4. Closed decisions (final stack)

All 10 open decisions from v1 are now resolved. Implementation can start
against these choices.

| Decision | Choice | Why |
|---|---|---|
| **PostgreSQL provider** | **Neon** | Serverless Postgres with auto-pause + branch databases. Branching is the killer feature: every PR gets a real DB clone. Generous free tier; predictable pricing. |
| **ORM** | **Prisma** | More mature, better tooling (Studio), broader hiring pool, edge runtime via Prisma Accelerate. Drizzle is excellent but Prisma's familiarity wins for a team scaling up. |
| **Auth** | **Better-Auth** | Modern, framework-agnostic, first-class email + magic-link + social, no per-user pricing, owns its data (lives in our Postgres). Avoids Clerk's lock-in and cost ramp. NextAuth v5 (Auth.js) considered; Better-Auth has cleaner DX and better docs. |
| **Object storage** | **Cloudflare R2** | S3-compatible, zero egress fees, generous free tier, EU-resident buckets satisfy Moroccan data-residency expectations. AWS S3 considered; R2 is materially cheaper at scale. |
| **Background jobs / queues** | **Trigger.dev v3** | Code-as-config jobs, durable, observable, no infrastructure (managed). BullMQ + Upstash Redis considered; Trigger.dev eliminates the queue server entirely. |
| **Email** | **Resend** | Cleanest DX, React Email templates, generous free tier, EU region available. Postmark considered; Resend has better React integration. |
| **Logging** | **Axiom** | Structured ingestion, fast queries, generous free tier, fits Next.js naturally. Datadog considered; cost prohibitive at startup scale. |
| **Monitoring** | **Sentry** | Errors + performance + replay. Free tier covers early traffic. |
| **Test framework** | **Vitest** (unit) + **Playwright** (e2e) | Vitest matches Next.js + TS conventions; Playwright covers cross-browser e2e. |
| **CI/CD** | **GitHub Actions → Vercel** | Lint + typecheck + unit on every PR; deploy previews via Vercel; main branch deploys to production. Neon branch DBs spin up per PR. |

### Stack summary

```
Frontend         Next.js 16 App Router (already shipped)
Database         Neon Postgres
ORM              Prisma
Auth             Better-Auth
Storage          Cloudflare R2
Email            Resend
Queue / jobs     Trigger.dev v3
Logging          Axiom
Monitoring       Sentry
Test             Vitest + Playwright
CI/CD            GitHub Actions + Vercel + Neon branching
```

---

## 5. API strategy — hybrid tRPC + REST

REST vs. tRPC has been validated against six consumer profiles. The
conclusion: **hybrid, with a clear divide based on caller proximity**.

| Consumer | Protocol | Reason |
|---|---|---|
| **Next.js app** (UI ↔ services) | **tRPC** | End-to-end type safety. No code-gen step. Zero serialization concerns. The 2025 default for Next.js + TS apps. |
| **Admin portal** (UI ↔ services) | **tRPC** | Same codebase, same type benefits. Server-only procedures gated by RBAC middleware. |
| **Customer portal** (UI ↔ services) | **tRPC** | Same. |
| **Future mobile app** (React Native) | **tRPC over HTTP** | RN can consume tRPC directly through `@trpc/client`. If we go native iOS/Android later, those will consume REST instead. |
| **AI assistant** (function calling from Claude/GPT) | **REST** (OpenAPI-described) | Tool-calling LLMs work best with explicit OpenAPI schemas. Generated from the same Zod schemas tRPC uses, so no duplication. |
| **Odoo bridge** | **REST** (webhook callbacks + REST polls) | Odoo speaks XML-RPC + REST. REST is the lingua franca; webhook payloads are JSON. |
| **Public webhooks** (CMI payment confirmations, Wafasalaf updates) | **REST** | External partners require stable REST endpoints. |

### Implementation pattern

```
src/server/
├── trpc/
│   ├── routers/
│   │   ├── products.ts        ← tRPC router
│   │   ├── orders.ts
│   │   └── […]
│   ├── procedures.ts          ← public / protected / admin procedure helpers
│   └── root.ts                ← appRouter export
│
├── rest/                      ← API routes for external consumers
│   ├── webhooks/
│   │   ├── cmi/route.ts
│   │   └── odoo/route.ts
│   └── public/
│       ├── products/route.ts  ← OpenAPI-described, for AI + Odoo
│       └── orders/route.ts
│
└── openapi.ts                 ← single source of OpenAPI doc generation
```

**Both surfaces (tRPC + REST) call into the SAME service contracts** in
`src/services/`. There's no business logic duplicated between the two
protocols — they're transport adapters over the service layer.

### Why not REST-only?

- Lose type safety across the most-trafficked boundary (UI ↔ services)
- Manual fetch wrappers proliferate
- Easy to forget input validation on edges

### Why not tRPC-only?

- AI assistants and Odoo need OpenAPI-shaped REST
- Public partner webhooks need stable REST URLs
- Forcing a non-tRPC consumer to use a tRPC client creates lock-in

Hybrid is the standard 2025 SaaS pattern; it's not a compromise, it's the
correct answer.

---

## 6. New bounded contexts (the four v2 additions)

### 6a. Customer Success

**Why it's a bounded context.** Support requests, conversation threads,
and customer health signals are a distinct concern from orders/financing.
Embedding "support state" into Order would couple two lifecycles that
diverge in operations and ownership.

**Scope.**

| Concept | Description |
|---|---|
| `Ticket` | A customer support request. Has a subject, body, status, priority, assigned agent, related order/financing, attached files. |
| `ConversationThread` | Multi-turn back-and-forth on a ticket. Each `Message` is an entry. |
| `CustomerHealth` | Computed signal per customer — last activity, NPS-style score, open ticket count. Aggregates across other contexts. |

**Status machine for Ticket:** `open → in-progress → waiting-on-customer →
resolved → closed` (with `reopened` branching back).

**Surfaces it powers.** Customer portal "Help" tab; admin portal Support
queue; AI Assistant's customer-context awareness; analytics dashboards.

### 6b. Notifications

**Why it's a bounded context.** Cross-cutting concern. Every other domain
needs to notify the customer at some point (order shipped, financing
approved, ticket replied to). If Orders depended on `EmailService`, the
coupling would be everywhere. Instead, domains emit a `DomainEvent` and
the Notifications service decides which channels fire.

**Scope.**

| Concept | Description |
|---|---|
| `NotificationTemplate` | Versioned content per channel (email subject + body, SMS text, in-app payload). Manages translations (FR/AR/EN). |
| `NotificationDelivery` | A specific send attempt — recipient, channel, template version, status, retries, opens/clicks. |
| `NotificationPreference` | Per-customer opt-in matrix: which event types fire on which channels. Customer-editable in the portal. |
| `ChannelAdapter` | Resend (email), Twilio (SMS), WhatsApp Business API (whatsapp), in-app banner, push. Plug-in shape. |

**Pattern.** Other services call `notifications.notify({ recipient,
event, payload })`. The service consults templates + preferences and
fans out across channels. Failure on one channel doesn't block the
others.

**Why this matters for Odoo.** When orders move to "sent-to-odoo" state,
Odoo doesn't email the customer — the platform does. Decoupling
notifications from order writing means the Odoo bridge never gets
entangled with email logic.

### 6c. AI Assistant

**Why it's a bounded context.** The AI surface owns conversations,
context windows, tool-call ledgers, and token accounting. Embedding "AI
state" inside Customer Success or Notifications would conflate three
different lifecycle models.

**Scope.**

| Concept | Description |
|---|---|
| `Conversation` | A scoped AI session for a user. Has a `mode` (customer-support, ops-copilot, admin-analyst), the active model, system prompt revision id, owner. |
| `Message` | One turn in the conversation. `role` (user / assistant / system / tool), text, attached `ToolCall` refs. |
| `ToolCall` | A specific function-calling invocation: tool name, arguments, return value, latency, cost. Auditable. |
| `Usage` | Per-conversation / per-tenant token + cost accounting. Drives rate limiting + billing if monetised later. |
| `ToolRegistry` | The catalog of tools exposed to the assistant — `getOrder`, `searchProducts`, `getInventoryFor`, `createSupportTicket`. Tools are thin wrappers over service contracts. |

**Tool-calling design.** The assistant invokes tools exclusively through
the **same service contracts** UI uses. There's no "AI-only" backend. A
tool that returns a customer's recent orders calls `orderService.list({
customerId })`, gated by the SAME `can()` check that gates the UI. This
makes the AI assistant's authority identical to a user's authority by
construction — no privilege escalation surface.

**Future expansion.** When the assistant gains POS / inventory tools,
those tools wrap `InventoryService.getStockLevel()`, etc. The
post-Odoo-cutover `impl/odoo/InventoryService` immediately becomes the
assistant's data source — no AI code changes needed.

### 6d. Content (CMS)

**Why it's a bounded context.** Today, marketing copy lives in `data/`
TypeScript files (industries, pricing, solutions). For the next 12-18
months that's correct — version control IS the CMS for engineer-edited
copy. But eventually we'll want non-engineers (Marketing, Product) to
edit certain surfaces.

**Scope (Phase 4 — not Phase 2).**

| Concept | Description |
|---|---|
| `ContentNode` | Editable content unit — addressable by surface key (`pricing.hero.title`, `industries.cafes.tagline`). Versioned. |
| `ContentRevision` | Each save creates a revision; rollback is a metadata operation. |
| `Locale` | `fr-MA`, `en`, `ar-MA` translations of the same node. |
| `Publication` | Draft vs. published state; preview pages render drafts. |

**Implementation strategy.**

- **Phase 2:** Don't build CMS. Marketing copy stays in `data/`. Service
  contract `ContentService` exists but is satisfied by a static-file
  implementation that reads from `data/`.
- **Phase 4:** When the need is concrete, swap `impl/static-content/`
  for `impl/db-content/` reading from Postgres + a lightweight admin
  editor. **No headless CMS service** (Contentful, Sanity, Strapi) — the
  business doesn't need that level until we're at 50+ pages.

This is the v1 doc's only architectural decision being **explicitly
deferred** — keeping it in the contracts so the migration is mechanical
later.

---

## 7. Authentication & RBAC (unchanged from v1, expanded role table)

### Identity model

```
User
├── id (uuid, primary)
├── email (unique)
├── emailVerifiedAt
├── passwordHash | nullable    ← magic-link users have no password
├── createdAt
├── updatedAt
├── lastLoginAt
├── odooContactId | nullable   ← link to Odoo when synced (Bucket B)
└── disabledAt | nullable      ← soft-disable, not delete

Session
├── id (uuid, primary)
├── userId (fk → User.id)
├── tokenHash                  ← hashed bearer token for mobile/API auth
├── expiresAt
├── userAgent
├── ipAddressHash              ← GDPR-conscious
└── revokedAt | nullable

UserRole (m:n)
├── userId (fk)
├── roleId (fk)
└── grantedAt
```

**Mobile / non-web auth.** The session model uses bearer tokens, not
cookies-only. The web uses cookie sessions for CSRF protection; mobile
and API consumers use the token in `Authorization: Bearer …`. Both
resolve through `getCurrentSession()` in the `AuthService` — same
interface, two transports.

### Role catalog (expanded from v1)

| Role slug | Primary surfaces | Notes |
|---|---|---|
| `customer` | Customer portal | Default for every signup. |
| `support` | Admin portal — Tickets, Customers (read-only) | Customer Success agents. |
| `sales` | Admin portal — Orders, Financing (approve up to threshold) | Frontline sales/onboarding. |
| `inventory-manager` | Admin portal — Products, Inventory | Pre-Odoo: full inventory authority. Post-Odoo: read-only mirror. |
| `finance-manager` | Admin portal — Financing, Payments | Approves any financing amount; reviews wire-transfer proofs. |
| `marketing` | Admin portal — Content (post-Phase 4), Settings → SEO | Edits CMS-managed surfaces. |
| `admin` | Everything | Operational lead. |
| `super-admin` | Everything + role assignment + integrations | One per organization. |

**Custom permissions per role** are stored in `RolePermission`. The
catalog above is the **default grant set**; super-admins can grant
permissions outside the default.

---

## 8. Notifications — pub-sub pattern

```
                                    Domain emits event
                                    {kind, recipientId, payload}
                                            │
                                            ▼
                              ┌───────────────────────┐
                              │  NotificationService   │
                              │  .notify(event)         │
                              └─────────┬─────────────┘
                                        │
                  ┌─────────────────────┼──────────────────────┐
                  │ Resolve template    │  Read user prefs     │
                  │ for event + locale  │  for event           │
                  └─────────┬───────────┴──────────┬───────────┘
                            │                       │
                            ▼                       ▼
                       For each channel the user has opted into…
                            │
                            ▼
                       ┌─────────────┐  ┌──────┐  ┌──────────┐
                       │ EmailAdapter│  │ SMS  │  │ WhatsApp │
                       │  (Resend)   │  │      │  │          │
                       └─────┬───────┘  └───┬──┘  └────┬─────┘
                             │              │           │
                       Trigger.dev queue (retry / backoff / dead-letter)
                             │              │           │
                             ▼              ▼           ▼
                       NotificationDelivery rows updated
                       (sent, failed, opened, clicked)
```

**Domain code never touches Resend.** `OrderService.transitionStatus`
calls `notifications.notify({ event: "order.shipped", recipientId, payload })`
and moves on. The Notifications service handles everything downstream.

---

## 9. Order + Financing state machines (unchanged from v1)

See v1 §9 and §10. Both state machines remain; the `transitionStatus`
method is still the only writer.

**New for v2:** every transition also calls `notifications.notify(…)` at
the appropriate point. Implementations of `OrderService` and
`FinancingService` MUST emit notification events on each state change.

---

## 10. Files (unchanged from v1)

See v1 §8. The `FileService` contract sits unchanged. R2 is now the
designated storage provider.

---

## 11. Audit (unchanged from v1)

See v1 §11. Append-only, JSON snapshots, 2-year retention online + cold
archive thereafter.

---

## 12. Administration portal — Information Architecture

The admin portal lives under `/admin/*` behind a `can()` gate per page.

### Top-level navigation

```
/admin
├── Overview                ← KPI summary: orders today, open tickets, pending financing
├── Orders                  ← list + filters + detail + status transitions
│   └── [id]                ← order detail; documents tab, timeline, internal notes
├── Financing               ← request list + filters + detail
│   └── [id]                ← documents, decision, internal notes
├── Customers               ← user search + detail (read-only profile + activity)
│   └── [id]                ← orders, tickets, financing, sessions, audit
├── Products                ← catalog CRUD (Bucket C — disabled when Odoo live)
│   └── [slug]              ← edit; status toggle; media; specs
├── Inventory               ← stock levels + movements (Bucket C — read-only when Odoo live)
├── Support                 ← ticket queue + filters + assignment
│   └── [id]                ← thread, files, status transitions
├── AI Assistant            ← conversation analytics, tool-call ledger, cost
├── Content                 ← CMS-editable surfaces (Phase 4+)
├── Audit                   ← global audit log search + filter + export
├── Notifications           ← template editor, delivery log, channel health
├── Integrations            ← Odoo connection status, Wafasalaf, CMI, webhook log
└── Settings                ← roles + permissions, feature flags, org settings
    ├── Users               ← invite, role grants
    ├── Roles               ← create/edit roles + permission matrix
    └── Org                 ← business info, branding, SEO defaults
```

### Per-page treatments

Every admin list page follows a consistent shape:

- **Filter bar** (status, date range, search, owner)
- **Stat strip** (count, totals, today-vs-yesterday delta)
- **Data table** (sortable columns, sticky header, click-row to detail)
- **Bulk actions** (status transitions, export, assign)
- **Pagination cursor** (server-side)

Every admin detail page:

- **Header card** (entity ID, status badge, primary actions)
- **Activity timeline** (audit events for this resource, newest first)
- **Tabbed body** (Details / Documents / Notes / History)
- **Right rail** (related entities, internal-only notes, danger zone)

### Why now

The IA is committed up-front so:

1. The admin nav doesn't grow ad-hoc (every new feature has a home)
2. RBAC permission slugs map cleanly to nav sections
3. The team can pre-allocate routes without bikeshedding later

---

## 13. Customer portal — Information Architecture

The customer portal lives under `/account/*`. Already partially shipped;
v2 codifies the full target.

### Top-level navigation

```
/account
├── Overview                ← welcome, recent orders, open financing, pinned ticket
├── Orders                  ← list + detail + timeline + invoice download
│   └── [ref]               ← order detail, status timeline, documents
├── Financing               ← application list + detail + documents
│   └── [ref]               ← application detail, decision letter, payment schedule
├── Invoices                ← list + download (PDF), backed by Odoo accounting post-cutover
├── Support                 ← my tickets, "Ask the team" CTA, AI Assistant entry point
│   └── [id]                ← thread, files, status
├── Documents               ← uploaded financing docs, wire receipts, signed contracts
├── AI Assistant            ← conversational interface; surfaces order/financing/support context
└── Profile                 ← personal info, company info, notification prefs, sessions, sign out
```

### Why this matters for service contracts

Every page on this list maps to a single contract method call:

| Page | Contract call |
|---|---|
| `/account` | `orderService.list({ customerId, limit: 3 })` + `financingService.list({ applicantUserId, limit: 3 })` + `ticketService.list({ ownerId, status: "open" })` |
| `/account/orders` | `orderService.list({ customerId })` |
| `/account/orders/[ref]` | `orderService.getByRef(ref)` + `orderService.listHistory(id)` + `fileService.listForResource("order", id)` |
| `/account/financing/[ref]` | `financingService.getByRef(ref)` + `financingService.listHistory(id)` + `fileService.listForResource("financing-request", id)` |
| `/account/support/[id]` | `ticketService.get(id)` + `ticketService.listMessages(id)` |
| `/account/assistant` | `aiService.getOrCreateConversation({ userId, mode: "customer-support" })` |

**This is the validation test for the service contracts.** If every
customer portal page can be expressed as 1–3 contract calls, the contracts
are right-sized.

---

## 14. Mobile compatibility

Every service contract has been validated against three mobile
constraints:

| Constraint | How the architecture satisfies it |
|---|---|
| **No browser-only assumptions** | Sessions are token-addressable (Bearer header). No `window`, `document`, or `localStorage` references in contracts. No cookies-only paths. |
| **Offline-first considerations** | All read methods return `Readonly<T>` so clients can cache freely. Writes are explicit POST-like calls — never assume optimistic update is safe. |
| **Push notifications** | The `Notifications` context already includes a `push` channel adapter slot. Mobile clients register a push token via `NotificationService.registerPushToken(userId, token)`. |

The future mobile app consumes the same tRPC client that the web uses
(`@trpc/client` works in React Native). REST endpoints exist for native
iOS/Android implementations if those ever ship.

**No service contract method is allowed to assume a Next.js execution
context.** PR review checks for this.

---

## 15. Folder layout — updated for v2

```
src/
├── app/                          # Next.js routes
│   ├── api/                      # REST endpoints (webhooks, public REST, AI tools)
│   ├── account/                  # customer portal (shipped)
│   ├── admin/                    # admin portal (Phase 2)
│   └── […]                       # marketing routes (shipped)
│
├── components/                   # UI components (shipped)
│
├── services/                     # service layer
│   ├── contracts/                # interfaces (Odoo-ready boundary)
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── inventory.ts
│   │   ├── orders.ts
│   │   ├── financing.ts
│   │   ├── files.ts
│   │   ├── audit.ts
│   │   ├── notifications.ts      ← NEW (v2)
│   │   ├── ai-assistant.ts       ← NEW (v2)
│   │   ├── customer-success.ts   ← NEW (v2)
│   │   └── content.ts            ← NEW (v2)
│   ├── impl/
│   │   ├── demo/                 # Zustand-wrapped (Phase 2 starts here)
│   │   ├── platform/             # Postgres/Better-Auth/R2-backed (Phase 2)
│   │   └── odoo/                 # Odoo proxy (Phase 3)
│   └── index.ts                  # registry — returns the right impl
│
├── lib/                          # pure utilities (shipped)
│
├── data/                         # mock data (catalog, pricing, industries — shipped)
│
└── server/                       # server-only code (Phase 2+)
    ├── trpc/
    │   ├── routers/
    │   ├── procedures.ts
    │   └── root.ts
    ├── rest/
    │   ├── webhooks/
    │   └── public/
    ├── db/                       # Prisma client + helpers
    ├── auth/                     # session, RBAC
    ├── odoo/                     # OdooClient
    ├── notifications/            # ChannelAdapters, Trigger.dev jobs
    ├── files/                    # R2 client, signed URL helpers
    ├── ai/                       # ToolRegistry, conversation engine
    ├── observability/            # Axiom + Sentry wiring
    └── jobs/                     # Trigger.dev job definitions

prisma/
├── schema.prisma
└── migrations/
```

---

## 16. Phased delivery roadmap (v2 — definitive)

| Phase | Scope | Result |
|---|---|---|
| **0 — shipped** | Frontend, marketing site, POS simulator (Zustand-only) | Public site live |
| **1 — shipped (this turn ladders)** | Architecture v2 + service contracts (10 domains) | Implementation can start |
| **2A** | Database + Auth + Files. Customer portal reads real data. | First-class user accounts. Order + financing flows persisted. |
| **2B** | Admin portal scaffold. Orders + Financing + Files admin pages. RBAC. | Internal operators replace mock-data workflows. |
| **2C** | Products + Inventory CRUD on platform. Customer Success tickets. | Pre-Odoo state: platform is single source of truth. |
| **3A** | Notifications fan-out wired across Orders + Financing + Tickets. | Resend email + transactional. |
| **3B** | AI Assistant MVP — customer-context aware, 3 tools (order lookup, financing status, support ticket creation). | Conversational customer-service surface. |
| **4A** | Odoo bridge for Products + Inventory + Pricing. Bucket C migration. | Catalog read-through to Odoo. |
| **4B** | Wafasalaf integration for live financing decisions. | Real financing approvals via partner API. |
| **5+** | CMS for marketing surfaces. Mobile app. POS-system integration. | Long-term roadmap. |

Each phase is **independently shippable + reversible** behind feature
flags. No "big bang."

---

## 17. Anti-patterns to refuse on PR review

1. **Direct database imports in components** (`import { db } from "@/server/db"` in any `components/*.tsx`)
2. **Hardcoded role checks** (`if (user.role === "admin")` — use `can()`)
3. **Status updates outside transition functions** (bypasses audit)
4. **Uploads to `public/`** (user content → R2)
5. **Inline secrets** (every API key reads from env validated by zod at boot)
6. **Domain code calling Resend/Twilio directly** (always via `notifications.notify`)
7. **AI tool implementations duplicating business logic** (always thin wrappers over service contracts)
8. **Browser-only assumptions in services** (no `window`, `document`, `localStorage`)
9. **"Temporary" exceptions in `data/`** (mock data must move into the contract layer before launch)
10. **Coupling AI conversations to Tickets** (AI is its own context; bridge via explicit `aiService.createSupportTicketFromConversation()`)

---

## 18. Three-five-year survivability check

The original brief asked for confidence on six dimensions. Here's the
answer per dimension:

| Concern | How v2 addresses it |
|---|---|
| **3–5 year growth** | 12 bounded contexts each independently scalable. Service contracts mean adding new transports (mobile, AI, partners) doesn't perturb the core. |
| **Odoo without rewrites** | Bucket A/B/C matrix is explicit. Bucket C domains migrate by swapping `impl/platform/` for `impl/odoo/` — UI unchanged. Bucket B has documented field-level ownership; no surprises. |
| **Mobile reuse** | Sessions are token-based, no cookies-only paths. tRPC works in RN. REST surfaces exist for native. Contracts have no browser assumptions. |
| **AI plug-in** | AI Assistant is its own context with `ToolRegistry` wrapping service contracts. Adding a tool = registering a wrapper, never a re-implementation. The AI cannot exceed user permissions because tools route through the same `can()` gates. |
| **Admin scaling** | IA is committed up-front (section 12). Every new admin feature has a designated nav home. RBAC permission slugs map 1:1 to IA sections. |
| **Customer portal scaling** | IA is committed up-front (section 13). Each page maps to 1–3 service calls. Adding new portal features = adding new IA branches + their service calls. |

**The architecture is ready.** Phase 2 implementation can begin.
