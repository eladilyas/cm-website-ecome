// Seed bundle resolver.
//
// One bundle per activity, materialized on first selectActivity() call
// for that activity. The store's `seedActivityData` action is
// idempotent — calling twice is a no-op (gated by the persisted
// `seeded` map).
//
// Bundle composition:
//   • customers — 15-30 with realistic loyalty distribution
//   • suppliers — 3-8 plausible Moroccan trade names with category map
//   • staff — 3-6 with role mix appropriate to the activity
//   • stock — per-product on-hand quantities, sparse map
//
// Phase 1.2 layers a `backfillReceipts` slice on top so the Dashboard
// shows live numbers on the very first open.

import type { ActivityKey, Customer, Staff, Supplier } from "../types";
import { generateBackfillReceipts } from "./backfill";
import { CAFE_BUNDLE } from "./cafe";
import { FAST_FOOD_BUNDLE } from "./fast-food";
import { DINE_IN_BUNDLE } from "./dine-in";
import { MARKET_BUNDLE } from "./market";
import { BAKERY_BUNDLE } from "./bakery";
import { BEAUTY_BUNDLE } from "./beauty";
import { BARBER_BUNDLE } from "./barber";
import type { CompletedReceipt } from "@/lib/demoStore";

export type SeedBundle = {
  customers: Customer[];
  suppliers: Supplier[];
  staff: Staff[];
  stock: Record<string, number>;
  /** Phase 3 — per-product low-stock alert thresholds. Defaults
   *  applied per category in each activity's seed file. */
  stockThresholds: Record<string, number>;
  /** Phase B — pre-seeded recipes for advanced production mode.
   *  Optional; activities that don't apply skip. Keyed by finished-
   *  product id → list of component refs. */
  recipes?: Record<
    string,
    { componentId: string; qty: number }[]
  >;
};

const BUNDLES: Record<ActivityKey, SeedBundle> = {
  cafe: CAFE_BUNDLE,
  "fast-food": FAST_FOOD_BUNDLE,
  "dine-in": DINE_IN_BUNDLE,
  market: MARKET_BUNDLE,
  bakery: BAKERY_BUNDLE,
  beauty: BEAUTY_BUNDLE,
  barber: BARBER_BUNDLE,
};

/** Get the full seed package for an activity — entities + backfilled
 *  receipts. The receipts use the customers from the same bundle so
 *  loyalty / customer-tied reports have a real population. */
export function getSeedBundle(key: ActivityKey): SeedBundle & {
  backfillReceipts: CompletedReceipt[];
} {
  const bundle = BUNDLES[key];
  const backfillReceipts = generateBackfillReceipts(key, bundle);
  return { ...bundle, backfillReceipts };
}
