// Centralized activity capability schema (V2 foundation).
//
// V1 had branching logic scattered across files: `KITCHEN_ACTIVITY_KEYS`
// + `CALENDAR_ACTIVITY_KEYS` arrays in demoStore, `kpiLabels()` switch in
// DashboardView, hardcoded payment-method list in PaymentSheet,
// inline ticket-label formatter in two store actions, etc. Every new
// per-activity rule (tax rate, modifiers, inventory, staff) would have
// added another scattered branch.
//
// V2 declares each activity's capabilities in ONE table here. Components
// query the table (or thin shim helpers) instead of branching on the
// activity key. Phase 2+ features add fields to the table; consumers
// inherit the new behavior without touching activity-specific code.
//
// The shim helpers `activityHasKitchen` / `activityHasCalendar` stay
// exported from demoStore for back-compat — they now read from this
// table internally so there's a single source of truth.

import type {
  ActiveOrder,
  ActivityKey,
  OrderType,
  PaymentMethod,
} from "./types";

/** What the 4th Dashboard KPI tile shows for this activity. */
export type FourthKpi = "kitchen" | "calendar" | "items" | "inventory";

export type ActivityCapabilities = {
  // ── Capability gates (Phase 0–3) ────────────────────────────────
  hasKitchen: boolean;
  hasCalendar: boolean;
  /** Phase 3 — show Inventory tab. */
  hasInventory: boolean;
  /** Beauty / Barber — service-led with appointment-bound staff. */
  hasServices: boolean;
  /** Phase 4 — customer ledger surface. */
  hasCustomers: boolean;
  /** Phase B+ — surfaces the Bill of Materials sidebar section + the
   *  Stock/Production toggle inside Inventory. True for food kitchens
   *  (café, fast food, restaurant, bakery) where finished goods are
   *  assembled from raw materials; false for pure-retail (market) and
   *  pure-service (beauty, barber) verticals where every SKU is sold
   *  as-is. The data-driven gate inside BackofficeInventory then
   *  further suppresses the Production toggle when the activity has
   *  zero recipes seeded — so a kitchen activity with hasRecipes=true
   *  but an empty recipe table still gets the BOM section (where the
   *  manager can ADD recipes) without an empty Production card. */
  hasRecipes: boolean;

  // ── Order entry ─────────────────────────────────────────────────
  enabledOrderTypes: OrderType[];
  /** PaymentSheet renders only methods in this list. Use to hide
   *  delivery methods (Glovo/Done/Yassir) for activities that don't
   *  do delivery — bakery, beauty, barber. */
  enabledPaymentMethods: PaymentMethod[];

  // ── Tax (Phase 2 surfaces on receipts) ──────────────────────────
  /** Activity-default tax rate (0–1). Per-product overrides via
   *  DemoProduct.taxRate take precedence. Morocco VAT defaults:
   *  10% restaurant/café, 7% basic food (bread/dairy), 20% beauty/
   *  retail. */
  taxRate: number;
  /** Whether the displayed product price already includes tax
   *  ("inclusive") or tax is added at checkout ("exclusive"). */
  taxMode: "inclusive" | "exclusive";

  // ── Currency (kept MAD for V2; field reserves Phase 5) ──────────
  currency: "MAD";

  // ── Dashboard KPI labels (replaces kpiLabels() switch) ──────────
  kpi: {
    /** Word for "transactions" — "Orders" | "Covers" | "Transactions"
     *  | "Appointments" | "Items sold". */
    orders: string;
    /** Word for "average ticket value" — "Avg ticket" | "Avg check"
     *  | "Avg basket". */
    avg: string;
    /** What goes in the 4th KPI tile. */
    fourth: FourthKpi;
  };

  /** Builds the label that appears on a kitchen ticket header
   *  ("Table 5", "Take Away", "Glovo · #42"). Centralized so the
   *  two store actions that create tickets stop duplicating the
   *  formatting logic. */
  ticketLabel: (order: ActiveOrder) => string;
};

// ── Per-activity definitions ─────────────────────────────────────────

/** Standard in-store methods — every till accepts these. */
const IN_STORE_METHODS: PaymentMethod[] = ["cash", "tpe-mobile", "cmi"];

/** Methods for activities that route orders through delivery
 *  partners (Glovo, Done, Yassir). */
const DELIVERY_METHODS: PaymentMethod[] = ["glovo", "done", "yassir"];

/** Card-not-present / e-com methods. */
const ONLINE_METHODS: PaymentMethod[] = [
  "online",
  "cash-on-delivery",
  "card-on-delivery",
];

/** Default ticket-label formatter — used by activities without a
 *  more specific format. */
const defaultTicketLabel = (order: ActiveOrder): string => {
  if (order.identifier) return `Table ${order.identifier}`;
  switch (order.type) {
    case "take-away":
      return "Take Away";
    case "dine-in":
      return "Dine In";
    case "glovo":
      return "Glovo";
    case "done":
      return "Done";
    default:
      return "Order";
  }
};

