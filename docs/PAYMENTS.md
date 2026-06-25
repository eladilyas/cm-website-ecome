# Payments

Four methods, three lifecycles. This doc covers the user flow, the server snapshot, and the trust boundary for each.

## Methods at a glance

| Method | UI label | Status today | Initial order status |
|---|---|---|---|
| `CMI` | CMI · Online card | **Stubbed** — no live merchant credentials, no signed callback | `AWAITING_PAYMENT` |
| `BANK_TRANSFER` | Bank transfer | Live (customer uploads payment proof) | `AWAITING_PAYMENT` |
| `CASH_ON_DELIVERY` | Cash on delivery | Live (cash collected at delivery) | `PROCESSING` |
| `WAFASALAF_FINANCING` | Wafasalaf financing | Live (admin reviews the file) | `PENDING_FINANCING_APPROVAL` |

`initialStatusForMethod()` in [src/server/orders/status.ts](../src/server/orders/status.ts) is the single switch. Changing what status a method lands in is a one-line change.

## Order data model

All four flows write a single `Order` row + N `OrderItem` rows + an initial `OrderStatusTransition`. Financing additionally populates `Order.financing*` columns. This unified model replaced an earlier `FinancingRequest` table; it still exists in the schema for historical migration purposes but nothing reads or writes to it.

```
Order
├─ ref                       human-readable identifier ("ORD-A4B7C9")
├─ customerId                Better-Auth User.id
├─ orderType                 STANDARD | FINANCING
├─ paymentMethod             enum above
├─ status                    OrderStatus enum (state machine)
├─ contactFullName/Email/Phone   snapshot at order time
├─ contactCompanyName/Ice        same
├─ shippingStreet/City/PostalCode/Country/Notes  same
├─ subtotalMinor / taxTotalMinor / shippingTotalMinor / grandTotalMinor
├─ paymentProofJson          { fileName, mimeType, sizeBytes, dataUrl, uploadedAt } | null
├─ trackingNumber            string | null
├─ internalNotes             string | null   (operators only; stripped at customer routes)
├─ financingStatus           FinancingStatus | null (only for orderType=FINANCING)
├─ financingAgeBracket       UNDER_60 | SIXTY_PLUS | null
├─ financing*Minor           server-recomputed Wafasalaf quote
├─ createdAt / updatedAt
└─ items[]                   OrderItem[] with productSlug, name, subline, qty,
                              unitPriceMinor, lineTotalMinor
```

Money values are stored as integer minor units (centimes). Display layers convert to whole MAD; never `Number` math on cents during business logic.

## Trust boundary (critical)

**Inputs the server NEVER trusts from the wire:**

- `unitPrice` — re-looked up from `Product.priceFromMinor` by slug at write time via [`resolveOrderableProducts()`](../src/server/catalog/orderable.ts). Out-of-stock and disabled products are rejected.
- `name` + `subline` — same lookup.
- `initialStatus` — removed from the public schema. The server derives status from `paymentMethod` via `initialStatusForMethod()`.
- `customerId` — overridden with `session.user.id`. The body field is required by the service but the API route always omits it from client input before forwarding.
- `applicantUserId` (financing) — same pattern.
- Financing **quote totals** (`monthly`, `firstMonthly`, `fileFee`, `totalCost`) — recomputed server-side via `computeClassique(grandTotal, termMonths, ageBracket)` from [src/lib/wafasalaf.ts](../src/lib/wafasalaf.ts).

**What the client CAN influence:**

