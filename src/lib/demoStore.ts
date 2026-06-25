// Zustand store for the POS demo.
//
// Full state-driven workflow. Persists to localStorage so refresh mid-flow
// recovers the cashier exactly where they were. No backend, no API, no
// fake delays — every mutation is synchronous and observable.
//
// V2 schema (persist v4) extends V1 with split-payment-ready receipts,
// receipt status (paid / voided / refunded), and per-activity Customer /
// Supplier / Staff collections. The migrate function wraps V1's single
// `payment` field on receipts into a `payments: Payment[]` array of one
// and stamps `status: "paid"`, so legacy ledgers carry over intact.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ACTIVITIES } from "@/data/demo/activities";
import {
  ACTIVITY_CAPS,
  CALENDAR_KEYS,
  KITCHEN_KEYS,
  capsFor,
  type ActivityCapabilities,
} from "@/data/demo/activityCapabilities";
import { getSeedBundle } from "@/data/demo/seeds";
import { lineDisplayName, lineUnitPrice } from "./orderMath";
import type {
  ActiveOrder,
  ActivityEvent,
  ActivityEventKind,
  ActivityEventPayload,
  ActivityKey,
  Customer,
  DemoProduct,
  Modifier,
  OrderDiscount,
  OrderExtra,
  OrderLine,
  OrderType,
  Payment,
  PaymentMethod,
  ProductOverride,
  Staff,
  StockMovement,
  StockMovementKind,
  Supplier,
} from "@/data/demo/types";

// Re-export PaymentMethod from its V2 home (types.ts) so existing
// `import { PaymentMethod } from "@/lib/demoStore"` lines keep working.
export type { PaymentMethod } from "@/data/demo/types";

// ── Stages ────────────────────────────────────────────────────────────
// Linear progression. Each stage maps 1:1 to a screen group from the
// Workflow Screenshots folder:
//
//   activity-picker  →  /demo                    (Activity selection)
//   order-type       →  Starting order screen A4
//   identifier       →  Table picker A5 / Beeper picker A6
//   workspace        →  Order creation B1..B5 (browse + cart)
//   payment          →  B6 (payment sheet open)
//   success          →  B7 (payment success + receipt)
//
// Glovo/Done order types skip the identifier stage (no table or beeper).

export type DemoStage =
  | "order-type"
  | "identifier"
  | "workspace"
  | "payment"
  | "success";

export type PaymentState = {
  method: PaymentMethod;
  tendered: number; // amount the customer handed over (cash) or tap amount
  /** V2C — already-committed splits. Each "Add payment" click in the
   *  PaymentSheet pushes the current entry here and resets method
   *  + tendered for the next chunk. completePayment flushes both
   *  these plus the final entry to receipt.payments[]. */
  pendingPayments?: Payment[];
  /** V2C — when method is "gift-card", the card # the cashier
   *  entered. Demo derives a fake balance from this. */
  giftCardCode?: string;
};

// ── Kitchen tickets ──────────────────────────────────────────────────
// When the cashier sends an order to payment, we also forge a kitchen
// ticket (if the activity has a kitchen — café / fast-food / dine-in).
// Tickets advance through cooking → firing → plating, then get cleared.
// Lives in memory only (not persisted) so a refresh starts the kitchen
// clean — what's running in the kitchen is a "now" concern, unlike the
// receipts ledger which accumulates across the session.
//
// V2: the kitchen / calendar key lists are derived from
// ACTIVITY_CAPS (single source of truth). The exports stay for
// back-compat with any code that still imports the names.

export const KITCHEN_ACTIVITY_KEYS: ActivityKey[] = KITCHEN_KEYS;
export const CALENDAR_ACTIVITY_KEYS: ActivityKey[] = CALENDAR_KEYS;

export function activityHasKitchen(key: ActivityKey | null): boolean {
  return capsFor(key)?.hasKitchen ?? false;
}

export function activityHasCalendar(key: ActivityKey | null): boolean {
  return capsFor(key)?.hasCalendar ?? false;
}

// ── Appointments ─────────────────────────────────────────────────────
// Service-based businesses (Beauty / Barber) get a Calendar view backed
// by this collection. Appointments persist across sessions so the
// calendar feels lived-in on return visits.

export type AppointmentStatus = "scheduled" | "in-progress" | "done";

export type Appointment = {
  id: string;
  activity: ActivityKey;
  /** Service identifier — matches a DemoProduct id on the activity. */
  serviceId: string;
  /** Display name for the customer the slot is booked under. */
  customerName: string;
  /** Start time in ms epoch. */
  start: number;
  /** Booking length in minutes (defaults from the service's durationMin). */
  durationMin: number;
  status: AppointmentStatus;
};

/** Five-stage kitchen lifecycle.
 *
 *   new       — ticket landed from POS, awaiting kitchen acknowledgement
 *   accepted  — kitchen confirmed and queued for prep
 *   preparing — actively being made
 *   ready     — done, awaiting pickup / hand-off
 *   delivered — handed to the customer / closed (terminal stage)
 *
 * The cashier moves a ticket through these stages with the Advance button
 * on each card. Tickets stay in `delivered` until manually cleared so a
 * post-shift audit can see what was finished. Session-only — never
 * persisted (refresh wipes the kitchen, matching a real KDS). */
export type TicketStage =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered";

/** Linear lifecycle in canonical order — used for advance traversal,
 *  column ordering, and stage tinting. */
export const TICKET_STAGES: TicketStage[] = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "delivered",
];

export type KitchenTicket = {
  id: string;
  /** Display label — table number, beeper, or "Take Away" */
  table: string;
  /** Activity key the ticket was created from — used to filter the
   *  Kitchen view to the currently-selected activity. */
  activity: ActivityKey;
  /** Per-item snapshot. `urgent` is lifted from the OrderLine.urgent
   *  flag at fire time; the KDS sorts urgent items to the top of the
   *  ticket and surfaces an inline ⚡ glyph next to the qty. `comment`
   *  is the per-line note typed in the cart (allergy, no-onions, etc.)
   *  — rendered as an amber sub-line under the item on the KDS. */
  items: Array<{
    name: string;
    qty: number;
    urgent?: boolean;
    comment?: string;
  }>;
  stage: TicketStage;
  createdAt: number;
  /** Wall-clock when the ticket entered its current stage. Drives the
   *  "time-in-stage" badge on the Kanban card so the kitchen can spot a
   *  ticket that's been stuck. Reset on every advanceTicket. */
  stageChangedAt: number;
  /** Lifted from ActiveOrder.flags.urgent at the moment the ticket is
   *  fired to the kitchen. Drives the urgent ribbon + pin-to-top behaviour
   *  inside each stage column. */
  urgent?: boolean;
  /** Snapshot of the order-level comment at fire time. Surfaces as an
   *  amber banner at the top of the ticket so the line cook sees order
   *  context (VIP, allergy, deliver-asap) before scanning items. */
  orderComment?: string;
  /** Order type at fire time — "take-away" | "dine-in" | "glovo" | "done".
   *  Shown as a small chip in the ticket header so the kitchen can route
   *  output (counter pickup vs. table vs. delivery handoff). */
  orderType?: import("@/data/demo/types").OrderType;
  /** ActiveOrder.id this ticket was created from. Lets void/refund
   *  actions in Phase 2A find the kitchen ticket to flag voided. */
  orderId?: string;
  /** Set true by voidReceipt when the linked receipt is voided
   *  (or refundReceipt with "all"). KitchenView renders a dim
   *  "VOIDED" stamp across the card. Tickets are session-only so
   *  this never persists. */
  voided?: boolean;
};

export type ReceiptStatus = "paid" | "voided" | "refunded" | "partially-refunded";

export type CompletedReceipt = {
  id: string;
  /** Activity the receipt was issued under (used by Dashboard
   *  aggregations). */
  activity: ActivityKey;
  completedAt: number; // ms epoch
  orderType: OrderType;
  identifier: string | null;
  lines: Array<{ name: string; qty: number; price: number; subtotal: number }>;
  extras: Array<{ label: string; amount: number }>;
  subtotal: number;
  total: number;
  /** Legacy V1 field — first payment shorthand, kept populated so any
   *  V1-era reader (PaymentSuccess) keeps rendering without a refactor.
   *  New code should prefer `payments[0]`. */
  payment: { method: PaymentMethod; tendered: number; change: number };

  // ── V2 fields ─────────────────────────────────────────────────────
  /** Lifecycle state. "paid" by default; turns to "voided" / "refunded"
   *  via Phase 2 actions. */
  status: ReceiptStatus;
  /** Split-payment ready array — single payment receipts have a one-
   *  element array. Migration from V1 wraps the legacy `payment` field. */
  payments: Payment[];
  /** Tax portion of `total` (Phase 2 surfaces). */
  taxTotal?: number;
  /** Filled by refund/void actions (Phase 2). */
  refundedAmount?: number;
  /** Receipt id this is a refund of (chains a refund to its original). */
  refundedFrom?: string;
  /** Indexes into `lines` that have been refunded already. The refund
   *  picker disables these so cashiers can't double-refund. Absent or
   *  empty = nothing refunded yet. */
  refundedLineIndexes?: number[];
  /** Why the receipt was voided / refunded. Surfaced in the Receipts
   *  detail panel for audit. */
  reason?: string;
  /** ActiveOrder.id this receipt was rung from. Used to link kitchen
   *  tickets back to receipts for void cascades. */
  orderId?: string;
  /** Customer attached at order time (Phase 4). */
  customerId?: string;
  /** Cashier / server who rang the receipt (Phase 4). */
  staffId?: string;
};

