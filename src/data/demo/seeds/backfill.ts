// Receipt backfill — 7 days of believable history per activity.
//
// Why this exists: the Dashboard's value to a prospect is "look at all
// the things this POS already tracks". If they open it and see an empty
// chart, the perception is broken. Backfilling ~50-150 receipts on the
// first selectActivity per activity makes the Dashboard alive
// immediately, with realistic hourly curves, top-items leaderboards,
// and payment mixes.
//
// Determinism: every receipt id and content is seeded by rngFor(`backfill:${activity}`).
// Same browser → same backfill, even across reloads. The wall-clock
// anchor (today/now) IS allowed to shift, so the receipts age into
// "yesterday", "last week" etc. as real time moves — exactly like a
// real business ledger.
//
// Business-shape modeling:
//   • Volume varies by activity (market ~45/day, salon ~12/day)
//   • Weekend boost (Fri/Sat +40%) for hospitality + retail
//   • Mondays quieter for services (people don't get haircuts on Mondays)
//   • Hour distribution per activity (cafés peak 7-10am, restaurants 12-14
//     and 19-22, market 18-20 evening rush)
//   • Basket size skewed small (most orders 1-3 items)
//   • Payment method mix: cash dominant, card secondary, delivery rare

import type { ActivityKey, Payment } from "../types";
import { ACTIVITIES } from "../activities";
import { ACTIVITY_CAPS } from "../activityCapabilities";
import { pickWeighted, rint, rngFor } from "./_helpers";
import type { CompletedReceipt, ReceiptStatus } from "@/lib/demoStore";
import type { SeedBundle } from "./index";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

export function generateBackfillReceipts(
  activity: ActivityKey,
  bundle: SeedBundle,
): CompletedReceipt[] {
  const rng = rngFor(`backfill:${activity}`);
  const cat = ACTIVITIES[activity];
  const caps = ACTIVITY_CAPS[activity];
  const now = Date.now();
  const today = startOfDay(now);

  // For non-service activities, sell only physical products (skip the
  // accidental wizard-only combo). For service activities (beauty,
  // barber), services ARE the product and dominate revenue.
  const sellable = cat.products.filter((p) => !p.comboSteps);
  if (sellable.length === 0) return [];

  const customers = bundle.customers;
  const enabledMethods = caps.enabledPaymentMethods.length
    ? caps.enabledPaymentMethods
    : (["cash"] as const);

  const receipts: CompletedReceipt[] = [];

  // 7 days of history, ending yesterday (today's numbers come from live
  // ringing). For older days, generate a believable daily volume.
  for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
    const dayStart = today - dayOffset * DAY_MS;
    const dayOfWeek = new Date(dayStart).getDay(); // 0=Sun ... 6=Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;

    const baseVolume = baseVolumeFor(activity);
    const weekendBoost = isWeekend && !caps.hasServices ? 1.4 : 1;
    const mondayDip = isMonday && caps.hasServices ? 0.55 : 1;
    const jitter = 0.8 + rng() * 0.4;
    const dailyCount = Math.max(
      4,
      Math.floor(baseVolume * weekendBoost * mondayDip * jitter),
    );

    for (let i = 0; i < dailyCount; i++) {
      const completedAt = sampleTimestamp(rng, dayStart, activity);
      const lines = sampleBasket(rng, sellable);
      if (lines.length === 0) continue;

      const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
      const total = subtotal;
      const taxTotal =
        caps.taxMode === "inclusive"
          ? +(total - total / (1 + caps.taxRate)).toFixed(2)
          : +(total * caps.taxRate).toFixed(2);

      const method = pickWeighted(
        rng,
        [...enabledMethods],
        enabledMethods.map(paymentMethodWeight),
      );
      const isCash = method === "cash";
      // Realistic till: cash customers round up to next 10/20/50
      const tendered = isCash
        ? roundUpForCash(rng, total)
        : total;
      const change = Math.max(0, tendered - total);

      // ~40% of receipts attribute a customer (loyalty surfaces in V4).
      const customerId =
        rng() < 0.4 && customers.length > 0
          ? customers[rint(rng, 0, customers.length - 1)].id
          : undefined;

      const orderType =
        cat.enabledOrderTypes[
          rint(rng, 0, cat.enabledOrderTypes.length - 1)
        ];
      const identifier =
        orderType === "dine-in" ? String(rint(rng, 1, 24)) : null;

      const id = `rcpt_seed_${activity}_${dayOffset}_${i}`;
      const payments: Payment[] = [
        {
          id: `pay_seed_${id}`,
          method,
          amount: total,
          tendered,
          change,
          paidAt: completedAt,
        },
      ];

      receipts.push({
        id,
        activity,
        completedAt,
        orderType,
        identifier,
        lines,
        extras: [],
        subtotal,
        total,
        // Legacy single-payment field for V1-era readers.
        payment: { method, tendered, change },
        status: "paid" as ReceiptStatus,
        payments,
        taxTotal,
        customerId,
      });
    }
  }

  // Sort newest-first to match how live receipts are appended.
  return receipts.sort((a, b) => b.completedAt - a.completedAt);
}