- The set of `{slug, qty}` items in the cart.
- The `paymentMethod` (server validates it's a known enum and that the path matches; see flow notes below).
- Contact / company / shipping fields (free-form text the customer enters about themselves).
- `termMonths` (financing only — must be a Wafasalaf-supported value).
- `ageBracket` (financing only — affects insurance rate).

Any deviation from these rules is a security regression — log a follow-up.

## Flow: CMI (stubbed)

```
Customer fills /checkout form → picks CMI
POST /api/orders { paymentMethod: "CMI", contact, company, shipping, items: [{slug, qty}] }
  ↓
Server:
  1. Resolve items via resolveOrderableProducts() → authoritative unit prices.
  2. Recompute subtotal / VAT / total from server-side prices.
  3. Status = initialStatusForMethod("CMI") = AWAITING_PAYMENT.
  4. db.order.create({ items, transitions: [PENDING → AWAITING_PAYMENT] }).
  5. Return the saved order.
  ↓
Customer is shown a 1.5s "Redirecting to CMI…" overlay (purely UI).
  ↓
Customer lands on /checkout/success.
```

**Pending real CMI integration:** once live, a signed CMI postback at a new `/api/payments/cmi/callback` route would verify the payment then `transitionOrderStatus(orderRef, "PROCESSING")`. Until then, the order sits in `AWAITING_PAYMENT` and a staff member manually advances it.

## Flow: Bank transfer

```
Customer fills /checkout form → picks Bank transfer
POST /api/orders { paymentMethod: "BANK_TRANSFER", ... }
  ↓
Status = AWAITING_PAYMENT.
  ↓
Customer lands on /checkout/success which surfaces the bank details + IBAN + a
proof upload control.
  ↓
Customer uploads the bank slip:
  POST /api/orders/[ref]/proof { dataUrl, mimeType, fileName, sizeBytes }
  ↓
Server snapshots the proof on Order.paymentProofJson.
  ↓
Admin reviews the proof at /admin/(panel)/orders/[ref], then transitions:
  AWAITING_PAYMENT → PAYMENT_VERIFICATION → PROCESSING.
```

Today the proof is stored as a base64 `dataUrl` directly on the JSON column. Migration to R2 is tracked as a follow-up — the schema already accommodates it (`fileName`, `mimeType`, `sizeBytes` are all in place; only `dataUrl` would become a key/URL).

## Flow: Cash on delivery

```
Customer fills /checkout form → picks COD
POST /api/orders { paymentMethod: "CASH_ON_DELIVERY", ... }
  ↓
Status = PROCESSING (cash collected at delivery; nothing to verify pre-shipment).
  ↓
Dispatcher fulfils the order; collects cash on handoff.
```

No proof upload. No webhook. Anti-fraud is handled out of band (admin can verify by phone before advancing).

## Flow: Wafasalaf financing

```
Customer fills /checkout form → picks Wafasalaf
Client computes an indicative monthly via computeClassique() (for the panel display).
POST /api/financing {
  ageBracket: "UNDER_60" | "SIXTY_PLUS",
  contact, company, shipping,
  items: [{slug, qty}],
  termMonths: 24
}
  ↓
Server:
  1. Resolve items → authoritative prices.
  2. Recompute subtotal / VAT / total.
  3. Recompute Wafasalaf quote via computeClassique(grandTotal, 24, ageBracket).
     If the term isn't in the tariff, the request is rejected.
  4. db.order.create({
       orderType: "FINANCING",
       status: "PENDING_FINANCING_APPROVAL",
       financingStatus: "SUBMITTED",
       financingMonthlyPaymentMinor, firstMonthly, fileFee, totalCost (server-computed),
     });
  ↓
Pre-sales reviews the file at /admin/(panel)/financing/[ref]:
  • Approve → financingStatus=APPROVED, order.status cascades to PROCESSING.
  • Reject  → financingStatus=REJECTED, order.status cascades to FINANCING_REJECTED.
  ↓
On approval, the order joins the dispatcher queue like any other PROCESSING order.
```

The `computeClassique` calculator is a direct port of the Wafasalaf Excel tariff (CLASSIQUE_FACTORS table). Supported terms today: see [src/lib/wafasalaf.ts](../src/lib/wafasalaf.ts). The customer-facing flow only exposes 24 months.

## State machines

Order status transitions are constrained by `TRANSITIONS` in [src/server/orders/status.ts](../src/server/orders/status.ts). Anything not listed throws.

Financing status transitions are constrained by [src/server/financing/status.ts](../src/server/financing/status.ts). Both are enforced server-side; the UI only offers buttons for legal next states.

## What's missing / known gaps

- **Real CMI integration** — credentials + signed callback handler. See trust boundary above.
- **Payment proof to R2** — flagged in [src/server/orders/service.ts](../src/server/orders/service.ts) as TODO.
- **Order status notification emails** — Resend is wired but per-transition emails aren't.
- **Wafasalaf "Gratuit" (0% interest)** — calculator exists in [src/lib/wafasalaf.ts](../src/lib/wafasalaf.ts) but isn't exposed at checkout.

Track these as follow-ups in [ROADMAP.md](ROADMAP.md).