type DemoState = {
  activity: ActivityKey | null;
  stage: DemoStage;
  order: ActiveOrder | null;
  payment: PaymentState | null;
  lastReceipt: CompletedReceipt | null;
  /** Receipt ledger — every completed payment gets appended. Persisted
   *  across sessions so the Dashboard shows accumulated history. */
  receipts: CompletedReceipt[];
  /** Live kitchen tickets — session-only (not persisted; partialize
   *  excludes them). A refresh wipes the kitchen, which matches how a
   *  real KDS reads "right now" rather than "everything ever fired". */
  kitchenTickets: KitchenTicket[];
  /** Calendar appointments — persisted. The Calendar view reads the
   *  slice for the current activity. */
  appointments: Appointment[];

  // ── V2 collections (Phase 1+ populates) ──────────────────────────
  /** Customer ledger — keyed by activity (one customer can exist in
   *  multiple activities' books). */
  customers: Record<ActivityKey, Customer[]>;
  /** Suppliers per activity — used by Backoffice reorder flows. */
  suppliers: Record<ActivityKey, Supplier[]>;
  /** Staff per activity — Phase 4 wires assignment + commissions. */
  staff: Record<ActivityKey, Staff[]>;
  /** Per-product stock levels keyed by activity. Phase 3 deducts on
   *  sale. Sparse map: unset productId = unbounded stock (V1
   *  behavior). */
  stock: Record<ActivityKey, Record<string, number>>;
  /** Per-product low-stock thresholds (Phase 3). When stock <=
   *  threshold the product surfaces a Low badge in POS + Backoffice
   *  + the "inventory" Dashboard tile. Defaults to 5 when missing. */
  stockThresholds: Record<ActivityKey, Record<string, number>>;
  /** Append-only movement log capped at 200 entries (FIFO eviction).
   *  Every stock change appends one; the Inventory view surfaces
   *  the most recent. */
  stockMovements: StockMovement[];
  /** Manager-side catalog overrides — added/edited/deleted products
   *  per activity. Merged with the static `ACTIVITIES[k].products`
   *  catalog by `selectActivityProducts`. */
  productOverrides: Record<ActivityKey, ProductOverride>;
  /** Per-activity seed bookkeeping — once an activity has been seeded
   *  with V2 data (customers/staff/stock/backfill), its key lives
   *  here. Prevents re-seeding on every selectActivity. */
  seeded: Partial<Record<ActivityKey, boolean>>;
  /** Append-only activity-event log (Phase 5A). Capped at 200 entries
   *  with FIFO eviction — same pattern as `stockMovements`. Every
   *  state-mutating action (sale, refund, void, kitchen fire, stock
   *  adjust, etc.) emits one event here so the Backoffice Overview's
   *  "Recent activity" feed can render cause-and-effect in real time. */
  events: ActivityEvent[];
  /** Currently-active staff member per activity (Phase 5B). The
   *  cashier picks "who's ringing" on first activity selection; the
   *  id stays sticky for the session so every receipt rung within
   *  that session is attributed to the same person. */
  currentStaffId: Partial<Record<ActivityKey, string>>;
  /** Parked / held orders (Phase 5D). When a cashier has a
   *  half-rung order they need to step away from (e.g. customer
   *  decides at the table), they "Hold" it — the order moves here
   *  and the till is freed for the next customer. Resume pulls it
   *  back into the active order slot. Session-only (not persisted)
   *  — matches how a real till's parked queue lives in volatile
   *  memory until the order is closed. */
  parkedOrders: ParkedOrder[];
  /** Per-activity inventory mode (Phase B — BOM).
   *  • "stock"      — default; simple stock + thresholds + alerts.
   *  • "production" — surfaces recipes, raw materials vs. finished
   *                   goods, production-run trigger. Same store
   *                   shape — toggle just unlocks the advanced UI.
   *  Persisted so once a manager flips an activity into production
   *  mode, returning sessions see it that way. */
  inventoryMode: Partial<Record<ActivityKey, "stock" | "production">>;
};

/** Snapshot of an order parked at "Hold" time. Includes a label so
 *  the parked queue is scannable ("Table 4 · 3 items · 12 min ago"). */
export type ParkedOrder = {
  id: string;
  activity: ActivityKey;
  /** Full order snapshot — restored verbatim into state.order on
   *  Resume. */
  order: ActiveOrder;
  /** ms epoch when the order was parked. */
  at: number;
  /** Optional reason / note. */
  reason?: string;
};

type DemoActions = {
  selectActivity: (k: ActivityKey) => void;
  setStage: (s: DemoStage) => void;
  /** Create a new order for the active stage. */
  startOrder: (type: OrderType) => void;
  /** Set the table number / beeper number / address for the active order. */
  setIdentifier: (id: string) => void;
  addLine: (productId: string, qty?: number) => void;
  /** V2 — add a customized line (variant, modifiers, combo
   *  selections). Customized lines do NOT auto-dedup (each
   *  combination is its own line so the cashier can edit
   *  selections individually if needed). */
  addLineWithSelections: (
    productId: string,
    opts: {
      qty?: number;
      variantId?: string;
      modifiers?: Modifier[];
      comboSelections?: Record<string, string[]>;
    },
  ) => void;
  setLineQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  setLineComment: (lineId: string, comment: string) => void;
  setLineDiscount: (lineId: string, pct: number) => void;
  /** Flip OrderLine.urgent — per-line priority independent of the
   *  order-level flags.urgent. Both flags route into the kitchen ticket
   *  so the KDS can pin urgent items to the top of the ticket card. */
  toggleLineUrgent: (lineId: string) => void;
  /** Change the active order's type (Dine-in, Take-away, Glovo, Done).
   *  Only the activity's enabled order types should be passed — the
   *  cart UI restricts choices to those. Updates `order.type` and the
   *  identifier label if the new type doesn't carry one (e.g. Glovo
   *  has no table number). */
  setOrderType: (type: OrderType) => void;
  addExtra: (extra: Omit<OrderExtra, "id">) => void;
  removeExtra: (id: string) => void;
  toggleFlag: (flag: keyof ActiveOrder["flags"]) => void;
  setOrderComment: (comment: string) => void;
  /** V2C — set the order-level discount. Pass null to clear. */
  setOrderDiscount: (d: OrderDiscount | null) => void;
  /** Fire the active order to the kitchen. Creates a kitchen ticket,
   *  stamps order.sentAt, but does NOT open payment. Realistic two-step
   *  restaurant flow — staff sends to kitchen first, takes payment when
   *  the customer is ready to leave. Only used for kitchen activities;
   *  ignored otherwise. */
  sendToKitchen: () => void;
  /** Open the payment sheet for the active order. */
  beginPayment: (method: PaymentMethod) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTendered: (amount: number) => void;
  /** V2C — set gift-card code (only meaningful when method is
   *  "gift-card"; ignored otherwise). */
  setGiftCardCode: (code: string) => void;
  /** V2C — commit the current entry as a split payment and reset
   *  method/tendered for the next chunk. Returns the amount that
   *  was added (or 0 if the current entry was invalid). */
  addPaymentToSplit: () => number;
  /** V2C — remove a previously-committed split entry. */
  removePaymentFromSplit: (id: string) => void;
  /** Finalize: snapshot to receipt, clear order, move to success. */
  completePayment: () => void;
  /** Start the next order — clear receipt + reset to order-type stage. */
  newOrder: () => void;
  /** Hard reset back to activity picker. */
  reset: () => void;
  /** Kitchen actions */
  advanceTicket: (id: string) => void;
  clearTicket: (id: string) => void;
  /** Calendar actions */
  scheduleAppointment: (input: {
    serviceId: string;
    customerName: string;
    start: number;
    durationMin?: number;
  }) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cancelAppointment: (id: string) => void;
  /** Phase 1 hook — set the per-activity seed bundle (customers,
   *  suppliers, staff, stock, stockThresholds) and append a
   *  backfilled receipt slice. Idempotent: calling twice for the
   *  same activity is a no-op (gated by the `seeded` map). */
  seedActivityData: (
    key: ActivityKey,
    bundle: {
      customers?: Customer[];
      suppliers?: Supplier[];
      staff?: Staff[];
      stock?: Record<string, number>;
      stockThresholds?: Record<string, number>;
      backfillReceipts?: CompletedReceipt[];
      /** Phase B — optional pre-seeded recipes. Applied to
       *  productOverrides.edits so they merge through
       *  selectActivityProducts on first read. */
      recipes?: Record<
        string,
        { componentId: string; qty: number }[]
      >;
    },
  ) => void;

  // ── Phase 3A — Backoffice (catalog CRUD + inventory + suppliers) ─
  /** Add a new product to the activity's catalog overlay. The product
   *  must carry its own unique `id` — the caller (Backoffice form)
   *  generates one. Stored in productOverrides.added. */
  addProduct: (key: ActivityKey, product: DemoProduct) => void;
  /** Patch a product (seeded or custom). Shallow merge stored in
   *  productOverrides.edits[productId]. */
  updateProduct: (
    key: ActivityKey,
    productId: string,
    patch: Partial<DemoProduct>,
  ) => void;
  /** Hide a product from the catalog. Pushes to productOverrides.
   *  deleted; if the product was custom-added it's also removed from
   *  productOverrides.added (so the deleted list stays seeded-only). */
  deleteProduct: (key: ActivityKey, productId: string) => void;
  /** Apply a signed delta to stock. Negative for sale/out/waste,
   *  positive for in. Appends a stockMovement entry (capped at 200,
   *  FIFO). */
  adjustStock: (
    key: ActivityKey,
    productId: string,
    delta: number,
    kind: StockMovementKind,
    reason?: string,
  ) => void;
  /** Wrapper: set absolute stock level. Computes the delta from the
   *  current value and dispatches adjustStock with kind="adjust". */
  setStock: (
    key: ActivityKey,
    productId: string,
    qty: number,
    reason?: string,
  ) => void;
  /** Set the low-stock threshold for a product. */
  setStockThreshold: (
    key: ActivityKey,
    productId: string,
    threshold: number,
  ) => void;
  /** Supplier CRUD per activity. */
  addSupplier: (key: ActivityKey, supplier: Supplier) => void;
  updateSupplier: (
    key: ActivityKey,
    supplierId: string,
    patch: Partial<Supplier>,
  ) => void;
  deleteSupplier: (key: ActivityKey, supplierId: string) => void;

  // ── Phase 2A — Refund / Void ────────────────────────────────────
  /** Mark a receipt as voided. Leaves it in the ledger for audit;
   *  flips status to "voided" and cascades to any live kitchen
   *  ticket created from the same order. */
  voidReceipt: (id: string, reason?: string) => void;
  /** Refund a receipt — either fully ("all") or by line index
   *  subset. Creates a new "mirror" receipt with negative totals
   *  and refundedFrom = original id. Updates the original's status
   *  (refunded | partially-refunded) and refundedAmount tally.
   *  Returns the new refund receipt's id (or null if the call was
   *  invalid / nothing to refund). */
  refundReceipt: (input: {
    id: string;
    lines: "all" | number[];
    reason?: string;
  }) => string | null;

  // ── Phase 5B — Attribution (customers + staff) ────────────────────
  /** Pick the staff member who's ringing on the active activity.
   *  Sticky for the session — every receipt rung within the same
   *  activity gets stamped with this id until the cashier changes
   *  hands. Pass null to clear. */
  setCurrentStaff: (key: ActivityKey, staffId: string | null) => void;
  /** Attach a known customer to the active order. The customer id
   *  flows through `completePayment` to the receipt + drives loyalty-
   *  point accumulation. Pass null via detachCustomer to clear. */
  attachCustomer: (customerId: string) => void;
  detachCustomer: () => void;
  /** Create a new customer on the fly (cashier didn't find them in
   *  the picker). Adds to the activity's customer roster + attaches
   *  to the active order in one step. */
  createAndAttachCustomer: (input: {
    name: string;
    phone?: string;
    email?: string;
  }) => void;

  // ── Phase B — Inventory / BOM (Bill of Materials) ─────────────
  /** Switch an activity between simple stock mode and advanced
   *  production mode. Per-activity so a manager can opt one
   *  vertical into BOM without affecting the others. */
  setInventoryMode: (
    key: ActivityKey,
    mode: "stock" | "production",
  ) => void;
  /** Set/replace the recipe (component list) for a product.
   *  Empty/omitted components list clears the recipe — the product
   *  reverts to being treated as a stand-alone SKU on sale. */
  setRecipe: (
    key: ActivityKey,
    productId: string,
    components: { componentId: string; qty: number }[],
  ) => void;
  /** Run a production batch — converts raw-material stock into
   *  finished-product stock. Deducts each component qty (multiplied
   *  by batch size) + adds batch size to the finished product's
   *  stock + appends stockMovements + emits a production-run event.
   *  No-op when the product has no recipe. */
  runProduction: (input: {
    productId: string;
    batches: number;
    reason?: string;
  }) => void;

  // ── Phase 5D — Hold / Resume orders ─────────────────────────────
  /** Move the current active order to the parked queue. Clears the
   *  active slot so the cashier can start a fresh order. No-op if
   *  there's no active order or no lines. */
  holdOrder: (reason?: string) => void;
  /** Restore a parked order to the active slot. Removes it from the
   *  parked queue. If there's already an active order with lines,
   *  the caller is responsible for parking it first — this just
   *  swaps. */
  resumeOrder: (parkedId: string) => void;
  /** Permanently discard a parked order without resuming. */
  discardParkedOrder: (parkedId: string) => void;
};

