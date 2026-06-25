// Shared types for the POS demo system.
//
// The demo is "business-activity-tailored": same flows, different seed
// catalog and enabled order-types per activity. See WORKFLOW_DIFF.md §F.
//
// V2 schema (persist v4) extends V1 with optional fields for variants,
// modifiers, recipes, tax, suppliers, customers, staff, and split
// payments. Every new field is OPTIONAL so V1 catalogs render unchanged
// — populated values are layered on by per-activity seeds and consumed
// by Phase 2+ features.

export type ActivityKey =
  | "cafe"
  | "fast-food"
  | "dine-in"
  | "market"
  | "bakery"
  | "beauty"
  | "barber";

export type OrderType = "take-away" | "dine-in" | "glovo" | "done";

/** Payment methods supported by the demo. Moved from demoStore in V2 so
 *  the activityCapabilities table can declare `enabledPaymentMethods`
 *  without a circular dependency. demoStore re-exports for back-compat. */
export type PaymentMethod =
  | "cash"
  | "tpe-mobile"
  | "glovo"
  | "done"
  | "cmi"
  | "online"
  | "cash-on-delivery"
  | "card-on-delivery"
  | "yassir"
  | "gift-card"
  | "store-credit";

export type DemoCategory = {
  id: string;
  /** Display name. English-only for v1. */
  name: string;
};

/** A single step within a combo product's wizard. */
export type ComboStep = {
  id: string;
  /** "Choose a drink", "Choose a side", etc. */
  name: string;
  /** Validation rule for the step. */
  rule: "exactly-1" | "up-to-n";
  /** Max picks when rule is "up-to-n". */
  max?: number;
  options: { id: string; name: string; priceDelta?: number }[];
};

// ── Product variants & modifiers (V2 additive) ───────────────────────
// Variants are alternative SKUs of the same product (size S/M/L, hot/iced).
// Modifiers are toggleable add-ons (extra shot, no sugar, oat milk +5 MAD).

export type ProductVariant = {
  id: string;
  name: string;
  priceDelta: number;
  sku?: string;
};

export type Modifier = {
  id: string;
  name: string;
  priceDelta: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  /** "exactly-1" forces a single pick (size); "up-to-n" lets the cashier
   *  stack add-ons. */
  rule: "exactly-1" | "up-to-n";
  max?: number;
  modifiers: Modifier[];
};

/** Recipe component reference — a product made from other products
 *  (Phase 3 inventory deduction). Burger = bun (1) + patty (1) + lettuce
 *  (1). When a burger is sold, those component stock levels go down. */
export type RecipeComponent = {
  componentId: string;
  qty: number;
};

export type DemoProduct = {
  id: string;
  name: string;
  /** Base price in MAD (Moroccan dirham). */
  price: number;
  /** Which category this product belongs to. */
  categoryId: string;
  /** If present, this is a combo product and the cashier walks the steps. */
  comboSteps?: ComboStep[];
  /** For service-based businesses (Beauty / Barber) — booking duration
   *  in minutes. Drives appointment block sizes on the Calendar view.
   *  Retail items have no duration. */
  durationMin?: number;

  // ── V2 additive fields (all optional) ──────────────────────────────
  /** Stock keeping unit — generated when product is created via the
   *  Backoffice (Phase 3). Used for barcode lookup and inventory. */
  sku?: string;
  /** EAN-13 / UPC barcode string. Populated by seed for retail catalogs;
   *  generated for new products. */
  barcode?: string;
  /** Cost of goods — what the business paid per unit. Used by reporting
   *  (Phase 5) to compute margin. */
  cost?: number;
  /** Per-product tax-rate override. If absent, the activity's default
   *  taxRate applies. */
  taxRate?: number;
  /** Alternative SKUs of the same product (sizes, temperatures). */
  variants?: ProductVariant[];
  /** Toggleable add-ons grouped by rule (size pick, extras stack). */
  modifierGroups?: ModifierGroup[];
  /** Components consumed when this product is sold (Phase 3 inventory). */
  recipeComponents?: RecipeComponent[];
};