// ── Helpers ──────────────────────────────────────────────────────────

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function baseVolumeFor(activity: ActivityKey): number {
  switch (activity) {
    case "market":    return 48;   // high foot traffic
    case "bakery":    return 38;
    case "cafe":      return 32;
    case "fast-food": return 28;
    case "dine-in":   return 18;   // table turn-over limited
    case "beauty":    return 14;   // long appointment slots
    case "barber":    return 18;
    default:          return 22;
  }
}

/** Pick a believable wall-clock for a receipt on `dayStart`, weighted
 *  by the activity's actual peak hours. */
function sampleTimestamp(
  rng: () => number,
  dayStart: number,
  activity: ActivityKey,
): number {
  const { hours, weights } = hourDistribution(activity);
  const hour = pickWeighted(rng, hours, weights);
  const minute = rint(rng, 0, 59);
  const second = rint(rng, 0, 59);
  return dayStart + hour * HOUR_MS + minute * MIN_MS + second * 1000;
}

function hourDistribution(activity: ActivityKey): {
  hours: number[];
  weights: number[];
} {
  const hours: number[] = [];
  const weights: number[] = [];
  const push = (h: number, w: number) => {
    hours.push(h);
    weights.push(w);
  };

  switch (activity) {
    case "cafe":
    case "bakery":
      for (let h = 7; h <= 19; h++) {
        if (h >= 7 && h <= 10) push(h, 9);
        else if (h >= 11 && h <= 13) push(h, 5);
        else if (h >= 16 && h <= 18) push(h, 6);
        else push(h, 2);
      }
      break;
    case "fast-food":
      for (let h = 11; h <= 23; h++) {
        if (h >= 12 && h <= 14) push(h, 10);
        else if (h >= 19 && h <= 22) push(h, 9);
        else push(h, 3);
      }
      break;
    case "dine-in":
      for (let h = 12; h <= 23; h++) {
        if (h >= 12 && h <= 14) push(h, 7);
        else if (h >= 19 && h <= 22) push(h, 10);
        else push(h, 1);
      }
      break;
    case "market":
      for (let h = 8; h <= 21; h++) {
        if (h >= 18 && h <= 20) push(h, 9);
        else if (h >= 11 && h <= 14) push(h, 6);
        else push(h, 3);
      }
      break;
    case "beauty":
    case "barber":
      for (let h = 9; h <= 19; h++) {
        if (h >= 10 && h <= 13) push(h, 6);
        else if (h >= 15 && h <= 18) push(h, 7);
        else push(h, 3);
      }
      break;
    default:
      for (let h = 8; h <= 20; h++) push(h, 5);
  }
  return { hours, weights };
}

/** Build a basket of 1-5 items skewed small. Stack qty on duplicates. */
function sampleBasket(
  rng: () => number,
  products: Array<{ id: string; name: string; price: number }>,
): Array<{ name: string; qty: number; price: number; subtotal: number }> {
  const itemCount = pickWeighted(rng, [1, 2, 3, 4, 5], [28, 36, 20, 10, 6]);
  const lines: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }> = [];
  for (let j = 0; j < itemCount; j++) {
    const p = products[rint(rng, 0, products.length - 1)];
    const existing = lines.find((l) => l.name === p.name);
    if (existing) {
      existing.qty += 1;
      existing.subtotal = existing.price * existing.qty;
      continue;
    }
    const qty = pickWeighted(rng, [1, 2, 3], [78, 18, 4]);
    lines.push({
      name: p.name,
      qty,
      price: p.price,
      subtotal: p.price * qty,
    });
  }
  return lines;
}

/** Pseudo-realistic cash payment: round up to the next 10/20/50 MAD. */
function roundUpForCash(rng: () => number, total: number): number {
  const ceiling = total <= 50 ? 10 : total <= 200 ? 20 : 50;
  const tendered = Math.ceil(total / ceiling) * ceiling;
  // Occasionally the customer hands a higher denom (50 / 100 / 200)
  // resulting in extra change. Adds realism to the change column.
  return rng() < 0.25 ? tendered + ceiling : tendered;
}

/** Payment-method probability weights — cash dominates, card secondary,
 *  delivery rare. Tuned for Moroccan small-business reality circa 2026. */
function paymentMethodWeight(method: string): number {
  switch (method) {
    case "cash":             return 12;
    case "tpe-mobile":       return 6;
    case "cmi":              return 5;
    case "online":           return 3;
    case "glovo":            return 3;
    case "done":             return 2;
    case "yassir":           return 2;
    case "card-on-delivery": return 1;
    case "cash-on-delivery": return 1;
    case "gift-card":        return 1;
    case "store-credit":     return 1;
    default:                 return 2;
  }
}