const EMPTY_BY_ACTIVITY = <T,>(): Record<ActivityKey, T[]> => ({
  cafe: [],
  "fast-food": [],
  "dine-in": [],
  market: [],
  bakery: [],
  beauty: [],
  barber: [],
});

const EMPTY_STOCK_BY_ACTIVITY = (): Record<ActivityKey, Record<string, number>> => ({
  cafe: {},
  "fast-food": {},
  "dine-in": {},
  market: {},
  bakery: {},
  beauty: {},
  barber: {},
});

const EMPTY_OVERRIDES_BY_ACTIVITY = (): Record<ActivityKey, ProductOverride> => ({
  cafe: { added: [], edits: {}, deleted: [] },
  "fast-food": { added: [], edits: {}, deleted: [] },
  "dine-in": { added: [], edits: {}, deleted: [] },
  market: { added: [], edits: {}, deleted: [] },
  bakery: { added: [], edits: {}, deleted: [] },
  beauty: { added: [], edits: {}, deleted: [] },
  barber: { added: [], edits: {}, deleted: [] },
});

const INITIAL: DemoState = {
  activity: null,
  stage: "order-type",
  order: null,
  payment: null,
  lastReceipt: null,
  receipts: [],
  kitchenTickets: [],
  appointments: [],
  customers: EMPTY_BY_ACTIVITY<Customer>(),
  suppliers: EMPTY_BY_ACTIVITY<Supplier>(),
  staff: EMPTY_BY_ACTIVITY<Staff>(),
  stock: EMPTY_STOCK_BY_ACTIVITY(),
  stockThresholds: EMPTY_STOCK_BY_ACTIVITY(),
  stockMovements: [],
  productOverrides: EMPTY_OVERRIDES_BY_ACTIVITY(),
  seeded: {},
  events: [],
  currentStaffId: {},
  parkedOrders: [],
  inventoryMode: {},
};

const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

// ── Activity-event helper (Phase 5A) ────────────────────────────────
// Pure: returns a NEW events array with the event prepended + capped
// at the FIFO ceiling. Callers compose the returned array into their
// existing set() call so every state mutation stays atomic.
const EVENTS_CAP = 200;
function appendEvent(
  prior: ActivityEvent[],
  activity: ActivityKey,
  kind: ActivityEventKind,
  payload: ActivityEventPayload = {},
  atOverride?: number,
): ActivityEvent[] {
  const evt: ActivityEvent = {
    id: uid("evt"),
    activity,
    kind,
    at: atOverride ?? Date.now(),
    payload,
  };
  return [evt, ...prior].slice(0, EVENTS_CAP);
}

/** Deterministic fake gift-card balance derived from the card code.
 *  Lets the demo "remember" balances per card across a session
 *  without a backend. Range: 50.00 - 550.00 MAD. Any 4+ chars works;
 *  shorter codes return 0 so the cashier can't accidentally apply
 *  an empty entry. */
export function giftCardBalance(code: string): number {
  if (!code || code.length < 4) return 0;
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h * 31 + code.charCodeAt(i)) >>> 0;
  }
  return 50 + (h % 50_001) / 100; // 50.00 - 550.00
}

// Seed a calendar-backed activity with a believable day of bookings.
// Used once on first activity selection (see selectActivity) so the
// Calendar view doesn't open empty. Pulls real services from the
// activity's product catalog; assigns a rotating set of customer
// names; staggers slots across the workday.
function seedAppointments(key: ActivityKey): Appointment[] {
  const cat = ACTIVITIES[key];
  const services = cat.products.filter((p) => p.durationMin != null);
  if (services.length === 0) return [];

  const customers = [
    "Sarah K.",
    "Mike T.",
    "Layla A.",
    "Omar F.",
    "Yasmine B.",
    "Ali R.",
  ];
  // Hours-of-day for seeded slots: 09:00, 10:30, 12:00, 14:30, 16:00, 17:30
  const slotHours = [9, 10.5, 12, 14.5, 16, 17.5];

  // Midnight of "today" in local time.
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayMs = start.getTime();

  return slotHours.map((hour, i) => {
    const svc = services[i % services.length];
    const slotMs = todayMs + hour * 60 * 60 * 1000;
    return {
      id: `apt_seed_${key}_${i}`,
      activity: key,
      serviceId: svc.id,
      customerName: customers[i % customers.length],
      start: slotMs,
      durationMin: svc.durationMin ?? 30,
      status: "scheduled" as AppointmentStatus,
    };
  });
}

