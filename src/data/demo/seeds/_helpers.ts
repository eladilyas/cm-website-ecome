// Shared helpers for the per-activity seed bundles.
//
// The seeds populate Phase 1+ entities (customers, suppliers, staff,
// stock) so every business template feels lived-in from the first open.
// Names lean Moroccan / Casa-Rabat business reality.
//
// Determinism: every seeded receipt + appointment uses `mulberry32`
// keyed on a string hash. Same browser, same activity → same backfill.
// This matters because the receipt backfill in Phase 1.2 generates
// many records; without determinism the Dashboard would shift on
// every reload.

import type { Customer, LoyaltyTier, Staff, StaffRole, Supplier } from "../types";

// ── Deterministic RNG ────────────────────────────────────────────────

/** mulberry32 — small, fast, deterministic PRNG. Seed any string. */
export function rngFor(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive int in [min, max]. */
export function rint(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Weighted pick — items[] with corresponding weights[]. */
export function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Name pools (mixed Arabic / Berber / French — Casa / Rabat feel) ──

const MEN = [
  "Omar", "Karim", "Hassan", "Youssef", "Mehdi", "Anas", "Amine",
  "Hicham", "Ali", "Said", "Reda", "Khalid", "Tarik", "Yassine",
  "Adil", "Bilal", "Marouane", "Ismail", "Zakaria", "Soufiane",
];
const WOMEN = [
  "Sarah", "Layla", "Yasmine", "Nadia", "Khadija", "Fatima",
  "Salma", "Aicha", "Imane", "Houda", "Meriem", "Asmaa",
  "Soukaina", "Hanane", "Loubna", "Sanae", "Najat", "Rim", "Dounia",
];
const LAST_INITIALS = ["K.", "B.", "M.", "E.", "S.", "F.", "A.", "R.", "T.", "L.", "C.", "Z."];

const FAMILY_NAMES = [
  "Benali", "Cherkaoui", "Tazi", "El Maghraby", "Lahlou", "Filali",
  "Bennani", "Idrissi", "Alami", "Fassi", "Saidi", "Belkhayat",
];

/** Customer name in the realistic "Sarah K." form used across the demo. */
export function customerName(rng: () => number): string {
  const useWoman = rng() < 0.5;
  const first = (useWoman ? WOMEN : MEN)[rint(rng, 0, (useWoman ? WOMEN : MEN).length - 1)];
  const last = LAST_INITIALS[rint(rng, 0, LAST_INITIALS.length - 1)];
  return `${first} ${last}`;
}

/** Staff full name (single + family). Cashiers use first + initial. */
export function staffName(rng: () => number, role: StaffRole): string {
  const useWoman = rng() < 0.5;
  const first = (useWoman ? WOMEN : MEN)[rint(rng, 0, (useWoman ? WOMEN : MEN).length - 1)];
  if (role === "owner" || role === "manager") {
    return `${first} ${FAMILY_NAMES[rint(rng, 0, FAMILY_NAMES.length - 1)]}`;
  }
  return `${first} ${LAST_INITIALS[rint(rng, 0, LAST_INITIALS.length - 1)]}`;
}

/** Moroccan mobile-format phone (+212 6XX XXX XXX). */
export function phone(rng: () => number): string {
  const a = rint(rng, 100, 999);
  const b = rint(rng, 100, 999);
  const c = rint(rng, 1000, 9999).toString().slice(0, 3);
  return `+212 6${a.toString()[0]} ${a.toString().slice(1)}${b.toString()[0]} ${b.toString().slice(1)}${c}`;
}

// ── Customer factory ─────────────────────────────────────────────────

/** Tier distribution: most customers casual, a slice loyal. */
function pickTier(rng: () => number): LoyaltyTier {
  return pickWeighted<LoyaltyTier>(
    rng,
    ["bronze", "silver", "gold", "platinum"],
    [40, 35, 18, 7],
  );
}

const TIER_POINT_RANGE: Record<LoyaltyTier, [number, number]> = {
  bronze: [0, 150],
  silver: [150, 600],
  gold: [600, 1800],
  platinum: [1800, 5000],
};

export function generateCustomers(activityKey: string, count: number): Customer[] {
  const rng = rngFor(`cust:${activityKey}`);
  const now = Date.now();
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  return Array.from({ length: count }, (_, i) => {
    const tier = pickTier(rng);
    const [lo, hi] = TIER_POINT_RANGE[tier];
    return {
      id: `cust_${activityKey}_${i}`,
      name: customerName(rng),
      phone: rng() < 0.7 ? phone(rng) : undefined,
      email: rng() < 0.4 ? `customer${i}@example.com` : undefined,
      loyaltyPoints: rint(rng, lo, hi),
      tier,
      firstSeenAt: now - rint(rng, 0, sixMonths),
      tags:
        tier === "platinum"
          ? ["vip"]
          : tier === "gold"
            ? ["regular"]
            : undefined,
    };
  });
}

// ── Staff factory ────────────────────────────────────────────────────

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

export function generateStaff(
  activityKey: string,
  roles: StaffRole[],
): Staff[] {
  const rng = rngFor(`staff:${activityKey}`);
  return roles.map((role, i) => {
    const name = staffName(rng, role);
    return {
      id: `staff_${activityKey}_${i}`,
      name,
      role,
      initials: initialsFor(name),
      hourlyRate:
        role === "owner" || role === "manager"
          ? rint(rng, 80, 140)
          : role === "kitchen"
            ? rint(rng, 40, 70)
            : rint(rng, 35, 60),
      commissionPct: role === "stylist" || role === "barber" ? 30 : undefined,
    };
  });
}

// ── Supplier factory ─────────────────────────────────────────────────

// ── SKU + barcode generators (Phase 3) ────────────────────────────────
// Deterministic, human-readable codes. Used by Backoffice product
// forms to auto-suggest values for new products; the cashier can
// override before saving.

/** "CFO-ESP" for { categoryId: "coffee", name: "Espresso" }. Strips
 *  diacritics, uppercases, keeps the first 3 letters of each token. */
export function genSku(categoryId: string, name: string): string {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
  const cat = norm(categoryId).slice(0, 3);
  const nameTokens = norm(name).split(/\s+/).filter(Boolean);
  const namePart =
    nameTokens.length === 1
      ? nameTokens[0].slice(0, 3)
      : nameTokens.map((t) => t[0]).join("").slice(0, 4);
  return `${cat}-${namePart || "XX"}`;
}

/** EAN-13-shaped fake (not check-digit valid, but visually correct).
 *  13 digits, leading "60" (Morocco country prefix). Deterministic
 *  from the productId so the same SKU always gets the same barcode. */
export function genBarcode(productId: string): string {
  let h = 5381;
  for (let i = 0; i < productId.length; i++) {
    h = ((h * 33) ^ productId.charCodeAt(i)) >>> 0;
  }
  const body = h.toString().padStart(11, "0").slice(0, 11);
  return `60${body}`;
}

// ── Threshold helper (Phase 3) ────────────────────────────────────────
// Most activities follow the same shape: "alert when on-hand falls
// below ~30% of the opening stock, with a category-aware floor".
// This builds the thresholds map mechanically from the stock map so
// each seed file stays concise.

export function defaultThresholds(
  stock: Record<string, number>,
  options?: { fraction?: number; min?: number; max?: number },
): Record<string, number> {
  const fraction = options?.fraction ?? 0.3;
  const min = options?.min ?? 3;
  const max = options?.max ?? 25;
  const out: Record<string, number> = {};
  for (const [id, qty] of Object.entries(stock)) {
    if (qty <= 0) continue; // services / unstocked items
    const raw = Math.round(qty * fraction);
    out[id] = Math.min(max, Math.max(min, raw));
  }
  return out;
}

export function makeSupplier(
  activityKey: string,
  idx: number,
  name: string,
  categoryIds?: string[],
  leadDays = 3,
): Supplier {
  return {
    id: `sup_${activityKey}_${idx}`,
    name,
    contactName: undefined,
    phone: undefined,
    categoryIds,
    leadDays,
  };
}