export const ACTIVITY_CAPS: Record<ActivityKey, ActivityCapabilities> = {
  cafe: {
    hasKitchen: true,
    hasCalendar: false,
    hasInventory: true,
    hasServices: false,
    hasCustomers: true,
    hasRecipes: true,
    enabledOrderTypes: ["take-away", "dine-in"],
    enabledPaymentMethods: [...IN_STORE_METHODS, "online"],
    taxRate: 0.1,
    taxMode: "inclusive",
    currency: "MAD",
    kpi: { orders: "Orders", avg: "Avg ticket", fourth: "kitchen" },
    ticketLabel: defaultTicketLabel,
  },
  "fast-food": {
    hasKitchen: true,
    hasCalendar: false,
    hasInventory: true,
    hasServices: false,
    hasCustomers: true,
    hasRecipes: true,
    enabledOrderTypes: ["take-away", "glovo", "done", "dine-in"],
    enabledPaymentMethods: [
      ...IN_STORE_METHODS,
      ...DELIVERY_METHODS,
      ...ONLINE_METHODS,
    ],
    taxRate: 0.1,
    taxMode: "inclusive",
    currency: "MAD",
    kpi: { orders: "Orders", avg: "Avg ticket", fourth: "kitchen" },
    ticketLabel: defaultTicketLabel,
  },
  "dine-in": {
    hasKitchen: true,
    hasCalendar: false,
    hasInventory: true,
    hasServices: false,
    hasCustomers: true,
    hasRecipes: true,
    enabledOrderTypes: ["dine-in", "take-away"],
    enabledPaymentMethods: [...IN_STORE_METHODS, "online"],
    taxRate: 0.1,
    taxMode: "inclusive",
    currency: "MAD",
    kpi: { orders: "Covers", avg: "Avg check", fourth: "kitchen" },
    ticketLabel: defaultTicketLabel,
  },
  market: {
    hasKitchen: false,
    hasCalendar: false,
    hasInventory: true,
    hasServices: false,
    hasCustomers: true,
    hasRecipes: false,
    enabledOrderTypes: ["take-away"],
    enabledPaymentMethods: [...IN_STORE_METHODS],
    taxRate: 0.1, // Mixed basket: groceries 7%, household 20% — averaged
    taxMode: "inclusive",
    currency: "MAD",
    // Phase 3A: retail manager cares about stock health more than
    // raw items-sold (already implied by the Sales tile).
    kpi: { orders: "Transactions", avg: "Avg basket", fourth: "inventory" },
    ticketLabel: defaultTicketLabel,
  },
  bakery: {
    hasKitchen: false, // No back-of-house kitchen wait; counter pickup
    hasCalendar: false,
    hasInventory: true,
    hasServices: false,
    hasCustomers: true,
    hasRecipes: true, // Viennoiseries share a dough base
    enabledOrderTypes: ["take-away"],
    enabledPaymentMethods: ["cash", "cmi", "tpe-mobile"],
    taxRate: 0.07, // Basic food / bread
    taxMode: "inclusive",
    currency: "MAD",
    // Phase 3A: morning bake-off → afternoon sellout makes stock the
    // most actionable signal here.
    kpi: { orders: "Items sold", avg: "Avg basket", fourth: "inventory" },
    ticketLabel: defaultTicketLabel,
  },
  beauty: {
    hasKitchen: false,
    hasCalendar: true,
    hasInventory: true, // Retail shelf
    hasServices: true,
    hasCustomers: true,
    hasRecipes: false,
    enabledOrderTypes: ["take-away"],
    enabledPaymentMethods: [...IN_STORE_METHODS, "online", "gift-card"],
    taxRate: 0.2,
    taxMode: "inclusive",
    currency: "MAD",
    kpi: { orders: "Appointments", avg: "Avg ticket", fourth: "calendar" },
    ticketLabel: defaultTicketLabel,
  },
  barber: {
    hasKitchen: false,
    hasCalendar: true,
    hasInventory: true, // Retail shelf
    hasServices: true,
    hasCustomers: true,
    hasRecipes: false,
    enabledOrderTypes: ["take-away"],
    enabledPaymentMethods: [...IN_STORE_METHODS, "gift-card"],
    taxRate: 0.2,
    taxMode: "inclusive",
    currency: "MAD",
    kpi: { orders: "Appointments", avg: "Avg ticket", fourth: "calendar" },
    ticketLabel: defaultTicketLabel,
  },
};

/** Cheap, nullable lookup — used everywhere capability-aware code
 *  needs to react to the currently-selected activity (which may be
 *  null during onboarding). */
export function capsFor(
  key: ActivityKey | null,
): ActivityCapabilities | null {
  return key ? ACTIVITY_CAPS[key] : null;
}

/** Convenience predicate sets — derived from the capability table so
 *  there's still a single source of truth. demoStore re-exports the
 *  shim helpers (activityHasKitchen, activityHasCalendar) that build
 *  on these. */
export const KITCHEN_KEYS: ActivityKey[] = (
  Object.keys(ACTIVITY_CAPS) as ActivityKey[]
).filter((k) => ACTIVITY_CAPS[k].hasKitchen);

export const CALENDAR_KEYS: ActivityKey[] = (
  Object.keys(ACTIVITY_CAPS) as ActivityKey[]
).filter((k) => ACTIVITY_CAPS[k].hasCalendar);