export const useDemoStore = create<DemoState & DemoActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      selectActivity: (k) => {
        const a = ACTIVITIES[k];
        const state = get();
        const existingAppts = state.appointments;
        // Seed a few demo appointments the first time the user opens a
        // calendar-backed activity (Beauty / Barber). Persisted, so this
        // only happens once per activity per browser. Keeps the Calendar
        // view from looking empty on first visit while still respecting
        // anything the user manually scheduled.
        const seededAppts =
          activityHasCalendar(k) &&
          existingAppts.filter((appt) => appt.activity === k).length === 0
            ? seedAppointments(k)
            : [];
        const nextAppts =
          seededAppts.length > 0
            ? [...existingAppts, ...seededAppts]
            : existingAppts;

        // V2 Phase 1 seed: first time this activity is opened, populate
        // the customer ledger, supplier book, staff list, opening stock,
        // and 7 days of backfilled receipts so the Dashboard isn't
        // empty. Idempotent — re-running on a seeded activity is a
        // no-op via the persisted `seeded` map.
        if (!state.seeded[k]) {
          // Defer the seed write until AFTER this set() lands so the
          // appointments + activity snapshot is consistent. Use a
          // microtask — we're inside a synchronous action, but the
          // seed is independent state and benefits from being its
          // own commit (smaller persist payload on every set).
          queueMicrotask(() => {
            const bundle = getSeedBundle(k);
            get().seedActivityData(k, bundle);
          });
        }

        // Fast counter-sale activities (e.g. Market) skip the order-type +
        // identifier ceremony — the cashier lands directly in the workspace
        // with an open order using the first enabled order type. For
        // restaurant-style activities the picker chain runs as normal.
        if (a.skipOrderTypePicker) {
          const type = a.enabledOrderTypes[0];
          set({
            activity: k,
            stage: "workspace",
            order: {
              id: uid("ord"),
              type,
              identifier: null,
              lines: [],
              extras: [],
              flags: { urgent: false, skipKitchen: false, oneTime: false },
            },
            payment: null,
            lastReceipt: null,
            appointments: nextAppts,
          });
          return;
        }
        set({
          activity: k,
          stage: "order-type",
          order: null,
          payment: null,
          lastReceipt: null,
          appointments: nextAppts,
        });
      },

      setStage: (s) => set({ stage: s }),

      startOrder: (type) => {
        const needsIdentifier = type === "dine-in" || type === "take-away";
        set({
          order: {
            id: uid("ord"),
            type,
            identifier: null,
            lines: [],
            extras: [],
            flags: { urgent: false, skipKitchen: false, oneTime: false },
          },
          stage: needsIdentifier ? "identifier" : "workspace",
        });
      },

      setIdentifier: (id) => {
        const order = get().order;
        if (!order) return;
        set({ order: { ...order, identifier: id }, stage: "workspace" });
      },

      addLine: (productId, qty = 1) => {
        const order = get().order;
        if (!order) return;
        // Auto-dedup only plain lines (no customization) — variant /
        // modifier / combo lines get their own row even if the same
        // product was rung before.
        const existing = order.lines.find(
          (l) =>
            l.productId === productId &&
            !l.comboSelections &&
            !l.variantId &&
            !l.modifiers?.length,
        );
        if (existing) {
          set({
            order: {
              ...order,
              lines: order.lines.map((l) =>
                l.id === existing.id ? { ...l, qty: l.qty + qty } : l
              ),
            },
          });
          return;
        }
        const newLine: OrderLine = { id: uid("ln"), productId, qty };
        set({ order: { ...order, lines: [...order.lines, newLine] } });
      },

      addLineWithSelections: (productId, opts) => {
        const order = get().order;
        if (!order) return;
        const qty = opts.qty ?? 1;
        // Customized lines never dedup — the cashier needs to be
        // able to edit each combination independently.
        const newLine: OrderLine = {
          id: uid("ln"),
          productId,
          qty,
          variantId: opts.variantId,
          modifiers: opts.modifiers?.length ? opts.modifiers : undefined,
          comboSelections: opts.comboSelections,
        };
        set({ order: { ...order, lines: [...order.lines, newLine] } });
      },

      setLineQty: (lineId, qty) => {
        const order = get().order;
        if (!order) return;
        if (qty <= 0) {
          set({
            order: {
              ...order,
              lines: order.lines.filter((l) => l.id !== lineId),
            },
          });
          return;
        }
        set({
          order: {
            ...order,
            lines: order.lines.map((l) => (l.id === lineId ? { ...l, qty } : l)),
          },
        });
      },

      removeLine: (lineId) => {
        const order = get().order;
        if (!order) return;
        set({
          order: { ...order, lines: order.lines.filter((l) => l.id !== lineId) },
        });
      },

      setLineComment: (lineId, comment) => {
        const order = get().order;
        if (!order) return;
        set({
          order: {
            ...order,
            lines: order.lines.map((l) =>
              l.id === lineId ? { ...l, comment: comment || undefined } : l
            ),
          },
        });
      },

      setLineDiscount: (lineId, pct) => {
        const order = get().order;
        if (!order) return;
        set({
          order: {
            ...order,
            lines: order.lines.map((l) =>
              l.id === lineId ? { ...l, discountPct: pct || undefined } : l
            ),
          },
        });
      },

      toggleLineUrgent: (lineId) => {
        const order = get().order;
        if (!order) return;
        set({
          order: {
            ...order,
            lines: order.lines.map((l) =>
              l.id === lineId
                ? { ...l, urgent: l.urgent ? undefined : true }
                : l
            ),
          },
        });
      },

      setOrderType: (type) => {
        const order = get().order;
        if (!order) return;
        // No-op if it's already that type.
        if (order.type === type) return;
        // Identifier semantics differ across types — Dine-in carries a
        // table number, Take-away a beeper, delivery apps neither. When
        // the new type doesn't take an identifier, clear the existing
        // one so the kitchen ticket label rebuilds cleanly.
        const nextIdentifier =
          type === "glovo" || type === "done" ? null : order.identifier;
        set({
          order: { ...order, type, identifier: nextIdentifier },
        });
      },

      addExtra: (extra) => {
        const order = get().order;
        if (!order) return;
        set({
          order: { ...order, extras: [...order.extras, { ...extra, id: uid("ex") }] },
        });
      },

      removeExtra: (id) => {
        const order = get().order;
        if (!order) return;
        set({
          order: { ...order, extras: order.extras.filter((e) => e.id !== id) },
        });
      },

      toggleFlag: (flag) => {
        const order = get().order;
        if (!order) return;
        set({
          order: { ...order, flags: { ...order.flags, [flag]: !order.flags[flag] } },
        });
      },

      setOrderComment: (comment) => {
        const order = get().order;
        if (!order) return;
        set({ order: { ...order, orderComment: comment || undefined } });
      },

      setOrderDiscount: (d) => {
        const order = get().order;
        if (!order) return;
        set({ order: { ...order, orderDiscount: d ?? undefined } });
      },

      sendToKitchen: () => {
        const { order, activity, kitchenTickets } = get();
        if (
          !order ||
          order.lines.length === 0 ||
          !activity ||
          !activityHasKitchen(activity) ||
          order.sentAt
        )
          return;

        // Phase 3A — route through the overlay selector so manager
        // edits (renames, deletes) flow through to kitchen tickets.
        const products = selectActivityProducts(get(), activity);
        const productById = (id: string) =>
          products.find((p) => p.id === id);
        const lineLabel = (l: OrderLine) => {
          const p = productById(l.productId);
          return p ? lineDisplayName(p, l) : l.productId;
        };
        const now = Date.now();
        const hasLineUrgent = order.lines.some((l) => l.urgent === true);
        const ticket: KitchenTicket = {
          id: uid("tkt"),
          table: ACTIVITY_CAPS[activity].ticketLabel(order),
          activity,
          items: order.lines.map((l) => ({
            name: lineLabel(l),
            qty: l.qty,
            urgent: l.urgent || undefined,
            comment:
              l.comment && l.comment.trim().length > 0 ? l.comment : undefined,
          })),
          stage: "new",
          createdAt: now,
          stageChangedAt: now,
          // Ticket is flagged urgent if the WHOLE order is urgent OR
          // any individual line within the order is urgent. The KDS uses
          // this for the red ribbon + auto-pin-to-top behaviour.
          urgent: order.flags.urgent || hasLineUrgent || undefined,
          orderComment:
            order.orderComment && order.orderComment.trim().length > 0
              ? order.orderComment
              : undefined,
          orderType: order.type,
          orderId: order.id,
        };
        const lineQty = order.lines.reduce((s, l) => s + l.qty, 0);
        set({
          order: { ...order, sentAt: now },
          kitchenTickets: [ticket, ...kitchenTickets],
          events: appendEvent(
            get().events,
            activity,
            "kitchen-fired",
            { ticketId: ticket.id, qty: lineQty, reason: ticket.table },
            now,
          ),
        });
      },

      beginPayment: (method) => {
        const { order, activity, kitchenTickets } = get();
        if (!order || order.lines.length === 0 || !activity) return;

        // Direct-checkout activities (market, bakery, beauty, barber)
        // never sent the order to a kitchen up front, so there's no
        // kitchen ticket to forge here. Kitchen activities forge their
        // ticket via the separate sendToKitchen() action, which the UI
        // exposes as a distinct step before payment.
        //
        // Edge case: kitchen activity, but cashier proceeds straight to
        // payment without explicitly sending to kitchen first (e.g.,
        // single-item takeaway at a quiet café). Forge the ticket now
        // so the kitchen still gets the order — better that than a
        // silent drop.
        let nextTickets = kitchenTickets;
        if (activityHasKitchen(activity) && !order.sentAt) {
          const cat = ACTIVITIES[activity];
          const productById = (id: string) =>
            cat.products.find((p) => p.id === id);
          const lineLabel = (l: OrderLine) => {
            const p = productById(l.productId);
            return p ? lineDisplayName(p, l) : l.productId;
          };
          const _now = Date.now();
          const hasLineUrgent = order.lines.some((l) => l.urgent === true);
          nextTickets = [
            {
              id: uid("tkt"),
              table: ACTIVITY_CAPS[activity].ticketLabel(order),
              activity,
              items: order.lines.map((l) => ({
                name: lineLabel(l),
                qty: l.qty,
                urgent: l.urgent || undefined,
                comment:
                  l.comment && l.comment.trim().length > 0
                    ? l.comment
                    : undefined,
              })),
              stage: "new",
              createdAt: _now,
              stageChangedAt: _now,
              urgent: order.flags.urgent || hasLineUrgent || undefined,
              orderComment:
                order.orderComment && order.orderComment.trim().length > 0
                  ? order.orderComment
                  : undefined,
              orderType: order.type,
              orderId: order.id,
            },
            ...kitchenTickets,
          ];
        }

        set({
          payment: { method, tendered: 0 },
          stage: "payment",
          kitchenTickets: nextTickets,
        });
      },

      setPaymentMethod: (method) => {
        const p = get().payment;
        if (!p) return;
        // Switching method resets the active tender + gift-card code.
        // Pending splits stay — they're already committed.
        set({
          payment: {
            ...p,
            method,
            tendered: 0,
            giftCardCode: method === "gift-card" ? "" : undefined,
          },
        });
      },

      setTendered: (amount) => {
        const p = get().payment;
        if (!p) return;
        set({ payment: { ...p, tendered: Math.max(0, amount) } });
      },

      setGiftCardCode: (code) => {
        const p = get().payment;
        if (!p) return;
        set({ payment: { ...p, giftCardCode: code } });
      },

      addPaymentToSplit: () => {
        const { payment } = get();
        if (!payment) return 0;
        const amount = Math.max(0, payment.tendered);
        if (amount <= 0) return 0;
        const change = 0; // splits don't carry change — final tender does
        const split: Payment = {
          id: uid("pay"),
          method: payment.method,
          amount,
          tendered: amount,
          change,
          paidAt: Date.now(),
        };
        set({
          payment: {
            ...payment,
            tendered: 0,
            giftCardCode:
              payment.method === "gift-card" ? "" : payment.giftCardCode,
            pendingPayments: [...(payment.pendingPayments ?? []), split],
          },
        });
        return amount;
      },

      removePaymentFromSplit: (id) => {
        const { payment } = get();
        if (!payment?.pendingPayments) return;
        set({
          payment: {
            ...payment,
            pendingPayments: payment.pendingPayments.filter((p) => p.id !== id),
          },
        });
      },

      completePayment: () => {
        const { order, payment, activity } = get();
        if (!order || !payment || !activity) return;
        const caps = ACTIVITY_CAPS[activity];
        // Phase 3A — use the merged catalog so manager renames and
        // price edits land on the receipt.
        const products = selectActivityProducts(get(), activity);
        const productById = (id: string) =>
          products.find((p) => p.id === id);

        const lines = order.lines.map((l) => {
          const product = productById(l.productId);
          if (!product) {
            return { name: l.productId, qty: l.qty, price: 0, subtotal: 0 };
          }
          const unit = lineUnitPrice(product, l);
          return {
            name: lineDisplayName(product, l),
            qty: l.qty,
            price: unit,
            subtotal: unit * l.qty,
          };
        });
        const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
        const extrasTotal = order.extras.reduce((s, e) => s + e.amount, 0);
        const preDiscount = subtotal + extrasTotal;

        // Order-level discount — record it as a negative extra so the
        // receipt + reporting + refund flows all see it as a normal
        // line item. The label carries the kind ("WELCOME10" or "20%
        // off") so customers + cashiers understand the reduction.
        const discountAmount = order.orderDiscount
          ? order.orderDiscount.kind === "pct"
            ? -(preDiscount * (order.orderDiscount.amount / 100))
            : -Math.min(order.orderDiscount.amount, preDiscount)
          : 0;
        const discountLabel = order.orderDiscount
          ? order.orderDiscount.label ??
            (order.orderDiscount.kind === "pct"
              ? `${order.orderDiscount.amount}% off`
              : `${order.orderDiscount.amount.toFixed(2)} MAD off`)
          : null;
        const total = Math.max(0, preDiscount + discountAmount);
        const now = Date.now();

        // Split-pay accounting. Pending splits are already committed
        // (amount = what was tendered, no change). The final tender
        // covers the remainder; the change is the overage on THAT
        // chunk only.
        const pendingTotal = (payment.pendingPayments ?? []).reduce(
          (s, p) => s + p.amount,
          0,
        );
        const remaining = Math.max(0, total - pendingTotal);
        const finalAmount = Math.min(payment.tendered, remaining);
        const change = Math.max(0, payment.tendered - remaining);

        // Tax-inclusive mode means the printed price already contains
        // the VAT — the receipt's `taxTotal` is what's embedded in
        // `total` (for the tax-summary line). Exclusive mode would
        // add tax on top; we don't have any exclusive-tax activities
        // in V2 yet, but the math is here for when we do.
        const taxTotal =
          caps.taxMode === "inclusive"
            ? +(total - total / (1 + caps.taxRate)).toFixed(2)
            : +(total * caps.taxRate).toFixed(2);

        // Final tender becomes the last Payment in the array; the
        // already-pending splits keep their commit timestamps. If
        // there are no pending splits, this matches V1 single-pay
        // behavior exactly.
        const finalPayment: Payment = {
          id: uid("pay"),
          method: payment.method,
          amount: finalAmount > 0 ? finalAmount : total - pendingTotal,
          tendered: payment.tendered,
          change,
          paidAt: now,
        };
        const allPayments: Payment[] = [
          ...(payment.pendingPayments ?? []),
          ...(finalAmount > 0 || pendingTotal < total ? [finalPayment] : []),
        ];
        const primaryPayment = allPayments[0] ?? finalPayment;

        const receiptExtras = [
          ...order.extras.map((e) => ({ label: e.label, amount: e.amount })),
          ...(discountAmount !== 0 && discountLabel
            ? [{ label: discountLabel, amount: discountAmount }]
            : []),
        ];

        const receipt: CompletedReceipt = {
          id: uid("rcpt"),
          activity,
          completedAt: now,
          orderType: order.type,
          identifier: order.identifier,
          lines,
          extras: receiptExtras,
          subtotal,
          total,
          // Legacy + V2 — `payment` mirrors the LAST tender so V1-era
          // readers (PaymentSuccess) keep working when no split was
          // used. Split-aware code uses `payments[]` for the full
          // breakdown.
          payment: {
            method: primaryPayment.method,
            tendered: primaryPayment.tendered ?? primaryPayment.amount,
            change: primaryPayment.change ?? 0,
          },
          status: "paid",
          payments: allPayments,
          taxTotal,
          customerId: order.customerId,
          // Phase 5B — stamp the cashier identity if one is set for
          // this activity. Drives Staff Performance reporting +
          // surfaces the cashier on the receipt detail.
          staffId: get().currentStaffId[activity],
          orderId: order.id,
        };

        // Phase 3A + B — sale-deduction with recipe awareness.
        //
        // For each sold product:
        //   • If the product has a `recipeComponents` list (Phase B
        //     BOM), deduct each component's qty × line.qty from
        //     stock. The finished product itself is NOT deducted —
        //     a burger sold "consumes" the bun/patty/cheese it's
        //     made of, not the abstract burger SKU.
        //   • If no recipe, fall back to deducting the product's
        //     own stock (the V1 behaviour) — preserves the simple-
        //     inventory experience for activities that don't use
        //     production workflows.
        //
        // Built inline (not via adjustStock) so the whole transition
        // lands atomically in one set() call.
        const currentStock = get().stock[activity] ?? {};
        const nextStockMap: Record<string, number> = { ...currentStock };
        const newMovements: StockMovement[] = [];
        const productsForDeduction = selectActivityProducts(get(), activity);
        const productMapById = new Map(
          productsForDeduction.map((p) => [p.id, p]),
        );

        for (const l of order.lines) {
          const product = productMapById.get(l.productId);
          const recipe = product?.recipeComponents ?? [];
          if (recipe.length > 0) {
            // Recipe-aware: deduct each component's qty × line.qty
            // from its own stock entry. Skip components without a
            // stock entry (untracked raw materials).
            for (const c of recipe) {
              if (!(c.componentId in nextStockMap)) continue;
              const delta = -c.qty * l.qty;
              const after = nextStockMap[c.componentId] + delta;
              nextStockMap[c.componentId] = after;
              newMovements.push({
                id: uid("mov"),
                activity,
                productId: c.componentId,
                delta,
                kind: "sale",
                reason: `Receipt ${receipt.id.slice(-6)} · via ${
                  product?.name ?? l.productId
                }`,
                at: now,
                balanceAfter: after,
              });
            }
          } else {
            // Stand-alone product — original Phase 3A behaviour.
            if (!(l.productId in nextStockMap)) continue;
            const after = nextStockMap[l.productId] - l.qty;
            nextStockMap[l.productId] = after;
            newMovements.push({
              id: uid("mov"),
              activity,
              productId: l.productId,
              delta: -l.qty,
              kind: "sale",
              reason: `Receipt ${receipt.id.slice(-6)}`,
              at: now,
              balanceAfter: after,
            });
          }
        }
        const nextStock = newMovements.length
          ? { ...get().stock, [activity]: nextStockMap }
          : get().stock;
        const nextMovements = newMovements.length
          ? [...newMovements.reverse(), ...get().stockMovements].slice(0, 200)
          : get().stockMovements;

        // Phase 5A — sale-completed event. Snapshots qty + amount +
        // payment-method summary so the feed row can render the
        // transaction without re-reading the receipt.
        const lineItemCount = lines.reduce((s, l) => s + l.qty, 0);
        const paymentMethodLabel = allPayments
          .map((p) => p.method)
          .join(", ");
        const customerName = order.customerId
          ? get().customers[activity]?.find((c) => c.id === order.customerId)
              ?.name
          : undefined;
        let nextEvents = appendEvent(
          get().events,
          activity,
          "sale-completed",
          {
            receiptId: receipt.id,
            amount: total,
            qty: lineItemCount,
            paymentMethod: paymentMethodLabel,
            customerName,
          },
          now,
        );

        // Stock-low events for any product that crossed its threshold
        // as a result of this sale. Lets the feed surface "Espresso
        // now low" right next to the sale that caused it.
        const thresholds = get().stockThresholds[activity] ?? {};
        const productsForActivity = selectActivityProducts(get(), activity);
        const productNameById = new Map<string, string>(
          productsForActivity.map((p) => [p.id, p.name]),
        );
        for (const mv of newMovements) {
          const threshold = thresholds[mv.productId] ?? 5;
          if (mv.balanceAfter <= threshold) {
            nextEvents = appendEvent(
              nextEvents,
              activity,
              "stock-low",
              {
                productId: mv.productId,
                productName:
                  productNameById.get(mv.productId) ?? mv.productId,
                qty: mv.balanceAfter,
              },
              now,
            );
          }
        }

        // Phase 5B — loyalty accumulation. 1 point per 10 MAD spent
        // on the receipt total. Updates the attached customer's
        // points balance + auto-promotes tier when threshold crossed.
        // Skipped when no customer attached.
        let nextCustomers = get().customers;
        if (order.customerId) {
          const earned = Math.floor(total / 10);
          if (earned > 0) {
            const roster = nextCustomers[activity] ?? [];
            nextCustomers = {
              ...nextCustomers,
              [activity]: roster.map((c) => {
                if (c.id !== order.customerId) return c;
                const points = c.loyaltyPoints + earned;
                return {
                  ...c,
                  loyaltyPoints: points,
                  tier:
                    points >= 1000
                      ? "platinum"
                      : points >= 500
                        ? "gold"
                        : points >= 150
                          ? "silver"
                          : "bronze",
                };
              }),
            };
          }
        }

        set({
          stage: "success",
          lastReceipt: receipt,
          // Append to ledger — Dashboard reads from here.
          receipts: [receipt, ...get().receipts],
          order: null,
          payment: null,
          stock: nextStock,
          stockMovements: nextMovements,
          events: nextEvents,
          customers: nextCustomers,
        });
      },

      newOrder: () =>
        set({
          stage: "order-type",
          order: null,
          payment: null,
          lastReceipt: null,
        }),

      reset: () => set({ ...INITIAL }),

      // ── Calendar actions ─────────────────────────────────────
      scheduleAppointment: ({ serviceId, customerName, start, durationMin }) => {
        const activity = get().activity;
        if (!activity) return;
        const service = ACTIVITIES[activity].products.find(
          (p) => p.id === serviceId,
        );
        if (!service) return;
        const appt: Appointment = {
          id: uid("apt"),
          activity,
          serviceId,
          customerName: customerName.trim() || "Walk-in",
          start,
          durationMin: durationMin ?? service.durationMin ?? 30,
          status: "scheduled",
        };
        set({
          appointments: [...get().appointments, appt],
          events: appendEvent(get().events, activity, "appointment-scheduled", {
            productName: service.name,
            customerName: appt.customerName,
          }),
        });
      },

      setAppointmentStatus: (id, status) => {
        set({
          appointments: get().appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        });
      },

      cancelAppointment: (id) => {
        set({
          appointments: get().appointments.filter((a) => a.id !== id),
        });
      },

      // ── Kitchen actions ──────────────────────────────────────
      advanceTicket: (id) => {
        const ticket = get().kitchenTickets.find((t) => t.id === id);
        // No-op if ticket missing, voided, or already at the terminal stage.
        if (!ticket || ticket.voided) return;
        const idx = TICKET_STAGES.indexOf(ticket.stage);
        if (idx === -1 || idx === TICKET_STAGES.length - 1) return;
        const newStage = TICKET_STAGES[idx + 1];
        const now = Date.now();
        set({
          kitchenTickets: get().kitchenTickets.map((t) =>
            t.id === id
              ? { ...t, stage: newStage, stageChangedAt: now }
              : t,
          ),
          events: appendEvent(
            get().events,
            ticket.activity,
            "kitchen-stage-changed",
            {
              ticketId: ticket.id,
              stage: newStage,
              reason: ticket.table,
            },
            now,
          ),
        });
      },

      clearTicket: (id) => {
        set({
          kitchenTickets: get().kitchenTickets.filter((t) => t.id !== id),
        });
      },

      // ── Phase 3A — Backoffice (catalog + inventory + suppliers) ─
      addProduct: (key, product) => {
        const state = get();
        const overrides = state.productOverrides[key];
        set({
          productOverrides: {
            ...state.productOverrides,
            [key]: {
              ...overrides,
              added: [...overrides.added, product],
            },
          },
          events: appendEvent(state.events, key, "product-added", {
            productId: product.id,
            productName: product.name,
          }),
        });
      },

      updateProduct: (key, productId, patch) => {
        const state = get();
        const overrides = state.productOverrides[key];
        // For custom-added products, patch the entry in place so we
        // don't carry a stale snapshot in `added` and a fresh patch
        // in `edits`. For seeded products, the edits map is the
        // single overlay.
        const addedIdx = overrides.added.findIndex((p) => p.id === productId);
        if (addedIdx >= 0) {
          const nextAdded = overrides.added.slice();
          nextAdded[addedIdx] = { ...nextAdded[addedIdx], ...patch };
          set({
            productOverrides: {
              ...state.productOverrides,
              [key]: { ...overrides, added: nextAdded },
            },
          });
          return;
        }
        set({
          productOverrides: {
            ...state.productOverrides,
            [key]: {
              ...overrides,
              edits: {
                ...overrides.edits,
                [productId]: { ...(overrides.edits[productId] ?? {}), ...patch },
              },
            },
          },
        });
      },

      deleteProduct: (key, productId) => {
        const state = get();
        const overrides = state.productOverrides[key];
        const addedIdx = overrides.added.findIndex((p) => p.id === productId);
        // Custom-added products: just drop them from `added`. They
        // never existed in the seeded catalog, so no need to track
        // them as "deleted" — they're simply gone.
        if (addedIdx >= 0) {
          const nextAdded = overrides.added.slice();
          nextAdded.splice(addedIdx, 1);
          set({
            productOverrides: {
              ...state.productOverrides,
              [key]: { ...overrides, added: nextAdded },
            },
          });
          return;
        }
        // Seeded products go into the deleted list (idempotent).
        if (overrides.deleted.includes(productId)) return;
        set({
          productOverrides: {
            ...state.productOverrides,
            [key]: { ...overrides, deleted: [...overrides.deleted, productId] },
          },
        });
      },

      adjustStock: (key, productId, delta, kind, reason) => {
        if (delta === 0) return;
        const state = get();
        const currentMap = state.stock[key] ?? {};
        const current = currentMap[productId] ?? 0;
        const next = current + delta;
        const now = Date.now();
        const movement: StockMovement = {
          id: uid("mov"),
          activity: key,
          productId,
          delta,
          kind,
          reason,
          at: now,
          balanceAfter: next,
        };
        // FIFO cap at 200 movements to keep localStorage bounded.
        // Newest-first ordering matches the receipts ledger.
        const movements = [movement, ...state.stockMovements].slice(0, 200);

        // Phase 5A — emit stock-adjusted (and stock-low if the new
        // balance crosses threshold). Don't emit for `kind === "sale"`
        // because completePayment already emits the sale event and
        // walks every line for low-stock crossings — emitting here
        // would duplicate. adjustStock callers are managers/ops
        // adjusting on the Inventory screen.
        let nextEvents = state.events;
        if (kind !== "sale") {
          const products = selectActivityProducts(state, key);
          const productName =
            products.find((p) => p.id === productId)?.name ?? productId;
          nextEvents = appendEvent(
            nextEvents,
            key,
            "stock-adjusted",
            { productId, productName, qty: delta, reason: kind },
            now,
          );
          const threshold =
            (state.stockThresholds[key] ?? {})[productId] ?? 5;
          if (next <= threshold && current > threshold) {
            nextEvents = appendEvent(
              nextEvents,
              key,
              "stock-low",
              { productId, productName, qty: next },
              now,
            );
          }
        }

        set({
          stock: {
            ...state.stock,
            [key]: { ...currentMap, [productId]: next },
          },
          stockMovements: movements,
          events: nextEvents,
        });
      },

      setStock: (key, productId, qty, reason) => {
        const current = get().stock[key]?.[productId] ?? 0;
        const delta = qty - current;
        if (delta === 0) return;
        get().adjustStock(key, productId, delta, "adjust", reason);
      },

      setStockThreshold: (key, productId, threshold) => {
        const state = get();
        const map = state.stockThresholds[key] ?? {};
        set({
          stockThresholds: {
            ...state.stockThresholds,
            [key]: { ...map, [productId]: Math.max(0, threshold) },
          },
        });
      },

      // ── Phase B — Inventory / BOM actions ───────────────────────
      setInventoryMode: (key, mode) => {
        const state = get();
        set({
          inventoryMode: { ...state.inventoryMode, [key]: mode },
        });
      },

      setRecipe: (key, productId, components) => {
        const state = get();
        const overrides = state.productOverrides[key];
        const cleaned = components.filter((c) => c.qty > 0 && c.componentId);
        // Apply the recipe via the override edits map. Since the
        // catalog is read through selectActivityProducts, the merged
        // product will surface the new recipeComponents on its
        // next render.
        const nextEdits = {
          ...overrides.edits,
          [productId]: {
            ...(overrides.edits[productId] ?? {}),
            recipeComponents: cleaned.length > 0 ? cleaned : undefined,
          },
        };
        const products = selectActivityProducts(state, key);
        const product = products.find((p) => p.id === productId);
        set({
          productOverrides: {
            ...state.productOverrides,
            [key]: { ...overrides, edits: nextEdits },
          },
          events:
            cleaned.length > 0
              ? appendEvent(state.events, key, "recipe-defined", {
                  productId,
                  productName: product?.name ?? productId,
                  componentCount: cleaned.length,
                })
              : state.events,
        });
      },

      runProduction: ({ productId, batches, reason }) => {
        const state = get();
        const activity = state.activity;
        if (!activity || batches <= 0) return;
        const products = selectActivityProducts(state, activity);
        const product = products.find((p) => p.id === productId);
        const recipe = product?.recipeComponents ?? [];
        if (!product || recipe.length === 0) return;

        const now = Date.now();
        const currentStock = state.stock[activity] ?? {};
        const nextStockMap: Record<string, number> = { ...currentStock };
        const newMovements: StockMovement[] = [];

        // Deduct each component × batches.
        for (const c of recipe) {
          const prev = nextStockMap[c.componentId] ?? 0;
          const delta = -c.qty * batches;
          const after = prev + delta;
          nextStockMap[c.componentId] = after;
          newMovements.push({
            id: uid("mov"),
            activity,
            productId: c.componentId,
            delta,
            kind: "out",
            reason: `Production · ${product.name}${reason ? ` · ${reason}` : ""}`,
            at: now,
            balanceAfter: after,
          });
        }

        // Add batches to the finished product's stock.
        const finishedPrev = nextStockMap[productId] ?? 0;
        const finishedAfter = finishedPrev + batches;
        nextStockMap[productId] = finishedAfter;
        newMovements.push({
          id: uid("mov"),
          activity,
          productId,
          delta: batches,
          kind: "in",
          reason: `Production batch · ${product.name}`,
          at: now,
          balanceAfter: finishedAfter,
        });

        const nextMovements = [
          ...newMovements.reverse(),
          ...state.stockMovements,
        ].slice(0, 200);

        set({
          stock: { ...state.stock, [activity]: nextStockMap },
          stockMovements: nextMovements,
          events: appendEvent(state.events, activity, "production-run", {
            productId,
            productName: product.name,
            qty: batches,
            componentCount: recipe.length,
            reason,
          }),
        });
      },

      addSupplier: (key, supplier) => {
        const state = get();
        set({
          suppliers: {
            ...state.suppliers,
            [key]: [...state.suppliers[key], supplier],
          },
          events: appendEvent(state.events, key, "supplier-added", {
            supplierName: supplier.name,
          }),
        });
      },

      updateSupplier: (key, supplierId, patch) => {
        const state = get();
        set({
          suppliers: {
            ...state.suppliers,
            [key]: state.suppliers[key].map((s) =>
              s.id === supplierId ? { ...s, ...patch } : s,
            ),
          },
        });
      },

      deleteSupplier: (key, supplierId) => {
        const state = get();
        set({
          suppliers: {
            ...state.suppliers,
            [key]: state.suppliers[key].filter((s) => s.id !== supplierId),
          },
        });
      },

      // ── Phase 2A — Refund / Void ───────────────────────────────
      voidReceipt: (id, reason) => {
        const { receipts, kitchenTickets, events } = get();
        const target = receipts.find((r) => r.id === id);
        if (!target || target.status === "voided") return;
        const updated: CompletedReceipt = {
          ...target,
          status: "voided",
          reason: reason ?? target.reason,
        };
        set({
          receipts: receipts.map((r) => (r.id === id ? updated : r)),
          // Flag any live kitchen ticket linked to the same order so
          // the Kitchen view shows a VOIDED stamp. Tickets are
          // session-only — a refresh wipes them — so this only
          // affects what's currently displayed.
          kitchenTickets: target.orderId
            ? kitchenTickets.map((t) =>
                t.orderId === target.orderId ? { ...t, voided: true } : t,
              )
            : kitchenTickets,
          events: appendEvent(events, target.activity, "sale-voided", {
            receiptId: target.id,
            amount: target.total,
            reason,
          }),
        });
      },

      refundReceipt: ({ id, lines: linesArg, reason }) => {
        const { receipts, kitchenTickets } = get();
        const target = receipts.find((r) => r.id === id);
        if (!target || target.status === "voided" || target.status === "refunded") {
          return null;
        }

        // Resolve which line indexes to refund. Exclude already-
        // refunded indexes so a cashier can't double-refund the
        // same line.
        const alreadyRefunded = new Set(target.refundedLineIndexes ?? []);
        const targetIndexes =
          linesArg === "all"
            ? target.lines.map((_, i) => i).filter((i) => !alreadyRefunded.has(i))
            : linesArg.filter((i) => !alreadyRefunded.has(i));
        if (targetIndexes.length === 0) return null;

        // Build the refund mirror — same line shape, negative subtotals.
        const refundLines = targetIndexes.map((i) => {
          const l = target.lines[i];
          return {
            name: l.name,
            qty: l.qty,
            price: l.price,
            subtotal: -l.subtotal,
          };
        });
        const refundSubtotal = refundLines.reduce((s, l) => s + l.subtotal, 0);
        const refundTotal = refundSubtotal; // no extras pro-rated for partial
        const refundTaxTotal =
          target.taxTotal != null && target.total !== 0
            ? +(target.taxTotal * (refundTotal / target.total)).toFixed(2)
            : undefined;

        const now = Date.now();
        const firstMethod = target.payments[0]?.method ?? target.payment.method;
        const refundPayment: Payment = {
          id: uid("pay"),
          method: firstMethod,
          amount: refundTotal,
          tendered: 0,
          change: 0,
          paidAt: now,
        };
        const newId = uid("rcpt");
        const refundReceipt: CompletedReceipt = {
          id: newId,
          activity: target.activity,
          completedAt: now,
          orderType: target.orderType,
          identifier: target.identifier,
          lines: refundLines,
          extras: [],
          subtotal: refundSubtotal,
          total: refundTotal,
          payment: { method: firstMethod, tendered: 0, change: 0 },
          status: "paid",
          payments: [refundPayment],
          taxTotal: refundTaxTotal,
          refundedFrom: target.id,
          customerId: target.customerId,
          reason,
        };

        // Update the original: mark refunded line indexes + flip
        // status. Full refund = "refunded"; subset = "partially-
        // refunded".
        const nextRefundedIndexes = Array.from(
          new Set([...(target.refundedLineIndexes ?? []), ...targetIndexes]),
        );
        const allRefunded = nextRefundedIndexes.length === target.lines.length;
        const refundedAmount =
          (target.refundedAmount ?? 0) + Math.abs(refundTotal);
        const updatedOriginal: CompletedReceipt = {
          ...target,
          status: allRefunded ? "refunded" : "partially-refunded",
          refundedAmount,
          refundedLineIndexes: nextRefundedIndexes,
          reason: reason ?? target.reason,
        };

        // Cascade to kitchen ticket only on full refund (partial =
        // some food already served, ticket should stay valid).
        const nextTickets =
          allRefunded && target.orderId
            ? kitchenTickets.map((t) =>
                t.orderId === target.orderId ? { ...t, voided: true } : t,
              )
            : kitchenTickets;

        set({
          receipts: [
            refundReceipt,
            ...receipts.map((r) => (r.id === id ? updatedOriginal : r)),
          ],
          kitchenTickets: nextTickets,
          events: appendEvent(
            get().events,
            target.activity,
            "sale-refunded",
            {
              receiptId: target.id,
              amount: Math.abs(refundTotal),
              qty: refundLines.reduce((s, l) => s + l.qty, 0),
              reason,
            },
            now,
          ),
        });
        return newId;
      },

      // ── Phase 5B — Attribution actions ───────────────────────
      setCurrentStaff: (key, staffId) => {
        const state = get();
        const next = { ...state.currentStaffId };
        if (staffId == null) delete next[key];
        else next[key] = staffId;
        set({ currentStaffId: next });
      },

      attachCustomer: (customerId) => {
        const state = get();
        const order = state.order;
        const activity = state.activity;
        if (!order || !activity) return;
        const existing =
          state.customers[activity]?.find((c) => c.id === customerId);
        if (!existing) return;
        set({
          order: { ...order, customerId },
          events: appendEvent(state.events, activity, "customer-attached", {
            customerName: existing.name,
          }),
        });
      },

      detachCustomer: () => {
        const state = get();
        const order = state.order;
        if (!order || !order.customerId) return;
        const { customerId: _omit, ...rest } = order;
        void _omit;
        set({ order: rest as ActiveOrder });
      },

      // ── Phase 5D — Hold / Resume actions ────────────────────
      holdOrder: (reason) => {
        const state = get();
        const order = state.order;
        const activity = state.activity;
        if (!order || !activity || order.lines.length === 0) return;
        const parked: ParkedOrder = {
          id: uid("park"),
          activity,
          order,
          at: Date.now(),
          reason: reason?.trim() || undefined,
        };
        set({
          // Park at the FRONT — newest-first matches the receipts
          // ledger + the activity feed.
          parkedOrders: [parked, ...state.parkedOrders],
          // Clear the active slot. The cashier returns to the
          // empty-cart workspace ready for the next customer.
          order: null,
          payment: null,
          stage: "workspace",
        });
      },

      resumeOrder: (parkedId) => {
        const state = get();
        const target = state.parkedOrders.find((p) => p.id === parkedId);
        if (!target) return;
        set({
          parkedOrders: state.parkedOrders.filter((p) => p.id !== parkedId),
          // If there's a current order, the caller should have
          // parked it first — but to avoid silently destroying
          // work, we won't overwrite a non-empty cart. The UI
          // gates the Resume button on `!order || order.lines.length === 0`.
          order:
            state.order && state.order.lines.length > 0
              ? state.order
              : target.order,
          payment: null,
          stage: "workspace",
        });
      },

      discardParkedOrder: (parkedId) => {
        const state = get();
        set({
          parkedOrders: state.parkedOrders.filter((p) => p.id !== parkedId),
        });
      },

      createAndAttachCustomer: ({ name, phone, email }) => {
        const state = get();
        const activity = state.activity;
        const order = state.order;
        if (!activity) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        const id = uid("cust");
        const newCustomer: Customer = {
          id,
          name: trimmed,
          phone: phone?.trim() || undefined,
          email: email?.trim() || undefined,
          loyaltyPoints: 0,
          tier: "bronze",
          firstSeenAt: Date.now(),
        };
        set({
          customers: {
            ...state.customers,
            [activity]: [...(state.customers[activity] ?? []), newCustomer],
          },
          order: order ? { ...order, customerId: id } : order,
          events: appendEvent(state.events, activity, "customer-attached", {
            customerName: newCustomer.name,
          }),
        });
      },

      // ── V2 seed bundle (Phase 1 calls this on first activity visit) ──
      seedActivityData: (key, bundle) => {
        const state = get();
        if (state.seeded[key]) return; // idempotent

        // Phase 5A — synthesize a small ribbon of historical events
        // so the Activity Feed has presence on first activity
        // selection. Walks the most recent backfill receipts as
        // sale-completed events + injects a couple of stock-low + a
        // supplier-added so the feed surfaces variety from the start.
        const seedEvents: ActivityEvent[] = [];
        const now = Date.now();
        const recentReceipts = (bundle.backfillReceipts ?? [])
          .slice()
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 8);
        for (const r of recentReceipts) {
          const customerName = r.customerId
            ? bundle.customers?.find((c) => c.id === r.customerId)?.name
            : undefined;
          seedEvents.push({
            id: uid("evt"),
            activity: key,
            kind: "sale-completed",
            at: r.completedAt,
            payload: {
              receiptId: r.id,
              amount: r.total,
              qty: r.lines.reduce((s, l) => s + l.qty, 0),
              paymentMethod: r.payments[0]?.method ?? r.payment.method,
              customerName,
            },
          });
        }
        // Stock-low — surface up to 2 products that ship low out of
        // the gate. Picks the first two products whose seeded stock
        // is at or below threshold.
        if (bundle.stock && bundle.stockThresholds) {
          const lowPicks = Object.entries(bundle.stock)
            .filter(
              ([pid, qty]) =>
                qty <= (bundle.stockThresholds?.[pid] ?? 5) && qty > 0,
            )
            .slice(0, 2);
          const products = selectActivityProducts({ ...state, productOverrides: { ...state.productOverrides, [key]: state.productOverrides[key] } }, key);
          for (const [pid, qty] of lowPicks) {
            const pname = products.find((p) => p.id === pid)?.name ?? pid;
            seedEvents.push({
              id: uid("evt"),
              activity: key,
              kind: "stock-low",
              at: now - Math.floor(Math.random() * 6 * 3600_000),
              payload: { productId: pid, productName: pname, qty },
            });
          }
        }
        // Supplier-added — surface the most-recent supplier so the
        // feed advertises the supplier dimension.
        const firstSupplier = bundle.suppliers?.[0];
        if (firstSupplier) {
          seedEvents.push({
            id: uid("evt"),
            activity: key,
            kind: "supplier-added",
            at: now - 18 * 3600_000,
            payload: { supplierName: firstSupplier.name },
          });
        }
        // Sort newest-first + cap to 12 so the feed reads as
        // "yesterday's snapshot" rather than dumping the whole log.
        seedEvents.sort((a, b) => b.at - a.at);
        const cappedSeed = seedEvents.slice(0, 12);

        set({
          customers: bundle.customers
            ? { ...state.customers, [key]: bundle.customers }
            : state.customers,
          suppliers: bundle.suppliers
            ? { ...state.suppliers, [key]: bundle.suppliers }
            : state.suppliers,
          staff: bundle.staff
            ? { ...state.staff, [key]: bundle.staff }
            : state.staff,
          stock: bundle.stock
            ? { ...state.stock, [key]: bundle.stock }
            : state.stock,
          stockThresholds: bundle.stockThresholds
            ? { ...state.stockThresholds, [key]: bundle.stockThresholds }
            : state.stockThresholds,
          // Backfill receipts join the live ledger so the Dashboard
          // sees them as real history. Phase 2+ reporting filters by
          // date range exposes them just like live receipts.
          receipts: bundle.backfillReceipts?.length
            ? [...state.receipts, ...bundle.backfillReceipts]
            : state.receipts,
          // Phase 5A — prepend synthesized events to whatever the
          // store already has (other activities' events stay).
          events: [...cappedSeed, ...state.events].slice(0, EVENTS_CAP),
          // Phase P — auto-assign the first staff member as the
          // cashier on the till. The original Caisse Manager POS
          // surfaces cashier identity as a passive header chip, not
          // as a selection step. Defaulting here removes the friction
          // entirely; the manager can still swap via the header chip
          // if they hand the till to someone else mid-session.
          currentStaffId:
            state.currentStaffId[key] || !bundle.staff?.length
              ? state.currentStaffId
              : {
                  ...state.currentStaffId,
                  [key]: bundle.staff[0].id,
                },
          // Phase B — pre-seeded recipes. Applied as productOverride
          // edits so they merge through selectActivityProducts on
          // first read, just like manager-defined recipes.
          productOverrides: bundle.recipes
            ? {
                ...state.productOverrides,
                [key]: {
                  ...state.productOverrides[key],
                  edits: {
                    ...state.productOverrides[key].edits,
                    ...Object.fromEntries(
                      Object.entries(bundle.recipes).map(([pid, components]) => [
                        pid,
                        {
                          ...(state.productOverrides[key].edits[pid] ?? {}),
                          recipeComponents: components,
                        },
                      ]),
                    ),
                  },
                },
              }
            : state.productOverrides,
          seeded: { ...state.seeded, [key]: true },
        });
      },
    }),
    {
      name: "cm-demo-state",
      storage: createJSONStorage(() => localStorage),
      version: 4,
      // Receipts persist (ledger across sessions); kitchen tickets +
      // parked orders do NOT — a fresh page load presents an empty
      // kitchen and an empty parked queue, matching how those live
      // in volatile workspace memory in a real till.
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([k]) => k !== "kitchenTickets" && k !== "parkedOrders",
          ),
        ) as DemoState & DemoActions,
      migrate: (persistedState, fromVersion) => {
        // V1 → V2 (persist v3 → v4):
        //   • Wrap legacy single-payment receipts into `payments: Payment[]`
        //   • Stamp `status: "paid"` on every existing receipt
        //   • Initialize the V2 collections (customers/suppliers/staff/
        //     stock/seeded) as empty maps — Phase 1 seed runs on next
        //     activity selection and populates them.
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as DemoState & DemoActions;
        }
        const s = persistedState as Partial<DemoState>;
        if (fromVersion < 4) {
          const upgradedReceipts: CompletedReceipt[] = (s.receipts ?? []).map(
            (r) => {
              // Already V2-shape (resumed mid-migration)? Pass through.
              const v2 = r as Partial<CompletedReceipt>;
              if (Array.isArray(v2.payments) && v2.status) return v2 as CompletedReceipt;
              const legacy = r as CompletedReceipt;
              return {
                ...legacy,
                status: "paid" as ReceiptStatus,
                payments: [
                  {
                    id: `pay_legacy_${legacy.id}`,
                    method: legacy.payment.method,
                    amount: legacy.total,
                    tendered: legacy.payment.tendered,
                    change: legacy.payment.change,
                    paidAt: legacy.completedAt,
                  },
                ],
              };
            },
          );
          return {
            ...s,
            receipts: upgradedReceipts,
            customers: s.customers ?? EMPTY_BY_ACTIVITY<Customer>(),
            suppliers: s.suppliers ?? EMPTY_BY_ACTIVITY<Supplier>(),
            staff: s.staff ?? EMPTY_BY_ACTIVITY<Staff>(),
            stock: s.stock ?? EMPTY_STOCK_BY_ACTIVITY(),
            seeded: s.seeded ?? {},
            events: s.events ?? [],
          } as DemoState & DemoActions;
        }
        // Forward path — `events` is additive within v4; existing
        // states get the field defaulted on rehydrate so the
        // ActivityFeed doesn't crash on missing array.
        if (!Array.isArray(s.events)) {
          return {
            ...s,
            events: [],
          } as unknown as DemoState & DemoActions;
        }
        return persistedState as DemoState & DemoActions;
      },
    }
  )
);

