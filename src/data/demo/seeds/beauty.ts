// Beauty salon seed bundle — services + retail shelf.
//
// Owner + 1 cashier + 3 stylists. Stylists each have commission.
// Service products carry no stock (they're time); retail items do.
// Service-eligibility is left empty here — Phase 4 will let the owner
// assign which stylists do which services.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "beauty" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    // Services have a duration → no inventory.
    if (p.durationMin != null) continue;
    // Retail shelf — small SKU counts.
    stock[p.id] = 12;
  }
  return stock;
}

export const BEAUTY_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 26),
  suppliers: [
    makeSupplier(KEY, 0, "Beauté Atlas", ["retail"], 4),
    makeSupplier(KEY, 1, "Hair Pro Maroc", ["retail", "hair"], 5),
    makeSupplier(KEY, 2, "Nail Studio Wholesale", ["retail", "nails"], 6),
    makeSupplier(KEY, 3, "Spa Essentials Casa", ["spa"], 7),
  ],
  staff: generateStaff(KEY, [
    "owner",
    "cashier",
    "stylist",
    "stylist",
    "stylist",
  ]),
  stock: defaultStock(),
  // Retail-only shelf — small counts, alert at low single digits.
  stockThresholds: defaultThresholds(defaultStock(), { min: 3, max: 6 }),
};