export type DemoActivity = {
  key: ActivityKey;
  name: string;
  tagline: string;
  /** Short pitch shown on the activity picker. */
  description: string;
  /** Which order-types appear in screen A4's right panel. */
  enabledOrderTypes: OrderType[];
  categories: DemoCategory[];
  products: DemoProduct[];
  /** When true, picking this activity skips the order-type + identifier
   *  pickers and lands the cashier directly in the workspace with a
   *  pre-created order using the first enabled order type. Use for fast
   *  counter-sale flows like Market where the ceremony is friction. */
  skipOrderTypePicker?: boolean;
};

/** An order-line in the active session's cart. */
export type OrderLine = {
  id: string;
  productId: string;
  qty: number;
  /** Combo selections made during the wizard, keyed by step id. */
  comboSelections?: Record<string, string[]>;
  /** Free-text note attached to the line. */
  comment?: string;
  /** Manager-authorized discount as a percentage. */
  discountPct?: number;
  /** Per-line urgency. Independent of the order-level urgent flag — a
   *  cashier can flag a single item (e.g. a hungry kid's soup) without
   *  marking the whole order priority. Lifted onto the corresponding
   *  KitchenTicket item at fire time; the KDS sorts urgent items to the
   *  top of the ticket and shows an inline ⚡ marker. */
  urgent?: boolean;

  // ── V2 additive fields ────────────────────────────────────────────
  /** Selected variant id (e.g. "size-large"). */
  variantId?: string;
  /** Picked modifiers (extra shot, no onions). */
  modifiers?: Modifier[];
  /** Staff member who rang or who performs the service. Set by the
   *  Backoffice's staff assigner (Phase 4). */
  staffId?: string;
};

/** A standalone fee or generic-product line added via the order-actions menu. */
export type OrderExtra = {
  id: string;
  kind: "fee" | "generic";
  label: string;
  amount: number;
};

export type OrderDiscount = {
  /** "pct" subtracts a percentage of the running subtotal.
   *  "fixed" subtracts a flat MAD amount. */
  kind: "pct" | "fixed";
  /** Percentage 0-100 (when kind="pct"), or MAD amount
   *  (when kind="fixed"). */
  amount: number;
  /** Optional label rendered on the cart + receipt
   *  ("WELCOME10", "Manager discount", etc.). */
  label?: string;
};

export type ActiveOrder = {
  id: string;
  type: OrderType;
  /** For dine-in: table number. For take-away: beeper number. */
  identifier: string | null;
  lines: OrderLine[];
  extras: OrderExtra[];
  flags: {
    urgent: boolean;
    skipKitchen: boolean;
    oneTime: boolean;
  };
  orderComment?: string;
  /** ms epoch — set when the cashier fires the order to the kitchen.
   *  Used by kitchen-bearing activities (café / fast-food / restaurant)
   *  to enforce the realistic two-step "send to kitchen → take payment"
   *  workflow. Undefined for direct-checkout activities (market, bakery,
   *  beauty, barber), where the order isn't routed through a kitchen. */
  sentAt?: number;
  /** Customer attached at order-time (Phase 4). */
  customerId?: string;
  /** Order-level discount applied at checkout (V2C). */
  orderDiscount?: OrderDiscount;
};

// ── V2 payments (split-payment ready) ────────────────────────────────
// V1 stored a single `{ method, tendered, change }` on the receipt. V2
// replaces it with an array — every receipt has 1+ payments. The
// migrate function (persist v3 → v4) wraps the V1 single payment in a
// one-element array so the dashboard never breaks.

export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  change?: number;
  paidAt: number;
};

// ── V2 entities (Phase 1+ populated, schema declared now) ────────────

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  /** Loyalty points balance — incremented on each completed receipt. */
  loyaltyPoints: number;
  tier: LoyaltyTier;
  /** ms epoch of first order — anchor for "customer since" UI. */
  firstSeenAt: number;
  /** Tags applied by the business (e.g. ["regular", "vip"]). */
  tags?: string[];
};

export type Supplier = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  /** Categories this supplier serves — used to suggest reorder
   *  routing. */
  categoryIds?: string[];
  /** Average lead time in days (for reorder UX). */
  leadDays?: number;
};

// ── Stock movements (Phase 3) ────────────────────────────────────────
// Every change to a product's on-hand stock appends one of these. The
// `balanceAfter` snapshot makes the movements log self-describing
// without needing to recompute from the running deltas.