// ── Derived selectors ────────────────────────────────────────────────

export type Totals = {
  subtotal: number;
  extras: number;
  /** Negative value when an order-level discount is applied. */
  discount: number;
  total: number;
};

export function selectOrderTotals(state: ReturnType<typeof useDemoStore.getState>): Totals {
  const { activity, order } = state;
  if (!order || !activity)
    return { subtotal: 0, extras: 0, discount: 0, total: 0 };
  // Phase 3A — use the merged catalog so live price edits + custom
  // products contribute to the in-progress order's total.
  const products = selectActivityProducts(state, activity);
  const productById = (id: string) => products.find((p) => p.id === id);

  const subtotal = order.lines.reduce((sum, l) => {
    const product = productById(l.productId);
    if (!product) return sum;
    return sum + lineUnitPrice(product, l) * l.qty;
  }, 0);
  const extras = order.extras.reduce((sum, e) => sum + e.amount, 0);
  const preDiscount = subtotal + extras;

  // Order-level discount — pct subtracts a fraction of the running
  // total (subtotal + extras); fixed subtracts a flat MAD amount.
  // Never lets the order go negative.
  let discount = 0;
  if (order.orderDiscount) {
    if (order.orderDiscount.kind === "pct") {
      discount = -(preDiscount * (order.orderDiscount.amount / 100));
    } else {
      discount = -Math.min(order.orderDiscount.amount, preDiscount);
    }
  }
  const total = Math.max(0, preDiscount + discount);
  return { subtotal, extras, discount, total };
}

