// Coupon presets — activity-aware promo codes surfaced inside the order-
// discount sheet on the POS simulator. Common codes apply to every
// activity; the per-activity buckets add seasonal / contextual codes
// (lunch promos for fast-food, walk-in promos for barber, etc.).
//
// Pure data — UI components import `couponsFor(activity)` to render the
// chip list without owning the catalogue. Centralising this here keeps
// the component focused on presentation and means future activities can
// add coupons by editing data, not JSX.

import type { ActivityKey, OrderDiscount } from "./types";

export type Coupon = {
  /** Code as it appears on the chip + applied label on the receipt. */
  code: string;
  /** Short human description ("10% off first order"). */
  description: string;
  /** Concrete discount applied when the chip is tapped. */
  discount: OrderDiscount;
};

/** Promo codes available on every activity. */
export const COMMON_COUPONS: Coupon[] = [
  {
    code: "WELCOME10",
    description: "10% off first order",
    discount: { kind: "pct", amount: 10, label: "WELCOME10" },
  },
  {
    code: "VIP15",
    description: "15% VIP",
    discount: { kind: "pct", amount: 15, label: "VIP15" },
  },
  {
    code: "RAMADAN20",
    description: "20% Ramadan special",
    discount: { kind: "pct", amount: 20, label: "RAMADAN20" },
  },
];

/** Activity-specific promo codes layered on top of COMMON_COUPONS. */
export const ACTIVITY_COUPONS: Partial<Record<ActivityKey, Coupon[]>> = {
  cafe: [
    {
      code: "MORNING5",
      description: "5 MAD off before 10am",
      discount: { kind: "fixed", amount: 5, label: "MORNING5" },
    },
  ],
  "fast-food": [
    {
      code: "LUNCH20",
      description: "20% lunch combo",
      discount: { kind: "pct", amount: 20, label: "LUNCH20" },
    },
    {
      code: "STUDENT15",
      description: "Student 15%",
      discount: { kind: "pct", amount: 15, label: "STUDENT15" },
    },
  ],
  "dine-in": [
    {
      code: "SOMMELIER",
      description: "10% wine pairings",
      discount: { kind: "pct", amount: 10, label: "SOMMELIER" },
    },
  ],
  beauty: [
    {
      code: "FIRST20",
      description: "20% first visit",
      discount: { kind: "pct", amount: 20, label: "FIRST20" },
    },
  ],
  barber: [
    {
      code: "WALK10",
      description: "10% walk-in",
      discount: { kind: "pct", amount: 10, label: "WALK10" },
    },
  ],
};

/** Resolve the full coupon list for an activity — common + bespoke. */
export function couponsFor(activity: ActivityKey | null): Coupon[] {
  if (!activity) return COMMON_COUPONS;
  return [...COMMON_COUPONS, ...(ACTIVITY_COUPONS[activity] ?? [])];
}