export type StockMovementKind =
  | "sale" // automatic — completePayment deducts qty per line
  | "in" // delivery received, restock
  | "out" // outflow that isn't a sale (e.g. internal transfer)
  | "waste" // damaged / spoiled / written off
  | "adjust"; // free-form correction (e.g. found / lost / count)

export type StockMovement = {
  id: string;
  activity: ActivityKey;
  productId: string;
  /** Signed delta. Sale + Out + Waste = negative; In + Adjust can
   *  be either. */
  delta: number;
  kind: StockMovementKind;
  reason?: string;
  /** ms epoch. */
  at: number;
  /** Stock balance AFTER this movement was applied. Lets the Inventory
   *  view render trail values without re-summing the chain. */
  balanceAfter: number;
};

// ── Product overlay (Phase 3) ────────────────────────────────────────
// Manager-side mutations to the otherwise-static activity catalog.
// Overlay keeps the static catalog canonical (no copy-on-write of
// every seeded SKU) and stores only the deltas. Consumers merge via
// the `selectActivityProducts` selector.

export type ProductOverride = {
  /** Net-new products added via the Backoffice. */
  added: DemoProduct[];
  /** Shallow patches keyed by productId — applied AFTER static
   *  lookup, so any field can be overridden (name, price, sku, etc.). */
  edits: Record<string, Partial<DemoProduct>>;
  /** Product ids hidden from the catalog. Persisted so a "Restore"
   *  flow could surface them later (out of Phase 3A scope). */
  deleted: string[];
};

export type StaffRole = "owner" | "manager" | "cashier" | "kitchen" | "stylist" | "barber";

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  /** Initials shown on tickets / receipts. */
  initials: string;
  /** Per-service eligibility — empty means "all services". */
  servicesEligible?: string[];
  /** Hourly rate or commission % (Phase 5 reporting). */
  hourlyRate?: number;
  commissionPct?: number;
};

// ── Activity events (Phase 5A) ────────────────────────────────────────
// Append-only event log driving the "Recent activity" feed on the
// Backoffice Overview. Every state-mutating action (sale, refund,
// void, kitchen fire, stock adjust, low-stock cross, product add,
// supplier add, customer attach, appointment schedule) emits one
// event so the user can see cause-and-effect in real time.
//
// Capped at 200 entries (FIFO eviction) — same pattern as
// stockMovements. Persisted across sessions so the dashboard has a
// rolling 200-event history.
//
// Payload shape varies per kind; the renderer pattern-matches on
// `kind` to format the row. Kept as a structured map so future
// reporting can compute event metrics without re-parsing strings.

export type ActivityEventKind =
  | "sale-completed"
  | "sale-voided"
  | "sale-refunded"
  | "kitchen-fired"
  | "kitchen-stage-changed"
  | "stock-adjusted"
  | "stock-low"
  | "product-added"
  | "supplier-added"
  | "customer-attached"
  | "appointment-scheduled"
  | "production-run"
  | "recipe-defined";

export type ActivityEventPayload = {
  /** Receipt id when the event involves a receipt. */
  receiptId?: string;
  /** Kitchen ticket id when the event involves a kitchen ticket. */
  ticketId?: string;
  /** Product id (sale, stock, low-stock, product-added). */
  productId?: string;
  /** Product display name — snapshot so renaming later doesn't
   *  break old events. */
  productName?: string;
  /** Customer / staff / supplier display names (snapshot). */
  customerName?: string;
  staffName?: string;
  supplierName?: string;
  /** Monetary amount in MAD (sales, refunds). */
  amount?: number;
  /** Number of items / units involved (sale lines, stock delta). */
  qty?: number;
  /** Free-form label/reason — used by stock-adjusted (kind: "waste"
   *  / "in" / etc.) and refund reasons. */
  reason?: string;
  /** Kitchen ticket stage for stage-changed events. */
  stage?: string;
  /** Payment methods on the sale, comma-separated when split. */
  paymentMethod?: string;
  /** Number of distinct component products involved in a
   *  production run. Used for the activity-feed summary. */
  componentCount?: number;
};

export type ActivityEvent = {
  id: string;
  activity: ActivityKey;
  kind: ActivityEventKind;
  /** ms epoch — newest-first when displayed. */
  at: number;
  payload: ActivityEventPayload;
};