/** Capability lookup for the currently-selected activity. Returns null
 *  when no activity has been picked (during onboarding). Components
 *  pass this through `useShallow` since it returns a stable object
 *  reference per activity. */
/** Merge an activity's static catalog with the Phase 3 overlay:
 *    1. Drop products in overrides.deleted
 *    2. Shallow-merge overrides.edits[productId] onto matching products
 *    3. Append overrides.added (treated as new products)
 *
 *  Components that need the activity's product list should go through
 *  this selector so manager-side edits propagate everywhere (POS,
 *  receipts, kitchen tickets). Returns a fresh array each call — wrap
 *  with useShallow at the call site if needed for re-render control. */
export function selectActivityProducts(
  state: ReturnType<typeof useDemoStore.getState>,
  key: ActivityKey,
): DemoProduct[] {
  const base = ACTIVITIES[key].products;
  const overrides = state.productOverrides[key];
  if (!overrides) return base;
  const deleted = new Set(overrides.deleted);
  const edited = base
    .filter((p) => !deleted.has(p.id))
    .map((p) => {
      const patch = overrides.edits[p.id];
      return patch ? { ...p, ...patch } : p;
    });
  return [...edited, ...overrides.added];
}

export function selectActiveCapabilities(
  state: ReturnType<typeof useDemoStore.getState>,
): ActivityCapabilities | null {
  return capsFor(state.activity);
}

/** Filter the receipt ledger to a [start, end) ms-epoch window for
 *  the currently-selected activity. Phase 5 reporting uses this for
 *  date-range pickers; Phase 1 backfill verification uses it to
 *  count "receipts in the past 7 days". */
export function selectReceiptsInRange(
  state: ReturnType<typeof useDemoStore.getState>,
  start: number,
  end: number,
): CompletedReceipt[] {
  const { activity, receipts } = state;
  if (!activity) return [];
  return receipts.filter(
    (r) =>
      r.activity === activity &&
      r.completedAt >= start &&
      r.completedAt < end,
  );
}

/** Aggregate receipts into a top-N items-sold list. Extracted from
 *  DashboardView so Phase 5 reports can reuse the same shape. */
export function selectTopProducts(
  receipts: CompletedReceipt[],
  limit: number,
): Array<{ name: string; qty: number; revenue: number }> {
  const byName = new Map<string, { qty: number; revenue: number }>();
  for (const r of receipts) {
    for (const line of r.lines) {
      const cur = byName.get(line.name) ?? { qty: 0, revenue: 0 };
      cur.qty += line.qty;
      cur.revenue += line.subtotal;
      byName.set(line.name, cur);
    }
  }
  return Array.from(byName.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

// ─── Phase 5C — Intelligence selectors ───────────────────────────────
// All read-only aggregations. Each selector takes the receipt slice
// for the current activity (filtered upstream) and returns the
// rolled-up shape the panel renders. Pure: no Date.now() inside; the
// caller passes `now` so render-purity rules stay clean.

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** Revenue intelligence — today / week / month totals + WoW + MoM
 *  deltas + a 7-day sparkline series. */
export type RevenueIntelligence = {
  today: { revenue: number; orders: number; spark: number[] };
  week: { revenue: number; orders: number; deltaPct: number };
  month: { revenue: number; orders: number; deltaPct: number };
};

export function selectRevenueIntelligence(
  receipts: CompletedReceipt[],
  now: number,
): RevenueIntelligence {
  const startOfToday = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const startOfWeek = startOfToday - 6 * DAY_MS;
  const startOfLastWeek = startOfWeek - WEEK_MS;
  const startOfMonth = startOfToday - 29 * DAY_MS;
  const startOfLastMonth = startOfMonth - 30 * DAY_MS;

  // Only "paid" lines count — refunds + voids removed from the
  // headline numbers (they show up on a separate refund-rate KPI).
  const live = receipts.filter(
    (r) => r.status !== "voided" && r.status !== "refunded",
  );

  let todayRev = 0,
    todayOrd = 0,
    weekRev = 0,
    weekOrd = 0,
    lastWeekRev = 0,
    monthRev = 0,
    monthOrd = 0,
    lastMonthRev = 0;
  const spark = new Array(7).fill(0) as number[];

  for (const r of live) {
    const t = r.completedAt;
    if (t >= startOfToday) {
      todayRev += r.total;
      todayOrd += 1;
    }
    if (t >= startOfWeek) {
      weekRev += r.total;
      weekOrd += 1;
      const dayIndex = Math.min(
        6,
        Math.max(0, Math.floor((t - startOfWeek) / DAY_MS)),
      );
      spark[dayIndex] += r.total;
    } else if (t >= startOfLastWeek && t < startOfWeek) {
      lastWeekRev += r.total;
    }
    if (t >= startOfMonth) {
      monthRev += r.total;
      monthOrd += 1;
    } else if (t >= startOfLastMonth && t < startOfMonth) {
      lastMonthRev += r.total;
    }
  }

  const weekDelta =
    lastWeekRev > 0 ? ((weekRev - lastWeekRev) / lastWeekRev) * 100 : 0;
  const monthDelta =
    lastMonthRev > 0
      ? ((monthRev - lastMonthRev) / lastMonthRev) * 100
      : 0;

  return {
    today: { revenue: todayRev, orders: todayOrd, spark },
    week: { revenue: weekRev, orders: weekOrd, deltaPct: weekDelta },
    month: { revenue: monthRev, orders: monthOrd, deltaPct: monthDelta },
  };
}

/** Revenue split by order channel (take-away / dine-in / glovo /
 *  done). Used by the channel-mix donut. */
export type ChannelMix = Array<{
  channel: string;
  revenue: number;
  pct: number;
}>;

export function selectChannelMix(receipts: CompletedReceipt[]): ChannelMix {
  const byChannel = new Map<string, number>();
  let total = 0;
  for (const r of receipts) {
    if (r.status === "voided" || r.status === "refunded") continue;
    const cur = byChannel.get(r.orderType) ?? 0;
    byChannel.set(r.orderType, cur + r.total);
    total += r.total;
  }
  return Array.from(byChannel.entries())
    .map(([channel, revenue]) => ({
      channel,
      revenue,
      pct: total > 0 ? (revenue / total) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Revenue split by product CATEGORY (resolved via the merged
 *  catalog so manager-renamed categories propagate). Used by the
 *  category-mix horizontal stacked bar. */
export type CategoryMix = Array<{
  categoryId: string;
  categoryName: string;
  revenue: number;
  pct: number;
}>;

export function selectCategoryMix(
  state: ReturnType<typeof useDemoStore.getState>,
): CategoryMix {
  const activity = state.activity;
  if (!activity) return [];
  const receipts = state.receipts.filter(
    (r) =>
      r.activity === activity &&
      r.status !== "voided" &&
      r.status !== "refunded",
  );
  const products = selectActivityProducts(state, activity);
  const productCategoryByName = new Map<string, string>();
  for (const p of products) {
    productCategoryByName.set(p.name, p.categoryId);
  }
  const categories = ACTIVITIES[activity].categories;
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const byCategory = new Map<string, number>();
  let total = 0;
  for (const r of receipts) {
    for (const line of r.lines) {
      const catId =
        productCategoryByName.get(line.name) ?? "uncategorized";
      const cur = byCategory.get(catId) ?? 0;
      byCategory.set(catId, cur + line.subtotal);
      total += line.subtotal;
    }
  }
  return Array.from(byCategory.entries())
    .map(([categoryId, revenue]) => ({
      categoryId,
      categoryName: categoryNameById.get(categoryId) ?? "Other",
      revenue,
      pct: total > 0 ? (revenue / total) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Customer intelligence — repeat rate (% orders from returning
 *  customers among orders that have an attributed customer), top
 *  customers leaderboard, loyalty tier distribution. */
export type CustomerIntelligence = {
  totalCustomers: number;
  attributedOrders: number;
  attributedShare: number; // % of orders with a customer attached
  repeatRate: number; // % of attributed orders from returning customers
  topCustomers: Array<{
    id: string;
    name: string;
    tier: string;
    points: number;
    spend: number;
    orders: number;
  }>;
  tierCounts: Record<string, number>;
};

export function selectCustomerIntelligence(
  state: ReturnType<typeof useDemoStore.getState>,
): CustomerIntelligence {
  const activity = state.activity;
  if (!activity) {
    return {
      totalCustomers: 0,
      attributedOrders: 0,
      attributedShare: 0,
      repeatRate: 0,
      topCustomers: [],
      tierCounts: {},
    };
  }
  const customers = state.customers[activity] ?? [];
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const liveReceipts = state.receipts.filter(
    (r) =>
      r.activity === activity &&
      r.status !== "voided" &&
      r.status !== "refunded",
  );

  const spendByCust = new Map<string, { spend: number; orders: number }>();
  let attributedOrders = 0;
  for (const r of liveReceipts) {
    if (!r.customerId) continue;
    attributedOrders += 1;
    const cur = spendByCust.get(r.customerId) ?? { spend: 0, orders: 0 };
    cur.spend += r.total;
    cur.orders += 1;
    spendByCust.set(r.customerId, cur);
  }

  const repeatCount = Array.from(spendByCust.values()).reduce(
    (s, v) => s + (v.orders > 1 ? v.orders : 0),
    0,
  );
  const repeatRate =
    attributedOrders > 0 ? (repeatCount / attributedOrders) * 100 : 0;

  const topCustomers = Array.from(spendByCust.entries())
    .map(([id, v]) => {
      const cust = customerById.get(id);
      return {
        id,
        name: cust?.name ?? "Unknown",
        tier: cust?.tier ?? "bronze",
        points: cust?.loyaltyPoints ?? 0,
        spend: v.spend,
        orders: v.orders,
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const tierCounts: Record<string, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  };
  for (const c of customers) tierCounts[c.tier] = (tierCounts[c.tier] ?? 0) + 1;

  return {
    totalCustomers: customers.length,
    attributedOrders,
    attributedShare:
      liveReceipts.length > 0
        ? (attributedOrders / liveReceipts.length) * 100
        : 0,
    repeatRate,
    topCustomers,
    tierCounts,
  };
}

/** Staff performance — orders + revenue + average ticket + 7-day
 *  spark per staff member, sorted by revenue desc. */
export type StaffPerformance = Array<{
  id: string;
  name: string;
  initials: string;
  role: string;
  ordersToday: number;
  revenueToday: number;
  avgTicket: number;
  spark7d: number[];
}>;

export function selectStaffPerformance(
  state: ReturnType<typeof useDemoStore.getState>,
  now: number,
): StaffPerformance {
  const activity = state.activity;
  if (!activity) return [];
  const roster = state.staff[activity] ?? [];
  const startOfToday = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const startOfWeek = startOfToday - 6 * DAY_MS;
  const live = state.receipts.filter(
    (r) =>
      r.activity === activity &&
      r.status !== "voided" &&
      r.status !== "refunded",
  );

  return roster
    .map((s) => {
      let ordersToday = 0;
      let revenueToday = 0;
      const spark7d = new Array(7).fill(0) as number[];
      for (const r of live) {
        if (r.staffId !== s.id) continue;
        if (r.completedAt >= startOfToday) {
          ordersToday += 1;
          revenueToday += r.total;
        }
        if (r.completedAt >= startOfWeek) {
          const dayIndex = Math.min(
            6,
            Math.max(0, Math.floor((r.completedAt - startOfWeek) / DAY_MS)),
          );
          spark7d[dayIndex] += r.total;
        }
      }
      return {
        id: s.id,
        name: s.name,
        initials: s.initials,
        role: s.role,
        ordersToday,
        revenueToday,
        avgTicket: ordersToday > 0 ? revenueToday / ordersToday : 0,
        spark7d,
      };
    })
    .sort((a, b) => b.revenueToday - a.revenueToday);
}

/** Inventory health — totals + buckets across the activity's
 *  tracked stock. Drives the upgraded inventory card. */
export type InventoryHealth = {
  totalSkus: number;
  healthyCount: number;
  lowCount: number;
  outCount: number;
  totalValue: number; // sum(qty × cost) when cost set; fallback to qty × price
  mostRotated: Array<{ name: string; qty: number }>;
};

export function selectInventoryHealth(
  state: ReturnType<typeof useDemoStore.getState>,
): InventoryHealth {
  const activity = state.activity;
  if (!activity) {
    return {
      totalSkus: 0,
      healthyCount: 0,
      lowCount: 0,
      outCount: 0,
      totalValue: 0,
      mostRotated: [],
    };
  }
  const stock = state.stock[activity] ?? {};
  const thresholds = state.stockThresholds[activity] ?? {};
  const products = selectActivityProducts(state, activity);
  const productById = new Map(products.map((p) => [p.id, p]));

  let healthyCount = 0,
    lowCount = 0,
    outCount = 0,
    totalValue = 0;
  for (const [id, qty] of Object.entries(stock)) {
    const t = thresholds[id] ?? 5;
    if (qty <= 0) outCount += 1;
    else if (qty <= t) lowCount += 1;
    else healthyCount += 1;
    const product = productById.get(id);
    if (product) {
      const unit = product.cost ?? product.price ?? 0;
      totalValue += qty * unit;
    }
  }

  // Most-rotated — sum absolute sale deltas per product across the
  // last 7 days of movements, top 3.
  const sevenDaysAgo = Date.now() - 7 * DAY_MS;
  const turnoverByProduct = new Map<string, number>();
  for (const mv of state.stockMovements) {
    if (mv.activity !== activity) continue;
    if (mv.at < sevenDaysAgo) continue;
    if (mv.kind !== "sale") continue;
    const cur = turnoverByProduct.get(mv.productId) ?? 0;
    turnoverByProduct.set(mv.productId, cur + Math.abs(mv.delta));
  }
  const mostRotated = Array.from(turnoverByProduct.entries())
    .map(([id, qty]) => ({
      name: productById.get(id)?.name ?? id,
      qty,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  return {
    totalSkus: Object.keys(stock).length,
    healthyCount,
    lowCount,
    outCount,
    totalValue,
    mostRotated,
  };
}
